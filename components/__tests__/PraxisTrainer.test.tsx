import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PraxisTrainer } from "@/components/PraxisTrainer";
import { PRAXISFAELLE } from "@/lib/praxis";
import { praxisStore, lesePraxis } from "@/lib/praxisStore";

beforeEach(() => { localStorage.clear(); praxisStore.set(""); });
afterEach(cleanup);

describe("Praxis üben", () => {
  it("speichert Eingaben beim Fallwechsel und zeigt Lösungen erst nach dem vollständigen Versuch", () => {
    const ansicht = render(<PraxisTrainer />);
    const fall = PRAXISFAELLE[0];
    expect(screen.queryByText(fall.muster)).toBeNull();
    for (const r of fall.rechnungen) fireEvent.change(screen.getByLabelText(r.frage), { target: { value: String(r.ergebnis) } });
    fireEvent.change(screen.getByRole("textbox", { name: fall.entscheidung }), { target: { value: "Dachneigung und Produkt prüfen" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "platten" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "satteldach" } });
    expect((screen.getByLabelText(fall.rechnungen[0].frage) as HTMLInputElement).value).toBe("120");
    fireEvent.click(screen.getByText("Rechnung prüfen und Begründung vergleichen"));
    expect(screen.getByText(fall.muster)).toBeTruthy();
    expect(screen.getAllByText("Richtig")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Teilweise" }));
    expect(screen.getByText(/1 von 6 Fällen/)).toBeTruthy();
    ansicht.unmount();
    render(<PraxisTrainer />);
    expect(screen.getByText(fall.muster)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Teilweise" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByText("Fall erneut bearbeiten"));
    expect(screen.queryByText(fall.muster)).toBeNull();
    expect((screen.getByLabelText(fall.rechnungen[0].frage) as HTMLInputElement).value).toBe("");
  });
  it("gibt vorab nur einen Tipp und kennzeichnet die Hilfe", () => {
    render(<PraxisTrainer />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "gefaelle" } });
    const fall = PRAXISFAELLE.find((f) => f.id === "gefaelle")!;
    fireEvent.click(screen.getByText("Tipp zu Schritt 1"));
    expect(screen.getByText(fall.rechnungen[0].tipp!)).toBeTruthy();
    expect(screen.queryByText(fall.rechnungen[0].loesungsweg)).toBeNull();
    expect(lesePraxis(praxisStore.getSnapshot()).gefaelle.mitHilfe).toBe(true);
  });
});
