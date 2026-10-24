import type { LernEinheit, LernKapitel } from "@/lib/curriculum";
import type { Aktivitaet } from "@/lib/aktivitaeten";

// Eigenständige Lerntexte auf Grundlage der sichtbaren Fachstufen-Lektionen.
// Zahlen in Rechenfällen sind Übungsdaten, keine neu geprüften Ausführungsregeln.
function fsZuordnen(titel: string, paare: [string, string][], erklaerung: string): Aktivitaet {
  return { id: "", version: 2, typ: "zuordnen", titel, auftrag: "Ordne jedem Eintrag die passende Aussage zu.", paare: paare.map(([links, rechts], i) => ({ id: `p${i + 1}`, links, rechts })), erklaerung };
}
function fsOrdnen(titel: string, schritte: string[], erklaerung: string): Aktivitaet {
  return { id: "", version: 2, typ: "reihenfolge", titel, auftrag: "Ordne die Arbeitsschritte mit den Pfeil-Schaltflächen.", schritte: schritte.map((text, i) => ({ id: `s${i + 1}`, text })), erklaerung };
}
function fsFall(titel: string, situation: string, optionen: [string, boolean][], erklaerung: string, skizzenLabels?: string[]): Aktivitaet {
  const svg = skizzenLabels ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 ${skizzenLabels.length * 56 + 24}" role="img"><title>${titel}</title>${skizzenLabels.map((label, i) => `<rect x="12" y="${12 + i * 56}" width="596" height="44" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><text x="26" y="${40 + i * 56}" fill="currentColor" font-family="sans-serif" font-size="17">${label}</text>`).join("")}</svg>` : undefined;
  return { id: "", version: 2, typ: svg ? "skizzenfehler" : "baustellenfall", titel, auftrag: "Wähle alle fachlich passenden Aussagen.", situation, optionen: optionen.map(([text, korrekt], i) => ({ id: `o${i + 1}`, text, korrekt })), erklaerung, ...(svg ? { svg, bildbeschreibung: situation } : {}) };
}
function fsEinheit(lektionId: string, titel: string, lernziel: string, text: string, aufgabenIds: string[], abrufFrage: string, abrufMuster: string, aktivitaet: Aktivitaet): LernEinheit {
  const id = `${lektionId}-e01`;
  return { id, version: 2, titel, lernziel, minuten: 7, textschritte: [text], lektionIds: [lektionId], aufgabenIds, begriffe: [], abrufFrage, abrufMuster, aktivitaet: { ...aktivitaet, id: `${id}-aktiv` } };
}
const LF08_KAPITEL: LernKapitel[] = [
  { id: "lf08-k01", titel: "Schichten, Wärme und Feuchte", einheiten: [
    fsEinheit("lf08-l01", "Jede Dachschicht hat eine Aufgabe", "Du kannst die Funktionsschichten eines gedämmten Steildachs von innen nach außen ordnen.",
      "Ein gedämmtes Steildach erfüllt mehrere Aufgaben gleichzeitig. Die Innenbekleidung schließt den Raum ab. Dahinter begrenzt eine passend geplante Dampfbremse den Wasserdampftransport; ihre luftdichten Anschlüsse verhindern Luftströmungen durch Fugen. Die Wärmedämmung verringert den Wärmestrom. Auf der Außenseite nimmt eine zusätzliche wasserführende Ebene eingedrungenen Regen oder Flugschnee auf. Konterlatten schaffen Abstand zur Deckung und einen Weg zur Traufe. Quer dazu tragen die Traglatten die Dachziegel oder Dachsteine. Die Deckung hält den größten Teil des Niederschlags ab. Gehe beim Zeichnen immer von der Funktion aus. Eine regensichernde Lage übernimmt nicht automatisch die Luftdichtung und eine Traglatte ersetzt keine Konterlatte.",
      ["lf08-110", "lf08-063", "lf08-079"], "Warum sind Konterlatten und Traglatten keine austauschbaren Schichten?", "Konterlatten schaffen den Abstand und Ablaufweg entlang der Dachfläche; Traglatten tragen die Deckelemente quer dazu.",
      fsOrdnen("Vom Raum bis zum Regen", ["Innenbekleidung", "Dampfbremse mit geplanter Luftdichtung", "Wärmedämmung", "Zusätzliche wasserführende Ebene", "Konterlattung", "Traglattung und Deckung"], "Die Reihenfolge verbindet Schutzfunktionen und Lastabtragung im beschriebenen Dachaufbau.")),
    fsEinheit("lf08-l02", "Zusatzebenen richtig benennen", "Du kannst Unterspannung, Unterdeckung und Unterdach anhand ihrer Konstruktion unterscheiden.",
      "Unterspannung, Unterdeckung und Unterdach liegen unter der eigentlichen Dachdeckung. Trotzdem beschreiben sie unterschiedliche Konstruktionen. Eine Unterspannung überspannt die Sparren ohne durchgehende tragfähige Unterlage. Eine Unterdeckung liegt auf einer geeigneten Unterlage oder besteht aus dafür vorgesehenen Platten. Ein Unterdach bildet eine weitergehend gegen Wasser gesicherte Ebene; dazu gehören die passende Fläche, die Fügung und alle Anschlüsse. Die Bezeichnung einer Bahn allein entscheidet deshalb noch nicht über die fertige Schutzwirkung. Prüfe in einer Zeichnung zuerst die Unterlage, dann die Nähte und schließlich Durchdringungen und Ränder. Die genaue Eignung ergibt sich aus der geplanten Ausführung und den zugehörigen Systemangaben.",
      ["lf08-063", "lf08-064", "lf08-062"], "Welche drei Merkmale prüfst du, bevor du eine Zusatzebene als Unterdach bezeichnest?", "Unterlage, wasserführende Fügung der Fläche und sichere Anschlüsse beziehungsweise Durchdringungen müssen zur geplanten Unterdachkonstruktion passen.",
      fsZuordnen("Bahn ist nicht gleich Konstruktion", [["Unterspannung", "Ohne durchgehende tragfähige Unterlage gespannt"], ["Unterdeckung", "Auf geeigneter Unterlage oder aus passenden Platten"], ["Unterdach", "Weitergehend gegen Wasser gesicherte Konstruktion"], ["Anschluss", "Führt die Schutzwirkung am Rand oder Einbauteil fort"]], "Erst die vollständige Konstruktion erklärt die Funktion der zusätzlichen Ebene.")),
    fsEinheit("lf08-l03", "Vom Dämmstoff zum U-Wert", "Du kannst Schichtwiderstand und U-Wert unterscheiden und ihre Veränderung erklären.",
      "Wärmedämmung lässt sich nicht allein nach ihrer Dicke vergleichen. Entscheidend ist auch die Wärmeleitfähigkeit λ. Für eine gleichmäßige Schicht gilt R = d / λ. Setze die Dicke dabei in Metern ein. Größere Dicke oder kleinere Wärmeleitfähigkeit ergeben einen größeren Wärmedurchlasswiderstand R. Für das gesamte Bauteil werden die passenden Schichtwiderstände und Wärmeübergangswiderstände zusammen betrachtet. Der U-Wert ist der Kehrwert dieses Gesamtwiderstands. Ein kleiner U-Wert bedeutet bei gleichem Temperaturunterschied einen geringeren Wärmestrom. Verwechsle deshalb die Bewertungsrichtung nicht: Bei R ist größer günstiger, bei U kleiner. Sparren und andere abweichende Bereiche müssen bei einer Bauteilbewertung ebenfalls berücksichtigt werden.",
      ["anhang2-028", "anhang2-031", "anhang2-032"], "Was geschieht mit R und U, wenn eine gleichartige Dämmschicht dicker wird?", "Der Schichtwiderstand R wächst. Dadurch steigt der Gesamtwiderstand und der U-Wert des betrachteten Aufbaus sinkt.",
      fsZuordnen("Welche Größe beschreibt was?", [["d", "Schichtdicke in Metern"], ["λ", "Wärmeleitfähigkeit des Stoffes"], ["R", "Widerstand einer Schicht gegen Wärmedurchgang"], ["U", "Kehrwert des gesamten Wärmewiderstands"]], "Die Einheiten und die entgegengesetzte Bewertungsrichtung von R und U helfen beim Prüfen.")),
    fsEinheit("lf08-l04", "Feuchtewege statt bloßer Foliennamen", "Du kannst Diffusion, Luftströmung und Tauwasserbildung an einem Dachanschluss erklären.",
      "Feuchtigkeit kann auf unterschiedlichen Wegen in einen Dachaufbau gelangen. Wasserdampf bewegt sich durch Baustoffe; diesen Vorgang nennen wir Diffusion. Strömt feuchte Raumluft durch eine offene Fuge, transportiert die Luft selbst die Feuchtigkeit. Das ist Konvektion. Kühlt diese Luft ausreichend ab, kann Tauwasser entstehen. Deshalb reicht eine passende Dampfbremse als Material nicht aus. Auch ihre Überlappungen, Durchdringungen und Anschlüsse müssen zur geplanten Luftdichtung gehören. Bei einer Kontrolle suchst du gezielt nach offenen Übergängen, etwa am Sparren oder an einer Leitung. Eine feuchte Stelle zeigt zunächst einen Befund. Den Eintrittsweg und die mögliche Rücktrocknung musst du anschließend untersuchen, bevor du eine Reparatur begründest.",
      ["anhang2-019", "anhang2-096", "anhang2-118"], "Warum kann eine kleine offene Fuge trotz passender Dampfbremse Feuchteschäden begünstigen?", "Durch die Fuge kann feuchte Raumluft strömen. Kühlt sie im Aufbau ab, kann Tauwasser entstehen; der Materialwert der Bahn schließt die Fuge nicht.",
      fsFall("Die überklebte Fläche mit offenem Rand", "Die Bahnfläche ist unbeschädigt. Am Wandanschluss bleibt eine durchgehende offene Fuge.", [["Die Fuge unterbricht die geplante Luftdichtung.", true], ["Der Diffusionswert der Bahn macht den offenen Anschluss unschädlich.", false], ["Anschluss und Feuchteweg müssen gezielt untersucht werden.", true]], "Luftdichtung entsteht durch die zusammenhängende Ebene einschließlich aller Anschlüsse.")),
  ] },
  { id: "lf08-k02", titel: "Dachgeometrie und Einteilung", einheiten: [
    fsEinheit("lf08-l05", "Mengen aus Deckmaßen ableiten", "Du kannst Rollenfläche, nutzbare Deckfläche und Bestellmenge auseinanderhalten.",
      "Eine Materialliste beginnt mit der tatsächlich zu deckenden Fläche. Bei einer Bahnrolle ist die volle Rollenfläche größer als die nutzbare Deckfläche, weil Überdeckungen Material verbrauchen. Verwende im Übungsmodell die vorgegebenen nutzbaren Längen und Breiten und teile die Dachfläche durch die Deckfläche einer Rolle. Ganze Verpackungseinheiten werden am Ende aufgerundet. Latten rechnest du in Metern, Deckelemente in Stück und Befestigungen nach dem zum Fall gehörenden Ansatz. Halte Zuschläge für Bruch, Verschnitt und Verlust getrennt vom Grundbedarf fest. So bleibt nachvollziehbar, ob eine größere Menge aus der Dachform, dem Verlegeschema oder einem Zuschlag entsteht. Formteile zählst du zusätzlich an ihren jeweiligen Dachrändern.",
      ["lf08-092", "lf08-093", "lf08-094", "lf08-101"], "Warum reicht die volle Rollenfläche nicht zur Berechnung der Rollenanzahl?", "Überdeckungen verringern die wirksame Deckfläche. Die Dachfläche wird durch diese nutzbare Fläche geteilt; die Bestellmenge wird passend aufgerundet.",
      fsOrdnen("Von der Fläche zur Bestellung", ["Dachfläche und Verlegeschema aufnehmen", "Nutzbare Deckfläche je Rolle bestimmen", "Grundbedarf durch Division berechnen", "Begründete Zuschläge berücksichtigen", "Auf kaufbare Einheiten aufrunden"], "Die Verpackungseinheit bestimmt die Bestellung, nicht die ungerundete Rechenzahl.")),
    fsEinheit("lf08-l06", "Walmdach: Grundriss und wahre Länge", "Du kannst beim gleich geneigten Walmdach Höhe, Sparrenlänge und Gratlänge geometrisch zuordnen.",
      "Die Draufsicht eines Walmdachs zeigt Lage und Richtung der Dachlinien. Sie zeigt geneigte Bauteile aber nicht in ihrer wahren Länge. Beginne deshalb mit einem Dachprofil. Bei einem symmetrischen Beispiel mit gleicher Dachneigung bilden halbe Gebäudebreite, Firsthöhe und Sparrenlänge ein rechtwinkliges Dreieck. Der Tangens verbindet die halbe Breite mit der Höhe; der Kosinus verbindet sie mit der Sparrenlänge. Für den Gratsparren kommt eine weitere räumliche Richtung hinzu. Seine wahre Länge lässt sich mit einem passenden rechtwinkligen Dreieck ermitteln. Kennzeichne in jeder Rechnung, welche Länge waagerecht und welche geneigt ist. Die einfachen Zusammenhänge dürfen nicht ungeprüft auf ungleich geneigte oder anders geformte Dächer übertragen werden.",
      ["lf08-104", "lf08-106", "lf08-107", "lf08-108"], "Warum darfst du die Gratlänge nicht einfach aus der Draufsicht abmessen?", "Die Draufsicht verkürzt die geneigte Linie. Für die wahre Länge müssen Dachhöhe und räumlicher Verlauf berücksichtigt werden.",
      fsZuordnen("Das passende Dreieck", [["Firsthöhe", "Senkrechte Strecke im Dachprofil"], ["Halbe Gebäudebreite", "Waagerechte Strecke beim symmetrischen Profil"], ["Sparrenlänge", "Geneigte Hypotenuse im Dachprofil"], ["Grundrisslinie", "Waagerechte Projektion einer Dachlinie"]], "Geometrische Begriffe verhindern, dass Projektion und wahre Länge verwechselt werden.")),
    fsEinheit("lf08-l12", "Die nutzbare Sparrenlänge aufteilen", "Du kannst DLT, DL und LAF in einer Längeneinteilung verwenden.",
      "Die erste und die letzte Latte werden durch Traufe und First bestimmt. DLT bezeichnet das Traufmaß, LAF den Abstand im Firstbereich. Diese Randmaße ziehst du im beschriebenen Rechenmodell von der Sparrenlänge ab. Übrig bleibt die einzuteilende Länge. Teile sie durch einen zulässigen Decklängenwert, um eine mögliche ganze Anzahl von Abschnitten zu finden. Danach berechnest du die tatsächliche Lattweite aus Restlänge und Abschnittszahl. Ein Aufrunden der Abschnittszahl macht die Abstände kleiner. Das allein beweist noch keine passende Einteilung: Der errechnete Abstand muss innerhalb des zulässigen Decklängenbereichs liegen. Schreibe außerdem dazu, ob deine Zahl Abschnitte oder vorhandene Latten bezeichnet, damit keine Reihe verloren geht.",
      ["lf08-084", "lf08-086", "lf08-087", "lf08-088"], "Warum prüfst du die Lattweite nach dem Aufrunden nochmals?", "Mehr Abschnitte verkleinern die Lattweite. Sie kann dadurch zwar unter dem Höchstwert, aber auch unter dem zulässigen Mindestwert liegen.",
      fsOrdnen("Lattweite nachvollziehbar bestimmen", ["Traufmaß DLT und Firstmaß LAF festlegen", "Beide Randmaße von der Sparrenlänge abziehen", "Ganze passende Abschnittszahl wählen", "Tatsächliche Lattweite berechnen", "Ergebnis mit Mindest- und Höchstmaß vergleichen"], "Eine ganze Abschnittszahl und ein passender Decklängenbereich müssen gleichzeitig erfüllt sein.")),
    fsEinheit("lf08-l13", "Deckmaße am gelieferten Ziegel messen", "Du kannst aus einer Messreihe einen Decklängenbereich und dessen Mittelwert ermitteln.",
      "Ein Ziegel besitzt Außenmaße und wirksame Deckmaße. Falze und Überdeckungen sorgen dafür, dass diese Werte verschieden sind. Außerdem haben gebrannte Produkte Fertigungstoleranzen. Deshalb wird die mögliche Einteilung an mehreren Ziegeln des gelieferten Materials geprüft. Die vorhandene Lektion beschreibt eine Messung über zehn wirksame Abstände, einmal auseinandergezogen und einmal zusammengeschoben. Durch Teilen der gemessenen Länge durch zehn erhältst du den jeweiligen Einzelwert. Der Mittelwert beider Messungen ergibt die mittlere Decklänge. Für die Deckbreite gilt dieselbe Denkweise. Beschrifte immer den Messanfang und das Messende. Wer versehentlich zehn Ziegel statt zehn Abstände zählt, erhält trotz sauberer Division ein falsches Ergebnis.",
      ["lf08-030", "lf08-031", "lf08-032"], "Zwei Messstrecken über jeweils zehn Deckabstände ergeben 340 und 330 cm. Wie groß ist die mittlere Decklänge?", "(340 + 330) / 20 = 33,5 cm. Der Decklängenbereich reicht bei diesen Übungsdaten von 33 bis 34 cm.",
      fsFall("Ziegel zählen oder Abstände messen?", "Eine Messskizze markiert zehn wirksame Deckabstände. Gemessen werden 340 cm. Daneben steht als Ergebnis 340 / 11.", [["Die Division durch elf passt nicht zu zehn markierten Abständen.", true], ["Der Einzelwert beträgt hier 34 cm.", true], ["Die Zahl aller sichtbaren Ziegel ersetzt die Zahl der Messabstände.", false]], "Entscheidend ist die eindeutig markierte Messstrecke über zehn Deckabstände.", ["Messstrecke: 10 wirksame Abstände = 340 cm", "Fehlerhafte Rechnung: 340 : 11", "Gesucht: Deckabstand eines Ziegels"])),
    fsEinheit("lf08-l23", "Länge und Breite gemeinsam kontrollieren", "Du kannst Randmaße und Deckbereiche in einer vollständigen Dacheinteilung prüfen.",
      "Eine Dacheinteilung endet nicht nach der Lattweitenrechnung. Auch in der Breite müssen Ortgangteile, Überstände und die wirksame Breite der Flächenziegel zusammenpassen. Lege zuerst die Randdetails fest. Bestimme danach die verbleibenden Längen und Breiten und verteile sie auf ganze Reihen beziehungsweise Deckabstände. Prüfe beide Ergebnisse gegen die am Material ermittelten Bereiche. Die Lattweite wird im beschriebenen Verfahren von Oberkante zu Oberkante gemessen. Schnurschläge übertragen die Breitenaufteilung auf das Dach. Eine Kontrollskizze zeigt Randmaße, Bezugskanten und Reihenrichtung. Falls eine Einteilung nur durch gewaltsames Auseinanderziehen der Falze passt, ist die Rechnung oder das Randdetail zu überarbeiten, bevor weitergelattet wird.",
      ["lf08-080", "lf08-081", "lf08-089", "lf08-090"], "Welche zwei Kontrollen gehören nach der rechnerischen Einteilung auf die Skizze?", "Tatsächliche Lattweite und tatsächliche Deckbreite müssen jeweils im passenden Deckbereich liegen; Bezugskanten und Randmaße werden eindeutig eingetragen.",
      fsFall("Die Breite passt nur mit offenen Falzen", "Die Lattweite passt zum Produkt. Für die Dachbreite müssten die Seitenfalze jedoch über ihren vorgesehenen Bereich auseinandergezogen werden.", [["Breiteneinteilung und Ortgangdetails überarbeiten.", true], ["Die passende Lattweite beweist automatisch eine passende Deckbreite.", false], ["Die wirksamen Deckmaße des gelieferten Materials zur Kontrolle verwenden.", true]], "Längen- und Breiteneinteilung sind zwei getrennte Prüfungen desselben Daches.")),
  ] },
  { id: "lf08-k03", titel: "Deckarten und Wasserführung", einheiten: [
    fsEinheit("lf08-l09", "Deckart und Dachneigung verbinden", "Du kannst erklären, warum die Dachneigung zusammen mit Deckart und Zusatzebene beurteilt wird.",
      "Die Regeldachneigung ist ein Bezugswert für die Regensicherheit einer bestimmten Deckung. Sie beschreibt nicht allein die Form eines einzelnen Ziegels. Beim Biberschwanz beeinflusst die Anordnung der Reihen, wie Fugen überdeckt werden. Einfachdeckung mit Spließen, Kronendeckung und Doppeldeckung leiten Wasser deshalb unterschiedlich sicher ab. Auch bei anderen Ziegeln verändern Falze, Form und Überdeckung den Wasserweg. Vergleiche für eine Aufgabe immer die genaue Deckart mit der tatsächlichen Dachneigung und den vorgesehenen Zusatzmaßnahmen. Ein Tabellenwert ohne Deckart ist unvollständig. Eine besonders geschützte Unterlage macht umgekehrt nicht jede beliebige Deckung geeignet. Für die Ausführung müssen das konkrete Produkt und die maßgeblichen Planungsunterlagen zusammenpassen.",
      ["lf08-001", "lf08-053", "lf08-054"], "Warum genügt für die Beurteilung eines Biberdachs die Angabe ‚Biberschwanzziegel‘ nicht?", "Erst die Deckart zeigt, wie Reihen und Fugen überdeckt werden. Dazu müssen Dachneigung, Produkt und Zusatzmaßnahmen betrachtet werden.",
      fsZuordnen("Vom Begriff zur Prüffrage", [["Deckart", "Wie liegen Reihen und Fugen übereinander?"], ["Dachneigung", "Wie steil ist die vorhandene Dachfläche?"], ["Regeldachneigung", "Welcher Bezugswert gehört zur konkreten Deckung?"], ["Zusatzmaßnahme", "Welche weitere Schutzfunktion ist geplant?"]], "Keiner dieser Begriffe ersetzt die übrigen Planungsangaben.")),
    fsEinheit("lf08-l10", "Schalen und Überdeckung verstehen", "Du kannst bei Mönch und Nonne den Wasserweg und das Rechenprinzip des Lattenabstands erklären.",
      "Bei der Mönch-und-Nonnendeckung liegen zwei Schalenformen zusammen. Die unteren, nach oben offenen Nonnen sammeln und leiten Wasser. Die darüberliegenden Mönche überdecken die Längsfugen. Betrachte zuerst diesen Querschnitt, bevor du die Längeneinteilung rechnest. Für den im Unterricht behandelten Fall ergibt sich ein größtmöglicher Lattenabstand aus Ziegellänge minus vorgegebener Höhenüberdeckung. Dasselbe Rechenprinzip erscheint beim Krempziegel, obwohl seine Form anders aussieht. Halte dabei Länge und Überdeckung in derselben Einheit. Der berechnete Höchstwert ist noch nicht die fertige Dacheinteilung. Randdetails, tatsächliche Reihenanzahl und produktspezifische Grenzen müssen anschließend zusammenpassen. Eine Vermörtelung hebt diese geometrischen Anforderungen nicht auf.",
      ["lf08-021", "lf08-024", "lf08-025"], "Welche Aufgabe haben Nonne und Mönch jeweils?", "Die nach oben offene Nonne führt Wasser ab. Der darüberliegende Mönch überdeckt die Längsfuge zwischen den unteren Schalen.",
      fsZuordnen("Die Form erklärt die Funktion", [["Nonne", "Untere, nach oben offene wasserführende Schale"], ["Mönch", "Obere Schale über der Längsfuge"], ["Höhenüberdeckung", "Überschneidung aufeinanderfolgender Ziegel"], ["Lattenabstand", "Wird im Übungsfall aus Länge und Überdeckung abgeleitet"]], "Wasserweg und Längeneinteilung sind zwei Ansichten derselben Deckung.")),
    fsEinheit("lf08-l14", "Das Vierziegeleck untersuchen", "Du kannst Vorschnitt und Aufschnitt anhand der beteiligten Ziegel im Eckbereich unterscheiden.",
      "Eine Hohlpfanne besitzt einen gewölbten Querschnitt. Das Wasser läuft überwiegend in der Mulde ab. An den Ecken treffen jedoch mehrere Ziegel zusammen; dort beeinflussen Schnittform und Überdeckung den Wasserweg. Die vorhandenen Beispiele unterscheiden Vorschnittdeckung und Aufschnittdeckung. Beim Vorschnitt liegen im betrachteten Eckbereich drei Ziegel übereinander, beim Aufschnitt vier. Merke dir das nicht nur als Zahlenpaar: Lege das Eck gedanklich Schicht für Schicht frei und verfolge jede Fuge bis zur darüberliegenden Überdeckung. Die Schnittart gehört deshalb zur Produkt- und Deckungsbeschreibung. Ein äußerlich ähnlicher Ersatzziegel kann am Eck anders aufliegen. Vor dem Austausch müssen Form, Überdeckung und Anschluss an die Nachbarziegel geprüft werden.",
      ["lf08-016", "lf08-017", "lf08-018"], "Was prüfst du beim Ersatz einer Hohlpfanne außer dem Außenmaß?", "Schnittart, Auflage am Vierziegeleck, Überdeckung und den passenden Anschluss an die benachbarten Ziegel.",
      fsFall("Ähnliches Format, andere Ecke", "Ein Ersatzziegel passt ungefähr in Länge und Breite. Sein Eckenschnitt unterscheidet sich vom vorhandenen Modell.", [["Das Vierziegeleck vor der Freigabe zusammensetzen und prüfen.", true], ["Ähnliche Außenmaße beweisen die Austauschbarkeit.", false], ["Auch Auflage und Wasserweg an den Fugen beachten.", true]], "Die Eckenausbildung ist ein funktionaler Teil der Deckung.")),
    fsEinheit("lf08-l15", "Dachsteine mit den richtigen Deckmaßen", "Du kannst aus Länge und vorgegebener Überdeckung einen Höchstabstand berechnen.",
      "Ein Dachstein hat ebenso wie ein Dachziegel Außenmaße und wirksame Deckmaße. Bei einem verfalzten Modell begrenzen Falze die Bewegung zwischen benachbarten Steinen. Die Höhenüberdeckung beeinflusst den möglichen Traglattenabstand. Ein einfaches Übungsbeispiel: Bei 420 mm Steinlänge und vorgegebenen 85 mm Überdeckung bleiben 335 mm. Diese Zahl ist ein Höchstabstand unter den genannten Voraussetzungen. Sie gilt nicht automatisch für andere Modelle oder Deckarten. Ein Dachstein im Biberformat wird anders angeordnet als ein profiliertes, verfalztes Modell. Prüfe deshalb zuerst Produkt, Deckart und zugrunde gelegte Überdeckung. Erst danach wählst du eine passende ganze Reihenzahl und kontrollierst die tatsächlich entstehende Lattweite.",
      ["lf08-033", "lf08-038", "lf08-039"], "Was folgt im Übungsbeispiel aus 420 mm Länge und 85 mm Überdeckung?", "420 − 85 = 335 mm Höchstabstand im beschriebenen Fall. Die tatsächliche Lattweite folgt erst aus der Dacheinteilung.",
      fsFall("Millimeter und Zentimeter gemischt", "In einer Rechnung steht: 42 cm Steinlänge minus 85 mm Überdeckung = −43. Das Ergebnis soll ein Lattenabstand sein.", [["Vor dem Subtrahieren beide Maße in dieselbe Einheit umrechnen.", true], ["Mit Millimetern ergeben sich 420 − 85 = 335 mm.", true], ["Das negative Ergebnis ohne Prüfung in die Materialliste übernehmen.", false]], "Einheitliche Längeneinheiten sind Voraussetzung für eine sinnvolle Differenz.", ["Steinlänge: 42 cm", "Vorgegebene Überdeckung: 85 mm", "Fehler: 42 - 85 = -43"])),
  ] },
  { id: "lf08-k04", titel: "Biber und Falzziegel einteilen", einheiten: [
    fsEinheit("lf08-l16", "Doppel oder Krone: die Latte entscheidet", "Du kannst Doppel- und Kronendeckung anhand der Reihen je Latte unterscheiden.",
      "Bei der Biber-Doppeldeckung trägt jede Latte eine Ziegelreihe. Die versetzten Reihen überdecken einander so, dass auch das übernächste Gebinde zur Deckwirkung beiträgt. Bei der Kronendeckung liegen dagegen zwei Reihen auf derselben Latte: die Lagerschicht und die versetzte Deckschicht. Beide Deckarten verwenden ähnliche Ziegel, benötigen aber eine andere Latteneinteilung. Im vereinfachten Rechenmodell der Doppeldeckung wird Ziegellänge minus vorgegebene Höhenüberdeckung halbiert. Die Halbierung gehört zur Anordnung der Reihen und ist kein pauschaler Abschlag. Zeichne deshalb zwei benachbarte Latten mit ihren Reihen, bevor du rechnest. So kannst du auch erklären, warum eine Materialmenge nicht allein aus der Zahl der Latten folgt.",
      ["lf08-009", "lf08-010", "lf08-011", "lf08-012"], "Warum wird beim Rechenmodell der Doppeldeckung durch zwei geteilt?", "Die Überdeckung erstreckt sich über zwei Reihenabstände. Jede Latte trägt eine Reihe; deshalb verteilt sich die verbleibende Länge auf zwei Abstände.",
      fsZuordnen("Gleicher Biber, andere Anordnung", [["Doppeldeckung", "Eine Ziegelreihe je Latte"], ["Kronendeckung", "Lager- und Deckschicht auf derselben Latte"], ["Halbverband", "Seitlicher Versatz der Fugen"], ["Höhenüberdeckung", "Längsüberdeckung in Richtung First und Traufe"]], "Das Deckschema bestimmt die Rechnung, nicht allein der Ziegelname.")),
    fsEinheit("lf08-l17", "Warum die Einfachdeckung Spließe braucht", "Du kannst den Zweck der Spließe und den Unterschied zur Doppeldeckung erklären.",
      "Die Biber-Einfachdeckung besitzt eine Ziegelreihe je Latte. Anders als bei der Doppeldeckung bleiben die Längsfugen nicht durch einen seitlich versetzten Verband überdeckt. Deshalb werden Spließe unter diese Fugen gelegt. Sie übernehmen dort eine begrenzte wasserführende Aufgabe. Folge in einer Skizze einer Fuge von der Traufe nach oben und prüfe, welches Bauteil darunterliegt. Der Lattenabstand wird im behandelten Übungsmodell aus Ziegellänge minus vorgegebener Überdeckung ermittelt; die Halbierung der Doppeldeckung entfällt. Daraus darfst du keine allgemeine Eignung für jede Dachneigung ableiten. Deckart, konkrete Überdeckung, Zustand der Spließe und ergänzender Dachaufbau gehören gemeinsam zur Beurteilung dieser Konstruktion.",
      ["lf08-004", "lf08-006", "lf08-008"], "Was würde fehlen, wenn eine Einfachdeckung ohne Spließe ausgeführt würde?", "Unter den durchlaufenden offenen Längsfugen fehlte die dafür vorgesehene Unterlegung zur Wasserführung.",
      fsFall("Eine Lage mit offener Fuge", "Ein Deckschema zeigt je Latte eine Reihe ohne Seitenversatz. Unter der durchgehenden Längsfuge ist kein Spließ eingezeichnet.", [["Die im Schema vorgesehene Fugenunterlegung fehlt.", true], ["Das Schema wird allein durch seinen Namen zur Doppeldeckung.", false], ["Den Wasserweg unter der Längsfuge ergänzen und prüfen.", true]], "Eine Ziegelreihe je Latte reicht als Beschreibung nicht aus; entscheidend ist die Überdeckung der Fugen.", ["Reihe oben: Fuge an derselben Stelle", "Reihe unten: Fuge an derselben Stelle", "Unter der Fuge: kein Spließ"])),
    fsEinheit("lf08-l20", "Falze führen und begrenzen", "Du kannst erklären, wie Längs- und Querfalze die Einteilung beeinflussen.",
      "Bei verfalzten Ziegeln greifen benachbarte Teile ineinander. Längsfalze liegen zwischen den Ziegeln einer Reihe und bestimmen die mögliche Deckbreite. Querfalze verbinden die aufeinanderfolgenden Reihen und begrenzen die Decklänge. Ein Verschiebeziegel bietet innerhalb seines Systems einen bestimmten Spielraum in der Länge. Das ist bei einer Umdeckung hilfreich, ersetzt aber keine Prüfung der vorhandenen Lattung. Messe den tatsächlichen Abstand und vergleiche ihn mit dem Deckbereich des vorgesehenen Produkts. Ein Strangfalzziegel oder eine Hohlpfanne kann ein anderes Überdeckungsprinzip besitzen. Vermeide deshalb den Schluss, dass jeder ähnlich aussehende Ziegel dieselben Maße zulässt. Die Falze sollen passend ineinandergreifen und dürfen nicht durch eine erzwungene Einteilung verspannt werden.",
      ["lf08-026", "lf08-027", "lf08-028"], "Welche Prüfung braucht ein Verschiebeziegel bei einer Umdeckung auf vorhandener Lattung?", "Der tatsächliche Lattenabstand muss im zulässigen Decklängenbereich des konkreten Produkts liegen; die übrigen Anschlüsse müssen ebenfalls passen.",
      fsZuordnen("Falzrichtung und Einteilung", [["Längsfalz", "Beeinflusst die Deckbreite innerhalb einer Reihe"], ["Querfalz", "Beeinflusst die Decklänge zwischen den Reihen"], ["Verschiebeziegel", "Bietet einen produktabhängigen Spielraum in der Länge"], ["Vorhandene Lattung", "Muss vor einer Umdeckung vermessen werden"]], "Ein Spielraum ist eine begrenzte Produkteigenschaft und kein beliebiger Verstellbereich.")),
  ] },
  { id: "lf08-k05", titel: "Unterkonstruktion und sichere Ränder", einheiten: [
    fsEinheit("lf08-l08", "First und Ortgang als Funktionsdetails", "Du kannst am Dachrand Wasserführung, Befestigung und Lüftung getrennt prüfen.",
      "First und Ortgang schließen die Dachdeckung ab. An diesen Stellen treffen mehrere Aufgaben zusammen: Wasser soll draußen bleiben, Deckelemente müssen gehalten werden und vorgesehene Lüftungswege dürfen nicht verschlossen werden. Ein Trockenfirst löst diese Aufgaben mit aufeinander abgestimmten Systemteilen. Bei einem Mörtelfirst ist zusätzlich zu prüfen, wie die mechanische Sicherung hergestellt wird. Der Mörtel allein ist kein Beleg für ausreichenden Halt gegen Wind. Am Ortgang beeinflussen Randziegel, Unterkonstruktion und Anschluss an die Wand die Ausführung. Prüfe jeden Rand deshalb mit drei getrennten Fragen: Wohin gelangt Wasser, wodurch wird das Bauteil gehalten und wo strömt die geplante Luft? Die erforderlichen Maße stammen aus der konkreten Planung.",
      ["lf08-043", "lf08-047", "lf08-049"], "Welche drei Funktionen kontrollierst du an einem Firstdetail?", "Regensicherer Abschluss und Wasserweg, geeignete mechanische Befestigung sowie die vorgesehene Lüftung.",
      fsFall("Mörtel als einzige Sicherung", "Für einen First ist nur ein Mörtelbett eingezeichnet. Eine zusätzliche Befestigung und der Lüftungsweg fehlen im Detail.", [["Die mechanische Sicherung muss geklärt werden.", true], ["Der vorgesehene Lüftungsweg muss im Detail erkennbar sein.", true], ["Das Mörtelbett beantwortet automatisch beide Fragen.", false]], "Ein Detail ist erst verständlich, wenn alle vorgesehenen Funktionen nachvollziehbar gelöst sind.")),
    fsEinheit("lf08-l11", "Konterlatten schaffen einen durchgehenden Weg", "Du kannst die Richtung von Konterlattung und Traglattung mit ihrer Funktion begründen.",
      "Auf einer üblichen Steildachfläche verlaufen Konterlatten in Richtung der Sparren. Dadurch bleibt zwischen zusätzlicher wasserführender Ebene und Deckung ein Weg entlang der Dachneigung. Quer darüber liegen die Traglatten für die Deckelemente. Der Abstand allein genügt jedoch nicht: Lüftungsöffnungen und Ablaufwege müssen an Traufe, Einbauteilen und First passend weitergeführt werden. Eine Aufsparrendämmung verändert außerdem die Befestigungsaufgabe. Kräfte aus der Deckung müssen durch den Aufbau in die tragende Konstruktion gelangen, ohne die Dämmung unzulässig zusammenzudrücken. Dafür sind abgestimmte Befestigungslösungen erforderlich. In der Skizze zeichnest du deshalb nicht nur Latten, sondern auch die Richtung des Wasserwegs und die Verbindung zur tragenden Konstruktion ein.",
      ["lf08-078", "lf08-079", "lf08-110"], "Warum reicht ein vorhandener Hohlraum als Nachweis einer funktionierenden Hinterlüftung nicht aus?", "Der Raum braucht passende Zu- und Abluftwege und muss an Einbauteilen weitergeführt werden. Ein blockierter Hohlraum wird nicht ausreichend durchströmt.",
      fsFall("Die querliegende Sperre", "Eine Detailidee legt eine durchgehende Querleiste direkt auf die wasserführende Ebene. Sie sperrt den Weg zur Traufe.", [["Die Leiste kann den vorgesehenen Ablaufweg unterbrechen.", true], ["Die Anordnung und Überleitung des Wassers müssen überarbeitet werden.", true], ["Eine dickere Deckpfanne beseitigt die Sperre darunter.", false]], "Konterlattung schafft einen Weg entlang der Dachneigung; Quersperren müssen im Detail berücksichtigt werden.", ["Oben: Deckung auf Traglatten", "Darunter: Weg in Richtung Traufe", "Fehler: Querleiste sperrt den Wasserweg"])),
    fsEinheit("lf08-l18", "Die Latte ist ein tragendes Bauteil", "Du kannst die Auswahl von Latten und Verbindungsmitteln mit Last und Stützweite begründen.",
      "Traglatten tragen die Deckung und geben ihre Lasten an die Unterkonstruktion weiter. Deshalb sind Holzqualität, Querschnitt und Befestigung zusammen zu betrachten. Eine größere Stützweite kann die Biegung erhöhen; ein äußerlich ähnlicher Querschnitt ist deshalb nicht automatisch geeignet. Kontrolliere vor dem Einbau Kennzeichnung, erkennbare Schäden und den Feuchtezustand. Bei einer Befestigung zählen nicht nur Kopfform und sichtbare Länge. Auch Verbindungsmittelart, Untergrund und wirksame Eindringtiefe gehören zur geplanten Verbindung. Die Tabellen der Quellen geben Beispiele unter bestimmten Voraussetzungen. Für eine abweichende Konstruktion müssen passende Nachweise oder freigegebene Angaben herangezogen werden. Dokumentiere auffällige Latten, bevor sie unter der Deckung verschwinden und kaum noch kontrollierbar sind.",
      ["lf08-073", "lf08-075", "lf08-077"], "Warum kannst du einen Lattenquerschnitt nicht ohne Angabe der Stützweite beurteilen?", "Die Latte überbrückt den Abstand zwischen Auflagern. Mit der Stützweite ändern sich die Beanspruchung und die erforderliche Tragfähigkeit.",
      fsZuordnen("Vor der Montage prüfen", [["Holzkennzeichnung", "Gibt Hinweise auf die vorgesehene Qualität"], ["Stützweite", "Abstand zwischen den tragenden Auflagern"], ["Verbindungsmittel", "Überträgt Kräfte in die Unterkonstruktion"], ["Holzfeuchte", "Beeinflusst den Zustand und spätere Maßänderungen"]], "Die Eignung entsteht aus dem Zusammenwirken von Holz, Geometrie und Verbindung.")),
    fsEinheit("lf08-l19", "Zusatzmaßnahmen aus dem Dachfall ableiten", "Du kannst Auslöser für zusätzliche Schutzmaßnahmen an einem Steildach benennen.",
      "Ein ausgebautes Dachgeschoss stellt andere Anforderungen an den Schutz unter der Deckung als ein einfacher offener Dachraum. Hinzu kommen Dachneigung, Form, lange Wasserwege und eine besonders beanspruchte Lage. Diese Bedingungen werden gemeinsam bewertet, bevor eine Zusatzmaßnahme gewählt wird. Die Entscheidung ist deshalb mehr als die Auswahl einer beliebigen Bahn. Unterlage, Fügung, Befestigung, Durchdringungen und Ableitung zur Traufe müssen zur vorgesehenen Schutzwirkung passen. In den vorhandenen Quellen stehen unterschiedliche vereinfachte Grenzangaben. Behandle sie als Teil der jeweiligen Lernquelle und leite daraus keine pauschale Freigabe für einen realen Dachfall ab. Eine belastbare Planung benennt die konkrete Deckung, die Anforderungen und die dafür geeignete vollständige Zusatzkonstruktion.",
      ["lf08-056", "lf08-063", "lf08-064"], "Welche Angaben brauchst du außer der Dachneigung für die Wahl einer Zusatzmaßnahme?", "Zum Beispiel Nutzung, Dachform, Wasserweglänge, Lage und Beanspruchung sowie Deckprodukt und geplante Ausführung der zusätzlichen Ebene.",
      fsFall("Gleiche Neigung, anderer Dachfall", "Zwei Dächer haben dieselbe Neigung. Eines besitzt einen einfachen offenen Dachraum, das andere ausgebaute Räume und viele Durchdringungen.", [["Die gleiche Neigung garantiert keine identische Zusatzkonstruktion.", true], ["Nutzung und gegliederte Anschlüsse in die Planung aufnehmen.", true], ["Nur die Farbe der Unterdeckbahn entscheidet.", false]], "Die Schutzanforderung entsteht aus dem gesamten Dachfall.")),
    fsEinheit("lf08-l21", "Traufe und Einbauteile mitdenken", "Du kannst Wasserweg, Luftzutritt und zusätzliche Lasten an der Traufe prüfen.",
      "An der Traufe treffen die Deckung, die zusätzliche wasserführende Ebene und die Dachentwässerung zusammen. Verfolge beide Wasserwege getrennt: Regen auf der Deckung und Wasser unter der Deckung müssen planmäßig weitergeführt werden. Gleichzeitig soll der vorgesehene Luftzutritt frei bleiben. Rinnenlage, Traufblech und erste Ziegelreihe beeinflussen sich deshalb gegenseitig. Einbauteile wie Laufroste oder integrierte Solarmodule bringen weitere Befestigungs- und Anschlussaufgaben hinzu. Ein Solarmodul ist nicht automatisch eine sichere Trittfläche. Kläre vor der Ausführung Produktvorgaben, Lastabtragung, Zugänglichkeit und die Zuständigkeit für technische Anschlüsse. In einer guten Detailzeichnung lassen sich Wasser, Luft und Kräfte jeweils als eigener Weg verfolgen, ohne dass ein Bauteil den anderen Weg versehentlich sperrt.",
      ["lf08-040", "lf08-042", "lf08-051"], "Welche drei Wege sollten sich in einem Traufdetail nachvollziehen lassen?", "Wasser von und unter der Deckung zur Ableitung, der vorgesehene Luftzutritt sowie die Lastabtragung der Deckung und Einbauteile.",
      fsZuordnen("Drei Funktionen am Dachrand", [["Traufblech", "Unterstützt die geplante Wasserüberleitung"], ["Lüftungsöffnung", "Ermöglicht den vorgesehenen Luftzutritt"], ["Befestigung eines Einbauteils", "Leitet zusätzliche Kräfte weiter"], ["Rinnenlage", "Beeinflusst den Übergang von Deckung zu Entwässerung"]], "Die Wege werden gemeinsam geplant und einzeln kontrolliert.")),
    fsEinheit("lf08-l22", "Was Mörtel leisten soll", "Du kannst Fugensicherung und mechanische Windsogsicherung auseinanderhalten.",
      "Mörtel kann an einer Dachdeckung Fugen ausfüllen oder die Lage einzelner Teile unterstützen. Die vorhandene Lektion unterscheidet Längsschlag, Querschlag und Innenverstrich. Die Namen sagen, an welcher Fuge gearbeitet wird. Daraus folgt jedoch nicht, dass eine Vermörtelung jede andere Sicherung ersetzt. Insbesondere ist die mechanische Befestigung gegen Wind eine eigene Planungsaufgabe. Auch eine zusätzliche wasserführende Ebene wird nicht durch einen bloßen Innenverstrich gleichwertig ersetzt. Prüfe bei einer Reparatur zuerst, welche Funktion das vorhandene Mörteldetail erfüllen sollte und warum es geschädigt ist. Einfach neuen Mörtel auf eine bewegte oder unzureichend befestigte Stelle aufzutragen, kann die Ursache verdecken. Mischung und Verarbeitung müssen zum vorgesehenen System passen.",
      ["lf08-059", "lf08-060", "lf08-061"], "Warum darf ein frisch vermörtelter First nicht allein deshalb als gegen Wind gesichert gelten?", "Fugensicherung durch Mörtel und mechanische Befestigung erfüllen verschiedene Aufgaben. Die geplante Windsogsicherung muss zusätzlich nachvollziehbar sein.",
      fsFall("Nur neu verstreichen?", "An einem First sind Mörtelstücke ausgebrochen. Als einzige Maßnahme wird ein neuer Innenverstrich vorgeschlagen.", [["Ursache, Bewegung und vorhandene Befestigung untersuchen.", true], ["Die mechanische Sicherung unabhängig vom Mörtel prüfen.", true], ["Frischer Mörtel ist automatisch der Nachweis ausreichender Windsogsicherung.", false]], "Eine Reparatur muss die Ursache und alle vorgesehenen Funktionen erfassen.")),
  ] },
];

