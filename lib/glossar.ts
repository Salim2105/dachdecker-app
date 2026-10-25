import { getAufgaben } from "@/lib/content";
import { getLernfelder } from "@/lib/lernfelder";
import { GLOSSAR_BILDER, WERKSTATT_BEGRIFFE, type GlossarBild } from "@/lib/glossarWerkstatt";

export interface GlossarEintrag {
  bild?: GlossarBild;
  id: string;
  begriff: string;
  einfach: string;
  fachdefinition?: string;
  beispiel: string;
  aliases: string[];
  quelle: string;
  quellen: string[];
  aufgabenIds: string[];
  lernfelder: string[];
}

// Die vorhandene Fachdefinition bleibt mit ihrer Quelle erhalten. Diese kurzen
// Erklärungen sind eine zusätzliche Sprachhilfe, keine neuen Ausführungsregeln.
const SPRACHHILFEN: Record<string, [einfach: string, beispiel: string]> = {
  "anhang1-019": ["Ein bereits benutztes Bauteil wird noch einmal eingebaut, statt weggeworfen zu werden.", "Unbeschädigte Dachziegel werden beim Umbau gereinigt und erneut verwendet."],
  "anhang1-049": ["Asbest ist ein früher verwendeter Baustoff mit sehr gefährlichen Fasern. Eingeatmete Fasern können Krebs verursachen.", "Bei einer alten Dachplatte mit Asbestverdacht wird die Arbeit vor einer Bearbeitung fachlich geklärt."],
  "anhang1-070": ["Aufbereitetes Material wird nach der Größe seiner Körner getrennt.", "Ein Sieb trennt kleine und große Körner aus aufbereitetem Bauschutt."],
  "anhang2-071": ["Der U-Wert beschreibt, wie viel Wärme durch ein Bauteil nach außen gelangt. Ein kleinerer Wert bedeutet bei gleichem Vergleich einen besseren Wärmeschutz.", "Du vergleichst zwei Dachaufbauten anhand ihrer berechneten U-Werte."],
  "anhang2-118": ["Der sd-Wert beschreibt, wie stark eine Schicht Wasserdampf bremst. Er wird in Metern angegeben.", "Du vergleichst den sd-Wert einer Unterdeckbahn mit dem einer Dampfbremse."],
  "anhang3-041": ["Zwei unterschiedliche Metalle und eine leitende Flüssigkeit können zusammen wie eine kleine Batterie wirken. Dabei kann ein Metall angegriffen werden.", "Bei verbundenen Metallteilen im Regen prüfst du die Verträglichkeit der Werkstoffe."],
  "lf01-002": ["Die VOB ist ein Regelwerk für das Vergeben, Vereinbaren und Abrechnen von Bauleistungen.", "Beim Aufmaß prüfst du, welche Abrechnungsregeln für den konkreten Auftrag vereinbart wurden."],
  "lf01-008": ["Der ZVDH vertritt das Dachdeckerhandwerk in Deutschland und gibt unter anderem Fachregeln heraus.", "Für die Planung einer Deckung schlägst du die passende Fachregel nach."],
  "lf01-012": ["Eine Linie teilt eine Strecke genau in der Mitte und steht im rechten Winkel auf ihr.", "Du konstruierst die Mitte eines Blechzuschnitts mit Zirkel und Lineal."],
  "lf01-016": ["Ein Messgerät, mit dem du auf der Baustelle rechte Winkel absteckst.", "Du steckst eine rechtwinklige Hilfslinie zum Gebäude ab."],
  "lf01-022": ["Der Maßstab sagt, wie stark eine Zeichnung verkleinert oder vergrößert ist.", "Bei 1:50 entsprechen 2 cm im Plan einer wirklichen Länge von 1 m."],
  "lf01-027": ["Material kommt erst dann auf die Baustelle, wenn es dort benötigt wird.", "Ein Lkw liefert die Dachziegel passend zum geplanten Krantermin."],
  "lf01-030": ["Ein gut sichtbarer Messstab markiert Punkte und hilft, gerade Linien abzustecken.", "Zwei Fluchtstäbe zeigen dir die Richtung einer Geraden."],
  "lf01-035": ["Wenn eine Linie zwei parallele Linien schneidet, sind die gleich liegenden Winkel gleich groß.", "Du überträgst einen Winkel auf eine parallele Linie deiner Zeichnung."],
  "lf01-042": ["Der Schwerpunkt eines Dreiecks liegt dort, wo sich seine drei Seitenhalbierenden treffen.", "In einer geometrischen Dachskizze zeichnest du die Verbindungen von den Ecken zu den gegenüberliegenden Seitenmitten."],
  "lf01-046": ["Ein Kran, der sich vergleichsweise schnell aufstellen lässt.", "Für einen kurzen Baustelleneinsatz wird ein geeigneter Schnellaufbaukran eingeplant."],
  "lf02-002": ["Die Kehle ist die nach innen verlaufende Linie, an der zwei Dachflächen zusammentreffen. Dort sammelt sich Wasser von beiden Flächen.", "An einem Dach mit Anbau verfolgst du den Wasserweg in der Kehle."],
  "lf02-003": ["Der Ortgang ist die seitliche Dachkante am Giebel.", "Du misst die seitliche Dachkante für den Ortgangabschluss aus."],
  "lf02-015": ["Die Regeldachneigung ist ein wichtiger Vergleichswert aus den Fachregeln: Unterhalb davon sind zusätzliche Maßnahmen für die Regensicherheit zu prüfen.", "Du vergleichst die geplante Dachneigung mit der Regeldachneigung der gewählten Deckung."],
  "lf02-018": ["Die Mindestdachneigung ist die untere Grenze für eine bestimmte Deckung. Auch zusätzliche Maßnahmen erlauben kein beliebiges Unterschreiten.", "Vor der Materialwahl prüfst du die zulässige Neigung des Decksystems."],
  "lf02-024": ["Ein quer eingebautes Holz fängt unterbrochene Sparren ab und leitet ihre Lasten weiter.", "Für ein Dachfenster wird eine geplante Öffnung zwischen den Sparren hergestellt."],
  "lf03-005": ["Eine Brandwand soll verhindern, dass sich Feuer auf einen anderen Gebäudebereich ausbreitet.", "Am Dachanschluss einer Brandwand beachtest du die geplanten Brandschutzdetails."],
  "lf03-010": ["Klinker ist ein besonders dicht gebrannter und widerstandsfähiger Ziegel.", "Du erkennst Klinker als möglichen Werkstoff einer Außenwand."],
  "lf03-017": ["Porenbeton ist ein leichter Baustoff mit vielen kleinen Luftporen.", "Vor der Befestigung an Porenbeton wählst du ein dafür geeignetes Befestigungssystem."],
  "lf03-021": ["Luftkalk wird fest, indem er mit Kohlendioxid aus der Luft reagiert.", "Beim Vergleich von Mörteln unterscheidest du Luftkalk von hydraulisch erhärtenden Bindemitteln."],
  "lf03-029": ["Trockenmörtel ist fertig gemischtes, trocken geliefertes Material. Auf der Baustelle wird Wasser zugegeben.", "Du mischst Sackware mit der angegebenen Wassermenge an."],
  "lf03-036": ["Ein Achtelmeter sind 12,5 cm. Dieses Grundmaß hilft bei der Einteilung von Mauerwerk.", "Du liest ein Mauermaß als Vielfaches von 12,5 cm."],
  "lf03-045": ["Eine gespannte Schnur gibt beim Mauern eine gerade Richtung vor.", "Die Fluchtschnur zeigt die geplante Kante der neuen Mauer."],
  "lf03-051": ["Ein Fanggerüst soll einen tieferen Absturz von Personen verhindern.", "Vor Dacharbeiten wird die vorgesehene Absturzsicherung geprüft."],
  "lf03-060": ["Ein Rahmengerüst besteht aus passenden, vorgefertigten Gerüstteilen.", "Die Gerüstteile werden nach der zugehörigen Aufbauanleitung zusammengestellt."],
  "lf03-067": ["In einer Läuferschicht zeigen die langen Seiten der Mauersteine nach außen.", "In einer Mauerwerkszeichnung markierst du die sichtbaren langen Steinseiten."],
  "lf03-068": ["In einer Binderschicht zeigen die kurzen Kopfseiten der Mauersteine nach außen.", "Du unterscheidest im Mauerverband kurze Kopfseiten und lange Läuferseiten."],
  "lf03-081": ["Die Isometrie zeigt einen Körper räumlich. Die drei Achsen werden im gleichen Maßstab dargestellt.", "Du zeichnest ein einfaches Bauteil mit senkrechter Höhe und zwei schrägen Achsen."],
  "lf04-002": ["Zementklinker ist das gebrannte Zwischenprodukt, aus dem anschließend Zement hergestellt wird.", "Du ordnest Brennen und Mahlen den Schritten der Zementherstellung zu."],
  "lf04-011": ["Hydratation ist die chemische Reaktion von Zement mit Wasser. Dadurch wird der Beton fest.", "Frischer Beton braucht geeignete Bedingungen, damit der Zement mit Wasser reagieren kann."],
  "lf04-017": ["Der Wasserzementwert vergleicht die Masse des Wassers mit der Masse des Zements einer Mischung.", "Bei 25 kg Wasser und 50 kg Zement beträgt der Wasserzementwert 0,5."],
  "lf04-043": ["Die Streckgrenze beschreibt, ab welcher Spannung sich Stahl dauerhaft verformt.", "Du unterscheidest eine zurückgehende Verformung von einer bleibenden Verformung."],
  "lf04-049": ["Die Betondeckung ist die schützende Betonschicht zwischen Bewehrungsstahl und Bauteiloberfläche.", "Abstandhalter sichern die vorgesehene Lage des Stahls in der Schalung."],
  "lf04-055": ["Ein Bewehrungsplan zeigt, welche Stahlstäbe an welche Stelle eines Betonbauteils gehören.", "Du vergleichst die Positionsnummer im Plan mit der Stahlliste."],
  "lf04-077": ["Hilfsstützen tragen ein junges Betonbauteil vorübergehend weiter, nachdem Teile der Schalung entfernt wurden.", "Die Stützen bleiben entsprechend der vorgesehenen Ausschalanweisung stehen."],
  "lf04-081": ["Eine Produktlinienanalyse betrachtet ein Produkt von der Rohstoffgewinnung bis zur Entsorgung und untersucht seine Folgen.", "Du vergleichst Dachmaterialien auch nach Herstellung, Nutzung und späterer Entsorgung."],
  "lf04-082": ["Eine Ökobilanz untersucht die Umweltwirkungen eines Produktes über seinen ganzen Lebensweg.", "Du vergleichst den Umweltaufwand verschiedener Dämmstoffe anhand einer gemeinsamen Bezugsgröße."],
  "lf05-005": ["Pflanzen bilden mit Sonnenlicht aus Wasser und Kohlendioxid Zucker. Daraus entstehen auch die Stoffe des Holzes.", "Beim Lernen über Holz verbindest du das Wachstum des Baumes mit der Energie der Sonne."],
  "lf05-011": ["Ein Jahresring zeigt einen jährlichen Wachstumsschritt im Holz.", "An der Schnittfläche eines Stammes erkennst du helle und dunkle Ringbereiche."],
  "lf05-013": ["Bei Drehwuchs verlaufen die Holzfasern schraubenförmig um den Stamm.", "Du erkennst verdrehte Fasern und beurteilst das Holz nach den vorgesehenen Sortierregeln."],
  "lf05-021": ["Konstruktionsvollholz ist sortiertes und technisch getrocknetes Bauholz mit festgelegten Eigenschaften.", "Für einen vorgesehenen Sparren vergleichst du die Holzkennzeichnung mit der Planung."],
  "lf05-031": ["Am Fasersättigungspunkt sind die Zellwände des Holzes mit Wasser gefüllt. Beim weiteren Trocknen kann das Holz schwinden.", "Du erklärst, warum sich die Maße eines Holzbauteils beim Trocknen verändern."],
  "lf05-032": ["Holzfeuchtegleichgewicht bedeutet: Das Holz nimmt aus seiner Umgebung genauso viel Feuchtigkeit auf, wie es abgibt.", "Holz lagert in einer anderen Umgebung und passt seine Feuchtigkeit allmählich an."],
  "lf05-034": ["Holz verändert bei wechselnder Feuchtigkeit seine Maße und manchmal seine Form.", "Eine Holzschalung kann beim Trocknen schmaler werden."],
  "lf05-056": ["Das Rähm ist das waagerechte Holz am oberen Rand einer Fachwerkwand.", "In einer Wandzeichnung suchst du das Holz über den senkrechten Ständern."],
  "lf05-060": ["Ein Versatz ist eine Holzverbindung, die Druckkräfte über passend zugeschnittene Kontaktflächen überträgt.", "Du betrachtest den Anschluss einer schrägen Strebe an ein waagerechtes Holz."],
  "lf05-087": ["Ein Hängewerk leitet Lasten einer Decke über hängende Bauteile in das Dachtragwerk.", "In der Bestandszeichnung verfolgst du den Lastweg vom Hängepfosten zum Dach."],
  "lf05-109": ["Bei der Freilufttrocknung trocknet Holz durch die umgebende Luft.", "Holz wird mit Abständen gestapelt, damit Luft durch den Stapel strömen kann."],
  "lf06-011": ["Sanierputz ist ein besonderer Putz für feuchtes und salzbelastetes Mauerwerk. Er kann Salze in seinen Poren aufnehmen.", "Für eine belastete Wand wird ein geeignetes Sanierungssystem geplant."],
  "lf06-018": ["Stuckgips ist ein Gipsbindemittel, das nach dem Mischen mit Wasser schnell fest wird.", "Du bereitest nur so viel Gips vor, wie sich in der vorgesehenen Verarbeitungszeit bearbeiten lässt."],
  "lf06-041": ["Calciumsulfatfließestrich ist ein flüssig eingebrachter Estrich auf Calciumsulfatbasis.", "Beim Vergleich von Fußbodenaufbauten prüfst du auch die erwartete Feuchtigkeit."],
  "lf06-047": ["Ein Mosaik besteht aus vielen kleinen Plättchen, die zusammen eine Fläche oder ein Muster bilden.", "Kleine Mosaikstücke folgen einer gebogenen Oberfläche."],
  "lf06-052": ["Steingut ist eine poröse Keramik mit vergleichsweise hoher Wasseraufnahme.", "Bei der Fliesenwahl prüfst du, ob der Werkstoff für den vorgesehenen Ort geeignet ist."],
  "lf06-058": ["Betonwerkstein ist ein im Werk hergestelltes und besonders gestaltetes Betonerzeugnis.", "Du erkennst eine vorgefertigte Betonplatte als Betonwerkstein."],
  "lf06-082": ["Zementmörteldübel sind kleine erhärtete Mörtelanteile in den Poren einer Fliese. Sie helfen bei der mechanischen Verankerung.", "Du erklärst am Schnittbild, wie die Fliese mit ihrem Mörtelbett verbunden wird."],
  "lf07-011": ["Die Zuschnittbreite ist die Breite des flachen Blechs, bevor daraus eine Rinne geformt wird.", "Ein Blechstreifen mit 333 mm Breite wird zu einer Metallrinne geformt."],
  "lf07-024": ["Die Berechnungsregenspende beschreibt die Regenmenge je Zeit und Fläche, mit der du die Entwässerung berechnest.", "Für einen Standort setzt du den vorgegebenen Regenwert in l/(s·ha) in die Rechnung ein."],
  "lf07-048": ["Der Freibord ist der freie Abstand zwischen dem geplanten höchsten Wasserstand und der Oberkante der Rinne.", "Bei 200 mm Rinnenhöhe und 140 mm Wasserstand bleiben 60 mm Freibord."],
  "lf07-062": ["Ein Chloropren-Dehnungsband ist ein elastisches Verbindungsstück. Es nimmt Bewegungen zwischen zwei Rinnenabschnitten auf.", "Die Rinne wird in der Sonne länger; das passende Band kann die Bewegung mitmachen."],
  "lf07-081": ["Bei einem Kegel verbindet eine Mantellinie einen Punkt des Grundkreises mit der Spitze.", "In einer Kegelzeichnung verbindest du mehrere Punkte des Grundkreises mit der Kegelspitze."],
  "lf08-028": ["Ein Verschiebeziegel erlaubt innerhalb seines vorgesehenen Bereichs unterschiedliche Abstände der Dachlatten.", "Bei einer Umdeckung prüfst du den zulässigen Verschiebebereich des konkreten Ziegelmodells."],
  "lf08-058": ["Docken sind Einlagestreifen, die Fugen zwischen Deckelementen schließen.", "Du unterscheidest eine Fugeneinlage von einer zusätzlich nötigen regensichernden Maßnahme."],
  "lf09-002": ["Dachschiefer ist Naturstein, der sich in dünne Platten spalten und zur Dachdeckung bearbeiten lässt.", "Ein Dachschiefer wird für die gewählte Deckart passend zugerichtet."],
  "lf09-043": ["Die Gebindesteigung beschreibt, wie schräg eine Reihe von Decksteinen zur Traufe verläuft.", "Du markierst in einer Schieferzeichnung Trauflinie und ansteigende Gebindelinie."],
  "lf09-055": ["Ein Ausspitzgebinde schließt eine Steinreihe ab, die unterhalb des Firstgebindes endet.", "In der Schieferdeckung ordnest du den Übergang zur obersten Reihe zu."],
  "lf10-097": ["Beim Umkehrdach liegt die Wärmedämmung oberhalb der Dachabdichtung.", "Du vergleichst die Schichtenfolge eines Umkehrdachs mit einem anderen Flachdachaufbau."],
  "lf10-098": ["Diese Schicht ermöglicht einen Ausgleich von Dampfdruck unter der Dachabdichtung.", "Du suchst die Ausgleichsschicht im vorgesehenen Dachaufbau."],
  "lf10-099": ["Polymerbitumen ist Bitumen, dessen Eigenschaften durch zugesetzte Kunststoffe verändert wurden.", "Du vergleichst die Kennzeichnungen zweier Bitumenbahnen."],
  "lf11-099": ["Zwischen Außenwandbekleidung und dahinterliegendem Aufbau gibt es einen belüfteten Zwischenraum.", "In einem Fassadenschnitt verfolgst du den Weg der Luft von unten nach oben."],
  "lf11-100": ["Ein Breitenmeter ist eine Mengenangabe für Holzschindeln: Sie liegen ohne Fugen zusammen einen Meter breit.", "Du unterscheidest die gelieferte Schindelmenge von ihrer späteren verlegten Fläche."],
  "lf11-101": ["Bei der Stülpdeckung überdeckt jede Reihe die darunterliegende Reihe in der Höhe.", "In einer Fassadenskizze zeichnest du die überlappenden Plattenreihen."],
  "lf12-004": ["Eine Schare ist ein langes Element einer Metalldeckung aus einem Band oder verbundenen Blechtafeln.", "Du teilst eine Metalldachfläche in nebeneinanderliegende Scharen ein."],
  "lf12-018": ["Der Blower-Door-Test misst, wie luftdicht ein Gebäude ist.", "Bei einer Luftdichtheitsprüfung werden undichte Anschlüsse gesucht."],
  "lf12-021": ["Die Netto-Schlitzbreite beschreibt die tatsächlich freie Öffnung, nachdem verdeckende Teile berücksichtigt sind.", "Ein Lochblech vor einem Lüftungsschlitz verkleinert dessen freien Querschnitt."],
  "lf12-030": ["Eine strukturierte Trennlage liegt unter der Metalldeckung. Ihre räumliche Struktur schafft Abstand zur darunterliegenden Bahn.", "Im Dachaufbau erkennst du die Strukturmatte direkt unter dem Metall."],
  "lf12-041": ["Oberfalz und Unterfalz sind zusammenpassende Blechkanten. Der Oberfalz überdeckt den Unterfalz.", "Du ordnest in einer Falzskizze die überdeckende und die unterdeckte Kante zu."],
  "lf12-047": ["Das Achsmaß ist hier die nutzbare Breite einer Schare zwischen den entsprechenden Bezugslinien.", "Beim Einteilen einer Metalldachfläche rechnest du mit der Nutzbreite statt der gesamten Blechbreite."],
  "lf12-052": ["Eine Passschare ist ein angepasstes, schmaleres Element am Rand einer Metalldachfläche.", "Am Ortgang wird eine Schare an die geplante Flächeneinteilung angepasst."],
  "lf12-064": ["Eine Schiebenaht ist eine Verbindung, die eine Längenbewegung des Metalls zulässt. Ihre Ausführung hängt vom Bauteil ab.", "Du unterscheidest im Detailplan eine bewegliche Verbindung von einer starren Verbindung."],
  "lf12-065": ["Eine Abtreppung ist ein Absatz in der Dachfläche. Er unterteilt lange Metalldeckungen.", "Im Dachquerschnitt markierst du den geplanten Höhensprung zwischen zwei Abschnitten."],
  "lf13a-007": ["Der Gratanfänger ist der erste besondere Ziegel am unteren Ende eines Dachgrats.", "Du beginnst die Gratdeckung mit dem vorgesehenen Anfangsformteil."],
  "lf13b-041": ["Eine Katzentreppe ist ein stufenartiger Vorsprung am Schornstein eines Reetdachs.", "Du erkennst den gemauerten Vorsprung im Anschlussdetail des Reetfirsts."],
  "lf13b-072": ["Ein Bandstock ist ein Draht, der Reet auf den Dachlatten festhält.", "Im Reetdachaufbau zeigst du die Lage des querliegenden Befestigungsdrahts."],
  "lf14-016": ["Ein Notüberlauf ist ein zusätzlicher Wasserweg für den Fall, dass die normale Entwässerung nicht ausreicht.", "Bei starkem Regen kann Wasser über einen geplanten Notüberlauf durch die Attika ablaufen."],
  "lf14-054": ["Bei einer Weißen Wanne übernimmt wasserundurchlässiger Beton die Abdichtungsaufgabe.", "Im Kellerdetail betrachtest du neben dem Beton auch die Abdichtung seiner Fugen."],
  "lf15-029": ["Der Schleppwinkel ist der Unterschied zwischen der Neigung des Hauptdachs und der Neigung des Schleppdachs.", "Bei 45° Hauptdach und 30° Schleppdach beträgt die Differenz 15°."],
  "lf16-004": ["Der innere Blitzschutz begrenzt gefährliche Spannungsunterschiede innerhalb des Gebäudes.", "Im Blitzschutzkonzept erkennst du die Verbindungen für den Potenzialausgleich."],
  "lf16-041": ["Watt-peak bezeichnet die Nennleistung eines Solarmoduls unter festgelegten Prüfbedingungen.", "Ein Modul mit 400 Wp liefert im Alltag je nach Wetter und Einbausituation unterschiedliche Leistungen."],
  "lf17-027": ["Ein Plattenhalter befestigt eine Ersatzplatte bei der Reparatur einer Schiefer- oder Faserzementdeckung.", "Eine beschädigte Platte wird mit dem dafür geeigneten Reparatursystem ersetzt."],
  "lf17-071": ["Eine Gefälledämmplatte ist keilförmig. Sie dämmt und stellt gleichzeitig eine Neigung her.", "Ein Gefälledämmplan zeigt, wie das Wasser zu den Dachabläufen geführt wird."],
  "wiso-020": ["Bei der Abnahme erklärt der Auftraggeber, dass er die vereinbarte Arbeit im Wesentlichen als vertragsgemäß annimmt.", "Nach Abschluss der Dacharbeiten wird die Leistung gemeinsam betrachtet und die Abnahme dokumentiert."],
  "wiso-021": ["Eine Fortbildung erweitert die Fähigkeiten eines bereits erlernten Berufs.", "Nach der Ausbildung vertiefst du deine Kenntnisse in einem Fachkurs."],
  "wiso-022": ["Die SOKA-DACH ist die Sozialkasse des Dachdeckerhandwerks und erfüllt tariflich vereinbarte Aufgaben.", "Du ordnest eine Information zur betrieblichen Sozialkasse dem Dachdeckerhandwerk zu."],
  "wiso-025": ["Das Günstigkeitsprinzip bedeutet: Unter bestimmten rechtlichen Voraussetzungen hat die für Beschäftigte günstigere Regelung Vorrang.", "Du vergleichst eine einzelvertragliche Regelung mit dem geltenden Tarifvertrag."],
};

