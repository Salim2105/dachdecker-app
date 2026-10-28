import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { useBearbeitungsSperre } from "@/components/useBearbeitungsSperre";

function fakeLocks() {
  const aktiv = new Set<string>();
  const request = vi.fn(async (name: string, _options: { ifAvailable: boolean }, callback: (lock: { name: string } | null) => unknown) => {
    await Promise.resolve();
    if (aktiv.has(name)) { await callback(null); return; }
    aktiv.add(name);
    try { await callback({ name }); } finally { aktiv.delete(name); }
  });
  return { aktiv, request };
}
function Anzeige({ name = "a", scope = "test-pruefung", text = "" }: { name?: string; scope?: string; text?: string }) {
  const sperre = useBearbeitungsSperre(scope);
  return <div aria-label={name}><output>{sperre.status}</output><p>{sperre.fehler}</p><span>{text}</span></div>;
}
let locks: ReturnType<typeof fakeLocks>;
beforeEach(() => { locks = fakeLocks(); vi.stubGlobal("navigator", { locks }); });
afterEach(async () => { cleanup(); await act(async () => { await Promise.resolve(); }); vi.unstubAllGlobals(); });
describe("Bearbeitungssperre für parallele Fenster", () => {
  it("hält genau eine Sperre bis zum Unmount und erneuert sie nicht bei einem Render", async () => {
    const view = render(<Anzeige />);
    expect(screen.getByText("pruefen")).toBeDefined();
    await screen.findByText("frei");
    expect(locks.aktiv.has("test-pruefung")).toBe(true);
    view.rerender(<Anzeige text="Andere Aufgabe, derselbe Arbeitsbereich" />);
    expect(locks.request).toHaveBeenCalledOnce();
    expect(locks.request.mock.calls[0][1]).toEqual({ ifAvailable: true });
    view.unmount();
    await waitFor(() => expect(locks.aktiv.size).toBe(0));
  });
  it("sperrt ein zweites Fenster und erlaubt die Bearbeitung nach Schließen und neuem Öffnen", async () => {
    const erstes = render(<Anzeige name="erstes" />);
    await screen.findByText("frei");
    const zweites = render(<Anzeige name="zweites" />);
    await screen.findByText("gesperrt");
    expect(screen.getByText(/Schließe das andere Fenster/)).toBeDefined();
    expect(locks.aktiv.size).toBe(1);
    erstes.unmount();
    await waitFor(() => expect(locks.aktiv.size).toBe(0));
    expect(screen.getByText("gesperrt")).toBeDefined();
    zweites.unmount();
    render(<Anzeige name="neu" />);
    await screen.findByText("frei");
  });
  it("verliert bei StrictMode weder die Sperre noch einen Freigabeaufruf", async () => {
    const view = render(<StrictMode><Anzeige /></StrictMode>);
    await screen.findByText("frei");
    expect(screen.queryByText("gesperrt")).toBeNull();
    expect(locks.aktiv.size).toBe(1);
    view.unmount();
    await waitFor(() => expect(locks.aktiv.size).toBe(0));
  });
  it("gibt eine erst nach Unmount zugeteilte Sperre sofort wieder frei", async () => {
    let zuteilen!: () => Promise<void>;
    let gehalten = false;
    const request = vi.fn((_name: string, _options: unknown, callback: (lock: { name: string } | null) => unknown) => new Promise<void>((resolve, reject) => {
      zuteilen = async () => { gehalten = true; try { await callback({ name: "test-pruefung" }); resolve(); } catch (e) { reject(e); } finally { gehalten = false; } };
    }));
    vi.stubGlobal("navigator", { locks: { request } });
    const view = render(<Anzeige />);
    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    view.unmount();
    await act(async () => { await zuteilen(); });
    expect(gehalten).toBe(false);
  });
  it("erklärt fehlende Browserunterstützung als sichtbaren Kompatibilitätsfall", async () => {
    vi.stubGlobal("navigator", {});
    render(<Anzeige />);
    await screen.findByText("nicht-verfuegbar");
    expect(screen.getByText(/in diesem Browser nicht verfügbar/)).toBeDefined();
    expect(locks.request).not.toHaveBeenCalled();
  });
  it("meldet auch fehlgeschlagene Sperranfragen sichtbar", async () => {
    locks.request.mockRejectedValueOnce(new DOMException("Not allowed", "SecurityError"));
    render(<Anzeige />);
    await screen.findByText("nicht-verfuegbar");
    expect(screen.getByText(/konnte nicht gestartet werden/)).toBeDefined();
    expect(locks.aktiv.size).toBe(0);
  });
  it("gibt beim bewussten Wechsel des Arbeitsbereichs zuerst die vorige Sperre frei", async () => {
    const view = render(<Anzeige scope="eins" />);
    await screen.findByText("frei");expect(locks.aktiv.has("eins")).toBe(true);
    view.rerender(<Anzeige scope="zwei" />);
    expect(screen.getByText("pruefen")).toBeDefined();
    await screen.findByText("frei");
    expect(locks.aktiv.has("eins")).toBe(false);expect(locks.aktiv.has("zwei")).toBe(true);
  });
});
