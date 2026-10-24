import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LernwerkstattKurs } from "@/components/LernwerkstattKurs";
import { getCurriculum } from "@/lib/curriculum";
import { appStorage } from "@/lib/lernSpeicher";
import { kursStandKey } from "@/lib/kursStand";

beforeEach(() => { appStorage.clear(); window.history.replaceState(null, "", "/lernen/lf07"); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("LF7-Lerneinheit", () => {
  it("führt durch Verstehen, Abruf, drei Kontrollen, Anwendung und Abschluss", () => {
    render(<LernwerkstattKurs lfId="lf07" />);
    fireEvent.click(screen.getByRole("button", { name: /Vier Bauteile, ein Wasserweg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Jetzt selbst erklären" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Rinne, Stutzen, Bogen, Fallrohr" } });
    fireEvent.click(screen.getByRole("button", { name: "Mit der Musterantwort vergleichen" }));
    fireEvent.click(screen.getByRole("button", { name: "Sicher erklärt" }));
    fireEvent.click(screen.getByRole("button", { name: "Zu den Kontrollfragen" }));
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Antwort vergleichen" }));
      fireEvent.click(screen.getByRole("button", { name: "Stimmt vollständig" }));
      fireEvent.click(screen.getByRole("button", { name: i < 2 ? "Nächste Kontrollfrage" : "Jetzt anwenden" }));
    }
    const einheit = getCurriculum("lf07")!.kapitel[0].einheiten[0];
    if (einheit.aktivitaet?.typ !== "zuordnen") throw new Error("Test erwartet Zuordnung");
    for (const p of einheit.aktivitaet.paare) fireEvent.change(screen.getByRole("combobox", { name: p.links }), { target: { value: p.id } });
    fireEvent.click(screen.getByRole("button", { name: "Meine Lösung prüfen" }));
    expect(screen.getByRole("status").textContent).toContain("Lernziel angewendet");
    fireEvent.click(screen.getByRole("button", { name: "Einheit abschließen" }));
    expect(screen.getByRole("heading", { name: "Ein Lernschritt geschafft." })).toBeDefined();
    expect(JSON.parse(appStorage.getItem(kursStandKey(einheit))!).abgeschlossen).toBe(true);
  });
  it("stellt Phase und noch nicht abgegebene Erklärung nach Neustart wieder her", () => {
    const first = render(<LernwerkstattKurs lfId="lf07" />);
    fireEvent.click(screen.getByRole("button", { name: /Vier Bauteile, ein Wasserweg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Jetzt selbst erklären" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Meine angefangene Erklärung" } });
    first.unmount(); render(<LernwerkstattKurs lfId="lf07" />);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Meine angefangene Erklärung");
    expect(screen.getByRole("button", { name: "2. Selbst erklären" }).getAttribute("aria-current")).toBe("step");
  });
});

describe("Übernahme bisheriger Runden", () => {
  it("öffnet eine schon begonnene kleine Übungsrunde nach dem Update wieder", () => {
    appStorage.setItem("dd-session-lf07-einheit", JSON.stringify({ index: 0, ergebnisse: [], beantwortet: false, nacharbeit: false, nacharbeitErgebnisse: [], aufgabenIds: ["lf07-001", "lf07-013"] }));
    appStorage.setItem("letzte-session", "lf07-einheit");
    render(<LernwerkstattKurs lfId="lf07" />);
    expect(screen.getByText(/Deine bisherige Übungsrunde ist erhalten geblieben/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Antwort vergleichen" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "← Zu den neuen Kapiteln" }));
    expect(screen.getByRole("heading", { name: "Deine Kapitel" })).toBeDefined();
    expect(appStorage.getItem("dd-session-lf07-einheit")).not.toBeNull();
  });
});
