/**
 * Reine Rechenfunktionen für den Rechner-Screen.
 * Alle Winkel kommen und gehen in Grad, gerechnet wird intern im Bogenmaß.
 */

const RAD = Math.PI / 180;

/** Ungültige Modell-Eingaben liefern ausdrücklich kein numerisches Ergebnis. */
export class RechenFehler extends RangeError {
  constructor(message: string) { super(message); this.name = "RechenFehler"; }
}

function endlich(wert: number, name: string): number {
  if (!Number.isFinite(wert)) throw new RechenFehler(`${name}: Bitte eine endliche Zahl eingeben.`);
  return wert;
}
function positiv(wert: number, name: string): number {
  endlich(wert, name);
  if (wert <= 0) throw new RechenFehler(`${name}: Der Wert muss größer als 0 sein.`);
  return wert;
}
function nichtNegativ(wert: number, name: string): number {
  endlich(wert, name);
  if (wert < 0) throw new RechenFehler(`${name}: Der Wert darf nicht negativ sein.`);
  return wert;
}
function neigung(grad: number): number {
  nichtNegativ(grad, "Dachneigung");
  if (grad >= 90) throw new RechenFehler("Dachneigung: Bitte einen Winkel von 0° bis unter 90° eingeben.");
  return grad;
}
function ergebnis(wert: number): number { return endlich(wert, "Ergebnis außerhalb des Rechenbereichs"); }
/** Nur Rundungsrauschen direkt an ganzen Stückzahlen glätten (z. B. 7,000000000000001). */
function glatteGanzeZahl(wert: number): number {
  const gerundet = Math.round(wert);
  return Math.abs(wert - gerundet) <= Number.EPSILON * Math.max(1, Math.abs(wert)) * 4 ? gerundet : wert;
}
function anzahlAufrunden(wert: number): number {
  const anzahl = Math.ceil(glatteGanzeZahl(nichtNegativ(wert, "Stückzahl")));
  if (!Number.isSafeInteger(anzahl)) throw new RechenFehler("Stückzahl außerhalb des darstellbaren Bereichs.");
  return anzahl;
}

/** Wahre Dachfläche aus der Grundrissfläche: A_wahr = A_grund / cos α */
export function wahreDachflaeche(grundflaeche: number, neigungGrad: number): number {
  return ergebnis(positiv(grundflaeche, "Grundrissfläche") / Math.cos(neigung(neigungGrad) * RAD));
}

/** Sparrenlänge aus der halben Gebäudebreite: l = b / cos α */
export function sparrenlaenge(halbeBreite: number, neigungGrad: number): number {
  return ergebnis(positiv(halbeBreite, "Halbe Gebäudebreite") / Math.cos(neigung(neigungGrad) * RAD));
}

/** Firsthöhe über der Traufe: h = b · tan α */
export function firsthoehe(halbeBreite: number, neigungGrad: number): number {
  return ergebnis(positiv(halbeBreite, "Halbe Gebäudebreite") * Math.tan(neigung(neigungGrad) * RAD));
}

/** Dachneigung aus Höhe und waagerechter Länge: α = arctan(h / b) */
export function neigungAusMassen(hoehe: number, breite: number): number {
  return Math.atan(ergebnis(nichtNegativ(hoehe, "Höhe") / positiv(breite, "Waagerechte Länge"))) / RAD;
}

/** Umrechnung Grad → Prozent (100 % entspricht 45°). */
export function gradZuProzent(grad: number): number {
  return Math.tan(neigung(grad) * RAD) * 100;
}

export function prozentZuGrad(prozent: number): number {
  return Math.atan(nichtNegativ(prozent, "Neigung in Prozent") / 100) / RAD;
}

export interface Schicht {
  name: string;
  dickeCm: number;
  lambda: number;
}

/** Wärmedurchlasswiderstand der Schichten: R = Σ d/λ (d in Metern). */
export function waermedurchlasswiderstand(schichten: Schicht[]): number {
  if (schichten.length === 0) throw new RechenFehler("Bitte mindestens eine Schicht eingeben.");
  return ergebnis(schichten.reduce((summe, s, index) => {
    const name = `Schicht ${index + 1}`;
    return summe + positiv(s.dickeCm, `${name}, Dicke`) / 100 / positiv(s.lambda, `${name}, λ`);
  }, 0));
}

