import { leseDezimalzahl } from "@/lib/zahlen";
import { appStorage } from "@/lib/lernSpeicher";
import type { Bewertung } from "@/content/schema";
import { validReviewResult, type ReviewResult } from "@/lib/review";

export type AufbauArt = "formeln" | "trig" | "flaechen" | "laengen" | "lattung" | "bedarf" | "waerme" | "gefaelle" | "masse" | "kosten";
export interface AufbauEinheit { id: string; version: number; titel: string; ziel: string; text: string; merksatz: string; beispiel: string; art: AufbauArt; aufgabenIds: string[]; anschluss: string }
export interface AufbauSchritt { id: string; label: string; formel: string; einsetzen: string; wert: number; einheit: string; einheiten: string[]; stellen: number; toleranz: number; ganzzahl: boolean }
export interface AufbauAufgabe { id: string; version: 1; variante: number; einheitId: string; titel: string; frage: string; gegeben: string[]; schritte: AufbauSchritt[]; erklaerung: string }
export interface AufbauAntwort { wert: string; einheit: string }
export interface AufbauErgebnis { bewertung: Bewertung; richtig: boolean; erreicht: number; moeglich: number; schritte: Record<string, { richtig: boolean; hinweis: string }> }
const f = (n: number, stellen = 2) => n.toLocaleString("de-DE", { maximumFractionDigits: stellen });
function schritt(id: string, label: string, formel: string, einsetzen: string, wert: number, einheit: string, stellen = 2, ganzzahl = false): AufbauSchritt {
  const falsch = einheit === "m" ? ["m²", "cm"] : einheit === "m²" ? ["m", "m³"] : einheit === "cm" ? ["m", "cm²"] : einheit === "°" ? ["%", "m"] : einheit === "%" ? ["°", "€"] : einheit === "Stück" ? ["m²", "m"] : einheit === "€" ? ["%", "€/m²"] : einheit === "kg" ? ["m³", "kg/m³"] : einheit === "m³" ? ["m²", "kg"] : ["m", "m²"];
  return { id, label, formel, einsetzen, wert, einheit, einheiten: [einheit, ...falsch], stellen, toleranz: ganzzahl ? 0 : .5 * 10 ** -stellen, ganzzahl };
}
const S = schritt;

