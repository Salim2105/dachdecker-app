import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import { archiviereWerkstattStand, hilfeWerkstatt, neuerWerkstattStand, pruefeWerkstattAufgabe, setWerkstattModus, speichereWerkstattStand, werkstattKey } from "@/lib/werkstattStand";
import { ladeKompetenzNachweise, unabhaengigerNachweis } from "@/lib/kompetenzNachweise";
import { ladeLernsignale } from "@/lib/lerndiagnose";
import { createReviewResult } from "@/lib/review";
import { mitWerkstattReviewKontext, syncWerkstattNachweise, syncWerkstattReviewNachweise, WERKSTATT_SYNC_KEY } from "@/lib/werkstattNachweise";
import type { WerkstattAufgabe, WerkstattAntwort, WerkstattStand } from "@/lib/werkstattTypen";

const start = Date.UTC(2026, 9, 29, 12);
const einheit = WERKSTATT_PFADE[0].einheiten.find(e => e.slug === "laengen")!;
beforeEach(() => appStorage.clear());
function antwort(a: WerkstattAufgabe, r: WerkstattAntwort): WerkstattAntwort {
  if (a.typ === "anzeichnen") return { ...r, punkte: [...a.loesung], nutzseite: a.nutzseite ?? "" };
  if (a.typ === "einteilen") return { ...r, anzahl: String(a.zielAnzahl), versatz: String(a.zielVersatz) };
  if (a.typ === "verlegen") return { ...r, belegung: Object.fromEntries(a.teile.map(t => [t.id, t.zielId])), folge: a.teile.map(t => t.id) };
  const x = a.aktivitaet;
  return { ...r, aktivitaet: {
    zuordnung: x.typ === "zuordnen" ? Object.fromEntries(x.paare.map(p => [p.id, p.id])) : {},
    reihenfolge: x.typ === "reihenfolge" ? x.schritte.map(s => s.id) : [],
    auswahl: x.typ === "skizzenfehler" || x.typ === "baustellenfall" ? x.optionen.filter(o => o.korrekt).map(o => o.id) : [],
  } };
}
function fertig(s: WerkstattStand): WerkstattStand {
  for (const a of s.einheit.aufgaben) {
    s = { ...s, antworten: { ...s.antworten, [a.id]: antwort(a, s.antworten[a.id]) } };
    s = pruefeWerkstattAufgabe(s, a.id, Math.max(start + 1000, s.aktualisiertAm));
  }
  return s;
}

