import type { Aufgabe, CalcAufgabe, ClozeAufgabe, DiagramAufgabe, McAufgabe } from "@/content/schema";
import { berechneSchritte, ersetzePlatzhalter, pruefeAntwort } from "@/lib/calc";
import { parseCloze, pruefeLuecke } from "@/lib/cloze";
import { leseDezimalzahl } from "@/lib/zahlen";
import { examMetadata } from "@/lib/examMetadata";
import { recordReviewResult } from "@/lib/review";
import { poolFuer, ziehePruefung, type Pruefungsteil } from "@/lib/pruefung";

export const EXAM_KEY = "dd-pruefung-v2";
export const EXAM_HISTORY_KEY = "dd-pruefung-verlauf-v2";
export const TRAINING_GOAL = 80;
type AutoAufgabe = McAufgabe | ClozeAufgabe | CalcAufgabe | DiagramAufgabe;
type ExamStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface ExamQuestion {
  task: AutoAufgabe;
  taskVersion: number;
  lernzielIds?: string[];
  maxPoints: number;
  /** Werte und Fragetext entstehen genau einmal beim Start. */
  parameters: Record<string, number>;
  prompt: string;
}
export interface ExamAnswer {
  choices: number[];
  fields: Record<string, string>;
  skipped: boolean;
}
export interface ExamAttempt {
  version: 2;
  /** Only new attempts participate; opening old results never invents review successes. */
  reviewVersion?: 1;
  id: string;
  preset: Pruefungsteil;
  startedAt: number;
  deadline: number | null;
  submittedAt: number | null;
  index: number;
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswer>;
  bookmarks: string[];
  /** Freie Begründung/Selbsteinschätzung wird niemals in die Punktzahl eingerechnet. */
  reflection: string;
}
export interface ExamScore { earned: number; possible: number; lost: number; percent: number; goalReached: boolean }
export interface TopicScore extends ExamScore { lernfeld: string; thema: string; taskIds: string[] }
export const emptyExamAnswer = (): ExamAnswer => ({ choices: [], fields: {}, skipped: false });
const rounded = (n: number) => Math.round(n * 100) / 100;

export function instantiateExamQuestion(task: Aufgabe, random: () => number = Math.random): ExamQuestion {
  if (!["mc", "cloze", "calc", "diagram"].includes(task.typ)) throw new Error("Diese Aufgabe braucht eine Selbsteinschätzung.");
  const snapshot = JSON.parse(JSON.stringify(task)) as AutoAufgabe;
  const parameters: Record<string, number> = {};
  if (snapshot.typ === "calc") {
    for (const p of snapshot.parameter) {
      const steps = Math.floor((p.max - p.min) / p.schritt + 1e-8);
      const value = Number((p.min + Math.min(steps, Math.floor(random() * (steps + 1))) * p.schritt).toFixed(8));
      parameters[p.name] = value;
      // Auch die Nacharbeit verwendet denselben eingefrorenen Datensatz.
      p.min = value;
      p.max = value;
    }
    if (!berechneSchritte(snapshot.schritte, parameters).every((s) => Number.isFinite(s.wert))) throw new Error("Ungültige Rechenaufgabe.");
  }
  const prompt = snapshot.typ === "mc" || snapshot.typ === "diagram" ? snapshot.frage
    : snapshot.typ === "cloze" ? snapshot.text.replace(/\{\{.+?\}\}/g, "___")
      : ersetzePlatzhalter(snapshot.aufgabentext, parameters);
  const metadata = examMetadata(task);
  return { task: snapshot, taskVersion: metadata.version, lernzielIds: [...metadata.lernzielIds], maxPoints: metadata.maxPoints, parameters, prompt };
}

