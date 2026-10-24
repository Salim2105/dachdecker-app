"use client";
import { useState } from "react";
import Link from "next/link";
import { PracticeArtwork, type PracticeArt } from "@/components/practice/PracticeArtwork";
import { ladeLernsignale, lernEmpfehlungen } from "@/lib/lerndiagnose";
import styles from "./GrundlagenEntdecken.module.css";
import { Arrow } from "@/components/design/Arrow";

const BEREICHE: { href: string; titel: string; text: string; aktion: string; art: PracticeArt; ton: string }[] = [
  { href: "/grundlagen/mathe", titel: "Zahlen werden Werkzeug.", text: "Einheiten, Prozent und Dachflächen. Rechne selbst und decke genau die Hilfe auf, die du brauchst.", aktion: "Fachmathe entdecken", art: "rechnen", ton: "violet" },
  { href: "/sprache/deutsch", titel: "Auftrag verstanden.", text: "Arbeitsaufträge lesen, dein Handwerk erklären und einen verständlichen Bericht schreiben.", aktion: "Deutsch fürs Handwerk", art: "begriffe", ton: "teal" },
  { href: "/sprache/englisch", titel: "Let's build your English.", text: "Werkzeug benennen, Maße verstehen und auf der Baustelle sicher nachfragen.", aktion: "Baustellenenglisch üben", art: "baustelle", ton: "orange" },
];

export function GrundlagenEntdecken() {
  const [empfehlungen] = useState(() => lernEmpfehlungen(ladeLernsignale()).slice(0, 2));
  return <section className={styles.bereich} aria-labelledby="grundlagen-titel">
    <div className={styles.kopf}><div><span>DEIN FUNDAMENT WÄCHST MIT</span><h2 id="grundlagen-titel">Verstehen. Rechnen. Mitreden.</h2></div><Link href="/lernhilfe">Was hilft mir gerade? →</Link></div>
    {empfehlungen.length > 0 && <div className={styles.hinweise} aria-label="Persönliche Übungshinweise">{empfehlungen.map((e) => <Link key={e.route + e.kategorie} href={e.route}><strong>{e.titel} →</strong><span>{e.grund}</span></Link>)}</div>}
    <div className={styles.karten}>{BEREICHE.map((b) => <Link key={b.href} href={b.href} className={styles.karte} style={{ "--karten-tint": `var(--tint-${b.ton})`, "--karten-ink": `var(--on-tint-${b.ton})` } as React.CSSProperties}>
      <div className={styles.bild}><PracticeArtwork art={b.art} compact /></div><div className={styles.text}><h3>{b.titel}</h3><p>{b.text}</p><span>{b.aktion} <Arrow /></span></div>
    </Link>)}</div>
  </section>;
}
