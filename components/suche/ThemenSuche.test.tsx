import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemenSuche } from "./ThemenSuche";
import { ThemenSucheStart } from "./ThemenSucheStart";
import { flushStorage } from "@/lib/lernSpeicher";
import { wechsleLernziel } from "@/lib/lernNavigation";
import { FachbegriffeSeite } from "@/components/FachbegriffeSeite";
import { getGlossar } from "@/lib/glossar";

vi.mock("@/lib/lernSpeicher", () => ({ appStorage: { getItem: vi.fn(), setItem: vi.fn() }, flushStorage: vi.fn() }));
vi.mock("@/lib/lernNavigation", () => ({ wechsleLernziel: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(flushStorage).mockResolvedValue(); window.history.replaceState(null, "", "/suche"); });
afterEach(cleanup);

describe("Themen finden und sicher öffnen", () => {
  it("übernimmt eine URL-Anfrage und erhält die Auswahl bei Browsernavigation", () => {
    window.history.replaceState(null, "", "/suche?q=FLK");
    render(<ThemenSuche />);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("FLK");
    expect(screen.getByRole("link", { name: "Erklärung: Flüssigabdichtung als System verstehen" }).getAttribute("href")).toBe("/lernen/lf10#lf10-l11-e01");
    act(() => { window.history.replaceState(null, "", "/suche?q=Kehle&art=dach"); window.dispatchEvent(new PopStateEvent("popstate")); });
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Kehle");
    expect(screen.getByRole("button", { name: /3D-Dach/ }).getAttribute("aria-pressed")).toBe("true");
  });
  it("zeigt bei fehlenden Ergebnissen einen erreichbaren nächsten Weg", () => {
    render(<ThemenSuche />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Enkopur" } });
    expect(screen.getByRole("heading", { name: /keinen passenden Treffer/ })).toBeDefined();
    expect(screen.getByRole("link", { name: /Lernfelder durchsehen/ })).toBeDefined();
  });
  it("speichert vor der Navigation und bleibt bei Speicherfehlern an der Aufgabe", async () => {
    vi.mocked(flushStorage).mockRejectedValueOnce(new Error("voll"));
    render(<ThemenSucheStart />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Flüssigkunststoff" } });
    fireEvent.click(screen.getByRole("button", { name: "Thema finden" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("nicht dauerhaft gespeichert"));
    expect(wechsleLernziel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Thema finden" }));
    await waitFor(() => expect(wechsleLernziel).toHaveBeenCalledWith("/suche?q=Fl%C3%BCssigkunststoff"));
  });
  it("öffnet einen gefundenen Fachbegriff direkt auf der Fachbegriffsseite", () => {
    const b = getGlossar().find(b => b.begriff === "Freibord")!;
    window.history.replaceState(null, "", `/fachbegriffe#${b.id}`);
    render(<FachbegriffeSeite />);
    expect(screen.getByRole("article").textContent).toContain("Freibord");
  });
});