export function createExamAttempt(preset: Pruefungsteil, timed: boolean, now = Date.now(), random: () => number = Math.random): ExamAttempt {
  const questions = ziehePruefung(poolFuer(preset), preset.anzahl, random).map((a) => instantiateExamQuestion(a, random));
  if (questions.length !== preset.anzahl) throw new Error("Für diesen Trainingsumfang fehlen Aufgaben.");
  return {
    version: 2, reviewVersion: 1, id: `exam-${now}-${Math.floor(random() * 1e9)}`, preset: { ...preset },
    startedAt: now, deadline: timed ? now + preset.minuten * 60_000 : null,
    submittedAt: null, index: 0, questions, answers: {}, bookmarks: [], reflection: "",
  };
}

export function answerFields(question: ExamQuestion): { key: string; label: string; unit?: string }[] {
  const a = question.task;
  if (a.typ === "cloze") return parseCloze(a.text).flatMap((p) => p.type === "gap" ? [{ key: String(p.index), label: `Lücke ${p.index + 1}` }] : []);
  if (a.typ === "diagram") return Object.keys(a.zuordnung).map((key, i) => ({ key, label: `Bezeichnung für Punkt ${i + 1}` }));
  if (a.typ === "calc") return [{ key: "result", label: "Ergebnis", unit: a.schritte.at(-1)?.einheit }];
  return [];
}

export function isExamAnswered(question: ExamQuestion, answer?: ExamAnswer): boolean {
  if (!answer) return false;
  if (question.task.typ === "mc") return answer.choices.length > 0;
  if (question.task.typ === "calc") return leseDezimalzahl(answer.fields.result ?? "") !== null;
  return answerFields(question).every(({ key }) => Boolean(answer.fields[key]?.trim()));
}

function textMatches(value: string, target: string, alternatives: string[] = []): boolean {
  const numericTarget = leseDezimalzahl(target);
  if (numericTarget !== null) return leseDezimalzahl(value) === numericTarget;
  const normalize = (s: string) => s.trim().toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "");
  if ([target, ...alternatives].some((t) => normalize(value) === normalize(t))) return Boolean(value.trim());
  return target.length >= 5 && pruefeLuecke(value, target, alternatives);
}

/** Punktanteile sind eindeutig: Auswahl mit Abzug falscher Kreuze; Lücken/Zuordnungen anteilig. Rechnen: Endergebnis innerhalb der angegebenen Toleranz. */
export function scoreExamQuestion(question: ExamQuestion, answer?: ExamAnswer): number {
  if (!answer) return 0;
  const a = question.task;
  let fraction = 0;
  if (a.typ === "mc") {
    const selected = [...new Set(answer.choices)];
    fraction = Math.max(0, selected.reduce((sum, n) => sum + (a.korrekt.includes(n) ? 1 : -1), 0)) / a.korrekt.length;
  } else if (a.typ === "cloze") {
    const gaps = parseCloze(a.text).filter((p) => p.type === "gap");
    fraction = gaps.filter((g) => textMatches(answer.fields[String(g.index)] ?? "", g.antwort, a.akzeptiert?.[g.antwort] ?? [])).length / gaps.length;
  } else if (a.typ === "diagram") {
    const entries = Object.entries(a.zuordnung);
    fraction = entries.filter(([key, target]) => textMatches(answer.fields[key] ?? "", target)).length / entries.length;
  } else {
    const input = leseDezimalzahl(answer.fields.result ?? "");
    const expected = berechneSchritte(a.schritte, question.parameters).at(-1)?.wert;
    fraction = input !== null && expected !== undefined && pruefeAntwort(input, expected, a.toleranzProzent) ? 1 : 0;
  }
  return rounded(question.maxPoints * Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0)));
}

/** Keine Punktzahl vor Abgabe: Antworten bleiben bis dahin veränderbar. */
export function scoreExam(attempt: ExamAttempt): ExamScore | null {
  if (attempt.submittedAt === null) return null;
  const possible = attempt.questions.reduce((sum, q) => sum + q.maxPoints, 0);
  const earned = rounded(attempt.questions.reduce((sum, q) => sum + scoreExamQuestion(q, attempt.answers[q.task.id]), 0));
  const percent = possible ? earned / possible * 100 : 0;
  return { earned, possible, lost: rounded(possible - earned), percent, goalReached: percent >= TRAINING_GOAL };
}

