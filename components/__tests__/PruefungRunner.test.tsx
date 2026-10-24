import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Aufgabe } from "@/content/schema";
import { ExamAnswerEditor, PruefungRunner } from "@/components/pruefung/PruefungRunner";
import { appStorage } from "@/lib/lernSpeicher";
import { emptyExamAnswer, EXAM_KEY, instantiateExamQuestion, parseExamAttempt, saveExam, type ExamAttempt } from "@/lib/exam";

const NOW = 1_800_000_000_000;
const base = { lernfeld: "lf07", thema: "Bauteile", quelle: "Übungsquelle", konfidenz: "hoch" as const, erklaerung: "Verborgene Musterlösung" };
const mc: Aufgabe = { ...base, id: "test-mc", typ: "mc", frage: "Was leitet Wasser ab?", optionen: ["Rinne", "Sparren"], korrekt: [0] };
const cloze: Aufgabe = { ...base, id: "test-cloze", typ: "cloze", text: "Wasser läuft durch das {{Fallrohr}}." };
const calc: Aufgabe = { ...base, id: "test-calc", typ: "calc", aufgabentext: "Verdopple {x}.", parameter: [{ name: "x", label: "Länge", einheit: "m", min: 10, max: 50, schritt: 5 }], schritte: [{ beschreibung: "Verborgener Rechenweg", formel: "x * 2", ergebnisName: "r", einheit: "m" }], toleranzProzent: 2 };
function attempt(): ExamAttempt {
  return { version: 2, id: "ui-test", startedAt: NOW, deadline: null, submittedAt: null, index: 0, questions: [instantiateExamQuestion(mc), instantiateExamQuestion(cloze), instantiateExamQuestion(calc, () => 0.5)], answers: {}, bookmarks: [], reflection: "", preset: { id: "ui", titel: "Testtraining", beschreibung: "Test", lernfelder: ["lf07"], anzahl: 3, minuten: 15 } };
}
beforeEach(() => { appStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Prüfungsraum mit gespeicherten Antworten", () => {
  it("erhält Antworten, Rechenwerte und Markierungen beim Navigieren und kompletten Wiederöffnen", () => {
    const original = attempt();
    saveExam(appStorage, original);
    const first = render(<PruefungRunner />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Rinne" }));
    fireEvent.click(screen.getByRole("button", { name: /Zum Wiedersehen markieren/ }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    fireEvent.change(screen.getByLabelText("Lücke 1"), { target: { value: "mein Entwurf" } });
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText(original.questions[2].prompt)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Ergebnis"), { target: { value: "60,0" } });
    first.unmount();
    render(<PruefungRunner />);
    expect((screen.getByLabelText("Ergebnis") as HTMLInputElement).value).toBe("60,0");
    expect(screen.getByText(original.questions[2].prompt)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
    expect((screen.getByLabelText("Lücke 1") as HTMLInputElement).value).toBe("mein Entwurf");
    fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
    expect((screen.getByRole("checkbox", { name: "Rinne" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("button", { name: "★ Markiert" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Rinne" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Sparren" }));
    const restored = parseExamAttempt(appStorage.getItem(EXAM_KEY))!;
    expect(restored.answers[mc.id].choices).toEqual([1]);
    expect(restored.answers[cloze.id].fields["0"]).toBe("mein Entwurf");
    expect(restored.answers[calc.id].fields.result).toBe("60,0");
    expect(screen.queryByText("Verborgene Musterlösung")).toBeNull();
    expect(screen.queryByText(/Deine Auswertung/)).toBeNull();
  });

  it("zeigt Überspringen im Überblick und gibt erst nach ausdrücklicher Abgabe Ergebnisse frei", () => {
    saveExam(appStorage, attempt());
    render(<PruefungRunner />);
    fireEvent.click(screen.getByRole("button", { name: "Überspringen" }));
    expect(screen.getByRole("button", { name: "Frage 1, übersprungen" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Training abgeben" }));
    expect(screen.queryByRole("heading", { name: "Deine Auswertung" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Trotzdem abgeben" }));
    expect(screen.getByRole("heading", { name: "Deine Auswertung" })).toBeTruthy();
    expect(screen.getByText(/0 von 8 Punkten/)).toBeTruthy();
    expect(screen.getByText(/keine offizielle Bestehensregel/)).toBeTruthy();
  });

  it("beendet eine laufende Prüfung nach der absoluten Deadline auch ohne nächste Antwort", () => {
    saveExam(appStorage, { ...attempt(), deadline: NOW + 2000 });
    render(<PruefungRunner />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("heading", { name: "Deine Auswertung" })).toBeTruthy();
    const restored = parseExamAttempt(appStorage.getItem(EXAM_KEY))!;
    expect(restored.submittedAt).toBe(NOW + 2000);
    expect(restored.answers).toEqual({});
  });
});

describe("Prüfungseditor ohne Zwischenlösungen", () => {
  it("gibt Lückenlösungen und Erklärungen vor Abgabe weder sichtbar noch über Beschriftungen aus", () => {
    const view = render(<ExamAnswerEditor question={instantiateExamQuestion(cloze)} answer={emptyExamAnswer()} onChange={() => {}} />);
    expect(view.container.textContent).not.toContain("Fallrohr");
    expect(view.container.innerHTML).not.toContain("Verborgene Musterlösung");
    expect(view.container.querySelector('input[aria-label="Lücke 1"]')).toBeTruthy();
  });

  it("entfernt lösungsverratende SVG-Beschriftungen und zeigt keine Lösungsauswahl an", () => {
    const diagram: Aufgabe = { ...base, id: "diagram", typ: "diagram", frage: "Benenne Punkt 1", svg: '<svg aria-label="Geheimes Bauteil"><text>1</text></svg>', zuordnung: { p1: "Geheimes Bauteil" } };
    const view = render(<ExamAnswerEditor question={instantiateExamQuestion(diagram)} answer={emptyExamAnswer()} onChange={() => {}} />);
    expect(view.container.innerHTML).not.toContain("Geheimes Bauteil");
    expect(screen.getByLabelText("Bezeichnung für Punkt 1")).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("zeigt für ungültige Rechenantworten eine verständliche Feldmeldung", () => {
    render(<ExamAnswerEditor question={instantiateExamQuestion(calc, () => 0.5)} answer={{ ...emptyExamAnswer(), fields: { result: "12abc" } }} onChange={() => {}} />);
    expect(screen.getByLabelText("Ergebnis").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("Gib eine Zahl ein");
    expect(screen.queryByText("Verborgener Rechenweg")).toBeNull();
  });
});
