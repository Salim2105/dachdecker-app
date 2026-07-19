import { describe, it, expect } from "vitest";
import { istSichtbar } from "@/content/schema";

describe("istSichtbar", () => {
  it("hides pruefen entries", () => {
    expect(istSichtbar({ konfidenz: "pruefen" })).toBe(false);
  });
  it("shows hoch and mittel entries", () => {
    expect(istSichtbar({ konfidenz: "hoch" })).toBe(true);
    expect(istSichtbar({ konfidenz: "mittel" })).toBe(true);
  });
});
