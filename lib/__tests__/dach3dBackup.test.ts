import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => { vi.resetModules(); localStorage.clear(); vi.stubGlobal("indexedDB", new IDBFactory()); vi.stubGlobal("Blob", NodeBlob); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Dachlernstand in der vollständigen privaten Sicherung", () => {
  it("stellt Dachpositionen, eingefrorene Antworten und private Bildbytes wieder her, ohne öffentliche Modellpakete einzulesen", async () => {
    const storage = await import("@/lib/lernSpeicher"), backup = await import("@/lib/backup");
    const dach = await import("@/lib/dach3dStand"), { DACH_DETAILS } = await import("@/lib/dach3dInhalte");
    const publicMedia = vi.fn(() => { throw new Error("Öffentliche Modelldownloads gehören nicht ins private Archiv."); });
    vi.stubGlobal("caches", { open: publicMedia });
    await storage.initializeStorage();
    const s = dach.neuerDachStand(1000), aufgabe = DACH_DETAILS[0].aufgaben[0];
    s.form = "walmdach";
    s.jeDach.walmdach = { ...s.jeDach.walmdach, detailId: "w01", deckung: "biber-doppel", phase: "montage", schritt: 2, ansicht: "schnitt" };
    s.notizen.w01 = "Den Gratfuß am Übungsdach wiedererkennen.";
    s.antworten[aufgabe.id] = dach.dachAntwort(s, aufgabe, 1000);
    s.antworten[aufgabe.id].auswahl = [aufgabe.optionen[0].id];
    dach.speichereDachStand(s);
    const photoKey = "drawing:photo:privater-dachvergleich", bytes = new Uint8Array([0, 4, 128, 255]);
    await storage.writeBlob(photoKey, new Blob([bytes], { type: "image/png" }));
    storage.appStorage.setItem("drawing:draft:dachvergleich", JSON.stringify({ photoKey }));
    const archiv = backup.pruefeArchiv(await backup.exportiereArchiv())!;
    expect(archiv.daten[dach.dachStandKey]).toBe(JSON.stringify(s));
    expect(archiv.dateien.size).toBe(1); expect(publicMedia).not.toHaveBeenCalled();
    storage.appStorage.clear(); await storage.deleteBlob(photoKey);
    await backup.importiereArchiv(archiv);
    expect(dach.ladeDachStand()).toEqual(s);
    expect(new Uint8Array(await (await storage.readBlob(photoKey))!.arrayBuffer())).toEqual(bytes);
    expect(publicMedia).not.toHaveBeenCalled();
  });
});
