import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("Blob", NodeBlob);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("vollständige Sicherungen", () => {
  it("stellt Entwürfe, tatsächliche Prüfungsantworten und Bildbytes aus dem ZIP wieder her", async () => {
    const storage = await import("@/lib/lernSpeicher");
    const backup = await import("@/lib/backup");
    await storage.initializeStorage();
    const exam = JSON.stringify({ fragen: ["f1"], zahlen: [23.5], antworten: ["B"], zeit: 123 });
    storage.appStorage.setItem("dd-pruefung-v2", exam);
    storage.appStorage.setItem("drawing:draft:a", '{"photoKey":"drawing:photo:a"}');
    await storage.writeBlob("drawing:photo:a", new Blob([new Uint8Array([0, 1, 254, 255])], { type: "image/png" }));
    const bytes = await backup.exportiereArchiv();
    const checked = backup.pruefeArchiv(bytes)!;
    expect(checked.version).toBe(2);
    expect(checked.dateien.size).toBe(1);
    storage.appStorage.setItem("dd-pruefung-v2", "anderer Stand");
    storage.appStorage.setItem("drawing:draft:anderer", "behalten");
    await storage.deleteBlob("drawing:photo:a");
    expect(storage.appStorage.getItem("dd-pruefung-v2")).toBe("anderer Stand");
    await backup.importiereArchiv(checked);
    expect(storage.appStorage.getItem("dd-pruefung-v2")).toBe(exam);
    expect(storage.appStorage.getItem("drawing:draft:anderer")).toBe("behalten");
    expect(new Uint8Array(await (await storage.readBlob("drawing:photo:a"))!.arrayBuffer())).toEqual(new Uint8Array([0, 1, 254, 255]));
  });

  it("kann noch nicht dauerhaft geschriebene Eingaben als Notfallsicherung exportieren", async () => {
    const storage = await import("@/lib/lernSpeicher");
    const backup = await import("@/lib/backup");
    await storage.initializeStorage();
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => { throw new DOMException("Quota", "QuotaExceededError"); });
    storage.appStorage.setItem("dd-pruefung-v2", "noch im Arbeitsspeicher");
    await expect(storage.flushStorage()).rejects.toThrow();
    const checked = backup.pruefeArchiv(await backup.exportiereArchiv())!;
    expect(checked.daten["dd-pruefung-v2"]).toBe("noch im Arbeitsspeicher");
    expect(storage.getStorageStatus().phase).toBe("error");
  });

  it("akzeptiert alte JSON-Sicherungen und erhält Prüfungs- und Zeichenentwürfe", async () => {
    const storage = await import("@/lib/lernSpeicher");
    const backup = await import("@/lib/backup");
    await storage.initializeStorage();
    storage.appStorage.setItem("dd-pruefung-v2", "Prüfung");
    storage.appStorage.setItem("drawing:draft:a", "Zeichnung");
    storage.appStorage.setItem("dd-session-heute", "alte Runde");
    const checked = backup.pruefeArchiv(strToU8(JSON.stringify({ app: "dachdecker-lernstand", version: 1, daten: { "fortschritt-v1": "{}" } })))!;
    expect(checked.version).toBe(1);
    await backup.importiereArchiv(checked);
    expect(storage.appStorage.getItem("dd-session-heute")).toBeNull();
    expect(storage.appStorage.getItem("dd-pruefung-v2")).toBe("Prüfung");
    expect(storage.appStorage.getItem("drawing:draft:a")).toBe("Zeichnung");
  });

  it("lehnt fehlende Bilder, falsche Größen und zusätzliche Archivpfade vor der Übernahme ab", async () => {
    const backup = await import("@/lib/backup");
    const manifest = { app: "dachdecker-lernstand", version: 2, daten: { theme: "light" }, dateien: [{ key: "bild", datei: "dateien/0.bin", typ: "image/png", groesse: 2 }] };
    expect(backup.pruefeArchiv(zipSync({ "sicherung.json": strToU8(JSON.stringify(manifest)) }))).toBeNull();
    expect(backup.pruefeArchiv(zipSync({ "sicherung.json": strToU8(JSON.stringify(manifest)), "dateien/0.bin": new Uint8Array([1]) }))).toBeNull();
    expect(backup.pruefeArchiv(zipSync({ "sicherung.json": strToU8(JSON.stringify({ ...manifest, dateien: [] })), "../fremd": strToU8("x") }))).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
