/**
 * Erzeugt den Service Worker.
 *
 * Zwei Modi:
 *  - Web/Server (Standard): schreibt public/sw.js mit der Liste aller Seiten UND
 *    Build-Dateien aus .next/static. Wird von `next start` ausgeliefert.
 *  - Export (EXPORT=1): schreibt out/sw.js und cacht ALLE Dateien des statischen
 *    Exports. Der Fetch-Handler löst zusätzlich saubere URLs (z. B. /lernen/lf07)
 *    auf die passende .html-Datei auf, damit die App auch offline navigierbar ist
 *    (z. B. auf Cloudflare Pages fürs iPad).
 *
 * Ohne die Build-Dateien lädt die App offline zwar, aber ohne Styling und ohne
 * Interaktion — genau das war früher der Fehler.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

function dateienIn(wurzel) {
  if (!existsSync(wurzel)) return [];
  const raus = [];
  for (const eintrag of readdirSync(wurzel)) {
    const pfad = join(wurzel, eintrag);
    if (statSync(pfad).isDirectory()) raus.push(...dateienIn(pfad));
    else raus.push(pfad);
  }
  return raus;
}

if (process.env.EXPORT === "1") {
  // --- Export-Modus: kompletter statischer Ordner out/ ---
  if (!existsSync("out")) {
    console.error("EXPORT=1, aber out/ fehlt. Erst `EXPORT=1 next build` laufen lassen.");
    process.exit(1);
  }
  const alles = dateienIn("out")
    .map((p) => "/" + relative("out", p).split("\\").join("/"))
    .filter((p) => p !== "/sw.js" && !p.endsWith(".map"));

  const cache = `dachdecker-${Date.now()}`;
  const sw = `// Automatisch erzeugt von scripts/gen-sw.mjs (Export) — nicht von Hand ändern.
const CACHE = ${JSON.stringify(cache)};
const SHELL = ${JSON.stringify(alles, null, 2)};

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(SHELL.map((url) => c.add(url).catch(() => {})))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Saubere URL -> mögliche Dateien im Export.
function kandidaten(pfad) {
  if (pfad.endsWith("/")) return [pfad + "index.html", pfad];
  return [pfad, pfad + ".html", pfad + "/index.html"];
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (e.request.mode === "navigate") {
    e.respondWith(
      (async () => {
        for (const k of kandidaten(url.pathname)) {
          const hit = await caches.match(k);
          if (hit) return hit;
        }
        try {
          return await fetch(e.request);
        } catch {
          return (await caches.match("/index.html")) || Response.error();
        }
      })(),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => Response.error());
    }),
  );
});
`;
  writeFileSync("out/sw.js", sw);
  console.log(`out/sw.js erzeugt: ${alles.length} Dateien gecacht (${cache}).`);
  process.exit(0);
}

// --- Web/Server-Modus ---
const { lernfelder } = JSON.parse(readFileSync("content/lernfelder.json", "utf8"));

const seiten = [
  "/",
  "/lernen",
  "/zeichnen",
  "/pruefung",
  "/rechner",
  "/fortschritt",
  "/manifest.webmanifest",
  ...lernfelder.flatMap((lf) => [`/lernen/${lf.id}`, `/lernen/${lf.id}/ueben`]),
];

// Build-Dateien: .next/static/... wird unter /_next/static/... ausgeliefert.
// Source-Maps sind nur zum Debuggen und werden nicht mitgespeichert.
const assets = dateienIn(".next/static")
  .filter((p) => !p.endsWith(".map"))
  .map((p) => "/_next/static/" + relative(".next/static", p).split("\\").join("/"));

// Eigene Dateien aus public (Icons), ohne den Service Worker selbst.
const statisch = dateienIn("public")
  .map((p) => "/" + relative("public", p).split("\\").join("/"))
  .filter((p) => p !== "/sw.js" && p !== "/manifest.webmanifest");

const alles = [...seiten, ...statisch, ...assets];
const cache = `dachdecker-${Date.now()}`;

const sw = `// Automatisch erzeugt von scripts/gen-sw.mjs — nicht von Hand ändern.
const CACHE = ${JSON.stringify(cache)};
const SHELL = ${JSON.stringify(alles, null, 2)};

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // Einzeln, damit eine fehlende Datei nicht die ganze Installation kippt.
      Promise.all(SHELL.map((url) => c.add(url).catch(() => {}))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => {
          // Nur beim Seitenaufruf auf die Startseite ausweichen. Für CSS oder
          // JavaScript wäre HTML als Ersatz schlimmer als ein sauberer Fehler.
          if (e.request.mode === "navigate") return caches.match("/");
          return Response.error();
        });
    }),
  );
});
`;

writeFileSync("public/sw.js", sw);
console.log(
  `sw.js erzeugt: ${seiten.length} Seiten, ${statisch.length} eigene Dateien, ${assets.length} Build-Dateien (${cache})`,
);