const LF09_KAPITEL: LernKapitel[] = [
  { id: "lf09-k01", titel: "Plattenwerkstoffe und Deckunterlagen", einheiten: [
    fsEinheit("lf09-l01", "Warum sich Schiefer spalten lässt", "Du kannst die Entstehung von Schiefer mit seiner Bearbeitbarkeit verbinden.",
      "Dachschiefer ist ein Naturstein mit einer besonderen inneren Struktur. Aus feinkörnigem Ausgangsmaterial entstand unter Druck und geologischer Umwandlung ein Gestein mit bevorzugten Spaltflächen. Deshalb lässt es sich zu dünnen Platten verarbeiten. Diese Eigenschaft macht jedoch nicht jedes Stück automatisch zu einem geeigneten Deckstein. Vorkommen, Einschlüsse, Risse und Verwitterungsverhalten beeinflussen die Qualität. Beim Zurichten mit Schieferhammer und Haubrücke wird die vorhandene Spaltbarkeit genutzt, um passende Formen herzustellen. Betrachte daher Materialherkunft, sichtbaren Zustand und Verarbeitung gemeinsam. Eine gleichmäßige dunkle Farbe allein beweist keine hohe Gebrauchstauglichkeit. Der Naturstein muss sowohl in seiner Struktur als auch in seiner Form zur vorgesehenen Deckung passen.",
      ["lf09-001", "lf09-002", "lf09-020"], "Wie hängt die geologische Struktur von Schiefer mit seiner Verwendung als Dachplatte zusammen?", "Die gerichtete Gesteinsstruktur ermöglicht das Spalten in dünne Platten. Für die Eignung müssen zusätzlich Qualität, Zustand und Verarbeitung stimmen.",
      fsZuordnen("Vom Gestein zum Deckstein", [["Geologische Umwandlung", "Verändert Struktur und Ausrichtung des Ausgangsmaterials"], ["Spaltfläche", "Ermöglicht das Trennen dünner Platten"], ["Zurichten", "Bringt den Rohling in die benötigte Form"], ["Einschluss", "Kann das Verwitterungsverhalten beeinflussen"]], "Spaltbarkeit erklärt die Bearbeitbarkeit, ersetzt aber keine Qualitätsbeurteilung.")),
    fsEinheit("lf09-l14", "Schiefer prüfen und passend beschreiben", "Du kannst handwerkliche Proben und Handelsformen ihrem Zweck zuordnen.",
      "Eine Schieferplatte lässt sich mit mehreren handwerklichen Proben untersuchen. Die Sichtprobe sucht nach auffälligen Oberflächen und Rissen. Tast- und Behauprobe geben Hinweise auf Beschaffenheit und Bearbeitbarkeit. Bei der Klangprobe kann ein auffälliger Klang auf Schäden hinweisen; die Ritzprobe liefert weitere Hinweise zur Materialbeschaffenheit. Keine einzelne Probe ersetzt die vollständige Beurteilung oder eine erforderliche Produktprüfung. Auch die Handelsform ist wichtig: Unterschiedlich große altdeutsche Decksteine verlangen eine andere Sortierung als gleichförmige Schuppenschablonen oder Rechteckplatten. Schreibe bei einer Materialanforderung deshalb nicht nur ‚Schiefer‘ auf. Form, Sortierung, Dicke und vorgesehene Deckart müssen so beschrieben sein, dass ein passender Werkstoff geliefert und kontrolliert werden kann.",
      ["lf09-004", "lf09-005", "lf09-006", "lf09-008"], "Warum reicht eine unauffällige Klangprobe allein nicht zur vollständigen Materialfreigabe?", "Sie untersucht nur einen Teil möglicher Eigenschaften. Sichtbarer Zustand, weitere Proben und die geforderten Produkteigenschaften bleiben zu prüfen.",
      fsZuordnen("Prüfen und bestellen", [["Sichtprobe", "Sucht erkennbare Auffälligkeiten"], ["Behauprobe", "Untersucht die Bearbeitbarkeit"], ["Klangprobe", "Kann Hinweise auf Risse geben"], ["Handelsform", "Beschreibt die gelieferte Form und Sortierung"]], "Mehrere Informationen ergänzen sich zu einer begründeten Materialbeurteilung.")),
    fsEinheit("lf09-l15", "Faserzement eindeutig bestellen", "Du kannst Aufbau, Eigenschaften und Bestellangaben von Faserzement unterscheiden.",
      "Faserzement ist ein industriell hergestellter Verbundwerkstoff aus Zement, Fasern, Zusatzstoffen und Wasser. Die Fasern übernehmen eine verstärkende Aufgabe; weitere Prozessfasern unterstützen die Herstellung. Für die Verwendung zählen unter anderem geeignete Festigkeit, Witterungsbeständigkeit und die passende Oberflächenbeschaffenheit. Eine Bestellung muss die gewünschte Plattenform eindeutig machen. Die Quelle nennt Form, Breite mal Höhe und Eckenausbildung als wichtige Angaben. Vertauschte Maße können eine andere Platte bezeichnen. Bei vorhandenen alten Platten ist außerdem die Materialzusammensetzung zu klären. Ein unklarer Altbestand wird nicht durch Aussehen oder eine aktuelle Produktbezeichnung sicher bestimmt. Vor einer Bearbeitung müssen Material und geeignete Arbeitsweise feststehen; insbesondere ein möglicher Asbestgehalt darf nicht übergangen werden.",
      ["lf09-011", "lf09-012", "lf09-015", "lf09-016"], "Welche Angaben machen eine Faserzementbestellung eindeutiger als die Bezeichnung ‚Dachplatte‘?", "Form, Breite und Höhe in einer eindeutigen Einheit, Eckenausbildung sowie das zum Decksystem passende Produkt.",
      fsFall("Unklare Platten auf dem Altbau", "Die vorhandenen Platten sind alt und unbeschriftet. Für eine Anpassung soll sofort eine Ecke abgeschnitten werden.", [["Material vor einer Bearbeitung klären.", true], ["Ein ähnliches aktuelles Produkt beweist die Zusammensetzung des Altbestands.", false], ["Bei möglichem Asbestgehalt das dafür geeignete Vorgehen veranlassen.", true]], "Eine Bestandsplatte darf nicht allein anhand ihrer Form als moderner Faserzement eingestuft werden.")),
    fsEinheit("lf09-l03", "Die Befestigung braucht eine passende Unterlage", "Du kannst den Lastweg von der Schieferplatte bis zur tragenden Konstruktion beschreiben.",
      "Eine Schieferplatte wird durch geeignete Verbindungsmittel an ihrer Deckunterlage gehalten. Diese Unterlage muss die Kräfte weitertragen können. Bei einer Vollschalung zählen deshalb nicht nur Brettdicke und Oberfläche, sondern auch Holzqualität, Stützweite und Befestigung auf den Sparren. Bei anderen Unterlagen kann ein anderes Verbindungssystem erforderlich sein. Übertrage einen Nagel deshalb nicht allein nach seiner Länge auf jeden Untergrund. Korrosionsverträglichkeit, Kopfform und wirksamer Halt müssen zum Decksystem passen. Zeichne für eine Kontrolle den Weg der Kräfte: Platte, Verbindungsmittel, Schalung oder Lattung und schließlich tragende Konstruktion. Eine sorgfältig gelochte Platte kann eine ungeeignete Unterlage nicht ausgleichen. Die konkrete Auswahl folgt den freigegebenen Angaben für den vorhandenen Aufbau.",
      ["lf09-017", "lf09-023", "lf09-096"], "Warum genügt für die Befestigungsauswahl die Angabe der Nagellänge nicht?", "Unterlage, Halt, Kopfform, Korrosionsverträglichkeit und die vollständige Lastabtragung müssen ebenfalls zum Decksystem passen.",
      fsOrdnen("Kräfte bis zum Sparren verfolgen", ["Wind beansprucht die Deckplatte", "Verbindungsmittel hält die Platte", "Deckunterlage nimmt die Verbindungskraft auf", "Befestigung der Unterlage leitet die Kraft weiter", "Tragende Konstruktion übernimmt die Last"], "Jeder Übergang gehört zur Befestigungsaufgabe.")),
    fsEinheit("lf09-l16", "Schalung und Vordeckung gemeinsam prüfen", "Du kannst Tragfunktion und Schutzfunktion unter einer Schieferdeckung trennen.",
      "Eine Schalung gibt den kleinen Decksteinen eine zusammenhängende Auflage und Halt für die Befestigung. Federt sie stark oder verändert sich durch Trocknung, kann dies die darüberliegende Deckung beeinträchtigen. Deshalb werden Holzqualität, Feuchte, Brettabmessungen und Auflagerabstände gemeinsam geprüft. Eine Vordeckung erfüllt eine andere Aufgabe: Sie unterstützt den zeitweiligen Schutz und die geplante zusätzliche Wasserführung unter der Deckung. Sie macht eine schwache Schalung nicht tragfähig. Rechteckdeckungen können je nach System auch auf Lattung ausgeführt werden; dann passen Deckschema, Befestigung und Lattenanordnung zusammen. Kontrolliere den vorgesehenen Aufbau vor dem Eindecken. Später verdecken die Steine die Unterlage, und ein Austausch wird wesentlich aufwendiger.",
      ["lf09-017", "lf09-018", "lf09-019"], "Warum kann eine neue Vordeckung eine stark federnde Schalung nicht reparieren?", "Die Vordeckung übernimmt Schutz- und Wasserführungsaufgaben. Die ausreichende Tragfähigkeit und Befestigung muss die Schalung selbst besitzen.",
      fsFall("Die Bahn soll das Brett verstärken", "Zwischen den Sparren federn beschädigte Schalungsbretter. Vorgeschlagen wird, lediglich eine neue Bahn darüberzulegen.", [["Schalung und Auflager vor dem Eindecken instand setzen beziehungsweise klären.", true], ["Die Vordeckung ersetzt die Tragfähigkeit der Bretter.", false], ["Schutzfunktion der Bahn getrennt von der Tragfunktion der Schalung bewerten.", true]], "Eine zusätzliche Lage löst nicht automatisch das Problem der darunterliegenden Tragkonstruktion.")),
  ] },
  { id: "lf09-k02", titel: "Schiefer bearbeiten und Gebinde führen", einheiten: [
    fsEinheit("lf09-l04", "Lochung und Steigung erfüllen verschiedene Aufgaben", "Du kannst die Form der Lochung und die Richtung der Gebinde funktional erklären.",
      "Bei der Lochung wird eine Befestigungsstelle so hergestellt, dass der vorgesehene Kopf passend sitzt und die nächste Platte nicht auf einer Erhebung aufliegt. Die Quelle beschreibt für Schiefernägel eine Lochung von der Unterseite zur Sichtseite. Für andere Verbindungsmittel ist die passende Bearbeitung gesondert zu beachten. Die Gebindesteigung betrifft dagegen die Lage ganzer Steinreihen zur Traufe. Sie unterstützt bei entsprechenden Deckarten die Wasserableitung an den seitlichen Überdeckungen. Flacher geneigte Dachflächen benötigen im behandelten Modell eine größere Gebindesteigung als steile. Halte beide Themen auseinander: Eine richtig verlaufende Reihe behebt keinen vorstehenden Nagelkopf, und eine saubere Lochung korrigiert keine ungeeignete Gebindesteigung.",
      ["lf09-021", "lf09-024", "lf09-043"], "Welchen Fehler verhindert ein passend sitzender Nagelkopf unter dem nächsten Gebinde?", "Er verhindert, dass die darüberliegende Platte auf einer Erhebung aufreitet und ungünstig beansprucht wird.",
      fsFall("Ein vorstehender Kopf", "Die nächste Platte liegt nur auf einem deutlich vorstehenden Nagelkopf auf und kippelt. Die Gebindelinie verläuft ansonsten richtig.", [["Befestigungsstelle und Lochung überprüfen.", true], ["Die richtige Gebindesteigung beseitigt die punktuelle Auflage.", false], ["Vor dem Weiterdecken eine passende Auflage herstellen.", true]], "Bearbeitung der Einzelplatte und Geometrie der Reihe werden getrennt kontrolliert.", ["Oben: nächste Platte kippelt", "Darunter: Nagelkopf steht vor", "Unten: Deckstein mit Befestigung"])),
    fsEinheit("lf09-l17", "Zurichten, lochen, befestigen", "Du kannst die Bearbeitungsschritte eines Schiefersteins sinnvoll ordnen.",
      "Ein Deckstein muss in Form und Befestigung zum vorgesehenen Platz passen. Zuerst werden benötigte Größe, Hieb und Überdeckung festgelegt. Danach wird der Stein mit geeignetem Werkzeug zugerichtet. Schieferhammer und Haubrücke unterstützen das Behauen; die Schieferschere kann zum Beschneiden dienen. Die Lochung liegt im dafür vorgesehenen überdeckten Bereich und wird passend zum Verbindungsmittel hergestellt. Anschließend wird der Stein so befestigt, dass er sicher sitzt, ohne verspannt zu werden. Prüfe dabei Risse und Auflage. Befestigungspunkte und Stückzahlen hängen von Deckart, Position und System ab. Eine pauschale Zahl für jeden Stein wäre unvollständig. Randsteine, Reparaturstellen und Flächensteine können unterschiedliche Anforderungen besitzen, die vor dem Einbau geklärt werden.",
      ["lf09-020", "lf09-021", "lf09-022", "lf09-024"], "Warum wird die Lage der Lochung vor dem Befestigen mit der Überdeckung verglichen?", "Die Befestigungsstelle muss im vorgesehenen geschützten Bereich liegen und zum Deckschema passen; sonst kann sie offen im Wasserweg liegen.",
      fsOrdnen("Einen Stein vorbereiten", ["Position, Form und nötige Überdeckung bestimmen", "Stein mit geeignetem Werkzeug zurichten", "Lochung passend zur Befestigung herstellen", "Risse und Auflage kontrollieren", "Stein ohne schädliche Verspannung befestigen"], "Die Bearbeitung folgt dem vorgesehenen Platz im Deckschema.")),
    fsEinheit("lf09-l18", "Gebindesteigung mit zwei Grenzen", "Du kannst Mindest- und Höchstgebindesteigung auseinanderhalten und einen Bereich prüfen.",
      "Die Gebindesteigung ist der Winkel der Gebindelinie zur Traufe. Sie darf bei den behandelten Deckarten nicht beliebig gewählt werden. Die Mindeststeigung folgt im Lernmodell aus der Dachneigung; bei flacherem Dach wird sie größer. Die Höchststeigung hängt unter anderem von der Form und dem Brustwinkel des Decksteins ab. Eine geeignete Steigung muss beide Grenzen gleichzeitig erfüllen. Für Rechnungen unterscheidest du außerdem Zentimeter Steigung je Meter und den zugehörigen Winkel. Diese Angaben haben verschiedene Einheiten und sind nicht dieselbe Zahl. Zeichne vor dem Rechnen die Trauflinie und die steigende Gebindelinie ein. Wenn Mindest- und Höchstwert keinen gemeinsamen Bereich lassen, muss die gewählte Decklösung überarbeitet werden.",
      ["lf09-044", "lf09-045", "lf09-046", "lf09-050"], "Was bedeutet es, wenn eine berechnete Mindeststeigung oberhalb der Höchststeigung liegt?", "Für diese Kombination gibt es keinen passenden Steigungsbereich. Decksteinform, Deckart oder andere Planungsannahmen müssen überprüft werden.",
      fsFall("Ein unmöglicher Bereich", "Ein vereinfachter Fall nennt 38° Mindestgebindesteigung und 37° Höchstgebindesteigung.", [["Zwischen den Vorgaben liegt kein gemeinsamer zulässiger Bereich.", true], ["37,5° erfüllt beide Vorgaben.", false], ["Die Decklösung und die zugrunde gelegten Werte prüfen.", true]], "Ein Mittelwert kann widersprüchliche Grenzen nicht auflösen.")),
    fsEinheit("lf09-l05", "Altdeutsch heißt geordnet unterschiedlich", "Du kannst Verjüngung, Hieb und Gebindehöhe an der altdeutschen Deckung erklären.",
      "Das lebendige Bild der altdeutschen Deckung entsteht durch verschieden große Decksteine. Ihre Verteilung ist jedoch geplant. Höhere Steine liegen im unteren Dachbereich; zum First werden die Gebindehöhen kleiner. Diese Verjüngung wird gemeinsam mit Überdeckung und Gebindesteigung festgelegt. Der Hieb beschreibt die Form von Rücken und Brust des Steins. Er beeinflusst, wie Steine seitlich zusammenpassen und Wasser führen. Für einen Schnurabstand brauchst du deshalb die zur Deckung gehörenden Maße. Im einfachen Lernmodell wird von der Steinhöhe die vorgegebene Höhenüberdeckung abgezogen. Bei einer Doppeldeckung verändert sich der Zusammenhang. Sortiere Steine daher nicht nur nach Farbe, sondern nach Größe, Form und vorgesehenem Platz im Deckschema.",
      ["lf09-027", "lf09-029", "lf09-032", "lf09-036"], "Was bedeutet Verjüngung bei der altdeutschen Deckung?", "Die Gebindehöhen nehmen vom unteren Dachbereich zum First hin ab; die Größen werden geplant verteilt.",
      fsZuordnen("Steinform und Deckbild", [["Verjüngung", "Gebindehöhen werden zum First kleiner"], ["Hieb", "Formgebung von Rücken und Brust"], ["Schnurabstand", "Abstand der angezeichneten Gebindelinien"], ["Höhenüberdeckung", "Überdeckter Anteil in der Steinhöhe"]], "Unterschiedliche Steine ergeben erst durch geplante Zuordnung ein funktionierendes Deckbild.")),
  ] },
  { id: "lf09-k03", titel: "Vier Deckbilder im Vergleich", einheiten: [
    fsEinheit("lf09-l06", "Schuppen: gleiches Format, gleiche Einteilung", "Du kannst die Schuppendeckung von der altdeutschen Deckung unterscheiden.",
      "Bei der Schuppendeckung werden innerhalb des vorgesehenen Deckschemas gleichförmige Steine verwendet. Das unterscheidet sie von der altdeutschen Deckung mit verschieden großen Decksteinen und verjüngten Gebindehöhen. Die regelmäßige Form erleichtert eine wiederkehrende Einteilung, hebt aber die Anforderungen an Überdeckung und Gebindesteigung nicht auf. Zuerst werden geeignetes Format und die zum Fall gehörenden Überdeckungen festgelegt. Daraus folgt der Schnurabstand. Die nutzbare Fläche eines Steins ist kleiner als seine volle Außenfläche. Bei der Mengenrechnung werden deshalb wirksame Deckmaße verwendet. Gleiche Steingröße bedeutet somit ein regelmäßiges Deckbild, nicht automatisch denselben Stückbedarf auf jedem Dach. Die angesetzten Überdeckungen und Randbereiche bleiben entscheidend.",
      ["lf09-039", "lf09-040", "lf09-063", "lf09-064"], "Warum kann derselbe Schuppenstein in zwei Übungsfällen einen unterschiedlichen Bedarf je Quadratmeter ergeben?", "Unterschiedliche Überdeckungen verändern seine wirksame Deckfläche. Je kleiner die Deckfläche, desto größer der Stückbedarf.",
      fsZuordnen("Schuppe oder altdeutsch?", [["Gleichförmige Decksteine", "Kennzeichnen das regelmäßige Schuppendeckbild"], ["Verschiedene Steingrößen", "Kennzeichnen die altdeutsche Einteilung"], ["Wirksame Deckfläche", "Außenfläche abzüglich der überdeckten Bereiche"], ["Stückbedarf", "Steigt bei kleinerer nutzbarer Deckfläche"]], "Für die Mengenrechnung zählt die wirksame Fläche, nicht nur das Format.")),
    fsEinheit("lf09-l19", "Bogenschnitt vom Fuß bis zum Grat", "Du kannst die deutsche Deckung als zusammenhängendes Deckschema beschreiben.",
      "Die deutsche Deckung wird auch Bogenschnittdeckung genannt. Ihre Steine besitzen einen charakteristischen gerundeten Schnitt und werden in steigenden Gebinden angeordnet. Rechte und linke Formen gehören zur vorgesehenen Deckrichtung; dafür geeignete Universalformen können mehrere Anordnungen ermöglichen. Entscheidend ist das vollständige Schema von der Traufe bis zum First. Am Fuß laufen die steigenden Reihen aus, am Ort werden passende Anschlusssteine eingebunden. Grat und First brauchen eigene Detailausbildungen. Ein für die Fläche berechneter Schnurabstand erklärt diese Ränder nicht automatisch. Zeichne daher zuerst Deckrichtung und Gebindelinien, ergänze dann die Randsteine und prüfe deren Überdeckung. Bei komplizierten Dachformen muss zusätzlich die Dachgeometrie unabhängig vom Deckbild geklärt sein.",
      ["lf09-065", "lf09-068", "lf09-070", "lf09-073"], "Warum lässt sich ein Flächenschema nicht unverändert bis über jeden Dachrand fortsetzen?", "An Fuß, Ort, Grat und First ändern sich Wasserweg, Reihenabschluss und Befestigung. Dafür sind passende Randdetails nötig.",
      fsOrdnen("Bogenschnittdeckung planen", ["Dachform und Deckrichtung klären", "Geeignete Steine und Überdeckungen festlegen", "Gebindelinien für die Fläche anlegen", "Fuß- und Ortanschlüsse ergänzen", "Grat und First als eigene Details prüfen"], "Die Fläche und ihre Ränder bilden ein zusammenhängendes System.")),
    fsEinheit("lf09-l20", "Waagerecht decken, wirksam rechnen", "Du kannst bei breitkant verlegten Platten Außenfläche und Deckfläche unterscheiden.",
      "Bei der waagerechten Deckung liegen rechteckige Platten breitkant in horizontalen Gebinden. Die Nachbarplatten überdecken sich seitlich und in der Höhe. Für den Bedarf zählt daher nur die wirksame Deckfläche. Ein Übungsfall verwendet 60 cm Breite, 30 cm Höhe, 11 cm Seitenüberdeckung und 9 cm Höhenüberdeckung. Daraus folgen 49 cm wirksame Breite und 21 cm wirksame Höhe, also 1029 cm² Deckfläche. 10000 cm² geteilt durch 1029 cm² ergeben ungefähr 9,72 Platten je Quadratmeter. Das ist der rechnerische Grundbedarf. Bruch, Verhau, Randteile und die kaufbare Stückzahl kommen begründet hinzu. Übertragbare Rechenschritte sind nützlicher als ein auswendig gelernter Tabellenbedarf ohne Voraussetzungen.",
      ["lf09-077", "lf09-080", "lf09-081"], "Warum ergibt 60 mal 30 cm für diesen Übungsfall einen zu kleinen Plattenbedarf?", "Die volle Außenfläche enthält die Überdeckungen. Wirksam sind nur 49 mal 21 cm; deshalb werden mehr Platten benötigt.",
      fsFall("Welche Fläche zählt?", "Eine Materialliste rechnet bei den genannten Übungsmaßen mit 1800 cm² Deckfläche je Platte.", [["Die Überdeckungen sind in dieser Fläche noch nicht abgezogen.", true], ["Die wirksame Fläche beträgt 1029 cm².", true], ["Die Außenfläche und die Deckfläche sind hier identisch.", false]], "Seitliche und obere Überdeckung verkleinern die wiederkehrende Deckfläche.")),
    fsEinheit("lf09-l10", "Warum die dritte Reihe die erste überdeckt", "Du kannst Schnurabstand und Überdeckung einer Rechteckdoppeldeckung verbinden.",
      "Bei der Rechteckdoppeldeckung sind die Fugen benachbarter Reihen versetzt. Die dritte Reihe überdeckt die erste. Dadurch bestimmt nicht nur die nächste Reihe die Deckwirkung. Im Lernmodell lautet der Schnurabstand: Plattenhöhe minus vorgegebene Überdeckung, anschließend geteilt durch zwei. Bei 60 cm Höhe und 10 cm Überdeckung ergibt das 25 cm. Zeichne drei Reihen übereinander, um die Rechnung zu verstehen. Für den Stückbedarf brauchst du zusätzlich die wirksame Breite einschließlich der im Modell angesetzten Fuge. Vergleiche keine unterschiedlichen Deckarten nur nach einem gemeinsamen Außenformat. Auch Unterlage, Befestigung und die Herkunft der verwendeten Neigungs- und Überdeckungsangaben müssen zur konkreten Rechteckdeckung passen.",
      ["lf09-089", "lf09-090", "lf09-091", "lf09-093"], "Wie groß ist der Schnurabstand bei 60 cm Plattenhöhe und 10 cm vorgegebener Überdeckung?", "(60 − 10) / 2 = 25 cm. Die Teilung durch zwei gehört zur Doppeldeckung über zwei Reihenabstände.",
      fsFall("Die Halbierung fehlt", "Eine Skizze bezeichnet das Schema als Rechteckdoppeldeckung. Daneben steht bei 60 cm Höhe und 10 cm Überdeckung ein Schnurabstand von 50 cm.", [["Die Rechnung berücksichtigt die zwei Reihenabstände nicht.", true], ["Im beschriebenen Modell beträgt der Schnurabstand 25 cm.", true], ["Der Begriff Doppeldeckung rechtfertigt jeden beliebigen Abstand.", false]], "Drei gezeichnete Reihen machen die Überdeckung und die nötige Halbierung sichtbar.", ["1. Reihe: Bezug", "2. Reihe: seitlich versetzt", "3. Reihe: überdeckt wieder die 1. Reihe", "Fehler: S = 60 - 10 = 50 cm"])),
  ] },
  { id: "lf09-k04", titel: "Auswahl, Ränder, Mengen und Reparatur", einheiten: [
    fsEinheit("lf09-l02", "Neigungsangaben brauchen eine eindeutige Quelle", "Du kannst widersprüchliche Deckungsangaben erkennen und die fehlenden Voraussetzungen benennen.",
      "Für eine kleinformatige Deckung gehören Dachneigung, Deckart, Werkstoff und Überdeckung zusammen. Eine einzelne Neigungszahl ohne diese Angaben ist leicht missverständlich. In den vorhandenen Lektionen finden sich bei ähnlich benannten Rechteckdeckungen unterschiedliche Zahlen. Übernimm deshalb keine davon ungeprüft als allgemeine Ausführungsfreigabe. Stelle zuerst fest, welche konkrete Konstruktion und welche Quelle gemeint sind. Auch Schiefer und Faserzement sind bei gleichem Deckbild nicht automatisch identisch zu beurteilen. Bei der Planung werden anschließend geeignete Unterlagen und ergänzende Schutzmaßnahmen abgestimmt. Halte eine ungeklärte Abweichung ausdrücklich fest. Eine Rückfrage mit genauer Deckungsbezeichnung ist fachlich hilfreicher als eine scheinbar sichere Antwort aus dem Gedächtnis.",
      ["lf09-026", "lf09-088", "lf09-089"], "Wie gehst du vor, wenn zwei Quellen für eine ähnlich benannte Deckung verschiedene Neigungswerte nennen?", "Genaue Deckart, Werkstoff, Produkt und Voraussetzungen vergleichen und den Widerspruch klären; keinen Wert als allgemeine Freigabe ausgeben.",
      fsFall("Zwei Zahlen für das gleiche Wort", "Ein Arbeitsblatt nennt nur ‚Rechteckdeckung‘. Zwei Quellen liefern verschiedene Neigungswerte, aber ihre Aufbauangaben fehlen.", [["Zuerst die genaue Konstruktion und die Quellenbedingungen vergleichen.", true], ["Den kleineren Wert ohne weitere Prüfung wählen.", false], ["Die offene Abweichung in der Planung kenntlich machen.", true]], "Eine Zahl ist nur mit ihren Voraussetzungen verwendbar.")),
    fsEinheit("lf09-l07", "Der Dachrand ist ein eigenes Gebinde", "Du kannst Fuß, Ort, Grat und First ihren Anschlussaufgaben zuordnen.",
      "Steigende Schiefergebinde beginnen und enden nicht überall mit einem gewöhnlichen Flächenstein. Am Fuß führen besondere Steine die Reihen von der Traufe in die Fläche. Am seitlichen Ort werden Anfang und Ende der Deckrichtung unterschiedlich ausgebildet. Stichsteine helfen, Höhenunterschiede zwischen Gebinden zu schließen und den Wasserweg zu führen. Am Grat treffen zwei Dachflächen zusammen; dort muss die Überdeckung zur Wetterbeanspruchung und zur geplanten Deckrichtung passen. Unter dem First können auslaufende Reihen durch passende Abschlussgebinde ergänzt werden. Markiere diese Bereiche bereits in der Materialskizze. Wer nur Flächensteine bestellt, übersieht sowohl besondere Formen als auch zusätzliche Bearbeitungs- und Befestigungsaufgaben an den Rändern.",
      ["lf09-051", "lf09-052", "lf09-053", "lf09-055"], "Warum werden Anfangort und Endort in einer Schieferplanung getrennt benannt?", "Sie liegen an verschiedenen Enden der Deckrichtung und benötigen passende Anschlusssteine sowie eine unterschiedliche Einbindung in die Gebinde.",
      fsZuordnen("Welcher Rand, welche Aufgabe?", [["Fußgebinde", "Führt von der Traufe in die steigenden Reihen"], ["Anfangort", "Beginnt die Gebinde an der Seitenkante"], ["Endort", "Schließt die Gebinde an der Gegenkante"], ["Grat", "Verbindet die Deckungen zweier Dachflächen"]], "Randsteine gehören schon zur Planung und Materialermittlung.")),
    fsEinheit("lf09-l08", "Kilogramm, Meter und Stück sauber trennen", "Du kannst Mengenansätze für unregelmäßige Decksteine und gleichförmige Schablonen unterscheiden.",
      "Altdeutsche Decksteine unterscheiden sich innerhalb einer Sortierung in Größe und Breite. Eine genaue Bestellung nur nach Stückzahl passt deshalb schlecht zu dieser Materialart. Die Quelle verwendet für die Fläche Masse je Quadratmeter und für besondere Ränder Masse je laufendem Meter. Bei gleichförmigen Schablonen kann dagegen mit einer wirksamen Deckfläche und einem Stückbedarf gerechnet werden. Trenne zunächst Dachfläche und gesondert gerechnete Randbereiche. Verwende anschließend für jeden Bereich den passenden Mengenansatz und ergänze begründete Zuschläge. Kontrolliere die Einheit jedes Ergebnisses. Quadratmeter mal Kilogramm je Quadratmeter ergeben Kilogramm; Meter mal Kilogramm je Meter ebenso. So vermeidest du, dass Randmaterial doppelt oder gar nicht erfasst wird.",
      ["lf09-056", "lf09-059", "lf09-060", "lf09-061"], "Warum werden Flächendecksteine und Fußgebinde mit unterschiedlichen Bezugsgrößen gerechnet?", "Die Fläche wird in Quadratmetern, der Rand in laufenden Metern erfasst. Jeder Bereich erhält den dazu passenden Mengenansatz.",
      fsOrdnen("Eine nachvollziehbare Schieferliste", ["Gesamte Dachgeometrie aufnehmen", "Fläche und gesonderte Randbereiche abgrenzen", "Passende Ansätze in kg/m² oder kg/m wählen", "Grundmassen für jeden Bereich berechnen", "Zuschläge begründen und Bestellung zusammenstellen"], "Getrennte Bereiche verhindern Doppelerfassungen und fehlendes Randmaterial.")),
    fsEinheit("lf09-l09", "Die Raute braucht eigene Bezugslinien", "Du kannst Abschnitt, Überhang und wirksame Höhe einer Spitzwinkeldeckung unterscheiden.",
      "Eine auf der Spitze stehende Platte wirkt wie eine Raute. Ihre sichtbare Höhe ist nicht einfach die Länge einer schrägen Außenkante. Für die Einteilung werden deshalb eindeutige Bezugslinien benötigt. Der Abschnitt bezeichnet die gestutzte Ecke, der Überhang den vorgesehenen Überstand an der Spitze. Beide können die nutzbare Höhe beeinflussen. Die vorhandene Lektion zeigt dazu eigene Rechenmodelle für Schiefer und Faserzement. Schreibe vor dem Einsetzen auf, welches Format und welches Modell du verwendest. Für einen Stückbedarf wird die wirksame Deckfläche ermittelt und auf einen Quadratmeter bezogen. Die bloße volle Rautenfläche wäre wegen der Überdeckungen zu groß. Kontrolliere außerdem, ob Zentimeter oder Millimeter in der Skizze stehen.",
      ["lf09-082", "lf09-083", "lf09-085", "lf09-087"], "Warum darfst du bei einer Spitzwinkelplatte nicht einfach eine schräge Kantenlänge als Deckhöhe einsetzen?", "Die Einteilung bezieht sich auf festgelegte Höhen- und Überdeckungsrichtungen. Abschnitt und Überhang verändern diese wirksamen Maße.",
      fsZuordnen("Begriffe an der Spitze", [["Abschnitt", "Gestutzter Teil einer Ecke"], ["Überhang", "Vorgesehener Überstand an der Spitze"], ["Schnurabstand", "Bezug für die wiederkehrende Reiheneinteilung"], ["Wirksame Deckfläche", "Für den Stückbedarf maßgebende Fläche"]], "Zuerst die Bezugslinien festlegen, danach die passenden Maße einsetzen.")),
    fsEinheit("lf09-l11", "Reparatur ohne neue Schwachstelle", "Du kannst eine Schieferreparatur und den Lastweg eines Einbauteils begründen.",
      "Bei einer Reparatur wird ein beschädigter Stein ausgetauscht, während die umgebende Deckung erhalten bleibt. Der Ersatz muss zu Form, Dicke und Material der vorhandenen Steine passen. Geeignete Reparaturhalter ermöglichen die Befestigung, ohne eine beliebige offene Befestigungsstelle im Wasserweg zu erzeugen. Prüfe vor dem Einsetzen auch die Unterlage und die Ursache des Schadens. Bei Einbauteilen wie Sicherheitsdachhaken kommt eine weitere Aufgabe hinzu: Die Beanspruchung muss über die dafür vorgesehene Befestigung in die tragende Konstruktion gelangen. Eine Platte allein ist kein geeigneter Lastträger. Passende Unterlagen und Anschlussdetails verhindern schädliche punktuelle Belastungen. Erst wenn Wasserweg und Kraftübertragung stimmen, ist die Reparatur als Ganzes nachvollziehbar.",
      ["lf09-099", "lf09-100", "lf09-101"], "Warum darf ein Sicherheitsdachhaken seine Last nicht einfach auf eine Deckplatte abstützen?", "Die Deckplatte ist nicht als alleiniger Lastträger vorgesehen und kann punktuell beschädigt werden. Der Lastweg muss zur tragenden Konstruktion führen.",
      fsFall("Ein Haken drückt auf den Stein", "Ein neu gesetzter Dachhaken liegt ohne abgestimmtes Detail auf einer Schieferplatte auf. Seine Befestigung im Tragwerk ist nicht dokumentiert.", [["Befestigung und Lastabtragung vor der Nutzung klären.", true], ["Die Deckplatte als alleinigen Lastträger akzeptieren.", false], ["Auch Wasserführung und Schutz vor punktueller Belastung prüfen.", true]], "Ein Einbauteil muss mechanisch und regensicher in das Decksystem eingebunden sein.")),
  ] },
  { id: "lf09-k05", titel: "Schindeln und Wellplatten", einheiten: [
    fsEinheit("lf09-l12", "Holzschindeln brauchen Raum und Trocknung", "Du kannst Bewegungsfugen, Lagigkeit und Hinterlüftung bei Holzschindeln erklären.",
      "Holzschindeln reagieren auf Feuchtigkeit mit Quellen und Schwinden. Deshalb gehören Bewegungsfugen und versetzte Fugenlagen zur Deckung. Die verwendete Holzart beeinflusst Dauerhaftigkeit, Bearbeitung und Verträglichkeit mit benachbarten Metallen. Auch die Lagigkeit ist eine Planungsentscheidung: Mehrere überdeckende Reihen führen Wasser anders ab als eine einzelne Lage. Dauerhaft feuchte Schindeln können schlecht abtrocknen; der vorgesehene Lüftungsraum und seine Öffnungen sind deshalb mitzudenken. Für die Materialrechnung verwendet die Quelle Breitenmeter. Der Grundbedarf ergibt sich im Übungsmodell aus Dachfläche geteilt durch Reihenabstand in Metern. Ein Ergebnis in Breitenmetern beschreibt aufsummierte Schindelbreiten und keine Dachfläche. Zuschläge und Randdetails werden anschließend gesondert ergänzt.",
      ["lf09-104", "lf09-106", "lf09-107", "lf09-108"], "Was bedeutet bei der Schindelbestellung ein Breitenmeter?", "Er beschreibt aufsummierte Schindelbreiten. Im Übungsmodell wird der Grundbedarf aus Quadratmetern Dachfläche geteilt durch den Reihenabstand in Metern ermittelt.",
      fsFall("Fugenlos sieht ordentlicher aus", "Ein Vorschlag sieht vor, Holzschindeln dicht an dicht ohne Bewegungsfugen zu verlegen und den Lüftungsspalt zu schließen.", [["Quell- und Schwindbewegungen müssen berücksichtigt werden.", true], ["Der vorgesehene Trocknungsweg darf nicht einfach entfallen.", true], ["Eine geschlossene Fuge verhindert jede Feuchtebeanspruchung des Holzes.", false]], "Holz benötigt einen zur Konstruktion passenden Bewegungs- und Trocknungsraum.")),
    fsEinheit("lf09-l13", "Wellprofil und Kreuzungspunkt verstehen", "Du kannst bei Wellplatten Profilbreite, Nutzbreite und Eckenschnitt unterscheiden.",
      "Wellplatten überdecken sich in der Höhe und seitlich. Ihre volle Plattenbreite ist deshalb größer als die nutzbare Deckbreite. Das Profil bestimmt, wie die seitlichen Wellen ineinandergreifen. Treffen Längs- und Seitenüberdeckung an einer Stelle zusammen, kann eine unpassende Anordnung zu einem zu dicken Plattenpaket führen. Dafür vorgesehene Eckenschnitte und die richtige Deckrichtung gehören zum Verlegesystem. Prüfe vor der Montage deshalb Produkt, Profil, Unterkonstruktion und Verlegeschema. Die Dachneigung wird zudem gemeinsam mit Wasserweglänge und Überdeckung beurteilt. Eine lange Platte ist nicht allein wegen ihrer Größe tragfähig oder begehbar. Für Arbeiten auf einer vorhandenen Wellplattendeckung müssen Materialzustand, mögliche Schadstoffe und sichere Zugangswege vorab geklärt sein.",
      ["lf09-124", "lf09-126", "lf09-127", "lf09-128"], "Warum gehört der Eckenschnitt zum Verlegeschema einer Wellplatte?", "Er beeinflusst den Kreuzungspunkt der Überdeckungen und verhindert eine ungeeignete Mehrfachauflage der Platten.",
      fsOrdnen("Vor dem Verlegen klären", ["Produkt, Profil und Materialzustand bestimmen", "Unterkonstruktion und sichere Arbeitsweise prüfen", "Deckrichtung und Eckenschnittschema festlegen", "Überdeckungen und nutzbare Deckmaße zuordnen", "Erste Kreuzungspunkte vor dem Weiterdecken kontrollieren"], "Das passende Schema wird vor dem flächigen Verlegen bestätigt.")),
    fsEinheit("lf09-l21", "Bitumenschindeln in Reihen denken", "Du kannst Unterlage, Schnurabstand und Randdetails einer Bitumenschindeldeckung verbinden.",
      "Bitumenschindeln liegen auf einer geschlossenen, geeigneten Unterlage mit der vorgesehenen Vordeckung. Die sichtbare Deckhöhe ist kleiner als die volle Schindelhöhe, weil die Reihen einander mehrfach überdecken. Im beschriebenen Lernmodell wird die Schindelhöhe um die vorgegebene Überdeckung vermindert und anschließend halbiert. Daraus entsteht der Schnurabstand. Die Befestigung gehört in den vom System vorgesehenen Bereich; eine beliebige Nagellinie kann den Wasserweg oder den Halt beeinträchtigen. Traufe, Ortgang und First benötigen eigene zugeschnittene Teile oder passende Anschlusslösungen. Plane diese Ränder zusätzlich zur Fläche. Ein rechnerisch richtiger Stückbedarf ist noch kein vollständiger Ausführungsplan, solange Unterlage, Befestigung und Anschlüsse nicht festgelegt sind.",
      ["lf09-115", "lf09-119", "lf09-120", "lf09-121"], "Welche drei Punkte fehlen, wenn eine Schindelplanung nur den Stückbedarf nennt?", "Geeigneter Unterlagenaufbau, passende Befestigung und die Detailausbildung an Traufe, Ortgang und First.",
      fsZuordnen("Schindeldeckung vollständig planen", [["Geschlossene Unterlage", "Trägt die Schindel flächig"], ["Schnurabstand", "Legt die sichtbare Reiheneinteilung fest"], ["Befestigungsbereich", "Gehört zum vorgesehenen Verlegesystem"], ["Randdetail", "Schließt die Deckung an Traufe, Ort oder First ab"]], "Menge, Geometrie und Ausführungsdetails ergänzen sich.")),
  ] },
];

