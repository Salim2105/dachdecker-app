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
  // Pages liefert Seiten unter der sauberen Adresse aus und leitet den
  // Dateinamen dorthin um: /lernen.html -> 308 -> /lernen. Würden wir die
  // Dateinamen vorladen, liefe jede Seite in eine Umleitung — und eine
  // umgeleitete Antwort lässt sich weder sinnvoll cachen noch später für eine
  // Navigation zurückgeben. Also gleich die Adresse nehmen, die auch der
  // Browser anfragt.
  function saubereUrl(p) {
    if (!p.endsWith(".html")) return p;
    let u = p.slice(0, -".html".length);
    if (u.endsWith("/index")) u = u.slice(0, -"/index".length);
    return u === "" ? "/" : u;
  }

  const alles = [
    ...new Set(
      dateienIn("out")
        .map((p) => "/" + relative("out", p).split("\\").join("/"))
        // _worker.js ist der Zugangsschutz und wird von Pages nie als Datei
        // ausgeliefert — der Versuch, ihn zu cachen, scheitert immer.
        .filter((p) => p !== "/sw.js" && p !== "/_worker.js" && !p.endsWith(".map"))
        .map(saubereUrl),
    ),
  ];

  const cache = `dachdecker-${Date.now()}`;
  const sw = `// Automatisch erzeugt von scripts/gen-sw.mjs (Export) — nicht von Hand ändern.
const CACHE = ${JSON.stringify(cache)};
const SHELL = ${JSON.stringify(alles, null, 2)};

// Höchstens so viele Dateien gleichzeitig laden. Alle 1601 auf einmal
// überfordert eine Mobilfunk- oder WLAN-Verbindung: ein Grossteil scheitert,
// der Cache bleibt halbleer, und die App ist offline kaputt.
const GLEICHZEITIG = 6;

// Der Seite mitteilen, wie weit das Vorladen ist. Ohne diese Rückmeldung kann
// niemand wissen, ab wann der Flugmodus gefahrlos ist.
async function melde(nachricht) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const cl of clients) cl.postMessage({ quelle: "dachdecker-sw", ...nachricht });
}

async function vorladen(c, urls) {
  let naechster = 0;
  let fehlend = 0;
  const arbeiter = Array.from({ length: GLEICHZEITIG }, async () => {
    while (naechster < urls.length) {
      const url = urls[naechster++];
      try {
        await c.add(url);
      } catch {
        // Ein zweiter Versuch. Mobilfunk verliert einzelne Anfragen.
        try {
          await c.add(url);
        } catch {
          fehlend++;
        }
      }
    }
  });
  await Promise.all(arbeiter);
  return fehlend;
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      // Erst die Seiten selbst, dann Code und Bilder. Bricht das Laden ab,
      // ist die App wenigstens bedienbar statt gar nicht startbar.
      // Reihenfolge entscheidet, wann die App offline benutzbar ist.
      // Kern = Seiten, JavaScript, Symbole (~9 MB). Ohne das JavaScript
      // rendert die Seite gar nicht — es muss vor die 31 MB Buchbilder.
      const istBild = (u) => u.startsWith("/buch/") || u.startsWith("/fotos/");
      const kern = SHELL.filter((u) => !istBild(u));
      const bilder = SHELL.filter(istBild);

      const fehlendKern = await vorladen(c, kern);
      await melde({ typ: "kern-fertig", fehlend: fehlendKern, gesamt: kern.length });

      const fehlendBilder = await vorladen(c, bilder);
      await melde({
        typ: "alles-fertig",
        fehlend: fehlendKern + fehlendBilder,
        gesamt: SHELL.length,
      });
    })(),
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
  // Im Cache liegen saubere Adressen. Ein angehängter Schrägstrich ist die
  // einzige Abweichung, die der Browser noch anfragen kann.
  if (pfad.length > 1 && pfad.endsWith("/")) return [pfad.slice(0, -1), pfad];
  return [pfad];
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
          const res = await fetch(e.request);
          // Ein Service Worker darf für eine Navigation keine umgeleitete Antwort
          // zurückgeben. Beim Zugangsschutz (302 zum Login) als echte Weiterleitung
          // durchreichen, damit der Browser ihr selbst folgt.
          if (res.redirected) return Response.redirect(res.url, 302);
          return res;
        } catch {
          return (await caches.match("/")) || Response.error();
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
          // Eine umgeleitete Antwort ist die Login-Seite, nicht die Datei. Die
          // unter dem Schlüssel der Datei zu cachen, würde den Offline-Bestand
          // unbrauchbar machen.
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
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
          // Umgeleitete Antwort = Login-Seite. Für Navigationen als echte
          // Weiterleitung durchreichen (ein Service Worker darf sie nicht direkt
          // zurückgeben), und niemals unter dem Schlüssel der Datei cachen.
          if (res.redirected) {
            return e.request.mode === "navigate" ? Response.redirect(res.url, 302) : res;
          }
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
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
