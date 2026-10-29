import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { WerkstattTraining } from "@/components/werkstatt/WerkstattTraining";
import { ProjektWerkstatt, projektAnsicht } from "@/components/projekte/ProjektWerkstatt";
import { appStorage, retryStorageWrites } from "@/lib/lernSpeicher";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import { ladeWerkstattStand, werkstattKey } from "@/lib/werkstattStand";
import { ladeKompetenzNachweise } from "@/lib/kompetenzNachweise";
import { meldePruefungsHilfe, pruefungsHilfenSnapshot } from "@/lib/pruefungsHilfen";

const falz = WERKSTATT_PFADE[0], biber = WERKSTATT_PFADE[1];
beforeEach(() => { appStorage.clear(); window.history.replaceState(null, "", "/projekte#werkstatt"); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(async () => { cleanup(); vi.restoreAllMocks(); await retryStorageWrites(); });

describe("Handwerkliches Werkstatttraining", () => {
  it("zeigt zwei getrennte Pfade und alle20Einheiten mit unverwechselbaren Links", () => {
    render(<WerkstattTraining />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: falz.titel })).toBeDefined();
    expect(screen.getByRole("heading", { name: biber.titel })).toBeDefined();
    for (const pfad of WERKSTATT_PFADE) for (const einheit of pfad.einheiten) expect(document.querySelector(`a[href="/projekte#${einheit.id}"]`)).not.toBeNull();
    expect(screen.getAllByText("0 von 10 Einheiten digital bearbeitet")).toHaveLength(2);
  });

  it("zeichnet eine tatsächlich geöffnete Anleitung auf und behält Hinweise nach Moduswechsel", async () => {
    const e = falz.einheiten[0]; render(<WerkstattTraining einheitId={e.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Bildanleitung starten →" }));
    expect(ladeWerkstattStand(e.id)?.gesehen).toEqual([e.bildschritte[0].id]);
    fireEvent.click(screen.getByRole("button", { name: "Nächstes Bild →" }));
    fireEvent.click(screen.getByRole("button", { name: "Schnitt" }));
    fireEvent.click(screen.getByRole("button", { name: "Wasserweg: Schritt 0 von 4" }));
    fireEvent.change(screen.getByLabelText("Meine Werkstattnotizen"), { target: { value: "Vom gleichen Bezug messen" } });
    fireEvent.click(screen.getByRole("button", { name: "Selbst probieren" }));
    const vor = ladeWerkstattStand(e.id)!;
    expect(vor.modus).toBe("probelauf"); expect(vor.ansicht).toBe("schnitt"); expect(vor.wasser).toBe(1);
    expect(vor.hilfen).toContain(`bildschritt:${e.bildschritte[0].id}`);
    expect(vor.hilfen).toContain(`bildschritt:${e.bildschritte[1].id}`);
    cleanup(); render(<WerkstattTraining einheitId={e.id} />);
    await waitFor(() => expect((screen.getByLabelText("Meine Werkstattnotizen") as HTMLTextAreaElement).value).toBe(vor.notiz));
    expect(ladeWerkstattStand(e.id)).toEqual(vor);
    expect(screen.getByRole("button", { name: "Schnitt" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("stellt halbe Zahleneingaben und die aktive zweite Aufgabe wieder her", () => {
    const e = falz.einheiten[2]; const ansicht = render(<WerkstattTraining einheitId={e.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Direkt selbst probieren →" }));
    fireEvent.change(screen.getByLabelText("Anzahl der Abstände"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Startversatz (cm)"), { target: { value: "0," } });
    expect(ladeWerkstattStand(e.id)?.antworten[e.aufgaben[0].id].versatz).toBe("0,");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Übung 2:`) }));
    expect(ladeWerkstattStand(e.id)?.aufgabeIndex).toBe(1);
    ansicht.unmount(); render(<WerkstattTraining einheitId={e.id} />);
    expect(screen.getByRole("button", { name: /^Übung 2:/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /^Übung 1:/ }));
    expect((screen.getByLabelText("Startversatz (cm)") as HTMLInputElement).value).toBe("0,");
    expect(ladeWerkstattStand(e.id)?.gesehen).toEqual([]);
  });

  it("speichert die erste eigenständige Linienantwort unverändert und markiert Nacharbeit", () => {
    const e = falz.einheiten[0]; render(<WerkstattTraining einheitId={e.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Direkt selbst probieren →" }));
    fireEvent.click(screen.getByRole("button", { name: /Untere linke Ecke/ }));
    fireEvent.click(screen.getByRole("button", { name: /Untere rechte Ecke/ }));
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    const erster = ladeWerkstattStand(e.id)!.abgaben[e.aufgaben[0].id][0];
    expect(erster.bewertung.richtig).toBe(true); expect(erster.hilfen).toEqual([]); expect(erster.modus).toBe("probelauf");
    const nachweise = ladeKompetenzNachweise();
    fireEvent.click(screen.getByRole("button", { name: "Noch einmal bearbeiten" }));
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    const jetzt = ladeWerkstattStand(e.id)!;
    expect(jetzt.abgaben[e.aufgaben[0].id][0]).toEqual(erster);
    expect(jetzt.abgaben[e.aufgaben[0].id][1].nachErklaerung).toBe(true);
    expect(jetzt.abgaben[e.aufgaben[0].id][1].hilfen).toContain(`${e.aufgaben[0].id}:vergleich`);
    expect(ladeKompetenzNachweise().filter(n => !n.nachErklaerung)).toHaveLength(nachweise.filter(n => !n.nachErklaerung).length);
  });

  it("erhält einen beschädigten Stand und zeigt eine erreichbare Sicherung", () => {
    const e = falz.einheiten[0], key = werkstattKey(e.id); appStorage.setItem(key, "{kaputt");
    render(<WerkstattTraining einheitId={e.id} />);
    expect(screen.getByRole("heading", { name: "Dein Werkstattstand bleibt erhalten." })).toBeDefined();
    expect(screen.getByRole("link", { name: "Vollständige Sicherung erstellen →" }).getAttribute("href")).toBe("/fortschritt");
    expect(appStorage.getItem(key)).toBe("{kaputt");
  });

  it("erfasst die seitliche Begriffshilfe, erlaubt den Taschenrechner und räumt den Bereich auf", () => {
    const e = falz.einheiten[0]; const ansicht = render(<WerkstattTraining einheitId={e.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Direkt selbst probieren →" }));
    expect(pruefungsHilfenSnapshot()).toBe(ladeWerkstattStand(e.id)!.id);
    act(() => meldePruefungsHilfe("taschenrechner"));
    expect(ladeWerkstattStand(e.id)!.hilfen).toEqual([]);
    act(() => meldePruefungsHilfe("glossar"));
    expect(ladeWerkstattStand(e.id)!.hilfen).toContain(`${e.aufgaben[0].id}:glossar`);
    ansicht.unmount(); expect(pruefungsHilfenSnapshot()).toBe("");
  });

  it("überschreibt bei StrictMode und bereits geöffneter Begriffshilfe keine neuere Revision", async () => {
    const e = falz.einheiten[0], panel = document.createElement("aside");
    panel.id = "werkzeug-panel"; panel.dataset.werkzeug = "glossar"; document.body.appendChild(panel);
    try {
      render(<StrictMode><WerkstattTraining einheitId={e.id} /></StrictMode>);
      await waitFor(() => expect(ladeWerkstattStand(e.id)?.hilfen).toContain("begriff:glossar"));
      expect(screen.queryByRole("alert")).toBeNull();
    } finally { panel.remove(); }
  });

  it("lässt eine ungespeicherte Texteingabe bei einem Schreibfehler sichtbar", () => {
    const e = falz.einheiten[0]; render(<WerkstattTraining einheitId={e.id} />);
    const alt = appStorage.getItem(werkstattKey(e.id));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Speicher voll"); });
    fireEvent.change(screen.getByLabelText("Meine Werkstattnotizen"), { target: { value: "Diese Eingabe bleibt sichtbar" } });
    expect((screen.getByLabelText("Meine Werkstattnotizen") as HTMLTextAreaElement).value).toBe("Diese Eingabe bleibt sichtbar");
    expect(screen.getByRole("alert").textContent).toContain("Speicher voll");
    expect(appStorage.getItem(werkstattKey(e.id))).toBe(alt);
  });

  it("archiviert den bisherigen Versuch dauerhaft vor einem neuen unabhängigen Einstieg", async () => {
    const e = falz.einheiten[0]; render(<WerkstattTraining einheitId={e.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Bildanleitung starten →" }));
    fireEvent.change(screen.getByLabelText("Meine Werkstattnotizen"), { target: { value: "Erster begleiteter Versuch" } });
    const vorher = ladeWerkstattStand(e.id)!;
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Neuen digitalen Versuch beginnen" }));
    await waitFor(() => expect(ladeWerkstattStand(e.id)?.id).not.toBe(vorher.id));
    expect(JSON.parse(appStorage.getItem(`${werkstattKey(e.id)}-archiv-${vorher.id}`)!)).toEqual(vorher);
    expect(ladeWerkstattStand(e.id)?.hilfen).toEqual([]);
    expect(screen.getByRole("button", { name: "Direkt selbst probieren →" })).toBeDefined();
  });
});

describe("Gemeinsame Projekt- und Werkstattnavigation", () => {
  it("gibt gültigen alten und neuen Hashes Vorrang und erhält bestehende Praxislinks", () => {
    for (const p of WERKSTATT_PFADE) for (const e of p.einheiten) expect(projektAnsicht(`#${e.id}`, "?ansicht=uebersicht", "ziegeldach")).toBe(e.id);
    expect(projektAnsicht("#ziegeldach", "?ansicht=praxis", null)).toBe("ziegeldach");
    expect(projektAnsicht("", "?ansicht=praxis", "ziegeldach")).toBe("praxis");
    expect(projektAnsicht("#werkstatt-praxis-biber-doppel", "", null)).toBe("werkstatt-praxis-biber-doppel");
    expect(projektAnsicht("#unbekannt", "", "ziegeldach")).toBe("");
    expect(projektAnsicht("", "?ansicht=uebersicht", "ziegeldach")).toBe("");
  });
  it("reagiert auf Hash- und Browsernavigation, ohne den begonnenen Stand zu löschen", async () => {
    const e = falz.einheiten[0]; window.history.replaceState(null, "", `/projekte#${e.id}`);
    render(<ProjektWerkstatt />);
    await waitFor(() => expect(appStorage.getItem(werkstattKey(e.id))).not.toBeNull());
    fireEvent.change(screen.getByLabelText("Meine Werkstattnotizen"), { target: { value: "Mein Bezugspunkt" } });
    expect(ladeWerkstattStand(e.id)?.notiz).toBe("Mein Bezugspunkt");
    act(() => { window.history.pushState(null, "", "/projekte#werkstatt"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(screen.getByRole("heading", { name: /Vom ersten Strich/ })).toBeDefined();
    act(() => { window.history.replaceState(null, "", `/projekte#${e.id}`); window.dispatchEvent(new PopStateEvent("popstate")); });
    await waitFor(() => expect((screen.getByLabelText("Meine Werkstattnotizen") as HTMLTextAreaElement).value).toBe("Mein Bezugspunkt"));
  });
});
