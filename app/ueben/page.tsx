"use client";
import { useState } from "react";
import { LernLink } from "@/components/LernLink";
import { Fortsetzen } from "@/components/Fortsetzen";
import { getLernfelder } from "@/lib/lernfelder";
import { appStorage } from "@/lib/lernSpeicher";
import { PracticeArtwork } from "@/components/practice/PracticeArtwork";

export default function UebenPage() {
  const felder = getLernfelder();
  const [lfId, setLfId] = useState(() => {
    const gespeichert = appStorage.getItem("letztesLf");
    return felder.find(lf => lf.id === gespeichert)?.id ?? felder[0].id;
  });
  const feld = felder.find(lf => lf.id === lfId)!;
  return <div>
    <header className="werkstatt-hero"><div><span className="eyebrow">WISSEN SELBST AUSPROBIEREN</span><h1>Quiz &amp; Aufgaben</h1><p>Wähle ein Lernfeld, einen Anhang oder WiSo. Übe einzelne Fragen ohne Prüfungsdruck und erhalte direkt eine Erklärung.</p></div><PracticeArtwork art="zuordnen" /></header>
    <div className="mt-6"><Fortsetzen /></div>
    <section className="werkstatt-karte mt-6" aria-labelledby="quiz-auswahl">
      <h2 id="quiz-auswahl">Was möchtest du üben?</h2>
      <label className="mt-5 block font-semibold" htmlFor="quiz-lernfeld">Lernbereich auswählen</label>
      <select id="quiz-lernfeld" className="mt-2 min-h-12 w-full rounded-xl border p-3" style={{borderColor:"var(--border)",background:"var(--surface)",color:"var(--text)"}} value={lfId} onChange={e=>setLfId(e.target.value)}>{felder.map(lf=><option key={lf.id} value={lf.id}>{lf.nr} · {lf.titel}</option>)}</select>
      <p className="mb-5">{feld.themen.length} Themen · Deine bisherigen Antworten bleiben erhalten.</p>
      <LernLink href={`/lernen/${lfId}/ueben`} className="hauptaktion">Aufgaben starten →</LernLink>
      <div><LernLink href={`/lernen/${lfId}`}>Zuerst die Erklärungen lesen →</LernLink></div>
    </section>
  </div>;
}
