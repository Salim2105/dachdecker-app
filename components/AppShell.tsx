"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Rechner } from "@/components/rechner/Rechner";
import { Glossar } from "@/components/Glossar";
import { aktiverBereich, WERKSTATT_NAV } from "@/lib/navigation";
import { appStorage } from "@/lib/lernSpeicher";

type Werkzeug = "rechner" | "glossar";
const WerkzeugContext = createContext<{ oeffnen: (tool: Werkzeug, begriff?: string) => void }>({ oeffnen: () => {} });
export const useWerkzeug = () => useContext(WerkzeugContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const aktiv = aktiverBereich(pathname);
  const [werkzeug, setWerkzeug] = useState<Werkzeug | null>(null);
  const [besucht, setBesucht] = useState<Set<Werkzeug>>(new Set());
  const [begriff, setBegriff] = useState<string>();
  const [breite, setBreite] = useState(() => Math.min(560, Math.max(320, Number(appStorage.getItem("hilfe-breite")) || 380)));
  const [schrift, setSchrift] = useState(() => [100, 115, 130].includes(Number(appStorage.getItem("schriftgroesse"))) ? Number(appStorage.getItem("schriftgroesse")) : 100);
  const ruecksprung = useRef<HTMLElement | null>(null);
  const panelTitel = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [overlay, setOverlay] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(max-width: 1200px)");
    const aktualisieren = () => setOverlay(query.matches);
    aktualisieren(); query.addEventListener("change", aktualisieren);
    return () => query.removeEventListener("change", aktualisieren);
  }, []);
  const oeffnen = useCallback((tool: Werkzeug, id?: string) => {
    window.dispatchEvent(new Event("dachdecker:vorlesen-stoppen"));
    if (document.activeElement instanceof HTMLElement && !document.activeElement.closest("#werkzeug-panel")) ruecksprung.current = document.activeElement;
    setBesucht((old) => new Set([...old, tool]));
    if (id) setBegriff(id);
    setWerkzeug(tool);
    requestAnimationFrame(() => panelTitel.current?.focus());
  }, []);
  const schliessen = useCallback(() => {
    window.dispatchEvent(new Event("dachdecker:vorlesen-stoppen"));
    setWerkzeug(null);
    requestAnimationFrame(() => ruecksprung.current?.isConnected && ruecksprung.current.focus());
  }, []);
  useEffect(() => {
    const begriffOeffnen = (event: Event) => { const id = (event as CustomEvent<unknown>).detail; if (typeof id === "string") oeffnen("glossar", id); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && werkzeug) { event.preventDefault(); schliessen(); } };
    window.addEventListener("dachdecker:begriff", begriffOeffnen);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("dachdecker:begriff", begriffOeffnen); window.removeEventListener("keydown", escape); };
  }, [oeffnen, schliessen, werkzeug]);
  useEffect(() => {
    document.documentElement.style.zoom = String(schrift / 100);
    appStorage.setItem("schriftgroesse", String(schrift));
  }, [schrift]);
  return <WerkzeugContext.Provider value={{ oeffnen }}>
    <a className="skip-link" href="#arbeitsflaeche" inert={overlay && !!werkzeug}>Zum Inhalt springen</a>
    <div className={`app-shell ${werkzeug ? "mit-werkzeug" : ""}`} style={{ "--hilfe-breite": `${breite}px` } as React.CSSProperties}>
      <aside className="werkstatt-nav" inert={overlay && !!werkzeug}>
        <Link href="/" className="werkstatt-marke" aria-label="Dachdecker Lernwerkstatt – Übersicht">
          <svg viewBox="0 0 48 40" width="46" height="40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 23L24 5l22 18M9 21v15h30V21M24 6v29M14 14l22 18M33 14L13 31" /></svg>
          <span>Dachdecker<strong>Lernwerkstatt</strong></span>
        </Link>
        <nav aria-label="Hauptnavigation">
          {WERKSTATT_NAV.map((item) => <Link href={item.href} key={item.href} aria-current={aktiv === item.href ? "page" : undefined}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.icon} /></svg>
            <span><strong>{item.label}</strong><small>{item.hinweis}</small></span>
          </Link>)}
        </nav>
        <div className="nav-fuss"><div className="nav-motivation"><span aria-hidden="true">✦</span><strong>Dein Wissen.<br />Dein Handwerk.</strong><p>Ein kleiner Lernschritt bringt dich weiter.</p></div><Link href="/fortschritt">Dein Fortschritt & Sicherungen →</Link></div>
      </aside>
      <div className="werkstatt-arbeit" inert={overlay && !!werkzeug}>
        <header className="werkstatt-kopf">
          <span className="bereich-name">{WERKSTATT_NAV.find((i) => i.href === aktiv)?.label}</span>
          <div className="werkzeug-knopfleiste">
            <button aria-controls="werkzeug-panel" aria-expanded={werkzeug === "rechner"} onClick={() => werkzeug === "rechner" ? schliessen() : oeffnen("rechner")}>Rechner</button>
            <button aria-controls="werkzeug-panel" aria-expanded={werkzeug === "glossar"} onClick={() => werkzeug === "glossar" ? schliessen() : oeffnen("glossar")}>Begriffshilfe</button>
            <label className="schriftwahl"><span className="sr-only">Schriftgröße</span><select aria-label="Schriftgröße" value={schrift} onChange={(e) => setSchrift(Number(e.target.value))}>{[100, 115, 130].map((n) => <option key={n} value={n}>Aa {n} %</option>)}</select></label>
            <ThemeToggle />
          </div>
        </header>
        <main id="arbeitsflaeche" className="arbeitsflaeche" tabIndex={-1}>{children}</main>
      </div>
      <aside ref={panel} id="werkzeug-panel" className="werkzeug-panel" hidden={!werkzeug} role={overlay ? "dialog" : undefined} aria-modal={overlay && werkzeug ? true : undefined} aria-label="Lernhilfen" onKeyDown={(event) => {
        if (!overlay || event.key !== "Tab") return;
        const elemente = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') ?? [])].filter((el) => !el.closest("[hidden]") && el.getClientRects().length > 0);
        const erstes = elemente[0], letztes = elemente.at(-1);
        if (event.shiftKey && (document.activeElement === erstes || document.activeElement === panelTitel.current)) { event.preventDefault(); letztes?.focus(); }
        else if (!event.shiftKey && document.activeElement === letztes) { event.preventDefault(); erstes?.focus(); }
      }}>
        <div className="werkzeug-titel"><h2 ref={panelTitel} tabIndex={-1}>{werkzeug === "rechner" ? "Rechner" : "Begriffshilfe"}</h2><button onClick={schliessen} aria-label="Lernhilfe schließen">✕</button></div>
        <p className="werkzeug-hinweis">Deine Aufgabe bleibt geöffnet. Mit Esc schließt du die Hilfe.</p>
        <div role="group" aria-label="Lernhilfe auswählen" className="werkzeug-tabs"><button aria-pressed={werkzeug === "rechner"} onClick={() => oeffnen("rechner")}>Rechner</button><button aria-pressed={werkzeug === "glossar"} onClick={() => oeffnen("glossar")}>Begriffe</button></div>
        <label className="panel-breite">Breite <input type="range" min="320" max="560" step="20" value={breite} onChange={(e) => { setBreite(Number(e.target.value)); appStorage.setItem("hilfe-breite", e.target.value); }} /></label>
        <div hidden={werkzeug !== "rechner"}>{besucht.has("rechner") && <Rechner compact />}</div>
        <div hidden={werkzeug !== "glossar"}>{besucht.has("glossar") && <Glossar begriffId={begriff} onBegriff={setBegriff} />}</div>
      </aside>
    </div>
    <div inert={overlay && !!werkzeug}><BottomNav /></div>
  </WerkzeugContext.Provider>;
}
