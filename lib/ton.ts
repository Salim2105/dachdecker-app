import type { Bewertung } from "@/content/schema";
import { tonStore } from "@/lib/appStores";

/**
 * Kurzer Ton beim Prüfen einer Antwort — erzeugt, nicht geladen.
 *
 * Web Audio statt Audiodateien: keine Assets im Service-Worker-Cache, kein
 * Nachladen offline, keine Autoplay-Freischaltung nötig. Der AudioContext wird
 * erst beim ersten Tippen gebaut, und ein Tipp IST die Nutzergeste, die die
 * Browser verlangen.
 *
 * Nur für maschinell geprüfte Aufgaben — siehe lib/rueckmeldung.ts. Ein Ton auf
 * die Selbstbewertung würde das Drücken von "Richtig" belohnen.
 *
 * Leise (gain 0.05): Das hier ist eine Bestätigung, kein Jingle. Wer abends um
 * halb zehn im Bett übt, soll niemanden wecken — abschaltbar ist es zusätzlich.
 */
let ctx: AudioContext | null = null;

function hol(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  // Nach längerer Pause pausiert der Browser den Context von sich aus.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Ein Sinuston mit weicher Hüllkurve — harte Kanten klicken hörbar. */
function ton(c: AudioContext, hz: number, start: number, dauer: number, lautstaerke: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(hz, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(lautstaerke, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dauer + 0.02);
}

export function spieleTon(b: Bewertung): void {
  if (!tonStore.getSnapshot()) return;
  const c = hol();
  if (!c) return;
  const t = c.currentTime;

  try {
    if (b === "richtig") {
      // Zwei Töne aufwärts — die Terz, die man als "erledigt" hört.
      ton(c, 660, t, 0.09, 0.05);
      ton(c, 880, t + 0.075, 0.13, 0.05);
    } else if (b === "teilweise") {
      ton(c, 620, t, 0.12, 0.045);
    } else {
      // Abwärts und tiefer: unterscheidbar, ohne zu tadeln.
      ton(c, 300, t, 0.14, 0.04);
    }
  } catch {
    // Ton ist Zusatz, nie Zustandsträger — ein Fehler hier darf nichts anhalten.
  }
}
