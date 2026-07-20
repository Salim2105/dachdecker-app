import type { DrawAufgabe } from "@/content/schema";
import { getAufgaben, getLernfelder } from "@/lib/content";

/** Alle Zeichenaufgaben quer über alle Lernfelder, in Lernfeld-Reihenfolge. */
export function alleZeichenaufgaben(): DrawAufgabe[] {
  return getLernfelder()
    .flatMap((lf) => getAufgaben(lf.id))
    .filter((a): a is DrawAufgabe => a.typ === "draw");
}

export function zeichenaufgabenNachLernfeld(): { lernfeld: string; aufgaben: DrawAufgabe[] }[] {
  return getLernfelder()
    .map((lf) => ({
      lernfeld: lf.id,
      aufgaben: getAufgaben(lf.id).filter((a): a is DrawAufgabe => a.typ === "draw"),
    }))
    .filter((g) => g.aufgaben.length > 0);
}