const LF10_KAPITEL: LernKapitel[] = [
  {
    "id": "lf10-k01",
    "titel": "Schichten, Wasserweg und Dachkonstruktion",
    "einheiten": [
      {
        "id": "lf10-l03-e01",
        "version": 2,
        "titel": "Schichten und Gefälle gemeinsam planen",
        "lernziel": "Du kannst beim Warmdach Schichtenfunktionen und den Höhenunterschied eines Gefälles erklären.",
        "minuten": 7,
        "textschritte": [
          "Beim beschriebenen nicht belüfteten Warmdach liegt die Dampfsperre unter der Wärmedämmung. Darüber folgen die Abdichtung und der für die Nutzung vorgesehene Schutz. Gefälledämmung verbindet Wärmeschutz mit einer geordneten Wasserführung. Ihre Plattendicken ändern sich entlang eines Verlegeplans. Das Gefälle berechnest du aus Höhenunterschied geteilt durch waagerechte Länge, anschließend mal hundert. Ein Übungsgefälle von zwei Prozent bedeutet zwei Zentimeter Höhenunterschied pro Meter. Es beschreibt nicht automatisch jede erforderliche Dachlösung. Anschlüsse, Abläufe und Schwellen werden mit ihren tatsächlichen Höhen in die Planung aufgenommen. Am Wandanschluss muss die Abdichtungsfunktion fortgesetzt werden. Eine richtige Flächenneigung beseitigt deshalb keine zu niedrig oder undicht ausgeführte Anschlussstelle."
        ],
        "lektionIds": [
          "lf10-l03"
        ],
        "aufgabenIds": [
          "lf10-011",
          "lf10-023",
          "lf10-030"
        ],
        "begriffe": [],
        "abrufFrage": "Wie groß ist der Höhenunterschied bei vorgegebenen 2 % Gefälle über 4 m?",
        "abrufMuster": "4 m · 0,02 = 0,08 m, also 8 cm. Der Prozentwert bezieht sich auf die waagerechte Länge.",
        "aktivitaet": {
          "id": "lf10-l03-e01-aktiv",
          "version": 2,
          "titel": "Vom Aufbau zum Wasserweg",
          "erklaerung": "Die Funktionen müssen an Anschlüssen und Abläufen zusammengeführt werden.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Dampfsperre",
              "rechts": "Liegt beim beschriebenen Warmdach unter der Dämmung"
            },
            {
              "id": "p2",
              "links": "Gefälledämmung",
              "rechts": "Verbindet Dämmdicke und geplanten Höhenverlauf"
            },
            {
              "id": "p3",
              "links": "Abdichtung",
              "rechts": "Bildet die wasserundurchlässige Ebene"
            },
            {
              "id": "p4",
              "links": "Verlegeplan",
              "rechts": "Zeigt Lage und Dicke der Gefälleelemente"
            }
          ]
        }
      },
      {
        "id": "lf10-l05-e01",
        "version": 2,
        "titel": "Beanspruchungen und Wasserführung erkennen",
        "lernziel": "Du kannst mechanische, thermische und biologische Einwirkungen auf eine Flachdachabdichtung unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Eine Abdichtung hält Wasser zurück, während ihr Untergrund und ihre Umgebung sich verändern. Bewegungen der Tragkonstruktion oder Belastungen durch Wartung sind mechanische Einwirkungen. Sonneneinstrahlung und Kälte bewirken thermische Beanspruchungen. Wurzeln gehören zu den biologischen Einflüssen. Dazu kommen beispielsweise UV-Strahlung und chemische Materialkontakte. Eine geringe Dachneigung lässt Wasser langsamer ablaufen; Unebenheiten können zusätzlich Wasseransammlungen erzeugen. Der geplante Gefälleverlauf wird deshalb mit den Entwässerungspunkten abgestimmt. Eine einzelne Gefällezahl beschreibt noch keinen funktionsfähigen Wasserweg. Verfolge an der Skizze, wohin Wasser von jedem Flächenabschnitt gelangen kann und ob Anschlüsse oder Einbauten diesen Weg unterbrechen. Anschließend ordnest du jeder Beanspruchung eine geeignete Schutzfunktion zu."
        ],
        "lektionIds": [
          "lf10-l05"
        ],
        "aufgabenIds": [
          "lf10-001",
          "lf10-003",
          "lf10-030"
        ],
        "begriffe": [],
        "abrufFrage": "Warum genügt die Angabe eines Gefälleprozentsatzes nicht zur Kontrolle der Entwässerung?",
        "abrufMuster": "Auch Richtung, Tiefpunkte, Unebenheiten und Hindernisse müssen zum geplanten Ablauf passen. Wasser braucht einen durchgängigen Weg.",
        "aktivitaet": {
          "id": "lf10-l05-e01-aktiv",
          "version": 2,
          "titel": "Einwirkung richtig einordnen",
          "erklaerung": "Die Art der Beanspruchung erklärt, welche Schutzfunktion benötigt wird.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Bewegung der Tragschale",
              "rechts": "Mechanische Beanspruchung"
            },
            {
              "id": "p2",
              "links": "Starke Erwärmung durch Sonne",
              "rechts": "Thermische Beanspruchung"
            },
            {
              "id": "p3",
              "links": "Pflanzenwurzeln",
              "rechts": "Biologische Beanspruchung"
            },
            {
              "id": "p4",
              "links": "Gefälleplan",
              "rechts": "Ordnet Höhen und Entwässerungswege"
            }
          ]
        }
      },
      {
        "id": "lf10-l06-e01",
        "version": 2,
        "titel": "Flachdachaufbauten im Schnitt vergleichen",
        "lernziel": "Du kannst nicht belüftetes Dach, belüftetes Dach, Umkehrdach und Begrünungsaufbau unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Ein Dachquerschnitt zeigt die Lage der Funktionsschichten. Beim nicht belüfteten Warmdach liegt die Wärmedämmung unter der Abdichtung; eine planmäßig belüftete Luftschicht fehlt. Ein belüfteter Aufbau besitzt dagegen einen vorgesehenen Luftweg zwischen seinen Konstruktionsebenen. Beim Umkehrdach befindet sich die geeignete Wärmedämmung oberhalb der Abdichtung. Begrünung ergänzt einen dafür geeigneten Dachaufbau um Schutz-, Drän-, Filter- und Vegetationsfunktionen. Diese Einteilungen beschreiben unterschiedliche Merkmale und müssen im konkreten Schnitt zusammenpassen. Zeichne zuerst die Tragschicht, dann die wasserführende Abdichtung und danach die Lage der Dämmung. Eine sichtbare Luftlücke allein beweist keine funktionierende Belüftung. Ein Luftweg benötigt auch passende Zu- und Abströmöglichkeiten."
        ],
        "lektionIds": [
          "lf10-l06"
        ],
        "aufgabenIds": [
          "lf10-005",
          "lf10-011",
          "lf10-012",
          "lf10-100"
        ],
        "begriffe": [],
        "abrufFrage": "Woran erkennst du im Schnitt ein Umkehrdach?",
        "abrufMuster": "Die geeignete Wärmedämmung liegt oberhalb der Abdichtung und nicht wie beim beschriebenen Warmdach darunter.",
        "aktivitaet": {
          "id": "lf10-l06-e01-aktiv",
          "version": 2,
          "titel": "Vier Aufbauten erkennen",
          "erklaerung": "Die Lage der Schichten erklärt den Aufbau deutlicher als sein Name allein.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Nicht belüftetes Warmdach",
              "rechts": "Dämmung unter Abdichtung ohne planmäßige Lüftungsschicht"
            },
            {
              "id": "p2",
              "links": "Belüftetes Dach",
              "rechts": "Besitzt einen geplanten Luftweg"
            },
            {
              "id": "p3",
              "links": "Umkehrdach",
              "rechts": "Geeignete Dämmung liegt über der Abdichtung"
            },
            {
              "id": "p4",
              "links": "Begrünungsaufbau",
              "rechts": "Ergänzt Schutz-, Drän-, Filter- und Vegetationsfunktionen"
            }
          ]
        }
      },
      {
        "id": "lf10-l07-e01",
        "version": 2,
        "titel": "Die besondere Lage der Umkehrdach-Dämmung erklären",
        "lernziel": "Du kannst die Anforderungen an Dämmung, Filter und Auflast eines Umkehrdachs begründen.",
        "minuten": 7,
        "textschritte": [
          "Beim Umkehrdach wird die Abdichtung zuerst hergestellt und die geeignete Wärmedämmung darüber angeordnet. Damit liegt die Abdichtung vergleichsweise geschützt vor direkter Bewitterung und starken Temperaturschwankungen. Die Dämmplatten können dagegen mit Wasser in Berührung kommen. Deshalb muss ihr Material für diesen Einsatz nachgewiesen geeignet sein; im Quellenbeispiel wird XPS verwendet. Eine Filterlage unter dem vorgesehenen Oberbau hält Feinteile zurück. Die geplante Auflast dient unter anderem der Lagesicherung und dem Schutz. Sie wird passend zum Aufbau bemessen. Zur Wärmebewertung gehören die besonderen Feuchte- und Wasserwege des Systems. Die gleiche Dämmdicke wie bei einem anderen Dach darf daher nicht ohne Prüfung als gleichwertig angesetzt werden."
        ],
        "lektionIds": [
          "lf10-l07"
        ],
        "aufgabenIds": [
          "lf10-012",
          "lf10-013",
          "lf10-014"
        ],
        "begriffe": [],
        "abrufFrage": "Warum braucht die Dämmung eines Umkehrdachs eine besondere Eignung gegenüber Wasser?",
        "abrufMuster": "Sie liegt oberhalb der Abdichtung und kann dort mit Wasser in Kontakt kommen; ihre Dämm- und Gebrauchseigenschaften müssen zum System passen.",
        "aktivitaet": {
          "id": "lf10-l07-e01-aktiv",
          "version": 2,
          "titel": "Der Schnitt wurde vertauscht",
          "erklaerung": "Ein Aufbau wird anhand der tatsächlichen Schichtenlage beurteilt.",
          "typ": "skizzenfehler",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine als Umkehrdach beschriftete Skizze zeigt von oben nach unten: Auflast, Abdichtung, Dämmung, Tragschicht.",
          "optionen": [
            {
              "id": "o1",
              "text": "Dämmung und Abdichtung sind für das beschriebene Umkehrdach vertauscht.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Die geeignete Dämmung gehört oberhalb der Abdichtung.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Der Titel allein macht den gezeichneten Aufbau zum Umkehrdach.",
              "korrekt": false
            }
          ],
          "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 620 248\" role=\"img\"><title>Der Schnitt wurde vertauscht</title><rect x=\"12\" y=\"12\" width=\"596\" height=\"44\" rx=\"5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><text x=\"26\" y=\"40\" fill=\"currentColor\" font-size=\"17\" font-family=\"sans-serif\">Oben: Auflast</text><rect x=\"12\" y=\"68\" width=\"596\" height=\"44\" rx=\"5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><text x=\"26\" y=\"96\" fill=\"currentColor\" font-size=\"17\" font-family=\"sans-serif\">Darunter: Abdichtung</text><rect x=\"12\" y=\"124\" width=\"596\" height=\"44\" rx=\"5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><text x=\"26\" y=\"152\" fill=\"currentColor\" font-size=\"17\" font-family=\"sans-serif\">Darunter: Dämmung</text><rect x=\"12\" y=\"180\" width=\"596\" height=\"44\" rx=\"5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><text x=\"26\" y=\"208\" fill=\"currentColor\" font-size=\"17\" font-family=\"sans-serif\">Unten: Tragschicht</text></svg>",
          "bildbeschreibung": "Eine als Umkehrdach beschriftete Skizze zeigt von oben nach unten: Auflast, Abdichtung, Dämmung, Tragschicht."
        }
      }
    ]
  },
  {
    "id": "lf10-k02",
    "titel": "Materialien erkennen und Kennwerte verstehen",
    "einheiten": [
      {
        "id": "lf10-l01-e01",
        "version": 2,
        "titel": "Deckmasse und Träger übernehmen verschiedene Aufgaben",
        "lernziel": "Du kannst APP, SBS und die Trägereinlage einer Bitumenbahn funktional unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Eine Bitumenbahn besteht aus mehreren Bestandteilen mit unterschiedlichen Aufgaben. Die Deckmasse sorgt wesentlich für das Abdichtungsverhalten. Damit sie auf Temperaturänderungen besser reagiert, kann Bitumen mit Polymeren verändert werden. APP steht für eine Plastomermodifizierung, SBS für eine Elastomermodifizierung. Die Trägereinlage liegt innerhalb der Bahn und beeinflusst ihre Festigkeit und ihr Dehnverhalten. Polyestervlies und Glasgewebe sind deshalb keine anderen Namen für die Deckmasse. Lies bei einer Produktbezeichnung zuerst die Bitumenart und dann den Träger. Anschließend prüfst du den vorgesehenen Einsatz im Dachaufbau. Eine günstige Eigenschaft allein, etwa hohe Dehnbarkeit, macht noch keine beliebige Bahn zur passenden Oberlage."
        ],
        "lektionIds": [
          "lf10-l01"
        ],
        "aufgabenIds": [
          "lf10-039",
          "lf10-042",
          "lf10-044"
        ],
        "begriffe": [],
        "abrufFrage": "Welche unterschiedlichen Informationen liefern PYE und PV?",
        "abrufMuster": "PYE beschreibt die Elastomerbitumen-Deckmasse; PV benennt die Trägereinlage aus Polyestervlies.",
        "aktivitaet": {
          "id": "lf10-l01-e01-aktiv",
          "version": 2,
          "titel": "Die Bahn von innen verstehen",
          "erklaerung": "Deckmasse, Träger und vorgesehener Einsatz werden gemeinsam betrachtet.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "APP",
              "rechts": "Plastomermodifizierung des Bitumens"
            },
            {
              "id": "p2",
              "links": "SBS",
              "rechts": "Elastomermodifizierung des Bitumens"
            },
            {
              "id": "p3",
              "links": "PV",
              "rechts": "Polyestervlies als Trägereinlage"
            },
            {
              "id": "p4",
              "links": "Deckmasse",
              "rechts": "Trägt zum Abdichtungsverhalten der Bahn bei"
            }
          ]
        }
      },
      {
        "id": "lf10-l09-e01",
        "version": 2,
        "titel": "Bitumen mit zwei Kennwerten beschreiben",
        "lernziel": "Du kannst Penetration und Erweichungspunkt als unterschiedliche Materialprüfungen erklären.",
        "minuten": 7,
        "textschritte": [
          "Bitumen wird aus Erdöl gewonnen und bildet eine Grundlage vieler Abdichtungsstoffe. Seine Eigenschaften verändern sich mit der Temperatur. Die Penetration beschreibt, wie tief eine Prüfnadel unter festgelegten Bedingungen eindringt. Ein größerer Eindringwert bedeutet unter diesen Bedingungen ein weicheres Material. Der Erweichungspunkt wird mit einem anderen Prüfverfahren bestimmt, dem Ring-und-Kugel-Versuch. Er beschreibt ein festgelegtes Verformungsverhalten beim Erwärmen. Beide Werte beantworten daher verschiedene Fragen. Verwechsle auch Bitumen und Teer nicht: Ihre Herkunft und Zusammensetzung unterscheiden sich. Bei einem Materialvergleich werden Kennwerte nur mit denselben Prüfbedingungen sinnvoll verglichen. Für eine Dachbahn kommen außerdem Modifizierung, Träger und vorgesehener Einsatz hinzu."
        ],
        "lektionIds": [
          "lf10-l09"
        ],
        "aufgabenIds": [
          "lf10-033",
          "lf10-034",
          "lf10-035"
        ],
        "begriffe": [],
        "abrufFrage": "Warum kannst du Penetration und Erweichungspunkt nicht als denselben Kennwert behandeln?",
        "abrufMuster": "Die Penetration misst das Eindringen einer Nadel unter Prüfbedingungen; der Erweichungspunkt beschreibt ein definiertes Verhalten beim Erwärmen im Ring-und-Kugel-Versuch.",
        "aktivitaet": {
          "id": "lf10-l09-e01-aktiv",
          "version": 2,
          "titel": "Prüfung und Aussage",
          "erklaerung": "Zwei Kennwerte ergänzen sich, ersetzen sich aber nicht.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Penetration",
              "rechts": "Eindringtiefe einer Prüfnadel"
            },
            {
              "id": "p2",
              "links": "Größere Penetration",
              "rechts": "Unter gleichen Prüfbedingungen weicheres Bitumen"
            },
            {
              "id": "p3",
              "links": "Ring-und-Kugel-Versuch",
              "rechts": "Bestimmung eines Erweichungspunkts"
            },
            {
              "id": "p4",
              "links": "Materialvergleich",
              "rechts": "Benötigt gleiche Prüfbedingungen"
            }
          ]
        }
      },
      {
        "id": "lf10-l14-e01",
        "version": 2,
        "titel": "Kurzzeichen einer Bitumenbahn lesen",
        "lernziel": "Du kannst Trägereinlage, Deckmasse und Anwendungsangabe einer Bitumenbahn getrennt auswerten.",
        "minuten": 7,
        "textschritte": [
          "Die Kurzbezeichnung auf einer Bitumenbahn enthält mehrere Informationen. Eine Anwendungsangabe beschreibt den vorgesehenen Einsatzbereich. PYE und PYP stehen für unterschiedliche Polymerbitumenarten. Zeichen wie G oder PV benennen die Trägereinlage. Ergänzende Zahlen und Buchstaben werden im zugehörigen Kennzeichnungssystem gelesen. Gehe dabei in einer festen Reihenfolge vor: Anwendung, Bitumenart, Träger, weitere Ausführung. Die mineralische Bestreuung an der Oberfläche hat wiederum eine eigene Schutzfunktion. Eine Bahn mit passendem Träger ist nicht allein dadurch die geeignete Oberlage. Entscheidend ist die gesamte Kennzeichnung im geplanten Dachsystem. Halte bei einer Materialprüfung fest, welche Information sicher lesbar ist und welche Produktangabe noch geklärt werden muss."
        ],
        "lektionIds": [
          "lf10-l14"
        ],
        "aufgabenIds": [
          "lf10-039",
          "lf10-043",
          "lf10-044",
          "lf10-046"
        ],
        "begriffe": [],
        "abrufFrage": "Warum liest du bei einer Bahn nicht nur das Zeichen des Trägers?",
        "abrufMuster": "Der Träger erklärt nicht den gesamten Einsatz. Anwendung, Bitumenart, weitere Ausführung und der geplante Dachaufbau müssen ebenfalls passen.",
        "aktivitaet": {
          "id": "lf10-l14-e01-aktiv",
          "version": 2,
          "titel": "Angabe und Bedeutung",
          "erklaerung": "Eine Kennzeichnung wird vollständig und im Zusammenhang mit dem System gelesen.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Anwendungsangabe",
              "rechts": "Beschreibt den vorgesehenen Einsatzbereich"
            },
            {
              "id": "p2",
              "links": "PYE",
              "rechts": "Elastomerbitumen als Deckmasse"
            },
            {
              "id": "p3",
              "links": "PV",
              "rechts": "Polyestervlies als Trägereinlage"
            },
            {
              "id": "p4",
              "links": "Mineralische Bestreuung",
              "rechts": "Kann den Oberflächenschutz übernehmen"
            }
          ]
        }
      },
      {
        "id": "lf10-l20-e01",
        "version": 2,
        "titel": "Kunststoffgruppen nach Wärmeverhalten ordnen",
        "lernziel": "Du kannst Thermoplaste, Duromere und Elastomere anhand ihres grundsätzlichen Verhaltens unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Kunststoffe werden unter anderem nach ihrem Verhalten bei Wärme und Verformung eingeteilt. Thermoplaste werden innerhalb eines geeigneten Temperaturbereichs weich und lassen sich verformen. Dafür geeignete Produkte können thermisch verschweißt werden. Duromere besitzen eine eng vernetzte Struktur und schmelzen beim Erwärmen nicht wie Thermoplaste. Elastomere können sich elastisch verformen und anschließend weitgehend in ihre Ausgangsform zurückkehren. Daraus folgt aber noch keine universelle Verarbeitungsanleitung für jede Dachbahn. Füllstoffe, Einlagen, Beschichtungen und Systemaufbau beeinflussen das konkrete Produkt. Ordne deshalb zuerst die Werkstoffgruppe zu und lies danach das vorgesehene Fügeverfahren. Eine elastische Bahn ist nicht allein wegen ihrer Dehnbarkeit mit einer beliebigen Heißluftnaht verbindbar."
        ],
        "lektionIds": [
          "lf10-l20"
        ],
        "aufgabenIds": [
          "lf10-053",
          "lf10-054",
          "lf10-055"
        ],
        "begriffe": [],
        "abrufFrage": "Warum folgt aus elastischem Verhalten noch keine Eignung zum Heißluftschweißen?",
        "abrufMuster": "Elastizität beschreibt die Verformbarkeit. Ob thermisches Schweißen möglich ist, hängt von Werkstoffstruktur und konkretem Bahnsystem ab.",
        "aktivitaet": {
          "id": "lf10-l20-e01-aktiv",
          "version": 2,
          "titel": "Struktur und Verhalten",
          "erklaerung": "Werkstoffgruppen erklären Grundverhalten, ersetzen aber keine Produktvorgabe.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Thermoplast",
              "rechts": "Wird im geeigneten Temperaturbereich weich und verformbar"
            },
            {
              "id": "p2",
              "links": "Duromer",
              "rechts": "Schmilzt nicht wie ein Thermoplast"
            },
            {
              "id": "p3",
              "links": "Elastomer",
              "rechts": "Kann sich elastisch verformen und zurückstellen"
            },
            {
              "id": "p4",
              "links": "Fügeverfahren",
              "rechts": "Wird aus dem konkreten Produkt und System bestimmt"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf10-k03",
    "titel": "Kunststoff, Flüssigabdichtung und Hilfsschichten",
    "einheiten": [
      {
        "id": "lf10-l02-e01",
        "version": 2,
        "titel": "Nahtverfahren aus dem Werkstoff ableiten",
        "lernziel": "Du kannst erklären, warum die Verbindungsmethode einer Kunststoffbahn zum konkreten Bahnsystem passen muss.",
        "minuten": 7,
        "textschritte": [
          "Kunststoffbahnen sind nicht untereinander austauschbar. Thermoplastische Bahnen lassen sich mit geeigneter Heißluft oder einem passenden Heizkeil verbinden. Bei elastomeren Bahnen können andere systemgebundene Fügeverfahren erforderlich sein. Beginne deshalb mit der eindeutigen Produktkennzeichnung. Danach liest du die vorgesehenen Nahtvorbereitung, Geräteeinstellung und Prüfverfahren. Temperatur, Arbeitsgeschwindigkeit und Anpressdruck wirken zusammen. Die Einstellung wird an den Baustellenbedingungen geprüft und nicht aus einer beliebigen Zahl im Buch übernommen. Eine Probenaht zeigt, ob das gewählte Verfahren eine geeignete Verbindung erzeugt. Brennervorgaben für Bitumenbahnen dürfen nicht auf Kunststoffbahnen übertragen werden. Auch Materialverträglichkeit und die passende Trennlage gehören zur Vorbereitung der Verbindung."
        ],
        "lektionIds": [
          "lf10-l02"
        ],
        "aufgabenIds": [
          "lf10-054",
          "lf10-059",
          "lf10-061"
        ],
        "begriffe": [],
        "abrufFrage": "Warum reicht eine eingestellte Gerätetemperatur allein nicht als Nahtnachweis?",
        "abrufMuster": "Auch Material, Geschwindigkeit, Anpressdruck und Umgebungsbedingungen beeinflussen die Verbindung; die Naht muss nach dem vorgesehenen Prüfverfahren kontrolliert werden.",
        "aktivitaet": {
          "id": "lf10-l02-e01-aktiv",
          "version": 2,
          "titel": "Vor dem Verbinden klären",
          "erklaerung": "Die richtige Reihenfolge verhindert, dass ungeeignete Parameter unbemerkt auf die Fläche übertragen werden.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Bahnsystem und Fügeverfahren eindeutig feststellen"
            },
            {
              "id": "s2",
              "text": "Unterlage und Materialverträglichkeit prüfen"
            },
            {
              "id": "s3",
              "text": "Naht vorbereiten und Gerät passend einstellen"
            },
            {
              "id": "s4",
              "text": "Probenaht unter den tatsächlichen Bedingungen herstellen"
            },
            {
              "id": "s5",
              "text": "Naht nach dem vorgesehenen Verfahren kontrollieren"
            }
          ]
        }
      },
      {
        "id": "lf10-l08-e01",
        "version": 2,
        "titel": "Hilfsschichten nach ihren Funktionen benennen",
        "lernziel": "Du kannst Voranstrich, Trennlage, Dampfsperre und Dampfdruckausgleich auseinanderhalten.",
        "minuten": 7,
        "textschritte": [
          "Unter einer Abdichtung liegen oft unscheinbare Schichten mit verschiedenen Aufgaben. Ein Voranstrich verbessert die Haftbedingungen des geeigneten Untergrunds und muss nach Systemvorgabe vorbereitet sein. Eine Trenn- oder Ausgleichslage kann Rauigkeit, kleine Bewegungen oder unverträgliche Materialkontakte vom weiteren Aufbau fernhalten. Die Dampfsperre begrenzt den Wasserdampftransport aus dem Innenraum in den Aufbau. Ihre Anschlüsse und Überlappungen gehören zur vollständigen Funktion. Eine Dampfdruckausgleichsschicht ermöglicht dagegen einen Druckausgleich innerhalb des dafür vorgesehenen Systems. Sie ist keine Ersatz-Dampfsperre. Frage an jeder Lage zuerst: Welcher Stoff oder welche Bewegung soll hier beeinflusst werden? Erst danach ordnest du Material, Lage und Anschluss zu. Ähnlich aussehende Bahnen können sehr verschiedene Funktionen erfüllen."
        ],
        "lektionIds": [
          "lf10-l08"
        ],
        "aufgabenIds": [
          "lf10-021",
          "lf10-022",
          "lf10-023",
          "lf10-031"
        ],
        "begriffe": [],
        "abrufFrage": "Warum darf eine Dampfdruckausgleichsschicht nicht einfach als Dampfsperre bezeichnet werden?",
        "abrufMuster": "Die Dampfsperre begrenzt den Dampftransport in den Aufbau. Der Dampfdruckausgleich verteilt Druck im vorgesehenen System und übernimmt diese Sperrfunktion nicht automatisch.",
        "aktivitaet": {
          "id": "lf10-l08-e01-aktiv",
          "version": 2,
          "titel": "Was macht welche Lage?",
          "erklaerung": "Die Funktion entscheidet über die Zuordnung; das ähnliche Aussehen einer Bahn genügt nicht.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Voranstrich",
              "rechts": "Verbessert die Haftbedingungen"
            },
            {
              "id": "p2",
              "links": "Trenn- und Ausgleichslage",
              "rechts": "Trennt oder gleicht Untergrundeinflüsse aus"
            },
            {
              "id": "p3",
              "links": "Dampfsperre",
              "rechts": "Begrenzt Wasserdampftransport aus dem Innenraum"
            },
            {
              "id": "p4",
              "links": "Dampfdruckausgleich",
              "rechts": "Ermöglicht Druckausgleich im vorgesehenen System"
            }
          ]
        }
      },
      {
        "id": "lf10-l10-e01",
        "version": 2,
        "titel": "Eine Kunststoffbahn vollständig identifizieren",
        "lernziel": "Du kannst Werkstoff, Einlage und Verträglichkeit einer Kunststoffbahn als getrennte Merkmale prüfen.",
        "minuten": 7,
        "textschritte": [
          "Eine Kunststoffbahn wird nicht sicher allein an ihrer Farbe erkannt. Lies die Produktkennzeichnung und die zugehörigen Angaben. Der Grundwerkstoff beschreibt wichtige Materialeigenschaften. Einlagen oder Kaschierungen ergänzen beispielsweise Festigkeit und Verarbeitung. Die Materialverträglichkeit entscheidet darüber, welche Unterlagen und Nachbarmaterialien unmittelbar anliegen dürfen. Bitumenbeständigkeit bedeutet dabei nicht automatisch, dass jede Verklebung mit Bitumen geeignet ist. Auch das Nahtverfahren wird vom konkreten System bestimmt. Prüfe vor dem Ansetzen einer Probe deshalb zuerst die Bahn und ihren vorgesehenen Aufbau. Eine geeignete Trennlage kann erforderlich sein, um Stoffkontakte oder weitere Beanspruchungen zu beherrschen. Sie muss zur vorgesehenen Schutzfunktion und zu den Herstellerangaben passen."
        ],
        "lektionIds": [
          "lf10-l10"
        ],
        "aufgabenIds": [
          "lf10-056",
          "lf10-059",
          "lf10-062",
          "lf10-064"
        ],
        "begriffe": [],
        "abrufFrage": "Welche Information reicht zur Identifikation einer Bahn nicht aus?",
        "abrufMuster": "Die Farbe allein reicht nicht. Werkstoff, Kennzeichnung, Aufbau, Verträglichkeit und vorgesehenes Fügeverfahren müssen zusammenpassen.",
        "aktivitaet": {
          "id": "lf10-l10-e01-aktiv",
          "version": 2,
          "titel": "Gleiche Farbe, falsche Verbindung",
          "erklaerung": "Sichtbare Ähnlichkeit ersetzt keine Material- und Systembestimmung.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Zwei helle Bahnen sollen miteinander verbunden werden, weil sie ähnlich aussehen. Produktkennzeichnungen fehlen.",
          "optionen": [
            {
              "id": "o1",
              "text": "Zuerst beide Bahnsysteme eindeutig feststellen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Verträglichkeit und vorgesehenes Fügeverfahren prüfen.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Ähnliche Farbe beweist die Eignung einer gemeinsamen Naht.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf10-l11-e01",
        "version": 2,
        "titel": "Flüssigabdichtung als System verstehen",
        "lernziel": "Du kannst Harz, Vliesarmierung und Aushärtebedingungen einer Flüssigabdichtung zusammenführen.",
        "minuten": 7,
        "textschritte": [
          "Eine Flüssigabdichtung wird am Bauteil aufgetragen und bildet erst dort ihre fertige Schicht. Harz, Armierung und Untergrundvorbereitung gehören deshalb als System zusammen. Die Vliesarmierung wird passend eingebettet und an Übergängen nach dem vorgesehenen Detail geführt. Eine bloß dünn überstrichene Fuge erfüllt diese Aufgabe nicht automatisch. PMMA und PUR benennen unterschiedliche Harzgruppen mit verschiedenen Verarbeitungsbedingungen. Reaktionszeit, Temperatur und Untergrundfeuchte müssen zum konkreten Produkt passen. Die im Buch genannten Aushärtezeiten sind keine allgemeine Freigabe für jede Baustelle. Vor der Nutzung wird der vorgesehene Zustand kontrolliert. Besonders an Durchdringungen helfen passende Formteile oder Zuschnitte, die Armierung ohne offene Übergänge fortzuführen."
        ],
        "lektionIds": [
          "lf10-l11"
        ],
        "aufgabenIds": [
          "lf10-065",
          "lf10-066",
          "lf10-067"
        ],
        "begriffe": [],
        "abrufFrage": "Warum gehört das Vlies zur Flüssigabdichtung und ist keine beliebige Zusatzlage?",
        "abrufMuster": "Es ist Teil des vorgesehenen Abdichtungssystems und unterstützt die zusammenhängende Schicht an Fläche und Übergängen. Ein Weglassen verändert das System.",
        "aktivitaet": {
          "id": "lf10-l11-e01-aktiv",
          "version": 2,
          "titel": "Eine Durchführung vorbereiten",
          "erklaerung": "Die Reihenfolge verbindet Vorbereitung, Ausführung und Freigabe; konkrete Zeiten kommen aus dem System.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Untergrund und konkretes Abdichtungssystem prüfen"
            },
            {
              "id": "s2",
              "text": "Geometrie und erforderliche Vlieszuschnitte vorbereiten"
            },
            {
              "id": "s3",
              "text": "Untergrund nach Systemvorgabe vorbereiten"
            },
            {
              "id": "s4",
              "text": "Harz und Armierung entsprechend der Vorgabe einarbeiten"
            },
            {
              "id": "s5",
              "text": "Aushärtung und fertige Anschlüsse vor Nutzung kontrollieren"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf10-k04",
    "titel": "Verarbeitung, Dämmung und Lagesicherung",
    "einheiten": [
      {
        "id": "lf10-l12-e01",
        "version": 2,
        "titel": "Windsog bis in die Unterlage verfolgen",
        "lernziel": "Du kannst Auflast, Verklebung und mechanische Befestigung als Lagesicherungsprinzipien unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Wind kann auf einem Dach nach oben gerichtete Sogkräfte erzeugen. Die Belastung hängt unter anderem von Lage, Höhe, Dachform und Randbereichen ab. Deshalb wird eine Lagesicherung nicht gleichmäßig nach Gefühl verteilt. Drei Grundprinzipien sind Auflast, geeignete Verklebung und mechanische Befestigung. Sie benötigen jeweils einen durchgehenden Lastweg bis in die tragende Konstruktion. Eine fest verklebte Oberlage hilft nicht, wenn darunter eine ungeeignete lose Schicht versagt. An Rändern und Ecken können besondere Anforderungen entstehen. Verwende für die Ausführung die passende aktuelle Bemessung und Systemplanung. Die alten Normbezeichnungen einzelner Quellen sind keine selbstständige Planungsgrundlage. Im Lernfall erklärst du zuerst das Sicherungsprinzip und danach den vollständigen Lastweg."
        ],
        "lektionIds": [
          "lf10-l12"
        ],
        "aufgabenIds": [
          "lf10-073",
          "lf10-075",
          "lf10-082",
          "lf10-083"
        ],
        "begriffe": [],
        "abrufFrage": "Warum genügt eine starke Verklebung nur zwischen den obersten beiden Schichten nicht?",
        "abrufMuster": "Die Windkraft muss durch alle beteiligten Schichten bis in die tragende Konstruktion weitergeleitet werden. Eine schwache Verbindung darunter unterbricht den Lastweg.",
        "aktivitaet": {
          "id": "lf10-l12-e01-aktiv",
          "version": 2,
          "titel": "Drei Wege zur Lagesicherung",
          "erklaerung": "Das Sicherungsprinzip funktioniert nur mit passenden Schichten und Verbindungen.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Auflast",
              "rechts": "Geeignete zusätzliche Last wirkt dem Abheben entgegen"
            },
            {
              "id": "p2",
              "links": "Verklebung",
              "rechts": "Geeignete Klebeverbindungen übertragen die Kräfte"
            },
            {
              "id": "p3",
              "links": "Mechanische Befestigung",
              "rechts": "Befestiger leiten Kräfte in die vorgesehene Unterlage"
            },
            {
              "id": "p4",
              "links": "Lastweg",
              "rechts": "Muss bis zur tragenden Konstruktion zusammenhängen"
            }
          ]
        }
      },
      {
        "id": "lf10-l15-e01",
        "version": 2,
        "titel": "Nahtplanung und Brandvorsorge verbinden",
        "lernziel": "Du kannst Verlegerichtung, versetzte Stöße und die sichere Verarbeitung von Bitumenbahnen begründen.",
        "minuten": 7,
        "textschritte": [
          "Eine dichte Bahnenfläche braucht geeignete Verbindungen und passende Details. Bei der Verlegeplanung werden Gefälle, Längsnähte und Querstöße aufeinander abgestimmt. Kreuzstöße werden vermieden; an mehrlagigen Treffpunkten wird die vorgesehene Detailausbildung eingehalten. Überdeckungsbreite und tatsächlich verbundene Nahtbreite sind dabei verschiedene Angaben. Sie richten sich nach Bahnsystem und Verfahren. Gießverfahren, Schweißverfahren und Kaltselbstverklebung stellen unterschiedliche Anforderungen an Untergrund und Arbeitsweise. Bei offener Flamme gehört die Brandvorsorge unmittelbar zur Planung, besonders an verdeckten brennbaren Bereichen. Eine sichtbare Bitumenraupe ist eine hilfreiche Prozessbeobachtung, beweist allein aber nicht die gesamte Ausführungsqualität. Kontrolliere auch Untergrundkontakt, Nahtverlauf und Anschlüsse nach der vorgesehenen Methode."
        ],
        "lektionIds": [
          "lf10-l15"
        ],
        "aufgabenIds": [
          "lf10-049",
          "lf10-050",
          "lf10-051",
          "lf10-052"
        ],
        "begriffe": [],
        "abrufFrage": "Warum muss Brandvorsorge schon vor dem Ansetzen des Brenners geklärt sein?",
        "abrufMuster": "Verdeckte oder angrenzende brennbare Bereiche können gefährdet werden. Geeignetes Verfahren, Schutzmaßnahmen und Kontrolle werden deshalb vor Arbeitsbeginn festgelegt.",
        "aktivitaet": {
          "id": "lf10-l15-e01-aktiv",
          "version": 2,
          "titel": "Vor der ersten Bahn",
          "erklaerung": "Sicheres Arbeiten und fachgerechte Verbindung werden gemeinsam vorbereitet.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Untergrund, angrenzende Bauteile und Brandgefährdungen prüfen"
            },
            {
              "id": "s2",
              "text": "Bahnenverlauf und versetzte Stöße planen"
            },
            {
              "id": "s3",
              "text": "Passendes System mit vorgesehenen Nahtmaßen festlegen"
            },
            {
              "id": "s4",
              "text": "Bahn mit dem geeigneten Verfahren verbinden"
            },
            {
              "id": "s5",
              "text": "Verbindung und gefährdete Bereiche planmäßig kontrollieren"
            }
          ]
        }
      },
      {
        "id": "lf10-l16-e01",
        "version": 2,
        "titel": "Dämmstoff nach Einbau und Belastung auswählen",
        "lernziel": "Du kannst Anwendungstyp, Feuchtebeanspruchung und Druckbelastung einer Flachdachdämmung zuordnen.",
        "minuten": 7,
        "textschritte": [
          "Die Dämmstoffauswahl beginnt mit der Lage im Dach. Unter einer Abdichtung gelten andere Beanspruchungen als oberhalb der Abdichtung beim Umkehrdach. Der Anwendungstyp beschreibt einen dafür vorgesehenen Einsatz, ersetzt aber nicht die vollständige Produkteignung. Zusätzlich werden Lasten aus Nutzung, Wartung und Aufbau geprüft. Bei Trapezprofilen muss die Dämmung die vorgesehenen Auflagerabstände sicher überbrücken können. Eine größere Dicke allein beweist diese Eignung nicht. Fugenversatz und passende Plattenanordnung unterstützen den geplanten Wärmeschutz. Eine Tabelle liest du immer mit Zeile, Spalte und zugehörigen Bedingungen. Wer nur einen Zahlenwert abschreibt, kann Dämmstoffart, lichte Weite und erforderliche Dicke leicht miteinander verwechseln."
        ],
        "lektionIds": [
          "lf10-l16"
        ],
        "aufgabenIds": [
          "lf10-025",
          "lf10-026",
          "lf10-027",
          "lf10-028"
        ],
        "begriffe": [],
        "abrufFrage": "Welche Angaben gehören zu einem abgelesenen Mindestdickenwert auf Trapezprofilen?",
        "abrufMuster": "Dämmstoffart, lichte Weite der Auflager, Tabelleneinheit und die zugehörigen Einsatzbedingungen. Ohne diese Bezüge ist der Zahlenwert unvollständig.",
        "aktivitaet": {
          "id": "lf10-l16-e01-aktiv",
          "version": 2,
          "titel": "Die Tabellenspalte wurde übersehen",
          "erklaerung": "Ein Tabellenwert gilt nur für seine Zeile, Spalte und Bedingungen.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine Dicke wurde aus der Zeile für 150 mm lichte Weite abgelesen. Der verwendete Dämmstoff gehört jedoch zu einer anderen Tabellenspalte.",
          "optionen": [
            {
              "id": "o1",
              "text": "Die passende Dämmstoffspalte muss neu gelesen werden.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Auflagerabstand und Produkteignung bleiben zusätzliche Prüfpunkte.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Gleiche Auflagerweite macht alle Dämmstoffe gleich belastbar.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf10-l17-e01",
        "version": 2,
        "titel": "Unterlage und Lüftungsweg im Zusammenhang prüfen",
        "lernziel": "Du kannst die Anforderungen an eine Abdichtungsunterlage und an eine geplante Belüftung unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Eine Abdichtung braucht eine geeignete, saubere und ausreichend ebene Unterlage. Beton, Holzwerkstoffe und Trapezprofile unterscheiden sich in Tragverhalten und Bewegung. Bei Holzwerkstoffen können Quellen und Schwinden die Fugen beeinflussen. Geeignete Fugen- und Trennlagenkonzepte verhindern, dass Bewegungen ungeplant in den weiteren Aufbau übertragen werden. Ein belüftetes Flachdach besitzt zusätzlich einen geplanten Luftweg. Wegen des geringen Höhenunterschieds wird die Luftbewegung wesentlich durch Wind beeinflusst. Ein leerer Hohlraum allein ist deshalb noch keine wirksame Belüftung. Prüfe Zu- und Abluftöffnungen, Hindernisse und die vorgesehene Strömungsrichtung. Die konkreten Mindestmaße und Materialdicken werden am jeweiligen Aufbau und seinen Nachweisen geprüft, nicht aus einem Einzelwert übertragen."
        ],
        "lektionIds": [
          "lf10-l17"
        ],
        "aufgabenIds": [
          "lf10-007",
          "lf10-009",
          "lf10-015"
        ],
        "begriffe": [],
        "abrufFrage": "Warum beweist ein Hohlraum unter der Dachhaut noch keine funktionierende Belüftung?",
        "abrufMuster": "Es müssen geeignete Zu- und Abströmwege vorhanden sein. Hindernisse oder unpassende Öffnungen können die vorgesehene Luftbewegung verhindern.",
        "aktivitaet": {
          "id": "lf10-l17-e01-aktiv",
          "version": 2,
          "titel": "Zwei Prüfaufgaben auseinanderhalten",
          "erklaerung": "Untergrundqualität und Lüftungsfunktion sind getrennte, aufeinander abgestimmte Aufgaben.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Ebene und saubere Unterlage",
              "rechts": "Voraussetzung für den weiteren Abdichtungsaufbau"
            },
            {
              "id": "p2",
              "links": "Fugenplanung",
              "rechts": "Berücksichtigt Materialbewegungen"
            },
            {
              "id": "p3",
              "links": "Zu- und Abluftöffnungen",
              "rechts": "Ermöglichen den geplanten Luftwechsel"
            },
            {
              "id": "p4",
              "links": "Bloßer Hohlraum",
              "rechts": "Ist noch kein Nachweis einer wirksamen Belüftung"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf10-k05",
    "titel": "Begrünung, Schutz und Materialbedarf",
    "einheiten": [
      {
        "id": "lf10-l04-e01",
        "version": 2,
        "titel": "Begrünungsarten nach Nutzung und Pflege auswählen",
        "lernziel": "Du kannst extensive und intensive Begrünung anhand von Pflanzen, Pflege und Lasten vergleichen.",
        "minuten": 7,
        "textschritte": [
          "Ein begrüntes Dach ist ein geplanter Aufbau und keine beliebige Erdschicht auf der Abdichtung. Extensive Begrünungen nutzen meist niedrig wachsende, genügsame Pflanzen. Intensive Begrünungen ermöglichen aufwendigere Vegetation und benötigen entsprechend mehr Pflege und häufig Bewässerung. Mit größerem Substrataufbau steigen oft auch die Lasten. Entscheidend ist dabei das Gewicht im maßgebenden Wasserzustand, nicht nur die trockene Lieferung. Vor der Auswahl werden Tragfähigkeit, Entwässerung, Wurzelschutz und Zugang zur Pflege geprüft. Pauschale Gewichtswerte ersetzen keinen projektspezifischen Nachweis. Stelle in einer Beratung deshalb zuerst die gewünschte Nutzung fest. Danach lässt sich ein geeigneter Aufbau auswählen, dessen Lasten und Pflegebedarf zum Gebäude passen."
        ],
        "lektionIds": [
          "lf10-l04"
        ],
        "aufgabenIds": [
          "lf10-017",
          "lf10-019",
          "lf10-020"
        ],
        "begriffe": [],
        "abrufFrage": "Warum wird die Last nicht nur aus dem trockenen Substrat bestimmt?",
        "abrufMuster": "Der Dachaufbau hält zusätzlich Wasser zurück. Für die Tragfähigkeit muss der maßgebende Zustand des vollständigen Begrünungsaufbaus berücksichtigt werden.",
        "aktivitaet": {
          "id": "lf10-l04-e01-aktiv",
          "version": 2,
          "titel": "Mehr Pflanzen auf gleichem Dach",
          "erklaerung": "Eine Änderung der Vegetation kann Aufbau, Lasten und Betrieb des Dachs verändern.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Ein extensiv begrüntes Bestandsdach soll ohne weitere Prüfung zu einem Dachgarten mit Sträuchern werden.",
          "optionen": [
            {
              "id": "o1",
              "text": "Nutzung, Pflege und Zugang müssen neu geklärt werden.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Der schwerere Aufbau braucht eine passende Lastprüfung.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Vorhandene Begrünung beweist die Eignung für jeden Dachgarten.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf10-l13-e01",
        "version": 2,
        "titel": "Von der Rollenfläche zur Bestellmenge rechnen",
        "lernziel": "Du kannst Überdeckungen, Lagen und Zuschläge in einer nachvollziehbaren Mengenrechnung berücksichtigen.",
        "minuten": 7,
        "textschritte": [
          "Die volle Fläche einer Dachbahn ist größer als ihre nutzbare Deckfläche. Überdeckungen an Längsnaht und Stoß verbrauchen einen Teil des Materials. Im vereinfachten Übungsmodell ergibt sich die Deckfläche einer Rolle aus nutzbarer Länge mal nutzbarer Breite. Danach teilst du die benötigte Dachfläche unter Berücksichtigung der Lagenzahl durch die Deckfläche einer Rolle. Zuschläge werden mit ihrem Zweck und ihrer Bezugsmenge kenntlich gemacht. Auf ganze Rollen rundest du erst für die Bestellung auf. Kies und Voranstrich erhalten eigene Mengenansätze mit passenden Einheiten. Eine Schnittzeichnung ergänzt die Liste um Schichtenfunktionen. So lässt sich nachvollziehen, ob eine größere Bestellmenge aus Überdeckung, mehreren Lagen oder einem Zuschlag entstanden ist."
        ],
        "lektionIds": [
          "lf10-l13"
        ],
        "aufgabenIds": [
          "lf10-085",
          "lf10-087",
          "lf10-089",
          "lf10-095"
        ],
        "begriffe": [],
        "abrufFrage": "Warum ist eine Rolle mit 10 m² Material nicht automatisch für 10 m² fertige Dachfläche ausreichend?",
        "abrufMuster": "Naht- und Stoßüberdeckungen verringern die wirksame Deckfläche. Mehrere Lagen und begründete Zuschläge erhöhen zusätzlich den Materialbedarf.",
        "aktivitaet": {
          "id": "lf10-l13-e01-aktiv",
          "version": 2,
          "titel": "Bedarf Schritt für Schritt",
          "erklaerung": "Zwischenergebnisse bleiben ungerundet; erst die kaufbare Einheit bestimmt die Bestellrundung.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Dachfläche und Lagenzahl festlegen"
            },
            {
              "id": "s2",
              "text": "Nutzbare Deckfläche je Rolle aus Überdeckungen bestimmen"
            },
            {
              "id": "s3",
              "text": "Rechnerischen Rollenbedarf ermitteln"
            },
            {
              "id": "s4",
              "text": "Vorgegebene Zuschläge nachvollziehbar berücksichtigen"
            },
            {
              "id": "s5",
              "text": "Bestellmenge auf ganze Rollen aufrunden"
            }
          ]
        }
      },
      {
        "id": "lf10-l18-e01",
        "version": 2,
        "titel": "Die Zusatzschichten eines Gründachs ordnen",
        "lernziel": "Du kannst Schutz, Wurzelschutz, Dränung, Filter und Vegetation funktional unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Über der Abdichtung eines geeigneten Gründachs müssen mehrere Funktionen erfüllt werden. Der mechanische Schutz vermindert Beschädigungen. Der nachgewiesene Wurzelschutz verhindert ein Durchwurzeln der Abdichtung. Eine Dränschicht führt überschüssiges Wasser zu den vorgesehenen Entwässerungspunkten. Der Filter hält Feinteile aus den darüberliegenden Schichten zurück, damit die Dränung nicht zugesetzt wird. Die Vegetationstragschicht bietet den Pflanzen ihren Wurzelraum. Einige Systeme verbinden Funktionen in einem Produkt; trotzdem müssen sie in der Planung einzeln nachgewiesen werden. Anschlüsse und Abläufe bleiben zugänglich und werden gegen Einwachsen geschützt. Eine passende Fläche genügt nicht, wenn Wurzeln an einem offenen Rand hinter den Schutz gelangen können."
        ],
        "lektionIds": [
          "lf10-l18"
        ],
        "aufgabenIds": [
          "lf10-017",
          "lf10-019",
          "lf10-020"
        ],
        "begriffe": [],
        "abrufFrage": "Welche Aufgabe unterscheidet den Filter von der Dränschicht?",
        "abrufMuster": "Der Filter hält Feinteile zurück; die Dränschicht führt überschüssiges Wasser ab. Ohne passenden Filter kann die Dränung zugesetzt werden.",
        "aktivitaet": {
          "id": "lf10-l18-e01-aktiv",
          "version": 2,
          "titel": "Funktionen über der Abdichtung",
          "erklaerung": "Die Reihenfolge beschreibt die Funktionen des Quellenmodells; Systemprodukte können einzelne Funktionen zusammenfassen.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Mechanischen Schutz der Abdichtung vorsehen"
            },
            {
              "id": "s2",
              "text": "Nachgewiesenen Wurzelschutz fortführen"
            },
            {
              "id": "s3",
              "text": "Dränfunktion für überschüssiges Wasser anordnen"
            },
            {
              "id": "s4",
              "text": "Filter zum Rückhalt von Feinteilen einplanen"
            },
            {
              "id": "s5",
              "text": "Vegetationstragschicht und passende Pflanzen aufbauen"
            }
          ]
        }
      },
      {
        "id": "lf10-l19-e01",
        "version": 2,
        "titel": "Oberflächenschutz und Schutzlage unterscheiden",
        "lernziel": "Du kannst Schutz vor Bewitterung, mechanischer Belastung und Windsog den passenden Funktionen zuordnen.",
        "minuten": 7,
        "textschritte": [
          "Die Abdichtung wird durch Sonne, Temperaturwechsel und äußere Belastungen beansprucht. Ein leichter Oberflächenschutz kann als werkseitige Bestreuung auf einer Bahn vorhanden sein. Schwerer Oberflächenschutz kann beispielsweise aus geeignetem Kies oder einem geplanten Belag bestehen. Seine Last muss zum Tragwerk passen. Ob eine Auflast zugleich zur Windsogsicherung beiträgt, wird am vollständigen Sicherungskonzept beurteilt. Eine zusätzliche Schutzlage unter einem Nutzbelag vermindert mechanische Beschädigungen der Abdichtung. Sie ist nicht automatisch eine wurzelfeste Ebene oder eine eigene Abdichtung. Stelle bei einer Materialliste daher zu jeder Lage ihre Funktion und Bezugsmenge fest. Für eine Schüttung rechnest du Fläche mal Schütthöhe mit der Höhe in Metern."
        ],
        "lektionIds": [
          "lf10-l19"
        ],
        "aufgabenIds": [
          "lf10-069",
          "lf10-070",
          "lf10-072",
          "lf10-089"
        ],
        "begriffe": [],
        "abrufFrage": "Welches Volumen ergibt im Übungsmodell eine 0,05 m hohe Schüttung auf 100 m²?",
        "abrufMuster": "100 m² · 0,05 m = 5 m³. Die Traglast und die tatsächliche Eignung der Schüttung werden getrennt geprüft.",
        "aktivitaet": {
          "id": "lf10-l19-e01-aktiv",
          "version": 2,
          "titel": "Schutzfunktion erkennen",
          "erklaerung": "Schutzfunktion, Last und Menge müssen im geplanten Aufbau zusammenpassen.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Bestreuung der Oberlage",
              "rechts": "Leichter Oberflächenschutz"
            },
            {
              "id": "p2",
              "links": "Geplanter Kiesaufbau",
              "rechts": "Kann als schwerer Oberflächenschutz dienen"
            },
            {
              "id": "p3",
              "links": "Schutzlage unter Nutzbelag",
              "rechts": "Vermindert mechanische Beschädigung"
            },
            {
              "id": "p4",
              "links": "Fläche mal Schütthöhe",
              "rechts": "Ergibt das Volumen einer gleichmäßigen Schüttung"
            }
          ]
        }
      }
    ]
  }
];

