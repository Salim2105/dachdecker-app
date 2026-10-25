import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/AppShell";
import { GlossarText } from "@/components/GlossarText";

const push=vi.hoisted(()=>vi.fn());
vi.mock("next/navigation", () => ({ usePathname: () => "/lernwerkstatt/lf07", useRouter:()=>({push}) }));
vi.mock("@/components/rechner/Rechner", () => ({ Rechner: () => <input aria-label="Rechner-Eingabe" /> }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Begriffshilfe in der Lernwerkstatt", () => {
  it("öffnet eine Rückmeldung mit der aktuellen Einheit und einer ausdrücklich benannten Aufgabe",()=>{
    window.history.replaceState(null,"","/lernwerkstatt/lf07#lf07-k01-e02");
    render(<AppShell><section data-aufgabe-id="lf07-test" data-aufgabe-text="Wo fließt das Wasser hin?">Die aktuelle Lernaufgabe</section></AppShell>);
    fireEvent.click(screen.getByRole("link",{name:"Rückmeldung geben"}));
    const ziel=String(push.mock.calls.at(-1)?.[0]);
    const parameter=new URLSearchParams(ziel.split("?")[1]);
    expect(ziel.startsWith("/rueckmeldung?")).toBe(true);
    expect(parameter.get("bereich")).toBe("/lernwerkstatt/lf07#lf07-k01-e02");
    expect(parameter.get("aufgabe")).toBe("lf07-test");
    expect(parameter.get("frage")).toBe("Wo fließt das Wasser hin?");
    window.history.replaceState(null,"","/");
  });
  it("erhält Aufgabe und Suche, lässt internen Fokus stehen und kehrt mit Esc zum Begriff zurück", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
    const naechstesBild = () => act(() => { frames.splice(0).forEach((callback) => callback(0)); });
    render(<AppShell><label>Deine Antwort<input aria-label="Deine Antwort" /></label><p><GlossarText text="Freibord" /></p></AppShell>);
    fireEvent.change(screen.getByRole("textbox", { name: "Deine Antwort" }), { target: { value: "60 mm" } });
    const begriff = screen.getByRole("button", { name: "Begriff erklären: Freibord" });
    begriff.focus();
    fireEvent.click(begriff);
    naechstesBild();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Begriffshilfe" }));
    expect(screen.getByRole("heading", { name: "Freibord" })).toBeDefined();
    const suche = screen.getByRole("searchbox");
    fireEvent.change(suche, { target: { value: "waermedehnung" } });
    const auswahl = screen.getByRole("button", { name: "Wärmedehnung" });
    auswahl.focus();
    fireEvent.click(auswahl);
    naechstesBild();
    expect(document.activeElement).toBe(auswahl);
    expect(screen.getByRole("heading", { name: "Wärmedehnung" })).toBeDefined();
    suche.focus();
    expect(screen.getByRole("heading", { name: "Wärmedehnung" })).toBeDefined();
    fireEvent.keyDown(window, { key: "Escape" });
    naechstesBild();
    expect(document.activeElement).toBe(begriff);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect((screen.getByRole("textbox", { name: "Deine Antwort" }) as HTMLInputElement).value).toBe("60 mm");
    fireEvent.click(screen.getByRole("button", { name: "Begriffshilfe" }));
    naechstesBild();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("waermedehnung");
    expect(screen.getByRole("heading", { name: "Wärmedehnung" })).toBeDefined();
  });
});