const ALIASES: Record<string, string[]> = {
  "lf01-022": ["Maßstäbe"],
  "lf01-042": ["Dreiecksschwerpunkt"],
  "lf02-002": ["Kehlen"],
  "lf02-003": ["Giebelkante"],
  "lf02-015": ["Regeldachneigung", "RDN"],
  "lf05-005": ["Assimilation"],
  "lf05-021": ["KVH"],
  "lf07-024": ["Regenspende", "Regenspenden"],
  "lf07-062": ["Chloroprenband", "Chloropren-Dehnungsbänder"],
  "lf07-081": ["Mantellinien"],
  "lf12-004": ["Scharen"],
  "lf12-041": ["Oberfalz", "Unterfalz"],
  "lf12-047": ["Nutzungsbreite", "Nutzbreite"],
  "lf14-016": ["Notüberläufe"],
  "anhang2-071": ["U-Wert", "Wärmedurchgangskoeffizient"],
  "anhang2-118": ["diffusionsäquivalente Luftschichtdicke"],
  "lf16-041": ["Watt-peak", "Wp"],
};

// Nur tatsächlich gleichbedeutende Karten zusammenführen; alle ursprünglichen
// Aufgaben-IDs und Quellen bleiben am gemeinsamen Begriff auffindbar.
const GLEICHBEDEUTEND: Record<string, string> = { "lf05-112": "lf05-005" };

