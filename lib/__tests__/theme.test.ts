import { describe, it, expect, beforeEach } from "vitest";
import { getTheme, setTheme } from "@/lib/theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("theme", () => {
  it("defaults to dark when nothing stored", () => {
    expect(getTheme()).toBe("dark");
  });
  it("persists and applies the chosen theme", () => {
    setTheme("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(getTheme()).toBe("light");
  });
});
