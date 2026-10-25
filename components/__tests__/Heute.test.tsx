import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import HeutePage from "@/app/heute/page";
import { Tagesrunde } from "@/components/review/Tagesrunde";
import { createReviewSession, parseReviewSession, reviewSessionKey, type ReviewFilter, type ReviewSession, type ReviewTask } from "@/lib/reviewTasks";
import { recordReviewResult, reviewKey } from "@/lib/review";
import { MATHE_EINHEITEN } from "@/lib/matheGrundlagen";
import { erzeugeAufbauAufgabe } from "@/lib/matheAufbau";
import { instantiateProjektTransfer } from "@/lib/bauprojekte";
import { BILD_AUFGABEN } from "@/lib/bildtraining";
import { starteAktivitaet } from "@/lib/aktivitaeten";
import { lernzeitStore } from "@/lib/appStores";

vi.mock("@/lib/review", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/review")>(), recordReviewResult: vi.fn(), reviewStorageError: () => false }));
vi.mock("@/lib/content", () => ({ getLernfelder: () => [{ id: "lf01" }], getAufgaben: () => [{ id: "alt-1" }, { id: "alt-2" }] }));
vi.mock("@/components/session/SessionRunner", () => ({ SessionRunner: ({ aufgaben }: { aufgaben: { id: string }[] }) => <p>Alte Auswahl: {aufgaben.map(a => a.id).join(", ")}</p> }));
vi.mock("@/lib/reviewTasks", async importOriginal => {
  const m = await importOriginal<typeof import("@/lib/reviewTasks")>();
  const mathe = await import("@/lib/matheGrundlagen");
  return { ...m, createReviewSession: vi.fn((filter: ReviewFilter, minuten: number) => ({ version: 1, id: `runde-${filter}`, filter, minuten, startedAt: 1234, index: 0, tasks: [{ ref: { quelle: "mathe", id: "laenge-1", version: 1, lernzielIds: ["laengen"] }, titel: "Meter umrechnen", thema: "Längen", route: "/grundlagen/mathe#laengen", sekunden: 150, tief: true, payload: { typ: "mathe", aufgabe: mathe.MATHE_EINHEITEN[0].fragen[0] } }], answers: {}, results: {} })) };
});

const basic: ReviewTask = { ref: { quelle: "mathe", id: "laenge-1", version: 1, lernzielIds: ["laengen"] }, titel: "Meter umrechnen", thema: "Längen", route: "/grundlagen/mathe#laengen", sekunden: 150, tief: true, payload: { typ: "mathe", aufgabe: MATHE_EINHEITEN[0].fragen[0] } };
function seed(task: ReviewTask = basic, filter: ReviewFilter = "alles"): ReviewSession {
  const s: ReviewSession = { version: 1, id: `fest-${filter}`, filter, minuten: 15, startedAt: 1234, index: 0, tasks: [task], answers: {}, results: {} };
  localStorage.setItem(reviewSessionKey(filter), JSON.stringify(s));
  return s;
}
function stored(filter: ReviewFilter = "alles") { return parseReviewSession(localStorage.getItem(reviewSessionKey(filter)))!; }
beforeEach(() => { localStorage.clear(); lernzeitStore.set(15); vi.clearAllMocks(); });
afterEach(cleanup);

describe("Gemeinsame Tagesrunde", () => {
  it("behält Entwurf und Aufgabensnapshot beim Filterwechsel und nach einem Neustart", () => {
    seed(); const v = render(<Tagesrunde />);
    fireEvent.change(screen.getByLabelText("Dein Ergebnis"), { target: { value: "240" } });
    fireEvent.change(screen.getByLabelText("Einheit"), { target: { value: "cm" } });
    fireEvent.click(screen.getByRole("button", { name: /Kurz & aktiv/ }));
    fireEvent.change(screen.getByLabelText("Dein Ergebnis"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: /Bunter Mix/ }));
    expect((screen.getByLabelText("Dein Ergebnis") as HTMLInputElement).value).toBe("240");
    expect(stored().tasks[0]).toEqual(basic);
    v.unmount(); render(<Tagesrunde />);
    expect((screen.getByLabelText("Dein Ergebnis") as HTMLInputElement).value).toBe("240");
    expect(stored("kurz").answers[reviewKey(basic.ref)].wert).toBe("12");
  });

  it("speichert die konkrete Antwort vor dem Bewerten und wiederholt nur dieselbe Versuch-ID beim Öffnen", () => {
    const s = seed(); const v = render(<Tagesrunde />);
    fireEvent.change(screen.getByLabelText("Dein Ergebnis"), { target: { value: "240" } });
    fireEvent.change(screen.getByLabelText("Einheit"), { target: { value: "cm" } });
    fireEvent.click(screen.getByRole("button", { name: "Meine Antwort prüfen" }));
    const key = reviewKey(basic.ref), gespeichert = stored();
    expect(gespeichert.answers[key].wert).toBe("240");
    expect(gespeichert.results[key].versuchId).toBe(`${s.id}:${key}`);
    expect(gespeichert.results[key].bewertung).toBe("richtig");
    expect(screen.queryByLabelText("Dein Ergebnis")).toBeNull();
    v.unmount(); render(<Tagesrunde />);
    expect(screen.getByText("Deine Antwort:")).toBeTruthy();
    expect(new Set(vi.mocked(recordReviewResult).mock.calls.map(([r]) => r.versuchId)).size).toBe(1);
    expect(gespeichert.results[key].am).toBe(stored().results[key].am);
  });

  it("merkt Hilfen, ohne eine angefangene Runde bei neuer Zeitwahl zu ersetzen", () => {
    seed(); render(<Tagesrunde />);
    fireEvent.click(screen.getByRole("button", { name: "5 Minuten" }));
    const detail = screen.getByText("Ich brauche einen Ansatz").closest("details")!;
    detail.open = true; fireEvent(detail, new Event("toggle", { bubbles: true }));
    expect(stored().answers[reviewKey(basic.ref)].hilfen).toEqual(["Formelhinweis"]);
    expect(stored().minuten).toBe(15);
    expect(createReviewSession).not.toHaveBeenCalled();
  });

  it("bewahrt unlesbare Daten und archiviert sie erst nach ausdrücklichem Neubeginn", () => {
    const raw = "defekter alter Stand";
    localStorage.setItem(reviewSessionKey("alles"), raw); render(<Tagesrunde />);
    expect(screen.getByRole("alert").textContent).toContain("nicht überschrieben");
    expect(localStorage.getItem(reviewSessionKey("alles"))).toBe(raw);
    fireEvent.click(screen.getByRole("button", { name: "Neue Runde mit gewählter Zeit" }));
    expect(localStorage.getItem(reviewSessionKey("alles"))).toBe(raw);
    fireEvent.click(screen.getByRole("button", { name: "Neue Runde beginnen" }));
    const archiv = Object.keys(localStorage).find(k => k.startsWith("tagesrunde-archiv-"));
    expect(archiv && localStorage.getItem(archiv)).toBe(raw);
    expect(screen.getByLabelText("Dein Ergebnis")).toBeTruthy();
  });

  it("bewahrt die abgegebene Auswahl einer alten Fachkarte einschließlich echter Antworttexte", () => {
    const t: ReviewTask = { ...basic, ref: { quelle: "fachwissen", id: "lf01-test", version: 1, lernzielIds: ["ziel"] }, titel: "Plan lesen", tief: false, route: "/lernen/lf01/ueben", payload: { typ: "fachwissen", aufgabe: { id: "lf01-test", typ: "mc", lernfeld: "lf01", thema: "Plan", quelle: "Eigene Übung", konfidenz: "hoch", frage: "Welche Angabe gehört zum Maß?", optionen: ["Zahl und Einheit", "Nur die Zahl"], korrekt: [0], erklaerung: "Ein Maß braucht eine Einheit." } } };
    seed(t); render(<Tagesrunde />);
    fireEvent.click(screen.getByRole("button", { name: "Zahl und Einheit" }));
    fireEvent.click(screen.getByRole("button", { name: "Antwort abgeben" }));
    const a = stored().answers[reviewKey(t.ref)];
    expect(Object.values(a.original ?? {}).some(v => v.includes("__set"))).toBe(true);
    expect(screen.getByText("Deine gespeicherte Antwort:")).toBeTruthy();
    expect(screen.getAllByText("Zahl und Einheit").length).toBeGreaterThan(0);
  });

  it("bewertet die gespeicherte Aufbau-Rechenkette mit ihren Einheiten", () => {
    const a = erzeugeAufbauAufgabe("aufbau-formeln-1", 3);
    const t: ReviewTask = { ...basic, ref: { quelle: "mathe", id: a.id, version: 1, lernzielIds: [a.einheitId] }, payload: { typ: "aufbau", aufgabe: a } };
    seed(t); render(<Tagesrunde />);
    for (const schritt of a.schritte) {
      fireEvent.change(screen.getByLabelText(`Ergebnis: ${schritt.label}`), { target: { value: String(schritt.wert) } });
      fireEvent.change(screen.getByLabelText(`Einheit: ${schritt.label}`), { target: { value: schritt.einheit } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Meine Rechenkette prüfen" }));
    expect(stored().results[reviewKey(t.ref)].bewertung).toBe("richtig");
    expect(stored().tasks[0].payload).toEqual({ typ: "aufbau", aufgabe: a });
  });

  it("akzeptiert beim Baustellentransfer keine richtige Zahl mit falscher Einheit", () => {
    const a = instantiateProjektTransfer("ziegeldach", () => .8);
    const t: ReviewTask = { ...basic, ref: { quelle: "projekt", id: a.id, version: 1, lernzielIds: a.lernzielIds }, route: "/projekte#ziegeldach", payload: { typ: "projekt", aufgabe: a } };
    seed(t); render(<Tagesrunde />);
    fireEvent.change(screen.getByLabelText("Dein Ergebnis"), { target: { value: String(a.wert) } });
    fireEvent.change(screen.getByLabelText("Einheit"), { target: { value: "m" } });
    fireEvent.click(screen.getByRole("button", { name: "Meine Antwort prüfen" }));
    expect(stored().results[reviewKey(t.ref)].bewertung).toBe("falsch");
  });

  it("speichert nummerierte Bildzuordnungen als vollständige konkrete Antwort", () => {
    const a = BILD_AUFGABEN[0];
    const t: ReviewTask = { ...basic, ref: { quelle: "bild", id: a.id, version: 1, lernzielIds: a.lernzielIds }, route: "/bildtraining", payload: { typ: "bild", aufgabe: a } };
    seed(t); render(<Tagesrunde />);
    expect(a.aktivitaet.typ).toBe("zuordnen");
    if (a.aktivitaet.typ !== "zuordnen") throw new Error("Test braucht Zuordnung");
    for (const p of a.aktivitaet.paare) fireEvent.change(screen.getByLabelText(p.links), { target: { value: p.id } });
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    const s = stored();
    expect(s.results[reviewKey(t.ref)].bewertung).toBe("richtig");
    expect(Object.keys(s.answers[reviewKey(t.ref)].aktivitaet!.zuordnung)).toHaveLength(a.aktivitaet.paare.length);
    expect(starteAktivitaet(a.aktivitaet).zuordnung).toEqual({});
  });
});

describe("Vorhandene Tagesrunde", () => {
  it("öffnet die ursprüngliche Aufgabenfolge unverändert und lässt sie beim Wechsel erhalten", () => {
    const raw = JSON.stringify({ aufgabenIds: ["alt-2", "alt-1"], index: 0, beantwortet: false, ergebnisse: ["falsch", "richtig"], nacharbeit: true, nacharbeitErgebnisse: [] });
    localStorage.setItem("dd-session-heute", raw); render(<HeutePage />);
    expect(screen.getByText("Alte Auswahl: alt-2, alt-1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Zur gemeinsamen Tagesrunde →" }));
    expect(screen.getByText("Ein bisschen üben. Viel verbinden.")).toBeTruthy();
    expect(localStorage.getItem("dd-session-heute")).toBe(raw);
  });

  it("überschreibt einen alten Stand mit inzwischen fehlenden Aufgaben nicht", () => {
    const raw = JSON.stringify({ aufgabenIds: ["entfernt"], index: 0, beantwortet: false, ergebnisse: [], nacharbeit: false, nacharbeitErgebnisse: [] });
    localStorage.setItem("dd-session-heute", raw); render(<HeutePage />);
    expect(screen.getByRole("alert").textContent).toContain("gespeicherter Stand bleibt erhalten");
    expect(localStorage.getItem("dd-session-heute")).toBe(raw);
    expect(createReviewSession).not.toHaveBeenCalled();
  });
});
