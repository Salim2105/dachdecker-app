// Tagesplan: was heute dran ist, und wie prüfungsreif du wirklich bist.
//
// Zwei bewusste Entscheidungen, die von einem reinen Fortschrittsbalken abweichen:
//
// 1. Die Prüfungsreife KANN SINKEN. Ein Balken, der nur steigt, misst
//    Aktivität statt Wissen — bearbeitete Aufgaben sagen nichts darüber aus,
//    ob du den Stoff morgen noch abrufen kannst. Hier verfällt eine Aufgabe,
//    sobald sie überfällig wird, und ist nach dem doppelten Wiederholungs-
//    intervall wieder bei null. Fallende Reife ist das Signal, das zurückholt.
//
// 2. Die Auswahl wird dir abgenommen. Wer selbst wählt, wählt das Vertraute
//    (LF1–3) und rührt die späten Lernfelder nie an. "Heute dran" mischt
//    fällige Wiederholungen mit neuen Aufgaben aus dem SCHWÄCHSTEN Lernfeld.
import type { Aufgabe, AufgabenFortschritt } from "@/content/schema";
import { getAufgaben, getLernfelder } from "@/lib/content";

const TAG = 86_400_000;

/** Untergrenze der Tagesdosis — unter 10 Aufgaben lohnt das Öffnen nicht. */
export const MIN_DOSIS = 10;
/** Obergrenze — mehr als das schafft niemand neben der Arbeit freiwillig. */
export const MAX_DOSIS = 60;

/**
 * Reifegrad einer einzelnen Aufgabe zwischen 0 und 1.
 *
 * Eine richtig beantwortete Aufgabe startet bei 1 und verfällt linear, sobald
 * sie überfällig ist: nach dem doppelten Intervall ist sie zurück auf 0. Damit
 * bildet der Wert ab, was Vergessen tatsächlich tut — er hält nicht ewig.
 */
export function reife(f: AufgabenFortschritt | undefined, jetzt: number): number {
  if (!f) return 0;
  const basis = f.bewertung === "richtig" ? 1 : f.bewertung === "teilweise" ? 0.5 : 0;
  if (basis === 0) return 0;

  const ueberfaelligMs = jetzt - f.faelligAm;
  if (ueberfaelligMs <= 0) return basis;

  // Verfallsfenster: doppelt so lang wie das aktuelle Wiederholungsintervall.
  const fenster = Math.max(1, f.intervallTage) * 2 * TAG;
  const rest = 1 - ueberfaelligMs / fenster;
  return rest > 0 ? basis * rest : 0;
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

export function pruefungsreife(
  fortschritt: Record<string, AufgabenFortschritt>,
  jetzt: number,
): Reifegrad {
  let punkte = 0;
  let gesamt = 0;
  let faellig = 0;
  let neu = 0;

  for (const lf of getLernfelder()) {
    for (const a of getAufgaben(lf.id)) {
      gesamt++;
      const f = fortschritt[a.id];
      punkte += reife(f, jetzt);
      if (!f) neu++;
      else if (f.faelligAm <= jetzt) faellig++;
    }
  }
  return { anteil: gesamt > 0 ? punkte / gesamt : 0, punkte, gesamt, faellig, neu };
}

/** Reifeanteil eines einzelnen Lernfelds — für die Auswahl des schwächsten. */
export function lernfeldReife(
  lfId: string,
  fortschritt: Record<string, AufgabenFortschritt>,
  jetzt: number,
): number {
  const aufgaben = getAufgaben(lfId);
  if (aufgaben.length === 0) return 1;
  let punkte = 0;
  for (const a of aufgaben) punkte += reife(fortschritt[a.id], jetzt);
  return punkte / aufgaben.length;
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

/**
 * Verkettete Aufgaben bauen aufeinander auf: das Ergebnis von Schritt n ist
 * die Eingabe von n+1 (λ → R → U). Sie dürfen nie in Einzelschritte zerlegt
 * werden — wer nur die Schritte übt, kann jeden einzelnen und scheitert
 * trotzdem an der Aufgabe. Sie gehören in die ruhige Session, nicht in die
 * Baustellenpause.
 */
export function istVerkettet(a: Aufgabe): boolean {
  return a.typ === "calc" && a.schritte.length > 1;
}

export type Modus = "kurz" | "tief" | "alles";

/**
 * Stellt die heutige Auswahl zusammen: erst die überfälligsten Wiederholungen,
 * dann neue Aufgaben aus dem schwächsten Lernfeld.
 *
 * `modus` filtert nach Inhaltsart: "kurz" lässt verkettete Rechenaufgaben weg
 * (Baustellenpause), "tief" zeigt nur sie (abends, mit Ruhe).
 */
export function heuteAufgaben(
  fortschritt: Record<string, AufgabenFortschritt>,
  jetzt: number,
  anzahl: number,
  modus: Modus = "alles",
): Aufgabe[] {
  const passt = (a: Aufgabe) =>
    modus === "alles" ? true : modus === "tief" ? istVerkettet(a) : !istVerkettet(a);

  // Lernfelder nach Reife aufsteigend — das schwächste zuerst.
  const felder = getLernfelder()
    .map((lf) => ({ id: lf.id, r: lernfeldReife(lf.id, fortschritt, jetzt) }))
    .sort((a, b) => a.r - b.r);

  const faellige: { a: Aufgabe; ueberfaellig: number }[] = [];
  const neue: { a: Aufgabe; rang: number }[] = [];

  felder.forEach((feld, rang) => {
    for (const a of getAufgaben(feld.id)) {
      if (!passt(a)) continue;
      const f = fortschritt[a.id];
      if (!f) neue.push({ a, rang });
      else if (f.faelligAm <= jetzt) faellige.push({ a, ueberfaellig: jetzt - f.faelligAm });
    }
  });

  // Am längsten überfällig zuerst — das ist das, was am stärksten verfallen ist.
  faellige.sort((x, y) => y.ueberfaellig - x.ueberfaellig);
  const auswahl = faellige.slice(0, anzahl).map((x) => x.a);

  // Rest mit neuen Aufgaben auffüllen, schwächstes Lernfeld zuerst.
  if (auswahl.length < anzahl) {
    neue.sort((x, y) => x.rang - y.rang);
    auswahl.push(...neue.slice(0, anzahl - auswahl.length).map((x) => x.a));
  }
  return auswahl;
}
