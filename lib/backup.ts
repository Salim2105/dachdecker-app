// Lernstand sichern & wiederherstellen. Fortschritt, Prüfungsdatum, zuletzt
// gelerntes LF und Theme leben nur im localStorage — ohne Backup sind sie bei
// Gerätewechsel oder gelöschtem Cache weg. Darum eine Export-/Import-Datei.
const KEYS = ["fortschritt-v1", "pruefungsdatum", "letztesLf", "theme"];
const MARKER = "dachdecker-lernstand";

export function exportiereDaten(): string {
  const daten: Record<string, string> = {};
  for (const k of KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) daten[k] = v;
  }
  return JSON.stringify({ app: MARKER, version: 1, exportiertAm: new Date().toISOString(), daten }, null, 2);
}

// Gibt die Anzahl übernommener Schlüssel zurück, oder null bei ungültiger Datei.
export function importiereDaten(text: string): number | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as { app?: unknown; daten?: unknown };
  if (p.app !== MARKER || typeof p.daten !== "object" || p.daten === null) return null;

  let uebernommen = 0;
  for (const [k, v] of Object.entries(p.daten as Record<string, unknown>)) {
    if (KEYS.includes(k) && typeof v === "string") {
      localStorage.setItem(k, v);
      uebernommen++;
    }
  }
  return uebernommen;
}
