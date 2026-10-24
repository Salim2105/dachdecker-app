const { contextBridge, ipcRenderer } = require("electron");

// Genau eine feste Aktion, keine allgemeinen Dateisystem-/Shell-/IPC-Zugriffe.
contextBridge.exposeInMainWorld("dachdeckerDesktop", Object.freeze({
  platform: process.platform,
  convertHeic: (foto) => ipcRenderer.invoke("drawing:convert-heic", { bytes: foto?.bytes, name: foto?.name }),
}));
