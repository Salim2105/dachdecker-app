import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const file = join(root, "lib/dach3dInhalte.ts");
const compiled = ts.transpileModule(await readFile(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const authored = { exports: {} };
new Function("module", "exports", "require", compiled)(authored, authored.exports, createRequire(file));
const { DACH_DETAILS, DACH_MODELLE } = authored.exports;
const manifest = JSON.parse(await readFile(join(root, "content/dach3d-medien.json"), "utf8"));
const assets = new Map(manifest.assets.map(a => [a.id, a]));
const errors = [];
let contexts = 0, maxTriangles = 0, total = 0, maxOverview = 0, maxDetail = 0;
const check = (condition, message) => { if (!condition) errors.push(message); };
check(DACH_DETAILS.length === 34, "Es müssen 34 Dachdetails vorliegen.");
check(assets.size === manifest.assets.length, "Das Medienverzeichnis enthält doppelte IDs.");
async function asset(id) {
  const a = assets.get(id);
  check(!!a, `Fehlender Medienverweis: ${id}`);
  if (!a) return null;
  check(a.url === `/dach-medien/v1/${id}`, `Nicht lokaler Medienpfad: ${id}`);
  try {
    const data = await readFile(join(root, "public/dach-medien/v1", id));
    check(data.length === a.bytes, `Falsche Dateigröße: ${id}`);
    check(createHash("sha256").update(data).digest("hex") === a.sha256, `Falsche Prüfsumme: ${id}`);
    total += data.length;
    return data;
  } catch { errors.push(`Fehlende Datei: ${id}`); return null; }
}
function glb(data, id, detailIds, overview) {
  if (!data) return;
  check(data.toString("utf8", 0, 4) === "glTF" && data.readUInt32LE(4) === 2 && data.readUInt32LE(8) === data.length, `Ungültige GLB-Datei: ${id}`);
  try {
    const json = JSON.parse(data.toString("utf8", 20, 20 + data.readUInt32LE(12)).trim());
    const meshTriangles = (json.meshes ?? []).map(m => m.primitives.reduce((sum, p) => sum + (json.accessors[p.indices ?? p.attributes.POSITION]?.count ?? 0) / 3, 0));
    const triangles = (json.nodes ?? []).reduce((sum, n) => sum + (n.mesh === undefined ? 0 : meshTriangles[n.mesh] ?? 0), 0);
    maxTriangles = Math.max(maxTriangles, triangles);
    check(triangles > 0 && triangles <= 100000, `Dreiecksbudget überschritten (${triangles}): ${id}`);
    check((json.buffers ?? []).every(b => !b.uri), `Externe Modelldaten: ${id}`);
    check((json.images ?? []).every(i => i.bufferView !== undefined), `Texturen sind nicht eingebettet: ${id}`);
    check((json.textures ?? []).length > 0, `Keine Materialtexturen: ${id}`);
    for (const d of detailIds) {
      check((json.nodes ?? []).some(n => n.extras?.detail_id === d && (!overview || n.extras?.hotspot)), `Fehlender ${overview ? "Hotspot" : "Bauteil"} ${d}: ${id}`);
    }
  } catch (e) { errors.push(`Nicht lesbares GLB ${id}: ${e.message}`); }
}
async function preview(id) {
  try {
    const data = await readFile(join(root, "public/dach-vorschau/v1", id));
    check(data.toString("utf8", 0, 4) === "RIFF" && data.toString("utf8", 8, 12) === "WEBP", `Ungültiges Vorschaubild: ${id}`);
    check(data.length < 100000, `Vorschaubild zu groß: ${id}`);
  } catch { errors.push(`Fehlende Offline-Vorschau: ${id}`); }
}
for (const modell of DACH_MODELLE) for (const deckung of modell.deckungen) {
  const variant = `${modell.id}-${deckung}`;
  const overview = await asset(`${variant}/uebersicht.glb`);
  if (overview) maxOverview = Math.max(maxOverview, overview.length);
  check(!overview || overview.length <= 6 * 1024 * 1024, `Übersichtsmodell größer als 6 MiB: ${variant}`);
  glb(overview, variant, modell.detailIds, true);
  await asset(`${variant}/uebersicht.webp`);
  await preview(`${variant}/uebersicht.webp`);
  for (const id of modell.detailIds) {
    contexts++;
    const detail = DACH_DETAILS.find(d => d.id === id);
    check(!!detail && detail.formen.includes(modell.id), `Falsche Dachzuordnung: ${variant}/${id}`);
    let bytes = 0;
    const model = await asset(`${variant}/${id}/modell.glb`);
    bytes += model?.length ?? 0;
    glb(model, `${variant}/${id}`, [id], false);
    for (const view of ["nah", "schnitt", "aufbau", "fehler"]) {
      const image = await asset(`${variant}/${id}/${view}.webp`);
      bytes += image?.length ?? 0;
      if (image) check(image.toString("utf8", 8, 12) === "WEBP", `Ungültiges Bild: ${variant}/${id}/${view}`);
      await preview(`${variant}/${id}-${view}.webp`);
    }
    maxDetail = Math.max(maxDetail, bytes);
    check(bytes <= 10 * 1024 * 1024, `Detailpaket größer als 10 MiB: ${variant}/${id}`);
  }
}
check(contexts === 104, `104 Dach-/Deckungs-/Detailkontexte erwartet, gefunden: ${contexts}`);
check(assets.size === 530, `530 Modelldateien und große Ansichten erwartet, gefunden: ${assets.size}`);
async function walk(dir) { return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))).flat(); }
const actual = await walk(join(root, "public/dach-medien/v1"));
check(actual.length === assets.size, "Medienverzeichnis und tatsächliche Dateien weichen voneinander ab.");
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Dachmedien geprüft: 34 Themen, ${contexts} Modellkontexte, ${assets.size} Dateien, ${(total / 1048576).toFixed(1)} MiB. Maximal ${maxTriangles} Dreiecke, Übersicht ${(maxOverview / 1048576).toFixed(2)} MiB, Detailpaket ${(maxDetail / 1048576).toFixed(2)} MiB.`);
