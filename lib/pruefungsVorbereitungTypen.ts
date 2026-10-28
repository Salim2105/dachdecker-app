/** Shared contracts for local exam preparation; existing ExamAttempt v2 is unchanged. */
export type FallModus = "begleitet" | "probelauf";
export type KompetenzId = "plan" | "rechnen" | "material" | "ablauf" | "detail" | "erklaeren" | "wiso";
export interface FallOption { id: string; text: string; richtig: boolean }
interface TeilBasis { id: string; titel: string; auftrag: string; kompetenzen: KompetenzId[]; minuten: number; hinweis: string; erklaerung: string }
export interface AuswahlTeil extends TeilBasis { typ: "auswahl"; optionen: FallOption[]; punkte: number }
export interface RechenTeil extends TeilBasis { typ: "rechnen"; schritte: { id: string; label: string; wert: number; einheit: string; einheiten: string[]; stellen: number; toleranz: number; formel: string; punkte: number; abhaengigVon?: string }[] }
export interface ReihenfolgeTeil extends TeilBasis { typ: "reihenfolge"; schritte: { id: string; text: string }[]; punkte: number }
export interface OffenerTeil extends TeilBasis { typ: "zeichnung" | "begruendung"; kriterien: string[]; muster: string; musterKurz: string; musterSvg?: string }
export type FallTeil = AuswahlTeil | RechenTeil | ReihenfolgeTeil | OffenerTeil;
export interface PruefungsFall {
 id: string; version: 1; familie: string; variante: number; titel: string; kurz: string; auftrag: string;
 angaben: string[]; svg: string; parameter: Record<string, number>; teile: FallTeil[];
 praxis: { werkzeuge: string[]; material: string[]; sicherheit: string[]; kontrolle: string[]; gespraech: string[] };
 transfer: { frage: string; wert: number; einheit: string; toleranz: number; erklaerung: string };
}
export interface TeilAntwort {
 wahl: string[]; reihenfolge: string[]; zahlen: Record<string, string>; einheiten: Record<string, string>;
 formel: string; text: string; erstText?: string; laut: boolean; kriterien: Record<string, "erfuellt" | "teilweise" | "offen">;
 hilfen: string[]; musterOffen: boolean; zeichnungBewertung?: "richtig" | "teilweise" | "falsch";
}
export interface FallBewertung { erreicht: number; moeglich: number; richtig: boolean; selbst: boolean; hinweise: string[] }
export interface FallVersuch {
 version: 1; id: string; revision: number; profilId: string; profilVersion: 1; modus: FallModus;
 gestartetAm: number; frist: number | null; abgegebenAm: number | null; index: number;
 faelle: PruefungsFall[]; antworten: Record<string, TeilAntwort>; bewertungen: Record<string, FallBewertung>;
 werkzeuge: string[]; hilfsEreignisse: { teilId: string; art: string; am: number }[];
 wiso?: { id: string; frage: string; optionen: string[]; korrekt: number[]; erklaerung: string; wahl: number[]; punkte: number }[];
}
export const VORBEREITUNGS_PROFIL = {
 id: "dortmund-dachdeckung", version: 1 as const, titel: "HWK Dortmund · Dachdeckungstechnik",
 status: "training" as const, hinweis: "App-Training · Amtlicher Abgleich ausstehend",
 erlaubteHilfsmittel: ["taschenrechner"], trainingsziel: 80, musterMinuten: 90,
};
export const KOMPETENZEN: Record<KompetenzId, string> = {plan:"Auftrag und Plan verstehen",rechnen:"Rechenwege und Einheiten",material:"Material und Maßnahme wählen",ablauf:"Arbeitsfolge und Sicherheit",detail:"Detail und Funktion darstellen",erklaeren:"Entscheidungen begründen",wiso:"Wirtschafts- und Sozialkunde"};
