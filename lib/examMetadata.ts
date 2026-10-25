import type { Aufgabe } from "@/content/schema";
import zuordnungen from "@/content/pruefung/metadaten.json";

export type ExamLevel = "grundlagen" | "anwendung" | "pruefungsnah";
export interface ExamMetadata {
  level: ExamLevel;
  maxPoints: number;
  version: number;
  lernzielIds: string[];
  anforderung: string;
}

/** Redaktionell festgelegte Zuordnung nach Denkaufgabe; unbekannte IDs sind kein Stufenpool. */
export const EXAM_METADATA: Readonly<Record<string, ExamMetadata>> = zuordnungen as Record<string, ExamMetadata>;

/** Öffentliche Alt-Schnittstelle bleibt auf die unveränderten LF7-Aufgaben begrenzt. */
export const LF7_EXAM_METADATA: Readonly<Record<string, ExamMetadata>> = Object.fromEntries(
  Object.entries(EXAM_METADATA).filter(([id]) => id.startsWith("lf07-")),
);

export function examMetadata(a: Aufgabe): ExamMetadata {
  // Der Rückfall erhält alte importierte Versuche und eigenständige Nacharbeitsaufgaben.
  // Die Stufenauswahl verwendet ausschließlich EXAM_METADATA, niemals diesen Rückfall.
  return EXAM_METADATA[a.id] ?? {
    level: "anwendung", maxPoints: a.typ === "calc" || a.typ === "diagram" ? 4 : 2,
    version: 1, lernzielIds: [a.lernfeld], anforderung: "Ältere Aufgabe ohne Stufenzuordnung.",
  };
}
