"use client";
import { SafeSvg } from "@/components/SafeSvg";
import { bewerteAktivitaet, istAktivitaetVollstaendig, mischeAnzeige, type Aktivitaet, type AktivitaetAntwort } from "@/lib/aktivitaeten";

export function AktivitaetsKarte({ aktivitaet: a, antwort, geprueft, onChange, onPruefen }: {
  aktivitaet: Aktivitaet; antwort: AktivitaetAntwort; geprueft: boolean;
  onChange: (antwort: AktivitaetAntwort) => void; onPruefen: () => void;
}) {
  const stil = { borderColor: "var(--border)", background: "var(--surface)" };
  const ergebnis = geprueft ? bewerteAktivitaet(a, antwort) : null;
  function verschiebe(index: number, delta: number) {
    const neu = [...antwort.reihenfolge];
    [neu[index], neu[index + delta]] = [neu[index + delta], neu[index]];
    onChange({ ...antwort, reihenfolge: neu });
  }
  return <section className="werkstatt-karte" aria-label={a.titel}>
    <h3>{a.titel}</h3><p>{a.auftrag}</p>
    {a.typ === "zuordnen" ? <div className="mt-5 space-y-4">{a.paare.map((p) => <label key={p.id} className="block"><span className="font-semibold">{p.links}</span><select className="mt-2 min-h-12 w-full rounded-xl border p-3" style={stil} value={antwort.zuordnung[p.id] ?? ""} disabled={geprueft} onChange={(e) => onChange({ ...antwort, zuordnung: { ...antwort.zuordnung, [p.id]: e.target.value } })}><option value="">Bedeutung wählen</option>{mischeAnzeige(a.paare, `${a.id}:zuordnung`).map((ziel) => <option key={ziel.id} value={ziel.id}>{ziel.rechts}</option>)}</select></label>)}</div>
    : a.typ === "reihenfolge" ? <ol className="mt-5 space-y-3">{antwort.reihenfolge.map((id, index) => <li key={id} className="flex items-center gap-3 rounded-xl border p-3" style={stil}><span className="flex-1">{index + 1}. {a.schritte.find((s) => s.id === id)?.text}</span><button className="min-h-11 min-w-11 rounded-lg border" aria-label={`Schritt ${index + 1} nach oben`} disabled={geprueft || index === 0} onClick={() => verschiebe(index, -1)}>↑</button><button className="min-h-11 min-w-11 rounded-lg border" aria-label={`Schritt ${index + 1} nach unten`} disabled={geprueft || index === antwort.reihenfolge.length - 1} onClick={() => verschiebe(index, 1)}>↓</button></li>)}</ol>
    : <><p className="mt-4">{a.situation}</p>{a.svg && <SafeSvg markup={a.svg} className="my-5" />}<fieldset className="mt-4 space-y-3"><legend className="sr-only">Passende Aussagen auswählen</legend>{mischeAnzeige(a.optionen, `${a.id}:auswahl`).map((o) => <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3" style={stil}><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={antwort.auswahl.includes(o.id)} disabled={geprueft} onChange={(e) => onChange({ ...antwort, auswahl: e.target.checked ? [...antwort.auswahl, o.id] : antwort.auswahl.filter((id) => id !== o.id) })} /><span>{o.text}</span></label>)}</fieldset></>}
    {!geprueft ? <button className="hauptaktion mt-5 disabled:opacity-40" disabled={!istAktivitaetVollstaendig(a, antwort)} onClick={onPruefen}>Meine Lösung prüfen</button> : <div role="status" className="mt-5 rounded-xl border p-4" style={{ borderColor: ergebnis?.richtig ? "var(--ok)" : "var(--accent)" }}><strong>{ergebnis?.richtig ? "Lernziel angewendet!" : "Schau dir diesen Zusammenhang nochmals an."} {ergebnis?.erreicht} von {ergebnis?.moeglich} Zuordnungen richtig.</strong><p>{a.erklaerung}</p>{a.typ === "reihenfolge" && <ol className="mt-3 list-decimal pl-5">{a.schritte.map((s) => <li key={s.id}>{s.text}</li>)}</ol>}{a.typ === "zuordnen" && <ul className="mt-3 space-y-2">{a.paare.map((p) => <li key={p.id}><strong>{p.links}:</strong> {p.rechts}</li>)}</ul>}{(a.typ === "skizzenfehler" || a.typ === "baustellenfall") && <ul className="mt-3 space-y-2">{a.optionen.filter((o) => o.korrekt).map((o) => <li key={o.id}>✓ {o.text}</li>)}</ul>}<button className="mt-4 min-h-11 underline" onClick={() => { onChange(antwort); }}>Noch einmal bearbeiten</button></div>}
  </section>;
}
