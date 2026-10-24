"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LernzeitWahl } from "@/components/LernzeitWahl";
import { useProgress } from "@/components/useProgress";
import { Fortsetzen } from "@/components/Fortsetzen";
import { datumStore, lernzeitStore } from "@/lib/appStores";
import { serie } from "@/lib/serie";
import { pruefungsreife } from "@/lib/reifegrad";
import { appStorage } from "@/lib/lernSpeicher";

export default function Home() {
  const { fortschritt } = useProgress();
  const datum = useSyncExternalStore(datumStore.subscribe, datumStore.getSnapshot, datumStore.getServerSnapshot);
  const minuten = useSyncExternalStore(lernzeitStore.subscribe, lernzeitStore.getSnapshot, lernzeitStore.getServerSnapshot);
  const [now] = useState(() => Date.now());
  const [letzteEinheit] = useState(() => {
    try { const s = JSON.parse(appStorage.getItem("lernwerkstatt-zuletzt") || "null"); return s && typeof s.lfId === "string" ? s : null; } catch { return null; }
  });
  const stand = pruefungsreife(fortschritt, now);
  const tage = serie(fortschritt, now);
  const hatStand = Object.keys(fortschritt).length > 0 || letzteEinheit;
  const ziel = letzteEinheit ? `/lernen/${letzteEinheit.lfId}${typeof letzteEinheit.unitId === "string" ? `#${letzteEinheit.unitId}` : ""}` : hatStand ? "/heute" : "/lernen/lf07";
  const tageBis = datum ? Math.ceil((new Date(datum + "T00:00:00").getTime() - now) / 86400000) : null;
  return <div>
    <section className="werkstatt-hero" aria-labelledby="willkommen">
      <div>
        <p className="eyebrow">DEINE DACHDECKER-LERNWERKSTATT</p>
        <h1 id="willkommen">Ein kleiner Schritt.<br />Ein Stück mehr Können.</h1>
        <p>{stand.faellig ? `${stand.faellig} Aufgaben warten auf eine Wiederholung. Wir stellen dir eine überschaubare Runde zusammen.` : "Verstehe einen Zusammenhang, probiere ihn selbst aus und wende ihn auf der Baustelle an."}</p>
        <Link className="hauptaktion mt-6" href={ziel}>{hatStand ? "Weiterlernen" : "Mit LF7 starten"} <span className="ml-3" aria-hidden="true">→</span></Link>
        <p className="text-sm">{hatStand ? `Dein Tagesziel: ${minuten} Minuten. Pausen sind jederzeit möglich.` : "Dachentwässerung · sechs Kapitel · kurze Einheiten"}</p>
      </div>
      <svg viewBox="0 0 200 180" width="180" height="180" fill="none" aria-hidden="true">
        <path d="M14 91L101 22l85 69M29 87v70h142V87M101 23v134M42 68l129 64M72 45l99 49M143 54L29 111M173 78L29 150" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 102h25v49c0 9 9 12 16 12" stroke="var(--ok)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="157" cy="143" r="26" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" /><path d="M145 144l8 8 16-18" stroke="var(--ok)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </section>
    <div className="statistik-zeile"><span><strong>{stand.faellig}</strong> Wiederholungen fällig</span><span><strong>{Object.keys(fortschritt).length}</strong> Aufgaben schon bearbeitet</span>{tage >= 2 && <span><strong>{tage}</strong> Lerntage in Folge</span>}</div>
    <Fortsetzen />
    <div className="werkstatt-kopfzeile"><h2>Dein nächster Lernschritt</h2><Link href="/heute" className="text-sm underline" style={{ color: "var(--accent)" }}>Heutige Aufgaben ansehen →</Link></div>
    <div className="werkstatt-raster">
      <section className="werkstatt-karte"><h3>Heute in deinem Tempo</h3><p>Fällige Aufgaben zuerst, danach etwas Neues. Antworten und verwendete Hilfen bestimmen die nächste Wiederholung.</p><div className="mt-4"><LernzeitWahl /></div><Link href="/heute">Tagesempfehlung öffnen →</Link></section>
      <section className="werkstatt-karte"><span className="text-sm" style={{ color: "var(--accent)" }}>LF7 · Dachentwässerung</span><h3 className="mt-2">Dem Wasser auf der Spur</h3><p>Vom Wasserweg über die Materialwahl bis zum Projekt. 18 kurze Einheiten mit Kontrollaufgaben und Baustellenfällen.</p><Link href="/lernen/lf07">Kapitel entdecken →</Link></section>
    </div>
    <div className="werkstatt-kopfzeile"><h2>Aus Wissen wird Praxis</h2></div>
    <div className="werkstatt-raster">
      <section className="werkstatt-karte"><h3>Etwas selbst ausprobieren</h3><p>Bauteile zuordnen, Abläufe ordnen, Fehler erkennen oder eine Zeichnung anfertigen.</p><Link href="/ueben">Zum Übungsraum →</Link></section>
      <section className="werkstatt-karte"><h3>Deinen Stand einschätzen</h3><p>Grundlagen, Anwendung oder prüfungsnah trainieren. Danach siehst du, welche Themen du gezielt üben kannst.</p><Link href="/pruefung">Zum Prüfungsraum →</Link></section>
    </div>
    <details className="mt-7 werkstatt-karte"><summary className="cursor-pointer font-semibold">Prüfungstermin und Lernstand</summary><div className="mt-4"><label className="block">Mein Prüfungstermin<input type="date" value={datum} onChange={(e) => datumStore.set(e.target.value)} className="mt-2 block rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} /></label>{tageBis !== null && <p>{tageBis >= 0 ? `Noch ${tageBis} Tage bis zu deinem Termin.` : "Dein gespeicherter Prüfungstermin liegt in der Vergangenheit."}</p>}<Link href="/fortschritt">Fortschritt, Einstellungen & Datensicherung →</Link></div></details>
  </div>;
}
