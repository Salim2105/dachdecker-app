// Legacy JSON backups remain importable; complete v2 ZIPs also contain drafts and images.
import { istFortschritt, istObjekt } from "@/lib/fortschrittDaten";
import { lesePraxis } from "@/lib/praxisStore";
import { leseLernwege } from "@/lib/lernweg";
import { appStorage, restoreStorage, snapshotStorage, type StorageSnapshot } from "@/lib/lernSpeicher";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

const BEREICHE: Record<string, string> = {
  "fortschritt-v1": "Aufgaben-Lernstand", pruefungsdatum: "Prüfungstermin", letztesLf: "Letztes Lernfeld",
  theme: "Darstellung", lernzeit: "Lernzeit", "praxis-v1": "Praxisübungen", "lernweg-v1": "Geführter Lernweg",
  "lernweg-thema": "Ausgewählte Lerneinheit", wortbank: "Wortbank", "ton-aus": "Ton",
};
const KEYS = Object.keys(BEREICHE);
const MARKER = "dachdecker-lernstand";

export function exportiereDaten(): string {
  const daten: Record<string, string> = {};
  for (const k of KEYS) {
    const v = appStorage.getItem(k);
    if (v !== null) daten[k] = v;
  }
  return JSON.stringify({ app: MARKER, version: 1, exportiertAm: new Date().toISOString(), daten }, null, 2);
}

export interface Sicherung { daten: Record<string, string>; bereiche: string[] }

/** Prüft die ganze Datei vor dem ersten Schreibzugriff. */
export function pruefeSicherung(text: string): Sicherung | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!istObjekt(parsed) || parsed.app !== MARKER || (parsed.version !== undefined && parsed.version !== 1) || !istObjekt(parsed.daten)) return null;
  const daten: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.daten)) {
    if (!KEYS.includes(k)) continue;
    if (typeof v !== "string") return null;
    if (["fortschritt-v1", "praxis-v1", "lernweg-v1"].includes(k)) {
      let inhalt: unknown;
      try { inhalt = JSON.parse(v); } catch { return null; }
      if (!istObjekt(inhalt)) return null;
      if (k === "fortschritt-v1" && !Object.entries(inhalt).every(([id, f]) => istFortschritt(f, id))) return null;
      if (k !== "fortschritt-v1") {
        const valid = k === "praxis-v1" ? lesePraxis(v) : leseLernwege(v);
        if (!Object.keys(inhalt).every((id) => Object.hasOwn(valid, id))) return null;
      }
    }
    if (k === "theme" && !["dark", "light"].includes(v)) return null;
    if (k === "lernzeit" && !["5", "15", "30"].includes(v)) return null;
    if (k === "wortbank" && !["", "1"].includes(v)) return null;
    if (k === "ton-aus" && !["", "0"].includes(v)) return null;
    if (k === "pruefungsdatum" && v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v)) return null;
    daten[k] = v;
  }
  return { daten, bereiche: Object.keys(daten).map((k) => BEREICHE[k]) };
}

// Gibt die Anzahl übernommener Schlüssel zurück, oder null bei einem Fehler.
export function importiereDaten(text: string): number | null {
  const sicherung = pruefeSicherung(text);
  if (!sicherung) return null;
  const vorher = new Map<string, string | null>();
  try {
    const runden = Object.hasOwn(sicherung.daten, "fortschritt-v1")
      ? Object.keys(appStorage).filter((k) => k.startsWith("dd-session-") || k === "letzte-session") : [];
    for (const k of Object.keys(sicherung.daten)) vorher.set(k, appStorage.getItem(k));
    for (const k of runden) vorher.set(k, appStorage.getItem(k));
    for (const [k, v] of Object.entries(sicherung.daten)) {
      appStorage.setItem(k, v);
    }
    for (const k of runden) appStorage.removeItem(k);
    return Object.keys(sicherung.daten).length;
  } catch {
    for (const [k, v] of vorher) {
      try { if (v === null) appStorage.removeItem(k); else appStorage.setItem(k, v); } catch {}
    }
    return null;
  }
}

interface DateiEintrag { key: string; datei: string; typ: string; groesse: number }
export interface VollstaendigeSicherung extends Sicherung {
  version: 1 | 2;
  dateien: Map<string, Blob>;
  exportiertAm: string | null;
}
const MAX_ARCHIV = 256 * 1024 * 1024;
const MAX_EINTRAEGE = 10_000;
const unsichereKeys = new Set(["__proto__", "prototype", "constructor"]);

/** Returns bytes rather than a browser-only download, so archives are testable. */
export async function exportiereArchiv(): Promise<Uint8Array> {
  const snapshot = await snapshotStorage();
  const files: Record<string, Uint8Array> = Object.create(null);
  const dateien: DateiEintrag[] = [];
  let total = 0;
  for (const [key, blob] of snapshot.dateien) {
    total += blob.size;
    if (total > MAX_ARCHIV || dateien.length + 2 > MAX_EINTRAEGE) throw new Error("Die Sicherung überschreitet 256 MB oder enthält zu viele Dateien.");
    const datei = `dateien/${dateien.length}.bin`;
    files[datei] = new Uint8Array(await blob.arrayBuffer());
    dateien.push({ key, datei, typ: blob.type, groesse: blob.size });
  }
  files["sicherung.json"] = strToU8(JSON.stringify({ app: MARKER, version: 2, exportiertAm: new Date().toISOString(), daten: snapshot.daten, dateien }));
  if (total + files["sicherung.json"].length > MAX_ARCHIV || files["sicherung.json"].length > 32 * 1024 * 1024) throw new Error("Die Sicherung ist zu groß.");
  return zipSync(files, { level: 6 });
}

