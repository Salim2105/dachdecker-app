"use client";
import { useId, useRef, useState } from "react";
import { flushStorage } from "@/lib/lernSpeicher";
import { wechsleLernziel } from "@/lib/lernNavigation";
import styles from "./ThemenSuche.module.css";

/** Small entry form: the complete content index is loaded only on /suche. */
export function ThemenSucheStart() {
  const id = useId();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  const pending = useRef(false);
  return <section className={styles.start} aria-label="Ein Thema finden">
    <form role="search" onSubmit={async event => {
      event.preventDefault();
      if (pending.current) return;
      pending.current = true; setBusy(true); setFehler("");
      try { await flushStorage(); wechsleLernziel(query.trim() ? `/suche?q=${encodeURIComponent(query.trim())}` : "/suche"); }
      catch { setFehler("Deine Eingaben konnten noch nicht dauerhaft gespeichert werden. Bitte prüfe den Speicherhinweis."); pending.current = false; setBusy(false); }
    }}>
      <label htmlFor={id}>Was möchtest du lernen?</label>
      <div className={styles.formRow}><input id={id} type="search" maxLength={180} value={query} onChange={e => setQuery(e.target.value)} placeholder="Zum Beispiel Flüssigkunststoff oder Ziegel schneiden" autoComplete="off" /><button type="submit" disabled={busy}>{busy ? "Öffnet …" : "Thema finden"}</button></div>
      <p>Erklärungen, Übungen und vorhandene Filme an einem Ort finden.</p>
      {fehler && <p role="alert">{fehler}</p>}
    </form>
  </section>;
}
