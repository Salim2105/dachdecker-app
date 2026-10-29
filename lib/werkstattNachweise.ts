import { appStorage } from "@/lib/lernSpeicher";
import { speichereKompetenzNachweise, type KompetenzNachweis } from "@/lib/kompetenzNachweise";
import { speichereLernsignaleEinmal, type LernSignal } from "@/lib/lerndiagnose";
import type { LernKategorie } from "@/lib/lernHinweise";
import type { KompetenzId } from "@/lib/pruefungsVorbereitungTypen";
import { validReviewResult, type ReviewResult } from "@/lib/review";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import type { WerkstattAbgabe, WerkstattStand } from "@/lib/werkstattTypen";
import { parseWerkstattStand, werkstattKey } from "@/lib/werkstattStand";

export const WERKSTATT_SYNC_KEY = "werkstatt-nachweise-sync-v1";
export const WERKSTATT_NACHARBEIT_MS = 30 * 60 * 1000;
const zuordnung: Record<string, { kompetenz: KompetenzId; kategorie: LernKategorie }> = {
  messen: { kompetenz: "plan", kategorie: "rechenweg" },
  ziegel: { kompetenz: "material", kategorie: "begriffe" },
  laengen: { kompetenz: "rechnen", kategorie: "rechenweg" },
  breiten: { kompetenz: "rechnen", kategorie: "rechenweg" },
  wasser: { kompetenz: "plan", kategorie: "wasserweg" },
  verlegen: { kompetenz: "ablauf", kategorie: "ablauf" },
  schnitt: { kompetenz: "material", kategorie: "ablauf" },
  bearbeiten: { kompetenz: "ablauf", kategorie: "ablauf" },
  befestigen: { kompetenz: "material", kategorie: "ablauf" },
  kontrolle: { kompetenz: "plan", kategorie: "befund" },
};

interface WerkstattNachweisInput {
  id: string; versuchId: string; aufgabeId: string; kompetenz: KompetenzId;
  thema: string; variante: string; version: number; am: number;
  erreicht: number; moeglich: number; richtig: boolean;
  hilfen: string[]; nachErklaerung: boolean; erstversuch: boolean;
  modus: "begleitet" | "probelauf";
}

/** Digital work proves understanding of this model, never actual execution. */
export function recordWerkstattNachweis(input: WerkstattNachweisInput): void {
  const nachweis: KompetenzNachweis = {
    ...input, familie: "ziegeldach", inhaltsVersion: input.version,
    profilId: "dortmund-dachdeckung", profilVersion: 1,
    art: "automatisch", transfer: false,
  };
  speichereKompetenzNachweise([nachweis]);
}

function synchronisierteIds(): string[] {
  const raw = appStorage.getItem(WERKSTATT_SYNC_KEY);
  if (raw === null) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v) && v.every(x => typeof x === "string" && x.length > 0 && x.length <= 2000) && new Set(v).size === v.length) return v;
  } catch { /* Preserve damaged records instead of silently replacing them. */ }
  throw new Error("Die Werkstatt-Auswertung kann nicht gelesen werden. Bitte zuerst eine vollständige Sicherung erstellen.");
}

function bekannteVersuche(einheitId: string): WerkstattStand[] {
  const key = werkstattKey(einheitId);
  return [key, ...Object.keys(appStorage).filter(k => k.startsWith(`${key}-archiv-`))].flatMap(k => {
    const raw = appStorage.getItem(k);
    if (raw === null) return [];
    const s = parseWerkstattStand(raw);
    if (!s || s.einheit.id !== einheitId) throw new Error("Ein zugehöriger Werkstattstand ist nicht lesbar oder falsch zugeordnet. Bitte zuerst eine vollständige Sicherung erstellen.");
    return [s];
  });
}
function zeitnahErklaert(s: WerkstattStand, am: number): boolean {
  const zeiten = [...(s.hilfeEreignisse ?? []).map(h => h.am), ...Object.values(s.abgaben).flatMap(alle => alle.map(a => a.am))];
  // Optional timestamps keep older imported drafts compatible, conservatively.
  if (s.hilfeEreignisse === undefined && s.hilfen.length > 0) zeiten.push(s.aktualisiertAm);
  return zeiten.some(zeit => zeit <= am && am - zeit <= WERKSTATT_NACHARBEIT_MS);
}
export function werkstattNacharbeitAusVorversuchen(s: WerkstattStand, am = Date.now()): boolean {
  return bekannteVersuche(s.einheit.id).some(v => v.id !== s.id && zeitnahErklaert(v, am));
}