/** Validates every archive entry before any device data is changed. */
export function pruefeArchiv(bytes: Uint8Array): VollstaendigeSicherung | null {
  if (!bytes.length || bytes.byteLength > MAX_ARCHIV) return null;
  // Old JSON may have a BOM or leading whitespace.
  const beginning = strFromU8(bytes.subarray(0, Math.min(128, bytes.length))).replace(/^\uFEFF/, "").trimStart();
  if (beginning.startsWith("{")) {
    const text = strFromU8(bytes).replace(/^\uFEFF/, "");
    const legacy = pruefeSicherung(text);
    return legacy ? { ...legacy, version: 1, dateien: new Map(), exportiertAm: null } : null;
  }
  try {
    let total = 0;
    let count = 0;
    const files = unzipSync(bytes, { filter: (file) => {
      total += file.originalSize;
      if (++count > MAX_EINTRAEGE || total > MAX_ARCHIV || !/^(sicherung\.json|dateien\/\d+\.bin)$/.test(file.name)) throw new Error("Ungültiges Archiv.");
      return true;
    } });
    if (!files["sicherung.json"] || files["sicherung.json"].length > 32 * 1024 * 1024) return null;
    const parsed: unknown = JSON.parse(strFromU8(files["sicherung.json"]));
    if (!istObjekt(parsed) || parsed.app !== MARKER || parsed.version !== 2 || !istObjekt(parsed.daten) || !Array.isArray(parsed.dateien)) return null;
    const daten: Record<string, string> = Object.create(null);
    for (const [key, value] of Object.entries(parsed.daten)) {
      if (!key || key.length > 512 || unsichereKeys.has(key) || typeof value !== "string") return null;
      daten[key] = value;
    }
    // Apply the existing stronger validation to all known legacy areas too.
    const validated = pruefeSicherung(JSON.stringify({ app: MARKER, version: 1, daten }));
    if (!validated) return null;
    const dateien = new Map<string, Blob>();
    const paths = new Set<string>(["sicherung.json"]);
    for (const entry of parsed.dateien) {
      if (!istObjekt(entry) || typeof entry.key !== "string" || !entry.key || entry.key.length > 512 || unsichereKeys.has(entry.key)
        || typeof entry.datei !== "string" || !/^dateien\/\d+\.bin$/.test(entry.datei) || paths.has(entry.datei) || dateien.has(entry.key)
        || typeof entry.typ !== "string" || entry.typ.length > 200 || !Number.isSafeInteger(entry.groesse) || Number(entry.groesse) < 0) return null;
      const data = files[entry.datei];
      if (!data || data.length !== entry.groesse) return null;
      // Copy to an ordinary ArrayBuffer (also accepted by older WebKit Blob).
      dateien.set(entry.key, new Blob([Uint8Array.from(data).buffer], { type: entry.typ }));
      paths.add(entry.datei);
    }
    if (Object.keys(files).some((path) => !paths.has(path))) return null;
    const weitere = Object.keys(daten).filter((key) => !KEYS.includes(key));
    const bereiche = [...validated.bereiche];
    if (weitere.length) bereiche.push(`Entwürfe, Prüfungen und weitere Einstellungen (${weitere.length})`);
    if (dateien.size) bereiche.push(`Zeichnungen und Fotos (${dateien.size})`);
    return { daten, bereiche, dateien, version: 2, exportiertAm: typeof parsed.exportiertAm === "string" ? parsed.exportiertAm : null };
  } catch { return null; }
}

/** The preview itself cannot mutate data. Restore commits strings and blobs together. */
export async function importiereArchiv(sicherung: VollstaendigeSicherung): Promise<number> {
  // Revalidate objects passed by callers; the file preview is not a trust boundary.
  if (sicherung.version !== 1 && sicherung.version !== 2) throw new Error("Unbekannte Sicherung.");
  for (const [key, value] of Object.entries(sicherung.daten)) {
    if (!key || unsichereKeys.has(key) || typeof value !== "string") throw new Error("Ungültiger Lernstand.");
  }
  if (!pruefeSicherung(JSON.stringify({ app: MARKER, daten: sicherung.daten }))) throw new Error("Ungültiger Lernstand.");
  const removeKeys = sicherung.version === 1 && Object.hasOwn(sicherung.daten, "fortschritt-v1")
    ? Object.keys(appStorage).filter((key) => key.startsWith("dd-session-") || key === "letzte-session") : [];
  const snapshot: StorageSnapshot = { daten: sicherung.daten, dateien: sicherung.dateien };
  await restoreStorage(snapshot, removeKeys);
  return Object.keys(sicherung.daten).length + sicherung.dateien.size;
}
