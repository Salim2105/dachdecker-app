import { appStorage } from "@/lib/lernSpeicher";
import { offenerPraxisVideoLernStand } from "@/lib/praxisVideoLernStand";
import { getAufgaben } from "@/lib/content";
import { getLernfeld } from "@/lib/lernfelder";
import { ladeStand, ladeGespeicherteAufgaben } from "@/lib/uebungStand";
import { getCurriculum } from "@/lib/curriculum";
import { ladeKursStand } from "@/lib/kursStand";
import { MATHE_EINHEITEN } from "@/lib/matheGrundlagen";
import { leseMatheStand } from "@/lib/matheStand";
import { AUFBAU_EINHEITEN, aufbauKey, parseAufbauStand } from "@/lib/matheAufbau";
import { sprachEinheiten, leseSprachStand } from "@/lib/sprachWerkstatt";
import { BAUPROJEKTE, PROJEKT_SCHRITTE, leseProjektStand, projektKey } from "@/lib/bauprojekte";
import { getWerkstattEinheit } from "@/lib/werkstattInhalte";
import { parseWerkstattStand, werkstattKey } from "@/lib/werkstattStand";
import { getDachDetail, DACH_MODELLE } from "@/lib/dach3dInhalte";
import { dachRoutenZiel, dachDeckungsWunsch } from "@/lib/dach3dVerknuepfungen";
import { dachStandKey, parseDachStand } from "@/lib/dach3dStand";
import { getBildAufgabe, bildStandKey, leseBildStand } from "@/lib/bildtraining";
import { FALL_VERSUCH_KEY, parseFallVersuch } from "@/lib/fallVersuch";
import { EXAM_KEY, parseExamAttempt } from "@/lib/exam";
import { PRUEFUNGS_MATHE_KEY, parsePruefungsMatheStand, pruefungsMatheSchritte } from "@/lib/pruefungsMathe";
import { uebungsFortsetzung, uebungsSessionId } from "@/lib/fortsetzung";
import { parseReviewSession, reviewSessionKey, planReviewSessionKey, reviewSessionRoute, type ReviewFilter } from "@/lib/reviewTasks";

