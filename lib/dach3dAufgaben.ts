import type { BildAufgabe } from "@/lib/bildtraining";
import type { DachMedienRef } from "@/lib/dach3dTypen";
import { DACH_DETAILS } from "@/lib/dach3dInhalte";

export function istDachBildRef(v: unknown): v is DachMedienRef {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  const detail = DACH_DETAILS.find(d => d.id === r.detailId);
  return r.version === 1 && !!detail && detail.formen.includes(r.form as never) &&
    (r.form === "flachdach" ? r.deckung === "warmdach" : r.deckung === "falzziegel" || r.deckung === "biber-doppel") &&
    ["nah", "schnitt", "aufbau"].includes(String(r.ansicht));
}

export const DACH_WIEDERHOLUNGEN: BildAufgabe[] = DACH_DETAILS.flatMap(d => d.aufgaben.map(a => {
  const form = d.formen[0];
  return {
    id: a.id, version: a.version, projektId: form === "flachdach" ? "flachdach" : "ziegeldach", art: "massnahme",
    titel: `${d.titel}: ${a.titel}`, lernziel: d.funktion, lernzielIds: [...a.lernzielIds], lfIds: [...d.lfIds], minuten: 2,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><title>Die feste gerenderte Ansicht wird neben der Aufgabenbeschreibung angezeigt.</title></svg>',
    bildbeschreibung: `Eigene gerenderte ${a.ansicht === "schnitt" ? "Schnittansicht" : a.ansicht === "aufbau" ? "Aufbauansicht" : "Nahansicht"} des Lehrmodells: ${d.titel}. Verdeckte Zusammenhänge werden teilweise als geöffneter Lehrausschnitt gezeigt. Die Aufgabenstellung nennt die für deine Entscheidung erforderlichen Angaben.`,
    bildbereiche: [], medienRef: { version: 1, form, deckung: form === "flachdach" ? "warmdach" : "falzziegel", detailId: d.id, ansicht: a.ansicht },
    aktivitaet: { id: `${a.id}-auswahl`, version: a.version, typ: "baustellenfall", titel: a.titel,
      auftrag: "Wähle alle passenden Aussagen.", situation: a.frage,
      optionen: a.optionen.map(o => ({ ...o })), erklaerung: a.erklaerung },
  } satisfies BildAufgabe;
}));
export function getDachWiederholung(id: string): BildAufgabe | undefined { return DACH_WIEDERHOLUNGEN.find(a => a.id === id); }
export function dachWiederholungRoute(id: string): string | undefined {
  const a = getDachWiederholung(id);
  return a?.medienRef ? `/projekte#dach-${a.medienRef.form}-${a.medienRef.detailId}` : undefined;
}