export function examTopics(attempt: ExamAttempt): TopicScore[] {
  if (attempt.submittedAt === null) return [];
  const topics = new Map<string, TopicScore>();
  for (const q of attempt.questions) {
    const key = `${q.task.lernfeld}/${q.task.thema}`;
    const topic = topics.get(key) ?? { lernfeld: q.task.lernfeld, thema: q.task.thema, taskIds: [], earned: 0, possible: 0, lost: 0, percent: 0, goalReached: false };
    topic.possible += q.maxPoints;
    topic.earned = rounded(topic.earned + scoreExamQuestion(q, attempt.answers[q.task.id]));
    if (scoreExamQuestion(q, attempt.answers[q.task.id]) < q.maxPoints) topic.taskIds.push(q.task.id);
    topics.set(key, topic);
  }
  return [...topics.values()].map((t) => ({ ...t, lost: rounded(t.possible - t.earned), percent: t.earned / t.possible * 100, goalReached: t.earned / t.possible * 100 >= TRAINING_GOAL })).sort((a, b) => a.percent - b.percent);
}

export function updateExamAnswer(attempt: ExamAttempt, id: string, answer: ExamAnswer, now: number): ExamAttempt {
  if (attempt.submittedAt !== null || (attempt.deadline !== null && now >= attempt.deadline)) return finishExam(attempt, now);
  if (!attempt.questions.some((q) => q.task.id === id)) return attempt;
  return { ...attempt, answers: { ...attempt.answers, [id]: answer } };
}

export function finishExam(attempt: ExamAttempt, now: number): ExamAttempt {
  return attempt.submittedAt !== null ? attempt : { ...attempt, submittedAt: attempt.deadline !== null ? Math.min(now, attempt.deadline) : now };
}

const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === "string");

function validQuestion(v: unknown): v is ExamQuestion {
  if (record(v) && v.lernzielIds !== undefined && !strings(v.lernzielIds)) return false;
  if (!record(v) || !record(v.task) || !record(v.parameters) || !Object.values(v.parameters).every(finite) || !finite(v.maxPoints) || v.maxPoints <= 0 || v.maxPoints > 100 || !Number.isInteger(v.taskVersion) || (v.taskVersion as number) < 1 || typeof v.prompt !== "string") return false;
  const a = v.task;
  if (!["id", "lernfeld", "thema", "quelle", "erklaerung"].every((key) => typeof a[key] === "string") || !a.id || !["hoch", "mittel"].includes(String(a.konfidenz))) return false;
  if (a.typ === "mc") return typeof a.frage === "string" && strings(a.optionen) && a.optionen.length > 1 && Array.isArray(a.korrekt) && a.korrekt.length > 0 && a.korrekt.every((n) => Number.isInteger(n) && n >= 0 && n < (a.optionen as string[]).length);
  if (a.typ === "cloze") return typeof a.text === "string" && /\{\{.+?\}\}/.test(a.text) && (a.akzeptiert === undefined || (record(a.akzeptiert) && Object.values(a.akzeptiert).every(strings)));
  if (a.typ === "diagram") return typeof a.frage === "string" && typeof a.svg === "string" && record(a.zuordnung) && Object.keys(a.zuordnung).length > 0 && Object.values(a.zuordnung).every((s) => typeof s === "string");
  if (a.typ !== "calc" || typeof a.aufgabentext !== "string" || !finite(a.toleranzProzent) || a.toleranzProzent < 0 || a.toleranzProzent > 100 || !Array.isArray(a.parameter) || !Array.isArray(a.schritte) || !a.schritte.length) return false;
  if (!a.parameter.every((p) => record(p) && typeof p.name === "string" && typeof p.label === "string" && typeof p.einheit === "string" && finite(p.min) && p.min === p.max && finite(p.schritt) && p.schritt > 0 && v.parameters && (v.parameters as Record<string, number>)[p.name] === p.min)) return false;
  if (!a.schritte.every((s) => record(s) && ["beschreibung", "formel", "ergebnisName", "einheit"].every((key) => typeof s[key] === "string"))) return false;
  try { return berechneSchritte(a.schritte as unknown as CalcAufgabe["schritte"], v.parameters as Record<string, number>).every((s) => Number.isFinite(s.wert)); } catch { return false; }
}

