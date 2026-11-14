import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppShell } from "@/components/AppShell";
import { flushStorage } from "@/lib/lernSpeicher";
import { wechsleLernziel } from "@/lib/lernNavigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/lernen/lf10" }));
vi.mock("@/lib/lernSpeicher", () => ({ appStorage: { getItem: vi.fn(), setItem: vi.fn() }, flushStorage: vi.fn() }));
vi.mock("@/lib/lernNavigation", () => ({ wechsleLernziel: vi.fn() }));
vi.mock("@/components/rechner/Rechner", () => ({ Rechner: () => <input aria-label="Rechnereingabe" /> }));

let frames: FrameRequestCallback[];
beforeEach(() => {
  vi.clearAllMocks(); frames = [];
  vi.mocked(flushStorage).mockResolvedValue();
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => { frames.push(f); return frames.length; });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const zeichne = () => act(() => frames.splice(0).forEach(f => f(0)));

describe("Ruhige Kopfzeile mit gemeinsamem Servicezugang", () => {
  it("zeigt Einstellungen erst nach Aufruf und erhält Text, Schriftwahl und Fokus beim Schließen", () => {
    render(<AppShell><input aria-label="Meine angefangene Antwort" /></AppShell>);
    expect(screen.queryByRole("combobox", { name: "Schriftgröße" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Rückmeldung geben/ })).toBeNull();
    expect(screen.getAllByRole("link", { name: "Thema suchen" }).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole("textbox", { name: "Meine angefangene Antwort" }), { target: { value: "Harz und Vlies" } });
    const mehr = screen.getByRole("button", { name: "Darstellung und Service öffnen" });
    mehr.focus(); fireEvent.click(mehr);
    const dialog = screen.getByRole("dialog", { name: "Darstellung & Service" });
    expect(document.activeElement).toBe(within(dialog).getByRole("heading", { name: "Darstellung & Service" }));
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Schriftgröße" }), { target: { value: "130" } });
    expect(document.documentElement.style.zoom).toBe("1.3");
    expect(screen.getByRole("textbox", { name: "Meine angefangene Antwort", hidden: true }).closest("[inert]")).not.toBeNull();
    fireEvent.keyDown(window, { key: "Escape" }); zeichne();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(mehr);
    expect((screen.getByRole("textbox", { name: "Meine angefangene Antwort" }) as HTMLInputElement).value).toBe("Harz und Vlies");
    fireEvent.click(mehr);
    expect((screen.getByRole("combobox", { name: "Schriftgröße" }) as HTMLSelectElement).value).toBe("130");
  });

  it("führt Tab innerhalb des Dialogs und setzt eine offene Hilfe nicht darüber", () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{ width: 1 }] as unknown as DOMRectList);
    render(<AppShell>Meine Aufgabe</AppShell>);
    fireEvent.click(screen.getByRole("button", { name: "Begriffshilfe" })); zeichne();
    fireEvent.click(screen.getByRole("button", { name: "Darstellung und Service öffnen" }));
    expect(screen.queryByRole("heading", { name: "Begriffshilfe" })).toBeNull();
    const dialog = screen.getByRole("dialog", { name: "Darstellung & Service" });
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(within(dialog).getByRole("link", { name: /Lernstand & Sicherungen/ }));
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Menü schließen" }));
  });

  it("wartet beim Servicewechsel auf den Speicher und bleibt bei Fehlern mit der Aufgabe geöffnet", async () => {
    vi.mocked(flushStorage).mockRejectedValueOnce(new Error("Speicher voll"));
    render(<AppShell><input aria-label="Entwurf" defaultValue="0," /></AppShell>);
    fireEvent.click(screen.getByRole("button", { name: "Darstellung und Service öffnen" }));
    fireEvent.click(screen.getByRole("link", { name: /Rückmeldung geben/ }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("nicht dauerhaft gespeichert"));
    expect(screen.getByRole("dialog", { name: "Darstellung & Service" })).toBeDefined();
    expect(wechsleLernziel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("link", { name: /Rückmeldung geben/ }));
    await waitFor(() => expect(wechsleLernziel).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
    expect((screen.getByRole("textbox", { name: "Entwurf" }) as HTMLInputElement).value).toBe("0,");
  });
});
