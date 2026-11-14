import type { Aufgabe } from "@/content/schema";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { getCurriculum } from "@/lib/curriculum";
import { getGlossar } from "@/lib/glossar";
import { MATHE_EINHEITEN } from "@/lib/matheGrundlagen";
import { AUFBAU_EINHEITEN } from "@/lib/matheAufbau";
import { DEUTSCH_EINHEITEN, ENGLISCH_EINHEITEN } from "@/lib/sprachWerkstatt";
import { BILD_AUFGABEN } from "@/lib/bildtraining";
import { BAUPROJEKTE } from "@/lib/bauprojekte";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import { DACH_DETAILS, getDachModell } from "@/lib/dach3dInhalte";
import { PRAXIS_VIDEOS } from "@/lib/praxisVideoInhalte";
import { praxisVideoMedien } from "@/lib/praxisVideoMedien";

export const THEMEN_ARTEN = {
  erklaerung: "Erklärung", aufgabe: "Aufgaben", begriff: "Fachbegriff", mathe: "Fachmathe",
  sprache: "Sprache", bild: "Bildtraining", handwerk: "Handwerk", dach: "3D-Dach", film: "Film", projekt: "Projekt",
} as const;
export type ThemenArt = keyof typeof THEMEN_ARTEN;
export interface ThemenTreffer {
  id: string; titel: string; beschreibung: string; art: ThemenArt; bereich: string; href: string;
  lernzielIds: string[]; lfIds: string[];
}
interface SuchEintrag { treffer: ThemenTreffer; titel: string; woerter: string[]; text: string }
let index: SuchEintrag[] | undefined;

/** The index contains published learning content only, never answers or device data. */
export function normalisiereThemenSuche(text: string): string {
  return text.toLocaleLowerCase("de-DE").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(?:flk|fluessigkunststoff\w*|fluessigabdichtung\w*)\b/g, "fluessigabdichtung")
    .replace(/\b(?:anriss|anreissen|anzeichnen)\b/g, "anzeichnen")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
const kurz = (text: string, maximal = 210) => {
  const sauber = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return sauber.length > maximal ? `${sauber.slice(0, maximal).replace(/\s+\S*$/, "")} …` : sauber;
};
function aufgabenText(a: Aufgabe): string {
  if ("frage" in a) return a.frage;
  if ("aufgabentext" in a) return a.aufgabentext;
  if (a.typ === "cloze") return a.text.replace(/\{\{.*?\}\}/g, "[Lücke]");
  return a.begriff;
}

