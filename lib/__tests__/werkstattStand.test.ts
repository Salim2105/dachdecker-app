import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import {
  archiviereWerkstattStand, bewerteWerkstattAufgabe, emptyWerkstattAntwort,
  hilfeWerkstatt, ladeWerkstattStand, neuerWerkstattStand, parseWerkstattStand,
  pruefeWerkstattAufgabe, setWerkstattModus, speichereWerkstattStand,
  validWerkstattEinheit, werkstattAntwortVollstaendig, werkstattKey,
} from "@/lib/werkstattStand";
import type { WerkstattAntwort, WerkstattAufgabe, WerkstattStand } from "@/lib/werkstattTypen";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const einheiten = WERKSTATT_PFADE.flatMap(p => p.einheiten);
const aufgaben = einheiten.flatMap(e => e.aufgaben);
const einheit = (slug = "messen") => clone(einheiten.find(e => e.pfadId === "falzziegel" && e.slug === slug)!);
const aufgabe = <T extends WerkstattAufgabe["typ"]>(typ: T, modus?: string) => clone(aufgaben.find(a => a.typ === typ && (!modus || "modus" in a && a.modus === modus))!) as Extract<WerkstattAufgabe, { typ: T }>;
function loesung(a: WerkstattAufgabe): WerkstattAntwort {
  const r = emptyWerkstattAntwort(a);
  if (a.typ === "anzeichnen") { r.punkte = [...a.loesung]; r.nutzseite = a.nutzseite ?? ""; }
  if (a.typ === "einteilen") { r.anzahl = String(a.zielAnzahl); r.versatz = String(a.zielVersatz); }
  if (a.typ === "verlegen") { r.belegung = Object.fromEntries(a.teile.map(t => [t.id, t.zielId])); r.folge = a.teile.map(t => t.id); }
  if (a.typ === "aktivitaet") {
    if (a.aktivitaet.typ === "zuordnen") r.aktivitaet.zuordnung = Object.fromEntries(a.aktivitaet.paare.map(p => [p.id, p.id]));
    else if (a.aktivitaet.typ === "reihenfolge") r.aktivitaet.reihenfolge = a.aktivitaet.schritte.map(s => s.id);
    else r.aktivitaet.auswahl = a.aktivitaet.optionen.filter(o => o.korrekt).map(o => o.id);
  }
  return r;
}
function geloest(s: WerkstattStand, index = 0): WerkstattStand {
  const a = s.einheit.aufgaben[index];
  return { ...s, revision: s.revision + 1, antworten: { ...s.antworten, [a.id]: loesung(a) } };
}
beforeEach(() => appStorage.clear());
afterEach(() => appStorage.clear());