/**
 * Wärmedurchgangskoeffizient: U = 1 / (Rsi + R + Rse).
 * Rsi ist der innere, Rse der äußere Wärmeübergangswiderstand.
 */
export function uWert(r: number, rsi: number, rse: number): number {
  const gesamt = nichtNegativ(rsi, "Rsi") + nichtNegativ(r, "Schichtwiderstand") + nichtNegativ(rse, "Rse");
  return ergebnis(1 / positiv(gesamt, "Gesamtwiderstand"));
}

/** Wärmeübergangswiderstände nach Richtung des Wärmestroms (Richtwerte). */
export const RSI_WERTE = [
  { id: "aufwaerts", label: "Dach (Wärmestrom aufwärts)", rsi: 0.1 },
  { id: "horizontal", label: "Wand (Wärmestrom horizontal)", rsi: 0.13 },
  { id: "abwaerts", label: "Boden (Wärmestrom abwärts)", rsi: 0.17 },
];

export const RSE = 0.04;

/**
 * Regenwasserabfluss: Q = r · A · C / 10000
 * r = Regenspende in l/(s·ha), A = Fläche in m², C = Abflussbeiwert.
 */
export function regenwasserabfluss(regenspende: number, flaeche: number, abflussbeiwert: number): number {
  positiv(regenspende, "Regenspende"); positiv(flaeche, "Wirksame Fläche");
  nichtNegativ(abflussbeiwert, "Abflussbeiwert");
  if (abflussbeiwert > 1) throw new RechenFehler("Abflussbeiwert: Für dieses Modell gilt 0 bis 1.");
  return ergebnis((regenspende * flaeche * abflussbeiwert) / 10000);
}

/** Kapazitätsvergleich, kein vollständiger Entwässerungsnachweis. */
export function ablaufanzahl(abfluss: number, leistungJeAblauf: number): number {
  return anzahlAufrunden(nichtNegativ(abfluss, "Abfluss") / positiv(leistungJeAblauf, "Leistung je Ablauf"));
}

/**
 * Thermische Längenänderung: Δl = α · L · ΔT
 * alphaMikro ist der Ausdehnungskoeffizient in 10⁻⁶ 1/K, Ergebnis in Millimetern.
 */
export function laengenausdehnung(alphaMikro: number, laengeM: number, deltaT: number): number {
  return ergebnis(positiv(alphaMikro, "Ausdehnungskoeffizient") * 1e-6 * positiv(laengeM, "Länge") * endlich(deltaT, "Temperaturdifferenz") * 1000);
}

/** Richtwerte für den Ausdehnungskoeffizienten in 10⁻⁶ 1/K. */
export const AUSDEHNUNG = [
  { id: "titanzink", label: "Titanzink", alpha: 22 },
  { id: "kupfer", label: "Kupfer", alpha: 16.5 },
  { id: "aluminium", label: "Aluminium", alpha: 23.8 },
  { id: "edelstahl", label: "Edelstahl", alpha: 16 },
  { id: "stahl", label: "Stahl verzinkt", alpha: 12 },
];

/** Materialbedarf inklusive Verschnittzuschlag, aufgerundet auf ganze Stück. */
export function materialbedarf(
  flaeche: number,
  stueckProQm: number,
  verschnittProzent: number,
): number {
  return anzahlAufrunden(positiv(flaeche, "Dachfläche") * positiv(stueckProQm, "Stück je m²") * (1 + nichtNegativ(verschnittProzent, "Verschnitt") / 100));
}

// ---------- Dachgeometrie: Grat und Kehle (LF 13a) ----------

export interface Dachkoerper {
  /** Firsthöhe über der Traufe. */
  hoehe: number;
  /** Sparrenlänge in der Fläche. */
  sparren: number;
  /** Gratsparren — läuft schräg über die Ecke, ist darum länger. */
  grat: number;
  /** Neigung des Gratsparrens, immer flacher als die Dachneigung. */
  gratneigung: number;
}

