/** Kleine, vollständig per Tastatur lösbare Übungen. IDs und Versionen bleiben
 * unabhängig vom Anzeigetext stabil, damit gespeicherte Versuche zuordenbar sind. */
interface AktivitaetBasis {
  id: string;
  version: number;
  titel: string;
  auftrag: string;
  erklaerung: string;
}
export interface ZuordnungsAktivitaet extends AktivitaetBasis {
  typ: "zuordnen";
  paare: { id: string; links: string; rechts: string }[];
}
export interface ReihenfolgeAktivitaet extends AktivitaetBasis {
  typ: "reihenfolge";
  /** Redaktionell richtige Reihenfolge, nicht die Startreihenfolge. */
  schritte: { id: string; text: string }[];
}
export interface AuswahlAktivitaet extends AktivitaetBasis {
  typ: "skizzenfehler" | "baustellenfall";
  situation: string;
  svg?: string;
  bildbeschreibung?: string;
  optionen: { id: string; text: string; korrekt: boolean }[];
}
export type Aktivitaet = ZuordnungsAktivitaet | ReihenfolgeAktivitaet | AuswahlAktivitaet;
export interface AktivitaetAntwort {
  zuordnung: Record<string, string>;
  reihenfolge: string[];
  auswahl: string[];
}
export interface AktivitaetErgebnis {
  richtig: boolean;
  erreicht: number;
  moeglich: number;
}
export function starteAktivitaet(aktivitaet: Aktivitaet): AktivitaetAntwort {
  return {
    zuordnung: {},
    // Ein deterministischer Start überlebt einen Neustart und vermeidet eine
    // bereits gelöste Anordnung beim ersten Öffnen.
    reihenfolge: aktivitaet.typ === "reihenfolge" ? aktivitaet.schritte.map((s) => s.id).reverse() : [],
    auswahl: [],
  };
}
export function istAktivitaetVollstaendig(a: Aktivitaet, antwort: AktivitaetAntwort): boolean {
  if (a.typ === "zuordnen") return a.paare.every((p) => a.paare.some((ziel) => ziel.id === antwort.zuordnung[p.id]));
  if (a.typ === "reihenfolge") return antwort.reihenfolge.length === a.schritte.length &&
    new Set(antwort.reihenfolge).size === a.schritte.length && a.schritte.every((s) => antwort.reihenfolge.includes(s.id));
  return antwort.auswahl.length > 0 && antwort.auswahl.every((id) => a.optionen.some((o) => o.id === id));
}
export function bewerteAktivitaet(a: Aktivitaet, antwort: AktivitaetAntwort): AktivitaetErgebnis {
  if (a.typ === "zuordnen") {
    const erreicht = a.paare.filter((p) => antwort.zuordnung[p.id] === p.id).length;
    return { richtig: erreicht === a.paare.length, erreicht, moeglich: a.paare.length };
  }
  if (a.typ === "reihenfolge") {
    const erreicht = a.schritte.filter((s, i) => antwort.reihenfolge[i] === s.id).length;
    return { richtig: erreicht === a.schritte.length && istAktivitaetVollstaendig(a, antwort), erreicht, moeglich: a.schritte.length };
  }
  const richtigIds = a.optionen.filter((o) => o.korrekt).map((o) => o.id);
  const richtig = istAktivitaetVollstaendig(a, antwort) && new Set(antwort.auswahl).size === richtigIds.length &&
    antwort.auswahl.length === richtigIds.length && antwort.auswahl.every((id) => richtigIds.includes(id));
  // Keine Belohnung für wahlloses Ankreuzen aller Antworten.
  const falsche = antwort.auswahl.filter((id) => !richtigIds.includes(id)).length;
  const erreicht = Math.max(0, richtigIds.filter((id) => antwort.auswahl.includes(id)).length - falsche);
  return { richtig, erreicht, moeglich: richtigIds.length };
}
