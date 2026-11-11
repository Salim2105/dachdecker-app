/** Register only complete, verified v2 productions. Default is a read-only dry run. */
import fs from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { inspectMp4 } from "../mp4.mjs";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const IDS = ["schnitt", "bearbeiten", "verlegen"].map(slug => `werkstatt-falzziegel-${slug}`);
const CHAPTERS = ["einordnung", "funktion", "schritt-1", "schritt-2", "schritt-3", "schritt-4", "fehlerkorrektur"];
const SOURCES = ["scene.mjs", "scene.html", "render.cjs", "models.py", "content.mjs"];
const MODELS = ["bench", "tile", "tile-cut", "marking", "cutting"];
const POINTS = ["schritt-2", "schritt-3", "schritt-1"];
const TASKS = ["a", "b", "a"];
const EXTENSIONS = [["mp4", "video"], ["vtt", "untertitel"], ["webp", "bild"]];
// Only the cutting scene changed: its parked blade and cutting start moved
// 20 mm clear of the head ridge. These two exact revisions leave the marking
// and laying scenes unchanged; no other historic scene hash is accepted.
const ORIGINAL_SCENE = "e9dc726a488cf3134768ee5a384fc8485620d88b8cd4ce745800636d98bc1979";
const CORRECTED_SCENE = "b83817111b17371bd54a56ede9efbda458284128c3e125bdb3414304adb18485";
const sha = value => createHash("sha256").update(value).digest("hex");
const object = value => !!value && typeof value === "object" && !Array.isArray(value);
const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
const words = value => value.trim().split(/\s+/u).join(" ");
const seconds = value => {
  const match = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/.exec(value);
  return match ? +match[1] * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000 : NaN;
};
function validateClip(clip) {
  const index = IDS.indexOf(clip?.id);
  requireThat(index >= 0 && clip.version === 2 && clip.typ === "handgriff" && clip.pfadId === "falzziegel" && clip.slug === clip.id.slice("werkstatt-falzziegel-".length) &&
    ["form", "deckung", "detailId"].every(key => clip[key] === undefined), "Unbekannte oder falsch zugeordnete v2-Fassung.");
  requireThat(typeof clip.titel === "string" && clip.titel.trim() && typeof clip.transkript === "string" && clip.transkript.trim() &&
    Number.isFinite(clip.dauer) && clip.dauer >= 60 && clip.dauer <= 90, `Titel, Sprechertext oder Laufzeit ungültig: ${clip.id}`);
  requireThat(Array.isArray(clip.kapitel) && clip.kapitel.length === CHAPTERS.length, `Sieben Kapitel erwartet: ${clip.id}`);
  let end = 0;
  clip.kapitel.forEach((chapter, i) => {
    requireThat(chapter.id === CHAPTERS[i] && typeof chapter.titel === "string" && chapter.titel.trim() && typeof chapter.text === "string" && chapter.text.trim() &&
      Number.isFinite(chapter.start) && Number.isFinite(chapter.ende) && Math.abs(chapter.start - end) <= .001 && chapter.ende > chapter.start && chapter.ende <= clip.dauer + .001,
    `Kapitel oder Kapitelzeit ungültig: ${clip.id}/${CHAPTERS[i]}`);
    end = chapter.ende;
  });
  requireThat(Math.abs(end - clip.dauer) <= .001 && words(clip.transkript) === words(clip.kapitel.map(k => k.text).join(" ")), `Kapitel und Erzählung weichen ab: ${clip.id}`);
  requireThat(isDeepStrictEqual(clip.lernpunkte, [{ id: `${clip.id}-mitmachen`, kapitelId: POINTS[index], einheitId: clip.id, aufgabeId: `${clip.id}-${TASKS[index]}` }]), `Mitmachaufgabe falsch zugeordnet: ${clip.id}`);
}
function validateCaptions(bytes, clip) {
  const text = bytes.toString("utf8"), cues = [];
  requireThat(text.startsWith("WEBVTT\n"), `Untertitelkopf fehlt: ${clip.id}`);
  for (const block of text.split(/\r?\n\r?\n/u)) {
    const lines = block.split(/\r?\n/u), index = lines.findIndex(line => line.includes(" --> "));
    if (index < 0) continue;
    const [start, end] = lines[index].split(" --> ").map(seconds);
    cues.push({ start, end, text: lines.slice(index + 1).join("\n").trim() });
  }
  let end = 0;
  for (const cue of cues) {
    requireThat(Number.isFinite(cue.start) && Number.isFinite(cue.end) && cue.start >= end - .001 && cue.end > cue.start && cue.end <= clip.dauer + .001 && cue.text &&
      cue.text.split("\n").length <= 2 && cue.text.split("\n").every(line => line.length <= 42 || line.split(/\s/u).length === 1), `Untertitelzeit oder Zeilenlänge ungültig: ${clip.id}`);
    end = cue.end;
  }
  requireThat(cues.length > 0 && words(cues.map(c => c.text).join(" ")) === words(clip.transkript), `Untertitel und Erzählung weichen ab: ${clip.id}`);
}
const chapterTimes = chapters => chapters.map(c => ({ id: c.id, start: c.start, ende: c.ende }));

