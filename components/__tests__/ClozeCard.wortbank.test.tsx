import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ClozeCard } from "@/components/aufgaben/ClozeCard";
import { wortbankStore } from "@/lib/appStores";
import type { ClozeAufgabe } from "@/content/schema";

// Die Wortbank ist die Antwort auf ein physikalisches Problem: Mit Arbeits-
// handschuhen lässt sich auf dem Dach keine Bildschirmtastatur bedienen.
// Diese Tests halten fest, dass die Alternative wirklich ohne Tippen auskommt.
const aufgabe: ClozeAufgabe = {
  id: "test-001",
  typ: "cloze",
  lernfeld: "lf01",
  thema: "Test",
  quelle: "Test",
  konfidenz: "hoch",
  erklaerung: "Erklärung",
  text: "Die Einheit der Laenge ist der {{Meter}}, die der Masse das {{Kilogramm}}.",
};

beforeEach(() => {
  localStorage.clear();
  // Der Store hält seinen Wert im Modul-Cache — den setzt localStorage.clear()
  // nicht zurück. Ohne das hier schleppt jeder Test den Zustand des vorigen mit.
  wortbankStore.set(false);
});

afterEach(cleanup);

describe("ClozeCard – Wortbank", () => {
  it("zeigt standardmäßig Eingabefelder zum Tippen", () => {
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    expect(screen.getByLabelText("Lücke 1").tagName).toBe("INPUT");
    expect(screen.getByText("Wörter antippen statt tippen")).toBeTruthy();
  });

  it("schaltet auf antippbare Lücken um", () => {
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    expect(screen.getByLabelText("Lücke 1").tagName).toBe("BUTTON");
    expect(screen.getByText("Lieber selbst tippen")).toBeTruthy();
  });

  it("bietet jedes Lösungswort als Schaltfläche an", () => {
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    expect(screen.getByRole("button", { name: "Meter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kilogramm" })).toBeTruthy();
  });

  it("füllt beim Antippen eines Wortes die erste leere Lücke", () => {
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    fireEvent.click(screen.getByRole("button", { name: "Meter" }));
    expect(screen.getByLabelText("Lücke 1").textContent).toBe("Meter");
  });

  it("setzt ein Wort in die zuvor gewählte Lücke", () => {
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    fireEvent.click(screen.getByLabelText("Lücke 2"));
    fireEvent.click(screen.getByRole("button", { name: "Meter" }));
    expect(screen.getByLabelText("Lücke 2").textContent).toBe("Meter");
    expect(screen.getByLabelText("Lücke 1").textContent).toBe("…");
  });

  it("gibt ein Wort wieder frei, wenn die Lücke geleert wird", () => {
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    fireEvent.click(screen.getByRole("button", { name: "Meter" }));
    expect(screen.getByRole("button", { name: "Meter" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByLabelText("Lücke 1"));
    expect(screen.getByRole("button", { name: "Meter" }).hasAttribute("disabled")).toBe(false);
  });

  it("bewertet eine vollständig richtige Zuordnung als richtig", () => {
    const onErgebnis = vi.fn();
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={onErgebnis} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    fireEvent.click(screen.getByLabelText("Lücke 1"));
    fireEvent.click(screen.getByRole("button", { name: "Meter" }));
    fireEvent.click(screen.getByLabelText("Lücke 2"));
    fireEvent.click(screen.getByRole("button", { name: "Kilogramm" }));
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(onErgebnis).toHaveBeenCalledWith("richtig");
  });

  it("bewertet eine vertauschte Zuordnung als falsch", () => {
    const onErgebnis = vi.fn();
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={onErgebnis} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    fireEvent.click(screen.getByLabelText("Lücke 1"));
    fireEvent.click(screen.getByRole("button", { name: "Kilogramm" }));
    fireEvent.click(screen.getByLabelText("Lücke 2"));
    fireEvent.click(screen.getByRole("button", { name: "Meter" }));
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(onErgebnis).toHaveBeenCalledWith("falsch");
  });

  it("merkt sich die gewählte Eingabeart über die Aufgabe hinaus", () => {
    const { unmount } = render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    fireEvent.click(screen.getByText("Wörter antippen statt tippen"));
    unmount();
    render(<ClozeCard aufgabe={aufgabe} onErgebnis={() => {}} />);
    expect(screen.getByLabelText("Lücke 1").tagName).toBe("BUTTON");
  });
});
