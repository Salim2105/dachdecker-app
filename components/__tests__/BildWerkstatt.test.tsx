import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BildWerkstatt } from "@/components/bildtraining/BildWerkstatt";
import { BILD_AUFGABEN, bildStandKey, ladeBildStand } from "@/lib/bildtraining";
import { appStorage } from "@/lib/lernSpeicher";
import { loadReviewRecords, reviewKey } from "@/lib/review";

beforeEach(() => {
  appStorage.clear();
  window.history.replaceState(null, "", "/bildtraining#bild-ziegeldach-bauteile");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function zuordnen() {
  screen.getAllByRole("combobox").forEach((select, i) => fireEvent.change(select, { target: { value: `p${i + 1}` } }));
}
describe("Bildtraining mit lokaler Wiederholung", () => {
  it("macht Bildnummern und Auswahlfelder per Tastatur erreichbar und behält unfertige Eingaben", () => {
    const first = render(<BildWerkstatt />);
    const nummer = screen.getByRole("button", { name: "Bildbereich 2 in der Liste zuordnen" });
    nummer.focus();
    expect(document.activeElement).toBe(nummer);
    fireEvent.click(nummer);
    expect(document.activeElement).toBe(screen.getAllByRole("combobox")[1]);
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "p2" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Mein Merksatz zu dieser Zeichnung" }), { target: { value: "Die Traufe bleibt sichtbar." } });
    first.unmount(); render(<BildWerkstatt />);
    expect((screen.getAllByRole("combobox")[1] as HTMLSelectElement).value).toBe("p2");
    expect((screen.getByRole("textbox", { name: "Mein Merksatz zu dieser Zeichnung" }) as HTMLTextAreaElement).value).toContain("Traufe");
  });
  it("wertet eine wieder geöffnete Lösung genau einmal und kennzeichnet Hilfe vor dem Prüfen", () => {
    const first = render(<BildWerkstatt />);
    fireEvent.click(screen.getByRole("button", { name: /Worauf sollte ich achten/ }));
    zuordnen(); fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    const a = BILD_AUFGABEN[0];
    const key = reviewKey({ quelle: "bild", id: a.id, version: a.version, lernzielIds: a.lernzielIds });
    const nachher = loadReviewRecords()[key];
    expect(nachher.verlauf).toHaveLength(1);
    expect(nachher.verlauf[0].hilfen).toEqual(["bildhinweis"]);
    const versuch = ladeBildStand(a).versuchId;
    first.unmount(); render(<BildWerkstatt />);
    expect(loadReviewRecords()[key].verlauf).toHaveLength(1);
    expect(ladeBildStand(a).versuchId).toBe(versuch);
    fireEvent.click(screen.getByRole("button", { name: "Noch einmal bearbeiten" }));
    expect(ladeBildStand(a).versuchId).not.toBe(versuch);
    expect(ladeBildStand(a).hilfen).toContain("musterloesung");
  });
  it("verändert eine vorher unabhängige Antwort nicht durch erst nachträglich geöffnete Erklärung", () => {
    render(<BildWerkstatt />); zuordnen();
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    fireEvent.click(screen.getByRole("button", { name: /Worauf sollte ich achten/ }));
    const a = BILD_AUFGABEN[0];
    const key = reviewKey({ quelle: "bild", id: a.id, version: a.version, lernzielIds: a.lernzielIds });
    expect(ladeBildStand(a).hilfen).toEqual([]);
    expect(loadReviewRecords()[key].verlauf[0].hilfen).toEqual([]);
  });
  it("zeigt beschädigte Daten und archiviert sie erst bei einem ausdrücklichen Neubeginn", () => {
    const key = bildStandKey(BILD_AUFGABEN[0].id);
    appStorage.setItem(key, "Original kann nicht gelesen werden");
    render(<BildWerkstatt />);
    expect(screen.getByRole("heading", { name: "Gespeicherte Bildaufgabe prüfen" })).toBeTruthy();
    expect(appStorage.getItem(key)).toBe("Original kann nicht gelesen werden");
    fireEvent.click(screen.getByRole("button", { name: "Original aufbewahren und Aufgabe neu beginnen" }));
    const archiv = Object.keys(appStorage).find(k => k.startsWith(`${key}-original-`));
    expect(archiv).toBeTruthy();
    expect(appStorage.getItem(archiv!)).toBe("Original kann nicht gelesen werden");
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
  });
});
