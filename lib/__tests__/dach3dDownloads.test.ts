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
afterEach(() => vi.unstubAllGlobals());
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
});
