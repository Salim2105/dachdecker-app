"use client";
import Link from "next/link";
import { useWerkzeug } from "@/components/AppShell";
import { Fortsetzen } from "@/components/Fortsetzen";
import { getLernfelder } from "@/lib/lernfelder";

export default function Uebungsraum() {
  const { oeffnen } = useWerkzeug();
  return <div>
    <h1>Dein Übungsraum</h1>
    <p className="mt-3 mb-6" style={{ color: "var(--text-muted)" }}>Ausprobieren, vergleichen und aus Fehlern lernen. Wähle die Übung, die dir gerade weiterhilft.</p>
    <Fortsetzen />
    <div className="werkstatt-raster mt-5">
      <section className="werkstatt-karte"><h2>Kleine Aufgaben, klare Ziele</h2><p>Ordne Bauteile und Einheiten zu, bringe Schritte in die richtige Reihenfolge und triff Entscheidungen für eine Baustelle.</p><Link href="/lernen/lf07">Aktiv in LF7 üben →</Link></section>
      <section className="werkstatt-karte"><h2>Zeichnen und vergleichen</h2><p>Direkt auf der Zeichenfläche oder auf Papier mit Foto. Vergleiche deine Lösung anhand sichtbarer Kriterien.</p><Link href="/zeichnen">Zeichenwerkstatt öffnen →</Link></section>
      <section className="werkstatt-karte"><h2>Fachbegriffe verstehen</h2><p>Eine einfache Erklärung, die Fachdefinition und ein Beispiel von der Baustelle. Auch neben deiner Aufgabe verfügbar.</p><button className="link" onClick={() => oeffnen("glossar")}>Begriffshilfe öffnen →</button></section>
      <section className="werkstatt-karte"><h2>Rechenwege verstehen</h2><p>Skizze, Formel, eingesetzte Werte und Ergebnis mit Einheit. Deine Eingaben bleiben beim Wechsel erhalten.</p><button className="link" onClick={() => oeffnen("rechner")}>Rechner daneben öffnen →</button></section>
      <section className="werkstatt-karte"><h2>Baustellenfälle</h2><p>Verbinde Material, Arbeitsschritte und Sicherheit zu einer nachvollziehbaren Entscheidung.</p><Link href="/praxis">Praxisfälle bearbeiten →</Link></section>
      <section className="werkstatt-karte"><h2>Fehler gezielt nacharbeiten</h2><p>Die Tagesrunde greift unsichere und fällige Aufgaben auf. Am Ende kannst du deine Fehler nochmals bearbeiten.</p><Link href="/heute">Persönliche Wiederholung →</Link></section>
    </div>
    <section className="werkstatt-karte mt-6"><h2>Ein Lernfeld gezielt üben</h2><label className="mt-3 block">Lernfeld auswählen<select aria-label="Lernfeld zum Üben" defaultValue="" className="mt-2 block w-full rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} onChange={(e) => { if (e.target.value) window.location.assign(`/lernen/${e.target.value}/ueben`); }}><option value="" disabled>Bitte wählen</option>{getLernfelder().map((lf) => <option key={lf.id} value={lf.id}>{lf.nr} · {lf.titel}</option>)}</select></label></section>
  </div>;
}
