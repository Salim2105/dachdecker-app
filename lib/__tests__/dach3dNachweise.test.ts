import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { DACH_DETAILS } from "@/lib/dach3dInhalte";
import { dachAntwort, dachHilfe, neuerDachStand, pruefeDachAufgabe, speichereDachStand } from "@/lib/dach3dStand";
import { DACH_NACHWEISE_SYNC_KEY, mitDachReviewKontext, syncDachNachweise, syncDachReviewNachweise } from "@/lib/dach3dNachweise";
import { ladeKompetenzNachweise, unabhaengigerNachweis } from "@/lib/kompetenzNachweise";
import { ladeLernsignale } from "@/lib/lerndiagnose";
import { createReviewResult, loadReviewRecords, recordReviewResult, reviewKey } from "@/lib/review";
import type { DachErkundungStand } from "@/lib/dach3dTypen";

const jetzt = Date.UTC(2026, 9, 30, 12);
const detail = DACH_DETAILS.find(d => d.id === "s03")!;
beforeEach(() => appStorage.clear());
function beantwortet(s: DachErkundungStand, richtig = true) {
  for (const aufgabe of detail.aufgaben) {
    const a = dachAntwort(s, aufgabe, jetzt);
    a.auswahl = aufgabe.optionen.filter(o => o.korrekt === richtig).map(o => o.id);
    s = { ...s, antworten: { ...s.antworten, [aufgabe.id]: a } };
    s = pruefeDachAufgabe(s, aufgabe.id, jetzt + 1000);
  }
  return s;
}

