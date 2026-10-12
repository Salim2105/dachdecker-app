import { PRAXISFAELLE, pruefePraxisZahl } from "@/lib/praxis";
import { leseDezimalzahl } from "@/lib/zahlen";
import type { BerechneterSchritt } from "@/lib/calc";

export interface KorrekturUebung {
  frage: string;
  ergebnis: number;
  einheit: string;
  loesungsweg: string;
}
export interface RechenFeedback {
  titel: string;
  hinweis: string;
  uebung?: KorrekturUebung;
}
type Muster = RechenFeedback & { werte: number[] };

const ZUSCHLAG: KorrekturUebung = {
  frage: "Du brauchst 200 Ziegel und planst 15 % Zuschlag ein. Wie viele Ziegel sind es insgesamt?",
  ergebnis: 230, einheit: "Stück", loesungsweg: "200 × 0,15 = 30 Stück Zuschlag. Insgesamt: 200 + 30 = 230 Stück, also 200 × 1,15.",
};
const FLAECHE: KorrekturUebung = {
  frage: "Ein Rechteck ist 7 m lang und 3 m breit. Wie groß ist seine Fläche?",
  ergebnis: 21, einheit: "m²", loesungsweg: "Fläche = Länge × Breite = 7 × 3 = 21 m². Addieren der Seiten ergibt keine Fläche.",
};
const ZWEI_SEITEN: KorrekturUebung = {
  frage: "Zwei rechteckige Dachseiten sind jeweils 8 m × 4 m groß. Wie groß ist die gesamte Fläche?",
  ergebnis: 64, einheit: "m²", loesungsweg: "Eine Seite: 8 × 4 = 32 m². Beide Seiten: 2 × 32 = 64 m².",
};
const AUFRUNDEN: KorrekturUebung = {
  frage: "Du brauchst 10 m² Material. Eine Platte deckt 0,8 m² ab. Wie viele ganze Platten brauchst du mindestens?",
  ergebnis: 13, einheit: "Platten", loesungsweg: "10 / 0,8 = 12,5. 12 Platten reichen nicht; deshalb auf 13 aufrunden.",
};
const SCHRAEGE: KorrekturUebung = {
  frage: "Eine waagerechte Strecke von 6 m und eine Höhe von 8 m bilden ein rechtwinkliges Dreieck. Wie lang ist die schräge Seite?",
  ergebnis: 10, einheit: "m", loesungsweg: "√(6² + 8²) = √100 = 10 m. Die schräge Seite ist länger als jede einzelne Kathete.",
};
const EINHEIT: KorrekturUebung = {
  frage: "Ein Höhenunterschied beträgt 0,35 m. Wie viele Zentimeter sind das?",
  ergebnis: 35, einheit: "cm", loesungsweg: "1 m = 100 cm. Deshalb 0,35 × 100 = 35 cm.",
};
const UEBERDECKUNG: KorrekturUebung = {
  frage: "Eine Bahn ist 1,20 m breit. Jede weitere Bahn überdeckt die vorherige um 0,15 m. Welche zusätzliche Breite deckt sie ab?",
  ergebnis: 1.05, einheit: "m", loesungsweg: "1,20 m − 0,15 m = 1,05 m zusätzliche Breite. Die Überdeckung ist bereits bedeckt.",
};
const SEKUNDEN: KorrekturUebung = {
  frage: "600 Liter fließen gleichmäßig in 10 Minuten ab. Wie groß ist der mittlere Abfluss?",
  ergebnis: 1, einheit: "Liter/s", loesungsweg: "10 Minuten = 600 Sekunden. 600 Liter / 600 s = 1 Liter/s.",
};

