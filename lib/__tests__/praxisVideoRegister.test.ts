// @vitest-environment node
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import originalInhalte from "@/content/praxisvideos-inhalte.json";
import originalMedien from "@/content/praxisvideos-medien.json";
import archiv from "@/content/praxisvideos-archiv.json";
import type { PraxisVideo, PraxisVideoAsset } from "@/lib/praxisVideoTypen";
import { registerPraxisVideosV2 } from "../../scripts/praxisvideos/v2/register.mjs";

const roots: string[] = [];
const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const ids = ["schnitt", "bearbeiten", "verlegen"].map(s => `werkstatt-falzziegel-${s}`);
const sources = ["scene.mjs", "scene.html", "render.cjs", "models.py", "content.mjs"];
const models = ["bench", "tile", "tile-cut", "marking", "cutting"];
const points = ["schritt-2", "schritt-3", "schritt-1"], tasks = ["a", "b", "a"];
const box = (type: string, data: Buffer) => {
  const header = Buffer.alloc(8); header.writeUInt32BE(data.length + 8); header.write(type, 4); return Buffer.concat([header, data]);
};
/** Structural ISO-BMFF fixture for the native inspector, not a decoded video. */
function movie(width = 1920, height = 1080, fps = 30) {
  const track = (kind: string) => {
    const timescale = kind === "vide" ? 30000 : 44100, duration = timescale * 60;
    const mdhd = Buffer.alloc(24); mdhd.writeUInt32BE(timescale, 12); mdhd.writeUInt32BE(duration, 16);
    const hdlr = Buffer.alloc(12); hdlr.write(kind, 8);
    const entry = Buffer.alloc(kind === "vide" ? 78 : 28);
    if (kind === "vide") { entry.writeUInt16BE(width, 24); entry.writeUInt16BE(height, 26); } else entry.writeUInt16BE(1, 16);
    const stsd = Buffer.alloc(8); stsd.writeUInt32BE(1, 4);
    const stts = Buffer.alloc(16); stts.writeUInt32BE(1, 4); stts.writeUInt32BE(kind === "vide" ? fps * 60 : 60, 8); stts.writeUInt32BE(kind === "vide" ? timescale / fps : timescale, 12);
    const table = box("stbl", Buffer.concat([box("stsd", Buffer.concat([stsd, box(kind === "vide" ? "avc1" : "mp4a", entry)])), box("stts", stts)]));
    return box("trak", box("mdia", Buffer.concat([box("mdhd", mdhd), box("hdlr", hdlr), box("minf", table)])));
  };
  return Buffer.concat([box("ftyp", Buffer.from("isom0000")), box("moov", Buffer.concat([track("vide"), track("soun")])), box("mdat", Buffer.from("structural-test-fixture"))]);
}
const time = (seconds: number) => {
  const ms = Math.round(seconds * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
};
function captions(clip: PraxisVideo) {
  const blocks = [];
  for (const chapter of clip.kapitel) {
    const lines = [""];
    for (const word of chapter.text.split(/\s+/u)) {
      const last = lines.length - 1;
      if (lines[last].length && lines[last].length + word.length + 1 > 42) lines.push(word);
      else lines[last] += (lines[last] ? " " : "") + word;
    }
    const count = Math.ceil(lines.length / 2);
    for (let i = 0; i < count; i++) blocks.push(`${time(chapter.start + (chapter.ende - chapter.start) * i / count)} --> ${time(chapter.start + (chapter.ende - chapter.start) * (i + 1) / count)}\n${lines.slice(i * 2, i * 2 + 2).join("\n")}`);
  }
  return "WEBVTT\n\n" + blocks.join("\n\n") + "\n";
}
async function fixture() {
  const root = await fs.mkdtemp(join(tmpdir(), "praxis-video-register-")); roots.push(root);
  const put = async (path: string, data: string | Uint8Array) => { await fs.mkdir(join(root, path, ".."), { recursive: true }); await fs.writeFile(join(root, path), data); };
  const json = (path: string, data: unknown) => put(path, JSON.stringify(data, null, 2) + "\n");
  const oldVideos = (originalInhalte.videos as unknown as PraxisVideo[]).map(v => (archiv.videos as unknown as PraxisVideo[]).find(a => a.id === v.id) ?? v);
  const oldAssets: PraxisVideoAsset[] = [];
  for (const a of originalMedien.assets) {
    const data = Buffer.from(`immutable-old-file:${a.id}`);
    const asset = { ...a, typ: a.typ as PraxisVideoAsset["typ"], url: `/praxisvideos/v1/${a.id}`, bytes: data.length, sha256: hash(data) };
    oldAssets.push(asset); await put("public" + asset.url, data);
  }
  const content = { version: 1, videos: oldVideos }, manifest = { version: 1, assets: oldAssets };
  await json("content/praxisvideos-inhalte.json", content); await json("content/praxisvideos-medien.json", manifest);
  await json("content/praxisvideos-archiv.json", { version: 1, videos: oldVideos.filter(v => ids.includes(v.id)), assets: oldAssets.filter(a => ids.some(id => a.id.startsWith(id + "."))) });
  await json(".praxisvideo-production/v2/compatibility-baseline.json", { "praxisvideos-inhalte": content, "praxisvideos-medien": manifest });
  const clips: PraxisVideo[] = ids.map((id, i) => {
    const alt = oldVideos.find(v => v.id === id)!;
    return { ...alt, version: 2, dauer: 60, kapitel: alt.kapitel.map((c, j) => ({ ...c, start: c.start * 60 / alt.dauer, ende: j === 6 ? 60 : c.ende * 60 / alt.dauer })), lernpunkte: [{ id: `${id}-mitmachen`, kapitelId: points[i], einheitId: id, aufgabeId: `${id}-${tasks[i]}` }] };
  });
  await json(".praxisvideo-production/v2/content.json", { version: 1, videos: clips });
  const artifacts = { sources: Object.fromEntries(sources.map(name => [name, hash(name)])), models: Object.fromEntries(models.map(name => [name, hash(name)])), system: hash("system"), light: hash("light") };
  for (const name of sources) await put(`scripts/praxisvideos/v2/${name}`, name);
  for (const name of models) await put(`.praxisvideo-production/v2/models/${name}.glb`, name);
  await put(".praxisvideo-production/v2/system.json", "system"); await put("public/dach-medien/v2/gemeinsam/royal_esplanade_1k.hdr", "light");
  const renderProfile = { width: 1920, height: 1080, fps: 30 }, sourceSha = hash(JSON.stringify({ artifacts, renderProfile }));
  for (const clip of clips) {
    const mp4 = movie(), audio = Buffer.from("measured-narration:" + clip.id), audioSha256 = hash(audio);
    await put(`public/praxisvideos/v2/${clip.id}.mp4`, mp4); await put(`public/praxisvideos/v2/${clip.id}.vtt`, captions(clip));
    await put(`public/praxisvideos/v2/${clip.id}.webp`, Buffer.from("RIFF0000WEBPstructural-image-fixture"));
    await put(`.praxisvideo-production/v2/audio/${clip.id}/audio.wav`, audio);
    const chapters = clip.kapitel.map(c => ({ id: c.id, start: c.start, ende: c.ende }));
    await json(`.praxisvideo-production/v2/audio/${clip.id}/receipt.json`, { audioSha256, dauer: clip.dauer, kapitel: chapters });
    await json(`.praxisvideo-production/v2/render/${clip.id}/receipt.json`, { id: clip.id, version: 2, signature: hash(sourceSha + JSON.stringify(clip) + audioSha256), sourceSha, renderProfile, artifacts, audioSha256, sha256: hash(mp4), bytes: mp4.length, duration: 60, width: 1920, height: 1080, fps: 30, frames: 1800, sourceFrames: 1800, chapters });
  }
  const original = await Promise.all([fs.readFile(join(root, "content/praxisvideos-inhalte.json")), fs.readFile(join(root, "content/praxisvideos-medien.json")), fs.readFile(join(root, "content/praxisvideos-archiv.json"))]);
  return { root, content, manifest, clips, original, put, json };
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });

