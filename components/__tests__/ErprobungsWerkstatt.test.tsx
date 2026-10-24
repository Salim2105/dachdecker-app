import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ErprobungsWerkstatt } from "@/components/erprobung/ErprobungsWerkstatt";
import { appStorage } from "@/lib/lernSpeicher";
import { ERPROBUNG_KEY, ladeErprobung } from "@/lib/erprobung";

beforeEach(() => appStorage.clear());
afterEach(cleanup);

describe("Erprobungsmodus mit echten Beobachtungen", () => {
  it("zeigt vor der Erprobung keine erfundenen Testpersonen oder Resultate", () => {
    render(<ErprobungsWerkstatt />);
    expect(screen.getByRole("heading", { name: "Noch keine Nutzertests erfasst" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Diese Erprobung als JSON sichern" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Neue Erprobung anlegen" }));
    expect((screen.getByRole("button", { name: "Diese Erprobung als JSON sichern" }) as HTMLButtonElement).disabled).toBe(true);
    expect(ladeErprobung()?.sitzungen[0].beobachtungen).toEqual({});
  });

  it("stellt aktive Aufgabe und unfertige Beobachtung nach dem Schließen wieder her", () => {
    const ansicht = render(<ErprobungsWerkstatt />);
    fireEvent.change(screen.getByRole("textbox", { name: /Kürzel für die nächste Person/ }), { target: { value: "A03" } });
    fireEvent.click(screen.getByRole("button", { name: "Neue Erprobung anlegen" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Vorkenntnisse laut Selbstauskunft/ }), { target: { value: "2. Lehrjahr" } });
    fireEvent.click(screen.getByRole("button", { name: /Einen Rechenweg übertragen/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Mit Hilfe geschafft" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Welche Hilfe war nötig/ }), { target: { value: "Formel gemeinsam gelesen" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Was wurde anders verstanden/ }), { target: { value: "Erst Umfang berechnet" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Weitere Beobachtung oder Rückmeldung/ }), { target: { value: "Noch mit anderen Maßen probieren" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Beobachtete Dauer/ }), { target: { value: "180" } });
    ansicht.unmount(); render(<ErprobungsWerkstatt />);
    expect((screen.getByRole("textbox", { name: /Welche Hilfe war nötig/ }) as HTMLTextAreaElement).value).toBe("Formel gemeinsam gelesen");
    expect((screen.getByRole("textbox", { name: /Was wurde anders verstanden/ }) as HTMLTextAreaElement).value).toBe("Erst Umfang berechnet");
    expect((screen.getByRole("radio", { name: "Mit Hilfe geschafft" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("spinbutton", { name: /Beobachtete Dauer/ }) as HTMLInputElement).value).toBe("180");
    expect(screen.getByRole("button", { name: /Einen Rechenweg übertragen/ }).getAttribute("aria-current")).toBe("step");
    expect((screen.getByRole("button", { name: "Diese Erprobung als JSON sichern" }) as HTMLButtonElement).disabled).toBe(false);
    expect(ladeErprobung()?.sitzungen[0].code).toBe("A03");
    expect(ladeErprobung()?.sitzungen[0].vorwissen).toBe("2. Lehrjahr");
  });

  it("behält auch ein noch nicht angelegtes Sitzungskürzel bis zum Erstellen der Sitzung", () => {
    const erste = render(<ErprobungsWerkstatt />);
    fireEvent.change(screen.getByRole("textbox", { name: /Kürzel für die nächste Person/ }), { target: { value: "A05" } });
    erste.unmount(); render(<ErprobungsWerkstatt />);
    expect((screen.getByRole("textbox", { name: /Kürzel für die nächste Person/ }) as HTMLInputElement).value).toBe("A05");
    fireEvent.click(screen.getByRole("button", { name: "Neue Erprobung anlegen" }));
    expect(ladeErprobung()?.sitzungen[0].code).toBe("A05");
    expect((screen.getByRole("textbox", { name: /Kürzel für die nächste Person/ }) as HTMLInputElement).value).toBe("");
    expect(appStorage.getItem("erprobung-naechstes-kuerzel")).toBeNull();
  });

  it("erhält frühere Sitzungen, wenn eine weitere Testperson startet", () => {
    render(<ErprobungsWerkstatt />);
    fireEvent.click(screen.getByRole("button", { name: "Neue Erprobung anlegen" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Weitere Beobachtung oder Rückmeldung/ }), { target: { value: "Button übersehen" } });
    fireEvent.click(screen.getByRole("button", { name: "Neue Erprobung anlegen" }));
    expect(ladeErprobung()?.sitzungen).toHaveLength(2);
    expect(ladeErprobung()?.sitzungen[0].beobachtungen.lernweg?.notiz).toBe("Button übersehen");
    expect(ladeErprobung()?.sitzungen[1].beobachtungen).toEqual({});
    const ersteId = ladeErprobung()!.sitzungen[0].id;
    fireEvent.change(screen.getByRole("combobox", { name: "Gespeicherte Erprobung" }), { target: { value: ersteId } });
    expect((screen.getByRole("textbox", { name: /Weitere Beobachtung oder Rückmeldung/ }) as HTMLTextAreaElement).value).toBe("Button übersehen");
  });

  it("überschreibt eine beschädigte lokale Originaldatei nicht", () => {
    appStorage.setItem(ERPROBUNG_KEY, "beschädigte Daten");
    render(<ErprobungsWerkstatt />);
    expect(screen.getByRole("heading", { name: "Gespeicherte Erprobung prüfen" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Neue Erprobung anlegen" })).toBeNull();
    expect(appStorage.getItem(ERPROBUNG_KEY)).toBe("beschädigte Daten");
  });
});
