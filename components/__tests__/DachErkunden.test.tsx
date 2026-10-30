import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DachErkunden } from "@/components/dach3d/DachErkunden";
import { ProjektWerkstatt, projektAnsicht } from "@/components/projekte/ProjektWerkstatt";
import { appStorage, retryStorageWrites } from "@/lib/lernSpeicher";
import * as lernSpeicher from "@/lib/lernSpeicher";
import { ladeDachStand, neuerDachStand, speichereDachStand } from "@/lib/dach3dStand";
import { getDachDetail } from "@/lib/dach3dInhalte";
import { dachDeckungsWunsch, dachMedienRoute, dachRoutenZiel, lernDachVerweise, werkstattDachMedium } from "@/lib/dach3dVerknuepfungen";

vi.mock("@/components/dach3d/DachBetrachter", () => ({ DachBetrachter: ({ form, detailId }: { form: string; detailId: string | null }) => <div data-testid="dachmodell">{form}:{detailId}</div> }));
vi.mock("@/lib/dach3dDownloads", () => ({ subscribeDachDownloads: () => () => {}, dachPaketStatus: async () => ({ status: "fehlt", bytes: 0 }), ladeDachPaket: async () => {}, loescheDachPaket: async () => {} }));
beforeEach(() => {
  appStorage.clear(); window.history.replaceState(null, "", "/projekte#dach-entdecken");
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(async () => { await act(async () => { await Promise.resolve(); }); cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); await retryStorageWrites(); });

function unabhaengig(detailId = "s03") {
  const s = neuerDachStand();
  s.jeDach.steildach = { ...s.jeDach.steildach, detailId, phase: "aufgaben", modus: "probelauf" };
  speichereDachStand(s); return s;
}

describe("Dach erkunden und ohne verlorene Arbeit wechseln", () => {
  it("zeigt den neuen Einstieg unter Baustellenprojekten und löst nur passende Dachlinks auf", () => {
    expect(projektAnsicht("#dach-walmdach-w01", "?ansicht=uebersicht", null)).toBe("dach-walmdach-w01");
    expect(dachRoutenZiel("dach-walmdach-s04")).toBeNull();
    expect(dachRoutenZiel("dach-flachdach-s03")).toBeNull();
    expect(projektAnsicht("", "?ansicht=uebersicht", "dach-steildach-s03")).toBe("");
    window.history.replaceState(null, "", "/projekte?ansicht=uebersicht"); render(<ProjektWerkstatt />);
    expect(screen.getByRole("heading", { name: "3D-Dach entdecken" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Mein Dach erkunden →" }).getAttribute("href")).toBe("/projekte#dach-entdecken");
  });
  it("bewahrt Notizen und den Bearbeitungspunkt jeder Dachform nach Wechsel und Neustart", async () => {
    const v = render(<DachErkunden form="steildach" detailId="s03" />);
    fireEvent.change(screen.getByLabelText("Meine Notizen zu Dachrinne, Halter, Stutzen und Fallrohr"), { target: { value: "Halter tragen, Stutzen leitet." } });
    expect(ladeDachStand()!.notizen.s03).toBe("Halter tragen, Stutzen leitet.");
    fireEvent.click(screen.getByRole("button", { name: "2. Aufbau" }));
    fireEvent.click(screen.getByRole("button", { name: "Walmdach auswählen" }));
    await waitFor(() => expect(ladeDachStand()!.form).toBe("walmdach"));
    fireEvent.change(screen.getByLabelText("Meine Notizen zu Walmdach"), { target: { value: "Vier geneigte Seiten" } });
    fireEvent.click(screen.getByRole("button", { name: "Steildach · Satteldach mit Gaube auswählen" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "2. Aufbau" }).getAttribute("aria-current")).toBe("step"));
    v.unmount(); render(<DachErkunden />);
    expect((screen.getByLabelText("Meine Notizen zu Dachrinne, Halter, Stutzen und Fallrohr") as HTMLTextAreaElement).value).toBe("Halter tragen, Stutzen leitet.");
    expect(ladeDachStand()!.notizen.walmdach).toBe("Vier geneigte Seiten");
  });
  it("hält den Selbsttest ohne Erklärung und speichert Antworten samt Bildvariante unverändert", () => {
    unabhaengig(); const detail = getDachDetail("s03")!;
    const v = render(<DachErkunden />);
    expect(screen.queryByText(detail.funktion)).toBeNull();
    const a = detail.aufgaben[0], korrekt = a.optionen.find(o => o.korrekt)!;
    fireEvent.click(screen.getByLabelText(korrekt.text));
    const entwurf = ladeDachStand()!.antworten[a.id];
    expect(entwurf.geprueft).toBe(false); expect(entwurf.hilfen).toEqual([]);
    v.unmount(); render(<DachErkunden />);
    expect((screen.getByLabelText(korrekt.text) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Meine Antwort prüfen" }));
    const erste = ladeDachStand()!.antworten[a.id];
    expect(erste.bewertung).toBe("richtig"); expect(erste.nachErklaerung).toBe(false);
    expect(erste.medienRef?.deckung).toBe("falzziegel");
    fireEvent.change(screen.getByLabelText("Deckungsart"), { target: { value: "biber-doppel" } });
    expect(ladeDachStand()!.antworten[a.id]).toEqual(erste);
    expect(within(screen.getByRole("group", { name: "Kontrollaufgabe auswählen" })).getAllByRole("button")).toHaveLength(2);
  });
  it("erhält benutzte Lernhilfen nach dem Ausblenden und dem Moduswechsel", () => {
    unabhaengig(); render(<DachErkunden />);
    fireEvent.click(screen.getByRole("button", { name: "Lernhilfe ansehen" }));
    fireEvent.click(screen.getByRole("button", { name: "Lernhilfe schließen" }));
    fireEvent.click(screen.getByRole("button", { name: "Mit Erklärung erkunden" }));
    fireEvent.click(screen.getByRole("button", { name: "Selbst prüfen" }));
    expect(ladeDachStand()!.antworten["dach3d-s03-funktion"].hilfen).toContain("fragehinweis");
    expect(ladeDachStand()!.antworten["dach3d-s03-funktion"].nachErklaerung).toBe(true);
  });
  it("verlinkt Lerntexte und beide Werkstattdeckungen auf gültige Details", () => {
    expect(lernDachVerweise(["lf07-l01", "lf07-l01"])).toHaveLength(1);
    expect(lernDachVerweise(["lf07-l01"])[0].href).toBe("/projekte#dach-steildach-s03");
    expect(werkstattDachMedium({ pfadId: "biber-doppel", slug: "wasser" }, "schnitt")).toMatchObject({ deckung: "biber-doppel", detailId: "g06", ansicht: "schnitt" });
    expect(dachMedienRoute(werkstattDachMedium({ pfadId: "biber-doppel", slug: "wasser" }, "schnitt")!)).toBe("/projekte?deckung=biber-doppel#dach-steildach-g06");
    expect(dachDeckungsWunsch("?deckung=biber-doppel", "steildach")).toBe("biber-doppel");
    expect(dachDeckungsWunsch("?deckung=biber-doppel", "flachdach")).toBeUndefined();
    expect(dachDeckungsWunsch("?deckung=../fremd", "steildach")).toBeUndefined();
  });
  it("übernimmt die Biber-Deckung aus dem Werkstattlink und erhält eigene Antworten beim Zurückgehen", async () => {
    window.history.replaceState(null, "", "/projekte?deckung=biber-doppel#dach-steildach-s03");
    render(<ProjektWerkstatt />);
    expect((screen.getByLabelText("Deckungsart") as HTMLSelectElement).value).toBe("biber-doppel");
    fireEvent.click(screen.getByRole("button", { name: "Selbst prüfen" }));
    const a = getDachDetail("s03")!.aufgaben[0];
    fireEvent.click(screen.getByLabelText(a.optionen[0].text));
    const antwort = ladeDachStand()!.antworten[a.id];
    expect(antwort.medienRef?.deckung).toBe("biber-doppel");
    fireEvent.change(screen.getByLabelText("Deckungsart"), { target: { value: "falzziegel" } });
    expect(window.location.search).toBe("?deckung=falzziegel");
    expect(ladeDachStand()!.antworten[a.id]).toEqual(antwort);
    fireEvent.click(screen.getByRole("button", { name: "Walmdach auswählen" }));
    await waitFor(() => expect(ladeDachStand()!.form).toBe("walmdach"));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId("dachmodell").textContent).toContain("walmdach");
    act(() => { window.history.replaceState(null, "", "/projekte?deckung=falzziegel#dach-steildach-s03"); window.dispatchEvent(new PopStateEvent("popstate")); });
    await waitFor(() => expect(ladeDachStand()!.form).toBe("steildach"));
    expect(ladeDachStand()!.antworten[a.id]).toEqual(antwort);
    expect((screen.getByLabelText(a.optionen[0].text) as HTMLInputElement).checked).toBe(true);
  });
  it("lässt bei einem Speicherfehler die aktuelle Aufgabe mit ihren Eingaben offen", async () => {
    window.history.replaceState(null, "", "/projekte#dach-steildach-s03");
    render(<ProjektWerkstatt />);
    fireEvent.change(screen.getByLabelText("Meine Notizen zu Dachrinne, Halter, Stutzen und Fallrohr"), { target: { value: "Meine Rinnenprüfung bleibt hier." } });
    vi.spyOn(lernSpeicher, "flushStorage").mockRejectedValueOnce(new Error("Der Gerätespeicher ist voll."));
    fireEvent.click(screen.getByRole("button", { name: "Walmdach auswählen" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Gerätespeicher"));
    expect(window.location.hash).toBe("#dach-steildach-s03");
    expect(ladeDachStand()!.form).toBe("steildach");
    expect((screen.getByLabelText("Meine Notizen zu Dachrinne, Halter, Stutzen und Fallrohr") as HTMLTextAreaElement).value).toBe("Meine Rinnenprüfung bleibt hier.");
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("alert").textContent).toContain("Gerätespeicher");
  });
  it("stellt bei einem fehlgeschlagenen Zielschreiben den ursprünglichen Bearbeitungspunkt wieder her", async () => {
    window.history.replaceState(null, "", "/projekte#dach-steildach-s03");
    render(<ProjektWerkstatt />);
    fireEvent.change(screen.getByLabelText("Meine Notizen zu Dachrinne, Halter, Stutzen und Fallrohr"), { target: { value: "Die Antwort bleibt an der Rinne." } });
    vi.spyOn(lernSpeicher, "flushStorage").mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Das neue Ziel konnte nicht gespeichert werden."));
    fireEvent.click(screen.getByRole("button", { name: "Walmdach auswählen" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("neue Ziel"));
    expect(window.location.hash).toBe("#dach-steildach-s03");
    expect(ladeDachStand()!.form).toBe("steildach");
    expect(ladeDachStand()!.jeDach.steildach.detailId).toBe("s03");
    fireEvent.change(screen.getByLabelText("Meine Notizen zu Dachrinne, Halter, Stutzen und Fallrohr"), { target: { value: "Auch weitere Eingaben gehen nach dem Fehler." } });
    expect(ladeDachStand()!.notizen.s03).toBe("Auch weitere Eingaben gehen nach dem Fehler.");
  });
});
