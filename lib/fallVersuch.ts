import { getAufgaben } from "@/lib/content";
import { EXAM_METADATA } from "@/lib/examMetadata";
import { appStorage } from "@/lib/lernSpeicher";
import { erzeugePruefungsFall } from "@/lib/pruefungsFaelle";
import { KOMPETENZEN, VORBEREITUNGS_PROFIL, type FallBewertung, type FallModus, type FallTeil, type FallVersuch, type PruefungsFall, type TeilAntwort } from "@/lib/pruefungsVorbereitungTypen";
import { leseDezimalzahl } from "@/lib/zahlen";

export const FALL_VERSUCH_KEY = "pruefungsfall-versuch-v1";
export const FALL_VERLAUF_KEY = "pruefungsfall-verlauf-v1";
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const round = (n: number) => Math.round(n * 10000) / 10000;
export const fallTeilKey = (_fallId: string, teilId: string): string => teilId;
export function neueTeilAntwort(): TeilAntwort {
  return { wahl: [], reihenfolge: [], zahlen: {}, einheiten: {}, formel: "", text: "", laut: false, kriterien: {}, hilfen: [], musterOffen: false };
}

/** A complete frozen dossier is generated once; reloading never generates numbers. */
export function neuerFallVersuch(fallIds: string[], modus: FallModus, mitZeitlimit = false, now = Date.now(), variante = 0, mitWiso = false): FallVersuch {
  if (!fallIds.length || new Set(fallIds).size !== fallIds.length || !["begleitet", "probelauf"].includes(modus) || !zeit(now) || !Number.isSafeInteger(variante) || variante < 0) throw new Error("Ungültiger Trainingsstart.");
  const faelle = fallIds.map(id => erzeugePruefungsFall(id, variante));
  const v: FallVersuch = {
    version: 1, id: `fall-${now}-${globalThis.crypto.randomUUID()}`, revision: 0,
    profilId: VORBEREITUNGS_PROFIL.id, profilVersion: 1, modus,
    gestartetAm: now, frist: mitZeitlimit ? now + VORBEREITUNGS_PROFIL.musterMinuten * 60000 : null,
    abgegebenAm: null, index: 0, faelle: clone(faelle), antworten: {}, bewertungen: {}, werkzeuge: [], hilfsEreignisse: [],
  };
  if (mitWiso) {
    const pool = getAufgaben("wiso").filter(a => a.typ === "mc");
    const fragen = (["anwendung", "pruefungsnah"] as const).flatMap(level => {
      const passend = pool.filter(a => EXAM_METADATA[a.id]?.level === level);
      if (passend.length < 5) throw new Error("Für den WiSo-Trainingsumfang fehlen ausdrücklich zugeordnete Aufgaben.");
      const start = ((Math.trunc(variante) % passend.length) + passend.length) % passend.length;
      return Array.from({ length: 5 }, (_, i) => passend[(start + i) % passend.length]);
    });
    v.wiso = fragen.map(a => {
      if (a.typ !== "mc") throw new Error("Unpassende WiSo-Aufgabe.");
      return { id: a.id, frage: a.frage, optionen: [...a.optionen], korrekt: [...a.korrekt], erklaerung: a.erklaerung, wahl: [], punkte: EXAM_METADATA[a.id].maxPoints };
    });
  }
  return v;
}