const LF11_KAPITEL: LernKapitel[] = [
  {
    "id": "lf11-k01",
    "titel": "Aufbau, Luftweg und Wärmeschutz",
    "einheiten": [
      {
        "id": "lf11-l01-e01",
        "version": 2,
        "titel": "Schichten nach ihrer Aufgabe lesen",
        "lernziel": "Du kannst tragende Wand, Dämmung, Luftschicht und Bekleidung nach ihren Aufgaben unterscheiden.",
        "minuten": 6,
        "textschritte": [
          "Eine vorgehängte hinterlüftete Fassade verteilt ihre Aufgaben auf mehrere Teile. Die tragende Wand nimmt über die Verankerung die Kräfte aus der Bekleidung auf. Die Dämmung verringert den Wärmestrom durch die Wand. Außen schützt die Bekleidung vor direkter Bewitterung. Dazwischen liegt ein geplanter Luftraum, über den eingedrungene Feuchte abgeleitet und ausgetrocknet werden kann. Die Unterkonstruktion verbindet diese Aufgaben: Sie trägt die Bekleidung und hält den vorgesehenen Abstand. In einer Schnittzeichnung suchst du deshalb zuerst die Wand und arbeitest dich nach außen. Frage an jeder Schicht: Trägt sie, dämmt sie, schützt sie vor Regen oder ermöglicht sie Trocknung? Ein Baustoffname allein erklärt den Aufbau noch nicht."
        ],
        "lektionIds": [
          "lf11-l01"
        ],
        "aufgabenIds": [
          "lf11-001",
          "lf11-003",
          "lf11-102"
        ],
        "begriffe": [],
        "abrufFrage": "Welche vier Aufgaben erkennst du im Fassadenschnitt?",
        "abrufMuster": "Die Wand trägt, die Dämmung vermindert Wärmeverluste, die Bekleidung schützt vor direktem Regen und der Luftraum unterstützt Ableitung und Trocknung.",
        "aktivitaet": {
          "id": "lf11-l01-e01-aktiv",
          "version": 2,
          "titel": "Aufgabe und Bauteil",
          "erklaerung": "Die Schichten erfüllen verschiedene Aufgaben und müssen gemeinsam funktionieren.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Tragende Wand",
              "rechts": "Nimmt die weitergeleiteten Lasten auf"
            },
            {
              "id": "p2",
              "links": "Wärmedämmung",
              "rechts": "Verringert den Wärmestrom"
            },
            {
              "id": "p3",
              "links": "Bekleidung",
              "rechts": "Fängt direkte Bewitterung ab"
            },
            {
              "id": "p4",
              "links": "Hinterlüftungsraum",
              "rechts": "Ermöglicht Luftbewegung und Trocknung"
            }
          ]
        }
      },
      {
        "id": "lf11-l02-e01",
        "version": 2,
        "titel": "Den Luftweg offen halten",
        "lernziel": "Du kannst erklären, warum die Hinterlüftung einen zusammenhängenden Luftweg mit Ein- und Austritt braucht.",
        "minuten": 6,
        "textschritte": [
          "Ein leerer Spalt hinter der Bekleidung ist noch kein funktionierender Luftweg. Luft muss eintreten, durch den vorgesehenen Raum strömen und wieder austreten können. Erwärmte Luft kann dabei aufsteigen und Feuchtigkeit mitnehmen. Auch Wind beeinflusst die Strömung. Wird der Sockel vollständig zugeschlossen oder ragt Dämmstoff in den Spalt, wird dieser Zusammenhang gestört. Betrachte deshalb die ganze Höhe einschließlich Fensteranschlüssen und oberem Abschluss. Ein Schutzgitter soll Tiere und groben Schmutz abhalten und trotzdem den geplanten freien Querschnitt ermöglichen. Die erforderlichen Abmessungen entnimmst du den zum Gebäude und System gehörenden Unterlagen. Eine einzelne pauschale Spaltbreite ersetzt diese Prüfung nicht."
        ],
        "lektionIds": [
          "lf11-l02"
        ],
        "aufgabenIds": [
          "lf11-004",
          "lf11-005",
          "lf11-006"
        ],
        "begriffe": [],
        "abrufFrage": "Warum genügt ein freier Spalt mitten in der Wand nicht?",
        "abrufMuster": "Auch Eintritt, Austritt und der verbindende Luftweg müssen frei und passend geplant sein. Eine Sperre am Sockel kann die Strömung unterbrechen.",
        "aktivitaet": {
          "id": "lf11-l02-e01-aktiv",
          "version": 2,
          "titel": "Fehler am Sockel",
          "erklaerung": "Ein funktionierender Luftweg braucht eine geeignete Verbindung zwischen Eintritt und Austritt.",
          "typ": "skizzenfehler",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Die Skizze zeigt einen Luftraum hinter der Bekleidung. Bei A ist sein unteres Ende vollständig geschlossen.",
          "optionen": [
            {
              "id": "o1",
              "text": "Die geplante Zuluft kann bei A nicht eintreten.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Ein Luftspalt oberhalb der Sperre beweist noch keine funktionierende Hinterlüftung.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Die geschlossene Leiste verbessert automatisch die Luftströmung.",
              "korrekt": false
            }
          ],
          "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 480 220\"><title>Geschlossener Luftweg am Fassadensockel</title><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\"><path d=\"M90 30v160M155 30v160M225 30v160\"/><path d=\"M155 190h70\" stroke=\"#c45f32\" stroke-width=\"10\"/></g><path d=\"M190 170V65l-8 12m8-12 8 12\" fill=\"none\" stroke=\"#4586b3\" stroke-width=\"4\"/><g fill=\"currentColor\" font-family=\"sans-serif\" font-size=\"16\"><text x=\"25\" y=\"22\">Wand</text><text x=\"240\" y=\"75\">Bekleidung</text><text x=\"240\" y=\"186\">A: unten vollständig geschlossen</text><text x=\"160\" y=\"215\">Luftraum</text></g></svg>",
          "bildbeschreibung": "Die Skizze zeigt einen Luftraum hinter der Bekleidung. Bei A ist sein unteres Ende vollständig geschlossen."
        }
      },
      {
        "id": "lf11-l14-e01",
        "version": 2,
        "titel": "Fassade als zusammenhängendes System erklären",
        "lernziel": "Du kannst Bekleidung, Unterkonstruktion, Verankerung und Ergänzungsteile in einem Fassadensystem zusammenführen.",
        "minuten": 6,
        "textschritte": [
          "Bei einer Fassadenkontrolle reicht es nicht, die sichtbaren Platten zu beurteilen. Die Bekleidung schützt die Wand vor direkter Witterung, benötigt aber eine tragfähige Verbindung und passende Anschlüsse. Verankerung, Unterkonstruktion, Befestigungen, ein gegebenenfalls vorgesehener Dämmstoff und der Luftweg bilden zusammen das System. Ergänzungsteile schließen es an Sockel, Ecken, Fenstern und oben ab. Beschreibe einen Befund deshalb mit Bauteil und Funktion: Ein geschlossenes Sockelprofil betrifft etwa den geplanten Lufteintritt. Ein lockerer Wandanker betrifft dagegen den Lastweg. Auch Brandverhalten und zulässiger Einsatz werden für das gesamte konkrete Gebäude und System geprüft. Ein vertrauter Baustoffname allein ersetzt weder diese Prüfung noch eine vollständige Beschreibung."
        ],
        "lektionIds": [
          "lf11-l14"
        ],
        "aufgabenIds": [
          "lf11-001",
          "lf11-003",
          "lf11-099",
          "lf11-102"
        ],
        "begriffe": [],
        "abrufFrage": "Wie unterscheidest du einen Fehler am Luftweg von einem Fehler am Lastweg?",
        "abrufMuster": "Ein blockierter Lufteintritt behindert Strömung und Trocknung. Ein lockerer Anker schwächt die Kraftübertragung in die Wand.",
        "aktivitaet": {
          "id": "lf11-l14-e01-aktiv",
          "version": 2,
          "titel": "Befunde richtig einordnen",
          "erklaerung": "Die sichtbare Oberfläche ist nur ein Teil der Fassade. Verdeckte Funktionen müssen ebenfalls erhalten bleiben.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Bei einer Begehung werden eine lockere Konsole und ein mit Dämmstoff gefüllter Luftspalt entdeckt.",
          "optionen": [
            {
              "id": "o1",
              "text": "Die Konsole betrifft den Lastweg.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Der gefüllte Luftspalt betrifft den vorgesehenen Luftweg.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Eine unbeschädigte sichtbare Platte beweist, dass beide Befunde unwichtig sind.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf11-l15-e01",
        "version": 2,
        "titel": "Dämmdicke aus Widerständen ableiten",
        "lernziel": "Du kannst im vorgegebenen Rechenmodell den noch fehlenden Wärmewiderstand in eine Dämmdicke umrechnen.",
        "minuten": 6,
        "textschritte": [
          "Für eine Dämmstoffrechnung brauchst du einen vorgegebenen Zielwert und nachvollziehbare Materialdaten. Im vereinfachten Schichtenmodell ergibt sich der erforderliche Gesamtwiderstand aus dem Kehrwert des U-Werts. Von diesem Gesamtwert ziehst du die berücksichtigten vorhandenen Schichtwiderstände und Wärmeübergangswiderstände ab. Übrig bleibt der Widerstand, den die zusätzliche Dämmung liefern soll. Für eine gleichmäßige Schicht gilt R = d/λ; daraus folgt d = R · λ. Setzt du λ in Watt je Meter und Kelvin ein, wird die berechnete Dicke in Metern ausgegeben. Das Ergebnis ist zunächst ein Rechenwert. Produktdicken, Befestigungseinflüsse und die tatsächliche Konstruktion werden für eine Ausführungsplanung zusätzlich geprüft."
        ],
        "lektionIds": [
          "lf11-l15"
        ],
        "aufgabenIds": [
          "lf11-009",
          "lf11-012",
          "lf11-013"
        ],
        "begriffe": [],
        "abrufFrage": "Wie kommst du vom fehlenden Wärmewiderstand zur Dicke der zusätzlichen Dämmung?",
        "abrufMuster": "Im Schichtenmodell multiplizierst du den fehlenden Widerstand mit der Wärmeleitfähigkeit des Dämmstoffs: d = R · λ.",
        "aktivitaet": {
          "id": "lf11-l15-e01-aktiv",
          "version": 2,
          "titel": "Die zusätzliche Dämmung berechnen",
          "erklaerung": "Der U-Zielwert ist eine Eingabe der Aufgabe; er wird hier nicht als allgemeine gesetzliche Anforderung festgelegt.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Vorgegebenen U-Zielwert in Gesamtwiderstand umrechnen"
            },
            {
              "id": "s2",
              "text": "Berücksichtigte vorhandene Widerstände ermitteln"
            },
            {
              "id": "s3",
              "text": "Diese vom erforderlichen Gesamtwiderstand abziehen"
            },
            {
              "id": "s4",
              "text": "Fehlenden Widerstand mit der Wärmeleitfähigkeit multiplizieren"
            },
            {
              "id": "s5",
              "text": "Einheit, Produktdicke und Anwendungsbedingungen prüfen"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf11-k02",
    "titel": "Unterkonstruktion, Verankerung und Anschlüsse",
    "einheiten": [
      {
        "id": "lf11-l03-e01",
        "version": 2,
        "titel": "Lasten durch die Unterkonstruktion verfolgen",
        "lernziel": "Du kannst den Lastweg von der Bekleidung bis in die Wand beschreiben.",
        "minuten": 6,
        "textschritte": [
          "Wenn Wind an einer Fassadenplatte zieht, endet die Kraft nicht an der sichtbaren Schraube. Sie läuft über die Befestigung in die Traglattung oder das Profil, über Verbindungsmittel in die weitere Unterkonstruktion und schließlich über die Verankerung in die tragende Wand. Unterscheide diese Verbindungen beim Lesen einer Zeichnung. Eine Konterlattung kann den Luftraum schaffen, eine Traglattung die Bekleidung aufnehmen. Ihre Richtung ergibt sich aus dem gewählten System und Deckbild. Materialverträglichkeit und Korrosionsschutz gehören ebenfalls zum Lastweg: Ein ungeeignetes Verbindungsmittel kann eine sonst passende Konstruktion schwächen. Prüfe deshalb nicht nur die Platte, sondern jede Übergabestelle ihrer Kräfte."
        ],
        "lektionIds": [
          "lf11-l03"
        ],
        "aufgabenIds": [
          "lf11-021",
          "lf11-023",
          "lf11-024"
        ],
        "begriffe": [],
        "abrufFrage": "Wie gelangt Windsog an der Bekleidung in die tragende Wand?",
        "abrufMuster": "Über Befestigungsmittel, tragende Unterkonstruktion, deren Verbindungen und die Verankerung in der Wand.",
        "aktivitaet": {
          "id": "lf11-l03-e01-aktiv",
          "version": 2,
          "titel": "Den Kraftweg verfolgen",
          "erklaerung": "Jede Verbindung im Kraftweg muss zur vorgesehenen Belastung und zu den beteiligten Werkstoffen passen.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Wind beansprucht die Bekleidung"
            },
            {
              "id": "s2",
              "text": "Befestigung leitet die Kraft in Latte oder Profil"
            },
            {
              "id": "s3",
              "text": "Verbindungen übertragen sie innerhalb der Unterkonstruktion"
            },
            {
              "id": "s4",
              "text": "Verankerung gibt die Kraft an die tragende Wand ab"
            }
          ]
        }
      },
      {
        "id": "lf11-l05-e01",
        "version": 2,
        "titel": "Verankerungen mit passenden Eingaben planen",
        "lernziel": "Du kannst Untergrund, Last und Raster als zusammengehörige Angaben einer Verankerungsplanung benennen.",
        "minuten": 6,
        "textschritte": [
          "Eine Verankerung wird für den vorhandenen Wandbaustoff und die auftretenden Kräfte ausgewählt. Beton, Vollstein und Lochstein bieten unterschiedliche Voraussetzungen. Deshalb darf eine Dübelangabe nicht allein aus ihrem Durchmesser abgeleitet werden. Zum Prüfen gehören Untergrund, geeignetes System, Ausführung und die vorgegebenen Lasten. Im vereinfachten Rechenmodell der Übungen lässt sich aus Lattenabstand a und erforderlicher Dübelzahl n je Quadratmeter der Abstand d = 1/(a · n) bestimmen. Beide Angaben müssen bereits zur Planung passen; die Formel ermittelt keine Tragfähigkeit. Rechne für unterschiedliche Fassadenbereiche getrennt, wenn dort andere Eingaben gelten. Auch die Eigenlast der Bekleidung bleibt Teil der Lastannahmen."
        ],
        "lektionIds": [
          "lf11-l05"
        ],
        "aufgabenIds": [
          "lf11-017",
          "lf11-018",
          "lf11-020"
        ],
        "begriffe": [],
        "abrufFrage": "Was kann die Formel d = 1/(a · n) berechnen und was muss vorher feststehen?",
        "abrufMuster": "Sie liefert im Übungsraster den Dübelabstand. Untergrund, geeignetes Verankerungssystem, Lasten und erforderliche Dübelzahl müssen vorher geklärt sein.",
        "aktivitaet": {
          "id": "lf11-l05-e01-aktiv",
          "version": 2,
          "titel": "Eine Zahl reicht nicht",
          "erklaerung": "Gleiche Durchmesser beweisen weder gleichen Untergrund noch gleiche Tragfähigkeit.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Für eine neue Fassade liegt nur eine alte Dübelzeichnung vor. Der Wandbaustoff und das Gewicht der neuen Bekleidung sind noch unbekannt.",
          "optionen": [
            {
              "id": "o1",
              "text": "Untergrund und Lastannahmen vor der Übernahme klären.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Die Eignung des vorgesehenen Verankerungssystems prüfen.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Die alte Verankerungstiefe allein wegen gleichen Dübeldurchmessers übernehmen.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf11-l07-e01",
        "version": 2,
        "titel": "Fassadenfelder bis zu den Rändern einteilen",
        "lernziel": "Du kannst aus Rastermaß und Wandbreite volle Felder sowie verbleibende Randfelder unterscheiden.",
        "minuten": 6,
        "textschritte": [
          "Bei Fassadenplatten entscheidet die Einteilung darüber, wie die Fläche an beiden Enden schließt. Im behandelten Übungsmodell entsteht ein Raster aus Plattenbreite und vorgesehener Fuge. Teile die Wandbreite durch dieses Maß. Ein Ergebnis mit Nachkommastellen bedeutet, dass das Raster nicht ohne Rest aufgeht. Plane deshalb volle Felder und passende Randfelder, statt die letzte Platte zufällig zuzuschneiden. Kontrolliere die Einteilung auch an Öffnungen. Für die Unterkonstruktion zählt anschließend nicht nur die Feldzahl: Zwischen zwei äußeren Latten liegen mehrere Felder, daher braucht ein einfaches durchgehendes Raster eine Latte mehr als Felder. Zusätzliche Rand- und Anschlusslatten werden getrennt erfasst. Alle Maße müssen dabei dieselbe Einheit haben."
        ],
        "lektionIds": [
          "lf11-l07"
        ],
        "aufgabenIds": [
          "lf11-093",
          "lf11-095",
          "lf11-097"
        ],
        "begriffe": [],
        "abrufFrage": "Warum ergeben zehn durchgehende Felder elf begrenzende Lattenreihen?",
        "abrufMuster": "Jedes Feld liegt zwischen zwei Latten. Benachbarte Felder teilen eine Latte; zu zehn Feldern kommt deshalb eine äußere Begrenzung hinzu.",
        "aktivitaet": {
          "id": "lf11-l07-e01-aktiv",
          "version": 2,
          "titel": "Felder sind keine Latten",
          "erklaerung": "Zähle beim Kontrollieren die Begrenzungen des Rasters und die Felder getrennt.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine Skizze zeigt zehn nebeneinanderliegende Felder, außen jeweils von einer Latte begrenzt. Die Liste nennt zehn Lattenreihen.",
          "optionen": [
            {
              "id": "o1",
              "text": "Für dieses einfache Raster sind elf begrenzende Lattenreihen nötig.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Anschlusslatten zusätzlich nach dem Detail erfassen.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Die Feldzahl kann ohne Prüfung als Lattenzahl übernommen werden.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf11-l08-e01",
        "version": 2,
        "titel": "Große Tafeln an ihren Anschlüssen verstehen",
        "lernziel": "Du kannst Fugen und Abschlussprofile nach Bewegung, Wasserführung und Lüftung beurteilen.",
        "minuten": 6,
        "textschritte": [
          "Bei einer großen Fassadentafel fallen zuerst Format und Oberfläche auf. Für die Ausführung sind ihre Ränder ebenso wichtig. Eine Fuge ermöglicht die im System vorgesehene Bewegung und bildet zusammen mit Hinterlegung oder Profil einen geplanten Anschluss. Sie ist deshalb kein beliebiger Spalt, der nachträglich vollständig verschlossen wird. Am Sockel muss der Abschluss zugleich den Luftweg berücksichtigen. An der Attika wird Wasser über einen passenden oberen Abschluss geführt. Fenster und Außenecken brauchen eigene Detailzeichnungen. Prüfe in jeder Zeichnung drei Fragen: Wohin kann Wasser gelangen, wo bleibt die Bewegungsmöglichkeit und wie wird der Luftweg fortgeführt? Fugenbreiten und Befestigungsdetails werden zum gewählten Tafelprodukt festgelegt."
        ],
        "lektionIds": [
          "lf11-l08"
        ],
        "aufgabenIds": [
          "lf11-050",
          "lf11-051",
          "lf11-098"
        ],
        "begriffe": [],
        "abrufFrage": "Welche drei Funktionen prüfst du an einem Anschluss großer Fassadentafeln?",
        "abrufMuster": "Geplante Wasserführung, ausreichende Bewegungsmöglichkeit und die passende Fortführung beziehungsweise Öffnung des Luftwegs.",
        "aktivitaet": {
          "id": "lf11-l08-e01-aktiv",
          "version": 2,
          "titel": "Detail und Prüfpunkt",
          "erklaerung": "Die konkrete Ausbildung folgt dem gewählten System und den Bedingungen des Gebäudes.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Fuge zwischen Tafeln",
              "rechts": "Vorgesehene Bewegung berücksichtigen"
            },
            {
              "id": "p2",
              "links": "Sockelabschluss",
              "rechts": "Lufteintritt und Schutz zusammen planen"
            },
            {
              "id": "p3",
              "links": "Attikaabdeckung",
              "rechts": "Oberen Wasserweg kontrollieren"
            },
            {
              "id": "p4",
              "links": "Fensteranschluss",
              "rechts": "Übergang zur Öffnung gesondert zeichnen"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf11-k03",
    "titel": "Werkstoffe für die Wandbekleidung",
    "einheiten": [
      {
        "id": "lf11-l06-e01",
        "version": 2,
        "titel": "Bedarfstabellen mit Deckart lesen",
        "lernziel": "Du kannst erklären, warum Plattenformat und Deckart gemeinsam den Bedarf bestimmen.",
        "minuten": 6,
        "textschritte": [
          "Eine Platte hat eine Lieferfläche und eine wirksame Deckfläche. Überdeckungen und die Anordnung der Reihen sorgen dafür, dass diese Flächen verschieden sind. Deshalb bestimmt das Format allein noch nicht den Verbrauch. Eine Faserzementplatte kann in verschiedenen Deckarten eingesetzt werden und dabei unterschiedliche Mengen je Quadratmeter erfordern. Suche in der Tabelle zuerst die Deckart, dann das passende Format und schließlich die angegebenen Randbedingungen. Übernimm die Einheit zusammen mit dem Zahlenwert. Stück je Quadratmeter und Meter Latte je Quadratmeter beschreiben verschiedene Bestellmengen. Für die Gesamtmenge multiplizierst du den passenden Verbrauch mit der zugehörigen Fläche. Anschlüsse, Zuschnitte und begründete Zuschläge werden danach gesondert betrachtet."
        ],
        "lektionIds": [
          "lf11-l06"
        ],
        "aufgabenIds": [
          "lf11-031",
          "lf11-032",
          "lf11-033"
        ],
        "begriffe": [],
        "abrufFrage": "Warum kann dieselbe Platte in zwei Deckarten einen anderen Bedarf je Quadratmeter haben?",
        "abrufMuster": "Weil Überdeckung und Reihenanordnung ihre wirksame Deckfläche verändern. Ein kleinerer Flächenbeitrag je Platte erhöht den Bedarf.",
        "aktivitaet": {
          "id": "lf11-l06-e01-aktiv",
          "version": 2,
          "titel": "Eine Tabellenzeile sicher auswählen",
          "erklaerung": "Erst wenn Deckart und Format passen, darf der Verbrauchswert in die Mengenrechnung eingehen.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Vorgesehene Deckart feststellen"
            },
            {
              "id": "s2",
              "text": "Passendes Plattenformat auswählen"
            },
            {
              "id": "s3",
              "text": "Überdeckungen und Tabellenbedingungen prüfen"
            },
            {
              "id": "s4",
              "text": "Verbrauch mit Einheit übernehmen"
            },
            {
              "id": "s5",
              "text": "Mit der zugehörigen Deckfläche multiplizieren"
            }
          ]
        }
      },
      {
        "id": "lf11-l16-e01",
        "version": 2,
        "titel": "Schiefer an der Wand passend einteilen",
        "lernziel": "Du kannst erklären, warum Dach- und Wanddeckung eigene Einteilungen benötigen.",
        "minuten": 6,
        "textschritte": [
          "Schiefer kann sowohl Dachflächen als auch Wände bekleiden. Daraus folgt nicht, dass eine Dachzeichnung unverändert an die Wand gehört. In den behandelten Wanddeckungen werden die Gebinde ohne die für manche Dachdeckungen typische Steigung angeordnet. Deckart, Format und Überdeckung bestimmen den jeweiligen Reihenabstand. Bei der Rechteckdoppeldeckung unterscheidet er sich deshalb von einer waagerechten Deckung. Schaue außerdem unter den Stein: Schalung oder Lattung, gegebenenfalls eine passende Vordeckung und die Befestigung müssen zur gewählten Ausführung gehören. Zum Übertragen einer Einteilung zeichnest du zuerst das Deckschema und markierst die tatsächlich wirksamen Maße. Erst danach setzt du sie in die passende Formel ein."
        ],
        "lektionIds": [
          "lf11-l16"
        ],
        "aufgabenIds": [
          "lf11-025",
          "lf11-027",
          "lf11-029",
          "lf11-030"
        ],
        "begriffe": [],
        "abrufFrage": "Warum reicht die Aussage „gleicher Schiefer wie am Dach“ für eine Wandeinteilung nicht?",
        "abrufMuster": "Wand und Dach können andere Gebindeanordnung, Deckarten und Anschlussbedingungen haben. Reihenabstand, Unterlage und Befestigung werden für die konkrete Wanddeckung bestimmt.",
        "aktivitaet": {
          "id": "lf11-l16-e01-aktiv",
          "version": 2,
          "titel": "Deckung und Rechenbezug",
          "erklaerung": "Die Formel folgt dem Deckschema und lässt sich nicht allein aus dem Materialnamen auswählen.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Rechteckdoppeldeckung",
              "rechts": "Reihenabstand im Modell mit Halbierung"
            },
            {
              "id": "p2",
              "links": "Waagerechte Deckung",
              "rechts": "Reihenabstand aus Höhe minus Überdeckung"
            },
            {
              "id": "p3",
              "links": "Deckschema",
              "rechts": "Zeigt Anordnung und Überlappung"
            },
            {
              "id": "p4",
              "links": "Vordeckung",
              "rechts": "Gehört zur geplanten Unterlage"
            }
          ]
        }
      },
      {
        "id": "lf11-l17-e01",
        "version": 2,
        "titel": "Keramische Bekleidung von der Wand aus planen",
        "lernziel": "Du kannst keramische Bekleidungen und ihre Unterkonstruktion als abgestimmtes System beschreiben.",
        "minuten": 6,
        "textschritte": [
          "Keramische Platten und geeignete Ziegel können eine Wandbekleidung bilden. Ihre Form und Herstellungsweise beeinflussen die Befestigung und das Erscheinungsbild. Entscheidend ist deshalb nicht nur, ob das Element keramisch ist, sondern für welchen Fassadenaufbau es vorgesehen ist. Die Unterkonstruktion muss Lasten aufnehmen und die geplante Befestigung ermöglichen. Auch am unteren Abschluss treffen mehrere Aufgaben zusammen: Schutz vor Spritzwasser, geordnete Wasserableitung und der vorgesehene Lufteintritt. Beurteile Sockel und Balkonanschlüsse jeweils nach ihrer tatsächlichen Umgebung. Die Zahlen aus einer Übung sind Angaben dieses Beispiels. Für die Ausführung werden geeignete Produkte, Abstände und Befestigungen aus den zugehörigen Planungsunterlagen übernommen."
        ],
        "lektionIds": [
          "lf11-l17"
        ],
        "aufgabenIds": [
          "lf11-035",
          "lf11-036",
          "lf11-037"
        ],
        "begriffe": [],
        "abrufFrage": "Welche Funktionen müssen am unteren Abschluss einer keramischen Bekleidung zusammenpassen?",
        "abrufMuster": "Schutz gegen die örtliche Spritzwasserbeanspruchung, geplante Wasserführung, geeignete Befestigung und der vorgesehene Luftweg.",
        "aktivitaet": {
          "id": "lf11-l17-e01-aktiv",
          "version": 2,
          "titel": "Keramik über dem Balkon",
          "erklaerung": "Das Bauteilmaterial ist nur eine Eingabe. Anschlussumgebung und Höhenbezug sind ebenfalls erforderlich.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Ein Anschlussdetail soll vom erdnahen Sockel unverändert an eine Balkonfläche übernommen werden. Belagshöhe und Spritzwasserbereich sind noch offen.",
          "optionen": [
            {
              "id": "o1",
              "text": "Den Anschluss anhand der tatsächlichen Belagshöhe prüfen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Wasser- und Luftweg im Detail gemeinsam betrachten.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Allein das gleiche Ziegelmodell beweist, dass das Detail unverändert passt.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf11-l18-e01",
        "version": 2,
        "titel": "Holzbewegung und Befestigung zusammendenken",
        "lernziel": "Du kannst Bewegungsfugen, korrosionsbeständige Befestigung und Hinterlüftung bei Holzschindeln begründen.",
        "minuten": 6,
        "textschritte": [
          "Holzschindeln nehmen Feuchtigkeit auf und geben sie wieder ab. Dabei verändern sie ihre Maße. Die geplanten Fugen berücksichtigen deshalb Holzart und Feuchtezustand, statt nur ein regelmäßiges Bild herzustellen. Der Fuß der Schindel soll Wasser gut abgeben können; Ablagerungen fördern anhaltende Feuchte. Auch die Befestigung muss zum Holz und seiner Bewitterung passen. In den behandelten Ausführungen werden geeignete Edelstahlstifte verwendet. Prüfe zusätzlich angrenzende Metallteile, weil ausgewaschene Holzinhaltsstoffe oder Behandlungsmittel unerwünschte Reaktionen auslösen können. Hinter der Schindelbekleidung bleibt der geplante Luftweg erhalten. Eine direkt anliegende Folie ohne passenden Aufbau kann diese Trocknung behindern. Dauerhaftigkeit entsteht aus diesen Details gemeinsam."
        ],
        "lektionIds": [
          "lf11-l18"
        ],
        "aufgabenIds": [
          "lf11-038",
          "lf11-040",
          "lf11-041",
          "lf11-044"
        ],
        "begriffe": [],
        "abrufFrage": "Warum gehören Bewegungsfugen und Materialverträglichkeit zur Schindelplanung?",
        "abrufMuster": "Das Holz verändert mit seiner Feuchte die Maße. Ausgewaschene Inhaltsstoffe können außerdem angrenzende Metalle beeinflussen; beides muss in Aufbau und Materialwahl berücksichtigt werden.",
        "aktivitaet": {
          "id": "lf11-l18-e01-aktiv",
          "version": 2,
          "titel": "Ursache und Konsequenz",
          "erklaerung": "Holzart, Feuchte, Befestigung und Anschlüsse wirken zusammen.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Quellen und Schwinden",
              "rechts": "Passende Bewegungsfugen vorsehen"
            },
            {
              "id": "p2",
              "links": "Bewitterte Befestigung",
              "rechts": "Geeignete korrosionsbeständige Stifte wählen"
            },
            {
              "id": "p3",
              "links": "Ausgewaschene Inhaltsstoffe",
              "rechts": "Angrenzende Metalle auf Verträglichkeit prüfen"
            },
            {
              "id": "p4",
              "links": "Feuchte hinter der Bekleidung",
              "rechts": "Geplanten Luftweg erhalten"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf11-k04",
    "titel": "Deckbilder verstehen und einteilen",
    "einheiten": [
      {
        "id": "lf11-l04-e01",
        "version": 2,
        "titel": "Schnurabstand und Sprungmaß trennen",
        "lernziel": "Du kannst Reihenabstand und seitlichen Versatz eines Deckbildes auseinanderhalten.",
        "minuten": 6,
        "textschritte": [
          "Ein gleichmäßiges Deckbild entsteht durch eine geplante Einteilung. Der Schnurabstand gibt vor, wo die Gebinde oder Bezugslinien liegen. Das Sprungmaß beschreibt dagegen den seitlichen Versatz von einer Reihe zur nächsten. Zwei Fassaden können denselben Reihenabstand haben und durch unterschiedlichen Versatz trotzdem anders aussehen. Zeichne vor dem Anschlagen ein kleines Muster mit mindestens drei Reihen. Markiere daran die Überdeckung und den Versatz in verschiedenen Richtungen. Übertrage anschließend die Einteilung auf die gesamte Wand und prüfe die Randstücke an Ecken und Öffnungen. Ein schönes Muster in der Wandmitte reicht nicht, wenn am Fenster unbrauchbar schmale Zuschnitte entstehen. Deckart und Anschlussplanung gehören deshalb zusammen."
        ],
        "lektionIds": [
          "lf11-l04"
        ],
        "aufgabenIds": [
          "lf11-031",
          "lf11-070",
          "lf11-081"
        ],
        "begriffe": [],
        "abrufFrage": "Was ändert das Sprungmaß im Unterschied zum Reihenabstand?",
        "abrufMuster": "Das Sprungmaß verändert den seitlichen Versatz aufeinanderfolgender Gebinde. Der Reihenabstand bestimmt ihre Lage in der Höhe.",
        "aktivitaet": {
          "id": "lf11-l04-e01-aktiv",
          "version": 2,
          "titel": "Maß und Wirkung",
          "erklaerung": "Markiere die Richtungen in einer Skizze, bevor du Maße in Formeln einsetzt.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Reihenabstand",
              "rechts": "Legt die Höhenlage der Gebinde fest"
            },
            {
              "id": "p2",
              "links": "Sprungmaß",
              "rechts": "Verschiebt das nächste Gebinde seitlich"
            },
            {
              "id": "p3",
              "links": "Höhenüberdeckung",
              "rechts": "Beschreibt die Überlappung in der Höhe"
            },
            {
              "id": "p4",
              "links": "Randstück",
              "rechts": "Schließt das Deckbild am Flächenende ab"
            }
          ]
        }
      },
      {
        "id": "lf11-l09-e01",
        "version": 2,
        "titel": "Giebelfläche und Randstreifen getrennt rechnen",
        "lernziel": "Du kannst eine dreieckige Giebelfläche berechnen und getrennt erfasste Teilflächen abziehen.",
        "minuten": 6,
        "textschritte": [
          "Bei der deutschen Deckung an einer Giebelwand verbindest du Flächengeometrie und Deckungsplanung. Ein dreieckiger Giebel hat die Fläche Breite mal Höhe geteilt durch zwei. Fenster und getrennt gerechnete Randstreifen werden erst danach abgezogen. Verwende dabei für jede Teilfläche die passende Form. Eine schräge Kante ist eine Länge und noch keine abzuziehende Fläche; für den Randstreifen brauchst du zusätzlich seine geplante Breite. Im symmetrischen Übungsdreieck lässt sich die Giebelschräge mit Pythagoras aus halber Breite und Höhe bestimmen. Anschließend multiplizierst du die verbleibende Deckfläche mit dem passenden Verbrauch. Randplatten und Eckausbildung bleiben eigene Positionen, damit ihre Menge nicht doppelt in der Bestellung steht."
        ],
        "lektionIds": [
          "lf11-l09"
        ],
        "aufgabenIds": [
          "lf11-060",
          "lf11-061",
          "lf11-062"
        ],
        "begriffe": [],
        "abrufFrage": "Warum ziehst du eine Giebelschräge nicht unmittelbar von der Giebelfläche ab?",
        "abrufMuster": "Eine Schräge wird in Metern gemessen, eine Fläche in Quadratmetern. Erst mit einer zugehörigen Breite entsteht eine Randfläche.",
        "aktivitaet": {
          "id": "lf11-l09-e01-aktiv",
          "version": 2,
          "titel": "Vom Giebel zur Decksteinmenge",
          "erklaerung": "Längen und Flächen dürfen nicht voneinander abgezogen werden.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Giebeldreieck aus Breite und Höhe berechnen"
            },
            {
              "id": "s2",
              "text": "Fenster- und getrennte Randflächen ermitteln"
            },
            {
              "id": "s3",
              "text": "Diese Flächen von der Gesamtfläche abziehen"
            },
            {
              "id": "s4",
              "text": "Verbleibende Deckfläche mit passendem Verbrauch multiplizieren"
            },
            {
              "id": "s5",
              "text": "Getrennte Randpositionen und Zuschläge ergänzen"
            }
          ]
        }
      },
      {
        "id": "lf11-l10-e01",
        "version": 2,
        "titel": "Die doppelte Deckung in der Formel erkennen",
        "lernziel": "Du kannst den halbierten Reihenabstand der Rechteckdoppeldeckung erklären und daraus den Verbrauch bestimmen.",
        "minuten": 6,
        "textschritte": [
          "Bei der Rechteckdoppeldeckung im halben Verband überdeckt das dritte Gebinde noch das erste. Der Höhenfortschritt von Reihe zu Reihe ist deshalb kleiner als bei einer einfachen Überdeckung. Im Übungsmodell lautet er S = (H − HÜ)/2. Mit der Plattenbreite multipliziert ergibt dieser Fortschritt den rechnerischen Flächenbeitrag einer Platte. Sind alle Längen in Zentimetern angegeben, entsteht die Fläche in Quadratzentimetern. Teile anschließend 10 000 durch diesen Flächenbeitrag, um Stück je Quadratmeter zu erhalten. Die Zahl 10 000 ist die Flächenumrechnung. Halte beim Zeichnen Höhenüberdeckung, Stoßfuge und seitlichen Verband auseinander. Die Seitenlage der nächsten Reihe erklärt nicht automatisch den Höhenfortschritt."
        ],
        "lektionIds": [
          "lf11-l10"
        ],
        "aufgabenIds": [
          "lf11-067",
          "lf11-068",
          "lf11-069",
          "lf11-103"
        ],
        "begriffe": [],
        "abrufFrage": "Woher kommt die Division durch zwei beim Reihenabstand?",
        "abrufMuster": "Die dritte Reihe überdeckt noch die erste. Der nutzbare Höhenabschnitt H − HÜ verteilt sich deshalb auf zwei Reihenabstände.",
        "aktivitaet": {
          "id": "lf11-l10-e01-aktiv",
          "version": 2,
          "titel": "Die Halbierung fehlt",
          "erklaerung": "Ein zu großer Flächenbeitrag je Platte erzeugt einen zu kleinen Verbrauch.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine Rechnung für die Rechteckdoppeldeckung verwendet S = H − HÜ und ermittelt daraus den Plattenbedarf.",
          "optionen": [
            {
              "id": "o1",
              "text": "Der Reihenabstand wurde im behandelten Modell zu groß angesetzt.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Damit wird der berechnete Plattenbedarf zu klein.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Die fehlende Halbierung lässt sich durch Umbenennen der Einheit ausgleichen.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf11-l11-e01",
        "version": 2,
        "titel": "Stülpdeckung von Doppeldeckung unterscheiden",
        "lernziel": "Du kannst für die Stülpdeckung Höhenüberdeckung, Fuge und Reihenanzahl zuordnen.",
        "minuten": 6,
        "textschritte": [
          "Bei der Stülpdeckung liegt die obere Reihe über dem oberen Rand der unteren. Im hier behandelten Deckschema gibt es eine Höhenüberdeckung; die seitlichen Stöße werden durch die dafür vorgesehenen Fugenstreifen behandelt. Verwechsle dieses Schema nicht mit einer seitlich überdeckten Deckung. Der Reihenabstand ergibt sich im Übungsmodell aus Plattenhöhe minus Höhenüberdeckung. Teile die zu bekleidende Höhe durch diesen Abstand und prüfe danach die ganzzahlige Einteilung. Runden ist nur der Beginn: Der verbleibende Unterschied muss innerhalb der zulässigen Systemmaße ausgeglichen werden. Die Mengenliste braucht außer Platten auch Befestigungen, Fugenstreifen und Randprofile. Diese Positionen lassen sich erst aus dem tatsächlich geplanten Schema sicher zählen."
        ],
        "lektionIds": [
          "lf11-l11"
        ],
        "aufgabenIds": [
          "lf11-078",
          "lf11-080",
          "lf11-082",
          "lf11-101"
        ],
        "begriffe": [],
        "abrufFrage": "Warum endet die Einteilung nicht beim Aufrunden der Gebindezahl?",
        "abrufMuster": "Die gerundete Zahl muss mit der Wandhöhe abgeglichen werden. Reihenabstände und Überdeckungen werden innerhalb der passenden Systemvorgaben angepasst.",
        "aktivitaet": {
          "id": "lf11-l11-e01-aktiv",
          "version": 2,
          "titel": "Bauteil im Stülpschema",
          "erklaerung": "Die Stülpdeckung erhält ihren eigenen Reihenabstand und darf nicht mit der Doppeldeckungsformel verwechselt werden.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Höhenüberdeckung",
              "rechts": "Obere Reihe liegt über der unteren"
            },
            {
              "id": "p2",
              "links": "Senkrechte Stoßfuge",
              "rechts": "Seitlicher Übergang zwischen Platten"
            },
            {
              "id": "p3",
              "links": "Fugenstreifen",
              "rechts": "Hinterlegt den vorgesehenen seitlichen Stoß"
            },
            {
              "id": "p4",
              "links": "Gebindezahl",
              "rechts": "Anzahl der Reihen über die Wandhöhe"
            }
          ]
        }
      },
      {
        "id": "lf11-l12-e01",
        "version": 2,
        "titel": "Waagerechte Deckung als Mengenweg rechnen",
        "lernziel": "Du kannst vom Flächenbeitrag einer querliegenden Platte zu Platten-, Stift- und Lattenmenge gelangen.",
        "minuten": 6,
        "textschritte": [
          "Eine waagerecht gedeckte Platte liegt im Querformat und überdeckt im behandelten Schema sowohl in der Höhe als auch seitlich. Ihr rechnerischer Flächenbeitrag entsteht daher aus den beiden verbleibenden Längen nach Abzug der jeweiligen Überdeckung. Für die Plattenzahl teilst du die zugehörige Wandfläche durch diesen Beitrag. Beide Flächen müssen dieselbe Einheit haben. Befestigungsmittel rechnest du danach aus der tatsächlich vorgesehenen Zahl je Platte. Werden Stifte nach Masse bestellt, folgt ein weiterer Schritt: Stückzahl durch Stück je Kilogramm teilen. Latten zählen dagegen über Reihenabstand, Wandhöhe und Wandbreite. Eine einzige Flächenzahl ersetzt diese drei verschiedenen Mengenwege nicht. Zuschläge bleiben mit ihrem jeweiligen Zweck sichtbar."
        ],
        "lektionIds": [
          "lf11-l12"
        ],
        "aufgabenIds": [
          "lf11-083",
          "lf11-084",
          "lf11-085",
          "lf11-086"
        ],
        "begriffe": [],
        "abrufFrage": "Warum kannst du die Stiftmenge in Kilogramm nicht direkt aus der Wandfläche ablesen?",
        "abrufMuster": "Zuerst braucht es Plattenzahl und Stifte je Platte. Erst die Umrechnung mit Stück je Kilogramm liefert die Bestellmasse.",
        "aktivitaet": {
          "id": "lf11-l12-e01-aktiv",
          "version": 2,
          "titel": "Von Platten zu Stiftmasse",
          "erklaerung": "Die letzte Division ändert die Einheit von Stück zu Kilogramm.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Deckfläche und wirksame Plattenfläche in gleiche Einheiten bringen"
            },
            {
              "id": "s2",
              "text": "Plattenzahl aus dem Flächenverhältnis bestimmen"
            },
            {
              "id": "s3",
              "text": "Mit den vorgesehenen Stiften je Platte multiplizieren"
            },
            {
              "id": "s4",
              "text": "Den begründeten Verlustzuschlag berücksichtigen"
            },
            {
              "id": "s5",
              "text": "Durch die angegebene Stückzahl je Kilogramm teilen"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf11-k05",
    "titel": "Mengen und besondere Deckbilder",
    "einheiten": [
      {
        "id": "lf11-l13-e01",
        "version": 2,
        "titel": "Breitenmeter als Liefermaß verstehen",
        "lernziel": "Du kannst den Holzschindelbedarf aus Fläche und Reihenabstand in Breitenmetern berechnen.",
        "minuten": 6,
        "textschritte": [
          "Holzschindeln sind unterschiedlich breit. Eine Bestellung nur nach Stückzahl wäre deshalb wenig aussagekräftig. Das Liefermaß Breitenmeter beschreibt stattdessen eine zusammengestellte Schindelbreite. Es darf nicht mit einem Quadratmeter fertiger Bekleidung verwechselt werden. Im Übungsmodell teilst du die Deckfläche durch den vorgegebenen Reihenabstand: Quadratmeter durch Meter ergibt die benötigte Breitenlänge. Derselbe Bedarf entsteht, wenn du die Fläche mit dem zugehörigen Verbrauch in Breitenmetern je Quadratmeter multiplizierst. Ein kleinerer Reihenabstand erhöht bei gleicher Fläche die Menge. Erst nach dem begründeten Zuschlag wird mit dem Lieferinhalt je Bund in ganze Gebinde umgerechnet. Trenne daher Grundbedarf, Zuschlag und Aufrundung in deiner Rechnung."
        ],
        "lektionIds": [
          "lf11-l13"
        ],
        "aufgabenIds": [
          "lf11-087",
          "lf11-089",
          "lf11-090",
          "lf11-091"
        ],
        "begriffe": [],
        "abrufFrage": "Warum liefern Division durch Reihenabstand und Multiplikation mit dem Verbrauch dasselbe Ergebnis?",
        "abrufMuster": "Der Verbrauch in Bm/m² ist im Modell der Kehrwert des Reihenabstands in Metern. Beide Wege berechnen dieselbe Breitenlänge.",
        "aktivitaet": {
          "id": "lf11-l13-e01-aktiv",
          "version": 2,
          "titel": "Zwei Angebote vergleichen",
          "erklaerung": "Der Kehrwert von 0,20 m ist 5 pro Meter. Breitenmeter messen keine Stückzahl.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Für dieselbe Deckung nennt eine Liste 0,20 m Reihenabstand, die andere 5 Bm/m² Verbrauch.",
          "optionen": [
            {
              "id": "o1",
              "text": "Beide Angaben führen im Übungsmodell zur gleichen Grundmenge.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Bei 20 m² Deckfläche ergeben sich 100 Bm Grundbedarf.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "5 Bm/m² bedeutet fünf einzelne Schindeln pro Quadratmeter.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf11-l19-e01",
        "version": 2,
        "titel": "Decksteine und Ortsteine getrennt bestellen",
        "lernziel": "Du kannst die Masse einer altdeutschen Wandbekleidung aus getrennten Flächen- und Randpositionen bestimmen.",
        "minuten": 6,
        "textschritte": [
          "Bei der altdeutschen Wandbekleidung wird die Decksteinmenge in den behandelten Aufgaben als Masse ermittelt. Beginne mit der Wandfläche. Werden Ortsteine separat gerechnet, ziehst du ihre zugehörigen Randflächen von der Fläche für Decksteine ab. Sonst würdest du dieselben Bereiche zweimal erfassen. Multipliziere die verbleibende Fläche mit dem passenden Verbrauch in Kilogramm je Quadratmeter. Den begründeten Zuschlag für Bruch und Verhau weist du anschließend aus. Die Ortsteine erhalten eine eigene Rechnung über ihre Länge und den zugehörigen Bedarf. Halte Sortierung und Verbrauch zusammen: Ein Massenwert aus einer anderen Sortierung kann nicht ungeprüft übernommen werden. Eine Mengenliste soll auch für eine andere Person nachvollziehbar bleiben."
        ],
        "lektionIds": [
          "lf11-l19"
        ],
        "aufgabenIds": [
          "lf11-052",
          "lf11-053",
          "lf11-054"
        ],
        "begriffe": [],
        "abrufFrage": "Warum werden Ortflächen vor der Decksteinrechnung abgezogen?",
        "abrufMuster": "Wenn Ortsteine separat bestellt werden, gehören diese Bereiche nicht noch einmal in die Decksteinmenge. Das verhindert eine doppelte Erfassung.",
        "aktivitaet": {
          "id": "lf11-l19-e01-aktiv",
          "version": 2,
          "titel": "Die Schiefermasse bestimmen",
          "erklaerung": "Massenbedarf und Längenbedarf bleiben getrennte Positionen mit ihren jeweiligen Einheiten.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Gesamte Wandfläche ermitteln"
            },
            {
              "id": "s2",
              "text": "Separat gerechnete Ort- und Öffnungsflächen abziehen"
            },
            {
              "id": "s3",
              "text": "Deckfläche mit passendem kg/m²-Verbrauch multiplizieren"
            },
            {
              "id": "s4",
              "text": "Begründeten Bruch- und Verhauzuschlag ergänzen"
            },
            {
              "id": "s5",
              "text": "Ortsteine als eigene Position aus Länge und Verbrauch berechnen"
            }
          ]
        }
      },
      {
        "id": "lf11-l20-e01",
        "version": 2,
        "titel": "Von der Schuppe zur Masse je Quadratmeter",
        "lernziel": "Du kannst sichtbaren Flächenbeitrag, Stückbedarf und Massenbedarf der Schuppendeckung verbinden.",
        "minuten": 6,
        "textschritte": [
          "Die Masse je Quadratmeter entsteht bei der Schuppendeckung aus zwei verschiedenen Informationen: Wie viele Steine decken einen Quadratmeter, und wie schwer ist ein einzelner Stein? Im vorgegebenen Rechenmodell bestimmst du zunächst den Flächenbeitrag nach Abzug der eingesetzten Höhen- und Seitenüberdeckung. Sind die Maße in Zentimetern angegeben, teilst du 10 000 durch die Fläche in Quadratzentimetern. So erhältst du Stück je Quadratmeter. Eine Lieferangabe in Kilogramm je tausend Stück wird zuerst durch tausend geteilt. Erst dann multiplizierst du Masse je Stein und Steinbedarf je Quadratmeter. Überdeckungswerte und Sortierung bleiben Angaben der konkreten Aufgabe; sie werden nicht aus der Rechnung neu festgelegt."
        ],
        "lektionIds": [
          "lf11-l20"
        ],
        "aufgabenIds": [
          "lf11-057",
          "lf11-058",
          "lf11-059"
        ],
        "begriffe": [],
        "abrufFrage": "Wie wandelst du eine Lieferangabe von 600 kg je 1000 Stück in kg/m² um?",
        "abrufMuster": "Zuerst 600/1000 = 0,6 kg je Stein. Dann 0,6 kg mit dem zum Deckschema passenden Steinbedarf je Quadratmeter multiplizieren.",
        "aktivitaet": {
          "id": "lf11-l20-e01-aktiv",
          "version": 2,
          "titel": "Die Tausenderangabe",
          "erklaerung": "Die Liefermasse gehört zu tausend Steinen und muss vor der Flächenrechnung auf einen Stein bezogen werden.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Für ein Übungsformat sind 600 kg je 1000 Steine und 40 Steine je Quadratmeter vorgegeben.",
          "optionen": [
            {
              "id": "o1",
              "text": "Ein Stein wiegt rechnerisch 0,6 kg.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Der Grundbedarf beträgt 24 kg/m².",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "600 mal 40 ergibt unmittelbar den Bedarf in kg/m².",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf11-l21-e01",
        "version": 2,
        "titel": "Die Brustbreite einer Wabenplatte erkennen",
        "lernziel": "Du kannst die Diagonale einer quadratischen Wabenplatte als Bezug für die Einteilung berechnen.",
        "minuten": 6,
        "textschritte": [
          "Bei einer Wabendeckung wird die quadratische Grundform gedreht angeordnet; eine gestutzte Ecke zeigt im behandelten Schema nach unten. Für die Einteilung ist deshalb die Diagonale eine wichtige Bezugsgröße. Sie wird hier Brustbreite genannt. Bei einem Quadrat berechnest du sie mit Pythagoras aus zwei gleichen Kantenlängen. Eine Platte mit 20 cm Kantenlänge hat rechnerisch etwa 28,3 cm Diagonale. Diese Diagonale ist weder die Seitenlänge noch automatisch der fertige Reihenabstand. Im Übungsmodell werden aus ihrer halben Länge und den vorgegebenen Fugen beziehungsweise Überdeckungen verschiedene Schnurabstände abgeleitet. Beschrifte die beiden Richtungen in deiner Skizze, damit die unterschiedlichen Zu- und Abschläge nicht vertauscht werden."
        ],
        "lektionIds": [
          "lf11-l21"
        ],
        "aufgabenIds": [
          "lf11-063",
          "lf11-065",
          "lf11-066"
        ],
        "begriffe": [],
        "abrufFrage": "Warum ist die Brustbreite einer quadratischen Wabenplatte größer als ihre Kantenlänge?",
        "abrufMuster": "Sie ist die Diagonale des Quadrats. Nach Pythagoras gilt B = √(k² + k²); bei 20 cm Kantenlänge sind das etwa 28,3 cm.",
        "aktivitaet": {
          "id": "lf11-l21-e01-aktiv",
          "version": 2,
          "titel": "Maß am Wabenbild",
          "erklaerung": "Grundform und fertige Deckung haben unterschiedliche Bezugsmaße.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Kantenlänge",
              "rechts": "Seitenmaß des ursprünglichen Quadrats"
            },
            {
              "id": "p2",
              "links": "Brustbreite",
              "rechts": "Diagonale der quadratischen Grundform"
            },
            {
              "id": "p3",
              "links": "Gestutzte Ecke",
              "rechts": "Zeigt im behandelten Schema nach unten"
            },
            {
              "id": "p4",
              "links": "Schnurabstand",
              "rechts": "Wird erst aus dem Deckschema abgeleitet"
            }
          ]
        }
      },
      {
        "id": "lf11-l22-e01",
        "version": 2,
        "titel": "Gezogene Deckung anhand des Schemas prüfen",
        "lernziel": "Du kannst die gezogene Rechteckdoppeldeckung anhand ihrer beiden Überdeckungsrichtungen von der Deckung im halben Verband unterscheiden.",
        "minuten": 6,
        "textschritte": [
          "Der Name Doppeldeckung allein reicht nicht aus, um eine Bedarfsformel auszuwählen. Bei der gezogenen Rechteckdoppeldeckung enthält das behandelte Schema auch eine Seitenüberdeckung. Die gewöhnliche Rechteckdoppeldeckung im halben Verband wird in den zugehörigen Aufgaben dagegen mit seitlichen Stoßfugen beschrieben. Markiere deshalb zuerst die überdeckten Zonen in einem kleinen Deckschema. Das vorgegebene Rechenmodell für die gezogene Variante verwendet die nach Abzug von Höhen- und Seitenüberdeckung verbleibenden Maße als Flächenbeitrag. Der Bedarf je Quadratmeter folgt aus dem Flächenverhältnis in gleichen Einheiten. Übernimm die gesonderten Schnurabstände aus demselben Schema. Eine Formel aus einem ähnlich benannten Deckbild kann zu einer unpassenden Einteilung führen."
        ],
        "lektionIds": [
          "lf11-l22"
        ],
        "aufgabenIds": [
          "lf11-075",
          "lf11-076",
          "lf11-077"
        ],
        "begriffe": [],
        "abrufFrage": "Welche Information brauchst du vor der Formelwahl bei zwei Arten der Rechteckdoppeldeckung?",
        "abrufMuster": "Das konkrete Deckschema: insbesondere, ob seitliche Stoßfugen oder eine Seitenüberdeckung vorgesehen sind und welche Maße dazu gehören.",
        "aktivitaet": {
          "id": "lf11-l22-e01-aktiv",
          "version": 2,
          "titel": "Ähnlicher Name, anderes Schema",
          "erklaerung": "Die konkrete Anordnung entscheidet über den Flächenbeitrag; ähnlich klingende Namen ersetzen das Schema nicht.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine Mengenrechnung für die gezogene Rechteckdoppeldeckung übernimmt ohne Zeichnung die Formel einer Deckung im halben Verband.",
          "optionen": [
            {
              "id": "o1",
              "text": "Zuerst die Seitenüberdeckung im vorgesehenen Deckschema prüfen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Bedarfsformel und Schnurabstände aus demselben Modell verwenden.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Das Wort Doppeldeckung beweist, dass alle Maße gleich bleiben.",
              "korrekt": false
            }
          ]
        }
      }
    ]
  }
];

const LF12_KAPITEL: LernKapitel[] = [
  {
    "id": "lf12-k01",
    "titel": "Metalle, Deckprinzipien und Befestigung",
    "einheiten": [
      {
        "id": "lf12-l01-e01",
        "version": 2,
        "titel": "Stehfalz und Leiste am Schnitt unterscheiden",
        "lernziel": "Du kannst Doppelstehfalz und Leistendeckung nach ihrem Verbindungsprinzip unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Bei einer Scharendeckung laufen schmale Metallbahnen über die Dachfläche. Ihre Ränder werden hochgestellt und bilden die seitlichen Verbindungen. Beim Doppelstehfalz greifen die vorbereiteten Ränder ineinander und werden in mehreren Arbeitsgängen geschlossen. Bei der Leistendeckung liegt dagegen eine Leiste zwischen den Scharen; eine Kappe deckt diesen Bereich ab. Beide Systeme brauchen eine passende Unterlage und eine Befestigung, die die geplante Wärmebewegung berücksichtigt. In einer Schnittzeichnung suchst du zuerst den hochgestellten Blechrand, dann die Haftbefestigung und schließlich den Übergang zur Nachbarschar. Aus dem Namen allein folgt noch keine Eignung für jede Dachneigung. Dazu gehören Systemangaben, Anschlussdetails und die tatsächliche Beanspruchung."
        ],
        "lektionIds": [
          "lf12-l01"
        ],
        "aufgabenIds": [
          "lf12-009",
          "lf12-034",
          "lf12-067",
          "lf12-116"
        ],
        "begriffe": [],
        "abrufFrage": "Woran unterscheidest du die beiden Systeme im Querschnitt?",
        "abrufMuster": "Beim Doppelstehfalz sind die hochgestellten Scharränder miteinander verfalzt. Bei der Leistendeckung liegt zwischen den Scharen eine abgedeckte Leiste.",
        "aktivitaet": {
          "id": "lf12-l01-e01-aktiv",
          "version": 2,
          "titel": "Verbindungsprinzip erkennen",
          "erklaerung": "Verbindung, Befestigung und Unterlage sind verschiedene Teile derselben Konstruktion.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Doppelstehfalz",
              "rechts": "Hochgestellte Blechränder werden miteinander verfalzt"
            },
            {
              "id": "p2",
              "links": "Leistendeckung",
              "rechts": "Eine abgedeckte Leiste trennt die Scharen"
            },
            {
              "id": "p3",
              "links": "Haft",
              "rechts": "Verbindet die Deckung indirekt mit der Unterlage"
            },
            {
              "id": "p4",
              "links": "Schare",
              "rechts": "Einzelne Metallbahn innerhalb der Deckung"
            }
          ]
        }
      },
      {
        "id": "lf12-l02-e01",
        "version": 2,
        "titel": "Halten und Längenbewegung vereinbaren",
        "lernziel": "Du kannst Fest- und Schiebehafte nach ihrer unterschiedlichen Bewegungsfunktion erklären.",
        "minuten": 7,
        "textschritte": [
          "Eine erwärmte Metallschar wird länger. Die Befestigung muss sie gleichzeitig gegen Abheben und unkontrolliertes Verschieben sichern. Festhafte legen den vorgesehenen Festbereich fest. Schiebehafte halten ebenfalls, ermöglichen aber eine Bewegung innerhalb ihres konstruktiven Gleitwegs. Mehr Schiebehafte bedeuten deshalb nicht, dass die Deckung lose sein soll. Entscheidend ist die abgestimmte Anordnung beider Arten. Sie richtet sich nach dem konkreten System, der Geometrie und den zu erwartenden Längenänderungen. Prüfe an einer Zeichnung, wo der Festbereich liegt und wohin sich die Schar bewegen kann. Ein vollständig starres Festsetzen beseitigt die Wärmedehnung nicht. Es behindert sie und kann dadurch Spannungen oder Verformungen verursachen."
        ],
        "lektionIds": [
          "lf12-l02"
        ],
        "aufgabenIds": [
          "lf12-031",
          "lf12-053",
          "lf12-060"
        ],
        "begriffe": [],
        "abrufFrage": "Wie kann eine Schar sicher gehalten werden und trotzdem länger werden?",
        "abrufMuster": "Ein geplanter Festbereich legt ihre Lage fest. Schiebehafte sichern die Schar zusätzlich und lassen die vorgesehene Längenbewegung zu.",
        "aktivitaet": {
          "id": "lf12-l02-e01-aktiv",
          "version": 2,
          "titel": "Die Schar soll arbeiten",
          "erklaerung": "Befestigung muss Bewegung beherrschen. Behinderung kann Kräfte und Verformungen erzeugen.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine lange Metallschar soll überall mit starren Haften befestigt werden, damit sie bei Sonneneinstrahlung ihre Länge nicht verändert.",
          "optionen": [
            {
              "id": "o1",
              "text": "Metall verändert seine Länge trotz starrer Befestigung.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Ein abgestimmter Festbereich und geeignete Schiebehafte ermöglichen Bewegung.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Starres Einspannen verhindert die thermische Längenänderung ohne zusätzliche Spannung.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf12-l03-e01",
        "version": 2,
        "titel": "Feuchtigkeit an der Blechrückseite verstehen",
        "lernziel": "Du kannst erklären, warum Trennlage und Austrocknungsbedingungen zur Korrosionsvorsorge gehören.",
        "minuten": 7,
        "textschritte": [
          "An der Unterseite einer Metalldeckung kann Feuchtigkeit auftreten. Bleibt sie lange eingeschlossen, steigt das Risiko von Korrosion. Bei Zink werden weißliche Korrosionsprodukte häufig als Weißrost bezeichnet. Das ist kein verlässliches Zeichen einer erwünschten Schutzschicht. Eine geeignete strukturierte Trennlage kann einen kleinen Zwischenraum schaffen, Feuchteableitung unterstützen und den Kontakt zum Untergrund verändern. Ob sie notwendig und geeignet ist, ergibt sich aus Metall, Unterlage und geplantem Dachaufbau. Sie behebt jedoch keinen beliebigen Feuchteeintrag aus undichten Anschlüssen oder Luftleckagen. Betrachte deshalb auch Entstehung und Abfuhr der Feuchte. Materialschutz beginnt mit einem passenden Aufbau und endet nicht bei der Auswahl einer einzelnen Matte."
        ],
        "lektionIds": [
          "lf12-l03"
        ],
        "aufgabenIds": [
          "lf12-027",
          "lf12-029",
          "lf12-030"
        ],
        "begriffe": [],
        "abrufFrage": "Warum genügt eine Strukturmatte nicht als Antwort auf jeden Feuchteschaden?",
        "abrufMuster": "Zuerst müssen Feuchtequelle und Austrocknungsweg geklärt werden. Eine Trennlage ersetzt keine dichten Anschlüsse und keine funktionsfähige Luftdichtheitsebene.",
        "aktivitaet": {
          "id": "lf12-l03-e01-aktiv",
          "version": 2,
          "titel": "Ursache und Funktion",
          "erklaerung": "Die passende Trennlage wird zusammen mit Metall und Unterlage ausgewählt.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Dauerhaft eingeschlossene Feuchte",
              "rechts": "Kann Korrosion an der Blechrückseite begünstigen"
            },
            {
              "id": "p2",
              "links": "Strukturierte Trennlage",
              "rechts": "Kann Feuchteableitung und Abstand unterstützen"
            },
            {
              "id": "p3",
              "links": "Undichter Anschluss",
              "rechts": "Mögliche Quelle zusätzlichen Wassereintrags"
            },
            {
              "id": "p4",
              "links": "Passender Dachaufbau",
              "rechts": "Stimmt Materialschutz und Trocknung aufeinander ab"
            }
          ]
        }
      },
      {
        "id": "lf12-l05-e01",
        "version": 2,
        "titel": "Metalldeckungen nach Tragverhalten sortieren",
        "lernziel": "Du kannst selbsttragende und nicht selbsttragende Metalldeckungen anhand ihrer Lastabtragung unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Für eine Metalldeckung ist nicht nur der Werkstoff entscheidend. Ebenso wichtig ist, wie sie die Lasten weitergibt. Eine nicht selbsttragende Scharendeckung braucht eine geeignete flächige Deckunterlage. Profilierte Elemente können dagegen zwischen geplanten Auflagern spannen. Ihre Tragfähigkeit hängt unter anderem von Profilform, Material, Dicke und Spannweite ab. Selbsttragend bedeutet deshalb nicht, dass keine Unterkonstruktion nötig ist. Vergleiche außerdem die Materialeigenschaften: Wärme verändert die Länge, unterschiedliche Metalle können unerwünscht reagieren und Oberflächen brauchen eine geeignete Behandlung. Ein Band wird als Coil geliefert, eine Tafel als einzelnes flaches Element. Die Lieferform allein legt weder die zulässige Scharlänge noch die passende Dachkonstruktion fest."
        ],
        "lektionIds": [
          "lf12-l05"
        ],
        "aufgabenIds": [
          "lf12-001",
          "lf12-002",
          "lf12-006",
          "lf12-010"
        ],
        "begriffe": [],
        "abrufFrage": "Was bedeutet selbsttragend bei einer profilierten Metalldeckung?",
        "abrufMuster": "Das dafür bemessene Element kann zwischen vorgesehenen Auflagern spannen und Lasten weiterleiten. Es braucht weiterhin eine geeignete Unterkonstruktion und Befestigung.",
        "aktivitaet": {
          "id": "lf12-l05-e01-aktiv",
          "version": 2,
          "titel": "Profil ist keine freie Spannweite",
          "erklaerung": "Der Begriff beschreibt das Tragprinzip und ersetzt keine passende Bemessung.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Ein Trapezblech soll ohne Kenntnis von Belastung und Auflagerabstand bestellt werden, weil es selbsttragend genannt wird.",
          "optionen": [
            {
              "id": "o1",
              "text": "Profil und Spannweite müssen zu den Lasten passen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Die Auflager und Befestigungen gehören weiterhin zur Planung.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Selbsttragend erlaubt jede beliebige Spannweite.",
              "korrekt": false
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf12-k02",
    "titel": "Werkstatt, Zuschnitt und Mengen",
    "einheiten": [
      {
        "id": "lf12-l04-e01",
        "version": 2,
        "titel": "Vom Profil zum Blechzuschnitt denken",
        "lernziel": "Du kannst Kanten, Falzen, Bördeln und räumliches Formen voneinander unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Ein fertiges Blechprofil beginnt als flacher Zuschnitt. Beim Kanten entsteht entlang einer Linie ein Winkel. Beim Falzen werden vorbereitete Ränder umgelegt und zu einer Verbindung geformt. Ein umgelegter oder gerollter Rand kann die Kante versteifen und ihre Schärfe verringern. Für räumlich gerundete Werkstücke wird das Material örtlich gestreckt oder gestaucht. Diese Arbeitsschritte brauchen jeweils passende Werkzeuge und eine geplante Reihenfolge. Vor dem Schneiden liest du das Profil in seiner Abwicklung: Welche geraden Schenkel sind vorhanden, welche Zugaben gehören zu Falzen und welcher Bereich wird umgeformt? Eine sichtbare Deckbreite ist deshalb noch nicht die erforderliche Zuschnittbreite. Fertigungszugaben müssen zum konkreten Profil gehören."
        ],
        "lektionIds": [
          "lf12-l04"
        ],
        "aufgabenIds": [
          "lf12-034",
          "lf12-090",
          "lf12-116"
        ],
        "begriffe": [],
        "abrufFrage": "Warum ist die Deckbreite meist kleiner als der flache Zuschnitt?",
        "abrufMuster": "Aufkantungen, Falze und weitere Profilteile benötigen ebenfalls Material. Ihre Zugaben gehören zum Zuschnitt, decken aber nicht dieselbe Breite der Dachfläche.",
        "aktivitaet": {
          "id": "lf12-l04-e01-aktiv",
          "version": 2,
          "titel": "Arbeitsschritt und Ergebnis",
          "erklaerung": "Die Fertigungszugaben werden aus dem konkreten Profil und Arbeitsverfahren bestimmt.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Kanten",
              "rechts": "Ein Winkel entsteht an einer vorgesehenen Linie"
            },
            {
              "id": "p2",
              "links": "Falzen",
              "rechts": "Vorbereitete Blechränder bilden eine umgelegte Verbindung"
            },
            {
              "id": "p3",
              "links": "Bördeln",
              "rechts": "Der Rand wird umgelegt oder gerollt"
            },
            {
              "id": "p4",
              "links": "Abwicklung",
              "rechts": "Zeigt das Profil als flachen Zuschnitt"
            }
          ]
        }
      },
      {
        "id": "lf12-l06-e01",
        "version": 2,
        "titel": "Mengen nach Fläche, Länge und Stück aufstellen",
        "lernziel": "Du kannst den Materialbedarf einer Metalldeckung in getrennte, nachvollziehbare Positionen gliedern.",
        "minuten": 7,
        "textschritte": [
          "Eine Materialliste für ein Metalldach besteht aus unterschiedlichen Mengenarten. Die Flächendeckung wird zunächst aus den tatsächlichen Dachflächen ermittelt. Scharen brauchen zusätzlich eine Einteilung nach nutzbarer Breite. Traufe, First und Ortgang werden dagegen über ihre jeweiligen Längen erfasst. Für gekantete Anschlussprofile kommt die Zuschnittbreite aus der Profilabwicklung hinzu. Prüfe bei Standardlängen, welche Überdeckungen und Schnittreste im gewählten Detail entstehen; eine reine Gesamtlänge kann die Stückzahl sonst zu klein erscheinen lassen. Bei Runddächern folgt das Material der Bogenlänge, nicht der geraden Spannweite. Halte diese Bezüge in der Liste sichtbar. Die zusammengefasste Menge muss aus den Einzelpositionen wieder nachvollzogen werden können."
        ],
        "lektionIds": [
          "lf12-l06"
        ],
        "aufgabenIds": [
          "lf12-086",
          "lf12-089",
          "lf12-091",
          "lf12-092"
        ],
        "begriffe": [],
        "abrufFrage": "Welche Länge verwendest du für die Deckfläche eines Tonnendachs: Bogen oder Spannweite?",
        "abrufMuster": "Die abgewickelte Bogenlänge, weil die Deckung der Rundung folgt. Die Spannweite ist nur der geradlinige Abstand der Endpunkte.",
        "aktivitaet": {
          "id": "lf12-l06-e01-aktiv",
          "version": 2,
          "titel": "Die Bestellung vorbereiten",
          "erklaerung": "Fläche, laufende Länge und Stückzahl bleiben mit ihrer jeweiligen Einheit erkennbar.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Dachform und tatsächliche Flächen beziehungsweise Bogenlängen klären"
            },
            {
              "id": "s2",
              "text": "Flächendeckung mit der passenden Schareneinteilung berechnen"
            },
            {
              "id": "s3",
              "text": "Traufe, First und Ortgang als getrennte Längen erfassen"
            },
            {
              "id": "s4",
              "text": "Zuschnitte, Profilzugaben und Stückteilung prüfen"
            },
            {
              "id": "s5",
              "text": "Begründete Zuschläge je Position ergänzen"
            }
          ]
        }
      },
      {
        "id": "lf12-l08-e01",
        "version": 2,
        "titel": "Nutzbreite und Passscharen berechnen",
        "lernziel": "Du kannst aus einem vorgegebenen Raster die verbleibenden Randbreiten ermitteln.",
        "minuten": 7,
        "textschritte": [
          "Die Bandbreite ist das Maß des flachen Ausgangsmaterials. Ein Teil davon wird für die seitlichen Aufkantungen benötigt. Die verbleibende Nutzbreite und ein gegebenenfalls vorgesehener Abstand bilden das im jeweiligen Plan verwendete Raster. Lies genau, welches dieser Maße eine Aufgabe Achsmaß nennt. Teile anschließend die Dachbreite durch das vorgegebene Raster und prüfe den Rest. Dieser Rest wird durch eine geplante Randeinteilung aufgenommen, etwa mit zwei Passscharen. Ein rechnerisch kleiner Rest ist nicht automatisch ein sinnvoller Zuschnitt. Beziehe Falze, Öffnungen und Anschlüsse in die Zeichnung ein. Die Einteilung ist erst vollständig, wenn ganze Scharen und Randstücke zusammen die vorgesehene Breite ergeben."
        ],
        "lektionIds": [
          "lf12-l08"
        ],
        "aufgabenIds": [
          "lf12-047",
          "lf12-048",
          "lf12-050",
          "lf12-052"
        ],
        "begriffe": [],
        "abrufFrage": "Warum darfst du Bandbreite und Achsmaß nicht gleichsetzen?",
        "abrufMuster": "Die Bandbreite enthält Material für Aufkantungen. Das im Plan verwendete Raster berücksichtigt die nutzbare Breite und gegebenenfalls einen vorgesehenen Abstand.",
        "aktivitaet": {
          "id": "lf12-l08-e01-aktiv",
          "version": 2,
          "titel": "Rest auf zwei Ränder verteilen",
          "erklaerung": "Zuerst die belegte Breite abziehen, anschließend den verbleibenden Rest auf die vorgesehenen Ränder aufteilen.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine Übung gibt 10 m Dachbreite und 18 ganze Rasterfelder mit je 0,50 m vor. Der Rest soll gleichmäßig auf zwei Randfelder verteilt werden.",
          "optionen": [
            {
              "id": "o1",
              "text": "Die ganzen Felder belegen 9 m.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Für jedes Randfeld bleiben rechnerisch 0,50 m.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Jedes Randfeld erhält den gesamten Rest von 1 m.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf12-l13-e01",
        "version": 2,
        "titel": "Baubreite und Tafelbreite bei Metallpfannen lesen",
        "lernziel": "Du kannst die wirksame Baubreite einer Metallpfannentafel von ihrer Gesamtbreite unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Metalldachpfannen bilden das Erscheinungsbild einer Pfannendeckung mit geformten Metalltafeln nach. Die Tafeln werden nach dem vorgesehenen Verlegesystem auf einer passenden Lattung befestigt. Die Gesamtbreite einer Tafel ist dabei größer als ihre wirksame Baubreite, wenn ein seitlicher Überdeckungsbereich vorgesehen ist. Für die Flächeneinteilung zählt das angegebene Nutzmaß. Für Handhabung und Zuschnitt brauchst du zusätzlich die tatsächlichen Tafelabmessungen. Prüfe vor der Montage Verlegerichtung, Auflager und Befestigungen im Plan. Am First, Ortgang und an der Traufe werden passende Formteile und gegebenenfalls Profilfüller eingesetzt. Schraubenzahl und Lattenabstand dürfen nicht allein aus einem ähnlichen Profil übernommen werden; sie gehören zur konkreten Systemplanung."
        ],
        "lektionIds": [
          "lf12-l13"
        ],
        "aufgabenIds": [
          "lf12-108",
          "lf12-109",
          "lf12-110"
        ],
        "begriffe": [],
        "abrufFrage": "Welches Breitenmaß verwendest du für die Zahl nebeneinanderliegender Tafeln?",
        "abrufMuster": "Das für die Deckung angegebene Nutzmaß beziehungsweise die Baubreite. Die gesamte Tafelbreite enthält zusätzlich den seitlichen Überdeckungsbereich.",
        "aktivitaet": {
          "id": "lf12-l13-e01-aktiv",
          "version": 2,
          "titel": "Zwei Breiten auf dem Lieferschein",
          "erklaerung": "Die überdeckte Zone darf bei der Flächenaufteilung nicht doppelt als zusätzliche Nutzbreite gezählt werden.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Eine Übung nennt 1140 mm Tafelbreite und 1050 mm Baubreite für dasselbe Metallpfannenprofil.",
          "optionen": [
            {
              "id": "o1",
              "text": "Die Differenz von 90 mm gehört zum seitlichen Überdeckungsbereich.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Für das wiederkehrende Flächenraster ist hier die Baubreite maßgeblich.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Mit jeder Tafel werden 1140 mm neue Dachbreite gedeckt.",
              "korrekt": false
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf12-k03",
    "titel": "Dachaufbau, Unterlage und Lüftungswege",
    "einheiten": [
      {
        "id": "lf12-l09-e01",
        "version": 2,
        "titel": "Freie Lüftungsquerschnitte beurteilen",
        "lernziel": "Du kannst Rohöffnung und tatsächlich freien Querschnitt einer Lüftungsöffnung unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Ein belüfteter Dachaufbau braucht einen vorgesehenen Luftweg mit geeigneten Öffnungen. Dessen Wirkung hängt nicht nur von der Höhe eines Hohlraums ab. Auch Länge, Dachform und Unterbrechungen beeinflussen die Strömung. Ein Lochblech am Eingang schützt den Raum, verringert aber gegenüber der ungeschützten Rohöffnung den freien Querschnitt. Für die Prüfung zählt deshalb das tatsächlich offene Maß. Verfolge die Luft in einer Schnittzeichnung vom Eintritt bis zum Austritt. Eine Sperre am First kann den Weg unterbrechen, obwohl der Raum in der Fläche groß genug aussieht. Die geforderten Abmessungen werden aus der konkreten Planung übernommen. Eine pauschale Aussage zur Neigung allein beschreibt noch keinen vollständig funktionierenden Lüftungsweg."
        ],
        "lektionIds": [
          "lf12-l09"
        ],
        "aufgabenIds": [
          "lf12-020",
          "lf12-021",
          "lf12-022",
          "lf12-023"
        ],
        "begriffe": [],
        "abrufFrage": "Warum ist der freie Lüftungsquerschnitt kleiner als die Rohöffnung hinter einem Lochblech?",
        "abrufMuster": "Ein Teil der Fläche besteht aus geschlossenem Blech. Nur die offenen Lochflächen tragen zum freien Durchtritt bei.",
        "aktivitaet": {
          "id": "lf12-l09-e01-aktiv",
          "version": 2,
          "titel": "Die Luft endet am First",
          "erklaerung": "Prüfe Eintritt, verbindenden Raum und Austritt als zusammenhängenden Weg.",
          "typ": "skizzenfehler",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Die Skizze zeigt einen Lufteintritt an der Traufe. Bei A ist der vorgesehene obere Austritt geschlossen.",
          "optionen": [
            {
              "id": "o1",
              "text": "Der gezeichnete Luftweg ist am oberen Ende unterbrochen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Ein größerer Hohlraum allein öffnet den verschlossenen Austritt nicht.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Der vorhandene Traufeintritt beweist bereits eine durchgehende Belüftung.",
              "korrekt": false
            }
          ],
          "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 500 220\"><title>Am First blockierter Belüftungsweg</title><path d=\"M45 160 245 45 455 160M45 185 245 70 455 185\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4\"/><path d=\"m220 58 45 25\" stroke=\"#c45f32\" stroke-width=\"12\"/><path d=\"m85 151 110-64-16 2m16-2-8 14\" fill=\"none\" stroke=\"#4586b3\" stroke-width=\"4\"/><g font-family=\"sans-serif\" font-size=\"16\" fill=\"currentColor\"><text x=\"20\" y=\"210\">Zuluft an der Traufe</text><text x=\"270\" y=\"44\">A: Firstweg verschlossen</text><text x=\"270\" y=\"112\">Belüftungsraum</text></g></svg>",
          "bildbeschreibung": "Die Skizze zeigt einen Lufteintritt an der Traufe. Bei A ist der vorgesehene obere Austritt geschlossen."
        }
      },
      {
        "id": "lf12-l11-e01",
        "version": 2,
        "titel": "Die Deckunterlage als Befestigungsgrund prüfen",
        "lernziel": "Du kannst erklären, warum Schalung und Haftlage vor der Metalldeckung geprüft werden.",
        "minuten": 7,
        "textschritte": [
          "Nicht selbsttragende Metallbahnen benötigen eine geeignete flächige Unterlage. Diese trägt nicht nur das Blech, sondern nimmt auch die Befestigung der Hafte auf. Prüfe deshalb Tragfähigkeit, Ebenheit und Feuchtezustand vor dem Verlegen. Ein Haft darf nicht zufällig über einer ungeeigneten Fuge liegen. Die geplante Schalungsrichtung und ein abgestimmtes Befestigungsraster helfen, solche Stellen zu vermeiden. Holz und Holzwerkstoffe verändern ihre Maße mit der Feuchte; ihre Verlegung und Fugen müssen zum vorgesehenen Aufbau passen. Auch Behandlungen des Holzes können die Verträglichkeit zum Metall beeinflussen. Die erforderlichen Dicken, Breiten und Befestigungen werden für die konkrete Unterlage festgelegt. Das vorhandene Material nur nach seiner Bezeichnung zu beurteilen, reicht nicht aus."
        ],
        "lektionIds": [
          "lf12-l11"
        ],
        "aufgabenIds": [
          "lf12-014",
          "lf12-025",
          "lf12-026",
          "lf12-027"
        ],
        "begriffe": [],
        "abrufFrage": "Warum ist eine durchgehende Schalung allein noch kein Nachweis für eine sichere Haftbefestigung?",
        "abrufMuster": "Auch die tatsächliche Befestigungsstelle muss tragfähig und passend sein. Fugen, ungeeigneter Zustand oder unverträgliche Materialien können die Funktion beeinträchtigen.",
        "aktivitaet": {
          "id": "lf12-l11-e01-aktiv",
          "version": 2,
          "titel": "Der Haft trifft eine Fuge",
          "erklaerung": "Ein geschlossener Falz ersetzt keinen geeigneten Befestigungsgrund.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Beim Anzeichnen liegt eine geplante Haftschraube genau in einer offenen Fuge zwischen zwei Schalungsbrettern.",
          "optionen": [
            {
              "id": "o1",
              "text": "Befestigungsstelle und Raster vor dem Verschrauben fachlich klären.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Den tragfähigen Untergrund für die Haftbefestigung sicherstellen.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Die Schraube hält allein wegen des später geschlossenen Falzes ausreichend.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf12-l12-e01",
        "version": 2,
        "titel": "Wasserweg und Luftweg am Dachrand verfolgen",
        "lernziel": "Du kannst am belüfteten Trauf- und Firstdetail Wasserführung und Luftführung getrennt beschreiben.",
        "minuten": 7,
        "textschritte": [
          "An der Traufe und am First treffen mehrere Funktionen auf engem Raum zusammen. Regenwasser soll über den dafür vorgesehenen Blechabschluss in die Entwässerung gelangen. Der Luftweg eines belüfteten Aufbaus verläuft dagegen unterhalb der Deckunterlage und braucht passende Ein- und Austritte. Beschreibe diese Wege in der Zeichnung getrennt. Das Rinneneinhangblech gehört zum Wasserweg an der Traufe; ein Lüftungsschlitz mit geeignetem Schutz gehört zum Luftweg. Am First müssen Abdeckung, Befestigung und Entlüftung miteinander vereinbar sein. Eine Öffnung in der Metalldeckung ist nicht automatisch eine richtig ausgebildete Entlüftung. Kontrolliere außerdem, ob der Hohlraum bis zu den Öffnungen durchgeht und Anschlüsse die Wasserführung nicht unterbrechen."
        ],
        "lektionIds": [
          "lf12-l12"
        ],
        "aufgabenIds": [
          "lf12-061",
          "lf12-083",
          "lf12-085"
        ],
        "begriffe": [],
        "abrufFrage": "Wie unterscheidest du die Funktionen von Rinneneinhangblech und Lüftungsschlitz?",
        "abrufMuster": "Das Rinneneinhangblech führt Wasser zur Entwässerung. Der Lüftungsschlitz bildet eine geplante Öffnung des Luftwegs und benötigt einen passenden Schutz.",
        "aktivitaet": {
          "id": "lf12-l12-e01-aktiv",
          "version": 2,
          "titel": "Detailbauteil und Funktion",
          "erklaerung": "Verfolge Wasser und Luft mit getrennten Pfeilen in der Schnittzeichnung.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Rinneneinhangblech",
              "rechts": "Ordnet den Wasserübergang an der Traufe"
            },
            {
              "id": "p2",
              "links": "Lüftungsschlitz",
              "rechts": "Ermöglicht den geplanten Luftaustritt"
            },
            {
              "id": "p3",
              "links": "Deckunterlage",
              "rechts": "Trägt die nicht selbsttragende Metalldeckung"
            },
            {
              "id": "p4",
              "links": "Schutzgitter",
              "rechts": "Schützt die Öffnung bei verbleibendem freien Querschnitt"
            }
          ]
        }
      },
      {
        "id": "lf12-l14-e01",
        "version": 2,
        "titel": "Belüftete und unbelüftete Aufbauten vergleichen",
        "lernziel": "Du kannst Unterschiede im Feuchtekonzept beider Dachaufbauten benennen.",
        "minuten": 7,
        "textschritte": [
          "Metall lässt durch seine geschlossene Fläche nur sehr wenig Wasserdampf passieren. Der darunterliegende Dachaufbau braucht deshalb ein schlüssiges Feuchtekonzept. Ein belüfteter Aufbau enthält eine geplante Luftschicht, die zur Feuchteabfuhr beitragen kann. Ein unbelüfteter Aufbau nutzt diesen zusätzlichen Luftweg nicht und muss mit seinen Materialien und Schichten ausreichend sicher geplant werden. Beide Varianten benötigen sorgfältige Luftdichtheit und einen passenden Schutz gegen Wasserdampfeintrag. Ein Luftdichtheitstest prüft Luftleckagen; er beweist nicht unmittelbar die Dichtheit jeder Dachverbindung oder den vollständigen Feuchteschutz. Vergleiche außerdem Aufbauhöhe, Geometrie und Bauablauf. Ein niedriger Aufbau kann vorteilhaft sein, darf aber nicht allein nach Preis oder fehlender Hohlraumhöhe ausgewählt werden."
        ],
        "lektionIds": [
          "lf12-l14"
        ],
        "aufgabenIds": [
          "lf12-014",
          "lf12-015",
          "lf12-016",
          "lf12-018"
        ],
        "begriffe": [],
        "abrufFrage": "Was belegt ein Luftdichtheitstest und was nicht unmittelbar?",
        "abrufMuster": "Er untersucht Luftleckagen der Gebäudehülle. Er ersetzt weder die Prüfung jeder wasserführenden Dachnaht noch die gesamte Feuchteschutzplanung.",
        "aktivitaet": {
          "id": "lf12-l14-e01-aktiv",
          "version": 2,
          "titel": "Begriff und Aussage",
          "erklaerung": "Belüftung entbindet nicht von sorgfältiger Luftdichtheit und einer passenden Planung.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Belüfteter Aufbau",
              "rechts": "Besitzt einen geplanten zusätzlichen Luftweg"
            },
            {
              "id": "p2",
              "links": "Unbelüfteter Aufbau",
              "rechts": "Besitzt diesen zusätzlichen Belüftungsraum nicht"
            },
            {
              "id": "p3",
              "links": "Luftdichtheitstest",
              "rechts": "Untersucht Luftleckagen der Hülle"
            },
            {
              "id": "p4",
              "links": "Feuchtekonzept",
              "rechts": "Stimmt Eintrag, Speicherung und Trocknung aufeinander ab"
            }
          ]
        }
      },
      {
        "id": "lf12-l15-e01",
        "version": 2,
        "titel": "Trennlage und Dampfbremse auseinanderhalten",
        "lernziel": "Du kannst die Funktionen einer Trennlage von der Begrenzung des Wasserdampfeintrags unterscheiden.",
        "minuten": 7,
        "textschritte": [
          "Die Trennlage liegt unmittelbar zwischen Metall und Deckunterlage. Sie kann die Gleitbewegung unterstützen und unverträgliche Einflüsse aus dem Untergrund vom Metall fernhalten. Strukturierte Produkte können darüber hinaus Schallverhalten und Feuchteableitung beeinflussen. Diese Funktionen machen die Trennlage aber nicht automatisch zur Dampfbremse des Dachaufbaus. Die Begrenzung des Wasserdampfeintrags und die Luftdichtheit werden in den dafür vorgesehenen Ebenen geplant. Prüfe außerdem, ob die konkrete Bahn als vorübergehender Wetterschutz eingesetzt werden darf. Dafür reichen Name und äußeres Aussehen nicht. In einer Schnittzeichnung benennst du daher Lage und Funktion jedes Produkts getrennt. Ein Bauteil kann mehrere Aufgaben haben, muss für jede davon aber tatsächlich geeignet sein."
        ],
        "lektionIds": [
          "lf12-l15"
        ],
        "aufgabenIds": [
          "lf12-027",
          "lf12-028",
          "lf12-029",
          "lf12-030"
        ],
        "begriffe": [],
        "abrufFrage": "Warum darf eine Trennlage nicht einfach als Dampfbremse gerechnet werden?",
        "abrufMuster": "Ihre hauptsächliche Lage und Aufgabe betreffen den Kontakt zwischen Metall und Unterlage. Für Dampfbremse und Luftdichtheit braucht es die dafür geeignete und geplante Ebene.",
        "aktivitaet": {
          "id": "lf12-l15-e01-aktiv",
          "version": 2,
          "titel": "Eine Bahn soll alles übernehmen",
          "erklaerung": "Mehrere mögliche Funktionen müssen jeweils durch Produkt und Konstruktion abgedeckt sein.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Auf einer Zeichnung wird die strukturierte Trennlage unter dem Blech ohne weitere Angaben zugleich als luftdichte Dampfbremse bezeichnet.",
          "optionen": [
            {
              "id": "o1",
              "text": "Die nachgewiesenen Produkteigenschaften und die geplante Funktion prüfen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Trennlage und Ebene zur Begrenzung des Dampfeintrags getrennt benennen.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Die Strukturmatte beweist allein die erforderliche Luftdichtheit.",
              "korrekt": false
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf12-k04",
    "titel": "Montage, Neigung und Wärmebewegung",
    "einheiten": [
      {
        "id": "lf12-l07-e01",
        "version": 2,
        "titel": "Profildeckungen vom Verlegeplan aus montieren",
        "lernziel": "Du kannst die Angaben benennen, die ein Verlegeplan für selbsttragende Profile benötigt.",
        "minuten": 7,
        "textschritte": [
          "Ein Profilblech ist kein beliebig austauschbares Flächenmaterial. Sein Querschnitt bestimmt mit, wo Lasten eingeleitet und Verbindungen hergestellt werden. Der Verlegeplan zeigt deshalb Auflager, Elementaufteilung, Montagerichtung und Befestigungen. Er berücksichtigt auch Öffnungen und die zugehörigen Einfassungen. Längsüberdeckungen, Querstöße und Dichtungen müssen zum vorgesehenen Produkt und zur Dachgeometrie passen. Prüfe diese Angaben vor dem Einheben der ersten Tafel. Die Unterscheidung zwischen großen und kleinen Elementen hilft beim Sortieren der Systeme, ersetzt aber keine konkrete Produktplanung. Übernimm Grenzneigungen und Überdeckungsmaße aus den für den Auftrag geltenden Unterlagen. Eine Tabelle aus einer Schulaufgabe wird durch ihre Verwendung nicht zu einer allgemeinen Freigabe für jedes Profil."
        ],
        "lektionIds": [
          "lf12-l07"
        ],
        "aufgabenIds": [
          "lf12-097",
          "lf12-100",
          "lf12-101",
          "lf12-107"
        ],
        "begriffe": [],
        "abrufFrage": "Welche Angaben brauchst du außer der Tafelgröße im Verlegeplan?",
        "abrufMuster": "Auflager und Elementaufteilung, Montagerichtung, passende Befestigungen, Überdeckungen beziehungsweise Dichtungen sowie die Lage und Ausbildung von Öffnungen.",
        "aktivitaet": {
          "id": "lf12-l07-e01-aktiv",
          "version": 2,
          "titel": "Ein Ausschnitt kommt hinzu",
          "erklaerung": "Eine zusätzliche Öffnung verändert mehr als das sichtbare Deckbild.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Nach Erstellung des Verlegeplans wird eine neue Dachöffnung in einer Profiltafel vorgesehen.",
          "optionen": [
            {
              "id": "o1",
              "text": "Auflager, verbleibende Tragwirkung und Einfassung der Öffnung prüfen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Den Verlegeplan und gegebenenfalls die Befestigung anpassen.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Die Öffnung ist automatisch unproblematisch, solange sie zwischen zwei Profilrippen liegt.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf12-l16-e01",
        "version": 2,
        "titel": "Neigungsangaben mit ihren Bedingungen lesen",
        "lernziel": "Du kannst Regeldachneigung und Systemgrenzen als bedingte Planungsangaben einordnen.",
        "minuten": 7,
        "textschritte": [
          "Die Dachneigung beeinflusst die Auswahl einer Metalldeckung und die Ausbildung ihrer Verbindungen. In Tabellen werden dafür verschiedene Begriffe und Bedingungen verwendet. Eine Regeldachneigung ist ein Bezug der jeweiligen Deckart. Eine mögliche geringere Neigung mit Zusatzmaßnahmen ist davon zu unterscheiden. Aus einer einzelnen Zahl folgt deshalb keine pauschale Eignung aller Details. Prüfe immer, zu welchem System der Wert gehört und welche Bedingungen für Querstöße, Durchdringungen und Anschlüsse gelten. Auch eine geschweißte Verbindung beantwortet nicht alle Fragen zur Dachkonstruktion. Die vorhandenen Unterrichtstabellen helfen beim Verstehen dieser Unterschiede; für einen Auftrag müssen die passenden geltenden System- und Planungsunterlagen herangezogen werden. Ungeklärte Bedingungen bleiben als offene Punkte sichtbar."
        ],
        "lektionIds": [
          "lf12-l16"
        ],
        "aufgabenIds": [
          "lf12-012",
          "lf12-013",
          "lf12-039",
          "lf12-111"
        ],
        "begriffe": [],
        "abrufFrage": "Warum reicht die Angabe einer Regeldachneigung allein für die Deckartwahl nicht?",
        "abrufMuster": "System, Zusatzmaßnahmen und Detailbedingungen müssen ebenfalls passen, etwa bei Querstößen, Anschlüssen und Durchdringungen.",
        "aktivitaet": {
          "id": "lf12-l16-e01-aktiv",
          "version": 2,
          "titel": "Eine Tabellenzahl wird zur Freigabe",
          "erklaerung": "Eine Zusatzmaßnahme wird nach dem konkreten System gewählt und ersetzt keine Prüfung der Einsatzgrenzen.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Ein Dach liegt unter dem Tabellenbezug einer Deckart. Jemand schlägt vor, ohne weitere Prüfung einfach ein Dichtband einzusetzen.",
          "optionen": [
            {
              "id": "o1",
              "text": "Prüfen, ob das System diesen Einsatz und die vorgesehene Zusatzmaßnahme zulässt.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Auch Anschlüsse und Querverbindungen in die Prüfung einbeziehen.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Ein beliebiges Dichtband macht jede Neigung für jede Deckart geeignet.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf12-l17-e01",
        "version": 2,
        "titel": "Haftabstände rechnen und Grenzen exakt vergleichen",
        "lernziel": "Du kannst aus vorgegebener Haftdichte und Scharbreite einen Abstand berechnen und mit einem Höchstwert vergleichen.",
        "minuten": 7,
        "textschritte": [
          "Für den Haftabstand verbindet das Übungsmodell die Scharbreite s mit der vorgegebenen Haftdichte n je Quadratmeter. Der Abstand ergibt sich aus h = 1/(s · n), wenn s in Metern eingesetzt wird. Die erforderliche Dichte ist bereits eine Eingabe aus der passenden Planung; die Formel bestimmt keine Windlast. Rechne Fassaden- beziehungsweise Dachbereiche mit unterschiedlichen Vorgaben getrennt. Danach vergleichst du das Ergebnis mit allen angegebenen Höchstabständen. Dabei darf Rundung keine Überschreitung verdecken: 252 mm sind größer als 250 mm, auch wenn beide Werte ähnlich erscheinen. Wähle eine passende engere Einteilung und prüfe sie erneut. Kontrolliere außerdem Festbereich und Gleitweg unabhängig von der reinen Haftzahl."
        ],
        "lektionIds": [
          "lf12-l17"
        ],
        "aufgabenIds": [
          "lf12-054",
          "lf12-055",
          "lf12-056",
          "lf12-057"
        ],
        "begriffe": [],
        "abrufFrage": "Ist ein errechneter Abstand von 252 mm bei höchstens 250 mm zulässig?",
        "abrufMuster": "Nein. Der Rechenwert überschreitet den Höchstabstand. Die Einteilung muss enger gewählt und erneut geprüft werden.",
        "aktivitaet": {
          "id": "lf12-l17-e01-aktiv",
          "version": 2,
          "titel": "Zwei Millimeter bleiben eine Überschreitung",
          "erklaerung": "Eine gerundete Anzeige verändert den tatsächlich ausgeführten Abstand nicht.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Für einen Bereich nennt die Planung höchstens 250 mm Haftabstand. Die Rechnung ergibt 252 mm.",
          "optionen": [
            {
              "id": "o1",
              "text": "252 mm überschreiten die vorgegebene Grenze.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Eine engere passende Einteilung berechnen und kontrollieren.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "252 mm dürfen zur Einhaltung der Grenze auf 250 mm abgerundet werden, ohne die Ausführung zu ändern.",
              "korrekt": false
            }
          ]
        }
      },
      {
        "id": "lf12-l18-e01",
        "version": 2,
        "titel": "Querverbindungen mit Wasserlauf und Bewegung planen",
        "lernziel": "Du kannst begründen, warum Querfalze eine eigene Detailplanung benötigen.",
        "minuten": 7,
        "textschritte": [
          "Eine Querverbindung unterbricht die Schar in ihrer Längsrichtung. Sie kann durch die Lieferform, die Geometrie oder das Bewegungs- und Fertigungskonzept erforderlich werden. Ihre Ausbildung hängt vom vorgesehenen System und der Dachneigung ab. Dabei muss Wasser über den Anschluss weitergeführt werden, ohne unzulässige Materiallagen oder eine Behinderung der Bewegung zu erzeugen. Plane Querverbindungen deshalb zusammen mit den Längsfalzen. In einem ungünstigen Knoten können mehrere Falze und viele Blechlagen zusammentreffen; eine versetzte Anordnung kann solche Stellen vermeiden. Markiere in der Zeichnung die Fließrichtung und die Lage jedes Falzes. Eine Verbindung wird nicht allein dadurch passend, dass sie an anderen Stellen des Daches bereits verwendet wurde."
        ],
        "lektionIds": [
          "lf12-l18"
        ],
        "aufgabenIds": [
          "lf12-042",
          "lf12-043",
          "lf12-045",
          "lf12-046"
        ],
        "begriffe": [],
        "abrufFrage": "Warum werden Querverbindungen nicht isoliert von den Längsfalzen gezeichnet?",
        "abrufMuster": "An ihren Kreuzungen treffen mehrere Blechlagen und Bewegungsanforderungen zusammen. Die gemeinsame Planung vermeidet ungünstige Knoten und ordnet den Wasserlauf.",
        "aktivitaet": {
          "id": "lf12-l18-e01-aktiv",
          "version": 2,
          "titel": "Eine Querverbindung planen",
          "erklaerung": "Die Verbindung wird aus ihren Bedingungen ausgewählt; eine pauschale Scharlänge ersetzt diese Prüfung nicht.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Lieferform, Dachgeometrie und Bewegungskonzept klären"
            },
            {
              "id": "s2",
              "text": "Passendes Verbindungsdetail für System und Neigung auswählen"
            },
            {
              "id": "s3",
              "text": "Wasserlaufrichtung im Detail markieren"
            },
            {
              "id": "s4",
              "text": "Zusammentreffen mit den Längsfalzen prüfen und gegebenenfalls versetzen"
            },
            {
              "id": "s5",
              "text": "Zugaben, Befestigung und Bewegungsraum in die Fertigungszeichnung übernehmen"
            }
          ]
        }
      },
      {
        "id": "lf12-l19-e01",
        "version": 2,
        "titel": "Bewegungsraum auch an den Rändern erhalten",
        "lernziel": "Du kannst erklären, warum ein gleitfähiges Haftsystem passende Trauf-, First- und Gratdetails braucht.",
        "minuten": 7,
        "textschritte": [
          "Eine beweglich befestigte Schar braucht auch an ihren Enden den vorgesehenen Bewegungsraum. Wird sie an Traufe oder First unbeabsichtigt starr eingespannt, kann das Gleitvermögen der Hafte seine Aufgabe nicht erfüllen. Prüfe deshalb Befestigung und Randanschluss gemeinsam. An der Traufe gehört ein geordneter Wasserübergang zur Rinne dazu. Am First und Grat treffen Längsfalze auf weitere Aufkantungen und Abdeckungen. Die vorbereiteten Ausschnitte und Zugaben sollen eine herstellbare Verbindung ermöglichen, ohne unnötig viele Blechlagen in einem Punkt zu sammeln. Zusätzliche Bewegungsdetails wie Schiebenähte oder Abtreppungen werden für das konkrete Dach geplant. Sie sind eigene Konstruktionen mit Einsatzbedingungen und keine beliebig austauschbaren Trennschnitte."
        ],
        "lektionIds": [
          "lf12-l19"
        ],
        "aufgabenIds": [
          "lf12-061",
          "lf12-062",
          "lf12-063",
          "lf12-064"
        ],
        "begriffe": [],
        "abrufFrage": "Warum kann eine starr eingespannte Traufe trotz Schiebehafte problematisch sein?",
        "abrufMuster": "Sie kann die vorgesehene Längenbewegung der Schar blockieren. Haftsystem und Randdetails müssen denselben Bewegungsweg ermöglichen.",
        "aktivitaet": {
          "id": "lf12-l19-e01-aktiv",
          "version": 2,
          "titel": "Gleiten bis zum Rand",
          "erklaerung": "Ein Bewegungskonzept kann an einem einzigen ungeeigneten Anschluss behindert werden.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Die Planung enthält Schiebehafte, aber der ausführende Vorschlag klemmt die Schar am unteren Ende ohne vorgesehenen Bewegungsraum fest.",
          "optionen": [
            {
              "id": "o1",
              "text": "Den Traufanschluss zusammen mit dem Bewegungskonzept prüfen.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Die Schiebehafte allein sichern noch keinen freien Bewegungsweg bis zum Ende.",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Das starre Enddetail ist immer unproblematisch, sobald ausreichend Schiebehafte eingebaut sind.",
              "korrekt": false
            }
          ]
        }
      }
    ]
  },
  {
    "id": "lf12-k05",
    "titel": "Verbindungen, Elemente und Projekt",
    "einheiten": [
      {
        "id": "lf12-l10-e01",
        "version": 2,
        "titel": "Schweißnaht und nachfolgenden Falz unterscheiden",
        "lernziel": "Du kannst die Funktionen der Rollnahtschweißung und des anschließend geformten Falzes trennen.",
        "minuten": 7,
        "textschritte": [
          "Bei der rollnahtgeschweißten Edelstahldeckung entsteht die Verbindung durch das Schweißen vorbereiteter Aufkantungen. Rollenelektroden führen das Verfahren entlang der Naht aus. Die passenden Parameter ergeben sich aus Werkstoff, Dicke und System. Ein anschließend geformter einfacher Stehfalz ordnet und stabilisiert den Nahtbereich; die Schweißverbindung entsteht bereits zuvor. Verwechsle deshalb die sichtbare Form nicht mit dem eigentlichen Fügeprinzip. Auch die Hafte und die flächige Unterlage gehören zur geplanten Ausführung. In Ecken und schwer erreichbaren Bereichen muss das vorgesehene Ergänzungsverfahren berücksichtigt werden. Zur Qualitätskontrolle gehören vorbereitete Flächen, geeignete Geräteeinstellung und eine passende Prüfung der Verbindung. Eine geschlossene äußere Form allein beweist noch keine fehlerfreie Schweißnaht."
        ],
        "lektionIds": [
          "lf12-l10"
        ],
        "aufgabenIds": [
          "lf12-011",
          "lf12-078",
          "lf12-080",
          "lf12-081"
        ],
        "begriffe": [],
        "abrufFrage": "Was verbindet die Scharen, und welche Aufgabe hat der spätere Falz?",
        "abrufMuster": "Die Rollnahtschweißung verbindet die vorbereiteten Aufkantungen. Der danach geformte Falz ordnet und stabilisiert den bereits geschweißten Nahtbereich.",
        "aktivitaet": {
          "id": "lf12-l10-e01-aktiv",
          "version": 2,
          "titel": "Eine geschweißte Verbindung herstellen",
          "erklaerung": "Die richtige Reihenfolge trennt das Fügen vom anschließenden Formen.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Geeignetes Material und vorbereitete Aufkantungen kontrollieren"
            },
            {
              "id": "s2",
              "text": "Gerät nach dem vorgesehenen System einstellen und Verfahren prüfen"
            },
            {
              "id": "s3",
              "text": "Die Aufkantungen durchgehend rollnahtschweißen"
            },
            {
              "id": "s4",
              "text": "Vorgesehene schwer zugängliche Bereiche ergänzend bearbeiten"
            },
            {
              "id": "s5",
              "text": "Nahtbereich prüfen und den nachfolgenden Falz formen"
            }
          ]
        }
      },
      {
        "id": "lf12-l20-e01",
        "version": 2,
        "titel": "Leistendeckung in ihrer Reihenfolge aufbauen",
        "lernziel": "Du kannst die Bauteile und den grundlegenden Montageablauf einer Leistendeckung zuordnen.",
        "minuten": 7,
        "textschritte": [
          "Bei der Leistendeckung werden die seitlichen Scharränder an einem Leistenbereich angeordnet und durch eine Kappe überdeckt. Die Verbindung unterscheidet sich damit vom unmittelbar zusammengefalteten Längsfalz zweier Scharen. Im behandelten Ablauf werden zuerst die vorgesehenen Leisten und Hafte befestigt. Anschließend werden die vorbereiteten Scharen eingesetzt, die Hafte nach dem Detail geformt und die Kappen montiert. Die konkrete Ausführung bestimmt, wie die Kappen gehalten und ihre Stöße ausgebildet werden. Für die Einteilung brauchst du deshalb Bandbreite, Aufkantungszugaben, Leistenabmessungen und den geplanten Bewegungsraum. Verwende diese Maße aus demselben System. Eine Zugabenrechnung der Stehfalzdeckung lässt sich nicht allein wegen ähnlicher Scharbreiten übernehmen."
        ],
        "lektionIds": [
          "lf12-l20"
        ],
        "aufgabenIds": [
          "lf12-067",
          "lf12-069",
          "lf12-071",
          "lf12-074"
        ],
        "begriffe": [],
        "abrufFrage": "Warum hat die Leistendeckung eine andere Zugabenrechnung als die Stehfalzdeckung?",
        "abrufMuster": "Die seitlichen Anschlüsse werden an Leisten und Kappen ausgebildet. Ihre Geometrie und Bewegungsräume unterscheiden sich vom ineinandergefalteten Stehfalz.",
        "aktivitaet": {
          "id": "lf12-l20-e01-aktiv",
          "version": 2,
          "titel": "Grundablauf der Leistendeckung",
          "erklaerung": "Die Reihenfolge beschreibt das behandelte Grundprinzip; Einzelmaße gehören zum gewählten Leistensystem.",
          "typ": "reihenfolge",
          "auftrag": "Ordne die Schritte in die fachlich sinnvolle Reihenfolge. Nutze die Pfeil-Schaltflächen.",
          "schritte": [
            {
              "id": "s1",
              "text": "Unterlage und Einteilung nach dem vorgesehenen Detail prüfen"
            },
            {
              "id": "s2",
              "text": "Leisten und zugehörige Hafte befestigen"
            },
            {
              "id": "s3",
              "text": "Vorbereitete Scharen zwischen den Leisten einsetzen"
            },
            {
              "id": "s4",
              "text": "Hafte passend zum Detail umlegen beziehungsweise schließen"
            },
            {
              "id": "s5",
              "text": "Leistenkappen mit den vorgesehenen Verbindungen montieren"
            }
          ]
        }
      },
      {
        "id": "lf12-l21-e01",
        "version": 2,
        "titel": "Sandwichelemente als verbundenes Bauteil montieren",
        "lernziel": "Du kannst die Funktionen der Deckschalen, des Dämmkerns und der Elementfugen erklären.",
        "minuten": 7,
        "textschritte": [
          "Ein Sandwichelement verbindet zwei Deckschalen mit einem dazwischenliegenden Dämmkern. Das Element übernimmt dadurch mehrere Aufgaben gemeinsam. Bei der Montage wird deshalb ein fertiges Bauteil nach Verlegeplan positioniert; sein Kern ist keine lose nachträglich eingelegte Dämmmatte. Auflager, Befestigungen und Fugen müssen zu diesem Element passen. Besonders an Querstößen und am First sind äußere Wasserführung, Dämmkontinuität und innere Dichtheit zusammen zu betrachten. Eine fest angezogene Schraube ist nicht automatisch eine richtig angezogene Schraube: Die vorgesehene Dichtung darf nicht durch ungeeignete Montage geschädigt werden. Verwende die zum System gehörenden Verbindungsmittel und Montageangaben. Kontrolliere die erste Elementlage sorgfältig, weil sie die Ausrichtung der folgenden Elemente vorgibt."
        ],
        "lektionIds": [
          "lf12-l21"
        ],
        "aufgabenIds": [
          "lf12-104",
          "lf12-105",
          "lf12-106"
        ],
        "begriffe": [],
        "abrufFrage": "Welche drei Funktionen prüfst du am Firststoß von Sandwichelementen?",
        "abrufMuster": "Äußere Wasserführung, eine passende Fortführung der Wärmedämmung und den vorgesehenen inneren dichten Anschluss.",
        "aktivitaet": {
          "id": "lf12-l21-e01-aktiv",
          "version": 2,
          "titel": "Sandwichelement und Aufgabe",
          "erklaerung": "Das Element wird als System montiert; Fugen und Befestigung gehören zu seiner Funktion.",
          "typ": "zuordnen",
          "auftrag": "Ordne jedem Eintrag die passende Bedeutung zu.",
          "paare": [
            {
              "id": "p1",
              "links": "Äußere Deckschale",
              "rechts": "Bildet die wetterbeanspruchte Oberfläche"
            },
            {
              "id": "p2",
              "links": "Dämmkern",
              "rechts": "Trägt zur Wärmedämmung des Elements bei"
            },
            {
              "id": "p3",
              "links": "Auflager und Befestigung",
              "rechts": "Leiten die vorgesehenen Lasten weiter"
            },
            {
              "id": "p4",
              "links": "Elementfuge",
              "rechts": "Verbindet Wasserführung, Dämmung und innere Dichtheit"
            }
          ]
        }
      },
      {
        "id": "lf12-l22-e01",
        "version": 2,
        "titel": "Ein Metalldach im Positionsplan beschreiben",
        "lernziel": "Du kannst für ein unsymmetrisches Dach Mengen ermitteln und Leistungen mit passenden Einheiten aufstellen.",
        "minuten": 7,
        "textschritte": [
          "Ein Positionsplan macht eine Planung für andere überprüfbar. Jede Zeile nennt die Leistung, ihre Menge und die passende Einheit. Beginne bei einem Dach mit der Geometrie und dem gewählten Aufbau. Ein unsymmetrisches Satteldach besitzt zwei unterschiedliche Sparrenlängen; berechne beide Seiten mit ihrer tatsächlichen Länge, statt eine Seite einfach zu verdoppeln. Danach folgen Schareneinteilung, Befestigungskonzept und Anschlüsse. Deckecken oder Durchdringungen erhalten bei Bedarf eigene Stückpositionen, Randabschlüsse eigene Längenpositionen. Eine vorgegebene Dämmstoffrechnung ergänzt den Aufbau, ersetzt aber nicht seine gesamte Beurteilung. Halte fehlende Eingaben und Bedingungen schriftlich fest. So lässt sich erkennen, welche Mengen berechnet sind und welche Entscheidungen vor einer Ausführung noch geklärt werden müssen."
        ],
        "lektionIds": [
          "lf12-l22"
        ],
        "aufgabenIds": [
          "lf12-082",
          "lf12-112",
          "lf12-114",
          "lf12-115"
        ],
        "begriffe": [],
        "abrufFrage": "Wie berechnest du die Fläche eines Satteldachs mit 12 m Länge und Sparrenlängen von 6 m und 7 m?",
        "abrufMuster": "Die beiden Seiten addieren: 12 · 6 + 12 · 7 = 156 m². Die unterschiedlichen Sparrenlängen dürfen nicht durch Verdopplung einer Seite ersetzt werden.",
        "aktivitaet": {
          "id": "lf12-l22-e01-aktiv",
          "version": 2,
          "titel": "Die kürzere Seite wurde verdoppelt",
          "erklaerung": "Zuschläge werden erst auf eine richtig ermittelte Grundmenge angewendet.",
          "typ": "baustellenfall",
          "auftrag": "Wähle alle fachlich passenden Aussagen. Mehrere Antworten können stimmen.",
          "situation": "Ein Satteldach ist 12 m lang. Eine Dachseite misst entlang des Sparrens 6 m, die andere 7 m. Die Liste enthält 144 m² Flächendeckung.",
          "optionen": [
            {
              "id": "o1",
              "text": "Die Fläche wurde durch Verdoppeln der kürzeren Seite zu klein angesetzt.",
              "korrekt": true
            },
            {
              "id": "o2",
              "text": "Die korrekte Grundfläche der beiden Dachseiten beträgt 156 m².",
              "korrekt": true
            },
            {
              "id": "o3",
              "text": "Eine durchschnittliche Sparrenlänge von 6,5 m wäre rechnerisch ebenfalls verwendbar.",
              "korrekt": true
            },
            {
              "id": "o4",
              "text": "Ein pauschaler Verschnittzuschlag ersetzt die Korrektur der Geometrie.",
              "korrekt": false
            }
          ]
        }
      }
    ]
  }
];

export const FACHSTUFE_KURSE: Record<string, LernKapitel[]> = { lf08: LF08_KAPITEL, lf09: LF09_KAPITEL, lf10: LF10_KAPITEL, lf11: LF11_KAPITEL, lf12: LF12_KAPITEL };
