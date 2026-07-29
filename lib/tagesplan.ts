// Tagesplan: was heute dran ist, und wie prüfungsreif du wirklich bist.
//
// Zwei bewusste Entscheidungen, die von einem reinen Fortschrittsbalken abweichen:
//
// 1. Die Prüfungsreife KANN SINKEN. Ein Balken, der nur steigt, misst
//    Aktivität statt Wissen — bearbeitete Aufgaben sagen nichts darüber aus,
//    ob du den Stoff morgen noch abrufen kannst. Hier verfällt eine Aufgabe,
//    sobald sie überfällig wird. Der Verfall ist exponentiell — siehe
//    lib/reifegrad.ts. Fallende Reife ist das Signal, das zurückholt.
//
// 2. Die Auswahl wird dir abgenommen. Wer selbst wählt, wählt das Vertraute
//    (LF1–3) und rührt die späten Lernfelder nie an. "Heute dran" mischt
//    fällige Wiederholungen mit neuen Aufgaben aus den schwächsten Lernfeldern.
//
// Reife und Tagesdosis liegen bewusst in lib/reifegrad.ts: Dieses Modul hier
// importiert die Content-Registry, jenes nicht. Die Startseite braucht nur die
// Reife und soll dafür nicht 2 MB Aufgabentext laden.
import type { Aufgabe, AufgabenFortschritt } from "@/content/schema";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { reife } from "@/lib/reifegrad";

export {
  reife,
  pruefungsreife,
  tagesdosis,
  MIN_DOSIS,
  MAX_DOSIS,
  GESAMT_AUFGABEN,
  type Reifegrad,
} from "@/lib/reifegrad";

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

/** Höchstens so viele Aufgaben desselben Lernfelds direkt hintereinander. */
export const MAX_AM_STUECK = 3;
/** So viele der schwächsten Lernfelder liefern neue Aufgaben — nicht nur eines. */
export const FELDER_JE_SITZUNG = 3;

/**
 * Bricht lange Serien desselben Lernfelds auf, ohne die Rangfolge preiszugeben.
 *
 * Zwanzig Aufgaben am Stück aus einem Lernfeld sind Blockübung: Man erkennt das
 * Muster der Aufgabenart statt den Inhalt und hält das für Können. In der
 * Prüfung stehen die Themen gemischt. Genau so wird hier geübt.
 */
export function verteile(aufgaben: Aufgabe[], maxAmStueck = MAX_AM_STUECK): Aufgabe[] {
  // Nach Lernfeld bündeln, Reihenfolge innerhalb bleibt erhalten — die
  // überfälligsten Aufgaben eines Feldes kommen weiterhin zuerst.
  const gruppen = new Map<string, Aufgabe[]>();
  for (const a of aufgaben) {
    const g = gruppen.get(a.lernfeld);
    if (g) g.push(a);
    else gruppen.set(a.lernfeld, [a]);
  }

  const raus: Aufgabe[] = [];
  // Reihum je maxAmStueck aus jedem Feld, das größte zuerst. Das Sortieren nach
  // Restbestand ist entscheidend: Nimmt man stur der Reihe nach, ist ein Feld
  // vorzeitig leer und sein Rest türmt sich am Ende zu einem langen Block.
  // ponytail: O(n² log n) durch Neusortieren je Runde — bei maximal 60 Aufgaben
  // je Sitzung nicht messbar.
  for (;;) {
    const offen = [...gruppen.values()].filter((g) => g.length > 0);
    if (offen.length === 0) break;
    offen.sort((a, b) => b.length - a.length);
    for (const g of offen) raus.push(...g.splice(0, maxAmStueck));
  }
  return raus;
}

/** Nimmt reihum aus jeder Gruppe, bis alle leer sind. */
function reihum(gruppen: Aufgabe[][]): Aufgabe[] {
  const raus: Aufgabe[] = [];
  const laenge = Math.max(0, ...gruppen.map((g) => g.length));
  for (let i = 0; i < laenge; i++) {
    for (const g of gruppen) if (i < g.length) raus.push(g[i]);
  }
  return raus;
}

/**
 * Stellt die heutige Auswahl zusammen: erst die überfälligsten Wiederholungen,
 * dann neue Aufgaben aus den schwächsten Lernfeldern — reihum, nicht alle aus
 * einem. Wer immer nur sein schwächstes Feld vorgesetzt bekommt, bleibt darin
 * stecken und sieht die späten Lernfelder nie.
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

  // Rest mit neuen Aufgaben auffüllen: reihum aus den schwächsten Feldern,
  // danach der Rest in Rangfolge, falls die nicht reichen.
  if (auswahl.length < anzahl) {
    const gruppen: Aufgabe[][] = [];
    for (let r = 0; r < FELDER_JE_SITZUNG; r++) {
      const g = neue.filter((n) => n.rang === r).map((n) => n.a);
      if (g.length > 0) gruppen.push(g);
    }
    const spaeter = neue
      .filter((n) => n.rang >= FELDER_JE_SITZUNG)
      .sort((x, y) => x.rang - y.rang)
      .map((n) => n.a);
    auswahl.push(...[...reihum(gruppen), ...spaeter].slice(0, anzahl - auswahl.length));
  }
  return verteile(auswahl);
}
