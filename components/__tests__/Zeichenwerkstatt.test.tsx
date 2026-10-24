import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DrawCard } from "@/components/aufgaben/DrawCard";
import { ZeichnenBereich } from "@/components/zeichnen/ZeichnenBereich";
import { ladeZeichenEntwurf } from "@/lib/zeichenSpeicher";
import type { DrawAufgabe } from "@/content/schema";

const { bewerte } = vi.hoisted(() => ({ bewerte: vi.fn() }));
vi.mock("@/components/useProgress", () => ({ useProgress: () => ({ fortschritt: {}, bewerte }) }));
const aufgabe: DrawAufgabe = {
  id: "test-workshop", typ: "draw", lernfeld: "lf07", thema: "Rinnen", quelle: "Schulbuch", konfidenz: "hoch",
  erklaerung: "Das Wasser läuft zur tiefsten Stelle.", aufgabentext: "Zeichne den Wasserweg.",
  loesungSvg: '<svg viewBox="0 0 100 100"><title>Vergleichszeichnung</title><path d="M0 0L100 100"/></svg>',
  schritte: ["Wasserweg nachvollziehbar eingezeichnet", "Bauteile beschriftet"],
};
afterEach(cleanup);
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

function zeichneLinieMitTastatur() {
  fireEvent.click(screen.getByRole("button", { name: "Linie" }));
  const flaeche = screen.getByRole("application", { name: "Zeichenfläche" });
  fireEvent.keyDown(flaeche, { key: "Enter" });
  fireEvent.keyDown(flaeche, { key: "ArrowRight" });
  fireEvent.keyDown(flaeche, { key: "ArrowDown" });
  fireEvent.keyDown(flaeche, { key: "Enter" });
}

describe("Zeichenwerkstatt bleibt ohne Maus bedienbar und speichert den Versuch", () => {
  it("stellt Linie und Undo/Redo-Zweig nach dem Schließen wieder her", () => {
    const erster = render(<DrawCard aufgabe={aufgabe} onErgebnis={vi.fn()} />);
    zeichneLinieMitTastatur();
    expect(ladeZeichenEntwurf(aufgabe.id).verlauf.aktuell).toEqual([expect.objectContaining({ typ: "linie", start: { x: 100, y: 100 }, ende: { x: 110, y: 110 } })]);
    fireEvent.click(screen.getByRole("button", { name: "Rückgängig" }));
    erster.unmount();
    render(<DrawCard aufgabe={aufgabe} onErgebnis={vi.fn()} />);
    expect(ladeZeichenEntwurf(aufgabe.id).verlauf.aktuell).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Wiederholen" }));
    expect(ladeZeichenEntwurf(aufgabe.id).verlauf.aktuell).toHaveLength(1);
  });
  it("behält Beschriftungseingaben beim Wechsel zum Papierweg und bei Neustart", () => {
    const erster = render(<DrawCard aufgabe={aufgabe} onErgebnis={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Beschriftung" }));
    fireEvent.change(screen.getByLabelText("Beschriftungstext"), { target: { value: "Rinnenhalter" } });
    fireEvent.click(screen.getByRole("button", { name: "Auf Papier zeichnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Direkt zeichnen" }));
    expect((screen.getByLabelText("Beschriftungstext") as HTMLInputElement).value).toBe("Rinnenhalter");
    erster.unmount();
    render(<DrawCard aufgabe={aufgabe} onErgebnis={vi.fn()} />);
    expect((screen.getByLabelText("Beschriftungstext") as HTMLInputElement).value).toBe("Rinnenhalter");
  });
  it("speichert Kriterien und Notizen als Selbstprüfung ohne eine zweite automatische Bewertung", () => {
    const gemeldet = vi.fn();
    const erster = render(<DrawCard aufgabe={aufgabe} onErgebnis={gemeldet} />);
    expect(screen.queryByText("Vergleichszeichnung")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Halb" }));
    fireEvent.click(screen.getByLabelText("Wasserweg nachvollziehbar eingezeichnet"));
    fireEvent.change(screen.getByLabelText("Das verbessere ich beim nächsten Versuch"), { target: { value: "Die Pfeile deutlicher zeichnen." } });
    expect(gemeldet).toHaveBeenCalledExactlyOnceWith("teilweise");
    expect(ladeZeichenEntwurf(aufgabe.id).selbstbewertung?.selbstBewertet).toBe(true);
    erster.unmount();
    render(<DrawCard aufgabe={aufgabe} onErgebnis={gemeldet} anfangsBewertung="teilweise" />);
    expect((screen.getByLabelText("Wasserweg nachvollziehbar eingezeichnet") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Das verbessere ich beim nächsten Versuch") as HTMLTextAreaElement).value).toBe("Die Pfeile deutlicher zeichnen.");
    expect(gemeldet).toHaveBeenCalledTimes(1);
  });
  it("markiert auch Standalone-Urteile als selbstbewertet und setzt bewertete Läufe ohne Doppelwertung fort", () => {
    const erster = render(<ZeichnenBereich />);
    fireEvent.click(screen.getByRole("button", { name: /Alle \d+ zeichnen, gemischt/ }));
    fireEvent.click(screen.getByRole("button", { name: "Sitzt" }));
    expect(bewerte).toHaveBeenCalledExactlyOnceWith(expect.any(String), "richtig", { selbstBewertet: true });
    erster.unmount();
    render(<ZeichnenBereich />);
    expect(screen.getByText(/Du hast getippt/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nächste Zeichnung" })).toBeTruthy();
    expect(bewerte).toHaveBeenCalledTimes(1);
  });
});
