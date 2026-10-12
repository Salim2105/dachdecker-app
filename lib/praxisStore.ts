import { createStringStore } from "@/lib/appStores";
import { PRAXISFAELLE, type PraxisFall } from "@/lib/praxis";

export interface PraxisStand {
  eingaben: string[];
  begruendung: string;
  geprueft: boolean;
  mitHilfe: boolean;
  selbstBewertung?: "richtig" | "teilweise" | "falsch";
}

export const praxisStore = createStringStore("praxis-v1");

export function lesePraxis(text: string): Record<string, PraxisStand> {
  try {
    const daten = JSON.parse(text);
    if (!daten || typeof daten !== "object" || Array.isArray(daten)) return {};
    const valid: Record<string, PraxisStand> = {};
    for (const fall of PRAXISFAELLE) {
      const s = daten[fall.id];
      if (!s || !Array.isArray(s.eingaben) || s.eingaben.length !== fall.rechnungen.length ||
          !s.eingaben.every((v: unknown) => typeof v === "string") || typeof s.begruendung !== "string") continue;
      const geprueft = s.geprueft === true && s.eingaben.every((v: string) => v.trim()) && !!s.begruendung.trim();
      valid[fall.id] = {
        eingaben: s.eingaben, begruendung: s.begruendung, geprueft, mitHilfe: s.mitHilfe === true,
        selbstBewertung: geprueft && ["richtig", "teilweise", "falsch"].includes(s.selbstBewertung) ? s.selbstBewertung : undefined,
      };
    }
    return valid;
  } catch { return {}; }
}

export function leererPraxisStand(fall: PraxisFall): PraxisStand {
  return { eingaben: fall.rechnungen.map(() => ""), begruendung: "", geprueft: false, mitHilfe: false };
}

export function speicherePraxis(id: string, stand: PraxisStand) {
  praxisStore.set(JSON.stringify({ ...lesePraxis(praxisStore.getSnapshot()), [id]: stand }));
}
