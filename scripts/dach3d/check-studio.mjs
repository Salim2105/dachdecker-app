import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { version, assets } = JSON.parse(await readFile(join(root, "content/dach3d-studio-medien.json"), "utf8"));
const legacy = JSON.parse(await readFile(join(root, "content/dach3d-medien.json"), "utf8"));
const variants = ["steildach-falzziegel", "steildach-biber-doppel", "walmdach-falzziegel", "walmdach-biber-doppel", "flachdach-warmdach"];
if (version !== 2 || !Array.isArray(assets) || assets.length !== 531 || new Set(assets.map(a => a.id)).size !== assets.length || new Set(assets.map(a => a.url)).size !== assets.length) throw new Error("Ungültiges oder unvollständiges Studio-Verzeichnis.");
const byId = new Map(assets.map(a => [a.id, a]));
for (const a of legacy.assets) if (!byId.has(`v2/${a.id}`)) throw new Error(`Studio-Kontext fehlt: ${a.id}`);
let maximum = 0, triangles = 0, modelCount = 0, imageCount = 0, maximumDetail = 0;
const detailPackages = new Map();
async function files(folder) { return (await Promise.all((await readdir(folder, { withFileTypes: true })).map(e => e.isDirectory() ? files(join(folder, e.name)) : [join(folder, e.name)]))).flat(); }
if ((await files(join(root, "public/dach-medien/v2"))).length !== assets.length) throw new Error("Studio-Verzeichnis und tatsächliche Mediendateien weichen ab.");
if ((await files(join(root, "public/dach-vorschau/v2"))).length !== 421) throw new Error("Die 421 Offline-Vorschaubilder sind unvollständig.");
for (const v of variants) {
  for (const type of ["glb", "webp"]) if (!assets.some(a => a.id === `v2/${v}/uebersicht.${type}`)) throw new Error(`Studio-Ansicht fehlt: ${v}/${type}`);
  const preview = await readFile(join(root, `public/dach-vorschau/v2/${v}/uebersicht.webp`));
  if (preview.toString("utf8", 8, 12) !== "WEBP" || preview.length > 140000) throw new Error(`Ungültige Studio-Vorschau ${v}`);
}
for (const a of assets) {
  if (!/^v2\/(?:[a-z0-9_-]+\/)+[a-z0-9_-]+\.(?:glb|webp|hdr|png|jpe?g|ktx2)$/.test(a.id) || a.url !== `/dach-medien/${a.id}`) throw new Error(`Ungültiger Studio-Pfad ${a.id}`);
  const data = await readFile(join(root, "public/dach-medien", a.id));
  if (data.length !== a.bytes || createHash("sha256").update(data).digest("hex") !== a.sha256) throw new Error(`Studio-Prüfsumme weicht ab: ${a.id}`);
  if (a.typ !== (a.id.endsWith(".glb") ? "modell" : a.id.endsWith(".hdr") ? "umgebung" : "bild")) throw new Error(`Falscher Studio-Medientyp: ${a.id}`);
  const detail = /^v2\/([^/]+)\/([a-z][0-9]{2})\/[^/]+$/.exec(a.id);
  if (detail) {
    const key = `${detail[1]}/${detail[2]}`;
    detailPackages.set(key, (detailPackages.get(key) ?? 0) + a.bytes);
  }
  if (a.id.endsWith(".webp")) {
    imageCount++;
    if (data.toString("utf8", 0, 4) !== "RIFF" || data.toString("utf8", 8, 12) !== "WEBP") throw new Error(`Ungültiges Studio-Bild ${a.id}`);
    const previewId = detail ? `${detail[1]}/${detail[2]}-${a.id.split("/").at(-1)}` : a.id.slice(3);
    const preview = await readFile(join(root, "public/dach-vorschau/v2", previewId));
    if (preview.toString("utf8", 0, 4) !== "RIFF" || preview.toString("utf8", 8, 12) !== "WEBP" || preview.length > 140000) throw new Error(`Ungültige Offline-Vorschau ${previewId}`);
  }
  if (a.id.endsWith(".glb")) {
    modelCount++;
    if (data.toString("utf8", 0, 4) !== "glTF" || data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) throw new Error(`Ungültiges Studio-GLB ${a.id}`);
    const doc = JSON.parse(data.toString("utf8", 20, 20 + data.readUInt32LE(12)).trim());
    const original = await readFile(join(root, "public/dach-medien/v1", a.id.slice(3)));
    const alt = JSON.parse(original.toString("utf8", 20, 20 + original.readUInt32LE(12)).trim());
    const anker = alt.nodes.filter(n => n.extras?.hotspot).map(n => n.extras.detail_id);
    if (anker.some(id => !doc.nodes.some(n => n.extras?.hotspot && n.extras.detail_id === id))) throw new Error(`Studio-Modell verliert Bauteilauswahl: ${a.id}`);
    if (detail && !doc.nodes.some(n => n.extras?.detail_id === detail[2])) throw new Error(`Studio-Detail verliert seine Bauteilzuordnung: ${a.id}`);
    const meshCounts = doc.meshes.map(m => m.primitives.reduce((sum, p) => sum + doc.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0));
    const count = doc.nodes.reduce((sum, n) => sum + (n.mesh === undefined ? 0 : meshCounts[n.mesh]), 0);
    if (data.length > 6 * 1048576 || count <= 0 || count > 100000) throw new Error(`Studio-Modell überschreitet Budget: ${a.id} (${data.length} Bytes, ${count} Dreiecke)`);
    if ((doc.images ?? []).some(i => i.uri) || doc.buffers.some(b => b.uri)) throw new Error(`Externe Studio-Modellressourcen: ${a.id}`);
    maximum = Math.max(maximum, data.length); triangles = Math.max(triangles, count);
  }
}
if (modelCount !== 109 || imageCount !== 421 || detailPackages.size !== 104) throw new Error("109 Modelle, 421 Ansichten und 104 vollständige Detailkontexte sind erforderlich.");
for (const [id, bytes] of detailPackages) {
  maximumDetail = Math.max(maximumDetail, bytes);
  if (bytes > 10 * 1048576) throw new Error(`Studio-Detailpaket überschreitet 10 MiB: ${id}`);
}
const env = assets.find(a => a.id === "v2/gemeinsam/royal_esplanade_1k.hdr");
if (!env || env.sha256 !== "d72031e24581a0f13911fbcdee475db0f8cafcf48bf1771c6b971c3310db6cb2") throw new Error("Die geprüfte CC0-Lichtumgebung fehlt oder wurde verändert.");
console.log(`Studio geprüft: 5 Dachvarianten, 104 Detailkontexte, ${assets.length} Mediendateien, 421 Offline-Vorschauen. Maximal ${(maximum / 1048576).toFixed(2)} MiB / ${triangles} Dreiecke pro Modell, ${(maximumDetail / 1048576).toFixed(2)} MiB pro Detailpaket.`);