describe("Werkstatt: ehrliche und einmalige Lernnachweise", () => {
  it("wertet einen vollständig selbst gelösten Arbeitsschritt ohne erfundenen Kontexttransfer", () => {
    const s = fertig(setWerkstattModus(neuerWerkstattStand(einheit, start), "probelauf"));
    syncWerkstattNachweise(s);
    const n = ladeKompetenzNachweise();
    expect(n.length).toBeGreaterThan(0);
    expect(n.every(x => x.art === "automatisch" && !x.transfer && x.familie === "ziegeldach")).toBe(true);
    expect(n.every(unabhaengigerNachweis)).toBe(true);
    expect(n.filter(x => x.kompetenz === "rechnen")).toHaveLength(1);
    expect(n.every(x => x.art !== "praxis")).toBe(true);
  });
  it("erzeugt beim Neustart weder zusätzliche Nachweise noch zusätzliche Lernhinweise", () => {
    const s = fertig(neuerWerkstattStand(einheit, start));
    syncWerkstattNachweise(s);
    const vorher = ladeKompetenzNachweise(), signale = ladeLernsignale();
    syncWerkstattNachweise(JSON.parse(JSON.stringify(s)));
    expect(ladeKompetenzNachweise()).toEqual(vorher);
    expect(ladeLernsignale()).toEqual(signale);
  });
  it("löscht beim Umschalten keine vorher betrachtete Anleitung aus dem Nachweis", () => {
    let s = hilfeWerkstatt(neuerWerkstattStand(einheit, start), `bildschritt:${einheit.bildschritte[0].id}`);
    s = fertig(setWerkstattModus(s, "probelauf"));
    syncWerkstattNachweise(s);
    expect(ladeKompetenzNachweise().every(n => !unabhaengigerNachweis(n))).toBe(true);
    expect(ladeKompetenzNachweise().every(n => n.hilfen.length > 0)).toBe(true);
  });
  it("bewahrt den Fehler und kennzeichnet die anschließend richtige Nacharbeit", () => {
    let s = setWerkstattModus(neuerWerkstattStand(einheit, start), "probelauf");
    const a = s.einheit.aufgaben.find(a => a.typ === "einteilen")!;
    s.antworten[a.id] = { ...s.antworten[a.id], anzahl: "3", versatz: "0" };
    s = pruefeWerkstattAufgabe(s, a.id, start + 1000);
    const andere = s.einheit.aufgaben.find(x => x.id !== a.id)!;
    s.antworten[andere.id] = antwort(andere, s.antworten[andere.id]);
    s = pruefeWerkstattAufgabe(s, andere.id, s.aktualisiertAm);
    syncWerkstattNachweise(s);
    s = { ...s, geprueft: s.geprueft.filter(id => id !== a.id), antworten: { ...s.antworten, [a.id]: antwort(a, s.antworten[a.id]) } };
    s = pruefeWerkstattAufgabe(s, a.id, s.aktualisiertAm + 1000);
    syncWerkstattNachweise(s);
    const rechnen = ladeKompetenzNachweise().filter(n => n.kompetenz === "rechnen");
    expect(rechnen.some(n => !n.richtig)).toBe(true);
    expect(rechnen.at(-1)).toMatchObject({ richtig: true, nachErklaerung: true, erstversuch: false });
    expect(unabhaengigerNachweis(rechnen.at(-1)!)).toBe(false);
  });
  it("wertet eine spätere Tagesfrage einmalig und getrennt von freier praktischer Ausführung", () => {
    const r = createReviewResult({ quelle: "bild", id: einheit.wiederholungId, version: einheit.version, lernzielIds: einheit.lernzielIds }, "runde-1:werkstatt", "richtig", { hilfen: [] }, start);
    syncWerkstattReviewNachweise(r); syncWerkstattReviewNachweise(r);
    expect(ladeKompetenzNachweise()).toHaveLength(1);
    expect(ladeKompetenzNachweise()[0]).toMatchObject({ kompetenz: "rechnen", art: "automatisch", transfer: false });
    expect(unabhaengigerNachweis(ladeKompetenzNachweise()[0])).toBe(true);
  });
  it("zählt Selbstbewertungen und unbekannte alte Bildaufgaben nicht als Werkstatterfolg", () => {
    const ref = { quelle: "bild" as const, id: einheit.wiederholungId, version: 1, lernzielIds: einheit.lernzielIds };
    syncWerkstattReviewNachweise(createReviewResult(ref, "selbst", "richtig", { hilfen: [], selbstBewertet: true }, start));
    syncWerkstattReviewNachweise(createReviewResult({ ...ref, id: "bild-ziegeldach-fehler" }, "alt", "richtig", { hilfen: [] }, start));
    expect(ladeKompetenzNachweise()).toEqual([]);
  });
  it("erhält einen beschädigten Synchronisationsstand und zeigt den Speicherfehler", () => {
    appStorage.setItem(WERKSTATT_SYNC_KEY, "kaputt");
    expect(() => syncWerkstattNachweise(fertig(neuerWerkstattStand(einheit, start)))).toThrow(/Sicherung/);
    expect(appStorage.getItem(WERKSTATT_SYNC_KEY)).toBe("kaputt");
  });
  it("kennzeichnet die Tagesantwort unmittelbar nach der Anleitung auch für den Wiederholungsplan", () => {
    const s = hilfeWerkstatt(neuerWerkstattStand(einheit, start), `bildschritt:${einheit.bildschritte[0].id}`, start + 1000);
    appStorage.setItem(werkstattKey(einheit.id), JSON.stringify(s));
    const r = createReviewResult({ quelle: "bild", id: einheit.wiederholungId, version: einheit.version, lernzielIds: einheit.lernzielIds }, "nach-anleitung", "richtig", { hilfen: [] }, start + 2000);
    expect(mitWerkstattReviewKontext(r).nachErklaerung).toBe(true);
    syncWerkstattReviewNachweise(r);
    expect(unabhaengigerNachweis(ladeKompetenzNachweise()[0])).toBe(false);
    expect(mitWerkstattReviewKontext({ ...r, am: start + 31 * 60000 }).nachErklaerung).toBeUndefined();
  });
  it("bezieht spätere Erklärungshilfen nicht rückwirkend auf eine frühere unabhängige Antwort", () => {
    const s = hilfeWerkstatt(neuerWerkstattStand(einheit, start), "begleitung", start + 60000);
    appStorage.setItem(werkstattKey(einheit.id), JSON.stringify(s));
    const r = createReviewResult({ quelle: "bild", id: einheit.wiederholungId, version: einheit.version, lernzielIds: einheit.lernzielIds }, "vor-anleitung", "richtig", { hilfen: [] }, start + 1000);
    expect(mitWerkstattReviewKontext(r)).toEqual(r);
  });
  it("verhindert unabhängige Soforterfolge durch Archivieren und Neustarten", () => {
    const alt = fertig(neuerWerkstattStand(einheit, start));
    speichereWerkstattStand(alt); archiviereWerkstattStand(alt);
    const neu = fertig(setWerkstattModus(neuerWerkstattStand(einheit, alt.aktualisiertAm + 10000), "probelauf"));
    speichereWerkstattStand(neu); syncWerkstattNachweise(neu);
    expect(ladeKompetenzNachweise().every(n => n.nachErklaerung && !unabhaengigerNachweis(n))).toBe(true);
    const r = createReviewResult({ quelle: "bild", id: einheit.wiederholungId, version: 1, lernzielIds: einheit.lernzielIds }, "archivnacharbeit", "richtig", { hilfen: [] }, neu.aktualisiertAm + 1000);
    expect(mitWerkstattReviewKontext(r).nachErklaerung).toBe(true);
  });
  it("erhält falsch zugeordnete importierte Stände und verweigert deren Nachweis", () => {
    const fremd = neuerWerkstattStand(WERKSTATT_PFADE[1].einheiten[0], start);
    const raw = JSON.stringify(fremd);
    appStorage.setItem(werkstattKey(einheit.id), raw);
    expect(() => syncWerkstattNachweise(fertig(neuerWerkstattStand(einheit, start)))).toThrow(/zugeordnet/);
    expect(appStorage.getItem(werkstattKey(einheit.id))).toBe(raw);
  });
});
