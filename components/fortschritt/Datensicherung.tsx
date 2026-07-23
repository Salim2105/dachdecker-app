"use client";
import { useRef, useState } from "react";
import { exportiereDaten, importiereDaten } from "@/lib/backup";

// Lernstand als Datei sichern und wiederherstellen — schützt vor Datenverlust
// bei Gerätewechsel oder gelöschtem Cache (Fortschritt liegt nur im localStorage).
export function Datensicherung() {
  const dateiRef = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<{ text: string; ok: boolean } | null>(null);

  const sichern = () => {
    const blob = new Blob([exportiereDaten()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dachdecker-lernstand-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const laden = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    e.target.value = ""; // gleiche Datei später erneut wählbar
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => {
      const n = importiereDaten(String(leser.result));
      if (n === null) {
        setMeldung({ text: "Datei nicht erkannt. Nutze eine zuvor exportierte Sicherung.", ok: false });
        return;
      }
      setMeldung({ text: "Lernstand wiederhergestellt. Wird neu geladen …", ok: true });
      setTimeout(() => window.location.reload(), 900);
    };
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
      {meldung && (
        <p className="mt-2 text-xs" style={{ color: meldung.ok ? "var(--ok)" : "var(--bad)" }}>
          {meldung.text}
        </p>
      )}
    </div>
  );
}
