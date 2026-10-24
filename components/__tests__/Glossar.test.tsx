import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Glossar } from "@/components/Glossar";
import { GlossarText } from "@/components/GlossarText";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GlossarText", () => {
  it("öffnet Begriffe über native fokussierbare Buttons und gibt die stabile ID weiter", () => {
    const onBegriff = vi.fn();
    render(<p><GlossarText text="Der Freibord bleibt frei." onBegriff={onBegriff} /></p>);
    const knopf = screen.getByRole("button", { name: "Begriff erklären: Freibord" });
    knopf.focus();
    expect(document.activeElement).toBe(knopf);
    expect(knopf.tagName).toBe("BUTTON");
    expect(knopf.getAttribute("type")).toBe("button");
    fireEvent.click(knopf);
    expect(onBegriff).toHaveBeenCalledWith("glossar-lf07-048");
    expect(document.activeElement).toBe(knopf);
  });

  it("benachrichtigt die Hilfeseitenleiste und rendert importierten Text sicher", () => {
    const empfaenger = vi.fn();
    window.addEventListener("dachdecker:begriff", empfaenger);
    const { container } = render(<GlossarText text={'<img src=x onerror="alert(1)"> Dachrinne {Freibord}'} />);
    fireEvent.click(screen.getByRole("button", { name: "Begriff erklären: Dachrinne" }));
    expect((empfaenger.mock.calls[0][0] as CustomEvent).detail).toBe("glossar-lf07-dachrinne");
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(screen.queryByRole("button", { name: "Begriff erklären: Freibord" })).toBeNull();
    window.removeEventListener("dachdecker:begriff", empfaenger);
  });

  it("bietet eine zusätzliche eindeutige Begriffsliste an", () => {
    render(<GlossarText text="Freibord und Freibord." showBegriffsliste />);
    expect(screen.getByText("Begriffe in diesem Abschnitt")).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Begriff erklären: Freibord" })).toHaveLength(3);
  });
});

describe("Glossar als Nachschlagehilfe", () => {
  it("zeigt einfache Bedeutung, Baustellenbeispiel, optionale Fachdefinition und Quelle", () => {
    render(<Glossar begriffId="glossar-lf07-048" />);
    expect(screen.getByRole("heading", { name: "Freibord" })).toBeDefined();
    expect(within(screen.getByRole("article")).getByText(/geplanten höchsten Wasserstand/)).toBeDefined();
    expect(screen.getByText(/60 mm Freibord/)).toBeDefined();
    const fachdetails = screen.getByText("Fachdefinition anzeigen").closest("details");
    expect(fachdetails?.open).toBe(false);
    expect(screen.getByText(/Grundstufe Bautechnik, Buch S. 278/)).toBeDefined();
    expect(screen.getByText("Vorlesen ist auf diesem Gerät nicht verfügbar.")).toBeDefined();
  });

  it("sucht ohne Änderung der offenen Erklärung und wechselt anschließend zum gesuchten Begriff", () => {
    const onBegriff = vi.fn();
    render(<Glossar begriffId="glossar-lf07-048" onBegriff={onBegriff} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "waermedehnung" } });
    expect(screen.getByRole("heading", { name: "Freibord" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Wärmedehnung" }));
    expect(screen.getByRole("heading", { name: "Wärmedehnung" })).toBeDefined();
    expect(onBegriff).toHaveBeenCalledWith("glossar-lf07-waermedehnung");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "xyzunbekannt" } });
    expect(screen.getByText(/Kein passender Begriff/)).toBeDefined();
  });

  it("übernimmt einen neuen Begriff aus dem Lerntext und erhält die Suchanfrage", () => {
    const { rerender } = render(<Glossar begriffId="glossar-lf07-048" />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Wärme" } });
    rerender(<Glossar begriffId="glossar-lf07-dachablauf" />);
    expect(screen.getByRole("heading", { name: "Dachablauf" })).toBeDefined();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("Wärme");
  });

  it("liest auf Wunsch vor und stoppt den eigenen Auftrag beim Wechsel des Begriffs", () => {
    class TestUtterance {
      text: string;
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    const synthese = { speak: vi.fn(), cancel: vi.fn() };
    vi.stubGlobal("SpeechSynthesisUtterance", TestUtterance);
    vi.stubGlobal("speechSynthesis", synthese);
    const { rerender } = render(<Glossar begriffId="glossar-lf07-048" />);
    fireEvent.click(screen.getByRole("button", { name: "Erklärung vorlesen" }));
    expect(synthese.speak).toHaveBeenCalledTimes(1);
    expect(synthese.speak.mock.calls[0][0].lang).toBe("de-DE");
    expect(synthese.speak.mock.calls[0][0].text).toContain("Freibord");
    expect(screen.getByRole("button", { name: "Vorlesen stoppen" }).getAttribute("aria-pressed")).toBe("true");
    rerender(<Glossar begriffId="glossar-lf07-dachablauf" />);
    expect(synthese.cancel).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Erklärung vorlesen" })).toBeDefined();
  });
});
