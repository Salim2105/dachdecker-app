import { ladeFortschritt, speichereBewertung, loescheFortschritt } from "@/lib/progress";
import type { AufgabenFortschritt, Bewertung } from "@/content/schema";

const EMPTY: Record<string, AufgabenFortschritt> = {};
let cache: Record<string, AufgabenFortschritt> | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): Record<string, AufgabenFortschritt> {
  if (typeof window === "undefined") return EMPTY;
  if (cache === undefined) cache = ladeFortschritt();
  return cache;
}

export const progressStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  getSnapshot,
  getServerSnapshot: () => EMPTY,
  bewerte(id: string, b: Bewertung) {
    speichereBewertung(id, b);
    cache = ladeFortschritt();
    listeners.forEach((l) => l());
  },
  zuruecksetzen() {
    loescheFortschritt();
    cache = ladeFortschritt();
    listeners.forEach((l) => l());
  },
};
