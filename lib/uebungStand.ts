import { appStorage } from "@/lib/lernSpeicher";
import type { Aufgabe, Bewertung } from "@/content/schema";

interface Uebungsstand {
  index: number;
  ergebnisse: Bewertung[];
  beantwortet: boolean;
  nacharbeit: boolean;
  nacharbeitErgebnisse: Bewertung[];
}

function sindBewertungen(value: unknown): value is Bewertung[] {
  return Array.isArray(value) && value.every((b) => b === "richtig" || b === "teilweise" || b === "falsch");
}

// Gespeicherten Übungsstand laden (z. B. nach Abstecher zum Rechner).
function ladeStandFuerIds(key: string, ids: readonly string[]): Uebungsstand | null {
  if (typeof window !== "undefined") {
    try {
      const s = JSON.parse(appStorage.getItem(key) || "null");
      if (
        s && Number.isInteger(s.index) && s.index >= 0 &&
        Array.isArray(s.aufgabenIds) && s.aufgabenIds.length === ids.length &&
        s.aufgabenIds.every((id: unknown, i: number) => id === ids[i]) &&
        typeof s.beantwortet === "boolean" && sindBewertungen(s.ergebnisse)
      ) {
        // Ältere Stände ohne Nacharbeitsfelder bleiben für den ersten Durchgang gültig.
        const nacharbeit = s.nacharbeit ?? false;
        const nacharbeitErgebnisse = s.nacharbeitErgebnisse ?? [];
        const offen = s.ergebnisse.filter((b: Bewertung) => b !== "richtig").length;
        const beantwortete = s.index + (s.beantwortet ? 1 : 0);
        if (
          typeof nacharbeit === "boolean" && sindBewertungen(nacharbeitErgebnisse) &&
          (nacharbeit
            ? s.ergebnisse.length === ids.length && s.index < offen && nacharbeitErgebnisse.length === beantwortete
            : s.index < ids.length && s.ergebnisse.length === beantwortete && nacharbeitErgebnisse.length === 0)
        ) {
          return { index: s.index, ergebnisse: s.ergebnisse, beantwortet: s.beantwortet, nacharbeit, nacharbeitErgebnisse };
        }
      }
    } catch {}
  }
  return null;
}

export function ladeStand(key: string, aufgaben: Aufgabe[]): Uebungsstand | null {
  return ladeStandFuerIds(key, aufgaben.map((a) => a.id));
}

/** Liest nur den Sitzungsstand; die Startseite braucht keine Aufgabentexte. */
export function ladeSitzungsInfo(id: string) {
  if (typeof window === "undefined") return null;
  try {
    const key = `dd-session-${id}`;
    const s = JSON.parse(appStorage.getItem(key) || "null");
    if (!s || !Array.isArray(s.aufgabenIds) || !s.aufgabenIds.length ||
        !s.aufgabenIds.every((a: unknown) => typeof a === "string") ||
        new Set(s.aufgabenIds).size !== s.aufgabenIds.length) return null;
    const stand = ladeStandFuerIds(key, s.aufgabenIds);
    if (!stand) return null;
    return { index: stand.index, nacharbeit: stand.nacharbeit,
      total: stand.nacharbeit ? stand.ergebnisse.filter((b) => b !== "richtig").length : s.aufgabenIds.length };
  } catch { return null; }
}

export function leererStand(): Uebungsstand {
  return { index: 0, ergebnisse: [], beantwortet: false, nacharbeit: false, nacharbeitErgebnisse: [] };
}

/** Die feste Liste einer laufenden Sitzung wiederherstellen, bevor neu geplant wird. */
export function ladeGespeicherteAufgaben(key: string, pool: Aufgabe[]): Aufgabe[] | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(appStorage.getItem(key) || "null");
    if (!s || !Array.isArray(s.aufgabenIds) || s.aufgabenIds.length === 0 ||
        !s.aufgabenIds.every((id: unknown) => typeof id === "string") ||
        new Set(s.aufgabenIds).size !== s.aufgabenIds.length) return null;
    const nachId = new Map(pool.map((a) => [a.id, a]));
    const aufgaben: (Aufgabe | undefined)[] = s.aufgabenIds.map((id: string) => nachId.get(id));
    const vorhanden = aufgaben.filter((a): a is Aufgabe => a !== undefined);
    if (vorhanden.length !== aufgaben.length) return null;
    return ladeStand(key, vorhanden) ? vorhanden : null;
  } catch {
    return null;
  }
}
