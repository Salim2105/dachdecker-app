import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { MatheWerkstatt } from "@/components/mathe/MatheWerkstatt";
import { LernwerkstattKurs } from "@/components/LernwerkstattKurs";
import { SprachWerkstatt } from "@/components/sprache/SprachWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";

beforeEach(() => { appStorage.clear(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Direkt verlinkte Einheiten fortsetzen", () => {
  it.each([
    { route: "/grundlagen/mathe#flaechen", auswahlKey: "fachmathe-auswahl", auswahl: "flaechen", view: <MatheWerkstatt /> },
    { route: "/lernen/lf07#lf07-k01-e01", auswahlKey: "lernwerkstatt-auswahl-lf07", auswahl: "lf07-k01-e01", view: <LernwerkstattKurs lfId="lf07" /> },
    { route: "/sprache/deutsch#grenzwoerter", auswahlKey: "sprachwerkstatt-deutsch-auswahl", auswahl: "grenzwoerter", view: <SprachWerkstatt sprache="deutsch" /> },
    { route: "/sprache/englisch#sicherheit", auswahlKey: "sprachwerkstatt-englisch-auswahl", auswahl: "sicherheit", view: <SprachWerkstatt sprache="englisch" /> },
  ])("ersetzt eine alte Weiterlernen-Adresse beim Direkteinstieg in $route", ({ route, auswahlKey, auswahl, view }) => {
    appStorage.setItem("lernwerkstatt-zuletzt-route", "/grundlagen/mathe#laengen");
    window.history.replaceState(null, "", route);
    const lernen = render(view);
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe(route);
    expect(appStorage.getItem(auswahlKey)).toBe(auswahl);
    lernen.unmount();
    window.history.replaceState(null, "", "/");
    render(<Home />);
    expect(screen.getByRole("link", { name: "Weiterlernen" }).getAttribute("href")).toBe(route);
  });

  it("folgt Hash- und History-Wechseln in Fachmathe und bewahrt den ersten Rechenentwurf", () => {
    window.history.replaceState(null, "", "/grundlagen/mathe#laengen");
    render(<MatheWerkstatt />);
    fireEvent.change(screen.getByRole("textbox", { name: "Dein Ergebnis" }), { target: { value: "2," } });
    window.history.pushState(null, "", "/grundlagen/mathe#flaechen");
    fireEvent(window, new HashChangeEvent("hashchange"));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Rechteck, Dreieck und Dachfläche");
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/grundlagen/mathe#flaechen");
    window.history.replaceState(null, "", "/grundlagen/mathe#laengen");
    fireEvent(window, new PopStateEvent("popstate"));
    expect((screen.getByRole("textbox", { name: "Dein Ergebnis" }) as HTMLInputElement).value).toBe("2,");
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/grundlagen/mathe#laengen");
  });

  it("folgt Hash- und History-Wechseln im Lernfeld und stellt die angefangene Erklärung wieder her", () => {
    window.history.replaceState(null, "", "/lernen/lf07#lf07-k01-e01");
    render(<LernwerkstattKurs lfId="lf07" />);
    fireEvent.click(screen.getByRole("button", { name: "Jetzt selbst erklären" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Mein angefangener Wasserweg" } });
    window.history.pushState(null, "", "/lernen/lf07#lf07-k01-e02");
    fireEvent(window, new HashChangeEvent("hashchange"));
    expect(screen.getByRole("heading", { name: "Wasser kontrolliert weiterleiten" })).toBeDefined();
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/lernen/lf07#lf07-k01-e02");
    window.history.replaceState(null, "", "/lernen/lf07#lf07-k01-e01");
    fireEvent(window, new PopStateEvent("popstate"));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Mein angefangener Wasserweg");
    expect(appStorage.getItem("lernwerkstatt-zuletzt-route")).toBe("/lernen/lf07#lf07-k01-e01");
  });
});
