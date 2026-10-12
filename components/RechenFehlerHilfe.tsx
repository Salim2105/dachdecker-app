"use client";
import { useState } from "react";
import type { RechenFeedback } from "@/lib/rechenFeedback";
import { pruefePraxisZahl } from "@/lib/praxis";
import { leseDezimalzahl } from "@/lib/zahlen";

export function RechenFehlerHilfe({ feedback }: { feedback: RechenFeedback }) {
  const [eingabe, setEingabe] = useState("");
  const [geprueft, setGeprueft] = useState(false);
  const [loesungOffen, setLoesungOffen] = useState(false);
  const u = feedback.uebung;
  const richtig = u && geprueft && pruefePraxisZahl(eingabe, u.ergebnis);
  return <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: "var(--accent-soft)" }}>
    <p className="font-semibold">{feedback.titel}</p>
    <p className="mt-1 leading-relaxed">{feedback.hinweis}</p>
    {u && <details className="mt-3">
      <summary className="min-h-11 cursor-pointer py-2 font-medium">Das gezielt üben</summary>
      <p className="mt-2">{u.frage}</p>
      <label className="mt-2 block">Dein Ergebnis für die kurze Übung
        <div className="mt-2 flex items-center gap-2">
          <input inputMode="decimal" value={eingabe} disabled={richtig === true}
            onChange={(e) => { setEingabe(e.target.value); setGeprueft(false); setLoesungOffen(false); }}
            className="min-h-11 w-28 rounded-lg border p-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
          <span>{u.einheit}</span>
        </div>
      </label>
      {richtig ? <p role="status" className="mt-2 font-medium">Richtig — diesen Rechenschritt hast du angewendet.</p> : <>
        <button disabled={leseDezimalzahl(eingabe) === null} onClick={() => setGeprueft(true)}
          className="mt-2 min-h-11 rounded-lg border p-2 disabled:opacity-40" style={{ borderColor: "var(--border)" }}>Kurze Übung prüfen</button>
        {geprueft && <p role="status" className="mt-2">Das passt noch nicht. Prüfe deinen Rechenweg und versuche es erneut.</p>}
      </>}
      {geprueft && !richtig && <button onClick={() => setLoesungOffen(true)} className="mt-2 min-h-11 underline">Lösungsweg der kurzen Übung ansehen</button>}
      {(richtig || loesungOffen) && <p className="mt-2 leading-relaxed">{u.loesungsweg}</p>}
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Diese kurze Übung dient der Nacharbeit und zählt nicht als langfristiger Wissensnachweis.</p>
    </details>}
  </div>;
}
