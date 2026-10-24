import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importiereZeichenFoto, leseFotoBytes } from "@/lib/zeichenFoto";
const { dateien, writeBlob, deleteBlob } = vi.hoisted(() => {
  const dateien = new Map<string, Blob>();
  return { dateien, writeBlob: vi.fn(async (key: string, blob: Blob) => { dateien.set(key, blob); }), deleteBlob: vi.fn(async (key: string) => { dateien.delete(key); }) };
});
vi.mock("@/lib/lernSpeicher", () => ({ writeBlob, deleteBlob }));
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const heic = new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 104, 101, 105, 99, 0, 0, 0, 0]);

beforeEach(() => {
  dateien.clear(); vi.clearAllMocks();
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 1200, height: 800, close: vi.fn() })));
});
afterEach(() => { delete window.dachdeckerDesktop; vi.unstubAllGlobals(); });

describe("Lokale Zeichnungsfotos", () => {
  it("speichert das unveränderte PNG-Original und verwendet denselben Blob als Anzeige", async () => {
    const foto = await importiereZeichenFoto(new File([png], "Skizze.png", { type: "image/png" }), "draw-1");
    expect(foto.anzeigeKey).toBe(foto.originalKey);
    expect(foto.originalKey).toMatch(/^drawing:photo:draw-1:/);
    expect(writeBlob).toHaveBeenCalledTimes(1);
    expect(new Uint8Array(await leseFotoBytes(dateien.get(foto.originalKey)!))).toEqual(png);
  });
  it("behält HEIC als Original und speichert das lokal konvertierte PNG zusätzlich", async () => {
    const convertHeic = vi.fn(async () => ({ bytes: png, mime: "image/png" as const }));
    window.dachdeckerDesktop = { platform: "darwin", convertHeic };
    const foto = await importiereZeichenFoto(new File([heic], "Bauzeichnung.HEIC"), "draw-7");
    expect(convertHeic).toHaveBeenCalledExactlyOnceWith({ bytes: expect.any(ArrayBuffer), name: "Bauzeichnung.HEIC" });
    expect(foto.anzeigeKey).not.toBe(foto.originalKey);
    expect(new Uint8Array(await leseFotoBytes(dateien.get(foto.originalKey)!))).toEqual(heic);
    expect(new Uint8Array(await leseFotoBytes(dateien.get(foto.anzeigeKey)!))).toEqual(png);
  });
  it("erklärt HEIC im Browser und akzeptiert keine umbenannten SVG-Dateien", async () => {
    await expect(importiereZeichenFoto(new File([heic], "Skizze.heic"), "draw-1")).rejects.toThrow("Mac-App");
    await expect(importiereZeichenFoto(new File(["<svg onload='alert(1)'></svg>"], "Skizze.png", { type: "image/png" }), "draw-1")).rejects.toThrow("gültiges JPEG");
    expect(writeBlob).not.toHaveBeenCalled();
  });
  it("meldet beschädigte Bilder vor dem Speichern und räumt einen fehlgeschlagenen zweiten Blob auf", async () => {
    vi.mocked(createImageBitmap).mockRejectedValueOnce(new Error("Foto beschädigt"));
    await expect(importiereZeichenFoto(new File([png], "Skizze.png"), "draw-1")).rejects.toThrow("Foto beschädigt");
    expect(writeBlob).not.toHaveBeenCalled();
    window.dachdeckerDesktop = { platform: "darwin", convertHeic: async () => ({ bytes: png, mime: "image/png" }) };
    writeBlob.mockImplementationOnce(async (key: string, blob: Blob) => { dateien.set(key, blob); }).mockRejectedValueOnce(new Error("Speicher voll"));
    await expect(importiereZeichenFoto(new File([heic], "Skizze.heic"), "draw-1")).rejects.toThrow("Speicher voll");
    expect(dateien.size).toBe(0);
    expect(deleteBlob).toHaveBeenCalledTimes(2);
  });
});
