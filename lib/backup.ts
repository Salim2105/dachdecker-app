// Lernstand sichern & wiederherstellen. Fortschritt, Prüfungsdatum, zuletzt
// gelerntes LF und Theme leben nur im localStorage — ohne Backup sind sie bei
// Gerätewechsel oder gelöschtem Cache weg. Darum eine Export-/Import-Datei.
import { istFortschritt, istObjekt } from "@/lib/fortschrittDaten";
import { lesePraxis } from "@/lib/praxisStore";
import { leseLernwege } from "@/lib/lernweg";

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
    const v = localStorage.getItem(k);
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
      ? Object.keys(localStorage).filter((k) => k.startsWith("dd-session-") || k === "letzte-session") : [];
    for (const k of Object.keys(sicherung.daten)) vorher.set(k, localStorage.getItem(k));
    for (const k of runden) vorher.set(k, localStorage.getItem(k));
    for (const [k, v] of Object.entries(sicherung.daten)) {
      localStorage.setItem(k, v);
    }
    for (const k of runden) localStorage.removeItem(k);
    return Object.keys(sicherung.daten).length;
  } catch {
    for (const [k, v] of vorher) {
      try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {}
    }
    return null;
  }
}
