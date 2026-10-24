import { describe, expect, it } from "vitest";
import type { Aufgabe } from "@/content/schema";
import { getAufgaben } from "@/lib/content";
import { berechneSchritte } from "@/lib/calc";
import { getPruefungsteile, istAutoBewertbar, poolFuer } from "@/lib/pruefung";
import { LF7_EXAM_METADATA } from "@/lib/examMetadata";
import {
  answerFields, createExamAttempt, emptyExamAnswer, EXAM_HISTORY_KEY, EXAM_KEY,
  examProtocol, examTopics, finishExam, instantiateExamQuestion, isExamAnswered,
  loadExam, loadExamHistory, parseExamAttempt, saveExam, scoreExam, scoreExamQuestion,
  updateExamAnswer, type ExamAttempt,
} from "@/lib/exam";

const NOW = 1_800_000_000_000;
function memory() {
  const values = new Map<string, string>();
  return { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } };
}
function sample() { return createExamAttempt(getPruefungsteile()[0], false, NOW, () => 0.2); }
const find = (id: string) => getAufgaben("lf07").find((a) => a.id === id)!;

describe("Redaktionelle LF7-Prüfungen", () => {
  it("ordnet jede automatisch bewertbare LF7-Aufgabe ausdrücklich genau einer Stufe zu", () => {
    const auto = getAufgaben("lf07").filter(istAutoBewertbar);
    expect(Object.keys(LF7_EXAM_METADATA).sort()).toEqual(auto.map((a) => a.id).sort());
    const tiers = getPruefungsteile().filter((p) => p.stufe);
    expect(tiers.map((p) => [p.anzahl, p.minuten])).toEqual([[10, 15], [15, 25], [20, 40]]);
    for (const preset of tiers) {
      expect(poolFuer(preset).length).toBeGreaterThanOrEqual(preset.anzahl);
      expect(createExamAttempt(preset, false, NOW).questions).toHaveLength(preset.anzahl);
    }
  });

  it("friert Aufgaben und Zufallsparameter einmal ein, auch unabhängig vom Quelldatensatz", () => {
    const original = JSON.parse(JSON.stringify(find("lf07-052"))) as Aufgabe;
    const q = instantiateExamQuestion(original, () => 0.4);
    const savedPrompt = q.prompt;
    original.erklaerung = "später geändert";
    expect(q.task.erklaerung).not.toBe("später geändert");
    expect(q.task.typ).toBe("calc");
    if (q.task.typ !== "calc") return;
    expect(q.task.parameter.every((p) => p.min === p.max && p.min === q.parameters[p.name])).toBe(true);
    expect(q.prompt).not.toMatch(/\{\w+\}/);
    expect(q.prompt).toBe(savedPrompt);
  });
});

describe("Bewertung echter Antworten", () => {
  it("gibt vor der Abgabe weder Gesamtwertung noch Themenauswertung frei", () => {
    const attempt = sample();
    expect(scoreExam(attempt)).toBeNull();
    expect(examTopics(attempt)).toEqual([]);
    expect(examProtocol(attempt)).not.toContain(attempt.questions[0].task.erklaerung);
  });

  it("bewertet Mehrfachauswahl anteilig und verhindert Punkte durch Alles-Ankreuzen", () => {
    const task = { ...find("lf07-001"), typ: "mc", frage: "Wähle", optionen: ["A", "B", "C", "D"], korrekt: [0, 1] } as Aufgabe;
    const q = { ...instantiateExamQuestion(task), maxPoints: 4 };
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), choices: [0] })).toBe(2);
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), choices: [0, 1] })).toBe(4);
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), choices: [0, 1, 2, 3] })).toBe(0);
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), choices: [2] })).toBe(0);
  });

  it("gibt Teilpunkte für Lücken, aber akzeptiert keine numerisch falschen Werte als Tippfehler", () => {
    const q = instantiateExamQuestion(find("lf07-008"));
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), fields: { "0": "1", "1": "2" } })).toBe(q.maxPoints / 2);
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), fields: { "0": "1,0", "1": "1.00" } })).toBe(q.maxPoints);
  });

  it("bewertet jede Diagrammzuordnung einzeln", () => {
    const q = instantiateExamQuestion(find("lf07-100"));
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), fields: { dachrinne: "Dachrinne" } })).toBe(1);
    expect(isExamAnswered(q, { ...emptyExamAnswer(), fields: { dachrinne: "Dachrinne" } })).toBe(false);
    expect(answerFields(q)).toHaveLength(4);
  });

  it("prüft Rechnungen mit eingefrorenen Zahlen und striktem Dezimalkomma statt stiller Null", () => {
    const q = instantiateExamQuestion(find("lf07-052"), () => 0.5);
    if (q.task.typ !== "calc") throw new Error();
    const correct = berechneSchritte(q.task.schritte, q.parameters).at(-1)!.wert;
    expect(scoreExamQuestion(q, { ...emptyExamAnswer(), fields: { result: String(correct).replace(".", ",") } })).toBe(q.maxPoints);
    for (const invalid of ["", "12abc", "Infinity", "NaN", "0"]) expect(scoreExamQuestion(q, { ...emptyExamAnswer(), fields: { result: invalid } })).toBe(0);
  });

  it("weist Fehlerpunkte und das 80-Prozent-Trainingsziel aus; Selbsteinschätzung gibt keine Punkte", () => {
    const attempt = finishExam(sample(), NOW + 100);
    const score = scoreExam(attempt)!;
    expect(score.percent).toBe(0);
    expect(score.lost).toBe(score.possible);
    expect(score.goalReached).toBe(false);
    expect(scoreExam({ ...attempt, reflection: "Ich habe alle Aufgaben richtig gelöst." })).toEqual(score);
    expect(examProtocol(attempt)).toContain("Keine offizielle Bestehensregel");
    expect(examTopics(attempt).every((t) => t.taskIds.length > 0)).toBe(true);
  });

  it("erreicht das Trainingsziel genau bei 80 Prozent und zählt vorherige Selbsteinschätzungen nicht mit", () => {
    const a = sample();
    const questions = Array.from({ length: 5 }, (_, i) => instantiateExamQuestion({
      ...find("lf07-001"), id: `boundary-${i}`, typ: "mc", frage: "Auswahl", optionen: ["A", "B"], korrekt: [0],
    } as Aufgabe));
    const answers = Object.fromEntries(questions.slice(0, 4).map((q) => [q.task.id, { ...emptyExamAnswer(), choices: [0] }]));
    const finished = finishExam({ ...a, questions, answers, preset: { ...a.preset, anzahl: 5 } }, NOW + 100);
    expect(scoreExam(finished)).toMatchObject({ percent: 80, goalReached: true });
    expect(scoreExam({ ...finished, answers: { ...answers, [questions[0].task.id]: emptyExamAnswer() } })).toMatchObject({ percent: 60, goalReached: false });
  });
});

