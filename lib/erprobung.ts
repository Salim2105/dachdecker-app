import { appStorage } from "@/lib/lernSpeicher";

export const ERPROBUNG_KEY = "azubi-erprobung-v1";
export const ERPROBUNGS_AUFGABEN = [
  { id: "lernweg", titel: "Eine kurze Lerneinheit finden", route: "/lernen/lf07", auftrag: "Öffne LF7. Wähle eine kurze Einheit, lies das Lernziel und bearbeite den ersten Lernschritt.", kriterium: "Findet die Person selbst eine Einheit und kann sie in eigenen Worten sagen, was sie dort lernen soll?" },
  { id: "begriff", titel: "Einen Fachbegriff verstehen", route: "/lernen/lf07", auftrag: "Suche in einer Einheit einen unbekannten Fachbegriff. Öffne die Begriffshilfe und erkläre den Begriff anschließend mit einem eigenen Baustellenbeispiel.", kriterium: "Findet die Person die Hilfe? Wird der Begriff anhand des Beispiels verständlich? Den tatsächlich gewählten Begriff unten notieren." },
  { id: "mathe", titel: "Einen Rechenweg übertragen", route: "/grundlagen/mathe#flaechen", auftrag: "Bearbeite in Fachmathe die Einheit zu Flächen. Rechne danach für ein anderes Rechteck mit selbst gewählten Maßen und nenne die passende Einheit.", kriterium: "Kann die Person den Rechenweg auf neue Maße übertragen? Aufgedeckte Rechenhilfen und beobachtete Verwechslungen notieren." },
  { id: "deutsch", titel: "Einen Arbeitsauftrag genau lesen", route: "/sprache/deutsch", auftrag: "Wähle einen Arbeitsauftrag in Deutsch fürs Handwerk. Erkläre vor dem Antworten, was ausgeführt werden soll und welche Angaben dabei wichtig sind.", kriterium: "Versteht die Person den Auftrag ohne Erklärung durch die beobachtende Person? Unverständliche Wörter oder Sätze wörtlich notieren." },
  { id: "englisch", titel: "Eine englische Anweisung verstehen", route: "/sprache/englisch", auftrag: "Wähle in Baustellenenglisch eine kurze Anweisung. Sage auf Deutsch, was damit gemeint ist, und bearbeite die zugehörige Aufgabe.", kriterium: "Sind Worterklärungen auffindbar und verständlich? Vorwissen und tatsächlich benötigte Hilfe getrennt beschreiben." },
  { id: "pruefung", titel: "Ein Training unterbrechen und fortsetzen", route: "/pruefung", auftrag: "Starte ein LF7-Training ohne Zeitlimit. Beantworte eine Frage, markiere eine weitere und schließe das App-Fenster. Öffne die App erneut und setze den Versuch fort.", kriterium: "Sind Aufgaben, Antworten und Markierungen wieder da? Den gleichen Erprobungsmodus danach über den Übungsraum wieder öffnen." },
  { id: "zeichnen", titel: "Eine Zeichnung speichern und wiederfinden", route: "/zeichnen", auftrag: "Öffne eine Zeichenaufgabe. Zeichne eine Linie, ergänze eine Beschriftung und speichere. Wechsle den Bereich und öffne die Zeichnung wieder.", kriterium: "Findet die Person die Werkzeuge und ihre eigene Zeichnung wieder? Bei einem Fotovergleich ebenfalls Aufruf und Verständlichkeit der Vergleichskriterien beobachten." },
  { id: "sicherung", titel: "Eine vollständige Sicherung erstellen", route: "/fortschritt", auftrag: "Finde die Datensicherung und lade eine vollständige Sicherung herunter. Suche die Datei anschließend im Download-Ordner.", kriterium: "Versteht die Person, was gesichert wird und wo die Datei liegt? Ein Zurücksetzen oder Import ist für diese Aufgabe nicht erforderlich." },
] as const;

