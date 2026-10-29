import { appStorage } from "@/lib/lernSpeicher";
import { erzeugePruefungsFall, FALL_THEMEN } from "@/lib/pruefungsFaelle";
import type { Bewertung } from "@/content/schema";
import type { OffenerTeil } from "@/lib/pruefungsVorbereitungTypen";
import { WERKSTATT_PRAXIS_THEMEN, werkstattPraxisBlatt } from "@/lib/werkstattPraxis";

export interface PraxisBlatt {
  thema: string; version: number; titel: string; auftrag: string; angaben: string[]; svg: string;
  werkzeuge: string[]; material: string[]; sicherheit: string[]; kontrolle: string[];
  gespraech: string[]; ablauf: string[]; zeichenAuftrag: string; zeichenKriterien: string[]; musterSvg: string;
}
export interface PraxisVorbereitungStand {
  version: 1; id: string; erstelltAm: number; aktualisiertAm: number; blatt: PraxisBlatt;
  planung: boolean; ausgefuehrt: boolean; rueckmeldungErfasst: boolean;
  werkzeugeText: string; materialText: string; ablaufText: string; notiz: string;
  erstePlanung: { werkzeuge: string; material: string; ablauf: string; am: number } | null;
  ausgefuehrtAm: string; ausfuehrungNotiz: string;
  rueckmeldung: { datum: string; name: string; rolle: string; text: string };
  kontrolliert: string[]; zeichnung?: Bewertung;
}
export const praxisVorbereitungKey = (thema: string) => `praxisvorbereitung-${thema}-v1`;
export const praxisKey = praxisVorbereitungKey;
/** Worksheet topics deliberately stay separate from the six exam families. */
export const PRAXIS_VORBEREITUNG_THEMEN: readonly { id: string; titel: string }[] = [...FALL_THEMEN, ...WERKSTATT_PRAXIS_THEMEN];
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 12000): v is string => typeof v === "string" && v.length <= max;
const texte = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 50 && v.every(s => text(s, 4000));
const zeit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const datum = (v: unknown): v is string => typeof v === "string" && (v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);