/**
 * Walmdach mit gleicher Neigung in beiden Feldern.
 *
 * Der Gratsparren ist die Raumdiagonale über der Ecke: Er überwindet dieselbe
 * Höhe wie der Flächensparren, legt dafür aber einen längeren Weg zurück —
 * deshalb ist seine Neigung stets kleiner als die Dachneigung. Wer mit der
 * Dachneigung ablängt, schneidet zu kurz.
 */
export function gratsparren(halbeBreite: number, neigungGrad: number): Dachkoerper {
  positiv(halbeBreite, "Halbe Gebäudebreite");
  const a = neigung(neigungGrad) * RAD;
  const hoehe = halbeBreite * Math.tan(a);
  const sparren = halbeBreite / Math.cos(a);
  const grat = ergebnis(Math.hypot(halbeBreite, sparren));
  const gratneigung = grat > 0 ? Math.asin(hoehe / grat) / RAD : 0;
  return { hoehe, sparren, grat, gratneigung };
}

/**
 * Kehle zwischen zwei Dachflächen: k = √((f₁/2)² + (f₂/2)² + h²)
 *
 * Dieselbe Raumdiagonale wie beim Grat — nur nach innen. Bei gleich breiten
 * Feldern vereinfacht sich das zu √(2·(f/2)² + h²).
 */
export function kehle(feld1: number, feld2: number, hoehe: number): { laenge: number; neigung: number } {
  positiv(feld1, "Feld 1"); positiv(feld2, "Feld 2"); nichtNegativ(hoehe, "Firsthöhe");
  const laenge = ergebnis(Math.hypot(feld1 / 2, feld2 / 2, hoehe));
  return { laenge, neigung: laenge > 0 ? Math.asin(hoehe / laenge) / RAD : 0 };
}

// ---------- Gauben (LF 15, Buch S. 540–541) ----------

export interface Schleppgaube {
  /** Waagerechte Tiefe der Gaube. */
  tiefe: number;
  /** Höhe am Anschluss ans Hauptdach. */
  hoehe: number;
  /** Anschlusslänge der Gaubenwange am Hauptdach. */
  anschluss: number;
  /** Vordere Sichthöhe — was man von der Straße aus sieht. */
  sichthoehe: number;
  /** Fläche einer Wange (Dreieck). */
  wange: number;
}

/**
 * Schleppdachgaube.
 *
 * Die Gaubenhöhe folgt aus der HAUPTdachneigung, nicht aus der Gaubenneigung:
 * Wo die Gaube endet, ist das Hauptdach um t·tan α gestiegen. Die flachere
 * Gaubenneigung bestimmt nur, wie weit die Gaube nach vorn reicht.
 */
export function schleppgaube(
  sparrenGesamt: number,
  ueberstand: number,
  neigungHaupt: number,
  neigungGaube: number,
): Schleppgaube {
  positiv(sparrenGesamt, "Gesamtsparren"); nichtNegativ(ueberstand, "Überstand");
  neigung(neigungHaupt); neigung(neigungGaube);
  if (ueberstand >= sparrenGesamt) throw new RechenFehler("Überstand: Er muss kleiner als der Gesamtsparren sein.");
  if (neigungGaube >= neigungHaupt) throw new RechenFehler("Gaubenneigung: Sie muss in diesem Modell kleiner als die Hauptdachneigung sein.");
  const sStrich = sparrenGesamt - ueberstand;
  const tiefe = sStrich * Math.cos(neigung(neigungGaube) * RAD);
  const hoehe = tiefe * Math.tan(neigung(neigungHaupt) * RAD);
  const anschluss = ergebnis(Math.hypot(tiefe, hoehe));
  // h' ist die Höhe, die der Gaubensparren selbst überwindet.
  const hStrich = sStrich * Math.sin(neigung(neigungGaube) * RAD);
  const sichthoehe = hoehe - hStrich;
  return { tiefe, hoehe, anschluss, sichthoehe, wange: ergebnis(0.5 * sichthoehe * tiefe) };
}