export interface LernFortsetzung {
  art: "fortsetzen" | "heute" | "auswahl";
  href: string;
  titel: string;
  bereich: string;
  schritt: string;
  /** Authored unit/task duration or saved round duration, never today's preference. */
  minuten?: number;
}
type Lernschritt = Omit<LernFortsetzung, "art">;
const lesen = (key: string) => appStorage.getItem(key);
function objekt(raw: string | null): Record<string, unknown> | null {
  try { const value: unknown = JSON.parse(raw ?? "null"); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
  catch { return null; }
}
const nurParameter = (url: URL, namen: string[]) => [...url.searchParams.keys()].every(key => namen.includes(key) && url.searchParams.getAll(key).length === 1);

/** Resolve only authored learning destinations. This reader never changes drafts,
 * unknown routes, or expired attempts; tools and catalogue visits cannot become
 * the learner's last unfinished task. */
export function letzterLernschritt(href: string, now = Date.now()): Lernschritt | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  let url: URL;
  try { url = new URL(href, "https://lernen.local"); } catch { return null; }
  if (url.origin !== "https://lernen.local") return null;
  const hash = url.hash.slice(1);
  const teile = url.pathname.split("/").filter(Boolean);

  if (teile[0] === "lernen" && !hash) {
    const feld = getLernfeld(teile[1]);
    const alt = teile.length === 2 && url.searchParams.get("ansicht") === "alte-runde" && nurParameter(url, ["ansicht"]);
    const quiz = teile.length === 3 && teile[2] === "ueben" && nurParameter(url, ["typ", "thema"]) && (!url.searchParams.has("typ") || url.searchParams.get("typ") === "rechnung");
    if (feld && (alt || quiz)) {
      const rechnen = url.searchParams.get("typ") === "rechnung", thema = url.searchParams.get("thema");
      const id = alt ? `${feld.id}-einheit` : uebungsSessionId(feld.id, rechnen, thema);
      const neuerKey = `dd-session-${id}`, alterKey = `dd-session-${uebungsSessionId(feld.id, rechnen)}`;
      // Read an older matching topic round until its first deliberate opening
      // copies it. This resolver must not migrate or otherwise write storage.
      const key = thema && lesen(neuerKey) === null ? alterKey : neuerKey;
      const pool = getAufgaben(feld.id);
      const aufgaben = alt ? ladeGespeicherteAufgaben(key, pool) : pool.filter(a => (!rechnen || a.typ === "calc") && (!thema || a.thema === thema));
      const stand = aufgaben?.length ? ladeStand(key, aufgaben) : null;
      const liste = stand?.nacharbeit ? aufgaben!.filter((_, i) => stand.ergebnisse[i] !== "richtig") : aufgaben;
      const aktuell = stand && liste?.[stand.index];
      if (!stand || !aktuell) return null;
      return { href, titel: aktuell.thema, bereich: `${rechnen ? "Rechentraining" : "Quiz & Aufgaben"} · ${feld.titel}`, schritt: `${stand.nacharbeit ? "Nacharbeit · " : ""}Aufgabe ${stand.index + 1} von ${liste!.length}` };
    }
  }

  if (url.pathname === "/heute" && !hash && nurParameter(url,["runde","plan"])) {
    const planId = url.searchParams.get("plan"), runde = url.searchParams.get("runde");
    if (planId !== null && (!planId || planId.length > 200 || runde !== null)) return null;
    if (runde !== null && runde !== "alles" && runde !== "kurz" && runde !== "tief") return null;
    if (!url.search && lesen("dd-session-heute") !== null && lesen("tagesrunde-alt-beendet") !== "1") {
      const quiz = uebungsFortsetzung("heute", "");
      return quiz ? { href, titel: "Deine bisherige Tagesrunde", bereich: "Deine Tagesrunde", schritt: `${quiz.nacharbeit ? "Nacharbeit · " : ""}Aufgabe ${quiz.index + 1} von ${quiz.total}` } : null;
    }
    const gespeichert = lesen("tagesrunde-filter");
    const filter: ReviewFilter = runde === "kurz" || runde === "tief" ? runde : runde === "alles" ? "alles" : gespeichert === "kurz" || gespeichert === "tief" ? gespeichert : "alles";
    const stand = parseReviewSession(lesen(planId === null ? reviewSessionKey(filter) : planReviewSessionKey(planId)));
    const task = stand?.tasks[stand.index];
    if (!stand || !task || (planId === null ? stand.filter !== filter : stand.filter !== "alles" || !stand.id.startsWith(`plan-runde-${planId}:`) || stand.tasks.reduce((sum,t)=>sum+t.sekunden,0)>stand.minuten*60*.8+1)) return null;
    return { href: reviewSessionRoute(stand.filter,planId ?? undefined), titel: task.titel, bereich: planId === null ? "Deine Tagesrunde" : "Deine geplante Tagesrunde", schritt: `Aufgabe ${stand.index + 1} von ${stand.tasks.length}`, minuten: stand.minuten };
  }

  if (url.pathname === "/grundlagen/mathe" && nurParameter(url, ["ansicht", "fortsetzen"])) {
    const id = hash || (url.searchParams.get("ansicht") === "pruefungsaufgaben" ? null : lesen("fachmathe-auswahl"));
    const basis = MATHE_EINHEITEN.find(e => e.id === id);
    if (basis) {
      const stand = leseMatheStand(basis.id);
      if (stand.abgeschlossen) return null;
      return { href: hash ? href : `/grundlagen/mathe#${basis.id}`, titel: basis.titel, bereich: "Fachmathe · Grundlagen", schritt: `Rechenaufgabe ${stand.index + 1} von ${basis.fragen.length}`, minuten: basis.minuten };
    }
    const aufbau = AUFBAU_EINHEITEN.find(e => e.id === id);
    if (aufbau) {
      const stand = parseAufbauStand(lesen(aufbauKey(aufbau.id)), aufbau);
      if (stand?.abgeschlossen) return null;
      return { href: hash ? href : `/grundlagen/mathe#${aufbau.id}`, titel: aufbau.titel, bereich: "Fachmathe · Aufbau", schritt: `Rechenaufgabe ${(stand?.index ?? 0) + 1} von ${aufbau.aufgabenIds.length}` };
    }
    if (hash || url.searchParams.get("ansicht") !== "pruefungsaufgaben" || (url.searchParams.has("fortsetzen") && url.searchParams.get("fortsetzen") !== "1")) return null;
    const stand = parsePruefungsMatheStand(lesen(PRUEFUNGS_MATHE_KEY));
    const versuch = stand?.versuche.find(v => v.id === stand.aktiv);
    if (!versuch || versuch.abgegebenAm !== null) return null;
    const schritte = pruefungsMatheSchritte(versuch);
    const offen = schritte.findIndex(s => !versuch.antworten[s.id]?.wert.trim() || !versuch.antworten[s.id]?.einheit.trim());
    return { href: "/grundlagen/mathe?ansicht=pruefungsaufgaben&fortsetzen=1", titel: versuch.aufgabe.typ === "aufbau" ? versuch.aufgabe.aufgabe.titel : versuch.aufgabe.titel, bereich: "Fachmathe · Prüfungsaufgaben", schritt: offen < 0 ? "Rechenweg prüfen und abgeben" : `Rechenschritt ${offen + 1} von ${schritte.length}` };
  }

  if (teile.length === 2 && teile[0] === "sprache" && (teile[1] === "deutsch" || teile[1] === "englisch") && !url.search) {
    const sprache = teile[1], id = hash || lesen(`sprachwerkstatt-${sprache}-auswahl`);
    const einheit = sprachEinheiten(sprache).find(e => e.id === id);
    if (!einheit) return null;
    const stand = leseSprachStand(einheit);
    if (stand.abgeschlossen) return null;
    return { href: hash ? href : `/sprache/${sprache}#${einheit.id}`, titel: einheit.titel, bereich: sprache === "deutsch" ? "Deutsch fürs Handwerk" : "Baustellenenglisch", schritt: `Sprachaufgabe ${stand.index + 1} von ${einheit.aufgaben.length}` };
  }

  if (teile.length === 2 && teile[0] === "lernen" && !url.search) {
    const kurs = getCurriculum(teile[1]);
    if (!kurs) return null;
    const id = hash || lesen(`lernwerkstatt-auswahl-${kurs.lfId}`);
    const einheit = kurs.kapitel.flatMap(k => k.einheiten).find(e => e.id === id);
    if (!einheit) return null;
    const stand = ladeKursStand(einheit);
    if (stand.abgeschlossen) return null;
    const schritt = stand.phase === 0 ? `Verstehen · Textschritt ${stand.textIndex + 1} von ${einheit.textschritte.length}` : stand.phase === 1 ? "Selbst erklären" : stand.phase === 2 ? `Kontrollfrage ${stand.kontrolleIndex + 1} von ${einheit.aufgabenIds.length}` : stand.phase === 3 ? "Anwenden" : "Abschluss";
    return { href: hash ? href : `/lernen/${kurs.lfId}#${einheit.id}`, titel: einheit.titel, bereich: `Fachwissen · ${kurs.titel}`, schritt, minuten: einheit.minuten };
  }

  if (url.pathname === "/projekte" && nurParameter(url, ["deckung"])) {
    const id = hash || lesen("bauprojekte-auswahl") || "";
    const dach = dachRoutenZiel(id);
    if (dach) {
      const stand = parseDachStand(lesen(dachStandKey));
      const form = dach.form ?? stand?.form;
      const modell = DACH_MODELLE.find(m => m.id === form);
      if (!modell || (url.searchParams.has("deckung") && !dachDeckungsWunsch(url.search, modell.id))) return null;
      const position = stand?.jeDach[modell.id];
      const detail = getDachDetail(dach.detailId ?? position?.detailId ?? "");
      if (!detail || !modell.detailIds.includes(detail.id)) return null;
      // A different selected detail starts at its authored first phase.
      const aktuell = position?.detailId === detail.id ? position : null;
      if (stand && detail.aufgaben.every(a => stand.antworten[a.id]?.geprueft)) return null;
      const schritt = aktuell?.phase === "montage" ? `Montage · Schritt ${aktuell.schritt + 1} von ${detail.schritte.length}` : aktuell?.phase === "aufgaben" ? `Selbst entscheiden · ${detail.aufgaben.filter(a => stand?.antworten[a.id]?.geprueft).length} von ${detail.aufgaben.length} Aufgaben bearbeitet` : aktuell?.phase === "aufbau" ? "Aufbau verstehen" : aktuell?.phase === "kontrolle" ? "Ausführung kontrollieren" : "Detail erkennen";
      return { href: hash ? href : `/projekte${url.search}#${id}`, titel: detail.titel, bereich: `Dach entdecken · ${modell.titel}`, schritt };
    }
    if (url.search) return null;
    const werkstatt = getWerkstattEinheit(id);
    if (werkstatt) {
      const raw = lesen(werkstattKey(id)), stand = parseWerkstattStand(raw);
      if (raw !== null && (!stand || stand.einheit.id !== id)) return null;
      const einheit = stand?.einheit ?? werkstatt;
      const mitmachen = stand && offenerPraxisVideoLernStand(stand.id, id);
      if (stand?.abgeschlossenAm !== null && stand?.abgeschlossenAm !== undefined && !mitmachen) return null;
      const schritt = mitmachen ? "Mitmachaufgabe im Lernvideo fortsetzen" : stand?.phase === "uebung" ? `Selbst entscheiden · Aufgabe ${(stand.aufgabeIndex ?? 0) + 1} von ${einheit.aufgaben.length}` : stand?.phase === "praxis" ? "Praktisch ausprobieren" : `Ansehen & verstehen · Bildschritt ${(stand?.schritt ?? 0) + 1} von ${einheit.bildschritte.length}`;
      return { href: hash ? href : `/projekte#${id}`, titel: einheit.titel, bereich: "Digitale Werkstatt", schritt, minuten: einheit.minuten };
    }
    const projekt = BAUPROJEKTE.find(p => p.id === id);
    if (!projekt) return null;
    const raw = lesen(projektKey(id)), stand = leseProjektStand(raw, projekt);
    if (raw !== null && !stand) return null;
    if (stand?.abgeschlossen) return null;
    return { href: hash ? href : `/projekte#${id}`, titel: (stand?.projekt ?? projekt).titel, bereich: "Baustellenprojekte", schritt: `Schritt ${(stand?.schritt ?? 0) + 1} von ${PROJEKT_SCHRITTE.length} · ${PROJEKT_SCHRITTE[stand?.schritt ?? 0]}`, minuten: (stand?.projekt ?? projekt).minuten };
  }

  if (url.pathname === "/bildtraining" && !url.search) {
    const id = hash || lesen("bildtraining-auswahl") || "", aufgabe = getBildAufgabe(id);
    if (!aufgabe) return null;
    const stand = leseBildStand(lesen(bildStandKey(id)), aufgabe);
    if (!stand || stand.abgeschlossen) return null;
    return { href: hash ? href : `/bildtraining#${id}`, titel: aufgabe.titel, bereich: "Bildtraining", schritt: stand?.geprueft ? "Rückmeldung ansehen und als bearbeitet speichern" : aufgabe.aktivitaet.titel, minuten: aufgabe.minuten };
  }

  if (url.pathname === "/pruefung" && !url.search) {
    if (hash === "fortsetzen") {
      const versuch = parseFallVersuch(lesen(FALL_VERSUCH_KEY));
      if (!versuch || versuch.abgegebenAm !== null || (versuch.frist !== null && versuch.frist <= now)) return null;
      const teile = versuch.faelle.flatMap(f => f.teile), teil = teile[versuch.index];
      return { href, titel: versuch.faelle.map(f => f.titel).join(" + "), bereich: "Prüfungsvorbereitung · Musterfälle", schritt: teil ? `Teilaufgabe ${versuch.index + 1} von ${teile.length + (versuch.wiso?.length ?? 0)} · ${teil.titel}` : `WiSo · Aufgabe ${versuch.index - teile.length + 1} von ${versuch.wiso?.length ?? 0}`, ...(teil ? { minuten: teil.minuten } : {}) };
    }
    if (hash === "feldtraining") {
      const versuch = parseExamAttempt(lesen(EXAM_KEY));
      if (!versuch || versuch.submittedAt !== null || (versuch.deadline !== null && versuch.deadline <= now)) return null;
      return { href, titel: versuch.preset.stufe && versuch.preset.lernfelder.length === 1 ? `${getLernfeld(versuch.preset.lernfelder[0])?.titel ?? versuch.preset.lernfelder[0]} · ${versuch.preset.titel}` : versuch.preset.titel, bereich: "Prüfungsvorbereitung · Lernfeld-Prüfungen", schritt: `Aufgabe ${versuch.index + 1} von ${versuch.questions.length} · ${versuch.questions[versuch.index].task.thema}` };
    }
  }
  return null;
}

