"use client";
import { useRef, useState } from "react";
import { exportiereArchiv, importiereArchiv, pruefeArchiv, type VollstaendigeSicherung } from "@/lib/backup";

export function Datensicherung() {
  const dateiRef = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<{ text: string; ok: boolean } | null>(null);
  const [beschaeftigt, setBeschaeftigt] = useState(false);
  const [vorschau, setVorschau] = useState<{ name: string; sicherung: VollstaendigeSicherung } | null>(null);

  const sichern = async () => {
    setBeschaeftigt(true);
    setMeldung(null);
    try {
      const bytes = await exportiereArchiv();
      const blob = new Blob([Uint8Array.from(bytes).buffer], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dachdecker-lernstand-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMeldung({ text: "Vollständige Sicherung mit Lernständen, Entwürfen, Zeichnungen und Fotos erstellt.", ok: true });
    } catch { setMeldung({ text: "Die Sicherung konnte nicht erstellt werden. Bitte prüfe den Gerätespeicher und versuche es erneut.", ok: false }); }
    finally { setBeschaeftigt(false); }
  };

  const laden = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    setVorschau(null);
    setMeldung(null);
    setBeschaeftigt(true);
    if (datei.size > 256 * 1024 * 1024) {
      setBeschaeftigt(false);
      setMeldung({ text: "Die Sicherung ist zu groß. Bitte eine Datei bis 256 MB auswählen.", ok: false });
      return;
    }
    const leser = new FileReader();
    leser.onload = () => {
      const sicherung = leser.result instanceof ArrayBuffer ? pruefeArchiv(new Uint8Array(leser.result)) : null;
      setBeschaeftigt(false);
      if (!sicherung || !sicherung.bereiche.length) {
        setMeldung({ text: "Keine gültige Sicherung erkannt. Deine bisherigen Daten bleiben erhalten.", ok: false });
        return;
      }
      setVorschau({ name: datei.name, sicherung });
    };
    leser.onerror = () => {
      setBeschaeftigt(false);
      setMeldung({ text: "Die Datei konnte nicht gelesen werden. Bitte wähle sie erneut aus.", ok: false });
    };
    leser.readAsArrayBuffer(datei);
  };

  const uebernehmen = async () => {
    if (!vorschau) return;
    setBeschaeftigt(true);
    setMeldung(null);
    try {
      await importiereArchiv(vorschau.sicherung);
      setVorschau(null);
      setMeldung({ text: "Lernstand wiederhergestellt. Wird neu geladen …", ok: true });
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setMeldung({ text: "Die Sicherung konnte nicht übernommen werden. Bitte prüfe den verfügbaren Speicher und versuche es erneut. Die bisherigen Daten bleiben erhalten.", ok: false });
    } finally { setBeschaeftigt(false); }
  };

  return (
    <div className="mt-10 border-t pt-4" style={{ borderColor: "var(--border)" }} aria-busy={beschaeftigt}>
      <h2 className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Datensicherung</h2>
      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
        Dein Lernstand liegt auf diesem Gerät. Die vollständige ZIP-Sicherung enthält auch laufende Prüfungen,
        Recheneingaben, Zeichnungen und Fotos. Alte JSON-Sicherungen kannst du weiterhin einlesen.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={beschaeftigt} onClick={sichern} className="min-h-11 flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Sichern (Export)</button>
        <button disabled={beschaeftigt} onClick={() => dateiRef.current?.click()} className="min-h-11 flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Wiederherstellen (Import)</button>
        <input aria-label="Sicherungsdatei auswählen" ref={dateiRef} type="file" accept="application/zip,.zip,application/json,.json" onChange={laden} className="hidden" />
      </div>
      {beschaeftigt && <p role="status" className="mt-2 text-sm">Sicherung wird verarbeitet …</p>}
      {vorschau && <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-medium">Sicherung prüfen: {vorschau.name}</h3>
        <p className="mt-2">Enthalten: {vorschau.sicherung.bereiche.join(", ")}. Diese Bereiche ersetzen beim Übernehmen die aktuellen Daten.</p>
        {vorschau.sicherung.version === 1 && Object.hasOwn(vorschau.sicherung.daten, "fortschritt-v1") && <p className="mt-2">Laufende Übungsrunden werden zurückgesetzt, damit sie zum wiederhergestellten Lernstand passen. Prüfungs- und Zeichenentwürfe bleiben erhalten.</p>}
        {vorschau.sicherung.version === 2 && <p className="mt-2">Prüfungen, Eingaben und Bilddateien aus dieser Sicherung werden gemeinsam wiederhergestellt. Andere Entwürfe bleiben erhalten.</p>}
        <p className="mt-2">Du kannst deinen jetzigen Stand vorher über „Sichern (Export)“ aufbewahren.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={beschaeftigt} className="min-h-11 rounded-lg border p-3 disabled:opacity-50" style={{ borderColor: "var(--border)" }} onClick={uebernehmen}>Sicherung übernehmen</button>
          <button disabled={beschaeftigt} className="min-h-11 p-3 underline" onClick={() => setVorschau(null)}>Abbrechen</button>
        </div>
      </div>}
      {meldung && <p role="status" className="mt-2 text-xs" style={{ color: meldung.ok ? "var(--ok)" : "var(--bad)" }}>{meldung.text}</p>}
    </div>
  );
}
