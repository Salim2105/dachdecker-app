// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { createServiceWorker } from "../../scripts/gen-sw.mjs";

const ORIGIN = "https://dachdecker.example";
const PREFIX = "dachdecker-lernwerkstatt-root-";
type WorkerEvent = { data?: unknown; request?: Request; waitUntil: (p: Promise<unknown>) => void; respondWith?: (p: Promise<Response>) => void };
function harness(shell: string[] = ["/", "/_next/app.js"], failed: string[] = []) {
  const handlers: Record<string, (event: WorkerEvent) => void> = {};
  const stores = new Map<string, Map<string, Response>>();
  const messages: unknown[] = [];
  const key = (request: string | Request) => new URL(typeof request === "string" ? request : request.url, ORIGIN).href;
  const cacheName = PREFIX + "300-current";
  const caches = {
    keys: vi.fn(async () => [...stores.keys()]),
    delete: vi.fn(async (name: string) => stores.delete(name)),
    open: vi.fn(async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        keys: async () => [...store.keys()].map(url => new Request(url)),
        match: async (request: string | Request) => store.get(key(request))?.clone(),
        put: async (request: string | Request, response: Response) => { store.set(key(request), response.clone()); },
        add: async (request: string) => {
          if (failed.includes(request)) throw new Error("Netzwerk unterbrochen");
          store.set(key(request), new Response("neu:" + request));
        },
      };
    }),
  };
  const fetch = vi.fn(async () => new Response("Netzwerk"));
  const clients = { claim: vi.fn(async () => {}), matchAll: vi.fn(async () => [{ postMessage: (message: unknown): void => { messages.push(message); } }]) };
  const skipWaiting = vi.fn(async () => {});
  runInNewContext(createServiceWorker({ cacheName, shell }), { self: { location: { origin: ORIGIN }, clients, skipWaiting, addEventListener: (name: string, handler: (event: WorkerEvent) => void) => { handlers[name] = handler; } }, caches, fetch, URL, Response });
  return {
    caches, cacheName, stores, fetch, clients, skipWaiting, messages,
    async put(name: string, path: string, content: string) { await (await caches.open(name)).put(path, new Response(content)); },
    async dispatch(name: string, data?: unknown) {
      const pending: Promise<unknown>[] = [];
      handlers[name]({ data, waitUntil: (p) => { pending.push(p); } });
      await Promise.all(pending);
    },
    async request(path: string, navigate = false, cache?: RequestCache, init: RequestInit = {}) {
      const request = new Request(ORIGIN + path, { cache, ...init });
      if (navigate) Object.defineProperty(request, "mode", { value: "navigate" });
      const pending: Promise<unknown>[] = [];
      let response: Promise<Response> | undefined;
      handlers.fetch({ request, waitUntil: (p) => { pending.push(p); }, respondWith: (p) => { response = p; } });
      const result = await response;
      await Promise.all(pending);
      return result;
    },
  };
}

