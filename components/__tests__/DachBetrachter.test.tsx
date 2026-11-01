import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DachBetrachter, type DachBetrachterProps } from "@/components/dach3d/DachBetrachter";

vi.mock("next/dynamic", () => ({ default: () => function CanvasProbe(props: { onBereit: () => void; onFehler: (m: string) => void; befehl: { art: string; nummer: number } }) {
  return <div data-testid="dach-canvas" data-befehl={props.befehl.art} data-befehl-nummer={props.befehl.nummer}><button onClick={props.onBereit}>Zeichnung beendet</button><button onClick={() => props.onFehler("Modell unterbrochen")}>Modellfehler auslösen</button></div>;
} }));
vi.mock("@/lib/dach3dMedien", () => ({ dachMedien: (form = "steildach", deckung = "falzziegel") => ({
  modell: { url: `/dach-medien/v1/${form}-${deckung}/s03/modell.glb` },
  preview: "/dach-vorschau/v1/steildach-falzziegel/uebersicht.webp",
  bilder: { nah: "/richtig.webp", schnitt: "/schnitt.webp", aufbau: "/aufbau.webp" },
  hdBilder: { nah: "/gross.webp", schnitt: "/gross-schnitt.webp", aufbau: "/gross-aufbau.webp" },
  fehlerBild: "/fehler.webp", hdFehlerBild: "/gross-fehler.webp",
}) }));
const props = (): DachBetrachterProps => ({ form: "steildach", deckung: "falzziegel", detailId: "s03", ansicht: "nah", phase: "erkennen", schritt: 0, schichten: ["deckung", "tragwerk"], kamera: "nah", wasser: 0, onDetail: vi.fn(), onKamera: vi.fn() });
beforeEach(() => {
  vi.stubGlobal("WebGL2RenderingContext", class {});
  const context = { getExtension: () => ({ loseContext: vi.fn() }) };
  // getContext also has a WebGPU overload; this fake implements our WebGL probe.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => context) as unknown as HTMLCanvasElement["getContext"]);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Dachbetrachter: Ausweichansicht und kontrollierte 3D-Nutzung", () => {
  it("zeigt dasselbe Lehrbild ohne WebGL und lädt keinen aktiven Betrachter", async () => {
    vi.stubGlobal("WebGL2RenderingContext", undefined);
    const view = render(<DachBetrachter {...props()} />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("nicht verfügbar"));
    expect(screen.queryByTestId("dach-canvas")).toBeNull();
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe("/richtig.webp");
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("feste-ansicht");
    expect((screen.getByRole("button", { name: "3D ansehen" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("beendet verdeckte Szenen und wartet nach dem Zurückkehren auf einen neuen gezeichneten Frame", async () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const view = render(<DachBetrachter {...props()} />);
    await screen.findByTestId("dach-canvas");
    fireEvent.click(screen.getByRole("button", { name: "Zeichnung beendet" }));
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("3d-bereit");
    hidden = true; fireEvent(document, new Event("visibilitychange"));
    expect(screen.queryByTestId("dach-canvas")).toBeNull();
    hidden = false; fireEvent(document, new Event("visibilitychange"));
    await screen.findByTestId("dach-canvas");
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("3d-laedt");
    fireEvent.click(screen.getByRole("button", { name: "Zeichnung beendet" }));
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("3d-bereit");
  });
  it("meldet 3D erst nach dem Zeichnen bereit und lässt sich auf feste Ansichten umschalten", async () => {
    const view = render(<DachBetrachter {...props()} />);
    await screen.findByTestId("dach-canvas");
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("3d-laedt");
    fireEvent.click(screen.getByRole("button", { name: "Zeichnung beendet" }));
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("3d-bereit");
    expect(view.container.querySelector("figure")?.getAttribute("data-modell-url")).toContain("/s03/modell.glb");
    fireEvent.click(screen.getByRole("button", { name: "Feste Ansicht" }));
    expect(screen.queryByTestId("dach-canvas")).toBeNull();
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("feste-ansicht");
  });
  it("erhält bei Modellfehlern das Bild und erlaubt einen erneuten Versuch", async () => {
    const view = render(<DachBetrachter {...props()} />);
    await screen.findByTestId("dach-canvas");
    fireEvent.click(screen.getByRole("button", { name: "Modellfehler auslösen" }));
    expect(screen.getByRole("status").textContent).toContain("Eingaben bleiben verfügbar");
    expect(screen.queryByTestId("dach-canvas")).toBeNull();
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe("/richtig.webp");
    fireEvent.click(screen.getByRole("button", { name: "3D erneut versuchen" }));
    await screen.findByTestId("dach-canvas");
  });
  it("wechselt nach einer Minute ohne Bild zum Lehrbild, erlaubt einen frischen Versuch und beendet die Frist beim ersten Frame", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const view = render(<DachBetrachter {...props()} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId("dach-canvas")).toBeDefined();
    act(() => vi.advanceTimersByTime(59_999));
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("3d-laedt");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId("dach-canvas")).toBeNull();
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe("/richtig.webp");
    expect(screen.getByRole("status").textContent).toContain("Eingaben bleiben verfügbar");
    fireEvent.click(screen.getByRole("button", { name: "3D erneut versuchen" }));
    await act(async () => { await Promise.resolve(); });
    act(() => vi.advanceTimersByTime(59_999));
    expect(screen.getByTestId("dach-canvas")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Zeichnung beendet" }));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(60_000));
    expect(view.container.querySelector("figure")?.getAttribute("data-status")).toBe("3d-bereit");
    expect(screen.queryByRole("button", { name: "3D erneut versuchen" })).toBeNull();
  });
  it("verwirft Ladefristen bei Dachwechsel, verdecktem Tab, fester Ansicht und beim Schließen", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const view = render(<DachBetrachter {...props()} />);
    await act(async () => { await Promise.resolve(); });
    act(() => vi.advanceTimersByTime(55_000));
    view.rerender(<DachBetrachter {...props()} form="walmdach" />);
    await act(async () => { await Promise.resolve(); });
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.getByTestId("dach-canvas")).toBeDefined();
    expect(vi.getTimerCount()).toBe(1);
    hidden = true; fireEvent(document, new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(60_000));
    hidden = false; fireEvent(document, new Event("visibilitychange"));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId("dach-canvas")).toBeDefined();
    expect(vi.getTimerCount()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Feste Ansicht" }));
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "3D ansehen" }));
    await act(async () => { await Promise.resolve(); });
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("zeigt im Prüfmodus weder aktives 3D noch erklärende Alternativtexte", async () => {
    const view = render(<DachBetrachter {...props()} pruefmodus />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("ohne Lösungsmarkierungen"));
    expect(screen.queryByTestId("dach-canvas")).toBeNull();
    expect(screen.queryByRole("button", { name: "3D ansehen" })).toBeNull();
    expect(view.container.querySelector("img")?.getAttribute("alt")).toContain("ohne Lösungsmarkierungen");
  });
  it("verwendet das eigene Fehlerbild und öffnet dafür keine scheinbar korrigierte 3D-Szene", async () => {
    const view = render(<DachBetrachter {...props()} fehler phase="kontrolle" />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Fehlerbeispiel"));
    expect(view.container.querySelector("img")?.getAttribute("src")).toBe("/fehler.webp");
    expect(screen.queryByTestId("dach-canvas")).toBeNull();
  });
  it("setzt ein Detail zurück auf seine Nahansicht und lässt Pfeiltasten im fokussierten Betrachter zu", async () => {
    const p = props(); render(<DachBetrachter {...p} />);
    await screen.findByTestId("dach-canvas");
    fireEvent.click(screen.getByRole("button", { name: "Zeichnung beendet" }));
    const region = screen.getByRole("region");
    expect(region.getAttribute("tabindex")).toBe("0");
    const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
    region.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Ansicht zurücksetzen" }));
    expect(p.onKamera).toHaveBeenCalledWith("nah");
  });
  it("beginnt einen Rundgang nur bewusst und nimmt ihn nach einem Dachwechsel nicht ungefragt wieder auf", async () => {
    const view = render(<DachBetrachter {...props()} />);
    await screen.findByTestId("dach-canvas");
    expect((screen.getByRole("button", { name: "Rundgang abspielen" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Zeichnung beendet" }));
    fireEvent.click(screen.getByRole("button", { name: "Rundgang abspielen" }));
    expect(screen.getByTestId("dach-canvas").getAttribute("data-befehl")).toBe("rundgang");
    expect(screen.getByRole("button", { name: "Rundgang pausieren" }).getAttribute("aria-pressed")).toBe("true");
    view.rerender(<DachBetrachter {...props()} form="walmdach" />);
    await waitFor(() => expect(screen.getByTestId("dach-canvas").getAttribute("data-befehl-nummer")).toBe("0"));
    expect(screen.getByTestId("dach-canvas").getAttribute("data-befehl")).toBe("reset");
    expect(screen.getByRole("button", { name: "Rundgang abspielen" }).getAttribute("aria-pressed")).toBe("false");
  });
  it("bietet bei reduzierter Bewegung feste Ansichten statt eines automatischen Rundgangs", async () => {
    render(<DachBetrachter {...props()} reduzierteBewegung />);
    await screen.findByTestId("dach-canvas");
    fireEvent.click(screen.getByRole("button", { name: "Zeichnung beendet" }));
    expect((screen.getByRole("button", { name: "Rundgang abspielen" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Ansicht zurücksetzen" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
