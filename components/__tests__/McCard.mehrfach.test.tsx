import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { McCard } from "@/components/aufgaben/McCard";
import type { McAufgabe } from "@/content/schema";

// 312 der 1357 Mehrfachauswahl-Aufgaben verrieten bisher nicht, wie viele
// Antworten stimmen. Wer das nicht weiß, probiert durch und muss sich nebenbei
// merken, was er schon angeklickt hat — das prüft Aufzählen statt Erkennen und
// kostet Arbeitsgedächtnis, das abends knapp ist.
//
// Die Anzahl steht deshalb in der Übung, aber NICHT in der Prüfungssimulation:
// die soll nicht leichter sein als die echte Prüfung. Genau diese Trennung
// halten die Tests hier fest — sie ist beim Lesen des Codes nicht offensichtlich
// und beim Umbauen leicht versehentlich eingeebnet.
const mehrfach: McAufgabe = {
  id: "test-mc-mehrfach",
  typ: "mc",
  lernfeld: "lf01",
  thema: "Test",
  quelle: "Test",
  konfidenz: "hoch",
  erklaerung: "Erklärung",
  frage: "Welche Aussagen treffen zu?",
  optionen: ["A", "B", "C", "D"],
  korrekt: [0, 2],
};

const einfach: McAufgabe = { ...mehrfach, id: "test-mc-einfach", korrekt: [1] };

afterEach(cleanup);

describe("McCard – Anzahl richtiger Antworten", () => {
  it("nennt in der Übung, wie viele Antworten stimmen", () => {
    render(<McCard aufgabe={mehrfach} onErgebnis={() => {}} />);
    const hinweis = screen.getByText(/sind richtig/).textContent?.replace(/\s+/g, " ");
    expect(hinweis).toContain("2 von 4");
  });

  it("verrät die Anzahl in der Prüfungssimulation nicht", () => {
    render(<McCard aufgabe={mehrfach} onErgebnis={() => {}} modus="pruefung" />);
    expect(screen.queryByText(/sind richtig/)).toBeNull();
    expect(screen.getByText("Mehrfachauswahl möglich")).toBeTruthy();
  });

  it("zeigt bei nur einer richtigen Antwort gar keinen Hinweis", () => {
    render(<McCard aufgabe={einfach} onErgebnis={() => {}} />);
    expect(screen.queryByText(/sind richtig/)).toBeNull();
    expect(screen.queryByText("Mehrfachauswahl möglich")).toBeNull();
  });
});
