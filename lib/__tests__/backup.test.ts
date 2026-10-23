import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { exportiereDaten, importiereDaten, pruefeSicherung } from "@/lib/backup";
import { ladeFortschritt } from "@/lib/progress";

const fortschritt = JSON.stringify({ a1: { aufgabeId: "a1", bewertung: "richtig", gesehenAm: 100, faelligAm: 200, intervallTage: 2 } });

describe("backup", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("Runde: Export → Löschen → Import stellt den Stand wieder her", () => {
    localStorage.setItem("fortschritt-v1", fortschritt);
    localStorage.setItem("pruefungsdatum", "2026-08-01");
    const datei = exportiereDaten();

    localStorage.clear();
    const n = importiereDaten(datei);

    expect(n).toBe(2);
    expect(localStorage.getItem("fortschritt-v1")).toBe(fortschritt);
    expect(localStorage.getItem("pruefungsdatum")).toBe("2026-08-01");
  });

  it("verwirft beschädigte bekannte Bereiche vor dem ersten Schreibzugriff", () => {
    localStorage.setItem("theme", "dark");
    localStorage.setItem("fortschritt-v1", fortschritt);
    for (const kaputt of ["kein JSON", "[]", '{"a1":{"bewertung":"richtig"}}', '{"a1":{"aufgabeId":"a1","bewertung":"richtig","gesehenAm":100,"faelligAm":200,"intervallTage":2,"verlauf":{}}}']) {
      expect(importiereDaten(JSON.stringify({ app: "dachdecker-lernstand", version: 1, daten: { theme: "light", "fortschritt-v1": kaputt } }))).toBeNull();
      expect(localStorage.getItem("theme")).toBe("dark");
      expect(localStorage.getItem("fortschritt-v1")).toBe(fortschritt);
    }
    expect(pruefeSicherung('{"app":"dachdecker-lernstand","version":2,"daten":{}}')).toBeNull();
    expect(pruefeSicherung('{"app":"dachdecker-lernstand","daten":[]}')).toBeNull();
  });

  it("stellt vorherige Werte bei einem Schreibfehler wieder her", () => {
    localStorage.setItem("theme", "dark");
    localStorage.setItem("lernzeit", "15");
    const original = Storage.prototype.setItem;
    let aufrufe = 0;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (++aufrufe === 2) throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    });
    expect(importiereDaten('{"app":"dachdecker-lernstand","version":1,"daten":{"theme":"light","lernzeit":"30"}}')).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("lernzeit")).toBe("15");
  });

  it("sichert Wortbank und Ton und kann eine Datei ohne Import vorab prüfen", () => {
    localStorage.setItem("wortbank", "1");
    localStorage.setItem("ton-aus", "0");
    const text = exportiereDaten();
    localStorage.clear();
    expect(pruefeSicherung(text)?.bereiche).toEqual(["Wortbank", "Ton"]);
    expect(localStorage.length).toBe(0);
    expect(importiereDaten(text)).toBe(2);
    expect(localStorage.getItem("wortbank")).toBe("1");
    expect(localStorage.getItem("ton-aus")).toBe("0");
  });

  it("ignoriert beschädigte alte Fortschrittseinträge, ohne intakte zu verlieren", () => {
    const daten = JSON.parse(fortschritt);
    localStorage.setItem("fortschritt-v1", JSON.stringify({ ...daten, kaputt: { verlauf: {} } }));
    expect(ladeFortschritt()).toEqual(daten);
  });

  it("setzt laufende Runden nur beim Wiederherstellen des Aufgaben-Lernstands zurück", () => {
    localStorage.setItem("dd-session-heute", "Runde");
    localStorage.setItem("letzte-session", "heute");
    expect(importiereDaten('{"app":"dachdecker-lernstand","daten":{"theme":"light"}}')).toBe(1);
    expect(localStorage.getItem("dd-session-heute")).toBe("Runde");
    expect(importiereDaten(JSON.stringify({ app: "dachdecker-lernstand", daten: { "fortschritt-v1": fortschritt } }))).toBe(1);
    expect(localStorage.getItem("dd-session-heute")).toBeNull();
    expect(localStorage.getItem("letzte-session")).toBeNull();
  });

  it("lehnt fremde/kaputte Dateien ab und schreibt nichts", () => {
    expect(importiereDaten("kein json")).toBeNull();
    expect(importiereDaten('{"app":"etwas anderes","daten":{}}')).toBeNull();
    // Unbekannte Schlüssel werden ignoriert.
    localStorage.clear();
    expect(importiereDaten('{"app":"dachdecker-lernstand","daten":{"boese":"x"}}')).toBe(0);
    expect(localStorage.getItem("boese")).toBeNull();
  });
});
