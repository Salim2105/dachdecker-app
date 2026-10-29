import { bewerteAktivitaet, istAktivitaetVollstaendig, starteAktivitaet, type Aktivitaet, type AktivitaetAntwort } from "@/lib/aktivitaeten";
import { appStorage } from "@/lib/lernSpeicher";
import { KOMPETENZEN } from "@/lib/pruefungsVorbereitungTypen";
import { leseDezimalzahl } from "@/lib/zahlen";
import type { WerkstattAbgabe, WerkstattAntwort, WerkstattAufgabe, WerkstattBewertung, WerkstattEinheit, WerkstattStand } from "@/lib/werkstattTypen";

const SZENEN = ["messen", "ziegel", "laengen", "breiten", "wasser", "verlegen", "schnitt", "bearbeiten", "befestigen", "kontrolle", "kronenvergleich"];
const SLUGS = SZENEN.filter(s => s !== "kronenvergleich");
const ANSICHTEN = ["draufsicht", "schnitt", "einzelziegel"];
const MODI = ["begleitet", "probelauf"];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 12000): v is string => typeof v === "string" && v.length <= max;
const text = (v: unknown, max = 12000): v is string => str(v, max) && !!v.trim();
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const zeit = (v: unknown): v is number => finite(v) && v >= 0 && v <= 8640000000000000;
const positiv = (v: unknown): v is number => finite(v) && v > 0 && v <= 100000;
const ganz = (v: unknown, min = 0, max = 10000): v is number => Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
const unique = (v: readonly unknown[]) => new Set(v).size === v.length;
const safeKey = (v: unknown): v is string => text(v, 180) && /^[a-zA-Z0-9_-]+$/.test(v) && !["__proto__", "constructor", "prototype"].includes(v);
const texte = (v: unknown, max = 100): v is string[] => Array.isArray(v) && v.length <= max && v.every(x => text(x));
const ids = (v: unknown, max = 100): v is string[] => Array.isArray(v) && v.length <= max && unique(v) && v.every(safeKey);
const hilfen = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 500 && unique(v) && v.every(x => text(x, 500));
const record = (v: unknown, max = 100): v is Record<string, string> => obj(v) && Object.keys(v).length <= max && Object.entries(v).every(([k, s]) => safeKey(k) && str(s, 500));
const pfad = (v: unknown) => v === "falzziegel" || v === "biber-doppel";
const punkt = (v: unknown) => obj(v) && safeKey(v.id) && finite(v.x) && v.x >= 0 && v.x <= 640 && finite(v.y) && v.y >= 0 && v.y <= 360 && text(v.label, 500);
const gleich = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** No imported SVG, external image URL or executable markup reaches the renderer. */
function validAktivitaet(v: unknown): v is Aktivitaet {
  if (!obj(v) || !safeKey(v.id) || !ganz(v.version, 1) || ![v.titel, v.auftrag, v.erklaerung].every(x => text(x)) || v.svg !== undefined) return false;
  if (v.typ === "zuordnen") return Array.isArray(v.paare) && v.paare.length > 0 && v.paare.length <= 24 && v.paare.every(p => obj(p) && safeKey(p.id) && text(p.links) && text(p.rechts)) && unique(v.paare.map(p => p.id));
  if (v.typ === "reihenfolge") return Array.isArray(v.schritte) && v.schritte.length > 1 && v.schritte.length <= 24 && v.schritte.every(s => obj(s) && safeKey(s.id) && text(s.text)) && unique(v.schritte.map(s => s.id));
  return ["skizzenfehler", "baustellenfall"].includes(String(v.typ)) && text(v.situation) && Array.isArray(v.optionen) && v.optionen.length > 1 && v.optionen.length <= 24 && v.optionen.every(o => obj(o) && safeKey(o.id) && text(o.text) && typeof o.korrekt === "boolean") && unique(v.optionen.map(o => o.id)) && v.optionen.some(o => o.korrekt);
}
function validAufgabe(v: unknown): v is WerkstattAufgabe {
  if (!obj(v) || !safeKey(v.id) || ![v.titel, v.auftrag, v.hinweis, v.erklaerung].every(x => text(x)) || !ids(v.kompetenzen, 7) || !v.kompetenzen.length || !v.kompetenzen.every(k => Object.hasOwn(KOMPETENZEN, k)) || !SZENEN.includes(String(v.szene))) return false;
  if (v.typ === "anzeichnen") {
    if (!["messstrecke", "schnitt"].includes(String(v.modus)) || !Array.isArray(v.punkte) || v.punkte.length < 2 || v.punkte.length > 24 || !v.punkte.every(punkt) || !unique(v.punkte.map(p => p.id)) || !ids(v.loesung, 2) || v.loesung.length !== 2 || !v.loesung.every(id => (v.punkte as { id: string }[]).some(p => p.id === id)) || !(v.modus === "schnitt" ? ["links", "rechts"].includes(String(v.nutzseite)) : v.nutzseite === undefined)) return false;
    const loesung = v.loesung.map(id => (v.punkte as { id: string; x: number; y: number }[]).find(p => p.id === id)!);
    return loesung[0].x !== loesung[1].x || loesung[0].y !== loesung[1].y;
  }
  if (v.typ === "einteilen") {
    if (!["laenge", "breite"].includes(String(v.richtung)) || !positiv(v.strecke) || !ganz(v.zielAnzahl, 1, 30) || !positiv(v.minAbstand) || !positiv(v.maxAbstand) || v.maxAbstand < v.minAbstand || !finite(v.zielVersatz) || v.zielVersatz < 0 || v.zielVersatz >= v.strecke || !finite(v.toleranz) || v.toleranz < 0 || v.toleranz > 1) return false;
    const abstand = (v.strecke - v.zielVersatz) / v.zielAnzahl;
    const epsilon = Math.max(1, v.strecke) * Number.EPSILON * 8;
    return abstand >= v.minAbstand - v.toleranz - epsilon && abstand <= v.maxAbstand + v.toleranz + epsilon;
  }
  if (v.typ === "verlegen") return Array.isArray(v.ziele) && v.ziele.length > 0 && v.ziele.length <= 36 && v.ziele.every(punkt) && unique(v.ziele.map(z => z.id)) && Array.isArray(v.teile) && v.teile.length > 0 && v.teile.length <= v.ziele.length && v.teile.every(t => obj(t) && safeKey(t.id) && text(t.label, 500) && (v.ziele as { id: string }[]).some(z => z.id === t.zielId)) && unique(v.teile.map(t => t.id)) && unique(v.teile.map(t => t.zielId)) && typeof v.reihenfolge === "boolean";
  return v.typ === "aktivitaet" && validAktivitaet(v.aktivitaet);
}
export function validWerkstattEinheit(v: unknown): v is WerkstattEinheit {
  if (!obj(v) || !pfad(v.pfadId) || !SLUGS.includes(String(v.slug)) || v.id !== `werkstatt-${v.pfadId}-${v.slug}` || !ganz(v.version, 1) || !ganz(v.nummer, 1, 10) || !text(v.titel) || !text(v.lernziel) || !positiv(v.minuten) || v.minuten > 60 || !ids(v.lernzielIds) || !v.lernzielIds.length || !ids(v.lfIds) || !v.lfIds.length || v.wiederholungId !== `${v.id}-wiederholung`) return false;
  const k = v.systemkarte;
  if (!obj(k) || !safeKey(k.id) || !ganz(k.version, 1) || k.pfadId !== v.pfadId || !text(k.titel) || !text(k.hinweis) || !texte(k.angaben) || !texte(k.befestigung) || !texte(k.quellen) || !obj(k.masse)) return false;
  const m = k.masse;
  if (!["feldLaenge", "feldBreite", "ziegelLaenge", "ziegelBreite", "deckLaenge", "deckBreite", "minDeckLaenge", "maxDeckLaenge", "kopfUeberdeckung"].every(key => positiv(m[key])) || !ganz(m.reihen, 1, 100) || !ganz(m.spalten, 1, 100) || Number(m.minDeckLaenge) > Number(m.deckLaenge) || Number(m.deckLaenge) > Number(m.maxDeckLaenge)) return false;
  if (!Array.isArray(v.bildschritte) || v.bildschritte.length < 4 || v.bildschritte.length > 6 || !v.bildschritte.every(s => obj(s) && safeKey(s.id) && [s.titel, s.handlung, s.warum, s.kontrolle].every(x => text(x)) && SZENEN.includes(String(s.szene)) && ANSICHTEN.includes(String(s.ansicht))) || !unique(v.bildschritte.map(s => s.id))) return false;
  if (!Array.isArray(v.aufgaben) || v.aufgaben.length !== 2 || !v.aufgaben.every(validAufgabe) || !unique(v.aufgaben.map(a => a.id))) return false;
  const p = v.praxis;
  return obj(p) && text(p.auftrag) && ["werkzeuge", "material", "ablauf", "sicherheit", "kontrolle", "gespraech"].every(key => texte(p[key]) && (p[key] as string[]).length > 0);
}

