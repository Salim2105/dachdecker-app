import { beforeEach, describe, expect, it } from "vitest";
import type { LernEinheit } from "@/lib/curriculum";
import { kursStandKey, ladeKursArchiv, ladeKursStand, neuerKursStand } from "@/lib/kursStand";
import { appStorage } from "@/lib/lernSpeicher";

const einheit: LernEinheit = {
  id: "lf01-l01-e01", version: 2, titel: "Sicher starten", lernziel: "Du erklärst die Vorbereitung einer Aufgabe.", minuten: 7,
  textschritte: ["Ein kurzer Lerntext."], lektionIds: ["lf01-l01"], aufgabenIds: ["lf01-001", "lf01-002"], begriffe: [],
  abrufFrage: "Wie beginnst du?", abrufMuster: "Mit dem Arbeitsauftrag.",
  aktivitaet: { id: "lf01-l01-e01-a", version: 2, typ: "zuordnen", titel: "Zwei Begriffe", auftrag: "Ordne zu.", erklaerung: "Beide gehören zusammen.", paare: [{ id: "a", links: "Auftrag", rechts: "Was soll entstehen?" }, { id: "b", links: "Plan", rechts: "Wie gehen wir vor?" }] },
};
beforeEach(() => appStorage.clear());

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