export function bewerteFallTeil(teil: FallTeil, antwort: TeilAntwort): FallBewertung {
  if (teil.typ === "zeichnung" || teil.typ === "begruendung") return { erreicht: 0, moeglich: 0, richtig: false, selbst: true, hinweise: ["Eigener Vergleich anhand der Kriterien; getrennt von automatischen Punkten."] };
  if (teil.typ === "auswahl") {
    const korrekt = new Set(teil.optionen.filter(o => o.richtig).map(o => o.id));
    const wahl = new Set(antwort.wahl);
    const treff = [...wahl].filter(id => korrekt.has(id)).length;
    const fehler = [...wahl].filter(id => !korrekt.has(id)).length;
    const erreicht = round(Math.max(0, treff - fehler) / Math.max(1, korrekt.size) * teil.punkte);
    return { erreicht, moeglich: teil.punkte, richtig: korrekt.size > 0 && erreicht === teil.punkte, selbst: false, hinweise: erreicht === teil.punkte ? [] : ["Vergleiche passende und unpassende Aussagen mit dem Auftrag."] };
  }
  if (teil.typ === "reihenfolge") {
    const ids = teil.schritte.map(s => s.id);
    const gueltig = new Set(antwort.reihenfolge).size === antwort.reihenfolge.length && antwort.reihenfolge.every(id => ids.includes(id));
    const treffer = gueltig ? ids.filter((id, i) => antwort.reihenfolge[i] === id).length : 0;
    const erreicht = round(teil.punkte * treffer / ids.length);
    return { erreicht, moeglich: teil.punkte, richtig: treffer === ids.length, selbst: false, hinweise: treffer === ids.length ? [] : ["Prüfe Vorbereitung, Ausführung und abschließende Kontrolle in ihrer Reihenfolge."] };
  }
  if (teil.typ !== "rechnen") throw new Error("Unbekannte Aufgabenart.");
  const hinweise: string[] = [];
  let erreicht = 0;
  const moeglich = teil.schritte.reduce((s, t) => s + t.punkte, 0);
  for (const s of teil.schritte) {
    const wert = leseDezimalzahl(antwort.zahlen[s.id] ?? "");
    const ganz = s.stellen !== 0 || wert !== null && Number.isInteger(wert);
    const epsilon = Math.max(1, Math.abs(s.wert)) * Number.EPSILON * 8;
    const richtig = wert !== null && ganz && Math.abs(wert - s.wert) <= s.toleranz + epsilon;
    const einheit = (antwort.einheiten[s.id] ?? "").trim() === s.einheit;
    // A preselected unit earns nothing when the numerical answer is empty.
    if (wert !== null) erreicht += s.punkte * ((richtig ? .5 : 0) + (einheit ? .5 : 0));
    if (!richtig) hinweise.push(`${s.label}: ${wert === null ? "Gib einen gültigen Zahlenwert ein." : !ganz ? "Hier ist eine ganze Anzahl verlangt." : "Vergleiche Bezugsgrößen, Rechenweg und Rundung."}`);
    if (!einheit) hinweise.push(`${s.label}: Prüfe die Einheit; verlangt ist ${s.einheit}.`);
  }
  erreicht = round(erreicht);
  return { erreicht, moeglich, richtig: erreicht === moeglich && moeglich > 0, selbst: false, hinweise };
}

