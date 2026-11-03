// @vitest-environment node
import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ladePraxisVideoPaket, loeschePraxisVideoPaket, PRAXIS_VIDEO_CACHE, PRAXIS_VIDEO_INDEX_CACHE, praxisVideoAssetCacheKey, praxisVideoPaketStatus } from "@/lib/praxisVideoDownloads";
import { PRAXIS_VIDEO_KONTEXTE } from "@/lib/praxisVideoInhalte";
import type { PraxisVideoAsset, PraxisVideoPaket } from "@/lib/praxisVideoTypen";

const origin = "https://dach.example";
const key = (r: string | Request) => new URL(typeof r === "string" ? r : r.url, origin).href;
const body = (a: PraxisVideoAsset, neu = false) => `${neu ? "neue" : "alte"}-${a.typ}`;
function assets(id: string, neu = false): PraxisVideoAsset[] {
  return ([['mp4', 'video'], ['vtt', 'untertitel'], ['webp', 'bild']] as const).map(([ext, typ]) => {
    const bytes = `${neu ? "neue" : "alte"}-${typ}`;
    return { id: `${id}.${ext}`, url: `/praxisvideos/v1/${id}.${ext}`, bytes: Buffer.byteLength(bytes), sha256: createHash("sha256").update(bytes).digest("hex"), typ };
  });
}
const clipId = "werkstatt-falzziegel-schnitt";
const paket = (aa = assets(clipId), id = `clip-${clipId}`): PraxisVideoPaket => ({ id, titel: "Handgriff", assets: aa, bytes: aa.reduce((s, a) => s + a.bytes, 0) });
let stores: Map<string, Map<string, Response>>, failPut: ((name: string) => boolean) | undefined;
let fetcher: ReturnType<typeof vi.fn>;
const webLocks = () => ({ locks: { request: async (_name: string, _options: unknown, cb: (lock: object) => unknown) => cb({}) } });
beforeEach(() => {
  stores = new Map(); failPut = undefined;
  vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("navigator", webLocks());
  vi.stubGlobal("caches", {
    keys: async () => [...stores.keys()], delete: async (name: string) => stores.delete(name),
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name)!;
      return { keys: async () => [...data.keys()].map(url => new Request(url)), match: async (r: string | Request) => data.get(key(r))?.clone(),
        put: async (r: string | Request, response: Response) => { if (failPut?.(name)) throw new DOMException("voll", "QuotaExceededError"); data.set(key(r), response.clone()); },
        delete: async (r: string | Request) => data.delete(key(r)),
      };
    },
  });
  fetcher = vi.fn(async (url: string) => new Response(body(assets(clipId).find(a => a.url === url)!)));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const marker = async (p = paket()) => (await (await (await caches.open(PRAXIS_VIDEO_INDEX_CACHE)).match(`/praxisvideos/_pakete/${p.id}.json`))!.text());
const noStages = () => expect([...stores.keys()].some(name => name.includes("staging"))).toBe(false);

