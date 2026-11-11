/** Encode every already rendered source frame when an output time limit rounded a frame away. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";

const script = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(script), "../../..");
const build = path.join(root, ".praxisvideo-production/v2");
const id = process.argv.find(arg => arg.startsWith("--id="))?.slice(5);
if (id !== "werkstatt-falzziegel-verlegen" || process.argv.slice(2).some(arg => arg !== `--id=${id}`)) {
  throw new Error("Aufruf: node scripts/praxisvideos/v2/repair-encode.mjs --id=werkstatt-falzziegel-verlegen");
}
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const json = async file => JSON.parse(await fs.readFile(file, "utf8"));
const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
const log = (event, data = {}) => console.log(JSON.stringify({ time: new Date().toISOString(), event, ...data }));
const command = async (args, logFile) => {
  const handle = await fs.open(logFile, "a");
  try {
    await new Promise((resolve, reject) => {
      const child = spawn("ffmpeg", args, { cwd: root, stdio: ["ignore", handle.fd, handle.fd] });
      child.on("error", reject);
      child.on("exit", code => code === 0 ? resolve() : reject(new Error(`FFmpeg ${code}; ${logFile}`)));
    });
  } finally { await handle.close(); }
};

const content = await json(path.join(build, "content.json"));
const clip = content.videos.find(clip => clip.id === id);
requireThat(clip?.version === 2 && clip.dauer >= 60 && clip.dauer <= 90, "Keine vollständige v2-Fassung.");
const work = path.join(build, "render", id);
const frames = Math.ceil(clip.dauer * 30);
const audio = path.join(build, "audio", id, "audio.wav");
const voice = await json(path.join(build, "audio", id, "receipt.json"));
const audioSha = sha(await fs.readFile(audio));
requireThat(voice.audioSha256 === audioSha && voice.dauer === clip.dauer, "Erzählung stimmt nicht mit der Fassung überein.");
const candidates = [];
for (const name of await fs.readdir(work)) {
  if (!/^[a-f0-9]{20}$/.test(name)) continue;
  const folder = path.join(work, name);
  try {
    const receipt = await json(path.join(folder, "receipt.json"));
    if (receipt.clip === id && receipt.frames === frames && receipt.signature === sha(receipt.sourceSha + JSON.stringify(clip) + audioSha) &&
        receipt.sourceSha === sha(JSON.stringify({ artifacts: receipt.artifacts, renderProfile: receipt.renderProfile }))) candidates.push({ folder, receipt });
  } catch { /* An incomplete cache is not usable. */ }
}
requireThat(candidates.length === 1, "Genau ein vollständiger, passender Bild-Cache wird benötigt.");
const { folder, receipt } = candidates[0];
const images = (await fs.readdir(folder)).filter(name => /^\d{6}\.jpg$/.test(name)).sort();
requireThat(images.length === frames && images.every((name, i) => name === `${String(i).padStart(6, "0")}.jpg`), "Einzelbilder sind unvollständig.");
requireThat(receipt.width === 1920 && receipt.height === 1080 && receipt.fps === 30, "Falsches Bildprofil.");
const out = path.join(root, "public/praxisvideos/v2");
const target = path.join(out, `${id}.mp4`), temporary = path.join(out, `${id}.repaired.tmp.mp4`);
const archive = path.join(work, "before-encode-repair");
await fs.mkdir(archive, { recursive: true });
for (const name of [`${id}.tmp.mp4`, `${id}.mp4`]) {
  try { await fs.copyFile(path.join(out, name), path.join(archive, name), 1); }
  catch (error) { if (!["ENOENT", "EEXIST"].includes(error.code)) throw error; }
}
const began = Date.now();
log("encoding-repair-start", { id, frames, sourceSha: receipt.sourceSha });
await command(["-hide_banner", "-loglevel", "warning", "-y", "-framerate", "30", "-i", path.join(folder, "%06d.jpg"), "-i", audio,
  "-map", "0:v:0", "-map", "1:a:0", "-vf", "scale=in_range=full:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-profile:v", "high", "-level:v", "4.1", "-maxrate", "2100k", "-bufsize", "4200k", "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-threads", "2",
  "-frames:v", String(frames), "-c:a", "aac", "-b:a", "96k", "-ar", "44100", "-ac", "1", "-movflags", "+faststart", temporary], path.join(work, "repair-encode.log"));
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", temporary], { encoding: "utf8" }));
const video = probe.streams.find(s => s.codec_type === "video"), sound = probe.streams.find(s => s.codec_type === "audio");
const bytes = await fs.readFile(temporary);
requireThat(video?.codec_name === "h264" && video.width === 1920 && video.height === 1080 && video.avg_frame_rate === "30/1" && Number(video.nb_frames) === frames &&
  sound?.codec_name === "aac" && Math.abs(Number(probe.format.duration) - clip.dauer) < .1 && bytes.length <= 25 * 1048576, "Die reparierte Fassung hat ein falsches Format.");
await fs.rename(temporary, target);
const posterTime = clip.kapitel[4].start + (clip.kapitel[4].ende - clip.kapitel[4].start) * .9;
const poster = path.join(out, `${id}.webp`);
await command(["-hide_banner", "-loglevel", "warning", "-y", "-threads", "1", "-ss", String(posterTime), "-i", target, "-frames:v", "1", "-c:v", "libwebp", "-quality", "86", "-threads", "1", poster], path.join(work, "repair-encode.log"));
const finalReceipt = { id, version: 2, signature: receipt.signature, sourceSha: receipt.sourceSha, renderProfile: receipt.renderProfile, artifacts: receipt.artifacts,
  audioSha256: audioSha, sha256: sha(bytes), bytes: bytes.length, duration: Number(probe.format.duration), width: 1920, height: 1080, fps: 30,
  frames, sourceFrames: frames, framesDirectory: folder, posterTime,
  chapters: clip.kapitel.map(k => ({ id: k.id, start: k.start, ende: k.ende })), modelSystem: "werkstatt-system-falzziegel",
  encoding: { repair: "full-source-frame-count-v1", script: "scripts/praxisvideos/v2/repair-encode.mjs", scriptSha256: sha(await fs.readFile(script)), frames, previousFailure: "output-time-limit-trimmed-final-source-frame" },
  encodingRepairSeconds: (Date.now() - began) / 1000 };
await fs.writeFile(path.join(work, "receipt.json.tmp"), JSON.stringify(finalReceipt, null, 2) + "\n");
await fs.rename(path.join(work, "receipt.json.tmp"), path.join(work, "receipt.json"));
await fs.rm(path.join(out, `${id}.tmp.mp4`), { force: true });
log("encoding-repair-complete", { id, frames, bytes: bytes.length, duration: Number(probe.format.duration), sha256: finalReceipt.sha256 });
