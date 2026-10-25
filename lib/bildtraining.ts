import type { Bewertung } from "@/content/schema";
import { bewerteAktivitaet, istAktivitaetVollstaendig, starteAktivitaet, type Aktivitaet, type AktivitaetAntwort } from "@/lib/aktivitaeten";
import { appStorage } from "@/lib/lernSpeicher";
import { istLernHinweis, type LernHinweis } from "@/lib/lernHinweise";

export type BildProjekt = "ziegeldach" | "flachdach" | "sanierung" | "schiefer" | "metalldach" | "fassade";
export type BildAufgabenArt = "bauteile" | "folge" | "fehler" | "massnahme";
export interface BildBereich { id: string; nummer: number; x: number; y: number }
export interface BildAufgabe {
  id: string; version: number; projektId: BildProjekt; art: BildAufgabenArt; titel: string;
  lernziel: string; lernzielIds: string[]; lfIds: string[]; minuten: number;
  svg: string; bildbeschreibung: string; bildbereiche: BildBereich[]; aktivitaet: Aktivitaet;
}
export const BILD_THEMEN: { id: BildProjekt; titel: string; lfIds: string[] }[] = [
  {id:"ziegeldach",titel:"Ziegeldach",lfIds:["lf02","lf08"]},
  {id:"flachdach",titel:"Flachdach und Ablauf",lfIds:["lf07","lf10","lf14"]},
  {id:"sanierung",titel:"Sanierung und Feuchte",lfIds:["lf17","anhang2"]},
  {id:"schiefer",titel:"Schiefer und Durchdringung",lfIds:["lf09","lf13a"]},
  {id:"metalldach",titel:"Metalldeckung",lfIds:["lf12","anhang3"]},
  {id:"fassade",titel:"Fassade und Fenster",lfIds:["lf11","lf15"]},
];
const ink="currentColor", orange="#b94f2d", blue="#287c91";
function text(x:number,y:number,s:string,size=17){return `<text x="${x}" y="${y}" font-size="${size}" fill="currentColor">${s}</text>`;}
function mark(x:number,y:number,n:number){return `<circle cx="${x}" cy="${y}" r="15" fill="var(--surface,white)" stroke="currentColor" stroke-width="2"/><text x="${x}" y="${y+5}" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${n}</text>`;}
function frame(titel:string,body:string){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 310" role="img" aria-label="${titel}"><title>${titel}</title><g font-family="sans-serif" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;}
const bereiche: Record<BildProjekt, [number,number][]> = {
  ziegeldach:[[490,65],[490,115],[490,165],[490,215]],
  flachdach:[[240,75],[240,130],[240,185],[240,240]],
  sanierung:[[450,65],[450,115],[450,175],[450,235]],
  schiefer:[[320,50],[185,143],[320,225],[490,265]],
  metalldach:[[210,75],[310,170],[425,245],[510,245]],
  fassade:[[130,120],[245,120],[360,120],[490,120]],
};
/** Own explanatory drawings. Number positions are also accessible as ordinary list controls. */
function schema(projekt:BildProjekt,art:BildAufgabenArt):string {
 let body="";
 const fehler=art==="fehler",befund=art==="massnahme", nummern=art==="bauteile";
 if(projekt==="ziegeldach") {
   body=`<path d="M65 55H555" stroke="${orange}" stroke-width="18"/><path d="M65 105H555" stroke="#ac814e" stroke-width="15"/><path d="M120 140V170M250 140V170M380 140V170M510 140V170" stroke="#ac814e" stroke-width="16"/><path d="M65 205H${fehler?"285":"555"}" stroke="${blue}" stroke-width="7"/>${text(65,278,"Schichten auseinandergezogen · außen oben")}`;
   if(fehler)body+=`<path d="M300 205H555" stroke="${orange}" stroke-width="6" stroke-dasharray="8 10"/>${text(65,25,"Unterdeckung endet offen vor dem nächsten Abschnitt")}`;
   if(befund)body+=`<path d="M260 42l18 13-14 13 20 15" fill="none" stroke="${ink}" stroke-width="5"/><circle cx="276" cy="58" r="39" fill="none" stroke="${orange}" stroke-width="4"/>${text(65,25,"Befund: Riss in einem Deckelement")}`;
 }else if(projekt==="flachdach") {
   body=`<path d="M70 35V260H565" fill="none" stroke="${ink}" stroke-width="9"/><path d="M85 45V80H565" fill="none" stroke="${blue}" stroke-width="7"/><rect x="90" y="105" width="470" height="55" fill="var(--tint-yellow,#f5eac2)" stroke="${ink}"/><path d="M90 185H565" stroke="${blue}" stroke-width="5" stroke-dasharray="12 6"/><rect x="90" y="215" width="470" height="45" fill="var(--tint-violet,#e8dffd)" stroke="${ink}"/>${text(90,293,"Schematischer nicht belüfteter Beispielaufbau")}`;
   if(fehler)body+=`<path d="M85 78h70" stroke="var(--surface,white)" stroke-width="13"/><path d="M85 78h70" stroke="${orange}" stroke-width="6" stroke-dasharray="5 8"/>${text(160,40,"Offene Lücke im Anschluss der Abdichtung")}`;
   if(befund)body+=`<rect x="325" y="50" width="200" height="22" rx="8" fill="#9bd5e8"/><path d="M450 79v50" stroke="${ink}" stroke-width="8"/><path d="M430 66l35 22m-35 0 35-22" stroke="${orange}" stroke-width="7"/>${text(150,30,"Wasseransammlung · Ablauf sichtbar zugesetzt")}`;
 }else if(projekt==="sanierung") {
   body=`<path d="M75 60H550" stroke="${orange}" stroke-width="18"/><rect x="75" y="95" width="475" height="45" fill="var(--tint-yellow,#f5eac2)" stroke="${ink}"/><path d="M75 175H${fehler?"270":"550"}" stroke="${blue}" stroke-width="7"/><path d="M75 235H550" stroke="${ink}" stroke-width="12"/>${text(75,288,"Beispiel-Dachaufbau · außen oben, innen unten")}`;
   if(fehler)body+=`<path d="M305 175H550" stroke="${blue}" stroke-width="7"/><path d="M285 225v-90m-10 12 10-12 10 12" stroke="${orange}" stroke-width="4" fill="none"/>${text(75,28,"Offene Stelle in der inneren luftdichten Ebene")}`;
   if(befund)body+=`<ellipse cx="270" cy="235" rx="75" ry="18" fill="#9bd5e8" stroke="${blue}"/><path d="M245 253l-6 15m37-15-6 15m37-15-6 15" stroke="${blue}" stroke-width="4"/>${text(75,28,"Beobachtung: Feuchtefleck an der Innenbekleidung")}`;
 }else if(projekt==="schiefer") {
   body=`<path d="M65 245L320 20L575 245Z" fill="var(--tint-violet,#e8dffd)" stroke="${ink}" stroke-width="3"/><rect x="240" y="80" width="160" height="110" fill="var(--surface,white)" stroke="${ink}" stroke-width="4"/><path d="M225 65H415M225 65V200M415 65V200M225 205H415" fill="none" stroke="${blue}" stroke-width="10"/><path d="M450 265H565" stroke="${blue}" stroke-width="5" stroke-dasharray="8 6"/>${text(68,292,"Ansicht von außen · Unterdeckung als Ausschnitt rechts")}`;
   if(fehler)body+=`<path d="M450 265H495" stroke="var(--surface,white)" stroke-width="11"/><path d="M450 265H495" stroke="${orange}" stroke-width="5" stroke-dasharray="4 7"/>${text(75,25,"Die untere Schutzebene endet am Anschluss offen")}`;
   if(befund)body+=`<path d="M160 190l15-13 14 19-12 14Z" fill="var(--surface,white)" stroke="${orange}" stroke-width="4"/>${text(75,25,"Eine Platte neben der Durchdringung ist beschädigt")}`;
 }else if(projekt==="metalldach") {
   body=`<rect x="75" y="40" width="490" height="165" fill="var(--tint-teal,#d9f0e9)" stroke="${ink}" stroke-width="3"/><path d="M210 40V205M410 40V205" stroke="${ink}" stroke-width="9"/><path d="M185 70h50m-50 55h50m150-55h50m-50 55h50" stroke="${orange}" stroke-width="4"/><path d="M390 245h65v-22m-65 22v-18" stroke="${ink}" stroke-width="5" fill="none"/><path d="M480 265h80" stroke="${blue}" stroke-width="8"/>${text(75,292,"Deckfläche · unten Ausschnitte von Haft und Unterlage")}`;
   if(fehler)body+=`<path d="M90 45h100m-100 150h100" stroke="${orange}" stroke-width="9"/><path d="M130 70v100m-8-12 8 12 8-12" stroke="${blue}" stroke-width="4" fill="none"/>${text(90,25,"Fehlerbeispiel: beide Enden ohne Bewegungsmöglichkeit fixiert")}`;
   if(befund)body+=`<path d="M405 135l20 25-20 30" fill="none" stroke="${orange}" stroke-width="7"/>${text(90,25,"Befund: verformter Falzbereich")}`;
 }else {
   body=`<path d="M130 40v205" stroke="${orange}" stroke-width="22"/><path d="M195 40v205M285 40v205" stroke="${ink}" stroke-width="2" stroke-dasharray="5 7"/><rect x="310" y="40" width="110" height="165" fill="var(--tint-yellow,#f5eac2)" stroke="${ink}"/><rect x="455" y="40" width="90" height="165" fill="var(--tint-violet,#e8dffd)" stroke="${ink}"/><path d="M240 210v-45m-8 10 8-10 8 10" stroke="${blue}" stroke-width="4" fill="none"/>${text(80,286,"Fassadenschnitt · außen links, innen rechts")}`;
   if(fehler)body+=`<rect x="195" y="180" width="90" height="40" fill="${orange}"/><path d="M240 230v-60" stroke="${blue}" stroke-width="4" stroke-dasharray="5 7"/>${text(80,25,"Fehlerbeispiel: Lüftungsquerschnitt unten verschlossen")}`;
   if(befund)body+=`<path d="M95 240H450v-20" fill="none" stroke="${ink}" stroke-width="5"/><path d="M300 240h65" stroke="${orange}" stroke-width="9"/>${text(80,25,"Fensterbankanschluss im Schema mit offener Fuge")}`;
 }
 if(nummern)body+=bereiche[projekt].map(([x,y],i)=>mark(x,y,i+1)).join("");
 if(art==="folge")body+=text(75,20,"Betrachte Aufbau und Anschluss, bevor du die Arbeitsfolge ordnest.",15);
 return frame(`${BILD_THEMEN.find(t=>t.id===projekt)!.titel}: ${art}`,body);
}
interface BildRedaktion {
 projekt:BildProjekt; zuordnung:[string,string][]; beschreibung:string;
 folge:string[]; folgeErklaerung:string;
 fehler:string; fehlerOptionen:[string,boolean][]; fehlerErklaerung:string;
 befund:string; massnahmen:[string,boolean][]; massnahmeErklaerung:string;
}
const REDAKTION: BildRedaktion[] = [
  {
    projekt:"ziegeldach",
    zuordnung:[["Bildbereich 1","Dachziegeldeckung"],["Bildbereich 2","Traglattung"],["Bildbereich 3","Konterlattung"],["Bildbereich 4","Unterdeckung"]],
    beschreibung:"Vier auseinandergezogene Ebenen eines schematischen Ziegeldachs: oben die Deckelemente, darunter quer liegende Latten, darunter eine weitere Lattung und unten eine durchgehende dünne Schutzebene. Außen ist oben. Die Nummern 1 bis 4 stehen jeweils an einer Ebene.",
    folge:["Maße und vorgesehenen Dachaufbau aus dem Plan klären","Produkt und wirksame Deckmaße bestimmen","Reiheneinteilung und passende Lattweite ermitteln","Materialmengen einschließlich Randteilen planen","Die Einteilung an den ersten Reihen kontrollieren"],
    folgeErklaerung:"Planung und Produkt bestimmen die Einteilung. Erst auf dieser Grundlage lässt sich der Materialbedarf nachvollziehbar bestimmen; der Beginn der Deckung dient zur Kontrolle.",
    fehler:"In der Lernskizze endet die Unterdeckung offen. Der rechte Anschlussbereich ist nur gestrichelt dargestellt.",
    fehlerOptionen:[["Die untere Schutzebene ist im gezeigten Bereich unterbrochen.",true],["Eine vollständig geplante Deckung muss auch den Anschluss der unteren Ebene berücksichtigen.",true],["Die Deckziegel ersetzen grundsätzlich jeden Anschluss der Unterdeckung.",false]],
    fehlerErklaerung:"Die Deckung und eine darunterliegende Schutzebene erfüllen unterschiedliche Aufgaben. Ein sichtbarer oberer Abschluss beweist keinen vollständigen unteren Anschluss.",
    befund:"Ein Deckelement zeigt einen sichtbaren Riss. Der Zustand der darunterliegenden Ebenen ist in dieser Skizze nicht erkennbar.",
    massnahmen:[["Den Schaden und den betroffenen Bereich erfassen.",true],["Den Zustand der darunterliegenden Ebenen und den passenden Austausch prüfen.",true],["Aus dem einzelnen Riss sicher schließen, dass der ganze Dachaufbau trocken ist.",false],["Jeden beliebigen Ziegel ohne Prüfung von Deckmaß und System einsetzen.",false]],
    massnahmeErklaerung:"Ein Riss ist ein Befund. Für eine passende Instandsetzung müssen betroffene Ebenen und das vorhandene Decksystem betrachtet werden.",
  },
  {
    projekt:"flachdach",
    zuordnung:[["Bildbereich 1","Abdichtung mit aufgehender Anschlussführung"],["Bildbereich 2","Wärmedämmung"],["Bildbereich 3","Dampfbremsebene"],["Bildbereich 4","Tragschale"]],
    beschreibung:"Schematischer nicht belüfteter Beispielaufbau mit aufgehender Wand links. Die oberste dünne Ebene führt an der Wand hoch. Darunter liegen eine dicke Dämmlage, eine weitere dünne Ebene und unten die Tragschale. Die Nummern folgen von außen nach innen.",
    folge:["Tragschale, Untergrund und Detailplanung prüfen","Die vorgesehene Dampfbremsebene einschließlich Anschlüssen herstellen","Die geplante Dämmlage und Gefälleführung ausführen","Abdichtung mit den vorgesehenen Anschlüssen und Abläufen herstellen","Durchgängigkeit der Wasserwege und Anschlüsse kontrollieren"],
    folgeErklaerung:"Diese Reihenfolge gehört zum hier dargestellten Beispielaufbau. Die wasserführende obere Ebene muss in die Anschlüsse und Abläufe übergehen; andere Dachaufbauten können andere Schichtenfolgen haben.",
    fehler:"Direkt neben der aufgehenden Wand ist die obere Abdichtung offen unterbrochen. Eine gestrichelte rote Linie kennzeichnet die fehlende Verbindung.",
    fehlerOptionen:[["Der Anschluss an die Fläche ist in der dargestellten Abdichtung unvollständig.",true],["Ein geschlossen wirkender Wandrand allein beweist noch keinen dichten Anschluss.",true],["Die dicke Dämmlage übernimmt ohne Weiteres die Aufgabe der Abdichtung.",false]],
    fehlerErklaerung:"Die obere wasserführende Ebene muss den Übergang durchgängig bilden. Wärmedämmung ist für sich kein Ersatz für den geplanten Abdichtungsanschluss.",
    befund:"Auf der Fläche ist Wasser dargestellt. Am Einlauf des Ablaufs liegt eine sichtbare Verstopfung. Die Skizze enthält keine hydraulische Bemessung.",
    massnahmen:[["Den Abflussweg und die sichtbare Verstopfung prüfen.",true],["Auch den vorgesehenen Notwasserweg und mögliche Folgen des Aufstaus betrachten.",true],["Allein aus der Pfütze eine bestimmte neue Rohrgröße festlegen.",false],["Ohne weitere Prüfung eine beschädigte Dampfbremse als sichere Ursache nennen.",false]],
    massnahmeErklaerung:"Der sichtbare Befund führt zuerst zur Prüfung des Wasserwegs. Eine Bemessung oder eine andere Schadensursache lässt sich daraus allein nicht ableiten.",
  },
  {
    projekt:"sanierung",
    zuordnung:[["Bildbereich 1","Vorhandene Deckung"],["Bildbereich 2","Dämmlage"],["Bildbereich 3","Innere luftdichte Ebene"],["Bildbereich 4","Innenbekleidung"]],
    beschreibung:"Auseinandergezogener schematischer Dachaufbau. Außen liegt oben eine vorhandene Deckung. In der Mitte sind eine dicke Dämmlage und darunter eine dünne innere Ebene dargestellt. Die Innenbekleidung liegt unten. Die vier Nummern bezeichnen diese Ebenen.",
    folge:["Den vorhandenen Aufbau und die Nutzung aufnehmen","Sichtbare Befunde und ihre Lage dokumentieren","Mögliche Ursachen mit geeigneten Prüfungen unterscheiden","Die abgestimmte Sanierungsmaßnahme für den ganzen Anschluss planen","Ausführung und behandelte Ursache anschließend kontrollieren"],
    folgeErklaerung:"Eine Sanierung beginnt mit dem Bestand. Beobachtung, Ursachenprüfung und Maßnahmenplanung sind getrennte Schritte; ein Fleck allein bestimmt noch keine passende Reparatur.",
    fehler:"Die innere luftdichte Ebene hat in der Mitte eine sichtbare offene Stelle. Ein Pfeil zeigt durch diese Lücke in Richtung Dachaufbau.",
    fehlerOptionen:[["Die dargestellte luftdichte Ebene ist nicht durchgängig.",true],["Die Anschlussstelle muss bei der Planung der Luftdichtheit berücksichtigt werden.",true],["Ein größerer Dachziegel schließt automatisch die innere Lücke.",false]],
    fehlerErklaerung:"Die Unterbrechung betrifft die innere Ebene. Eine Änderung allein an der äußeren Deckung stellt deren Durchgängigkeit nicht her.",
    befund:"An der Innenbekleidung ist ein Feuchtefleck dargestellt. Herkunft und Zeitpunkt der Feuchtigkeit sind noch unbekannt.",
    massnahmen:[["Lage, zeitlichen Verlauf und Begleitumstände des Flecks erfassen.",true],["Wassereintritt und Feuchtetransport durch Luftundichtheiten als mögliche Ursachen gezielt prüfen.",true],["Allein anhand des Flecks Tauwasser als bewiesene Ursache angeben.",false],["Den Fleck nur überstreichen und die Ursachenprüfung damit ersetzen.",false]],
    massnahmeErklaerung:"Feuchte kann verschiedene Wege haben. Erst die Untersuchung trennt Befund und Ursache; die passende Maßnahme richtet sich anschließend nach dem Ergebnis.",
  },
  {
    projekt:"schiefer",
    zuordnung:[["Bildbereich 1","Bergseitiger Anschluss"],["Bildbereich 2","Seitlicher Anschluss"],["Bildbereich 3","Unterer Anschluss"],["Bildbereich 4","Unterdeckung im Ausschnitt"]],
    beschreibung:"Dachansicht mit einer mittigen rechteckigen Durchdringung. Eine Linie liegt oberhalb der Durchdringung, Linien verlaufen seitlich und eine Linie unterhalb. Rechts unten ist die untere Schutzebene separat als gestrichelter Ausschnitt dargestellt.",
    folge:["Durchdringung und vorhandenen Dachaufbau aufnehmen","Wasserwege auf Deckung und darunterliegender Ebene verfolgen","Das abgestimmte Anschlussdetail und passende Werkstoffe festlegen","Unterdeckung sowie sichtbare Anschlüsse zusammenhängend herstellen","Wasserführung und angrenzende Deckplatten kontrollieren"],
    folgeErklaerung:"An der Durchdringung werden mehrere Ebenen unterbrochen. Die Anschlüsse müssen gemeinsam geplant werden; das sichtbare Blech zeigt nur einen Teil des Details.",
    fehler:"Der Ausschnitt der unteren Schutzebene zeigt eine offene Lücke am Anschluss. Die sichtbaren äußeren Anschlüsse sind dagegen eingezeichnet.",
    fehlerOptionen:[["Die untere Schutzebene hat im Ausschnitt einen offenen Anschluss.",true],["Sichtbare äußere Anschlusslinien beweisen allein keinen vollständigen unteren Anschluss.",true],["Die offene untere Stelle ist wegen der sichtbaren oberen Linien automatisch funktionsfähig.",false]],
    fehlerErklaerung:"Ein Anschluss muss für jede betroffene Funktionsebene betrachtet werden. Eine vorhandene obere Verwahrung schließt eine Lücke der Unterdeckung nicht automatisch.",
    befund:"Neben der Durchdringung ist eine beschädigte Deckplatte markiert. Die Skizze zeigt weder den Zustand aller Befestigungen noch die Unterdeckung vollständig.",
    massnahmen:[["Die beschädigte Platte und den Zustand benachbarter Befestigungen erfassen.",true],["Den betroffenen Anschluss und die darunterliegende Ebene in die Prüfung einbeziehen.",true],["Aus dem Bild die vollständige Schadensfreiheit aller verdeckten Teile bestätigen.",false],["Eine beliebige Plattenform ohne Prüfung der Deckung als Ersatz wählen.",false]],
    massnahmeErklaerung:"Plattenform, Befestigung und Anschluss hängen zusammen. Eine sichtbare Beschädigung wird deshalb im vorhandenen Deck- und Anschlusssystem beurteilt.",
  },
  {
    projekt:"metalldach",
    zuordnung:[["Bildbereich 1","Stehfalz"],["Bildbereich 2","Scharfläche"],["Bildbereich 3","Haft im Detailausschnitt"],["Bildbereich 4","Unterlage im Detailausschnitt"]],
    beschreibung:"Ansicht einer Metalldeckung mit zwei senkrechten erhabenen Falzlinien und den Flächen dazwischen. Kleine Querzeichen markieren Befestigungsbereiche. Unten sind ein Haft und die Unterlage schematisch getrennt dargestellt.",
    folge:["Decksystem, Werkstoff und Dachgeometrie zuordnen","Bewegungswege und Befestigungsplanung klären","Unterlage und geplante Hafte vorbereiten","Scharen und Falze systemgerecht ausbilden","Bewegungsmöglichkeiten und Detailanschlüsse kontrollieren"],
    folgeErklaerung:"Metall bewegt sich bei Temperaturänderung. Befestigung und Bewegungsplanung müssen vor der flächigen Ausführung geklärt sein und zum jeweiligen Decksystem passen.",
    fehler:"Das Fehlerbeispiel bezeichnet beide Scharenden ausdrücklich als starr fixiert. Der eingezeichnete Bewegungspfeil hat damit keinen vorgesehenen Ausgleichsweg.",
    fehlerOptionen:[["Eine beidseitig starre Fixierung kann die geplante Längenbewegung behindern.",true],["Befestigungs- und Bewegungsplanung müssen zum gewählten System passen.",true],["Wärmedehnung entfällt bei einer beidseitigen Fixierung des Metalls.",false]],
    fehlerErklaerung:"Die Temperaturbewegung des Werkstoffs verschwindet nicht durch eine starre Fixierung. Die Befestigung muss die im System vorgesehene Lastabtragung und Bewegung gemeinsam ermöglichen.",
    befund:"Ein Falzbereich ist sichtbar verformt. Ursache, verdeckte Befestigung und Temperaturzustand sind aus der Skizze nicht vollständig bekannt.",
    massnahmen:[["Lage und Ausmaß der Verformung sowie die Randbedingungen erfassen.",true],["Befestigungen, Bewegungswege und Anschlüsse gezielt prüfen.",true],["Aus dem Bild eine einzige Ursache als bewiesen erklären.",false],["Befestigungen ohne abgestimmte Planung beliebig lösen.",false]],
    massnahmeErklaerung:"Eine Verformung ist ein Befund. Für die Beurteilung braucht es unter anderem das Befestigungssystem, die Geometrie und die möglichen Bewegungswege.",
  },
  {
    projekt:"fassade",
    zuordnung:[["Bildbereich 1","Außenbekleidung"],["Bildbereich 2","Hinterlüftungsraum"],["Bildbereich 3","Wärmedämmung"],["Bildbereich 4","Tragende Wand"]],
    beschreibung:"Schematischer Schnitt einer hinterlüfteten Fassade. Außen links steht die dünne Bekleidung. Es folgen ein offener Raum mit Luftstrompfeil, die Dämmlage und rechts die tragende Wand. Die Schichten sind zur Erklärung auseinandergezogen.",
    folge:["Untergrund und abgestimmten Fassadenaufbau prüfen","Unterkonstruktion und Dämmlage nach Planung herstellen","Vorgesehene Zu- und Abluftwege sowie Anschlussdetails sichern","Bekleidung mit den vorgesehenen Befestigungen montieren","Lüftungswege und An- und Abschlüsse abschließend kontrollieren"],
    folgeErklaerung:"Bei einer hinterlüfteten Fassade bleiben Tragfunktion, Wärmeschutz, Bekleidung und Lüftungsweg unterscheidbar. Die Schichtenfolge allein beschreibt noch nicht alle Anschlussdetails.",
    fehler:"Am unteren Rand ist der Luftquerschnitt durch einen roten Block vollständig verschlossen. Der Luftstrompfeil trifft auf diese Sperre.",
    fehlerOptionen:[["Der dargestellte untere Lüftungsweg ist verschlossen.",true],["Ein vorgesehener Lüftungsquerschnitt muss im Anschlussdetail erhalten bleiben.",true],["Ein verschlossener Lüftungsraum erfüllt automatisch dieselbe Funktion wie ein offener.",false]],
    fehlerErklaerung:"Der Anschluss muss zum hinterlüfteten Aufbau passen. Eine geschlossene untere Öffnung unterbricht den vorgesehenen Zu- beziehungsweise Abluftweg.",
    befund:"Im schematischen Fensterbankanschluss ist eine offene Fuge markiert. Die vollständige Anschlussgeometrie ist nicht dargestellt.",
    massnahmen:[["Die markierte Fuge und den geplanten Wasserweg am Fensteranschluss prüfen.",true],["Seitliche und darunterliegende Anschlussbereiche mitbetrachten.",true],["Aus dem schmalen Bildausschnitt den gesamten Anschluss als mangelfrei bestätigen.",false],["Den vorgesehenen Hinterlüftungsraum als beliebige Fugenfüllung benutzen.",false]],
    massnahmeErklaerung:"Am Fenster treffen Wasserführung und Fassadenaufbau zusammen. Eine Maßnahme muss die Funktionen des vollständigen Details berücksichtigen.",
  },
];
const ART_TITEL:Record<BildAufgabenArt,string>={bauteile:"Bauteildetektiv",folge:"Die richtige Arbeitsfolge",fehler:"Finde den Skizzenfehler",massnahme:"Vom Befund zur passenden Prüfung"};
const ARTEN:BildAufgabenArt[]=["bauteile","folge","fehler","massnahme"];
function erstelleBildAufgabe(r:BildRedaktion,art:BildAufgabenArt):BildAufgabe {
 const id=`bild-${r.projekt}-${art}`;
 const thema=BILD_THEMEN.find(t=>t.id===r.projekt)!;
 const basis={id:`${id}-aktiv`,version:1,titel:ART_TITEL[art],auftrag:"",erklaerung:""};
 let aktivitaet:Aktivitaet;
 if(art==="bauteile")aktivitaet={...basis,typ:"zuordnen",auftrag:"Ordne jeder Nummer die passende Bezeichnung zu. Die Bildknöpfe führen zum zugehörigen Auswahlfeld.",erklaerung:"Verfolge jede nummerierte Ebene im Bild. Außen und innen sowie Hauptansicht und Detailausschnitt sind ausdrücklich angegeben.",paare:r.zuordnung.map(([links,rechts],i)=>({id:`p${i+1}`,links,rechts}))};
 else if(art==="folge")aktivitaet={...basis,typ:"reihenfolge",auftrag:"Ordne die Schritte mit den Pfeilknöpfen. Die Reihenfolge beschreibt das ausdrücklich dargestellte Lernbeispiel.",erklaerung:r.folgeErklaerung,schritte:r.folge.map((text,i)=>({id:`s${i+1}`,text}))};
 else aktivitaet={...basis,typ:art==="fehler"?"skizzenfehler":"baustellenfall",auftrag:"Wähle alle fachlich passenden Aussagen. Mehrere Antworten stimmen.",situation:art==="fehler"?r.fehler:r.befund,erklaerung:art==="fehler"?r.fehlerErklaerung:r.massnahmeErklaerung,optionen:(art==="fehler"?r.fehlerOptionen:r.massnahmen).map(([text,korrekt],i)=>({id:`o${i+1}`,text,korrekt}))};
 return {id,version:1,projektId:r.projekt,art,titel:`${thema.titel}: ${ART_TITEL[art]}`,lernziel:art==="bauteile"?"Du ordnest die nummerierten Bauteile ihrer Aufgabe im dargestellten Aufbau zu.":art==="folge"?"Du ordnest Planung, Herstellung und Kontrolle für das dargestellte Beispiel.":art==="fehler"?"Du erkennst die gezeigte Unterbrechung einer Funktion und begründest ihre Bedeutung.":"Du unterscheidest einen sichtbaren Befund von einer ungeprüften Ursache und wählst passende Prüfungen.",lernzielIds:[`${r.projekt}-${art}`],lfIds:thema.lfIds,minuten:art==="folge"?5:3,svg:schema(r.projekt,art),bildbeschreibung:art==="fehler"?r.fehler:art==="massnahme"?r.befund:r.beschreibung,bildbereiche:art==="bauteile"?bereiche[r.projekt].map(([x,y],i)=>({id:`p${i+1}`,nummer:i+1,x,y})):[],aktivitaet};
}
export const BILD_AUFGABEN:BildAufgabe[]=REDAKTION.flatMap(r=>ARTEN.map(art=>erstelleBildAufgabe(r,art)));
export function getBildAufgabe(id:string):BildAufgabe|undefined{return BILD_AUFGABEN.find(a=>a.id===id);}
export function pruefeBildAufgabe(a:BildAufgabe,antwort:AktivitaetAntwort):Bewertung {
 const r=bewerteAktivitaet(a.aktivitaet,antwort);
 return r.richtig?"richtig":r.erreicht>0?"teilweise":"falsch";
}
export interface BildStand {version:1;aufgabenVersion:number;antwort:AktivitaetAntwort;geprueft:boolean;notiz:string;hilfen:string[];versuchId:string;bewertetAm:number|null;abgeschlossen:boolean;nacharbeit?:LernHinweis[]}
export const bildStandKey=(id:string)=>`bildtraining-${id}-v1`;
export function neuerBildStand(a:BildAufgabe):BildStand{return {version:1,aufgabenVersion:a.version,antwort:starteAktivitaet(a.aktivitaet),geprueft:false,notiz:"",hilfen:[],versuchId:globalThis.crypto.randomUUID(),bewertetAm:null,abgeschlossen:false};}
export function leseBildStand(raw:string|null,a:BildAufgabe):BildStand|null {
 if(raw===null)return neuerBildStand(a);
 try{
  const s=JSON.parse(raw);
  if(s?.nacharbeit!==undefined&&(!Array.isArray(s.nacharbeit)||s.nacharbeit.length>12||!s.nacharbeit.every(istLernHinweis)))return null;
  if(!s||s.version!==1||s.aufgabenVersion!==a.version||(s.bewertetAm!==null&&(!Number.isFinite(s.bewertetAm)||s.bewertetAm<0))||typeof s.geprueft!=="boolean"||typeof s.notiz!=="string"||typeof s.abgeschlossen!=="boolean"||typeof s.versuchId!=="string"||!s.versuchId||!Array.isArray(s.hilfen)||!s.hilfen.every((h:unknown)=>typeof h==="string")||!s.antwort||typeof s.antwort.zuordnung!=="object"||!s.antwort.zuordnung||Array.isArray(s.antwort.zuordnung)||!Object.values(s.antwort.zuordnung).every(v=>typeof v==="string")||![s.antwort.reihenfolge,s.antwort.auswahl].every(v=>Array.isArray(v)&&v.every((t:unknown)=>typeof t==="string")))return null;
  const akt=a.aktivitaet;
  if(akt.typ==="zuordnen"&&Object.entries(s.antwort.zuordnung).some(([k,v])=>!akt.paare.some(p=>p.id===k)||(v!==""&&!akt.paare.some(p=>p.id===v))))return null;
  if(akt.typ==="reihenfolge"&&(s.antwort.reihenfolge.length!==akt.schritte.length||new Set(s.antwort.reihenfolge).size!==akt.schritte.length||!akt.schritte.every(p=>s.antwort.reihenfolge.includes(p.id))))return null;
  if((akt.typ==="baustellenfall"||akt.typ==="skizzenfehler")&&(new Set(s.antwort.auswahl).size!==s.antwort.auswahl.length||!s.antwort.auswahl.every((id:string)=>akt.optionen.some(o=>o.id===id))))return null;
  if(s.geprueft&&(!istAktivitaetVollstaendig(akt,s.antwort)||s.bewertetAm===null))return null;
  if(!s.geprueft&&s.bewertetAm!==null)return null;
  s.abgeschlossen=s.abgeschlossen&&s.geprueft;
  return s;
 }catch{return null;}
}
/** A read-only catalogue may show an empty status for unreadable drafts. The
 * editor uses leseBildStand directly and offers recovery before any overwrite. */
export function ladeBildStand(a:BildAufgabe):BildStand {return leseBildStand(appStorage.getItem(bildStandKey(a.id)),a)??neuerBildStand(a);}
