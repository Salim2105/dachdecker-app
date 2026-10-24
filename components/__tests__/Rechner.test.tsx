import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Rechner } from "@/components/rechner/Rechner";
import { num } from "@/components/rechner/Feld";
import { appStorage } from "@/lib/lernSpeicher";
import { leseRechnerEntwurf, RECHNER_KEY, START_ENTWURF } from "@/lib/rechnerEntwurf";

beforeEach(() => { appStorage.removeItem(RECHNER_KEY); });
afterEach(cleanup);
const bereich = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const aendere = (name: RegExp, value: string) => fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } });

describe("Rechner als bleibende Lernhilfe", () => {
  it("behält auch eine unvollständige Eingabe bei Tabwechsel und erneutem Öffnen", () => {
    const { unmount } = render(<Rechner />);
    aendere(/Grundrissfläche A₀/, "123,5");
    aendere(/Dachneigung α/, "");
    expect(screen.queryByText("Wahre Dachfläche", { exact: true })).toBeNull();
    bereich("Material");
    aendere(/Verschnittzuschlag p/, "8");
    bereich("Dachneigung");
    expect((screen.getByRole("textbox", { name: /Grundrissfläche A₀/ }) as HTMLInputElement).value).toBe("123,5");
    expect((screen.getByRole("textbox", { name: /Dachneigung α/ }) as HTMLInputElement).value).toBe("");
    unmount();
    render(<Rechner compact />);
    expect((screen.getByRole("textbox", { name: /Dachneigung α/ }) as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("textbox", { name: /Dachneigung α/ }).getAttribute("aria-invalid")).toBe("true");
    bereich("Material");
    expect((screen.getByRole("textbox", { name: /Verschnittzuschlag p/ }) as HTMLInputElement).value).toBe("8");
  });

  it("zeigt bei einem ungültigen Winkel keine Dachflächenberechnung und stellt sie nach Korrektur wieder her", () => {
    render(<Rechner />);
    aendere(/Dachneigung α/, "90");
    expect(screen.queryByText("Wahre Dachfläche", { exact: true })).toBeNull();
    const input = screen.getByRole("textbox", { name: /Dachneigung α/ });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toContain("unter 90");
    aendere(/Dachneigung α/, "45");
    expect(screen.getByText("Wahre Dachfläche", { exact: true })).toBeTruthy();
    expect(screen.getByText(/100 m² \/ cos\(45°\) = 141,42 m²/)).toBeTruthy();
    expect(screen.getAllByRole("img", { name: /Rechtwinkliger Dachquerschnitt/ })).toHaveLength(2);
  });

  it("übernimmt die ungerundete wahre Dachfläche in den Materialrechner", () => {
    render(<Rechner />);
    aendere(/Dachneigung α/, "45");
    fireEvent.click(screen.getByRole("button", { name: "Dachfläche für Material übernehmen" }));
    const wert = Number((screen.getByRole("textbox", { name: /Wahre Dachfläche A/ }) as HTMLInputElement).value);
    expect(wert).toBeCloseTo(100 * Math.SQRT2, 10);
    expect(screen.getByText("Benötigte Gesamtmenge")).toBeTruthy();
    bereich("Scharen & Hafte");
    fireEvent.click(screen.getByRole("button", { name: "Stückbedarf für Material übernehmen" }));
    expect(Number((screen.getByRole("textbox", { name: /Stück je m² n/ }) as HTMLInputElement).value)).toBeCloseTo(10000 / (20 * 34), 10);
    expect(Number((screen.getByRole("textbox", { name: /Wahre Dachfläche A/ }) as HTMLInputElement).value)).toBeCloseTo(wert, 10);
  });

  it("hält Schichteingaben als Text fest und lässt eine defekte Schicht nicht weg", () => {
    const { unmount } = render(<Rechner />);
    bereich("U-Wert");
    aendere(/λ Schicht 1/, "0");
    expect(screen.queryByText("R der Schichten")).toBeNull();
    expect(screen.getByRole("textbox", { name: /λ Schicht 1/ }).getAttribute("aria-invalid")).toBe("true");
    bereich("Ausdehnung");
    bereich("U-Wert");
    expect((screen.getByRole("textbox", { name: /λ Schicht 1/ }) as HTMLInputElement).value).toBe("0");
    aendere(/λ Schicht 1/, "0,04");
    expect(screen.getByText("R der Schichten")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Schicht hinzufügen" }));
    aendere(/Dicke Schicht 3/, "2,4");
    unmount();
    render(<Rechner compact />);
    expect((screen.getByRole("textbox", { name: /Dicke Schicht 3/ }) as HTMLInputElement).value).toBe("2,4");
    expect((screen.getByRole("textbox", { name: /λ Schicht 3/ }) as HTMLInputElement).value).toBe("");
    expect(screen.queryByText("R der Schichten")).toBeNull();
  });

  it("zeigt geometrisch unmögliche Maße direkt am betroffenen Feld", () => {
    render(<Rechner />);
    bereich("Gauben");
    aendere(/Überstand ü/, "6");
    expect(screen.getByRole("textbox", { name: /Überstand ü/ }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Waagerechte Tiefe", { exact: true })).toBeNull();
    aendere(/Firstlänge f/, "1");
    expect(screen.getByRole("textbox", { name: /Firstlänge f/ }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Beide Gaubendachflächen", { exact: true })).toBeNull();
    bereich("Scharen & Hafte");
    aendere(/Nutzbreite bₙ/, "15");
    expect(screen.getByRole("textbox", { name: /Nutzbreite bₙ/ }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Volle Scharen", { exact: true })).toBeNull();
  });

  it("akzeptiert Abkühlung und verwirft ungültige Abflussbeiwerte", () => {
    render(<Rechner />);
    bereich("Ausdehnung");
    aendere(/Temperaturänderung ΔT/, "-50");
    expect(screen.getByText(/22 · 10⁻⁶\/K · 10 m · -50 K · 1000 mm\/m = -11,00 mm/)).toBeTruthy();
    bereich("Entwässerung");
    aendere(/Abflussbeiwert C/, "1,2");
    expect(screen.queryByText("Abfluss Q", { exact: true })).toBeNull();
    expect(screen.getByRole("textbox", { name: /Abflussbeiwert C/ }).getAttribute("aria-invalid")).toBe("true");
    aendere(/Abflussbeiwert C/, "0,5");
    expect(screen.getByText(/300 l\/\(s·ha\) · 200 m² · 0,5 \/ 10 000 = 3,00 l\/s/)).toBeTruthy();
  });
});

describe("strikte Zahleneingaben und Entwurfsformat", () => {
  it.each(["", " ", "12abc", "1.000,5", "NaN", "Infinity", "2 m", "1e2"])("macht aus %j keine scheinbar gültige Zahl", (wert) => {
    expect(() => num(wert)).toThrow();
  });
  it("erlaubt Kommazahlen und negative Temperaturdifferenzen", () => {
    expect(num(" 2,5 ")).toBe(2.5);
    expect(num("-50")).toBe(-50);
    expect(num("0")).toBe(0);
  });
  it("ergänzt neue Felder, ohne gespeicherte Teil-Eingaben zu überschreiben", () => {
    const entwurf = leseRechnerEntwurf(JSON.stringify({ tab: "uwert", felder: { neigung: "", grundflaeche: "100,5" }, schichten: [] }));
    expect(entwurf.tab).toBe("uwert");
    expect(entwurf.felder.neigung).toBe("");
    expect(entwurf.felder.grundflaeche).toBe("100,5");
    expect(entwurf.felder.deltaT).toBe("50");
    expect(entwurf.schichten).toEqual([]);
  });
  it("fängt beschädigte Sicherungsdaten ab", () => {
    expect(leseRechnerEntwurf("{kaputt")).toEqual(START_ENTWURF);
    expect(leseRechnerEntwurf(JSON.stringify({ tab: "unbekannt", felder: { neigung: 33 }, schichten: [null] })).tab).toBe("dach");
  });
});
