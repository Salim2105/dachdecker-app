import { appStorage } from "@/lib/lernSpeicher";
import { speichereKompetenzNachweise, type KompetenzNachweis } from "@/lib/kompetenzNachweise";
import { speichereLernsignaleEinmal } from "@/lib/lerndiagnose";
import type { KompetenzId } from "@/lib/pruefungsVorbereitungTypen";
import { loadReviewRecords, recordReviewResult, reviewKey, validReviewResult, type ReviewResult } from "@/lib/review";
import { DACH_DETAILS } from "@/lib/dach3dInhalte";
import { dachDetailZeitnahErklaert } from "@/lib/dach3dStand";
import type { DachErkundungStand } from "@/lib/dach3dTypen";

export const DACH_NACHWEISE_SYNC_KEY = "dach3d-nachweise-verarbeitet-v1";
function kompetenz(id: string): KompetenzId {
  if (["g01", "g02", "g06", "f02"].includes(id)) return "plan";
  if (["g05", "a02", "a03", "a04"].includes(id)) return "ablauf";
  return "material";
}
function verarbeitete(): string[] {
  const raw = appStorage.getItem(DACH_NACHWEISE_SYNC_KEY);
  if (raw === null) return [];
  try { const v: unknown = JSON.parse(raw); if (Array.isArray(v) && v.length <= 100000 && v.every(x => typeof x === "string" && x.length > 0 && x.length < 2000) && new Set(v).size === v.length) return v; } catch { /* preserve the original */ }
  throw new Error("Die Auswertung der Dachdetails ist nicht lesbar. Bitte zuerst eine vollständige Sicherung erstellen.");
}
/** One detail, two answers, one digital proof. Looking around never creates points. */
export function syncDachNachweise(s: DachErkundungStand): void {
  const vorher = verarbeitete(), ids = new Set(vorher), neu: string[] = [];
  const wiederholungen = loadReviewRecords();
  // These are the very same frozen questions as in the daily round. Schedule
  // actual submissions, including an unfinished detail, without inventing an
  // answer to a different exercise or awarding an additional competency proof.
  for (const a of Object.values(s.antworten)) {
    if (!a.geprueft || !a.bewertung || a.abgegebenAm === undefined) continue;
    const ref = { quelle: "bild" as const, id: a.aufgabe.id, version: a.aufgabe.version, lernzielIds: [...a.aufgabe.lernzielIds] };
    if (wiederholungen[reviewKey(ref)]?.verarbeiteteVersuche.includes(a.versuchId)) continue;
    recordReviewResult({ ref,
      versuchId: a.versuchId, bewertung: a.bewertung, am: a.abgegebenAm, hilfen: [...a.hilfen], nachErklaerung: a.nachErklaerung });
  }
  for (const detail of DACH_DETAILS) {
    const antworten = detail.aufgaben.map(a => s.antworten[a.id]);
    if (antworten.some(a => !a?.geprueft || !a.bewertung || a.abgegebenAm === undefined)) continue;
    // A resumed old answer keeps its own content version. Mixed editorial
    // versions remain separate answers rather than a new-version aggregate.
    const versionen = [...new Set(antworten.map(a => a.aufgabe.version))];
    if (versionen.length !== 1) continue;
    const id = `dach3d:${s.id}:${detail.id}:${antworten.map(a => a.versuchId).join(":")}`;
    if (ids.has(id)) continue;
    const am = Math.max(...antworten.map(a => a.abgegebenAm!));
    const hilfen = [...new Set(antworten.flatMap(a => a.hilfen))];
    const nachErklaerung = antworten.some(a => a.nachErklaerung);
    const form = antworten[0].medienRef?.form ?? detail.formen[0];
    const richtig = antworten.every(a => a.bewertung === "richtig");
    const n: KompetenzNachweis = {
      id, versuchId: s.id, aufgabeId: `dach3d-${detail.id}`, kompetenz: kompetenz(detail.id),
      familie: form === "flachdach" ? "flachdach" : "ziegeldach", thema: `3D-Dach: ${detail.titel}`,
      variante: `${detail.id}:v${versionen[0]}`, inhaltsVersion: versionen[0],
      profilId: "dortmund-dachdeckung", profilVersion: 1, am, art: "automatisch", modus: "probelauf",
      erreicht: antworten.filter(a => a.bewertung === "richtig").length, moeglich: 2,
      richtig, hilfen, nachErklaerung, erstversuch: true, transfer: false,
    };
    speichereKompetenzNachweise([n]);
    speichereLernsignaleEinmal([{ id, am, quelle: "bild", aufgabeId: n.aufgabeId, lernzielId: antworten[0].aufgabe.lernzielIds[0], richtig,
      kategorie: ["g06", "f02", "f03", "f04"].includes(detail.id) ? "wasserweg" : "fachwissen",
      hilfen: [...hilfen, ...(nachErklaerung ? ["direkt-nach-erklaerung"] : [])], route: `/projekte#dach-${form}-${detail.id}`,
      thema: detail.titel, hinweis: richtig ? "Vergleiche den Zusammenhang später an einer anderen Ansicht." : detail.kontrolle.korrektur }]);
    neu.push(id);
  }
  if (neu.length) appStorage.setItem(DACH_NACHWEISE_SYNC_KEY, JSON.stringify([...vorher, ...neu]));
}

export function mitDachReviewKontext(r: ReviewResult): ReviewResult {
  if (r.ref.quelle !== "bild" || !r.ref.id.startsWith("dach3d-")) return r;
  const detail = DACH_DETAILS.find(d => d.aufgaben.some(a => a.id === r.ref.id));
  return detail && dachDetailZeitnahErklaert(detail.id, r.am, r.versuchId) ? { ...r, nachErklaerung: true } : r;
}

export function syncDachReviewNachweise(original: ReviewResult): void {
  if (original.ref.quelle !== "bild" || !original.ref.id.startsWith("dach3d-")) return;
  if (!validReviewResult(original)) throw new Error("Die Antwort zum Dachdetail ist unvollständig.");
  const r = mitDachReviewKontext(original);
  if (r.selbstBewertet) return;
  const d = DACH_DETAILS.find(d => d.aufgaben.some(a => a.id === r.ref.id));
  if (!d) return;
  speichereKompetenzNachweise([{
    id: `dach3d-review:${r.versuchId}:${kompetenz(d.id)}`, versuchId: r.versuchId, aufgabeId: r.ref.id,
    kompetenz: kompetenz(d.id), familie: d.formen[0] === "flachdach" ? "flachdach" : "ziegeldach",
    thema: `${d.titel} · später wiederholt`, variante: `${r.ref.id}:v${r.ref.version}`, inhaltsVersion: r.ref.version,
    profilId: "dortmund-dachdeckung", profilVersion: 1, am: r.am, art: "automatisch", modus: "probelauf",
    erreicht: r.bewertung === "richtig" ? 1 : 0, moeglich: 1, richtig: r.bewertung === "richtig",
    hilfen: [...r.hilfen], nachErklaerung: !!r.nachErklaerung, erstversuch: !r.nachErklaerung, transfer: false,
  }]);
}
