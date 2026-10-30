// @vitest-environment node
import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DACH_MEDIEN_CACHE, DACH_MEDIEN_INDEX_CACHE, dachAssetCacheKey, dachPaketStatus, ladeDachPaket, loescheDachPaket } from "@/lib/dach3dDownloads";
import type { DachPaket } from "@/lib/dach3dMedien";
import type { MedienAsset } from "@/lib/dach3dTypen";

const origin = "https://dach.example";
const cacheKey = (r: string | Request) => new URL(typeof r === "string" ? r : r.url, origin).href;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function asset(id: string, bytes: string): MedienAsset { return { id, url: `/dach-medien/v1/${id}`, bytes: Buffer.byteLength(bytes), sha256: hash(bytes), typ: id.endsWith("glb") ? "modell" : "bild" }; }
function paket(assets: MedienAsset[], id: DachPaket["id"] = "steildach"): DachPaket { return { id, titel: id, assets, bytes: assets.reduce((s, a) => s + a.bytes, 0) }; }
const oldAsset = asset("steildach-falzziegel/uebersicht.glb", "altes Modell"), newAsset = asset(oldAsset.id, "neues Modell");
let stores: Map<string, Map<string, Response>>, failPut: ((cache: string, key: string) => boolean) | undefined;
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  stores = new Map(); failPut = undefined;
  vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("navigator", undefined);
  vi.stubGlobal("caches", {
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name)!;
      return {
        keys: async () => [...data.keys()].map(url => new Request(url)),
        match: async (key: string | Request) => data.get(cacheKey(key))?.clone(),
        put: async (key: string | Request, response: Response) => {
          if (failPut?.(name, cacheKey(key))) throw new DOMException("voll", "QuotaExceededError");
          data.set(cacheKey(key), response.clone());
        },
        delete: async (key: string | Request) => data.delete(cacheKey(key)),
      };
    },
  });
  fetcher = vi.fn(async () => new Response("altes Modell", { headers: { "Content-Type": "model/gltf-binary" } }));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const contentCache = () => stores.get(DACH_MEDIEN_CACHE)!;
const noStages = () => expect([...stores.keys()].some(k => k.includes("staging"))).toBe(false);

