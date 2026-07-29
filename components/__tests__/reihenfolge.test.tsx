import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DrawCard } from "@/components/aufgaben/DrawCard";
import { FachbegriffCard } from "@/components/aufgaben/FachbegriffCard";
import type { DrawAufgabe, FachbegriffAufgabe } from "@/content/schema";

// Bei zeichnen und fachbegriff bewertet der Nutzer sich selbst, und dieser
// Klick verdoppelt das Wiederholungsintervall (lib/progress.ts:12). Solange die
// Lösung VOR der Bewertung stand, urteilte man über die eigene Leistung,
// nachdem man die richtige gesehen hatte — alles wirkt vertraut, sobald es
// dasteht. Fünf großzügige Klicks schieben eine Aufgabe von 2 auf 32 Tage.
//
// Diese Tests nageln die Reihenfolge fest. Sie sind der Grund, warum die Karten
// so gebaut sind, wie sie gebaut sind — ohne sie stellt der nächste Umbau
// "Lösung zuerst" wieder her, weil es sich flüssiger anfühlt.
const zeichnen: DrawAufgabe = {
  id: "test-draw",
  typ: "draw",
  lernfeld: "lf13a",
  thema: "Test",
  quelle: "Test",
  konfidenz: "hoch",
  erklaerung: "Erklärung zur Zeichnung.",
  aufgabentext: "Zeichne den Gratanschluss.",
  loesungSvg: '<svg viewBox="0 0 10 10"><title>MUSTERLOESUNG</title></svg>',
  schritte: ["Erster Schritt", "Zweiter Schritt"],
};

const begriff: FachbegriffAufgabe = {
  id: "test-fachbegriff",
  typ: "fachbegriff",
  lernfeld: "lf01",
  thema: "Test",
  quelle: "Test",
  konfidenz: "hoch",
  erklaerung: "Erklärung",
  begriff: "Traufe",
  definition: "DIE-DEFINITION-STEHT-HIER",
};

afterEach(cleanup);

describe("Selbstbewertung kommt vor der Lösung", () => {
  it("zeigt bei Zeichenaufgaben die Musterlösung erst nach der Bewertung", () => {
    const { container } = render(<DrawCard aufgabe={zeichnen} onErgebnis={() => {}} />);

    expect(container.innerHTML).not.toContain("MUSTERLOESUNG");
    expect(screen.queryByText("Erster Schritt")).toBeNull();
    expect(screen.getByText("Sitzt")).toBeTruthy();

    fireEvent.click(screen.getByText("Sitzt"));

    expect(container.innerHTML).toContain("MUSTERLOESUNG");
    expect(screen.getByText("Erster Schritt")).toBeTruthy();
  });

  it("meldet die Bewertung genau einmal und lässt sie danach sichtbar", () => {
    const gemeldet = vi.fn();
    render(<DrawCard aufgabe={zeichnen} onErgebnis={gemeldet} />);

    fireEvent.click(screen.getByText("Halb"));
    expect(gemeldet).toHaveBeenCalledExactlyOnceWith("teilweise");

    // Was man getippt hat, bleibt lesbar — sonst korrigiert man es beim
    // Vergleichen still nach oben.
    expect(screen.getByText(/Du hast getippt/)).toBeTruthy();
  });

  it("zeigt bei Fachbegriffen die Definition erst nach der Bewertung", () => {
    render(<FachbegriffCard aufgabe={begriff} onErgebnis={() => {}} />);

    expect(screen.queryByText("DIE-DEFINITION-STEHT-HIER")).toBeNull();
    expect(screen.getByText("Gewusst")).toBeTruthy();

    fireEvent.click(screen.getByText("Gewusst"));

    expect(screen.getByText("DIE-DEFINITION-STEHT-HIER")).toBeTruthy();
  });

  it("bietet nach dem Aufdecken keine zweite Bewertung mehr an", () => {
    const gemeldet = vi.fn();
    render(<FachbegriffCard aufgabe={begriff} onErgebnis={gemeldet} />);

    fireEvent.click(screen.getByText("Gewusst"));
    // Kein Knopf mehr, mit dem sich das Urteil nach dem Lesen revidieren ließe.
    expect(screen.queryByRole("button")).toBeNull();
    expect(gemeldet).toHaveBeenCalledOnce();
  });
});
