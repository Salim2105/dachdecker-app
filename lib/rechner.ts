/**
 * Reine Rechenfunktionen für den Rechner-Screen.
 * Alle Winkel kommen und gehen in Grad, gerechnet wird intern im Bogenmaß.
 */

const RAD = Math.PI / 180;

/** Dachneigungen ab 90° sind physikalisch keine Dachfläche mehr. */
function begrenzeNeigung(grad: number): number {
  return Math.min(Math.max(grad, 0), 89.9);
}

/** Wahre Dachfläche aus der Grundrissfläche: A_wahr = A_grund / cos α */
export function wahreDachflaeche(grundflaeche: number, neigungGrad: number): number {
  return grundflaeche / Math.cos(begrenzeNeigung(neigungGrad) * RAD);
}

/** Sparrenlänge aus der halben Gebäudebreite: l = b / cos α */
export function sparrenlaenge(halbeBreite: number, neigungGrad: number): number {
  return halbeBreite / Math.cos(begrenzeNeigung(neigungGrad) * RAD);
}

/** Firsthöhe über der Traufe: h = b · tan α */
export function firsthoehe(halbeBreite: number, neigungGrad: number): number {
  return halbeBreite * Math.tan(begrenzeNeigung(neigungGrad) * RAD);
}

/** Dachneigung aus Höhe und waagerechter Länge: α = arctan(h / b) */
export function neigungAusMassen(hoehe: number, breite: number): number {
  if (breite === 0) return 90;
  return Math.atan(hoehe / breite) / RAD;
}

/** Umrechnung Grad → Prozent (100 % entspricht 45°). */
export function gradZuProzent(grad: number): number {
  return Math.tan(begrenzeNeigung(grad) * RAD) * 100;
}

export function prozentZuGrad(prozent: number): number {
  return Math.atan(prozent / 100) / RAD;
}

export interface Schicht {
  name: string;
  dickeCm: number;
  lambda: number;
}

/** Wärmedurchlasswiderstand der Schichten: R = Σ d/λ (d in Metern). */
export function waermedurchlasswiderstand(schichten: Schicht[]): number {
  return schichten.reduce((summe, s) => {
    if (s.lambda <= 0 || s.dickeCm <= 0) return summe;
    return summe + s.dickeCm / 100 / s.lambda;
  }, 0);
}

/**
 * Wärmedurchgangskoeffizient: U = 1 / (Rsi + R + Rse).
 * Rsi ist der innere, Rse der äußere Wärmeübergangswiderstand.
 */
export function uWert(r: number, rsi: number, rse: number): number {
  const gesamt = rsi + r + rse;
  return gesamt > 0 ? 1 / gesamt : 0;
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
  return (regenspende * flaeche * abflussbeiwert) / 10000;
}

/**
 * Thermische Längenänderung: Δl = α · L · ΔT
 * alphaMikro ist der Ausdehnungskoeffizient in 10⁻⁶ 1/K, Ergebnis in Millimetern.
 */
export function laengenausdehnung(alphaMikro: number, laengeM: number, deltaT: number): number {
  return alphaMikro * 1e-6 * laengeM * deltaT * 1000;
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
  return Math.ceil(flaeche * stueckProQm * (1 + verschnittProzent / 100));
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
  const a = begrenzeNeigung(neigungGrad) * RAD;
  const hoehe = halbeBreite * Math.tan(a);
  const sparren = halbeBreite / Math.cos(a);
  const grat = Math.sqrt(halbeBreite ** 2 + sparren ** 2);
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
  const laenge = Math.sqrt((feld1 / 2) ** 2 + (feld2 / 2) ** 2 + hoehe ** 2);
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
  const sStrich = Math.max(0, sparrenGesamt - ueberstand);
  const tiefe = sStrich * Math.cos(begrenzeNeigung(neigungGaube) * RAD);
  const hoehe = tiefe * Math.tan(begrenzeNeigung(neigungHaupt) * RAD);
  const anschluss = Math.sqrt(tiefe ** 2 + hoehe ** 2);
  // h' ist die Höhe, die der Gaubensparren selbst überwindet.
  const hStrich = Math.sqrt(Math.max(0, sStrich ** 2 - tiefe ** 2));
  const sichthoehe = Math.max(0, hoehe - hStrich);
  return { tiefe, hoehe, anschluss, sichthoehe, wange: 0.5 * sichthoehe * tiefe };
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
  const neigung = wangeLaenge > 0 ? Math.atan(wangeHoehe / wangeLaenge) / RAD : 0;
  const anschluss = Math.sqrt(wangeHoehe ** 2 + wangeLaenge ** 2);
  const ueberstand = firstLaenge - traufLaenge;
  const kehleLaenge = Math.sqrt(ueberstand ** 2 + sparren ** 2);
  const kehlwinkel = ueberstand !== 0 ? Math.atan(sparren / ueberstand) / RAD : 90;
  return {
    neigung,
    anschluss,
    kehle: kehleLaenge,
    kehlwinkel,
    dachflaeche: 2 * (0.5 * (firstLaenge + traufLaenge) * sparren),
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
  if (scharbreite <= 0 || hafteProQm <= 0) return 0;
  return 1 / scharbreite / hafteProQm;
}

/**
 * Scharen über die Dachlänge: volle Bahnen und die verbleibende Passbreite.
 * Die Passbreite verteilt sich auf beide Ortgänge, darum halbiert.
 */
export function scharen(
  dachlaenge: number,
  nutzbreite: number,
): { anzahl: number; passbreite: number } {
  if (nutzbreite <= 0) return { anzahl: 0, passbreite: 0 };
  const anzahl = Math.floor(dachlaenge / nutzbreite);
  return { anzahl, passbreite: (dachlaenge - anzahl * nutzbreite) / 2 };
}

/** Ziegel je m² aus Deckbreite und Decklänge (beide in Zentimetern). */
export function ziegelProQm(deckbreiteCm: number, decklaengeCm: number): number {
  if (deckbreiteCm <= 0 || decklaengeCm <= 0) return 0;
  return 10000 / (deckbreiteCm * decklaengeCm);
}

/** Zahl mit fester Nachkommastelle, deutsches Komma. */
export function zahl(wert: number, stellen = 2): string {
  if (!Number.isFinite(wert)) return "—";
  return wert.toFixed(stellen).replace(".", ",");
}
