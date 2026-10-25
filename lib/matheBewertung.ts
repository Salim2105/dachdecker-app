import type { Bewertung } from "@/content/schema";
import type { ReviewResult } from "@/lib/review";

/** Called only when a learner submits a new answer, never while restoring one. */
export function neueMatheRueckmeldung(id: string, version: number, ziel: string, bewertung: Bewertung, hilfen: string[], versuchId = `mathe:${id}:${globalThis.crypto.randomUUID()}`): ReviewResult {
  return { ref: { quelle: "mathe", id, version, lernzielIds: [ziel] }, versuchId,
    bewertung, am: Date.now(), hilfen: [...hilfen], nachErklaerung: hilfen.includes("erklaerung") };
}
