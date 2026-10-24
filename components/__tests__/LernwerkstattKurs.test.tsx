import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LernwerkstattKurs } from "@/components/LernwerkstattKurs";
import { getCurriculum } from "@/lib/curriculum";
import { appStorage } from "@/lib/lernSpeicher";
import { kursStandKey, neuerKursStand } from "@/lib/kursStand";
import { ladeLernsignale } from "@/lib/lerndiagnose";

beforeEach(() => { appStorage.clear(); window.history.replaceState(null, "", "/lernen/lf07"); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("LF7-Lerneinheit", () => {
  it("führt durch Verstehen, Abruf, drei Kontrollen, Anwendung und Abschluss", () => {
    render(<LernwerkstattKurs lfId="lf07" />);
    fireEvent.click(screen.getByRole("button", { name: /Vier Bauteile, ein Wasserweg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Jetzt selbst erklären" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Rinne, Stutzen, Bogen, Fallrohr" } });
    fireEvent.click(screen.getByRole("button", { name: "Mit der Musterantwort vergleichen" }));
    fireEvent.click(screen.getByRole("button", { name: "Sicher erklärt" }));
    fireEvent.click(screen.getByRole("button", { name: "Zu den Kontrollfragen" }));
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Antwort vergleichen" }));
      fireEvent.click(screen.getByRole("button", { name: "Stimmt vollständig" }));
      fireEvent.click(screen.getByRole("button", { name: i < 2 ? "Nächste Kontrollfrage" : "Jetzt anwenden" }));
    }
    const einheit = getCurriculum("lf07")!.kapitel[0].einheiten[0];
    if (einheit.aktivitaet?.typ !== "zuordnen") throw new Error("Test erwartet Zuordnung");
    for (const p of einheit.aktivitaet.paare) fireEvent.change(screen.getByRole("combobox", { name: p.links }), { target: { value: p.id } });
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    expect(screen.getByRole("status").textContent).toContain("Lernziel angewendet");
    fireEvent.click(screen.getByRole("button", { name: "Einheit abschließen" }));
    expect(screen.getByRole("heading", { name: "Ein Lernschritt geschafft." })).toBeDefined();
    expect(JSON.parse(appStorage.getItem(kursStandKey(einheit))!).abgeschlossen).toBe(true);
  });
  it("stellt Phase und noch nicht abgegebene Erklärung nach Neustart wieder her", () => {
    const first = render(<LernwerkstattKurs lfId="lf07" />);
    fireEvent.click(screen.getByRole("button", { name: /Vier Bauteile, ein Wasserweg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Jetzt selbst erklären" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Meine angefangene Erklärung" } });
    first.unmount(); render(<LernwerkstattKurs lfId="lf07" />);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Meine angefangene Erklärung");
    expect(screen.getByRole("button", { name: "2. Selbst erklären" }).getAttribute("aria-current")).toBe("step");
  });
  it("nutzt Aktivitätsfehler für Lernhinweise und merkt Rückmeldungen für den nächsten Versuch", () => {
    const e = getCurriculum("lf07")!.kapitel[0].einheiten[0];
    if (e.aktivitaet?.typ !== "zuordnen") throw new Error("Test erwartet Zuordnung");
    const a = e.aktivitaet;
    appStorage.setItem(kursStandKey(e), JSON.stringify({ ...neuerKursStand(e), phase: 3, verglichen: true, selbstbewertung: "richtig",
      ergebnisse: e.aufgabenIds.map((id) => ({ id, bewertung: "richtig" })) }));
    window.history.replaceState(null, "", `/lernen/lf07#${e.id}`);
    const ersteAnsicht = render(<LernwerkstattKurs lfId="lf07" />);
    for (const [index, p] of a.paare.entries()) fireEvent.change(screen.getByRole("combobox", { name: p.links }), { target: { value: a.paare[(index + 1) % a.paare.length].id } });
    expect(JSON.parse(appStorage.getItem(kursStandKey(e))!).hilfen).toEqual([]);
    const pruefen = screen.getByRole("button", { name: "Meine Lösung prüfen" });
    fireEvent.click(pruefen); fireEvent.click(pruefen);
    expect(ladeLernsignale()).toEqual([expect.objectContaining({ aufgabeId: a.id, lernzielId: e.id, richtig: false, kategorie: "fachwissen", hilfen: [], route: `/lernen/lf07#${e.id}` })]);
    fireEvent.click(screen.getByRole("button", { name: "Einheit abschließen" }));
    expect(screen.getByText(/Anwendung noch üben/)).toBeDefined();
    expect(screen.getByText(/Einige Antworten oder Schritte waren noch unsicher/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "4. Anwenden" }));
    fireEvent.click(screen.getByRole("button", { name: "Noch einmal bearbeiten" }));
    expect(JSON.parse(appStorage.getItem(kursStandKey(e))!).hilfen).toContain("aktivitaet-rueckmeldung");
    expect(JSON.parse(appStorage.getItem(kursStandKey(e))!).abgeschlossen).toBe(false);
    for (const p of a.paare) fireEvent.change(screen.getByRole("combobox", { name: p.links }), { target: { value: p.id } });
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    expect(ladeLernsignale()).toHaveLength(2);
    expect(ladeLernsignale()[1]).toMatchObject({ richtig: true, hilfen: ["aktivitaet-rueckmeldung"] });
    ersteAnsicht.unmount(); render(<LernwerkstattKurs lfId="lf07" />);
    expect(screen.getByRole("status").textContent).toContain("Lernziel angewendet");
    expect(JSON.parse(appStorage.getItem(kursStandKey(e))!).hilfen).toContain("aktivitaet-rueckmeldung");
  });
});