/** Submission is immutable: retries do not invent another result or a later deadline. */
export function abgegebenerFallVersuch(v: FallVersuch, now = Date.now()): FallVersuch {
  if (v.abgegebenAm !== null) return clone(v);
  if (!zeit(now) || now < v.gestartetAm) throw new Error("Ungültiger Abgabezeitpunkt.");
  const neu = clone(v);
  neu.abgegebenAm = now;
  neu.bewertungen = Object.fromEntries(neu.faelle.flatMap(f => f.teile.map(t => [fallTeilKey(f.id, t.id), bewerteFallTeil(t, neu.antworten[fallTeilKey(f.id, t.id)] ?? neueTeilAntwort())])));
  return neu;
}

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && !!v.trim() && v.length <= 100000;
const str = (v: unknown): v is string => typeof v === "string" && v.length <= 100000;
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const zeit = (v: unknown): v is number => finite(v) && v >= 0 && v <= 8640000000000000;
const positiv = (v: unknown): v is number => finite(v) && v > 0;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text);
const unique = (v: readonly unknown[]) => new Set(v).size === v.length;
const recordStrings = (v: unknown): v is Record<string, string> => obj(v) && Object.entries(v).every(([k, s]) => safeKey(k) && str(s));
const safeKey = (v: string) => v.length > 0 && !["__proto__", "constructor", "prototype"].includes(v);
function validTeil(v: unknown): v is FallTeil {
  if (!obj(v) || !text(v.id) || !safeKey(v.id) || !text(v.titel) || !text(v.auftrag) || !strings(v.kompetenzen) || !v.kompetenzen.length || !unique(v.kompetenzen) || !v.kompetenzen.every(k => Object.hasOwn(KOMPETENZEN, k)) || !positiv(v.minuten) || !str(v.hinweis) || !str(v.erklaerung)) return false;
  if (v.typ === "auswahl") return positiv(v.punkte) && Array.isArray(v.optionen) && v.optionen.length > 1 && v.optionen.every(o => obj(o) && text(o.id) && text(o.text) && typeof o.richtig === "boolean") && unique(v.optionen.map(o => o.id)) && v.optionen.some(o => o.richtig);
  if (v.typ === "reihenfolge") return positiv(v.punkte) && Array.isArray(v.schritte) && v.schritte.length > 1 && v.schritte.every(s => obj(s) && text(s.id) && text(s.text)) && unique(v.schritte.map(s => s.id));
  if (v.typ === "rechnen") return Array.isArray(v.schritte) && v.schritte.length > 0 && v.schritte.every(s => obj(s) && text(s.id) && safeKey(s.id) && text(s.label) && finite(s.wert) && text(s.einheit) && strings(s.einheiten) && s.einheiten.includes(s.einheit) && Number.isInteger(s.stellen) && Number(s.stellen) >= 0 && Number(s.stellen) <= 8 && finite(s.toleranz) && s.toleranz >= 0 && text(s.formel) && positiv(s.punkte) && (s.abhaengigVon === undefined || text(s.abhaengigVon))) && unique(v.schritte.map(s => s.id));
  if (v.typ === "zeichnung" || v.typ === "begruendung") return strings(v.kriterien) && v.kriterien.length > 0 && text(v.muster) && text(v.musterKurz) && (v.musterSvg === undefined || str(v.musterSvg));
  return false;
}
function validFall(v: unknown): v is PruefungsFall {
  if (!obj(v) || v.version !== 1 || !text(v.id) || !text(v.familie) || !Number.isInteger(v.variante) || Number(v.variante) < 0 || !text(v.titel) || !text(v.kurz) || !text(v.auftrag) || !strings(v.angaben) || !text(v.svg) || !obj(v.parameter) || !Object.entries(v.parameter).every(([k, n]) => safeKey(k) && finite(n)) || !Array.isArray(v.teile) || !v.teile.length || !v.teile.every(validTeil) || !unique(v.teile.map(t => t.id))) return false;
  const praxis = v.praxis, transfer = v.transfer;
  return obj(praxis) && ["werkzeuge", "material", "sicherheit", "kontrolle", "gespraech"].every(k => strings(praxis[k])) && obj(transfer) && text(transfer.frage) && finite(transfer.wert) && text(transfer.einheit) && finite(transfer.toleranz) && transfer.toleranz >= 0 && text(transfer.erklaerung);
}
function validWiso(w: unknown): boolean {
  if (!obj(w) || !text(w.id) || !text(w.frage) || !strings(w.optionen) || w.optionen.length < 2 || !Array.isArray(w.korrekt) || !w.korrekt.length || !unique(w.korrekt) || !Array.isArray(w.wahl) || !unique(w.wahl) || !str(w.erklaerung) || !positiv(w.punkte)) return false;
  const n = w.optionen.length;
  return [...w.korrekt, ...w.wahl].every(i => Number.isInteger(i) && Number(i) >= 0 && Number(i) < n);
}
function validAntwort(v: unknown): v is TeilAntwort {
  return obj(v) && strings(v.wahl) && unique(v.wahl) && strings(v.reihenfolge) && unique(v.reihenfolge) && recordStrings(v.zahlen) && recordStrings(v.einheiten) && str(v.formel) && str(v.text) && (v.erstText === undefined || str(v.erstText)) && typeof v.laut === "boolean" && obj(v.kriterien) && Object.entries(v.kriterien).every(([k, n]) => safeKey(k) && ["erfuellt", "teilweise", "offen"].includes(String(n))) && strings(v.hilfen) && unique(v.hilfen) && typeof v.musterOffen === "boolean" && (v.zeichnungBewertung === undefined || ["richtig", "teilweise", "falsch"].includes(String(v.zeichnungBewertung)));
}
function validBewertung(v: unknown): v is FallBewertung {
  return obj(v) && finite(v.erreicht) && finite(v.moeglich) && v.erreicht >= 0 && v.moeglich >= 0 && v.erreicht <= v.moeglich && typeof v.richtig === "boolean" && typeof v.selbst === "boolean" && strings(v.hinweise);
}

