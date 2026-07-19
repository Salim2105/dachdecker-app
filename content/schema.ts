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
  svg: string; // Pfad relativ zu content/, Ziel-Elemente tragen data-id
  zuordnung: Record<string, string>; // data-id -> korrekte Bezeichnung
}

export type Aufgabe = McAufgabe | ClozeAufgabe | CalcAufgabe | DiagramAufgabe;
