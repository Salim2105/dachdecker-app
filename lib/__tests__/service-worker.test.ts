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
    async request(path: string, navigate = false) {
      const request = new Request(ORIGIN + path);
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
