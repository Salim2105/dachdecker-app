import type { Bewertung } from "@/content/schema";
import { PRAXISFAELLE, pruefePraxisZahl } from "@/lib/praxis";
import { createStringStore } from "@/lib/appStores";

export interface LernwegEinheit {
  id: string;
  titel: string;
  erklaerung: string[];
  abrufFrage: string;
  abrufMuster: string;
  baustelle: string;
  transferFrage: string;
  transferMuster: string;
}

export const LERNWEGE: LernwegEinheit[] = [
  {
    id: "satteldach", titel: "Dachfläche und Ziegelbedarf",
    erklaerung: [
      "Eine rechteckige Dachfläche berechnest du mit Länge × schräger Breite. Bei einem symmetrischen Satteldach mit zwei gleich großen Seiten musst du beide Seiten berücksichtigen.",
      "Die Fläche in m² wird mit dem vorgegebenen Bedarf in Stück/m² multipliziert. Die Einheit des Ergebnisses ist dann Stück. Beispiel: 20 m² × 12 Stück/m² = 240 Stück.",
      "Ein Zuschlag kommt zur Ausgangsmenge dazu. Bei 15 % rechnest du Menge × 1,15. Menge × 0,15 liefert nur den Zuschlag. Bedarf und Zuschlag müssen für ein echtes Projekt begründet sein.",
    ],
    abrufFrage: "Erkläre aus dem Kopf: Wie kommst du von den Dachmaßen zur Ziegelzahl mit Zuschlag? Warum reichen Fläche und Zuschlag allein jeweils nicht als Bestellmenge?",
    abrufMuster: "Beide Dachseiten mit ihren schrägen Maßen berechnen, die gesamte Fläche mit dem Stückbedarf je m² multiplizieren und anschließend den vorgegebenen Zuschlag addieren bzw. mit 1 + Prozent/100 multiplizieren. Die Fläche ist noch keine Stückzahl, und der Zuschlag allein ist noch keine Gesamtmenge.",
    baustelle: "Ein Kollege möchte Flächenziegel nur anhand der Gebäudelänge und Gebäudebreite bestellen. Überstände, Dachneigung und Produktdeckmaß fehlen auf seinem Zettel.",
    transferFrage: "Welche Angaben klärst du vor der Bestellung, und warum reicht die Gebäudegrundfläche nicht?",
    transferMuster: "Die tatsächlichen schrägen Dachmaße, Überstände, Öffnungen und Dachaufbauten sowie Deckmaß bzw. Stückbedarf des gewählten Produkts klären. Dazu kommen Sonderteile und ein begründeter Zuschlag. Die Grundfläche beschreibt nicht automatisch die geneigte Dachfläche.",
  },
  {
    id: "platten", titel: "Dämmplatten richtig einplanen",
    erklaerung: [
      "Berechne die zu belegende Fläche und den ausdrücklich vorgegebenen Zuschlag. Ein Zuschlag von 10 % bedeutet Fläche × 1,10.",
      "Eine rechteckige Platte deckt Länge × Breite ab. Teile die benötigte Fläche durch die Fläche einer Platte. Beispiel: 10 m² / 0,8 m² = 12,5 Platten.",
      "Für die Mindestmenge ganzer Platten rundest du auf: Im Beispiel werden 13 benötigt. Eine Mengenrechnung entscheidet noch nicht über die Eignung, Dicke und Eigenschaften des Materials.",
    ],
    abrufFrage: "Beschreibe aus dem Kopf die Schritte bis zur Zahl ganzer Platten. Warum wird aufgerundet, und was sagt diese Rechnung noch nicht über das Material aus?",
    abrufMuster: "Fläche bestimmen, Zuschlag einrechnen, durch die Fläche einer Platte teilen und für ganze Platten aufrunden. Abrunden kann zu einer zu kleinen Menge führen. Die Rechnung bewertet weder die nötige Dämmleistung noch die Eignung für den geplanten Aufbau.",
    baustelle: "Zwei Dämmplatten haben dieselben Abmessungen. Ein Kollege will deshalb das günstigere Produkt bestellen, ohne die weiteren Eigenschaften zu vergleichen.",
    transferFrage: "Warum reicht der Vergleich der Abmessungen nicht? Welche weiteren Angaben brauchst du?",
    transferMuster: "Dämmleistung und benötigte Dicke, Eignung im geplanten Aufbau, Belastbarkeit sowie Feuchte- und Brandschutzanforderungen anhand von Planung und Produktangaben vergleichen. Gleiche Maße bedeuten keine gleiche Eignung.",
  },
  {
    id: "gefaelle", titel: "Gefälle und Einheiten verstehen",
    erklaerung: [
      "Gefälle in Prozent ist Höhenunterschied / waagerechte Strecke × 100. Für den Höhenunterschied rechnest du waagerechte Strecke × Prozentwert/100.",
      "Beispiel mit vorgegebenen 3 % auf 4 m: 4 × 0,03 = 0,12 m = 12 cm. Achte darauf, in welcher Einheit die Antwort gefragt ist.",
      "Prozent und Winkelgrade sind verschiedene Angaben. Ein Winkel lässt sich mit dem Tangens in ein Verhältnis umrechnen. Die Beispielwerte bestimmen keine allgemeine Ausführungsanforderung.",
    ],
    abrufFrage: "Wie berechnest du aus waagerechter Strecke und Prozentgefälle den Höhenunterschied? Wie rechnest du Meter in Zentimeter um, und warum sind Prozent keine Grad?",
    abrufMuster: "Strecke × Prozent/100 ergibt den Höhenunterschied in derselben Längeneinheit. Meter × 100 ergibt Zentimeter. Prozent ist ein Verhältnis von Höhe zu waagerechter Strecke; Grad beschreibt einen Winkel.",
    baustelle: "Auf einem Plan steht ein Gefälle in Prozent. Eine Kollegin übernimmt denselben Zahlenwert als Winkel in Grad in ihre Skizze.",
    transferFrage: "Was prüfst du an der Skizze, bevor damit gearbeitet wird?",
    transferMuster: "Die Prozentangabe darf nicht unverändert als Gradangabe verwendet werden. Höhenunterschied und waagerechte Strecke anhand der Planangabe nachrechnen, Maße und Einheiten prüfen und die Skizze korrigieren. Anforderungen an den konkreten Aufbau sind zusätzlich mit der Planung abzugleichen.",
  },
  {
    id: "dachschraege", titel: "Grundmaß in Dachfläche übersetzen",
    erklaerung: [
      "Beim symmetrischen Satteldach liegt der First mittig. Die waagerechte Strecke von der Traufe bis unter den First ist die halbe Gebäudebreite, sofern Überstände unberücksichtigt bleiben.",
      "Waagerechte Strecke und Höhe sind Katheten. Die schräge Länge ist √(Strecke² + Höhe²). Beispiel: √(6² + 8²) = 10 m.",
      "Die Dachfläche entsteht aus schräger Länge × Firstlänge × Anzahl der Dachseiten. Für tatsächliche Mengen sind zusätzlich die echte Geometrie, Öffnungen und Produktangaben zu berücksichtigen.",
    ],
    abrufFrage: "Welche drei Schritte verbinden Gebäudebreite und Dachhöhe mit der gesamten Fläche eines symmetrischen Satteldachs? Warum reicht die Grundfläche nicht?",
    abrufMuster: "Halbe Gebäudebreite bestimmen, mit Höhe und Pythagoras die schräge Länge berechnen und diese mit Firstlänge und zwei Dachseiten multiplizieren. Die Grundfläche verwendet die waagerechte Breite und unterschätzt bei diesem geneigten Dach die Dachfläche.",
    baustelle: "Die berechnete Dachfläche wirkt passend. Bei der Besichtigung siehst du aber Überstände und eine Gaube, die in der vereinfachten Skizze fehlen.",
    transferFrage: "Kannst du die Rechnung unverändert zur Bestellung verwenden? Begründe deine nächsten Schritte.",
    transferMuster: "Nein. Die Rechnung gilt für die angenommene Geometrie. Die tatsächlichen Maße und zusätzlichen Flächen bzw. Öffnungen aufnehmen, die Fläche anpassen und danach Deckmaße, Sonderteile und Zuschläge berücksichtigen.",
  },
  {
    id: "bahnen", titel: "Nutzbreite und Überdeckung",
    erklaerung: [
      "Die erste Bahn deckt im vereinfachten Modell ihre volle Breite. Jede weitere deckt nur Bahnbreite minus seitlicher Überdeckung zusätzlich ab.",
      "Bei 1,20 m Bahnbreite und vorgegebenen 0,15 m Überdeckung liefert jede weitere Bahn 1,05 m zusätzliche Breite. Prüfe die gesamte Deckbreite, bis die benötigte Breite erreicht wird.",
      "Anzahl der ganzen Bahnen × Länge je Bahn ergibt laufende Meter. Fläche und laufende Meter sind verschiedene Mengen. Überdeckungen und Verbindungen hängen vom konkreten Produkt und Aufbau ab.",
    ],
    abrufFrage: "Warum ist die zusätzliche Deckbreite kleiner als die Bahnbreite? Wie prüfst du die Zahl ganzer Bahnen, und wie kommst du zu den laufenden Metern?",
    abrufMuster: "Die Überdeckung liegt auf einer schon bedeckten Fläche. Für n Bahnen beträgt die Deckbreite im Modell Bahnbreite + (n − 1) × Nutzbreite. Genügend ganze Bahnen einplanen und deren Anzahl mit der Länge je Bahn multiplizieren.",
    baustelle: "Ein neues Bahnenprodukt wird geliefert. Ein Kollege will die Überdeckung aus einer früheren Übungsrechnung übernehmen und die Menge unverändert lassen.",
    transferFrage: "Was musst du vor der Verlegung und Mengenfreigabe prüfen?",
    transferMuster: "Produkt und Funktion der Bahn, Herstellerangaben und anwendbare Planung bzw. Regeln prüfen. Erst mit der passenden Überdeckung und Verbindung lässt sich die Nutzbreite und Menge bestimmen. Eine Rechenannahme ist keine allgemeine Verlegevorgabe.",
  },
  {
    id: "regen", titel: "Regenmenge und Abfluss",
    erklaerung: [
      "1 mm Regen auf 1 m² entspricht 1 Liter Wasser: 1 m² × 0,001 m = 0,001 m³ = 1 Liter.",
      "Regenhöhe in mm × vorgegebene Fläche in m² ergibt in dieser vereinfachten Rechnung Liter. Für den mittleren Abfluss in Liter/s teilst du durch die Zeit in Sekunden.",
      "Beispiel: 600 Liter in 10 Minuten ergeben 600 / 600 = 1 Liter/s. Ein Ereignismittelwert reicht nicht zur Bemessung einer Dachentwässerung.",
    ],
    abrufFrage: "Wie übersetzt du Millimeter Regen und Quadratmeter Fläche in Liter? Welche Zeitumrechnung braucht Liter/s, und warum reicht ein Mittelwert nicht zur Bemessung?",
    abrufMuster: "1 mm auf 1 m² entspricht 1 Liter. Regenhöhe × Fläche ergibt die Wassermenge. Minuten × 60 ergibt Sekunden; Wassermenge / Sekunden ergibt mittlere Liter/s. Bemessungsregen und Systemleistung sind damit noch nicht bestimmt.",
    baustelle: "Nach einem einzelnen Regenereignis wird ein mittlerer Abfluss berechnet. Ein Kollege möchte allein damit die Größe des Dachablaufs festlegen.",
    transferFrage: "Warum ist das nicht ausreichend, und welche Angaben fehlen?",
    transferMuster: "Ein Ereignismittelwert ersetzt keine Bemessungsregenspende. Maßgebende Regendaten, wirksame Einzugsfläche, Systemgeometrie und Leistungsdaten, Planung und anwendbare Regeln sowie gegebenenfalls Notentwässerung sind zu berücksichtigen.",
  },
];

