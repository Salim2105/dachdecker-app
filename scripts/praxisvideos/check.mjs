import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import { inspectMp4 } from "./mp4.mjs";
import { praxisVideoByteBudget } from "../gen-sw.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const partial = process.argv.includes("--partial"), deep = process.argv.includes("--deep");
const load = async path => JSON.parse(await readFile(join(root, path), "utf8"));
const pkg = await load("package.json");
const requireV2 = process.argv.includes("--v016") || /^0\.(?:1[6-9]|[2-9]\d)\./.test(pkg.version);
const compiled = ts.transpileModule(await readFile(join(root, "lib/dach3dInhalte.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const authored = { exports: {} }; new Function("module", "exports", compiled)(authored, authored.exports);
const contexts = authored.exports.DACH_MODELLE.flatMap(m => m.deckungen.flatMap(deckung => m.detailIds.map(detailId => ({ id: `dach-${m.id}-${deckung}-${detailId}`, typ: "dachdetail", form: m.id, deckung, detailId }))));
for (const pfadId of ["falzziegel", "biber-doppel"]) for (const slug of ["schnitt", "bearbeiten", "verlegen", "kontrolle"]) contexts.push({ id: `werkstatt-${pfadId}-${slug}`, typ: "handgriff", pfadId, slug });
const v2Points = Object.fromEntries([["schnitt", "schritt-2", "a"], ["bearbeiten", "schritt-3", "b"], ["verlegen", "schritt-1", "a"]].map(([slug, kapitelId, suffix]) => {
  const id = `werkstatt-falzziegel-${slug}`;
  return [id, { id: `${id}-mitmachen`, kapitelId, einheitId: id, aufgabeId: `${id}-${suffix}` }];
}));
const content = await load("content/praxisvideos-inhalte.json"), manifest = await load("content/praxisvideos-medien.json"), archive = await load("content/praxisvideos-archiv.json");
const errors = [], pending = [], known = new Map(contexts.map(c => [c.id, c]));
const check = (ok, message) => { if (!ok) errors.push(message); };
const words = value => value.trim().split(/\s+/u).join(" ");
check(content.version === 1 && Array.isArray(content.videos) && content.videos.length === 112, "112 versionierte Videoinhalte erwartet.");
check(new Set(content.videos.map(v => v.id)).size === 112, "Doppelte oder fehlende Videoinhalte.");
check(manifest.version === 1 && Array.isArray(manifest.assets), "Ungültiges Video-Medienverzeichnis.");
check(archive.version === 1 && archive.videos?.length === 3 && archive.assets?.length === 9 && new Set(archive.videos.map(v => v.id)).size === 3 && archive.videos.every(v => v.version === 1 && Object.hasOwn(v2Points, v.id)), "Archiv der drei ursprünglichen Filme unvollständig.");
const activeAssets = new Map(manifest.assets.map(a => [a.id, a]));
check(activeAssets.size === manifest.assets.length, "Doppelte aktive Videomedien.");
if (!partial) check(activeAssets.size === 336, "336 aktive Video-, Untertitel- und Posterdateien erwartet.");
for (const video of content.videos) {
  check(video.version === (Object.hasOwn(v2Points, video.id) && requireV2 ? 2 : video.version), `Neue Fassung fehlt: ${video.id}`);
  for (const extension of ["mp4", "vtt", "webp"]) check(activeAssets.get(`${video.id}.${extension}`)?.url === `/praxisvideos/v${video.version}/${video.id}.${extension}` || partial && !activeAssets.has(`${video.id}.${extension}`), `Aktiver Medienverweis gehört zur falschen Fassung: ${video.id}.${extension}`);
}
const assets = new Map(), editions = new Map();
for (const asset of [...manifest.assets, ...archive.assets]) {
  const previous = assets.get(asset.url);
  if (previous) check(JSON.stringify(previous) === JSON.stringify(asset), `Widersprüchlicher Archiv-Medienverweis: ${asset.url}`);
  else assets.set(asset.url, asset);
}
for (const video of [...content.videos, ...archive.videos]) {
  const key = `${video.id}@${video.version}`, previous = editions.get(key);
  if (previous) check(JSON.stringify(previous) === JSON.stringify(video), `Widersprüchliche historische Fassung: ${key}`);
  else editions.set(key, video);
}
let ready = 0, bytes = 0, maximum = 0;
for (const video of editions.values()) {
  const context = known.get(video.id), label = `${video.id}@v${video.version}`;
  const validContext = context && (video.version === 1 || video.version === 2 && Object.hasOwn(v2Points, video.id)) && ["typ", "form", "deckung", "detailId", "pfadId", "slug"].every(k => video[k] === context[k]);
  check(validContext, `Falscher Dach-/Handgriffbezug: ${label}`);
  if (!validContext) continue;
  check(typeof video.titel === "string" && video.titel.trim() && Array.isArray(video.kapitel) && video.kapitel.length === 7, `Vollständiger Ablauf fehlt: ${label}`);
  check(typeof video.transkript === "string" && words(video.transkript) === words(video.kapitel.map(k => k.text).join(" ")), `Sprechertext und Kapitel weichen ab: ${label}`);
  let end = 0; const chapterIds = new Set();
  for (const chapter of video.kapitel) { check(typeof chapter.id === "string" && /^[a-z0-9][a-z0-9-]*$/.test(chapter.id) && !chapterIds.has(chapter.id) && Number.isFinite(chapter.start) && Number.isFinite(chapter.ende) && Math.abs(chapter.start - end) <= .001 && chapter.ende > chapter.start, `Kapitelzeit/ID ungültig: ${label}/${chapter.id}`); chapterIds.add(chapter.id); end = chapter.ende; }
  check(Number.isFinite(video.dauer) && Math.abs(end - video.dauer) <= .001, `Filmdauer und Kapitel weichen ab: ${label}`);
  if (video.version === 2) {
    const p = video.lernpunkte?.[0], expected = v2Points[video.id];
    check(video.lernpunkte?.length === 1 && p && Object.keys(p).length === 4 && Object.keys(expected).every(k => p[k] === expected[k]) && chapterIds.has(p.kapitelId), `Mitmachaufgabe falsch verknüpft: ${label}`);
  } else check(video.lernpunkte === undefined, `Alte Fassung darf keine neuen Lernpunkte erhalten: ${label}`);
  const data = {}, prefix = `/praxisvideos/v${video.version}/`;
  for (const [extension, typ] of [["mp4", "video"], ["vtt", "untertitel"], ["webp", "bild"]]) {
    const id = `${video.id}.${extension}`, url = prefix + id, asset = assets.get(url);
    try { data[extension] = await readFile(join(root, "public", url)); } catch { pending.push(url); continue; }
    if (!asset && !partial) check(false, `Medienverweis fehlt: ${url}`);
    if (asset) check(asset.id === id && asset.typ === typ && asset.bytes === data[extension].length && asset.sha256 === createHash("sha256").update(data[extension]).digest("hex"), `Metadaten/Prüfsumme weichen ab: ${url}`);
    check(data[extension].length > 0 && data[extension].length <= praxisVideoByteBudget(url), `Dateibudget ungültig: ${url}`);
  }
  if (!data.mp4 || !data.vtt || !data.webp) continue;
  ready++; bytes += data.mp4.length; maximum = Math.max(maximum, data.mp4.length);
  check(video.dauer >= (video.version === 2 ? 60 : 45) && video.dauer <= 90, `Film außerhalb der vorgesehenen Länge: ${label}`);
  try {
    const info = inspectMp4(data.mp4), picture = info.tracks.find(t => t.kind === "vide"), sound = info.tracks.find(t => t.kind === "soun");
    const [width, height, fps] = video.version === 2 ? [1920, 1080, 30] : [1280, 720, 24];
    check(info.fastStart && picture?.codec === "avc1" && picture.width === width && picture.height === height && Math.abs(picture.fps - fps) < .001, `Videoformat nicht H.264/${width}x${height}/${fps}fps/Faststart: ${label}`);
    check(sound?.codec === "mp4a" && sound.channels >= 1 && Math.abs(sound.seconds - video.dauer) < .35 && Math.abs(picture.seconds - video.dauer) < .35, `AAC-Ton/Video und Sprecherzeiten weichen ab: ${label}`);
    if (deep) { const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", join(root, "public", prefix, `${video.id}.mp4`)], { encoding: "utf8" })); check(probe.streams.some(s => s.codec_name === "aac") && probe.streams.some(s => s.codec_name === "h264" && ["yuv420p", "yuvj420p"].includes(s.pix_fmt)), `FFprobe prüft Codec nicht erfolgreich: ${label}`); }
  } catch (e) { check(false, `MP4 nicht lesbar: ${label}: ${e.message}`); }
  check(data.webp.toString("ascii", 0, 4) === "RIFF" && data.webp.toString("ascii", 8, 12) === "WEBP", `Poster ungültig: ${label}`);
  const vtt = data.vtt.toString("utf8"), cues = [];
  const seconds = value => { const m = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/.exec(value); return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000 : NaN; };
  check(vtt.startsWith("WEBVTT\n"), `Untertitelkopf fehlt: ${label}`);
  for (const block of vtt.split(/\r?\n\r?\n/u)) {
    const lines = block.split(/\r?\n/u), index = lines.findIndex(line => line.includes(" --> "));
    if (index < 0) continue;
    const [start, end] = lines[index].split(" --> ").map(seconds), text = lines.slice(index + 1).join("\n").trim(); cues.push({ start, end, text });
  }
  let cueEnd = 0;
  for (const cue of cues) { check(cue.start >= cueEnd - .001 && cue.start < cue.end && cue.end <= video.dauer + .001 && cue.text, `Untertitelzeit ungültig: ${label}`); cueEnd = cue.end; check(cue.text.split("\n").length <= 2 && cue.text.split("\n").every(line => line.length <= 42 || line.split(/\s/u).length === 1), `Untertitel zu lang: ${label}`); }
  check(cues.length > 0 && words(cues.map(c => c.text).join(" ")) === words(video.transkript), `Untertiteltext unvollständig: ${label}`);
}
for (const asset of assets.values()) check(known.has(asset.id.replace(/\.(mp4|vtt|webp)$/, "")) && asset.url.endsWith("/" + asset.id) && praxisVideoByteBudget(asset.url) > 0, `Unbekanntes Videomedium: ${asset.url}`);
if (!partial) {
  for (const version of [1, 2]) {
    const expected = [...assets.keys()].filter(url => url.startsWith(`/praxisvideos/v${version}/`));
    if (!expected.length && !requireV2) continue;
    let files = []; try { files = await readdir(join(root, `public/praxisvideos/v${version}`)); } catch { /* Missing editions are reported below. */ }
    check(files.length === expected.length && files.every(name => assets.has(`/praxisvideos/v${version}/${name}`)), `Dateiverzeichnis und freigegebene Medien weichen ab: v${version}`);
  }
  check(pending.length === 0, `${pending.length} Videomedien fehlen.`);
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`${partial ? "Produktionsstand" : "Praxisvideos geprüft"}: ${content.videos.length} aktive Kontexte, ${ready} aktive/historische Fassungen, ${pending.length} Dateien noch ausstehend. Videodaten ${(bytes / 1048576).toFixed(1)} MiB, größte Datei ${(maximum / 1048576).toFixed(2)} MiB.`);
