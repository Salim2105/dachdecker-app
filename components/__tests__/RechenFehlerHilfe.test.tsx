import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PraxisTrainer } from "@/components/PraxisTrainer";
import { CalcCard } from "@/components/aufgaben/CalcCard";
import { praxisStore } from "@/lib/praxisStore";
import { PRAXISFAELLE } from "@/lib/praxis";
import type { CalcAufgabe } from "@/content/schema";

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); praxisStore.set(""); });
afterEach(cleanup);

const aufgabe: CalcAufgabe = {
  id: "feedback-test", typ: "calc", lernfeld: "lf01", thema: "Fläche", quelle: "Eigene Übung", konfidenz: "hoch",
  erklaerung: "Fläche plus Zuschlag", aufgabentext: "Fläche plus 10 % Zuschlag", parameter: [], toleranzProzent: 1,
  schritte: [
    { beschreibung: "Fläche", formel: "8*5", ergebnisName: "a", einheit: "m²" },
    { beschreibung: "Zuschlag", formel: "a*1.1", ergebnisName: "b", einheit: "m²" },
  ],
};

describe("Fehler verstehen und nacharbeiten", () => {
  it("übt einen Zuschlagsfehler mit neuen Zahlen, ohne vorher die Lösung zu zeigen", () => {
    render(<PraxisTrainer />);
    const fall = PRAXISFAELLE[0];
    ["120", "1200", "96"].forEach((wert, i) => fireEvent.change(screen.getByLabelText(fall.rechnungen[i].frage), { target: { value: wert } }));
    fireEvent.change(screen.getByRole("textbox", { name: fall.entscheidung }), { target: { value: "Dachneigung prüfen" } });
    fireEvent.click(screen.getByText("Rechnung prüfen und Begründung vergleichen"));
    expect(screen.getByText("Zuschlag und Gesamtmenge unterscheiden")).toBeTruthy();
    expect(screen.queryByText(/200 × 0,15 = 30/)).toBeNull();
    fireEvent.click(screen.getByText("Das gezielt üben"));
    fireEvent.change(screen.getByLabelText(/Dein Ergebnis für die kurze Übung/), { target: { value: "30" } });
    fireEvent.click(screen.getByText("Kurze Übung prüfen"));
    expect(screen.getByText(/Das passt noch nicht/)).toBeTruthy();
    expect(screen.queryByText(/200 × 0,15 = 30/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/Dein Ergebnis für die kurze Übung/), { target: { value: "230" } });
    fireEvent.click(screen.getByText("Kurze Übung prüfen"));
    expect(screen.getByText(/Richtig — diesen Rechenschritt/)).toBeTruthy();
    expect(screen.getByText(/200 × 0,15 = 30/)).toBeTruthy();
    // Nacharbeit ändert nicht die ursprüngliche Antwort oder den globalen Lernstand.
    expect((screen.getByLabelText(fall.rechnungen[2].frage) as HTMLInputElement).value).toBe("96");
    expect(localStorage.getItem("fortschritt-v1")).toBeNull();
  });
  it("übernimmt keine Teilzahl aus ungültiger Eingabe als richtige Antwort", () => {
    const onErgebnis = vi.fn();
    render(<CalcCard aufgabe={aufgabe} onErgebnis={onErgebnis} />);
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "44abc" } });
    expect((screen.getByText("Prüfen") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(screen.getByLabelText("Ergebnis"), { key: "Enter" });
    expect(onErgebnis).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "40" } });
    fireEvent.click(screen.getByText("Prüfen"));
    expect(screen.getByText("Bis zum gesuchten Ergebnis weiterrechnen")).toBeTruthy();
    expect(onErgebnis).toHaveBeenCalledExactlyOnceWith("falsch");
  });
  it("zeigt in einer Prüfung keine Hinweise, Fehlerdiagnose oder Lösung", () => {
    const onErgebnis = vi.fn();
    render(<CalcCard aufgabe={aufgabe} onErgebnis={onErgebnis} modus="pruefung" />);
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "40" } });
    fireEvent.click(screen.getByText("Antwort abgeben"));
    expect(onErgebnis).toHaveBeenCalledExactlyOnceWith("falsch");
    expect(screen.queryByText("Bis zum gesuchten Ergebnis weiterrechnen")).toBeNull();
    expect(screen.queryByText("Lösungsweg")).toBeNull();
    expect(screen.queryByText(/Richtige Lösung/)).toBeNull();
  });
});
