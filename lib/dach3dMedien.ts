import manifest from "@/content/dach3d-medien.json";
import studioManifest from "@/content/dach3d-studio-medien.json";
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
  if (typeof id !== "string" || id.length > 250 || !/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\.(?:glb|webp|png|jpe?g|ktx2|hdr)$/.test(id)) return false;
  const pfad = id.startsWith("v2/") ? id.slice(3) : id;
  if (pfad.endsWith(".hdr") && !id.startsWith("v2/gemeinsam/")) return false;
  const first = pfad.split("/")[0];
  return (DACH_VARIANTEN as readonly string[]).includes(first) || first === "gemeinsam";
}
export function gehoertDachAssetZu(id: string, form: DachForm): boolean {
  const pfad = id.startsWith("v2/") ? id.slice(3) : id;
  return pfad.startsWith(`${form}-`) || pfad.startsWith("gemeinsam/");
}
export function istMedienAsset(v: unknown): v is MedienAsset {
  return obj(v) && istDachMedienPfad(v.id) && v.url === (v.id.startsWith("v2/") ? `/dach-medien/${v.id}` : `${DACH_MEDIEN_PREFIX}${v.id}`) &&
    Number.isSafeInteger(v.bytes) && Number(v.bytes) > 0 && Number(v.bytes) <= 32 * 1024 * 1024 &&
    typeof v.sha256 === "string" && /^[a-f0-9]{64}$/.test(v.sha256) &&
    v.typ === (v.id.endsWith(".glb") ? "modell" : v.id.endsWith(".hdr") ? "umgebung" : "bild");
}
/** Validate authored metadata too: invalid releases never become imported URLs. */
export const DACH_MEDIEN: MedienAsset[] = (() => {
  const alt: unknown = manifest, studio: unknown = studioManifest;
  if (!obj(alt) || alt.version !== 1 || !Array.isArray(alt.assets) || !alt.assets.every(istMedienAsset) ||
      !obj(studio) || studio.version !== 2 || !Array.isArray(studio.assets) || !studio.assets.every(a => istMedienAsset(a) && a.id.startsWith("v2/"))) throw new Error("Das Verzeichnis der Dachmedien ist unvollständig.");
  const assets = [...alt.assets, ...studio.assets] as MedienAsset[];
  if (new Set(assets.map(a => a.id)).size !== assets.length || new Set(assets.map(a => a.url)).size !== assets.length) throw new Error("Das Verzeichnis der Dachmedien enthält doppelte Dateien.");
  return assets;
})();

export function dachDeckung(form: DachForm, deckung?: DachDeckung): DachDeckung {
  return form === "flachdach" ? "warmdach" : deckung === "biber-doppel" ? "biber-doppel" : "falzziegel";
}
export function dachVariante(form: DachForm, deckung?: DachDeckung): string {
  if (!DACH_FORMEN.includes(form)) throw new Error("Diese Dachform ist nicht verfügbar.");
  return `${form}-${dachDeckung(form, deckung)}`;
}
export function istDachMedienRef(v: unknown): v is DachMedienRef {
  if (!obj(v) || (v.version !== 1 && v.version !== 2) || !DACH_FORMEN.includes(v.form as DachForm) || !views.includes(v.ansicht as DachAnsicht) || typeof v.detailId !== "string") return false;
  const d = getDachDetail(v.detailId);
  return !!d && d.formen.includes(v.form as DachForm) && dachDeckung(v.form as DachForm, v.deckung as DachDeckung) === v.deckung;
}
export interface DachMedienSet {
  version: 1 | 2; modell?: MedienAsset; preview: string; hdPreview?: string; bilder: Record<DachAnsicht, string>;
  hdBilder: Partial<Record<DachAnsicht, string>>; fehler: string; hdFehler?: string; fehlerBild: string; hdFehlerBild?: string; assets: MedienAsset[];
}
export function dachMedien(form: DachForm, deckung?: DachDeckung, detailId?: string): DachMedienSet {
  const variante = dachVariante(form, deckung);
  if (detailId && !getDachDetail(detailId)?.formen.includes(form)) throw new Error("Dieses Detail gehört zu einer anderen Dachform.");
  const base = `${variante}/${detailId ? `${detailId}/` : ""}`;
  const studio = DACH_MEDIEN.some(a => a.id === `v2/${base}${detailId ? "modell" : "uebersicht"}.glb`);
  const version = studio ? 2 : 1;
  const ausgewaehlt = `${studio ? "v2/" : ""}${base}`;
  const modellId = `${studio ? "v2/" : ""}${base}${detailId ? "modell" : "uebersicht"}.glb`;
  const assets = DACH_MEDIEN.filter(a => a.id === modellId || !!detailId && a.id.startsWith(ausgewaehlt) || /^(?:v2\/)?gemeinsam\//.test(a.id));
  const preview = `/dach-vorschau/${studio ? "v2" : "v1"}/${variante}/${detailId ? `${detailId}-nah` : "uebersicht"}.webp`;
  const bilder = Object.fromEntries(views.map(view => [view, detailId ? `/dach-vorschau/v${version}/${variante}/${detailId}-${view}.webp` : preview])) as Record<DachAnsicht, string>;
  const hdBilder = Object.fromEntries(views.flatMap(view => { const a = DACH_MEDIEN.find(a => a.id === `${ausgewaehlt}${view}.webp`); return a ? [[view, a.url]] : []; })) as Partial<Record<DachAnsicht, string>>;
  const fehler = detailId ? `/dach-vorschau/v${version}/${variante}/${detailId}-fehler.webp` : preview;
  const hdFehler = DACH_MEDIEN.find(a => a.id === `${ausgewaehlt}fehler.webp`)?.url;
  const hdPreview = !detailId ? DACH_MEDIEN.find(a => a.id === `${studio ? "v2/" : ""}${base}uebersicht.webp`)?.url : undefined;
  return { version, modell: DACH_MEDIEN.find(a => a.id === modellId), preview, hdPreview, bilder, hdBilder,
    fehler, hdFehler, fehlerBild: fehler, hdFehlerBild: hdFehler, assets };
}
export interface DachPaket { id: DachForm; titel: string; assets: MedienAsset[]; bytes: number }
export function dachPakete(): DachPaket[] {
  return DACH_MODELLE.map(m => {
    const assets = DACH_MEDIEN.filter(a => gehoertDachAssetZu(a.id, m.id));
    return { id: m.id, titel: m.titel, assets, bytes: assets.reduce((s, a) => s + a.bytes, 0) };
  });
}