describe("Vollständige Prüfungsstände", () => {
  it("speichert tatsächliche Antworten, Navigation, Markierungen, Zahlen und übersprungene Aufgaben ohne Neuziehen", () => {
    const storage = memory();
    let attempt = createExamAttempt(getPruefungsteile()[2], true, NOW, () => 0.1);
    const id = attempt.questions[0].task.id;
    const answer = { ...emptyExamAnswer(), fields: {}, skipped: true };
    attempt = { ...updateExamAnswer(attempt, id, answer, NOW + 100), index: 3, bookmarks: [id] };
    saveExam(storage, attempt);
    const restored = loadExam(storage, NOW + 500).attempt;
    expect(restored).toEqual(attempt);
    expect(storage.getItem(EXAM_HISTORY_KEY)).toBeNull();
    expect(parseExamAttempt(JSON.stringify(restored))).toEqual(attempt);
  });

  it("schließt abgelaufene Prüfungen beim Wiederöffnen mit derselben Deadline und unveränderten Antworten ab", () => {
    const storage = memory();
    const attempt = createExamAttempt(getPruefungsteile()[0], true, NOW);
    saveExam(storage, attempt);
    const restored = loadExam(storage, attempt.deadline! + 30_000).attempt!;
    expect(restored.submittedAt).toBe(attempt.deadline);
    expect(restored.questions).toEqual(attempt.questions);
    expect(restored.answers).toEqual(attempt.answers);
    expect(loadExamHistory(storage)).toHaveLength(1);
    saveExam(storage, restored);
    expect(loadExamHistory(storage)).toHaveLength(1);
  });

  it("nimmt nach Ablauf oder Abgabe keine nachträgliche Antwort mehr an", () => {
    const a = createExamAttempt(getPruefungsteile()[0], true, NOW);
    const id = a.questions[0].task.id;
    const updated = updateExamAnswer(a, id, { ...emptyExamAnswer(), choices: [0] }, a.deadline!);
    expect(updated.answers[id]).toBeUndefined();
    expect(updated.submittedAt).toBe(a.deadline);
    expect(updateExamAnswer(updated, id, emptyExamAnswer(), NOW + 99)).toEqual(updated);
  });

  it("lässt Antworten bis zur Abgabe bearbeiten und erhält die alte Frage beim Zurückgehen", () => {
    const a = sample();
    const id = a.questions.find((q) => q.task.typ === "mc")!.task.id;
    const first = updateExamAnswer(a, id, { ...emptyExamAnswer(), choices: [0] }, NOW);
    const second = updateExamAnswer({ ...first, index: 3 }, id, { ...emptyExamAnswer(), choices: [1] }, NOW + 10);
    expect(second.answers[id].choices).toEqual([1]);
    expect(second.questions).toEqual(a.questions);
  });

  it("weist kaputte Stände zurück und lässt den Originalstand für eine Sicherung unberührt", () => {
    const storage = memory();
    const a = sample();
    const broken = { ...a, index: 200 };
    const raw = JSON.stringify(broken);
    storage.setItem(EXAM_KEY, raw);
    expect(loadExam(storage, NOW).attempt).toBeNull();
    expect(loadExam(storage, NOW).warning).toContain("unvollständig");
    expect(storage.getItem(EXAM_KEY)).toBe(raw);
    expect(parseExamAttempt(JSON.stringify({ ...a, questions: [...a.questions, a.questions[0]] }))).toBeNull();
    expect(parseExamAttempt(JSON.stringify({ ...a, deadline: "morgen" }))).toBeNull();
    const q = a.questions.find((q) => q.task.typ === "mc")!;
    expect(parseExamAttempt(JSON.stringify({ ...a, answers: { [q.task.id]: { ...emptyExamAnswer(), choices: [999] } } }))).toBeNull();
    expect(parseExamAttempt(JSON.stringify({ ...a, answers: { [q.task.id]: { ...emptyExamAnswer(), fields: { hidden: "value" } } } }))).toBeNull();
  });

  it("behält dieselbe Punktzahl und alle Lösungen nach einem vollständigen Neustart", () => {
    const storage = memory();
    const a = finishExam(sample(), NOW + 100);
    saveExam(storage, a);
    const restored = loadExam(storage, NOW + 200).attempt as ExamAttempt;
    expect(scoreExam(restored)).toEqual(scoreExam(a));
    expect(examProtocol(restored)).toBe(examProtocol(a));
  });
});
