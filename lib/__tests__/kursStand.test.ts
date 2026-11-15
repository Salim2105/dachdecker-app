import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LernEinheit } from "@/lib/curriculum";
import { kursStandKey, ladeKursArchiv, ladeKursStand, neuerKursStand, wiederholeKursEinheit } from "@/lib/kursStand";
import { appStorage } from "@/lib/lernSpeicher";
import * as lernSpeicher from "@/lib/lernSpeicher";
import { exportiereArchiv, pruefeArchiv } from "@/lib/backup";
import { speichereBewertung } from "@/lib/progress";

const einheit: LernEinheit = {
  id: "lf01-l01-e01", version: 2, titel: "Sicher starten", lernziel: "Du erklärst die Vorbereitung einer Aufgabe.", minuten: 7,
  textschritte: ["Ein kurzer Lerntext."], lektionIds: ["lf01-l01"], aufgabenIds: ["lf01-001", "lf01-002"], begriffe: [],
  abrufFrage: "Wie beginnst du?", abrufMuster: "Mit dem Arbeitsauftrag.",
  aktivitaet: { id: "lf01-l01-e01-a", version: 2, typ: "zuordnen", titel: "Zwei Begriffe", auftrag: "Ordne zu.", erklaerung: "Beide gehören zusammen.", paare: [{ id: "a", links: "Auftrag", rechts: "Was soll entstehen?" }, { id: "b", links: "Plan", rechts: "Wie gehen wir vor?" }] },
};
beforeEach(() => appStorage.clear());
afterEach(() => vi.restoreAllMocks());

function abgeschlossenerStand(e = einheit) {
  return { ...neuerKursStand(e), phase: 4, notiz: "Auftrag zuerst verstehen.", verglichen: true, selbstbewertung: "teilweise" as const,
    ergebnisse: e.aufgabenIds.map((id) => ({ id, bewertung: "richtig" as const })), abgeschlossen: true,
    aktivitaet: { zuordnung: { a: "a", b: "b" }, reihenfolge: [], auswahl: [] }, aktivitaetGeprueft: true };
}

describe("Kursstand bei überarbeiteten Einheiten", () => {
  it("übernimmt die frühere Notiz und erhält den vollständigen alten Verlauf unverändert", () => {
    const alt = { ...einheit, version: 1, aufgabenIds: ["alte-frage"] };
    const vorher = JSON.stringify(abgeschlossenerStand(alt));
    appStorage.setItem(kursStandKey(alt), vorher);
    expect(ladeKursStand(einheit)).toEqual({ ...neuerKursStand(einheit), notiz: "Auftrag zuerst verstehen.", uebernommenAusVersion: 1 });
    expect(appStorage.getItem(kursStandKey(alt))).toBe(vorher);
    expect(appStorage.getItem(kursStandKey(einheit))).toBeNull();
    expect(ladeKursArchiv("lf01", [einheit])).toEqual([expect.objectContaining({ version: 1, abgeschlossen: true, ergebnisse: [{ id: "alte-frage", bewertung: "richtig" }] })]);
  });
  it("bevorzugt den gespeicherten neuen Entwurf auch bei leerer neuer Notiz", () => {
    appStorage.setItem(kursStandKey({ ...einheit, version: 1 }), JSON.stringify(abgeschlossenerStand({ ...einheit, version: 1 })));
    const neu = { ...neuerKursStand(einheit), textIndex: 0, notiz: "", uebernommenAusVersion: 1 };
    appStorage.setItem(kursStandKey(einheit), JSON.stringify(neu));
    expect(ladeKursStand(einheit)).toEqual(neu);
  });
  it("ändert einen unveränderten LF7-Stand der Version1 nicht", () => {
    const lf7 = { ...einheit, id: "lf07-e01", version: 1 };
    const s = abgeschlossenerStand(lf7);
    appStorage.setItem(kursStandKey(lf7), JSON.stringify(s));
    expect(ladeKursStand(lf7)).toEqual(s);
    expect(ladeKursArchiv("lf07", [lf7])).toEqual([]);
  });
  it("zeigt entfernte alte Textteile nur im passenden Lernfeldarchiv", () => {
    const entfernt = { ...einheit, id: "lf01-l01-e02", version: 1 };
    const andere = { ...einheit, id: "lf02-l01-e02", version: 1 };
    appStorage.setItem(kursStandKey(entfernt), JSON.stringify(abgeschlossenerStand(entfernt)));
    appStorage.setItem(kursStandKey(andere), JSON.stringify(abgeschlossenerStand(andere)));
    appStorage.setItem(kursStandKey(einheit), JSON.stringify(abgeschlossenerStand()));
    const archiv = ladeKursArchiv("lf01", [einheit]);
    expect(archiv.map((a) => a.einheitId)).toEqual([entfernt.id]);
    expect(archiv[0].notiz).toBe("Auftrag zuerst verstehen.");
    expect(ladeKursStand(einheit).notiz).not.toBe("");
  });
  it("blendet unberührte leere Entwürfe und beschädigte Einträge im Archiv aus", () => {
    appStorage.setItem(kursStandKey({ ...einheit, version: 1 }), JSON.stringify(neuerKursStand({ ...einheit, version: 1 })));
    appStorage.setItem("lernwerkstatt-einheit-lf01-alt-v1", JSON.stringify({ version: 1, notiz: "", abgeschlossen: true, ergebnisse: [{ id: "a", bewertung: "erfunden" }] }));
    appStorage.setItem("lernwerkstatt-einheit-lf01-kaputt-v1", "kein JSON");
    expect(ladeKursArchiv("lf01", [einheit])).toEqual([]);
  });
  it("behält einen beschädigten neuen Eintrag zur Sicherung bei, ohne alte Ergebnisse erneut als aktuell zu laden", () => {
    appStorage.setItem(kursStandKey({ ...einheit, version: 1 }), JSON.stringify(abgeschlossenerStand({ ...einheit, version: 1 })));
    appStorage.setItem(kursStandKey(einheit), "beschädigt");
    expect(ladeKursStand(einheit)).toEqual(neuerKursStand(einheit));
    expect(appStorage.getItem(kursStandKey(einheit))).toBe("beschädigt");
  });
  it("verwirft fremde oder doppelte Bewertungen statt einen Abschluss zu erfinden", () => {
    for (const ergebnisse of [
      [{ id: "lf01-001", bewertung: "richtig" }, { id: "lf01-001", bewertung: "richtig" }],
      [{ id: "lf01-001", bewertung: "richtig" }, { id: "fremde-frage", bewertung: "richtig" }],
    ]) {
      appStorage.setItem(kursStandKey(einheit), JSON.stringify({ ...abgeschlossenerStand(), ergebnisse }));
      expect(ladeKursStand(einheit)).toEqual(neuerKursStand(einheit));
    }
  });
  it("verwirft eine angeblich abgeschlossene Einheit ohne Selbstbewertung oder geprüfte Aktivität", () => {
    for (const patch of [{ selbstbewertung: undefined }, { aktivitaetGeprueft: false }, { ergebnisse: [] }, { abgeschlossen: false, ergebnisse: [] }]) {
      appStorage.setItem(kursStandKey(einheit), JSON.stringify({ ...abgeschlossenerStand(), ...patch }));
      expect(ladeKursStand(einheit)).toEqual(neuerKursStand(einheit));
    }
  });
  it("prüft gespeicherte Aktivitäts-IDs gegen die aktuelle Definition", () => {
    appStorage.setItem(kursStandKey(einheit), JSON.stringify({ ...neuerKursStand(einheit), aktivitaet: { zuordnung: { fremd: "a" }, auswahl: [], reihenfolge: [] } }));
    expect(ladeKursStand(einheit)).toEqual(neuerKursStand(einheit));
  });
  it("erhält eine noch nicht gewählte Bedeutung als unvollständigen Entwurf", () => {
    const s = { ...neuerKursStand(einheit), notiz: "Angefangen", aktivitaet: { zuordnung: { a: "a", b: "" }, auswahl: [], reihenfolge: [] } };
    appStorage.setItem(kursStandKey(einheit), JSON.stringify(s));
    expect(ladeKursStand(einheit)).toEqual(s);
  });
});

