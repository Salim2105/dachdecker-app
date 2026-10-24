import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Speicher = typeof import("@/lib/lernSpeicher");
let storage: Speicher;
beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("Blob", NodeBlob);
  storage = await import("@/lib/lernSpeicher");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("dauerhafter Lernspeicher", () => {
  it("übernimmt alte Daten vollständig und lädt nach Neustart den neueren IndexedDB-Stand", async () => {
    localStorage.setItem("fortschritt-v1", '{"vorhanden":true}');
    localStorage.setItem("dd-pruefung-v2", '{"zahlen":[12.5],"antworten":["B"]}');
    localStorage.setItem("rechner-entwurf-v2", '{"winkel":"42"}');
    await storage.initializeStorage();
    expect(storage.appStorage.length).toBe(3);
    expect(Object.keys(storage.appStorage)).toContain("dd-pruefung-v2");
    storage.appStorage.setItem("rechner-entwurf-v2", '{"winkel":"45"}');
    await storage.flushStorage();
    vi.resetModules();
    const reopened = await import("@/lib/lernSpeicher");
    await reopened.initializeStorage();
    expect(reopened.appStorage.getItem("dd-pruefung-v2")).toBe('{"zahlen":[12.5],"antworten":["B"]}');
    expect(reopened.appStorage.getItem("rechner-entwurf-v2")).toBe('{"winkel":"45"}');
    expect(localStorage.getItem("rechner-entwurf-v2")).toBe('{"winkel":"42"}');
  });

  it("speichert und liest Bilddateien nach erneutem Öffnen", async () => {
    await storage.writeBlob("drawing:photo:a:display", new Blob(["Bilddaten"], { type: "image/png" }));
    vi.resetModules();
    const reopened = await import("@/lib/lernSpeicher");
    expect(await (await reopened.readBlob("drawing:photo:a:display"))?.text()).toBe("Bilddaten");
    await reopened.deleteBlob("drawing:photo:a:display");
    expect(await reopened.readBlob("drawing:photo:a:display")).toBeNull();
  });

  it("zeigt fehlgeschlagene dauerhafte Schreibvorgänge und wiederholt sie ohne Cacheverlust", async () => {
    localStorage.setItem("dd-pruefung-v2", "alt");
    await storage.initializeStorage();
    const listener = vi.fn();
    const unsubscribe = storage.subscribeStorageStatus(listener);
    const original = IDBObjectStore.prototype.put;
    const failure = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(function (this: IDBObjectStore, value, key) {
      const req = original.call(this, value, key);
      this.transaction.abort();
      return req;
    });
    storage.appStorage.setItem("dd-pruefung-v2", "neu");
    await expect(storage.flushStorage()).rejects.toThrow();
    expect(storage.getStorageStatus().phase).toBe("error");
    expect(storage.getStorageStatus().error).toContain("nicht dauerhaft gespeichert");
    expect(storage.appStorage.getItem("dd-pruefung-v2")).toBe("neu");
    expect(listener).toHaveBeenCalled();
    failure.mockRestore();
    await storage.retryStorageWrites();
    expect(storage.getStorageStatus().phase).toBe("ready");
    expect(storage.getStorageStatus().pending).toBe(0);
    const snapshot = storage.getStorageStatus();
    expect(storage.getStorageStatus()).toBe(snapshot);
    unsubscribe();
  });

  it("committet eine Wiederherstellung einschließlich Bildern gemeinsam oder gar nicht", async () => {
    localStorage.setItem("theme", "dark");
    await storage.initializeStorage();
    await storage.writeBlob("foto", new Blob(["alt"]));
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value, key) {
      const req = original.call(this, value, key);
      if (this.name === "blobs") this.transaction.abort();
      return req;
    });
    await expect(storage.restoreStorage({ daten: { theme: "light" }, dateien: new Map([["foto", new Blob(["neu"])]]) })).rejects.toThrow();
    expect(storage.appStorage.getItem("theme")).toBe("dark");
    expect(await (await storage.readBlob("foto"))?.text()).toBe("alt");
  });

  it("bricht auch bei einem synchronen Schreibfehler die ganze Wiederherstellung ab", async () => {
    localStorage.setItem("theme", "dark");
    await storage.initializeStorage();
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value, key) {
      if (this.name === "blobs") throw new DOMException("Quota", "QuotaExceededError");
      return original.call(this, value, key);
    });
    await expect(storage.restoreStorage({ daten: { theme: "light" }, dateien: new Map([["foto", new Blob(["Bild"])]]) })).rejects.toThrow();
    vi.restoreAllMocks();
    vi.resetModules();
    const reopened = await import("@/lib/lernSpeicher");
    await reopened.initializeStorage();
    expect(reopened.appStorage.getItem("theme")).toBe("dark");
    expect(await reopened.readBlob("foto")).toBeNull();
  });

  it("markiert eine gescheiterte Migration nicht als abgeschlossen und erhält die Originaldaten", async () => {
    localStorage.setItem("theme", "dark");
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value, key) {
      const req = original.call(this, value, key);
      if (this.name === "meta") this.transaction.abort();
      return req;
    });
    await expect(storage.initializeStorage()).rejects.toThrow();
    expect(localStorage.getItem("theme")).toBe("dark");
    vi.restoreAllMocks();
    await storage.initializeStorage();
    expect(storage.appStorage.getItem("theme")).toBe("dark");
  });

  it("nutzt ohne IndexedDB den alten Stringspeicher und behauptet keine gespeicherten Bilder", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await storage.initializeStorage();
    storage.appStorage.setItem("theme", "light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(storage.getStorageStatus().backend).toBe("local");
    await expect(storage.writeBlob("foto", new Blob(["Bild"]))).rejects.toThrow("nicht dauerhaft gespeichert");
    expect(storage.getStorageStatus().phase).toBe("error");
  });
});
