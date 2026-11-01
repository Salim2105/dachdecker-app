import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Tagesrunde } from "@/components/review/Tagesrunde";
import { appStorage } from "@/lib/lernSpeicher";
import { getReviewTasks, parseReviewSession, reviewSessionKey, saveReviewSession, type ReviewSession } from "@/lib/reviewTasks";
import { loadReviewRecords, reviewKey } from "@/lib/review";
import { ladeKompetenzNachweise } from "@/lib/kompetenzNachweise";

const now = Date.UTC(2026, 9, 30, 12);
beforeEach(() => { appStorage.clear(); vi.spyOn(Date, "now").mockReturnValue(now); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe("Dachaufgaben in der Tagesrunde", () => {
  it.each([1, 2] as const)("erhält eine eingefrorene v%s-Ansicht vor und nach der Antwort und zählt nach Neustart einmal", version => {
    const task = structuredClone(getReviewTasks().find(t => t.ref.id === "dach3d-s03-funktion")!);
    if (task.payload.typ !== "bild" || !task.payload.aufgabe.medienRef) throw new Error("Dachbild erwartet");
    expect(task.payload.aufgabe.medienRef.version).toBe(2);
    task.payload.aufgabe.medienRef.version = version;
    const s: ReviewSession = { version: 1, id: "dach-runde", filter: "alles", minuten: 5, startedAt: now, index: 0, tasks: [task], answers: {}, results: {} };
    saveReviewSession(s);
    const view = render(<Tagesrunde />);
    const image = screen.getByRole("img");
    const src = image.getAttribute("src");
    expect(src).toBe(`/dach-vorschau/v${version}/steildach-falzziegel/s03-nah.webp`);
    expect(document.querySelector("canvas")).toBeNull();
    if (task.payload.typ !== "bild" || task.payload.aufgabe.aktivitaet.typ !== "baustellenfall") throw new Error("Dachauswahl erwartet");
    for (const o of task.payload.aufgabe.aktivitaet.optionen.filter(o => o.korrekt)) fireEvent.click(screen.getByRole("checkbox", { name: o.text }));
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    expect(screen.getByRole("img").getAttribute("src")).toBe(src);
    expect(screen.getByText("Darauf kommt es an")).toBeDefined();
    const stored = parseReviewSession(appStorage.getItem(reviewSessionKey("alles")))!;
    expect(stored.results[reviewKey(task.ref)].bewertung).toBe("richtig");
    const first = JSON.stringify(stored.results);
    view.unmount(); render(<Tagesrunde />);
    expect(screen.getByRole("img").getAttribute("src")).toBe(src);
    expect(JSON.stringify(parseReviewSession(appStorage.getItem(reviewSessionKey("alles")))!.results)).toBe(first);
    expect(loadReviewRecords()[reviewKey(task.ref)].verlauf).toHaveLength(1);
    expect(ladeKompetenzNachweise()).toHaveLength(1);
  });
});
