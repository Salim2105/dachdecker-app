import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal("indexedDB", new IDBFactory());
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Erprobungen im dauerhaften Lernspeicher", () => {
  it("lädt Beobachtungen nach einem vollständigen Speicher-Neustart und nimmt sie in die Sicherung auf", async () => {
    const storage = await import("@/lib/lernSpeicher");
    const erprobung = await import("@/lib/erprobung");
    await storage.initializeStorage();
    const stand = erprobung.neueErprobungsSitzung(erprobung.leereErprobung(), "A03", 1770000000000, "dauerhaft-1");
    stand.sitzungen[0].aufgabeId = "zeichnen";
    stand.sitzungen[0].beobachtungen.zeichnen = { ...erprobung.leereBeobachtung(), ergebnis: "mit_hilfe", hilfe: "Speichern gemeinsam gefunden", notiz: "Beschriftung nach Neustart erhalten" };
    erprobung.speichereErprobung(stand);
    await storage.flushStorage();
    expect(localStorage.getItem(erprobung.ERPROBUNG_KEY)).toBeNull();

    vi.resetModules();
    const reopenedStorage = await import("@/lib/lernSpeicher");
    const reopenedErprobung = await import("@/lib/erprobung");
    await reopenedStorage.initializeStorage();
    expect(reopenedErprobung.ladeErprobung()).toEqual(stand);
    const sicherung = await reopenedStorage.snapshotStorage();
    expect(JSON.parse(sicherung.daten[reopenedErprobung.ERPROBUNG_KEY])).toEqual(stand);
  });
});
