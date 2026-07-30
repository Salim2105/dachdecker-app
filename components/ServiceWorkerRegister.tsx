"use client";
import { useEffect, useState } from "react";

/**
 * Hält die Web-/iOS-PWA automatisch aktuell (Service Worker fürs Offline-Cachen).
 *
 * WICHTIG: In der Desktop-App (Electron) wird KEIN Service Worker registriert.
 * Dort lädt die App ohnehin lokal vom eingebauten Server — ein SW bringt keinen
 * Nutzen, sondern führt nur dazu, dass nach einem Update die alte, gecachte
 * Version angezeigt wird. Deshalb: in Electron einen evtl. vorhandenen alten SW
 * abmelden und seine Caches leeren, sonst nichts.
 */
type Stand = null | "kern" | "alles";

export function ServiceWorkerRegister() {
  const [stand, setStand] = useState<Stand>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const istElectron = /electron/i.test(navigator.userAgent);

    if (istElectron || process.env.NODE_ENV !== "production") {
      // Aufräumen: alten Service Worker abmelden und Caches leeren (heilt einen
      // festhängenden Stand). localStorage (Fortschritt) bleibt unberührt.
      navigator.serviceWorker
        .getRegistrations()
        .then((rs) => rs.forEach((r) => r.unregister()))
        .catch(() => {});
      if (istElectron && "caches" in window) {
        caches
          .keys()
          .then((ks) => ks.forEach((k) => caches.delete(k)))
          .catch(() => {});
      }
      return;
    }

    // --- Web / iOS-PWA: registrieren und automatisch aktualisieren ---
    const hatteController = !!navigator.serviceWorker.controller;
    let neugeladen = false;

    const beiWechsel = () => {
      if (neugeladen || !hatteController) return;
      neugeladen = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", beiWechsel);

    let reg: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker
      // updateViaCache: "none" → sw.js wird nie aus dem HTTP-Cache genommen,
      // sonst wird ein Update evtl. nicht erkannt.
      .register("/sw.js", { updateViaCache: "none" })
      .then((r) => {
        reg = r;
        r.update().catch(() => {});
      })
      .catch(() => {});

    const beiSichtbar = () => {
      if (!document.hidden) reg?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", beiSichtbar);

    const beiNachricht = (e: MessageEvent) => {
      if (e.data?.quelle !== "dachdecker-sw") return;
      if (e.data.typ === "kern-fertig") setStand("kern");
      if (e.data.typ === "alles-fertig") setStand("alles");
    };
    navigator.serviceWorker.addEventListener("message", beiNachricht);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", beiWechsel);
      navigator.serviceWorker.removeEventListener("message", beiNachricht);
      document.removeEventListener("visibilitychange", beiSichtbar);
    };
  }, []);

  if (!stand) return null;

  return (
    <div
      role="status"
      onClick={() => setStand(null)}
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
        zIndex: 60,
        maxWidth: "min(22rem, calc(100vw - 2rem))",
        padding: "0.6rem 1rem",
        borderRadius: "999px",
        border: "1px solid rgba(217,176,97,.35)",
        background: "rgba(21,22,24,.94)",
        color: "#f0ede9",
        font: "500 13px/1.35 system-ui, -apple-system, sans-serif",
        textAlign: "center",
        boxShadow: "0 8px 28px rgba(0,0,0,.5)",
      }}
    >
      {stand === "kern" ? (
        <>
          <strong style={{ color: "#d9b061" }}>Offline bereit.</strong> Bilder laden noch im
          Hintergrund.
        </>
      ) : (
        <>
          <strong style={{ color: "#d9b061" }}>Alles offline verfügbar.</strong> Flugmodus kann an.
        </>
      )}
    </div>
  );
}
