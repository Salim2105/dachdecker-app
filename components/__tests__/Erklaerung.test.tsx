import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";

// Gemessen über alle 2039 Erklärungen: Median 248 Zeichen, 611 über 300,
// längste 779 — und keine einzige der langen besteht aus nur einem Satz.
// Deshalb gliedern statt kürzen; eingeklappt wird nur, was wirklich eine Wand
// ist (54 Stück über 500 Zeichen).
const kurz = "Der First liegt oben. Die Traufe unten.";
const drei = "Erstens gilt dies. Zweitens jenes. Drittens noch etwas anderes.";
const wand = `${"Ein hinreichend langer Satz über Dachziegel und ihre Verlegung. ".repeat(9)}Und ein Schlusssatz.`;

afterEach(cleanup);

describe("Erklaerung", () => {
  it("lässt zwei Sätze als einen Block stehen", () => {
    const { container } = render(<Erklaerung text={kurz} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("gliedert ab drei Sätzen in Absätze", () => {
    const { container } = render(<Erklaerung text={drei} />);
    expect(container.querySelectorAll("p")).toHaveLength(3);
  });

  it("zeigt bei kurzen Erklärungen keinen Aufklapper", () => {
    render(<Erklaerung text={drei} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("klappt nur echte Wände ein und wieder aus", () => {
    expect(wand.length).toBeGreaterThan(500);
    const { container } = render(<Erklaerung text={wand} />);

    expect(container.querySelectorAll("p")).toHaveLength(2); // Vorschau
    const knopf = screen.getByRole("button");
    expect(knopf.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(knopf);
    expect(container.querySelectorAll("p").length).toBeGreaterThan(2);
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(screen.getByRole("button"));
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("verliert beim Gliedern keinen Text", () => {
    const { container } = render(<Erklaerung text={drei} />);
    const zusammen = [...container.querySelectorAll("p")].map((p) => p.textContent).join(" ");
    expect(zusammen).toBe(drei);
  });
});