const MUSTER: Record<string, Muster[]> = {
  "satteldach:0": [{ werte: [60], titel: "Beide Dachseiten berücksichtigen", hinweis: "60 m² passen zur Fläche einer Dachseite. Prüfe, ob du die zweite Seite mitgerechnet hast.", uebung: ZWEI_SEITEN }],
  "satteldach:1": [{ werte: [120], titel: "Fläche in Stückzahl umrechnen", hinweis: "120 ist hier die Fläche. Für die Stückzahl brauchst du zusätzlich die vorgegebenen 10 Ziegel je m².", uebung: { frage: "Für 20 m² sind 12 Ziegel je m² vorgegeben. Wie viele Ziegel brauchst du ohne Zuschlag?", ergebnis: 240, einheit: "Stück", loesungsweg: "20 m² × 12 Stück/m² = 240 Stück." } }],
  "satteldach:2": [
    { werte: [1200], titel: "Zuschlag berücksichtigen", hinweis: "1.200 Stück passen zum Bedarf ohne den vorgegebenen Zuschlag. Prüfe, ob die 8 % schon enthalten sind.", uebung: ZUSCHLAG },
    { werte: [96], titel: "Zuschlag und Gesamtmenge unterscheiden", hinweis: "96 Stück passen zum Zuschlag allein. Gefragt ist die ursprüngliche Menge plus Zuschlag.", uebung: ZUSCHLAG },
  ],
  "platten:0": [{ werte: [26], titel: "Fläche und Umfang unterscheiden", hinweis: "26 m passen zum Umfang dieses Rechtecks. Für die Fläche multiplizierst du Länge und Breite.", uebung: FLAECHE }],
  "platten:1": [
    { werte: [40], titel: "Zuschlag berücksichtigen", hinweis: "40 m² passen zur Fläche ohne Zuschlag. Prüfe, ob die 10 % schon enthalten sind.", uebung: ZUSCHLAG },
    { werte: [4], titel: "Zuschlag und Gesamtmenge unterscheiden", hinweis: "4 m² passen zum Zuschlag allein. Addiere ihn zur ursprünglichen Fläche.", uebung: ZUSCHLAG },
  ],
  "platten:2": [{ werte: [61, 61.11], titel: "Ganze Platten aufrunden", hinweis: "Der Quotient liegt über 61. Für die ganze Bestellmenge reicht Abrunden oder normales Runden hier nicht.", uebung: AUFRUNDEN }],
  "gefaelle:0": [
    { werte: [0.12], titel: "Meter in Zentimeter umrechnen", hinweis: "0,12 passt zum Höhenunterschied in Metern. Das Antwortfeld fragt nach Zentimetern.", uebung: EINHEIT },
    { werte: [1200], titel: "Prozent als Anteil verwenden", hinweis: "Dieser Wert passt zu einer Rechnung mit 2 statt 0,02. 2 % bedeuten 2 / 100.", uebung: { frage: "Eine waagerechte Strecke ist 4 m lang. Bei vorgegebenen 3 % Gefälle: Wie groß ist der Höhenunterschied?", ergebnis: 12, einheit: "cm", loesungsweg: "4 m × 0,03 = 0,12 m = 12 cm. Der Prozentwert ist eine Übungsannahme." } },
  ],
  "gefaelle:1": [{ werte: [0.02], titel: "Meter in Zentimeter umrechnen", hinweis: "0,02 passt zur Angabe in Metern je Meter. Das Antwortfeld fragt nach Zentimetern.", uebung: EINHEIT }],
  "dachschraege:0": [{ werte: [8], titel: "Halbe Gebäudebreite nutzen", hinweis: "8 m sind die ganze Gebäudebreite. Bei diesem symmetrischen Dach liegt der First in der Mitte.", uebung: { frage: "Ein symmetrisches Satteldach ist 10 m breit. Wie weit liegt die Traufe waagerecht vom mittigen First entfernt?", ergebnis: 5, einheit: "m", loesungsweg: "Die halbe Breite ist 10 / 2 = 5 m." } }],
  "dachschraege:1": [{ werte: [4, 7, 25], titel: "Die schräge Länge berechnen", hinweis: "Prüfe den Satz des Pythagoras: Katheten quadrieren, addieren und anschließend die Wurzel ziehen. Einfach addieren oder die Grundlänge übernehmen reicht nicht.", uebung: SCHRAEGE }],
  "dachschraege:2": [
    { werte: [80], titel: "Dachfläche statt Grundfläche", hinweis: "80 m² passen zur Gebäudegrundfläche. Für die geneigte Dachfläche brauchst du die schräge Länge.", uebung: SCHRAEGE },
    { werte: [50], titel: "Beide Dachseiten berücksichtigen", hinweis: "50 m² passen zu einer Dachseite. Die gesamte Fläche umfasst beide Seiten.", uebung: ZWEI_SEITEN },
  ],
  "bahnen:0": [{ werte: [1, 1.1], titel: "Überdeckung abziehen", hinweis: "Die Überdeckung bringt keine zusätzliche Deckbreite. Ziehe sie von der Breite jeder weiteren Bahn ab.", uebung: UEBERDECKUNG }],
  "bahnen:1": [{ werte: [5], titel: "Reicht die letzte Bahn?", hinweis: "Fünf Bahnen decken hier nur 4,60 m ab. Vergleiche die abgedeckte Breite mit den benötigten 5,40 m.", uebung: AUFRUNDEN }],
  "bahnen:2": [{ werte: [43.2], titel: "Fläche und laufende Meter unterscheiden", hinweis: "43,2 passen zur Fläche von 8 × 5,4 m. Gefragt ist die Länge aller ganzen Bahnen zusammen.", uebung: { frage: "Vier Bahnen sind jeweils 7 m lang. Wie viele laufende Meter sind das insgesamt?", ergebnis: 28, einheit: "m", loesungsweg: "4 × 7 m = 28 laufende Meter." } }],
  "regen:0": [{ werte: [0.015], titel: "Kubikmeter in Liter umrechnen", hinweis: "0,015 passt zum Volumen in m³ je m². Das Antwortfeld fragt nach Litern je m².", uebung: { frage: "Wie viele Liter sind 0,025 m³ Wasser?", ergebnis: 25, einheit: "Liter", loesungsweg: "1 m³ = 1.000 Liter. 0,025 × 1.000 = 25 Liter." } }],
  "regen:1": [{ werte: [1.8], titel: "Kubikmeter in Liter umrechnen", hinweis: "1,8 passt zur Wassermenge in m³. Gefragt sind Liter.", uebung: { frage: "Wie viele Liter sind 0,025 m³ Wasser?", ergebnis: 25, einheit: "Liter", loesungsweg: "0,025 × 1.000 = 25 Liter." } }],
  "regen:2": [{ werte: [60], titel: "Minuten in Sekunden umrechnen", hinweis: "60 passt zum Abfluss in Litern pro Minute. Gefragt sind Liter pro Sekunde.", uebung: SEKUNDEN }],
};

