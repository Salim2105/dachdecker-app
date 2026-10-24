import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MatheWerkstatt, leseMatheStand, matheKey } from "@/components/mathe/MatheWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";
import { DIAGNOSE_KEY, ladeLernsignale } from "@/lib/lerndiagnose";

beforeEach(() => {
  appStorage.clear();
  window.history.replaceState(null, "", "/grundlagen/mathe");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const ergebnis = () => screen.getByRole("textbox", { name: "Dein Ergebnis" }) as HTMLInputElement;
const einheit = () => screen.getByRole("combobox", { name: "Einheit" }) as HTMLSelectElement;
const gibEin = (wert: string, masseinheit = "cm") => {
  fireEvent.change(ergebnis(), { target: { value: wert } });
  fireEvent.change(einheit(), { target: { value: masseinheit } });
};
function oeffneLaengen() {
  const view = render(<MatheWerkstatt />);
  fireEvent.click(screen.getByRole("button", { name: /Meter, Zentimeter und Millimeter/ }));
  return view;
}

describe("Fachmathe im Alltag", () => {
  it("bewahrt Auswahl, angefangene Antwort, Notiz und genutzte Hilfe bei einem Neustart", () => {
    const first = oeffneLaengen();
    gibEin("2,");
    fireEvent.change(screen.getByRole("textbox", { name: "Dein Merksatz in eigenen Worten" }), { target: { value: "Meter in Zentimeter: mal hundert" } });
    const details = screen.getByText("2. Welche Formel passt?").closest("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(leseMatheStand("laengen").antworten["laenge-1"].hilfen).toContain("formel");
    first.unmount();
    render(<MatheWerkstatt />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Meter, Zentimeter und Millimeter");
    expect(ergebnis().value).toBe("2,");
    expect(einheit().value).toBe("cm");
    expect((screen.getByRole("textbox", { name: "Dein Merksatz in eigenen Worten" }) as HTMLTextAreaElement).value).toBe("Meter in Zentimeter: mal hundert");
    expect(window.location.hash).toBe("#laengen");
    fireEvent.click(screen.getByRole("button", { name: "← Alle Mathe-Grundlagen" }));
    fireEvent.click(screen.getByRole("button", { name: /Prozent und Zuschläge/ }));
    fireEvent.click(screen.getByRole("button", { name: "← Alle Mathe-Grundlagen" }));
    fireEvent.click(screen.getByRole("button", { name: /Meter, Zentimeter und Millimeter/ }));
    expect(ergebnis().value).toBe("2,");
  });
  it("erzeugt bei leeren oder ungültigen Eingaben weder Ergebnis noch Lernsignal", () => {
    oeffneLaengen();
    fireEvent.click(screen.getByRole("button", { name: "Rechenweg prüfen" }));
    expect(screen.getByRole("alert").textContent).toMatch(/gültige Zahl/);
    expect(screen.queryByRole("status")).toBeNull();
    gibEin("240cm");
    fireEvent.click(screen.getByRole("button", { name: "Rechenweg prüfen" }));
    expect(screen.getByRole("alert").textContent).toMatch(/gültige Zahl/);
    expect(appStorage.getItem(DIAGNOSE_KEY)).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    gibEin("240", "");
    fireEvent.click(screen.getByRole("button", { name: "Rechenweg prüfen" }));
    expect(appStorage.getItem(DIAGNOSE_KEY)).toBeNull();
  });
  it("speichert eine Bewertung beim Doppelklick nur einmal und kennzeichnet einen Versuch nach Rückmeldung als Hilfe", () => {
    oeffneLaengen(); gibEin("240");
    const pruefen = screen.getByRole("button", { name: "Rechenweg prüfen" });
    act(() => { pruefen.click(); pruefen.click(); });
    expect(ladeLernsignale()).toHaveLength(1);
    expect(ladeLernsignale()[0]).toMatchObject({ aufgabeId: "laenge-1", richtig: true, hilfen: [] });
    expect(ergebnis().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Noch einmal rechnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Rechenweg prüfen" }));
    expect(ladeLernsignale()).toHaveLength(2);
    expect(ladeLernsignale()[1].hilfen).toContain("erklaerung");
    expect(screen.getByRole("status").textContent).toContain("Mit Rechenhilfe bearbeitet");
  });
  it("stellt die zweite Aufgabe und frühere Ergebnisse identisch wieder her", () => {
    const first = oeffneLaengen(); gibEin("240");
    fireEvent.click(screen.getByRole("button", { name: "Rechenweg prüfen" }));
    fireEvent.click(screen.getByRole("button", { name: "Nächste Rechenaufgabe" }));
    gibEin("3,", "cm");
    first.unmount(); render(<MatheWerkstatt />);
    expect(screen.getByText("Aufgabe 2 von 3")).toBeDefined();
    expect(ergebnis().value).toBe("3,");
    fireEvent.click(screen.getByRole("button", { name: "Vorherige Rechenaufgabe" }));
    expect(ergebnis().value).toBe("240");
    expect(ergebnis().disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("Rechenwert und Einheit passen.");
    expect(ladeLernsignale()).toHaveLength(1);
  });
  it("lässt den Abschluss erst nach drei geprüften Aufgaben zu und behält ihn nach Neustart", () => {
    const first = oeffneLaengen();
    expect(screen.queryByRole("button", { name: "Mathe-Einheit abschließen" })).toBeNull();
    for (const [index, wert, u] of [[0, "240", "cm"], [1, "3,5", "cm"], [2, "1,55", "m"]] as const) {
      gibEin(wert, u);
      fireEvent.click(screen.getByRole("button", { name: "Rechenweg prüfen" }));
      if (index < 2) fireEvent.click(screen.getByRole("button", { name: "Nächste Rechenaufgabe" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Mathe-Einheit abschließen" }));
    first.unmount(); render(<MatheWerkstatt />);
    expect(screen.getByRole("heading", { name: "Ein Rechenweg mehr im Werkzeugkoffer." })).toBeDefined();
    expect(screen.getByText(/3 von 3 zuletzt geprüften Antworten passen/)).toBeDefined();
    expect(ladeLernsignale()).toHaveLength(3);
  });
});

describe("Wiederherstellung beschädigter Mathe-Stände", () => {
  it("übernimmt keinen Abschluss ohne die dazugehörigen geprüften Antworten", () => {
    appStorage.setItem(matheKey("laengen"), JSON.stringify({ version: 1, index: 0, notiz: "Meine Notiz", antworten: {}, abgeschlossen: true }));
    expect(leseMatheStand("laengen")).toMatchObject({ notiz: "Meine Notiz", abgeschlossen: false });
    window.history.replaceState(null, "", "/grundlagen/mathe#laengen"); render(<MatheWerkstatt />);
    expect(screen.queryByRole("heading", { name: "Ein Rechenweg mehr im Werkzeugkoffer." })).toBeNull();
    expect(ergebnis().disabled).toBe(false);
  });
  it("berechnet geladene Bewertungen aus tatsächlicher Antwort und Einheit erneut", () => {
    appStorage.setItem(matheKey("laengen"), JSON.stringify({ version: 1, index: 0, notiz: "", antworten: {
      "laenge-1": { wert: "24", einheit: "cm", hilfen: [], ergebnis: { richtig: true, kategorie: "rechenweg", hinweis: "Falsche gespeicherte Behauptung" } },
    }, abgeschlossen: false }));
    const stand = leseMatheStand("laengen");
    expect(stand.antworten["laenge-1"].ergebnis).toMatchObject({ richtig: false, kategorie: "einheiten" });
    expect(stand.antworten["laenge-1"].ergebnis?.hinweis).toContain("Faktor 100");
  });
  it.each(["{", "null", '{"version":1,"index":999}', '{"version":1,"index":0,"notiz":"","antworten":[],"abgeschlossen":false}'])("verwirft einen nicht lesbaren Entwurf %s", (wert) => {
    appStorage.setItem(matheKey("laengen"), wert);
    expect(leseMatheStand("laengen")).toMatchObject({ index: 0, antworten: {}, abgeschlossen: false });
  });
});
