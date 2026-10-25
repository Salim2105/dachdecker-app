"use client";
import { useEffect, useRef, useState } from "react";
import { flushStorage } from "@/lib/lernSpeicher";

type OfflineStand = null | "kern" | "alles" | "teilweise";
const eigenerCache = (name: string) => name.startsWith("dachdecker-lernwerkstatt-root-") || /^dachdecker-\d+$/.test(name);
const eigeneRegistrierung = (reg: ServiceWorkerRegistration) => [reg.active, reg.waiting, reg.installing]
  .some((worker) => worker && new URL(worker.scriptURL).pathname === "/sw.js") && new URL(reg.scope).pathname === "/";

/** A waiting update never interrupts an answer. Its activation and the final
 * reload both wait for the durable learner store after an explicit click. */
export function ServiceWorkerRegister() {
  const [stand, setStand] = useState<OfflineStand>(null);
  const [wartend, setWartend] = useState<ServiceWorker | null>(null);
  const [wechsel, setWechsel] = useState(false);
  const [fehler, setFehler] = useState("");
  const freigegeben = useRef(false);
  const lebendig = useRef(false);
  const wechselLaeuft = useRef(false);
  const neugeladen = useRef(false);

  useEffect(() => {
    lebendig.current = true;
    if (!("serviceWorker" in navigator)) return () => { lebendig.current = false; };
    const serviceWorker = navigator.serviceWorker;
    const istElectron = /electron/i.test(navigator.userAgent);
    if (istElectron || process.env.NODE_ENV !== "production") {
      // Electron uses its local bundle. Never remove another app's worker/cache.
      void serviceWorker.getRegistrations().then((rs) => Promise.all(rs.filter(eigeneRegistrierung).map((r) => r.unregister()))).catch(() => {});
      if (istElectron && "caches" in window) {
        void caches.keys().then((ks) => Promise.all(ks.filter(eigenerCache).map((k) => caches.delete(k)))).catch(() => {});
      }
      return () => { lebendig.current = false; };
    }

    let letzterController = serviceWorker.controller;
    let reg: ServiceWorkerRegistration | undefined;
    const aufraeumen: (() => void)[] = [];
    const zeigeWartend = () => { if (lebendig.current && reg?.waiting) setWartend(reg.waiting); };
    const beiUpdate = () => {
      const worker = reg?.installing;
      if (!worker) return;
      const installiert = () => {
        if (worker.state === "installed" && serviceWorker.controller) zeigeWartend();
      };
      worker.addEventListener("statechange", installiert);
      aufraeumen.push(() => worker.removeEventListener("statechange", installiert));
      installiert();
    };
    const beiWechsel = async () => {
      if (!lebendig.current || neugeladen.current) return;
      const ersteUebernahme = !letzterController;
      letzterController = serviceWorker.controller;
      if (ersteUebernahme && !freigegeben.current) return;
      if (!freigegeben.current) {
        // An update accepted in another tab must not reload this unfinished task.
        setWartend(serviceWorker.controller);
        return;
      }
      try {
        await flushStorage();
        if (!lebendig.current || neugeladen.current) return;
        neugeladen.current = true;
        globalThis.location.reload();
      } catch {
        if (!lebendig.current) return;
        freigegeben.current = false;
        wechselLaeuft.current = false;
        setWechsel(false);
        setWartend(serviceWorker.controller);
        setFehler("Deine Eingaben konnten noch nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen und danach erneut aktualisieren.");
      }
    };
    const beiSichtbar = () => {
      if (!document.hidden) { zeigeWartend(); void reg?.update().catch(() => {}); }
    };
    const beiNachricht = (event: MessageEvent) => {
      if (event.data?.quelle !== "dachdecker-sw" || (event.origin && event.origin !== window.location.origin)) return;
      if (!["kern-fertig", "alles-fertig"].includes(event.data.typ)) return;
      if (event.data.fehlend > 0) setStand("teilweise");
      else setStand(event.data.typ === "kern-fertig" ? "kern" : "alles");
    };
    serviceWorker.addEventListener("controllerchange", beiWechsel);
    serviceWorker.addEventListener("message", beiNachricht);
    document.addEventListener("visibilitychange", beiSichtbar);
    void serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((r) => {
      if (!lebendig.current) return;
      reg = r;
      reg.addEventListener("updatefound", beiUpdate);
      aufraeumen.push(() => reg?.removeEventListener("updatefound", beiUpdate));
      zeigeWartend(); beiUpdate();
      void reg.update().catch(() => {});
    }).catch(() => {});
    return () => {
      lebendig.current = false;
      aufraeumen.forEach((fn) => fn());
      serviceWorker.removeEventListener("controllerchange", beiWechsel);
      serviceWorker.removeEventListener("message", beiNachricht);
      document.removeEventListener("visibilitychange", beiSichtbar);
    };
  }, []);

  async function aktualisieren() {
    if (!wartend || wechselLaeuft.current) return;
    wechselLaeuft.current = true; setWechsel(true); setFehler("");
    try {
      await flushStorage();
      if (!lebendig.current) return;
      freigegeben.current = true;
      if (wartend.state === "activated") {
        if (!neugeladen.current) { neugeladen.current = true; globalThis.location.reload(); }
      } else wartend.postMessage({ quelle: "dachdecker-app", typ: "UPDATE_AKTIVIEREN" });
    } catch {
      if (!lebendig.current) return;
      freigegeben.current = false; wechselLaeuft.current = false; setWechsel(false);
      setFehler("Deine Eingaben konnten noch nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen und danach erneut aktualisieren.");
    }
  }

  if (!stand && !wartend) return null;
  return <section aria-label={wartend ? "App-Update" : "Offline-Verfügbarkeit"} style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)", zIndex: 60, width: "min(29rem, calc(100vw - 2rem))", padding: "1rem", borderRadius: "18px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", boxShadow: "0 8px 28px rgba(0,0,0,.22)", fontSize: "14px", lineHeight: 1.6 }}>
    {wartend ? <><strong>Ein Update ist verfügbar.</strong><p>Deine Aufgabe bleibt geöffnet. Beim Aktualisieren speichern wir zuerst deine Eingaben.</p><div className="mt-3 flex flex-wrap gap-3"><button className="hauptaktion" disabled={wechsel} onClick={() => { void aktualisieren(); }}>{wechsel ? "Wird gespeichert und aktualisiert …" : "Speichern und aktualisieren"}</button>{!wechsel && <button className="min-h-11 underline" onClick={() => setWartend(null)}>Später</button>}</div>{fehler && <p role="alert" className="mt-3" style={{ color: "var(--bad)" }}>{fehler}</p>}</>
      : <><p role="status">{stand === "kern" ? "Die App ist offline bereit. Bilder laden noch im Hintergrund." : stand === "alles" ? "Alles offline verfügbar." : "Einige Offline-Dateien fehlen noch. Bitte die App online lassen und später erneut öffnen."}</p><button className="mt-2 min-h-11 underline" onClick={() => setStand(null)}>Hinweis schließen</button></>}
  </section>;
}
