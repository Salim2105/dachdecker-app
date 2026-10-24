import type { Aufgabe } from "@/content/schema";

export type ExamLevel = "grundlagen" | "anwendung" | "pruefungsnah";
export interface ExamMetadata { level: ExamLevel; maxPoints: number; version: number }

/** Redaktionelle Zuordnung nach dem tatsächlich verlangten Wissen, nicht nach dem Kartentyp. */
const LF7_GROUPS: Record<ExamLevel, [number, number][]> = {
  grundlagen: [
    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [7, 2], [8, 2], [10, 2],
    [13, 2], [18, 2], [19, 3], [21, 2], [22, 2], [23, 2], [25, 2],
    [31, 2], [32, 2], [33, 2], [34, 2], [40, 2], [41, 2], [42, 2],
    [43, 2], [44, 2], [54, 2], [56, 2], [64, 2], [69, 2], [74, 2],
    [75, 2], [76, 2], [79, 2], [100, 4],
  ],
  anwendung: [
    [6, 2], [9, 2], [12, 3], [14, 2], [15, 2], [16, 2], [17, 2],
    [20, 3], [27, 2], [28, 4], [29, 4], [35, 2], [36, 2], [37, 2],
    [38, 3], [39, 4], [45, 2], [46, 2], [49, 2], [50, 3], [55, 2],
    [57, 2], [58, 2], [59, 2], [60, 2], [61, 2], [65, 2], [66, 2],
    [67, 2], [68, 2], [71, 2], [72, 2], [73, 2], [77, 2], [78, 3],
    [84, 4], [86, 4], [91, 2], [92, 2], [94, 2], [95, 2], [105, 3],
  ],
  pruefungsnah: [
    [26, 3], [30, 5], [47, 3], [51, 3], [52, 6], [53, 5], [63, 3],
    [70, 3], [80, 3], [82, 3], [83, 3], [85, 6], [87, 5], [88, 3],
    [89, 3], [90, 3], [93, 3], [96, 3], [97, 3], [98, 3], [99, 3],
    [102, 4], [103, 4], [104, 4],
  ],
};

export const LF7_EXAM_METADATA: Readonly<Record<string, ExamMetadata>> = Object.fromEntries(
  Object.entries(LF7_GROUPS).flatMap(([level, entries]) => entries.map(([nr, maxPoints]) => [
    `lf07-${String(nr).padStart(3, "0")}`, { level: level as ExamLevel, maxPoints, version: 1 },
  ])),
);

export function examMetadata(a: Aufgabe): ExamMetadata {
  return LF7_EXAM_METADATA[a.id] ?? {
    level: "anwendung", maxPoints: a.typ === "calc" || a.typ === "diagram" ? 4 : 2, version: 1,
  };
}
