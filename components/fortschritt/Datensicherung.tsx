"use client";
import { useRef, useState } from "react";
import { exportiereDaten, importiereDaten, pruefeSicherung } from "@/lib/backup";

// Lernstand als Datei sichern und wiederherstellen — schützt vor Datenverlust
// bei Gerätewechsel oder gelöschtem Cache (Fortschritt liegt nur im localStorage).
export function Datensicherung() {
  const dateiRef = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<{ text: string; ok: boolean } | null>(null);
  const [vorschau, setVorschau] = useState<{ text: string; name: string; bereiche: string[]; rundenZuruecksetzen: boolean } | null>(null);

  const sichern = () => {
    try {
      const blob = new Blob([exportiereDaten()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dachdecker-lernstand-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setMeldung({ text: "Die Sicherung konnte nicht erstellt werden. Bitte versuche es erneut.", ok: false }); }
  };

  const laden = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    e.target.value = ""; // gleiche Datei später erneut wählbar
    if (!datei) return;
    setVorschau(null);
    setMeldung(null);
    const leser = new FileReader();
    leser.onload = () => {
      const text = String(leser.result);
      const sicherung = pruefeSicherung(text);
      if (!sicherung || !sicherung.bereiche.length) {
        setMeldung({ text: "Keine gültige Sicherung erkannt. Deine bisherigen Daten bleiben erhalten.", ok: false });
        return;
      }
      setVorschau({ text, name: datei.name, bereiche: sicherung.bereiche, rundenZuruecksetzen: Object.hasOwn(sicherung.daten, "fortschritt-v1") });
    };
    leser.onerror = () => setMeldung({ text: "Die Datei konnte nicht gelesen werden. Bitte wähle sie erneut aus.", ok: false });
    leser.readAsText(datei);
  };

  return (
    <div className="mt-10 border-t pt-4" style={{ borderColor: "var(--border)" }}>
      <h2 className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Datensicherung
      </h2>
      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
        Dein Lernstand liegt nur auf diesem Gerät. Sichere ihn als Datei — so kannst du ihn auf
        einem anderen Gerät oder nach dem Löschen des Speichers wiederherstellen.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={sichern}
          className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Sichern (Export)
        </button>
        <button
          onClick={() => dateiRef.current?.click()}
          className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Wiederherstellen (Import)
        </button>
        <input ref={dateiRef} type="file" accept="application/json,.json" onChange={laden} className="hidden" />
      </div>
      {vorschau && <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-medium">Sicherung prüfen: {vorschau.name}</h3>
        <p className="mt-2">Enthalten: {vorschau.bereiche.join(", ")}. Diese Bereiche ersetzen beim Übernehmen die aktuellen Daten.</p>
        {vorschau.rundenZuruecksetzen && <p className="mt-2">Laufende Übungsrunden werden zurückgesetzt, damit sie zum wiederhergestellten Lernstand passen.</p>}
        <p className="mt-2">Du kannst deinen jetzigen Stand vorher über „Sichern (Export)“ aufbewahren.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="min-h-11 rounded-lg border p-3" style={{ borderColor: "var(--border)" }} onClick={() => {
            const n = importiereDaten(vorschau.text);
            if (n === null) { setMeldung({ text: "Die Sicherung konnte nicht übernommen werden. Bitte prüfe den verfügbaren Speicher und versuche es erneut.", ok: false }); return; }
            setVorschau(null);
            setMeldung({ text: "Lernstand wiederhergestellt. Wird neu geladen …", ok: true });
            setTimeout(() => window.location.reload(), 900);
          }}>Sicherung übernehmen</button>
          <button className="min-h-11 p-3 underline" onClick={() => setVorschau(null)}>Abbrechen</button>
        </div>
      </div>}
      {meldung && (
        <p role="status" className="mt-2 text-xs" style={{ color: meldung.ok ? "var(--ok)" : "var(--bad)" }}>
          {meldung.text}
        </p>
      )}
    </div>
  );
}