function baueIndex(): SuchEintrag[] {
  const ergebnis: SuchEintrag[] = [];
  const veroeffentlichteFragen = new Set<string>();
  const add = (treffer: ThemenTreffer, ...texte: string[]) => {
    const titel = normalisiereThemenSuche(treffer.titel);
    const text = normalisiereThemenSuche([treffer.titel, treffer.beschreibung, treffer.bereich, ...texte].join(" "));
    ergebnis.push({ treffer, titel, text, woerter: [...new Set(text.split(" "))] });
  };
  for (const lf of getLernfelder()) {
    const bereich = `${lf.nr.startsWith("A") || lf.id === "wiso" ? lf.nr : `LF${lf.nr}`} · ${lf.titel}`;
    const einheiten = getCurriculum(lf.id)?.kapitel.flatMap(k => k.einheiten) ?? [];
    const aufgaben = getAufgaben(lf.id), sichtbar = new Map(aufgaben.map(a => [a.id, a]));
    const verknuepft = new Set(einheiten.flatMap(e => e.aufgabenIds));
    add({ id: `lernfeld:${lf.id}`, titel: bereich, beschreibung: lf.themen.join(" · "), art: "erklaerung", bereich: "Lernfelder", href: `/lernen/${lf.id}?ansicht=uebersicht`, lernzielIds: [], lfIds: [lf.id] });
    for (const e of einheiten) {
      // A chapter may cover several subjects; its name is not evidence that
      // every child unit explains each of them.
      add({ id: `einheit:${e.id}`, titel: e.titel, beschreibung: e.lernziel, art: "erklaerung", bereich, href: `/lernen/${lf.id}#${e.id}`, lernzielIds: [e.id], lfIds: [lf.id] }, ...e.textschritte);
      const fragen = e.aufgabenIds.flatMap(id => { const a = sichtbar.get(id); return a ? [a] : []; });
      for (const a of fragen) {
        if (veroeffentlichteFragen.has(a.id)) continue;
        veroeffentlichteFragen.add(a.id);
        add({ id: `frage:${e.id}:${a.id}`, titel: kurz(aufgabenText(a), 150), beschreibung: `Kontrollfrage zu „${e.titel}“`, art: "aufgabe", bereich,
          href: `/lernen/${lf.id}?schritt=kontrollfragen&aufgabe=${encodeURIComponent(a.id)}#${e.id}`, lernzielIds: [e.id], lfIds: [lf.id] }, a.thema, e.titel);
      }
    }
    // Questions outside the short units lead to a named, deterministic topic pool.
    const themen = new Map<string, Aufgabe[]>();
    for (const a of aufgaben.filter(a => !verknuepft.has(a.id))) themen.set(a.thema, [...(themen.get(a.thema) ?? []), a]);
    for (const [thema, fragen] of themen) add({ id: `fragenpool:${lf.id}:${thema}`, titel: `Aufgaben zu ${thema}`, beschreibung: `${fragen.length} Aufgaben im Themenpool ${bereich}.`, art: "aufgabe", bereich,
      href: `/lernen/${lf.id}/ueben?thema=${encodeURIComponent(thema)}`, lernzielIds: [], lfIds: [lf.id] }, ...fragen.map(aufgabenText));
  }
  for (const b of getGlossar()) add({ id: `begriff:${b.id}`, titel: b.begriff, beschreibung: b.einfach, art: "begriff", bereich: "Fachbegriffe", href: `/fachbegriffe#${encodeURIComponent(b.id)}`, lernzielIds: [], lfIds: b.lernfelder }, ...b.aliases, b.beispiel);
  for (const e of [...MATHE_EINHEITEN, ...AUFBAU_EINHEITEN]) add({ id: `mathe:${e.id}`, titel: e.titel, beschreibung: e.ziel, art: "mathe", bereich: "Fachmathe", href: `/grundlagen/mathe#${e.id}`, lernzielIds: [e.id], lfIds: [] }, e.text, e.merksatz);
  for (const e of [...DEUTSCH_EINHEITEN, ...ENGLISCH_EINHEITEN]) add({ id: `sprache:${e.sprache}:${e.id}`, titel: e.titel, beschreibung: e.ziel, art: "sprache", bereich: e.sprache === "deutsch" ? "Deutsch fürs Handwerk" : "Baustellenenglisch", href: `/sprache/${e.sprache}#${e.id}`, lernzielIds: [`${e.sprache}-${e.id}`], lfIds: [] }, e.text, ...e.woerter.flatMap(w => [w.wort, w.bedeutung]));
  for (const a of BILD_AUFGABEN) add({ id: `bild:${a.id}`, titel: a.titel, beschreibung: a.lernziel, art: "bild", bereich: "Bildtraining", href: `/bildtraining#${a.id}`, lernzielIds: a.lernzielIds, lfIds: a.lfIds }, a.bildbeschreibung, a.aktivitaet.titel);
  for (const p of WERKSTATT_PFADE) for (const e of p.einheiten) add({ id: `handwerk:${e.id}`, titel: `${p.titel}: ${e.titel}`, beschreibung: e.lernziel, art: "handwerk", bereich: "Handwerk & Projekte", href: `/projekte#${e.id}`, lernzielIds: e.lernzielIds, lfIds: e.lfIds }, "Ziegel Dachziegel", e.slug === "bearbeiten" ? "Schneiden" : "", ...e.bildschritte.flatMap(s => [s.titel, s.handlung]), ...e.aufgaben.map(a => a.titel));
  for (const d of DACH_DETAILS) add({ id: `dach:${d.id}`, titel: d.titel, beschreibung: d.funktion, art: "dach", bereich: "Dach in 3D verstehen", href: `/projekte#dach-${d.formen[0]}-${d.id}`, lernzielIds: d.lernzielIds, lfIds: d.lfIds }, ...d.aufbau, ...d.bauteile.map(b => b.name));
  for (const p of BAUPROJEKTE) add({ id: `projekt:${p.id}`, titel: p.titel, beschreibung: p.kurz, art: "projekt", bereich: "Handwerk & Projekte", href: `/projekte#${p.id}`, lernzielIds: p.lernzielIds, lfIds: p.lernfelder }, p.lernziel, p.auftrag);
  for (const v of PRAXIS_VIDEOS) {
    if (!praxisVideoMedien(v).video) continue;
    const p = v.typ === "handgriff" ? WERKSTATT_PFADE.find(p => p.id === v.pfadId) : undefined;
    const detail = v.typ === "dachdetail" ? DACH_DETAILS.find(d => d.id === v.detailId) : undefined;
    const bereich = p?.titel ?? (v.form ? getDachModell(v.form).titel : "Handwerk & Projekte");
    const href = v.typ === "handgriff" ? `/projekte?medium=film#${v.id}` : `/projekte?medium=film&deckung=${v.deckung}#dach-${v.form}-${v.detailId}`;
    const handgriff: Record<string, string> = { schnitt: "Anzeichnen", bearbeiten: "Schneiden", verlegen: "Verlegen", kontrolle: "Kontrollieren" };
    const titel = p && v.slug ? `${handgriff[v.slug] ?? v.titel} · ${p.titel}` : v.titel;
    add({ id: `film:${v.id}`, titel, beschreibung: `3D-Lernfilm · ${Math.ceil(v.dauer / 60)} Minuten · ${v.titel}`, art: "film", bereich, href, lernzielIds: detail?.lernzielIds ?? [], lfIds: detail?.lfIds ?? [] }, ...(p ? ["Ziegel Dachziegel"] : []), ...v.kapitel.map(k => k.titel));
  }
  return ergebnis;
}
function sucheIndex(): SuchEintrag[] { return index ??= baueIndex(); }
export function getThemenIndex(): readonly ThemenTreffer[] { return sucheIndex().map(e => e.treffer); }

