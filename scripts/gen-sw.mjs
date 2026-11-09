/** Generate the same explicit-update protocol for server and static exports. */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import rangeHelpers from "../electron/http-byte-range.cjs";

const { parseByteRange } = rangeHelpers;
const grossesVideo = (url) => url.startsWith("/praxisvideos/") && /\.(?:mp4|webm|mov|m4v)$/i.test(url);

/** Same public edition budgets for package inspection and offline streaming. */
export function praxisVideoByteBudget(path) {
  const parts = path.split("/");
  if (parts.length !== 4 || parts[1] !== "praxisvideos") return 0;
  const dot = parts[3].lastIndexOf("."), id = parts[3].slice(0, dot), ext = parts[3].slice(dot + 1);
  if (!/^[a-z0-9-]+$/.test(id) || !["mp4", "vtt", "webp"].includes(ext)) return 0;
  const version = parts[2];
  if (version !== "v1" && !(version === "v2" && ["werkstatt-falzziegel-schnitt", "werkstatt-falzziegel-bearbeiten", "werkstatt-falzziegel-verlegen"].includes(id))) return 0;
  return (ext === "mp4" ? version === "v2" ? 25 : 15 : 2) * 1024 * 1024;
}

const CACHE_PREFIX = "dachdecker-lernwerkstatt-root-";
function dateienIn(wurzel) {
  if (!existsSync(wurzel)) return [];
  return readdirSync(wurzel).flatMap((name) => {
    const pfad = join(wurzel, name);
    return statSync(pfad).isDirectory() ? dateienIn(pfad) : [pfad];
  });
}
export function createServiceWorker({ cacheName, shell }) {
  const kernShell = shell.filter((url) => !url.startsWith("/dach-medien/") && !grossesVideo(url));
  return `// Automatisch erzeugt von scripts/gen-sw.mjs — nicht von Hand ändern.
const CACHE = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = ${JSON.stringify(CACHE_PREFIX)};
const SHELL = ${JSON.stringify(kernShell, null, 2)};
const GLEICHZEITIG = 6;
const MEDIEN_CACHE = 'dachdecker-medien-v1';
const MEDIEN_INDEX = 'dachdecker-medien-index-v1';
const VIDEO_CACHE = 'dachdecker-praxisvideos-v1';
const VIDEO_INDEX = 'dachdecker-praxisvideos-index-v1';
${parseByteRange.toString()}
${praxisVideoByteBudget.toString()}

// Only complete, explicitly downloaded videos enter the media cache. The
// browser may request two bytes first, then seek anywhere in that same file.
async function videoAntwort(request, response) {
  const headers = Object.fromEntries(response.headers.entries());
  const size = Number(headers['content-length']);
  if (!Number.isSafeInteger(size) || size < 0 || size > praxisVideoByteBudget(new URL(request.url).pathname) || response.status !== 200) return Response.error();
  headers['accept-ranges'] = 'bytes';
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  const range = parseByteRange(request.headers.get('Range'), size);
  if (range && range.invalid) return new Response(null, { status: 416, headers: { ...headers, 'content-range': 'bytes */' + size, 'content-length': '0' } });
  if (!range) return new Response(response.body, { status: 200, headers });
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== size) return Response.error();
  headers['content-range'] = 'bytes ' + range.start + '-' + range.end + '/' + size;
  headers['content-length'] = String(range.end - range.start + 1);
  return new Response(bytes.slice(range.start, range.end + 1), { status: 206, headers });
}
async function praxisVideoMedium(request, url) {
  // A new explicit download must not reuse bytes from a preceding version.
  if (request.cache !== 'no-store') {
    try {
      const index = await caches.open(VIDEO_INDEX), cache = await caches.open(VIDEO_CACHE);
      const markers = [];
      for (const key of await index.keys()) {
        try {
          const item = await index.match(key), m = item && await item.json();
          if (m && m.version === 1 && typeof m.id === 'string' && /^(?:clip-[a-z0-9-]+|dach-(?:steildach|walmdach|flachdach))$/.test(m.id) && Number.isFinite(m.am) && Array.isArray(m.assets) && m.assets.length <= 1000) markers.push(m);
        } catch { /* A malformed/incomplete index cannot replace a full file. */ }
      }
      markers.sort((a,b) => b.am - a.am);
      for (const m of markers) {
        const asset = m.assets.find(a => a && a.url === url.pathname && /^\\/praxisvideos\\/v[0-9]+\\/[a-z0-9-]+\\.(?:mp4|vtt|webp)$/.test(a.url) && typeof a.sha256 === 'string' && /^[a-f0-9]{64}$/.test(a.sha256) && Number.isSafeInteger(a.bytes) && a.bytes > 0 && a.bytes <= praxisVideoByteBudget(a.url));
        if (!asset) continue;
        const hit = await cache.match('/praxisvideos/_inhalt/' + asset.sha256);
        if (hit && hit.status === 200 && Number(hit.headers.get('Content-Length')) === asset.bytes) return videoAntwort(request, hit);
      }
      // Posters and caption tracks belong to the small offline surface.
      if (!url.pathname.endsWith('.mp4')) {
        const small = await ausCache(url.pathname, true);
        if (small) return request.method === 'HEAD' ? new Response(null, { status: small.status, headers: small.headers }) : small;
      }
    } catch { /* Keep the online request usable when storage is unavailable. */ }
  }
  // Return streamed 200/206 responses directly. Cache.put rejects partial
  // responses, and merely watching must not silently save a large movie.
  try { return await fetch(request); }
  catch { return Response.error(); }
}

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
// Public media packages are committed by one small index write after all
// content-addressed files are complete. They never enter private learning ZIPs.
async function dachMedium(request, url) {
  // Explicit package downloads must fetch the new bytes. Reusing an older
  // package here would fail its new SHA-256 check and make updates impossible.
  if (request.cache === 'no-store') {
    try { return await fetch(request); }
    catch { return Response.error(); }
  }
  try {
    const index = await caches.open(MEDIEN_INDEX);
    const marker = [];
    for (const key of await index.keys()) {
      try {
        const response = await index.match(key);
        const m = response && await response.json();
        if (m && m.version === 1 && ['steildach','walmdach','flachdach'].includes(m.id) && Array.isArray(m.assets) && m.assets.length < 10000 && Number.isFinite(m.am)) marker.push(m);
      } catch { /* An incomplete marker never replaces a usable package. */ }
    }
    marker.sort((a,b) => b.am - a.am);
    const cache = await caches.open(MEDIEN_CACHE);
    for (const m of marker) {
      const asset = m.assets.find(a => a && a.url === url.pathname && typeof a.sha256 === 'string' && /^[a-f0-9]{64}$/.test(a.sha256));
      if (asset) {
        const hit = await cache.match('/dach-medien/_inhalt/' + asset.sha256);
        if (hit) return hit;
      }
    }
  } catch { /* Cache availability does not prevent an online media request. */ }
  // Merely viewing a model does not silently download a whole offline package.
  // Failed optional media do not fall back to unrelated app HTML.
  try { return await fetch(request); }
  catch { return Response.error(); }
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
  if (event.request.method !== 'GET' && event.request.method !== 'HEAD') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;
  if (url.pathname.startsWith('/praxisvideos/')) {
    event.respondWith(praxisVideoMedium(event.request, url));
    return;
  }
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/dach-medien/')) {
    event.respondWith(dachMedium(event.request, url));
    return;
  }
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
    const seiten = ["/", "/lernen", "/ueben", "/zeichnen", "/pruefung", "/rechner", "/heute", "/praxis", "/lernweg", "/grundlagen/mathe", "/sprache/deutsch", "/sprache/englisch", "/lernhilfe", "/erprobung", "/fortschritt", "/projekte", "/bildtraining", "/fachbegriffe", "/rueckmeldung", "/manifest.webmanifest",
      ...lernfelder.flatMap((lf) => [`/lernen/${lf.id}`, `/lernen/${lf.id}/ueben`])];
    const assets = dateienIn(".next/static").filter((p) => !p.endsWith(".map")).map((p) => "/_next/static/" + relative(".next/static", p).split("\\").join("/"));
    const statisch = dateienIn("public").map((p) => "/" + relative("public", p).split("\\").join("/")).filter((p) => !["/sw.js", "/_worker.js", "/manifest.webmanifest"].includes(p));
    alles = [...seiten, ...statisch, ...assets];
  }
  const shell = [...new Set(alles)].filter((url) => !url.startsWith("/dach-medien/") && !grossesVideo(url));
  const cacheName = `${CACHE_PREFIX}${Date.now()}-${randomUUID().slice(0, 8)}`;
  writeFileSync(ziel, createServiceWorker({ cacheName, shell }));
  console.log(`${ziel} erzeugt: ${shell.length} Dateien (${cacheName}).`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) generateServiceWorker();