describe("Öffentliche Dachpakete mit atomarem Abschluss", () => {
  it("prüft heruntergeladene Bytes und bestätigt erst ein vollständig gespeichertes Paket", async () => {
    const progress: number[] = [];
    await ladeDachPaket(paket([oldAsset]), { onProgress: p => progress.push(p.geladen) });
    expect(fetcher).toHaveBeenCalledWith(oldAsset.url, expect.objectContaining({ cache: "no-store", redirect: "error" }));
    expect(await dachPaketStatus(paket([oldAsset]))).toMatchObject({ status: "gespeichert", bytes: oldAsset.bytes });
    expect(await dachPaketStatus(paket([newAsset]))).toMatchObject({ status: "aelter" });
    expect(progress.at(-1)).toBe(oldAsset.bytes); noStages();
  });
  it.each(["pruefsumme", "groesse", "netzwerk", "quota-stage", "quota-inhalt", "quota-index", "abbruch"])("erhält beim Fehler %s das ganze vorige Paket", async fehler => {
    await ladeDachPaket(paket([oldAsset]));
    const vorher = await (await (await caches.open(DACH_MEDIEN_INDEX_CACHE)).match("/dach-medien/paket-steildach.json"))!.text();
    const controller = new AbortController();
    if (fehler === "quota-stage") failPut = name => name.includes("staging");
    if (fehler === "quota-inhalt") failPut = name => name === DACH_MEDIEN_CACHE;
    if (fehler === "quota-index") failPut = name => name === DACH_MEDIEN_INDEX_CACHE;
    fetcher.mockImplementation(async () => {
      if (fehler === "netzwerk") throw new Error("unterbrochen");
      if (fehler === "abbruch") controller.abort();
      return new Response(fehler === "pruefsumme" ? "kaput Modell" : fehler === "groesse" ? "zu kurz" : "neues Modell");
    });
    await expect(ladeDachPaket(paket([newAsset]), { signal: controller.signal })).rejects.toThrow();
    expect(await dachPaketStatus(paket([oldAsset]))).toMatchObject({ status: "gespeichert" });
    expect(await (await (await caches.open(DACH_MEDIEN_INDEX_CACHE)).match("/dach-medien/paket-steildach.json"))!.text()).toBe(vorher);
    expect(await contentCache().get(cacheKey(dachAssetCacheKey(oldAsset.sha256)))!.clone().text()).toBe("altes Modell"); noStages();
  });
  it("tauscht einen aktualisierten Marker erst nach dem Download und behält die früheren Bytes", async () => {
    await ladeDachPaket(paket([oldAsset])); fetcher.mockResolvedValue(new Response("neues Modell"));
    await ladeDachPaket(paket([newAsset]));
    expect(await dachPaketStatus(paket([newAsset]))).toMatchObject({ status: "gespeichert" });
    expect(contentCache().has(cacheKey(dachAssetCacheKey(oldAsset.sha256)))).toBe(true);
    expect(contentCache().has(cacheKey(dachAssetCacheKey(newAsset.sha256)))).toBe(true);
  });
  it("lädt gemeinsame Inhaltsbytes auch innerhalb eines Pakets nur einmal", async () => {
    const doppel = asset("steildach-falzziegel/g01/modell.glb", "altes Modell");
    await ladeDachPaket(paket([oldAsset, doppel])); expect(fetcher).toHaveBeenCalledOnce();
    await ladeDachPaket(paket([oldAsset, doppel])); expect(fetcher).toHaveBeenCalledOnce();
  });
  it("löscht ein Paket, erhält aber gemeinsame Dateien eines anderen Dachs und private Daten", async () => {
    const gemeinsam = asset("gemeinsam/oberflaeche.webp", "altes Modell");
    const steil = paket([oldAsset, gemeinsam]), walm = paket([gemeinsam], "walmdach");
    await ladeDachPaket(steil); await ladeDachPaket(walm);
    const privat = await caches.open("andere-private-app"); await privat.put("/privat", new Response("unverändert"));
    await loescheDachPaket(steil);
    expect(await dachPaketStatus(steil)).toEqual({ status: "fehlt", bytes: 0 });
    expect(await dachPaketStatus(walm)).toMatchObject({ status: "gespeichert" });
    expect(await (await privat.match("/privat"))!.text()).toBe("unverändert");
  });
  it("weist fremde URLs, Dateien anderer Dachpakete und widersprüchliche Größen zurück", async () => {
    const falsch = [
      paket([{ ...oldAsset, url: "https://fremd.example/modell.glb" }]),
      paket([asset("walmdach-falzziegel/uebersicht.glb", "altes Modell")]),
      { ...paket([oldAsset]), bytes: 0 },
    ];
    for (const p of falsch) await expect(ladeDachPaket(p)).rejects.toThrow(/vollständig/);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("verweigert gleichzeitige Downloads ohne ein zweites Paket anzufangen", async () => {
    let finish!: () => void;
    const warten = new Promise<void>(resolve => { finish = resolve; });
    fetcher.mockImplementation(async () => { await warten; return new Response("altes Modell"); });
    const erster = ladeDachPaket(paket([oldAsset]));
    await expect(ladeDachPaket(paket([newAsset]))).rejects.toThrow(/bereits/);
    await expect(loescheDachPaket(paket([oldAsset]))).rejects.toThrow(/laufende/);
    finish(); await erster;
  });
  it("respektiert die fensterübergreifende Bearbeitungssperre und gibt den lokalen Zustand danach frei", async () => {
    const request = vi.fn(async (_name: string, _options: unknown, callback: (lock: unknown) => unknown) => callback(null));
    vi.stubGlobal("navigator", { locks: { request } });
    await expect(ladeDachPaket(paket([oldAsset]))).rejects.toThrow(/anderen Fenster/);
    await expect(loescheDachPaket(paket([oldAsset]))).rejects.toThrow(/anderen Fenster/);
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubGlobal("navigator", undefined);
    await ladeDachPaket(paket([oldAsset]));
    expect(await dachPaketStatus(paket([oldAsset]))).toMatchObject({ status: "gespeichert" });
  });
  it("räumt nach einem Tab-Absturz eigene verwaiste Stages erst unter der gemeinsamen Sperre auf", async () => {
    const orphan = "dachdecker-medien-staging-v1-steildach-abgestuerzter-tab";
    const fresh = `dachdecker-medien-staging-v1-${Date.now()}-walmdach-1234abcd`;
    await (await caches.open(orphan)).put("/teil", new Response("unvollständig"));
    await (await caches.open(fresh)).put("/teil", new Response("abgestürzt"));
    const fremd = await caches.open("andere-app-zwischenspeicher");
    await fremd.put("/privat", new Response("behalten"));
    vi.stubGlobal("navigator", { locks: { request: async (_n: string, _o: unknown, cb: (lock: unknown) => unknown) => cb(null) } });
    await expect(ladeDachPaket(paket([oldAsset]))).rejects.toThrow(/anderen Fenster/);
    expect(stores.has(orphan)).toBe(true); expect(stores.has(fresh)).toBe(true);
    vi.stubGlobal("navigator", { locks: { request: async (_n: string, _o: unknown, cb: (lock: unknown) => unknown) => cb({ name: "dachdecker-medien-download" }) } });
    fetcher.mockImplementationOnce(async () => {
      expect(stores.has(orphan)).toBe(false); expect(stores.has(fresh)).toBe(false);
      return new Response("altes Modell");
    });
    await ladeDachPaket(paket([oldAsset]));
    noStages();
    expect(await (await fremd.match("/privat"))!.text()).toBe("behalten");
    expect(await dachPaketStatus(paket([oldAsset]))).toMatchObject({ status: "gespeichert" });
  });
  it("behält ohne Web Locks frische oder nicht datierbare Stages und entfernt nur abgelaufene", async () => {
    const jetzt = Date.UTC(2026, 9, 30, 12);
    vi.spyOn(Date, "now").mockReturnValue(jetzt);
    const prefix = "dachdecker-medien-staging-v1-";
    const alt = `${prefix}${jetzt - 2 * 86400000}-steildach-aabb`;
    const frisch = `${prefix}${jetzt - 60000}-walmdach-ccdd`;
    const zukunft = `${prefix}${jetzt + 86400000}-flachdach-eeff`;
    const unbekannt = `${prefix}steildach-alte-namensform`;
    for (const name of [alt, frisch, zukunft, unbekannt]) await (await caches.open(name)).put("/teil", new Response("Teilmodell"));
    await ladeDachPaket(paket([oldAsset]));
    expect(stores.has(alt)).toBe(false);
    for (const name of [frisch, zukunft, unbekannt]) expect(stores.has(name)).toBe(true);
  });
  it("entfernt beim Löschen auch verwaiste Stages, erhält aber gemeinsame vollständige Pakete", async () => {
    const gemeinsam = asset("gemeinsam/oberflaeche.webp", "altes Modell");
    const steil = paket([oldAsset, gemeinsam]), walm = paket([gemeinsam], "walmdach");
    await ladeDachPaket(steil); await ladeDachPaket(walm);
    const orphan = "dachdecker-medien-staging-v1-unterbrochener-download";
    await (await caches.open(orphan)).put("/teil", new Response("Teil"));
    vi.stubGlobal("navigator", { locks: { request: async (_n: string, _o: unknown, cb: (lock: unknown) => unknown) => cb({}) } });
    await loescheDachPaket(steil);
    expect(stores.has(orphan)).toBe(false);
    expect(await dachPaketStatus(walm)).toMatchObject({ status: "gespeichert" });
    expect(contentCache().has(cacheKey(dachAssetCacheKey(gemeinsam.sha256)))).toBe(true);
  });
  it("rollt nach fehlgeschlagenem Marker nur neu kopierte unreferenzierte Bytes zurück", async () => {
    await ladeDachPaket(paket([oldAsset]));
    const gemeinsam = asset("gemeinsam/oberflaeche.webp", "altes Modell");
    await ladeDachPaket(paket([gemeinsam], "walmdach"));
    vi.stubGlobal("navigator", { locks: { request: async (_n: string, _o: unknown, cb: (lock: unknown) => unknown) => cb({}) } });
    failPut = name => name === DACH_MEDIEN_INDEX_CACHE;
    fetcher.mockResolvedValue(new Response("neues Modell"));
    await expect(ladeDachPaket(paket([newAsset]))).rejects.toThrow(/Gerätespeicher/);
    expect(contentCache().has(cacheKey(dachAssetCacheKey(newAsset.sha256)))).toBe(false);
    expect(contentCache().has(cacheKey(dachAssetCacheKey(oldAsset.sha256)))).toBe(true);
    expect(await dachPaketStatus(paket([oldAsset]))).toMatchObject({ status: "gespeichert" });
    expect(await dachPaketStatus(paket([gemeinsam], "walmdach"))).toMatchObject({ status: "gespeichert" });
    noStages();
  });
});