describe("Übernahme bisheriger Runden", () => {
  it("öffnet eine schon begonnene kleine Übungsrunde nach dem Update wieder", () => {
    appStorage.setItem("dd-session-lf07-einheit", JSON.stringify({ index: 0, ergebnisse: [], beantwortet: false, nacharbeit: false, nacharbeitErgebnisse: [], aufgabenIds: ["lf07-001", "lf07-013"] }));
    appStorage.setItem("letzte-session", "lf07-einheit");
    render(<LernwerkstattKurs lfId="lf07" />);
    expect(screen.getByText(/Deine bisherige Übungsrunde ist erhalten geblieben/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Antwort vergleichen" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "← Zu den neuen Kapiteln" }));
    expect(screen.getByRole("heading", { name: "Deine Kapitel" })).toBeDefined();
    expect(appStorage.getItem("dd-session-lf07-einheit")).not.toBeNull();
  });
  it("macht Notizen entfallener Textteile im aufklappbaren Archiv erreichbar", () => {
    const e = getCurriculum("lf01")!.kapitel[0].einheiten[0];
    const alt = { ...e, id: "lf01-l01-e99", version: 1 };
    const key = kursStandKey(alt);
    const vorher = JSON.stringify({ ...neuerKursStand(alt), notiz: "Mein früherer Baustellenvergleich bleibt hier." });
    appStorage.setItem(key, vorher);
    render(<LernwerkstattKurs lfId="lf01" />);
    const summary = screen.getByText("Frühere Notizen und Lernstände (1)");
    const details = summary.closest("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    expect(within(details).getByText("Mein früherer Baustellenvergleich bleibt hier.")).toBeDefined();
    expect(within(details).getByText(/lf01-l01-e99 · Version 1/)).toBeDefined();
    expect(appStorage.getItem(key)).toBe(vorher);
  });
  it("übernimmt eine vorhandene Erklärung in die überarbeitete Einheit und zeigt ihren Ursprung", () => {
    const e = getCurriculum("lf01")!.kapitel[0].einheiten[0];
    expect(e.version).toBe(2);
    const alt = { ...e, version: 1 };
    const key = kursStandKey(alt);
    const vorher = JSON.stringify({ ...neuerKursStand(alt), notiz: "Meine eigene alte Erklärung." });
    appStorage.setItem(key, vorher);
    window.history.replaceState(null, "", `/lernen/lf01#${e.id}`);
    render(<LernwerkstattKurs lfId="lf01" />);
    expect(screen.getByText(/Deine frühere Notiz aus Version 1 bleibt erhalten/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Jetzt selbst erklären" }));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Meine eigene alte Erklärung.");
    const neu = JSON.parse(appStorage.getItem(kursStandKey(e))!);
    expect(neu.abgeschlossen).toBe(false);
    expect(neu.ergebnisse).toEqual([]);
    expect(appStorage.getItem(key)).toBe(vorher);
    expect(screen.getByText("Frühere Notizen und Lernstände (1)")).toBeDefined();
  });
});
