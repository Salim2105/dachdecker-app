import type { LernEinheit, LernKapitel } from "@/lib/curriculum";
import type { Aktivitaet } from "@/lib/aktivitaeten";
import { findeBegriffe } from "@/lib/glossar";

// Eigenständig formulierte Lernschritte zu den vorhandenen Buchlektionen.
// Zahlen und Ausführungsgrenzen gehören zum jeweiligen Quellenbeispiel;
// sie ersetzen weder einen aktuellen Nachweis noch die Systemplanung.
interface Redaktion {
  n: number; titel: string; ziel: string; text: string | string[];
  frage: string; antwort: string; fall: [string, string, string];
  aufgaben: (number | string)[];
}
function einheit(lf: string, r: Redaktion): LernEinheit {
  const lektion = `${lf}-l${String(r.n).padStart(2, "0")}`;
  const id = `${lektion}-e01`;
  const texte = typeof r.text === "string" ? [r.text] : r.text;
  return { id, version: 2, titel: r.titel, lernziel: `Du kannst ${r.ziel}`, minuten: texte.length > 1 ? 9 : 6,
    textschritte: texte, lektionIds: [lektion],
    aufgabenIds: r.aufgaben.map((n) => typeof n === "string" ? n : `${lf}-${String(n).padStart(3, "0")}`),
    begriffe: findeBegriffe(texte.join(" ")).map((b) => b.id),
    abrufFrage: r.frage, abrufMuster: r.antwort,
    aktivitaet: redaktionelleAktivitaet(lf, r, id),
  };
}
function kurs(lf: string, redaktion: Redaktion[], gruppen: [string, number[]][]): LernKapitel[] {
  const inhalte = new Map(redaktion.map((r) => [r.n, einheit(lf, r)]));
  return gruppen.map(([titel, nummern], index) => ({
    id: `${lf}-k${String(index + 1).padStart(2, "0")}`, titel,
    einheiten: nummern.map((n) => { const e = inhalte.get(n); if (!e) throw new Error(`${lf}: Einheit ${n} fehlt`); return e; }),
  }));
}
function redaktionelleAktivitaet(lf: string, r: Redaktion, einheitId: string): Aktivitaet {
  const basis = { id: `${einheitId}-aktiv`, version: 2 };
  const zuordnen = (titel: string, paare: [string, string][], erklaerung: string): Aktivitaet => ({ ...basis, typ: "zuordnen", titel, auftrag: "Ordne die Begriffe mit den Auswahlfeldern zu.", paare: paare.map(([links, rechts], i) => ({ id: `p${i + 1}`, links, rechts })), erklaerung });
  const ordnen = (titel: string, schritte: string[], erklaerung: string): Aktivitaet => ({ ...basis, typ: "reihenfolge", titel, auftrag: "Bringe die Schritte mit den Pfeil-Schaltflächen in eine sinnvolle Arbeitsreihenfolge.", schritte: schritte.map((text, i) => ({ id: `s${i + 1}`, text })), erklaerung });
  const skizze = (titel: string, situation: string, svg: string, optionen: [string, boolean][], erklaerung: string): Aktivitaet => ({ ...basis, typ: "skizzenfehler", titel, auftrag: "Prüfe die Skizze und wähle alle passenden Aussagen.", situation, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 250" role="img"><title>${titel}</title>${svg}</svg>`, bildbeschreibung: situation, optionen: optionen.map(([text, korrekt], i) => ({ id: `o${i + 1}`, text, korrekt })), erklaerung });
  switch (`${lf}-l${String(r.n).padStart(2, "0")}`) {
    case "lf13a-l01": return zuordnen("Wasser am Grat und in der Kehle", [["Grat", "Wasser läuft zu beiden Seiten auseinander"], ["Kehle", "Wasser aus zwei Dachflächen trifft zusammen"], ["Wasserpfeil", "Zeigt die Fließrichtung in der Skizze"]], r.antwort);
    case "lf13a-l03": return ordnen("Den Anschluss von oben nach unten verfolgen", ["Wasser oberhalb der Durchdringung aufnehmen", "Wasser zu den seitlichen Anschlüssen führen", "Wasser an den Flanken nach unten leiten", "Am unteren Anschluss auf die Deckung abgeben"], "Die sichtbaren Anschlüsse bilden einen zusammenhängenden Wasserweg. Die Unterdeckung benötigt ihren eigenen Anschluss.");
    case "lf13a-l05": return zuordnen("Die passende Einheit finden", [["Deckfläche", "Quadratmeter"], ["Anschlussprofil", "Laufende Meter"], ["Einzelner Formziegel", "Stück"], ["Materialgewicht", "Kilogramm"]], "Jede Materialposition braucht einen eigenen Mengenansatz und eine passende Einheit.");
    case "lf13a-l06": return ordnen("Vom Dachplan zur Bestellung", ["Dachflächen und wahre Längen ermitteln", "Deckmaße und Verlegeschema zuordnen", "Grundbedarf je Material berechnen", "Begründete Zuschläge ergänzen", "Auf kaufbare Stück- oder Verpackungseinheiten aufrunden"], "Rundung und Zuschläge bleiben vom geometrischen Grundbedarf unterscheidbar.");
    case "lf13a-l09": return skizze("Offener Anschluss unter dem Blech", "Schematischer Wandanschluss: Das sichtbare Blech ist vorhanden, die darunterliegende Zusatzebene endet mit einer offenen Lücke vor der Wand.", '<path d="M470 35V215H70" fill="none" stroke="currentColor" stroke-width="8"/><path d="M460 65V145H200" fill="none" stroke="#c65b28" stroke-width="7"/><path d="M80 180H350" stroke="#267b80" stroke-width="6"/><path d="M360 180H445" stroke="#c65b28" stroke-width="5" stroke-dasharray="8 8"/><text x="80" y="48" font-size="18" fill="currentColor">Wandanschluss mit offener Zusatzebene</text><text x="80" y="236" font-size="16" fill="currentColor">Blau: Zusatzebene · gestrichelt: ungeplanter offener Bereich</text>', [["Der Anschluss der Zusatzebene ist unvollständig.", true], ["Das sichtbare Blech ersetzt jeden unteren Anschluss.", false], ["Beide betroffenen wasserführenden Ebenen brauchen einen passenden Anschluss.", true]], "Ein sichtbarer Metallanschluss beweist noch keinen vollständigen Anschluss der darunterliegenden Schutzebene.");
    case "lf13a-l14": return zuordnen("Lage und wahre Länge", [["Grundriss", "Zeigt waagerechte Projektionen"], ["Dachprofil", "Zeigt ein zugehöriges Höhendreieck"], ["Wahre Länge", "Tatsächliche geneigte Strecke"], ["Pythagoras", "Gilt am rechtwinkligen Dreieck"]], "Eine Grundrisslänge ist nicht automatisch die wahre geneigte Bauteillänge.");
    case "lf13a-l22": return ordnen("Erst die Kehle, dann das Material", ["Dachneigungen und Kehlverlauf aus dem Plan bestimmen", "Ein passendes Hilfsdreieck aufstellen", "Wahre Kehllänge berechnen", "Ausführung und nutzbare Stücklängen zuordnen", "Überdeckungen und begründeten Zuschlag berücksichtigen"], "Eine Materialmenge braucht die wahre Länge und das gewählte Ausführungsdetail.");
    case "lf13b-l01": return zuordnen("Vom Halm zum Bund", [["Reet", "Schilf als weicher Deckwerkstoff"], ["Ernte", "Gewinnen des geeigneten Ausgangsmaterials"], ["Bund", "Handelseinheit aus zusammengefassten Halmen"], ["Sortierung", "Ordnet die Qualität und Eigenschaften für den Einbau"]], "Herkunft, Bündelung und Sortierung beschreiben verschiedene Schritte bis zum verwendbaren Deckmaterial.");
    case "lf13b-l03": return zuordnen("Drei Befestigungsprinzipien", [["Gebunden", "Bindedraht wird um Latte und Deckstange geführt"], ["Genäht", "Draht wird mit einer Nadel durch die Deckung geführt"], ["Geschraubt", "Ein Schraubdrahtsystem verbindet Befestigung und Unterkonstruktion"]], "Die Benennungen unterscheiden das Befestigungsprinzip. Werkzeug und genauer Ablauf gehören zum jeweiligen System.");
    case "lf13b-l06": return ordnen("Ein Reetbund vorbereiten", ["Bundbezeichnung und Herkunft prüfen", "Halmzustand und sichtbare Schäden beurteilen", "Länge und Stärke des Materials zuordnen", "Für den vorgesehenen Dachbereich sortieren"], "Die Eignung wird vor dem Einbau geprüft; ungeeignetes Material wird nicht durch späteres Nachputzen verbessert.");
    case "lf13b-l09": return skizze("Wasserpfeile an der falschen Kante", "Die Zeichnung zeigt eine nach innen geneigte V-Form. Zwei Wasserpfeile laufen in der Mitte zusammen; die Beschriftung nennt diese Kante fälschlich Grat.", '<path d="M70 65L310 190L550 65" fill="none" stroke="currentColor" stroke-width="8"/><path d="M155 90L265 148M465 90L355 148" stroke="#267b80" stroke-width="6"/><path d="M265 148L244 128M265 148L239 148M355 148L381 148M355 148L376 128" fill="none" stroke="#267b80" stroke-width="5"/><text x="235" y="225" font-size="22" fill="currentColor">Beschriftung: Grat</text><text x="70" y="35" font-size="18" fill="currentColor">Wasser läuft in der Mitte zusammen</text>', [["Die dargestellte Innenkante ist eine Kehle.", true], ["Die Beschriftung Grat passt zu den zusammenlaufenden Wasserpfeilen.", false], ["Die Wasserführung braucht an dieser sammelnden Kante besondere Sorgfalt.", true]], "In der Kehle fließt Wasser zusammen; am Grat läuft es auseinander.");
    case "lf13b-l12": return ordnen("Vom Schilfbestand zum Dach", ["Geeignetes Reet ernten", "Material aufbereiten und bündeln", "Herkunft und Materialeigenschaften zuordnen", "Qualität und Eignung vor dem Einbau prüfen"], "Die Herkunft gehört zur Nachvollziehbarkeit; die konkrete Eignung wird am Material geprüft.");
    case "lf13b-l15": return zuordnen("Der Anfang einer Reetdeckung", [["Traufe", "Unterer Rand der Dachfläche"], ["Streuschicht", "Unterste ausgleichende Materiallage des beschriebenen Aufbaus"], ["Unterkonstruktion", "Trägt die Deckung und ihre Befestigung"], ["Deckrichtung", "Führt die aufeinanderfolgenden Lagen über die Fläche"]], "Traufdetail und Unterlage bestimmen, wie die Deckung am unteren Rand beginnt.");
    case "lf14-l01": return skizze("Hochführung ohne oberen Schutz", "Die Abdichtung wird an einer aufgehenden Wand nach oben geführt. Ihr oberer Rand bleibt in der Zeichnung offen und ungesichert.", '<path d="M460 35V215H60" fill="none" stroke="currentColor" stroke-width="8"/><path d="M65 195H435V85" fill="none" stroke="#267b80" stroke-width="7"/><circle cx="435" cy="85" r="15" fill="none" stroke="#c65b28" stroke-width="4"/><text x="60" y="45" font-size="18" fill="currentColor">Offener oberer Rand</text><path d="M275 52L418 82" stroke="#c65b28" stroke-width="3"/><text x="60" y="242" font-size="17" fill="currentColor">Abdichtung hochgeführt · Abschluss noch ungeplant</text>', [["Die Hochführung benötigt einen geeigneten oberen Abschluss.", true], ["Eine hohe Bahn kann oben grundsätzlich offen bleiben.", false], ["Der obere Rand muss gegen Hinterlaufen gesichert werden.", true]], "Hochführung und oberer Abschluss sind verschiedene Funktionen eines vollständigen Anschlusses.");
    case "lf14-l03": return zuordnen("Die Wasserbeanspruchung beschreiben", [["Bodenfeuchte", "Feuchtigkeit ohne die angenommene Druckwasserbeanspruchung"], ["Aufstauendes Wasser", "Wasser kann sich am Bauteil ansammeln"], ["Drückendes Wasser", "Wirkt mit Wasserdruck auf die Abdichtung"], ["Bemessungswasserstand", "Planungsgröße für die zu erwartende Wasserlage"]], "Die tatsächliche Einwirkung bestimmt die Planung; die bloße Herkunft als Regen reicht zur Einordnung nicht aus.");
    case "lf14-l04": return zuordnen("Zwei Wannenprinzipien", [["Schwarze Wanne", "Geschlossene äußere Abdichtung um die betroffenen Bauteile"], ["Weiße Wanne", "Geplante wasserundurchlässige Betonkonstruktion"], ["Fuge", "Benötigt eine zum Konzept passende Dichtlösung"], ["Durchdringung", "Muss in die geschlossene Schutzwirkung eingebunden werden"]], "Beide Konzepte müssen an Fugen und Durchdringungen vollständig weitergeführt werden.");
    case "lf14-l05": return ordnen("Entwässerung aus dem Dachplan entwickeln", ["Dachflächen und Tiefpunkte erfassen", "Für den Übungsfall vorgegebenen Regenabfluss bestimmen", "Leistung und Lage der Hauptabläufe zuordnen", "Die erforderliche Notentwässerung gesondert planen", "Wasserwege und freie Ablaufmöglichkeiten kontrollieren"], "Hauptentwässerung und Notentwässerung erfüllen verschiedene Aufgaben und werden gemeinsam betrachtet.");
    case "lf14-l06": return zuordnen("Schichten des begrünten Dachs", [["Wurzelschutz", "Schützt die Abdichtung vor Wurzeleinwirkung"], ["Dränschicht", "Führt überschüssiges Wasser zum vorgesehenen Ablauf"], ["Filterschicht", "Hält geeignete Feinanteile vom Dränraum zurück"], ["Substrat", "Bildet den Wurzelraum für die Vegetation"]], "Eine Schicht übernimmt nicht automatisch die Aufgaben aller anderen Schichten.");
    case "lf14-l13": return zuordnen("Gefällegrößen zuordnen", [["Höhenunterschied", "Senkrechte Differenz zwischen zwei Punkten"], ["Waagerechte Länge", "Horizontale Bezugsstrecke der Prozentrechnung"], ["Gefälle in Prozent", "Höhenunterschied geteilt durch waagerechte Länge, mal 100"], ["Gefällewinkel", "Winkel zwischen geneigter Fläche und Waagerechter"]], "Prozent und Grad sind unterschiedliche Angaben; die Bezugsstrecke muss zur Formel passen.");
    case "lf14-l17": return ordnen("Eine LV-Position rechnen", ["Beschriebene Leistung und Schichtfunktion lesen", "Mengeneinheit der Position bestimmen", "Zugehörige Menge aus Plan und Aufgabe ermitteln", "Menge mit dem passenden Einheitspreis multiplizieren", "Ergebnis und Einheit der Position kontrollieren"], "Die Menge und der Preis müssen sich auf dieselbe Einheit beziehen.");
    case "lf15-l01": return zuordnen("Ränder und ihre Funktionen", [["Sockel", "Zuluft und geplanter Wasserablauf am unteren Rand"], ["Oberer Abschluss", "Schutz vor Niederschlag und geplanter Luftaustritt"], ["Seitlicher Abschluss", "Begrenzt die Fläche mit passendem Bewegungsraum"]], r.antwort);
    case "lf15-l03": return zuordnen("Vier Seiten eines Fensters", [["Sturzanschluss", "Leitet oben ankommendes Wasser vor der Öffnung nach außen"], ["Laibungsanschluss", "Führt den seitlichen Anschluss und Wärmeschutz weiter"], ["Fensterbank", "Nimmt unten Wasser auf und leitet es ab"], ["Tropfkante", "Löst den Wasserlauf an der vorgesehenen Kante ab"]], "Die vier Seiten haben unterschiedliche Aufgaben und brauchen aufeinander abgestimmte Details.");
    case "lf15-l04": return ordnen("Eine Funktionsskizze aufbauen", ["Tragendes Bauteil und Bezugskanten eintragen", "Funktionsschichten nach außen ergänzen", "Anschlussprofil und Befestigung zeichnen", "Maße sowie Luft- und Wasserwege kennzeichnen", "Den Anschluss auf durchgängige Funktion prüfen"], "Die Skizze wird aus dem Aufbau entwickelt und anschließend auf Funktion geprüft.");
    case "lf15-l09": return zuordnen("Aufmaß mit passenden Einheiten", [["Bekleidungsfläche", "m²"], ["Giebelschräge als Randprofil", "m"], ["Einzelnes Eckstück", "Stück"], ["Bedarf je Randlänge", "Stück je m"]], "Einheiten zeigen, ob eine Position als Fläche, Strecke oder Anzahl erfasst wird.");
    case "lf15-l14": return skizze("Ungeplante Hohlraumfüllung", "Zwischen Bekleidung und Wand wird der Lüftungsraum an einer beliebigen Stelle mit Reststücken ausgefüllt. Die Skizze beschriftet diese ungeprüfte Füllung als Brandsperre.", '<path d="M100 35V210M200 35V210M470 35V210" stroke="currentColor" stroke-width="9"/><rect x="213" y="105" width="245" height="45" fill="#c65b28"/><path d="M330 205V167M330 93V42" stroke="#267b80" stroke-width="5"/><text x="40" y="235" font-size="17" fill="currentColor">Wand · Dämmung · Lüftungsraum · Bekleidung</text><text x="220" y="85" font-size="17" fill="currentColor">Ungeprüfte Reststücke</text>', [["Reststücke sind kein Nachweis für eine geeignete Brandsperre.", true], ["Brandschutz und Lüftungsführung müssen zusammen geplant werden.", true], ["Jede beliebige Füllung erfüllt automatisch alle Anforderungen.", false]], "Brandsperren sind geplante Bauteile mit geeigneter Ausbildung und Befestigung.");
    case "lf15-l16": return ordnen("Fensteranschlüsse vollständig zählen", ["Fensteranzahl und Einzelmaße aufnehmen", "Sturz und Brüstung je Fensterbreite zuordnen", "Zwei seitliche Laibungen je Fensterhöhe ansetzen", "Positionen getrennt summieren", "Randmaterial und begründete Zuschläge zuordnen"], "Die Anzahl der Seiten wird vor der Multiplikation ausdrücklich notiert.");
    case "lf16-l01": return zuordnen("Wärme oder Strom?", [["Photovoltaikmodul", "Liefert elektrischen Strom"], ["Solarthermischer Kollektor", "Erwärmt ein Wärmeträgermedium"], ["Wechselrichter", "Wandelt Gleichstrom für die Wechselstromnutzung um"], ["kWh", "Einheit einer Energiemenge"]], "Die Funktion der Anlage und die gemessene Größe bleiben getrennt.");
    case "lf16-l03": return ordnen("Der Weg des Blitzstroms", ["Fangeinrichtung als vorgesehenen Einschlagbereich betrachten", "Verbindung zur Ableitung verfolgen", "Ableitung bis zur Erdungsanlage verfolgen", "Durchgängigen geplanten Weg und Anschlüsse prüfen"], "Die drei Teile bilden zusammen die äußere Blitzschutzanlage.");
    case "lf16-l07": return zuordnen("Plan und Wirklichkeit", [["Durchgezogene Linie der verwendeten Legende", "Sichtbar verlegte Leitung"], ["Gestrichelte Linie der verwendeten Legende", "Verdeckt verlaufende Leitung"], ["Grundriss", "Waagerechte Lage der Leitungen"], ["Höhenangabe", "Ergänzt die senkrechten Ableitungslängen"]], "Vor der Ausführung werden Linien und Symbole immer mit der konkreten Legende abgeglichen.");
    case "lf16-l12": return skizze("Kreuzung ohne Verbinder", "Zwei Fangleitungen kreuzen sich in der Zeichnung. Am markierten Kreuzungspunkt ist nur eine lose Berührung ohne vorgesehenen Verbinder dargestellt.", '<path d="M90 125H530M310 35V215" stroke="currentColor" stroke-width="7"/><circle cx="310" cy="125" r="27" fill="none" stroke="#c65b28" stroke-width="4"/><text x="40" y="245" font-size="18" fill="currentColor">Markiert: lose Kreuzung ohne geeigneten Verbinder</text>', [["Eine geeignete leitende Verbindung muss vorgesehen und hergestellt werden.", true], ["Die optische Kreuzung beweist die elektrische Verbindung.", false], ["Die Ausführung benötigt die zugehörige Prüfung.", true]], "Ein gezeichnetes Netz und ein leitend verbundenes Netz sind nicht automatisch dasselbe.");
    case "lf16-l14": return ordnen("Vom Licht zur Wechselstromnutzung", ["Licht trifft auf Solarzellen", "Module erzeugen auf der Generatorseite Gleichstrom", "Der Wechselrichter übernimmt die Umwandlung", "Die geplante Wechselstromnutzung erfolgt über die fachgerecht angeschlossene Anlage"], "Dies ist eine Funktionsfolge und keine Arbeitsanweisung zum elektrischen Anschließen.");
    case "lf16-l17": return zuordnen("Funktion des Einbauteils", [["Schneefang", "Fängt Schnee im dafür geplanten Bereich auf"], ["Schneerückhaltung", "Hält Schnee mit geplanten Elementen in der Fläche"], ["Rohrdurchführung", "Unterbricht Schutzebenen und braucht passende Anschlüsse"], ["Lastweg", "Überträgt Kräfte in die vorgesehene tragende Konstruktion"]], "Die Anordnung ergibt sich aus dem konkreten Dach, den Lasten und dem vorgesehenen System.");
    case "lf17-l01": return zuordnen("Vier Grundmaßnahmen", [["Inspektion", "Zustand feststellen und beurteilen"], ["Wartung", "Abnutzung verzögern und Funktion pflegen"], ["Instandsetzung", "Eine beeinträchtigte Funktion wiederherstellen"], ["Verbesserung", "Funktionssicherheit gezielt erhöhen"]], "Instandhaltung ist der Oberbegriff für diese unterschiedlichen Maßnahmen.");
    case "lf17-l02": return zuordnen("Befund oder bereits belegte Ursache?", [["Offene Naht gesehen", "Zunächst ein beobachteter Befund"], ["Feuchteeintritt vermutet", "Eine zu prüfende Ursache"], ["Gezielte Untersuchung", "Kann einen Ursache-Wirkungs-Zusammenhang klären"], ["Fotoprotokoll", "Hält Ort und sichtbaren Zustand nachvollziehbar fest"]], "Ein sichtbares Schadensbild allein beweist noch nicht seine Ursache.");
    case "lf17-l06": return ordnen("Mit der Checkliste arbeiten", ["Sicheren Zugang und Arbeitsbereich klären", "Bauteilgruppen der Checkliste systematisch prüfen", "Befunde mit Lage und Fotos dokumentieren", "Erforderliche weitere Untersuchung oder Maßnahme zuordnen", "Ergebnisse nachvollziehbar übergeben"], "Die Checkliste unterstützt Vollständigkeit und ein verständliches Ergebnisprotokoll.");
    case "lf17-l10": return ordnen("Die Sanierung vorbereiten", ["Arbeiten an vorhandenen Anlagen fachgerecht abstimmen", "Lose Teile, Verunreinigungen und ungeeignete Untergrundstellen bearbeiten", "Die vorgesehene Ausgleichs- beziehungsweise Trennschicht herstellen", "Neue Abdichtung und Anschlüsse nach Plan ausführen", "Betroffene Anlagen fachgerecht wiederherstellen und prüfen"], "Die vorhandenen Anlagen werden fachgerecht einbezogen; Untergrundvorbereitung steht vor dem neuen Aufbau.");
    case "lf17-l11": return skizze("Neuer Aufbau, alter Rand", "Die neue Dämmung erhöht die Dachfläche. In der Zeichnung endet der unveränderte alte Rand nun unterhalb der neu geplanten Oberfläche.", '<path d="M65 210H530V130" fill="none" stroke="currentColor" stroke-width="8"/><rect x="70" y="125" width="440" height="65" fill="#267b80"/><path d="M70 115H555" stroke="#c65b28" stroke-width="6"/><text x="70" y="50" font-size="19" fill="currentColor">Neue Oberfläche oberhalb des alten Randes</text><text x="70" y="242" font-size="17" fill="currentColor">Schematische Darstellung: Randdetail nicht angepasst</text>', [["Rand und Anschlusshöhen müssen an den neuen Aufbau angepasst werden.", true], ["Nur die Fläche muss betrachtet werden; Ränder bleiben immer unverändert.", false], ["Auch Abläufe und weitere Einbauteile müssen geprüft werden.", true]], "Ein höherer Dachaufbau verändert auch die Lage der wasserführenden Ebene und ihrer Anschlüsse.");
    case "lf17-l20": return zuordnen("Wärmeschutzgrößen auseinanderhalten", [["d", "Dicke der betrachteten Schicht in Metern"], ["λ", "Wärmeleitfähigkeit des Materials"], ["R = d / λ", "Wärmedurchlasswiderstand der Schicht"], ["U", "Kehrwert des gesamten maßgebenden Wärmewiderstands"]], "Eine reine Dämmschichtrechnung ist ein vereinfachtes Übungsmodell; ein Bauteilnachweis berücksichtigt den vollständigen Aufbau.");
  }
  return { ...basis, typ: "baustellenfall", titel: `Prüfe: ${r.titel}`, auftrag: "Wähle die fachlich passende Aussage.", situation: r.fall[0], optionen: [{ id: "o1", text: r.fall[1], korrekt: true }, { id: "o2", text: r.fall[2], korrekt: false }], erklaerung: r.antwort };
}

const LF13A_REDAKTION: Redaktion[] = [
  {
    "n": 1,
    "titel": "Wasser an Grat und Kehle verfolgen",
    "ziel": "Grat und Kehle am Wasserlauf unterscheiden.",
    "text": "Zwei Dachflächen können eine nach außen vorspringende oder eine nach innen einspringende Kante bilden. Die vorspringende Kante heißt Grat. Wasser verteilt sich dort auf die angrenzenden Dachflächen und läuft von der Kante weg. Die einspringende Kante heißt Kehle. Hier treffen die Wasserströme beider Flächen zusammen. Damit trägt die Kehle mehr Wasser als ein gleich breiter Streifen mitten in der Fläche. Beim Lesen eines Dachplans helfen deshalb zuerst Wasserpfeile: Zeigen sie voneinander weg, erkennst du einen Grat; zeigen sie aufeinander zu, erkennst du eine Kehle. Daraus folgt die besondere Sorgfalt bei Unterlage, Überdeckung und Entwässerungsweg der Kehle.",
    "frage": "Warum benötigt eine Kehle besondere Sorgfalt?",
    "antwort": "In der Kehle sammeln sich die Wasserströme zweier Dachflächen; am Grat fließt Wasser auseinander.",
    "fall": [
      "Zwei Wasserpfeile zeigen im Dachplan auf dieselbe schräge Innenkante.",
      "Das ist eine Kehle mit zusammenlaufendem Wasser.",
      "Das ist ein Grat, der Wasser aufteilt."
    ],
    "aufgaben": [
      1,
      8,
      10
    ]
  },
  {
    "n": 2,
    "titel": "Offene und geschlossene Kehlen auswählen",
    "ziel": "Kehlform, Kehlneigung und unterschiedliche Dachneigungen zusammen erklären.",
    "text": "Bei einer offenen Kehle bleibt eine eingelegte Rinne sichtbar. Die Flächendeckung endet seitlich davon und gibt das Wasser in diese Rinne ab. Bei einer geschlossenen Kehle führen passend eingeteilte Deckwerkstoffe durch den Übergang; eine breite offene Metallrinne ist dann nicht zu sehen. Für beide Lösungen zählt die Neigung der Kehllinie. Sie ist flacher als die Neigung der angrenzenden Dachflächen. Das gesammelte Wasser fließt deshalb langsamer ab. Eine sehr flache Kehle verlangt einen entsprechend geplanten Wasserquerschnitt. Haben die beiden Dachflächen verschiedene Neigungen, liegt die Kehle im Grundriss zudem anders als bei gleichen Neigungen. Diese verzogene Lage muss vor dem Zuschnitt konstruiert werden.",
    "frage": "Welche zwei Besonderheiten treffen in einer flachen Kehle zusammen?",
    "antwort": "Es kommt Wasser aus zwei Flächen an, während die flachere Kehllinie einen langsameren Abfluss bewirkt.",
    "fall": [
      "Eine Kehle soll mit der Neigung der Hauptdachfläche bemessen werden.",
      "Zuerst die eigene Kehlneigung und den Wasseranfall bestimmen.",
      "Die Hauptdachneigung gilt automatisch auch für die Kehllinie."
    ],
    "aufgaben": [
      8,
      9,
      11,
      12
    ]
  },
  {
    "n": 3,
    "titel": "Durchdringungen in beiden Ebenen anschließen",
    "ziel": "den Wasserweg oberhalb, seitlich und unterhalb einer Durchdringung beschreiben.",
    "text": "Ein Schornstein unterbricht nicht nur einzelne Dachziegel, sondern den durchgehenden Wasserweg. Oberhalb des Schornsteins ankommendes Wasser muss zunächst nach links und rechts ausweichen. Im Quellenbeispiel übernimmt dies die bergseitige Rückenrinne. Seitliche Verwahrungen führen das Wasser entlang der beiden Flanken weiter. Der untere Anschluss gibt es wieder auf die Deckung ab. Denke diese Folge immer von oben nach unten durch. Gleichzeitig bleibt die darunterliegende Unterdeckung eine eigene wasserführende Ebene. Sie benötigt ebenfalls einen geplanten Anschluss, damit eingedrungenes Wasser nicht hinter dem Schornstein ins Dach gelangt. Ein sauber aussehendes sichtbares Blech beweist daher noch keinen vollständigen Anschluss.",
    "frage": "Warum genügt das sichtbare Anschlussblech allein nicht?",
    "antwort": "Auch die Unterdeckung ist unterbrochen und muss an der Durchdringung wasserführend angeschlossen werden.",
    "fall": [
      "Die Ziegelanschlüsse sind fertig, die Unterdeckung endet offen am Schornstein.",
      "Auch der Anschluss der Unterdeckung muss geplant und geschlossen werden.",
      "Das sichtbare Blech ersetzt den Anschluss der Unterdeckung."
    ],
    "aufgaben": [
      50,
      42,
      43
    ]
  },
  {
    "n": 4,
    "titel": "Gaubenformen und sichere Einbauteile erkennen",
    "ziel": "Gauben nach ihrer Form unterscheiden und die Tragfunktion von Sicherheitsbauteilen erklären.",
    "text": "Eine Schleppgaube besitzt ein geneigtes Pultdach, eine Satteldachgaube zwei Dachflächen mit First. Dazu kommen Walm-, Dreiecks- und geschwungene Fledermausgauben. Die Form bestimmt, wo Kehlen, Dachknicke und seitliche Anschlüsse entstehen. Besonders die Fledermausgaube verlangt eine an die Rundung angepasste Einteilung. Die Quelle ordnet sie als besondere Dachform mit erhöhten Anforderungen an die Zusatzmaßnahme ein; für eine Ausführung ist diese Zuordnung anhand der geltenden Fachregel zu prüfen. Auch Dachfenster, Lüfter und Schneefänge unterbrechen die Fläche. Sicherheitsdachhaken erfüllen zusätzlich eine tragende Schutzfunktion. Ihre Eignung und Verankerung müssen zum vorgesehenen System passen; die Deckung allein trägt diese Lasten nicht.",
    "frage": "Was verbindet die Gaubenform mit der Planung der Deckung?",
    "antwort": "Die Form legt Übergänge und Anschlüsse fest; geschwungene Gauben benötigen besonders angepasste Deckung und Zusatzmaßnahmen.",
    "fall": [
      "Ein Dachhaken soll nur an einem Ziegel befestigt werden.",
      "Die Last muss in eine dafür geeignete tragende Konstruktion eingeleitet werden.",
      "Ein passender Ziegelausschnitt genügt als tragende Verankerung."
    ],
    "aufgaben": [
      91,
      88,
      89
    ]
  },
  {
    "n": 5,
    "titel": "Materialbedarf in vier Bausteinen rechnen",
    "ziel": "Deckmaß, Flächenbedarf und Zuschläge getrennt berechnen.",
    "text": [
      "Materialbedarf beginnt mit dem wirksamen Deckmaß, nicht mit dem Außenmaß eines Ziegels. Bei einer einfachen Überdeckung ergibt sich die Decklänge aus Ziegelhöhe minus Höhenüberdeckung. Mit Decklänge in Zentimetern gilt für die Lattung: 100 geteilt durch Decklänge ergibt Meter Latte je Quadratmeter. Der Flächenbedarf einfacher Deckungen folgt aus 10000 geteilt durch Decklänge mal Deckbreite. Bei der Kronendeckung wird der Zähler verdoppelt, weil zwei Ziegel übereinanderliegen. Die Quelle rechnet beim Biber zusätzlich mit einer Fuge in der Deckbreite. Für Nägel wird der Lattenbedarf durch den Sparrenabstand geteilt. Bruch und Verschnitt werden als aufeinanderfolgende Faktoren gerechnet und nicht einfach zusammengezählt.",
      "Für eine Bestellung kommt vor dem Flächenbedarf die Dachgeometrie. Am gleich geneigten Walmdach liefert die halbe Breite zusammen mit der Firsthöhe die Sparrenlänge; die Grundfläche geteilt durch den Kosinus der Dachneigung dient als Flächenkontrolle. Eine Kehllänge wird räumlich aus ihren waagerechten Anteilen und der Höhe ermittelt. Bei mehreren Metallstücken zählt jede Fuge als zusätzliche Überdeckung: Stücklänge gleich Kehllänge plus Summe der Überdeckungen, geteilt durch Stückzahl. Biberreihen werden zunächst aufgerundet und anschließend mit korrigierter Deckhöhe eingeteilt. Bei der Schleppgaube müssen Dachfläche und beide Ankehlungen getrennt ermittelt werden. Die in der Quelle genannten Neigungsgrenzen gehören zur jeweiligen Ausführung und sind vor einer realen Bestellung zu überprüfen."
    ],
    "frage": "Warum rechnest du bei sieben Kehlstücken nur sechs Überdeckungen?",
    "antwort": "Nur zwischen benachbarten Stücken entsteht eine Fuge; sieben Stücke haben sechs innere Verbindungen.",
    "fall": [
      "Bruch beträgt 2 %, Verschnitt 5 %.",
      "Die Grundmenge wird nacheinander mit 1,02 und 1,05 multipliziert.",
      "Die Faktoren werden als 1,07 zusammengefasst."
    ],
    "aufgaben": [
      129,
      132,
      131
    ]
  },
  {
    "n": 6,
    "titel": "Vom Walmdach zur Stückliste gelangen",
    "ziel": "die Abhängigkeiten zwischen Dachgeometrie und Bestellmengen erklären.",
    "text": "Am gleich geneigten Walmdach bestimmst du zuerst Firsthöhe, Sparrenlänge, Gesamtfläche, First und Grate. Erst danach folgen die Materialmengen. Im Quellenbeispiel ergeben sich aus 12,70 Metern Trauflänge und 4,80 Metern halber Breite bei 45 Grad rund 172,47 Quadratmeter Dachfläche. Die Decklänge bestimmt den Lattenbedarf je Quadratmeter. Durch Division durch den Sparrenabstand erhältst du daraus die Zahl der Lattenbefestigungen. Für Kronendeckung werden je Deckfeld zwei Biber berücksichtigt. Zuschläge kommen als Faktoren hinzu. First- und Gratziegel werden dagegen über laufende Meter berechnet. Runde benötigte ganze Stücke je einzelner Kante auf, bevor du gleichartige Kanten zusammenzählst. Sonst können trotz rechnerisch ausreichender Gesamtsumme Stücke fehlen.",
    "frage": "Warum werden Gratziegel je Grat aufgerundet?",
    "antwort": "Jeder Grat benötigt eine vollständige Stückzahl; Bruchteile verschiedener Grate lassen sich nicht beliebig zusammenlegen.",
    "fall": [
      "Vier Grate benötigen jeweils rechnerisch 20,8 Gratziegel.",
      "Je Grat 21 Stück, zusammen 84 Stück ansetzen.",
      "Die Gesamtsumme 83,2 auf 83 Stück abrunden."
    ],
    "aufgaben": [
      117,
      113,
      115
    ]
  },
  {
    "n": 7,
    "titel": "Schieferfläche und Sonderbereiche trennen",
    "ziel": "bei Schiefer Flächenmaterial, Randmaterial und Gebindesteigung unterscheiden.",
    "text": "Bei altdeutscher Deckung unterscheiden sich Schiefer in Höhe und Breite. Deshalb wird der Bedarf in der Quelle nach Gewicht statt als einheitliche Stückzahl angegeben. Andere Deckarten können mit Stückzahlen je Quadratmeter rechnen. Ziehe vor der Ermittlung des Flächenmaterials Fuß-, Grat- und Kehlbereiche von der Dachfläche ab. Dort benötigst du eigene Steinsorten und getrennte Mengen. Das Quellenbeispiel reduziert 126,476 Quadratmeter Dachfläche auf 110,572 Quadratmeter Deckfläche. Die Dachgeometrie bleibt eine vorgelagerte Rechnung. Für die Gebindesteigung verwendet die Quelle tan β = 1 − sin α. Erst daraus folgen Winkel und Steigung je Meter. Flachere Dachflächen ergeben in diesem Modell eine größere Gebindesteigung.",
    "frage": "Warum ist die Deckfläche kleiner als die gesamte Dachfläche?",
    "antwort": "Fuß-, Grat- und Kehlbereiche werden mit eigenen Steinsorten gedeckt und deshalb separat berechnet.",
    "fall": [
      "Die gesamte Dachfläche soll mit dem Tabellenwert für normale Decksteine multipliziert werden.",
      "Zuerst die gesonderten Fuß-, Grat- und Kehlflächen abziehen.",
      "Sondersteine werden ohne eigene Menge automatisch mitgeliefert."
    ],
    "aufgaben": [
      125,
      126,
      123
    ]
  },
  {
    "n": 8,
    "titel": "Metall- und Systemkehlen vergleichen",
    "ziel": "Unterlage, Bewegung und Materialverträglichkeit einer Kehlrinne erklären.",
    "text": "Eine Metallkehle führt das gesammelte Wasser in einer geformten Rinne. Eine geeignete Unterlage stützt das Blech, eine Vordeckung schützt die Konstruktion darunter. Seitliche Wasserfalze begrenzen den Wasserlauf; Hafte halten das Blech und ermöglichen zugleich seine temperaturbedingte Bewegung. Überdeckungen und dichte Stoßausbildungen richten sich nach der tatsächlichen Kehlneigung. Die Quelle nennt dafür mehrere Grenzwerte, die nur zusammen mit der beschriebenen Ausführung gelesen werden dürfen. Zink, Kupfer und Aluminium sind zudem mit den übrigen Metallen und deren Wasserablauf abzustimmen. Als Alternativen beschreibt die Quelle PVC-Rippenkehlen, Aluminium-PVC-Rollkehlen sowie profilierte Biege- und Variokehlen. Deren Trennlagen, Befestigungsbereiche und Überdeckungen ergeben sich aus dem jeweiligen System.",
    "frage": "Warum sind Hafte und Materialverträglichkeit bei einer Metallkehle wichtig?",
    "antwort": "Hafte halten das Blech bei möglicher Längenänderung; verträgliche Metallkombinationen vermeiden Korrosion durch Kontakt oder Wasserablauf.",
    "fall": [
      "Eine PVC-Systemkehle soll wie ein beliebiges Kehlblech festgenagelt werden.",
      "Die vorgesehenen Befestigungsbereiche und Trennlagen des Systems beachten.",
      "Alle Kehlen besitzen unabhängig vom Werkstoff denselben Aufbau."
    ],
    "aufgaben": [
      18,
      19,
      20,
      17
    ]
  },
  {
    "n": 9,
    "titel": "Anschlussbleche nach dem Wasserlauf anordnen",
    "ziel": "firstseitige, seitliche und traufseitige Anschlüsse richtig zuordnen.",
    "text": "Benutze beim Anschluss an eine Wand drei Lagebezeichnungen: firstseitig liegt oberhalb des Bauteils, traufseitig darunter und seitlich an seinen Flanken. Der firstseitige Anschluss liegt unter der ankommenden Deckung und fängt das Wasser auf. Der traufseitige Anschluss liegt über der unteren Deckung und gibt das Wasser auf sie ab. Seitliche Anschlüsse können je nach Deckung unterliegen, aufliegen oder mit Nocken in die Gebinde eingebunden sein. Wandseitige Überhangstreifen schützen die obere Anschlusskante. Wasserfalz, Freiraum zur Deckung und Überdeckung gehören gemeinsam zum Detail. Die Quelle unterscheidet ihre Maße nach Neigung und Deckwerkstoff. Übertrage deshalb keine einzelne Maßzahl auf sämtliche Anschlussarten.",
    "frage": "Wie unterscheiden sich firstseitiges und traufseitiges Blech?",
    "antwort": "Firstseitig nimmt das unterliegende Blech Wasser aus der oberen Deckung auf; traufseitig gibt das überliegende Blech Wasser auf die untere Deckung ab.",
    "fall": [
      "Das Blech unterhalb eines Schornsteins soll unter der nächsten Ziegelreihe verschwinden.",
      "Das traufseitige Blech muss sein Wasser auf die darunterliegende Deckung abgeben.",
      "Der traufseitige Anschluss wird genauso unterlegt wie der firstseitige."
    ],
    "aufgaben": [
      40,
      42,
      43,
      44
    ]
  },
  {
    "n": 10,
    "titel": "Schieferanschlüsse ohne Maßverwechslung planen",
    "ziel": "Wandkehle, Nocken und Anschlussbleche am Schieferdach unterscheiden.",
    "text": "Am Schieferdach können seitliche Übergänge als gedeckte Wand- oder Wangenkehle oder mit Metallteilen hergestellt werden. Nocken werden dabei gebindeweise eingebunden, während durchgehende Blechwinkel einen anderen Anschluss bilden. Oberhalb eines Bauteils sammelt eine Metallkehle das Wasser, unterhalb gibt ein überdeckendes Anschlussblech es wieder auf die Schiefer ab. Die Wandkehle verbindet Kehlplatten mit den Flächengebinden; die Quelle beschreibt dafür besondere Formate, Breiten und Überdeckungen. Diese Maße sind nicht automatisch Maße eines Metallanschlusses. Besonders wichtig ist der Quellenwiderspruch bei der firstseitigen Hochführung: Verschiedene Aufgaben nennen 15 beziehungsweise 18 Zentimeter. Benenne diesen Unterschied und prüfe das konkrete Detail, statt eine Zahl als allgemeingültig auszugeben.",
    "frage": "Wie gehst du mit den Angaben 15 und 18 cm um?",
    "antwort": "Die Quelle enthält verschiedene Detailangaben; die maßgebliche Ausführung muss geklärt werden, statt beide Werte zu einer Regel zu vermischen.",
    "fall": [
      "Zwei Aufgaben nennen unterschiedliche firstseitige Anschlusshöhen.",
      "Die Zuordnung zum jeweiligen Detail prüfen und den Widerspruch kenntlich machen.",
      "Ohne weitere Prüfung immer den kleineren Wert wählen."
    ],
    "aufgaben": [
      81,
      87,
      83
    ]
  },
  {
    "n": 11,
    "titel": "Schiefer- und Plattenkehlen einteilen",
    "ziel": "erhöhte Überdeckungen und den Verband einer Schieferkehle erklären.",
    "text": "Die Kehlart beschreibt zunächst die Lage: Hauptkehle zwischen Dachflächen, Sattelkehle an einer Gaube und Wand- oder Wangenkehle am senkrechten Bauteil. Danach entscheidest du über Schiefer oder Metall. Bei einer Schieferkehle schaffen Kehlbrett und Leisten einen gleichmäßigen Übergang; Vordeckung und sichere Befestigung schützen die Unterkonstruktion. Wegen des zusammenlaufenden Wassers verlangt die Quelle größere Überdeckungen als in der Fläche. Eingebundene Plattenkehlen verbinden Flächen- und Kehlgebinde. Überdeckte Plattenkehlen liegen unter den auslaufenden Flächengebinden. Beide benötigen einen Verband ohne Kreuzfugen. Bei der beispielhaften 40-Zentimeter-Platte ergeben drei Sichthöhen zusammen 39 Zentimeter, wenn das vierte Gebinde das erste noch um einen Zentimeter überdeckt.",
    "frage": "Warum teilst du bei diesem Beispiel durch drei und nicht vier?",
    "antwort": "Zwischen erstem und viertem Gebinde liegen drei Sichthöhen; die vierte Reihe liefert die geforderte Überdeckung.",
    "fall": [
      "Für eine 40-cm-Kehlplatte mit 1 cm Überdeckung soll die Sichthöhe bestimmt werden.",
      "(40 − 1) : 3 = 13 cm.",
      "40 : 4 = 10 cm, weil vier Gebinde genannt sind."
    ],
    "aufgaben": [
      62,
      64,
      65,
      66
    ]
  },
  {
    "n": 12,
    "titel": "Ziegelkehlen nach ihrem Aufbau unterscheiden",
    "ziel": "Dreipfannen-, Nocken- und Schwenkziegelkehle auseinanderhalten.",
    "text": "Eine Ziegelkehle benötigt eine zur Kehlform passende Schalung mit Vordeckung. Sie wird auf den Übergang der beiden Dachflächen ausgerichtet. Die Dreipfannenkehle besitzt einen mittleren Wasserziegel und zwei seitliche Kehlziegel. Bei der Nockenkehle liegen dagegen Metallschichtstücke zwischen den zugespitzten Flächenziegeln; sie ist deshalb keine reine Ziegelrinne. Die Schwenkziegelkehle nutzt besondere konische Formziegel in der Biberschwanz-Kronendeckung. Jede Form besitzt eigene Voraussetzungen für Breite, Überdeckung und Kehlneigung. Die Zahlen der Quelle gehören jeweils zu dieser Form. Begriffe wie Wasserstein, Einfäller und Schwärmer beschreiben dagegen Anschlusssteine einer Schieferkehle. Sie dürfen beim Lernen nicht versehentlich als Bauteile der Dreipfannenkehle eingeordnet werden.",
    "frage": "Was unterscheidet eine Dreipfannenkehle von einer Nockenkehle?",
    "antwort": "Die Dreipfannenkehle führt Wasser mit drei Hohlpfannen je Gebinde; die Nockenkehle enthält eingelegte Metallschichtstücke.",
    "fall": [
      "In einem Kehlgebinde liegen Wasserziegel, linker und rechter Kehlziegel.",
      "Das beschreibt die Dreipfannenkehle.",
      "Das beschreibt eine Nockenkehle aus Metallschichtstücken."
    ],
    "aufgaben": [
      23,
      24,
      28,
      29
    ]
  },
  {
    "n": 13,
    "titel": "Die Rundung einer Fledermausgaube decken",
    "ziel": "Form, Einteilung und Sonderziegel einer geschwungenen Gaube erklären.",
    "text": "An einer Fledermausgaube geht das Hauptdach ohne gerade seitliche Kante in eine Rundung über. Deshalb muss das Deckmaterial die Form tatsächlich mitmachen können. Die Quelle nennt unterschiedliche Breiten-Höhen-Verhältnisse für Hohlpfannen und Biber und begrenzt den Neigungsunterschied zum Hauptdach. Diese Angaben beziehen sich auf die beschriebene Ausführung. Konterlatten folgen möglichst dem Wasserweg; Traglatten führen durch den Gaubenbereich. Die Deckung wird von einem senkrechten Gang in der Mitte aus eingeteilt. Deckbreite und Decklänge werden innerhalb der zulässigen Möglichkeiten angepasst. Konvexe, konkave und konische Sonderbiber erleichtern Rundungen. Andere Formziegel erfüllen getrennte Aufgaben an Ortgang, Pultfirst, Lüftung oder Durchführungen und sind deshalb gezielt auszuwählen.",
    "frage": "Warum beginnt die Einteilung in der Gaubenmitte?",
    "antwort": "Ein mittiger Ausgangsgang ermöglicht eine abgestimmte, gleichmäßige Verteilung der Deckung über beide Rundungen.",
    "fall": [
      "Eine Rundung soll allein durch größere offene Fugen entstehen.",
      "Passende Formziegel und zulässige Anpassungen der Deckmaße einplanen.",
      "Offene Fugen können fehlende Formbarkeit beliebig ausgleichen."
    ],
    "aufgaben": [
      55,
      57,
      58
    ]
  },
  {
    "n": 14,
    "titel": "Gleich geneigte Dächer ausmitteln",
    "ziel": "Grundrisslinien und räumliche Dachlängen miteinander verbinden.",
    "text": [
      "Bei gleicher Dachneigung und gleicher Traufhöhe verlaufen Grat- und Kehllinien im Grundriss auf den Winkelhalbierenden. An rechtwinkligen Gebäudeecken ergibt das 45 Grad. Außenkanten erzeugen Grate, einspringende Ecken Kehlen. Die Firste liegen bei gleich breiten Dachhälften parallel zur Traufe in halber Breite. Für die räumliche Rechnung erhältst du h aus halber Breite mal Tangens der Dachneigung und s aus halber Breite geteilt durch Kosinus. Grat und Kehle benötigen zusätzlich ihre waagerechten Grundrissanteile. Ihre Neigung ist flacher als die Flächenneigung. Ein Verfallgrat ist der verbleibende Gratabschnitt am Anschluss eines Anbaus. Die Flächensumme lässt sich bei einheitlicher Neigung durch Grundfläche geteilt durch Kosinus kontrollieren.",
      "Unterschiedliche Traufhöhen verlangen eine zusätzliche Höhenbetrachtung. Eine im Grundriss verlängerte höhere Traufe kann in die Dachfläche der niedrigeren Traufe hineinlaufen. Profile oder rechtwinklige Projektionen machen sichtbar, wo Schnittlinien tatsächlich liegen. Die einfache 45-Grad-Regel genügt dort nicht allein. Auch die Stirnansicht einer Fledermausgaube wird konstruiert: Breite und Scheitelhöhe legen zunächst Grundlinie und höchsten Punkt fest. Bei der Viertelmethode werden die Verbindungslinien vom Scheitel zu den Enden geteilt; passende Senkrechten bestimmen die Mittelpunkte der anschließenden Kreisbögen. So entsteht ein aus drei Segmenten zusammengesetzter Stirnbogen. Die Zeichnung liefert anschließend die Form, an die Unterkonstruktion und Deckung angepasst werden müssen."
    ],
    "frage": "Wann gilt die 45-Grad-Linie an einer rechtwinkligen Ecke?",
    "antwort": "Bei gleicher Dachneigung und passender gemeinsamer Traufhöhe; bei abweichenden Höhen oder Neigungen muss konstruiert werden.",
    "fall": [
      "Zwei Dachflächen haben unterschiedliche Neigungen.",
      "Ihre Schnittlinie wird konstruiert und nicht pauschal als 45-Grad-Linie gezeichnet.",
      "Jede Kehle liegt unabhängig von den Dachneigungen bei 45 Grad."
    ],
    "aufgaben": [
      95,
      94,
      96
    ]
  },
  {
    "n": 15,
    "titel": "Kehlen nach Lage und Konstruktion ordnen",
    "ziel": "gleichhüftige, ungleichhüftige, eingebundene und überdeckte Kehlen unterscheiden.",
    "text": "Eine Kehle entsteht an der einspringenden Verschneidung geneigter Dachflächen. Gleiche Dachneigungen ergeben eine gleichhüftige, verschiedene Neigungen eine ungleichhüftige Kehle. Der Kehlsparren nimmt zusätzlich Lasten der angeschlossenen Kehlschifter auf. Seine Lage und Bearbeitung müssen deshalb sowohl Tragkonstruktion als auch Kehlauflage ermöglichen. Für die Deckung kommt eine zweite Einteilung hinzu: Eingebundene Kehlen werden mit den Flächengebinden im Verband hergestellt. Überdeckte Kehlen liegen darunter und werden seitlich von der Flächendeckung überlappt. Ihr Material kann vom Flächenmaterial abweichen. Die Quelle nennt für nicht gesondert geregelte Ausführungen eine grundsätzliche seitliche Überdeckung, unterscheidet jedoch ausdrücklich besondere Systeme. Prüfe daher zuerst die Bauart, danach deren Maße.",
    "frage": "Warum sind gleichhüftig und eingebunden keine Gegensätze?",
    "antwort": "Gleichhüftig beschreibt die Dachneigungen; eingebunden beschreibt die Verbindung der Kehldeckung mit der Flächendeckung.",
    "fall": [
      "Eine Kehle verbindet gleich geneigte Flächen im Verband.",
      "Sie kann zugleich gleichhüftig und eingebunden sein.",
      "Eine gleichhüftige Kehle kann niemals eingebunden sein."
    ],
    "aufgaben": [
      8,
      9,
      11,
      12
    ]
  },
  {
    "n": 16,
    "titel": "Gebinde der eingebundenen Biberkehle verstehen",
    "ziel": "Unterläufer, Überläufer und Kehlanfang funktional erklären.",
    "text": "Die eingebundene Biberkehle verbindet die Dachflächen ohne getrennte offene Rinne. Ausreichende Kehlbreite und Dreifachdeckung halten den Wasserweg geschlossen. Kreuzfugen entstehen durch zu kleine seitliche Über- und Unterdeckungen und sind zu vermeiden. Bei gleichhüftiger Doppeldeckung arbeiten Deck- und Unterläuferschicht zusammen. In Kronendeckung kommt die Lagerschicht hinzu. Ungleichhüftige Kehlen benötigen auf der flacheren Seite zusätzlich Überläufer zum Höhenausgleich; dadurch verändert sich das Deckbild. Eingeteilt wird entsprechend der steileren Seite und der gewählten Schichtenfolge. Am Kehlanfang ergänzen bearbeitete Ziegel und Zwickel die Lagerschicht, darüber führen Wasserziegel und Ausspitzer weiter. Am Kehlende sichern Auslaufschichten den Übergang. Die Quellenmaße gehören jeweils zu dieser Deckungsart.",
    "frage": "Welche Aufgabe haben Überläufer bei ungleichhüftigen Kehlen?",
    "antwort": "Sie gleichen auf der flacheren Dachseite die unterschiedlichen Gebindehöhen aus.",
    "fall": [
      "Bei einer ungleichhüftigen Biberkehle fehlen auf der flacheren Seite Ausgleichsschichten.",
      "Die erforderlichen Überläufer und die Einteilung der Gebinde prüfen.",
      "Die unterschiedlichen Höhen durch offene Kreuzfugen ausgleichen."
    ],
    "aufgaben": [
      36,
      37,
      38
    ]
  },
  {
    "n": 17,
    "titel": "Überdeckte Kehlen passend zum Dach wählen",
    "ziel": "Biber-, Formziegel- und Blechkehle anhand ihrer Funktion vergleichen.",
    "text": "Bei einer überdeckten Kehle enden die Flächengebinde über der seitlich unterliegenden Kehldeckung. Eine Biberkehle wird mit versetzten Fugen und ausreichend vielen Ziegelbreiten angelegt. Die Quelle beschränkt diese Lösung auf annähernd gleiche Dachneigungen und ähnlichen Wasseranfall. Bei einer Formziegelkehle bestimmen Rinne, Steg und Modell die Überdeckung. Eine Blechkehle benötigt dagegen eine passende Schalung, Vordeckung, Wasserfalze und Verbindungen für den gegebenen Neigungsbereich. Ihre Bleche und die darüberliegenden Dachplatten besitzen unterschiedliche Überdeckungsmaße. Diese beiden Richtungen darfst du nicht verwechseln. Vergleiche deshalb nicht nur das sichtbare Material, sondern auch Unterlage, Befestigung, Wasseranfall und die genaue Zugehörigkeit jeder Maßangabe zum beschriebenen Detail.",
    "frage": "Welche zwei Überdeckungen musst du bei einer Blechkehle unterscheiden?",
    "antwort": "Die Überdeckung benachbarter Kehlbleche untereinander und die seitliche Überdeckung der Bleche durch die Dachdeckung.",
    "fall": [
      "Eine Maßtabelle nennt 15 cm zwischen Kehlblechen.",
      "Prüfen, welches eigene Maß für die Überdeckung durch Dachplatten gilt.",
      "15 cm automatisch für sämtliche Abstände der Kehle übernehmen."
    ],
    "aufgaben": [
      25,
      26,
      21,
      78
    ]
  },
  {
    "n": 18,
    "titel": "Wand- und Wangenkehlen decken",
    "ziel": "die Übergänge zur senkrechten Fläche bei Biber und Schiefer erklären.",
    "text": "Wand- und Wangenkehlen schließen eine senkrechte Fläche wasserführend an das Dach an. Bei der beschriebenen Biberwandkehle trägt eine schmale Kehlschalung die im Halbverband verlegten Kehlbiber. Sie werden nach oben geschoben und gegen Abrutschen gesichert. Eine eingebundene Wangenkehle verbindet die Deckschichten beider Flächen mit Unterläufern und Ausspitzern. Eine durchgedeckte Variante nutzt entsprechend gebogene und befestigte Latten für den fließenden Übergang. Die Quelle beschreibt dafür eine besondere Vorbereitung der Latten; das ist keine allgemeine Freigabe für beliebiges Biegen. Bei Schiefer unterscheidet sich die eingehende von der ausgehenden Wangenkehle durch die Deckrichtung. Unterlage, erforderliche Neigung und Überdeckungen sind entsprechend der gewählten Ausführung zu prüfen.",
    "frage": "Was unterscheidet eingehende und ausgehende Schieferwangenkehle?",
    "antwort": "Eingehend wird von der Dachfläche zur senkrechten Fläche gedeckt; ausgehend in der Gegenrichtung.",
    "fall": [
      "Kehlbiber sollen allein durch ihr Eigengewicht auf der Schalung liegen bleiben.",
      "Eine geeignete Sicherung gegen Abrutschen gehört zum Detail.",
      "Die Lage im Halbverband ersetzt jede Befestigung."
    ],
    "aufgaben": [
      46,
      47,
      48,
      83
    ]
  },
  {
    "n": 19,
    "titel": "Schieferhauptkehle und Nockenkehle vergleichen",
    "ziel": "Deckrichtung, Anschlusssteine und Metallnocken einer Schieferkehle erklären.",
    "text": "Eine eingebundene Schieferkehle verbindet die Deckgebinde beider Flächen mit Kehlplatten. Ausreichende Breite, erhöhte Höhenüberdeckung und halbe Seitenüberdeckung bilden dabei einen durchgehenden Wasserweg. Die Quelle beschreibt die Deckrichtung von der flacheren zur steileren und von der Neben- zur Hauptdachfläche. Wasserstein, Einfäller und Schwärmer lösen unterschiedliche Richtungsübergänge. Schnürungen führen die einzelnen Steine durch den ausgerundeten Bereich. Am First liegt das Kragengebinde über dem Ausspitzgebinde. Als Alternative werden bei geeigneter Deckart und Neigung Metallnocken in jedes Gebinde eingelegt. Dabei bleibt in der Kehlmitte ein schmaler Wasserlauf sichtbar. Befestigung, Überdeckung der Nocken untereinander und Überdeckung durch die Schiefer sind getrennte Prüfpunkte.",
    "frage": "Warum ist die Nockenkehle eine eigene Ausführung?",
    "antwort": "Sie führt Wasser über gebindeweise eingelegte Metallstücke statt ausschließlich durch verbundene Schiefergebinde.",
    "fall": [
      "Ein Firstabschluss soll zuerst ein Kragengebinde und darüber ein Ausspitzgebinde erhalten.",
      "Die beschriebene Reihenfolge ist umgekehrt: Kragengebinde über Ausspitzgebinde.",
      "Die beiden Gebinde können ohne Wirkung vertauscht werden."
    ],
    "aufgaben": [
      72,
      74,
      75,
      80
    ]
  },
  {
    "n": 20,
    "titel": "Gauben und Einbauteile vor der Deckung einteilen",
    "ziel": "Dachknicke, Sattelkehlen und tragende Befestigungen vorausschauend planen.",
    "text": "Die Gaube muss bereits bei der Einteilung der Hauptdachfläche berücksichtigt werden. So können Reihen vor der Gaube durchlaufen und die Anschlüsse werden nicht erst mit Reststücken geschlossen. Eine Schleppgaube bildet einen Dachknick. Je nach Neigungswechsel beschreibt die Quelle Formziegel oder entsprechend angeordnete Latten als Lösung. Sattel- und Spitzgauben erzeugen dagegen Sattelkehlen. Auch an der Gaube gelten die Voraussetzungen der gewählten Deckungsart. Dachfenster werden entweder mit passenden Nocken oder dem vorgesehenen Eindeckrahmen angeschlossen. Dachhaken und Schneefangstützen brauchen zusätzlich eine geeignete tragende Befestigung. Eine Unterlage kann Druck von den Deckplatten fernhalten. Sie ersetzt jedoch weder den Tragfähigkeitsnachweis noch die systemgerechte Verankerung.",
    "frage": "Warum wird eine Gaube schon beim Einteilen des Hauptdachs berücksichtigt?",
    "antwort": "Durchlaufende Reihen, passende Deckmaße und die Anschlüsse müssen räumlich zusammenpassen.",
    "fall": [
      "Der Dachhaken drückt direkt auf einen ausgeschnittenen Schiefer.",
      "Lastabtragung, Auflager und systemgerechte Befestigung prüfen.",
      "Die dünne Deckplatte darf die gesamte Hakenlast aufnehmen."
    ],
    "aufgaben": [
      51,
      52,
      54,
      89
    ]
  },
  {
    "n": 21,
    "titel": "Gaubenform, Schmuck und Reparatur beurteilen",
    "ziel": "Gestaltungselemente von wasserführenden und tragenden Details unterscheiden.",
    "text": "Schlepp-, Sattel-, Spitz- und Fledermausgauben gewinnen Raum und bringen senkrechte Fenster ins Dach. Ihre Formen erzeugen unterschiedliche Anschlusslinien. Bei geschweiften Gauben entscheidet das Verhältnis von Höhe zu Breite mit darüber, ob normale Gebinde durchlaufen oder Kehldeckungen nötig werden. Satteldachgauben besitzen wegen ihrer Neigung und Konstruktion nur begrenzte sinnvolle Breiten. Dachschmuck erfüllt dagegen vor allem eine Gestaltungsaufgabe. Trotzdem muss er sicher befestigt werden; die Quelle zeigt am Firsthahn eine zusätzliche mechanische Sicherung neben der Klebung. Bei einer Schieferreparatur sollen Ersatzsteine in Material und Dicke passen. Korrosionsgeschützte Reparaturhaken ermöglichen eine verdeckte Befestigung, ohne neue sichtbare Nagellöcher in den Ersatzstein zu schlagen.",
    "frage": "Warum benötigt Dachschmuck eine geeignete Sicherung?",
    "antwort": "Auch ein Gestaltungsteil wird durch Wind belastet und darf sich nicht lösen.",
    "fall": [
      "Ein Ersatzschiefer soll durch ein neues sichtbares Loch befestigt werden.",
      "Ein geeignetes Reparatursystem mit passendem Ersatzschiefer prüfen.",
      "Jede beliebige zusätzliche Lochung ist automatisch dauerhaft regensicher."
    ],
    "aufgaben": [
      91,
      92,
      90,
      60
    ]
  },
  {
    "n": 22,
    "titel": "Kehllänge in Reihen und Stücke übersetzen",
    "ziel": "halbe Breiten, Überdeckungen und aufgerundete Reihenzahlen richtig einsetzen.",
    "text": "Für die Kehllänge brauchst du die räumlichen Abmessungen des zutreffenden Dachfalls. In den Quellenformeln stehen halbe Gebäudebreiten; volle Breiten würden die Kehle deutlich verlängern. Gleiche Neigung bedeutet bei verschieden breiten Gebäudeteilen noch keine gleiche Firsthöhe. Unterscheide deshalb gleiche und unterschiedliche Höhen ausdrücklich. Aus der berechneten Kehllänge folgt bei Metallstücken die Summe der inneren Überdeckungen. Drei Stücke haben zwei Stöße. Bei Biber- oder Dreipfannenkehlen teilst du die Länge zunächst durch die mögliche Deckhöhe und rundest die Reihenzahl auf. Danach berechnest du die tatsächliche Deckhöhe erneut. Erst die korrigierte Überdeckung und die Ziegelzahl je Reihe ergeben eine überprüfbare Bestellung.",
    "frage": "Was folgt nach dem Aufrunden einer Reihenzahl?",
    "antwort": "Die Kehllänge durch die ganze Reihenzahl teilen und die daraus entstehende Deckhöhe sowie Überdeckung kontrollieren.",
    "fall": [
      "44,2 Reihen werden zu 45 Reihen aufgerundet.",
      "Die Deckhöhe mit Kehllänge : 45 neu bestimmen.",
      "Die alte Deckhöhe unverändert lassen und die Kehle verlängern."
    ],
    "aufgaben": [
      110,
      108,
      106
    ]
  },
  {
    "n": 23,
    "titel": "Ungleiche Dachneigungen einzeln berechnen",
    "ziel": "Teilflächen und zugehörige Winkel sicher zuordnen.",
    "text": "Bei unterschiedlichen Dachneigungen besitzt jede Fläche ihre eigene räumliche Geometrie. Bestimme Firsthöhen und Hilfslängen daher getrennt und trage die Bezeichnungen in eine Skizze ein. In den besonderen Verschneidungsbeispielen der Quelle kann eine Höhe mit dem Winkel der angrenzenden Fläche zusammengehören. Das ist eine Zuordnung aus der Zeichnung und keine allgemeine Regel für jeden Sparren. Grat, Kehle und First folgen anschließend aus den zugehörigen Hilfsmaßen. Für Flächen zerlegst du das Dach in Trapeze, Dreiecke und Parallelogramme. Addiere oder subtrahiere nur eindeutig bezeichnete Teile. Eine einzige Kontrolle durch Grundfläche geteilt durch einen Kosinus funktioniert ausschließlich bei einheitlicher Dachneigung, nicht für das gesamte ungleich geneigte Dach.",
    "frage": "Warum gibt es bei ungleichen Neigungen keinen gemeinsamen Kosinus für die Gesamtfläche?",
    "antwort": "Jede geneigte Teilfläche besitzt einen eigenen Neigungswinkel und damit einen eigenen Vergrößerungsfaktor.",
    "fall": [
      "Ein Dach hat Flächen mit 40 und 50 Grad.",
      "Die Teilflächen mit ihren jeweils passenden Maßen berechnen und addieren.",
      "Die gesamte Grundfläche pauschal durch cos 40 Grad teilen."
    ],
    "aufgaben": [
      103,
      102,
      104
    ]
  },
  {
    "n": 24,
    "titel": "Die vollständige Dachrechnung strukturieren",
    "ziel": "Geometrie, Detailentscheidung und Materialbedarf in eine prüfbare Reihenfolge bringen.",
    "text": "Ein zusammengesetztes Dach wird in einer Abhängigkeitskette bearbeitet: zuerst Firsthöhen, dann Sparren, anschließend Grate und Kehlen, danach Firstlängen und Teilflächen. Zeichne die Gebäudeteile und ihre Höhen dazu auf. Bei gleicher Neigung können verschiedene Breiten trotzdem verschiedene Firsthöhen erzeugen. Die Flächenkontrolle über Grundfläche und Kosinus gilt nur bei einheitlicher Neigung. In der Projektaufgabe werden zusätzlich Holzquerschnitte, Abstände und Überstände vorgegeben. Diese Werte werden gelesen und zugeordnet, nicht frei erfunden. Auf der Geometrie bauen die Empfehlungen für Deckmaterial, Kehlart und Gaubenlage auf. Zum Abschluss werden Flächenmaterial und Kantenmaterial getrennt berechnet. Eine begründete Detailwahl gehört damit ebenso zum Ergebnis wie die richtige Zahl.",
    "frage": "Welche Ergebnisse brauchst du vor der Materialbestellung?",
    "antwort": "Eine überprüfte Dachgeometrie, die gewählte Deckungs- und Kehlart sowie getrennte Mengen für Flächen und Kanten.",
    "fall": [
      "Für ein zusammengesetztes Dach soll zuerst eine pauschale Ziegelmenge bestellt werden.",
      "Zuerst Geometrie und Deckungsart festlegen, dann den Bedarf daraus berechnen.",
      "Die Dachfläche ist unabhängig von Anbauten und Kehlen."
    ],
    "aufgaben": [
      140,
      138,
      139
    ]
  }
];
const LF13A_KAPITEL = kurs("lf13a", LF13A_REDAKTION, [["Wasserlauf und Kehlkonstruktion", [1, 2, 15, 8]], ["Kehlen mit Bibern und Formziegeln", [12, 16, 17, 18]], ["Schiefer: Kehlen und Material", [10, 11, 19, 7]], ["Durchdringungen und Gauben anschließen", [3, 9, 4, 13]], ["Deckung planen und Mengen bestellen", [20, 21, 5, 6]], ["Dachgeometrie zeichnen und rechnen", [14, 22, 23, 24]]]);

const LF13B_REDAKTION: Redaktion[] = [
  {
    "n": 1,
    "titel": "Vom Halm zum geprüften Reetbund",
    "ziel": "Pflanze, Winterernte und Handelsform des Reets erklären.",
    "text": "Reet besteht aus Schilfrohrhalmen einer Grasart. Der zylindrische Halm wächst an flachen Gewässerufern. Im Winter ist die Pflanze trocken und weitgehend blattfrei, der Halm bleibt jedoch elastisch. Nach der Ernte wird das Material getrocknet, von losen Blattteilen gereinigt und gebündelt. Handelsware wird nach Halmlänge und Halmdurchmesser sortiert. Zur Bezeichnung gehören auch Erntejahr und Herkunft. Der Umfang eines Bundes wird nach der Quelle mit straffem Maßband zwanzig Zentimeter über dem Stoppelende gemessen. Saubere, trockene und gerade Halme sind entscheidend; Gras, Schimmel oder Schädlingsbefall gefährden die Haltbarkeit. Herkunftsanteile aus der Quelle beschreiben deren damaligen Markt und sind keine aktuelle Lieferstatistik.",
    "frage": "Warum ist die Winterernte für Dachreet günstig?",
    "antwort": "Die Halme sind trocken und blattarm, behalten aber ihre für die Verarbeitung notwendige Elastizität.",
    "fall": [
      "Ein Bund riecht muffig und enthält Gras.",
      "Die Qualität muss vor der Verarbeitung beanstandet und geprüft werden.",
      "Die spätere Deckungsdicke macht jedes feuchte Material brauchbar."
    ],
    "aufgaben": [
      4,
      5,
      9
    ]
  },
  {
    "n": 2,
    "titel": "Werkzeuge und Hilfsmittel auseinanderhalten",
    "ziel": "Klopfer, Vorlegestange, Reethaken und Nähnadeln ihren Aufgaben zuordnen.",
    "text": "Die Vorlegestange hält zusammen mit Reethaken das noch lose Reet in seiner Lage. Sie bleibt kein Bestandteil der fertigen Deckung. In Rundungen kann ein biegsames Hilfsmittel ihre Aufgabe übernehmen. Der Klopfer richtet die Halme vor der Befestigung aus und glättet danach die Fläche. Der hier als Dachstuhl bezeichnete Gegenstand ist ein eingehängtes Arbeitsgerät mit Standfläche. Reetnadeln führen Draht um die Dachlatte. Eine lose Nadel verlangt einen Binnennäher, während Nähbesteck und Rundnadel die Arbeit von außen ermöglichen. Bindedraht und der deutlich dickere Stangendraht haben verschiedene Aufgaben. Für sämtliche Werkzeuge gilt: Ihre Benutzung erfolgt innerhalb einer geplanten sicheren Arbeitsstelle mit geeigneter Absturzsicherung.",
    "frage": "Welches Werkzeug hält vorläufig, welches richtet aus?",
    "antwort": "Vorlegestange und Reethaken halten das lose Reet; der Klopfer richtet es aus und putzt die befestigte Fläche nach.",
    "fall": [
      "Der Klopfer soll die Vorlegestange dauerhaft ersetzen.",
      "Die Haltehilfe und das Ausrichtwerkzeug erfüllen verschiedene Aufgaben.",
      "Der Klopfer ist das eigentliche Befestigungsmittel der Deckung."
    ],
    "aufgaben": [
      17,
      20,
      21,
      26
    ]
  },
  {
    "n": 3,
    "titel": "Unterkonstruktion und Deckprinzip verstehen",
    "ziel": "Wasserableitung, Hinterlüftung und die drei Befestigungsarten verbinden.",
    "text": "Reet leitet Wasser über die Halme ab und bildet keine geschlossene wasserdichte Bahn. Eine steile Dachfläche und gutes Abtrocknen gehören deshalb zum Deckprinzip. Die Quelle nennt dafür Mindestneigung, Lüftungsraum und Deckungsdicken der beschriebenen Konstruktion. Kräftige Latten nehmen neben dem Gewicht auch Kräfte der Bindungen auf. Die Streuschicht aus groben Halmen verhindert ein Durchrutschen der Spitzen. An der Traufe hebt der Kneep die Auflagekante an und erzeugt Beugung und Spannung in der Deckung. Beim gebundenen Dach klemmt ein Bandstock das Reet. Beim genähten Dach umschlingt Draht direkt die Latte. Beim geschraubten Dach bleibt der Bandstock erhalten; Schrauben übernehmen seine Verankerung.",
    "frage": "Welche Befestigungsart arbeitet ohne Bandstock?",
    "antwort": "Die genähte Reetdeckung wird mit Draht direkt um die Dachlatte befestigt.",
    "fall": [
      "Ein genähtes Reetdach wird mit einem geschraubten verglichen.",
      "Nur beim geschraubten Vergleichssystem bleibt ein Bandstock Bestandteil der Befestigung.",
      "Genäht bedeutet, dass der Bandstock an der Latte festgeklebt wird."
    ],
    "aufgaben": [
      31,
      32,
      34,
      43
    ]
  },
  {
    "n": 4,
    "titel": "Kanten, First und Pflege zusammen denken",
    "ziel": "Wasserableitung und Sicherung an Reetdetails erläutern.",
    "text": "An Traufe und Ortgang wird das vorgelegte Reet zunächst ausgerichtet und danach endgültig befestigt. Kehlen und Grate werden gerundet, damit Halme nicht scharf knicken und Wasser ablaufen kann. Die Kehle erhält nach der Quelle mehr Material als die Fläche. Für den First beschreibt sie Reet, Heide, Heide mit Hängehölzern sowie Grassoden. Diese Varianten besitzen eigene Unterlagen, Sicherungen und Pflegebedürfnisse. Gauben benötigen ausgerundete Übergänge; am Schornstein berücksichtigt der Anschluss die große Deckungsdicke. Kleine örtliche Fehlstellen können passende Reetpfropfen schließen. Sichtbar werdende Befestigungen zeigen dagegen einen weitergehenden Substanzverlust an. Die Lebensdauer hängt wesentlich davon ab, wie schnell die gesamte Deckung nach Regen wieder trocknet.",
    "frage": "Warum sind sichtbare Befestigungen ein ernstes Warnzeichen?",
    "antwort": "Die schützende Deckungsdicke ist abgenommen; Wasser kann die Befestigung erreichen und tiefer in den Aufbau gelangen.",
    "fall": [
      "An vielen Stellen liegen Bindungen frei.",
      "Den Gesamtzustand und die erforderliche Erneuerung untersuchen.",
      "Alle sichtbaren Bindungen gelten als normale fertige Oberfläche."
    ],
    "aufgaben": [
      53,
      56,
      59,
      67
    ]
  },
  {
    "n": 5,
    "titel": "Weiche Bedachung richtig verstehen",
    "ziel": "die Brandschutzbedeutung von Reet und den Arbeitsablauf erklären.",
    "text": "Reet und Holzschindeln gehören zu den historisch früh verwendeten Dachmaterialien. Reet wird aus gereinigten Schilfhalmen von Hand zu einer dichten wasserableitenden Deckung verarbeitet. Der Begriff weiche Bedachung beschreibt seine brandschutztechnische Einordnung. Er bedeutet nicht, dass ein einzelner Halm besonders weich sein muss. Die Quelle verbindet diese Einordnung mit besonderen Schutzabständen und einer steilen Dachneigung; aktuelle Anforderungen sind am konkreten Vorhaben zu klären. Korrosionsbeständige Drähte halten die Deckung an den Latten. Der Arbeitsablauf bleibt verständlich: zuerst lose Halme in die richtige Neigung klopfen, dann befestigen, schließlich nachputzen. Wer vorher endgültig festzieht, behindert das anschließende Ausrichten der Deckung.",
    "frage": "Was bedeutet weiche Bedachung bei Reet?",
    "antwort": "Es ist eine Brandschutzeinordnung hinsichtlich Flugfeuer und strahlender Wärme, keine Aussage über die fühlbare Härte.",
    "fall": [
      "Das Reet ist hart und trocken.",
      "Die brandschutztechnische Einordnung bleibt davon unabhängig.",
      "Harte Halme machen Reet automatisch zu einer harten Bedachung."
    ],
    "aufgaben": [
      1,
      2,
      3
    ]
  },
  {
    "n": 6,
    "titel": "Reetlieferungen messen und prüfen",
    "ziel": "Bundumfang, Paketanteil und Materialqualität kontrollieren.",
    "text": "Beim Wareneingang prüfst du sowohl Maße als auch Zustand. Die Quelle legt die Umfangsmessung zwanzig Zentimeter über dem Stoppelende mit festgezogenem Maßband fest und nennt mindestens sechzig Zentimeter Umfang. Der zugehörige Durchmesser ergibt sich näherungsweise aus Umfang geteilt durch π, hier rund neunzehn Zentimeter. Ein Paket enthält mehrere Bunde; der geforderte Anteil passender Sortierung ist als ganze Bundzahl aufzurunden. Bei fünfundzwanzig Bunden und neunzig Prozent sind daher mindestens dreiundzwanzig passende Bunde nötig. Öffne Stichproben und prüfe Geradheit, Trockenheit, Grasanteile, Schimmelspuren, Geruch und Insektenbefall. Ein passender Umfang allein macht eine feuchte oder befallene Lieferung noch nicht brauchbar.",
    "frage": "Wie viele passende Bunde braucht das 25er-Paket bei 90 %?",
    "antwort": "25 × 0,90 = 22,5; da Bunde nicht geteilt werden, sind mindestens 23 passende Bunde nötig.",
    "fall": [
      "Von 25 Bunden entsprechen 22 der angegebenen Sortierung.",
      "Das unterschreitet den in der Quelle geforderten Anteil von 90 %.",
      "22 reichen, weil 22,5 grundsätzlich abgerundet wird."
    ],
    "aufgaben": [
      10,
      13,
      16
    ]
  },
  {
    "n": 7,
    "titel": "Lattenabstände und Beugewinkel prüfen",
    "ziel": "Traglatten, Befestigungsdichte und Halmbiegung voneinander unterscheiden.",
    "text": "Reetlatten tragen die Deckung und nehmen die Zugkräfte der Befestigung auf. Die Quelle unterscheidet Querschnitte nach Sparrenabstand und engere Lattenabstände bei steileren Dächern. Das sind Vorgaben der beschriebenen Konstruktion, keine eigenständige Bemessung. An der Traufe liegen die ersten beiden Latten besonders dicht. Der Beugewinkel bezeichnet dagegen den Knick der Halme am Befestigungspunkt. Er ist weder Dachneigung noch Lattenabstand. Die Halmbiegung erzeugt Spannung in der Decklage. Beim Zählen gilt: Zwischen n Latten liegen n − 1 Felder. Werden Höchstabstände geplant, muss die Feldzahl so gewählt werden, dass kein Feld größer wird. Die bloße Abrundungsabkürzung aus einem Rechenbeispiel darf diese Kontrolle nicht ersetzen.",
    "frage": "Warum ist beim Lattenzählen eine zusätzliche Latte nötig?",
    "antwort": "Eine Reihe aus mehreren Feldern braucht an beiden Enden Begrenzungen; n Felder werden durch n + 1 Latten begrenzt.",
    "fall": [
      "Eine Einteilung führt zu einem letzten Feld oberhalb des vorgegebenen Höchstabstands.",
      "Feldzahl und Verteilung anpassen, bis alle Abstände passen.",
      "Den Restabstand ungeprüft übernehmen, weil eine Rechenabkürzung das ergibt."
    ],
    "aufgaben": [
      36,
      37,
      35
    ]
  },
  {
    "n": 8,
    "titel": "Binden, Nähen und Schrauben vergleichen",
    "ziel": "Bandstock und Drahtführung den drei Techniken zuordnen.",
    "text": "Beim gebundenen Reetdach liegt ein kräftiger Stangendraht als Bandstock quer über den Halmen. Drahtbindungen verbinden ihn mit der Lattung. Die nächste Reetlage verdeckt die Befestigung. Beim genähten Dach entfällt dieser Bandstock; eine Drahtnaht umschlingt direkt die Dachlatte. Beim geschraubten Dach wird wieder ein Bandstock eingesetzt. Spezielle Schrauben mit Drähten verbinden ihn mit der Latte, die Drahtenden werden verdrillt. Bindungen berechnest du aus Länge mal Bindungen je Meter. Bei Stichen mit einem Anfangs- und Endpunkt ist zusätzlich zwischen Anzahl der Stiche und ihrer Zwischenräume zu unterscheiden. Verdeckte und ausreichend tief liegende Befestigungen verhindern einen direkten Wasserweg in die Konstruktion.",
    "frage": "Was bleibt beim geschraubten Reetdach gegenüber dem gebundenen erhalten?",
    "antwort": "Der Bandstock bleibt erhalten; seine Verbindung zur Latte wird über geeignete Schrauben und Drähte hergestellt.",
    "fall": [
      "Eine Liste setzt beim geschraubten Dach sämtliche Stangendrähte ab.",
      "Den Bandstock weiterhin berücksichtigen.",
      "Geschraubt bedeutet grundsätzlich ganz ohne Draht."
    ],
    "aufgaben": [
      43,
      44,
      46,
      48
    ]
  },
  {
    "n": 9,
    "titel": "Reetkehle und Reetgrat ausbilden",
    "ziel": "dickere Kehldeckung und festere Gratbindung begründen.",
    "text": "In der Kehle kommt Wasser aus zwei Dachflächen zusammen. Deshalb beschreibt die Quelle eine gerundete Kehle mit etwa eineinhalbfacher Flächendicke. Aus fünfunddreißig Zentimetern Flächendeckung werden im Beispiel 52,5 Zentimeter Kehldeckung. Dafür werden entsprechend lange Halme benötigt. Sie dürfen zwischen Bindung und Stoppelende nicht waagerecht umkippen; rechtzeitig eingelegte Streulagen erhalten den Wasserlauf. Bei einem Anschluss an eine andere Deckung kann eine unterlegte Kehle notwendig sein. Am Grat steht stärker die Windsicherung im Vordergrund. Reet folgt zunächst dem Gratsparren und wird beim Übergang in die Fläche zurückgedreht. Näher am Stoppelende liegende Bindungen verkürzen den unbefestigten Hebel und verbessern die Festigung.",
    "frage": "Warum benötigt die Kehle langes Reet?",
    "antwort": "Die größere Deckungsdicke und die sichere Verbindung zwischen Bindung und Stoppelende müssen mit geneigten Halmen überbrückt werden.",
    "fall": [
      "In der Kehle liegen Halme waagerecht.",
      "Die Lage korrigieren und den vorgesehenen Unterbau prüfen.",
      "Waagerechte Halme verbessern den Abfluss durch langsamere Strömung."
    ],
    "aufgaben": [
      55,
      56,
      58
    ]
  },
  {
    "n": 10,
    "titel": "Schornstein und Katzentreppe einordnen",
    "ziel": "den Anschluss am Schornstein als Wasser- und Brandschutzdetail erklären.",
    "text": "Ein Schornstein unterbricht das Reetdach und bringt zugleich ein Bauteil mit möglichen hohen Temperaturen in seine Nähe. Die Quelle bevorzugt eine Durchdringung am First und nennt dazu einen Überstand sowie eine seitliche Auskragung. Diese Angaben müssen vor einer heutigen Ausführung mit den einschlägigen Anforderungen abgeglichen werden. Die Katzentreppe ist die stufenförmige Auskragung des Mauerwerks. Sie schafft einen Bereich, in den die dicke Firstdeckung eingebunden werden kann. Das ist eine andere Aufgabe als ein beliebiger Abstand zwischen Latten. Auch Gauben brauchen Raum zu Grat, Kehle und Ortgang, damit die dicken und gerundeten Reetdetails ohne gegenseitige Behinderung hergestellt werden können.",
    "frage": "Welche konstruktive Aufgabe hat die Katzentreppe?",
    "antwort": "Die seitliche Auskragung ermöglicht einen geschützten Anschlussbereich für die dicke Reet- beziehungsweise Firstdeckung am Mauerwerk.",
    "fall": [
      "Die Katzentreppe wird als Leiter zum Schornstein bezeichnet.",
      "Sie ist eine gemauerte Auskragung des Anschlussdetails.",
      "Sie ist ein loses Arbeitsgerät für den Dachdecker."
    ],
    "aufgaben": [
      41,
      40,
      42
    ]
  },
  {
    "n": 11,
    "titel": "Mit dem Klopfer ausrichten und reparieren",
    "ziel": "Arbeitsfolge, Reparaturpfropfen und Verschleißzeichen erklären.",
    "text": "Der Klopfer besitzt eine gelochte Platte am Stiel. Er bringt lose Halme zuerst in die gewünschte Lage. Nach der Befestigung glättet er die Deckfläche ein zweites Mal. Vorlegestange und Reethaken halten währenddessen das Material; diese Funktion übernimmt der Klopfer nicht. Bei einer kleinen örtlichen Fehlstelle kann ein zugeschnittener Reetpfropfen eingeschoben und bündig eingearbeitet werden. Seine Halme müssen zur umgebenden Deckung passen. Freiliegende alte Kokosbindungen können Wasser wie ein Docht nach innen führen und verlangen eine geeignete Instandsetzung. Werden auf großen Flächen Befestigungen sichtbar, reicht ein einzelner Pfropfen nicht aus. Dann ist der Zustand der gesamten Deckungsdicke zu beurteilen.",
    "frage": "Welche Arbeitsfolge gilt für den Klopfer?",
    "antwort": "Lose Halme ausrichten, die Deckung befestigen, danach die Fläche nachputzen.",
    "fall": [
      "Eine kleine Tierfraßstelle soll repariert werden.",
      "Einen passenden Reetpfropfen fachgerecht einarbeiten und den umgebenden Zustand prüfen.",
      "Die Stelle lediglich mit losem Gras stopfen."
    ],
    "aufgaben": [
      29,
      30,
      67,
      73
    ]
  },
  {
    "n": 12,
    "titel": "Ernte und Aufbereitung als Kette erklären",
    "ziel": "Trocknen, Hecheln und Bündeln in die richtige Reihenfolge bringen.",
    "text": "Die Quelle beschreibt die Winterernte mit einem Reetschieber auf tragfähiger geschlossener Eisdecke. Das Eis bildet dabei zugleich eine gleichmäßige Schnitthöhe. Fehlt eine solche Grundlage, werden andere Ernteverfahren eingesetzt; die Beschreibung ist keine Aufforderung zum Betreten ungeprüfter Eisflächen. Nach der Ernte stehen die Halme in Hocken, damit Wind sie trocknet. Erst anschließend werden sie gehechelt. Ein Kamm entfernt dabei welke und lose Blattteile. Das gereinigte Material wird zu Garben gebunden. Die Reihenfolge erklärt die Qualität: Feucht gebündelte oder verschmutzte Halme trocknen schlechter und können geschädigt werden. Die in der Quelle genannten Importanteile beschreiben deren Herkunftssituation und sollten nicht als aktuelle Marktstatistik gelesen werden.",
    "frage": "Was passiert beim Hecheln und wann erfolgt es?",
    "antwort": "Nach dem Trocknen werden lose und welke Pflanzenteile mit einem Kamm entfernt; danach wird das gereinigte Reet gebündelt.",
    "fall": [
      "Das frisch geerntete, nasse Reet wird dicht verpackt.",
      "Zuerst für die vorgesehene Trocknung und Reinigung sorgen.",
      "Dichte Verpackung ersetzt die Trocknung durch Wind."
    ],
    "aufgaben": [
      7,
      6,
      8
    ]
  },
  {
    "n": 13,
    "titel": "Sortierung von Bezeichnung unterscheiden",
    "ziel": "die drei Längenangaben einer Reetsortierung lesen.",
    "text": "Die Sortierung beschreibt die Maße der Halme, vor allem Länge und Durchmesser. Die Bezeichnung ergänzt, aus welchem Schnittjahr, Herkunftsland und Anbaugebiet die Ware stammt. Beides ist bei einer Lieferung notwendig. In der Quellentabelle steht je Längensortierung zunächst die Gesamtlänge des Bundes. Eine zweite Angabe begrenzt den Anteil besonders kurzer Halme. Die dritte verlangt einen bestimmten Anteil ausreichend langer Halme. Diese Spalten erfüllen also verschiedene Aufgaben. Ein einzelner langer Halm beweist die Sortierung nicht. Kurze Bunde bilden die verbleibende Kategorie unterhalb der mittellangen Sortierung. Für eine Reklamation müssen sowohl die überprüften Maße als auch die Lieferbezeichnung nachvollziehbar dokumentiert werden.",
    "frage": "Warum reicht die längste Halmspitze zur Sortierprüfung nicht?",
    "antwort": "Die Sortierung berücksichtigt zusätzlich die Verteilung kurzer und längerer Halme innerhalb des gesamten Bundes.",
    "fall": [
      "Auf dem Lieferschein steht nur langes Reet.",
      "Für eine vollständige Bezeichnung auch Schnittjahr und Herkunft prüfen.",
      "Die Angabe lang ersetzt sämtliche Angaben zur Herkunft."
    ],
    "aufgaben": [
      14,
      13,
      12
    ]
  },
  {
    "n": 14,
    "titel": "Nadeltechnik und Draht auswählen",
    "ziel": "lose Nadel, Nähbesteck und Rundnadel unterscheiden.",
    "text": "Mit einer losen Reetnadel wird der Draht von außen durch die Deckung geführt; ein Binnennäher übernimmt ihn auf der Innenseite. Gegenhalten von außen und Zug von innen spannen die Naht um die Latte. Beim Nähbesteck fangen zwei parallel geführte Nadeln den Draht ober- und unterhalb der Latte, sodass von außen gearbeitet werden kann. Die Rundnadel führt durch eine Drehbewegung wieder nach außen. Die Quelle nennt unterschiedliche Mindestdicken für Niro-, ummantelten und Kupferdraht. Diese Werte gehören zur jeweiligen Materialart. Der dicke Stangendraht ist dagegen ein Bandstock und kein Nähdraht. Seine Verwendung beschreibt die gebundene oder geschraubte Deckung; direktes Nähen erfolgt ohne Bandstock.",
    "frage": "Warum ist Stangendraht kein Ersatz für Nähdraht?",
    "antwort": "Der kräftige Stangendraht klemmt als Bandstock quer auf der Deckung; Nähdraht wird durch das Reet um die Latte geführt.",
    "fall": [
      "Ein Plan nennt direkt genähte Deckung und zugleich zwingend einen Bandstock.",
      "Die Begriffe und die vorgesehene Befestigung klären.",
      "Ein Bandstock gehört definitionsgemäß zu jeder direkten Drahtnaht."
    ],
    "aufgaben": [
      22,
      21,
      24
    ]
  },
  {
    "n": 15,
    "titel": "Traufe mit Kneep und Streuschicht beginnen",
    "ziel": "die Funktionen der ersten Lagen und der angehobenen Auflagekante erklären.",
    "text": "Die Streuschicht aus groben Halmen liegt zuerst auf der Unterkonstruktion. Sie verhindert, dass die Spitzen späterer Bunde zwischen den Latten nach innen rutschen. An der Traufe beginnt sie am Kneep. Dieser hebt die äußere Auflagekante gegenüber der Lattenebene an und erzeugt die nötige Spannung in der Decklage. Seine Höhe ist kein Lattenabstand. Für die Untertraufe werden die Bunde zunächst halbfest gehalten und waagerecht geklopft. Die Obertraufe folgt darüber in Dachneigung. Erst nach dem Ausrichten wird endgültig befestigt. Die Quelle unterscheidet sichtbare Traufdicke und die Dicke über der ersten Latte. Diese Messstellen dürfen ebenso wenig vermischt werden wie die Trauflage mit den späteren Flächenlagen.",
    "frage": "Warum werden Traufbunde zunächst nur halbfest befestigt?",
    "antwort": "Sie müssen sich zum Ausrichten noch verschieben lassen; die endgültige Spannung folgt erst nach dem Klopfen.",
    "fall": [
      "Der Kneep wird als Abstand zwischen zwei Trauflatten eingezeichnet.",
      "Er bezeichnet die angehobene Auflagekante über der Lattenebene.",
      "Kneep und Lattenabstand sind zwei Wörter für dasselbe Maß."
    ],
    "aufgaben": [
      49,
      50,
      51,
      74
    ]
  },
  {
    "n": 16,
    "titel": "Ortgang und Gaube in die Fläche zurückführen",
    "ziel": "Überstände, Richtungswechsel und Gaubenanschlüsse unterscheiden.",
    "text": "Am Ortgang beginnt die Deckung mit aufgekeilten Bunden. Der dabei genannte Winkel beschreibt die Lage der Halme und ist von der Dachneigung zu unterscheiden. Nach Ausbildung des Überstands wird die Deckung allmählich in die normale Flächenrichtung zurückgeführt. Die Quelle nennt dafür eigene Maße; der Traufüberstand wird an einer anderen Stelle gemessen und besitzt einen anderen Wert. Eine Gaube unterbricht diesen Verlauf. Ihre Anschlüsse werden gerundet und brauchen Abstand zu den übrigen Kanten. Auch die Gaubendachfläche muss zum vorgesehenen Reetdeckprinzip passen. Unterhalb des Fensters führen beispielsweise Holzleckbrett, Metall, Heidekissen oder eine Firstausbildung das Wasser auf die untere Deckung zurück.",
    "frage": "Warum sind Ortgangüberstand und Traufüberstand getrennte Maße?",
    "antwort": "Sie betreffen verschiedene Dachränder, unterschiedliche Messrichtungen und jeweils eigene Ausführungsdetails.",
    "fall": [
      "Ein Traufmaß soll unverändert auf den Ortgang übertragen werden.",
      "Die eigene Messstelle und Quellenangabe des Ortgangs verwenden.",
      "Alle Reetüberstände sind grundsätzlich gleich groß."
    ],
    "aufgaben": [
      38,
      39,
      53,
      54
    ]
  },
  {
    "n": 17,
    "titel": "Abtrocknung, Arbeitsschutz und Dachfläche verbinden",
    "ziel": "Lebensdauerfaktoren und den Flächenzuwachs steiler Dächer erklären.",
    "text": "Steiles Reet trocknet nach Regen leichter, weil Wasser schneller entlang der Halme abläuft. Dichte Beschattung und Ablagerungen aus Laub oder Nadeln halten dagegen Feuchtigkeit fest. Die Lebensdauer lässt sich deshalb nicht allein aus dem Alter ableiten. Die steile Arbeitsfläche verlangt zugleich geeignete Absturzsicherung; das Quellenbeispiel beginnt mit einem Dachfanggerüst und ergänzt Arbeitsgeräte für höhere Lagen. Diese ersetzen keine geplante Schutzmaßnahme. Steilheit vergrößert außerdem die Dachfläche. Beim Satteldach gilt: Sparrenlänge gleich halbe Breite geteilt durch Kosinus der Neigung, Gesamtfläche gleich zweimal Sparrenlänge mal Länge. Bei unveränderter Grundfläche benötigt das steilere Dach somit mehr Reet und eine dazu passende Lattung.",
    "frage": "Welche zwei Folgen hat eine größere Dachneigung?",
    "antwort": "Sie begünstigt den Wasserablauf und das Abtrocknen, vergrößert bei gleicher Grundfläche aber Dachfläche und Materialbedarf.",
    "fall": [
      "Das Haus bleibt gleich groß, die Dachneigung steigt von 45 auf 60 Grad.",
      "Die Dachfläche muss mit der neuen Neigung erneut berechnet werden.",
      "Der Reetbedarf bleibt gleich, weil die Grundfläche unverändert ist."
    ],
    "aufgaben": [
      31,
      32,
      69,
      68
    ]
  }
];
const LF13B_KAPITEL = kurs("lf13b", LF13B_REDAKTION, [["Naturmaterial und Lieferqualität", [1, 5, 6, 13]], ["Ernte, Werkzeug und Befestigung", [12, 2, 14, 8]], ["Unterkonstruktion und Deckungsbeginn", [3, 7, 15, 17]], ["Ränder, Anschlüsse und Erhaltung", [4, 9, 10, 11, 16]]]);

const LF14_REDAKTION: Redaktion[] = [
  {
    "n": 1,
    "titel": "Anschlusshöhen von der richtigen Ebene messen",
    "ziel": "Anschluss, Messbezug und obere Sicherung erklären.",
    "text": "Trifft die Dachabdichtung auf Wand, Attika oder Aufsetzkranz, muss sie am Bauteil hochgeführt werden. Die Fläche allein schützt diesen Übergang nicht gegen aufstauendes Wasser oder Schnee. Zur Höhe gehört deshalb immer die Frage: Von welcher Ebene wird gemessen? Die Quelle bezieht ihre Anschlussmaße auf die fertige Oberfläche beziehungsweise den vorgesehenen Belag und unterscheidet Dachneigungen bis und über fünf Grad. Ein später aufgebrachter Kies- oder Plattenbelag darf die wirksame Höhe nicht unbemerkt verkleinern. Der obere Rand wird passend zum Abdichtungssystem gegen Abrutschen und Hinterlaufen geschützt. Bei Bahnen kann eine Klemmschiene diese Aufgabe übernehmen. Maß, Befestigung und oberer Wetterschutz werden gemeinsam im Schnitt dargestellt.",
    "frage": "Was passiert mit der wirksamen Anschlusshöhe bei einem nachträglichen höheren Belag?",
    "antwort": "Sie wird kleiner, sofern die Hochführung nicht angepasst wird; deshalb ist die fertige Oberfläche als Messbezug wichtig.",
    "fall": [
      "Der Plattenbelag wird höher, die Anschlussbahn bleibt unverändert.",
      "Die verbleibende Anschlusshöhe neu prüfen.",
      "Die Anschlusshöhe bleibt unabhängig vom Belag immer gleich."
    ],
    "aufgaben": [
      1,
      2,
      3,
      4
    ]
  },
  {
    "n": 2,
    "titel": "Gully, Rohr und schwierige Ecke abdichten",
    "ziel": "Klemmflansch, Klebeflansch, Manschette und Flüssigabdichtung unterscheiden.",
    "text": "Der Dachablauf muss das Wasser aufnehmen und zugleich dicht mit der Dachbahn verbunden sein. Ein Klemmflansch presst die Abdichtung zwischen festen und lösbaren Bauteilen ein. Ein Klebeflansch wird dagegen flächig mit ihr verklebt oder verschweißt. Runde Rohre erhalten häufig passende Manschetten. Bei verwinkelten Details können vliesarmierte Flüssigkunststoffe sinnvoll sein, wenn Untergrund und System dafür geeignet sind. Das Vlies überbrückt Übergänge und wird ohne Luftblasen vollständig eingebettet. Überlappungen und Verarbeitung gehören zum gewählten Produkt; die Quelle beschreibt ein bestimmtes Nass-in-nass-Verfahren. Neben dem dichten Anschluss bleibt der Wasserweg wichtig. Haupt- und Notentwässerung müssen als abgestimmtes Konzept geplant werden, damit eine Störung nicht zu unkontrolliertem Aufstau führt.",
    "frage": "Was unterscheidet Klemm- und Klebeflansch?",
    "antwort": "Beim Klemmflansch wird die Bahn mechanisch gepresst, beim Klebeflansch flächig verklebt oder verschweißt.",
    "fall": [
      "Bei einem Rohr liegt eine Manschette lose auf der Dachbahn.",
      "Die vorgesehene dichte Verbindung zur Rohr- und Flächenabdichtung herstellen.",
      "Die Form der Manschette allein dichtet ohne Anschluss."
    ],
    "aufgaben": [
      6,
      7,
      14,
      15
    ]
  },
  {
    "n": 3,
    "titel": "Wasserbeanspruchung vor der Abdichtung klären",
    "ziel": "drückendes und nichtdrückendes Wasser anhand des Abflusses unterscheiden.",
    "text": "Nicht jedes feuchte Erdreich belastet eine Abdichtung gleich. Kann Wasser im durchlässigen Boden ablaufen oder versickern, liegt eine andere Beanspruchung vor als bei anstehendem Wasser. Grundwasser oder aufgestautes Sickerwasser kann hydrostatischen Druck erzeugen. Dieser nimmt mit der Wassersäule zu. Bodenart, Bemessungswasserstand und die tatsächlich gesicherte Entwässerung müssen deshalb vor der Materialwahl bekannt sein. Eine zufällig trockene Baugrube beweist noch keinen dauerhaft niedrigen Wasserstand. Die Quelle stellt drückendes und nichtdrückendes Wasser als Grundunterscheidung gegenüber. Für die Ausführung wird daraus eine konkrete Wassereinwirkung mit zugehörigen Anforderungen abgeleitet. Die Auswahl eines Abdichtungsstoffes erfolgt also nach der geklärten Beanspruchung und nicht allein nach seinem Namen.",
    "frage": "Warum genügt der trockene Zustand am Besichtigungstag nicht?",
    "antwort": "Spätere Grundwasserstände oder aufstauendes Sickerwasser können eine höhere Wasserbeanspruchung verursachen.",
    "fall": [
      "Der bindige Boden lässt Regenwasser schlecht ablaufen.",
      "Mögliches Aufstauen bei der Festlegung der Wassereinwirkung berücksichtigen.",
      "Jedes Sickerwasser ist automatisch dauerhaft drucklos."
    ],
    "aufgaben": [
      31,
      52,
      55,
      58
    ]
  },
  {
    "n": 4,
    "titel": "Schwarze und weiße Wanne vergleichen",
    "ziel": "äußere Abdichtungshaut und wasserundurchlässige Betonkonstruktion unterscheiden.",
    "text": "Bei der schwarzen Wanne umschließt eine zusätzliche Abdichtung das erdberührte Bauwerk. Der Name stammt von den traditionell eingesetzten bituminösen Stoffen. Bei der weißen Wanne übernimmt eine entsprechend geplante wasserundurchlässige Betonkonstruktion diese Funktion. Dazu gehören nicht nur Beton, sondern auch Rissbegrenzung, Bauteildicke, Fugen und Durchdringungen. Die Aussage WU-Beton allein erklärt also noch keine dichte Wanne. Beide Konzepte müssen durchgängig sein. Anschlüsse dürfen keinen Wasserweg offenlassen. Vor dem Verfüllen schützt eine geeignete Lage die zugängliche Außenabdichtung vor mechanischer Beschädigung. Schon ein kleines Loch kann nach dem Verfüllen schwer auffindbar sein. Konzeptwahl, Ausführungsprüfung und Schutz vor Beschädigung bilden deshalb eine zusammengehörige Aufgabe.",
    "frage": "Warum reicht die Angabe WU-Beton nicht für eine weiße Wanne?",
    "antwort": "Die Dichtfunktion entsteht erst aus der geplanten Betonkonstruktion einschließlich Fugen, Rissbegrenzung und Durchdringungen.",
    "fall": [
      "Die Kellerwand besteht aus WU-Beton, die Arbeitsfugen bleiben ungeplant.",
      "Die Fugen gehören zum Dichtkonzept und müssen geklärt werden.",
      "WU-Beton macht jede offene Fuge automatisch wasserdicht."
    ],
    "aufgaben": [
      54,
      55,
      56
    ]
  },
  {
    "n": 5,
    "titel": "Flachdachentwässerung mit Einheiten rechnen",
    "ziel": "Ablauflage, Bemessungsabfluss und unabhängigen Notwasserweg erklären.",
    "text": [
      "Dachabläufe gehören an die geplanten Gefälletiefpunkte. Ein erhöhter Flanschrand darf das Wasser nicht vor dem Einlauf stehen lassen. Laubfang und freie Zugänglichkeit unterstützen den Betrieb. Die normale Regenmenge wird im Quellenmodell mit Q = A : 10000 × r × C berechnet. Dabei steht A in Quadratmetern, r in Litern je Sekunde und Hektar und C für den passenden Abflussbeiwert. Die Division durch 10000 wandelt Quadratmeter in Hektar um. Erst danach wird mit der nachgewiesenen Leistung eines Ablaufs verglichen und die Anzahl aufgerundet. Die Quellenwerte für Stuttgart, Nenndurchmesser und Stauhöhen sind Beispielwerte, keine austauschbaren Leistungsangaben jedes Produkts.",
      "Die Notentwässerung erhält einen zusätzlich geplanten Wasserweg. Sie muss auch dann wirken können, wenn die normale Ableitung überfordert oder gestört ist. Im Quellenbeispiel wird ihr Notfluss aus der Differenz zweier Regenspenden und der zugehörigen Fläche berechnet. Eine bestimmte Öffnungsgröße ergibt sich erst zusammen mit der zulässigen Stauhöhe und der Leistung des Bauteils. Auch das Gefälle wird betrachtet: Eine diagonale Kehllinie legt bei gleichem Höhenunterschied einen längeren Grundrissweg zurück als die angrenzende Fläche und besitzt deshalb weniger Gefälle. Zusammengesetzte Dachflächen werden vor der Berechnung in einfache Flächen zerlegt. Abflussbeiwert, örtliche Regenspende und Ablaufleistung müssen zur tatsächlich geplanten Anlage passen."
    ],
    "frage": "Warum teilst du bei Q die Dachfläche durch 10000?",
    "antwort": "Die Regenspende ist je Hektar angegeben; 10000 Quadratmeter entsprechen einem Hektar.",
    "fall": [
      "Für einen Ablauf wird eine beliebige DN-100-Leistung aus einer alten Aufgabe übernommen.",
      "Die konkrete Ablaufleistung bei der geplanten Stauhöhe nachweisen.",
      "Jeder DN-100-Ablauf besitzt unabhängig vom Aufbau dieselbe Leistung."
    ],
    "aufgaben": [
      14,
      15,
      18,
      19
    ]
  },
  {
    "n": 6,
    "titel": "Gründachschichten nach ihrer Funktion ordnen",
    "ziel": "Wurzelschutz, Dränung, Filter und Vegetation erklären.",
    "text": "Ein Gründach benötigt mehr als Substrat auf einer Bahn. Schutz- und gegebenenfalls Trennlagen halten schädliche Einwirkungen von der Abdichtung fern. Ein nachgewiesener Wurzelschutz verhindert das Eindringen von Wurzeln; er kann bereits Teil der Abdichtung sein. Die Dränschicht leitet überschüssiges Wasser ab. Darüber hält ein Filter feine Substratteilchen zurück, damit die Dränung offen bleibt. Vegetation und Substrat bilden den oberen Lebensraum. Extensive Begrünung ist meist niedriger und pflegeärmer, intensive Begrünung benötigt stärkeren Aufbau und mehr Pflege. Rückhalt und Verdunstung entlasten die Entwässerung, sind aber vom System abhängig. Bewuchsfreie Kiesbereiche erleichtern die Kontrolle an Anschlüssen und Durchdringungen. Die konkreten Breiten und Schichtdicken der Quelle gehören zu ihrem Beispiel.",
    "frage": "Warum liegt der Filter oberhalb der Dränschicht?",
    "antwort": "Er hält Feinteile des Substrats zurück, damit die Wasserwege der Dränschicht nicht verschlammen.",
    "fall": [
      "Das Substrat soll ohne Filter in offene Dränelemente gefüllt werden.",
      "Die vorgesehene Filterschicht schützt die Dränung vor Feinteilen.",
      "Die Dränung funktioniert besser, wenn sie mit Feinteilen gefüllt ist."
    ],
    "aufgaben": [
      35,
      36,
      39
    ]
  },
  {
    "n": 7,
    "titel": "Fugenbewegung mit dem Abdichtungsdetail verbinden",
    "ziel": "Typ I und Typ II nach Bewegungsart und Häufigkeit unterscheiden.",
    "text": "Eine Bewegungsfuge soll Bauteile bewegen lassen, ohne dass die Abdichtung reißt. Die Quelle unterscheidet Typ I für langsame, seltene Bewegungen und Typ II für schnelle, häufige Bewegungen. Setzungen und längerfristige Temperaturänderungen dienen als Beispiele der ersten Gruppe, Verkehrseinwirkungen als Beispiel der zweiten. Die tatsächliche Bewegungsgröße muss zusätzlich bekannt sein. Kleine Bewegungen können im beschriebenen System mit geeigneten Schlepp- und Verstärkungsstreifen aufgenommen werden. Größere oder häufige Bewegungen verlangen eine entsprechend bewegliche Konstruktion, etwa ein Fugenband oder Profil. Seine Mitte liegt beweglich über der Fuge. Die seitlichen Flansche werden dicht in die Abdichtung eingebunden. Eine starre vollflächige Verklebung direkt über jeder Fuge erfüllt diese Aufgabe nicht.",
    "frage": "Welche Teile eines Fugenbands bleiben beweglich und welche werden eingebunden?",
    "antwort": "Die mittige Dehnzone nimmt Bewegung auf; die seitlichen Flansche werden dicht an die Abdichtung angeschlossen.",
    "fall": [
      "Eine häufig bewegte Fuge wird ohne Bewegungszone starr überklebt.",
      "Ein für Art und Größe der Bewegung geeignetes Fugendetail planen.",
      "Zusätzliche starre Klebung verhindert jede Bauteilbewegung dauerhaft."
    ],
    "aufgaben": [
      12,
      11,
      13
    ]
  },
  {
    "n": 8,
    "titel": "Lichtkuppel, Tür und Brandschutzdetail prüfen",
    "ziel": "Aufsetzkranz, reduzierte Schwelle und Abschottung unterscheiden.",
    "text": "Eine Lichtkuppel besteht aus Aufsetzkranz und Lichtschale. Der Kranz wird tragfähig befestigt und systemgerecht in die Abdichtung eingebunden. Seine Hochführung wird mit der fertigen Oberfläche verglichen. Bei Türen kann eine niedrige Schwelle zusätzliche Entwässerung und besonderen Wetterschutz verlangen. Eine Rinne allein macht einen beliebigen schwellenlosen Übergang noch nicht sicher; barrierefreie Anschlüsse sind gemeinsam zu planen. Daneben stellt eine Durchdringung eine brandschutztechnische Unterbrechung des Dachaufbaus dar. Die Quelle beschreibt nichtbrennbare Füllungen und eine Abschottung zum Innenraum und verweist für bestimmte großflächige Dächer auf DIN 18234. Anwendungsbereich und Ausführung sind am Vorhaben zu prüfen. Abdichtung und Brandschutz erfüllen dabei verschiedene, gleichzeitig notwendige Aufgaben.",
    "frage": "Warum genügt eine Entwässerungsrinne nicht als vollständige Planung einer niedrigen Türschwelle?",
    "antwort": "Auch Schlagregen, Rückstau, Anschlussabdichtung und die gesamte Entwässerung müssen zusammen berücksichtigt werden.",
    "fall": [
      "Eine niedrige Terrassentür erhält nur einen lose eingelegten Rost.",
      "Das vollständige Anschluss- und Entwässerungsdetail prüfen.",
      "Ein Rost ersetzt grundsätzlich alle weiteren Abdichtungsmaßnahmen."
    ],
    "aufgaben": [
      5,
      6,
      7,
      26
    ]
  },
  {
    "n": 9,
    "titel": "Nutzbeläge von der Abdichtung trennen",
    "ziel": "Schutzlage, Druckfestigkeit und Entwässerung einer Terrasse erklären.",
    "text": "Eine genutzte Dachfläche trägt Menschen, Möbel oder Fahrzeuge. Die Abdichtung darf dadurch weder durchstoßen noch unzulässig zusammengedrückt werden. Geeignete Schutz- und Lastverteilungsschichten richten sich nach dieser Nutzung. Ein Terrassenbelag stellt andere Anforderungen als ein Parkdeck. Die Quelle zeigt Betonplatten im Splitt- oder Mörtelbett sowie Platten auf Stelzlagern. Trennlagen verhindern dabei unerwünschte Verbindungen, Schutzlagen begrenzen mechanische Schäden. Besonders Stelzlager erzeugen örtliche Lasten und benötigen einen passenden Unterbau statt direkter Aufstellung auf einer ungeschützten Bahn. Entwässerung bleibt auch unter dem Belag notwendig. Gefälle, offene Wasserwege und zugängliche Abläufe verhindern, dass sich unsichtbar Wasser im Aufbau staut.",
    "frage": "Warum ist ein Stelzlager trotz großer Terrassenfläche kritisch?",
    "antwort": "Seine Last wirkt auf einer kleinen Aufstandsfläche und kann die darunterliegende Abdichtung oder Dämmung örtlich beanspruchen.",
    "fall": [
      "Ein Stelzlager steht unmittelbar auf einer ungeschützten Abdichtungsbahn.",
      "Passenden Schutz und ausreichende Lastabtragung vorsehen.",
      "Die große Plattenoberfläche verteilt automatisch auch jede Last unter dem Lager."
    ],
    "aufgaben": [
      68,
      41,
      44
    ]
  },
  {
    "n": 10,
    "titel": "Wasserart, Bauteil und Werkstoff zuordnen",
    "ziel": "die Normenfamilie und wichtige Abdichtungsabkürzungen einordnen.",
    "text": "Bei der Bauwerksabdichtung werden zunächst Bauteil und Wassereinwirkung geklärt. Unter dem Bemessungswasserstand ist anstehendes äußeres Wasser anders zu beurteilen als Bodenfeuchte oberhalb davon. Die Quelle ordnet Dach, Verkehrsfläche, erdberührtes Bauteil, Innenraum und Behälter den Normen DIN 18531 bis 18535 zu. Diese Zuordnung hilft beim Nachschlagen, ersetzt aber keine Prüfung des aktuellen Anwendungsbereichs. Auch der Werkstoff muss zur Beanspruchung passen: Bahnen können aus Bitumen, Kunststoff oder Elastomer bestehen. PMBC bedeutet kunststoffmodifizierte Bitumendickbeschichtung, MDS mineralische Dichtungsschlämme und FLK Flüssigkunststoff. Ein Voranstrich bereitet den Untergrund vor, bildet jedoch nicht automatisch die gesamte Abdichtung. Gewöhnlicher Gipsputz oder Kalkmörtel übernimmt diese Funktion ebenfalls nicht.",
    "frage": "Was bedeutet PMBC und welche Vorentscheidung brauchst du vor ihrer Auswahl?",
    "antwort": "PMBC ist kunststoffmodifizierte Bitumendickbeschichtung; zuvor werden Bauteil und Wassereinwirkung bestimmt.",
    "fall": [
      "Für einen Keller wird nur nach der bequemsten Verarbeitungsart ausgewählt.",
      "Zuerst Wassereinwirkung und geeigneten Systemaufbau klären.",
      "Jeder als Abdichtung bezeichnete Werkstoff ist für jede Wasserart geeignet."
    ],
    "aufgaben": [
      31,
      32,
      33
    ]
  },
  {
    "n": 11,
    "titel": "Kapillarwasser und Sockelanschluss unterbrechen",
    "ziel": "waagerechte Sperre, Bodenabdichtung und WU-Konstruktion verbinden.",
    "text": "Wasser kann in feinen Poren eines Baustoffs aufsteigen. Eine waagerechte Querschnittsabdichtung unterbricht diesen kapillaren Weg in der Wand. Die Bodenabdichtung wird daran angeschlossen, damit Feuchtigkeit nicht seitlich an der Sperre vorbeiwandert. Am Sockel kommt Spritz- und Sickerwasser hinzu. Hier benötigt die senkrechte Abdichtung einen hinterlaufsicheren oberen Abschluss und eine zum Gelände passende Hochführung. Die Quelle trennt dafür die Wassereinwirkungen W1-E und W4-E. Unter geeigneten Nutzungsbedingungen kann eine grobe kapillarbrechende Schicht eine weitere Funktion übernehmen; sie ist kein beliebiger Ersatz für jede Abdichtung. Bei einer weißen Wanne trägt eine geplante wasserundurchlässige Betonkonstruktion die Dichtfunktion. Auch hier bleiben Fugen und Übergänge entscheidend.",
    "frage": "Warum müssen Boden- und Wandabdichtung verbunden sein?",
    "antwort": "Ein offener Übergang würde eine Feuchtebrücke bilden und den kapillaren Wasserweg nicht durchgängig unterbrechen.",
    "fall": [
      "Die Bodenbahn endet mehrere Zentimeter vor der Wandsperre.",
      "Den durchgehenden dichten Anschluss nach dem vorgesehenen System herstellen.",
      "Der Estrich schließt die Feuchtebrücke automatisch."
    ],
    "aufgaben": [
      46,
      47,
      54
    ]
  },
  {
    "n": 12,
    "titel": "Bahnenzahl und Beschichtungsmenge berechnen",
    "ziel": "Flächenzuschlag, Gebindezahl und Verbrauch je Arbeitsgang unterscheiden.",
    "text": "Eine Rolle mit fünf Metern Länge und einem Meter Breite enthält fünf Quadratmeter Material. Für vierzig Quadratmeter Fläche und fünfzehn Prozent Zuschlag rechnet die Quelle zunächst 40 × 1,15 = 46 Quadratmeter. Geteilt durch fünf ergeben sich 9,2 Rollen, also zehn ganze Rollen. Der Zuschlag ersetzt dabei keine durchdachte Verlegeplanung. Bei Beschichtungen ist zu klären, ob der Verbrauch pro Arbeitsgang oder insgesamt angegeben wird. Zwei Arbeitsgänge mit jeweils 2,5 Kilogramm je Quadratmeter ergeben auf vierzig Quadratmetern insgesamt zweihundert Kilogramm. Im Projekt werden extensive Begrünung und Wartungsbelag getrennt aufgebaut. Dazu gehören Wärmeschutznachweis, Mengen sowie Details an Attika, Wand und Ablauf; der vorgegebene U-Wert ist eine Projektanforderung.",
    "frage": "Warum ist die Angabe kg/m² allein für zwei Arbeitsgänge unvollständig?",
    "antwort": "Es muss klar sein, ob der Wert je Arbeitsgang oder für den gesamten fertigen Auftrag gilt.",
    "fall": [
      "Der angegebene Verbrauch gilt ausdrücklich je Schicht, geplant sind zwei Schichten.",
      "Die Fläche mit Verbrauch und Anzahl der Schichten multiplizieren.",
      "Den Verbrauch nur einmal berücksichtigen, weil es dieselbe Fläche ist."
    ],
    "aufgaben": [
      61,
      60,
      64
    ]
  },
  {
    "n": 13,
    "titel": "Gefälle in drei Schreibweisen ausdrücken",
    "ziel": "zwischen Prozent, Verhältnis, Höhenunterschied und Länge umrechnen.",
    "text": "Gefälle vergleicht Höhenunterschied mit waagerechter Länge. Beide Werte müssen zuerst dieselbe Einheit besitzen. Der Prozentsatz lautet p = h × 100 : l. Ein Verhältnis 1 : n verwendet dagegen n = l : h. Deshalb entsprechen zwei Prozent dem Verhältnis 1 : 50. Für einen gesuchten Höhenunterschied stellst du um: h = p × l : 100. Bei drei Prozent auf fünfundzwanzig Metern ergeben sich 0,75 Meter. Wird die Länge gesucht, gilt l = h × 100 : p. Eine Skizze verhindert, dass du die geneigte Länge statt des waagerechten Grundmaßes einsetzt. Prozent und Grad sind verschiedene Angaben und dürfen nicht gleichgesetzt werden.",
    "frage": "Wie viel Höhenunterschied ergeben 2 % auf 10 m?",
    "antwort": "h = 2 × 10 : 100 = 0,20 m, also 20 cm.",
    "fall": [
      "Eine Zeichnung nennt Gefälle 1 : 50.",
      "Das entspricht 2 % Höhenunterschied bezogen auf die waagerechte Länge.",
      "Das entspricht 50 % Gefälle."
    ],
    "aufgaben": [
      22,
      21,
      25
    ]
  },
  {
    "n": 14,
    "titel": "Wandanschluss als vollständigen Schnitt zeichnen",
    "ziel": "Übergang, Hochführung, obere Sicherung und Wetterschutz darstellen.",
    "text": "Zeichne zuerst Tragdecke, Dachaufbau und aufgehende Wand. Danach folgt der zusammenhängende Weg der Abdichtung von der Fläche nach oben. Die Quelle zeigt bei Bitumenbahnen einen unterstützten Übergang mit Keil und eingebundene Anschlusslagen. Ihre Zahl und Befestigung gehören zum gewählten System. Die wirksame Anschlusshöhe wird von der fertigen Dachoberfläche aus bemaßt. Oben verhindern geeignete Befestigung und Schutz gegen Hinterlaufen, dass die Bahn absackt oder Wasser dahinter gelangt. Klemmschiene und Abdeckung sind dabei verschiedene Funktionen. Die Quelle nennt konkrete Abmessungen und Abstände ihres Beispiels. Niedrige Türanschlüsse verlangen zusätzliche abgestimmte Maßnahmen; die Behauptung, eine einzelne Rinne schaffe automatisch einen barrierefreien sicheren Anschluss, wäre zu weitgehend.",
    "frage": "Welche vier Funktionen müssen im Wandanschluss erkennbar sein?",
    "antwort": "Stetiger Übergang, ausreichende Hochführung, Sicherung der Anschlussbahn und Schutz des oberen Endes gegen Hinterlaufen.",
    "fall": [
      "Im Schnitt ist nur eine senkrechte Bahn ohne oberen Abschluss gezeichnet.",
      "Befestigung und Wetterschutz des oberen Endes ergänzen.",
      "Eine ausreichende Höhe ersetzt jeden oberen Abschluss."
    ],
    "aufgaben": [
      69,
      2,
      1
    ]
  },
  {
    "n": 15,
    "titel": "Dachrand und Flanschdetail getrennt prüfen",
    "ziel": "Randabdeckung, Durchdringung und Klemmflansch anhand ihrer Funktionen erklären.",
    "text": "Am Dachrand wird die Abdichtung hochgeführt und geschützt abgeschlossen. Die Metallabdeckung erhält im Quellenbeispiel ein Gefälle zur Dachseite, damit ihr Wasser nicht über die Fassade läuft. Der äußere Schenkel schützt den oberen Wandbereich. Eine Rohrdurchdringung benötigt dagegen einen dichten Anschluss über Manschette, Klebe- oder Klemmflansch und genügend Arbeitsraum zu Nachbarteilen. Sie wird möglichst außerhalb der tiefsten Wasserzone angeordnet. Ein Ablauf erfüllt die entgegengesetzte Lagefunktion und gehört an den Tiefpunkt. Klemmflansche besitzen festen und losen Teil. Die Quelle unterscheidet deren Breiten zusätzlich nach Stauhöhe. Diese Maße dürfen weder mit der Klebeflanschbreite noch mit der Hochführung über dem Belag verwechselt werden.",
    "frage": "Warum werden Ablauf und andere Rohrdurchdringungen unterschiedlich angeordnet?",
    "antwort": "Der Ablauf soll Wasser am Tiefpunkt aufnehmen; andere Durchdringungen sollen möglichst aus der stärksten Wasserbeanspruchung herausgehalten werden.",
    "fall": [
      "Ein Maß für einen Klebeflansch wird als Festflanschbreite eines Klemmanschlusses eingetragen.",
      "Die Maße nach Anschlussart und Teilfunktion getrennt zuordnen.",
      "Alle Flansche sind geometrisch und funktional gleich."
    ],
    "aufgaben": [
      9,
      10,
      6,
      15
    ]
  },
  {
    "n": 16,
    "titel": "Nutzungsklasse und Einwirkung auseinanderhalten",
    "ziel": "Verkehrsart von thermischer und mechanischer Beanspruchung unterscheiden.",
    "text": "Eine Nutzungsklasse beschreibt, wer eine Fläche befährt oder begeht. Die Quelle unterscheidet bei Verkehrsflächen Klassen von Fußgängern bis zu schweren Fahrzeugen. Daraus folgen Anforderungen an den geeigneten Aufbau. Die Abdichtung wird nicht unmittelbar befahren, sondern durch passende Schutz- und Nutzschichten entlastet. Eine Einwirkungsklasse beschreibt dagegen die Beanspruchung der Abdichtung, etwa durch Mechanik und Temperatur. Ein thermisch wirksamer Schutzbelag kann Temperaturschwankungen vermindern, ohne damit die Verkehrsbelastung zu beseitigen. N-Klassen und Kombinationen aus römischer Zahl und Buchstabe gehören deshalb zu verschiedenen Einteilungen. Die genannten Normzuordnungen und Beispielschichtdicken müssen am aktuellen Projekt geprüft werden. Eine reine Klassenbezeichnung ersetzt weder Lastverteilung noch ein vollständiges Abdichtungsdetail.",
    "frage": "Was ist der Unterschied zwischen Nutzung und Einwirkung?",
    "antwort": "Nutzung bezeichnet die Verkehrsart; Einwirkung beschreibt die daraus und aus der Umgebung entstehende Beanspruchung der Abdichtung.",
    "fall": [
      "Ein Schutzbelag vermindert Temperaturschwankungen.",
      "Die mechanische Verkehrsbelastung muss trotzdem gesondert berücksichtigt werden.",
      "Mit geringer thermischer Einwirkung verschwindet jede Fahrzeuglast."
    ],
    "aufgaben": [
      42,
      66,
      43
    ]
  },
  {
    "n": 17,
    "titel": "Leistungsverzeichnis aus dem Aufbau lesen",
    "ziel": "Schichtfunktion, Mengeneinheit und Preisposition verknüpfen.",
    "text": "Ein Leistungsverzeichnis zerlegt den Dachaufbau in beschriebene Einzelleistungen. Das Quellenbeispiel beginnt mit Voranstrich und Dampfsperre, führt über Dämmung und Abdichtung zum Wurzelschutz und anschließend zu Dränung, Substrat, Vegetation und Kiesbereichen. Diese Reihenfolge erklärt die Funktion der Schichten. Jede Position erhält eine passende Einheit: Quadratmeter für Flächen, Meter für lineare Anschlüsse und Stück für einzelne Bauteile. Menge mal Einheitspreis ergibt den Gesamtpreis. Lies zusätzlich die Verarbeitungsart. Selbstklebende Bahn, Schweißbahn und lose verlegte Bahn stellen unterschiedliche Anforderungen an Untergrund, Befestigung und Lastsicherung. Die konkreten Produktbezeichnungen des Mustertextes sind Quellenbeispiele und keine allgemeine Empfehlung für einen heutigen Gründachaufbau.",
    "frage": "Wie ermittelst du den Gesamtpreis einer Position?",
    "antwort": "Die zutreffend ermittelte Menge wird mit dem Einheitspreis derselben Mengeneinheit multipliziert.",
    "fall": [
      "Der Attikaanschluss wird in Metern ausgeschrieben.",
      "Die zugehörige Anschlusslänge aus dem Plan ermitteln.",
      "Die Dachfläche in Quadratmetern unverändert als Meterzahl einsetzen."
    ],
    "aufgaben": [
      40,
      67,
      35
    ]
  },
  {
    "n": 18,
    "titel": "Kellerwand, Boden und Sockel lückenlos verbinden",
    "ziel": "die Funktionen von Voranstrich, Abdichtung und Schutzlage erklären.",
    "text": "Die senkrechte Kellerabdichtung muss mit der waagerechten Wand- und Bodenabdichtung verbunden werden. Ein Voranstrich bereitet den geeigneten Untergrund vor. Danach folgen die zum Lastfall passenden Bahnen oder Beschichtungen. Die Quelle beschreibt für PMBC mehrere Arbeitsgänge und unterscheidet Trockenschichtdicken mit oder ohne Verstärkung. Nassauftrag und fertige Trockendicke sind deshalb nicht dieselbe Größe. Vor der Außenabdichtung schützen geeignete Platten oder Lagen vor Beschädigung; eine Dränung benötigt ein eigenes funktionierendes Konzept. Im Fußboden liegen Abdichtung, Dämmung und Estrich mit ihren jeweiligen Aufgaben übereinander. Am Sockel muss der Anschluss zum Gelände Spritzwasser abfangen und oben gegen Hinterlaufen geschützt sein. Die Quellenabmessungen beschreiben diesen Beispielaufbau.",
    "frage": "Warum ist die geforderte Trockenschichtdicke nicht einfach die aufgetragene Nassdicke?",
    "antwort": "Das Material verändert sich beim Trocknen; der Auftrag muss zum nachgewiesenen System und dessen Verbrauch passen.",
    "fall": [
      "Eine Dränplatte wird als einzige Kellerabdichtung vorgesehen.",
      "Schutz oder Dränung und eigentliche Abdichtung getrennt planen.",
      "Eine Dränplatte ersetzt bei jeder Wasserbeanspruchung die Abdichtung."
    ],
    "aufgaben": [
      48,
      49,
      50,
      63
    ]
  },
  {
    "n": 19,
    "titel": "Geschlossene Wannen gegen anstehendes Wasser planen",
    "ziel": "aufstauendes Sickerwasser und Wasserdruck dem Wannenprinzip zuordnen.",
    "text": "In wenig durchlässigem Boden kann sich Sickerwasser am Keller aufstauen. Unter dem Bemessungswasserstand kommt zusätzlich drückendes Wasser in Betracht. Entscheidend ist die geplante Wassereinwirkung, nicht allein die Bezeichnung Regenwasser. Eine schwarze Wanne umschließt Sohle und Wände als durchgehende Abdichtung. Anschlüsse, Fugen und Durchdringungen dürfen die Wannenwirkung nicht unterbrechen. Geeigneter Untergrund, entschärfte Kanten und Schutz vor Beschädigung gehören dazu. Die Quelle nennt je nach Einwirkung bestimmte PMBC-Dicken und Bahnenlagen; diese historischen Detailangaben sind nicht ohne Prüfung auf neue Projekte übertragbar. Bei einem Becken wirkt der Wasserdruck von innen nach außen. Auch dort braucht die Abdichtung einen geschlossenen Verlauf bis zum geschützten oberen Abschluss.",
    "frage": "Warum ist der Übergang von Sohle zu Wand entscheidend?",
    "antwort": "Nur eine durchgehende Verbindung bildet eine geschlossene Wanne; eine Lücke ermöglicht Wasserzutritt unabhängig von den dichten Flächen.",
    "fall": [
      "Die Wände sind dicht, die Sohlenabdichtung bleibt unverbunden.",
      "Den vorgesehenen dichten Sohlen-Wand-Anschluss herstellen.",
      "Getrennte dichte Flächen ergeben automatisch eine geschlossene Wanne."
    ],
    "aufgaben": [
      57,
      56,
      55
    ]
  }
];
const LF14_KAPITEL = kurs("lf14", LF14_REDAKTION, [["Anschlussdetails sicher verstehen", [1, 2, 8, 14, 15]], ["Entwässerung und genutzte Dachflächen", [5, 6, 9, 16]], ["Wasserbeanspruchung und Abdichtungskonzepte", [3, 4, 7, 10, 11]], ["Rechnen, ausschreiben und Kellerdetails verbinden", [12, 13, 17, 18, 19]]]);

const LF15_REDAKTION: Redaktion[] = [
  {
    "n": 1,
    "titel": "Drei Ränder, drei Wasserwege",
    "ziel": "Sockel, seitlichen Abschluss und oberen Abschluss nach ihrer Funktion unterscheiden.",
    "text": "Eine hinterlüftete Wandbekleidung braucht an ihren Rändern geplante Übergänge. Am Sockel tritt Luft in den Hinterlüftungsraum ein. Gleichzeitig muss Wasser nach außen ablaufen können. Ein geeignetes Lüftungsprofil schützt die Öffnung, ohne den benötigten freien Querschnitt zu verschließen. Oben verlässt die Luft den Zwischenraum; eine Abdeckung schützt dort zusätzlich vor Niederschlag. Seitliche Abschlüsse begrenzen die Bekleidungsfläche und müssen zur Bewegung des verwendeten Materials passen. Zeichne zu jedem Rand einen Luft- und einen Wasserpfeil. So erkennst du, warum ein völlig geschlossener Sockel nicht automatisch besonders gut schützt. Die konkrete Abmessung gehört zum geplanten Fassadensystem und zum jeweiligen Anschlussdetail.",
    "frage": "Warum darf der Sockel nicht einfach vollständig verschlossen werden?",
    "antwort": "Die erforderliche Zuluft und der geplante Wasserablauf würden unterbrochen; Schutzprofil und freie Öffnung müssen zusammenpassen.",
    "fall": [
      "Ein Sockelprofil wird durchgehend dicht ausgeschäumt.",
      "Den vorgesehenen Lüftungs- und Entwässerungsweg erhalten.",
      "Eine dichte Fuge verbessert die Hinterlüftung."
    ],
    "aufgaben": [
      2,
      9,
      10,
      11
    ]
  },
  {
    "n": 2,
    "titel": "Innen- und Außenecke im Schnitt unterscheiden",
    "ziel": "die Anforderungen an Wasserführung und Bewegung an Fassadenecken erklären.",
    "text": "Bei einer Außenecke springt die Gebäudekante nach außen vor. Die Bekleidung muss dort gegen mechanische Beanspruchung und die örtliche Windbeanspruchung gesichert sein. Eine Innenecke liegt zurück; dort können Wasser aus beiden Flächen und unterschiedliche Bewegungen zusammentreffen. Ein Eckprofil ist deshalb mehr als ein optischer Abschluss. Es muss zum Deckmaterial, zur Befestigung und zum geplanten Bewegungsraum passen. Prüfe die Hinterlüftungsführung für den konkreten Aufbau. Ihre Funktion darf nicht durch unbedacht eingebaute Hölzer oder Profile verloren gehen. Eine systembedingt vorgesehene Unterteilung ist jedoch etwas anderes als eine zufällige Verstopfung. Zeichne zuerst beide Wandflächen und danach den vollständigen Eckaufbau.",
    "frage": "Was prüfst du außer dem sichtbaren Eckprofil?",
    "antwort": "Befestigung, Wasserweg, Materialbewegung und die geplante Führung der Hinterlüftung müssen ebenfalls funktionieren.",
    "fall": [
      "Das Eckprofil sieht gut aus, blockiert aber ungeplant den Lüftungsraum.",
      "Den gesamten Eckaufbau einschließlich Luftweg prüfen.",
      "Eine saubere sichtbare Kante beweist eine funktionierende Ecke."
    ],
    "aufgaben": [
      4,
      7,
      8
    ]
  },
  {
    "n": 3,
    "titel": "Das Fenster an vier Seiten anschließen",
    "ziel": "Sturz, Laibungen und Fensterbank nach ihrem Wasserweg zuordnen.",
    "text": "Ein Fenster unterbricht Bekleidung, Dämmung und den Weg hinter der Bekleidung. Betrachte seine vier Seiten getrennt. Oben muss ankommendes Wasser vor der Öffnung nach außen geleitet werden. An den Laibungen werden seitliche Anschlüsse und der Wärmeschutz weitergeführt. Unten nimmt die Fensterbank Wasser auf. Ihr geplantes Gefälle und die Tropfkante führen es von der Fassade weg; seitliche Begrenzungen verhindern einen ungewollten Ablauf in die Laibung. Zusätzlich muss das vorgesehene Lüftungskonzept im Bereich der Öffnung erhalten bleiben. Ein einzelnes Dichtstoffband ersetzt diese unterschiedlichen Funktionen nicht. Fahre die Anschlüsse in einer Skizze von oben über die Seiten bis zur Fensterbank ab.",
    "frage": "Warum ist eine Fensterbank ohne seitliche Begrenzung problematisch?",
    "antwort": "Wasser könnte seitlich in die Laibung laufen, statt kontrolliert nach außen abgeleitet zu werden.",
    "fall": [
      "Wasser vom Sturz wird hinter die Bekleidung direkt über das Fenster geführt.",
      "Den vorgesehenen Wasserabfluss vor der Öffnung nach außen herstellen.",
      "Das Fenster entwässert die darüberliegende Bekleidung automatisch."
    ],
    "aufgaben": [
      12,
      13,
      14
    ]
  },
  {
    "n": 4,
    "titel": "Eine Detailskizze auf Funktion prüfen",
    "ziel": "Schichten, Bezugskanten und Wasserführung in einer Fassadenskizze erkennbar darstellen.",
    "text": "Eine Detailskizze vergrößert einen kritischen Anschluss. Ihr Zweck ist eine eindeutige Arbeitsinformation. Beginne mit dem tragenden Bauteil und zeichne die Schichten nach außen. Beschrifte Dämmung, Unterkonstruktion, Hinterlüftung und Bekleidung. Danach kommen Anschlussprofil, Befestigung und erforderliche Maße hinzu. Wasser- und Luftpfeile zeigen, ob der Übergang funktioniert. Ein Maßstab allein macht die Zeichnung noch nicht vollständig: Bezugskanten und Bauteilnamen müssen erkennbar sein. Prüfe abschließend den Weg eines gedachten Wassertropfens. Fließt er nach innen oder endet er in einer Tasche, muss das Detail überarbeitet werden. Schönheit hilft beim Lesen; entscheidend sind jedoch die richtige Funktion und eine nachvollziehbare Darstellung.",
    "frage": "Welche Prüfung ergänzt die reine Schichtenbeschriftung?",
    "antwort": "Die Wege für Wasser und Luft sowie Anschlussmaße und Bezugskanten müssen nachvollziehbar dargestellt sein.",
    "fall": [
      "Eine schön schraffierte Skizze enthält keine Wasserführung.",
      "Wasserweg, Luftweg und relevante Anschlussmaße ergänzen.",
      "Die Schraffur ersetzt alle Funktionsangaben."
    ],
    "aufgaben": [
      1,
      12,
      14
    ]
  },
  {
    "n": 5,
    "titel": "Schiefer an der Gebäudeecke weiterführen",
    "ziel": "Eckdeckung und die drei Anschlusslagen einer Wandöffnung zuordnen.",
    "text": "Eine kleinformatige Wandbekleidung braucht an der Ecke eine zum Decksystem passende Überdeckung. Ein bloßer senkrechter Stoß kann einen ungeschützten Wasserweg hinter die Fläche öffnen. Die Quelle zeigt für Schiefer und Faserzement verschiedene Eckausbildungen mit entsprechend zugeschnittenen Deckstücken. Wähle die Ausbildung deshalb zusammen mit Deckart und Windbeanspruchung. Bei Öffnungen und Einbauteilen hilft anschließend die Einteilung in oberseitigen, seitlichen und unterseitigen Anschluss. Diese Wörter beziehen sich auf die Lage am Bauteil und erklären den jeweiligen Wasserweg. Skizziere jeden Anschluss einzeln. Die seitliche Lösung kann einer Eckausbildung ähneln, während oben ankommendes Wasser vor dem Bauteil abgefangen werden muss.",
    "frage": "Warum reicht eine unveränderte Flächendeckung an der Ecke nicht aus?",
    "antwort": "Die Richtungsänderung braucht eine passende Überdeckung und Befestigung, damit kein ungeschützter Wasserweg entsteht.",
    "fall": [
      "Zwei Schieferflächen enden an der Außenecke in einem offenen durchgehenden Stoß.",
      "Eine zur Deckart passende Eckausbildung vorsehen.",
      "Ein offener Stoß ist automatisch eine regensichere Eckdeckung."
    ],
    "aufgaben": [
      4,
      5,
      6,
      8
    ]
  },
  {
    "n": 6,
    "titel": "Tafeln und Einbauteile brauchen Bewegungsraum",
    "ziel": "Bekleidungsanschluss, Luftführung und Wärmebrückenschutz an Öffnungen gemeinsam beurteilen.",
    "text": "Großformatige Fassadentafeln bewegen sich mit Temperatur und Feuchte. Ihre Befestigung und Fugen gehören deshalb zum jeweiligen System. An einem Fenster kommen weitere Aufgaben hinzu: Der Anschluss muss Niederschlag ableiten, die vorgesehene Hinterlüftung erhalten und den Wärmeschutz möglichst durchgehend führen. Eine bloß mit Dichtstoff gefüllte Fuge löst nicht automatisch alle drei Aufgaben. Bei einer Vordachverankerung wird die Last außerdem in den dafür vorgesehenen tragenden Untergrund eingeleitet. Die Bekleidung dient nicht allein als Traggrund. Prüfe in der Detailskizze deshalb getrennt den Lastweg, den Wärmeweg und den Wasserweg. Konkrete Dämmstärken und Fugenmaße sind anhand des vorgesehenen Aufbaus festzulegen.",
    "frage": "Welche drei Wege prüfst du bei einer Verankerung durch die Bekleidung?",
    "antwort": "Lastübertragung, Wärmeführung und Wasserableitung müssen zusammen mit der vorgesehenen Hinterlüftung funktionieren.",
    "fall": [
      "Ein Vordach wird ausschließlich an der dünnen Fassadentafel befestigt.",
      "Die Last in den dafür vorgesehenen tragenden Untergrund einleiten.",
      "Die Bekleidung ist unabhängig vom System immer der alleinige Traggrund."
    ],
    "aufgaben": [
      12,
      14,
      15,
      16
    ]
  },
  {
    "n": 7,
    "titel": "Die Satteldachgaube in Teilflächen zerlegen",
    "ziel": "Wangen, Dachflächen und Kehlen im geometrischen Modell getrennt berechnen.",
    "text": "Eine Satteldachgaube besitzt zwei Dachflächen und seitliche Wangen. Wo das Gaubendach in die Hauptdachfläche einschneidet, entstehen Kehlen. Erstelle zunächst einen beschrifteten Grundriss und ein Profil. Die Wange lässt sich im beschriebenen Modell als rechtwinkliges Dreieck betrachten. Höhe und waagerechte Länge gehören dabei zur Hauptdachneigung. Für den Gaubensparren brauchst du dagegen das Profil mit der Gaubendachneigung. Dachflächen können als Trapeze berechnet werden, wenn ihre parallelen Kanten und die wahre schräge Höhe bekannt sind. Die Kehllänge ist eine geneigte räumliche Strecke. Eine bloße Grundrisslänge darf deshalb nicht ungeprüft als wahre Länge in die Materialliste gelangen.",
    "frage": "Warum werden Hauptdach- und Gaubendachneigung getrennt notiert?",
    "antwort": "Sie gehören zu unterschiedlichen Dreiecken und bestimmen deshalb unterschiedliche Höhen und geneigte Längen.",
    "fall": [
      "Für alle geneigten Strecken der Gaube wird nur die Hauptdachneigung verwendet.",
      "Für jede Strecke das zugehörige Dachprofil bestimmen.",
      "Die Gaubendachneigung hat keinen Einfluss auf die Gaubensparrenlänge."
    ],
    "aufgaben": [
      35,
      37,
      38,
      65
    ]
  },
  {
    "n": 8,
    "titel": "Zwei Neigungen und zwei Materiallisten",
    "ziel": "bei einer Schleppgaube Dachfläche und senkrechte Bekleidungsflächen getrennt ermitteln.",
    "text": "Das Dach einer Schleppgaube und die seitlichen Wandflächen liegen in verschiedenen Ebenen. Verwende deshalb nicht dieselbe Neigung für jede Strecke. Die Sparrenlänge des Gaubendachs ergibt sich aus dem zugehörigen Gaubenprofil. Die Anschlusslinie an das Hauptdach liegt dagegen in dessen geneigter Fläche. Markiere beide Winkel in deiner Skizze, bevor du eine Winkelfunktion auswählst. Anschließend berechnest du Dachfläche, Wangen und Vorderseite getrennt. Unterschiedliche Deckmaterialien brauchen getrennte Stückzahlen. Schalung oder Unterkonstruktion werden ebenfalls mit ihrer passenden Einheit erfasst. Überstände werden nur dort ergänzt, wo sie im Plan tatsächlich vorkommen. So bleibt aus jeder Bestellposition erkennbar, welche Fläche und welcher Winkel zugrunde liegen.",
    "frage": "Warum braucht die Gaube getrennte Bestellpositionen für Dach und Wände?",
    "antwort": "Die Flächen liegen verschieden, können andere Deckmaterialien haben und benötigen deshalb eigene Mengenansätze.",
    "fall": [
      "Die Anschlusslänge im Hauptdach wird mit der Schleppdachneigung berechnet.",
      "Die Länge im Profil der Hauptdachfläche bestimmen.",
      "Jede Strecke einer Schleppgaube verwendet zwingend denselben Winkel."
    ],
    "aufgaben": [
      48,
      49,
      51
    ]
  },
  {
    "n": 9,
    "titel": "Giebelfläche und Randlängen getrennt aufmessen",
    "ziel": "Quadratmeter, laufende Meter und Stückzahlen aus einer Fassadenansicht ableiten.",
    "text": "Eine Giebelfassade besteht im einfachen Modell aus einem Rechteck und einem Dreieck. Addiere beide Flächen in Quadratmetern. Für Sonderstücke brauchst du zusätzlich die Längen der Ränder. Fensterlaibungen sind senkrechte beziehungsweise waagerechte Anschlussstrecken; Gebäudeecken, Sockel und Giebelschrägen haben eigene Positionen. Die Giebelschräge ergibt sich beim symmetrischen Giebel aus halber Breite und Giebelhöhe mit dem Satz des Pythagoras. Erst anschließend rechnest du laufende Meter in Stückzahlen um, etwa mit einem vorgegebenen Bedarf je Meter. Notiere einen Zuschlag getrennt. So lässt sich erkennen, ob die bestellte Menge aus der Deckfläche, aus einem Randdetail oder aus dem vereinbarten Zuschlag stammt.",
    "frage": "Wofür reicht die gesamte Giebelfläche allein nicht aus?",
    "antwort": "Randprofile, Laibungen, Eckstücke und andere lineare Details benötigen zusätzlich ihre eigenen Längen und Stückansätze.",
    "fall": [
      "Für den Giebel werden nur Quadratmeter notiert; Eckprofile fehlen.",
      "Die benötigten Randlängen getrennt aufnehmen.",
      "Eckprofile sind bereits vollständig durch die Flächenzahl bestimmt."
    ],
    "aufgaben": [
      44,
      45,
      43
    ]
  },
  {
    "n": 10,
    "titel": "Zuerst die gesuchten Größen sammeln",
    "ziel": "Buchaufgaben in Flächen-, Längen- und Stückpositionen gliedern.",
    "text": "Lies bei einer Aufmaßaufgabe zuerst, was überhaupt gesucht ist. Eine Fassadenfläche wird in Quadratmetern angegeben, ein Sockelprofil in Metern und ein einzelnes Sonderteil in Stück. Übertrage diese Größen in eine kleine Tabelle mit Bauteil, Skizzenmaß und Einheit. Fensteröffnungen können bei einer vertraglichen Abrechnung anders behandelt werden als beim tatsächlichen Materialzuschnitt. Trenne deshalb Abrechnungsfläche und Materialbedarf. Eine Übermessungsregel bedeutet nicht, dass die Fensterfläche tatsächlich bekleidet wird oder dass Verschnitt entfällt. Prüfe die im Aufgabenfall vorausgesetzte Regel, statt sie auf jede Bestellung zu übertragen. Erst wenn die Positionen vollständig sind, setzt du die zugehörigen Maße ein und kontrollierst ihre Einheiten.",
    "frage": "Warum unterscheidest du Abrechnungsfläche und Materialbedarf?",
    "antwort": "Eine vertragliche Übermessung ist eine Abrechnungsregel; Zuschnitt, Öffnungen und Verschnitt bestimmen den tatsächlichen Materialbedarf gesondert.",
    "fall": [
      "Eine übermessene Fensteröffnung wird als tatsächlich zu bekleidende Fläche bezeichnet.",
      "Abrechnung und tatsächlichen Zuschnitt auseinanderhalten.",
      "Übermessen beweist, dass über dem Fenster volle Tafeln eingebaut werden."
    ],
    "aufgaben": [
      52,
      54,
      55,
      58
    ]
  },
  {
    "n": 11,
    "titel": "Bei der Schleppgaube die Winkel wechseln",
    "ziel": "Gaubentiefe, Höhe und Wangenfläche aus dem jeweils richtigen Profil ableiten.",
    "text": "Bei einer Schleppgaube sind Hauptdachneigung und Gaubendachneigung zwei verschiedene Winkel. Ihre Differenz wird im beschriebenen Modell als Schleppwinkel verwendet. Zeichne alle Winkel an die richtigen Dreiecke. Aus der geneigten Sparrenlänge ohne Überstand und der Gaubendachneigung erhältst du die waagerechte Gaubentiefe. Für die Höhe in der Hauptdachfläche wechselst du zur Hauptdachneigung. Die Wangenhöhe folgt aus dem zur Skizze passenden Dreieck, nicht aus einer auswendig übertragenen Zahl. Berechne danach die dreieckigen Wangen und die Vorderfläche. Lasse Zwischenergebnisse möglichst ungerundet. Eine Abschlusskontrolle vergleicht jede Länge mit ihrer Lage im Grundriss oder im jeweiligen Dachprofil.",
    "frage": "Welcher Denkfehler führt häufig zu einer falschen Gaubenhöhe?",
    "antwort": "Die Gaubendachneigung wird für eine Höhe eingesetzt, deren Dreieck zur Hauptdachfläche gehört.",
    "fall": [
      "Gaubentiefe und Hauptdachhöhe werden ohne Skizze mit derselben Winkelfunktion berechnet.",
      "Die zugehörigen Dreiecke und Winkel zuerst kennzeichnen.",
      "Die Bezeichnung Gaube macht beide Dachwinkel austauschbar."
    ],
    "aufgaben": [
      33,
      32,
      66
    ]
  },
  {
    "n": 12,
    "titel": "Hilfsdreiecke für die Spitzgaube nutzen",
    "ziel": "Sinussatz und Pythagoras nur am jeweils passenden Dreieck anwenden.",
    "text": "Bei einer Spitzgaube verlaufen mehrere Kanten räumlich. Eine Ansicht zeigt ihre Lage, aber nicht jede wahre Länge. Zerlege die Konstruktion deshalb in Hilfsdreiecke. Ein rechtwinkliges Dreieck erlaubt Pythagoras und die üblichen Winkelfunktionen. In einem nicht rechtwinkligen Dreieck kann der Sinussatz passende Seiten und Gegenwinkel verbinden. Notiere zu jeder Hilfslänge, wo sie in der Zeichnung liegt und wofür du sie anschließend brauchst. Erst danach setzt du Teilstrecken zu einer gesuchten Anschlusslänge zusammen. Für eine Fläche muss die verwendete Höhe senkrecht auf ihrer Grundlinie stehen. Ein Winkel aus einer anderen Projektion darf nicht allein wegen derselben Zahl übernommen werden.",
    "frage": "Wann ist der Sinussatz hilfreich?",
    "antwort": "Wenn im betrachteten, nicht zwingend rechtwinkligen Dreieck eine passende Seite und ihr Gegenwinkel zusammen mit weiteren Winkeln bekannt sind.",
    "fall": [
      "Eine räumliche Anschlusslänge wird ohne Hilfsdreieck mit Pythagoras berechnet.",
      "Zuerst ein passendes rechtwinkliges Dreieck oder die erforderliche Sinussatzbeziehung konstruieren.",
      "Pythagoras gilt auch ohne rechten Winkel in jedem Dreieck."
    ],
    "aufgaben": [
      41,
      42,
      40
    ]
  },
  {
    "n": 13,
    "titel": "Vom Projektplan zum vollständigen Paket",
    "ziel": "Materialwahl, Details und Mengen bei einem Dach mit Anbau und Gaube verbinden.",
    "text": "Eine Projektaufgabe verbindet mehrere bisher getrennte Fertigkeiten. Betrachte beim Walmdach mit Anbau zuerst die Dachformen und Wasserwege. Der Anbau erzeugt einspringende Verschneidungen, an denen Kehlen Wasser sammeln. Die Schleppgaube ergänzt Wangen, Vorderseite und Fensteranschlüsse. Wähle die Wandbekleidung mit einer nachvollziehbaren Begründung und zeichne anschließend die benötigten Details. Danach werden Flächen und wahre Anschlusslängen aus den passenden Dachprofilen ermittelt. Eine Materialliste fasst Deckmaterial, Unterkonstruktion, Randstücke und Befestigungen mit ihren jeweiligen Einheiten zusammen. Bearbeite das Projekt in dieser Reihenfolge. Eine früh ausgerechnete Gesamtfläche ersetzt weder die Entscheidung für ein Material noch einen funktionierenden Fenster- oder Kehlanschluss.",
    "frage": "Welche drei Ergebnisse gehören neben der Mengenliste zum Projekt?",
    "antwort": "Eine begründete Materialwahl, funktionierende Detailzeichnungen und die nachvollziehbare Ermittlung der Teilflächen beziehungsweise Anschlusslängen.",
    "fall": [
      "Das Projekt wird mit einer Dachflächenzahl abgeschlossen; Gaubenfenster und Kehlen fehlen.",
      "Materialwahl und alle zugehörigen Anschlussdetails ergänzen.",
      "Die Dachfläche enthält automatisch sämtliche Anschlusslösungen."
    ],
    "aufgaben": [
      26,
      64,
      28
    ]
  },
  {
    "n": 14,
    "titel": "Brandsperre und Hinterlüftung gemeinsam planen",
    "ziel": "den Zweck von Brandsperren erklären und ihren Unterschied zu zufälligen Luftblockaden erkennen.",
    "text": "Der Hohlraum hinter einer Fassadenbekleidung kann die Ausbreitung eines Brandes begünstigen. Brandsperren begrenzen diese Ausbreitung an den dafür geplanten Stellen. Gleichzeitig besitzt die Fassade ein festgelegtes Lüftungskonzept. Beide Anforderungen müssen zusammen gelöst werden. Eine beliebig eingestopfte Dämmstofflage ist deshalb noch keine geeignete Brandsperre. Art, Lage, Material und Befestigung ergeben sich aus dem konkreten Brandschutzkonzept, dem Fassadensystem und den geltenden Anforderungen. Die in der Ausgangsquelle genannten Höhen und Querschnitte sind als deren Beispiele zu lesen. Für ein neues Gebäude dürfen sie nicht ohne Prüfung übernommen werden. Zeige in einer Skizze, welche Ebene begrenzt wird und welche Bauteile dazugehören.",
    "frage": "Warum ist eine zufällige Verstopfung des Lüftungsraums keine nachgewiesene Brandsperre?",
    "antwort": "Eine Brandsperre benötigt eine geplante, geeignete Konstruktion und muss mit dem gesamten Fassaden- und Brandschutzkonzept zusammenpassen.",
    "fall": [
      "Der Lüftungsraum wird beliebig mit Reststücken gefüllt und als Brandsperre bezeichnet.",
      "Eine geeignete Brandsperre nach dem konkreten Fassaden- und Brandschutzkonzept vorsehen.",
      "Jede beliebige Luftblockade ist automatisch eine geeignete Brandsperre."
    ],
    "aufgaben": [
      20,
      21,
      22
    ]
  },
  {
    "n": 15,
    "titel": "Sockel, oberen Rand und Innenecke prüfen",
    "ziel": "Abstand, Tropfkante und Bewegungsraum als Funktionen der Fassadenränder erklären.",
    "text": "Die untersten Deckstücke liegen im Bereich von Spritzwasser und möglichen Verschmutzungen. Ein geeigneter Abstand und ein geplanter Tropfabschluss schützen die Bekleidung dort. Deckstücke dürfen den Wasserablauf und die vorgesehene Lüftungsöffnung nicht unbeabsichtigt verschließen. Am oberen Rand hält eine passende Abdeckung Niederschlag fern, während die geplante Luftabführung erhalten bleibt. In der Innenecke treffen zwei Flächen zusammen. Ihr Anschluss braucht einen abgestimmten Wasserweg und Raum für die Bewegung der Werkstoffe. Übertrage konkrete Überstände nicht pauschal zwischen Platten und Holzschindeln. Vergleiche zunächst Material, Detail und Systemvorgaben. Erst daraus entstehen die Maße für den tatsächlich vorgesehenen Randabschluss.",
    "frage": "Warum werden Überstände nicht pauschal zwischen allen Bekleidungen übernommen?",
    "antwort": "Werkstoff, Deckart, Bewegung und Anschlussausbildung unterscheiden sich; die Maße müssen zum konkreten Detail passen.",
    "fall": [
      "Die unterste Plattenreihe steht auf dem Tropfprofil und versperrt die Öffnung.",
      "Den geplanten Ablauf und Lüftungsquerschnitt freihalten.",
      "Ein aufliegendes Deckstück verbessert immer den Wasserablauf."
    ],
    "aufgaben": [
      2,
      8,
      9,
      10
    ]
  },
  {
    "n": 16,
    "titel": "Fenster zählen, Längen zuordnen",
    "ziel": "Sturz-, Brüstungs- und Laibungslängen einer Fassade nachvollziehbar ermitteln.",
    "text": "Ein rechteckiges Fenster besitzt einen oberen Sturz, eine untere Brüstung und zwei seitliche Laibungen. Die waagerechten Positionen verwenden die Fensterbreite, die senkrechten die Fensterhöhe. Bei acht gleich großen Fenstern entstehen deshalb acht Sturzlängen und sechzehn seitliche Laibungslängen. Schreibe diese Stückzahl sichtbar vor das jeweilige Maß. Fassadenfläche, Gebäudeecken sowie Sockel und Attika werden daneben als eigene Positionen geführt. Für eine Bestellung ergänzt du passende Deckmaße, Zuschnitt und begründete Zuschläge. Vertragliche Übermessungsregeln für Öffnungen werden getrennt betrachtet. Eine kleine Rechentabelle mit Bauteil, Anzahl, Einzelmaß und Einheit verhindert, dass Fensterseiten fehlen oder eine Flächenzahl versehentlich als laufende Meter eingesetzt wird.",
    "frage": "Wie viele seitliche Laibungen haben acht rechteckige Fenster?",
    "antwort": "Sechzehn: Jedes Fenster besitzt zwei seitliche Laibungen; ihre Länge wird aus der jeweiligen Fensterhöhe ermittelt.",
    "fall": [
      "Bei acht Fenstern wird die seitliche Laibung nur achtmal gerechnet.",
      "Zwei seitliche Laibungen je Fenster ansetzen.",
      "Jedes rechteckige Fenster hat nur eine seitliche Laibung."
    ],
    "aufgaben": [
      18,
      17,
      46
    ]
  }
];
const LF15_KAPITEL = kurs("lf15", LF15_REDAKTION, [["Fassadenanschlüsse und Darstellung", [1, 2, 3, 4]], ["Decksysteme und vollständiges Aufmaß", [5, 6, 9, 10]], ["Gauben geometrisch bearbeiten", [7, 8, 11, 12]], ["Projekt und Randdetails vertiefen", [13, 14, 15, 16]]]);

const LF16_REDAKTION: Redaktion[] = [
  {
    "n": 1,
    "titel": "Sonnenlicht wird Strom oder Wärme",
    "ziel": "Photovoltaik und Solarthermie anhand ihres Energieergebnisses unterscheiden.",
    "text": "Solaranlagen nutzen die Einstrahlung der Sonne auf zwei unterschiedliche Arten. Photovoltaikmodule erzeugen elektrischen Strom. Ein Wechselrichter wandelt den erzeugten Gleichstrom für die vorgesehene Wechselstromnutzung um. Solarthermische Kollektoren erwärmen dagegen ein Wärmeträgermedium und übertragen Energie an einen Speicher. Ordne die Anlage deshalb zuerst nach ihrem Ergebnis: Strom oder Wärme. Die Montage kann über der Deckung oder als dachintegriertes System erfolgen. Bei der Integration übernimmt das System zusätzlich Aufgaben der Dachdeckung. Leistungsangabe und Energieertrag sind außerdem verschiedene Größen. Kilowatt beschreibt eine Leistung, Kilowattstunden eine Energiemenge. Die Angabe kWp gehört zu festgelegten Prüfbedingungen eines Photovoltaikgenerators und ist kein jährlicher Ertrag.",
    "frage": "Woran unterscheidest du Photovoltaik und Solarthermie am einfachsten?",
    "antwort": "Photovoltaik liefert elektrischen Strom, Solarthermie liefert Wärme über einen Kollektor und ein Wärmeträgermedium.",
    "fall": [
      "Ein Kollektor mit Wärmeträgerleitung wird als Stromgenerator erklärt.",
      "Die Anlage der Solarthermie zuordnen.",
      "Jede sichtbare Solaranlage erzeugt ausschließlich Strom."
    ],
    "aufgaben": [
      34,
      37,
      39,
      41
    ]
  },
  {
    "n": 2,
    "titel": "Mechanische Montage und Elektroarbeiten trennen",
    "ziel": "die elektrische Gefahr beleuchteter PV-Module erkennen und die Zusammenarbeit der Gewerke begründen.",
    "text": "Ein Photovoltaikmodul kann unter Lichteinfall elektrische Spannung erzeugen. Das Abschalten einer Wechselstromseite macht deshalb nicht automatisch alle Teile des Generators spannungsfrei. Beschädigte Leitungen oder offene elektrische Verbindungen dürfen nicht wie gewöhnliche mechanische Bauteile behandelt werden. Bei der Arbeitsteilung werden Dachbefestigung, Regensicherheit und elektrische Arbeiten ausdrücklich abgestimmt. Der Generator liefert Gleichstrom, den der Wechselrichter für die Wechselstromnutzung umwandelt. Die erforderliche Qualifikation richtet sich nach der jeweiligen Tätigkeit; elektrische Anschlüsse und Prüfungen gehören in die Hände entsprechend befugter Fachkräfte. Halte Abstand zu unklaren oder beschädigten elektrischen Teilen und sichere den Arbeitsbereich nach dem vereinbarten Verfahren. Eine kurze Funktionsübersicht ersetzt keine elektrische Arbeitsanweisung und keine Freigabe zum Eingriff in die Anlage.",
    "frage": "Warum bedeutet ein ausgeschalteter Wechselrichter nicht automatisch einen spannungsfreien PV-Generator?",
    "antwort": "Die beleuchteten Module können auf der Gleichstromseite weiterhin Spannung erzeugen.",
    "fall": [
      "Ein beschädigtes PV-Kabel soll nach Ausschalten des Wechselrichters ohne Prüfung angefasst werden.",
      "Arbeit unterbrechen und die zuständige Elektrofachkraft einbeziehen.",
      "Die gesamte PV-Anlage ist durch diesen Schalter sicher spannungsfrei."
    ],
    "aufgaben": [
      48,
      43
    ]
  },
  {
    "n": 3,
    "titel": "Den äußeren Blitzschutz als Kette lesen",
    "ziel": "Fangeinrichtung, Ableitung und Erdungsanlage nach ihrer Aufgabe zuordnen.",
    "text": "Der äußere Blitzschutz besteht aus zusammenwirkenden Teilen. Die Fangeinrichtung bietet vorgesehene Einschlagstellen. Die Ableitungen führen den Blitzstrom weiter, die Erdungsanlage verteilt ihn im Erdreich. Eine Unterbrechung dieser Kette gefährdet ihre geplante Wirkung. Zusätzliche Metallaufbauten und Solaranlagen müssen in das Schutzkonzept einbezogen werden. Dazu werden Schutzbereich und erforderliche Abstände fachgerecht bestimmt. Ein Bauteil wird nicht allein dadurch geschützt, dass irgendwo auf dem Dach eine Fangstange steht. Zeichne für die Erklärung den Weg von der Fangeinrichtung bis zum Erder. Die konkrete Auslegung hängt unter anderem von Schutzklasse, Gebäude und Anlage ab und wird nicht aus einer einzelnen Skizze geraten.",
    "frage": "Welche drei Teile bilden die äußere Blitzschutzanlage?",
    "antwort": "Fangeinrichtung, Ableitungen und Erdungsanlage bilden den vorgesehenen Weg des Blitzstroms.",
    "fall": [
      "Eine Fangstange wird ohne leitende Verbindung zur vorgesehenen Ableitung montiert.",
      "Den vollständigen geplanten Ableitungsweg berücksichtigen.",
      "Eine freistehende Fangstange ersetzt automatisch Ableitung und Erdung."
    ],
    "aufgaben": [
      7,
      11,
      22
    ]
  },
  {
    "n": 4,
    "titel": "Zusatzlasten und Befestigungen gemeinsam prüfen",
    "ziel": "Wind-, Schnee- und Eigenlasten neuer Dachaufbauten als Planungsgrößen erkennen.",
    "text": "Ein zusätzliches Bauteil verändert die Beanspruchung des Dachs. Eine aufgeständerte Solaranlage hat Eigengewicht und eine Windangriffsfläche. Ballast wirkt als zusätzliche Last auf die Konstruktion; eine mechanische Befestigung benötigt einen geeigneten Lastweg. Auch Schnee kann sich an Aufbauten ungleichmäßig ansammeln. Deshalb werden Dachform, Standort, Befestigung und Tragfähigkeit zusammen betrachtet. Ein Dachhaken darf die Deckung nicht unzulässig belasten oder ihre Wasserführung stören. Verkehrswege und Schneeschutzsysteme brauchen ebenfalls eine passende Bemessung und Befestigung. Die sichtbare Größe eines Bauteils genügt dafür nicht. Halte in einer Skizze fest, wo Kräfte angreifen und über welche Bauteile sie in die tragende Konstruktion gelangen.",
    "frage": "Warum muss Ballast zusätzlich zur Windsicherung betrachtet werden?",
    "antwort": "Er erhöht die Last auf dem Dach; Tragfähigkeit und Lastverteilung müssen zur geplanten Sicherung passen.",
    "fall": [
      "Zusätzliche Ballaststeine werden ohne Prüfung der Tragfähigkeit aufgelegt.",
      "Windsicherung und Tragfähigkeit des Aufbaus gemeinsam prüfen.",
      "Ballast ist schwer und deshalb unabhängig vom Dach immer zulässig."
    ],
    "aufgaben": [
      56,
      59,
      60
    ]
  },
  {
    "n": 5,
    "titel": "Schutzfunktion statt Einschlagverhinderung",
    "ziel": "die Aufgabe des äußeren Blitzschutzes erklären und besondere Dacharten berücksichtigen.",
    "text": "Eine Blitzschutzanlage verhindert nicht grundsätzlich die Entstehung oder jeden Einschlag eines Blitzes. Sie soll bei richtiger Planung und Ausführung die Folgen begrenzen. Der äußere Teil fängt Blitzstrom an vorgesehenen Stellen auf und leitet ihn zur Erdungsanlage. Der innere Blitzschutz behandelt andere Schutzaufgaben im Gebäude und ist nicht mit den Dachleitungen gleichzusetzen. Bei brennbaren beziehungsweise weichen Bedachungen ergeben sich besondere Anforderungen an Anordnung, Abstand und Befestigung. Die Quelle zeigt dafür bestimmte Ausführungsbeispiele. Übernimm deren Abstände nicht ohne das konkrete Schutzkonzept. Für eine verständliche Erklärung genügen zunächst die drei Funktionen Auffangen, Ableiten und Erden sowie die Unterscheidung zwischen äußerem und innerem Schutz.",
    "frage": "Verhindert eine Blitzschutzanlage die Entstehung eines Blitzes?",
    "antwort": "Nein. Sie soll durch ein abgestimmtes Schutzkonzept die Folgen eines Einschlags begrenzen.",
    "fall": [
      "Ein Kunde erwartet wegen der Dachleitungen, dass niemals ein Blitz einschlagen kann.",
      "Die Schutzwirkung als Begrenzung der Einschlagfolgen erklären.",
      "Blitzschutz verhindert jede atmosphärische Entladung über dem Gebäude."
    ],
    "aufgaben": [
      3,
      7,
      14
    ]
  },
  {
    "n": 6,
    "titel": "Der Weg bis ins Erdreich muss passen",
    "ziel": "Ableitung, Erdungsanschluss und Materialverträglichkeit als zusammenhängende Aufgaben erläutern.",
    "text": "Zwischen Fangeinrichtung und Erdungsanlage liegt die Ableitung. Ihr Verlauf, ihre Anzahl und ihre Verbindungspunkte gehören zur Planung. Ein möglichst übersichtlicher Weg erleichtert Montage und Kontrolle, ersetzt aber keine Auslegung. Am unteren Ende muss der vorgesehene Erdungsanschluss eindeutig zugeordnet werden. Unterschiedliche Metalle können bei Feuchtigkeit unerwünscht miteinander reagieren. Materialwahl und geeignete Verbindungsteile sind deshalb nicht nur eine Frage des Aussehens. Zeichne den vollständigen Weg einschließlich der vorgesehenen Trenn- oder Prüfstelle. Pauschale Zahlen aus einem Quellenbeispiel gelten nicht automatisch für jedes Gebäude. Die geplante Schutzklasse und die tatsächlichen Gebäudeabmessungen bestimmen, welche Lösung fachgerecht nachgewiesen werden muss.",
    "frage": "Warum gehört die Materialwahl zur Planung der Verbindungen?",
    "antwort": "Ungeeignete Metallkombinationen können durch Kontaktkorrosion die Verbindung und damit die Funktion beeinträchtigen.",
    "fall": [
      "Leitungen werden mit beliebigen verschiedenen Metallen direkt verbunden.",
      "Geeignete und verträgliche Werkstoffe sowie Verbindungsteile wählen.",
      "Alle metallischen Werkstoffe können ohne Prüfung gleichwertig kombiniert werden."
    ],
    "aufgaben": [
      18,
      19,
      22,
      23
    ]
  },
  {
    "n": 7,
    "titel": "Linienarten im Blitzschutzplan lesen",
    "ziel": "sichtbare und verdeckte Leitungen sowie ihre Symbole im Plan unterscheiden.",
    "text": "Ein Blitzschutzplan zeigt nicht nur eine Materialmenge. Er beschreibt, wo Leitungen, Anschlüsse und Prüfpunkte angeordnet sind. In der verwendeten Zeichnungskonvention kennzeichnet eine durchgezogene Linie eine sichtbar verlegte Leitung. Eine gestrichelte Linie steht für einen verdeckten Verlauf, etwa unter Dach, unter Putz oder im Erdreich. Lies immer auch die Legende, damit Symbole eindeutig zugeordnet werden. Der Grundriss zeigt den horizontalen Verlauf; Gebäudehöhe und senkrechte Ableitungen brauchen ergänzende Angaben. Für die Mengenliste werden deshalb nicht alle Leitungen nur aus dem Grundriss abgemessen. Notiere Maßstab, Leitungsart und erforderliche senkrechte Strecken, bevor du die Gesamtlängen und Befestigungsmittel zusammenstellst.",
    "frage": "Warum reicht der Grundriss allein nicht für jede Leitungslänge?",
    "antwort": "Senkrechte Ableitungen und Höhenunterschiede sind darin nicht als wahre Längen sichtbar und benötigen zusätzliche Angaben.",
    "fall": [
      "Eine gestrichelte Leitung wird ohne Blick in die Legende als sichtbare Dachleitung verlegt.",
      "Linienart und Legende vor der Ausführung zuordnen.",
      "Die Linienart hat in einem Montageplan keine Bedeutung."
    ],
    "aufgaben": [
      26,
      27,
      28,
      62
    ]
  },
  {
    "n": 8,
    "titel": "Ausrichtung, Neigung und Schatten beurteilen",
    "ziel": "den Einfluss der Lage auf den Solarertrag ohne pauschales Leistungsversprechen erklären.",
    "text": "Der Ertrag einer Solaranlage hängt nicht allein von der Anzahl der Elemente ab. Auch Ausrichtung, Neigung und Verschattung beeinflussen die nutzbare Einstrahlung. Ein Schornstein oder ein höheres Nachbargebäude kann deshalb bei der Planung wichtig sein. Unterscheide außerdem die spätere Nutzung: Solarthermie liefert Wärme, Photovoltaik elektrischen Strom. Die günstigste Anordnung ergibt sich aus Standort, System und Nutzungsziel. Ein allgemeiner Merksatz zu einer Himmelsrichtung ersetzt keine Ertragsbetrachtung. Zeichne für einen Übungsfall zunächst die Dachflächen und mögliche Schattenquellen. Vergleiche anschließend die vorgesehenen Montageflächen. Ein mechanisch sauber befestigtes System kann bei ungünstiger Lage trotzdem weniger Energie liefern als im geplanten Ertragsmodell.",
    "frage": "Warum genügt für die Ertragsbeurteilung die Modulzahl allein nicht?",
    "antwort": "Ausrichtung, Neigung, Schatten, Standort und System beeinflussen die nutzbare Einstrahlung und damit den Ertrag.",
    "fall": [
      "Zwei gleiche Modulfelder werden trotz dauerhafter Verschattung als gleich ertragreich angenommen.",
      "Die Verschattung in die Ertragsbeurteilung aufnehmen.",
      "Gleiche Modulzahl garantiert unabhängig vom Standort denselben Jahresertrag."
    ],
    "aufgaben": [
      34,
      35,
      36,
      37
    ]
  },
  {
    "n": 9,
    "titel": "Einbauteile nach Funktion und Lastweg ordnen",
    "ziel": "Dachfenster, Sicherheitsbauteile, Verkehrswege und Durchführungen unterscheiden.",
    "text": "Einbauteile erfüllen auf dem Dach unterschiedliche Aufgaben. Dachfenster bringen Licht in den Raum. Sicherheitsdachhaken und Schneeschutzsysteme haben definierte Schutzfunktionen. Tritte und Laufstege ermöglichen geplante Verkehrswege. Rohrdurchführungen verbinden dagegen Leitungen mit dem Raum unter dem Dach. Gemeinsam ist ihnen, dass sie die Dachfläche verändern und einen geeigneten Anschluss brauchen. Eine tragfähige Befestigung wird in den vorgesehenen Untergrund geführt. Gleichzeitig bleiben Deckung und darunterliegende Schutzebenen funktionsfähig. Verwechsle einen gewöhnlichen Montagehaken nicht mit einem dafür vorgesehenen Anschlagpunkt zur Personensicherung. Materialschutz, Lastaufnahme und Wasserführung müssen zum jeweiligen Produkt und seinem Einsatzzweck passen; die äußere Ähnlichkeit reicht nicht aus.",
    "frage": "Warum ist nicht jeder Haken automatisch ein Anschlagpunkt für eine Personensicherung?",
    "antwort": "Sicherungsfunktion, Tragfähigkeit und Zulassung beziehungsweise vorgesehene Verwendung müssen für diesen Zweck nachgewiesen sein.",
    "fall": [
      "Ein beliebiger Montagehaken wird als persönlicher Anschlagpunkt verwendet.",
      "Nur einen für diesen Sicherungszweck geeigneten und geprüften Anschlagpunkt einsetzen.",
      "Die Form als Haken beweist die Eignung zur Personensicherung."
    ],
    "aufgaben": [
      52,
      54,
      55,
      60
    ]
  },
  {
    "n": 10,
    "titel": "Schutzklasse ist eine Planungsgröße",
    "ziel": "Blitzentstehung und die Bedeutung der Blitzschutzklasse verständlich erklären.",
    "text": "Bei einem Gewitter werden elektrische Ladungen getrennt. Steigt die elektrische Beanspruchung der Luft ausreichend an, kann eine schlagartige Entladung entstehen: der Blitz. Für ein Gebäude ist daher ein abgestimmtes Schutzkonzept wichtig. Die Blitzschutzklasse beschreibt Anforderungen an die geplante Schutzwirkung und beeinflusst die Ausführung der Anlage. Dazu gehören beispielsweise die Verfahren zur Anordnung der Fangeinrichtungen. Eine Schutzklasse wird nicht allein aus der Dachfarbe oder aus einer beliebigen Gebäudebezeichnung abgeleitet. Lies die vorgegebene Planung und die zugrunde liegende Beurteilung. Zahlen zu Maschenweiten oder Abständen haben erst zusammen mit ihrer Schutzklasse und dem betrachteten Bauteil eine eindeutige Bedeutung.",
    "frage": "Warum notierst du bei einer Maschenweite immer die zugehörige Schutzklasse?",
    "antwort": "Die Schutzklasse beeinflusst die Anforderungen; eine isolierte Maßzahl beschreibt kein vollständiges Schutzkonzept.",
    "fall": [
      "Eine Maschenweite wird ohne Schutzklasse aus einem anderen Projekt übernommen.",
      "Die Maßvorgabe der vorgesehenen Schutzklasse und Planung zuordnen.",
      "Die Schutzklasse beeinflusst die Ausführung einer Fangeinrichtung nicht."
    ],
    "aufgaben": [
      1,
      4,
      5,
      6
    ]
  },
  {
    "n": 11,
    "titel": "Schutzbereich und Trennungsabstand unterscheiden",
    "ziel": "die Funktionen von Fangstange und Trennungsabstand an einem Dachaufbau erklären.",
    "text": "Eine Fangstange soll den vorgesehenen Einschlagpunkt bilden und einen bestimmten Schutzbereich herstellen. Ein benachbartes leitfähiges Bauteil muss passend in dieses Konzept eingeordnet werden. Der Trennungsabstand begrenzt das Risiko eines gefährlichen Überschlags zwischen Blitzschutzanlage und anderen leitfähigen Teilen. Er ist nicht einfach der Abstand, der auf dem Dach noch übrig bleibt. Seine Ermittlung gehört zur fachgerechten Planung. Auch elektrische Leitungen an einem Dachaufbau können die Beurteilung verändern. Zeichne daher Fangstange, geschütztes Bauteil und den relevanten Abstand getrennt. Ein direkter Anschluss und eine getrennte Anordnung sind unterschiedliche Lösungen; welche vorgesehen ist, muss aus dem konkreten Schutzkonzept hervorgehen.",
    "frage": "Was ist die Aufgabe des Trennungsabstands?",
    "antwort": "Er soll einen gefährlichen Überschlag zwischen Blitzschutzanlage und benachbarten leitfähigen Teilen vermeiden helfen.",
    "fall": [
      "Eine Fangstange berührt ungeplant ein leitfähiges Bauteil mit elektrischer Einrichtung.",
      "Die Anordnung und den erforderlichen Trennungsabstand fachgerecht prüfen lassen.",
      "Eine zufällige Berührung verbessert jedes getrennte Schutzkonzept."
    ],
    "aufgaben": [
      11,
      13,
      16,
      17
    ]
  },
  {
    "n": 12,
    "titel": "Aus Leitungen wird ein zusammenhängendes Netz",
    "ziel": "Kreuzungsverbindungen und wiederkehrende Prüfung einer Fangeinrichtung begründen.",
    "text": "Eine Fangeinrichtung auf dem Flachdach kann als geplantes Maschennetz ausgeführt sein. Die einzelnen Leitungen müssen an den vorgesehenen Stellen leitend verbunden werden. Ein bloßes Überkreuzen ohne geeigneten Verbinder ergibt noch keine sichere elektrische Verbindung. Größe und Lage des Netzes richten sich nach der Planung und Schutzklasse. Nach der Montage werden Ausführung, Verbindungen und weitere geforderte Eigenschaften geprüft. Spätere Änderungen am Dach können die Schutzwirkung beeinflussen. Deshalb gehört auch die wiederkehrende Kontrolle zum Betrieb der Anlage. Halte im Plan fest, welche Kreuzung verbunden ist und wo Prüfstellen liegen. Ein ordentlich aussehendes Netz ersetzt weder den elektrischen Zusammenhang noch die erforderliche Prüfung.",
    "frage": "Warum ist eine Leitungsüberschneidung allein keine sichere Verbindung?",
    "antwort": "Die elektrische Verbindung braucht einen geeigneten, richtig montierten Verbinder und muss entsprechend geprüft werden.",
    "fall": [
      "Zwei Fangleitungen liegen lose aufeinander und werden als fertig verbunden dokumentiert.",
      "Den vorgesehenen geeigneten Verbinder fachgerecht montieren und prüfen.",
      "Lose Berührung ist gleichwertig mit jeder geplanten Verbindung."
    ],
    "aufgaben": [
      24,
      29,
      30
    ]
  },
  {
    "n": 13,
    "titel": "Blitzschutzprojekt systematisch bearbeiten",
    "ziel": "aus Gebäudeangaben einen lesbaren Plan und eine nachvollziehbare Materialliste entwickeln.",
    "text": "Für das Blitzschutzprojekt sammelst du zuerst die vorgegebenen Daten: Dachform, Gebäudeabmessungen, vorhandene Erdungsanschlüsse und das vorgesehene Schutzkonzept. Zeichne anschließend die Fangeinrichtung und die Ableitungen im verlangten Maßstab. Verwende unterschiedliche Linienarten für sichtbare und verdeckte Verläufe und ergänze eine eindeutige Legende. Der gewählte Werkstoff muss zu Untergrund, Verbindungsteilen und vorhandenen Metallen passen. Für die Mengenliste werden waagerechte Dachleitungen und senkrechte Ableitungen getrennt aufgenommen. Dazu kommen Verbindungsteile, Halter und die vorgesehenen Prüfpunkte. Vergleiche zum Schluss Plan und Liste miteinander. Jeder dargestellte Leitungsabschnitt braucht eine Mengenposition; jede bestellte Position sollte sich im Plan wiederfinden lassen.",
    "frage": "Welche Kontrolle verbindet Montageplan und Materialliste?",
    "antwort": "Jeder geplante Abschnitt und jedes benötigte Verbindungsteil muss in der Mengenliste nachvollziehbar enthalten sein.",
    "fall": [
      "Die Liste enthält nur Leitungen im Dachgrundriss, keine senkrechten Ableitungen.",
      "Die tatsächlichen Ableitungslängen und zugehörigen Teile ergänzen.",
      "Ein Grundriss enthält automatisch alle senkrechten Leitungslängen."
    ],
    "aufgaben": [
      31,
      33,
      32
    ]
  },
  {
    "n": 14,
    "titel": "Vom Modul zum Wechselstromverbraucher",
    "ziel": "Solarzelle, Modul, Generator und Wechselrichter in ihrer Funktionsfolge erklären.",
    "text": "Eine Solarzelle wandelt einen Teil der eingestrahlten Lichtenergie in elektrische Energie um. Mehrere Zellen bilden zusammen ein Modul. Geeignet verschaltete Module gehören zum Photovoltaikgenerator. Auf dieser Seite entsteht Gleichstrom. Der Wechselrichter übernimmt die Umwandlung für die vorgesehene Wechselstromnutzung. Weitere Schutz-, Anschluss- und Zähleinrichtungen gehören zur elektrischen Gesamtanlage und werden fachgerecht geplant. Unterscheide Nennleistung und tatsächlich gelieferte Energie. Beispielsweise ergibt eine Leistung von einem Kilowatt über zwei Stunden rechnerisch zwei Kilowattstunden, wenn die Leistung in diesem Zeitraum konstant bleibt. Ein Modul liefert seine angegebene Prüfleistung aber nicht zu jeder Tageszeit. Wetter, Temperatur und Einstrahlung beeinflussen den tatsächlichen Betrieb.",
    "frage": "Welche Aufgabe hat der Wechselrichter?",
    "antwort": "Er wandelt den Gleichstrom des Photovoltaikgenerators für die vorgesehene Wechselstromnutzung um.",
    "fall": [
      "Der Jahresertrag einer Anlage wird allein mit einer Leistung in Kilowatt angegeben.",
      "Leistung und Energiemenge unterscheiden und den Ertrag in einer passenden Energieeinheit beschreiben.",
      "Kilowatt und Kilowattstunden sind dieselbe Größe."
    ],
    "aufgaben": [
      39,
      40,
      43,
      44
    ]
  },
  {
    "n": 15,
    "titel": "Auf der Deckung oder Teil der Deckung",
    "ziel": "die Anschlussaufgaben von Aufdach- und Indachsystemen vergleichen.",
    "text": "Bei einem Aufdachsystem liegt die Anlage über der vorhandenen Dachdeckung. Halter und Schienen übertragen Lasten in die vorgesehene Konstruktion; ihre Durchdringungen müssen passend angeschlossen werden. Bei einem Indachsystem ist die Anlage in die Dachfläche integriert und übernimmt je nach System Aufgaben der Deckung. Dadurch werden seitliche, obere und untere Übergänge zu wichtigen Wasserführungsdetails. Beide Montagearten brauchen abgestimmte Befestigungen und die vorgesehenen Abstände beziehungsweise Hinterlüftungsräume. Die Arbeitsreihenfolge ergibt sich aus dem konkreten System. Ein zuerst montiertes Modul darf den später erforderlichen Anschluss nicht unzugänglich machen. Plane deshalb Tragfunktion, Wasserführung und Zusammenarbeit mit dem Elektrogewerk vor Beginn der flächigen Montage.",
    "frage": "Welche zusätzliche Aufgabe entsteht bei einem dachintegrierten System?",
    "antwort": "Das integrierte System und seine Anschlüsse übernehmen Aufgaben der Dachdeckung und müssen deren Wasserführung sicherstellen.",
    "fall": [
      "Ein Indachmodul wird ohne passende Übergänge wie ein aufgestelltes Aufdachmodul behandelt.",
      "Die zum integrierten System gehörenden Deckungsanschlüsse ausführen.",
      "Indach und Aufdach benötigen unabhängig vom Produkt identische Anschlussdetails."
    ],
    "aufgaben": [
      45,
      46,
      47,
      48
    ]
  },
  {
    "n": 16,
    "titel": "Solarmontage verändert das Dachkonzept",
    "ziel": "Deckordnung, Regensicherheit und vorhandenen Blitzschutz bei Nachrüstung gemeinsam beachten.",
    "text": "Ein in die Deckung integriertes Solarelement muss zum jeweiligen Decksystem passen. Größe und Anschlussausbildung bestimmen, wie Wasser um das Element weitergeführt wird. Die Quelle zeigt bestimmte ältere Produkte mit konkreten Leistungen und Neigungsbereichen. Diese Angaben sind Produktbeispiele und keine allgemeine Freigabe für heutige Module. Bei einer Nachrüstung wird außerdem die vorhandene Blitzschutzanlage berücksichtigt. Lage der Module, Schutzbereich, Leitungswege und erforderliche Abstände können sich ändern. Eine mechanisch sichere Montage beweist daher noch kein vollständiges Schutzkonzept. Stimme die Änderungen vorab mit den zuständigen Fachkräften ab und halte die zum konkreten Produkt gehörenden Einbauunterlagen und Anschlussdetails bereit.",
    "frage": "Warum muss vorhandener Blitzschutz bei einer Solarnachrüstung erneut betrachtet werden?",
    "antwort": "Die neuen Bauteile und Leitungswege können Schutzbereiche, Abstände und das bestehende Konzept verändern.",
    "fall": [
      "Neue Module werden ohne Abstimmung unmittelbar neben eine bestehende Fangstange gesetzt.",
      "Die Nachrüstung mit dem vorhandenen Blitzschutzkonzept abstimmen.",
      "Ein unveränderter Dachrand garantiert automatisch unveränderten Blitzschutz."
    ],
    "aufgaben": [
      46,
      49,
      50,
      51
    ]
  },
  {
    "n": 17,
    "titel": "Schnee halten und Durchführungen anschließen",
    "ziel": "Schneefang, Schneerückhaltung und den Anschluss durchdrungener Schutzebenen unterscheiden.",
    "text": "Schneeschutz kann Schnee im Traufbereich auffangen oder über die Dachfläche zurückhalten. Welche Lösung und Anordnung geeignet ist, hängt unter anderem von Dachgeometrie, örtlicher Schneelast und dem Schutzbedarf ab. An Kehlen und Aufbauten kann Schnee ungleichmäßig liegen. Die benötigten Halter dürfen deshalb nicht allein nach einem gleichmäßigen optischen Abstand verteilt werden. Eine Rohr- oder Kabeldurchführung hat eine andere Aufgabe, unterbricht aber ebenfalls den Dachaufbau. Sie muss an jede betroffene Schutzebene passend angeschlossen werden. Ein sichtbarer Deckungsanschluss ersetzt nicht automatisch den Anschluss der Unterdeckung oder Luftdichtung. Zeichne die Durchdringung vollständig und kennzeichne Lastweg und Wasserweg gesondert.",
    "frage": "Warum reicht die sichtbare Manschette einer Durchführung allein nicht immer aus?",
    "antwort": "Auch darunterliegende, durchbrochene Schutzebenen wie Unterdeckung oder Luftdichtung brauchen ihren passenden Anschluss.",
    "fall": [
      "Eine Rohrdurchführung ist oben abgedeckt; die Unterdeckung bleibt offen.",
      "Alle durchbrochenen Schutzebenen passend anschließen.",
      "Der sichtbare Anschluss ersetzt unabhängig vom Aufbau sämtliche unteren Anschlüsse."
    ],
    "aufgaben": [
      56,
      58,
      60
    ]
  }
];
const LF16_KAPITEL = kurs("lf16", LF16_REDAKTION, [["Energie und elektrische Sicherheit", [1, 2, 8, 14]], ["Blitzschutz als zusammenhängendes System", [3, 5, 6, 10]], ["Pläne, Abstände und Prüfungen", [7, 11, 12, 13]], ["Montage und Dachanschlüsse", [4, 9, 15, 16, 17]]]);

const LF17_REDAKTION: Redaktion[] = [
  {
    "n": 1,
    "titel": "Vier Maßnahmen der Instandhaltung unterscheiden",
    "ziel": "Wartung, Inspektion, Instandsetzung und Verbesserung nach ihrem Zweck unterscheiden.",
    "text": "Instandhaltung ist der Oberbegriff für Maßnahmen, die eine Funktion erhalten oder wiederherstellen. Eine Inspektion stellt den vorhandenen Zustand fest und bewertet ihn. Wartung verzögert den weiteren Verschleiß, zum Beispiel durch das Entfernen störender Ablagerungen. Eine Instandsetzung stellt eine geschädigte Funktion wieder her. Eine Verbesserung erhöht die Funktionssicherheit, ohne die geforderte Grundfunktion zu verändern. Ordne eine Arbeit nach ihrem Zweck ein, nicht allein nach dem verwendeten Werkzeug. Beim gleichen Termin können mehrere Maßnahmen aufeinanderfolgen. Im Protokoll bleiben Feststellung, Pflegearbeit und Reparatur dennoch getrennt. So erkennt der Auftraggeber, was geprüft wurde, was erledigt ist und welche weitere Entscheidung noch aussteht.",
    "frage": "Warum bleiben Inspektion und Reparatur im Protokoll getrennt?",
    "antwort": "Die Inspektion beschreibt und bewertet den Zustand. Die Reparatur verändert ihn und stellt eine Funktion wieder her; beides muss nachvollziehbar dokumentiert sein.",
    "fall": [
      "Bei der Sichtkontrolle wird ein gerissener Anschluss festgestellt, aber noch nicht bearbeitet.",
      "Das ist eine Feststellung im Rahmen der Inspektion.",
      "Allein das Erkennen des Risses ist bereits die abgeschlossene Instandsetzung."
    ],
    "aufgaben": [
      17,
      18,
      33,
      71
    ]
  },
  {
    "n": 2,
    "titel": "Schadensbild und Ursache getrennt beschreiben",
    "ziel": "sichtbare Befunde von noch zu prüfenden Schadensursachen unterscheiden.",
    "text": "Ein Feuchtefleck zeigt eine Auffälligkeit, aber noch nicht sicher die Eintrittsstelle des Wassers. Wasser kann an Schichten, Fugen oder Bauteilen weiterlaufen, bevor es innen sichtbar wird. Beschreibe deshalb zuerst den Befund mit Ort, Ausdehnung und Zeitpunkt. Danach formulierst du mögliche Ursachen und prüfst sie mit geeigneten Verfahren. Offene Nähte, Risse, verschobene Deckelemente oder verstopfte Abläufe können Hinweise geben. Mehrere Ursachen können gleichzeitig wirken. Eine bloße Vermutung darf nicht als gesicherte Ursache im Bericht stehen. Dokumentiere außerdem, welche Bereiche zugänglich waren und welche noch untersucht werden müssen. Erst aus dem abgesicherten Zusammenhang lässt sich eine passende Reparatur ableiten.",
    "frage": "Was schreibst du bei einem Feuchtefleck, dessen Eintrittsweg noch unbekannt ist?",
    "antwort": "Den sichtbaren Befund und die untersuchten Bereiche. Mögliche Ursachen werden ausdrücklich als zu prüfende Vermutungen gekennzeichnet.",
    "fall": [
      "Direkt über einem Innenfleck soll ohne weitere Prüfung die Deckung erneuert werden.",
      "Zuerst den tatsächlichen Wasserweg und die Eintrittsstelle untersuchen.",
      "Ein Innenfleck liegt immer senkrecht unter dem Loch im Dach."
    ],
    "aufgaben": [
      28,
      30,
      31,
      35
    ]
  },
  {
    "n": 3,
    "titel": "Den Umfang einer Sanierung begründen",
    "ziel": "örtliche Reparatur, abschnittsweisen Eingriff und vollständige Erneuerung anhand des Bestands unterscheiden.",
    "text": "Eine einzelne Schadstelle entscheidet noch nicht über den Umfang einer Sanierung. Untersuche auch die übrige Fläche, die Anschlüsse und den Zustand der darunterliegenden Schichten. Eine örtliche Reparatur kann sinnvoll sein, wenn der restliche Aufbau geeignet und funktionsfähig ist. Bei größeren zusammenhängenden Schäden kommt eine abschnittsweise Erneuerung infrage. Ist der Aufbau insgesamt nicht mehr nutzbar, muss ein weitergehender Rückbau geprüft werden. Die Begriffe der Quellen werden dabei mit dem tatsächlich beschriebenen Arbeitsumfang verbunden. Alter allein ist keine ausreichende Entscheidung. Begründe im Beratungsgespräch, welche Schichten bleiben können, welche ersetzt werden müssen und welche Untersuchungen diese Aussage tragen. Kosten und Folgerisiken gehören ebenfalls in den Vergleich.",
    "frage": "Warum reicht die Angabe des Dachalters für eine Sanierungsentscheidung nicht?",
    "antwort": "Der tatsächliche Zustand von Fläche, Details und darunterliegenden Schichten bestimmt den notwendigen Eingriff. Gleich alte Dächer können unterschiedlich geschädigt sein.",
    "fall": [
      "Ein örtlicher Riss wird gefunden; über die Dämmung ist noch nichts bekannt.",
      "Den Bestandszustand prüfen, bevor der gesamte Sanierungsumfang festgelegt wird.",
      "Ein einzelner Riss beweist zwingend, dass jede Schicht entfernt werden muss."
    ],
    "aufgaben": [
      34,
      39,
      62,
      63
    ]
  },
  {
    "n": 4,
    "titel": "Sofortmaßnahmen mit Bestandsrisiken planen",
    "ziel": "die Reihenfolge aus Gefahrenklärung, Absicherung und geeigneter Notmaßnahme erklären.",
    "text": "Nach einem Sturm steht die sichere Beurteilung vor der Notreparatur. Lose Teile und gefährdete Bereiche können Personen unterhalb und auf dem Dach gefährden. Der Zugang, die Absicherung und die erforderlichen Fachkräfte werden vor dem Eingriff geklärt. Bei älteren Baustoffen ist zusätzlich mit unbekannten Gefahrstoffen zu rechnen. Ein Material darf nicht allein nach seinem Aussehen als unbedenklich eingestuft werden. Verdächtige ältere Faserzementprodukte werden vor einer Bearbeitung entsprechend untersucht und eingeordnet. Ungeeignete Reinigung oder Bearbeitung kann gefährliche Fasern freisetzen. Eine Notabdichtung wird deshalb nicht auf Kosten der Schutzmaßnahmen improvisiert. Befund, getroffene Sicherung und verbleibende Unsicherheit werden für Auftraggeber und weitere Arbeiten dokumentiert.",
    "frage": "Was hat bei einem unklaren alten Faserzementdach Vorrang vor einer mechanischen Bearbeitung?",
    "antwort": "Material und Gefährdung müssen geklärt sowie die geeigneten Schutzmaßnahmen und fachlichen Voraussetzungen festgelegt werden.",
    "fall": [
      "Alte Faserzementplatten sollen vor der Notreparatur mit dem Hochdruckreiniger gesäubert werden.",
      "Die Bearbeitung unterlassen und zuerst Material sowie geeignete Schutzmaßnahmen klären.",
      "Ein kräftiger Wasserstrahl macht unbekannte Altplatten gefahrlos bearbeitbar."
    ],
    "aufgaben": [
      "anhang1-047",
      "anhang1-048",
      "anhang1-050",
      "anhang1-051"
    ]
  },
  {
    "n": 5,
    "titel": "Prüfauftrag, Termin und Zuständigkeit klären",
    "ziel": "einen Inspektionsauftrag mit vereinbartem Umfang und nachvollziehbarer Zuständigkeit beschreiben.",
    "text": "Eine Inspektion braucht einen klaren Auftrag. Eigentümer und ausführender Betrieb stimmen Umfang, Zugang, Dokumentation und weitere Schritte ab. Die Verantwortung für das Gebäude und die fachgerechte Ausführung der beauftragten Arbeiten sind dabei verschiedene Aufgaben. Regelmäßige Termine richten sich nach Vertrag, Dachzustand, Nutzung und Beanspruchung. Angaben aus einem Mustervertrag dürfen nicht als allgemeine Wartezeit für jedes Dach behandelt werden. Auch ein neueres Dach kann nach einem besonderen Ereignis eine Untersuchung benötigen. Nach einem Sturm oder einer auffälligen Veränderung wird der zusätzliche Prüfbedarf beurteilt. Im Bericht steht, welche Bauteilgruppen geprüft wurden und welche Arbeiten gesondert beauftragt werden müssen. Eine Sichtkontrolle ersetzt keine nicht ausgeführte Reparatur.",
    "frage": "Warum ist ein Intervall aus einem Mustervertrag keine allgemeine Freigabe zum Abwarten?",
    "antwort": "Dachzustand, Vertrag und besondere Ereignisse können einen früheren Prüfbedarf begründen. Das konkrete Gebäude muss beurteilt werden.",
    "fall": [
      "Nach einem Sturm wird eine lockere Deckung gemeldet; der regelmäßige Termin liegt noch weit entfernt.",
      "Den zusätzlichen Prüf- und Sicherungsbedarf zeitnah beurteilen.",
      "Bis zum Musterintervall darf jede gemeldete Auffälligkeit unbeachtet bleiben."
    ],
    "aufgaben": [
      12,
      13,
      14,
      16
    ]
  },
  {
    "n": 6,
    "titel": "Mit einer Checkliste vollständig dokumentieren",
    "ziel": "Dachdeckung, Entwässerung, Anschlüsse, Einbauteile und Sicherheitseinrichtungen systematisch prüfen.",
    "text": "Eine Checkliste ordnet die Inspektion nach Bauteilgruppen. Dadurch wird die Dachentwässerung nicht vergessen, nur weil die Deckfläche gut aussieht. Die vorhandene Vorlage führt Deckung, Entwässerung, An- und Abschlüsse, Einbauteile, Sicherheitseinrichtungen und Verkehrssicherheit auf. Zu jeder Gruppe werden Ort, Zustand und erforderliche weitere Prüfung festgehalten. Nicht zugängliche Bereiche gelten nicht automatisch als mängelfrei. Ein Foto erhält eine eindeutige Zuordnung zum Befund. Die Liste unterstützt vollständiges Hinsehen, ersetzt aber nicht die fachliche Beurteilung. Prüfe abschließend, ob aus den einzelnen Feststellungen eine verständliche Handlungsliste entsteht. So kann der Auftraggeber erkennen, was dringend gesichert werden muss und welche Maßnahme noch geplant werden soll.",
    "frage": "Wie dokumentierst du einen bei der Inspektion nicht zugänglichen Bereich?",
    "antwort": "Als nicht geprüft mit Begründung und gegebenenfalls erforderlichem Folgeschritt. Er darf nicht als ohne Befund abgehakt werden.",
    "fall": [
      "Ein verdeckter Anschluss wird in der Checkliste als mängelfrei markiert, obwohl er nicht einsehbar war.",
      "Den Prüfstatus auf nicht geprüft ändern und den Klärungsbedarf angeben.",
      "Eine nicht sichtbare Stelle darf grundsätzlich als unbeschädigt gelten."
    ],
    "aufgaben": [
      19,
      20,
      21,
      24
    ]
  },
  {
    "n": 7,
    "titel": "Lecksuche und Reparatur sinnvoll trennen",
    "ziel": "den Weg von der Ortung über die Ursachenprüfung zur geeigneten örtlichen Instandsetzung erklären.",
    "text": "Bei einer Undichtigkeit wird zuerst geklärt, wo und auf welchem Weg Wasser eindringt. Geeignete Ortungsverfahren können die Untersuchung unterstützen. Ihre Eignung hängt vom Aufbau und den tatsächlichen Bedingungen ab; kein Verfahren beantwortet automatisch jede Frage. Nach der Ortung werden Ausmaß und Ursache geprüft. Erst dann lässt sich entscheiden, ob eine örtliche Reparatur genügt. Bei Bahnen müssen vorhandenes Material, Alterung, Oberfläche und Reparaturverfahren zusammenpassen. Auch die Schutzfunktion der Oberfläche wird nach der Arbeit wiederhergestellt. Großflächig geschädigte oder feuchte Aufbauten werden nicht durch einen beliebigen Flicken dauerhaft geeignet. Das Protokoll nennt deshalb die reparierte Stelle, die ausgeführte Maßnahme und die verbleibenden Grenzen der Untersuchung.",
    "frage": "Was wird zwischen dem Finden einer Schadstelle und der Wahl des Flickens geklärt?",
    "antwort": "Ursache, Schadensausmaß, vorhandenes Material und Eignung des verbleibenden Aufbaus. Daraus folgt das passende Reparaturverfahren.",
    "fall": [
      "Eine Leckstelle ist gefunden; der übrige Aufbau zeigt großflächige Auffälligkeiten.",
      "Den Gesamtzustand prüfen, bevor eine örtliche Reparatur als ausreichend bewertet wird.",
      "Der Fund einer einzelnen Leckstelle beweist, dass ein beliebiger Flicken ausreicht."
    ],
    "aufgaben": [
      34,
      36,
      38,
      39
    ]
  },
  {
    "n": 8,
    "titel": "Ersatzplatten passend zum Bestand auswählen",
    "ziel": "Materialpassung und geeignetes Reparatur-Befestigungssystem beim Plattenwechsel begründen.",
    "text": "Beim Austausch einer einzelnen Schieferplatte muss der Ersatz zum vorhandenen Deckbild und Material passen. Dazu gehören Format, Dicke und geeignete Materialeigenschaften. Die gleiche Herkunft kann die optische und technische Anpassung unterstützen, ersetzt aber nicht die Prüfung der konkreten Platte. Für die Befestigung wird ein dafür geeignetes Reparatursystem gewählt. Ein Plattenhalter kann einen Austausch ermöglichen, ohne eine beliebige sichtbare Durchbohrung in der wasserführenden Fläche anzulegen. Seine Befestigung und Lage müssen zum Untergrund und Decksystem passen. Vor dem Eingriff werden Bruchursache, Zugang und Zustand des Bestands geklärt. Bei älteren Faserzementplatten kommt die Material- und Gefahrstoffklärung hinzu. Unbekanntes Material wird nicht versuchsweise bearbeitet.",
    "frage": "Warum reicht ein Ersatzstein in ungefähr derselben Farbe nicht aus?",
    "antwort": "Auch Format, Dicke, Materialzustand und Befestigung müssen zum vorhandenen Decksystem und zur vorgesehenen Reparatur passen.",
    "fall": [
      "Eine Ersatzplatte passt farblich, ist aber deutlich dicker und soll beliebig durchbohrt werden.",
      "Materialpassung und ein geeignetes Reparatur-Befestigungssystem prüfen.",
      "Die Farbe allein entscheidet über die fachgerechte Eignung der Reparatur."
    ],
    "aufgaben": [
      25,
      26,
      27,
      69
    ]
  },
  {
    "n": 9,
    "titel": "Flachdachpflege von Reparatur unterscheiden",
    "ziel": "Sichtkontrolle, vorbeugende Reinigung und Instandsetzung in einem Pflegeablauf unterscheiden.",
    "text": "Die regelmäßige Betreuung eines Flachdachs verbindet Hinsehen, Pflegen und bei Bedarf Reparieren. Bei der Inspektion werden Fläche, Anschlüsse, Durchdringungen und Entwässerung untersucht. Pflege entfernt beispielsweise Laub und störende Ablagerungen, bevor Wasserwege beeinträchtigt werden. Eine beschädigte Naht benötigt dagegen eine geeignete Instandsetzung. Ordne diese Arbeiten im Protokoll getrennt zu. Besonders Abläufe und Übergänge sollen nicht von Bewuchs oder losem Material verdeckt bleiben. Die Arbeit erfolgt mit einem zum Dachsystem passenden Verfahren; eine aggressive Reinigung kann selbst Schäden verursachen. Nach der Pflege wird kontrolliert, ob die vorgesehenen Wasserwege wieder frei sind. Gefundene Schäden bleiben als eigener Auftrag oder offener Punkt sichtbar.",
    "frage": "Was unterscheidet das Entfernen von Laub am Ablauf vom Schließen einer beschädigten Naht?",
    "antwort": "Laubentfernung ist vorbeugende Pflege; das Wiederherstellen einer beschädigten Abdichtungsverbindung ist Instandsetzung.",
    "fall": [
      "Der Ablauf wurde gereinigt. Daneben bleibt eine offene Naht sichtbar.",
      "Die Reinigung und die noch nötige Instandsetzung getrennt dokumentieren.",
      "Ein gereinigter Ablauf bedeutet, dass auch die offene Naht instand gesetzt ist."
    ],
    "aufgaben": [
      31,
      32,
      33
    ]
  },
  {
    "n": 10,
    "titel": "Eine Sanierungs-Arbeitsliste nach Abhängigkeiten ordnen",
    "ziel": "Vorbereitung, neuen Aufbau und Detailanschlüsse in eine begründete Arbeitsfolge bringen.",
    "text": "Eine Sanierungs-Arbeitsliste zeigt, welcher Schritt die Voraussetzung für den nächsten schafft. Zuerst werden sichere Arbeitsbedingungen und betroffene Anlagen fachgerecht geklärt. Danach folgen Rückbau oder Vorbereitung des geeigneten Bestands. Lose Teile, störende Ablagerungen und ungeeignete Bereiche dürfen nicht unter dem neuen Aufbau verschwinden. Erst auf der vorbereiteten Unterlage werden die vorgesehenen neuen Schichten hergestellt. Fläche und Detailanschlüsse werden dabei aufeinander abgestimmt. Blitzschutzanlagen werden durch dafür geeignete Fachkräfte berücksichtigt und abschließend wieder funktionsgerecht hergestellt. Das Quellenbeispiel beschreibt eine bestimmte Reihenfolge für sein Bestandsdach. Übertrage die Abhängigkeiten, aber nicht ungeprüft jede einzelne Schicht auf ein anderes Gebäude. Abschließende Kontrolle und Dokumentation gehören zur vollständigen Liste.",
    "frage": "Warum kommt die Untergrundvorbereitung vor dem Aufbringen neuer Bahnen?",
    "antwort": "Der neue Aufbau braucht eine geeignete und vorbereitete Unterlage. Lose oder ungeeignete Bereiche dürfen seine Verbindung und Funktion nicht beeinträchtigen.",
    "fall": [
      "Neue Bahnen sollen direkt über lose Ablagerungen gelegt werden, um Zeit zu sparen.",
      "Zuerst eine geeignete Unterlage entsprechend dem geplanten System herstellen.",
      "Die neue Bahn macht jeden darunterliegenden losen Bereich automatisch tragfähig."
    ],
    "aufgaben": [
      47,
      48,
      49
    ]
  },
  {
    "n": 11,
    "titel": "Bei höherem Aufbau die Details mitplanen",
    "ziel": "die Auswirkungen zusätzlicher Dämmung auf Dachränder, Abläufe und Durchdringungen erklären.",
    "text": "Zusätzliche Dämmung verändert nicht nur den Wärmeschutz. Mit ihr wandert auch die obere Abdichtungsebene nach oben. Deshalb werden Dachrand, Türschwellen, Einfassungen, Abläufe und Lüfter erneut im Schnitt geprüft. Ein vorher passender Anschluss kann nach der Erhöhung zu niedrig sein. Auch die Höhenlage der Entwässerung muss zum neuen Gefälle passen. Materialkontakte zwischen altem und neuem System werden auf Verträglichkeit geprüft; eine geeignete Trennlage kann erforderlich sein. Der alte Dämmstoff wird nur berücksichtigt, wenn sein Zustand und seine Eigenschaften dafür geeignet sind. Eine reine Addition zweier Dicken ersetzt keinen vollständigen Wärmenachweis. Zeichne im Plan deshalb den alten und den neuen Höhenverlauf eindeutig getrennt.",
    "frage": "Warum werden bei zusätzlicher Dämmung auch die Dachabläufe angepasst?",
    "antwort": "Die wasserführende Ebene und gegebenenfalls das Gefälle ändern ihre Höhe. Die Abläufe müssen das Wasser aus dem neuen Aufbau sicher aufnehmen können.",
    "fall": [
      "Die Dämmung wird erhöht, aber alle bisherigen Rand- und Ablaufhöhen bleiben ungeprüft.",
      "Die Details an den neuen Höhenverlauf anpassen.",
      "Nur die Fläche verändert sich; Anschlüsse und Abläufe sind davon unabhängig."
    ],
    "aufgaben": [
      53,
      57,
      58
    ]
  },
  {
    "n": 12,
    "titel": "Ein Gründach als Sanierungsvariante vergleichen",
    "ziel": "Wurzelschutz, Dränung und Vegetation als zusätzliche Funktionen einer Begrünungsvariante erklären.",
    "text": "Eine Sanierung kann mit einer Begrünung verbunden werden, wenn Gebäude und System dafür geeignet sind. Gegenüber einem einfachen Oberflächenschutz kommen Vegetations-, Filter- und Dränfunktionen sowie ein geeigneter Wurzelschutz hinzu. Zusätzlich werden Lasten im maßgebenden Wasserzustand und die künftige Pflege betrachtet. Ein Kiesstreifen kann in einem geplanten Detail den Bewuchs von Anschlüssen fernhalten; er ersetzt keinen Wurzelschutz. Die Entwässerung bleibt für Wartung zugänglich. Eine Wärmeschutzwirkung darf nur angesetzt werden, soweit sie für den konkreten Aufbau nachgewiesen berücksichtigt werden kann. Die Begrünung ist daher kein pauschaler Ersatz für jede erforderliche Wärmedämmung. Vergleiche Varianten anhand derselben Nutzungsziele, Nachweise und Betriebsbedingungen.",
    "frage": "Warum genügt ein Kiesstreifen am Rand nicht als vollständiger Wurzelschutz?",
    "antwort": "Er kann Bewuchs vom Detail fernhalten, bildet aber keine nachgewiesene durchwurzelungsfeste Abdichtung für die gesamte Fläche und ihre Anschlüsse.",
    "fall": [
      "Ein Dachgarten soll ohne Lastprüfung und ohne geplanten Wurzelschutz angelegt werden.",
      "Tragfähigkeit, Wurzelschutz, Wasserweg und Pflege vorab klären.",
      "Pflanzsubstrat schützt die vorhandene Abdichtung automatisch vor jeder Wurzel."
    ],
    "aufgaben": [
      59,
      60,
      61
    ]
  },
  {
    "n": 13,
    "titel": "Wärmeschutzanforderungen als Projektbedingung lesen",
    "ziel": "einen vorgegebenen U-Wert von einer ungeprüften allgemeinen Rechtsbehauptung unterscheiden.",
    "text": "Bei einer Sanierung wird geprüft, welche Wärmeschutzanforderungen für das konkrete Vorhaben gelten. Umfang der Maßnahme, Nutzung und die einschlägigen Bedingungen sind dafür entscheidend. Die vorhandenen Quellen nennen Tabellenwerte aus dem GEG von 2020. Diese dienen hier als bezeichnete Buch- und Übungswerte und werden nicht als neu bestätigte Rechtsauskunft ausgegeben. In einer Rechnung schreibst du den vorgegebenen U-Wert mit Einheit und Bezug auf das Bauteil auf. Ein kleinerer U-Wert beschreibt bei gleichem Temperaturunterschied einen geringeren Wärmedurchgang. Für eine reale Planung werden aktuelle Anforderungen, mögliche Ausnahmen und der vollständige Bauteilaufbau geprüft. Eine einzelne Dämmstoffdicke ist kein allgemeiner Nachweis für jedes Dach.",
    "frage": "Wie kennzeichnest du einen U-Wert aus einer historischen Buchaufgabe?",
    "antwort": "Als für die Aufgabe vorgegebenen Quellenwert mit Einheit und Bauteilbezug. Die heutige Anforderung des realen Projekts wird gesondert geprüft.",
    "fall": [
      "Ein Tabellenwert aus der Ausgabe von 2020 soll ohne Projektprüfung als heutige allgemeine Rechtslage gelten.",
      "Quellenstand und Aufgabenbezug kennzeichnen und die reale Anforderung gesondert klären.",
      "Das Erscheinungsjahr und der Maßnahmenumfang können grundsätzlich ignoriert werden."
    ],
    "aufgaben": [
      64,
      66,
      67,
      68
    ]
  },
  {
    "n": 14,
    "titel": "Aus einem Befund einen vollständigen Sanierungsplan entwickeln",
    "ziel": "Befund, Arbeitsbeschreibung, Schnitt und Mengenermittlung als Teile eines technischen Plans verbinden.",
    "text": "Ein Sanierungsplan beginnt mit dem festgestellten Zustand und dem Ziel des Eingriffs. Daraus folgt eine Arbeitsbeschreibung mit den zu erhaltenden und zu erneuernden Schichten. Ein Schnitt zeigt den künftigen Aufbau und die Detailanschlüsse. Die Mengenermittlung leitet daraus Flächen, Längen und Stückzahlen ab. Diese drei Teile müssen dieselbe Lösung beschreiben. Im Quellenfall wird eine L-förmige Dachfläche aus einem umschließenden Rechteck abzüglich einer fehlenden Ecke ermittelt. Der Randumfang wird dagegen entlang aller tatsächlichen Kanten nachvollzogen. Preise gehören erst zur darauf aufbauenden Kalkulation. Halte in der Planung offene Bestandsfragen und Annahmen sichtbar, damit eine rechnerisch genaue Menge nicht fälschlich eine noch ungeklärte Konstruktion bestätigt.",
    "frage": "Warum müssen Arbeitsbeschreibung und Mengenermittlung dieselbe Lösung beschreiben?",
    "antwort": "Nur dann werden die vorgesehenen Schichten und Details vollständig mit passenden Mengen bestellt und ausgeführt. Abweichende Varianten würden zu einer widersprüchlichen Liste führen.",
    "fall": [
      "Im Schnitt sind zwei neue Abdichtungslagen gezeichnet; die Mengenliste enthält nur eine Lage.",
      "Plan und Mengenliste auf dieselbe Lösung abstimmen.",
      "Die Darstellung und die Bestellung dürfen unabhängig voneinander unterschiedliche Aufbauten zeigen."
    ],
    "aufgaben": [
      1,
      2,
      3
    ]
  },
  {
    "n": 15,
    "titel": "Bestandsschichten und Randmengen getrennt erfassen",
    "ziel": "Schichtfunktion, Kiesvolumen und Randbohlenmenge mit passenden Einheiten ermitteln.",
    "text": "Im Bestandsaufbau werden alle vorhandenen Schichten mit Funktion und Maß erfasst. Eine Kiesschicht dient beispielsweise dem vorgesehenen Schutz und gegebenenfalls der Lagesicherung, nicht als beliebige Wärmedämmung. Ihr Volumen ergibt sich aus Fläche mal Schütthöhe. Die Höhe wird vorher in Meter umgerechnet. Bei Randbohlen wird dagegen der Querschnitt mit der tatsächlichen Randlänge multipliziert. Für ein Übungsmaß von 6 mal 12 Zentimetern lautet der Querschnitt 0,06 mal 0,12 Quadratmeter. Die Verankerung des Randdetails benötigt einen geeigneten tragenden Befestigungsgrund. Weder Dämmstoff noch eine alte Abdeckung beweisen allein dessen Eignung. Dokumentiere deshalb Menge und Befestigungsanforderung als getrennte Angaben.",
    "frage": "Warum steht in der Kiesrechnung bei 6 cm Schütthöhe der Faktor 0,06?",
    "antwort": "Die Fläche ist in Quadratmetern angegeben. Mit 0,06 Metern Höhe ergibt die Multiplikation ein Volumen in Kubikmetern.",
    "fall": [
      "Für 100 m² Dachfläche und 6 cm Kieshöhe werden 600 m³ eingetragen.",
      "Die Höhe in Meter einsetzen: 100 · 0,06 = 6 m³.",
      "Die Zahl 6 darf ohne Einheitenumrechnung direkt mit der Quadratmeterzahl multipliziert werden."
    ],
    "aufgaben": [
      6,
      8,
      9
    ]
  },
  {
    "n": 16,
    "titel": "Belastungen mit passenden Prüfstellen verbinden",
    "ziel": "Bewuchs, Wasseransammlungen, Bewegungen und Temperaturwechsel als unterschiedliche Belastungen erklären.",
    "text": "Ein Flachdach ist vielen Einflüssen ausgesetzt. Bewegungen des Untergrunds können die Abdichtung mechanisch beanspruchen. Temperaturwechsel verändern Material und Bauteile. Bewuchs und Ablagerungen können Details verdecken und Wasserwege beeinträchtigen. Wasseransammlungen werden hinsichtlich Ursache und Bedeutung für den konkreten Aufbau untersucht. Aus diesen Einflüssen folgt keine pauschale feste Lebensdauer jedes Dachs. Zustand, Planung, Ausführung und laufende Betreuung wirken zusammen. Suche bei der Inspektion deshalb nach zugehörigen Befunden: Rissen, geöffneten Nähten, störenden Ablagerungen oder auffälligen Wasserständen. Trenne auch hier Beobachtung und Erklärung. Eine Pfütze allein beweist nicht automatisch den gleichen Schaden wie eine offene Abdichtungsnaht; beide Befunde werden fachlich eingeordnet.",
    "frage": "Warum wird die verbleibende Nutzbarkeit nicht allein aus einer allgemeinen Jahreszahl abgeleitet?",
    "antwort": "Der tatsächliche Zustand und die Einflüsse des konkreten Dachs sind entscheidend. Pauschale Lebensdauerangaben ersetzen keine Untersuchung.",
    "fall": [
      "Ein Dach erreicht ein bestimmtes Alter und soll allein deshalb als vollständig unbrauchbar gelten.",
      "Den tatsächlichen Aufbau und die festgestellten Schäden untersuchen.",
      "Eine allgemeine Jahreszahl beweist ohne Befund den Zustand jeder einzelnen Schicht."
    ],
    "aufgaben": [
      28,
      29,
      30
    ]
  },
  {
    "n": 17,
    "titel": "Den Erhalt alter Schichten fachlich begründen",
    "ziel": "Bestandsprüfung und geeigneten Ergänzungsaufbau als Voraussetzungen für einen Schichterhalt erklären.",
    "text": "Der alte Dachaufbau kann nur erhalten werden, wenn sein Zustand zur geplanten Sanierung passt. Dazu werden Feuchte, Materialzustand, Tragfähigkeit und weitere Systembedingungen untersucht. Geeignete Mess- und Untersuchungsverfahren liefern dafür Hinweise; ihre Ergebnisse werden fachlich ausgewertet. Eine unauffällige Oberfläche allein beweist keine trockene Dämmung. Der alte Aufbau wird entsprechend vorbereitet, und Materialverträglichkeit sowie Feuchte- und Druckverhältnisse werden im neuen System berücksichtigt. Aus einer vorhandenen Restfeuchte folgt keine beliebige allgemeine Kleberegel. Das geeignete Ausgleichs-, Trenn- und Befestigungskonzept entsteht aus dem konkreten Aufbau. Neue Dämmung oder Begrünung benötigen außerdem passende Nachweise und Detailhöhen. Die Entscheidung für den Erhalt bleibt im Plan mit ihren Voraussetzungen dokumentiert.",
    "frage": "Welche Aussage muss eine Entscheidung zum Erhalt der alten Dämmung tragen?",
    "antwort": "Die Untersuchung muss zeigen, dass Zustand und Eigenschaften der Dämmung für den geplanten Aufbau geeignet sind. Die bloße Existenz der Schicht genügt nicht.",
    "fall": [
      "Die Dämmung soll ungeprüft bleiben, weil oben nur wenige Risse sichtbar sind.",
      "Den Zustand der Dämmung mit geeigneten Untersuchungen klären.",
      "Wenige sichtbare Risse beweisen, dass jede darunterliegende Schicht trocken und funktionsfähig ist."
    ],
    "aufgaben": [
      39,
      40,
      41,
      43
    ]
  },
  {
    "n": 18,
    "titel": "Den Stallgebäude-Fall mit seinen eigenen Daten rechnen",
    "ziel": "Fläche, Umfang und Schutzart des ersten Sanierungsbeispiels getrennt erfassen.",
    "text": "Das erste Quellenbeispiel beschreibt ein Stallgebäude mit einer rechteckigen Dachfläche von 18 mal 20 Metern. Daraus folgen 360 Quadratmeter Fläche und 76 Meter Umfang. Die Fläche wird für flächige Leistungen verwendet, der Umfang für die zugehörigen Dachrandpositionen. Der vorhandene leichte Oberflächenschutz wird als Beschieferung beschrieben. Diese Angaben dürfen nicht mit der Turnhalle des zweiten Beispiels vermischt werden. Auch die Wärmeschutzentscheidung gehört zu den vorgegebenen Nutzungsbedingungen des konkreten Falls; sie ist keine allgemeine Aussage für jedes Stallgebäude. Notiere deshalb vor dem Rechnen zunächst Gebäude, Maße, Schutzart und Ziel der Sanierung. So bleiben Materialansätze und Annahmen dem richtigen Fall zugeordnet.",
    "frage": "Welche Mengen ergeben 18 m mal 20 m für Fläche und Umfang?",
    "antwort": "Die Fläche beträgt 18 · 20 = 360 m². Der Umfang beträgt 2 · (18 + 20) = 76 m.",
    "fall": [
      "Für das Stallgebäude werden 360 m² Fläche und 360 m Dachrand in die Liste geschrieben.",
      "Den Dachrand aus dem Umfang mit 76 m ansetzen.",
      "Fläche und Umfang besitzen bei einem Rechteck immer dieselbe Zahlenangabe."
    ],
    "aufgaben": [
      44,
      45,
      46
    ]
  },
  {
    "n": 19,
    "titel": "Kiesmengen im Turnhallen-Fall nachvollziehen",
    "ziel": "Fläche, Randumfang und Schüttvolumen des zweiten Beispiels mit ihren Einheiten berechnen.",
    "text": "Die Turnhalle des Quellenbeispiels besitzt ein 25 mal 50 Meter großes Rechteckdach. Die Fläche beträgt 1250 Quadratmeter, der Umfang 150 Meter. Für eine vorgegebene Kiesschicht von fünf Zentimetern ergibt sich ein Volumen von 1250 mal 0,05, also 62,5 Kubikmetern. Daraus darf erst mit einer geeigneten vorgegebenen Schüttdichte eine Masse ermittelt werden. Abräumen, Zwischenlagern und Wiederaufbringen sind unterschiedliche Arbeitspositionen. Die Eignung einer Wiederverwendung wird am Material und am geplanten Aufbau geprüft. Bei der Sanierung werden außerdem vorhandene und zusätzliche Dämmung sowie die angepassten Detailhöhen betrachtet. Die große Fläche macht deutlich, warum schon kleine Fehler der Schichtdicke erhebliche Mengenabweichungen erzeugen.",
    "frage": "Wie groß ist das Kiesvolumen bei 1250 m² und 5 cm Schütthöhe?",
    "antwort": "1250 m² · 0,05 m = 62,5 m³. Für eine Masse in Kilogramm wird zusätzlich eine passende Schüttdichte benötigt.",
    "fall": [
      "Aus 62,5 m³ Kies wird ohne weitere Angabe eine Masse von 62,5 kg übernommen.",
      "Für die Massenberechnung eine geeignete vorgegebene Schüttdichte verwenden.",
      "Kubikmeter und Kilogramm sind ohne weitere Angabe dieselbe Menge."
    ],
    "aufgaben": [
      50,
      51,
      52,
      58
    ]
  },
  {
    "n": 20,
    "titel": "Die vereinfachte Dämmrechnung richtig einordnen",
    "ziel": "Dämmdicke, Wärmeleitfähigkeit, Widerstand und U-Wert im bezeichneten Ein-Schicht-Modell verknüpfen.",
    "text": "Für eine gleichmäßige Dämmschicht berechnest du den Wärmedurchlasswiderstand mit R = d / λ. Die Dicke d steht in Metern. Im bewusst vereinfachten Ein-Schicht-Modell wird anschließend U = 1 / R gesetzt. Bei vorgegebenem λ von 0,035 und 0,20 Metern Dicke erhältst du R von ungefähr 5,71 und U von ungefähr 0,175 in den zugehörigen Einheiten. Das ist eine Modellrechnung, kein vollständiger Bauteilnachweis. Weitere Schichten, Wärmeübergänge, unterschiedliche Bereiche und der tatsächliche Materialzustand können zum Nachweis gehören. Alte und neue Dämmung werden nur dann gemeinsam angesetzt, wenn ihre Eigenschaften dafür geeignet bekannt sind. Schreibe Modellannahmen und vorgegebenen Zielwert deshalb direkt neben den Rechenweg.",
    "frage": "Warum wird das Ergebnis 0,175 nicht ohne Weiteres als vollständiger Dachnachweis bezeichnet?",
    "antwort": "Die Rechnung berücksichtigt nur die bezeichnete gleichmäßige Dämmschicht. Ein vollständiger Nachweis benötigt den tatsächlichen Bauteilaufbau und seine maßgebenden Bedingungen.",
    "fall": [
      "Eine 20-cm-Schicht wird in R = d / λ mit der Zahl 20 eingesetzt.",
      "Zuerst umrechnen und d = 0,20 m einsetzen.",
      "Die Einheit der Dicke spielt in der Widerstandsformel keine Rolle."
    ],
    "aufgaben": [
      54,
      55,
      56,
      65
    ]
  },
  {
    "n": 21,
    "titel": "Erhalt und Komplettsanierung begründet vergleichen",
    "ziel": "technische Eignung, Rückbau und Folgerisiken verschiedener Sanierungswege abwägen.",
    "text": "Bei einer Komplettsanierung werden die vorgesehenen alten Schichten zurückgebaut und durch einen neuen geeigneten Aufbau ersetzt. Das ermöglicht eine durchgängige Neuplanung, verursacht aber Aufwand für Rückbau, Entsorgung und Wiederaufbau. Der Erhalt geeigneter Bestandsschichten kann Material und Arbeit sparen. Er verlangt jedoch eine belastbare Zustandsprüfung und einen passenden Ergänzungsaufbau. Durchfeuchtete oder ungeeignete Schichten dürfen nicht allein wegen einer kurzfristigen Kostenersparnis unbewertet bleiben. Vergleiche die Varianten anhand desselben Sanierungsziels: Dichtheit, Wärme- und Feuchteschutz, Lasten, Details und Betrieb. Noch offene Untersuchungen bleiben in der Beratung sichtbar. Die Entscheidung entsteht aus den konkreten Befunden und Anforderungen; weder vollständiger Rückbau noch Erhalt ist pauschal immer die richtige Lösung.",
    "frage": "Welche Voraussetzung unterscheidet einen sinnvollen Schichterhalt von einer bloßen Sparmaßnahme?",
    "antwort": "Die Bestandsprüfung muss die weitere Eignung der erhaltenen Schichten für den geplanten Aufbau belegen. Sonst werden Schäden und Risiken nur verdeckt.",
    "fall": [
      "Großflächig geschädigte Dämmung soll allein wegen des billigeren Angebots ungeprüft überbaut werden.",
      "Technische Eignung und Risiken untersuchen und die Sanierungsvarianten transparent vergleichen.",
      "Der niedrigere Angebotspreis beweist automatisch die Eignung aller alten Schichten."
    ],
    "aufgaben": [
      62,
      63,
      64,
      70
    ]
  }
];
const LF17_KAPITEL = kurs("lf17", LF17_REDAKTION, [["Inspektion, Auftrag und systematische Befunde", [1, 2, 5, 6]], ["Sicherung, Pflege und örtliche Reparatur", [4, 7, 8, 9]], ["Sanierungsumfang und geeigneter Bestand", [3, 16, 17, 21]], ["Arbeitsfolge und neue Funktionsschichten", [10, 11, 12, 13]], ["Projekt, Mengen und Wärmerechnung", [14, 15, 18, 19, 20]]]);

export const DETAIL_KURSE: Record<string, LernKapitel[]> = {
  lf13a: LF13A_KAPITEL, lf13b: LF13B_KAPITEL, lf14: LF14_KAPITEL,
  lf15: LF15_KAPITEL, lf16: LF16_KAPITEL, lf17: LF17_KAPITEL,
};
