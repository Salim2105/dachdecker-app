// Electron-Hauptprozess der Dachdecker-Desktop-App.
//
// Die App ist ein statischer Next-Export in `out/`. Damit die absoluten
// Asset-Pfade (/_next/...) und die Router-URLs funktionieren, servieren wir
// die Dateien über einen winzigen lokalen HTTP-Server auf 127.0.0.1 und öffnen
// ein Fenster darauf. Alles läuft lokal — kein Internet, kein externer Server.

const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { convertHeicToPng } = require("./heic");
const NEUE_APP = require("../package.json").desktopVariant === "neu";
const APP_NAME = NEUE_APP ? "Dachdecker Neu" : "Dachdecker";

// Die neue Variante behält ihren eigenen Lernstand; die alte App bleibt erhalten.
if (NEUE_APP) {
  app.setName(APP_NAME);
  app.setPath("userData", path.join(app.getPath("appData"), APP_NAME));
}

// Wo liegt der Export? Gepackt unter resources/out, sonst im Projekt.
const OUT_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "out")
  : path.join(__dirname, "..", "out");

// Fester, unüblicher Port → stabile Adresse → Fortschritt bleibt erhalten.
const FEST_PORT = NEUE_APP ? 39218 : 39217;
let lokalerServer;
let heicUmwandlungAktiv = false;

ipcMain.handle("drawing:convert-heic", async (event, payload) => {
  // Nur die Hauptseite unseres lokalen Fensters darf die Umwandlung anfordern.
  if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame || new URL(event.senderFrame.url).origin !== `http://127.0.0.1:${FEST_PORT}`) throw new Error("Dieser Fotoupload ist nicht erlaubt.");
  if (heicUmwandlungAktiv) throw new Error("Ein Foto wird bereits umgewandelt. Bitte warte kurz.");
  heicUmwandlungAktiv = true;
  try { return await convertHeicToPng(payload); }
  catch (error) {
    if (error.killed || error.code === "ENOENT") throw new Error("Das HEIC-Foto konnte nicht geöffnet werden. Exportiere es in Vorschau als JPEG oder PNG.");
    throw error;
  } finally { heicUmwandlungAktiv = false; }
});

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
    // OUT_DIR + Trenner: sonst würde ein Nachbarordner "out…" durchrutschen.
    if (k.startsWith(OUT_DIR + path.sep) && fs.existsSync(k) && fs.statSync(k).isFile()) return k;
  }
  return null;
}

function starteServer() {
  if (lokalerServer) return Promise.resolve(FEST_PORT);
  return new Promise((resolve, reject) => {
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
    // FESTER Port: sonst ändert sich bei jedem Start die Adresse
    // (http://127.0.0.1:PORT), und weil der Fortschritt pro Adresse im
    // localStorage liegt, wäre er nach jedem Neustart weg.
    server.once("error", reject);
    server.listen(FEST_PORT, "127.0.0.1", () => {
      lokalerServer = server;
      resolve(FEST_PORT);
    });
  });
}

async function erstelleFenster() {
  const port = await starteServer();
  const fenster = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 760,
    minHeight: 620,
    title: APP_NAME,
    backgroundColor: "#191d1b",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "preload.js") },
  });

  const EIGEN = `http://127.0.0.1:${port}/`;

  // Links auf externe Seiten (Referenzen) im normalen Browser öffnen — aber nur
  // http/https. Andere Schemata (file:, smb:, custom) gehen NICHT an das
  // Betriebssystem weiter.
  fenster.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(EIGEN)) return { action: "allow" };
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  // Das Fenster selbst bleibt immer auf der lokalen App — kein Wegnavigieren.
  fenster.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(EIGEN)) e.preventDefault();
  });
  fenster.webContents.on("will-prevent-unload", (event) => {
    const wahl = dialog.showMessageBoxSync(fenster, {
      type: "warning",
      title: "Lernstand wird noch gespeichert",
      message: "Einige Änderungen sind noch nicht dauerhaft gespeichert.",
      detail: "Warte, bis die Speicherung abgeschlossen ist. Bei einem Speicherfehler sichere deinen Lernstand über die Datensicherung. Wenn du trotzdem schließt, können die letzten Änderungen fehlen.",
      buttons: ["Weiter warten", "Trotzdem schließen"],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    // Bei will-prevent-unload hebt preventDefault ausnahmsweise die Sperre auf.
    if (wahl === 1) event.preventDefault();
  });
  fenster.loadURL(`http://127.0.0.1:${port}/`);
}

function startFehler(error) {
  dialog.showErrorBox(APP_NAME, error.code === "EADDRINUSE"
    ? "Der App-Port ist bereits belegt. Beende andere laufende Dachdecker-Apps vollständig und starte diese App erneut."
    : "Die App konnte nicht starten. Bitte starte sie erneut.\n\n" + error.message);
  app.quit();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const fenster = BrowserWindow.getAllWindows()[0];
    if (fenster) {
      if (fenster.isMinimized()) fenster.restore();
      fenster.show();
      fenster.focus();
    } else if (app.isReady()) {
      erstelleFenster().catch(startFehler);
    }
  });
  app.whenReady().then(erstelleFenster).catch(startFehler);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) erstelleFenster().catch(startFehler);
});
