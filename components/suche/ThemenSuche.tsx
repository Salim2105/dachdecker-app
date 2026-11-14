"use client";
import { useDeferredValue, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { LernLink } from "@/components/LernLink";
import { sucheThemen, THEMEN_ARTEN, type ThemenArt } from "@/lib/themenSuche";
import styles from "./ThemenSuche.module.css";

const subscribe = (change: () => void) => { window.addEventListener("popstate", change); window.addEventListener("dachdecker:suche", change); return () => { window.removeEventListener("popstate", change); window.removeEventListener("dachdecker:suche", change); }; };
const snapshot = () => window.location.search;
const serverSnapshot = () => "";
const beispiele = ["Flüssigkunststoff", "Ziegel schneiden", "Latten einteilen", "Kehle"];
const portion = 12;

export function ThemenSuche() {
  const id = useId();
  const eingabe = useRef<HTMLInputElement>(null), liste = useRef<HTMLOListElement>(null);
  const adresse = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const params = new URLSearchParams(adresse);
  const gespeichert = params.get("q")?.slice(0, 180) ?? "";
  const vorgabeArt = params.get("art");
  const art: ThemenArt | "alle" = vorgabeArt && Object.hasOwn(THEMEN_ARTEN, vorgabeArt) ? vorgabeArt as ThemenArt : "alle";
  const [entwurf, setEntwurf] = useState({ adresse, query: gespeichert });
  const inBearbeitung = useRef(false);
  useEffect(() => { const zurueck = () => { inBearbeitung.current = false; }; window.addEventListener("popstate", zurueck); return () => window.removeEventListener("popstate", zurueck); }, []);
  const query = entwurf.adresse === adresse ? entwurf.query : gespeichert;
  const langsam = useDeferredValue(query);
  const alle = sucheThemen(langsam), treffer = art === "alle" ? alle : alle.filter(t => t.art === art);
  const [menge, setMenge] = useState({ schluessel: "", anzahl: portion });
  const schluessel = `${langsam}:${art}`;
  const anzahl = menge.schluessel === schluessel ? menge.anzahl : portion;
  function suchen(text: string, filter: ThemenArt | "alle" = art, push = false) {
    const search = new URLSearchParams();
    if (text.trim()) search.set("q", text.trim().slice(0, 180));
    if (filter !== "alle") search.set("art", filter);
    const ziel = `/suche${search.size ? `?${search}` : ""}`;
    window.history[push ? "pushState" : "replaceState"](null, "", ziel);
    window.dispatchEvent(new Event("dachdecker:suche"));
    setEntwurf({ adresse: window.location.search, query: text.slice(0, 180) });
  }
  return <div className={styles.page}>
    <header><span className={styles.eyebrow}>DEIN THEMA, DIREKT GEFUNDEN</span><h1>Was möchtest du lernen?</h1><p>Suche nach einem Fachwort oder einer Tätigkeit. Öffne die passende Erklärung, Übung oder einen vorhandenen Film.</p></header>
    <form role="search" className={styles.search} onSubmit={e => { e.preventDefault(); suchen(query, art); inBearbeitung.current = false; }}>
      <label htmlFor={id}>Was möchtest du lernen?</label>
      <div className={styles.formRow}><input ref={eingabe} id={id} type="search" maxLength={180} value={query} autoComplete="off" placeholder="Zum Beispiel Flüssigkunststoff oder Ziegel schneiden" onChange={e => { suchen(e.target.value, art, !inBearbeitung.current); inBearbeitung.current = true; }} /><button type="submit">Suchen</button></div>
    </form>
    {!query.trim() || query.trim().length < 2 ? <section className={styles.examples} aria-label="Beispielthemen"><h2>Womit möchtest du anfangen?</h2><p>Gib mindestens zwei Zeichen ein oder wähle ein Beispiel.</p><div>{beispiele.map(b => <button type="button" key={b} onClick={() => { suchen(b, "alle", true); inBearbeitung.current = false; eingabe.current?.focus(); }}>{b}</button>)}</div></section> : <>
      <fieldset className={styles.filters}><legend>Treffer eingrenzen</legend><div><button type="button" aria-pressed={art === "alle"} onClick={() => suchen(query, "alle", true)}>Alle ({alle.length})</button>{(Object.entries(THEMEN_ARTEN) as [ThemenArt, string][]).map(([key, label]) => {
        const count = alle.filter(t => t.art === key).length;
        return count || art === key ? <button type="button" key={key} aria-pressed={art === key} onClick={() => suchen(query, key, true)}>{label} ({count})</button> : null;
      })}</div></fieldset>
      <p className={styles.count} role="status" aria-live="polite">{query !== langsam ? "Suche läuft …" : `${treffer.length} Treffer für „${query.trim()}“${art !== "alle" ? ` · ${THEMEN_ARTEN[art]}` : ""}`}</p>
      {treffer.length ? <><ol ref={liste} className={styles.results} aria-label="Gefundene Lernangebote">{treffer.slice(0, anzahl).map(t => <li key={t.id}><LernLink href={t.href} aria-label={`${THEMEN_ARTEN[t.art]}: ${t.titel}`}><span className={styles.resultMeta}><strong>{THEMEN_ARTEN[t.art]}</strong><span>{t.bereich}</span></span><span className={styles.resultTitle}>{t.titel}</span><span className={styles.description}>{t.beschreibung}</span><span className={styles.open}>Öffnen <span aria-hidden="true">→</span></span></LernLink></li>)}</ol>{treffer.length > anzahl && <button className={styles.more} type="button" onClick={() => { setMenge({ schluessel, anzahl: anzahl + portion }); requestAnimationFrame(() => liste.current?.querySelectorAll<HTMLAnchorElement>("li > a")[anzahl]?.focus()); }}>Weitere {Math.min(portion, treffer.length - anzahl)} Treffer anzeigen</button>}</> : <section className={styles.empty}><h2>Hierzu gibt es noch keinen passenden Treffer.</h2><p>Versuche ein kürzeres Fachwort, eine andere Schreibweise oder eine Tätigkeit wie „anzeichnen“.</p>{art !== "alle" && <button type="button" onClick={() => suchen(query, "alle", true)}>In allen Lernangeboten suchen</button>}<LernLink href="/lernen">Lernfelder durchsehen →</LernLink></section>}
    </>}
    <p className={styles.hint}>Die Suche funktioniert mit den auf deinem Gerät verfügbaren App-Inhalten. Größere Modelle und Filme kannst du in ihrem jeweiligen Bereich zusätzlich offline speichern.</p>
  </div>;
}
