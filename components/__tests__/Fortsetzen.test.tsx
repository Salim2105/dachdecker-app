import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Fortsetzen } from "@/components/Fortsetzen";
import { SessionRunner } from "@/components/session/SessionRunner";
import { LernEinheiten } from "@/components/LernEinheiten";
import { letzteSessionStore, letztesLfStore } from "@/lib/appStores";
import { ladeFortschritt } from "@/lib/progress";
import type { Aufgabe } from "@/content/schema";

const aufgaben: Aufgabe[] = ["a", "b"].map((id) => ({ id, typ: "mc", lernfeld: "lf01", thema: "Dach", quelle: "Test", konfidenz: "hoch", frage: `Frage ${id}`, erklaerung: `Erklärung ${id}`, optionen: ["Ja", "Nein"], korrekt: [0] }));
function sichern(id: string, extra = {}) {
  localStorage.setItem(`dd-session-${id}`, JSON.stringify({ aufgabenIds: ["a", "b"], index: 0, ergebnisse: [], beantwortet: false, nacharbeit: false, nacharbeitErgebnisse: [], ...extra }));
}
beforeEach(() => { localStorage.clear(); letzteSessionStore.set(""); letztesLfStore.set(""); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Übungen wieder aufnehmen", () => {
  it("führt zur tatsächlichen Tagesrunde mit der gespeicherten Aufgabenzahl", () => {
    sichern("heute", { index: 1, ergebnisse: ["richtig"] });
    letzteSessionStore.set("heute");
    render(<Fortsetzen />);
    expect(screen.getByRole("link", { name: /Heutige Runde fortsetzen/ }).getAttribute("href")).toBe("/heute");
    expect(screen.getByText(/Frage 2 von 2/)).toBeTruthy();
  });
  it("zählt bei der Fehlernacharbeit nur die offenen Aufgaben", () => {
    sichern("lf01", { ergebnisse: ["richtig", "falsch"], nacharbeit: true });
    letztesLfStore.set("lf01");
    render(<Fortsetzen />);
    expect(screen.getByRole("link", { name: /Fehlernacharbeit fortsetzen/ })).toBeTruthy();
    expect(screen.getByText(/Frage 1 von 1/)).toBeTruthy();
  });
  it.each([-1, 0.5, 2])("zeigt keinen Fortsetzen-Link für einen ungültigen Index %s", (index) => {
    sichern("lf01", { index });
    letztesLfStore.set("lf01");
    render(<Fortsetzen />);
    expect(screen.queryByRole("link")).toBeNull();
  });
  it("setzt eine kleine Lerneinheit nach dem Rücksprung ins Lernfeld fort", () => {
    sichern("lf01-einheit", { index: 1, ergebnisse: ["richtig"] });
    letzteSessionStore.set("lf01-einheit");
    const karte = render(<Fortsetzen />);
    expect(screen.getByRole("link", { name: /Lerneinheit fortsetzen/ }).getAttribute("href")).toBe("/lernen/lf01");
    karte.unmount();
    render(<LernEinheiten lfId="lf01" lektionen={[]} aufgaben={aufgaben} />);
    expect(screen.getByText("Frage b")).toBeTruthy();
    expect(screen.getByText("2 / 2")).toBeTruthy();
  });
  it("zeigt eine schon gespeicherte Bewertung nach Neuladen ohne zweite Bewertung", () => {
    const ansicht = render(<SessionRunner aufgaben={aufgaben} lfId="lf01" />);
    fireEvent.click(screen.getByText("Antwort vergleichen"));
    fireEvent.click(screen.getByText("Stimmt vollständig"));
    const vorher = ladeFortschritt().a;
    ansicht.unmount();
    render(<SessionRunner aufgaben={aufgaben} lfId="lf01" />);
    expect(screen.getByText("Diese Aufgabe ist bereits bewertet")).toBeTruthy();
    expect(screen.queryByText("Antwort vergleichen")).toBeNull();
    expect(ladeFortschritt().a).toEqual(vorher);
    fireEvent.click(screen.getByText("Weiter"));
    expect(screen.getByText("Frage b")).toBeTruthy();
    expect(ladeFortschritt().a).toEqual(vorher);
  });
});
