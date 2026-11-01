import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { DACH_DETAILS } from "@/lib/dach3dInhalte";
import { dachAntwort, dachHilfe, dachStandKey, ladeDachStand, neuerDachStand, parseDachStand, pruefeDachAufgabe, speichereDachStand, bewerteDachAntwort, dachDetailZeitnahErklaert } from "@/lib/dach3dStand";
import type { DachErkundungStand } from "@/lib/dach3dTypen";

const start = Date.UTC(2026, 9, 29, 12), detail = DACH_DETAILS[0], aufgabe = detail.aufgaben[0];
beforeEach(() => { appStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(start); });
afterEach(() => vi.useRealTimers());
const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
function selbst(): DachErkundungStand { const s = neuerDachStand(start); s.jeDach.steildach.modus = "probelauf"; return s; }
function mitAntwort(s = selbst(), a = aufgabe, richtig = true): DachErkundungStand {
  const antwort = dachAntwort(s, a);
  antwort.auswahl = a.optionen.filter(o => o.korrekt === richtig).map(o => o.id);
  return { ...s, antworten: { ...s.antworten, [a.id]: antwort } };
}
describe("Dachlernstand: Wiederaufnahme und echte erste Antworten", () => {
  it("startet mit drei getrennten Dachpositionen und ohne erfundene Ergebnisse", () => {
    const s = neuerDachStand(start);
    expect(parseDachStand(JSON.stringify(s))).toEqual(s);
    expect(s.antworten).toEqual({}); expect(s.hilfeEreignisse).toEqual([]);
    expect(s.jeDach.flachdach.deckung).toBe("warmdach");
    expect(s.jeDach.steildach.modus).toBe("begleitet");
  });
  it.each(DACH_DETAILS.flatMap(d => d.aufgaben))("prüft $id mit vollständig richtigen und falschen Auswahlen", a => {
    expect(bewerteDachAntwort(a, a.optionen.filter(o => o.korrekt).map(o => o.id))).toBe("richtig");
    expect(bewerteDachAntwort(a, a.optionen.filter(o => !o.korrekt).map(o => o.id))).toBe("falsch");
    expect(bewerteDachAntwort(a, a.optionen.map(o => o.id))).not.toBe("richtig");
    expect(bewerteDachAntwort(a, [])).toBeNull();
    expect(bewerteDachAntwort(a, ["fremde-option"])).toBeNull();
  });
  it("speichert Notizen, Schichten, Blickrichtung, Aufgabenposition und die andere Dachform", () => {
    const s = neuerDachStand(start);
    s.form = "walmdach";
    s.jeDach.steildach = { ...s.jeDach.steildach, detailId: "s04", phase: "aufgaben", schritt: 1, ansicht: "schnitt", wasser: 3, schichten: ["lattung", "tragwerk"], orbit: { position: [12.5, 8, -2], target: [1, 0.5, 0] } };
    s.jeDach.walmdach = { ...s.jeDach.walmdach, detailId: "w01", phase: "montage", schritt: 2, deckung: "biber-doppel" };
    s.notizen.s04 = "Ortgang und unteren Anschluss gemeinsam betrachten.";
    s.notizen.walmdach = "Gesamtes Walmfeld später noch einmal ansehen.";
    speichereDachStand(s);
    expect(ladeDachStand()).toEqual(s);
  });
  it("friert Aufgabe und tatsächlich gewählte Dachvariante schon vor der Abgabe ein", () => {
    const s = selbst(); s.jeDach.steildach.deckung = "biber-doppel";
    const a = dachAntwort(s, aufgabe);
    expect(a.medienRef).toMatchObject({ version: 2, form: "steildach", deckung: "biber-doppel", detailId: detail.id });
    s.antworten[aufgabe.id] = a; speichereDachStand(s);
    const neu = copy(s); neu.revision++; neu.form = "flachdach";
    expect(dachAntwort(neu, aufgabe)).toEqual(a);
    const fremd = copy(neu); fremd.antworten[aufgabe.id].aufgabe.frage = "Eine andere Frage";
    expect(() => speichereDachStand(fremd)).toThrow(/Übungsangaben/);
    const ohneBild = JSON.parse(JSON.stringify(s)); delete ohneBild.antworten[aufgabe.id].medienRef;
    expect(parseDachStand(JSON.stringify(ohneBild))).toBeNull();
  });
  it("erhält eingefrorene v1-Ansichten und erste Antworten nach dem Wechsel zu Studiomedien", () => {
    let alt = mitAntwort();
    alt.antworten[aufgabe.id].medienRef.version = 1;
    alt = pruefeDachAufgabe(alt, aufgabe.id, start + 1000);
    const abgabe = copy(alt.antworten[aufgabe.id]);
    speichereDachStand(alt);
    expect(ladeDachStand()).toEqual(alt);
    const neu = copy(ladeDachStand()!); neu.revision++; neu.aktualisiertAm++;
    neu.jeDach.steildach.deckung = "biber-doppel";
    expect(dachAntwort(neu, aufgabe)).toEqual(abgabe);
    expect(dachAntwort(neu, detail.aufgaben[1]).medienRef.version).toBe(2);
    speichereDachStand(neu);
    expect(ladeDachStand()?.antworten[aufgabe.id]).toEqual(abgabe);
    const ersetzt = copy(neu); ersetzt.revision++; ersetzt.aktualisiertAm++;
    ersetzt.antworten[aufgabe.id].medienRef.version = 2;
    expect(() => speichereDachStand(ersetzt)).toThrow(/Übungsangaben/);
    expect(ladeDachStand()?.antworten[aufgabe.id]).toEqual(abgabe);
  });
  it("behält Erstantwort und Ergebnis bei erneutem Prüfen unverändert", () => {
    let s = mitAntwort(); s = pruefeDachAufgabe(s, aufgabe.id, start + 1000);
    const vorher = copy(s.antworten[aufgabe.id]); speichereDachStand(s);
    expect(pruefeDachAufgabe(s, aufgabe.id, start + 2000)).toEqual(s);
    const manipuliert = copy(s); manipuliert.revision++; manipuliert.aktualisiertAm++;
    manipuliert.antworten[aufgabe.id].auswahl = aufgabe.optionen.filter(o => !o.korrekt).map(o => o.id);
    expect(() => speichereDachStand(manipuliert)).toThrow(/unvollständig/);
    expect(ladeDachStand()?.antworten[aufgabe.id]).toEqual(vorher);
  });
  it("bewahrt geöffnete Hilfen auch nach Moduswechsel und beim späteren Erstellen der Antwort", () => {
    let s = dachHilfe(selbst(), detail.id, "funktion", start + 1000);
    s.jeDach.steildach.modus = "probelauf";
    vi.setSystemTime(start + 2000);
    s = mitAntwort(s); s = pruefeDachAufgabe(s, aufgabe.id, start + 2000);
    expect(s.antworten[aufgabe.id]).toMatchObject({ nachErklaerung: true, hilfen: ["funktion"] });
    expect(parseDachStand(JSON.stringify(s))).toEqual(s);
  });
  it("ergänzt Hilfen an offenen Antworten, ändert aber keine frühere unabhängige Abgabe", () => {
    let s = mitAntwort(); s = pruefeDachAufgabe(s, aufgabe.id, start + 1000);
    const abgabe = copy(s.antworten[aufgabe.id]);
    s = mitAntwort(s, detail.aufgaben[1]);
    s = dachHilfe(s, detail.id, "kontrollmuster", start + 2000);
    expect(s.antworten[aufgabe.id]).toEqual(abgabe);
    expect(s.antworten[detail.aufgaben[1].id].hilfen).toContain("kontrollmuster");
  });
  it("kennzeichnet die zweite Antwort direkt nach der ersten Erklärung als Nacharbeit", () => {
    let s = pruefeDachAufgabe(mitAntwort(), aufgabe.id, start + 1000);
    vi.setSystemTime(start + 2000); s = mitAntwort(s, detail.aufgaben[1]);
    s = pruefeDachAufgabe(s, detail.aufgaben[1].id, start + 2000);
    expect(s.antworten[detail.aufgaben[1].id].nachErklaerung).toBe(true);
    expect(s.antworten[detail.aufgaben[1].id].hilfen).toContain("vergleich-der-vorigen-antwort");
  });
  it("zählt Erklärungen desselben Details nur im festgelegten Zeitfenster", () => {
    const s = dachHilfe(selbst(), detail.id, "aufbau", start + 1000); speichereDachStand(s);
    expect(dachDetailZeitnahErklaert(detail.id, start + 2000)).toBe(true);
    expect(dachDetailZeitnahErklaert(detail.id, start)).toBe(false);
    expect(dachDetailZeitnahErklaert(detail.id, start + 31 * 60000)).toBe(false);
    expect(dachDetailZeitnahErklaert("s04", start + 2000)).toBe(false);
  });
  it("weist falsche Dachdetails, Deckungen, Blickkoordinaten und Schrittnummern zurück", () => {
    const probes = [
      (s: DachErkundungStand) => { s.jeDach.flachdach.deckung = "falzziegel"; },
      (s: DachErkundungStand) => { s.jeDach.walmdach.detailId = "s04"; },
      (s: DachErkundungStand) => { s.jeDach.steildach.orbit = { position: [1001, 0, 0], target: [0, 0, 0] }; },
      (s: DachErkundungStand) => { s.jeDach.steildach.schritt = 1; },
      (s: DachErkundungStand) => { s.jeDach.steildach.schichten = ["javascript:alert(1)"]; },
    ];
    for (const change of probes) { const s = neuerDachStand(start); change(s); expect(parseDachStand(JSON.stringify(s))).toBeNull(); }
  });
  it("erhält beschädigte Daten, verweigert ältere Schreibstände und entfernte Hilfehistorie", () => {
    appStorage.setItem(dachStandKey, "kaputt");
    expect(() => ladeDachStand()).toThrow(/Sicherung/);
    expect(() => speichereDachStand(neuerDachStand(start))).toThrow(/beschädigt/);
    expect(appStorage.getItem(dachStandKey)).toBe("kaputt"); appStorage.removeItem(dachStandKey);
    const s = neuerDachStand(start); speichereDachStand(s);
    const geholfen = dachHilfe(s, detail.id, "aufbau", start + 1000); speichereDachStand(geholfen);
    expect(() => speichereDachStand(s)).toThrow(/neuerer/);
    const ohne = copy(geholfen); ohne.revision++; ohne.hilfeEreignisse = [];
    expect(() => speichereDachStand(ohne)).toThrow(/Erklärungen/);
    expect(ladeDachStand()).toEqual(geholfen);
  });
});
