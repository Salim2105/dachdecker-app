import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const folder = join(root, "public/dach-medien/v2");
async function files(dir) {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))).flat();
}
const assets = [];
for (const path of (await files(folder)).sort()) {
  if (!/\.(glb|webp|png|jpe?g|ktx2|hdr)$/.test(path)) continue;
  const id = `v2/${relative(folder, path).split("\\").join("/")}`;
  const data = await readFile(path);
  assets.push({ id, url: `/dach-medien/${id}`, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex"), typ: id.endsWith(".glb") ? "modell" : id.endsWith(".hdr") ? "umgebung" : "bild" });
}
await writeFile(join(root, "content/dach3d-studio-medien.json"), JSON.stringify({ version: 2, assets }, null, 2) + "\n");
console.log(`${assets.length} versionierte Studio-Medien; veröffentlichte v1-Dateien bleiben unverändert.`);