describe("Einheit sofort wiederholen", () => {
  it("wartet auf das Archiv, erhält den ganzen Versuch und sichert ihn im vollständigen Backup", async () => {
    const stand = { ...abgeschlossenerStand(), hilfen: ["begriffshilfe"] };
    const vorher = JSON.stringify(stand);
    appStorage.setItem(kursStandKey(einheit), vorher);
    speichereBewertung(einheit.aufgabenIds[0], "richtig");
    const verlauf = appStorage.getItem("fortschritt-v1");
    let archivFertig!: () => void;
    const flush = vi.spyOn(lernSpeicher, "flushStorage").mockResolvedValueOnce().mockImplementationOnce(() => new Promise<void>((resolve) => { archivFertig = resolve; }));
    const wiederholung = wiederholeKursEinheit(einheit, stand);
    await vi.waitFor(() => expect(flush).toHaveBeenCalledTimes(2));
    expect(appStorage.getItem(kursStandKey(einheit))).toBe(vorher);
    archivFertig();
    await wiederholung;
    expect(ladeKursStand(einheit)).toEqual({ ...neuerKursStand(einheit), hilfen: ["wiederholung"] });
    expect(appStorage.getItem("fortschritt-v1")).toBe(verlauf);
    const [archiv] = ladeKursArchiv("lf01", [einheit]);
    expect(archiv).toMatchObject({ notiz: stand.notiz, ergebnisse: stand.ergebnisse, abgeschlossen: true, hilfen: ["begriffshilfe"] });
    expect(appStorage.getItem(archiv.key)).toBe(vorher);
    expect(pruefeArchiv(await exportiereArchiv())?.daten[archiv.key]).toBe(vorher);
  });
  it.each([2, 3])("behält den bisherigen Stand bei einem Speicherfehler im Schritt %s", async (schritt) => {
    const stand = abgeschlossenerStand();
    const vorher = JSON.stringify(stand);
    appStorage.setItem(kursStandKey(einheit), vorher);
    const flush = vi.spyOn(lernSpeicher, "flushStorage");
    for (let i = 1; i < schritt; i++) flush.mockResolvedValueOnce();
    flush.mockRejectedValueOnce(new Error("Speicher voll"));
    await expect(wiederholeKursEinheit(einheit, stand)).rejects.toThrow("Speicher voll");
    expect(appStorage.getItem(kursStandKey(einheit))).toBe(vorher);
    expect(ladeKursStand(einheit)).toEqual(stand);
  });
  it("überschreibt bei mehreren Wiederholungen im selben Moment keinen früheren Versuch", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123456789);
    const erster = abgeschlossenerStand();
    appStorage.setItem(kursStandKey(einheit), JSON.stringify(erster));
    await wiederholeKursEinheit(einheit, erster);
    const zweiter = { ...erster, notiz: "Meine zweite Erklärung", hilfen: ["wiederholung"] };
    appStorage.setItem(kursStandKey(einheit), JSON.stringify(zweiter));
    await wiederholeKursEinheit(einheit, zweiter);
    expect(ladeKursArchiv("lf01", [einheit]).map((a) => a.notiz)).toEqual([zweiter.notiz, erster.notiz]);
  });
});