/** Ungültige/unvollständige Sicherungen werden nie durch frisch gezogene Fragen ergänzt. */
export function parseExamAttempt(raw: string | null): ExamAttempt | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!record(v) || v.version !== 2 || (v.reviewVersion !== undefined && v.reviewVersion !== 1) || typeof v.id !== "string" || !finite(v.startedAt) || !record(v.preset) || !["id", "titel", "beschreibung"].every((k) => typeof (v.preset as Record<string, unknown>)[k] === "string") || !strings(v.preset.lernfelder) || !finite(v.preset.anzahl) || !finite(v.preset.minuten) || v.preset.minuten <= 0) return null;
    if (!Array.isArray(v.questions) || v.questions.length < 1 || v.questions.length > 100 || !v.questions.every(validQuestion) || v.preset.anzahl !== v.questions.length || !Number.isInteger(v.index) || (v.index as number) < 0 || (v.index as number) >= v.questions.length || !record(v.answers) || !strings(v.bookmarks) || typeof v.reflection !== "string") return null;
    if ((v.deadline !== null && (!finite(v.deadline) || v.deadline < v.startedAt)) || (v.submittedAt !== null && (!finite(v.submittedAt) || v.submittedAt < v.startedAt || (finite(v.deadline) && v.submittedAt > v.deadline)))) return null;
    const ids = new Set(v.questions.map((q) => q.task.id));
    if (ids.size !== v.questions.length || new Set(v.bookmarks).size !== v.bookmarks.length || v.bookmarks.some((id) => !ids.has(id))) return null;
    for (const [id, answer] of Object.entries(v.answers)) {
      if (!ids.has(id) || !record(answer) || !Array.isArray(answer.choices) || !answer.choices.every((n) => Number.isInteger(n) && n >= 0) || new Set(answer.choices).size !== answer.choices.length || !record(answer.fields) || !Object.values(answer.fields).every((s) => typeof s === "string") || typeof answer.skipped !== "boolean") return null;
      const question = v.questions.find((q) => q.task.id === id)!;
      const task = question.task;
      if (task.typ === "mc" && answer.choices.some((n) => n >= task.optionen.length)) return null;
      if (task.typ !== "mc" && answer.choices.length > 0) return null;
      const allowed = new Set(answerFields(question).map((f) => f.key));
      if (Object.keys(answer.fields).some((key) => !allowed.has(key))) return null;
    }
    return v as unknown as ExamAttempt;
  } catch { return null; }
}

export function loadExam(storage: ExamStorage, now: number): { attempt: ExamAttempt | null; warning: string | null } {
  const raw = storage.getItem(EXAM_KEY);
  const attempt = parseExamAttempt(raw);
  const warning = raw && !attempt ? "Der gespeicherte Prüfungsversuch ist unvollständig. Er wurde nicht verändert. Bitte eine Sicherung erstellen und einen neuen Versuch starten."
    : !raw && storage.getItem("dd-pruefung") ? "Ein Prüfungsstand der vorherigen App-Version ist noch vorhanden. Diese Version speicherte keine tatsächlichen Antworten. Der alte Stand bleibt in deiner Sicherung erhalten; starte hier einen neuen vollständigen Trainingsversuch." : null;
  if (attempt?.submittedAt === null && attempt.deadline !== null && now >= attempt.deadline) {
    const finished = finishExam(attempt, now);
    saveExam(storage, finished);
    return { attempt: finished, warning };
  }
  return { attempt, warning };
}

