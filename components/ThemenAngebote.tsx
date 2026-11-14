"use client";
import type { LernEinheit } from "@/lib/curriculum";
import { themenAngeboteFuer } from "@/lib/themenVerknuepfungen";
import { LernLink } from "@/components/LernLink";
import styles from "./ThemenAngebote.module.css";

export function ThemenAngebote({ einheit, onUeben }: { einheit: LernEinheit; onUeben: () => void }) {
  const angebote = themenAngeboteFuer(einheit);
  return <details className={styles.angebote}>
    <summary>Passend zu diesem Thema <span aria-hidden="true">＋</span></summary>
    <p>Wähle, wie du den Zusammenhang vertiefen möchtest.</p>
    <ul>
      {einheit.aufgabenIds.length > 0 && <li><button type="button" onClick={onUeben}><small>Übung</small><strong>Kontrollfragen üben</strong><span>{einheit.aufgabenIds.length} passende Aufgaben · Deine bisherigen Antworten bleiben erhalten.</span></button></li>}
      {angebote.map(a => <li key={`${a.art}:${a.id}`}><LernLink href={a.href}><small>{a.art}</small><strong>{a.titel}</strong><span>{a.beschreibung}</span></LernLink></li>)}
    </ul>
  </details>;
}