describe("ehrliche Lernnachweise aus den Dachdetails", () => {
  it("gibt für Erkunden und halbe Details keine Wissens- oder Praxisnachweise", () => {
    let s = dachHilfe(neuerDachStand(jetzt), detail.id, "aufbau", jetzt);
    syncDachNachweise(s);
    expect(ladeKompetenzNachweise()).toEqual([]);
    const aufgabe = detail.aufgaben[0];
    s.antworten[aufgabe.id] = { ...dachAntwort(s, aufgabe, jetzt), auswahl: aufgabe.optionen.filter(o => o.korrekt).map(o => o.id) };
    s = pruefeDachAufgabe(s, aufgabe.id, jetzt + 1000);
    syncDachNachweise(s);
    expect(ladeKompetenzNachweise()).toEqual([]);
    const wiederholung = Object.values(loadReviewRecords());
    expect(wiederholung).toHaveLength(1);
    expect(wiederholung[0]).toMatchObject({ ref: { id: aufgabe.id }, intervallTage: 1, faelligAm: jetzt + 1000 + 86400000 });
  });
  it("wertet zwei Antworten nach Neustart genau einmal als digitales Verständnis", () => {
    const s = beantwortet(neuerDachStand(jetzt));
    syncDachNachweise(s);
    const nachweise = ladeKompetenzNachweise(), signale = ladeLernsignale();
    syncDachNachweise(JSON.parse(JSON.stringify(s)));
    expect(ladeKompetenzNachweise()).toEqual(nachweise);
    expect(ladeLernsignale()).toEqual(signale);
    expect(nachweise).toHaveLength(1);
    expect(nachweise[0]).toMatchObject({ art: "automatisch", erreicht: 2, moeglich: 2, transfer: false, richtig: true });
    expect(unabhaengigerNachweis(nachweise[0])).toBe(false);
    expect(nachweise[0].hilfen).toContain("begleitung");
    for (const a of detail.aufgaben) expect(loadReviewRecords()[reviewKey({ quelle: "bild", id: a.id, version: a.version, lernzielIds: a.lernzielIds })].verlauf).toHaveLength(1);
  });
  it("behält falsche Antworten und leitet zur passenden Korrektur", () => {
    syncDachNachweise(beantwortet(neuerDachStand(jetzt), false));
    expect(ladeKompetenzNachweise()[0]).toMatchObject({ erreicht: 0, richtig: false, transfer: false });
    expect(ladeLernsignale()[0]).toMatchObject({ route: "/projekte#dach-steildach-s03", hinweis: detail.kontrolle.korrektur });
  });
  it("kennzeichnet zeitnahe Tagesantworten nach einer Erklärung ohne spätere Hilfen rückwirkend anzurechnen", () => {
    const s = dachHilfe(neuerDachStand(jetzt), detail.id, "montage", jetzt + 1000);
    speichereDachStand(s);
    const a = detail.aufgaben[0];
    const r = createReviewResult({ quelle: "bild", id: a.id, version: a.version, lernzielIds: a.lernzielIds }, "dach-runde-1", "richtig", { hilfen: [] }, jetzt + 2000);
    expect(mitDachReviewKontext(r).nachErklaerung).toBe(true);
    expect(mitDachReviewKontext({ ...r, am: jetzt }).nachErklaerung).toBeUndefined();
    expect(mitDachReviewKontext({ ...r, am: jetzt + 32 * 60000 }).nachErklaerung).toBeUndefined();
    syncDachReviewNachweise(r); syncDachReviewNachweise(r);
    expect(ladeKompetenzNachweise()).toHaveLength(1);
    expect(unabhaengigerNachweis(ladeKompetenzNachweise()[0])).toBe(false);
  });
  it("trennt spätere unabhängige Antworten von Selbsteinschätzung und Praxis", () => {
    const a = detail.aufgaben[0], ref = { quelle: "bild" as const, id: a.id, version: a.version, lernzielIds: a.lernzielIds };
    syncDachReviewNachweise(createReviewResult(ref, "selbst", "richtig", { hilfen: [], selbstBewertet: true }, jetzt));
    expect(ladeKompetenzNachweise()).toEqual([]);
    syncDachReviewNachweise(createReviewResult(ref, "spaeter", "richtig", { hilfen: [] }, jetzt));
    expect(unabhaengigerNachweis(ladeKompetenzNachweise()[0])).toBe(true);
    expect(ladeKompetenzNachweise()[0]).toMatchObject({ art: "automatisch", transfer: false });
  });
  it("überschreibt keinen beschädigten Synchronisationsstand", () => {
    appStorage.setItem(DACH_NACHWEISE_SYNC_KEY, "kaputt");
    expect(() => syncDachNachweise(beantwortet(neuerDachStand(jetzt)))).toThrow(/Sicherung/);
    expect(appStorage.getItem(DACH_NACHWEISE_SYNC_KEY)).toBe("kaputt");
    expect(ladeKompetenzNachweise()).toEqual([]);
  });
  it("verwechselt Nacharbeit nach Tagesfeedback nicht mit einer unabhängigen Antwort", () => {
    const [a, b] = detail.aufgaben;
    const ref = (aufgabe: typeof a) => ({ quelle: "bild" as const, id: aufgabe.id, version: aufgabe.version, lernzielIds: aufgabe.lernzielIds });
    const alt = createReviewResult(ref(a), "tagesantwort-1", "richtig", { hilfen: [] }, jetzt);
    recordReviewResult(alt);
    expect(mitDachReviewKontext(alt).nachErklaerung).toBeUndefined();
    const nachher = createReviewResult(ref(b), "tagesantwort-2", "richtig", { hilfen: [] }, jetzt + 1000);
    expect(mitDachReviewKontext(nachher).nachErklaerung).toBe(true);
    syncDachReviewNachweise(nachher);
    expect(unabhaengigerNachweis(ladeKompetenzNachweise()[0])).toBe(false);
    let s = neuerDachStand(jetzt + 1000);
    s.jeDach.steildach.modus = "probelauf";
    s = beantwortet(s);
    expect(s.antworten[b.id].hilfen).toContain("vergleich-der-tagesantwort");
    expect(mitDachReviewKontext({ ...nachher, am: jetzt + 32 * 60000 }).nachErklaerung).toBeUndefined();
  });
  it("wertet alte eingefrorene Fragen mit ihrer eigenen Inhaltsversion", () => {
    let s = neuerDachStand(jetzt);
    for (const aufgabe of detail.aufgaben) {
      const alt = { ...aufgabe, version: 7, lernzielIds: ["dach3d-altes-lernziel"] };
      s.antworten[alt.id] = { ...dachAntwort(s, alt, jetzt), auswahl: alt.optionen.filter(o => o.korrekt).map(o => o.id) };
      s = pruefeDachAufgabe(s, alt.id, jetzt + 1000);
    }
    syncDachNachweise(s);
    expect(ladeKompetenzNachweise()[0]).toMatchObject({ inhaltsVersion: 7, variante: "s03:v7" });
    expect(ladeLernsignale()[0].lernzielId).toBe("dach3d-altes-lernziel");
    appStorage.clear();
    s.antworten[detail.aufgaben[1].id].aufgabe.version = 8;
    syncDachNachweise(s);
    expect(ladeKompetenzNachweise()).toEqual([]);
    const a = detail.aufgaben[0];
    syncDachReviewNachweise(createReviewResult({ quelle: "bild", id: a.id, version: 7, lernzielIds: ["dach3d-altes-lernziel"] }, "alte-tagesantwort", "richtig", { hilfen: [] }, jetzt));
    expect(ladeKompetenzNachweise()[0]).toMatchObject({ inhaltsVersion: 7, aufgabeId: a.id });
  });
});