type Ergaenzung = {
  id: string;
  begriff: string;
  einfach: string;
  beispiel: string;
  lektion: string;
  aliases?: string[];
};

const LF7_ERGAENZUNGEN: Ergaenzung[] = [
  { id: "dachentwaesserung", begriff: "Dachentwässerung", einfach: "Alle Bauteile und Wege, die Regenwasser vom Dach ableiten.", beispiel: "Du verfolgst den Wasserweg vom Dach über die Rinne bis zum Fallrohr.", lektion: "lf07-l09" },
  { id: "dachrinne", begriff: "Dachrinne", aliases: ["Dachrinnen", "Rinne", "Rinnen"], einfach: "Die Dachrinne sammelt Regenwasser an der Dachkante und führt es zum Ablauf.", beispiel: "An der Traufe läuft das Wasser von den Ziegeln in die Rinne.", lektion: "lf07-l09" },
  { id: "fallrohr", begriff: "Fallrohr", aliases: ["Fallrohre", "Fallrohren"], einfach: "Ein Fallrohr leitet das gesammelte Regenwasser nach unten.", beispiel: "Das Wasser gelangt aus der Rinne durch das Fallrohr zur weiteren Entwässerung.", lektion: "lf07-l09" },
  { id: "rinnenhalter", begriff: "Rinnenhalter", aliases: ["Rinneneisen", "Rinnenhaltern"], einfach: "Ein Rinnenhalter trägt die Dachrinne und hält sie in ihrer vorgesehenen Lage.", beispiel: "Du richtest die Halter so aus, dass die Rinne zum Ablauf führt.", lektion: "lf07-l01" },
  { id: "ablaufstutzen", begriff: "Ablaufstutzen", aliases: ["Rinnenstutzen", "Einhangstutzen"], einfach: "Der Ablaufstutzen verbindet die Öffnung der Rinne mit dem Fallrohr.", beispiel: "Unter dem Rinnenablauf beginnt der Übergang zum Rohrbogen und Fallrohr.", lektion: "lf07-l09" },
  { id: "traufkante", begriff: "Traufe", aliases: ["Trauflinie"], einfach: "Die Traufe ist die untere Kante eines geneigten Dachs. Dort läuft das Regenwasser ab.", beispiel: "Du zeichnest die Rinne an der Traufe und nicht am seitlichen Ortgang ein.", lektion: "lf07-l01" },
  { id: "gefaelle", begriff: "Gefälle", einfach: "Gefälle ist ein Höhenunterschied entlang einer Strecke. Wasser fließt dabei vom höheren zum tieferen Punkt.", beispiel: "10 mm Höhenunterschied auf 5 m Länge entsprechen 2 mm je Meter.", lektion: "lf07-l01" },
  { id: "abflussbeiwert", begriff: "Abflussbeiwert", einfach: "Der Abflussbeiwert berücksichtigt, welcher Anteil des Regens von einer Fläche abfließt.", beispiel: "In einer Übung verwendest du den für den Dachaufbau vorgegebenen Wert C.", lektion: "lf07-l02" },
  { id: "wirksame-dachflaeche", begriff: "Wirksame Dachfläche", aliases: ["wirksamen Dachfläche", "wirksame Fläche", "Einzugsfläche"], einfach: "Die wirksame Dachfläche ist die für die Entwässerungsrechnung angesetzte Fläche. Sie wird für den jeweiligen Fall bestimmt.", beispiel: "Bei einer Übung ohne zusätzliche Einflüsse verwendest du die vorgegebene waagerechte Projektion der Dachfläche.", lektion: "lf07-l05" },
  { id: "regenwasserabfluss", begriff: "Regenwasserabfluss", aliases: ["Abflussmenge"], einfach: "Der Regenwasserabfluss beschreibt, wie viel Wasser pro Zeit vom Dach abgeleitet werden muss.", beispiel: "Ein berechneter Abfluss von 3 l/s bedeutet drei Liter in jeder Sekunde.", lektion: "lf07-l05" },
  { id: "abflussvermoegen", begriff: "Abflussvermögen", einfach: "Das Abflussvermögen beschreibt, wie viel Wasser ein Bauteil unter festgelegten Bedingungen abführen kann.", beispiel: "Du vergleichst den berechneten Regenwasserabfluss mit der angegebenen Leistung des Ablaufs.", lektion: "lf07-l05" },
  { id: "bemessung", begriff: "Bemessung", aliases: ["Bemessen"], einfach: "Bemessen heißt, eine geeignete Größe oder Leistungsfähigkeit für einen bestimmten Fall zu bestimmen.", beispiel: "Du wählst Rinne und Ablauf anhand der Dachfläche und der vorgegebenen Regenspende.", lektion: "lf07-l05" },
  { id: "hektar", begriff: "Hektar", einfach: "Ein Hektar ist eine Flächeneinheit und entspricht 10 000 Quadratmetern.", beispiel: "Für eine Regenrechnung wandelst du 200 m² in 0,02 ha um.", lektion: "lf07-l02" },
  { id: "dachablauf", begriff: "Dachablauf", aliases: ["Dachabläufe", "Dachabläufen", "Gully", "Gullys"], einfach: "Ein Dachablauf sammelt Wasser an einem vorgesehenen Punkt der Dachfläche und führt es in eine Leitung.", beispiel: "Im Flachdachplan suchst du die Abläufe an den geplanten Tiefpunkten.", lektion: "lf07-l06" },
  { id: "notentwaesserung", begriff: "Notentwässerung", einfach: "Die Notentwässerung ist ein zusätzlicher, geplanter Wasserweg, wenn die Hauptentwässerung nicht ausreicht oder ausfällt.", beispiel: "Im Entwässerungsplan verfolgst du Hauptwasserweg und Notwasserweg getrennt.", lektion: "lf07-l12" },
  { id: "attika", begriff: "Attika", einfach: "Eine Attika ist eine über die Dachfläche hinausragende Wand am Dachrand.", beispiel: "Ein geplanter Notüberlauf führt durch die Attika nach außen.", lektion: "lf07-l06" },
  { id: "waermedehnung", begriff: "Wärmedehnung", aliases: ["Wärmeausdehnung", "thermische Längenausdehnung", "Längenausdehnung"], einfach: "Wird ein Bauteil wärmer, kann es länger werden. Beim Abkühlen zieht es sich wieder zusammen.", beispiel: "Ein langer Metallrinnenstrang braucht passende Möglichkeiten für seine Längenbewegung.", lektion: "lf07-l03" },
  { id: "dehnungsausgleicher", begriff: "Dehnungsausgleicher", aliases: ["Dehnungselement", "Dehnungselemente", "Dehnungsausgleich"], einfach: "Ein Dehnungsausgleicher nimmt Bewegungen eines Bauteils auf, damit Verbindungen nicht überlastet werden.", beispiel: "Zwischen zwei Rinnenabschnitten ist ein passendes bewegliches Verbindungsteil vorgesehen.", lektion: "lf07-l03" },
  { id: "ausdehnungskoeffizient", begriff: "Ausdehnungskoeffizient", einfach: "Diese Werkstoffzahl beschreibt, wie stark sich ein Material bei einer Temperaturänderung ausdehnt.", beispiel: "Du setzt den angegebenen Wert zusammen mit Länge und Temperaturunterschied in die Rechnung ein.", lektion: "lf07-l03" },
  { id: "kontaktkorrosion", begriff: "Kontaktkorrosion", einfach: "Unterschiedliche Metalle können sich in leitender Verbindung mit Feuchtigkeit gegenseitig beeinflussen. Dabei wird das unedlere Metall angegriffen.", beispiel: "Bei der Werkstoffwahl prüfst du sowohl den direkten Metallkontakt als auch den Wasserweg.", lektion: "lf07-l04" },
  { id: "querschnitt", begriff: "Querschnitt", aliases: ["Querschnitte", "Rinnenquerschnitt"], einfach: "Ein Querschnitt zeigt, wie ein Bauteil aussieht, wenn du quer hindurchschneidest.", beispiel: "Im Querschnitt erkennst du eine halbrunde oder eine kastenförmige Rinne.", lektion: "lf07-l10" },
  { id: "abwicklung", begriff: "Abwicklung", aliases: ["Abwicklungen", "Rohrabwicklung", "Rohrabwicklungen"], einfach: "Eine Abwicklung zeigt die Oberfläche eines räumlichen Körpers flach in der Ebene.", beispiel: "Die Mantelfläche eines geraden runden Rohrs wird als Rechteck mit Höhe und Umfang gezeichnet.", lektion: "lf07-l11" },
  { id: "nahtzugabe", begriff: "Nahtzugabe", einfach: "Die Nahtzugabe ist zusätzliches Material am Zuschnitt, das für die geplante Verbindung benötigt wird.", beispiel: "Zum berechneten Rohrumfang kommt die für die vorgesehene Naht nötige Zugabe.", lektion: "lf07-l11" },
  { id: "rinnenwulst", begriff: "Rinnenwulst", einfach: "Der Rinnenwulst ist die rund geformte Kante an der Vorderseite einer Metallrinne.", beispiel: "In der Rinnenskizze markierst du vorne den Wulst und hinten den Wasserfalz.", lektion: "lf07-l10" },
  { id: "wasserfalz", begriff: "Wasserfalz", aliases: ["Rinnenfalz"], einfach: "Der Wasserfalz ist die gefalzte Kante an der dem Dach zugewandten Rückseite der Rinne.", beispiel: "Du unterscheidest in der Schnittzeichnung den hinteren Wasserfalz vom vorderen Wulst.", lektion: "lf07-l10" },
];

