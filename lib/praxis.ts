export interface PraxisFall {
  id: string;
  titel: string;
  situation: string;
  rechnungen: { frage: string; einheit: string; ergebnis: number; loesungsweg: string }[];
  entscheidung: string;
  muster: string;
  quelle: string;
}

export const PRAXISFAELLE: PraxisFall[] = [
  {
    id: "satteldach", titel: "Satteldach: Fläche und Ziegelbedarf",
    situation: "Ein Satteldach hat zwei rechteckige Dachflächen. Jede ist 10 m lang und entlang der Dachschräge 6 m breit. Für diesen Übungsfall sind 10 Ziegel pro m² und 8 % Zuschlag für Reserve und Verschnitt vorgegeben. Öffnungen und Sonderziegel bleiben hier unberücksichtigt.",
    rechnungen: [
      { frage: "Wie groß ist die gesamte Dachfläche?", einheit: "m²", ergebnis: 120, loesungsweg: "2 × 10 m × 6 m = 120 m². Die 6 m sind bereits die schräge Länge; keine weitere Neigungsumrechnung." },
      { frage: "Wie viele Flächenziegel werden ohne Zuschlag benötigt? Nutze deine Dachfläche.", einheit: "Stück", ergebnis: 1200, loesungsweg: "120 m² × 10 Stück/m² = 1.200 Stück." },
      { frage: "Wie viele Flächenziegel sind mit dem vorgegebenen Zuschlag einzuplanen?", einheit: "Stück", ergebnis: 1296, loesungsweg: "1.200 × 1,08 = 1.296 Stück. Ein Zuschlag von 8 % bedeutet den Faktor 1,08, nicht 0,08." },
    ],
    entscheidung: "Welche Angaben brauchst du zusätzlich, bevor du eine bestimmte Deckung und den Dachaufbau festlegst?",
    muster: "Zum Beispiel Dachneigung und Geometrie, genaue Produkte mit Herstellerangaben, Nutzung und Anforderungen an Wärme- und Feuchteschutz sowie die anwendbaren aktuellen Fachregeln. Die Stückzahl allein entscheidet nicht über einen geeigneten Dachaufbau.",
    quelle: "Eigene Rechenübung mit ausdrücklich vorgegebenen Annahmen. Mengen und Zuschlag sind Beispiele, keine Hersteller- oder Fachregelvorgaben.",
  },
  {
    id: "platten", titel: "Dämmplatten: Menge und Bestellplanung",
    situation: "Eine rechteckige Fläche ist 8 m × 5 m groß. Die angenommenen Dämmplatten messen 1,20 m × 0,60 m. Plane in diesem Übungsfall 10 % Zuschlag ein. Bestellt werden ganze Platten; Flächenüberdeckungen bleiben unberücksichtigt.",
    rechnungen: [
      { frage: "Wie groß ist die Fläche ohne Zuschlag?", einheit: "m²", ergebnis: 40, loesungsweg: "8 m × 5 m = 40 m²." },
      { frage: "Welche Fläche muss einschließlich des vorgegebenen Zuschlags abgedeckt werden?", einheit: "m²", ergebnis: 44, loesungsweg: "40 m² × 1,10 = 44 m²." },
      { frage: "Wie viele ganze Platten musst du mindestens einplanen?", einheit: "Platten", ergebnis: 62, loesungsweg: "Eine Platte: 1,20 × 0,60 = 0,72 m². 44 / 0,72 ≈ 61,11; für die Bestellmenge auf 62 ganze Platten aufrunden." },
    ],
    entscheidung: "Reicht diese Mengenrechnung aus, um die Dämmplatten auszuwählen? Begründe deine Antwort.",
    muster: "Nein. Zusätzlich sind unter anderem erforderliche Dämmleistung und Dicke, Eignung für den geplanten Aufbau, Belastung, Feuchte- und Brandschutz sowie Herstellerangaben zu prüfen. Gleiche Abmessungen bedeuten nicht gleiche Eignung.",
    quelle: "Eigene Rechenübung. Abmessungen und Zuschlag sind vorgegebene Beispiele; keine Ausführungsplanung.",
  },
];

export function pruefePraxisZahl(eingabe: string, ergebnis: number): boolean {
  if (!eingabe.trim()) return false;
  const wert = Number(eingabe.trim().replace(",", "."));
  return Number.isFinite(wert) && Math.abs(wert - ergebnis) < 0.001;
}
