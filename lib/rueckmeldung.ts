import type { Bewertung } from "@/content/schema";
import { spieleTon } from "@/lib/ton";

/**
 * Kurze Rückmeldung beim Prüfen einer Antwort: Vibration und Ton.
 *
 * Nur für maschinell geprüfte Aufgabentypen (mc, calc, cloze, diagram) — dort
 * vergleicht der Code gegen die hinterlegte Lösung, das Signal kann also nicht
 * beeinflussen, was es belohnt. Bei zeichnen und fachbegriff bewertet der
 * Nutzer sich selbst; ein Belohnungssignal auf diesen Klick würde genau das
 * Drücken von "Richtig" verstärken.
 *
 * `navigator.vibrate` fehlt auf iOS-Safari und auf dem Desktop. Das `?.` fängt
 * das ab: dort passiert nichts, und das ist in Ordnung — die Rückmeldung ist
 * ein Zusatzkanal, kein Zustandsträger. Der Zustand steht weiterhin sichtbar
 * in Farbe und Text.
 */
export function trefferRueckmeldung(b: Bewertung): void {
  if (typeof navigator === "undefined") return;

  // Ton hat einen eigenen Schalter — wer ihn ausmacht, will Ruhe, nicht weniger
  // Bewegung. Deshalb steht er vor der Bewegungs-Abfrage.
  spieleTon(b);

  // Wer Bewegung reduziert haben will, will in aller Regel auch keine Vibration.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  // Richtig: ein kurzer Tick. Falsch: zwei — als Muster unterscheidbar, ohne
  // hinzusehen. Das ist der Punkt, wenn das Handy neben einem auf der Bank liegt.
  navigator.vibrate?.(b === "richtig" ? 18 : b === "teilweise" ? [12, 60, 12] : [14, 70, 14, 70, 14]);
}

/** Klassenname für den kurzen Farbpuls auf der Aufgabenkarte. */
export function pulsKlasse(geprueft: boolean, b: Bewertung | null): string | undefined {
  if (!geprueft || b === null) return undefined;
  return b === "richtig" ? "puls-ok" : b === "falsch" ? "puls-bad" : "puls-teilweise";
}