export function loadExamHistory(storage: ExamStorage): ExamAttempt[] {
  try {
    const values: unknown = JSON.parse(storage.getItem(EXAM_HISTORY_KEY) ?? "[]");
    if (!Array.isArray(values)) return [];
    return values.map((value) => parseExamAttempt(JSON.stringify(value))).filter((a): a is ExamAttempt => a !== null && a.submittedAt !== null);
  } catch { return []; }
}

export function saveExam(storage: ExamStorage, attempt: ExamAttempt): void {
  // Zuerst den vollständigen aktuellen Stand schreiben, dann idempotent archivieren.
  storage.setItem(EXAM_KEY, JSON.stringify(attempt));
  if (attempt.submittedAt !== null) {
    const history = loadExamHistory(storage).filter((a) => a.id !== attempt.id);
    storage.setItem(EXAM_HISTORY_KEY, JSON.stringify([attempt, ...history].slice(0, 50)));
  }
}

/** Safe to replay after saving: each question of one submitted attempt counts once. */
export function syncExamReviews(attempt: ExamAttempt): void {
  if (attempt.reviewVersion !== 1 || attempt.submittedAt === null) return;
  for (const q of attempt.questions) {
    const earned = scoreExamQuestion(q, attempt.answers[q.task.id]);
    recordReviewResult({ ref: { quelle: "fachwissen", id: q.task.id, version: q.taskVersion,
      lernzielIds: q.lernzielIds ?? [`${q.task.lernfeld}:${q.task.thema}`] },
      versuchId: `${attempt.id}:${q.task.id}`, am: attempt.submittedAt,
      bewertung: earned === q.maxPoints ? "richtig" : earned > 0 ? "teilweise" : "falsch", hilfen: [] });
  }
}

export function answerText(question: ExamQuestion, answer?: ExamAnswer): string {
  if (!answer) return "Nicht bearbeitet";
  if (question.task.typ === "mc") return answer.choices.map((n) => (question.task as McAufgabe).optionen[n]).join("; ") || "Keine Auswahl";
  return answerFields(question).map((f) => `${f.label}: ${answer.fields[f.key]?.trim() || "offen"}${f.unit ? ` ${f.unit}` : ""}`).join("; ");
}

export function solutionText(question: ExamQuestion): string {
  const a = question.task;
  if (a.typ === "mc") return a.korrekt.map((n) => a.optionen[n]).join("; ");
  if (a.typ === "cloze") return parseCloze(a.text).filter((p) => p.type === "gap").map((p) => `${p.index + 1}: ${p.antwort}`).join("; ");
  if (a.typ === "diagram") return Object.values(a.zuordnung).map((s, i) => `${i + 1}: ${s}`).join("; ");
  return berechneSchritte(a.schritte, question.parameters).map((s) => `${s.beschreibung}: ${s.wert} ${s.einheit}`).join("\n");
}

export function examProtocol(attempt: ExamAttempt): string {
  const score = scoreExam(attempt);
  if (!score) return "Die Auswertung erscheint nach der Abgabe.";
  return [
    `Trainingsprotokoll — ${attempt.preset.titel}`, new Date(attempt.submittedAt!).toLocaleString("de-DE"),
    `${score.earned} / ${score.possible} Punkte (${score.percent.toFixed(0)} %) · ${score.lost} Fehlerpunkte`,
    `Trainingsziel ${TRAINING_GOAL} %: ${score.goalReached ? "erreicht" : "noch nicht erreicht"}. Keine offizielle Bestehensregel.`, "",
    ...attempt.questions.flatMap((q, i) => [
      `${i + 1}. [${q.task.lernfeld} · ${q.task.thema}] ${q.prompt}`,
      `Deine Antwort: ${answerText(q, attempt.answers[q.task.id])}`,
      `Punkte: ${scoreExamQuestion(q, attempt.answers[q.task.id])} / ${q.maxPoints}`,
      `Lösung: ${solutionText(q)}`, q.task.erklaerung, `Quelle: ${q.task.quelle}`, "",
    ]),
    "Eigene Begründung / Selbsteinschätzung (ohne Punkte)", attempt.reflection || "Nicht ausgefüllt",
  ].join("\n");
}
