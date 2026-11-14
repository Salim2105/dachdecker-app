"use client";

import { useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LernLink } from "@/components/LernLink";
import styles from "@/components/DarstellungService.module.css";

export function DarstellungService({ schrift, onSchrift, feedbackZiel, onSchliessen, onNavigationReady }: {
  schrift: number;
  onSchrift: (wert: number) => void;
  feedbackZiel: string;
  onSchliessen: () => void;
  onNavigationReady: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const titel = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const bisher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titel.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onSchliessen(); }
    };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = bisher; window.removeEventListener("keydown", escape); };
  }, [onSchliessen]);

  return <div className={styles.overlay}>
    <button type="button" className={styles.hintergrund} tabIndex={-1} aria-label="Darstellung und Service schließen" onClick={onSchliessen} />
    <div id="darstellung-service" className={styles.dialog} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="darstellung-service-titel" onKeyDown={event => {
      if (event.key !== "Tab") return;
      const elemente = [...(dialog.current?.querySelectorAll<HTMLElement>("*") ?? [])]
        .filter(element => element.matches("button, a[href], input, select") && !element.matches(":disabled") && !element.closest("[hidden], [inert]") && element.getClientRects().length > 0);
      const erstes = elemente[0], letztes = elemente.at(-1);
      if (event.shiftKey && (document.activeElement === erstes || document.activeElement === titel.current)) { event.preventDefault(); letztes?.focus(); }
      else if (!event.shiftKey && document.activeElement === letztes) { event.preventDefault(); erstes?.focus(); }
    }}>
      <header className={styles.kopf}>
        <h2 id="darstellung-service-titel" ref={titel} tabIndex={-1}>Darstellung & Service</h2>
        <button type="button" onClick={onSchliessen} aria-label="Menü schließen">✕</button>
      </header>
      <div className={styles.inhalt}>
        <section aria-labelledby="darstellung-titel">
          <h3 id="darstellung-titel">Gut lesen können</h3>
          <label className={styles.schrift}>Schriftgröße
            <select value={schrift} onChange={event => onSchrift(Number(event.target.value))}>
              {[100, 115, 130].map(wert => <option key={wert} value={wert}>{wert} %</option>)}
            </select>
          </label>
          <div className={styles.design}><span>Farbdarstellung</span><ThemeToggle /></div>
        </section>
        <nav className={styles.service} aria-label="Service">
          <h3>Hilfe und Rückmeldungen</h3>
          <LernLink href={feedbackZiel} onNavigationReady={onNavigationReady}>Rückmeldung geben <span aria-hidden="true">→</span></LernLink>
          <LernLink href="/erprobung" onNavigationReady={onNavigationReady}>Erprobungsbogen <span aria-hidden="true">→</span></LernLink>
          <LernLink href="/fortschritt" onNavigationReady={onNavigationReady}>Lernstand & Sicherungen <span aria-hidden="true">→</span></LernLink>
        </nav>
        <p className={styles.hinweis}>Deine aktuelle Aufgabe bleibt geöffnet. Mit Escape schließt du dieses Menü.</p>
      </div>
    </div>
  </div>;
}