export const AUFBAU_EINHEITEN: AufbauEinheit[] = [
{"id": "aufbau-formeln", "version": 1, "titel": "Formeln passend umstellen", "ziel": "Du stellst eine Formel nach der gesuchten Größe um und prüfst die Einheit.", "text": "Eine Formel verbindet Größen miteinander. Beim Umstellen soll die gesuchte Größe allein auf einer Seite stehen. Was du auf einer Seite machst, musst du auch auf der anderen Seite machen. Aus A = l × b wird deshalb b = A / l: Beide Seiten werden durch l geteilt. Prüfe anschließend die Einheiten. Quadratmeter geteilt durch Meter ergeben wieder Meter. Bei einer Gleichung mit einem Zuschlag ziehst du zuerst den Grundbetrag ab oder teilst durch den Gesamtfaktor. Schreibe den umgestellten Ausdruck vor den eingesetzten Zahlen auf. So erkennst du, ob du tatsächlich die gesuchte Größe berechnest. Die drei Aufgaben üben verschiedene Umstellungen an ausdrücklich vorgegebenen Rechenmodellen.", "merksatz": "Erst die gesuchte Größe freistellen, dann Zahlen mit passenden Einheiten einsetzen.", "beispiel": "A = l × b → b = A / l. Bei 24 m² und 6 m Länge ist b = 4 m.", "art": "formeln", "aufgabenIds": ["aufbau-formeln-1", "aufbau-formeln-2", "aufbau-formeln-3"], "anschluss": "/lernen/lf02"},
{"id": "aufbau-trig", "version": 1, "titel": "Winkel, Höhe und Dachschräge", "ziel": "Du wählst Sinus, Kosinus oder Tangens am rechtwinkligen Dachdreieck.", "text": "Ein rechtwinkliges Dachdreieck verbindet waagerechte Strecke, Höhe und schräge Länge. Gegenüber dem rechten Winkel liegt die längste Seite, die Hypotenuse. Gegenüber dem eingezeichneten Dachwinkel liegt die Gegenkathete; die andere Kathete liegt an diesem Winkel an. Sinus ist Gegenkathete durch Hypotenuse. Kosinus ist Ankathete durch Hypotenuse. Tangens ist Gegenkathete durch Ankathete. Wähle die Beziehung nach den vorhandenen Größen. Ist die Schräge gesucht und die waagerechte Strecke bekannt, hilft der Kosinus. Bei Höhe und waagerechter Strecke passt der Tangens. Für einen gesuchten Winkel verwendest du die Umkehrfunktion. Die Winkel dieser Übungen werden in Grad angegeben; verwechsle sie nicht mit Prozentgefälle.", "merksatz": "sin = gegenüber / schräg · cos = anliegend / schräg · tan = gegenüber / anliegend.", "beispiel": "Bei 4 m waagerechter Strecke und 30° Dachneigung ist die Höhe 4 × tan(30°) ≈ 2,31 m.", "art": "trig", "aufgabenIds": ["aufbau-trig-1", "aufbau-trig-2", "aufbau-trig-3"], "anschluss": "/lernen/lf08"},
{"id": "aufbau-flaechen", "version": 1, "titel": "Zusammengesetzte Dachflächen", "ziel": "Du zerlegst Flächen und unterscheidest Dachfläche, Grundfläche und Öffnungen.", "text": "Ein Dach muss nicht aus einem einzigen Rechteck bestehen. Zerlege seine Ansicht zunächst in einfache, eindeutig bemaßte Flächen. Berechne die Teilflächen getrennt und addiere sie anschließend. Ein dreieckiges Feld braucht eine Grundlinie und die dazu senkrechte Höhe in derselben Ebene. Die schräge Randseite ist nicht automatisch diese Höhe. Bei einem gleich geneigten Walmdach kann die waagerecht projizierte Gesamtfläche durch den Kosinus der gemeinsamen Dachneigung geteilt werden. Das funktioniert nur unter den ausdrücklich genannten geometrischen Voraussetzungen. Öffnungen ziehst du hier ab, wenn die Aufgabe die reine geometrische Fläche verlangt. Regeln für ein abrechenbares Aufmaß sind eine eigene Fragestellung. Zeichne vor dem Rechnen die Flächenteile und die verwendeten Maße ein.", "merksatz": "Teilflächen einzeln rechnen; Projektionsmaße und wirkliche Dachmaße unterscheiden.", "beispiel": "Ein Rechteck 6 × 4 m und ein Dreieck 4 × 3 / 2 m² ergeben zusammen 30 m².", "art": "flaechen", "aufgabenIds": ["aufbau-flaechen-1", "aufbau-flaechen-2", "aufbau-flaechen-3"], "anschluss": "/lernen/lf08"},
{"id": "aufbau-laengen", "version": 1, "titel": "Wahre Sparren-, Grat- und Kehllängen", "ziel": "Du berechnest eine räumlich geneigte Strecke aus ihren senkrechten Anteilen.", "text": "Eine Linie im Grundriss zeigt nur ihre waagerechte Projektion. Für die wahre Länge brauchst du zusätzlich den Höhenunterschied. Bei einem Sparren bilden waagerechte Strecke und Firsthöhe ein rechtwinkliges Dreieck. Am Grat eines gleich geneigten Walmdachs kommen zwei waagerechte Richtungen zusammen. Bestimme zuerst ihre Diagonale und anschließend die räumliche Länge mit der Höhe. Dieselbe räumliche Beziehung lässt sich für eine Kehllinie verwenden, wenn ihre beiden rechtwinkligen Grundrissanteile und ihre Höhe bekannt sind. Die Aufgaben geben diese Anteile ausdrücklich vor. Du musst sie bei einem realen Dach erst aus einem passenden Plan bestimmen. Rechne mit ungerundeten Zwischenwerten weiter und runde erst den gefragten Ausgabewert.", "merksatz": "Räumliche Länge = √(x² + y² + h²), wenn die drei Anteile senkrecht aufeinander stehen.", "beispiel": "Mit x = 3 m, y = 4 m und h = 2 m ist die räumliche Länge √29 ≈ 5,39 m.", "art": "laengen", "aufgabenIds": ["aufbau-laengen-1", "aufbau-laengen-2", "aufbau-laengen-3"], "anschluss": "/lernen/lf13a"},
{"id": "aufbau-lattung", "version": 1, "titel": "Lattweiten und Reihen einteilen", "ziel": "Du bestimmst ganze Abstände und korrigierst danach das tatsächliche Teilungsmaß.", "text": "Eine vorgegebene Strecke muss häufig in gleich große Abstände geteilt werden. Wenn ein größter zulässiger Abstand vorgegeben ist, teilst du die Strecke zunächst durch diesen Wert. Die Anzahl der Abstände wird auf eine ganze Zahl aufgerundet, damit der größte Abstand nicht überschritten wird. Danach teilst du die tatsächliche Strecke durch diese ganze Anzahl. So erhältst du das korrigierte Teilungsmaß. Unterscheide dabei Abstände und Lattenreihen: Vier Abstände zwischen zwei Randmarkierungen benötigen fünf Reihen einschließlich beider Randreihen. Die Aufgaben geben die nutzbare Einteilungsstrecke zwischen den Markierungen an. Besondere Trauf- und Firstabstände sind dabei bereits ausgenommen. Produktbezogene Deckmaße werden als Aufgabenwerte vorgegeben und dürfen nicht beliebig ersetzt werden.", "merksatz": "Anzahl Abstände aufrunden; tatsächliches Maß anschließend aus der ganzen Anzahl berechnen.", "beispiel": "4,20 m / 0,35 m = 12 Abstände. Zwischen den Randmarkierungen liegen damit 13 Reihen.", "art": "lattung", "aufgabenIds": ["aufbau-lattung-1", "aufbau-lattung-2", "aufbau-lattung-3"], "anschluss": "/lernen/lf02"},
{"id": "aufbau-bedarf", "version": 1, "titel": "Deckmaße, Überdeckung und Bedarf", "ziel": "Du leitest den Materialbedarf aus wirksamen Maßen und ganzen Einheiten ab.", "text": "Das Außenmaß eines Werkstoffs ist nicht immer sein wirksames Deckmaß. Eine Überdeckung vermindert die Fläche oder Breite, die ein weiteres Teil zusätzlich abdeckt. Rechne deshalb zuerst mit den in der Aufgabe genannten Nutzmaßen. Bei Ziegeln ergibt die Deckfläche je Stück den Grundbedarf. Ein vorgegebener Zuschlag wird anschließend auf den ungerundeten Grundbedarf angewendet. Erst die endgültige Stückzahl wird aufgerundet. Bei nebeneinander verlegten Bahnen deckt die erste Bahn ihre volle Breite; jede weitere ergänzt nur die Nutzbreite nach Abzug der seitlichen Überdeckung. Eine Kontrolle mit einer Bahn weniger zeigt, ob die Anzahl wirklich nötig ist. In den Aufgaben bleiben Randanschlüsse und weitere Verluste nur dann unberücksichtigt, wenn dies ausdrücklich angegeben wird.", "merksatz": "Mit Nutzmaßen rechnen, Zuschläge getrennt anwenden und ganze Stückzahlen zuletzt aufrunden.", "beispiel": "1,00 m Bahnbreite mit 0,10 m Überdeckung ergänzt je weiterer Bahn 0,90 m Nutzbreite.", "art": "bedarf", "aufgabenIds": ["aufbau-bedarf-1", "aufbau-bedarf-2", "aufbau-bedarf-3"], "anschluss": "/lernen/lf09"},
{"id": "aufbau-waerme", "version": 1, "titel": "Mehrere Schichten und der U-Wert", "ziel": "Du berechnest Schichtwiderstände und den U-Wert eines vereinfachten Aufbaus.", "text": "Eine Schicht bremst den Wärmestrom abhängig von ihrer Dicke und Wärmeleitfähigkeit. Der Wärmedurchlasswiderstand lautet R = d / λ. Setze die Dicke in Metern ein. Mehrere hintereinanderliegende Schichten ergeben die Summe ihrer Widerstände. Dazu kommen die in der Aufgabe ausdrücklich vorgegebenen Wärmeübergangswiderstände. Der U-Wert ist der Kehrwert dieser Gesamtsumme. Deshalb führt ein größerer Gesamtwiderstand zu einem kleineren U-Wert. Rechne die Schichten einzeln und beschrifte jede Größe mit ihrer Einheit. Die folgenden Aufgaben betrachten ebene, gleichmäßige Schichten. Wiederkehrende Sparren, Wärmebrücken, Befestigungen und weitere Korrekturen sind kein Teil dieses vereinfachten Modells. Das Ergebnis erklärt den Zusammenhang; ein vollständiger Bauteilnachweis benötigt den tatsächlichen Aufbau und seine maßgebenden Randbedingungen.", "merksatz": "R einer Schicht = d / λ · R gesamt = Summe der Widerstände · U = 1 / R gesamt.", "beispiel": "0,16 m / 0,04 W/(mK) = 4 m²K/W. Bei zusätzlich 0,20 m²K/W ist U = 1 / 4,20 ≈ 0,238 W/(m²K).", "art": "waerme", "aufgabenIds": ["aufbau-waerme-1", "aufbau-waerme-2", "aufbau-waerme-3"], "anschluss": "/lernen/anhang2"},
{"id": "aufbau-gefaelle", "version": 1, "titel": "Gefälle und Winkel verbinden", "ziel": "Du rechnest zwischen Höhenunterschied, Prozentgefälle und Winkel um.", "text": "Ein Prozentgefälle beschreibt das Verhältnis des Höhenunterschieds zur waagerechten Strecke. Für zwei Prozent kommen auf hundert Zentimeter waagerechter Strecke zwei Zentimeter Höhe. Der Winkel ist dagegen eine Angabe in Grad. Die Verbindung stellt der Tangens her: tan α = h / L. Deshalb lautet der Winkel arctan(p / 100), wenn das Gefälle p in Prozent bekannt ist. Umgekehrt ergibt tan α mal hundert den Prozentwert. Bringe Höhe und waagerechte Strecke vor einer Verhältnisrechnung in dieselbe Einheit. Eine schräge gemessene Strecke darfst du nicht ohne Prüfung als waagerechte Strecke einsetzen. Die angegebenen Gefälle sind Rechenwerte dieser Aufgaben; sie legen keinen allgemein passenden Dachaufbau fest.", "merksatz": "p = h / L × 100 · α = arctan(p / 100). Prozent und Grad sind verschiedene Größen.", "beispiel": "2 % ergeben arctan(0,02) ≈ 1,15°. Bei 6 m waagerecht entstehen 12 cm Höhenunterschied.", "art": "gefaelle", "aufgabenIds": ["aufbau-gefaelle-1", "aufbau-gefaelle-2", "aufbau-gefaelle-3"], "anschluss": "/lernen/lf10"},
{"id": "aufbau-masse", "version": 1, "titel": "Vom Volumen zur Materialmasse", "ziel": "Du berechnest Masse aus Volumen und gegebener Dichte.", "text": "Eine Fläche beschreibt noch nicht, wie schwer ein Material ist. Für eine gleichmäßige Schicht brauchst du zuerst die Dicke. Fläche mal Dicke ergibt ihr Volumen. Multipliziere dieses Volumen mit der in der Aufgabe angegebenen Dichte, um die Masse zu erhalten. Bei Kubikmetern und Kilogramm je Kubikmeter kommt das Ergebnis in Kilogramm heraus. Rechne Millimeter oder Zentimeter vor der Volumenformel in Meter um. Für mehrere gleiche Teile berechnest du zunächst das Volumen eines Teils und multiplizierst mit der Stückzahl. Die Dichte muss zum betrachteten Material und seinem Zustand passen. Die berechnete Materialmasse allein bestätigt keine zulässige Dachlast oder Tragfähigkeit. Dafür braucht man weitere Angaben zur Konstruktion und zur Lastverteilung.", "merksatz": "V = A × d · m = V × ρ. Dicke in Meter, Dichte passend zum Material einsetzen.", "beispiel": "10 m² × 0,02 m × 500 kg/m³ = 100 kg Materialmasse.", "art": "masse", "aufgabenIds": ["aufbau-masse-1", "aufbau-masse-2", "aufbau-masse-3"], "anschluss": "/lernen/lf05"},
{"id": "aufbau-kosten", "version": 1, "titel": "Material und Kosten nachvollziehbar planen", "ziel": "Du trennst Grundbetrag, Zuschlag, Arbeitszeit und vorgegebene Steuerrechnung.", "text": "Eine Kostenrechnung wird verständlich, wenn du ihre Bausteine getrennt aufschreibst. Materialmenge mal Preis je Einheit ergibt den Grundbetrag. Ein ausdrücklich vorgegebener Zuschlag verändert zunächst die Menge oder den dafür bezeichneten Betrag. Arbeitskosten ergeben sich aus den gesamten Personenstunden mal dem angegebenen Stundensatz. Drei Personen mit je vier Stunden liefern zwölf Personenstunden. Danach werden die zum Auftrag gehörenden Nettobeträge addiert. Eine in der Aufgabe vorgegebene Umsatzsteuer wird erst auf den dafür genannten Nettobetrag gerechnet. Bei einem Nachlass ziehst du den Nachlassbetrag ab und rechnest mit dem verminderten Betrag weiter. Die Beispiele verwenden festgelegte Übungswerte und vereinfachte Preisannahmen. Prüfe immer, ob nach einem Teilbetrag oder dem gesamten Endbetrag gefragt ist.", "merksatz": "Menge × Einheitspreis; Personen × Stunden × Satz; Zuschlag und Steuer jeweils auf die richtige Grundlage.", "beispiel": "3 Personen × 4 h × 30 €/h = 360 €. Ein Nettobetrag von 100 € mit vorgegebenen 19 % ergibt 119 €.", "art": "kosten", "aufgabenIds": ["aufbau-kosten-1", "aufbau-kosten-2", "aufbau-kosten-3"], "anschluss": "/lernen/wiso"},
];