/** One shared HOME decision: unfinished learning, due review, then field choice.
 * Older course/quiz pointers remain supported without inventing a new history. */
export function lernFortsetzung(faellig = 0, now = Date.now()): LernFortsetzung {
  const route = lesen("lernwerkstatt-zuletzt-route");
  const aktuell = route ? letzterLernschritt(route, now) : null;
  if (aktuell) return { art: "fortsetzen", ...aktuell };
  const alt = objekt(lesen("lernwerkstatt-zuletzt"));
  if (typeof alt?.lfId === "string" && typeof alt.unitId === "string") {
    const einheit = letzterLernschritt(`/lernen/${alt.lfId}#${alt.unitId}`, now);
    if (einheit) return { art: "fortsetzen", ...einheit };
  }
  const quiz = uebungsFortsetzung(lesen("letzte-session") ?? "", lesen("letztesLf") ?? "");
  if (quiz) return { art: "fortsetzen", href: quiz.href, titel: quiz.thema, bereich: quiz.href === "/heute" ? "Deine Tagesrunde" : "Quiz & Aufgaben", schritt: `${quiz.nacharbeit ? "Nacharbeit · " : ""}Aufgabe ${quiz.index + 1} von ${quiz.total}` };
  if (faellig > 0) return { art: "heute", href: "/heute", titel: "Frische dein Wissen auf", bereich: "Deine Tagesrunde", schritt: `${faellig} ${faellig === 1 ? "Wiederholung ist" : "Wiederholungen sind"} fällig.` };
  return { art: "auswahl", href: "/lernen", titel: "Womit möchtest du anfangen?", bereich: "Dein nächster Schritt", schritt: "Wähle ein Lernfeld und starte mit einer kurzen Einheit." };
}