describe("Explizite, geprüfte Offline-Videopakete", () => {
  it("meldet erst drei vollständig geprüfte Dateien als gespeichert und liefert Fortschritt", async () => {
    const progress: number[] = [], p = paket();
    expect(fetcher).not.toHaveBeenCalled();
    await ladePraxisVideoPaket(p, { onProgress: f => progress.push(f.geladen) });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher).toHaveBeenCalledWith(p.assets[0].url, expect.objectContaining({ cache: "no-store", redirect: "error" }));
    expect(await praxisVideoPaketStatus(p)).toMatchObject({ status: "gespeichert", bytes: p.bytes });
    expect(progress.at(-1)).toBe(p.bytes);
    const cache = await caches.open(PRAXIS_VIDEO_CACHE);
    expect((await cache.match(praxisVideoAssetCacheKey(p.assets[1].sha256)))!.headers.get("Content-Type")).toBe("text/vtt; charset=utf-8");
    noStages();
  });
  it.each(["pruefsumme", "groesse", "netzwerk", "stage", "inhalt", "index", "abbruch"])("erhält nach %s das vorherige vollständige Paket", async fehler => {
    const p = paket(); await ladePraxisVideoPaket(p); const vorher = await marker();
    const neu = paket(assets(clipId, true)), controller = new AbortController();
    failPut = name => fehler === "stage" ? name.includes("staging") : fehler === "inhalt" ? name === PRAXIS_VIDEO_CACHE : fehler === "index" && name === PRAXIS_VIDEO_INDEX_CACHE;
    fetcher.mockImplementation(async (url: string) => {
      if (fehler === "netzwerk") throw new Error("Netz getrennt");
      if (fehler === "abbruch") controller.abort();
      const a = neu.assets.find(a => a.url === url)!;
      return new Response(fehler === "pruefsumme" ? `xxxx-${a.typ}` : fehler === "groesse" ? "x" : body(a, true));
    });
    await expect(ladePraxisVideoPaket(neu, { signal: controller.signal })).rejects.toThrow();
    expect(await marker()).toBe(vorher);
    expect(await praxisVideoPaketStatus(p)).toMatchObject({ status: "gespeichert" });
    expect(stores.get(PRAXIS_VIDEO_CACHE)!.size).toBe(3);
    noStages();
  });
  it("behält überlappende Dach-/Clippakete und andere App-Daten beim Löschen", async () => {
    const kontexte = PRAXIS_VIDEO_KONTEXTE.filter(k => k.form === "steildach");
    const dach = paket(kontexte.flatMap(k => assets(k.id)), "dach-steildach"), clip = paket(assets(kontexte[0].id), `clip-${kontexte[0].id}`);
    fetcher.mockImplementation(async (url: string) => new Response(body(dach.assets.find(a => a.url === url)!)));
    await ladePraxisVideoPaket(dach); await ladePraxisVideoPaket(clip);
    expect(fetcher).toHaveBeenCalledTimes(3);
    const privat = await caches.open("private-andere-app"); await privat.put("/privat", new Response("unverändert"));
    const alteDachmodelle = await caches.open("dachdecker-medien-v1"); await alteDachmodelle.put("/dach3d/ansicht.webp", new Response("Dachmodell"));
    expect(await loeschePraxisVideoPaket(dach)).toEqual({ speicherFreigegeben: true });
    expect(await praxisVideoPaketStatus(dach)).toEqual({ status: "fehlt", bytes: 0 });
    expect(await praxisVideoPaketStatus(clip)).toMatchObject({ status: "gespeichert" });
    expect(await (await privat.match("/privat"))!.text()).toBe("unverändert");
    expect(await (await alteDachmodelle.match("/dach3d/ansicht.webp"))!.text()).toBe("Dachmodell");
    await loeschePraxisVideoPaket(clip);
    expect(stores.get(PRAXIS_VIDEO_CACHE)!.size).toBe(0);
  });
  it.each(["206", "Content-Range", "Content-Length", "zu-lang"])("verwirft %s vor dem Paketabschluss und stoppt übergroße Antworten", async fehler => {
    const p = paket(); let gelesen = 0, beendet = 0;
    fetcher.mockImplementation(async () => {
      const headers: HeadersInit = fehler === "Content-Range" ? { "Content-Range": `bytes 0-${p.assets[0].bytes - 1}/${p.assets[0].bytes}` } : fehler === "Content-Length" ? { "Content-Length": "999999999999999999" } : {};
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          gelesen++;
          controller.enqueue(new TextEncoder().encode(fehler === "zu-lang" ? "x".repeat(p.assets[0].bytes + 1) : body(p.assets[0])));
        },
        cancel() { beendet++; },
      }, { highWaterMark: 0 });
      return new Response(stream, { status: fehler === "206" ? 206 : 200, headers });
    });
    await expect(ladePraxisVideoPaket(p)).rejects.toThrow();
    expect(gelesen).toBe(fehler === "zu-lang" ? 1 : 0);
    expect(beendet).toBe(1);
    expect(await praxisVideoPaketStatus(p)).toEqual({ status: "fehlt", bytes: 0 });
    noStages();
  });
  it("bricht auch während eines auf Daten wartenden Streams ab", async () => {
    const p = paket(), controller = new AbortController(); let gelesen!: () => void;
    const gestartet = new Promise<void>(resolve => { gelesen = resolve; });
    const cancel = vi.fn();
    fetcher.mockImplementation(async () => new Response(new ReadableStream({ pull() { gelesen(); }, cancel }, { highWaterMark: 0 })));
    const download = ladePraxisVideoPaket(p, { signal: controller.signal });
    await gestartet; controller.abort();
    await expect(download).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce(); noStages();
  });
  it("behält bei Abbruch unmittelbar vor dem Paketabschluss die bisherige Fassung", async () => {
    const p = paket(); await ladePraxisVideoPaket(p); const vorher = await marker();
    const neu = paket(assets(clipId, true)), controller = new AbortController();
    fetcher.mockImplementation(async (url: string) => new Response(body(neu.assets.find(a => a.url === url)!, true)));
    const open = caches.open.bind(caches);
    vi.spyOn(caches, "open").mockImplementation(async name => {
      const cache = await open(name);
      if (name === PRAXIS_VIDEO_INDEX_CACHE) controller.abort();
      return cache;
    });
    await expect(ladePraxisVideoPaket(neu, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(await marker()).toBe(vorher);
    expect(await praxisVideoPaketStatus(p)).toMatchObject({ status: "gespeichert" });
    expect(stores.get(PRAXIS_VIDEO_CACHE)!.size).toBe(3);
    noStages();
  });
  it("vergleicht bei komprimierten Antworten die gelesenen statt der übertragenen Bytes", async () => {
    const p = paket();
    fetcher.mockImplementation(async (url: string) => new Response(body(p.assets.find(a => a.url === url)!), { headers: { "Content-Encoding": "gzip", "Content-Length": "1" } }));
    await ladePraxisVideoPaket(p);
    expect(await praxisVideoPaketStatus(p)).toMatchObject({ status: "gespeichert" });
  });
  it("erhält ohne Web Locks möglicherweise noch in anderen Fenstern verwendete Bytes", async () => {
    const p = paket(); await ladePraxisVideoPaket(p);
    vi.stubGlobal("navigator", undefined);
    expect(await loeschePraxisVideoPaket(p)).toEqual({ speicherFreigegeben: false });
    expect(await praxisVideoPaketStatus(p)).toEqual({ status: "fehlt", bytes: 0 });
    expect(stores.get(PRAXIS_VIDEO_CACHE)!.size).toBe(3);
    vi.stubGlobal("navigator", webLocks());
    await loeschePraxisVideoPaket(p);
    expect(stores.get(PRAXIS_VIDEO_CACHE)!.size).toBe(0);
  });
  it("verweigert fremde Pfade, fehlende Untertitel und gleichzeitige Änderungen", async () => {
    const p = paket();
    await expect(ladePraxisVideoPaket(paket([p.assets[0]]))).rejects.toThrow(/vollständig/);
    await expect(ladePraxisVideoPaket(paket(p.assets.map(a => ({ ...a, url: `https://fremd.example/${a.id}` }))))).rejects.toThrow(/vollständig/);
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubGlobal("navigator", { locks: { request: async (_n: string, _o: unknown, cb: (lock: unknown) => unknown) => cb(null) } });
    await expect(ladePraxisVideoPaket(p)).rejects.toThrow(/anderen Fenster/);
    vi.stubGlobal("navigator", undefined);
    let fertig!: () => void;
    const warten = new Promise<void>(resolve => { fertig = resolve; });
    fetcher.mockImplementation(async (url: string) => { await warten; return new Response(body(p.assets.find(a => a.url === url)!)); });
    const download = ladePraxisVideoPaket(p);
    await expect(ladePraxisVideoPaket(p)).rejects.toThrow(/bereits/);
    await expect(loeschePraxisVideoPaket(p)).rejects.toThrow(/laufende/);
    fertig(); await download;
  });
});
