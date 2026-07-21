// HTTPS-Server, damit iPad/iPhone die App als echte Offline-PWA laden können.
//
// iOS speichert eine PWA nur dann offline, wenn sie über HTTPS geladen wurde.
// Darum: Wir starten den normalen Next-Server (HTTP, 127.0.0.1:3200) und legen
// einen kleinen HTTPS-Server mit dem lokalen mkcert-Zertifikat davor. Das iPad
// lädt die App einmal im WLAN, der Service Worker cacht alles — danach läuft sie
// offline. Zum Aktualisieren einmal wieder im WLAN öffnen.

import { spawn } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTTP_PORT = 3200; // interner Next-Server
const HTTPS_PORT = 3443; // hier verbindet sich das iPad
const HOST = "macbook-air-von-salim.local";

const cert = join(ROOT, "certs", "cert.pem");
const key = join(ROOT, "certs", "key.pem");
if (!existsSync(cert) || !existsSync(key)) {
  console.error("❌ Zertifikat fehlt in certs/. Erst mkcert laufen lassen (siehe docs/ios-offline.md).");
  process.exit(1);
}

// 1) Next-Produktionsserver als Kindprozess starten (nur lokal erreichbar).
const next = spawn("npx", ["next", "start", "-p", String(HTTP_PORT), "-H", "127.0.0.1"], {
  cwd: ROOT,
  stdio: ["ignore", "inherit", "inherit"],
});
const beenden = () => {
  next.kill();
  process.exit();
};
process.on("SIGINT", beenden);
process.on("SIGTERM", beenden);

// 2) Warten, bis Next antwortet.
function warteAufNext(versuche = 60) {
  return new Promise((resolve, reject) => {
    const probe = () => {
      const r = http.get({ host: "127.0.0.1", port: HTTP_PORT, path: "/" }, (res) => {
        res.resume();
        resolve();
      });
      r.on("error", () => {
        if (--versuche <= 0) return reject(new Error("Next-Server startet nicht"));
        setTimeout(probe, 500);
      });
    };
    probe();
  });
}

// 3) HTTPS-Server, der jede Anfrage an den Next-Server weiterreicht.
function starteHttps() {
  const server = https.createServer(
    { cert: readFileSync(cert), key: readFileSync(key) },
    (req, res) => {
      const weiter = http.request(
        { host: "127.0.0.1", port: HTTP_PORT, path: req.url, method: req.method, headers: req.headers },
        (antwort) => {
          res.writeHead(antwort.statusCode || 502, antwort.headers);
          antwort.pipe(res);
        },
      );
      weiter.on("error", () => {
        res.writeHead(502).end("Server nicht erreichbar");
      });
      req.pipe(weiter);
    },
  );
  server.listen(HTTPS_PORT, "0.0.0.0", () => {
    console.log("\n✅ App ist im WLAN erreichbar. Auf iPad/iPhone in Safari öffnen:\n");
    console.log(`   https://${HOST}:${HTTPS_PORT}\n`);
    console.log("   (Zertifikat rootCA.pem muss auf dem Gerät installiert + vertraut sein —");
    console.log("    Anleitung: docs/ios-offline.md). Dann: Teilen → Zum Home-Bildschirm.\n");
    console.log("   Beenden mit Strg+C.\n");
  });
}

warteAufNext()
  .then(starteHttps)
  .catch((e) => {
    console.error("❌", e.message);
    beenden();
  });
