export interface PraxisFall {
  id: string;
  titel: string;
  situation: string;
  rechnungen: { frage: string; einheit: string; ergebnis: number; loesungsweg: string; tipp?: string }[];
  entscheidung: string;
  muster: string;
  quelle: string;
  merksatz?: string;
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
  {
    id: "gefaelle", titel: "Gefälle: Höhenunterschied statt Winkel",
    situation: "Für diese Rechenübung ist ein Gefälle von 2 % auf einer waagerechten Strecke von 6 m vorgegeben. Der Wert ist eine Annahme für diesen Fall, keine allgemeine Mindestanforderung an Dächer.",
    rechnungen: [
      { frage: "Welcher Höhenunterschied entsteht über die ganze Strecke?", einheit: "cm", ergebnis: 12, tipp: "2 % bedeutet 2 cm Höhenunterschied pro 100 cm waagerechter Strecke.", loesungsweg: "6 m × 0,02 = 0,12 m = 12 cm." },
      { frage: "Welcher Höhenunterschied entsteht je Meter?", einheit: "cm", ergebnis: 2, tipp: "Rechne zuerst für 100 cm waagerechte Strecke.", loesungsweg: "100 cm × 0,02 = 2 cm. Ein Prozentwert ist kein Winkel in Grad." },
    ],
    entscheidung: "Eine Kollegin setzt 2 % mit 2° gleich. Was ist daran falsch, und welche Angaben musst du vor der Ausführung prüfen?",
    muster: "Prozent beschreibt Höhenunterschied geteilt durch waagerechte Strecke; Grad beschreibt einen Winkel. 2 % entsprechen arctan(0,02), also etwa 1,15°. Für die Ausführung sind der konkrete Aufbau, die Planung, Entwässerung, Produktangaben und die aktuellen anwendbaren Regeln zu prüfen.",
    merksatz: "Gefälle in Prozent bezieht sich auf die waagerechte Strecke. Prozent und Grad sind verschiedene Angaben.",
    quelle: "Eigene Mathematikübung: Gefälle = Höhenunterschied / waagerechte Strecke × 100. Die 2 % sind ausdrücklich vorgegeben.",
  },
  {
    id: "dachschraege", titel: "Dachschräge: Grundmaß ist nicht Dachfläche",
    situation: "Ein symmetrisches Satteldach hat ohne Überstände eine Gebäudebreite von 8 m, eine Firstlänge von 10 m und eine Höhe von 3 m zwischen Traufe und First. Die beiden Dachflächen sind rechteckig. Öffnungen bleiben unberücksichtigt.",
    rechnungen: [
      { frage: "Wie groß ist die waagerechte Strecke von Traufe bis unter den First?", einheit: "m", ergebnis: 4, tipp: "Der First liegt mittig. Du brauchst die halbe Gebäudebreite.", loesungsweg: "8 m / 2 = 4 m." },
      { frage: "Wie lang ist die Dachschräge von Traufe bis First?", einheit: "m", ergebnis: 5, tipp: "Waagerechte Strecke und Höhe bilden die Katheten eines rechtwinkligen Dreiecks.", loesungsweg: "√(4² + 3²) = √25 = 5 m." },
      { frage: "Wie groß ist die gesamte Dachfläche?", einheit: "m²", ergebnis: 100, tipp: "Es gibt zwei Dachseiten. Nutze die schräge Länge, nicht die halbe Gebäudebreite.", loesungsweg: "2 × 10 m × 5 m = 100 m². Die Grundfläche 8 × 10 = 80 m² wäre zu klein." },
    ],
    entscheidung: "Welche Maße fehlen, wenn du aus dieser Übung eine tatsächliche Materialbestellung machen willst?",
    muster: "Zum Beispiel die tatsächlichen Dachüberstände, Öffnungen und Dachaufbauten, genaue Deckmaße des Produkts, erforderliche Überdeckungen, Anschlüsse, Sonderteile und ein begründeter Zuschlag. Die berechnete ideale Fläche allein ist keine vollständige Bestellung.",
    merksatz: "Bei geneigten Dächern brauchst du die schräge Länge für die Dachfläche.",
    quelle: "Eigene Geometrieübung mit Satz des Pythagoras und ausdrücklich vereinfachter Dachgeometrie.",
  },
  {
    id: "bahnen", titel: "Bahnen: Überdeckung kostet Nutzfläche",
    situation: "Eine vereinfachte rechteckige Fläche ist 8 m lang und 5,40 m breit. Bahnen sind 1 m breit und werden jeweils in einem Stück über die 8 m verlegt. Im Übungsfall beträgt die seitliche Überdeckung 0,10 m. Stirnüberdeckungen, Anschlüsse und Verschnitt bleiben unberücksichtigt.",
    rechnungen: [
      { frage: "Welche zusätzliche Breite deckt jede weitere Bahn nach der ersten ab?", einheit: "m", ergebnis: 0.9, tipp: "Von der Bahnbreite geht bei jeder weiteren Bahn die seitliche Überdeckung ab.", loesungsweg: "1,00 m − 0,10 m = 0,90 m. Die erste Bahn deckt in diesem vereinfachten Fall die vollen 1,00 m ab." },
      { frage: "Wie viele ganze Bahnen brauchst du mindestens nebeneinander?", einheit: "Bahnen", ergebnis: 6, tipp: "n Bahnen decken 1,00 + (n − 1) × 0,90 m ab. Prüfe auch, ob eine Bahn weniger reichen würde.", loesungsweg: "1 + (6 − 1) × 0,9 = 5,5 m; fünf Bahnen decken nur 4,6 m. Deshalb werden sechs Bahnen benötigt." },
      { frage: "Wie viele laufende Meter Bahn werden ohne weiteren Zuschlag benötigt?", einheit: "m", ergebnis: 48, tipp: "Jede Bahn läuft über die gesamte Länge von 8 m.", loesungsweg: "6 × 8 m = 48 laufende Meter." },
    ],
    entscheidung: "Darfst du die hier angenommenen 10 cm Überdeckung bei jedem Produkt übernehmen? Begründe.",
    muster: "Nein. Die notwendige Überdeckung und Verbindung richten sich nach dem konkreten Produkt, seiner Funktion, Herstellerangaben, Aufbau und anwendbaren Regeln. In dieser Aufgabe sind 10 cm nur eine Rechenannahme.",
    merksatz: "Bahnbreite und nutzbare Breite sind bei Überdeckungen verschieden.",
    quelle: "Eigene Mengenübung. Die Überdeckung ist eine ausdrücklich vorgegebene Annahme, keine Ausführungsvorgabe.",
  },
  {
    id: "regen", titel: "Regenwasser: Einheiten richtig umrechnen",
    situation: "Für eine reine Rechenübung fallen auf eine waagerecht projizierte Fläche von 120 m² insgesamt 15 mm Regen in 30 Minuten. Nimm an, dass die gesamte Regenmenge gleichmäßig abfließt. Speicherung und Verluste bleiben unberücksichtigt.",
    rechnungen: [
      { frage: "Welche Wassermenge entspricht 15 mm Regen je Quadratmeter?", einheit: "Liter/m²", ergebnis: 15, tipp: "1 m² × 1 mm = 0,001 m³. Ein Kubikmeter enthält 1.000 Liter.", loesungsweg: "1 mm Regen auf 1 m² entspricht 1 Liter; 15 mm entsprechen 15 Litern/m²." },
      { frage: "Welche gesamte Wassermenge fällt auf die vorgegebene Fläche?", einheit: "Liter", ergebnis: 1800, tipp: "Multipliziere Liter je Quadratmeter mit der Fläche.", loesungsweg: "120 m² × 15 Liter/m² = 1.800 Liter." },
      { frage: "Wie groß ist der mittlere Abfluss über diese 30 Minuten?", einheit: "Liter/s", ergebnis: 1, tipp: "Rechne Minuten in Sekunden um und teile die gesamte Menge durch die Zeit.", loesungsweg: "30 × 60 = 1.800 s; 1.800 Liter / 1.800 s = 1 Liter/s." },
    ],
    entscheidung: "Kannst du allein aus diesem mittleren Abfluss eine Dachrinne oder einen Ablauf bemessen?",
    muster: "Nein. Eine Bemessung braucht unter anderem die maßgebende Bemessungsregenspende, wirksame Einzugsfläche, Systemgeometrie und Leistungsdaten sowie die anwendbaren Regeln und gegebenenfalls Notentwässerung. Ein Ereignismittelwert ersetzt diese Angaben nicht.",
    merksatz: "1 mm Regen auf 1 m² entspricht 1 Liter Wasser. Ein Mittelwert ist keine Bemessungsregenspende.",
    quelle: "Eigene Einheiten- und Volumenübung. Keine hydraulische Bemessung; vereinfachte Annahme eines gleichmäßigen Abflusses.",
  },
];

export function pruefePraxisZahl(eingabe: string, ergebnis: number): boolean {
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(eingabe.trim())) return false;
  const wert = Number(eingabe.trim().replace(",", "."));
  if (Number.isInteger(ergebnis) && !Number.isInteger(wert)) return false;
  return Number.isFinite(wert) && Math.abs(wert - ergebnis) < 0.001;
}
