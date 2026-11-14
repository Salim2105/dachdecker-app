import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LernwerkstattKurs } from "@/components/LernwerkstattKurs";
import { getCurriculum } from "@/lib/curriculum";
import { appStorage } from "@/lib/lernSpeicher";
import { kursStandKey, ladeKursStand, neuerKursStand } from "@/lib/kursStand";

const e = getCurriculum("lf10")!.kapitel.flatMap(k => k.einheiten).find(e => e.id === "lf10-l11-e01")!;
beforeEach(() => { appStorage.clear(); window.history.replaceState(null, "", `/lernen/lf10#${e.id}`); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Thema gemeinsam erklären und üben", () => {
  it("bietet passende Inhalte kompakt an und behält eine angefangene Erklärung beim direkten Üben", () => {
    appStorage.setItem(kursStandKey(e), JSON.stringify({ ...neuerKursStand(e), phase: 1, notiz: "Vlies und Harz gehören zusammen." }));
    render(<LernwerkstattKurs lfId="lf10" />);
    const summary = screen.getByText(/Passend zu diesem Thema/);
    expect(summary.closest("details")!.open).toBe(false);
    fireEvent.click(summary);
    expect(screen.getByRole("link", { name: /Gully, Rohr und schwierige Ecke abdichten/ }).getAttribute("href")).toBe("/lernen/lf14#lf14-l02-e01");
    fireEvent.click(screen.getByRole("button", { name: /Kontrollfragen üben/ }));
    expect(screen.getByRole("heading", { name: "Selbst beantworten" })).toBeDefined();
    expect(ladeKursStand(e)).toMatchObject({ phase: 1, kontrollfragenDirekt: true, notiz: "Vlies und Harz gehören zusammen.", abgeschlossen: false });
    fireEvent.click(screen.getByRole("button", { name: /Zurück zu meinem Lernschritt/ }));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Vlies und Harz gehören zusammen.");
    expect(ladeKursStand(e).selbstbewertung).toBeUndefined();
  });
  it("öffnet aus der Suche die genaue Frage und stellt die weitere Bearbeitung nach Neustart wieder her", () => {
    window.history.replaceState(null, "", `/lernen/lf10?schritt=kontrollfragen&aufgabe=${e.aufgabenIds[1]}#${e.id}`);
    const first = render(<LernwerkstattKurs lfId="lf10" />);
    expect(screen.getByText(/Kontrollfrage 2 von/)).toBeDefined();
    expect(window.location.search).toBe("?schritt=kontrollfragen");
    expect(ladeKursStand(e)).toMatchObject({ phase: 0, kontrollfragenDirekt: true, kontrolleIndex: 1, abgeschlossen: false });
    first.unmount(); render(<LernwerkstattKurs lfId="lf10" />);
    expect(screen.getByText(/Kontrollfrage 2 von/)).toBeDefined();
    expect(ladeKursStand(e).ergebnisse).toEqual([]);
  });
});