// Prüft nur bekannte Rechenmuster. Ein passender Zahlenwert beweist nicht,
// welchen Denkweg die Person tatsächlich benutzt hat.
export function praxisFeedback(fallId: string, schritt: number, eingaben: string[]): RechenFeedback | null {
  const fall = PRAXISFAELLE.find((f) => f.id === fallId);
  const r = fall?.rechnungen[schritt];
  if (!r || pruefePraxisZahl(eingaben[schritt] ?? "", r.ergebnis)) return null;
  const wert = leseDezimalzahl(eingaben[schritt] ?? "");
  if (wert === null) return { titel: "Zahleneingabe prüfen", hinweis: "Gib nur die Zahl ein, ohne Einheit oder Tausendertrennzeichen. Ein Dezimalkomma ist möglich." };

  const vorher = schritt > 0 ? leseDezimalzahl(eingaben[schritt - 1] ?? "") : null;
  if (vorher !== null && vorher > 0 && !pruefePraxisZahl(eingaben[schritt - 1], fall!.rechnungen[schritt - 1].ergebnis)) {
    const folge: Record<string, (v: number) => number> = {
      "satteldach:1": (v) => v * 10, "satteldach:2": (v) => v * 1.08,
      "platten:1": (v) => v * 1.1, "platten:2": (v) => Math.ceil(v / 0.72),
      "gefaelle:1": (v) => v / 6,
      "dachschraege:1": (v) => Math.hypot(v, 3), "dachschraege:2": (v) => 2 * 10 * v,
      "bahnen:1": (v) => 1 + Math.ceil((5.4 - 1) / v), "bahnen:2": (v) => v * 8,
      "regen:1": (v) => v * 120, "regen:2": (v) => v / (30 * 60),
    };
    const rechnung = folge[`${fallId}:${schritt}`];
    if (rechnung && Math.abs(wert - rechnung(vorher)) <= 0.005) return {
      titel: "Vorherigen Schritt zuerst prüfen",
      hinweis: `Dein Ergebnis passt rechnerisch zu deinem Wert aus Schritt ${schritt}. Dort weicht der Wert bereits ab. Prüfe zuerst diesen Schritt und rechne anschließend mit dem korrigierten Wert weiter.`,
    };
  }

  const muster = MUSTER[`${fallId}:${schritt}`]?.find((m) => m.werte.some((v) => Math.abs(v - wert) < 0.001));
  if (muster) return { titel: muster.titel, hinweis: muster.hinweis, uebung: muster.uebung };
  return { titel: "Rechenweg vergleichen", hinweis: "Für diesen Zahlenwert ist kein eindeutiges Rechenmuster hinterlegt. Vergleiche deine eingesetzten Größen, die Rechenoperation und die gefragte Einheit mit dem Lösungsweg." };
}

export function calcFeedback(wert: number, schritte: BerechneterSchritt[]): RechenFeedback {
  const letzter = schritte.at(-1);
  const index = schritte.slice(0, -1).findIndex((s) => Math.abs(s.wert - wert) < 0.001);
  if (index >= 0) return {
    titel: "Bis zum gesuchten Ergebnis weiterrechnen",
    hinweis: `Dein Wert passt zum Zwischenergebnis in Schritt ${index + 1}. Möglicherweise hast du dort aufgehört. Gefragt ist das Ergebnis des letzten Schritts${letzter?.einheit ? ` in ${letzter.einheit}` : ""}.`,
  };
  return {
    titel: "Rechenweg Schritt für Schritt prüfen",
    hinweis: `Vergleiche zuerst die eingesetzten Größen und dann jeden Rechenschritt.${letzter?.einheit ? ` Prüfe, ob dein Ergebnis in ${letzter.einheit} angegeben ist.` : ""} Aus dem Zahlenwert allein lässt sich die Fehlerursache hier nicht eindeutig bestimmen.`,
  };
}