export type ErprobungsAufgabeId = typeof ERPROBUNGS_AUFGABEN[number]["id"];
export type BeobachtungsErgebnis = "offen" | "selbststaendig" | "mit_hilfe" | "nicht_gelungen";
export const BEOBACHTUNGS_LABEL: Record<BeobachtungsErgebnis, string> = {
  offen: "Noch nicht beobachtet", selbststaendig: "Selbstständig geschafft", mit_hilfe: "Mit Hilfe geschafft", nicht_gelungen: "Noch nicht geschafft",
};
export interface Beobachtung {
  ergebnis: BeobachtungsErgebnis;
  hilfe: string;
  begriffe: string;
  missverstaendnis: string;
  notiz: string;
  dauerSekunden: number | null;
}
export interface ErprobungsSitzung {
  id: string;
  code: string;
  angelegt: number;
  aufgabeId: ErprobungsAufgabeId;
  vorwissen: string;
  beobachtungen: Partial<Record<ErprobungsAufgabeId, Beobachtung>>;
}
export interface ErprobungsStand { version: 1; auswahl: string | null; sitzungen: ErprobungsSitzung[] }
export function leereErprobung(): ErprobungsStand { return { version: 1, auswahl: null, sitzungen: [] }; }
export function leereBeobachtung(): Beobachtung { return { ergebnis: "offen", hilfe: "", begriffe: "", missverstaendnis: "", notiz: "", dauerSekunden: null }; }
const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 5000): v is string => typeof v === "string" && v.length <= max;
const ergebnisse = new Set(Object.keys(BEOBACHTUNGS_LABEL));
const aufgaben = new Set<string>(ERPROBUNGS_AUFGABEN.map((a) => a.id));
function istBeobachtung(v: unknown): v is Beobachtung {
  return istObjekt(v) && typeof v.ergebnis === "string" && ergebnisse.has(v.ergebnis) &&
    [v.hilfe, v.begriffe, v.missverstaendnis, v.notiz].every((t) => text(t)) &&
    (v.dauerSekunden === null || (typeof v.dauerSekunden === "number" && Number.isInteger(v.dauerSekunden) && v.dauerSekunden >= 0 && v.dauerSekunden <= 86400));
}
/** Reject corrupt snapshots without writing over the original stored value. */
export function leseErprobung(raw: string | null): ErprobungsStand | null {
  if (raw === null) return leereErprobung();
  try {
    const s: unknown = JSON.parse(raw);
    if (!istObjekt(s) || s.version !== 1 || !Array.isArray(s.sitzungen) || (s.auswahl !== null && typeof s.auswahl !== "string")) return null;
    const ids = new Set<string>();
    for (const v of s.sitzungen) {
      if (!istObjekt(v) || !text(v.id, 150) || !v.id || ids.has(v.id) || !text(v.code, 80) || !text(v.vorwissen, 2000) || typeof v.aufgabeId !== "string" || !aufgaben.has(v.aufgabeId) || typeof v.angelegt !== "number" || !Number.isFinite(v.angelegt) || v.angelegt < 0 || v.angelegt > 8640000000000000 || !istObjekt(v.beobachtungen)) return null;
      ids.add(v.id);
      if (Object.entries(v.beobachtungen).some(([key, value]) => !aufgaben.has(key) || !istBeobachtung(value))) return null;
    }
    if (s.auswahl !== null && !ids.has(s.auswahl)) return null;
    return s as unknown as ErprobungsStand;
  } catch { return null; }
}
export function ladeErprobung(): ErprobungsStand | null { return leseErprobung(appStorage.getItem(ERPROBUNG_KEY)); }
export function speichereErprobung(stand: ErprobungsStand): void {
  if (!leseErprobung(JSON.stringify(stand))) throw new Error("Die Erprobungsdaten sind unvollständig.");
  appStorage.setItem(ERPROBUNG_KEY, JSON.stringify(stand));
}
export function neueErprobungsSitzung(stand: ErprobungsStand, code: string, jetzt = Date.now(), id = globalThis.crypto.randomUUID()): ErprobungsStand {
  if (stand.sitzungen.some((s) => s.id === id)) throw new Error("Diese Sitzung ist bereits vorhanden.");
  const sitzung: ErprobungsSitzung = { id, code: code.trim().slice(0, 80) || `Person ${String(stand.sitzungen.length + 1).padStart(2, "0")}`, angelegt: jetzt, aufgabeId: "lernweg", vorwissen: "", beobachtungen: {} };
  return { ...stand, auswahl: id, sitzungen: [...stand.sitzungen, sitzung] };
}
export function hatBeobachtung(b: Beobachtung | undefined): boolean {
  return !!b && (b.ergebnis !== "offen" || b.dauerSekunden !== null || [b.hilfe, b.begriffe, b.missverstaendnis, b.notiz].some((t) => !!t.trim()));
}
export function erprobungsAuswertung(sitzung: ErprobungsSitzung) {
  const werte = Object.values(sitzung.beobachtungen);
  return {
    erfasst: werte.filter(hatBeobachtung).length,
    selbststaendig: werte.filter((b) => b.ergebnis === "selbststaendig").length,
    mitHilfe: werte.filter((b) => b.ergebnis === "mit_hilfe").length,
    nichtGelungen: werte.filter((b) => b.ergebnis === "nicht_gelungen").length,
    ergebnisOffen: ERPROBUNGS_AUFGABEN.length - werte.filter((b) => b.ergebnis !== "offen").length,
  };
}
function exportBeobachtungen(s: ErprobungsSitzung) {
  return ERPROBUNGS_AUFGABEN.flatMap((a) => {
    const b = s.beobachtungen[a.id];
    return hatBeobachtung(b) ? [{ aufgabeId: a.id, aufgabe: a.titel, kriterium: a.kriterium, ...b! }] : [];
  });
}
/** Unperformed tasks are omitted; open outcomes with actual notes stay open. */
export function erprobungAlsJson(s: ErprobungsSitzung): string {
  return JSON.stringify({ format: "dachdecker-erprobung", version: 1, sitzung: { id: s.id, code: s.code, angelegt: s.angelegt, vorwissen: s.vorwissen }, beobachtungen: exportBeobachtungen(s) }, null, 2);
}
function csvFeld(v: string): string {
  // CSV may be opened in spreadsheet programs: keep notes as literal text.
  const sicher = /^[\s]*[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${sicher.replaceAll('"', '""')}"`;
}
export function erprobungAlsCsv(s: ErprobungsSitzung): string {
  const zeilen = [["Sitzung", "Angelegt (UTC)", "Vorwissen (Selbstauskunft)", "Aufgabe", "Ergebnis", "Hilfe", "Unbekannte Begriffe", "Missverständnis", "Beobachtungsnotiz", "Dauer (Sekunden)"]];
  for (const b of exportBeobachtungen(s)) zeilen.push([s.code, new Date(s.angelegt).toISOString(), s.vorwissen, b.aufgabe, BEOBACHTUNGS_LABEL[b.ergebnis!], b.hilfe!, b.begriffe!, b.missverstaendnis!, b.notiz!, b.dauerSekunden === null ? "" : String(b.dauerSekunden)]);
  return "\uFEFF" + zeilen.map((zeile) => zeile.map(csvFeld).join(";")).join("\r\n");
}
