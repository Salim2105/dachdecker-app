// Keine Renderer-Pfade oder frei wählbaren Befehle: nur validierte Fotobytes.
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const runFile = promisify(execFile);
const MAX_INPUT = 20 * 1024 * 1024;
const MAX_OUTPUT = 32 * 1024 * 1024;

function validiereHeic(payload) {
  if (!payload || typeof payload !== "object" || Object.keys(payload).some((k) => !["bytes", "name"].includes(k)) || typeof payload.name !== "string" || !payload.name.length || payload.name.length > 255 || /[\\/\0]/.test(payload.name)) throw new Error("Ungültige Fotodatei.");
  const daten = payload.bytes instanceof ArrayBuffer ? new Uint8Array(payload.bytes) : payload.bytes instanceof Uint8Array ? payload.bytes : null;
  if (!daten || daten.byteLength < 16 || daten.byteLength > MAX_INPUT) throw new Error("HEIC-Fotos müssen kleiner als 20 MB sein.");
  const bytes = Buffer.from(daten);
  if (bytes.toString("ascii", 4, 8) !== "ftyp") throw new Error("Die Datei ist kein HEIC-Foto.");
  const ende = Math.min(bytes.readUInt32BE(0), bytes.length, 256);
  let passt = false;
  for (let i = 8; i + 4 <= ende; i += 4) {
    if (i !== 12 && ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(bytes.toString("ascii", i, i + 4))) passt = true;
  }
  if (!passt) throw new Error("Die Datei ist kein unterstütztes HEIC-Foto.");
  return bytes;
}

async function convertHeicToPng(payload, options = {}) {
  const bytes = validiereHeic(payload);
  if ((options.platform || process.platform) !== "darwin") throw new Error("HEIC-Umwandlung steht nur in der Mac-App zur Verfügung.");
  const run = options.runFile || runFile;
  const verzeichnis = await fs.mkdtemp(path.join(options.tempRoot || os.tmpdir(), "dachdecker-heic-"));
  try {
    const eingang = path.join(verzeichnis, "original.heic");
    const ausgang = path.join(verzeichnis, "anzeige.png");
    await fs.writeFile(eingang, bytes, { mode: 0o600 });
    const { stdout } = await run("/usr/bin/sips", ["-g", "pixelWidth", "-g", "pixelHeight", eingang], { timeout: 30000, maxBuffer: 1024 * 1024, windowsHide: true });
    const breite = Number(/pixelWidth:\s*(\d+)/.exec(stdout)?.[1]);
    const hoehe = Number(/pixelHeight:\s*(\d+)/.exec(stdout)?.[1]);
    if (!breite || !hoehe || breite > 16000 || hoehe > 16000 || breite * hoehe > 80_000_000) throw new Error("Das Foto hat zu viele Bildpunkte. Exportiere es in Vorschau als kleineres JPEG.");
    await run("/usr/bin/sips", ["-s", "format", "png", "--resampleHeightWidthMax", "2400", eingang, "--out", ausgang], { timeout: 30000, maxBuffer: 1024 * 1024, windowsHide: true });
    const info = await fs.stat(ausgang);
    if (!info.isFile() || info.size > MAX_OUTPUT) throw new Error("Das umgewandelte Foto ist zu groß.");
    const png = await fs.readFile(ausgang);
    if (png.length < 8 || !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("Das HEIC-Foto konnte nicht in PNG umgewandelt werden.");
    return { bytes: new Uint8Array(png), mime: "image/png" };
  } finally {
    await fs.rm(verzeichnis, { recursive: true, force: true });
  }
}
module.exports = { validiereHeic, convertHeicToPng };
