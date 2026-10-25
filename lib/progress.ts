import { appStorage } from "@/lib/lernSpeicher";
import type { AufgabenFortschritt, Bewertung, BewertungsKontext, LernVersuch } from "@/content/schema";
import { istFortschritt, istObjekt } from "@/lib/fortschrittDaten";

const KEY = "fortschritt-v1";
const TAG = 86_400_000;

/**
 * Wann kommt die Aufgabe wieder?
 *
 * Drei Äste, drei Wachstumsraten:
 *   falsch     → zurück auf 1 Tag. Nicht gekonnt heißt morgen wieder.
 *   teilweise  → Faktor 1,3. Langsam, aber es WÄCHST.
 *   richtig    → Faktor 2.
 *
 * Der mittlere Ast stand vorher auf `Math.max(1, intervallTage)` und wuchs
 * damit nie. Da der Startwert 0 ist (siehe speichereBewertung), landete jede
 * Aufgabe, die zuerst "teilweise" bekam, dauerhaft auf einem Tag Intervall —
 * sie kam jeden Abend wieder, egal wie oft man sie bearbeitete.
 *
 * Das traf vor allem, wo niemand etwas beschönigen kann: ClozeCard und
 * DiagramCard vergeben "teilweise" AUTOMATISCH bei Teilerfolg. Vier von fünf
 * Lücken richtig war also keine Teilleistung, sondern ein Dauerabo. Und weil
 * lib/reifegrad.ts solche Aufgaben mit 0,5 Punkten zählt, während
 * `tagesdosis()` mit `offen = gesamt − punkte` rechnet, hob jeder ehrliche
 * Teilerfolg zusätzlich die Tagesdosis an.
 */
export function naechsteFaelligkeit(b: Bewertung, intervallTage: number) {
  const next = Math.min(365,
    b === "falsch"
      ? 1
      : b === "teilweise"
        ? Math.max(2, Math.round(intervallTage * 1.3 || 2))
        : Math.max(2, Math.round(intervallTage * 2 || 2)));
  return { intervallTage: next, faelligAm: Date.now() + next * TAG };
}

export function ladeFortschritt(): Record<string, AufgabenFortschritt> {
  if (typeof window === "undefined") return {};
  try {
    const daten = JSON.parse(appStorage.getItem(KEY) || "{}");
    const valid: Record<string, AufgabenFortschritt> = {};
    if (istObjekt(daten)) {
      for (const [id, wert] of Object.entries(daten)) if (istFortschritt(wert, id)) valid[id] = wert;
    }
    return valid;
  } catch {
    return {};
  }
}

export function speichereBewertung(aufgabeId: string, bewertung: Bewertung, kontext: BewertungsKontext = {}) {
  const all = ladeFortschritt();
  const vorher = all[aufgabeId];
  const jetzt = kontext.am ?? Date.now();
  // Alte Einträge bleiben erhalten, liefern aber keine erfundene Erfolgshistorie.
  const verlauf: LernVersuch[] = [...(vorher?.verlauf ?? [])];
  if (kontext.versuchId && verlauf.some(v => v.versuchId === kontext.versuchId)) return;
  if (vorher && jetzt < vorher.gesehenAm) {
    // A recovered older exam may finish its history, never undo a newer schedule.
    verlauf.push({ ...kontext, am: jetzt, bewertung });
    all[aufgabeId] = { ...vorher, verlauf: verlauf.sort((a,b)=>a.am-b.am).slice(-60) };
    appStorage.setItem(KEY, JSON.stringify(all));
    return;
  }
  const letzter = verlauf.at(-1);
  const gleicherTag = letzter && new Date(letzter.am).toDateString() === new Date(jetzt).toDateString();
  const kurzfristig = bewertung === "richtig" && (kontext.nachErklaerung || gleicherTag);
  const versuch: LernVersuch = { am: jetzt, bewertung, ...kontext, nachErklaerung: !!kontext.nachErklaerung || !!kurzfristig };
  verlauf.push(versuch);
  // Mehrere Klicks am selben Tag oder unmittelbar nach Theorie verlängern nichts.
  if (vorher && kurzfristig) {
    all[aufgabeId] = { ...vorher, verlauf: verlauf.slice(-60) };
  } else {
    const prev = vorher?.intervallTage ?? 0;
    const fehler = verlauf.slice(-5).filter((v) => v.bewertung === "falsch").length;
    let { intervallTage } = naechsteFaelligkeit(bewertung, prev);
    if (bewertung === "teilweise" && gleicherTag) intervallTage = Math.min(Math.max(1, prev), 2);
    if (bewertung === "richtig" && (kontext.mitHilfe || kontext.nachErklaerung)) intervallTage = 1;
    else if (bewertung === "richtig" && fehler >= 2) intervallTage = Math.min(intervallTage, 3);
    all[aufgabeId] = {
      aufgabeId, bewertung, gesehenAm: jetzt, faelligAm: jetzt + intervallTage * TAG,
      intervallTage, verlauf: verlauf.slice(-60),
    };
  }
  appStorage.setItem(KEY, JSON.stringify(all));
}

export function loescheFortschritt() {
  if (typeof window === "undefined") return;
  appStorage.removeItem(KEY);
}

/** Fällig sind nur Aufgaben, die schon einmal bearbeitet wurden. */
export function istFaellig(f: AufgabenFortschritt | undefined, jetzt: number): boolean {
  return f !== undefined && f.faelligAm <= jetzt;
}