export function emptyWerkstattAntwort(a: WerkstattAufgabe): WerkstattAntwort {
  return { punkte: [], nutzseite: "", anzahl: "", versatz: "", belegung: {}, folge: [], aktivitaet: a.typ === "aktivitaet" ? starteAktivitaet(a.aktivitaet) : { zuordnung: {}, reihenfolge: [], auswahl: [] } };
}
function validAktivitaetAntwort(v: unknown, a?: Aktivitaet): v is AktivitaetAntwort {
  if (!obj(v) || !record(v.zuordnung, 24) || !ids(v.reihenfolge, 24) || !ids(v.auswahl, 24)) return false;
  if (!a) return Object.keys(v.zuordnung).length === 0 && v.reihenfolge.length === 0 && v.auswahl.length === 0;
  if (a.typ === "zuordnen") return Object.entries(v.zuordnung).every(([k, x]) => a.paare.some(p => p.id === k) && (x === "" || a.paare.some(p => p.id === x))) && v.reihenfolge.length === 0 && v.auswahl.length === 0;
  if (a.typ === "reihenfolge") return Object.keys(v.zuordnung).length === 0 && v.reihenfolge.every(id => a.schritte.some(s => s.id === id)) && v.auswahl.length === 0;
  return Object.keys(v.zuordnung).length === 0 && v.reihenfolge.length === 0 && v.auswahl.every(id => a.optionen.some(o => o.id === id));
}
function validAntwort(v: unknown, a: WerkstattAufgabe): v is WerkstattAntwort {
  if (!obj(v) || !ids(v.punkte, 2) || !["", "links", "rechts"].includes(String(v.nutzseite)) || !str(v.anzahl, 50) || !str(v.versatz, 50) || !record(v.belegung, 36) || !ids(v.folge, 36) || !validAktivitaetAntwort(v.aktivitaet, a.typ === "aktivitaet" ? a.aktivitaet : undefined)) return false;
  if (a.typ === "anzeichnen") return v.punkte.every(id => a.punkte.some(p => p.id === id)) && (a.modus === "schnitt" || v.nutzseite === "") && v.anzahl === "" && v.versatz === "" && !Object.keys(v.belegung).length && !v.folge.length;
  if (a.typ === "einteilen") return !v.punkte.length && v.nutzseite === "" && !Object.keys(v.belegung).length && !v.folge.length;
  if (a.typ === "verlegen") return !v.punkte.length && v.nutzseite === "" && v.anzahl === "" && v.versatz === "" && Object.entries(v.belegung).every(([id, ziel]) => a.teile.some(t => t.id === id) && (ziel === "" || a.ziele.some(z => z.id === ziel))) && v.folge.every(id => a.teile.some(t => t.id === id));
  return !v.punkte.length && v.nutzseite === "" && v.anzahl === "" && v.versatz === "" && !Object.keys(v.belegung).length && !v.folge.length;
}
export function werkstattAntwortVollstaendig(a: WerkstattAufgabe, r: WerkstattAntwort): boolean {
  if (!validAntwort(r, a)) return false;
  if (a.typ === "anzeichnen") return r.punkte.length === 2 && (a.modus !== "schnitt" || r.nutzseite !== "");
  if (a.typ === "einteilen") { const n = leseDezimalzahl(r.anzahl), v = leseDezimalzahl(r.versatz); return n !== null && Number.isSafeInteger(n) && n > 0 && n <= 30 && v !== null && v >= 0 && v < a.strecke; }
  if (a.typ === "verlegen") return a.teile.every(t => !!r.belegung[t.id]) && unique(Object.values(r.belegung).filter(Boolean)) && (!a.reihenfolge || r.folge.length === a.teile.length);
  return istAktivitaetVollstaendig(a.aktivitaet, r.aktivitaet);
}
export function bewerteWerkstattAufgabe(a: WerkstattAufgabe, r: WerkstattAntwort): WerkstattBewertung {
  const hinweise: string[] = [];
  let erreicht = 0, moeglich = 0;
  const gueltig = validAntwort(r, a);
  if (a.typ === "anzeichnen") {
    moeglich = a.modus === "schnitt" ? 3 : 2;
    if (gueltig) erreicht = r.punkte.filter(id => a.loesung.includes(id)).length + (a.modus === "schnitt" && r.nutzseite === a.nutzseite ? 1 : 0);
    if (!gueltig || r.punkte.length !== 2 || !r.punkte.every(id => a.loesung.includes(id))) hinweise.push("Prüfe beide Bezugspunkte. Die Linie muss die geforderte Strecke beziehungsweise Schnittlage verbinden.");
    if (a.modus === "schnitt" && r.nutzseite !== a.nutzseite) hinweise.push("Vergleiche Nutzstück und Reststück. Die benötigten Funktionsbereiche müssen am Nutzstück erhalten bleiben.");
  } else if (a.typ === "einteilen") {
    moeglich = 3;
    const n = gueltig ? leseDezimalzahl(r.anzahl) : null, v = gueltig ? leseDezimalzahl(r.versatz) : null;
    const anzahl = n !== null && Number.isSafeInteger(n) && n > 0 && n <= 30;
    // The offset consumes the beginning of the stated span, exactly as drawn.
    const abstand = anzahl && v !== null && v >= 0 && v < a.strecke ? (a.strecke - v) / n : null;
    const epsilon = Math.max(1, a.strecke) * Number.EPSILON * 8;
    const passend = abstand !== null && abstand >= a.minAbstand - a.toleranz - epsilon && abstand <= a.maxAbstand + a.toleranz + epsilon;
    if (anzahl && n === a.zielAnzahl) erreicht++;
    else hinweise.push("Unterscheide ganze Abstände von Lattenreihen. Vergleiche die Anzahl mit der vorgegebenen Einteilung.");
    if (v !== null && Math.abs(v - a.zielVersatz) <= a.toleranz + epsilon) erreicht++;
    else hinweise.push("Prüfe den Startversatz in Zentimetern anhand der Bezugslinie.");
    if (passend) erreicht++;
    else hinweise.push("Der aus Strecke und Anzahl berechnete Abstand liegt nicht im vorgegebenen Übungsbereich.");
  } else if (a.typ === "verlegen") {
    moeglich = a.teile.length + (a.reihenfolge ? 1 : 0);
    const belegt = gueltig ? Object.values(r.belegung).filter(Boolean) : [];
    if (gueltig) erreicht = a.teile.filter(t => r.belegung[t.id] === t.zielId && belegt.filter(id => id === t.zielId).length === 1).length;
    if (erreicht !== a.teile.length) hinweise.push("Prüfe Position, Fugenversatz und Sitz. Jedes Teil benötigt einen eigenen passenden Platz.");
    if (a.reihenfolge) {
      if (gueltig && gleich(r.folge, a.teile.map(t => t.id))) erreicht++;
      else hinweise.push("Vergleiche die Arbeitsfolge mit dem dargestellten System. Die Reihenfolge gehört zur Aufgabe.");
    }
  } else {
    const e = bewerteAktivitaet(a.aktivitaet, gueltig ? r.aktivitaet : emptyWerkstattAntwort(a).aktivitaet);
    moeglich = e.moeglich; erreicht = gueltig ? e.erreicht : 0;
    if (!gueltig || !e.richtig) hinweise.push("Vergleiche deine Auswahl mit Handlung, Zweck und Kontrollpunkt des Arbeitsschritts.");
  }
  return { erreicht, moeglich, richtig: erreicht === moeglich && moeglich > 0 && werkstattAntwortVollstaendig(a, r), hinweise };
}

