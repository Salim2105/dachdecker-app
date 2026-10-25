import { appStorage } from "@/lib/lernSpeicher";
import packageInfo from "@/package.json";

export const FEEDBACK_KEY = "rueckmeldungen-v1";
export const FEEDBACK_KATEGORIEN = ["Erklärung", "Bedienung", "Rechnen", "Fehlender Inhalt"] as const;
export type FeedbackKategorie = typeof FEEDBACK_KATEGORIEN[number];
export type FeedbackAktion = "geteilt" | "kopiert" | "exportiert";
export interface FeedbackKontext { bereich: string; aufgabeId?: string; aufgabeText?: string }
export interface FeedbackEntwurf extends FeedbackKontext {
  id: string; appVersion: string; kategorie: FeedbackKategorie; beobachtung: string; erwartet: string; aufgabeAnhaengen: boolean;
}
export interface FeedbackEintrag { entwurf: FeedbackEntwurf; am: number; aktion: FeedbackAktion }
export interface FeedbackStand { version: 1; entwurf: FeedbackEntwurf; eintraege: FeedbackEintrag[]; entwuerfe: FeedbackEntwurf[] }
const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export function feedbackBereich(v: unknown): string {
  if (typeof v !== "string" || v.length > 500 || !/^\/(?:[a-zA-Z0-9/_-]*)(?:#[a-zA-Z0-9:_-]+)?$/.test(v) || v.startsWith("//")) return "/";
  return v;
}
const gueltigeId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9:_-]{1,180}$/.test(v);
export function feedbackKontext(search: string): FeedbackKontext {
  const params = new URLSearchParams(search);
  const aufgabeId = params.get("aufgabe");
  const frage = params.get("frage");
  return { bereich: feedbackBereich(params.get("bereich")),
    ...(gueltigeId(aufgabeId) ? { aufgabeId } : {}),
    ...(frage && frage.length <= 4000 ? { aufgabeText: frage } : {}) };
}
export function feedbackHref(bereich: string, aufgabeId?: string, aufgabeText?: string): string {
  const params = new URLSearchParams({ bereich: feedbackBereich(bereich) });
  if (gueltigeId(aufgabeId)) params.set("aufgabe", aufgabeId);
  if (aufgabeText && aufgabeText.length <= 4000) params.set("frage", aufgabeText);
  return `/rueckmeldung?${params.toString()}`;
}
export function neuerFeedbackEntwurf(kontext: FeedbackKontext = { bereich: "/" }): FeedbackEntwurf {
  return { ...kontext, bereich: feedbackBereich(kontext.bereich), id: globalThis.crypto.randomUUID(), appVersion: packageInfo.version,
    kategorie: "Erklärung", beobachtung: "", erwartet: "", aufgabeAnhaengen: false };
}
function istEntwurf(v: unknown): v is FeedbackEntwurf {
  return istObjekt(v) && gueltigeId(v.id) && typeof v.appVersion === "string" && /^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(v.appVersion) &&
    typeof v.bereich === "string" && feedbackBereich(v.bereich) === v.bereich && FEEDBACK_KATEGORIEN.includes(v.kategorie as FeedbackKategorie) &&
    typeof v.beobachtung === "string" && v.beobachtung.length <= 5000 && typeof v.erwartet === "string" && v.erwartet.length <= 5000 &&
    typeof v.aufgabeAnhaengen === "boolean" && (v.aufgabeId === undefined || gueltigeId(v.aufgabeId)) &&
    (v.aufgabeText === undefined || (typeof v.aufgabeText === "string" && v.aufgabeText.length <= 4000));
}
export function leseFeedback(raw: string | null, kontext: FeedbackKontext = { bereich: "/" }): FeedbackStand | null {
  if (raw === null) return { version: 1, entwurf: neuerFeedbackEntwurf(kontext), eintraege: [], entwuerfe: [] };
  try {
    const v: unknown = JSON.parse(raw);
    if (!istObjekt(v) || v.version !== 1 || !istEntwurf(v.entwurf) || !Array.isArray(v.eintraege) || !v.eintraege.every(e => istObjekt(e) && istEntwurf(e.entwurf) && typeof e.am === "number" && Number.isFinite(e.am) && e.am >= 0 && typeof e.aktion === "string" && ["geteilt", "kopiert", "exportiert"].includes(e.aktion)) || (v.entwuerfe !== undefined && (!Array.isArray(v.entwuerfe) || !v.entwuerfe.every(istEntwurf)))) return null;
    return { ...v, entwuerfe: v.entwuerfe ?? [] } as unknown as FeedbackStand;
  } catch { return null; }
}
export const ladeFeedback = (kontext?: FeedbackKontext) => leseFeedback(appStorage.getItem(FEEDBACK_KEY), kontext);
export function speichereFeedback(stand: FeedbackStand) {
  if (!leseFeedback(JSON.stringify(stand))) throw new Error("Ungültige Rückmeldung.");
  appStorage.setItem(FEEDBACK_KEY, JSON.stringify(stand));
}
export function feedbackFehler(d: FeedbackEntwurf): string | null {
  if (!d.beobachtung.trim()) return "Beschreibe kurz, was unverständlich war oder nicht funktioniert hat.";
  if (!d.erwartet.trim()) return "Beschreibe kurz, was du erwartet oder gebraucht hättest.";
  return null;
}
/** Only this explicit payload is shared: never other learning records or photos. */
export function feedbackPayload(d: FeedbackEntwurf) {
  return { format: "dachdecker-rueckmeldung", version: 1, appVersion: d.appVersion, bereich: d.bereich,
    ...(d.aufgabeId ? { aufgabeId: d.aufgabeId } : {}), kategorie: d.kategorie,
    beobachtung: d.beobachtung.trim(), erwartet: d.erwartet.trim(),
    ...(d.aufgabeAnhaengen && d.aufgabeText ? { aufgabenangabe: d.aufgabeText } : {}) };
}
export function feedbackText(d: FeedbackEntwurf): string {
  const p = feedbackPayload(d);
  return [`Rückmeldung zur Dachdecker-Lernwerkstatt ${p.appVersion}`, `Bereich: ${p.bereich}`,
    ...(p.aufgabeId ? [`Aufgabe: ${p.aufgabeId}`] : []), `Kategorie: ${p.kategorie}`, "",
    "Das war unverständlich oder hat nicht funktioniert:", p.beobachtung, "", "Das habe ich erwartet oder gebraucht:", p.erwartet,
    ...(p.aufgabenangabe ? ["", "Angehängte Aufgabenangabe:", p.aufgabenangabe] : [])].join("\n");
}
export function merkeFeedbackAktion(stand: FeedbackStand, aktion: FeedbackAktion, am = Date.now()): FeedbackStand {
  return { ...stand, eintraege: [{ entwurf: { ...stand.entwurf }, am, aktion }, ...stand.eintraege.filter(e => e.entwurf.id !== stand.entwurf.id)] };
}
/** Switching drafts never discards text that has not been shared yet. */
export function wechsleFeedbackEntwurf(stand: FeedbackStand, entwurf: FeedbackEntwurf): FeedbackStand {
  const bisher = stand.entwurf;
  const aufheben = bisher.id !== entwurf.id && (bisher.beobachtung.trim() || bisher.erwartet.trim());
  return { ...stand, entwurf, entwuerfe: [
    ...(aufheben ? [{ ...bisher }] : []),
    ...stand.entwuerfe.filter(d => d.id !== entwurf.id && d.id !== bisher.id),
  ] };
}
