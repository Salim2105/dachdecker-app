import { BAUPROJEKTE } from "@/lib/bauprojekte";
import type { AuswahlAktivitaet, ReihenfolgeAktivitaet } from "@/lib/aktivitaeten";
import type { AuswahlTeil, FallTeil, KompetenzId, PruefungsFall, RechenTeil } from "@/lib/pruefungsVorbereitungTypen";

/** Eigene zusammenhängende Trainingsfälle, keine amtlichen Dortmunder Aufgaben. */
export const FALL_THEMEN = [
  { id: "ziegeldach", titel: "Ziegeldach neu eindecken", kurz: "Dachplan, wahre Fläche und Bestellung zusammenbringen." },
  { id: "flachdach", titel: "Flachdach mit Anschluss und Ablauf", kurz: "Gefälle, Materialmenge und Wasserwege unterscheiden." },
  { id: "sanierung", titel: "Dachsanierung vorbereiten", kurz: "Befunde, Wärmeschutz und Mengen nachvollziehbar begründen." },
  { id: "schiefer", titel: "Schiefer an einer Durchdringung", kurz: "Plattenbedarf und zwei wasserführende Ebenen betrachten." },
  { id: "metalldach", titel: "Metalldeckung mit Bewegungsspielraum", kurz: "Bahnen einteilen und thermische Bewegung einordnen." },
  { id: "fassade", titel: "Fassade mit Fensteranschluss", kurz: "Öffnung, Materialmenge und freie Luftwege gemeinsam planen." },
] as const;
export const MUSTER_FORMEN = [
  { id: "muster-a", titel: "Musterlauf A · Ziegeldach und Flachdach", fallIds: ["ziegeldach", "flachdach"] },
  { id: "muster-b", titel: "Musterlauf B · Flachdach und Sanierung", fallIds: ["flachdach", "sanierung"] },
  { id: "muster-c", titel: "Musterlauf C · Sanierung und Ziegeldach", fallIds: ["sanierung", "ziegeldach"] },
] as const;
const zahl = (n: number, stellen = 2) => n.toLocaleString("de-DE", { maximumFractionDigits: stellen });
// A binary floating-point residue must not increase an exact whole-item boundary.
const aufrunden = (n: number) => Math.ceil(Number(n.toFixed(9)));
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function skizze(titel: string, linien: string, texte: string[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 330" role="img"><title>${xml(titel)} – Auftragsplan ohne Maßstab</title><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round">${linien}</g><g fill="currentColor" font-family="sans-serif" font-size="16">${texte.map((t, i) => `<text x="25" y="${244 + i * 24}">${xml(t)}</text>`).join("")}</g></svg>`;
}
function schritt(id: string, label: string, wert: number, einheit: string, formel: string, stellen = 2, vor?: string): RechenTeil["schritte"][number] {
  const andere = einheit === "m²" ? ["m", "m³"] : einheit === "m" ? ["cm", "m²"] : einheit === "cm" ? ["m", "°"] : einheit === "mm" ? ["m", "%"] : einheit === "Stück" || einheit === "Bahnen" ? ["m²", "m"] : einheit === "m³" ? ["m²", "kg"] : einheit === "kg" ? ["m³", "m²"] : einheit === "m²K/W" ? ["W/(m²K)", "m"] : ["m²K/W", "m²"];
  return { id, label, wert, einheit, einheiten: [einheit, ...andere], stellen, toleranz: stellen === 0 ? 0 : .5 * 10 ** -stellen, formel, punkte: 2, ...(vor ? { abhaengigVon: vor } : {}) };
}
interface MengenModell {
  parameter: Record<string, number>; angaben: string[]; svg: string;
  geometrie: RechenTeil["schritte"]; menge: RechenTeil["schritte"];
  geometrieAuftrag: string; mengenAuftrag: string; geometrieHinweis: string; mengenHinweis: string;
  geometrieErklaerung: string; mengenErklaerung: string; muster: string; transfer: PruefungsFall["transfer"];
}

/** Drawing labels, wording, numerical answers and transfer use the same frozen values. */
function mengenModell(id: string, v: number): MengenModell {
  const s = (kurz: string, label: string, wert: number, einheit: string, formel: string, stellen = 2, vor?: string) => schritt(`${id}-${kurz}`, label, wert, einheit, formel, stellen, vor ? `${id}-${vor}` : undefined);
  if (id === "ziegeldach") {
    const breite = [8, 12, 10][v], hoehe = [3, 8, 12][v], laenge = [10, 9, 8][v];
    const halb = breite / 2, schraege = Math.hypot(halb, hoehe), flaeche = 2 * laenge * schraege, bedarf = 12.5, reserve = .10;
    const grundbedarf = flaeche * bedarf, bestellung = aufrunden(grundbedarf * (1 + reserve));
    return {
      parameter: { breite, hoehe, laenge, bedarf, reserve },
      angaben: [`Symmetrisches Satteldach: Gebäudebreite ${zahl(breite)} m, First mittig, Firstlänge ${zahl(laenge)} m`, `Höhe zwischen Traufe und First ${zahl(hoehe)} m; Überstände und Öffnungen sind in dieser Geometrieübung ausgenommen`, "Vorgegebener Bedarf 12,5 Ziegel/m² aus nutzbarer Deckbreite 20 cm und Decklänge 40 cm", "10 % Reserve ausdrücklich vorgegeben; erst die gesamte Bestellmenge auf ganze Ziegel aufrunden"],
      svg: skizze("Satteldachprofil", '<path d="M100 200L320 40L540 200ZM320 40V200M100 215H540M100 208V222M540 208V222"/><path d="M320 180H340V200"/>', [`Gebäudebreite B = ${zahl(breite)} m; Höhe h = ${zahl(hoehe)} m`, `Firstlänge l = ${zahl(laenge)} m; die beiden Dachseiten gehören zum Auftrag`, "Profil schematisch; die Dachschräge ist gesucht."]),
      geometrie: [s("halb", "Halbe Gebäudebreite", halb, "m", "b = B / 2"), s("schraege", "Wahre Dachschräge", schraege, "m", "s = √(b² + h²)", 2, "halb"), s("flaeche", "Gesamte geneigte Dachfläche", flaeche, "m²", "A = 2 × l × s", 2, "schraege")],
      menge: [s("grundbedarf", "Grundbedarf ohne Reserve", grundbedarf, "Stück", "N₀ = A × 12,5", 0, "flaeche"), s("bestellung", "Ganze Bestellmenge mit Reserve", bestellung, "Stück", "N = aufrunden(N₀ × 1,10)", 0, "grundbedarf")],
      geometrieAuftrag: "Berechne halbe Gebäudebreite, wahre Dachschräge und die Fläche beider Dachseiten. Notiere deinen Rechenweg.",
      mengenAuftrag: "Ermittle Grundbedarf und ganze Bestellmenge aus der geneigten Dachfläche. Die Reserve wird erst nach dem Grundbedarf aufgeschlagen.",
      geometrieHinweis: "Der First liegt mittig. Bestimme das rechtwinklige halbe Profil, bevor du beide Dachseiten berechnest.", mengenHinweis: "Verwende den ausdrücklich vorgegebenen Bedarf je Quadratmeter. Grundbedarf und Zuschlag sind zwei Rechenschritte.",
      geometrieErklaerung: `Die halbe Breite beträgt ${zahl(halb)} m, die Dachschräge ${zahl(schraege)} m. Beide geneigten Dachseiten ergeben ${zahl(flaeche)} m². Die Grundfläche wäre nur ${zahl(breite * laenge)} m².`,
      mengenErklaerung: `${zahl(flaeche)} m² × 12,5 ergeben ${zahl(grundbedarf, 0)} Ziegel. Mit 10 % vorgegebener Reserve sind ${zahl(bestellung, 0)} ganze Ziegel einzuplanen. Das ersetzt keine Prüfung tatsächlicher Produkt- und Anschlussdaten.`,
      muster: `Die Grundfläche ${zahl(breite * laenge)} m² ist nicht die geneigte Dachfläche. Das halbe Profil verbindet ${zahl(halb)} m waagerechte Strecke mit ${zahl(hoehe)} m Höhe. Daraus ergeben sich ${zahl(schraege)} m Dachschräge und ${zahl(flaeche)} m² für beide Seiten. Der angenommene Bedarf führt mit Reserve zu ${zahl(bestellung, 0)} Ziegeln. Überstände, Öffnungen, tatsächliche Deckmaße, Sonderteile und Anschlüsse werden zusätzlich geklärt.`,
      transfer: { frage: `Ein Nachtrag betrifft nur EINE rechteckige Pultdachfläche. Im Plan sind waagerechte Tiefe ${zahl(halb)} m, Höhenunterschied ${zahl(hoehe)} m und Länge ${zahl(laenge)} m angegeben. Überstände fehlen. Wie groß ist diese eine geneigte Fläche in m²?`, wert: laenge * schraege, einheit: "m²", toleranz: .005, erklaerung: "Beim Pultdach zählt genau eine geneigte Fläche. Die Dachschräge entsteht aus waagerechter Tiefe und Höhe; ein Faktor zwei wäre hier unpassend." },
    };
  }
  if (id === "flachdach") {
    const laenge = [8, 10, 12][v], breite = [6, 7, 8][v], gefaelle = [2, 2.5, 3][v], faktor = 1.1, flaeche = laenge * breite;
    const hoeheCm = breite * gefaelle, bahnmenge = flaeche * faktor;
    return {
      parameter: { laenge, breite, gefaelle, faktor },
      angaben: [`Rechteckige Übungsfläche ${zahl(laenge)} m × ${zahl(breite)} m`, `Für diese Aufgabe ausdrücklich vorgegeben: ${zahl(gefaelle)} % Gefälle über ${zahl(breite)} m waagerechte Strecke`, "Pauschaler Mengenfaktor 1,10 ist nur eine Vorgabe der Mengenübung; konkrete Überdeckungen und Anschlüsse sind nicht bemessen", "Die Flächenabdichtung endet vor der Attika; eine Abdeckung ist vorhanden. Eine Ablaufgröße ist nicht vorgegeben."],
      svg: skizze("Flachdachgrundriss", '<rect x="100" y="40" width="430" height="160"/><path d="M315 65V170M300 155L315 170L330 155"/><circle cx="315" cy="185" r="12"/><path d="M100 25H530M550 40V200"/>', [`Länge l = ${zahl(laenge)} m; Breite b = ${zahl(breite)} m`, `Gefälle ${zahl(gefaelle)} % über b; Kreis: vorgesehener Ablaufbereich`, "Die Skizze legt keine Ablaufgröße und kein fertiges Anschlussdetail fest."]),
      geometrie: [s("flaeche", "Rechteckige Dachfläche", flaeche, "m²", "A = l × b"), s("hoehe", "Höhenunterschied über die Breite", hoeheCm, "cm", "Δh = b × (g / 100) × 100")],
      menge: [s("reserve", "Zusätzliche Menge aus dem Faktor", flaeche * .1, "m²", "Azu = A × 0,10", 2, "flaeche"), s("bahnmenge", "Angenommene gesamte Bahnenmenge", bahnmenge, "m²", "AM = A × 1,10", 2, "flaeche")],
      geometrieAuftrag: "Bestimme die rechteckige Fläche und den Höhenunterschied des ausdrücklich vorgegebenen Gefälles. Gib die Höhe in Zentimetern an.",
      mengenAuftrag: "Berechne den zusätzlichen Flächenansatz und die gesamte angenommene Bahnenmenge mit dem Faktor 1,10.",
      geometrieHinweis: "Prozentgefälle setzt Höhe und waagerechte Strecke ins Verhältnis. Die Aufgabe verlangt die Höhe in Zentimetern.", mengenHinweis: "Der Faktor 1,10 enthält den ursprünglichen Flächenansatz und zusätzlich 10 %. Er beschreibt keine allgemeine Verlegeregel.",
      geometrieErklaerung: `Die Fläche beträgt ${zahl(flaeche)} m². Über ${zahl(breite)} m ergibt das vorgegebene Gefälle ${zahl(hoeheCm)} cm Höhenunterschied. Prozent und Winkelgrad sind unterschiedliche Größen.`,
      mengenErklaerung: `Zusätzlich werden ${zahl(flaeche * .1)} m² angesetzt; die angenommene Gesamtmenge beträgt ${zahl(bahnmenge)} m². Ein genauer Verlege- und Anschlussplan bleibt zusätzlich erforderlich.`,
      muster: `Die Fläche beträgt ${zahl(flaeche)} m², der vorgegebene Mengenfaktor ergibt ${zahl(bahnmenge)} m². Das angenommene Gefälle führt zu ${zahl(hoeheCm)} cm Höhe. Diese Rechnung bestimmt weder eine allgemeine Mindestneigung noch eine Ablaufgröße. Die Abdichtung braucht einen durchgehenden Anschluss; normaler Wasserweg und erforderlicher Notwasserweg werden im konkreten System geplant.`,
      transfer: { frage: `Bei einer anderen Fläche ist die Höhe schon bekannt: ${zahl(hoeheCm)} cm Unterschied über ${zahl(breite * 2)} m waagerechte Strecke. Welches Prozentgefälle ergibt sich?`, wert: gefaelle / 2, einheit: "%", toleranz: .005, erklaerung: "Hier ist das Verhältnis gesucht, nicht die Höhe. Zentimeter zuerst in Meter umrechnen und dann Höhe durch waagerechte Strecke mal 100 rechnen." },
    };
  }
  if (id === "sanierung") {
    const flaeche = [20, 30, 24][v], dicke = [.16, .20, .24][v], lambda = .04, restR = .50, dichte = 40;
    const widerstand = dicke / lambda, uwert = 1 / (widerstand + restR), volumen = flaeche * dicke;
    return {
      parameter: { flaeche, dicke, lambda, restR, dichte },
      angaben: [`Untersuchungsfläche ${zahl(flaeche)} m²; sichtbare Feuchtestelle, Ursache noch nicht festgestellt`, `Vorgegebene Dämmschicht d = ${zahl(dicke * 100)} cm und λ = 0,04 W/(m·K)`, "Übrige Widerstände einschließlich Übergangswiderständen im vereinfachten Rechenmodell zusammen 0,50 m²K/W", "Für die reine Mengenübung angenommene Rohdichte 40 kg/m³; keine Prüfung von Wärmebrücken oder Feuchteschutz durch diese Rechnung"],
      svg: skizze("Sanierungsmodell", '<path d="M90 50H550M90 90H550M90 150H550M90 190H550"/><path d="M110 90L145 150M170 90L205 150M230 90L265 150M290 90L325 150M350 90L385 150"/><path d="M450 190H470M495 190H520"/>', [`A = ${zahl(flaeche)} m²; Dämmung d = ${zahl(dicke * 100)} cm`, "λ = 0,04 W/(m·K); übrige Widerstände zusammen 0,50 m²K/W", "Die Unterbrechung ist ein zu untersuchender Befund, keine bewiesene Ursache."]),
      geometrie: [s("widerstand", "Wärmedurchlasswiderstand der Dämmung", widerstand, "m²K/W", "R = d / λ"), s("uwert", "U-Wert im vorgegebenen Modell", uwert, "W/(m²K)", "U = 1 / (R + Rrest)", 2, "widerstand")],
      menge: [s("volumen", "Dämmstoffvolumen", volumen, "m³", "V = A × d"), s("masse", "Angenommene Dämmstoffmasse", volumen * dichte, "kg", "m = V × ρ", 2, "volumen")],
      geometrieAuftrag: "Ermittle R der Dämmschicht und U des ausdrücklich vereinfachten Modells. Wandle die Dicke zuerst in Meter um.",
      mengenAuftrag: "Bestimme Dämmstoffvolumen und die Masse anhand der vorgegebenen Rohdichte. Ein vollständiger Lastnachweis ist damit nicht geführt.",
      geometrieHinweis: "Wärmedurchlasswiderstand und U-Wert sind verschiedene Größen. Für den U-Wert gehören die übrigen Widerstände zur Summe.", mengenHinweis: "Verwende die Dicke in Metern. Aus Fläche mal Dicke entsteht Volumen; Volumen mal Rohdichte ergibt Masse.",
      geometrieErklaerung: `Aus ${zahl(dicke)} m / 0,04 folgt R = ${zahl(widerstand)} m²K/W. Mit den übrigen Widerständen ergibt sich U ≈ ${zahl(uwert)} W/(m²K).`,
      mengenErklaerung: `${zahl(flaeche)} m² × ${zahl(dicke)} m ergeben ${zahl(volumen)} m³. Bei 40 kg/m³ sind das im angenommenen Modell ${zahl(volumen * dichte)} kg.`,
      muster: `Die feuchte Stelle ist ein Befund. Ihr Entstehungsweg und verdeckte Schäden müssen untersucht werden. Die angenommene Dämmschicht hat R = ${zahl(widerstand)} m²K/W; U beträgt im vorgegebenen Modell etwa ${zahl(uwert)} W/(m²K). Die Menge entspricht ${zahl(volumen)} m³ beziehungsweise ${zahl(volumen * dichte)} kg. Ein vollständiger Wärme-, Feuchte- oder Lastnachweis benötigt den tatsächlichen Aufbau.`,
      transfer: { frage: `Bei einer anderen Sanierung werden ${zahl(flaeche * dicke / 2)} m³ Dämmstoff für ${zahl(flaeche)} m² geliefert. Welche gleichmäßige Schichtdicke ist damit rechnerisch möglich? Gib sie in cm an.`, wert: dicke * 50, einheit: "cm", toleranz: .005, erklaerung: "Hier wird die bekannte Volumenbeziehung umgestellt: Dicke = Volumen / Fläche. Das Ergebnis in Metern anschließend in Zentimeter umrechnen." },
    };
  }
  if (id === "schiefer") {
    const laenge = [28, 20, 18][v], breite = [2.5, 3, 4][v], bedarf = 25, reserve = .05;
    const flaeche = laenge * breite, grundbedarf = flaeche * bedarf, bestellung = aufrunden(grundbedarf * (1 + reserve));
    return {
      parameter: { laenge, breite, bedarf, reserve },
      angaben: [`Bereits geneigte Rechteckfläche ${zahl(laenge)} m × ${zahl(breite)} m; die Durchdringungsöffnung wird für diese Mengenübung nicht abgezogen`, "Angenommener Bedarf 25 Platten/m² und ausdrücklich 5 % Reserve", "Erst nach dem Zuschlag auf ganze Platten aufrunden; konkrete Deckart und Deckmaße gesondert klären", "Sichtbarer Anschluss am Schornstein fertig, Zusatzebene endet dort noch offen"],
      svg: skizze("Schieferfläche mit Durchdringung", '<path d="M90 200L500 75L555 145L145 220Z"/><path d="M280 160V45H365V135M280 45H365"/>', [`Geneigte Länge l = ${zahl(laenge)} m; geneigte Breite b = ${zahl(breite)} m`, "25 Platten/m² und 5 % Reserve sind vorgegebene Rechenannahmen", "Schornstein schematisch; die Skizze zeigt keinen fertigen Anschluss."]),
      geometrie: [s("flaeche", "Geneigte Rechteckfläche", flaeche, "m²", "A = l × b")],
      menge: [s("grundbedarf", "Grundbedarf ohne Reserve", grundbedarf, "Stück", "N₀ = A × 25", 0, "flaeche"), s("bestellung", "Ganze Platten mit Reserve", bestellung, "Stück", "N = aufrunden(N₀ × 1,05)", 0, "grundbedarf")],
      geometrieAuftrag: "Berechne die geneigte Rechteckfläche. Eine weitere Umrechnung der bereits geneigten Maße ist nicht erforderlich.",
      mengenAuftrag: "Ermittle den Grundbedarf und die Bestellmenge ganzer Platten einschließlich 5 % Reserve.",
      geometrieHinweis: "Beide Maße liegen bereits in der Dachfläche. Die Aufgabenannahme zum Öffnungsabzug ist ausdrücklich zu beachten.", mengenHinweis: "Verwende Fläche mal angegebenen Bedarf. Runde die Bestellung erst nach dem Zuschlag auf ganze Platten auf.",
      geometrieErklaerung: `${zahl(laenge)} m × ${zahl(breite)} m ergeben ${zahl(flaeche)} m² geneigte Fläche.`,
      mengenErklaerung: `${zahl(flaeche)} × 25 ergeben ${zahl(grundbedarf, 0)} Platten ohne Reserve. Mit Zuschlag und anschließendem Aufrunden sind ${zahl(bestellung, 0)} Platten einzuplanen.`,
      muster: `Die ${zahl(bestellung, 0)} Platten folgen aus ${zahl(flaeche)} m², dem angenommenen Bedarf und 5 % Reserve. Das ist keine allgemeine Verbrauchsvorgabe für Schieferdeckungen. Am Schornstein werden sichtbare Deckung und Zusatzebene jeweils passend angeschlossen. Wasser wird oberhalb aufgenommen, seitlich weitergeführt und unterhalb wieder abgegeben.`,
      transfer: { frage: `Ein neuer Auftrag betrifft ein dreieckiges Schieferfeld mit Grundlinie ${zahl(breite * 2)} m und dazu senkrechter Höhe 3 m IN der Dachfläche. Bei angenommenen 25 Platten/m² und 5 % Reserve: Wie viele ganze Platten werden rechnerisch bestellt?`, wert: aufrunden(breite * 3 * 25 * 1.05), einheit: "Stück", toleranz: 0, erklaerung: "Das neue Feld ist ein Dreieck: Grundlinie mal senkrechte Höhe durch zwei. Danach Bedarf und Reserve anwenden; die Bestellung am Ende auf ganze Platten aufrunden." },
    };
  }
  if (id === "metalldach") {
    const breite = [5, 6.2, 7.4][v], laenge = [8, 9, 10][v], temperatur = [60, 50, 70][v], nutzbreite = .5, alpha = .022;
    const bahnen = aufrunden(breite / nutzbreite), gesamtlaenge = bahnen * laenge, ausdehnung = alpha * laenge * temperatur;
    return {
      parameter: { breite, laenge, temperatur, nutzbreite, alpha },
      angaben: [`Feldbreite ${zahl(breite)} m; Bahnlänge ${zahl(laenge)} m; vorgegebene Nutzbreite 0,50 m je Bahn`, "Nur ganze Bahnen einplanen; Rand- und Anschlusszuschläge sind für diese Mengenübung ausgenommen", `Vorgegebener Koeffizient α = 0,022 mm/(m·K); Temperaturänderung ${zahl(temperatur)} K`, "Ein Vorschlag hält die gesamte lange Bahn starr fest; Systemvorgaben zu Festpunkt und Gleitbereichen sind noch zu prüfen"],
      svg: skizze("Metalldachfeld", '<path d="M100 185L480 50L555 125L175 220Z"/><path d="M150 150L515 72" stroke-dasharray="8 7"/>', [`Feldbreite B = ${zahl(breite)} m; einzelne Bahnlänge l = ${zahl(laenge)} m`, `Nutzbreite 0,50 m; ΔT = ${zahl(temperatur)} K; α = 0,022 mm/(m·K)`, "Gestrichelte Linie: schematischer Bahnverlauf; keine dargestellte Bahnenanzahl."]),
      geometrie: [s("bahnen", "Ganze Anzahl der Bahnen", bahnen, "Bahnen", "n = aufrunden(B / bnutz)", 0), s("gesamtlaenge", "Gesamte Bahnlänge", gesamtlaenge, "m", "L = n × l", 2, "bahnen")],
      menge: [s("ausdehnung", "Freie Längenänderung einer Bahn", ausdehnung, "mm", "Δl = α × l × ΔT")],
      geometrieAuftrag: "Bestimme die ganze Bahnenanzahl und die gesamte Bahnlänge ohne zusätzliche Rand- oder Anschlussprofile.",
      mengenAuftrag: "Berechne die freie Längenänderung einer einzelnen Bahn in Millimetern mit den ausdrücklich vorgegebenen Temperaturdaten.",
      geometrieHinweis: "Nutzbreite und Zuschnittbreite sind unterschiedliche Größen. Eine angefangene zusätzliche Bahn wird bei dieser Einteilung als ganze Bahn gezählt.", mengenHinweis: "Länge und Temperaturänderung gehören zur Bewegungsrechnung. Beachte die Einheit des vorgegebenen Koeffizienten.",
      geometrieErklaerung: `Die Einteilung verlangt ${zahl(bahnen, 0)} ganze Bahnen. Ihre gesamte Länge beträgt ${zahl(gesamtlaenge)} m; Zusatzprofile und Anschlüsse sind damit nicht mitgerechnet.`,
      mengenErklaerung: `0,022 × ${zahl(laenge)} × ${zahl(temperatur)} ergibt ${zahl(ausdehnung)} mm freie Längenänderung einer Bahn. Das ist eine Bewegungsgröße, keine zusätzliche Bestelllänge aller Bahnen.`,
      muster: `Die Mengenrechnung ergibt ${zahl(bahnen, 0)} Bahnen mit insgesamt ${zahl(gesamtlaenge)} m Länge. Eine einzelne Bahn kann sich bei den vorgegebenen Temperaturdaten frei um ${zahl(ausdehnung)} mm ändern. Festpunkt, Gleitbereiche, Lastabtragung und Anschlüsse werden anhand des konkreten Systems geplant. Auch Werkstoffkontakte und ankommendes Wasser gehören zur Prüfung.`,
      transfer: { frage: `Eine ${zahl(laenge)} m lange Bahn hat bei der Montage 10 °C und später 70 °C Bauteiltemperatur. Mit α = 0,022 mm/(m·K): Wie groß ist ihre freie Längenänderung in mm?`, wert: alpha * laenge * 60, einheit: "mm", toleranz: .005, erklaerung: "Die Temperaturänderung ergibt sich hier erst aus zwei Bauteiltemperaturen: 70 − 10 = 60 K. Sie wird mit Länge und vorgegebenem Koeffizienten multipliziert." },
    };
  }
  if (id === "fassade") {
    const breite = [8, 10, 12][v], hoehe = [3, 4, 4][v], fensterBreite = [2, 2, 3][v], fensterHoehe = [1.5, 2, 2][v], plattenFlaeche = .5, reserve = .1;
    const brutto = breite * hoehe, oeffnung = fensterBreite * fensterHoehe, netto = brutto - oeffnung, grundbedarf = netto / plattenFlaeche, bestellung = aufrunden(grundbedarf * (1 + reserve));
    return {
      parameter: { breite, hoehe, fensterBreite, fensterHoehe, plattenFlaeche, reserve },
      angaben: [`Rechteckige Wandfläche ${zahl(breite)} m × ${zahl(hoehe)} m`, `Eine Fensteröffnung ${zahl(fensterBreite)} m × ${zahl(fensterHoehe)} m wird in dieser Geometrieübung vollständig abgezogen`, "Angenommene nutzbare Plattenfläche 0,50 m²; ausdrücklich 10 % Reserve; ganze Bestellmenge am Ende aufrunden", "Vorgesehene hinterlüftete Bekleidung: Am Fenster ist der Luftweg durch Restmaterial verstopft"],
      svg: skizze("Fassadenansicht mit Fenster", '<rect x="100" y="35" width="440" height="170"/><rect x="260" y="85" width="125" height="80"/><path d="M100 220H540M85 35V205"/>', [`Wand B = ${zahl(breite)} m, H = ${zahl(hoehe)} m`, `Fenster b = ${zahl(fensterBreite)} m, h = ${zahl(fensterHoehe)} m`, "Ansicht ohne Maßstab; Abzug der Öffnung ist eine Vorgabe dieser Übung."]),
      geometrie: [s("brutto", "Gesamte Wandfläche", brutto, "m²", "Abrutto = B × H"), s("oeffnung", "Fensterfläche", oeffnung, "m²", "AF = b × h"), s("netto", "Geometrische Bekleidungsfläche", netto, "m²", "Anetto = Abrutto − AF", 2, "brutto")],
      menge: [s("grundbedarf", "Grundbedarf an Platten", grundbedarf, "Stück", "N₀ = Anetto / APlatte", 0, "netto"), s("bestellung", "Ganze Platten mit Reserve", bestellung, "Stück", "N = aufrunden(N₀ × 1,10)", 0, "grundbedarf")],
      geometrieAuftrag: "Berechne Wandfläche, Fensterfläche und geometrische Nettofläche nach dem ausdrücklich vorgegebenen Öffnungsabzug.",
      mengenAuftrag: "Ermittle Grundbedarf und die ganze Bestellmenge mit 10 % Reserve. Profile und Unterkonstruktion werden nicht als Platten mitgezählt.",
      geometrieHinweis: "Die Fensterfläche ist ein eigenes Rechteck. Die Aufgabenannahme zum Abzug ersetzt keine vertragliche Aufmaßregel.", mengenHinweis: "Teile die Nettofläche durch die nutzbare Fläche einer Platte. Den Zuschlag auf die Menge anwenden und erst danach auf ganze Platten aufrunden.",
      geometrieErklaerung: `${zahl(brutto)} m² Wandfläche minus ${zahl(oeffnung)} m² Öffnung ergeben ${zahl(netto)} m² geometrische Bekleidungsfläche.`,
      mengenErklaerung: `${zahl(netto)} / 0,50 ergeben ${zahl(grundbedarf, 0)} Platten ohne Zuschlag. Mit 10 % Reserve werden ${zahl(bestellung, 0)} ganze Platten eingeplant.`,
      muster: `Die geometrische Fläche beträgt ${zahl(netto)} m². Aus der angenommenen nutzbaren Plattenfläche entstehen ${zahl(grundbedarf, 0)} Platten Grundbedarf und mit Reserve ${zahl(bestellung, 0)} Stück Bestellung. Diese Zahl enthält keine Unterkonstruktion, Befestigung oder Anschlussprofile. Am Fenster müssen die vorgesehenen Luftwege frei bleiben und Wasser kontrolliert nach außen geführt werden.`,
      transfer: { frage: `Ein Nachtrag betrifft eine Wand von ${zahl(breite)} m × ${zahl(hoehe)} m mit ZWEI gleich großen Fenstern von jeweils ${zahl(fensterBreite)} m × ${zahl(fensterHoehe)} m. Beide Öffnungen werden laut Auftrag abgezogen. Wie groß ist die geometrische Nettofläche in m²?`, wert: brutto - 2 * oeffnung, einheit: "m²", toleranz: .005, erklaerung: "Im veränderten Auftrag werden zwei Öffnungen berücksichtigt. Erst beide Fensterflächen addieren und dann von der gesamten Wandfläche abziehen." },
    };
  }
  throw new Error("Dieser Prüfungsfall ist nicht vorhanden.");
}

const praxis: Record<string, PruefungsFall["praxis"]> = {
  ziegeldach: {
    werkzeuge: ["Maßband oder Gliedermaßstab", "Winkel und Richtlatte", "Markiermittel und Richtschnur", "Produktabhängige Werkzeuge nach Arbeitsauftrag"],
    material: ["Vorgesehene Dachziegel und Sonderteile", "Abgestimmte Unterkonstruktion", "Systemgerechte Befestigung", "Material für betroffene Funktionsebenen und Anschlüsse"],
    sicherheit: ["Arbeitsplatz, Zugang und Absturz-/Durchsturzschutz abstimmen", "Lasten, Transport und Lagerflächen planen", "Werkzeugzustand und sichere Bearbeitung prüfen"],
    kontrolle: ["Tatsächliche Maße mit Plan vergleichen", "Deckmaße und Einteilung am gewählten Produkt prüfen", "Wasserwege, Anschlüsse und Befestigung kontrollieren", "Ausführung und Abweichungen dokumentieren"],
    gespraech: ["Warum ist die Grundfläche hier kleiner als die geneigte Dachfläche?", "Welche Angaben fehlen für eine reale Ziegelbestellung?", "Wie kontrollierst du Deckmaße und Einteilung?", "Welche Arbeitsschutzmaßnahmen klärst du vor dem Arbeitsbeginn?"],
  },
  flachdach: {
    werkzeuge: ["Maßband und Richtlatte", "Geeignetes Werkzeug zur Gefällekontrolle", "Markiermittel", "Systemabhängige Verarbeitungswerkzeuge nach Arbeitsauftrag"],
    material: ["Abgestimmter Schichtenaufbau", "Passende Flächen- und Anschlussabdichtung", "Zum System passende Ablauf- und Anschlussbauteile", "Vorgesehene Schutz- und Trennlagen"],
    sicherheit: ["Absturz- und Durchsturzgefährdungen abstimmen", "Wetter, Untergrund und sichere Lagerung prüfen", "Verarbeitungsabhängige Schutzmaßnahmen festlegen"],
    kontrolle: ["Höhen und Tiefpunkte mit Plan vergleichen", "Durchgehenden Abdichtungsanschluss prüfen", "Normale und zusätzlich geplante Wasserwege verfolgen", "Verbindungen und Ausführung dokumentieren"],
    gespraech: ["Warum bestimmt die Flächenrechnung noch keine Ablaufgröße?", "Was unterscheidet Attikaabdeckung und Abdichtungsanschluss?", "Wie erkennst du die Richtung des geplanten Wasserwegs?", "Welche Angaben brauchst du vor der Systemausführung zusätzlich?"],
  },
  sanierung: {
    werkzeuge: ["Dokumentationsbogen und Kamera", "Maßband und geeignete Messmittel", "Freigegebene Untersuchungsgeräte nach Arbeitsauftrag"],
    material: ["Für den tatsächlichen Aufbau abgestimmte Schichten", "Geplanter Dämmstoff", "Passende Anschluss- und Verbindungsmittel", "Material für betroffene Schutz- und Funktionsebenen"],
    sicherheit: ["Vorhandenen Aufbau und mögliche Gefährdungen vor Eingriffen klären", "Arbeitsplatz und sichere Zugänge abstimmen", "Untersuchungs- und Ausführungsschritte freigeben lassen"],
    kontrolle: ["Befund und vermutete Ursache getrennt dokumentieren", "Tatsächliche Schichten und Anschlüsse aufnehmen", "Anschlusskontinuität und Ausführungszustand prüfen", "Grenzen vereinfachter Wärme- und Mengenrechnung nennen"],
    gespraech: ["Was ist beobachtet und was bisher nur vermutet?", "Warum beweist ein Foto die Feuchteursache nicht?", "Wie unterscheiden sich R und U?", "Welche Anschlussfragen verändert eine zusätzliche Dämmschicht?"],
  },
  schiefer: {
    werkzeuge: ["Maßband und Markiermittel", "Richtschnur", "Zur Deckart passende Schieferwerkzeuge"],
    material: ["Vorgesehene Schieferplatten", "Passende Befestigungsmittel", "Material für abgestimmte Durchdringungsanschlüsse", "Material für betroffene Zusatzebene"],
    sicherheit: ["Arbeitsplatz und Absturz-/Durchsturzschutz abstimmen", "Bearbeitung und scharfe Kanten berücksichtigen", "Platten und Werkzeuge sicher lagern und transportieren"],
    kontrolle: ["Deckart, Format und tatsächlichen Bedarf prüfen", "Wasserweg oberhalb und seitlich der Durchdringung verfolgen", "Anschluss der Zusatzebene getrennt kontrollieren", "Befestigung und ausgeführte Details dokumentieren"],
    gespraech: ["Warum gilt die angenommene Plattenzahl nicht für jede Deckart?", "Wie leitest du Wasser um die Durchdringung?", "Welche Aufgabe hat der Anschluss der Zusatzebene?", "Warum wird die Bestellmenge erst am Ende aufgerundet?"],
  },
  metalldach: {
    werkzeuge: ["Maßband und Markiermittel", "Geeignete Blechschere", "Systemabhängige Falz- und Befestigungswerkzeuge"],
    material: ["Vorgesehene Metallbahnen", "Abgestimmte Fest- und Gleitbefestigungen", "Passende Anschlussprofile", "Systemgerechte Trenn- und Verbindungsmittel"],
    sicherheit: ["Scharfe Kanten und sichere Bearbeitung berücksichtigen", "Transport und Lagerung langer Bahnen planen", "Arbeitsplatz, Zugänge und Absturzschutz abstimmen"],
    kontrolle: ["Nutzbreite und tatsächliche Einteilung prüfen", "Festpunkt und Gleitbereiche mit Systemplan vergleichen", "Anschlussbewegung und Werkstoffkontakte kontrollieren", "Falze, Befestigung und Abweichungen dokumentieren"],
    gespraech: ["Was unterscheidet Nutzbreite und Zuschnittbreite?", "Warum ist die Bewegung in Millimetern keine gesamte Bahnlänge?", "Welche Aufgaben haben Festpunkt und Gleitbereiche?", "Warum gehören Werkstoffkontakte und ankommendes Wasser zur Planung?"],
  },
  fassade: {
    werkzeuge: ["Maßband und Markiermittel", "Wasserwaage und Richtlatte", "Zum Bekleidungssystem passende Bearbeitungs- und Befestigungswerkzeuge"],
    material: ["Geplante Bekleidungsplatten", "Abgestimmte Unterkonstruktion und Befestigung", "Vorgesehene Dämmung", "Fensteranschlussprofile und vorgesehene Lüftungsbauteile"],
    sicherheit: ["Arbeitsplatz und sichere Zugänge abstimmen", "Transport und Bearbeitung der Platten planen", "Werkzeuge und Befestigungsuntergrund prüfen"],
    kontrolle: ["Öffnung und Nettofläche nach Aufgabenannahme prüfen", "Vorgesehene Luftwege am Fenster frei halten", "Wasserführung und Anschlussdetails verfolgen", "Fugen, Befestigung und Ausführung dokumentieren"],
    gespraech: ["Welche Öffnungen zieht der konkrete Auftrag ab?", "Warum enthält die Plattenzahl noch keine Unterkonstruktion?", "Welche Funktion hat der vorgesehene Luftweg?", "Wie werden Wasserweg und Fensteranschluss zusammen betrachtet?"],
  },
};
function auswahl(id: string, quelle: AuswahlAktivitaet, kompetenzen: KompetenzId[], situation = quelle.situation): AuswahlTeil {
  return { id, typ: "auswahl", titel: quelle.titel, auftrag: `${situation} Wähle alle passenden Aussagen.`, kompetenzen, minuten: 3, hinweis: "Trenne die gegebenen Annahmen von Angaben, die noch geklärt werden müssen.", erklaerung: quelle.erklaerung, punkte: 2, optionen: quelle.optionen.map((o, i) => ({ id: `${id}-o${i + 1}`, text: o.text, richtig: o.korrekt })) };
}
export function erzeugePruefungsFall(id: string, variante = 0): PruefungsFall {
  const thema = FALL_THEMEN.find(t => t.id === id), projekt = BAUPROJEKTE.find(p => p.id === id);
  if (!thema || !projekt) throw new Error("Dieser Prüfungsfall ist nicht vorhanden.");
  if (!Number.isInteger(variante) || variante < 0 || variante > 2) throw new Error("Für diesen Prüfungsfall sind die Varianten 0, 1 und 2 verfügbar.");
  const m = mengenModell(id, variante);
  const auftrag = projekt.aktivitaeten.auftrag as AuswahlAktivitaet, befund = projekt.aktivitaeten.befund as AuswahlAktivitaet, massnahme = projekt.aktivitaeten.massnahme as AuswahlAktivitaet, ablauf = projekt.aktivitaeten.ablauf as ReihenfolgeAktivitaet;
  const befundText = id === "ziegeldach" ? `Ein Vorschlag setzt ${zahl(m.parameter.breite)} m × ${zahl(m.parameter.laenge)} m als gesamte Dachfläche an.` : befund.situation;
  const teile: FallTeil[] = [
    auswahl(`${id}-auftrag`, auftrag, ["plan"]),
    // A correct selection is evidence for interpreting the plan, not for drawing a detail.
    auswahl(`${id}-befund`, befund, ["plan"], befundText),
    { id: `${id}-geometrie`, typ: "rechnen", titel: id === "sanierung" ? "Wärmeschutz im vorgegebenen Modell" : "Maße und Geometrie auswerten", auftrag: m.geometrieAuftrag, kompetenzen: ["rechnen"], minuten: 7, hinweis: m.geometrieHinweis, erklaerung: m.geometrieErklaerung, schritte: m.geometrie },
    { id: `${id}-menge`, typ: "rechnen", titel: id === "metalldach" ? "Thermische Bewegung berechnen" : "Materialmenge bestimmen", auftrag: m.mengenAuftrag, kompetenzen: ["rechnen"], minuten: 5, hinweis: m.mengenHinweis, erklaerung: m.mengenErklaerung, schritte: m.menge },
    auswahl(`${id}-massnahme`, massnahme, ["material"]),
    { id: `${id}-ablauf`, typ: "reihenfolge", titel: ablauf.titel, auftrag: "Ordne die Arbeitsschritte für diesen Auftrag. Stelle prüfen und abstimmen vor die Ausführung.", kompetenzen: ["ablauf"], minuten: 4, hinweis: "Ein vollständiger Ablauf reicht von der Auftragsklärung bis zur dokumentierten Kontrolle.", erklaerung: ablauf.erklaerung, punkte: 4, schritte: ablauf.schritte.map((s, i) => ({ id: `${id}-ablauf-s${i + 1}`, text: s.text })) },
    { id: `${id}-zeichnung`, typ: "zeichnung", titel: "Ein Detail verständlich darstellen", auftrag: projekt.zeichnung.aufgabentext, kompetenzen: ["detail"], minuten: 7, hinweis: "Zeige die Funktionen mit klaren Linien, Beschriftungen und Wasser- beziehungsweise Bewegungswegen. Maßstäbliche Ausführung ist hier nicht verlangt.", erklaerung: "Die Zeichnung wird anhand der Vergleichskriterien selbst eingeschätzt; sie erhält keine automatische Fachnote.", kriterien: [...projekt.zeichnung.schritte], muster: "Ein möglicher schematischer Erklärweg ist in der Vergleichsskizze dargestellt. Andere fachlich passende Darstellungen sind möglich.", musterKurz: "Funktionen, Anschlüsse und Beschriftungen nachvollziehbar darstellen.", musterSvg: projekt.zeichnung.loesungSvg },
    { id: `${id}-erklaerung`, typ: "begruendung", titel: "Die Entscheidung selbst begründen", auftrag: "Erkläre die Ergebnisse und Grenzen dieses Auftrags einem Kollegen. Begründe die gewählte Maßnahme und nenne noch zu klärende Ausführungsangaben.", kompetenzen: ["erklaeren"], minuten: 5, hinweis: "Verbinde relevante Zahlen, die Funktion des Details und die Grenzen der Aufgabenannahmen. Einige verständliche Sätze genügen.", erklaerung: "Vergleiche deine eigene Erklärung mit den Kriterien. Andere richtige Formulierungen sind möglich; Textlänge oder einzelne Schlüsselwörter ergeben keine Fachnote.", kriterien: [...projekt.kriterien], muster: m.muster, musterKurz: `${m.geometrieErklaerung} ${m.mengenErklaerung}` },
  ];
  return { id, version: 1, familie: id, variante, titel: thema.titel, kurz: thema.kurz, auftrag: `${projekt.auftrag.split(" Die Zahlen")[0]} Bearbeite die folgenden acht Teilaufgaben mit den Angaben dieser Fallakte.`, angaben: m.angaben, svg: m.svg, parameter: m.parameter, teile, praxis: JSON.parse(JSON.stringify(praxis[id])) as PruefungsFall["praxis"], transfer: m.transfer };
}
