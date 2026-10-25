/** Generate the same explicit-update protocol for server and static exports. */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CACHE_PREFIX = "dachdecker-lernwerkstatt-root-";
function dateienIn(wurzel) {
  if (!existsSync(wurzel)) return [];
  return readdirSync(wurzel).flatMap((name) => {
    const pfad = join(wurzel, name);
    return statSync(pfad).isDirectory() ? dateienIn(pfad) : [pfad];
  });
}
export function createServiceWorker({ cacheName, shell }) {
  return `// Automatisch erzeugt von scripts/gen-sw.mjs — nicht von Hand ändern.
const CACHE = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = ${JSON.stringify(CACHE_PREFIX)};
const SHELL = ${JSON.stringify(shell, null, 2)};
const GLEICHZEITIG = 6;

// Nur unsere Root-App-Caches einschließlich der bisherigen Namensform.
function eigenerCache(name) {
  return name.startsWith(CACHE_PREFIX) || /^dachdecker-\\d+$/.test(name);
}
function zeit(name) {
  return Number(name.startsWith(CACHE_PREFIX) ? name.slice(CACHE_PREFIX.length).split('-')[0] : name.slice('dachdecker-'.length)) || 0;
}
async function eigeneCaches() {
  return (await caches.keys()).filter(eigenerCache).sort((a, b) => zeit(b) - zeit(a));
}
async function ausCache(request, vorherige = false) {
  const aktuell = await (await caches.open(CACHE)).match(request);
  if (aktuell || !vorherige) return aktuell;
  for (const name of await eigeneCaches()) {
    if (name === CACHE) continue;
    const hit = await (await caches.open(name)).match(request);
    if (hit) return hit;
  }
}
async function melde(nachricht) {
  for (const client of await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })) {
    client.postMessage({ quelle: 'dachdecker-sw', ...nachricht });
  }
}
async function vorladen(cache, urls) {
  let naechster = 0;
  let fehlend = 0;
  await Promise.all(Array.from({ length: GLEICHZEITIG }, async () => {
    while (naechster < urls.length) {
      const url = urls[naechster++];
      try { await cache.add(url); }
      catch { try { await cache.add(url); } catch { fehlend++; } }
    }
  }));
  return fehlend;
}
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const istBild = (url) => url.startsWith('/buch/') || url.startsWith('/fotos/');
    const kern = SHELL.filter((url) => !istBild(url));
    const fehlendKern = await vorladen(cache, kern);
    await melde({ typ: 'kern-fertig', fehlend: fehlendKern, gesamt: kern.length });
    // Eine unvollständige neue Oberfläche ersetzt keine funktionierende alte.
    if (fehlendKern) throw new Error('Kern-Dateien konnten nicht vollständig gespeichert werden.');
    const fehlendBilder = await vorladen(cache, SHELL.filter(istBild));
    await melde({ typ: 'alles-fertig', fehlend: fehlendBilder, gesamt: SHELL.length });
  })());
  // Mit bestehender App wartet dieses Update bis zur bewussten Freigabe.
});
self.addEventListener('message', (event) => {
  if (event.data?.quelle === 'dachdecker-app' && event.data.typ === 'UPDATE_AKTIVIEREN') {
    event.waitUntil(self.skipWaiting());
  }
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const namen = await eigeneCaches();
    // Ein weiterer offener Tab kann noch ein älteres Bundle verwenden. Solange
    // mehrere Fenster offen sind, löschen wir keines dieser eigenen Bundles.
    // Beim nächsten Wechsel mit nur einem Fenster genügen aktuell + vorherig.
    const fenster = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    const behalten = new Set([CACHE, ...namen.filter((name) => name !== CACHE).slice(0, fenster.length > 1 ? undefined : 1)]);
    await Promise.all(namen.filter((name) => !behalten.has(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;
  event.respondWith((async () => {
    if (event.request.mode === 'navigate') {
      const pfad = url.pathname.length > 1 ? url.pathname.replace(/\\/$/, '') : '/';
      // Neue Navigationen verwenden zuerst das aktuelle HTML, keine alte Cache-Version.
      const hit = await ausCache(pfad);
      if (hit) return hit;
      try {
        const antwort = await fetch(event.request);
        return antwort.redirected ? Response.redirect(antwort.url, 302) : antwort;
      } catch { return (await ausCache('/')) || Response.error(); }
    }
    // Static Next navigation payloads have a changing _rsc query. The fixed
    // payload from this bundle must stay paired with its cached JavaScript.
    const schluessel = url.pathname.endsWith('.txt') || url.pathname.startsWith('/_next/') ? url.pathname : event.request;
    const hit = await ausCache(schluessel, true);
    if (hit) return hit;
    try {
      const antwort = await fetch(event.request);
      if (antwort.ok && !antwort.redirected) {
        const kopie = antwort.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, kopie)));
      }
      return antwort;
    } catch { return Response.error(); }
  })());
});
`;
}

export function generateServiceWorker(exportMode = process.env.EXPORT === "1") {
  let alles;
  const ziel = exportMode ? "out/sw.js" : "public/sw.js";
  if (exportMode) {
    if (!existsSync("out/index.html")) throw new Error("out/index.html fehlt. Erst npm run export ausführen.");
    alles = dateienIn("out").map((p) => "/" + relative("out", p).split("\\").join("/"))
      .filter((p) => !["/sw.js", "/_worker.js"].includes(p) && !p.endsWith(".map"))
      .map((p) => {
        if (!p.endsWith(".html")) return p;
        const ohneHtml = p.slice(0, -5).replace(/\/index$/, "");
        return ohneHtml || "/";
      });
  } else {
    const { lernfelder } = JSON.parse(readFileSync("content/lernfelder.json", "utf8"));
    const seiten = ["/", "/lernen", "/ueben", "/zeichnen", "/pruefung", "/rechner", "/heute", "/praxis", "/lernweg", "/grundlagen/mathe", "/sprache/deutsch", "/sprache/englisch", "/lernhilfe", "/erprobung", "/fortschritt", "/projekte", "/bildtraining", "/rueckmeldung", "/manifest.webmanifest",
      ...lernfelder.flatMap((lf) => [`/lernen/${lf.id}`, `/lernen/${lf.id}/ueben`])];
    const assets = dateienIn(".next/static").filter((p) => !p.endsWith(".map")).map((p) => "/_next/static/" + relative(".next/static", p).split("\\").join("/"));
    const statisch = dateienIn("public").map((p) => "/" + relative("public", p).split("\\").join("/")).filter((p) => !["/sw.js", "/_worker.js", "/manifest.webmanifest"].includes(p));
    alles = [...seiten, ...statisch, ...assets];
  }
  const shell = [...new Set(alles)];
  const cacheName = `${CACHE_PREFIX}${Date.now()}-${randomUUID().slice(0, 8)}`;
  writeFileSync(ziel, createServiceWorker({ cacheName, shell }));
  console.log(`${ziel} erzeugt: ${shell.length} Dateien (${cacheName}).`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) generateServiceWorker();