describe("Werkstatt: Bewertung der tatsächlichen Eingabe", () => {
  it.each(aufgaben.map(a => [a.id, a] as const))("bewertet die vollständige Lösung von %s", (_, a) => {
    expect(werkstattAntwortVollstaendig(a, loesung(a))).toBe(true);
    const e = bewerteWerkstattAufgabe(a, loesung(a));
    expect(e.richtig).toBe(true);
    expect(e.erreicht).toBe(e.moeglich);
    expect(e.hinweise).toEqual([]);
  });
  it("unterscheidet Anriss, vertauschte Endpunkte und die Nutzstückseite", () => {
    const a = aufgabe("anzeichnen", "schnitt"), r = loesung(a);
    r.punkte.reverse(); expect(bewerteWerkstattAufgabe(a, r).richtig).toBe(true);
    r.nutzseite = r.nutzseite === "links" ? "rechts" : "links";
    expect(bewerteWerkstattAufgabe(a, r)).toMatchObject({ erreicht: 2, moeglich: 3, richtig: false });
    const anderer = a.punkte.find(p => !a.loesung.includes(p.id))!;
    r.punkte = [a.loesung[0], anderer.id];
    expect(bewerteWerkstattAufgabe(a, r)).toMatchObject({ erreicht: 1, richtig: false });
  });
  it("lehnt fremde und doppelte Punkt-IDs ab", () => {
    const a = aufgabe("anzeichnen"), r = loesung(a);
    r.punkte = [a.loesung[0], a.loesung[0]];
    expect(werkstattAntwortVollstaendig(a, r)).toBe(false);
    expect(bewerteWerkstattAufgabe(a, r).erreicht).toBe(0);
    r.punkte = [a.loesung[0], "fremd"];
    expect(bewerteWerkstattAufgabe(a, r).richtig).toBe(false);
  });
  it.each(["", "0", "0,", "-2", "1,5", "6cm", "NaN", "Infinity", "999999999999999999999"])("erzeugt aus der ungültigen Rasteranzahl %j kein gültiges Ergebnis", value => {
    const a = aufgabe("einteilen"), r = { ...loesung(a), anzahl: value };
    expect(werkstattAntwortVollstaendig(a, r)).toBe(false);
    expect(bewerteWerkstattAufgabe(a, r).richtig).toBe(false);
  });
  it("berechnet Raster und Rückmeldung mit demselben Startversatz wie die Zeichnung", () => {
    const a = aufgabe("einteilen");
    Object.assign(a, { strecke: 210, zielAnzahl: 6, zielVersatz: 6, minAbstand: 34, maxAbstand: 34 });
    expect(bewerteWerkstattAufgabe(a, { ...loesung(a), versatz: "6,0" }).richtig).toBe(true);
    const falsch = { ...loesung(a), versatz: "0" };
    expect(bewerteWerkstattAufgabe(a, falsch)).toMatchObject({ erreicht: 1, richtig: false });
    for (const v of ["", "-1", "210", "211", "6 cm"]) {
      expect(werkstattAntwortVollstaendig(a, { ...loesung(a), versatz: v })).toBe(false);
      expect(bewerteWerkstattAufgabe(a, { ...loesung(a), versatz: v }).richtig).toBe(false);
    }
  });
  it("bewertet beim Verlegen Platz und Arbeitsfolge getrennt", () => {
    const a = aufgabe("verlegen"), r = loesung(a);
    r.folge.reverse();
    expect(bewerteWerkstattAufgabe(a, r)).toMatchObject({ erreicht: a.teile.length, moeglich: a.teile.length + 1, richtig: false });
    r.belegung[a.teile[1].id] = r.belegung[a.teile[0].id];
    expect(werkstattAntwortVollstaendig(a, r)).toBe(false);
    expect(bewerteWerkstattAufgabe(a, r).richtig).toBe(false);
    a.reihenfolge = false; r.belegung = loesung(a).belegung; r.folge = [];
    expect(bewerteWerkstattAufgabe(a, r).richtig).toBe(true);
  });
  it("belohnt nicht das Ankreuzen aller Antworten", () => {
    const a = aufgaben.find(a => a.typ === "aktivitaet" && (a.aktivitaet.typ === "baustellenfall" || a.aktivitaet.typ === "skizzenfehler"))!;
    if (a.typ !== "aktivitaet" || a.aktivitaet.typ === "zuordnen" || a.aktivitaet.typ === "reihenfolge") throw new Error("Auswahl fehlt");
    const r = loesung(a); r.aktivitaet.auswahl = a.aktivitaet.optionen.map(o => o.id);
    expect(bewerteWerkstattAufgabe(a, r).richtig).toBe(false);
  });
});

