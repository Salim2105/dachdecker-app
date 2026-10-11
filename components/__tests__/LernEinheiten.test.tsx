import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LernEinheiten } from "@/components/LernEinheiten";
import { PraxisTrainer } from "@/components/PraxisTrainer";
import { ladeFortschritt } from "@/lib/progress";
import type { Aufgabe, Lektion } from "@/content/schema";

const lektion: Lektion = { id: "l1", lernfeld: "lf01", thema: "Dach", titel: "Dachwissen", inhalt: ["Die Traufe liegt unten."], quelle: "Quellenbuch", konfidenz: "hoch" };
const aufgabe: Aufgabe = { id: "einheit", typ: "mc", lernfeld: "lf01", thema: "Dach", frage: "Wo ist die Traufe?", optionen: ["Unten", "Oben"], korrekt: [0], erklaerung: "Unten.", quelle: "Quellenbuch", konfidenz: "hoch" };
beforeEach(() => { localStorage.clear(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Lerneinheiten", () => {
  it("blendet die Theorie während der Übung aus und zählt Erfolg unmittelbar danach nicht als langfristigen Abruf", () => {
    render(<LernEinheiten lfId="lf01" lektionen={[lektion]} aufgaben={[aufgabe]} />);
    expect(screen.getByText("Die Traufe liegt unten.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Kleine Übung starten/ }));
    expect(screen.queryByText("Die Traufe liegt unten.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Antwort vergleichen" }));
    fireEvent.click(screen.getByRole("button", { name: "Stimmt vollständig" }));
    expect(ladeFortschritt().einheit.verlauf?.at(-1)?.nachErklaerung).toBe(true);
    expect(ladeFortschritt().einheit.intervallTage).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
    expect(screen.getByRole("link", { name: "Fertig" }).getAttribute("href")).toBe("/lernen/lf01");
  });
  it("ordent einer unverknüpften Lektion keine fremden Aufgaben zu", () => {
    render(<LernEinheiten lfId="lf01" lektionen={[{ ...lektion, thema: "Anderes Thema" }]} aufgaben={[aufgabe]} />);
    expect(screen.queryByRole("button", { name: /Kleine Übung starten/ })).toBeNull();
    expect(screen.getByText(/noch keine passenden Aufgaben verknüpft/)).toBeTruthy();
  });
});

describe("Praxisfall", () => {
  it("zeigt die Lösungswege erst nach allen Rechnungen und einer eigenen Begründung", () => {
    render(<PraxisTrainer />);
    const knopf = screen.getByRole("button", { name: "Rechnung prüfen und Begründung vergleichen" });
    expect((knopf as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText(/1.200 × 1,08/)).toBeNull();
    const inputs = screen.getAllByRole("textbox");
    ["120", "1200", "1296", "Ich brauche Neigung und Herstellerangaben."].forEach((value, i) => fireEvent.change(inputs[i], { target: { value } }));
    fireEvent.click(knopf);
    expect(screen.getAllByText("Richtig")).toHaveLength(3);
    expect(screen.getByText(/1.200 × 1,08/)).toBeTruthy();
    expect(screen.getByText(/Nur die Zahlen werden automatisch geprüft/)).toBeTruthy();
  });
});