/** Imported worksheet snapshots never inject executable or linked SVG content. */
export function istPraxisSvg(v: unknown): v is string {
  if (!text(v, 100000) || typeof DOMParser === "undefined") return false;
  const doc = new DOMParser().parseFromString(v, "image/svg+xml");
  if (doc.querySelector("parsererror") || doc.documentElement.localName !== "svg") return false;
  const tags = new Set(["svg", "g", "path", "line", "polyline", "polygon", "rect", "circle", "ellipse", "text", "tspan", "title", "desc"]);
  const attrs = new Set(["xmlns", "viewBox", "width", "height", "role", "aria-label", "aria-hidden", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "d", "points", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry", "transform", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline", "dx", "dy", "id"]);
  for (const el of [doc.documentElement, ...doc.documentElement.querySelectorAll("*")]) {
    if (!tags.has(el.localName)) return false;
    for (const a of [...el.attributes]) if (!attrs.has(a.name) || /url\s*\(|javascript:|data:/i.test(a.value)) return false;
  }
  return true;
}
export function neuePraxisVorbereitung(thema: string, jetzt = Date.now()): PraxisVorbereitungStand {
  const vorlage = werkstattPraxisBlatt(thema);
  if (vorlage) return {
    version: 1, id: `praxis-${thema}-${globalThis.crypto.randomUUID()}`, erstelltAm: jetzt, aktualisiertAm: jetzt,
    blatt: JSON.parse(JSON.stringify(vorlage)), planung: false, ausgefuehrt: false, rueckmeldungErfasst: false,
    werkzeugeText: "", materialText: "", ablaufText: "", notiz: "", erstePlanung: null,
    ausgefuehrtAm: "", ausfuehrungNotiz: "", rueckmeldung: { datum: "", name: "", rolle: "", text: "" }, kontrolliert: [],
  };
  const fall = erzeugePruefungsFall(thema, 0);
  const zeichnung = fall.teile.find((t): t is OffenerTeil => t.typ === "zeichnung");
  const ablauf = fall.teile.find(t => t.typ === "reihenfolge");
  return {
    version: 1, id: `praxis-${thema}-${globalThis.crypto.randomUUID()}`, erstelltAm: jetzt, aktualisiertAm: jetzt,
    blatt: { thema: fall.id, version: fall.version, titel: fall.titel, auftrag: fall.auftrag, angaben: [...fall.angaben], svg: fall.svg,
      ...JSON.parse(JSON.stringify(fall.praxis)), ablauf: ablauf?.schritte.map(s => s.text) ?? [],
      zeichenAuftrag: zeichnung?.auftrag ?? "Skizziere das Detail und beschrifte die Funktionsebenen.",
      zeichenKriterien: zeichnung?.kriterien ?? [], musterSvg: zeichnung?.musterSvg ?? fall.svg },
    planung: false, ausgefuehrt: false, rueckmeldungErfasst: false,
    werkzeugeText: "", materialText: "", ablaufText: "", notiz: "", erstePlanung: null,
    ausgefuehrtAm: "", ausfuehrungNotiz: "", rueckmeldung: { datum: "", name: "", rolle: "", text: "" }, kontrolliert: [],
  };
}
export function parsePraxisVorbereitung(raw: string | null): PraxisVorbereitungStand | null {
  if (raw === null) return null;
  try {
    const s: unknown = JSON.parse(raw);
    if (!obj(s) || s.version !== 1 || !text(s.id, 300) || !s.id || !zeit(s.erstelltAm) || !zeit(s.aktualisiertAm) || !obj(s.blatt)) return null;
    const b = s.blatt;
    if (!PRAXIS_VORBEREITUNG_THEMEN.some(t => t.id === b.thema) || !Number.isInteger(b.version) || Number(b.version) < 1 ||
      ![b.titel,b.auftrag,b.zeichenAuftrag].every(v => text(v)) ||
      ![b.angaben,b.werkzeuge,b.material,b.sicherheit,b.kontrolle,b.gespraech,b.ablauf,b.zeichenKriterien].every(texte) ||
      !istPraxisSvg(b.svg) || !istPraxisSvg(b.musterSvg)) return null;
    if (![s.planung,s.ausgefuehrt,s.rueckmeldungErfasst].every(v => typeof v === "boolean") ||
      ![s.werkzeugeText,s.materialText,s.ablaufText,s.notiz,s.ausfuehrungNotiz].every(v => text(v)) ||
      !datum(s.ausgefuehrtAm) || !obj(s.rueckmeldung) || !datum(s.rueckmeldung.datum) ||
      ![s.rueckmeldung.name,s.rueckmeldung.rolle,s.rueckmeldung.text].every(v => text(v)) || !texte(s.kontrolliert) ||
      !s.kontrolliert.every(id => typeof id === "string" && /^kontrolle-\d+$/.test(id) && Number(id.slice(10)) < (b.kontrolle as string[]).length) ||
      new Set(s.kontrolliert).size !== s.kontrolliert.length ||
      s.zeichnung !== undefined && !["richtig","teilweise","falsch"].includes(String(s.zeichnung))) return null;
    if (s.erstePlanung !== null && (!obj(s.erstePlanung) || ![s.erstePlanung.werkzeuge,s.erstePlanung.material,s.erstePlanung.ablauf].every(v => text(v)) || !zeit(s.erstePlanung.am))) return null;
    if (s.planung && s.erstePlanung === null || s.rueckmeldungErfasst && !(s.rueckmeldung.text as string).trim()) return null;
    return s as unknown as PraxisVorbereitungStand;
  } catch { return null; }
}
export function ladePraxisVorbereitung(thema: string): PraxisVorbereitungStand | null {
  const s = parsePraxisVorbereitung(appStorage.getItem(praxisVorbereitungKey(thema)));
  return s?.blatt.thema === thema ? s : null;
}
export function speicherePraxisVorbereitung(s: PraxisVorbereitungStand): void {
  const key = praxisVorbereitungKey(s.blatt.thema), alt = appStorage.getItem(key);
  if (alt !== null && !parsePraxisVorbereitung(alt)) throw new Error("Der vorhandene Praxisstand ist nicht lesbar. Er bleibt erhalten; bitte zuerst eine vollständige Sicherung erstellen.");
  if (!parsePraxisVorbereitung(JSON.stringify(s))) throw new Error("Der Praxisstand ist unvollständig und wurde nicht gespeichert.");
  appStorage.setItem(key, JSON.stringify(s));
}
export function planungFesthalten(s: PraxisVorbereitungStand, jetzt = Date.now()): PraxisVorbereitungStand {
  return { ...s, planung: true, aktualisiertAm: jetzt, erstePlanung: s.erstePlanung ?? { werkzeuge: s.werkzeugeText, material: s.materialText, ablauf: s.ablaufText, am: jetzt } };
}