describe("Vollständige Werkstattfilme sicher registrieren", () => {
  it("prüft im Standardmodus alle Dateien, ohne Katalog, Manifest oder Archiv zu schreiben", async () => {
    const f = await fixture();
    expect(await registerPraxisVideosV2({ root: f.root })).toMatchObject({ dryRun: true, written: false, preservedVideos: 109, activeVideos: 112, activeAssets: 336, historicalAssetsChecked: 336 });
    const actual = await Promise.all(["praxisvideos-inhalte", "praxisvideos-medien", "praxisvideos-archiv"].map(name => fs.readFile(join(f.root, `content/${name}.json`))));
    expect(actual).toEqual(f.original); expect((await fs.readdir(join(f.root, "content"))).some(name => name.endsWith(".tmp"))).toBe(false);
  });
  it("ändert mit --write genau drei Fassungen und neun Verweise und ist danach idempotent", async () => {
    const f = await fixture(); expect((await registerPraxisVideosV2({ root: f.root, write: true })).written).toBe(true);
    const next = JSON.parse(await fs.readFile(join(f.root, "content/praxisvideos-inhalte.json"), "utf8"));
    expect(next.videos.filter((v: PraxisVideo) => v.version === 2)).toEqual(f.clips);
    expect(next.videos.filter((v: PraxisVideo) => !ids.includes(v.id))).toEqual(f.content.videos.filter(v => !ids.includes(v.id)));
    const assets = JSON.parse(await fs.readFile(join(f.root, "content/praxisvideos-medien.json"), "utf8"));
    expect(assets.assets.filter((a: PraxisVideoAsset) => a.url.startsWith("/praxisvideos/v2/"))).toHaveLength(9);
    expect(await fs.readFile(join(f.root, "content/praxisvideos-archiv.json"))).toEqual(f.original[2]);
    expect(await registerPraxisVideosV2({ root: f.root, write: true })).toMatchObject({ written: false, alreadyActive: true });
  });
  it.each(["missing-poster", "wrong-codec-profile", "forged-receipt", "changed-old-file", "wrong-task"])("aktiviert bei %s keine teilweise Fassung", async fault => {
    const f = await fixture(), id = ids[0];
    if (fault === "missing-poster") await fs.rm(join(f.root, `public/praxisvideos/v2/${id}.webp`));
    if (fault === "wrong-codec-profile") await f.put(`public/praxisvideos/v2/${id}.mp4`, movie(1280, 720, 24));
    if (fault === "forged-receipt") {
      const path = `.praxisvideo-production/v2/render/${id}/receipt.json`, receipt = JSON.parse(await fs.readFile(join(f.root, path), "utf8"));
      await f.json(path, { ...receipt, sha256: "0".repeat(64) });
    }
    if (fault === "changed-old-file") await f.put("public/praxisvideos/v1/werkstatt-falzziegel-schnitt.mp4", "unexpected overwrite");
    if (fault === "wrong-task") {
      const clips = structuredClone(f.clips); clips[0].lernpunkte![0].aufgabeId = "werkstatt-falzziegel-verlegen-a";
      await f.json(".praxisvideo-production/v2/content.json", { version: 1, videos: clips });
    }
    await expect(registerPraxisVideosV2({ root: f.root, write: true })).rejects.toThrow();
    expect(await fs.readFile(join(f.root, "content/praxisvideos-inhalte.json"))).toEqual(f.original[0]);
    expect(await fs.readFile(join(f.root, "content/praxisvideos-medien.json"))).toEqual(f.original[1]);
  });
  it("stellt beim fehlgeschlagenen zweiten Dateitausch den bisherigen Katalog wieder her", async () => {
    const f = await fixture(), rename = fs.rename.bind(fs);
    vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
      if (String(from).includes("praxisvideos-medien.json.v2-register-")) throw new Error("simulierter Dateitauschfehler");
      return rename(from, to);
    });
    await expect(registerPraxisVideosV2({ root: f.root, write: true })).rejects.toThrow("simulierter Dateitauschfehler");
    expect(await fs.readFile(join(f.root, "content/praxisvideos-inhalte.json"))).toEqual(f.original[0]);
    expect(await fs.readFile(join(f.root, "content/praxisvideos-medien.json"))).toEqual(f.original[1]);
    expect((await fs.readdir(join(f.root, "content"))).some(name => name.endsWith(".tmp"))).toBe(false);
  });
});