describe("Werkstatt: verlässliche Momentaufnahmen und Erstantworten", () => {
  it.each(einheiten.map(e => [e.id, e] as const))("stellt %s mit allen Übungsdaten wieder her", (_, e) => {
    const s = neuerWerkstattStand(e);
    expect(validWerkstattEinheit(e)).toBe(true);
    expect(parseWerkstattStand(JSON.stringify(s))).toEqual(s);
    speichereWerkstattStand(s); expect(ladeWerkstattStand(e.id)).toEqual(s);
  });
  it("erhält Teilwerte, Notiz, Ansicht und aktive Aufgabe über erneutes Öffnen", () => {
    const s = neuerWerkstattStand(einheit("laengen"));
    const a = s.einheit.aufgaben[0];
    s.antworten[a.id].anzahl = "0,"; s.antworten[a.id].versatz = "0,";
    s.notiz = "Meine erste Messung"; s.ansicht = "schnitt"; s.aufgabeIndex = 1; s.wasser = 3; s.phase = "uebung";
    speichereWerkstattStand(s);
    expect(ladeWerkstattStand(s.einheit.id)).toEqual(s);
  });
  it("friert das Modell ab Versuchsbeginn ein", () => {
    const e = einheit(), s = neuerWerkstattStand(e);
    e.systemkarte.masse.feldBreite = 999; expect(s.einheit.systemkarte.masse.feldBreite).toBe(120);
    speichereWerkstattStand(s);
    const veraendert = clone(s); veraendert.revision++; veraendert.einheit.systemkarte.masse.feldBreite = 999;
    expect(() => speichereWerkstattStand(veraendert)).toThrow(/unverändert/);
    expect(ladeWerkstattStand(s.einheit.id)).toEqual(s);
  });
  it("erlaubt den unabhängigen Start vor einer Anleitung und erhält tatsächlich geöffnete Hilfen", () => {
    const frisch = neuerWerkstattStand(einheit());
    expect(frisch.modus).toBe("begleitet"); expect(frisch.hilfen).toEqual([]);
    let s = setWerkstattModus(frisch, "probelauf");
    s = pruefeWerkstattAufgabe(geloest(s), s.einheit.aufgaben[0].id);
    expect(s.abgaben[s.einheit.aufgaben[0].id][0]).toMatchObject({ modus: "probelauf", hilfen: [], nachErklaerung: false });
    s = hilfeWerkstatt(s, "bildschritt:" + s.einheit.bildschritte[0].id);
    s = setWerkstattModus(s, "begleitet"); s = setWerkstattModus(s, "probelauf");
    expect(s.hilfen).toContain("begleitung"); expect(s.hilfen.some(h => h.startsWith("bildschritt:"))).toBe(true);
    speichereWerkstattStand(s);
    expect(() => speichereWerkstattStand({ ...s, revision: s.revision + 1, hilfen: [] })).toThrow(/dokumentiert|unvollständig/);
  });
  it("zeichnet begleitete Abgaben auch dann ehrlich auf, wenn direkt zur Aufgabe gesprungen wurde", () => {
    const s = geloest(neuerWerkstattStand(einheit()));
    const fertig = pruefeWerkstattAufgabe(s, s.einheit.aufgaben[0].id);
    expect(fertig.abgaben[s.einheit.aufgaben[0].id][0].hilfen).toContain("begleitung");
    expect(parseWerkstattStand(JSON.stringify(fertig))).toEqual(fertig);
  });
  it("erhält die Erstantwort; erneute Prüfung erzeugt genau eine Nacharbeit", () => {
    let s = setWerkstattModus(neuerWerkstattStand(einheit()), "probelauf");
    const a = s.einheit.aufgaben[0];
    if (a.typ !== "anzeichnen") throw new Error("Anriss fehlt");
    s.antworten[a.id].punkte = [a.punkte[0].id, a.punkte[2].id];
    s = pruefeWerkstattAufgabe(s, a.id); const erste = clone(s.abgaben[a.id][0]);
    expect(erste.bewertung.richtig).toBe(false);
    expect(pruefeWerkstattAufgabe(s, a.id)).toEqual(s);
    speichereWerkstattStand(s);
    s = geloest({ ...s, geprueft: [] }); s = pruefeWerkstattAufgabe(s, a.id);
    speichereWerkstattStand(s);
    expect(s.abgaben[a.id]).toHaveLength(2); expect(s.abgaben[a.id][0]).toEqual(erste);
    expect(s.abgaben[a.id][1]).toMatchObject({ nachErklaerung: true, bewertung: { richtig: true } });
    const gefaelscht = clone(s); gefaelscht.revision++; gefaelscht.abgaben[a.id][0].antwort = loesung(a);
    gefaelscht.abgaben[a.id][0].bewertung = bewerteWerkstattAufgabe(a, loesung(a));
    expect(() => speichereWerkstattStand(gefaelscht)).toThrow(/Frühere Antworten/);
    expect(ladeWerkstattStand(s.einheit.id)).toEqual(s);
  });
  it("bewahrt beschädigte Stände und verhindert ältere parallele Schreibstände", () => {
    const s = neuerWerkstattStand(einheit()), key = werkstattKey(s.einheit.id);
    appStorage.setItem(key, "defekt");
    expect(() => ladeWerkstattStand(s.einheit.id)).toThrow(/bleibt erhalten/);
    expect(() => speichereWerkstattStand(s)).toThrow(/bleibt erhalten/); expect(appStorage.getItem(key)).toBe("defekt");
    appStorage.removeItem(key); speichereWerkstattStand(s);
    const neu = { ...s, revision: 2, notiz: "Neu" }; speichereWerkstattStand(neu);
    expect(() => speichereWerkstattStand({ ...s, revision: 1, notiz: "Alt" })).toThrow(/neuerer/);
    speichereWerkstattStand(neu); expect(ladeWerkstattStand(s.einheit.id)).toEqual(neu);
  });
  it("ersetzt einen Versuch erst nach Archivierung und behält das Archiv", () => {
    const s = neuerWerkstattStand(einheit()), neu = neuerWerkstattStand(einheit());
    speichereWerkstattStand(s);
    expect(() => speichereWerkstattStand(neu)).toThrow(/archivieren/);
    archiviereWerkstattStand(s); speichereWerkstattStand(neu);
    expect(ladeWerkstattStand(s.einheit.id)).toEqual(neu);
    expect(appStorage.getItem(`${werkstattKey(s.einheit.id)}-archiv-${s.id}`)).toBe(JSON.stringify(s));
  });
  it("weist falsche Punktzahlen, fremde IDs, ungültige Indizes und behauptete Nacharbeits-Unabhängigkeit zurück", () => {
    const s = pruefeWerkstattAufgabe(geloest(neuerWerkstattStand(einheit())), einheit().aufgaben[0].id);
    const a = s.einheit.aufgaben[0];
    const punkte = clone(s); punkte.abgaben[a.id][0].bewertung.erreicht += 1;
    expect(parseWerkstattStand(JSON.stringify(punkte))).toBeNull();
    expect(parseWerkstattStand(JSON.stringify({ ...s, aufgabeIndex: 2 }))).toBeNull();
    expect(parseWerkstattStand(JSON.stringify({ ...s, antworten: { ...s.antworten, fremd: emptyWerkstattAntwort(a) } }))).toBeNull();
    const nacharbeit = clone(s); nacharbeit.geprueft = []; const zweimal = pruefeWerkstattAufgabe(nacharbeit, a.id);
    zweimal.abgaben[a.id][1].nachErklaerung = false; expect(parseWerkstattStand(JSON.stringify(zweimal))).toBeNull();
  });
  it("weist fremde SVGs, unbekannte Szenen und unlösbare Raster bereits im Inhalt zurück", () => {
    const raw = clone(einheit());
    (raw.aufgaben[1] as unknown as { aktivitaet: { svg: string } }).aktivitaet.svg = '<svg onload="alert(1)"/>';
    expect(validWerkstattEinheit(raw)).toBe(false);
    const unknown = clone(einheit()); (unknown.bildschritte[0] as unknown as { szene: string }).szene = "fremdes-markup";
    expect(validWerkstattEinheit(unknown)).toBe(false);
    const raster = einheit("laengen"); const a = raster.aufgaben[0];
    if (a.typ !== "einteilen") throw new Error("Raster fehlt");
    a.minAbstand = 1; a.maxAbstand = 2;
    expect(validWerkstattEinheit(raster)).toBe(false);
    expect(() => neuerWerkstattStand(raster)).toThrow(/unvollständig/);
  });
  it("akzeptiert alte neue Werkstattentwürfe ohne optionalen Aufgabenindex", () => {
    const s = neuerWerkstattStand(einheit()); delete s.aufgabeIndex;
    expect(parseWerkstattStand(JSON.stringify(s))).toEqual(s);
    const ohneHilfe = { ...s, gesehen: [s.einheit.bildschritte[0].id] };
    expect(parseWerkstattStand(JSON.stringify(ohneHilfe))).toBeNull();
  });
  it("speichert tatsächliche Hilfezeitpunkte und eine spätere erneute Öffnung derselben Anleitung", () => {
    const frisch = neuerWerkstattStand(einheit(), 1000);
    expect(frisch.hilfeEreignisse).toEqual([]);
    const id = `bildschritt:${frisch.einheit.bildschritte[0].id}`;
    const einmal = hilfeWerkstatt(frisch, id, 2000);
    expect(einmal.hilfeEreignisse).toEqual([{ id, am: 2000 }]);
    expect(hilfeWerkstatt(einmal, id, 2500)).toEqual(einmal);
    const wieder = hilfeWerkstatt(einmal, id, 4000);
    expect(wieder.hilfen).toEqual([id]);
    expect(wieder.hilfeEreignisse).toEqual([{ id, am: 2000 }, { id, am: 4000 }]);
    const gewechselt = setWerkstattModus(setWerkstattModus(wieder, "begleitet", 5000), "probelauf", 6000);
    expect(gewechselt.hilfeEreignisse).toEqual([{ id, am: 2000 }, { id, am: 4000 }, { id: "begleitung", am: 5000 }]);
    speichereWerkstattStand(gewechselt); expect(ladeWerkstattStand(gewechselt.einheit.id)).toEqual(gewechselt);
  });
  it("erhält Hilfezeitpunkte als unveränderlichen Verlauf", () => {
    const id = "begleitung";
    let s = hilfeWerkstatt(neuerWerkstattStand(einheit(), 1000), id, 2000);
    speichereWerkstattStand(s);
    s = hilfeWerkstatt(s, id, 4000); speichereWerkstattStand(s);
    expect(() => speichereWerkstattStand({ ...s, revision: s.revision + 1, hilfeEreignisse: [] })).toThrow(/Zeitpunkte/);
    const verschoben = clone(s); verschoben.revision++; verschoben.hilfeEreignisse![0].am = 3000;
    expect(() => speichereWerkstattStand(verschoben)).toThrow(/Zeitpunkte/);
    expect(ladeWerkstattStand(s.einheit.id)).toEqual(s);
  });
  it("prüft importierte Hilfezeiten und erhält ältere Stände ohne Zeitprotokoll", () => {
    const s = hilfeWerkstatt(neuerWerkstattStand(einheit(), 1000), "begleitung", 2000);
    for (const ereignisse of [
      [{ id: "begleitung", am: 999 }], [{ id: "begleitung", am: 2001 }],
      [{ id: "fremd", am: 2000 }], [{ id: "begleitung", am: 2000 }, { id: "begleitung", am: 1500 }],
      Array.from({ length: 1001 }, () => ({ id: "begleitung", am: 2000 })),
    ]) expect(parseWerkstattStand(JSON.stringify({ ...s, hilfeEreignisse: ereignisse }))).toBeNull();
    const alt = clone(s); delete alt.hilfeEreignisse;
    expect(parseWerkstattStand(JSON.stringify(alt))).toEqual(alt);
    const fortgesetzt = hilfeWerkstatt(alt, "begleitung", 4000);
    expect(fortgesetzt.hilfeEreignisse).toEqual([{ id: "begleitung", am: 4000 }]);
  });
});
