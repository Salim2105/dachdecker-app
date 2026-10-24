"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { appStorage, getStorageStatus, initializeStorage, retryStorageWrites, subscribeStorageStatus } from "@/lib/lernSpeicher";

export function StorageGate({ children }: { children: React.ReactNode }) {
  const status = useSyncExternalStore(subscribeStorageStatus, getStorageStatus, getStorageStatus);
  const [bereit, setBereit] = useState(false);
  useEffect(() => {
    void initializeStorage().then(() => {
      const theme = appStorage.getItem("theme");
      if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
      setBereit(true);
    }).catch(() => {});
    const vorSchliessen = (event: BeforeUnloadEvent) => {
      const aktuell = getStorageStatus();
      if (aktuell.pending || aktuell.error) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", vorSchliessen);
    return () => window.removeEventListener("beforeunload", vorSchliessen);
  }, []);
  return <>
    {status.error && <div role="alert" className="storage-error">
      <strong>Speichern braucht deine Aufmerksamkeit.</strong> {status.error}
      <button onClick={() => { void retryStorageWrites().then(() => setBereit(true)).catch(() => {}); }}>Erneut versuchen</button>
    </div>}
    {bereit ? children : <div className="storage-loading" role="status">Deine Lernwerkstatt wird geöffnet …</div>}
    {bereit && <div className="save-state" role="status" aria-live="polite">{status.error ? "Speichern fehlgeschlagen – siehe Hinweis oben" : status.pending ? "Wird gespeichert …" : status.backend === "indexeddb" ? "Auf diesem Gerät gespeichert" : "Lokaler Speicher · Bilder benötigen IndexedDB"}</div>}
  </>;
}
