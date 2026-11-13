import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import originalInhalte from "@/content/praxisvideos-inhalte.json";
import originalMedien from "@/content/praxisvideos-medien.json";
import archiv from "@/content/praxisvideos-archiv.json";

const lernpunkte = Object.fromEntries(([["schnitt", "schritt-2", "a"], ["bearbeiten", "schritt-3", "b"], ["verlegen", "schritt-1", "a"]] as const).map(([slug, kapitelId, aufgabe]) => {
  const id = `werkstatt-falzziegel-${slug}`;
  return [id, { id: `${id}-mitmachen`, kapitelId, einheitId: id, aufgabeId: `${id}-${aufgabe}` }];
}));
const v2Inhalte = { version: 1, videos: originalInhalte.videos.map(clip => {
  if (!Object.hasOwn(lernpunkte, clip.id)) return clip;
  const alt = archiv.videos.find(v => v.id === clip.id)!;
  return { ...alt, version: 2, dauer: 60, kapitel: alt.kapitel.map((k, i) => ({ ...k, start: k.start * 60 / alt.dauer, ende: i === alt.kapitel.length - 1 ? 60 : k.ende * 60 / alt.dauer })), lernpunkte: [lernpunkte[clip.id]] };
}) };
const v2Medien = { version: 1, assets: originalMedien.assets.map(a => ({ ...a, url: a.url.replace(/\/v[12]\//, Object.hasOwn(lernpunkte, a.id.replace(/\.(mp4|vtt|webp)$/, "")) ? "/v2/" : "/v1/") })) };

beforeEach(() => {
  vi.resetModules(); localStorage.clear();
  vi.stubGlobal("indexedDB", new IDBFactory()); vi.stubGlobal("Blob", NodeBlob);
  vi.doMock("@/content/praxisvideos-inhalte.json", () => ({ default: v2Inhalte }));
  vi.doMock("@/content/praxisvideos-medien.json", () => ({ default: v2Medien }));
});
afterEach(() => {
  vi.doUnmock("@/content/praxisvideos-inhalte.json"); vi.doUnmock("@/content/praxisvideos-medien.json");
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("Neue Praxisvideofassungen ohne verlorene alte Lernstände", () => {
  it("ersetzt genau drei aktive Fassungen und erhält historische Texte, Kapitelzeiten und Medien", async () => {
    const inhalte = await import("@/lib/praxisVideoInhalte"), medien = await import("@/lib/praxisVideoMedien");
    expect(inhalte.PRAXIS_VIDEOS).toHaveLength(112);
    expect(inhalte.PRAXIS_VIDEOS.filter(v => v.version === 2)).toHaveLength(3);
    const neu = inhalte.getPraxisVideo("werkstatt-falzziegel-bearbeiten")!;
    const alt = inhalte.getVorherigePraxisVideoFassung(neu)!;
    expect(neu.version).toBe(2); expect(alt).toEqual(archiv.videos.find(v => v.id === neu.id));
    expect(alt.dauer).toBeGreaterThan(neu.dauer);
    expect(medien.praxisVideoMedien(alt).assets).toEqual(archiv.assets.filter(a => a.id.startsWith(`${alt.id}.`)));
    expect(medien.praxisVideoMedien(neu).assets.every(a => a.url.startsWith("/praxisvideos/v2/"))).toBe(true);
    expect(inhalte.getPraxisVideo("werkstatt-biber-doppel-schnitt", 2)).toBeUndefined();
    expect(inhalte.istPraxisVideoRef({ videoId: neu.id, version: 2 })).toBe(true);
    expect(inhalte.istPraxisVideoRef({ videoId: neu.id, version: 1 })).toBe(true);
  });

  it("bindet Lernpunkte ausdrücklich an die richtige vorhandene Aufgabe und das Kapitel", async () => {
    const { getPraxisVideo, istPraxisVideo } = await import("@/lib/praxisVideoInhalte");
    const neu = getPraxisVideo("werkstatt-falzziegel-schnitt")!;
    expect(istPraxisVideo(neu)).toBe(true);
    for (const falsch of [[], [{ ...neu.lernpunkte![0], aufgabeId: "werkstatt-falzziegel-verlegen-a" }], [{ ...neu.lernpunkte![0], kapitelId: "fehlerkorrektur" }], [neu.lernpunkte![0], neu.lernpunkte![0]]]) {
      expect(istPraxisVideo({ ...neu, lernpunkte: falsch })).toBe(false);
    }
    expect(istPraxisVideo({ ...getPraxisVideo(neu.id, 1), lernpunkte: neu.lernpunkte })).toBe(false);
    expect(istPraxisVideo({ ...neu, version: 3 })).toBe(false);
  });

  it("verwirft vermischte Fassungen und fremde Pfade, lässt alte vollständige Pakete aber gültig", async () => {
    const m = await import("@/lib/praxisVideoMedien"), i = await import("@/lib/praxisVideoInhalte");
    const neu = i.getPraxisVideo("werkstatt-falzziegel-schnitt")!, alt = i.getPraxisVideo(neu.id, 1)!;
    const aktuell = m.praxisVideoClipPaket(neu), vorher = m.praxisVideoClipPaket(alt);
    expect(m.istPraxisVideoPaket(aktuell)).toBe(true); expect(m.istPraxisVideoPaket(vorher)).toBe(true);
    const assets = aktuell.assets.map(a => a.typ === "untertitel" ? vorher.assets.find(p => p.typ === "untertitel")! : a);
    expect(m.istPraxisVideoPaket({ ...aktuell, assets, bytes: assets.reduce((sum, a) => sum + a.bytes, 0) })).toBe(false);
    expect(m.pruefePraxisVideoMedien(v2Medien)).toBe(true);
    const vertauscht = { ...v2Medien, assets: v2Medien.assets.map(a => a.id === `${neu.id}.mp4` ? vorher.assets.find(p => p.typ === "video")! : a) };
    expect(m.pruefePraxisVideoMedien(vertauscht)).toBe(false);
    const film = aktuell.assets.find(a => a.typ === "video")!;
    expect(m.istPraxisVideoAsset({ ...film, bytes: 25 * 1024 * 1024 })).toBe(true);
    expect(m.istPraxisVideoAsset({ ...film, bytes: 25 * 1024 * 1024 + 1 })).toBe(false);
    for (const url of [film.url + "?fremd=1", film.url.replace("v2", "v99"), "https://fremd.example" + film.url, film.url.replace("falzziegel-schnitt", "biber-doppel-schnitt")]) expect(m.istPraxisVideoAsset({ ...film, url })).toBe(false);
  });

  it("speichert v1 und v2 getrennt und prüft alte Positionen gegen die alte Laufzeit", async () => {
    const stand = await import("@/lib/praxisVideoStand"), storage = await import("@/lib/lernSpeicher");
    const id = "werkstatt-falzziegel-bearbeiten";
    const alt = stand.speicherePraxisVideoPosition(id, 70);
    const alterWert = storage.appStorage.getItem(stand.praxisVideoPositionenKey);
    expect(stand.ladePraxisVideoPosition(id, 2)).toBeNull();
    const neu = stand.speicherePraxisVideoPosition(id, 12, 2);
    expect(stand.ladePraxisVideoPosition(id)).toEqual(alt);
    expect(stand.ladePraxisVideoPosition(id, 2)).toEqual(neu);
    expect(storage.appStorage.getItem(stand.praxisVideoPositionenKey)).toBe(alterWert);
    expect(stand.istPraxisVideoPosition({ ...neu, position: 70 })).toBe(false);
    expect(stand.istPraxisVideoPosition(alt)).toBe(true);
    expect(stand.istPraxisVideoPositionen({ [id]: neu })).toBe(false);
    expect(stand.istPraxisVideoPositionen({ [id]: alt }, 2)).toBe(false);
    expect(() => stand.speicherePraxisVideoPosition("werkstatt-biber-doppel-schnitt", 4, 2)).toThrow();
  });

  it("stellt beide Positionen und die angefangene Mitmachaufgabe aus ZIP und älterem JSON wieder her", async () => {
    const storage = await import("@/lib/lernSpeicher"), stand = await import("@/lib/praxisVideoStand"), lern = await import("@/lib/praxisVideoLernStand"), inhalte = await import("@/lib/praxisVideoInhalte"), backup = await import("@/lib/backup");
    await storage.initializeStorage();
    const id = "werkstatt-falzziegel-bearbeiten", clip = inhalte.getPraxisVideo(id)!;
    const alt = stand.speicherePraxisVideoPosition(id, 70), neu = stand.speicherePraxisVideoPosition(id, 12, 2);
    const mitmachen = lern.neuerPraxisVideoLernStand("werkstatt-versuch-123", clip);
    mitmachen.modus = "mitmachen"; mitmachen.aktivLernpunktId = clip.lernpunkte![0].id;
    const gespeichert = lern.speicherePraxisVideoLernStand(mitmachen);
    const archive = backup.pruefeArchiv(await backup.exportiereArchiv())!;
    expect(archive).not.toBeNull(); expect(archive.dateien.size).toBe(0);
    storage.appStorage.clear(); await backup.importiereArchiv(archive);
    expect(stand.ladePraxisVideoPosition(id, 1)).toEqual(alt); expect(stand.ladePraxisVideoPosition(id, 2)).toEqual(neu);
    expect(lern.ladePraxisVideoLernStand("werkstatt-versuch-123", clip)).toEqual(gespeichert);
    const legacy = backup.pruefeArchiv(new TextEncoder().encode(JSON.stringify({ app: "dachdecker-lernstand", version: 1, daten: { [stand.praxisVideoPositionenKey]: JSON.stringify({ [id]: alt }) } })))!;
    expect(legacy.version).toBe(1); await backup.importiereArchiv(legacy);
    expect(stand.ladePraxisVideoPosition(id, 1)).toEqual(alt); expect(stand.ladePraxisVideoPosition(id, 2)).toEqual(neu);
    const daten = { ...archive.daten, [lern.praxisVideoLernStaendeKey]: JSON.stringify({ falsch: mitmachen }) };
    expect(backup.pruefeSicherung(JSON.stringify({ app: "dachdecker-lernstand", version: 1, daten }))).toBeNull();
    expect(backup.pruefeSicherung(JSON.stringify({ app: "dachdecker-lernstand", version: 1, daten: { [stand.praxisVideoPositionenV2Key]: JSON.stringify({ [id]: alt }) } }))).toBeNull();
  });
});