/** Einheitliche Suche, auch mit ae/oe/ue, ß und Großschreibung. */
export function normalisiereGlossarSuche(text: string): string {
  return text.toLocaleLowerCase("de-DE").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

let glossar: GlossarEintrag[] | undefined;

export function getGlossar(): GlossarEintrag[] {
  if (glossar) return glossar;
  const gruppen = new Map<string, GlossarEintrag>();
  for (const lf of getLernfelder()) {
    for (const aufgabe of getAufgaben(lf.id)) {
      if (aufgabe.typ !== "fachbegriff") continue;
      const basisId = GLEICHBEDEUTEND[aufgabe.id] ?? aufgabe.id;
      const vorhanden = gruppen.get(basisId);
      if (vorhanden) {
        vorhanden.aufgabenIds.push(aufgabe.id);
        if (!vorhanden.quellen.includes(aufgabe.quelle)) vorhanden.quellen.push(aufgabe.quelle);
        if (!vorhanden.lernfelder.includes(lf.id)) vorhanden.lernfelder.push(lf.id);
        if (aufgabe.begriff !== vorhanden.begriff && !vorhanden.aliases.includes(aufgabe.begriff)) vorhanden.aliases.push(aufgabe.begriff);
        continue;
      }
      const sprachhilfe = SPRACHHILFEN[basisId];
      gruppen.set(basisId, {
        id: `glossar-${basisId}`,
        begriff: aufgabe.begriff,
        einfach: sprachhilfe?.[0] ?? aufgabe.definition,
        fachdefinition: aufgabe.definition,
        beispiel: sprachhilfe?.[1] ?? `Du begegnest diesem Begriff im Themenbereich „${aufgabe.thema}“.`,
        aliases: [...(ALIASES[basisId] ?? [])],
        quelle: aufgabe.quelle,
        quellen: [aufgabe.quelle],
        aufgabenIds: [aufgabe.id],
        lernfelder: [lf.id],
      });
    }
  }
  for (const eintrag of LF7_ERGAENZUNGEN) {
    const quelle = `Sprachhilfe zur vorhandenen LF7-Lektion ${eintrag.lektion}; keine zusätzliche Ausführungsregel.`;
    gruppen.set(eintrag.id, {
      id: `glossar-lf07-${eintrag.id}`,
      begriff: eintrag.begriff,
      einfach: eintrag.einfach,
      beispiel: eintrag.beispiel,
      aliases: eintrag.aliases ?? [],
      quelle,
      quellen: [quelle],
      aufgabenIds: [],
      lernfelder: ["lf07"],
    });
  }
  for(const e of WERKSTATT_BEGRIFFE){
    const quelle="Eigene Sprachhilfe zu Mathe und Baustellenprojekten der Lernwerkstatt.";
    gruppen.set(e.id,{...e,quelle,quellen:[quelle],aufgabenIds:[],lernfelder:[]});
  }
  glossar = [...gruppen.values()].map(e=>({...e,bild:e.bild??GLOSSAR_BILDER[e.id]})).sort((a, b) => a.begriff.localeCompare(b.begriff, "de"));
  return glossar;
}

/** Auch eine ursprüngliche Aufgaben-ID bleibt als Verweis gültig. */
export function getBegriff(id: string): GlossarEintrag | undefined {
  return getGlossar().find((eintrag) => eintrag.id === id || eintrag.aufgabenIds.includes(id));
}

export function sucheBegriffe(suche: string): GlossarEintrag[] {
  const query = normalisiereGlossarSuche(suche);
  if (!query) return getGlossar();
  const woerter = query.split(" ");
  return getGlossar().map((eintrag) => {
    const namen = [eintrag.begriff, ...eintrag.aliases].map(normalisiereGlossarSuche);
    const text = normalisiereGlossarSuche(`${namen.join(" ")} ${eintrag.einfach} ${eintrag.fachdefinition ?? ""}`);
    const rang = namen.includes(query) ? 0 : namen.some((name) => name.startsWith(query)) ? 1 : 2;
    return { eintrag, rang, passt: woerter.every((wort) => text.includes(wort)) };
  }).filter(({ passt }) => passt).sort((a, b) => a.rang - b.rang || a.eintrag.begriff.localeCompare(b.eintrag.begriff, "de"))
    .map(({ eintrag }) => eintrag);
}

export type GlossarTextTeil = { art: "text"; text: string } | { art: "begriff"; text: string; begriff: GlossarEintrag };

let begriffsMuster: RegExp | undefined;
let begriffeNachName: Map<string, GlossarEintrag> | undefined;

function begriffsIndex() {
  if (begriffsMuster && begriffeNachName) return { muster: begriffsMuster, namen: begriffeNachName };
  const namen = new Map<string, GlossarEintrag>();
  for (const eintrag of getGlossar()) {
    for (const name of [eintrag.begriff, ...eintrag.aliases]) {
      // Kurze Variablennamen und Einheiten wie Wp bleiben normaler Text.
      if (name.length >= 3) namen.set(name.toLocaleLowerCase("de-DE"), eintrag);
    }
  }
  const alternativen = [...namen.keys()].sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  begriffsMuster = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alternativen.join("|")})(?![\\p{L}\\p{N}_])`, "giu");
  begriffeNachName = namen;
  return { muster: begriffsMuster, namen };
}

/** React rendert diese Teile als Text/Buttons; es wird niemals HTML erzeugt. */
export function teileGlossarText(text: string): GlossarTextTeil[] {
  const { muster, namen } = begriffsIndex();
  const teile: GlossarTextTeil[] = [];
  // Formeln, Code und Aufgabenplatzhalter erhalten weder Buttons noch Markup.
  const geschuetzt = /(`[^`]*`|\{[^}]*\}|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$\n]*\$)/g;
  const zerlege = (abschnitt: string) => {
    muster.lastIndex = 0;
    let ende = 0;
    for (const treffer of abschnitt.matchAll(muster)) {
      const start = treffer.index;
      if (start > ende) teile.push({ art: "text", text: abschnitt.slice(ende, start) });
      const begriff = namen.get(treffer[0].toLocaleLowerCase("de-DE"));
      if (begriff) teile.push({ art: "begriff", text: treffer[0], begriff });
      ende = start + treffer[0].length;
    }
    if (ende < abschnitt.length) teile.push({ art: "text", text: abschnitt.slice(ende) });
  };
  let ende = 0;
  for (const treffer of text.matchAll(geschuetzt)) {
    zerlege(text.slice(ende, treffer.index));
    teile.push({ art: "text", text: treffer[0] });
    ende = treffer.index + treffer[0].length;
  }
  zerlege(text.slice(ende));
  return teile;
}

export function findeBegriffe(text: string): GlossarEintrag[] {
  const gefunden = new Map<string, GlossarEintrag>();
  for (const teil of teileGlossarText(text)) if (teil.art === "begriff") gefunden.set(teil.begriff.id, teil.begriff);
  return [...gefunden.values()];
}
