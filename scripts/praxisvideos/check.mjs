import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import { inspectMp4 } from "./mp4.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const partial = process.argv.includes("--partial"), deep = process.argv.includes("--deep");
const load = async path => JSON.parse(await readFile(join(root, path), "utf8"));
const compiled = ts.transpileModule(await readFile(join(root, "lib/dach3dInhalte.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const authored = { exports: {} }; new Function("module", "exports", compiled)(authored, authored.exports);
const contexts = authored.exports.DACH_MODELLE.flatMap(m => m.deckungen.flatMap(deckung => m.detailIds.map(detailId => ({ id: `dach-${m.id}-${deckung}-${detailId}`, typ: "dachdetail", form: m.id, deckung, detailId }))));
for (const pfadId of ["falzziegel", "biber-doppel"]) for (const slug of ["schnitt", "bearbeiten", "verlegen", "kontrolle"]) contexts.push({ id: `werkstatt-${pfadId}-${slug}`, typ: "handgriff", pfadId, slug });
const content = await load("content/praxisvideos-inhalte.json"), manifest = await load("content/praxisvideos-medien.json");
const errors = [], pending = [], known = new Set(contexts.map(c => c.id));
const check = (ok, message) => { if (!ok) errors.push(message); };
const words = value => value.trim().split(/\s+/u).join(" ");
check(content.version === 1 && Array.isArray(content.videos) && content.videos.length === 112, "112 versionierte Videoinhalte erwartet.");
check(new Set(content.videos.map(v => v.id)).size === 112, "Doppelte oder fehlende Videoinhalte.");
check(manifest.version === 1 && Array.isArray(manifest.assets), "Ungültiges Video-Medienverzeichnis.");
const assets = new Map(manifest.assets.map(a => [a.id, a]));
check(assets.size === manifest.assets.length, "Doppelte Videomedien.");
if (!partial) check(assets.size === 336, "336 veröffentlichte Video-, Untertitel- und Posterdateien erwartet.");
let ready = 0, bytes = 0, maximum = 0;
for (const context of contexts) {
  const video = content.videos.find(v => v.id === context.id);
  if (!video) { check(false, `Inhalt fehlt: ${context.id}`); continue; }
  check(video.version === 1 && ["typ", "form", "deckung", "detailId", "pfadId", "slug"].every(k => video[k] === context[k]), `Falscher Dach-/Handgriffbezug: ${context.id}`);
  check(typeof video.titel === "string" && video.titel.trim() && Array.isArray(video.kapitel) && video.kapitel.length === 7, `Vollständiger Ablauf fehlt: ${context.id}`);
  check(typeof video.transkript === "string" && words(video.transkript) === words(video.kapitel.map(k => k.text).join(" ")), `Sprechertext und Kapitel weichen ab: ${context.id}`);
  let end = 0;
  for (const chapter of video.kapitel) { check(Number.isFinite(chapter.start) && Number.isFinite(chapter.ende) && Math.abs(chapter.start - end) <= .001 && chapter.ende > chapter.start, `Kapitelzeit ungültig: ${context.id}/${chapter.id}`); end = chapter.ende; }
  check(Number.isFinite(video.dauer) && Math.abs(end - video.dauer) <= .001, `Filmdauer und Kapitel weichen ab: ${context.id}`);
  const data = {};
  for (const [extension, typ] of [["mp4", "video"], ["vtt", "untertitel"], ["webp", "bild"]]) {
    const id = `${context.id}.${extension}`, asset = assets.get(id);
    try { data[extension] = await readFile(join(root, "public/praxisvideos/v1", id)); }
    catch { pending.push(id); continue; }
    if (!asset && !partial) check(false, `Medienverweis fehlt: ${id}`);
    if (asset) check(asset.typ === typ && asset.url === `/praxisvideos/v1/${id}` && asset.bytes === data[extension].length && asset.sha256 === createHash("sha256").update(data[extension]).digest("hex"), `Metadaten/Prüfsumme weichen ab: ${id}`);
    check(data[extension].length > 0 && data[extension].length <= (extension === "mp4" ? 15 : 2) * 1048576, `Dateibudget ungültig: ${id}`);
  }
  if (!data.mp4 || !data.vtt || !data.webp) continue;
  ready++; bytes += data.mp4.length; maximum = Math.max(maximum, data.mp4.length);
  check(video.dauer >= 45 && video.dauer <= 90, `Film außerhalb 45–90 Sekunden: ${context.id}`);
  try {
    const info = inspectMp4(data.mp4), picture = info.tracks.find(t => t.kind === "vide"), sound = info.tracks.find(t => t.kind === "soun");
    check(info.fastStart && picture?.codec === "avc1" && picture.width === 1280 && picture.height === 720 && Math.abs(picture.fps - 24) < .001, `Videoformat nicht H.264/720p/24fps/Faststart: ${context.id}`);
    check(sound?.codec === "mp4a" && sound.channels >= 1 && Math.abs(sound.seconds - video.dauer) < .35 && Math.abs(picture.seconds - video.dauer) < .35, `AAC-Ton/Video und Sprecherzeiten weichen ab: ${context.id}`);
    // FFmpeg names 8-bit 4:2:0 with full-range signalling "yuvj420p";
    // both ranges are valid H.264 for Safari/Chrome and use the same sampling.
    if (deep) { const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", join(root, "public/praxisvideos/v1", `${context.id}.mp4`)], { encoding: "utf8" })); check(probe.streams.some(s => s.codec_name === "aac") && probe.streams.some(s => s.codec_name === "h264" && ["yuv420p", "yuvj420p"].includes(s.pix_fmt)), `FFprobe prüft Codec nicht erfolgreich: ${context.id}`); }
  } catch (e) { check(false, `MP4 nicht lesbar: ${context.id}: ${e.message}`); }
  check(data.webp.toString("ascii", 0, 4) === "RIFF" && data.webp.toString("ascii", 8, 12) === "WEBP", `Poster ungültig: ${context.id}`);
  const vtt = data.vtt.toString("utf8"), cues = [];
  const seconds = value => { const m = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/.exec(value); return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000 : NaN; };
  check(vtt.startsWith("WEBVTT\n"), `Untertitelkopf fehlt: ${context.id}`);
  for (const block of vtt.split(/\r?\n\r?\n/u)) {
    const lines = block.split(/\r?\n/u), index = lines.findIndex(line => line.includes(" --> "));
    if (index < 0) continue;
    const [start, end] = lines[index].split(" --> ").map(seconds), text = lines.slice(index + 1).join("\n").trim();
    cues.push({ start, end, text });
  }
  let cueEnd = 0;
  for (const cue of cues) { check(cue.start >= cueEnd - .001 && cue.start < cue.end && cue.end <= video.dauer + .001 && cue.text, `Untertitelzeit ungültig: ${context.id}`); cueEnd = cue.end; check(cue.text.split("\n").length <= 2 && cue.text.split("\n").every(line => line.length <= 42 || line.split(/\s/u).length === 1), `Untertitel zu lang: ${context.id}`); }
  check(cues.length > 0 && words(cues.map(c => c.text).join(" ")) === words(video.transkript), `Untertiteltext unvollständig: ${context.id}`);
}
for (const id of assets.keys()) check(/\.(mp4|vtt|webp)$/.test(id) && known.has(id.replace(/\.(mp4|vtt|webp)$/, "")), `Unbekanntes Videomedium: ${id}`);
if (!partial) {
  const files = await readdir(join(root, "public/praxisvideos/v1"));
  check(files.length === 336 && files.every(name => assets.has(name)), "Dateiverzeichnis und freigegebene Medien weichen ab.");
  check(pending.length === 0, `${pending.length} Videomedien fehlen.`);
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`${partial ? "Produktionsstand" : "Praxisvideos geprüft"}: ${ready}/112 Fassungen für 34 Dachthemen und 8 Handgriffe, ${pending.length} Dateien noch ausstehend. Videodaten ${(bytes / 1048576).toFixed(1)} MiB, größte Datei ${(maximum / 1048576).toFixed(2)} MiB.`);
