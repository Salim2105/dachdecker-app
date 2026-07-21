// Automatisch erzeugt von scripts/gen-sw.mjs — nicht von Hand ändern.
const CACHE = "dachdecker-1784571515630";
const SHELL = [
  "/",
  "/lernen",
  "/zeichnen",
  "/pruefung",
  "/rechner",
  "/fortschritt",
  "/manifest.webmanifest",
  "/lernen/lf01",
  "/lernen/lf01/ueben",
  "/lernen/lf02",
  "/lernen/lf02/ueben",
  "/lernen/lf03",
  "/lernen/lf03/ueben",
  "/lernen/lf04",
  "/lernen/lf04/ueben",
  "/lernen/lf05",
  "/lernen/lf05/ueben",
  "/lernen/lf06",
  "/lernen/lf06/ueben",
  "/lernen/lf07",
  "/lernen/lf07/ueben",
  "/lernen/lf08",
  "/lernen/lf08/ueben",
  "/lernen/lf09",
  "/lernen/lf09/ueben",
  "/lernen/lf10",
  "/lernen/lf10/ueben",
  "/lernen/lf11",
  "/lernen/lf11/ueben",
  "/lernen/lf12",
  "/lernen/lf12/ueben",
  "/lernen/lf13a",
  "/lernen/lf13a/ueben",
  "/lernen/lf13b",
  "/lernen/lf13b/ueben",
  "/lernen/lf14",
  "/lernen/lf14/ueben",
  "/lernen/lf15",
  "/lernen/lf15/ueben",
  "/lernen/lf16",
  "/lernen/lf16/ueben",
  "/lernen/lf17",
  "/lernen/lf17/ueben",
  "/lernen/wiso",
  "/lernen/wiso/ueben",
  "/file.svg",
  "/fotos/README.md",
  "/globe.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
  "/_next/static/bmeW3pYx9YaJsIheJFdVc/_buildManifest.js",
  "/_next/static/bmeW3pYx9YaJsIheJFdVc/_clientMiddlewareManifest.js",
  "/_next/static/bmeW3pYx9YaJsIheJFdVc/_ssgManifest.js",
  "/_next/static/chunks/05-c3ty_6dwfk.js",
  "/_next/static/chunks/05ztmz3vvrbhd.js",
  "/_next/static/chunks/0cz1d0mv5g_q7.js",
  "/_next/static/chunks/0rh6l6y2yfzk1.js",
  "/_next/static/chunks/0rmls7y7l7nuh.js",
  "/_next/static/chunks/10qk6v6416kh8.js",
  "/_next/static/chunks/14mrh2-p_w84d.js",
  "/_next/static/chunks/1e6rp_h0buicz.js",
  "/_next/static/chunks/27jktro2p5rq9.js",
  "/_next/static/chunks/2d9zb0mu9myhc.js",
  "/_next/static/chunks/2oiigiqnvpo6y.js",
  "/_next/static/chunks/2v7q_atn_eri6.css",
  "/_next/static/chunks/315owoz9ub2zd.js",
  "/_next/static/chunks/38bjz7wb0f-az.js",
  "/_next/static/chunks/3db0q5qkvowoc.js",
  "/_next/static/chunks/3g0ffq2f0r-n8.js",
  "/_next/static/chunks/3n7gf7-hbylyo.js",
  "/_next/static/chunks/3rxl-jt3pdxgx.js",
  "/_next/static/chunks/turbopack-1p7pqniqer0jp.js",
  "/_next/static/media/4fa387ec64143e14-s.2tuy5pz7dlieh.woff2",
  "/_next/static/media/53b9e256198e5412-s.390ncx5urfkfu.woff2",
  "/_next/static/media/5ce348bf30bf5439-s.31988l_ccedte.woff2",
  "/_next/static/media/6306c77e7c8268e4-s.2dbetqa9o8jxf.woff2",
  "/_next/static/media/7178b3e590c64307-s.21jp631_3pja2.woff2",
  "/_next/static/media/797e433ab948586e-s.p.0r6juujl39pe6.woff2",
  "/_next/static/media/7d817b4c03b0c5f1-s.1uyisp29ctx0d.woff2",
  "/_next/static/media/8a480f0b521d4e75-s.1qq4vpdcun5oj.woff2",
  "/_next/static/media/bbc41e54d2fcbd21-s.1rgnod-3esatf.woff2",
  "/_next/static/media/caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2",
  "/_next/static/media/favicon.2vob68tjqpejf.ico",
  "/_next/static/media/fef07dbb0973bf53-s.3p2_lha1f2xer.woff2"
];

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
