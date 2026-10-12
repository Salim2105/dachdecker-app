import { beforeEach, describe, expect, it } from "vitest";
import { LERNWEGE, leererLernweg, lernwegStore, lernwegAuswahl, leseLernwege, speichereLernweg, rechnungGeschafft } from "@/lib/lernweg";
import { PRAXISFAELLE } from "@/lib/praxis";
import { exportiereDaten, importiereDaten } from "@/lib/backup";

beforeEach(() => { localStorage.clear(); lernwegStore.set(""); lernwegAuswahl.set(""); });

describe("Lernweg speichern und fortsetzen", () => {
  it("verknüpft jede Einheit mit einem vorhandenen Fall und eigenen Lernschritten", () => {
    expect(new Set(LERNWEGE.map((e) => e.id)).size).toBe(LERNWEGE.length);
    for (const e of LERNWEGE) {
      expect(PRAXISFAELLE.find((f) => f.id === e.id)).toBeTruthy();
      expect(e.erklaerung.length).toBeGreaterThanOrEqual(2);
      expect(e.baustelle).not.toBe(PRAXISFAELLE.find((f) => f.id === e.id)!.situation);
    }
  });
  it("sichert Antworten, aktuellen Schritt und ausgewählte Einheit ohne andere Einheiten zu überschreiben", () => {
    const stand = { ...leererLernweg("satteldach"), schritt: 2, erinnerung: "Beide Seiten, Stückbedarf, Zuschlag", erinnerungVerglichen: true, erinnerungBewertung: "teilweise" as const, zahlen: ["60", "", ""] };
    speichereLernweg("satteldach", stand);
    speichereLernweg("platten", leererLernweg("platten"));
    lernwegAuswahl.set("satteldach");
    const backup = exportiereDaten();
    localStorage.clear();
    expect(importiereDaten(backup)).toBe(2);
    expect(leseLernwege(localStorage.getItem("lernweg-v1")!).satteldach).toEqual(stand);
    expect(leseLernwege(localStorage.getItem("lernweg-v1")!).platten.schritt).toBe(0);
    expect(localStorage.getItem("lernweg-thema")).toBe("satteldach");
  });
  it("weist kaputte Speicherstände zurück und verhindert übersprungene Schritte", () => {
    for (const text of ["kaputt", "null", "[]", '{"satteldach":{"zahlen":["120"]}}']) expect(leseLernwege(text)).toEqual({});
    const basis = { ...leererLernweg("satteldach"), schritt: 4 };
    expect(leseLernwege(JSON.stringify({ satteldach: basis })).satteldach.schritt).toBe(1);
    const erinnert = { ...basis, erinnerung: "Text", erinnerungVerglichen: true, erinnerungBewertung: "richtig" };
    expect(leseLernwege(JSON.stringify({ satteldach: erinnert })).satteldach.schritt).toBe(2);
    const gerechnet = { ...erinnert, zahlen: ["120", "1200", "1296"], rechnungGeprueft: true };
    expect(leseLernwege(JSON.stringify({ satteldach: gerechnet })).satteldach.schritt).toBe(3);
    const fertig = { ...gerechnet, transfer: "Produkt prüfen", transferVerglichen: true, transferBewertung: "teilweise" };
    expect(leseLernwege(JSON.stringify({ satteldach: fertig })).satteldach.schritt).toBe(4);
  });
  it("verlangt eine geprüfte richtige Rechnung vor dem Baustellenfall", () => {
    const stand = { ...leererLernweg("satteldach"), zahlen: ["120", "1200", "1296"] };
    expect(rechnungGeschafft("satteldach", stand)).toBe(false);
    expect(rechnungGeschafft("satteldach", { ...stand, rechnungGeprueft: true })).toBe(true);
    expect(rechnungGeschafft("satteldach", { ...stand, zahlen: ["60", "600", "648"], rechnungGeprueft: true })).toBe(false);
  });
});
