import type { AufgabenFortschritt } from "@/content/schema";

export const istObjekt = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const istZeit = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const istBewertung = (v: unknown) => v === "richtig" || v === "teilweise" || v === "falsch";

export function istFortschritt(v: unknown, id: string): v is AufgabenFortschritt {
  if (["__proto__", "constructor", "prototype"].includes(id)) return false;
  if (!istObjekt(v) || v.aufgabeId !== id || !istBewertung(v.bewertung) || !istZeit(v.gesehenAm) ||
      !istZeit(v.faelligAm) || !istZeit(v.intervallTage)) return false;
  return v.verlauf === undefined || Array.isArray(v.verlauf) && v.verlauf.every((eintrag: unknown) =>
    istObjekt(eintrag) && istZeit(eintrag.am) && istBewertung(eintrag.bewertung) &&
    ["mitHilfe", "selbstBewertet", "nachErklaerung"].every((key) => eintrag[key] === undefined || typeof eintrag[key] === "boolean"));
}
