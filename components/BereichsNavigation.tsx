"use client";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_GRUPPEN, SUCH_NAV, navigationsZiel } from "@/lib/navigation";
import { appStorage } from "@/lib/lernSpeicher";
import { LernLink } from "@/components/LernLink";
import styles from "./BereichsNavigation.module.css";

const GRUPPEN_KEY = "navigation-gruppe-v1";
type NavigationProps = { aktiv: string | null; mobil?: boolean; onNavigationReady?: () => void };

function anfangsGruppe(aktiv: string | null): string | null {
  const aktuell = NAV_GRUPPEN.find(g => g.eintraege.some(e => e.href === aktiv))?.id ?? null;
  try {
    const raw = appStorage.getItem(GRUPPEN_KEY);
    const gespeicherte: unknown = raw ? JSON.parse(raw) : null;
    if (gespeicherte && typeof gespeicherte === "object" && "bereich" in gespeicherte && gespeicherte.bereich === aktiv && "offen" in gespeicherte) {
      const offen = gespeicherte.offen;
      if (offen === null || typeof offen === "string" && NAV_GRUPPEN.some(g => g.id === offen)) return offen;
    }
  } catch { /* A menu preference must never prevent access to a learning task. */ }
  return aktuell;
}

/** A new area opens its group. Reopening the same area restores the user's choice. */
export function BereichsNavigation(props: NavigationProps) {
  return <NavigationsGruppen key={props.aktiv ?? "kein-bereich"} {...props} />;
}

function NavigationsGruppen({ aktiv, mobil = false, onNavigationReady }: NavigationProps) {
  const [offen, setOffen] = useState(() => anfangsGruppe(aktiv));
  const id = useId();
  function umschalten(gruppe: string) {
    const neu = offen === gruppe ? null : gruppe;
    setOffen(neu);
    try { appStorage.setItem(GRUPPEN_KEY, JSON.stringify({ bereich: aktiv, offen: neu })); }
    catch { /* Existing learning-storage errors remain visible in the shared status. */ }
  }
  return <nav aria-label={mobil ? "Alle Lernbereiche" : "Hauptnavigation"} className={`bereichs-navigation ${styles.navigation}`}>
    <LernLink href={SUCH_NAV.href} aria-current={aktiv === SUCH_NAV.href ? "page" : undefined} className={styles.suche} onNavigationReady={onNavigationReady}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={SUCH_NAV.icon} /></svg><span>{SUCH_NAV.label}</span>
    </LernLink>
    {NAV_GRUPPEN.map(g => {
      const geoeffnet = offen === g.id;
      const enthaeltAktivenBereich = g.eintraege.some(e => e.href === aktiv);
      const listenId = `${id}-${g.id}-ziele`;
      const titelId = `${id}-${g.id}-titel`;
      return <section key={g.id} className={styles.gruppe} aria-labelledby={titelId}>
        <h2><button id={titelId} type="button" className={styles.gruppenKnopf} aria-expanded={geoeffnet} aria-controls={listenId} onClick={() => umschalten(g.id)}>
          <span>{g.label}{enthaeltAktivenBereich && !geoeffnet && <span className={styles.aktuell}>Aktueller Bereich</span>}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={geoeffnet ? styles.pfeilOffen : undefined}><path d="m6 9 6 6 6-6" /></svg>
        </button></h2>
        <ul id={listenId} hidden={!geoeffnet}>{g.eintraege.map(e => <li key={e.href}>
          <LernLink href={navigationsZiel(e)} aria-current={aktiv === e.href ? "page" : undefined} onNavigationReady={onNavigationReady}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={e.icon} /></svg><span>{e.label}</span>
          </LernLink>
        </li>)}</ul>
      </section>;
    })}
  </nav>;
}

export function BereicheMenue({ aktiv, onSchliessen, onNavigationReady }: { aktiv: string | null; onSchliessen: () => void; onNavigationReady: () => void }) {
  const dialog = useRef<HTMLDivElement>(null), titel = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const alt = document.body.style.overflow; document.body.style.overflow = "hidden"; titel.current?.focus();
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onSchliessen(); } };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = alt; window.removeEventListener("keydown", escape); };
  }, [onSchliessen]);
  return <div className="bereiche-overlay"><button type="button" className="bereiche-hintergrund" aria-label="Bereiche-Menü schließen" tabIndex={-1} onClick={onSchliessen} /><div id="bereiche-menue" ref={dialog} className="bereiche-dialog" role="dialog" aria-modal="true" aria-labelledby="bereiche-titel" onKeyDown={e => {
    if (e.key !== "Tab") return;
    const alle = [...(dialog.current?.querySelectorAll<HTMLElement>("*") ?? [])].filter(n => n.matches("button, a[href], input, select") && !n.matches(":disabled") && !n.closest("[hidden], [inert]") && n.getClientRects().length > 0);
    const erstes = alle[0], letztes = alle.at(-1);
    if (e.shiftKey && (document.activeElement === erstes || document.activeElement === titel.current)) { e.preventDefault(); letztes?.focus(); }
    else if (!e.shiftKey && document.activeElement === letztes) { e.preventDefault(); erstes?.focus(); }
  }}><header><div><span>DEINE LERNWERKSTATT</span><h2 id="bereiche-titel" ref={titel} tabIndex={-1}>Alle Bereiche</h2></div><button type="button" onClick={onSchliessen} aria-label="Bereiche schließen">✕</button></header><div className="bereiche-inhalt"><p className={styles.hinweis}>Suche ein Thema oder öffne die passende Gruppe.</p><BereichsNavigation aktiv={aktiv} mobil onNavigationReady={onNavigationReady} /></div></div></div>;
}
