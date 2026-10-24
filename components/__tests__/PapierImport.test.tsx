import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ importiere: vi.fn(), flush: vi.fn() }));
vi.mock("@/lib/zeichenFoto", () => ({ importiereZeichenFoto: mocks.importiere, loescheZeichenFoto: vi.fn() }));
vi.mock("@/lib/lernSpeicher", () => ({ flushStorage: mocks.flush, readBlob: vi.fn() }));
import { PapierZeichnung } from "@/components/zeichnen/PapierZeichnung";
afterEach(cleanup);
describe("Papierfoto bei unterbrochener Ansicht", () => {
  it("schützt den laufenden Import und schließt die Zuordnung nach einem Seitenwechsel ab", async () => {
    let fertig!: (value: { originalKey: string; anzeigeKey: string; mime: string; name: string }) => void;
    mocks.importiere.mockReturnValue(new Promise((resolve) => { fertig = resolve; }));
    mocks.flush.mockResolvedValue(undefined);
    const speichern = vi.fn().mockReturnValue(true);
    const ansicht = render(<PapierZeichnung aufgabenId="zeichnen" onChange={speichern} />);
    fireEvent.change(screen.getByLabelText("Foto der eigenen Zeichnung"), { target: { files: [new File(["png"], "skizze.png", { type: "image/png" })] } });
    const schliessen = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(schliessen); expect(schliessen.defaultPrevented).toBe(true);
    ansicht.unmount();
    const foto = { originalKey: "drawing:photo:a", anzeigeKey: "drawing:photo:a", mime: "image/png", name: "skizze.png" };
    await act(async () => { fertig(foto); });
    expect(speichern).toHaveBeenCalledExactlyOnceWith(foto); expect(mocks.flush).toHaveBeenCalledOnce();
    const danach = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(danach); expect(danach.defaultPrevented).toBe(false);
  });
});
