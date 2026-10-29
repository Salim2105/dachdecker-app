import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const folder = join(root, "public/dach-medien/v1");
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = await Promise.all(entries.map(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
  return out.flat();
}
const assets = [];
for (const path of (await files(folder)).sort()) {
  if (!/\.(glb|webp|png|jpe?g|ktx2)$/.test(path)) continue;
  const id = relative(folder, path).split("\\").join("/");
  const data = await readFile(path), info = await stat(path);
  assets.push({ id, url: `/dach-medien/v1/${id}`, bytes: info.size, sha256: createHash("sha256").update(data).digest("hex"), typ: id.endsWith(".glb") ? "modell" : "bild" });
}
if (!assets.length) throw new Error("Es sind noch keine Dachmedien hergestellt.");
await writeFile(join(root, "content/dach3d-medien.json"), JSON.stringify({ version: 1, assets }, null, 2) + "\n");
console.log(`${assets.length} versionierte Dachmedien, ${(assets.reduce((s, a) => s + a.bytes, 0) / 1048576).toFixed(1)} MiB; SHA-256 für jede Datei gespeichert.`);
