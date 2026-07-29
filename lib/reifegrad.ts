// Prüfungsreife und Tagesdosis — bewusst OHNE Zugriff auf die Aufgabeninhalte.
//
// Diese Trennung ist der ganze Zweck der Datei: Die Startseite zeigt Reife und
// Tagesdosis, braucht dafür aber keine einzige Aufgabe, sondern nur deren
// Gesamtzahl. Läge die Rechnung in lib/tagesplan.ts, zöge der Import dort die
// komplette Content-Registry mit — gemessen 2 MB Aufgabentext im Browser-Bundle,
// nur um bis 2027 zu zählen.
import anzahl from "@/content/anzahl.json";
import type { AufgabenFortschritt } from "@/content/schema";

const TAG = 86_400_000;

/** Untergrenze der Tagesdosis — unter 10 Aufgaben lohnt das Öffnen nicht. */
export const MIN_DOSIS = 10;
/** Obergrenze — mehr als das schafft niemand neben der Arbeit freiwillig. */
export const MAX_DOSIS = 60;

/**
 * Zerfallskonstante der Reife. Bei k = 0.8 ist nach einem versäumten Intervall
 * noch knapp die Hälfte übrig, nach zweien rund ein Fünftel.
 */
const K_VERFALL = 0.8;
/** Unterhalb dieses Rests gilt eine Aufgabe als vergessen. */
const REST_SCHWELLE = 0.01;

/** Gesamtzahl sichtbarer Aufgaben, erzeugt von scripts/gen-anzahl.mjs. */
export const GESAMT_AUFGABEN: number = anzahl.gesamt;

/**
 * Reifegrad einer einzelnen Aufgabe zwischen 0 und 1.
 *
 * Eine richtig beantwortete Aufgabe startet bei 1 und verfällt exponentiell,
 * sobald sie überfällig ist — so wie Vergessen tatsächlich verläuft: anfangs
 * schnell, dann immer flacher. Eine lineare Kurve behauptet dagegen, der
 * letzte Tag vor dem Nullpunkt koste so viel Wissen wie der erste, und lässt
 * eine Aufgabe schlagartig wertlos werden. Wer zwei Wochen nicht übt, hat
 * nicht alles vergessen.
 */
export function reife(f: AufgabenFortschritt | undefined, jetzt: number): number {
  if (!f) return 0;
  const basis = f.bewertung === "richtig" ? 1 : f.bewertung === "teilweise" ? 0.5 : 0;
  if (basis === 0) return 0;

  const ueberfaelligMs = jetzt - f.faelligAm;
  if (ueberfaelligMs <= 0) return basis;

  // Gemessen in Wiederholungsintervallen, nicht in Tagen: Wer eine Aufgabe
  // alle 30 Tage wiederholt, darf sie länger liegen lassen als eine tägliche.
  const intervalle = ueberfaelligMs / TAG / Math.max(1, f.intervallTage);
  const rest = Math.exp(-K_VERFALL * intervalle);
  return rest > REST_SCHWELLE ? basis * rest : 0;
}

export interface Reifegrad {
  /** Anteil 0..1 über alle sichtbaren Aufgaben. */
  anteil: number;
  /** Summe der Reifepunkte (kann Bruchteile enthalten). */
  punkte: number;
  gesamt: number;
  /** Aufgaben, die jetzt zur Wiederholung anstehen. */
  faellig: number;
  /** Aufgaben, die noch nie bearbeitet wurden. */
  neu: number;
}

/**
 * Reife über den gesamten Stoff.
 *
 * Gerechnet wird über die Fortschrittseinträge, nicht über die Aufgabenliste:
 * Unbearbeitete Aufgaben tragen ohnehin null bei, sie müssen nur gezählt
 * werden. Einträge zu inzwischen entfernten Aufgaben verschieben das Ergebnis
 * minimal — deshalb wird `neu` bei null abgefangen.
 */
export function pruefungsreife(
  fortschritt: Record<string, AufgabenFortschritt>,
  jetzt: number,
  gesamt: number = GESAMT_AUFGABEN,
): Reifegrad {
  let punkte = 0;
  let faellig = 0;
  let bearbeitet = 0;

  for (const f of Object.values(fortschritt)) {
    bearbeitet++;
    punkte += reife(f, jetzt);
    if (f.faelligAm <= jetzt) faellig++;
  }

  return {
    anteil: gesamt > 0 ? punkte / gesamt : 0,
    punkte,
    gesamt,
    faellig,
    neu: Math.max(0, gesamt - bearbeitet),
  };
}

/**
 * Wie viele Aufgaben heute dran sind.
 *
 * Grundlage ist der Prüfungstermin: was noch nicht sitzt, geteilt durch die
 * verbleibenden Tage. Ohne Termin bleibt es bei der Mindestdosis. Der letzte
 * Tag bekommt keine 500 Aufgaben aufgehalst — MAX_DOSIS deckelt.
 */
export function tagesdosis(reifegrad: Reifegrad, tageBis: number | null): number {
  const offen = reifegrad.gesamt - reifegrad.punkte;
  if (tageBis === null || tageBis <= 0) return MIN_DOSIS;
  const proTag = Math.ceil(offen / tageBis);
  return Math.min(MAX_DOSIS, Math.max(MIN_DOSIS, proTag));
}