/** A complete numeric variant is produced once, then stored with its answers. */
export function erzeugeAufbauAufgabe(id: string, variante = 0): AufbauAufgabe {
  if (!Number.isSafeInteger(variante) || variante < 0 || variante > 1_000_000_000) throw new Error("Ungültige Aufgabenvariante.");
  const e = AUFBAU_EINHEITEN.find(u => u.aufgabenIds.includes(id));
  if (!e) throw new Error("Unbekannte Aufbauaufgabe.");
  const n = e.aufgabenIds.indexOf(id) + 1, k = variante % 5;
  const a = <T,>(werte: readonly T[]) => werte[k];
  const b = a([4, 5, 6, 3, 7]), h = a([3, 4, 5, 2, 6]);
  const alpha = a([30, 25, 35, 40, 20]), rad = alpha * Math.PI / 180;
  let frage = "", gegeben: string[] = [], schritte: AufbauSchritt[] = [], erklaerung = "";
  switch (`${e.art}-${n}`) {
    case "formeln-1": {
      const l = a([6, 8, 10, 5, 12]), A = l * b;
      frage = "Ein rechteckiges Feld hat eine bekannte Fläche und Länge. Stelle die Flächenformel nach der Breite um und berechne die Breite.";
      gegeben = [`A = ${A} m²`, `l = ${l} m`, "A = l × b"];
      schritte = [S("breite", "Breite b", "b = A / l", `${A} / ${l}`, b, "m")];
      erklaerung = "Teile beide Seiten durch die Länge. m² geteilt durch m ergibt m."; break;
    }
    case "formeln-2": {
      const R = a([4, 3, 5, 4.5, 3.5]), lambda = a([.04, .035, .032, .038, .036]);
      frage = "Die Formel R = d / λ ist gegeben. Berechne die Schichtdicke d in Metern und anschließend in Zentimetern.";
      gegeben = [`R = ${f(R)} m²K/W`, `λ = ${f(lambda, 3)} W/(mK)`];
      const d = R * lambda;
      schritte = [S("dicke", "Schichtdicke d in Metern", "d = R × λ", `${f(R)} × ${f(lambda, 3)}`, d, "m", 3), S("zentimeter", "Schichtdicke in Zentimetern", "d(cm) = d(m) × 100", `${f(d, 4)} × 100`, d * 100, "cm", 1)];
      erklaerung = "Das Teilen durch λ wird durch Multiplizieren mit λ aufgehoben."; break;
    }
    case "formeln-3": {
      const grund = a([200, 300, 400, 500, 250]), p = a([10, 8, 5, 12, 6]), gesamt = grund + Math.round(grund * p / 100);
      frage = "Eine ursprüngliche Menge und eine Gesamtmenge mit Zuschlag sind bekannt. Wie groß sind der Zuschlag und sein Prozentsatz?";
      gegeben = [`Grundmenge ${grund} Stück`, `Gesamtmenge ${f(gesamt)} Stück`];
      schritte = [S("zuschlag", "Zusätzliche Stückzahl", "Z = Gesamt − Grundmenge", `${f(gesamt)} − ${grund}`, gesamt - grund, "Stück", 0, true), S("prozent", "Zuschlag in Prozent", "p = Z / Grundmenge × 100", `${f(gesamt - grund)} / ${grund} × 100`, p, "%", 1)];
      erklaerung = "Die zusätzliche Menge wird auf die ursprüngliche Menge bezogen."; break;
    }
    case "trig-1": {
      frage = "Berechne an einem rechtwinkligen Dachdreieck die schräge Länge aus waagerechter Strecke und Dachneigung.";
      gegeben = [`Waagerechte Strecke b = ${b} m`, `Dachneigung α = ${alpha}°`];
      schritte = [S("kosinus", "Kosinus des Winkels", "cos α", `cos(${alpha}°)`, Math.cos(rad), "ohne Einheit", 4), S("schraege", "Schräge Länge c", "c = b / cos α", `${b} / cos(${alpha}°)`, b / Math.cos(rad), "m")];
      erklaerung = "Die waagerechte Strecke liegt am Winkel an. Sie ist die Ankathete."; break;
    }
    case "trig-2": {
      frage = "Berechne die Höhe eines rechtwinkligen Dachdreiecks aus der waagerechten Strecke und der Dachneigung.";
      gegeben = [`b = ${b} m waagerecht`, `α = ${alpha}°`];
      schritte = [S("tangens", "Tangens des Winkels", "tan α", `tan(${alpha}°)`, Math.tan(rad), "ohne Einheit", 4), S("hoehe", "Höhe h", "h = b × tan α", `${b} × tan(${alpha}°)`, b * Math.tan(rad), "m")];
      erklaerung = "Tangens verbindet die Gegenkathete Höhe mit der Ankathete Grundmaß."; break;
    }
    case "trig-3": {
      const c = Math.hypot(b, h);
      frage = "Höhe und waagerechte Strecke sind bekannt. Bestimme zuerst die Schräge und dann die Dachneigung mit der Sinusbeziehung.";
      gegeben = [`b = ${b} m`, `h = ${h} m`, "rechter Winkel zwischen b und h"];
      schritte = [S("schraege", "Schräge Länge c", "c = √(b² + h²)", `√(${b}² + ${h}²)`, c, "m"), S("winkel", "Dachneigung α", "α = arcsin(h / c)", `arcsin(${h} / √(${b}² + ${h}²))`, Math.asin(h / c) * 180 / Math.PI, "°", 1)];
      erklaerung = "Sinus ist Höhe durch Hypotenuse. Für den Winkel wird die Umkehrfunktion verwendet."; break;
    }
    case "flaechen-1": {
      const l = a([6, 8, 10, 7, 9]);
      frage = "Addiere eine rechteckige und eine dreieckige Dachteilfläche. Alle Maße sind wahre Maße in der jeweiligen Dachfläche.";
      gegeben = [`Rechteck ${l} m × ${b} m`, `Dreieck: Grundlinie ${b} m, dazu senkrechte Höhe ${h} m`];
      schritte = [S("rechteck", "Rechteckfläche", "A₁ = l × b", `${l} × ${b}`, l * b, "m²"), S("dreieck", "Dreiecksfläche", "A₂ = g × h / 2", `${b} × ${h} / 2`, b * h / 2, "m²"), S("gesamt", "Gesamtfläche", "A = A₁ + A₂", `${l * b} + ${b * h / 2}`, l * b + b * h / 2, "m²")];
      erklaerung = "Die Dreieckshöhe steht senkrecht auf ihrer Grundlinie. Beide Teilflächen werden addiert."; break;
    }
    case "flaechen-2": {
      const l = a([12, 14, 16, 10, 18]), B = b * 2;
      frage = "Ein idealisiertes Walmdach hat überall dieselbe Dachneigung. Berechne seine gesamte Dachfläche aus dem vollständig überdeckten rechteckigen Grundriss. Keine Überstände oder Öffnungen.";
      gegeben = [`Grundriss ${l} m × ${B} m`, `Alle Dachflächen ${alpha}° geneigt`];
      schritte = [S("grundflaeche", "Waagerechte Projektionsfläche", "A₀ = l × B", `${l} × ${B}`, l * B, "m²"), S("dachflaeche", "Wahre Dachfläche", "A = A₀ / cos α", `${l * B} / cos(${alpha}°)`, l * B / Math.cos(rad), "m²")];
      erklaerung = "Bei gemeinsamer Dachneigung skaliert der Kosinus alle Projektionsflächen gleich."; break;
    }
    case "flaechen-3": {
      const l = a([10, 12, 14, 9, 11]), loch = a([2, 3, 4, 1.5, 2.5]);
      frage = "Ein Pultdach wird geometrisch betrachtet. Ziehe die ausdrücklich abzuziehende Öffnung von der wahren rechteckigen Dachfläche ab.";
      gegeben = [`Länge ${l} m`, `Wahre schräge Breite ${b} m`, `Öffnungsfläche ${f(loch)} m²`, "Reine Geometrie, keine Abrechnungsregel"];
      schritte = [S("brutto", "Dachfläche vor Abzug", "A = l × s", `${l} × ${b}`, l * b, "m²"), S("netto", "Geometrische Fläche nach Abzug", "Aₙ = A − Aöffnung", `${l * b} − ${f(loch)}`, l * b - loch, "m²")];
      erklaerung = "Die Öffnung wird hier laut Aufgabenstellung abgezogen. Ein Aufmaß kann andere Regeln haben."; break;
    }
    case "laengen-1": {
      frage = "Ein symmetrisches Satteldach hat einen mittigen First. Bestimme halbe Gebäudebreite und Sparrenlänge ohne Überstände.";
      gegeben = [`Gebäudebreite B = ${2 * b} m`, `Firsthöhe h = ${h} m über der Traufe`];
      schritte = [S("halb", "Halbe Gebäudebreite", "b = B / 2", `${b * 2} / 2`, b, "m"), S("sparren", "Wahre Sparrenlänge", "s = √(b² + h²)", `√(${b}² + ${h}²)`, Math.hypot(b, h), "m")];
      erklaerung = "Erst die halbe Breite verwenden, dann das rechtwinklige Höhendreieck rechnen."; break;
    }
    case "laengen-2": {
      frage = "Ein Grat hat bei einem idealisierten gleich geneigten Walmdach zwei gleich große rechtwinklige Grundrissanteile. Berechne seine wahre räumliche Länge.";
      gegeben = [`Grundrissanteile x = y = ${b} m`, `Höhenunterschied h = ${h} m`];
      schritte = [S("projektion", "Waagerechte Gratprojektion", "g₀ = √(x² + y²)", `√(${b}² + ${b}²)`, Math.hypot(b, b), "m"), S("grat", "Wahre Gratlänge", "g = √(x² + y² + h²)", `√(${b}² + ${b}² + ${h}²)`, Math.hypot(b, b, h), "m")];
      erklaerung = "Die Grundrissdiagonale ist erst der waagerechte Anteil des räumlichen Dreiecks."; break;
    }
    case "laengen-3": {
      const y = b + 1;
      frage = "Aus dem Plan sind zwei rechtwinklige Grundrissanteile einer geraden Kehllinie und ihr Höhenunterschied gegeben. Bestimme die räumliche Kehllänge.";
      gegeben = [`x = ${b} m`, `y = ${y} m rechtwinklig zu x`, `h = ${h} m senkrecht zum Grundriss`];
      schritte = [S("projektion", "Waagerechte Kehlprojektion", "k₀ = √(x² + y²)", `√(${b}² + ${y}²)`, Math.hypot(b, y), "m"), S("kehle", "Wahre Kehllänge", "k = √(x² + y² + h²)", `√(${b}² + ${y}² + ${h}²)`, Math.hypot(b, y, h), "m")];
      erklaerung = "Die vorgegebenen drei senkrechten Anteile liefern die wahre Strecke; ihre Lage muss zum Plan passen."; break;
    }
    case "lattung-1": {
      const L = a([4.3, 5.2, 6.1, 4.7, 5.8]), max = .35, anzahl = Math.ceil(L / max);
      frage = "Teile die nutzbare Strecke zwischen zwei Randmarkierungen ein. Der vorgegebene größte Abstand beträgt 35 cm. Trauf- und Firstsondermaße sind bereits ausgenommen.";
      gegeben = [`Nutzbare Einteilungsstrecke ${f(L)} m`, "Größter vorgegebener Abstand 0,35 m"];
      schritte = [S("anzahl", "Ganze Anzahl der Abstände", "n = aufrunden(L / amax)", `aufrunden(${f(L)} / 0,35)`, anzahl, "Stück", 0, true), S("abstand", "Korrigierter Abstand in cm", "a = L / n × 100", `${f(L)} / ${anzahl} × 100`, L / anzahl * 100, "cm", 1)];
      erklaerung = "Durch Aufrunden der Anzahl bleibt der tatsächliche Abstand unter der vorgegebenen Grenze."; break;
    }
    case "lattung-2": {
      const anzahl = a([12, 15, 18, 14, 16]), abstand = a([32, 33, 34, 31, 35]);
      frage = "Zwischen zwei Randmarkierungen sind gleich große Abstände vorgesehen. Berechne die gesamte Einteilungsstrecke und die Zahl der Reihen einschließlich beider Randreihen.";
      gegeben = [`${anzahl} Abstände`, `Je ${abstand} cm`, "Beide Randmarkierungen erhalten eine Reihe"];
      schritte = [S("strecke", "Einteilungsstrecke in Metern", "L = n × a / 100", `${anzahl} × ${abstand} / 100`, anzahl * abstand / 100, "m"), S("reihen", "Reihen einschließlich beider Ränder", "Reihen = Abstände + 1", `${anzahl} + 1`, anzahl + 1, "Stück", 0, true)];
      erklaerung = "Die Anzahl der Zwischenräume ist um eins kleiner als die Anzahl der zugehörigen Reihen."; break;
    }
    case "lattung-3": {
      const L = a([5, 5.5, 6, 4.6, 4.9]), min = .31, max = .34, anzahl = Math.ceil(L / max);
      frage = "Ein Übungsprodukt erlaubt Deckabstände von 31 bis 34 cm. Finde die kleinste ganze Anzahl von Abständen für die vorgegebene Einteilungsstrecke und kontrolliere das tatsächliche Maß.";
      gegeben = [`L = ${f(L)} m`, "Vorgegebener Bereich 31–34 cm"];
      const korrekt = L / anzahl;
      if (korrekt < min || korrekt > max) throw new Error("Ungültige Einteilung.");
      schritte = [S("anzahl", "Kleinste ganze Anzahl der Abstände", "n = aufrunden(L / amax)", `aufrunden(${f(L)} / 0,34)`, anzahl, "Stück", 0, true), S("deckmass", "Tatsächliches Deckmaß in cm", "a = L / n × 100", `${f(L)} / ${anzahl} × 100`, korrekt * 100, "cm", 1)];
      erklaerung = "Das tatsächliche Maß liegt im vorgegebenen Produktbereich; Anfang und Ende der Strecke sind bereits festgelegt."; break;
    }
    case "bedarf-1": {
      const A = a([60, 75, 90, 105, 120]), dl = .34, db = .2, roh = A / (dl * db);
      frage = "Berechne den Flächenbedarf und die Bestellung mit ausdrücklich vorgegebenen 8 % Zuschlag. Runde nur die endgültige Bestellmenge auf ganze Stück auf.";
      gegeben = [`Dachfläche ${A} m²`, "Decklänge 0,34 m", "Deckbreite 0,20 m", "Zuschlag 8 %"];
      schritte = [S("deckflaeche", "Wirksame Deckfläche je Stück", "a = dl × db", "0,34 × 0,20", dl * db, "m²", 3), S("grundbedarf", "Rechnerischer Grundbedarf", "N = A / a", `${A} / (0,34 × 0,20)`, roh, "Stück", 2), S("bestellung", "Ganze Bestellmenge mit Zuschlag", "Nbest = aufrunden(N × 1,08)", `aufrunden(${f(roh, 6)} × 1,08)`, Math.ceil(roh * 1.08), "Stück", 0, true)];
      erklaerung = "Der Grundbedarf bleibt intern ungerundet. Erst nach dem Zuschlag wird auf ganze Stück aufgerundet."; break;
    }
    case "bedarf-2": {
      // Values are fixed to tenths of a metre. Integer millimetres prevent an
      // exact six-width fit from becoming 6.000000000000001 and an extra roll.
      const B = a([5.4, 6.4, 7.2, 4.7, 8.2]), L = a([8, 9, 10, 7, 11]), nutz = .9, anzahl = 1 + Math.ceil((Math.round(B * 1000) - 1000) / 900);
      frage = "Verlege ganze 1-m-Bahnen nebeneinander. Die erste Bahn deckt 1 m; jede weitere überdeckt die vorherige seitlich um 10 cm. Jede Bahn läuft ohne Stoß über die gesamte Länge. Randanschlüsse und Verschnitt bleiben unberücksichtigt.";
      gegeben = [`Fläche ${L} m lang und ${f(B)} m breit`, "Bahnbreite 1,00 m", "Seitliche Überdeckung 0,10 m"];
      schritte = [S("nutzbreite", "Zusätzliche Nutzbreite je weiterer Bahn", "b = 1,00 − 0,10", "1,00 − 0,10", nutz, "m"), S("bahnen", "Mindestens ganze Bahnen", "n = 1 + aufrunden((B − 1) / 0,9)", `1 + aufrunden((${f(B)} − 1) / 0,9)`, anzahl, "Stück", 0, true), S("laenge", "Gesamte laufende Meter Bahn", "Lgesamt = n × L", `${anzahl} × ${L}`, anzahl * L, "m")];
      erklaerung = "Die volle erste Bahn zählt separat. Eine Bahn weniger würde die vorgegebene Breite nicht abdecken."; break;
    }
    case "bedarf-3": {
      const laenge = a([10, 12, 14, 16, 18]), teile = a([4, 5, 6, 7, 8]), ueber = .1;
      frage = "Ein gerader Anschluss wird aus gleich langen Stücken mit Überdeckungen zusammengesetzt. Berechne die erforderliche gesamte Zuschnittlänge und die Länge eines gleich großen Stücks. Keine zusätzlichen Endzugaben.";
      gegeben = [`Fertige Anschlusslänge ${laenge} m`, `${teile} Stücke`, "Je innerer Fuge 0,10 m Überdeckung"];
      const gesamt = laenge + (teile - 1) * ueber;
      schritte = [S("fugen", "Innere Fugen", "Fugen = Stücke − 1", `${teile} − 1`, teile - 1, "Stück", 0, true), S("gesamt", "Gesamte Zuschnittlänge", "Lz = Lfertig + Fugen × Überdeckung", `${laenge} + ${teile - 1} × 0,10`, gesamt, "m"), S("stueck", "Zuschnittlänge je Stück", "l = Lz / Stückzahl", `${f(gesamt)} / ${teile}`, gesamt / teile, "m", 3)];
      erklaerung = "Nur innere Fugen überdecken ein anderes Stück. Vier Stücke haben drei solche Fugen."; break;
    }
    case "waerme-1": {
      const d = a([.16, .18, .20, .14, .22]), lambda = .04;
      frage = "Berechne den Widerstand einer gleichmäßigen Dämmschicht. Verwende die Dicke in Metern.";
      gegeben = [`Dicke ${f(d * 100)} cm`, "λ = 0,040 W/(mK)"];
      schritte = [S("meter", "Dicke in Metern", "d(m) = d(cm) / 100", `${f(d * 100)} / 100`, d, "m", 3), S("widerstand", "Schichtwiderstand R", "R = d / λ", `${f(d)} / 0,040`, d / lambda, "m²K/W", 3)];
      erklaerung = "Dicke und Wärmeleitfähigkeit bestimmen gemeinsam den Schichtwiderstand."; break;
    }
    case "waerme-2": {
      const d = a([.16, .18, .20, .14, .22]), R1 = .0125 / .25, R2 = d / .04, R3 = .024 / .13, gesamt = .13 + R1 + R2 + R3 + .04;
      frage = "Berechne den U-Wert eines vereinfachten ebenen Aufbaus aus drei gleichmäßigen Schichten. Wärmeübergangswiderstände sind ausdrücklich vorgegeben; Wärmebrücken und weitere Korrekturen bleiben unberücksichtigt.";
      gegeben = ["Innenbekleidung: d = 0,0125 m, λ = 0,25 W/(mK)", `Dämmung: d = ${f(d)} m, λ = 0,040 W/(mK)`, "Holzschicht: d = 0,024 m, λ = 0,13 W/(mK)", "Vorgegeben Rsi = 0,13 und Rse = 0,04 m²K/W"];
      schritte = [S("daemmung", "Widerstand der Dämmung", "R₂ = d₂ / λ₂", `${f(d)} / 0,040`, R2, "m²K/W", 3), S("gesamt", "Gesamter Widerstand", "Rges = Rsi + d₁/λ₁ + R₂ + d₃/λ₃ + Rse", `0,13 + 0,0125/0,25 + ${f(d)}/0,040 + 0,024/0,13 + 0,04`, gesamt, "m²K/W", 3), S("uwert", "U-Wert des Übungsaufbaus", "U = 1 / Rges", `1 / (${f(gesamt, 8)})`, 1 / gesamt, "W/(m²K)", 3)];
      erklaerung = "Für den letzten Schritt mit der ungerundeten Summe weiterrechnen. Die Rechnung ist ein vereinfachtes Schichtenmodell."; break;
    }
    case "waerme-3": {
      const ziel = a([.24, .22, .20, .26, .28]), rest = .3, lambda = .035, R = 1 / ziel - rest, d = R * lambda;
      frage = "Für ein vereinfachtes Modell sind ein angestrebter U-Wert und der gesamte restliche Widerstand vorgegeben. Welche rechnerische Dämmdicke ergibt sich? Gesucht ist der Rechenwert, keine marktübliche Plattenstärke.";
      gegeben = [`Vorgegebener Zielwert ${f(ziel)} W/(m²K)`, "Restlicher Widerstand einschließlich Übergängen 0,30 m²K/W", "λ der Dämmung 0,035 W/(mK)"];
      schritte = [S("notwendig", "Benötigter Dämmwiderstand", "Rd = 1 / U − Rrest", `1 / ${f(ziel)} − 0,30`, R, "m²K/W", 3), S("dicke", "Rechnerische Dicke in cm", "d = Rd × λ × 100", `(1 / ${f(ziel)} − 0,30) × 0,035 × 100`, d * 100, "cm", 1)];
      erklaerung = "Der Zielwert ist eine Übungsvorgabe. Eine Produktauswahl und ein vollständiger Nachweis sind eigene Schritte."; break;
    }
    case "gefaelle-1": {
      const L = a([6, 8, 10, 5, 7]), p = a([2, 3, 4, 2.5, 1.5]);
      frage = "Bestimme bei vorgegebenem Prozentgefälle den Höhenunterschied und den zugehörigen Winkel. Die Strecke ist waagerecht gemessen.";
      gegeben = [`L = ${L} m waagerecht`, `p = ${f(p)} % als Rechenvorgabe`];
      schritte = [S("hoehe", "Höhenunterschied in cm", "h = L × p / 100 × 100", `${L} × ${f(p)} / 100 × 100`, L * p, "cm", 1), S("winkel", "Winkel α", "α = arctan(p / 100)", `arctan(${f(p)} / 100)`, Math.atan(p / 100) * 180 / Math.PI, "°", 2)];
      erklaerung = "Prozent und Grad werden über den Tangens verbunden; ihre Zahlen sind nicht gleich."; break;
    }
    case "gefaelle-2": {
      const winkel = a([3, 5, 7, 4, 6]), L = a([4, 5, 6, 7, 8]), faktor = Math.tan(winkel * Math.PI / 180);
      frage = "Eine geneigte Fläche hat den angegebenen Winkel. Berechne Prozentgefälle und Höhenunterschied über die waagerechte Strecke.";
      gegeben = [`α = ${winkel}°`, `L = ${L} m waagerecht`];
      schritte = [S("prozent", "Gefälle in Prozent", "p = tan α × 100", `tan(${winkel}°) × 100`, faktor * 100, "%", 2), S("hoehe", "Höhenunterschied in Metern", "h = L × tan α", `${L} × tan(${winkel}°)`, L * faktor, "m", 3)];
      erklaerung = "Für die Höhe den ungerundeten Tangens verwenden."; break;
    }
    case "gefaelle-3": {
      const L = a([5, 6, 8, 4, 7]), cm = a([15, 18, 24, 10, 21]), faktor = cm / 100 / L;
      frage = "Aus einem Höhenunterschied und einer waagerechten Strecke sind das Prozentgefälle und der Winkel gesucht.";
      gegeben = [`Höhenunterschied ${cm} cm`, `Waagerechte Strecke ${L} m`];
      schritte = [S("prozent", "Gefälle in Prozent", "p = h / L × 100", `${cm / 100} / ${L} × 100`, faktor * 100, "%", 2), S("winkel", "Winkel α", "α = arctan(h / L)", `arctan(${cm / 100} / ${L})`, Math.atan(faktor) * 180 / Math.PI, "°", 2)];
      erklaerung = "Vor dem Verhältnis werden Zentimeter in Meter umgerechnet."; break;
    }
    case "masse-1": {
      const A = a([10, 12, 15, 18, 20]), d = .02, rho = 500;
      frage = "Berechne das Volumen und die Masse einer gleichmäßigen Holzschicht mit vorgegebener Dichte.";
      gegeben = [`A = ${A} m²`, "Dicke 2 cm = 0,02 m", "Vorgegebene Dichte 500 kg/m³"];
      schritte = [S("volumen", "Materialvolumen", "V = A × d", `${A} × 0,02`, A * d, "m³", 3), S("masse", "Materialmasse", "m = V × ρ", `${f(A * d, 4)} × 500`, A * d * rho, "kg", 1)];
      erklaerung = "Die Masse ergibt sich aus dem Volumen und der passenden Materialdichte."; break;
    }
    case "masse-2": {
      const anzahl = a([10, 12, 15, 18, 20]), laenge = 4, breit = .06, hoch = .08, rho = 450, V = anzahl * laenge * breit * hoch;
      frage = "Eine Holzliste enthält gleiche rechteckige Hölzer. Berechne das Gesamtvolumen und die Masse mit der vorgegebenen Dichte.";
      gegeben = [`${anzahl} Hölzer`, "Je 4 m lang und 6 cm × 8 cm Querschnitt", "Vorgegebene Dichte 450 kg/m³"];
      schritte = [S("volumen", "Gesamtvolumen aller Hölzer", "V = n × l × b × h", `${anzahl} × 4 × 0,06 × 0,08`, V, "m³", 4), S("masse", "Gesamte Materialmasse", "m = V × ρ", `${f(V, 6)} × 450`, V * rho, "kg", 1)];
      erklaerung = "Die Querschnittsmaße werden vor der Multiplikation in Meter umgerechnet."; break;
    }
    case "masse-3": {
      const A = a([20, 25, 30, 35, 40]), d = .0007, rho = 7200, V = A * d;
      frage = "Ein idealisiertes ebenes Blech wird ohne Falzzugaben betrachtet. Berechne sein Volumen und seine Masse aus Fläche, Dicke und vorgegebener Dichte.";
      gegeben = [`Fläche ${A} m²`, "Dicke 0,7 mm = 0,0007 m", "Vorgegebene Dichte 7 200 kg/m³"];
      schritte = [S("volumen", "Blechvolumen", "V = A × d", `${A} × 0,0007`, V, "m³", 4), S("masse", "Blechmasse", "m = V × ρ", `${f(V, 6)} × 7200`, V * rho, "kg", 2)];
      erklaerung = "Die Dichte ist eine ausdrückliche Aufgabenannahme. Die Materialmasse ist noch keine Aussage zur Tragfähigkeit."; break;
    }
    case "kosten-1": {
      const A = a([50, 60, 75, 80, 100]), preis = 12, menge = A * 1.08, netto = menge * preis;
      frage = "Plane eine Materialmenge mit vorgegebenem Zuschlag und berechne Netto- sowie Bruttobetrag. Die Menge wird nach Fläche abgerechnet und nicht auf ganze Packungen gerundet.";
      gegeben = [`Grundfläche ${A} m²`, "Zuschlag 8 %", "Preis 12 €/m² netto", "Für die Übung vorgegebene Umsatzsteuer 19 %"];
      schritte = [S("menge", "Fläche mit Zuschlag", "Aplan = A × 1,08", `${A} × 1,08`, menge, "m²"), S("netto", "Materialbetrag netto", "N = Aplan × Preis", `${f(menge)} × 12`, netto, "€"), S("brutto", "Materialbetrag brutto", "B = N × 1,19", `${f(netto)} × 1,19`, netto * 1.19, "€")];
      erklaerung = "Zuschlag betrifft die Materialmenge, die Steuer den daraus berechneten Nettobetrag."; break;
    }
    case "kosten-2": {
      const personen = a([3, 4, 2, 5, 6]), stunden = a([4, 5, 6, 3, 2]), satz = 30, material = 500, arbeit = personen * stunden * satz;
      frage = "Berechne die gesamten Personenstunden, den Arbeitsbetrag und den Nettobetrag aus Arbeit plus Material. Der Stundensatz ist eine Übungsvorgabe.";
      gegeben = [`${personen} Personen arbeiten je ${stunden} h`, "Vorgegebener Satz 30 €/Personenstunde", "Materialbetrag 500 € netto"];
      schritte = [S("stunden", "Gesamte Personenstunden", "H = Personen × Stunden", `${personen} × ${stunden}`, personen * stunden, "h", 1), S("arbeit", "Arbeitsbetrag", "Karbeit = H × Satz", `${personen * stunden} × 30`, arbeit, "€"), S("netto", "Gesamtbetrag netto", "N = Arbeit + Material", `${arbeit} + 500`, arbeit + material, "€")];
      erklaerung = "Gemeinsame Arbeitsdauer und summierte Personenstunden sind unterschiedliche Angaben."; break;
    }
    case "kosten-3": {
      const netto = a([1000, 1200, 1500, 1800, 2000]), rabatt = netto * .05, reduziert = netto - rabatt;
      frage = "Ein ausdrücklich vorgegebener Nachlass von 5 % wird auf den Nettobetrag gewährt. Berechne Nachlass, verminderten Nettobetrag und Bruttobetrag mit vorgegebenen 19 %.";
      gegeben = [`Ausgangsbetrag ${netto} € netto`, "Nachlass 5 % auf diesen Nettobetrag", "Vorgegebene Umsatzsteuer 19 % auf den verminderten Nettobetrag"];
      schritte = [S("nachlass", "Nachlassbetrag", "Z = N × 0,05", `${netto} × 0,05`, rabatt, "€"), S("vermindert", "Nettobetrag nach Nachlass", "Nr = N − Z", `${netto} − ${f(rabatt)}`, reduziert, "€"), S("brutto", "Bruttobetrag nach Nachlass", "B = Nr × 1,19", `${f(reduziert)} × 1,19`, reduziert * 1.19, "€")];
      erklaerung = "Die Steuer wird auf den ausdrücklich bezeichneten verminderten Betrag gerechnet."; break;
    }
    default: throw new Error("Fehlende Rechenaufbereitung.");
  }
  if (!schritte.every(s => Number.isFinite(s.wert) && s.wert > 0)) throw new Error("Ungültige Rechenwerte.");
  return { id, version: 1, variante, einheitId: e.id, titel: e.titel, frage, gegeben, schritte, erklaerung };
}