/** Aggregate one unit/competency, so two substeps are not two independent proofs. */
export function syncWerkstattNachweise(s: WerkstattStand): void {
  const e = s.einheit;
  const gespeichert = synchronisierteIds();
  const bekannt = new Set(gespeichert);
  const neu: string[] = [];
  const vorherigeVersuche = bekannteVersuche(e.id).filter(v => v.id !== s.id);
  const kompetenzen = [...new Set(e.aufgaben.flatMap(a => a.kompetenzen))];
  for (const kompetenz of kompetenzen) {
    const aufgaben = e.aufgaben.filter(a => a.kompetenzen.includes(kompetenz));
    const abgaben = aufgaben.map(a => s.abgaben[a.id]?.at(-1));
    if (abgaben.some(a => !a)) continue;
    const alle = abgaben as WerkstattAbgabe[];
    const id = `werkstatt:${s.id}:${kompetenz}:${alle.map(a => a.id.split(":").at(-1)).join("-")}`;
    if (bekannt.has(id)) continue;
    const hilfen = [...new Set(alle.flatMap(a => a.hilfen))];
    const erreicht = alle.reduce((sum, a) => sum + a.bewertung.erreicht, 0);
    const moeglich = alle.reduce((sum, a) => sum + a.bewertung.moeglich, 0);
    const richtig = alle.every(a => a.bewertung.richtig);
    const am = Math.max(...alle.map(a => a.am));
    const nachErklaerung = alle.some(a => a.nachErklaerung || vorherigeVersuche.some(v => zeitnahErklaert(v, a.am)));
    const erstversuch = aufgaben.every(a => s.abgaben[a.id]?.length === 1);
    recordWerkstattNachweis({ id, versuchId: s.id, aufgabeId: e.id, kompetenz,
      thema: `${e.pfadId === "falzziegel" ? "Falzziegel" : "Biber-Doppeldeckung"}: ${e.titel}`,
      variante: `${e.id}:v${e.version}`, version: e.version, am, erreicht, moeglich, richtig,
      hilfen, nachErklaerung, erstversuch,
      modus: alle.some(a => a.modus === "begleitet") ? "begleitet" : "probelauf",
    });
    const signal: LernSignal = {
      id, am, quelle: "bild", aufgabeId: e.id, lernzielId: e.lernzielIds[0], richtig,
      kategorie: zuordnung[e.slug]?.kategorie ?? "fachwissen",
      hilfen: [...hilfen, ...(nachErklaerung ? ["direkt-nach-erklaerung"] : [])],
      route: `/projekte#${e.id}`, thema: e.titel,
      hinweis: richtig ? "Vergleiche den Zusammenhang später an einem neuen Übungsfeld." : "Gehe Handlung, Begründung und Kontrollpunkt im Werkstatttraining noch einmal durch.",
    };
    speichereLernsignaleEinmal([signal]);
    neu.push(id);
  }
  if (neu.length) appStorage.setItem(WERKSTATT_SYNC_KEY, JSON.stringify([...gespeichert, ...neu]));
}

/** The same goal immediately after its guide/feedback is still supported practice. */
export function mitWerkstattReviewKontext(r: ReviewResult): ReviewResult {
  if (r.ref.quelle !== "bild" || !r.ref.id.startsWith("werkstatt-")) return r;
  const e = WERKSTATT_PFADE.flatMap(p => p.einheiten).find(e => e.wiederholungId === r.ref.id && e.version === r.ref.version);
  if (!e) return r;
  if (bekannteVersuche(e.id).some(s => zeitnahErklaert(s, r.am))) return { ...r, nachErklaerung: true };
  return r;
}

/** Replayed daily results keep the same evidence ID and are not invented transfer. */
export function syncWerkstattReviewNachweise(r: ReviewResult): void {
  if (r.ref.quelle !== "bild" || !r.ref.id.startsWith("werkstatt-")) return;
  if (!validReviewResult(r)) throw new Error("Die Werkstatt-Wiederholung ist unvollständig.");
  r = mitWerkstattReviewKontext(r);
  const e = WERKSTATT_PFADE.flatMap(p => p.einheiten).find(e => e.wiederholungId === r.ref.id && e.version === r.ref.version);
  if (!e || r.selbstBewertet) return;
  const ziel = zuordnung[e.slug];
  recordWerkstattNachweis({
    id: `werkstatt-review:${r.versuchId}:${ziel.kompetenz}`, versuchId: r.versuchId,
    aufgabeId: r.ref.id, kompetenz: ziel.kompetenz, thema: `${e.titel} · später wiederholt`,
    variante: `${e.wiederholungId}:v${r.ref.version}`, version: r.ref.version, am: r.am,
    erreicht: r.bewertung === "richtig" ? 1 : 0, moeglich: 1, richtig: r.bewertung === "richtig",
    hilfen: [...r.hilfen], nachErklaerung: !!r.nachErklaerung,
    erstversuch: !r.nachErklaerung, modus: "probelauf",
  });
}
