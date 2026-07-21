// Electron-Hauptprozess der Dachdecker-Desktop-App.
//
// Die App ist ein statischer Next-Export in `out/`. Damit die absoluten
// Asset-Pfade (/_next/...) und die Router-URLs funktionieren, servieren wir
// die Dateien über einen winzigen lokalen HTTP-Server auf 127.0.0.1 und öffnen
// ein Fenster darauf. Alles läuft lokal — kein Internet, kein externer Server.

const { app, BrowserWindow, shell } = require("electron");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");

// Wo liegt der Export? Gepackt unter resources/out, sonst im Projekt.
const OUT_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "out")
  : path.join(__dirname, "..", "out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

// Löst eine URL auf eine Datei im Export auf: exakte Datei, sonst .html,
// sonst index.html im Ordner. So passen die sauberen Router-URLs.
function dateiFuer(pfad) {
  const rein = decodeURIComponent(pfad.split("?")[0]).replace(/^\/+/, "");
  const basis = path.join(OUT_DIR, rein);
  const kandidaten = rein === "" || rein.endsWith("/")
    ? [path.join(basis, "index.html")]
    : [basis, basis + ".html", path.join(basis, "index.html")];
  for (const k of kandidaten) {
    if (k.startsWith(OUT_DIR) && fs.existsSync(k) && fs.statSync(k).isFile()) return k;
  }
  return null;
}

function starteServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const datei = dateiFuer(req.url || "/");
      if (!datei) {
        const fallback = path.join(OUT_DIR, "404.html");
        if (fs.existsSync(fallback)) {
          res.writeHead(404, { "Content-Type": MIME[".html"] });
          fs.createReadStream(fallback).pipe(res);
        } else {
          res.writeHead(404).end("Not found");
        }
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" });
      fs.createReadStream(datei).pipe(res);
    });
    // Port 0 = freien Port vom System geben lassen.
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function erstelleFenster() {
  const port = await starteServer();
  const fenster = new BrowserWindow({
    width: 430,
    height: 860,
    minWidth: 360,
    minHeight: 560,
    title: "Dachdecker",
    backgroundColor: "#191b1f",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  // Links auf externe Seiten (Referenzen) im normalen Browser öffnen.
  fenster.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1")) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  fenster.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(erstelleFenster);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) erstelleFenster();
});
