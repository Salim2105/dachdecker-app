import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { istText, istTextRecord, useAufgabenEntwurf } from "@/components/useAufgabenEntwurf";
import { SessionRunner } from "@/components/session/SessionRunner";
import { appStorage } from "@/lib/lernSpeicher";
import type { Aufgabe } from "@/content/schema";

beforeEach(() => { localStorage.clear(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Aufgabenentwürfe", () => {
  it("stellt Text, Zuordnungen und Mehrfachauswahl nach erneutem Mount wieder her", () => {
    const first = renderHook(() => ({
      text: useAufgabenEntwurf("frage", "text", "", istText),
      record: useAufgabenEntwurf<Record<string, string>>("frage", "zuordnung", {}, istTextRecord),
      set: useAufgabenEntwurf<Set<number>>("frage", "auswahl", new Set(), (v): v is Set<number> => v instanceof Set && [...v].every((n) => Number.isInteger(n))),
    }));
    act(() => {
      first.result.current.text[1]("Wasserweg beschreiben");
      first.result.current.record[1]({ a: "Rinne", b: "Fallrohr" });
      first.result.current.set[1](new Set([0, 2]));
    });
    first.unmount();
    const restored = renderHook(() => ({
      text: useAufgabenEntwurf("frage", "text", "", istText),
      record: useAufgabenEntwurf<Record<string, string>>("frage", "zuordnung", {}, istTextRecord),
      set: useAufgabenEntwurf<Set<number>>("frage", "auswahl", new Set(), (v): v is Set<number> => v instanceof Set && [...v].every((n) => Number.isInteger(n))),
    }));
    expect(restored.result.current.text[0]).toBe("Wasserweg beschreiben");
    expect(restored.result.current.record[0]).toEqual({ a: "Rinne", b: "Fallrohr" });
    expect(restored.result.current.set[0]).toEqual(new Set([0, 2]));
  });

  it("übernimmt mehrere funktionale Änderungen ohne verlorene Zwischenwerte", () => {
    const hook = renderHook(() => useAufgabenEntwurf("frage", "text", "", istText));
    act(() => { hook.result.current[1]((s) => `${s}A`); hook.result.current[1]((s) => `${s}B`); });
    expect(hook.result.current[0]).toBe("AB");
    expect(JSON.parse(appStorage.getItem("dd-entwurf-frage-text")!)).toBe("AB");
  });

  it("ersetzt beschädigte gespeicherte Werte durch den Anfangswert", () => {
    appStorage.setItem("dd-entwurf-frage-text", "{kaputt");
    const hook = renderHook(() => useAufgabenEntwurf("frage", "text", "leer", istText));
    expect(hook.result.current[0]).toBe("leer");
  });

  it("erhält Zufallszahlen und Antworten anderer Sitzungen beim Abschluss einer Übung", () => {
    appStorage.setItem("dd-calc-andere-aufgabe", '{"x":12}');
    appStorage.setItem("dd-entwurf-andere-aufgabe-uebung-rechnung", '"24"');
    const aufgabe: Aufgabe = { id: "begriff", typ: "mc", lernfeld: "lf01", thema: "Test", quelle: "Test", konfidenz: "hoch", frage: "Was ist eine Rinne?", optionen: ["Wasserführung", "Werkzeug"], korrekt: [0], erklaerung: "Die Rinne führt Wasser." };
    render(<SessionRunner lfId="test-abschluss" aufgaben={[aufgabe]} />);
    fireEvent.click(screen.getByRole("button", { name: "Antwort vergleichen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stimmt vollständig" }));
    fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
    expect(appStorage.getItem("dd-entwurf-andere-aufgabe-uebung-rechnung")).toBe('"24"');
    expect(appStorage.getItem("dd-calc-andere-aufgabe")).toBe('{"x":12}');
  });
});
