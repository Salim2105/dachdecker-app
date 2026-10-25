import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppShell } from "@/components/AppShell";
import { FachbegriffeSeite } from "@/components/FachbegriffeSeite";
import { flushStorage } from "@/lib/lernSpeicher";
import { wechsleLernziel } from "@/lib/lernNavigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/grundlagen/mathe", useRouter: () => ({push: vi.fn()}) }));
vi.mock("@/lib/lernSpeicher", () => ({ appStorage: {getItem: vi.fn(), setItem: vi.fn()}, flushStorage: vi.fn() }));
vi.mock("@/lib/lernNavigation", () => ({ wechsleLernziel: vi.fn() }));
vi.mock("@/components/rechner/Rechner", () => ({ Rechner: () => <input aria-label="Rechner-Eingabe" /> }));
let frames: FrameRequestCallback[];
const zeichne = () => act(() => {frames.splice(0).forEach(f => f(0));});
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(flushStorage).mockResolvedValue(); frames=[];
  vi.stubGlobal("requestAnimationFrame", (f:FrameRequestCallback) => {frames.push(f); return frames.length;});
});
afterEach(() => {cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});

function menueOeffnen() {
  const knopf = within(screen.getByRole("navigation", {name:"Hauptnavigation mobil"})).getByRole("button", {name:"Bereiche"});
  knopf.focus();fireEvent.click(knopf);
  return knopf;
}
describe("Handy-Bereichsmenü über der Aufgabe", () => {
  it("zeigt alle 16 Bereiche und Services, hält Fokus und erhält ungespeicherten Text beim Schließen", () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{width:1}] as unknown as DOMRectList);
    render(<AppShell><input aria-label="Angefangene Rechnung" /></AppShell>);
    const eingabe=screen.getByRole("textbox", {name:"Angefangene Rechnung"});
    fireEvent.change(eingabe, {target:{value:"0,"}});
    const knopf=menueOeffnen(); const dialog=screen.getByRole("dialog", {name:"Alle Bereiche"});
    expect(within(dialog).getAllByRole("link")).toHaveLength(18);
    expect(document.activeElement).toBe(within(dialog).getByRole("heading", {name:"Alle Bereiche"}));
    expect(document.body.style.overflow).toBe("hidden");
    expect(eingabe.closest("[inert]")).not.toBeNull();
    fireEvent.keyDown(document.activeElement!, {key:"Tab", shiftKey:true});
    expect(document.activeElement).toBe(within(dialog).getByRole("link", {name:"Erprobungsbogen"}));
    fireEvent.keyDown(document.activeElement!, {key:"Tab"});
    expect(document.activeElement).toBe(within(dialog).getByRole("button", {name:"Bereiche schließen"}));
    fireEvent.keyDown(window, {key:"Escape"});zeichne();
    expect(screen.queryByRole("dialog", {name:"Alle Bereiche"})).toBeNull();
    expect(document.activeElement).toBe(knopf);expect(document.body.style.overflow).toBe("");
    expect((eingabe as HTMLInputElement).value).toBe("0,");
  });
  it("schließt erst nach dauerhaftem Speichern und führt den Sprung trotz geschlossenem Menü aus", async () => {
    let fertig!:()=>void;vi.mocked(flushStorage).mockReturnValue(new Promise<void>(r=>{fertig=r;}));
    render(<AppShell>Aufgabe bleibt geöffnet</AppShell>);menueOeffnen();
    fireEvent.click(within(screen.getByRole("dialog", {name:"Alle Bereiche"})).getByRole("link", {name:"Fachmathe"}));
    expect(screen.getByRole("dialog", {name:"Alle Bereiche"})).toBeDefined();expect(wechsleLernziel).not.toHaveBeenCalled();
    await act(async()=>fertig());
    await waitFor(()=>expect(wechsleLernziel).toHaveBeenCalledWith("/grundlagen/mathe?ansicht=uebersicht"));
    expect(screen.queryByRole("dialog", {name:"Alle Bereiche"})).toBeNull();
  });
  it("bleibt bei Speicherfehlern offen und überdeckt nie gleichzeitig die Begriffshilfe", async () => {
    vi.mocked(flushStorage).mockRejectedValueOnce(new Error("Speicher voll"));
    render(<AppShell>Aktuelle Aufgabe</AppShell>);
    fireEvent.click(screen.getByRole("button", {name:"Begriffshilfe"}));zeichne();
    expect(screen.getByRole("heading", {name:"Begriffshilfe"})).toBeDefined();
    menueOeffnen();expect(screen.queryByRole("heading", {name:"Begriffshilfe"})).toBeNull();
    fireEvent.click(within(screen.getByRole("dialog", {name:"Alle Bereiche"})).getByRole("link", {name:"Fachmathe"}));
    await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("nicht dauerhaft gespeichert"));
    expect(screen.getByRole("dialog", {name:"Alle Bereiche"})).toBeDefined();expect(wechsleLernziel).not.toHaveBeenCalled();
  });
});
it("erklärt Fachbegriffe direkt auf der Suchseite und öffnet keine globale Hilfe", () => {
  const global=vi.fn();window.addEventListener("dachdecker:begriff",global);
  render(<FachbegriffeSeite/>);
  fireEvent.change(screen.getByRole("searchbox"),{target:{value:"Freibord"}});
  fireEvent.click(screen.getByRole("button",{name:"Freibord"}));zeichne();
  expect(screen.getByRole("heading",{name:"Freibord"})).toBe(document.activeElement);
  expect(screen.getByRole("article").textContent).toContain("Beispiel auf der Baustelle");
  expect(global).not.toHaveBeenCalled();window.removeEventListener("dachdecker:begriff",global);
});
