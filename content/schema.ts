export type Konfidenz = "hoch" | "mittel" | "pruefen";

export interface Lernfeld {
  id: string; // "lf01" … "lf17", "lf13b", "wiso"
  nr: string; // "1", "13a", …
  titel: string;
  lehrjahr: 1 | 2 | 3;
  stunden: number;
  themen: string[];
}

interface AufgabeBasis {
  id: string; // "lf01-001"
  lernfeld: string;
  thema: string;
  quelle: string;
  konfidenz: Konfidenz;
  erklaerung: string; // wird nach der Antwort angezeigt
}

export interface McAufgabe extends AufgabeBasis {
  typ: "mc";
  frage: string;
  optionen: string[];
  korrekt: number[]; // Indizes, mehrere möglich
}

export interface ClozeAufgabe extends AufgabeBasis {
  typ: "cloze";
  text: string; // Lücken als {{antwort}}
  akzeptiert?: Record<string, string[]>; // alternative Schreibweisen je Lücke
}

export interface CalcParameter {
  name: string; // Variablenname in der Formel
  label: string; // Anzeige, z. B. "Dachlänge"
  einheit: string;
  min: number;
  max: number;
  schritt: number; // Rundung der Randomisierung, z. B. 0.5
}

export interface CalcSchritt {
  beschreibung: string; // darf {name} referenzieren
  formel: string; // mathjs-Ausdruck über Parameter und vorherige Schritte
  ergebnisName: string;
  einheit: string;
}

export interface CalcAufgabe extends AufgabeBasis {
  typ: "calc";
  aufgabentext: string; // darf {name} referenzieren
  parameter: CalcParameter[];
  schritte: CalcSchritt[]; // letzter Schritt ist die gesuchte Lösung
  toleranzProzent: number; // akzeptierte Abweichung der Nutzerantwort
}

export interface DiagramAufgabe extends AufgabeBasis {
  typ: "diagram";
  frage: string;
  svg: string; // inline SVG-Markup (eigene Zeichnung), Ziel-Elemente tragen data-id
  zuordnung: Record<string, string>; // data-id -> korrekte Bezeichnung
}

export interface DrawAufgabe extends AufgabeBasis {
  typ: "draw";
  aufgabentext: string;
  vorgabeSvg?: string; // optionale Vorgabe-Skizze, inline SVG-Markup
  loesungSvg: string; // eigene Muster-SVG, inline SVG-Markup
  schritte: string[]; // Schritt-für-Schritt-Erklärung der Lösung
}

export interface FachbegriffAufgabe extends AufgabeBasis {
  typ: "fachbegriff";
  begriff: string;
  definition: string; // Rückseite der Karteikarte
  bildSvg?: string; // optionales inline SVG-Markup
  bestandteile?: string[]; // Komposita-Zerlegung, z. B. ["Dampf", "brems", "folie"]
}

export type Aufgabe =
  | McAufgabe
  | ClozeAufgabe
  | CalcAufgabe
  | DiagramAufgabe
  | DrawAufgabe
  | FachbegriffAufgabe;

export interface Lektion {
  id: string; // "lf01-l01"
  lernfeld: string;
  thema: string;
  titel: string;
  inhalt: string[]; // Absätze (Eigenformulierung)
  svg?: string; // eigene Illustration, inline SVG-Markup
  quelle: string;
  konfidenz: Konfidenz;
}

export type Bewertung = "richtig" | "teilweise" | "falsch";

export interface AufgabenFortschritt {
  aufgabeId: string;
  bewertung: Bewertung;
  gesehenAm: number; // epoch ms
  faelligAm: number; // epoch ms, nächster Spaced-Repetition-Termin
  intervallTage: number;
}

export function istSichtbar(x: { konfidenz: Konfidenz }): boolean {
  return x.konfidenz !== "pruefen";
}
