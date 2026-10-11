import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { McCard } from "@/components/aufgaben/McCard";
import type { McAufgabe } from "@/content/schema";

afterEach(cleanup);
const aufgabe: McAufgabe = {
  id: "abruf", typ: "mc", lernfeld: "lf01", thema: "Dach", frage: "Wo liegt die Traufe?",
  optionen: ["Am unteren Dachrand", "Am First"], korrekt: [0], konfidenz: "hoch",
  erklaerung: "Hier läuft das Wasser ab.", quelle: "Fachbuch: Beispielquelle",
};
describe("Aktiver Abruf", () => {
  it("zeigt keine Auswahl oder Lösung vor dem freien Antwortversuch", () => {
    const onErgebnis = vi.fn();
    render(<McCard aufgabe={aufgabe} onErgebnis={onErgebnis} />);
    expect(screen.queryByText("Am unteren Dachrand")).toBeNull();
    fireEvent.change(screen.getByLabelText("Deine Antwort"), { target: { value: "Unten am Dach" } });
    fireEvent.click(screen.getByRole("button", { name: "Antwort vergleichen" }));
    expect(screen.getByText("Am unteren Dachrand")).toBeTruthy();
    expect(screen.getByText("Deine Antwort: Unten am Dach")).toBeTruthy();
    expect(onErgebnis).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Stimmt vollständig" }));
    expect(onErgebnis).toHaveBeenCalledExactlyOnceWith("richtig", { selbstBewertet: true, mitHilfe: false });
    expect(screen.queryByRole("button", { name: "Teilweise" })).toBeNull();
    expect(screen.getByText(aufgabe.quelle)).toBeTruthy();
  });
  it("erfasst die Auswahlhilfe ausdrücklich und bewertet die Auswahl automatisch", () => {
    const onErgebnis = vi.fn();
    render(<McCard aufgabe={aufgabe} onErgebnis={onErgebnis} />);
    fireEvent.click(screen.getByRole("button", { name: "Antwortmöglichkeiten als Hilfe" }));
    fireEvent.click(screen.getByRole("button", { name: "Am unteren Dachrand" }));
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(onErgebnis).toHaveBeenCalledWith("richtig", { mitHilfe: true });
  });
});
