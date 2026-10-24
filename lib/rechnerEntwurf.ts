import { appStorage, subscribeStorageStatus } from "@/lib/lernSpeicher";

export const RECHNER_KEY = "rechner-entwurf-v2";
export const RECHNER_TABS = [
  { id: "dach", label: "Dachneigung" }, { id: "grat", label: "Grat & Kehle" },
  { id: "gaube", label: "Gauben" }, { id: "uwert", label: "U-Wert" },
  { id: "wasser", label: "Entwässerung" }, { id: "metall", label: "Ausdehnung" },
  { id: "scharen", label: "Scharen & Hafte" }, { id: "material", label: "Material" },
] as const;
export type RechnerTab = typeof RECHNER_TABS[number]["id"];
export interface SchichtEntwurf { id: string; name: string; dickeCm: string; lambda: string }
export interface RechnerEntwurf { tab: RechnerTab; felder: Record<string, string>; schichten: SchichtEntwurf[] }
export const START_ENTWURF: RechnerEntwurf = {
  tab: "dach",
  felder: {
    neigung: "30", grundflaeche: "100", halbeBreite: "4", hoehe: "2.31", breite: "4",
    gratBreite: "4", gratNeigung: "30", feld1: "8", feld2: "6", kehlHoehe: "2.31",
    sges: "5", ue: "0.5", alpha: "45", beta: "15", wangeH: "1.2", wangeL: "1.2", firstL: "3", traufL: "1.5", gaubeSparren: "1.4",
    rsiId: "aufwaerts", regenspende: "300", wasserFlaeche: "200", beiwert: "1", leistung: "5",
    materialId: "titanzink", metallAlpha: "22", metallLaenge: "10", deltaT: "50",
    scharbreite: "0.52", hafte: "4", hafteEck: "6.4", dachlaenge: "12", nutzbreite: "0.525", deckbreite: "20", decklaenge: "34",
    materialFlaeche: "100", stueck: "12.5", verschnitt: "5",
  },
  schichten: [
    { id: "daemmung", name: "Zwischensparrendämmung", dickeCm: "20", lambda: "0.035" },
    { id: "holzfaser", name: "Holzfaserplatte", dickeCm: "2.4", lambda: "0.13" },
  ],
};

/** Auch unvollständige Zahlen bleiben als Text erhalten, damit Weiterarbeiten möglich ist. */
export function leseRechnerEntwurf(raw: string): RechnerEntwurf {
  if (!raw) return START_ENTWURF;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return START_ENTWURF;
    const d = data as Partial<RechnerEntwurf>;
    const felder = { ...START_ENTWURF.felder };
    if (d.felder && typeof d.felder === "object") for (const key of Object.keys(felder)) {
      if (typeof d.felder[key] === "string") felder[key] = d.felder[key];
    }
    const schichten = Array.isArray(d.schichten) && d.schichten.every((s) => s && [s.id, s.name, s.dickeCm, s.lambda].every((v) => typeof v === "string"))
      ? d.schichten : START_ENTWURF.schichten;
    const tab = RECHNER_TABS.some((t) => t.id === d.tab) ? d.tab! : "dach";
    return { tab, felder, schichten };
  } catch { return START_ENTWURF; }
}
const listeners = new Set<() => void>();
export const rechnerEntwurfStore = {
  getSnapshot: () => {
    if (typeof window === "undefined") return "";
    try { return appStorage.getItem(RECHNER_KEY) ?? ""; } catch { return ""; }
  },
  getServerSnapshot: () => "",
  subscribe(listener: () => void) {
    listeners.add(listener);
    const stop = subscribeStorageStatus(listener);
    window.addEventListener("storage", listener);
    return () => { listeners.delete(listener); stop(); window.removeEventListener("storage", listener); };
  },
  set(entwurf: RechnerEntwurf) {
    appStorage.setItem(RECHNER_KEY, JSON.stringify(entwurf));
    listeners.forEach((l) => l());
  },
};
