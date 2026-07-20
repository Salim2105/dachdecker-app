/**
 * Erzeugt public/sw.js mit der Liste aller Seiten UND aller Build-Dateien
 * (CSS, JavaScript, Schriften). Läuft nach jedem Build ("postbuild"), weil
 * die Dateinamen erst dann feststehen.
 *
 * Ohne die Build-Dateien lädt die App offline zwar, aber ohne Styling und
 * ohne Interaktion — genau das war vorher der Fehler.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const { lernfelder } = JSON.parse(readFileSync("content/lernfelder.json", "utf8"));

const seiten = [
  "/",
  "/lernen",
  "/pruefung",
  "/rechner",
  "/fortschritt",
  "/manifest.webmanifest",
  ...lernfelder.flatMap((lf) => [`/lernen/${lf.id}`, `/lernen/${lf.id}/ueben`]),
];

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