/** Validate imported snapshots structurally, without replacing them with current content. */
export function parseFallVersuch(raw: string | null): FallVersuch | null {
  if (raw === null) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!obj(v) || v.version !== 1 || !text(v.id) || !safeKey(v.id) || !Number.isSafeInteger(v.revision) || Number(v.revision) < 0 || !text(v.profilId) || v.profilVersion !== 1 || !["begleitet", "probelauf"].includes(String(v.modus)) || !zeit(v.gestartetAm) || !(v.frist === null || zeit(v.frist) && v.frist >= v.gestartetAm) || !(v.abgegebenAm === null || zeit(v.abgegebenAm) && v.abgegebenAm >= v.gestartetAm) || !Array.isArray(v.faelle) || !v.faelle.length || !v.faelle.every(validFall) || !unique(v.faelle.map(f => f.id)) || !obj(v.antworten) || !obj(v.bewertungen) || !strings(v.werkzeuge) || !Array.isArray(v.hilfsEreignisse)) return null;
    const gestartetAm = v.gestartetAm;
    const teile = v.faelle.flatMap(f => f.teile), ids = new Set(teile.map(t => t.id));
    if (ids.size !== teile.length || !Number.isInteger(v.index) || Number(v.index) < 0 || Number(v.index) >= teile.length + (Array.isArray(v.wiso) ? v.wiso.length : 0)) return null;
    if (!Object.entries(v.antworten).every(([id, a]) => {
      if (!ids.has(id) || !safeKey(id) || !validAntwort(a)) return false;
      const teil = teile.find(t => t.id === id)!;
      if (teil.typ === "auswahl" && !a.wahl.every(w => teil.optionen.some(o => o.id === w))) return false;
      if (teil.typ === "reihenfolge" && !a.reihenfolge.every(w => teil.schritte.some(s => s.id === w))) return false;
      if (teil.typ === "rechnen" && ![...Object.keys(a.zahlen), ...Object.keys(a.einheiten)].every(w => teil.schritte.some(s => s.id === w))) return false;
      return true;
    }) || !Object.entries(v.bewertungen).every(([id, b]) => ids.has(id) && validBewertung(b))) return null;
    const hilfeIds = new Set([...ids, ...(Array.isArray(v.wiso) ? v.wiso.filter(obj).map(w => String(w.id)) : [])]);
    if (!v.hilfsEreignisse.every(e => obj(e) && hilfeIds.has(String(e.teilId)) && text(e.art) && zeit(e.am) && e.am >= gestartetAm)) return null;
    if (v.abgegebenAm !== null) {
      if (Object.keys(v.bewertungen).length !== teile.length) return null;
      for (const teil of teile) {
        const stored = v.bewertungen[teil.id];
        const expected = bewerteFallTeil(teil, (v.antworten[teil.id] as TeilAntwort | undefined) ?? neueTeilAntwort());
        if (!validBewertung(stored) || stored.erreicht !== expected.erreicht || stored.moeglich !== expected.moeglich || stored.richtig !== expected.richtig || stored.selbst !== expected.selbst) return null;
      }
    }
    if (v.wiso !== undefined && (!Array.isArray(v.wiso) || !unique(v.wiso.map(w => obj(w) ? w.id : "")) || !v.wiso.every(validWiso))) return null;
    return v as unknown as FallVersuch;
  } catch { return null; }
}
export function ladeFallVersuch(): FallVersuch | null {
  const raw = appStorage.getItem(FALL_VERSUCH_KEY);
  if (raw === null) return null;
  const v = parseFallVersuch(raw);
  if (!v) throw new Error("Der gespeicherte Prüfungsfall ist nicht lesbar und bleibt erhalten. Bitte zuerst eine Sicherung erstellen.");
  return v;
}