const prioritaet: Record<ThemenArt, number> = { erklaerung: 22, begriff: 20, handwerk: 18, film: 17, mathe: 16, dach: 15, projekt: 12, bild: 10, sprache: 9, aufgabe: 2 };
/** No remote service, learning-state write, random variant or evaluation is invoked. */
export function sucheThemen(anfrage: string, art: ThemenArt | "alle" = "alle"): ThemenTreffer[] {
  const query = normalisiereThemenSuche(anfrage.slice(0, 180));
  if (query.length < 2) return [];
  const tokens = query.split(" ");
  return sucheIndex().filter(e => (art === "alle" || e.treffer.art === art) && tokens.every(t => e.woerter.some(w => w.startsWith(t))))
    .map(e => {
      const titelScore = (e.titel === query ? 110 : e.titel.includes(query) ? 65 : 0) + tokens.filter(t => e.titel.split(" ").some(w => w.startsWith(t))).length * 12;
      // A question often repeats the topic verbatim. Keep a genuine explanatory
      // body match ahead of that repetition while retaining exact-title ranking
      // for workshop actions, films and other learning offers.
      return { e, score: prioritaet[e.treffer.art] + titelScore * (e.treffer.art === "aufgabe" ? .2 : 1) };
    })
    .sort((a, b) => b.score - a.score || a.e.treffer.titel.localeCompare(b.e.treffer.titel, "de"))
    .map(({ e }) => e.treffer);
}
