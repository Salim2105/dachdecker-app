import { describe, it, expect, beforeEach } from "vitest";
import { exportiereDaten, importiereDaten } from "@/lib/backup";

describe("backup", () => {
  beforeEach(() => localStorage.clear());

  it("Runde: Export → Löschen → Import stellt den Stand wieder her", () => {
    localStorage.setItem("fortschritt-v1", '{"a1":{"bewertung":"richtig"}}');
    localStorage.setItem("pruefungsdatum", "2026-08-01");
    const datei = exportiereDaten();

    localStorage.clear();
    const n = importiereDaten(datei);

    expect(n).toBe(2);
    expect(localStorage.getItem("fortschritt-v1")).toBe('{"a1":{"bewertung":"richtig"}}');
    expect(localStorage.getItem("pruefungsdatum")).toBe("2026-08-01");
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
