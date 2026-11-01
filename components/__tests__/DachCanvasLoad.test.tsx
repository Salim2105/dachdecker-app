import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LadeModell, type DachCanvasProps } from "@/components/dach3d/DachCanvas";
import { DACH_MEDIEN } from "@/lib/dach3dMedien";

const asset = DACH_MEDIEN.find(a => a.id === "flachdach-warmdach/f03/modell.glb")!;
const props = (): DachCanvasProps => ({ url: asset.url, detailId: "f03", ansicht: "nah", phase: "erkennen", schritt: 0,
  schichten: ["deckung", "tragwerk"], kamera: "nah", wasser: 0, reduziert: true, erlaubt: ["f03"], resetSignal: 0,
  befehl: { art: "reset", nummer: 0 }, onDetail: vi.fn(), onBereit: vi.fn(), onFehler: vi.fn() });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Optionale Dachmedien können ohne Laufzeitfehler fehlen", () => {
  it("wechselt bei einem Offline-Abruf über den Fehlercallback zur Ersatzansicht", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const p = props(), errors = vi.fn();
    window.addEventListener("error", errors);
    try {
      render(<LadeModell {...p} />);
      await waitFor(() => expect(p.onFehler).toHaveBeenCalledExactlyOnceWith("Failed to fetch"));
      expect(p.onBereit).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally { window.removeEventListener("error", errors); }
  });
  it("öffnet unvollständige Bytes nicht als scheinbar gültiges Modell", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))));
    const parse = vi.spyOn(GLTFLoader.prototype, "parseAsync"), p = props();
    render(<LadeModell {...p} />);
    await waitFor(() => expect(p.onFehler).toHaveBeenCalledWith(expect.stringContaining("unvollständig")));
    expect(parse).not.toHaveBeenCalled(); expect(p.onBereit).not.toHaveBeenCalled();
  });
  it("behandelt auch einen fehlerhaften GLB-Inhalt über denselben Ersatzweg", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array(asset.bytes))));
    vi.spyOn(GLTFLoader.prototype, "parseAsync").mockRejectedValue(new Error("GLB konnte nicht gelesen werden"));
    const p = props(); render(<LadeModell {...p} />);
    await waitFor(() => expect(p.onFehler).toHaveBeenCalledExactlyOnceWith("GLB konnte nicht gelesen werden"));
    expect(p.onBereit).not.toHaveBeenCalled();
  });
  it("meldet einen abgebrochenen alten Abruf nicht an einen bereits verlassenen Bildschirm", async () => {
    let reject!: (error: Error) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((_, r) => { reject = r; })));
    const p = props(), view = render(<LadeModell {...p} />);
    view.unmount();
    await act(async () => { reject(new TypeError("Failed to fetch")); });
    expect(p.onFehler).not.toHaveBeenCalled(); expect(p.onBereit).not.toHaveBeenCalled();
  });
});
