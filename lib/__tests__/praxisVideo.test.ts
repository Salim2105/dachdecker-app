import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DACH_MODELLE } from "@/lib/dach3dInhalte";
import { getDachPraxisVideo, getWerkstattPraxisVideo, istPraxisVideo, istPraxisVideoRef, PRAXIS_VIDEO_KONTEXTE, PRAXIS_VIDEOS, pruefePraxisVideoInhalte } from "@/lib/praxisVideoInhalte";
import { istPraxisVideoAsset, istPraxisVideoMedienPfad, pruefePraxisVideoMedien } from "@/lib/praxisVideoMedien";

beforeEach(() => { vi.resetModules(); localStorage.clear(); vi.stubGlobal("indexedDB", new IDBFactory()); vi.stubGlobal("Blob", NodeBlob); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Versionierte Praxisvideos", () => {
  it("deckt alle 104 Dachkontexte und acht ausdrücklich zugeordnete Handgriffe ab", () => {
    expect(PRAXIS_VIDEO_KONTEXTE).toHaveLength(112);
    expect(PRAXIS_VIDEOS).toHaveLength(112);
    expect(PRAXIS_VIDEOS.filter(v => v.typ === "dachdetail")).toHaveLength(104);
    for (const m of DACH_MODELLE) for (const d of m.deckungen) for (const id of m.detailIds) {
      expect(getDachPraxisVideo(m.id, d, id)).toMatchObject({ id: `dach-${m.id}-${d}-${id}`, version: 1, form: m.id, deckung: d, detailId: id });
    }
    for (const pfad of ["falzziegel", "biber-doppel"] as const) for (const slug of ["schnitt", "bearbeiten", "verlegen", "kontrolle"]) {
      expect(getWerkstattPraxisVideo(pfad, slug)).toMatchObject({ typ: "handgriff", pfadId: pfad, slug });
    }
    expect(getWerkstattPraxisVideo("falzziegel", "laengen")).toBeUndefined();
  });
  it("verwirft falsche Kontexte, Versionen, überlappende Kapitel und unvollständige Verzeichnisse", () => {
    const v = PRAXIS_VIDEOS[0];
    expect(istPraxisVideo(v)).toBe(true);
    expect(istPraxisVideo({ ...v, version: 2 })).toBe(false);
    expect(istPraxisVideo({ ...v, form: "flachdach" })).toBe(false);
    expect(istPraxisVideo({ ...v, transkript: "" })).toBe(false);
    expect(istPraxisVideo({ ...v, kapitel: [{ ...v.kapitel[0], ende: v.dauer + 1 }] })).toBe(false);
    expect(istPraxisVideo({ ...v, kapitel: [v.kapitel[0], { ...v.kapitel[0], id: "zweites" }] })).toBe(false);
    for (const zahl of [NaN, Infinity, -Infinity]) {
      expect(istPraxisVideo({ ...v, dauer: zahl })).toBe(false);
      expect(istPraxisVideo({ ...v, kapitel: [{ ...v.kapitel[0], start: zahl }] })).toBe(false);
      expect(istPraxisVideo({ ...v, kapitel: [{ ...v.kapitel[0], ende: zahl }] })).toBe(false);
    }
    expect(pruefePraxisVideoInhalte({ version: 1, videos: [v] })).toBe(false);
    expect(pruefePraxisVideoInhalte({ version: 1, videos: [] })).toBe(false);
    expect(pruefePraxisVideoInhalte({ version: 1, videos: [] }, { allowEmpty: true })).toBe(true);
    expect(pruefePraxisVideoInhalte({ version: 1, videos: PRAXIS_VIDEOS.map(() => v) })).toBe(false);
    expect(istPraxisVideoRef({ videoId: v.id, version: 1 })).toBe(true);
    expect(istPraxisVideoRef({ videoId: "dach-unbekannt", version: 1 })).toBe(false);
    expect(istPraxisVideoRef({ videoId: v.id, version: 2 })).toBe(false);
    const a = { id: `${v.id}.mp4`, url: `/praxisvideos/v1/${v.id}.mp4`, bytes: 10, sha256: "0123456789abcdef".repeat(4), typ: "video" };
    expect(istPraxisVideoAsset(a)).toBe(true);
    for (const falsch of [{ ...a, url: "https://fremd.example/clip.mp4" }, { ...a, bytes: 15 * 1024 * 1024 + 1 }, { ...a, typ: "bild" }, { ...a, sha256: "0".repeat(64) }]) expect(istPraxisVideoAsset(falsch)).toBe(false);
    expect(pruefePraxisVideoMedien({ version: 1, assets: [a] })).toBe(false);
    expect(pruefePraxisVideoMedien({ version: 1, assets: [] })).toBe(false);
    expect(pruefePraxisVideoMedien({ version: 1, assets: [] }, { allowEmpty: true })).toBe(true);
    const vollstaendigeMedien = PRAXIS_VIDEO_KONTEXTE.flatMap(k => (["mp4", "vtt", "webp"] as const).map(ext => ({
      ...a, id: `${k.id}.${ext}`, url: `/praxisvideos/v1/${k.id}.${ext}`, typ: ext === "mp4" ? "video" : ext === "vtt" ? "untertitel" : "bild",
    })));
    expect(pruefePraxisVideoMedien({ version: 1, assets: vollstaendigeMedien })).toBe(true);
    expect(pruefePraxisVideoMedien({ version: 1, assets: vollstaendigeMedien.slice(1) })).toBe(false);
    expect(pruefePraxisVideoMedien({ version: 2, assets: vollstaendigeMedien })).toBe(false);
    expect(istPraxisVideoAsset({ ...a, bytes: Infinity })).toBe(false);
    for (const pfad of ["../clip.mp4", `${v.id}.mp4?x=1`, `v2/${v.id}.mp4`, `${v.id}.html`]) expect(istPraxisVideoMedienPfad(pfad)).toBe(false);
  });
  it("sichert unabhängige Ton-/Untertitelwahl und Wiedergabepositionen ohne öffentliche Videobytes", async () => {
    const storage = await import("@/lib/lernSpeicher"), stand = await import("@/lib/praxisVideoStand"), backup = await import("@/lib/backup");
    await storage.initializeStorage();
    const publicMedia = vi.fn(() => { throw new Error("Öffentliche Videos gehören nicht ins private ZIP."); });
    vi.stubGlobal("caches", { open: publicMedia });
    expect(stand.ladePraxisVideoEinstellungen()).toEqual({ sprecher: true, untertitel: true });
    const clip = PRAXIS_VIDEOS[0];
    stand.speicherePraxisVideoEinstellungen({ sprecher: true, untertitel: false });
    expect(stand.ladePraxisVideoEinstellungen()).toEqual({ sprecher: true, untertitel: false });
    stand.speicherePraxisVideoEinstellungen({ sprecher: false, untertitel: true });
    const position = stand.speicherePraxisVideoPosition(clip.id, clip.dauer / 2);
    expect(stand.ladePraxisVideoPosition(clip.id)).toEqual(position);
    const archiv = backup.pruefeArchiv(await backup.exportiereArchiv())!;
    expect(archiv.dateien.size).toBe(0);
    expect(archiv.daten[stand.praxisVideoEinstellungenKey]).toBe('{"sprecher":false,"untertitel":true}');
    storage.appStorage.clear();
    await backup.importiereArchiv(archiv);
    expect(stand.ladePraxisVideoEinstellungen()).toEqual({ sprecher: false, untertitel: true });
    expect(stand.ladePraxisVideoPosition(clip.id)).toEqual(position);
    expect(publicMedia).not.toHaveBeenCalled();
    for (const [key, wert] of [[stand.praxisVideoEinstellungenKey, { sprecher: "ja", untertitel: true }], [stand.praxisVideoPositionenKey, { [clip.id]: { ...position, videoVersion: 2 } }], [stand.praxisVideoPositionenKey, { [clip.id]: { ...position, position: -1 } }]]) {
      expect(backup.pruefeSicherung(JSON.stringify({ app: "dachdecker-lernstand", version: 1, daten: { [key as string]: JSON.stringify(wert) } }))).toBeNull();
    }
    expect(() => stand.speicherePraxisVideoPosition(clip.id, NaN)).toThrow();
    expect(stand.istPraxisVideoPosition({ ...position, aktualisiertAm: Infinity })).toBe(false);
    expect(stand.istPraxisVideoPositionen({ fremderKey: position })).toBe(false);
  });
});
