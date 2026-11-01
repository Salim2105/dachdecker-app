import { getDachDetail } from "@/lib/dach3dInhalte";
import { dachMedien } from "@/lib/dach3dMedien";
import type { DachDeckung, DachForm, DachMedienRef } from "@/lib/dach3dTypen";
import type { WerkstattAnsicht, WerkstattEinheit } from "@/lib/werkstattTypen";

/** Only authored, applicable targets may replace an existing project hash. */
export function dachRoutenZiel(id: string): { form?: DachForm; detailId?: string } | null {
  if (id === "dach-entdecken") return {};
  const match = /^dach-(steildach|walmdach|flachdach)(?:-([gswfa]\d{2}))?$/.exec(id);
  if (!match) return null;
  const form = match[1] as DachForm, detailId = match[2];
  return !detailId || getDachDetail(detailId)?.formen.includes(form) ? { form, ...(detailId ? { detailId } : {}) } : null;
}

/** Optional context from a workshop link never changes a frozen question image. */
export function dachDeckungsWunsch(search: string, form?: DachForm): DachDeckung | undefined {
  const deckung = new URLSearchParams(search).get("deckung");
  if (!form) return undefined;
  return form === "flachdach" ? deckung === "warmdach" ? "warmdach" : undefined :
    deckung === "falzziegel" || deckung === "biber-doppel" ? deckung : undefined;
}

export function dachMedienRoute(medium: DachMedienRef): string {
  return `/projekte?deckung=${medium.deckung}#dach-${medium.form}-${medium.detailId}`;
}

const WERKSTATT_DETAILS: Record<string, string> = {
  messen: "g02", ziegel: "s01", laengen: "s01", breiten: "s01", wasser: "g06",
  verlegen: "s01", schnitt: "s06", bearbeiten: "s04", befestigen: "g05", kontrolle: "s01",
};
/** A contextual same-scene render complements the exact, dimensioned exercise drawing. */
export function werkstattDachMedium(e: Pick<WerkstattEinheit, "pfadId" | "slug">, ansicht: WerkstattAnsicht): DachMedienRef | null {
  const detailId = WERKSTATT_DETAILS[e.slug];
  if (!detailId) return null;
  return { form: "steildach", deckung: e.pfadId, detailId, ansicht: ansicht === "schnitt" ? "schnitt" : "nah", version: dachMedien("steildach", e.pfadId, detailId).version };
}

const LEKTIONS_DETAILS: Record<string, { form: DachForm; detailId: string }[]> = {
  "lf02-l01": [{ form: "steildach", detailId: "s04" }, { form: "walmdach", detailId: "w01" }],
  "lf02-l12": [{ form: "walmdach", detailId: "w03" }],
  "lf02-l13": [{ form: "steildach", detailId: "g06" }, { form: "flachdach", detailId: "f01" }],
  "lf02-l07": [{ form: "steildach", detailId: "g01" }],
  "lf02-l04": [{ form: "steildach", detailId: "g05" }],
  "lf02-l02": [{ form: "steildach", detailId: "s01" }],
  "lf02-l15": [{ form: "steildach", detailId: "s01" }],
  "lf02-l06": [{ form: "steildach", detailId: "g02" }],
  "lf02-l09": [{ form: "steildach", detailId: "s09" }],
  "lf08-l01": [{ form: "steildach", detailId: "g01" }],
  "lf08-l02": [{ form: "steildach", detailId: "g06" }],
  "lf08-l03": [{ form: "steildach", detailId: "g03" }],
  "lf08-l04": [{ form: "steildach", detailId: "g04" }],
  "lf08-l06": [{ form: "walmdach", detailId: "w04" }],
  "lf07-l01": [{ form: "steildach", detailId: "s03" }],
  "lf07-l09": [{ form: "steildach", detailId: "g06" }],
  "lf07-l06": [{ form: "flachdach", detailId: "f03" }],
  "lf07-l12": [{ form: "flachdach", detailId: "f04" }],
};
export function lernDachVerweise(lektionIds: readonly string[]) {
  const gesehen = new Set<string>();
  return lektionIds.flatMap(id => LEKTIONS_DETAILS[id] ?? []).filter(ref => {
    const key = `${ref.form}-${ref.detailId}`;
    if (gesehen.has(key)) return false;
    gesehen.add(key); return true;
  }).map(ref => ({ ...ref, titel: getDachDetail(ref.detailId)!.titel, href: `/projekte#dach-${ref.form}-${ref.detailId}` }));
}
