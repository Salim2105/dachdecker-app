import type { PraxisBlatt } from "@/lib/praxisVorbereitung";
import type { WerkstattPfadId } from "@/lib/werkstattTypen";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import { werkstattSchemaSvg } from "@/lib/werkstattWiederholung";

export const WERKSTATT_PRAXIS_THEMEN = [
  {id:"werkstatt-falzziegel",titel:"Werkstatt: Falzziegel praktisch üben",pfadId:"falzziegel"},
  {id:"werkstatt-biber-doppel",titel:"Werkstatt: Biberschwanz-Doppeldeckung praktisch üben",pfadId:"biber-doppel"},
] as const;

export function werkstattPraxisBlatt(thema:string):PraxisBlatt|undefined {
  const t=WERKSTATT_PRAXIS_THEMEN.find(x=>x.id===thema);
  if(!t)return undefined;
  const pfad=WERKSTATT_PFADE.find(p=>p.id===t.pfadId)!;
  const biber=t.pfadId==="biber-doppel";
  return {
    thema:t.id,version:pfad.version,titel:t.titel,
    auftrag:`Bereite ein bodennahes Übungsfeld für ${biber?"Biberschwanz-Doppeldeckung":"Falzziegel"} vor. Übertrage den Ablauf des Werkstatttrainings auf das tatsächlich vorhandene Material. Kläre Produktangaben und Arbeitsanweisung mit Betrieb oder Schule, teile das Feld ein, plane Passstücke und kontrolliere das Ergebnis.`,
    angaben:[pfad.systemkarte.hinweis,...pfad.systemkarte.angaben,"Die digitalen Modellmaße dienen dem Verständnis. Für das reale Übungsstück werden Produkt, Maße, Einteilung und Befestigung vor Ort festgelegt."],
    svg:werkstattSchemaSvg(t.pfadId as WerkstattPfadId,"breiten"),
    werkzeuge:["Maßband oder Gliedermaßstab, Winkel und Richtlatte","Markiermittel und Richtschnur","Zum konkreten Produkt und zur Arbeitsanweisung passende Bearbeitungswerkzeuge","Passende Hilfsmittel für sichere Auflage und Materialtransport"],
    material:[biber?"Passende Biberschwanzziegel und erforderliche Rand-/Passstücke":"Zusammengehörige Falzziegel mit den erforderlichen Rand-/Passstücken","Freigegebenes bodennahes Übungsmodell mit festgelegten Bezugskanten","Zum Produkt und Untergrund passende Befestigungsmittel nach vorliegendem Plan","Produkt-/Verlegeunterlagen, Arbeitsanweisung und Kontrollbogen"],
    sicherheit:["Arbeitsplatz, Materialtransport und standsichere Auflage vor Beginn mit der betreuenden Person abstimmen.","Bearbeitung erst nach Unterweisung und nach der konkreten Arbeitsanweisung üben; erforderlichen Staub-, Augen- und weiteren Schutz festlegen.","Bruchstücke, scharfe Kanten und Werkzeuge sicher ablegen; während der Übung den Arbeitsbereich geordnet halten."],
    ablauf:["Auftrag, Produkt, Bezugskanten und tatsächliche Maße am Übungsmodell klären.","Ziegelmerkmale und wirksame Deckmaße anhand des vorhandenen Produkts prüfen.","Längen- und Breiteneinteilung markieren und durch Gegenmessung kontrollieren.","Wasserweg und betroffene Funktionsebenen am Modell erklären.",biber?"Reihen mit der vorgesehenen Überdeckung und dem Fugenversatz der Doppeldeckung aufbauen.":"Die Reihen im vorgegebenen Verlegeschema herstellen und Aufhängung sowie Falzschluss prüfen.","Passstücke am Einbauort aufnehmen, Nutzstück kennzeichnen und die Bearbeitung mit der betreuenden Person abstimmen.","Nach Einweisung mit dem freigegebenen Verfahren bearbeiten und die Funktion des fertigen Stücks kontrollieren.","Nach dem vorliegenden Plan befestigen, die gesamte Fläche kontrollieren und Abweichungen besprechen."],
    kontrolle:["Bezugskanten, Maße und Einteilung stimmen mit den festgelegten Übungsangaben überein.",biber?"Fugenversatz und Überdeckung passen zur vorgegebenen Doppeldeckung.":"Aufhängung, Ausrichtung und Falzschluss sitzen im dargestellten Produktsystem passend.","Passstücke sind sinnvoll angezeichnet; Auflage, Wasserführung und Befestigung sind geklärt.","Die Befestigung stimmt mit dem konkreten Plan und den verwendeten Produkten überein.","Fehler und vorgenommene Korrekturen sind dokumentiert und nachkontrolliert."],
    gespraech:["Welche Bezugskanten und Produktangaben waren für deine Einteilung entscheidend?",biber?"Wie erkennst du Doppeldeckung, und was würdest du für Kronendeckung anders einteilen?":"Wie hängen Deckmaß, Aufhängung und Falzschluss an deinem Ziegel zusammen?","Welches Stück bleibt beim Zuschnitt erhalten, und welche Funktion muss es noch erfüllen?","Welche Abweichung hast du gefunden, wie hast du sie korrigiert und anschließend kontrolliert?"],
    zeichenAuftrag:`Skizziere dein Übungsfeld für ${biber?"Biberschwanz-Doppeldeckung":"Falzziegel"}. Beschrifte Bezugskanten, mindestens zwei Reihen, einen geplanten Zuschnitt und die laut Übungsplan vorgesehenen Befestigungen.`,
    zeichenKriterien:["Deckungsart und Bezugskanten sind eindeutig beschriftet.",biber?"Reihenversatz und Überdeckung der Doppeldeckung sind erkennbar.":"Reihenlage und ineinandergreifende Ziegelbereiche sind erkennbar.","Schnittlinie, erhaltenes Nutzstück und Befestigungsmöglichkeit sind benannt.","Angaben aus dem realen Übungsauftrag sind von digitalen Modellwerten unterschieden."],
    musterSvg:werkstattSchemaSvg(t.pfadId as WerkstattPfadId,"befestigen"),
  };
}
