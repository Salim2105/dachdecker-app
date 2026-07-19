import { describe, it, expect } from "vitest";
import { parseCloze, pruefeLuecke } from "@/lib/cloze";

describe("parseCloze", () => {
  it("splits text and gaps", () => {
    const p = parseCloze("Ein {{Ziegel}} deckt das Dach.");
    expect(p.filter((x) => x.type === "gap")).toHaveLength(1);
    expect(p[0]).toEqual({ type: "text", value: "Ein " });
    expect(p[1]).toEqual({ type: "gap", antwort: "Ziegel", index: 0 });
  });
  it("handles multiple gaps with rising index", () => {
    const p = parseCloze("{{a}} und {{b}}");
    const gaps = p.filter((x) => x.type === "gap");
    expect(gaps.map((g) => (g.type === "gap" ? g.index : -1))).toEqual([0, 1]);
  });
});

describe("pruefeLuecke", () => {
  it("accepts alternatives case-insensitively", () => {
    expect(pruefeLuecke("massstab", "Maßstab", ["Massstab"])).toBe(true);
  });
  it("trims and matches", () => {
    expect(pruefeLuecke("  Ziegel ", "Ziegel")).toBe(true);
  });
  it("rejects wrong answers", () => {
    expect(pruefeLuecke("Stein", "Ziegel")).toBe(false);
  });
});
