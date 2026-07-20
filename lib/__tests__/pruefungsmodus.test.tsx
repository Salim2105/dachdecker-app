import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { McCard } from "@/components/aufgaben/McCard";
import { ClozeCard } from "@/components/aufgaben/ClozeCard";
import { CalcCard } from "@/components/aufgaben/CalcCard";
import { DiagramCard } from "@/components/aufgaben/DiagramCard";
import type {
  McAufgabe,
  ClozeAufgabe,
  CalcAufgabe,
  DiagramAufgabe,
} from "@/content/schema";

afterEach(cleanup);

const basis = {
  lernfeld: "lf01",
  thema: "Test",
  quelle: "Testquelle",
  konfidenz: "hoch",
} as const;

const mc: McAufgabe = {
  ...basis,
  id: "t-mc",
  typ: "mc",
  erklaerung: "ERKLAERUNG-MC",
  frage: "Welche ist richtig?",
  optionen: ["A", "B", "C"],
  korrekt: [1],
};

const cloze: ClozeAufgabe = {
  ...basis,
  id: "t-cloze",
  typ: "cloze",
  erklaerung: "ERKLAERUNG-CLOZE",
  text: "Der Wert ist {{zwei}}.",
  akzeptiert: {},
};

const calc: CalcAufgabe = {
  ...basis,
  id: "t-calc",
  typ: "calc",
  erklaerung: "ERKLAERUNG-CALC",
  aufgabentext: "Rechne {a} mal 2.",
  parameter: [{ name: "a", label: "a", einheit: "m", min: 4, max: 4, schritt: 1 }],
  schritte: [{ beschreibung: "a mal 2", formel: "a * 2", ergebnisName: "r", einheit: "m" }],
  toleranzProzent: 1,
};

const diagram: DiagramAufgabe = {
  ...basis,
  id: "t-diagram",
  typ: "diagram",
  erklaerung: "ERKLAERUNG-DIAGRAM",
  frage: "Benenne die Punkte.",
  svg: "<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'></svg>",
  zuordnung: { a: "Alpha", b: "Beta" },
};

describe("Prüfungsmodus verrät nichts", () => {
  it("McCard: meldet das Ergebnis, zeigt aber keine Erklärung", () => {
    const onErgebnis = vi.fn();
    render(<McCard aufgabe={mc} onErgebnis={onErgebnis} modus="pruefung" />);
    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Antwort abgeben"));
    expect(onErgebnis).toHaveBeenCalledWith("falsch");
    expect(screen.queryByText("ERKLAERUNG-MC")).toBeNull();
  });

  it("ClozeCard: zeigt weder Lösung noch Erklärung", () => {
    const onErgebnis = vi.fn();
    render(<ClozeCard aufgabe={cloze} onErgebnis={onErgebnis} modus="pruefung" />);
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "drei" } });
    fireEvent.click(screen.getByText("Antwort abgeben"));
    expect(onErgebnis).toHaveBeenCalledWith("falsch");
    expect(screen.queryByText("ERKLAERUNG-CLOZE")).toBeNull();
    expect(screen.queryByText(/Lösung:/)).toBeNull();
  });

  it("CalcCard: zeigt weder Lösungsweg noch Erklärung und keine neuen Zahlen", () => {
    const onErgebnis = vi.fn();
    render(<CalcCard aufgabe={calc} onErgebnis={onErgebnis} modus="pruefung" />);
    expect(screen.queryByText("Neue Zahlen")).toBeNull();
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "99" } });
    fireEvent.click(screen.getByText("Antwort abgeben"));
    expect(onErgebnis).toHaveBeenCalledWith("falsch");
    expect(screen.queryByText("ERKLAERUNG-CALC")).toBeNull();
    expect(screen.queryByText("Lösungsweg")).toBeNull();
  });

  it("DiagramCard: zeigt keine richtige Bezeichnung und keine Erklärung", () => {
    const onErgebnis = vi.fn();
    render(<DiagramCard aufgabe={diagram} onErgebnis={onErgebnis} modus="pruefung" />);
    fireEvent.change(screen.getByLabelText("Bezeichnung für Punkt 1"), {
      target: { value: "Beta" },
    });
    fireEvent.change(screen.getByLabelText("Bezeichnung für Punkt 2"), {
      target: { value: "Alpha" },
    });
    fireEvent.click(screen.getByText("Antwort abgeben"));
    expect(onErgebnis).toHaveBeenCalledWith("falsch");
    expect(screen.queryByText("ERKLAERUNG-DIAGRAM")).toBeNull();
  });
});

describe("Übungsmodus löst weiterhin auf", () => {
  it("McCard zeigt die Erklärung", () => {
    render(<McCard aufgabe={mc} onErgebnis={vi.fn()} />);
    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Prüfen"));
    expect(screen.getByText("ERKLAERUNG-MC")).toBeTruthy();
  });

  it("ClozeCard zeigt Lösung und Erklärung", () => {
    render(<ClozeCard aufgabe={cloze} onErgebnis={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "drei" } });
    fireEvent.click(screen.getByText("Prüfen"));
    expect(screen.getByText("ERKLAERUNG-CLOZE")).toBeTruthy();
    expect(screen.getByText(/Lösung:/)).toBeTruthy();
  });

  it("CalcCard zeigt Lösungsweg und Erklärung", () => {
    render(<CalcCard aufgabe={calc} onErgebnis={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "8" } });
    fireEvent.click(screen.getByText("Prüfen"));
    expect(screen.getByText("Lösungsweg")).toBeTruthy();
    expect(screen.getByText("ERKLAERUNG-CALC")).toBeTruthy();
  });

  it("DiagramCard zeigt die Erklärung", () => {
    render(<DiagramCard aufgabe={diagram} onErgebnis={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Bezeichnung für Punkt 1"), {
      target: { value: "Alpha" },
    });
    fireEvent.change(screen.getByLabelText("Bezeichnung für Punkt 2"), {
      target: { value: "Beta" },
    });
    fireEvent.click(screen.getByText("Prüfen"));
    expect(screen.getByText("ERKLAERUNG-DIAGRAM")).toBeTruthy();
  });
});
