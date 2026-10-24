import type { CSSProperties } from "react";
const TONES = ["teal", "orange", "violet", "yellow", "teal", "violet"];
const FALLBACKS: Record<string, string> = { teal: "#67d8c8", orange: "#ff925b", violet: "#b7a1f3", yellow: "#f4cf69" };
export function learningTone(index: number): CSSProperties {
  const tone = TONES[index % TONES.length];
  return {
    "--chapter-color": `var(--brand-${tone}, ${FALLBACKS[tone]})`,
    "--chapter-tint": `var(--tint-${tone}, var(--surface-2))`,
    "--chapter-ink": `var(--on-tint-${tone}, var(--text))`,
  } as CSSProperties;
}
