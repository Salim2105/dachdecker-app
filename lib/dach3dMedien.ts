import manifest from "@/content/dach3d-medien.json";
import { DACH_MODELLE, getDachDetail } from "@/lib/dach3dInhalte";
import type { DachAnsicht, DachDeckung, DachForm, DachMedienRef, MedienAsset } from "@/lib/dach3dTypen";

export const DACH_FORMEN: readonly DachForm[] = ["steildach", "walmdach", "flachdach"];
export const DACH_SCHICHTEN = ["deckung", "lattung", "zusatzebene", "daemmung", "luftdichtheit", "tragwerk"] as const;
export const DACH_VARIANTEN = ["steildach-falzziegel", "steildach-biber-doppel", "walmdach-falzziegel", "walmdach-biber-doppel", "flachdach-warmdach"] as const;
export const DACH_MEDIEN_PREFIX = "/dach-medien/v1/";
const views: readonly DachAnsicht[] = ["nah", "schnitt", "aufbau"];
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Only passive assets from our versioned, same-origin media directory. */
export function istDachMedienPfad(id: unknown): id is string {
  if (typeof id !== "string" || id.length > 250 || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*\.(?:glb|webp|png|jpe?g|ktx2)$/.test(id)) return false;
  const first = id.split("/")[0];
  return (DACH_VARIANTEN as readonly string[]).includes(first) || first === "gemeinsam";
}
export function istMedienAsset(v: unknown): v is MedienAsset {
  return obj(v) && istDachMedienPfad(v.id) && v.url === `${DACH_MEDIEN_PREFIX}${v.id}` &&
    Number.isSafeInteger(v.bytes) && Number(v.bytes) > 0 && Number(v.bytes) <= 32 * 1024 * 1024 &&
    typeof v.sha256 === "string" && /^[a-f0-9]{64}$/.test(v.sha256) &&
    v.typ === (v.id.endsWith(".glb") ? "modell" : "bild");
}
/** Validate authored metadata too: invalid releases never become imported URLs. */
export const DACH_MEDIEN: MedienAsset[] = (() => {
  const data: unknown = manifest;
  if (!obj(data) || data.version !== 1 || !Array.isArray(data.assets) || !data.assets.every(istMedienAsset) || new Set(data.assets.map(a => a.id)).size !== data.assets.length) throw new Error("Das Verzeichnis der Dachmedien ist unvollständig.");
  return data.assets;
})();

export function dachDeckung(form: DachForm, deckung?: DachDeckung): DachDeckung {
  return form === "flachdach" ? "warmdach" : deckung === "biber-doppel" ? "biber-doppel" : "falzziegel";
}
export function dachVariante(form: DachForm, deckung?: DachDeckung): string {
  if (!DACH_FORMEN.includes(form)) throw new Error("Diese Dachform ist nicht verfügbar.");
  return `${form}-${dachDeckung(form, deckung)}`;
}
export function istDachMedienRef(v: unknown): v is DachMedienRef {
  if (!obj(v) || v.version !== 1 || !DACH_FORMEN.includes(v.form as DachForm) || !views.includes(v.ansicht as DachAnsicht) || typeof v.detailId !== "string") return false;
  const d = getDachDetail(v.detailId);
  return !!d && d.formen.includes(v.form as DachForm) && dachDeckung(v.form as DachForm, v.deckung as DachDeckung) === v.deckung;
}
export interface DachMedienSet {
  modell?: MedienAsset; preview: string; bilder: Record<DachAnsicht, string>;
  hdBilder: Partial<Record<DachAnsicht, string>>; fehler: string; hdFehler?: string; fehlerBild: string; hdFehlerBild?: string; assets: MedienAsset[];
}
export function dachMedien(form: DachForm, deckung?: DachDeckung, detailId?: string): DachMedienSet {
  const variante = dachVariante(form, deckung);
  if (detailId && !getDachDetail(detailId)?.formen.includes(form)) throw new Error("Dieses Detail gehört zu einer anderen Dachform.");
  const base = `${variante}/${detailId ? `${detailId}/` : ""}`;
  const modellId = `${base}${detailId ? "modell" : "uebersicht"}.glb`;
  const assets = DACH_MEDIEN.filter(a => a.id === modellId || !!detailId && a.id.startsWith(base) || a.id.startsWith("gemeinsam/"));
  const preview = `/dach-vorschau/v1/${variante}/${detailId ? `${detailId}-nah` : "uebersicht"}.webp`;
  const bilder = Object.fromEntries(views.map(view => [view, detailId ? `/dach-vorschau/v1/${variante}/${detailId}-${view}.webp` : preview])) as Record<DachAnsicht, string>;
  const hdBilder = Object.fromEntries(views.flatMap(view => { const a = DACH_MEDIEN.find(a => a.id === `${base}${view}.webp`); return a ? [[view, a.url]] : []; })) as Partial<Record<DachAnsicht, string>>;
  const fehler = detailId ? `/dach-vorschau/v1/${variante}/${detailId}-fehler.webp` : preview;
  const hdFehler = DACH_MEDIEN.find(a => a.id === `${base}fehler.webp`)?.url;
  return { modell: DACH_MEDIEN.find(a => a.id === modellId), preview, bilder, hdBilder,
    fehler, hdFehler, fehlerBild: fehler, hdFehlerBild: hdFehler, assets };
}
export interface DachPaket { id: DachForm; titel: string; assets: MedienAsset[]; bytes: number }
export function dachPakete(): DachPaket[] {
  return DACH_MODELLE.map(m => {
    const assets = DACH_MEDIEN.filter(a => a.id.startsWith(`${m.id}-`) || a.id.startsWith("gemeinsam/"));
    return { id: m.id, titel: m.titel, assets, bytes: assets.reduce((s, a) => s + a.bytes, 0) };
  });
}
