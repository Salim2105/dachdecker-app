"use client";
import { useState, useSyncExternalStore } from "react";
import { PRAXISFAELLE, pruefePraxisZahl, type PraxisFall } from "@/lib/praxis";
import { QuellenHinweis } from "@/components/QuellenHinweis";
import { lesePraxis, leererPraxisStand, praxisStore, speicherePraxis, type PraxisStand } from "@/lib/praxisStore";

export function PraxisTrainer() {
  const [id, setId] = useState(PRAXISFAELLE[0].id);
  const gespeichert = useSyncExternalStore(praxisStore.subscribe, praxisStore.getSnapshot, praxisStore.getServerSnapshot);
  const staende = lesePraxis(gespeichert);
  const fall = PRAXISFAELLE.find((f) => f.id === id)!;
  const fertig = PRAXISFAELLE.filter((f) => staende[f.id]?.selbstBewertung).length;
  return <div>
    <h1 className="text-[26px] font-semibold">Praxisfälle</h1>
    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Verbinde die Rechenschritte und begründe deine Entscheidung. Lösungen kommen erst nach deinem Versuch.</p>
    <p className="mt-2 text-sm">{fertig} von {PRAXISFAELLE.length} Fällen gerechnet und selbst eingeschätzt. Deine Eingaben bleiben auf diesem Gerät erhalten und werden mit der Datensicherung exportiert.</p>
    <label className="mt-4 block text-sm">Fall wählen
      <select value={id} onChange={(e) => setId(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border p-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {PRAXISFAELLE.map((f) => <option key={f.id} value={f.id}>{f.titel}{staende[f.id]?.selbstBewertung ? " · Bearbeitet" : ""}</option>)}
      </select>
    </label>
    <Fall key={id} fall={fall} stand={staende[id] ?? leererPraxisStand(fall)} />
  </div>;
}

function Fall({ fall, stand }: { fall: PraxisFall; stand: PraxisStand }) {
  const { eingaben, begruendung, geprueft } = stand;
  const [tipps, setTipps] = useState<number[]>([]);
  const aktualisiere = (werte: Partial<PraxisStand>) => speicherePraxis(fall.id, { ...stand, ...werte });
  return <section className="mt-5">
    <h2 className="text-lg font-semibold">{fall.titel}</h2>
    <p className="mt-2 rounded-xl p-4 text-sm leading-relaxed" style={{ background: "var(--accent-soft)" }}>{fall.situation}</p>
    <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Zahlen ohne Tausendertrennzeichen eingeben; ein Dezimalkomma ist möglich.</p>
    {fall.rechnungen.map((r, i) => <div key={r.frage} className="mt-4">
      <label className="block text-sm">{i + 1}. {r.frage}
        <div className="mt-2 flex items-center gap-2">
          <input aria-label={r.frage} inputMode="decimal" value={eingaben[i]} disabled={geprueft}
            onChange={(e) => aktualisiere({ eingaben: eingaben.map((v, j) => j === i ? e.target.value : v) })}
            className="min-h-11 w-36 rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
          <span>{r.einheit}</span>
        </div>
      </label>
      {!geprueft && r.tipp && <div className="mt-2 text-sm">
        <button aria-expanded={tipps.includes(i)} onClick={() => {
          setTipps((alt) => alt.includes(i) ? alt.filter((n) => n !== i) : [...alt, i]);
          aktualisiere({ mitHilfe: true });
        }} className="min-h-11 underline" style={{ color: "var(--accent)" }}>Tipp zu Schritt {i + 1}</button>
        {tipps.includes(i) && <p>{r.tipp}</p>}
      </div>}
      {geprueft && <div className="mt-2 rounded-xl border p-3 text-sm" style={{ borderColor: pruefePraxisZahl(eingaben[i], r.ergebnis) ? "var(--ok)" : "var(--bad)" }}>
        <p className="font-semibold">{pruefePraxisZahl(eingaben[i], r.ergebnis) ? "Richtig" : "Noch einmal prüfen"}</p>
        <p className="mt-1">{r.loesungsweg}</p>
      </div>}
    </div>)}
    <label className="mt-5 block text-sm">{fall.entscheidung}
      <textarea value={begruendung} onChange={(e) => aktualisiere({ begruendung: e.target.value })} disabled={geprueft}
        className="mt-2 min-h-24 w-full rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
    </label>
    {!geprueft ? <button disabled={eingaben.some((v) => !v.trim()) || !begruendung.trim()} onClick={() => aktualisiere({ geprueft: true })}
      className="mt-4 min-h-14 w-full rounded-xl p-4 font-medium disabled:opacity-40" style={{ background: "var(--accent)", color: "var(--accent-text)" }}>Rechnung prüfen und Begründung vergleichen</button>
      : <div className="mt-4">
        <h3 className="font-semibold">Vergleiche deine Begründung</h3>
        <p className="mt-2 text-sm">{fall.muster}</p>
        <p className="mt-3 text-sm font-medium">Wie gut passt deine Begründung zur Musterantwort?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {([ ["richtig", "Passt"], ["teilweise", "Teilweise"], ["falsch", "Noch üben"] ] as const).map(([wert, titel]) =>
            <button key={wert} aria-pressed={stand.selbstBewertung === wert} onClick={() => aktualisiere({ selbstBewertung: wert })}
              className="min-h-11 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", background: stand.selbstBewertung === wert ? "var(--accent-soft)" : "var(--surface)" }}>{titel}</button>)}
        </div>
        {fall.merksatz && <p className="mt-3 rounded-xl p-3 text-sm" style={{ background: "var(--accent-soft)" }}><strong>Merke: </strong>{fall.merksatz}</p>}
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Nur die Zahlen werden automatisch geprüft. Deine Begründung ist eine Selbsteinschätzung.{stand.mitHilfe ? " Du hast einen Tipp genutzt." : " Du hast keinen Tipp genutzt."} Diese Übung wird getrennt vom Lernstand der Aufgaben gespeichert.</p>
        <button onClick={() => { speicherePraxis(fall.id, leererPraxisStand(fall)); setTipps([]); }}
          className="mt-4 min-h-11 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>Fall erneut bearbeiten</button>
      </div>}
    <QuellenHinweis quelle={fall.quelle} />
  </section>;
}