/** No TTS, Blender, ffprobe or browser is launched by registration. */
export async function registerPraxisVideosV2({ root = DEFAULT_ROOT, write = false } = {}) {
  root = resolve(root);
  const build = join(root, ".praxisvideo-production/v2");
  const read = file => fs.readFile(file);
  const load = async file => JSON.parse((await read(file)).toString("utf8"));
  const contentPath = join(root, "content/praxisvideos-inhalte.json"), manifestPath = join(root, "content/praxisvideos-medien.json");
  const [contentBytes, manifestBytes] = await Promise.all([read(contentPath), read(manifestPath)]);
  const content = JSON.parse(contentBytes), manifest = JSON.parse(manifestBytes);
  const [baseline, archive, production] = await Promise.all([load(join(build, "compatibility-baseline.json")), load(join(root, "content/praxisvideos-archiv.json")), load(join(build, "content.json"))]);
  const oldContent = baseline["praxisvideos-inhalte"], oldManifest = baseline["praxisvideos-medien"];
  requireThat(content.version === 1 && oldContent?.version === 1 && Array.isArray(content.videos) && content.videos.length === 112 && Array.isArray(oldContent.videos) && oldContent.videos.length === 112 &&
    new Set(content.videos.map(v => v.id)).size === 112 && new Set(oldContent.videos.map(v => v.id)).size === 112, "Katalog oder Kompatibilitätsgrundlage ist unvollständig.");
  requireThat(manifest.version === 1 && oldManifest?.version === 1 && Array.isArray(manifest.assets) && manifest.assets.length === 336 && Array.isArray(oldManifest.assets) && oldManifest.assets.length === 336 &&
    new Set(manifest.assets.map(a => a.id)).size === 336 && new Set(oldManifest.assets.map(a => a.id)).size === 336, "Medienkatalog oder Kompatibilitätsgrundlage ist unvollständig.");
  for (const video of oldContent.videos) {
    const current = content.videos.find(v => v.id === video.id);
    requireThat(current && (IDS.includes(video.id) || isDeepStrictEqual(current, video)), `Bestehender Lerninhalt wurde verändert: ${video.id}`);
  }
  const archivedVideos = new Map(archive.videos?.map(v => [v.id, v]));
  const archivedAssets = new Map(archive.assets?.map(a => [a.id, a]));
  const currentAssets = new Map(manifest.assets.map(a => [a.id, a]));
  requireThat(archive.version === 1 && archivedVideos.size === 3 && archive.videos.length === 3 && archivedAssets.size === 9 && archive.assets.length === 9, "Archiv muss die drei ursprünglichen Fassungen enthalten.");
  for (const id of IDS) requireThat(isDeepStrictEqual(archivedVideos.get(id), oldContent.videos.find(v => v.id === id)), `Ursprüngliche Videofassung fehlt im Archiv: ${id}`);
  for (const asset of oldManifest.assets) {
    requireThat(currentAssets.has(asset.id), `Aktiver Medienverweis fehlt: ${asset.id}`);
    const oldId = asset.id.replace(/\.(?:mp4|vtt|webp)$/, "");
    requireThat(asset.url === `/praxisvideos/v1/${asset.id}` && /^[a-z0-9-]+\.(?:mp4|vtt|webp)$/.test(asset.id), "Unzulässiger ursprünglicher Medienpfad.");
    if (IDS.includes(oldId)) requireThat(isDeepStrictEqual(archivedAssets.get(asset.id), asset), `Ursprünglicher Medienverweis fehlt im Archiv: ${asset.id}`);
    else requireThat(isDeepStrictEqual(manifest.assets.find(a => a.id === asset.id), asset), `Bestehender Medienverweis wurde verändert: ${asset.id}`);
    const bytes = await read(join(root, "public", asset.url));
    requireThat(bytes.length === asset.bytes && sha(bytes) === asset.sha256, `Veröffentlichte v1-Datei wurde verändert: ${asset.id}`);
  }
  requireThat(production.version === 1 && Array.isArray(production.videos) && production.videos.length === 3 && new Set(production.videos.map(v => v.id)).size === 3, "Drei vollständige neue Werkstattfilme erwartet.");
  production.videos.forEach(validateClip);
  const assets = []; let commonRenderProfile;
  for (const clip of production.videos) {
    const data = {};
    for (const [extension, typ] of EXTENSIONS) {
      const id = `${clip.id}.${extension}`, url = `/praxisvideos/v2/${id}`;
      data[extension] = await read(join(root, "public", url));
      requireThat(data[extension].length > 0 && data[extension].length <= (extension === "mp4" ? 25 : 2) * 1048576, `Datei fehlt oder überschreitet ihr Budget: ${id}`);
      assets.push({ id, url, bytes: data[extension].length, sha256: sha(data[extension]), typ });
    }
    const info = inspectMp4(data.mp4), picture = info.tracks.find(t => t.kind === "vide"), sound = info.tracks.find(t => t.kind === "soun");
    requireThat(info.fastStart && picture?.codec === "avc1" && picture.width === 1920 && picture.height === 1080 && Math.abs(picture.fps - 30) < .001 &&
      Math.abs(picture.seconds - clip.dauer) < .1 && sound?.codec === "mp4a" && sound.channels >= 1 && Math.abs(sound.seconds - clip.dauer) < .1, `Kein vollständiger H.264/1080p/30fps/AAC-Film: ${clip.id}`);
    requireThat(data.webp.toString("ascii", 0, 4) === "RIFF" && data.webp.toString("ascii", 8, 12) === "WEBP", `WebP-Vorschau ungültig: ${clip.id}`);
    validateCaptions(data.vtt, clip);
    const receipt = await load(join(build, "render", clip.id, "receipt.json")), voice = await load(join(build, "audio", clip.id, "receipt.json"));
    const audioSha = sha(await read(join(build, "audio", clip.id, "audio.wav")));
    requireThat(receipt.id === clip.id && receipt.version === 2 && receipt.sha256 === sha(data.mp4) && receipt.bytes === data.mp4.length && receipt.width === 1920 && receipt.height === 1080 && receipt.fps === 30 &&
      receipt.frames === Math.ceil(clip.dauer * 30) && receipt.sourceFrames === receipt.frames && Math.abs(receipt.duration - clip.dauer) < .1 && isDeepStrictEqual(receipt.chapters, chapterTimes(clip.kapitel)), `Produktionsbeleg passt nicht zum fertigen Film: ${clip.id}`);
    requireThat(voice.audioSha256 === audioSha && receipt.audioSha256 === audioSha && voice.dauer === clip.dauer && isDeepStrictEqual(chapterTimes(voice.kapitel), chapterTimes(clip.kapitel)), `Gemessene Erzählung passt nicht zur Fassung: ${clip.id}`);
    const a = receipt.artifacts;
    requireThat(object(a) && object(a.sources) && Object.keys(a.sources).length === SOURCES.length && object(a.models) && Object.keys(a.models).length === MODELS.length, `Quellenbeleg fehlt: ${clip.id}`);
    for (const source of SOURCES) {
      const current = sha(await read(join(root, "scripts/praxisvideos/v2", source)));
      const unchangedScene = source === "scene.mjs" && current === CORRECTED_SCENE && a.sources[source] === ORIGINAL_SCENE &&
        ["werkstatt-falzziegel-schnitt", "werkstatt-falzziegel-verlegen"].includes(clip.id);
      const uncorrectedCutting = source === "scene.mjs" && clip.id === "werkstatt-falzziegel-bearbeiten" && a.sources[source] === ORIGINAL_SCENE;
      requireThat(!uncorrectedCutting && (a.sources[source] === current || unchangedScene), `Produktionsquelle wurde seit dem Rendern verändert: ${source}`);
    }
    for (const model of MODELS) requireThat(a.models[model] === sha(await read(join(build, "models", model + ".glb"))), `Produktionsmodell wurde seit dem Rendern verändert: ${model}`);
    requireThat(a.system === sha(await read(join(build, "system.json"))) && a.light === sha(await read(join(root, "public/dach-medien/v2/gemeinsam/royal_esplanade_1k.hdr"))), `Systemkarte oder Lichtquelle wurde seit dem Rendern verändert: ${clip.id}`);
    requireThat(receipt.renderProfile?.width === 1920 && receipt.renderProfile.height === 1080 && receipt.renderProfile.fps === 30 && receipt.sourceSha === sha(JSON.stringify({ artifacts: a, renderProfile: receipt.renderProfile })) &&
      receipt.signature === sha(receipt.sourceSha + JSON.stringify(clip) + audioSha), `Produktionsfingerabdruck ungültig: ${clip.id}`);
    if (commonRenderProfile === undefined) commonRenderProfile = receipt.renderProfile;
    else requireThat(isDeepStrictEqual(receipt.renderProfile, commonRenderProfile), "Die Filme stammen aus unterschiedlichen Renderprofilen.");
    if (receipt.encoding !== undefined) {
      const encoding = receipt.encoding, script = "scripts/praxisvideos/v2/repair-encode.mjs";
      requireThat(clip.id === "werkstatt-falzziegel-verlegen" && object(encoding) && Object.keys(encoding).length === 5 &&
        encoding.repair === "full-source-frame-count-v1" && encoding.script === script && encoding.frames === receipt.frames &&
        encoding.previousFailure === "output-time-limit-trimmed-final-source-frame" && encoding.scriptSha256 === sha(await read(join(root, script))), `Nachkodierungsbeleg ungültig: ${clip.id}`);
    }
  }
  const replacements = new Map(production.videos.map(v => [v.id, v])), media = new Map(assets.map(a => [a.id, a]));
  const nextContent = { ...content, videos: content.videos.map(v => replacements.get(v.id) ?? v) };
  const nextManifest = { ...manifest, assets: manifest.assets.map(a => media.get(a.id) ?? a) };
  const alreadyActive = isDeepStrictEqual(nextContent, content) && isDeepStrictEqual(nextManifest, manifest);
  if (write && !alreadyActive) {
    requireThat((await read(contentPath)).equals(contentBytes) && (await read(manifestPath)).equals(manifestBytes), "Katalog wurde während der Prüfung verändert; Registrierung erneut starten.");
    const transaction = randomUUID();
    const contentTemp = `${contentPath}.v2-register-${transaction}.tmp`, manifestTemp = `${manifestPath}.v2-register-${transaction}.tmp`;
    let replaced = false;
    try {
      await fs.writeFile(contentTemp, JSON.stringify(nextContent, null, 2) + "\n", { flag: "wx" });
      await fs.writeFile(manifestTemp, JSON.stringify(nextManifest, null, 2) + "\n", { flag: "wx" });
      await fs.rename(contentTemp, contentPath); replaced = true;
      await fs.rename(manifestTemp, manifestPath);
    } catch (error) {
      if (replaced) { await fs.writeFile(contentTemp, contentBytes); await fs.rename(contentTemp, contentPath); }
      throw error;
    } finally {
      await fs.rm(contentTemp, { force: true }); await fs.rm(manifestTemp, { force: true });
    }
  }
  return { dryRun: !write, written: write && !alreadyActive, alreadyActive, videos: IDS.length, activeVideos: nextContent.videos.length, activeAssets: nextManifest.assets.length, preservedVideos: 109, historicalAssetsChecked: oldManifest.assets.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--write")) {
    console.error("Aufruf: node scripts/praxisvideos/v2/register.mjs [--write]. Ohne --write werden keine Dateien geändert.");
    process.exitCode = 1;
  } else {
    registerPraxisVideosV2({ write: args.includes("--write") }).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
