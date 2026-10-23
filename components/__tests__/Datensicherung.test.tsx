import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Datensicherung } from "@/components/fortschritt/Datensicherung";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Datensicherung vorab ansehen", () => {
  it("verändert bis zur Übernahme keine Daten und erlaubt Abbrechen", async () => {
    localStorage.setItem("theme", "dark");
    const ansicht = render(<Datensicherung />);
    const text = JSON.stringify({ app: "dachdecker-lernstand", version: 1, daten: { theme: "light" } });
    const datei = new File([text], "meine-sicherung.json", { type: "application/json" });
    fireEvent.change(ansicht.container.querySelector('input[type="file"]')!, { target: { files: [datei] } });
    await screen.findByText("Sicherung prüfen: meine-sicherung.json");
    expect(screen.getByText(/Enthalten: Darstellung/)).toBeTruthy();
    expect(localStorage.getItem("theme")).toBe("dark");
    fireEvent.click(screen.getByText("Abbrechen"));
    expect(screen.queryByText("Sicherung übernehmen")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });
  it("lehnt eine beschädigte Sicherung ohne Datenverlust ab", async () => {
    localStorage.setItem("theme", "dark");
    const ansicht = render(<Datensicherung />);
    const datei = new File(['{"app":"dachdecker-lernstand","daten":{"theme":"light","fortschritt-v1":"kaputt"}}'], "kaputt.json", { type: "application/json" });
    fireEvent.change(ansicht.container.querySelector('input[type="file"]')!, { target: { files: [datei] } });
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Keine gültige Sicherung"));
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(screen.queryByText("Sicherung übernehmen")).toBeNull();
  });
});
