import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import HeutePage from "@/app/heute/page";
import { progressStore } from "@/lib/progressStore";
import { datumStore } from "@/lib/appStores";
import { heuteAufgaben } from "@/lib/tagesplan";

vi.mock("@/lib/progressStore", () => ({
  progressStore: { getSnapshot: vi.fn(() => ({ gespeichert: { bewertung: "richtig" } })) },
}));
vi.mock("@/lib/tagesplan", () => ({
  pruefungsreife: vi.fn(() => ({})),
  tagesdosis: vi.fn(() => 10),
  heuteAufgaben: vi.fn((_fortschritt, _jetzt, _dosis, modus) => [{ id: modus }]),
  istVerkettet: vi.fn(() => false),
}));
vi.mock("@/lib/content", () => ({
  getLernfelder: () => [{ id: "lf01" }],
  getAufgaben: () => [{ id: "alt-1" }, { id: "alt-2" }],
}));
vi.mock("@/components/session/SessionRunner", () => ({
  SessionRunner: ({ aufgaben }: { aufgaben: { id: string }[] }) => <p>Auswahl: {aufgaben[0].id}</p>,
}));

beforeEach(() => {
  localStorage.clear();
  datumStore.set("");
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("Heute-Auswahl", () => {
  it("stellt die ursprüngliche Auswahl wieder her, auch wenn der Fortschritt inzwischen geändert ist", () => {
    localStorage.setItem("dd-session-heute", JSON.stringify({
      aufgabenIds: ["alt-2", "alt-1"], index: 0, beantwortet: false,
      ergebnisse: ["falsch", "richtig"], nacharbeit: true, nacharbeitErgebnisse: [],
    }));
    render(<HeutePage />);
    expect(screen.getByText("Auswahl: alt-2")).toBeTruthy();
    expect(heuteAufgaben).not.toHaveBeenCalled();
  });

  it("plant neu, wenn eine gespeicherte Aufgabe inzwischen fehlt", () => {
    localStorage.setItem("dd-session-heute", JSON.stringify({
      aufgabenIds: ["entfernt"], index: 0, beantwortet: false,
      ergebnisse: [], nacharbeit: false, nacharbeitErgebnisse: [],
    }));
    render(<HeutePage />);
    expect(screen.getByText("Auswahl: alles")).toBeTruthy();
    expect(heuteAufgaben).toHaveBeenCalled();
  });

  it("liest gespeicherten Fortschritt und hält die Auswahl bei erneuten Rendern fest", () => {
    const ansicht = render(<HeutePage />);
    expect(heuteAufgaben).toHaveBeenCalledWith(
      progressStore.getSnapshot(), expect.any(Number), 60, "alles",
    );
    expect(screen.getByText("Auswahl: alles")).toBeTruthy();
    const anzahl = vi.mocked(heuteAufgaben).mock.calls.length;
    ansicht.rerender(<HeutePage />);
    expect(heuteAufgaben).toHaveBeenCalledTimes(anzahl);
  });

  it("plant beim Moduswechsel neu und entfernt den alten Sitzungsstand", () => {
    render(<HeutePage />);
    localStorage.setItem("dd-session-heute", "alter Stand");
    fireEvent.click(screen.getByText("Rechnen"));
    expect(screen.getByText("Auswahl: tief")).toBeTruthy();
    expect(localStorage.getItem("dd-session-heute")).toBeNull();
    expect(heuteAufgaben).toHaveBeenLastCalledWith(
      progressStore.getSnapshot(), expect.any(Number), 60, "tief",
    );
  });
});