export function pruefeAufbauAufgabe(a: AufbauAufgabe, antworten: Record<string, AufbauAntwort>): AufbauErgebnis | null {
  const schritte: AufbauErgebnis["schritte"] = {};
  for (const s of a.schritte) {
    const v = antworten[s.id], wert = v && leseDezimalzahl(v.wert);
    if (!v || wert === null || wert === undefined || !s.einheiten.includes(v.einheit)) return null;
    const einheitRichtig = v.einheit === s.einheit;
    const richtig = einheitRichtig && (!s.ganzzahl || Number.isInteger(wert)) && Math.abs(wert - s.wert) <= s.toleranz + 1e-9;
    schritte[s.id] = { richtig, hinweis: !einheitRichtig ? `Gesucht ist ${s.einheit}. Prüfe die Einheit.` : richtig ? "Rechenwert und Einheit passen." : `Prüfe ${s.formel}. Der passende Rechenwert ist ${f(s.wert, s.stellen)} ${s.einheit}.` };
  }
  const erreicht = Object.values(schritte).filter(s => s.richtig).length;
  return { richtig: erreicht === a.schritte.length, bewertung: erreicht === a.schritte.length ? "richtig" : erreicht ? "teilweise" : "falsch", erreicht, moeglich: a.schritte.length, schritte };
}

