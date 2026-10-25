import { describe, expect, it } from "vitest";
import supplements from "@/content/pruefung/ergaenzungen.json";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { getCurriculum } from "@/lib/curriculum";
import { createExamAttempt } from "@/lib/exam";
import { EXAM_METADATA, examMetadata } from "@/lib/examMetadata";
import { getPruefungsteile, istAutoBewertbar, poolFuer } from "@/lib/pruefung";

describe("Prüfungsstufen für alle Lernbereiche", () => {
  const felder = getLernfelder();
  const presets = getPruefungsteile();
  const tasks = felder.flatMap((lf) => getAufgaben(lf.id)).filter(istAutoBewertbar);
  const goals = new Set(felder.flatMap((lf) => getCurriculum(lf.id)?.kapitel.flatMap((k) => k.einheiten.map((e) => e.id)) ?? []));

  it("ordnet jede sichtbare automatisch bewertbare Aufgabe mit gültigen Lernzielen ausdrücklich zu", () => {
    expect(Object.keys(EXAM_METADATA).sort()).toEqual(tasks.map((a) => a.id).sort());
    for (const a of tasks) {
      const m = EXAM_METADATA[a.id];
      expect(m.maxPoints).toBeGreaterThan(0);
      expect(Number.isInteger(m.version)).toBe(true);
      expect(m.version).toBeGreaterThanOrEqual(1);
      expect(m.anforderung.length).toBeGreaterThan(20);
      expect(m.lernzielIds.length).toBeGreaterThan(0);
      for (const id of m.lernzielIds) expect(goals.has(id), `${a.id}: unbekanntes Lernziel ${id}`).toBe(true);
    }
  });

  it("bietet in allen 22 Bereichen drei volle Stufen ohne Auffüllen aus fremden Stufen", () => {
    expect(felder).toHaveLength(22);
    expect(presets.filter((p) => p.stufe)).toHaveLength(66);
    for (const lf of felder) {
      const stufen = presets.filter((p) => p.stufe && p.lernfelder[0] === lf.id);
      expect(stufen.map((p) => p.stufe)).toEqual(["grundlagen", "anwendung", "pruefungsnah"]);
      for (const p of stufen) {
        const pool = poolFuer(p);
        expect(pool.length, p.id).toBeGreaterThanOrEqual(12);
        expect(pool.every((a) => a.lernfeld === lf.id && EXAM_METADATA[a.id]?.level === p.stufe && a.konfidenz !== "pruefen")).toBe(true);
        expect(new Set(pool.map((a) => a.id)).size).toBe(pool.length);
        const attempt = createExamAttempt(p, true, 1_800_000_000_000, () => 0.35);
        expect(attempt.questions).toHaveLength(p.anzahl);
        expect(attempt.deadline! - attempt.startedAt).toBe(p.minuten * 60_000);
        expect(attempt.questions.every((q) => pool.some((a) => a.id === q.task.id))).toBe(true);
      }
    }
  });

  it("erhält LF7 und die bisherigen gemischten Trainings unverändert", () => {
    expect(presets.filter((p) => p.stufe && p.lernfelder[0] === "lf07").map((p) => [p.id, p.anzahl, p.minuten])).toEqual([
      ["lf07-grundlagen", 10, 15], ["lf07-anwendung", 15, 25], ["lf07-pruefungsnah", 20, 40],
    ]);
    expect(presets.filter((p) => !p.stufe).map((p) => [p.id, p.anzahl, p.minuten])).toEqual([
      ["teil1", 30, 45], ["teil2", 40, 60], ["wiso", 15, 25],
    ]);
    expect(examMetadata(getAufgaben("lf07").find((a) => a.id === "lf07-052")!)).toMatchObject({ level: "pruefungsnah", maxPoints: 6, version: 1 });
  });
  it("nimmt auch ins gemischte Training keine Frage ohne geprüfte Metadaten auf",()=>{
    const p=presets.find(p=>p.id==="teil2")!,a=poolFuer(p)[0];
    const registry=EXAM_METADATA as Record<string,ReturnType<typeof examMetadata>>;
    const vorher=registry[a.id];
    try {delete registry[a.id];expect(poolFuer(p).some(q=>q.id===a.id)).toBe(false);}
    finally {registry[a.id]=vorher;}
  });

  it("ergänzt eigenständige Aufgaben mit Erklärungen und unterscheidbaren Antwortmöglichkeiten", () => {
    const questions = new Set<string>();
    for (const [lf, additions] of Object.entries(supplements)) {
      for (const a of additions) {
        expect(a.lernfeld).toBe(lf);
        expect(a.typ).toBe("mc");
        expect(new Set(a.optionen).size).toBe(a.optionen.length);
        expect(a.korrekt.length).toBeGreaterThan(0);
        expect(a.korrekt.length).toBeLessThan(a.optionen.length);
        expect(a.korrekt.every((n) => Number.isInteger(n) && n >= 0 && n < a.optionen.length)).toBe(true);
        expect(a.quelle).toContain("Lernwerkstatt");
        expect(a.erklaerung.length).toBeGreaterThan(40);
        expect(questions.has(a.frage)).toBe(false);
        questions.add(a.frage);
      }
    }
  });
});
