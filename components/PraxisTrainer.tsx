"use client";
import { useState } from "react";
import { PRAXISFAELLE, pruefePraxisZahl, type PraxisFall } from "@/lib/praxis";
import { QuellenHinweis } from "@/components/QuellenHinweis";

export function PraxisTrainer() {
  const [id, setId] = useState(PRAXISFAELLE[0].id);
  const fall = PRAXISFAELLE.find((f) => f.id === id)!;
  return <div>
    <h1 className="text-[26px] font-semibold">Praxisfälle</h1>
    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Verbinde die Rechenschritte und begründe deine Entscheidung. Lösungen kommen erst nach deinem Versuch.</p>
    <label className="mt-4 block text-sm">Fall wählen
      <select value={id} onChange={(e) => setId(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border p-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {PRAXISFAELLE.map((f) => <option key={f.id} value={f.id}>{f.titel}</option>)}
      </select>
    </label>
    <Fall key={id} fall={fall} />
  </div>;
}

function Fall({ fall }: { fall: PraxisFall }) {
  const [eingaben, setEingaben] = useState<string[]>(fall.rechnungen.map(() => ""));
  const [begruendung, setBegruendung] = useState("");
  const [geprueft, setGeprueft] = useState(false);
  return <section className="mt-5">
    <h2 className="text-lg font-semibold">{fall.titel}</h2>
    <p className="mt-2 rounded-xl p-4 text-sm leading-relaxed" style={{ background: "var(--accent-soft)" }}>{fall.situation}</p>
    <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Zahlen ohne Tausendertrennzeichen eingeben; ein Dezimalkomma ist möglich.</p>
    {fall.rechnungen.map((r, i) => <div key={r.frage} className="mt-4">
      <label className="block text-sm">{i + 1}. {r.frage}
        <div className="mt-2 flex items-center gap-2">
          <input aria-label={r.frage} inputMode="decimal" value={eingaben[i]} disabled={geprueft}
            onChange={(e) => setEingaben((alt) => alt.map((v, j) => j === i ? e.target.value : v))}
            className="min-h-11 w-36 rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
          <span>{r.einheit}</span>
        </div>
      </label>
      {geprueft && <div className="mt-2 rounded-xl border p-3 text-sm" style={{ borderColor: pruefePraxisZahl(eingaben[i], r.ergebnis) ? "var(--ok)" : "var(--bad)" }}>
        <p className="font-semibold">{pruefePraxisZahl(eingaben[i], r.ergebnis) ? "Richtig" : "Noch einmal prüfen"}</p>
        <p className="mt-1">{r.loesungsweg}</p>
      </div>}
    </div>)}
    <label className="mt-5 block text-sm">{fall.entscheidung}
      <textarea value={begruendung} onChange={(e) => setBegruendung(e.target.value)} disabled={geprueft}
        className="mt-2 min-h-24 w-full rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
    </label>
    {!geprueft ? <button disabled={eingaben.some((v) => !v.trim()) || !begruendung.trim()} onClick={() => setGeprueft(true)}
      className="mt-4 min-h-14 w-full rounded-xl p-4 font-medium disabled:opacity-40" style={{ background: "var(--accent)", color: "var(--accent-text)" }}>Rechnung prüfen und Begründung vergleichen</button>
      : <div className="mt-4">
        <h3 className="font-semibold">Vergleiche deine Begründung</h3>
        <p className="mt-2 text-sm">{fall.muster}</p>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Nur die Zahlen werden automatisch geprüft. Deine Begründung vergleichst du selbst. Diese Übung wird nicht in den Lernstand eingerechnet.</p>
        <button onClick={() => { setGeprueft(false); setEingaben(fall.rechnungen.map(() => "")); setBegruendung(""); }}
          className="mt-4 min-h-11 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>Fall erneut bearbeiten</button>
      </div>}
    <QuellenHinweis quelle={fall.quelle} />
  </section>;
}