export const werkstattKey = (einheitId: string): string => `werkstatt-${einheitId}-v1`;
export function neuerWerkstattStand(einheit: WerkstattEinheit, now = Date.now()): WerkstattStand {
  if (!validWerkstattEinheit(einheit) || !zeit(now)) throw new Error("Die Werkstatteinheit ist unvollständig.");
  return { version: 1, id: `werkstatt-${globalThis.crypto.randomUUID()}`, revision: 0, erstelltAm: now, aktualisiertAm: now,
    einheit: clone(einheit), modus: "begleitet", phase: "anleitung", schritt: 0, aufgabeIndex: 0, ansicht: einheit.bildschritte[0].ansicht, wasser: 0,
    antworten: Object.fromEntries(einheit.aufgaben.map(a => [a.id, emptyWerkstattAntwort(a)])), abgaben: {}, geprueft: [], gesehen: [], hilfen: [], notiz: "", abgeschlossenAm: null };
}
function validAbgabe(v: unknown, a: WerkstattAufgabe, s: WerkstattStand): v is WerkstattAbgabe {
  if (!obj(v) || !text(v.id, 500) || !zeit(v.am) || v.am < s.erstelltAm || v.am > s.aktualisiertAm || !validAntwort(v.antwort, a) || !werkstattAntwortVollstaendig(a, v.antwort) || !obj(v.bewertung) || !hilfen(v.hilfen) || !v.hilfen.every(h => s.hilfen.includes(h)) || typeof v.nachErklaerung !== "boolean" || !MODI.includes(String(v.modus))) return false;
  return gleich(v.bewertung, bewerteWerkstattAufgabe(a, v.antwort));
}
export function parseWerkstattStand(raw: string | null): WerkstattStand | null {
  if (raw === null || raw.length > 5_000_000) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!obj(v) || v.version !== 1 || !safeKey(v.id) || !ganz(v.revision, 0, Number.MAX_SAFE_INTEGER) || !zeit(v.erstelltAm) || !zeit(v.aktualisiertAm) || v.aktualisiertAm < v.erstelltAm || !validWerkstattEinheit(v.einheit) || !MODI.includes(String(v.modus)) || !["anleitung", "uebung", "praxis"].includes(String(v.phase)) || !ganz(v.schritt, 0, v.einheit.bildschritte.length - 1) || (v.aufgabeIndex !== undefined && !ganz(v.aufgabeIndex, 0, 1)) || !ANSICHTEN.includes(String(v.ansicht)) || !ganz(v.wasser, 0, 5) || !obj(v.antworten) || !obj(v.abgaben) || !ids(v.geprueft, 2) || !ids(v.gesehen, 6) || !hilfen(v.hilfen) || !str(v.notiz) || !(v.abgeschlossenAm === null || zeit(v.abgeschlossenAm) && v.abgeschlossenAm >= v.erstelltAm && v.abgeschlossenAm <= v.aktualisiertAm)) return null;
    const s = v as unknown as WerkstattStand;
    const aufgaben = s.einheit.aufgaben;
    if (Object.keys(s.antworten).length !== aufgaben.length || !Object.keys(s.antworten).every(id => aufgaben.some(a => a.id === id)) || Object.keys(s.abgaben).length > 2 || !Object.keys(s.abgaben).every(id => aufgaben.some(a => a.id === id)) || !s.geprueft.every(id => aufgaben.some(a => a.id === id)) || !s.gesehen.every(id => s.einheit.bildschritte.some(b => b.id === id))) return null;
    const abgabeIds: string[] = [];
    for (const a of aufgaben) {
      if (!validAntwort(s.antworten[a.id], a)) return null;
      const verlauf = s.abgaben[a.id] ?? [];
      if (!Array.isArray(verlauf) || verlauf.length > 1000 || !verlauf.every(x => validAbgabe(x, a, s))) return null;
      for (let i = 0; i < verlauf.length; i++) {
        const g = verlauf[i]; abgabeIds.push(g.id);
        if (g.id !== `${s.id}:${a.id}:${i}` || i > 0 && (!g.nachErklaerung || g.am < verlauf[i - 1].am) || (g.modus === "begleitet" && !g.hilfen.includes("begleitung"))) return null;
      }
      if (s.geprueft.includes(a.id) && (!verlauf.length || !gleich(verlauf.at(-1)?.antwort, s.antworten[a.id]))) return null;
    }
    if (!unique(abgabeIds) || s.gesehen.some(id => !s.hilfen.includes(`bildschritt:${id}`) && !s.hilfen.includes("begleitung")) || s.abgeschlossenAm !== null && s.geprueft.length !== aufgaben.length) return null;
    return s;
  } catch { return null; }
}
export function ladeWerkstattStand(einheitId: string): WerkstattStand | null {
  const raw = appStorage.getItem(werkstattKey(einheitId));
  if (raw === null) return null;
  const s = parseWerkstattStand(raw);
  if (!s || s.einheit.id !== einheitId) throw new Error("Der vorhandene Werkstattstand ist nicht lesbar und bleibt erhalten. Bitte zuerst eine vollständige Sicherung erstellen.");
  return s;
}
/** The caller advances revision. Web Locks protect the mounted editor across tabs. */
export function speichereWerkstattStand(s: WerkstattStand): void {
  const key = werkstattKey(s.einheit.id), raw = appStorage.getItem(key);
  const alt = raw === null ? null : parseWerkstattStand(raw);
  if (raw !== null && !alt) throw new Error("Der vorhandene Werkstattstand ist nicht lesbar und bleibt erhalten. Bitte zuerst sichern.");
  if (!parseWerkstattStand(JSON.stringify(s))) throw new Error("Der Werkstattstand ist unvollständig und wurde nicht gespeichert.");
  if (alt?.id === s.id && !gleich(alt, s)) {
    if (s.revision <= alt.revision || s.aktualisiertAm < alt.aktualisiertAm) throw new Error("Ein neuerer Werkstattstand ist bereits gespeichert. Bitte neu öffnen.");
    if (!gleich(alt.einheit, s.einheit) || alt.erstelltAm !== s.erstelltAm) throw new Error("Die Übungsangaben eines begonnenen Versuchs bleiben unverändert.");
    if (alt.hilfen.some(h => !s.hilfen.includes(h)) || alt.gesehen.some(id => !s.gesehen.includes(id))) throw new Error("Bereits geöffnete Erklärungen und Hilfen bleiben dokumentiert.");
    for (const [id, verlauf] of Object.entries(alt.abgaben)) if (!gleich(verlauf, s.abgaben[id]?.slice(0, verlauf.length))) throw new Error("Frühere Antworten und Bewertungen bleiben unverändert.");
  }
  if (alt && alt.id !== s.id && appStorage.getItem(werkstattArchivKey(alt)) !== raw) throw new Error("Bitte den bisherigen Werkstattversuch zuerst archivieren.");
  appStorage.setItem(key, JSON.stringify(s));
}
const werkstattArchivKey = (s: WerkstattStand) => `${werkstattKey(s.einheit.id)}-archiv-${s.id}`;
export function archiviereWerkstattStand(s: WerkstattStand): void {
  if (!parseWerkstattStand(JSON.stringify(s))) throw new Error("Der Werkstattversuch konnte nicht sicher archiviert werden.");
  const gespeichert = ladeWerkstattStand(s.einheit.id);
  if (!gespeichert || !gleich(gespeichert, s)) throw new Error("Speichere den aktuellen Werkstattversuch vor dem Archivieren.");
  appStorage.setItem(werkstattArchivKey(s), JSON.stringify(s));
}
function bearbeiten(s: WerkstattStand, now = Date.now()): WerkstattStand {
  const neu = clone(s); neu.revision++; neu.aktualisiertAm = Math.max(s.aktualisiertAm, now); return neu;
}
export function hilfeWerkstatt(s: WerkstattStand, id: string): WerkstattStand {
  if (!text(id, 500)) throw new Error("Die Lernhilfe ist unbekannt.");
  if (s.hilfen.includes(id)) return clone(s);
  const neu = bearbeiten(s); neu.hilfen.push(id); return neu;
}
export function setWerkstattModus(s: WerkstattStand, modus: "begleitet" | "probelauf"): WerkstattStand {
  if (!MODI.includes(modus)) throw new Error("Unbekannter Werkstattmodus.");
  const neu = bearbeiten(s); neu.modus = modus;
  if (modus === "begleitet" && !neu.hilfen.includes("begleitung")) neu.hilfen.push("begleitung");
  return neu;
}
export function pruefeWerkstattAufgabe(s: WerkstattStand, aufgabeId: string, now = Date.now()): WerkstattStand {
  const a = s.einheit.aufgaben.find(a => a.id === aufgabeId);
  if (!a) throw new Error("Die Werkstattaufgabe ist unbekannt.");
  if (s.geprueft.includes(a.id)) return clone(s);
  const antwort = s.antworten[a.id];
  if (!werkstattAntwortVollstaendig(a, antwort)) throw new Error("Bearbeite zuerst die vollständige Aufgabe und prüfe deine Eingaben.");
  if (!zeit(now)) throw new Error("Ungültiger Bewertungszeitpunkt.");
  const neu = bearbeiten(s, now), verlauf = neu.abgaben[a.id] ?? [];
  if (neu.modus === "begleitet" && !neu.hilfen.includes("begleitung")) neu.hilfen.push("begleitung");
  const hilfsListe = neu.hilfen.filter(h => h === "begleitung" || h.startsWith("bildschritt:") || h.startsWith("begriff:") || h.startsWith(`${a.id}:`));
  const abgabe: WerkstattAbgabe = { id: `${neu.id}:${a.id}:${verlauf.length}`, am: neu.aktualisiertAm, antwort: clone(antwort), bewertung: bewerteWerkstattAufgabe(a, antwort), hilfen: hilfsListe, nachErklaerung: verlauf.length > 0, modus: neu.modus };
  neu.abgaben[a.id] = [...verlauf, abgabe]; neu.geprueft.push(a.id); neu.abgeschlossenAm = null;
  return neu;
}