export interface LernwegStand {
  schritt: number;
  erinnerung: string;
  erinnerungVerglichen: boolean;
  erinnerungBewertung?: Bewertung;
  zahlen: string[];
  rechnungGeprueft: boolean;
  transfer: string;
  transferVerglichen: boolean;
  transferBewertung?: Bewertung;
}
export const lernwegStore = createStringStore("lernweg-v1");
export const lernwegAuswahl = createStringStore("lernweg-thema");
const istBewertung = (v: unknown): v is Bewertung => v === "richtig" || v === "teilweise" || v === "falsch";

export function leererLernweg(id: string): LernwegStand {
  const fall = PRAXISFAELLE.find((f) => f.id === id);
  return { schritt: 0, erinnerung: "", erinnerungVerglichen: false, zahlen: fall?.rechnungen.map(() => "") ?? [], rechnungGeprueft: false, transfer: "", transferVerglichen: false };
}

export function rechnungGeschafft(id: string, s: LernwegStand): boolean {
  const fall = PRAXISFAELLE.find((f) => f.id === id);
  return !!fall && s.rechnungGeprueft && fall.rechnungen.every((r, i) => pruefePraxisZahl(s.zahlen[i] ?? "", r.ergebnis));
}

export function leseLernwege(text: string): Record<string, LernwegStand> {
  try {
    const daten = JSON.parse(text);
    if (!daten || typeof daten !== "object" || Array.isArray(daten)) return {};
    const valid: Record<string, LernwegStand> = {};
    for (const e of LERNWEGE) {
      const s = daten[e.id];
      if (!s || typeof s.erinnerung !== "string" || typeof s.transfer !== "string" || !Array.isArray(s.zahlen) ||
          s.zahlen.length !== leererLernweg(e.id).zahlen.length || !s.zahlen.every((v: unknown) => typeof v === "string")) continue;
      const stand: LernwegStand = {
        schritt: Number.isInteger(s.schritt) && s.schritt >= 0 && s.schritt <= 4 ? s.schritt : 0,
        erinnerung: s.erinnerung, erinnerungVerglichen: s.erinnerungVerglichen === true && !!s.erinnerung.trim(),
        zahlen: s.zahlen, rechnungGeprueft: s.rechnungGeprueft === true,
        transfer: s.transfer, transferVerglichen: s.transferVerglichen === true && !!s.transfer.trim(),
      };
      if (stand.erinnerungVerglichen && istBewertung(s.erinnerungBewertung)) stand.erinnerungBewertung = s.erinnerungBewertung;
      if (stand.transferVerglichen && istBewertung(s.transferBewertung)) stand.transferBewertung = s.transferBewertung;
      if (stand.schritt >= 2 && !stand.erinnerungBewertung) stand.schritt = 1;
      if (stand.schritt >= 3 && !rechnungGeschafft(e.id, stand)) stand.schritt = 2;
      if (stand.schritt === 4 && !stand.transferBewertung) stand.schritt = 3;
      valid[e.id] = stand;
    }
    return valid;
  } catch { return {}; }
}

export function speichereLernweg(id: string, stand: LernwegStand) {
  lernwegStore.set(JSON.stringify({ ...leseLernwege(lernwegStore.getSnapshot()), [id]: stand }));
}
