import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SessionRunner } from "@/components/session/SessionRunner";
import { ladeFortschritt } from "@/lib/progress";
import type { Aufgabe, CalcAufgabe, ClozeAufgabe } from "@/content/schema";

const basis = {
  lernfeld: "lf01", thema: "Test", quelle: "Test", konfidenz: "hoch" as const,
  erklaerung: "Die Erklärung zum Lösungsweg.",
};
const frage = (id: string): Aufgabe => ({
  ...basis, id, typ: "mc", frage: `Frage ${id}?`, optionen: ["Richtig", "Falsch"], korrekt: [0],
});

function antwort(richtig: boolean) {
  fireEvent.click(screen.getByRole("button", { name: "Antwortmöglichkeiten als Hilfe" }));
  fireEvent.click(screen.getByRole("button", { name: richtig ? "Richtig" : "Falsch" }));
  fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Fehlernacharbeit", () => {
  it("wiederholt eine einzelne Aufgabe direkt, ohne erste Bewertung oder Rundenergebnis zu ersetzen", () => {
    render(<SessionRunner aufgaben={[frage("direkt"), frage("danach")]} lfId="lf01" />);
    expect(screen.queryByRole("button", { name: "Diese Übung wiederholen" })).toBeNull();
    antwort(false);
    const vorher = ladeFortschritt().direkt;
    fireEvent.click(screen.getByRole("button", { name: "Diese Übung wiederholen" }));
    expect(screen.getByText("Frage direkt?")).toBeTruthy();
    expect(screen.queryByText(basis.erklaerung)).toBeNull();
    expect(screen.queryByRole("button", { name: "Weiter" })).toBeNull();
    antwort(true);
    expect(ladeFortschritt().direkt).toEqual(vorher);
    expect(JSON.parse(localStorage.getItem("dd-session-lf01")!).ergebnisse).toEqual(["falsch"]);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText("Frage danach?")).toBeTruthy();
    expect(screen.queryByText(/Du übst diese Aufgabe noch einmal/)).toBeNull();
    expect(screen.getByText("2 / 2")).toBeTruthy();
  });

  it("erhält den neuen Entwurf und die erste Bewertung beim Neuladen einer direkten Wiederholung", () => {
    const aufgabe: ClozeAufgabe = { ...basis, id: "direkt-luecke", typ: "cloze", text: "{{Dach}} und {{Wand}}" };
    const aufgaben = [aufgabe];
    const ersteAnsicht = render(<SessionRunner aufgaben={aufgaben} lfId="lf01" />);
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "Dach" } });
    fireEvent.change(screen.getByLabelText("Lücke 2"), { target: { value: "Boden" } });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    const vorher = ladeFortschritt()[aufgabe.id];
    fireEvent.click(screen.getByRole("button", { name: "Diese Übung wiederholen" }));
    expect((screen.getByLabelText("Lücke 1") as HTMLInputElement).value).toBe("");
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "Da" } });
    ersteAnsicht.unmount();
    const zweiteAnsicht = render(<SessionRunner aufgaben={aufgaben} lfId="lf01" />);
    expect((screen.getByLabelText("Lücke 1") as HTMLInputElement).value).toBe("Da");
    expect(ladeFortschritt()[aufgabe.id]).toEqual(vorher);
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "Dach" } });
    fireEvent.change(screen.getByLabelText("Lücke 2"), { target: { value: "Wand" } });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(screen.queryByText("Diese Aufgabe ist bereits bewertet")).toBeNull();
    expect(screen.getByLabelText("Lücke 1")).toBeTruthy();
    zweiteAnsicht.unmount();
    render(<SessionRunner aufgaben={aufgaben} lfId="lf01" />);
    expect(screen.getByText(/Gespeicherte Bewertung: Richtig/)).toBeTruthy();
    expect(ladeFortschritt()[aufgabe.id]).toEqual(vorher);
    fireEvent.click(screen.getByRole("button", { name: "Diese Übung wiederholen" }));
    expect((screen.getByLabelText("Lücke 1") as HTMLInputElement).value).toBe("");
    expect(JSON.parse(localStorage.getItem("dd-session-lf01")!).ergebnisse).toEqual(["teilweise"]);
  });

  it("erhält auch bei direkter Wiederholung innerhalb der Fehlernacharbeit deren erstes Ergebnis", () => {
    render(<SessionRunner aufgaben={[frage("nacharbeit-direkt")]} lfId="lf01" />);
    antwort(false);
    const vorher = ladeFortschritt()["nacharbeit-direkt"];
    fireEvent.click(screen.getByRole("button", { name: "Fehler nacharbeiten" }));
    antwort(false);
    fireEvent.click(screen.getByRole("button", { name: "Diese Übung wiederholen" }));
    antwort(true);
    expect(ladeFortschritt()["nacharbeit-direkt"]).toEqual(vorher);
    fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
    expect(screen.getByText(/0 von 1 Aufgabe im zweiten Versuch richtig/)).toBeTruthy();
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("0 Richtig, 0 Fast, 1 Nochmal");
  });

  it("behält die konkreten Rechenzahlen beim direkten Wiederholen und öffnet ein leeres Eingabefeld", () => {
    const aufgabe: CalcAufgabe = {
      ...basis, id: "rechnung-direkt", typ: "calc", aufgabentext: "Verdopple {x}.", toleranzProzent: 1,
      parameter: [{ name: "x", label: "x", min: 3, max: 9, schritt: 1, einheit: "m" }],
      schritte: [{ beschreibung: "Mal zwei", formel: "x*2", ergebnisName: "y", einheit: "m" }],
    };
    render(<SessionRunner aufgaben={[aufgabe]} lfId="lf01" />);
    const key = "dd-calc-lf01:rechnung-direkt";
    const zahlen = localStorage.getItem(key)!;
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    const vorher = ladeFortschritt()[aufgabe.id];
    fireEvent.click(screen.getByRole("button", { name: "Diese Übung wiederholen" }));
    expect((screen.getByLabelText("Ergebnis") as HTMLInputElement).value).toBe("");
    expect(localStorage.getItem(key)).toBe(zahlen);
    expect(document.activeElement?.className).toBe("session-frage");
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: String(JSON.parse(zahlen).x * 2) } });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(screen.getByText("Richtig!")).toBeTruthy();
    expect(ladeFortschritt()[aufgabe.id]).toEqual(vorher);
  });

  it("wiederholt nur Fehler nach dem regulären Durchgang und behält das erste Ergebnis", () => {
    render(<SessionRunner aufgaben={[frage("a"), frage("b"), frage("c")]} lfId="lf01" />);
    antwort(false);
    expect(screen.getByText(basis.erklaerung)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    antwort(true);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    antwort(false);
    fireEvent.click(screen.getByRole("button", { name: "Fehler nacharbeiten" }));
    expect(screen.getByRole("heading", { name: "Fehler nacharbeiten" })).toBeTruthy();
    expect(screen.getByText("Frage a?")).toBeTruthy();
    expect(screen.getByText("1 / 2")).toBeTruthy();
    // Die Lösung erscheint erst nach der neuen Antwort.
    expect(screen.queryByText(basis.erklaerung)).toBeNull();
    antwort(true);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText("Frage c?")).toBeTruthy();
    antwort(false);
    fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("1 Richtig, 0 Fast, 2 Nochmal");
    expect(screen.getByText(/1 von 2 Aufgaben im zweiten Versuch richtig/)).toBeTruthy();
    expect(screen.queryByText("Frage a?")).toBeNull();
    expect(localStorage.getItem("dd-session-lf01")).toBeNull();
  });

  it("verändert das Wiederholungsintervall und die Lernbewertung bei kurzfristigem Erfolg nicht", () => {
    render(<SessionRunner aufgaben={[frage("frist")]} lfId="lf01" />);
    antwort(false);
    const vorher = ladeFortschritt().frist;
    fireEvent.click(screen.getByRole("button", { name: "Fehler nacharbeiten" }));
    antwort(true);
    expect(ladeFortschritt().frist).toEqual(vorher);
    expect(ladeFortschritt().frist.bewertung).toBe("falsch");
    expect(ladeFortschritt().frist.intervallTage).toBe(1);
  });

  it("nimmt auch automatisch teilweise richtige Lückentexte in die Nacharbeit auf", () => {
    const aufgabe: ClozeAufgabe = { ...basis, id: "luecke", typ: "cloze", text: "{{Dach}} und {{Wand}}" };
    render(<SessionRunner aufgaben={[aufgabe]} lfId="lf01" />);
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "Dach" } });
    fireEvent.change(screen.getByLabelText("Lücke 2"), { target: { value: "Boden" } });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(ladeFortschritt().luecke.bewertung).toBe("teilweise");
    fireEvent.click(screen.getByRole("button", { name: "Fehler nacharbeiten" }));
    expect(screen.getByLabelText("Lücke 1").getAttribute("value")).toBe("");
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "Dach" } });
    fireEvent.change(screen.getByLabelText("Lücke 2"), { target: { value: "Wand" } });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("0 Richtig, 1 Fast, 0 Nochmal");
    expect(screen.getByText(/1 von 1 Aufgabe im zweiten Versuch richtig/)).toBeTruthy();
  });

  it("überspringt die Nacharbeit, wenn alles richtig war", () => {
    render(<SessionRunner aufgaben={[frage("gut")]} lfId="heute" />);
    antwort(true);
    expect(screen.queryByRole("button", { name: "Fehler nacharbeiten" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
    expect(screen.queryByRole("heading", { name: "Deine Nacharbeit" })).toBeNull();
    expect(screen.getByRole("link", { name: "Fertig" }).getAttribute("href")).toBe("/");
  });

  it("setzt die Nacharbeit nach einer Unterbrechung mit dem richtigen Index fort", () => {
    const aufgaben = [frage("resume-1"), frage("resume-2")];
    const ansicht = render(<SessionRunner aufgaben={aufgaben} lfId="lf01" />);
    antwort(false);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    antwort(false);
    fireEvent.click(screen.getByRole("button", { name: "Fehler nacharbeiten" }));
    antwort(true);
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    ansicht.unmount();
    render(<SessionRunner aufgaben={aufgaben} lfId="lf01" />);
    expect(screen.getByRole("heading", { name: "Fehler nacharbeiten" })).toBeTruthy();
    expect(screen.getByText("Frage resume-2?")).toBeTruthy();
    expect(screen.getByText("2 / 2")).toBeTruthy();
    antwort(true);
    fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
    expect(screen.getByText(/2 von 2 Aufgaben im zweiten Versuch richtig/)).toBeTruthy();
  });

  it("kann beendet werden und benennt noch nicht nachgearbeitete Aufgaben", () => {
    render(<SessionRunner aufgaben={[frage("offen")]} lfId="lf01" />);
    antwort(false);
    fireEvent.click(screen.getByRole("button", { name: "Fehler nacharbeiten" }));
    fireEvent.click(screen.getByRole("button", { name: "Nacharbeit beenden" }));
    expect(screen.getByText(/1 Aufgabe noch nicht nachgearbeitet/)).toBeTruthy();
    expect(screen.getByText(/0 von 1 Aufgabe im zweiten Versuch richtig/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Nochmal üben" }));
    expect(screen.getByText("Frage offen?")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Fehler nacharbeiten" })).toBeNull();
  });

  it("behält die Rechenzahlen für die Nacharbeit bei und räumt sie beim Abschluss auf", () => {
    const aufgabe: CalcAufgabe = {
      ...basis, id: "rechnung", typ: "calc", aufgabentext: "Verdopple {x}.", toleranzProzent: 1,
      parameter: [{ name: "x", label: "x", min: 3, max: 9, schritt: 1, einheit: "m" }],
      schritte: [{ beschreibung: "Mal zwei", formel: "x*2", ergebnisName: "y", einheit: "m" }],
    };
    render(<SessionRunner aufgaben={[aufgabe]} lfId="lf01" />);
    const zahlen = sessionStorage.getItem("dd-calc-rechnung");
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Fehler nacharbeiten" }));
    expect(sessionStorage.getItem("dd-calc-rechnung")).toBe(zahlen);
    expect(screen.getByLabelText("Ergebnis").getAttribute("value")).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Nacharbeit beenden" }));
    expect(sessionStorage.getItem("dd-calc-rechnung")).toBeNull();
  });
});
