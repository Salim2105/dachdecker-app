import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SessionRunner } from "@/components/session/SessionRunner";
import type { Aufgabe } from "@/content/schema";

// Der Abschlussbildschirm ist der einzige Ort, an dem Rückmeldung folgenlos
// laut sein darf: alle Bewertungen sind dort längst geschrieben. Diese Tests
// halten fest, was er zeigt — und dass der Weg zurück stimmt. Bei einer
// "heute"-Sitzung führte "Fertig" vorher auf /lernen/heute; "heute" ist aber
// kein Lernfeld, die Route existiert im statischen Export nicht.
const frage = (id: string): Aufgabe => ({
  id,
  typ: "mc",
  lernfeld: "lf01",
  thema: "Test",
  quelle: "Test",
  konfidenz: "hoch",
  erklaerung: "Erklärung",
  frage: `Frage ${id}?`,
  optionen: ["A", "B"],
  korrekt: [0],
});

/** Beantwortet die eine Aufgabe richtig und geht bis zum Abschluss durch. */
function durchspielen() {
  fireEvent.click(screen.getByText("A"));
  fireEvent.click(screen.getByText("Prüfen"));
  fireEvent.click(screen.getByText("Ergebnis anzeigen"));
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Abschlussbildschirm", () => {
  it("nennt die geschaffte Menge und den Bezug zum Gesamtstoff", () => {
    render(<SessionRunner aufgaben={[frage("t-1")]} lfId="lf01" />);
    durchspielen();

    expect(screen.getByText(/1 Aufgabe geschafft/)).toBeTruthy();
    // Ohne den Bezug sind die Zahlen eine Insel — 2039 Aufgaben stehen dahinter.
    expect(screen.getByText(/von/).textContent).toMatch(/von\s*2039\s*Aufgaben/);
  });

  it("zählt die Ergebnisse nach Art", () => {
    render(<SessionRunner aufgaben={[frage("t-2")]} lfId="lf01" />);
    durchspielen();

    const balken = screen.getByRole("img");
    expect(balken.getAttribute("aria-label")).toBe("1 Sitzt, 0 Fast, 0 Nochmal");
  });

  it("führt aus einem Lernfeld zurück in dieses Lernfeld", () => {
    render(<SessionRunner aufgaben={[frage("t-3")]} lfId="lf01" />);
    durchspielen();

    expect(screen.getByText("Fertig").getAttribute("href")).toBe("/lernen/lf01");
  });

  it("führt aus der Heute-Sitzung auf die Startseite statt auf /lernen/heute", () => {
    render(<SessionRunner aufgaben={[frage("t-4")]} lfId="heute" />);
    durchspielen();

    expect(screen.getByText("Fertig").getAttribute("href")).toBe("/");
  });
});
