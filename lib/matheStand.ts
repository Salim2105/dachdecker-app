import { MATHE_EINHEITEN, pruefeMathe, type MatheErgebnis } from "@/lib/matheGrundlagen";
import { appStorage } from "@/lib/lernSpeicher";
import { validReviewResult, type ReviewResult } from "@/lib/review";

export interface MatheAntwort { wert: string; einheit: string; hilfen: string[]; ergebnis?: MatheErgebnis; reviewResult?: ReviewResult }
export interface MatheStand { version: 1; index: number; notiz: string; antworten: Record<string, MatheAntwort>; abgeschlossen: boolean; reviewPending?: ReviewResult[] }
export const matheKey = (id: string) => `fachmathe-${id}-v1`;
export function leseMatheStand(id: string): MatheStand {
  const e = MATHE_EINHEITEN.find((m) => m.id === id);
  const leer: MatheStand = { version: 1, index: 0, notiz: "", antworten: {}, abgeschlossen: false };
  if (!e) return leer;
  try {
    const s = JSON.parse(appStorage.getItem(matheKey(id)) || "null");
    if (!s || s.version !== 1 || !Number.isInteger(s.index) || s.index < 0 || s.index >= e.fragen.length || typeof s.notiz !== "string" || typeof s.abgeschlossen !== "boolean" || !s.antworten || typeof s.antworten !== "object" || Array.isArray(s.antworten)) return leer;
    if (s.reviewPending !== undefined && (!Array.isArray(s.reviewPending) || !s.reviewPending.every((r:unknown)=>validReviewResult(r)&&r.ref.quelle==="mathe"&&e.fragen.some(f=>f.id===r.ref.id)))) return leer;
    for (const [key, v] of Object.entries(s.antworten) as [string, MatheAntwort][]) {
      if (!e.fragen.some((f) => f.id === key) || !v || typeof v.wert !== "string" || typeof v.einheit !== "string" || !Array.isArray(v.hilfen) || !v.hilfen.every((h) => typeof h === "string")) return leer;
      if (v.ergebnis) { const f = e.fragen.find((f) => f.id === key)!; const geprueft = pruefeMathe(f, v.wert, v.einheit); if (!geprueft) return leer; v.ergebnis = geprueft; }
      if (v.reviewResult && (!validReviewResult(v.reviewResult) || v.reviewResult.ref.quelle !== "mathe" || v.reviewResult.ref.id !== key || !v.ergebnis || v.reviewResult.bewertung !== (v.ergebnis.richtig ? "richtig" : "falsch"))) return leer;
    }
    s.abgeschlossen = s.abgeschlossen && e.fragen.every((f) => !!s.antworten[f.id]?.ergebnis);
    return s;
  } catch { return leer; }
}