/** Detect stale saves in this storage view. Cross-tab atomic locking needs a storage API, not just a revision field. */
export function speichereFallVersuch(v: FallVersuch): void {
  if (!parseFallVersuch(JSON.stringify(v))) throw new Error("Der Prüfungsversuch ist unvollständig und wurde nicht überschrieben.");
  const raw = appStorage.getItem(FALL_VERSUCH_KEY);
  const alt = raw === null ? null : parseFallVersuch(raw);
  if (raw !== null && !alt) throw new Error("Der alte Prüfungsstand kann nicht gelesen werden. Bitte zuerst sichern.");
  if (alt?.id === v.id && alt.abgegebenAm !== null && JSON.stringify(alt) !== JSON.stringify(v)) throw new Error("Eine abgegebene Bearbeitung bleibt unverändert. Beginne für neue Antworten einen neuen Versuch.");
  if (alt?.id === v.id && JSON.stringify(alt) !== JSON.stringify(v) && v.revision <= alt.revision) throw new Error("Ein neuerer Bearbeitungsstand ist bereits gespeichert. Bitte neu öffnen.");
  if (alt?.id === v.id) {
    const fest = (s: FallVersuch) => JSON.stringify([s.faelle, s.profilId, s.profilVersion, s.modus, s.gestartetAm, s.frist]);
    if (fest(alt) !== fest(v)) throw new Error("Die Aufgaben und Zeitvorgaben eines laufenden Versuchs bleiben unverändert.");
    const eventKey = (e: FallVersuch["hilfsEreignisse"][number]) => JSON.stringify([e.teilId, e.art, e.am]);
    const hilfen = new Set(v.hilfsEreignisse.map(eventKey));
    if (alt.hilfsEreignisse.some(e => !hilfen.has(eventKey(e))) || alt.werkzeuge.some(w => !v.werkzeuge.includes(w))) throw new Error("Bereits verwendete Hilfen bleiben beim Versuch dokumentiert.");
    for (const [id, a] of Object.entries(alt.antworten)) {
      const neu = v.antworten[id];
      if (a.hilfen.some(h => !neu?.hilfen.includes(h)) || a.musterOffen && !neu?.musterOffen || a.erstText !== undefined && a.erstText !== neu?.erstText) throw new Error("Die erste Erklärung und verwendete Hilfen bleiben erhalten.");
    }
  }
  if (alt && alt.id !== v.id && !ladeFallVerlauf().some(a => a.id === alt.id && JSON.stringify(a) === JSON.stringify(alt))) throw new Error("Bitte den bisherigen Prüfungsversuch zuerst archivieren; seine Antworten bleiben geöffnet.");
  appStorage.setItem(FALL_VERSUCH_KEY, JSON.stringify(v));
}

/** Archives keep unfinished work too; malformed history is never silently discarded. */
export function ladeFallVerlauf(): FallVersuch[] {
  const raw = appStorage.getItem(FALL_VERLAUF_KEY);
  if (raw === null) return [];
  try {
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) throw new Error();
    const versuche = values.map(v => parseFallVersuch(JSON.stringify(v)));
    if (versuche.some(v => v === null) || !unique(versuche.map(v => v!.id))) throw new Error();
    return versuche as FallVersuch[];
  } catch { throw new Error("Der Prüfungsverlauf ist nicht lesbar und bleibt erhalten. Bitte zuerst eine Sicherung erstellen."); }
}
export function archiviereFallVersuch(v: FallVersuch): void {
  if (!parseFallVersuch(JSON.stringify(v))) throw new Error("Dieser Prüfungsversuch kann nicht archiviert werden.");
  const verlauf = ladeFallVerlauf(), index = verlauf.findIndex(alt => alt.id === v.id);
  if (index >= 0) {
    const alt = verlauf[index];
    if (JSON.stringify(alt) === JSON.stringify(v)) return;
    if (alt.abgegebenAm !== null || v.revision < alt.revision) throw new Error("Ein neuerer oder abgegebener Archivstand bleibt unverändert.");
    verlauf[index] = clone(v);
  } else verlauf.push(clone(v));
  appStorage.setItem(FALL_VERLAUF_KEY, JSON.stringify(verlauf));
}