describe("Service Worker mit ausdrücklich freigegebenen Updates", () => {
  it("lädt Poster und Untertitel, aber keine Filme als notwendigen Grunddownload", async () => {
    const base = "/praxisvideos/v1/dach-steildach-falzziegel-s03";
    const h = harness(["/", base + ".mp4", base + ".webm", base + ".vtt", base + ".webp"]);
    await h.dispatch("install");
    const keys = [...h.stores.get(h.cacheName)!.keys()];
    expect(keys).toEqual([ORIGIN + "/", ORIGIN + base + ".vtt", ORIGIN + base + ".webp"]);
    expect(await (await h.request(base + ".vtt"))!.text()).toBe("neu:" + base + ".vtt");
  });
  it("spult vollständige Videopakete offline mit geschlossenen, offenen und Suffix-Ranges", async () => {
    const h = harness(), id = "dach-steildach-falzziegel-s03", url = `/praxisvideos/v1/${id}.mp4`, sha256 = "b".repeat(64);
    const data = "0123456789";
    await (await h.caches.open("dachdecker-praxisvideos-v1")).put(`/praxisvideos/_inhalt/${sha256}`, new Response(data, { headers: { "Content-Type": "video/mp4", "Content-Length": "10" } }));
    await h.put("dachdecker-praxisvideos-index-v1", `/praxisvideos/_pakete/clip-${id}.json`, JSON.stringify({ version: 1, id: `clip-${id}`, am: 1, assets: [{ id: id + ".mp4", url, sha256, bytes: 10, typ: "video" }] }));
    for (const [range, body, contentRange] of [["bytes=0-1", "01", "bytes 0-1/10"], ["bytes=4-", "456789", "bytes 4-9/10"], ["bytes=-3", "789", "bytes 7-9/10"], ["bytes=8-99", "89", "bytes 8-9/10"]]) {
      const response = (await h.request(url, false, undefined, { headers: { Range: range } }))!;
      expect(response.status).toBe(206); expect(response.headers.get("Content-Type")).toBe("video/mp4");
      expect(response.headers.get("Content-Range")).toBe(contentRange);
      expect(response.headers.get("Content-Length")).toBe(String(body.length));
      expect(await response.text()).toBe(body);
    }
    const head = (await h.request(url, false, undefined, { method: "HEAD", headers: { Range: "bytes=0-1" } }))!;
    expect(head.status).toBe(200); expect(head.headers.get("Content-Length")).toBe("10"); expect(await head.text()).toBe("");
    for (const range of ["bytes=10-", "bytes=5-2", "bytes=-0", "bytes=a-b"]) {
      const response = (await h.request(url, false, undefined, { headers: { Range: range } }))!;
      expect(response.status).toBe(416); expect(response.headers.get("Content-Range")).toBe("bytes */10"); expect(await response.text()).toBe("");
    }
    expect(await (await h.request(url))!.text()).toBe(data);
    expect(h.fetch).not.toHaveBeenCalled();
    await h.dispatch("activate");
    expect(h.stores.has("dachdecker-praxisvideos-v1")).toBe(true);
    expect(h.stores.has("dachdecker-praxisvideos-index-v1")).toBe(true);
  });
  it("speichert gestreamte Teilantworten nie ungefragt und umgeht alte Videos beim neuen Download", async () => {
    const h = harness(), url = "/praxisvideos/v1/dach-steildach-falzziegel-s03.mp4";
    h.fetch.mockResolvedValue(new Response("01", { status: 206, headers: { "Content-Range": "bytes 0-1/10" } }));
    const response = (await h.request(url, false, undefined, { headers: { Range: "bytes=0-1" } }))!;
    expect(response.status).toBe(206); expect(await response.text()).toBe("01");
    expect([...h.stores.values()].some(store => store.has(ORIGIN + url))).toBe(false);
    h.fetch.mockResolvedValue(new Response("new full bytes"));
    expect(await (await h.request(url, false, "no-store"))!.text()).toBe("new full bytes");
    h.fetch.mockRejectedValue(new Error("offline"));
    expect((await h.request(url))!.type).toBe("error");
  });
  it("lädt kleine Dachansichten im Kern, aber keine großen Modelle oder Detailbilder automatisch", async () => {
    const h = harness(["/", "/dach-vorschau/v1/steildach-falzziegel/s03-nah.webp", "/dach-medien/v1/steildach-falzziegel/uebersicht.glb", "/dach-medien/v1/steildach-falzziegel/s03/nah.webp"]);
    await h.dispatch("install");
    const kern = h.stores.get(h.cacheName)!;
    expect(kern.has(ORIGIN + "/dach-vorschau/v1/steildach-falzziegel/s03-nah.webp")).toBe(true);
    expect([...kern.keys()].some(url => url.includes("/dach-medien/"))).toBe(false);
    expect(h.messages).toContainEqual({ quelle: "dachdecker-sw", typ: "alles-fertig", fehlend: 0, gesamt: 2 });
  });
  it("liefert nur bestätigte öffentliche Medien offline und umgeht alte Bytes bei einem neuen Paketdownload", async () => {
    const h = harness(), sha256 = "a".repeat(64), url = "/dach-medien/v1/steildach-falzziegel/uebersicht.glb";
    await h.put("dachdecker-medien-v1", `/dach-medien/_inhalt/${sha256}`, "voriges Modell");
    expect(await (await h.request(url))!.text()).toBe("Netzwerk");
    await h.put("dachdecker-medien-index-v1", "/dach-medien/paket-steildach.json", JSON.stringify({ version: 1, id: "steildach", am: 1000, assets: [{ url, sha256 }] }));
    h.fetch.mockClear();
    expect(await (await h.request(url))!.text()).toBe("voriges Modell"); expect(h.fetch).not.toHaveBeenCalled();
    expect(await (await h.request(url, false, "no-store"))!.text()).toBe("Netzwerk"); expect(h.fetch).toHaveBeenCalledOnce();
    await h.dispatch("activate");
    expect(h.stores.has("dachdecker-medien-v1")).toBe(true);
    expect(h.stores.has("dachdecker-medien-index-v1")).toBe(true);
  });
  it("wartet nach vollständigem Vorladen und aktiviert erst nach der passenden Nachricht", async () => {
    const h = harness(["/", "/_next/app.js", "/buch/skizze.webp"]);
    await h.dispatch("install");
    expect(h.skipWaiting).not.toHaveBeenCalled();
    expect(h.messages).toContainEqual({ quelle: "dachdecker-sw", typ: "alles-fertig", fehlend: 0, gesamt: 3 });
    await h.dispatch("message", { typ: "UPDATE_AKTIVIEREN" });
    expect(h.skipWaiting).not.toHaveBeenCalled();
    await h.dispatch("message", { quelle: "dachdecker-app", typ: "UPDATE_AKTIVIEREN" });
    expect(h.skipWaiting).toHaveBeenCalledOnce();
  });
  it("ersetzt bei fehlenden Kerndateien keine funktionierende alte Version", async () => {
    const h = harness(["/", "/_next/app.js"], ["/_next/app.js"]);
    await h.put(PREFIX + "200-alt", "/", "bisherige App");
    await expect(h.dispatch("install")).rejects.toThrow("Kern-Dateien");
    expect(h.skipWaiting).not.toHaveBeenCalled();
    expect(h.caches.delete).not.toHaveBeenCalled();
    expect(h.messages).toContainEqual({ quelle: "dachdecker-sw", typ: "kern-fertig", fehlend: 1, gesamt: 2 });
  });
  it("behält aktuelles und vorheriges eigenes Bundle und löscht keine fremden Caches", async () => {
    const h = harness();
    for (const name of ["dachdecker-100", PREFIX + "200-alt", h.cacheName, "andere-app-12", "dachdecker-fremdes-projekt"]) await h.put(name, "/", name);
    await h.dispatch("activate");
    expect(h.caches.delete).toHaveBeenCalledExactlyOnceWith("dachdecker-100");
    expect([...h.stores.keys()]).toContain(PREFIX + "200-alt");
    expect([...h.stores.keys()]).toContain("andere-app-12");
    expect([...h.stores.keys()]).toContain("dachdecker-fremdes-projekt");
    expect(h.clients.claim).toHaveBeenCalledOnce();
  });
  it("liefert aktuelles HTML trotz zuerst angelegtem alten Cache und findet alte gehashte Dateien", async () => {
    const h = harness();
    await h.put(PREFIX + "200-alt", "/lernen/lf07", "altes HTML");
    await h.put(PREFIX + "200-alt", "/_next/altes-bundle.js", "alter Code");
    await h.put(h.cacheName, "/lernen/lf07", "aktuelles HTML");
    expect(await (await h.request("/lernen/lf07/?k=alt", true))!.text()).toBe("aktuelles HTML");
    expect(await (await h.request("/_next/altes-bundle.js"))!.text()).toBe("alter Code");
    expect(h.fetch).not.toHaveBeenCalled();
  });
  it("behält bei mehreren offenen Tabs auch deren noch ältere Bundles", async () => {
    const h = harness();
    h.clients.matchAll.mockResolvedValue([{ postMessage: () => {} }, { postMessage: () => {} }]);
    for (const name of [PREFIX + "100-alter-offener-tab", PREFIX + "200-vorherig", h.cacheName]) await h.put(name, "/", name);
    await h.put(PREFIX + "100-alter-offener-tab", "/_next/alter-tab.js", "noch verwendeter Code");
    await h.dispatch("activate");
    expect(h.caches.delete).not.toHaveBeenCalled();
    expect(await (await h.request("/_next/alter-tab.js"))!.text()).toBe("noch verwendeter Code");
  });
  it("behält beim Navigieren mit wechselnder RSC-Abfrage den passenden statischen Seiteninhalt",async()=>{
    const h=harness();
    await h.put(h.cacheName,"/projekte.txt","passende Seitendaten");
    expect(await(await h.request("/projekte.txt?_rsc=neue-abfrage"))!.text()).toBe("passende Seitendaten");
    expect(h.fetch).not.toHaveBeenCalled();
  });
  it("meldet fehlende Bilder und behauptet keine vollständige Offline-Verfügbarkeit", async () => {
    const h = harness(["/", "/buch/fehlend.webp"], ["/buch/fehlend.webp"]);
    await h.dispatch("install");
    expect(h.messages).toContainEqual({ quelle: "dachdecker-sw", typ: "alles-fertig", fehlend: 1, gesamt: 2 });
  });
  it("umgeht Service-Worker-Updates und Anfragen fremder Herkunft", async () => {
    const h = harness();
    expect(await h.request("/sw.js")).toBeUndefined();
    expect(h.fetch).not.toHaveBeenCalled();
  });
});

