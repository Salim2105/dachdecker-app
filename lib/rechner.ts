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

/** Zahl mit fester Nachkommastelle, deutsches Komma. */
export function zahl(wert: number, stellen = 2): string {
  if (!Number.isFinite(wert)) return "—";
  return wert.toFixed(stellen).replace(".", ",");
}
