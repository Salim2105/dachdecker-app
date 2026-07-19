import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { McCard } from "@/components/aufgaben/McCard";
import type { McAufgabe } from "@/content/schema";

afterEach(cleanup);

const aufgabe: McAufgabe = {
  id: "t-mc",
  typ: "mc",
  lernfeld: "lf01",
  thema: "Test",
  quelle: "Testquelle",
  konfidenz: "hoch",
  erklaerung: "Die richtige Antwort ist B.",
  frage: "Welche ist richtig?",
  optionen: ["A", "B", "C"],
  korrekt: [1],
};

describe("McCard", () => {
  it("reports richtig and shows explanation when the correct option is chosen", () => {
    const onErgebnis = vi.fn();
    render(<McCard aufgabe={aufgabe} onErgebnis={onErgebnis} />);
    fireEvent.click(screen.getByText("B"));
    fireEvent.click(screen.getByText("Prüfen"));
    expect(onErgebnis).toHaveBeenCalledWith("richtig");
    expect(screen.getByText("Die richtige Antwort ist B.")).toBeTruthy();
  });

  it("reports falsch for a wrong choice", () => {
    const onErgebnis = vi.fn();
    render(<McCard aufgabe={aufgabe} onErgebnis={onErgebnis} />);
    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Prüfen"));
    expect(onErgebnis).toHaveBeenCalledWith("falsch");
  });
});