export interface Satteldachgaube {
  /** Neigung des Hauptdachs, aus den Wangenmaßen abgeleitet. */
  neigung: number;
  /** Anschlusslänge der Wange am Hauptdach. */
  anschluss: number;
  /** Kehllänge zwischen Gaubendach und Hauptdach. */
  kehle: number;
  /** Winkel der Kehle gegen den First. */
  kehlwinkel: number;
  /** Dachfläche der Gaube, beide Seiten (zwei Trapeze). */
  dachflaeche: number;
}

/**
 * Satteldachgaube nach Buchbeispiel S. 541.
 *
 * First und Traufe der Gaube sind unterschiedlich lang — das Gaubendach ist
 * je Seite ein Trapez, und die Kehle läuft schräg über die Differenz.
 */
export function satteldachgaube(
  wangeHoehe: number,
  wangeLaenge: number,
  firstLaenge: number,
  traufLaenge: number,
  sparren: number,
): Satteldachgaube {
  positiv(wangeHoehe, "Wangenhöhe"); positiv(wangeLaenge, "Wangenlänge");
  positiv(firstLaenge, "Firstlänge"); positiv(traufLaenge, "Trauflänge"); positiv(sparren, "Gaubensparren");
  if (firstLaenge < traufLaenge) throw new RechenFehler("Firstlänge: Dieses Trapezmodell benötigt Firstlänge ≥ Trauflänge.");
  const neigung = Math.atan(wangeHoehe / wangeLaenge) / RAD;
  const anschluss = ergebnis(Math.hypot(wangeHoehe, wangeLaenge));
  const ueberstand = firstLaenge - traufLaenge;
  const kehleLaenge = ergebnis(Math.hypot(ueberstand, sparren));
  const kehlwinkel = ueberstand !== 0 ? Math.atan(sparren / ueberstand) / RAD : 90;
  return {
    neigung,
    anschluss,
    kehle: kehleLaenge,
    kehlwinkel,
    dachflaeche: ergebnis((firstLaenge + traufLaenge) * sparren),
  };
}

// ---------- Metalldeckung: Scharen und Hafte (LF 12) ----------

/**
 * Haftabstand: h = (1 / Scharbreite) / Hafte je m²
 *
 * Gedanke dahinter: 1 / Scharbreite ergibt die laufenden Meter Schar auf einem
 * Quadratmeter. Verteilt man die geforderten Hafte darauf, bleibt der Abstand.
 * Im Eckbereich sind mehr Hafte je m² vorgeschrieben — dort rückt der Abstand
 * entsprechend zusammen.
 */
export function haftabstand(scharbreite: number, hafteProQm: number): number {
  return ergebnis(1 / positiv(scharbreite, "Scharbreite") / positiv(hafteProQm, "Hafte je m²"));
}

/**
 * Scharen über die Dachlänge: volle Bahnen und die verbleibende Passbreite.
 * Die Passbreite verteilt sich auf beide Ortgänge, darum halbiert.
 */
export function scharen(
  dachlaenge: number,
  nutzbreite: number,
): { anzahl: number; passbreite: number } {
  positiv(dachlaenge, "Dachlänge"); positiv(nutzbreite, "Nutzbreite");
  if (nutzbreite > dachlaenge) throw new RechenFehler("Nutzbreite: Für diese Schareneinteilung darf sie die Dachlänge nicht überschreiten.");
  const anzahl = Math.floor(glatteGanzeZahl(dachlaenge / nutzbreite));
  if (!Number.isSafeInteger(anzahl)) throw new RechenFehler("Anzahl der Scharen außerhalb des darstellbaren Bereichs.");
  const rest = dachlaenge - anzahl * nutzbreite;
  const passbreite = Math.abs(rest) <= Number.EPSILON * dachlaenge * 4 ? 0 : rest / 2;
  return { anzahl, passbreite };
}

/** Ziegel je m² aus Deckbreite und Decklänge (beide in Zentimetern). */
export function ziegelProQm(deckbreiteCm: number, decklaengeCm: number): number {
  return ergebnis(10000 / positiv(deckbreiteCm, "Deckbreite") / positiv(decklaengeCm, "Decklänge"));
}

/** Zahl mit fester Nachkommastelle, deutsches Komma. */
export function zahl(wert: number, stellen = 2): string {
  if (!Number.isFinite(wert)) return "—";
  return wert.toFixed(stellen).replace(".", ",");
}