it("erzeugt für Server und Export dasselbe Updateprotokoll, eindeutige Caches und saubere Offline-Routen", async () => {
  const root = await mkdtemp(join(tmpdir(), "dachdecker-sw-"));
  try {
    await Promise.all([mkdir(join(root,"public")),mkdir(join(root,"content")),mkdir(join(root,"out","lernen"),{recursive:true})]);
    await Promise.all([
      writeFile(join(root,"content","lernfelder.json"),JSON.stringify({lernfelder:[{id:"lf07"}]})),
      writeFile(join(root,"public","_worker.js"),"privat"),
      writeFile(join(root,"out","_worker.js"),"privat"),
      writeFile(join(root,"out","index.html"),"Start"),
      writeFile(join(root,"out","lernen","lf07.html"),"Kurs"),
    ]);
    const script=resolve("scripts/gen-sw.mjs");
    execFileSync(process.execPath,[script],{cwd:root,env:{...process.env,EXPORT:""}});
    execFileSync(process.execPath,[script],{cwd:root,env:{...process.env,EXPORT:"1"}});
    const server=await readFile(join(root,"public","sw.js"),"utf8");
    const exported=await readFile(join(root,"out","sw.js"),"utf8");
    for(const text of [server,exported]) {
      expect(text).toContain("UPDATE_AKTIVIEREN");
      expect(text).not.toContain('"/_worker.js"');
    }
    for(const route of ["/projekte","/bildtraining","/rueckmeldung"])expect(server).toContain(JSON.stringify(route));
    expect(exported).toContain('"/lernen/lf07"');
    expect(exported).not.toContain('"/lernen/lf07.html"');
    expect(server.match(/const CACHE = (.+);/)![1]).not.toBe(exported.match(/const CACHE = (.+);/)![1]);
  } finally { await rm(root,{recursive:true,force:true}); }
});
