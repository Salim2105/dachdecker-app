"use client";
import Link from "next/link";
import { useWerkzeug } from "@/components/AppShell";
import { Fortsetzen } from "@/components/Fortsetzen";
import { getLernfelder } from "@/lib/lernfelder";
import { PracticeArtwork, type PracticeArt } from "@/components/practice/PracticeArtwork";
import { GrundlagenEntdecken } from "@/components/GrundlagenEntdecken";

const AKTIVITAETEN: { art: PracticeArt; titel: string; text: string; farbe: string; label: string; aktion: string; href?: string; tool?: "glossar" | "rechner" }[] = [
  { art: "zuordnen", titel: "Kleine Aufgaben, große Aha-Momente", text: "Bauteile zuordnen, Abläufe sortieren und Fehler in Skizzen entdecken. In allen Lernfeldern.", farbe: "#f2e5ff", label: "ZUORDNEN & ENTDECKEN", aktion: "Lernfeld und Aktivität wählen →", href: "/lernen" },
  { art: "zeichnen", titel: "Zeichnen und vergleichen", text: "Von der ersten Linie zur Dachskizze. Digital oder mit deinem Papierfoto.", farbe: "#ffe6cb", label: "DEINE ZEICHENWERKSTATT", aktion: "Zeichenwerkstatt öffnen →", href: "/zeichnen" },
  { art: "begriffe", titel: "Fachbegriffe verstehen", text: "Aus komplizierten Wörtern werden verständliche Beispiele von der Baustelle.", farbe: "#d9f0e9", label: "KURZ ERKLÄRT", aktion: "Begriffshilfe öffnen →", tool: "glossar" },
  { art: "rechnen", titel: "Rechenwege verstehen", text: "Eine Skizze, deine Werte und der Weg zum Ergebnis. Schritt für Schritt.", farbe: "#e6e2fb", label: "FORMELN AUSPROBIEREN", aktion: "Rechner daneben öffnen →", tool: "rechner" },
  { art: "baustelle", titel: "Ab auf die Baustelle", text: "Welche Lösung passt? Verbinde Material, Arbeitsschritte und Sicherheit.", farbe: "#fbe1d9", label: "PRAXISFÄLLE LÖSEN", aktion: "Praxisfälle bearbeiten →", href: "/praxis" },
  { art: "wiederholen", titel: "Aus Fehlern wird Können", text: "Deine Antworten und genutzten Hilfen zeigen, welcher Lernschritt dir weiterhelfen könnte.", farbe: "#f5edc8", label: "GEZIELT WIEDERHOLEN", aktion: "Persönliche Übungshinweise →", href: "/lernhilfe" },
];

export default function Uebungsraum() {
  const { oeffnen } = useWerkzeug();
  return <div>
    <section className="relative mb-7 overflow-hidden rounded-[28px] p-6 sm:p-8" style={{ background: "var(--ink, #172c39)", color: "#fff9f0" }}>
      <div className="absolute -right-12 -top-16 h-60 w-60 rounded-full" style={{ background: "#f4ad6b", opacity: .13 }} />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-xl"><span className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wider" style={{ borderColor: "#65738a", color: "#ffd39a" }}>WISSEN IN BEWEGUNG</span><h1 style={{ color: "#fff9f0" }}>Dein Übungsraum</h1><p className="mt-3 max-w-lg leading-relaxed" style={{ color: "#dce5f3" }}>Hier wird aus Verstehen Selbermachen. Such dir eine Herausforderung aus und probiere dich aus.</p></div>
        <div className="shrink-0 rounded-2xl px-5 py-2" style={{ background: "#ffe6cb" }}><PracticeArtwork art="zuordnen" compact /></div>
      </div>
    </section>
    <Fortsetzen />
    <div className="mb-4 mt-7 flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-semibold tracking-tight">Worauf hast du Lust?</h2><p className="text-sm" style={{ color: "var(--text-muted)" }}>Sechs Wege, aktiv zu lernen</p></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {AKTIVITAETEN.map((a) => <section key={a.art} className="group flex min-w-0 flex-col overflow-hidden rounded-[24px] border transition-transform motion-safe:hover:-translate-y-1" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 5px 0 color-mix(in srgb, var(--border) 55%, transparent)" }}>
        <div className="relative flex min-h-44 items-center justify-center overflow-hidden px-5 py-2" style={{ background: a.farbe }}><span className="absolute left-4 top-3 text-[11px] font-bold tracking-[.1em]" style={{ color: "#43506b" }}>{a.label}</span><div className="mt-4"><PracticeArtwork art={a.art} /></div></div>
        <div className="flex flex-1 flex-col p-5"><h2 className="text-xl font-semibold leading-snug">{a.titel}</h2><p className="mb-5 mt-2 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{a.text}</p>
          {a.href ? <Link href={a.href} className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold" style={{ color: "#24344e", background: a.farbe }}>{a.aktion}</Link> : <button className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold" style={{ color: "#24344e", background: a.farbe }} onClick={() => oeffnen(a.tool!)}>{a.aktion}</button>}
        </div>
      </section>)}
    </div>
    <section className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[24px] border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}><div className="min-w-0 flex-1"><span className="text-xs font-bold tracking-wider" style={{ color: "var(--accent)" }}>DEIN THEMA, DEIN TEMPO</span><h2 className="mt-1 text-xl font-semibold">Ein Lernfeld gezielt üben</h2><p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Du weißt schon, was du vertiefen möchtest? Spring direkt zu den Aufgaben.</p></div><label className="block w-full min-w-0 sm:max-w-sm"><span className="text-sm font-semibold">Lernfeld auswählen</span><select aria-label="Lernfeld zum Üben" defaultValue="" className="mt-2 min-h-12 w-full rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} onChange={(e) => { if (e.target.value) window.location.assign(`/lernen/${e.target.value}/ueben`); }}><option value="" disabled>Bitte wählen</option>{getLernfelder().map((lf) => <option key={lf.id} value={lf.id}>{lf.nr} · {lf.titel}</option>)}</select></label></section>
    <GrundlagenEntdecken />
    <p className="mt-8 text-sm" style={{color:"var(--text-muted)"}}>Du erprobst die App mit Azubis? <Link href="/erprobung" className="underline">Beobachtungsbogen öffnen →</Link></p>
  </div>;
}