export interface AufbauVersuch {
  aufgabe: AufbauAufgabe; versuchId: string; antworten: Record<string, AufbauAntwort>; hilfen: string[]; ergebnis?: AufbauErgebnis; reviewResult?: ReviewResult;
}
export interface AufbauStand { version: 1; index: number; notiz: string; abgeschlossen: boolean; versuche: Record<string, AufbauVersuch>; archiv?: AufbauVersuch[] }
export const aufbauKey = (id: string) => `fachmathe-aufbau-${id}-v1`;
export function neuerAufbauStand(e: AufbauEinheit, variante = Math.floor(Math.random() * 1_000_000)): AufbauStand {
  return { version: 1, index: 0, notiz: "", abgeschlossen: false, versuche: Object.fromEntries(e.aufgabenIds.map(id => [id, { aufgabe: erzeugeAufbauAufgabe(id, variante), versuchId: `aufbau:${id}:${globalThis.crypto.randomUUID()}`, antworten: {}, hilfen: [] }])) };
}
export function parseAufbauStand(raw: string | null, e: AufbauEinheit): AufbauStand | null {
  if (!raw) return null;
  try {
    const s: AufbauStand = JSON.parse(raw);
    if (!s || s.version !== 1 || !Number.isInteger(s.index) || s.index < 0 || s.index >= e.aufgabenIds.length || typeof s.notiz !== "string" || typeof s.abgeschlossen !== "boolean" || !s.versuche || typeof s.versuche !== "object" || Array.isArray(s.versuche)) return null;
    if (s.archiv !== undefined && !Array.isArray(s.archiv)) return null;
    for (const id of e.aufgabenIds) {
      const v = s.versuche[id];
      if (!v || typeof v.versuchId !== "string" || !v.versuchId || !v.aufgabe || v.aufgabe.id !== id || !Array.isArray(v.hilfen) || !v.hilfen.every(h => typeof h === "string") || !v.antworten || typeof v.antworten !== "object" || Array.isArray(v.antworten)) return null;
      const erwartet = erzeugeAufbauAufgabe(id, v.aufgabe.variante);
      if (JSON.stringify(v.aufgabe) !== JSON.stringify(erwartet)) return null;
      for (const [key, antwort] of Object.entries(v.antworten)) if (!erwartet.schritte.some(schritt => schritt.id === key) || !antwort || typeof antwort.wert !== "string" || typeof antwort.einheit !== "string") return null;
      if (v.ergebnis) { const resultat = pruefeAufbauAufgabe(erwartet, v.antworten); if (!resultat) return null; v.ergebnis = resultat; }
      if (v.reviewResult && (!validReviewResult(v.reviewResult) || v.reviewResult.ref.quelle !== "mathe" || v.reviewResult.ref.id !== id || v.reviewResult.versuchId !== v.versuchId || !v.ergebnis || v.reviewResult.bewertung !== v.ergebnis.bewertung)) return null;
    }
    if (Object.keys(s.versuche).some(id => !e.aufgabenIds.includes(id))) return null;
    s.abgeschlossen = s.abgeschlossen && e.aufgabenIds.every(id => !!s.versuche[id]?.ergebnis);
    return s;
  } catch { return null; }
}
export function leseAufbauStand(e: AufbauEinheit): AufbauStand { return parseAufbauStand(appStorage.getItem(aufbauKey(e.id)), e) ?? neuerAufbauStand(e); }
