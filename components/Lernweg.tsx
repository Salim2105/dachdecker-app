"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { Bewertung } from "@/content/schema";
import { LERNWEGE, leererLernweg, lernwegStore, lernwegAuswahl, leseLernwege, speichereLernweg, rechnungGeschafft, type LernwegStand, type LernwegEinheit } from "@/lib/lernweg";
import { PRAXISFAELLE, pruefePraxisZahl } from "@/lib/praxis";
import { leseDezimalzahl } from "@/lib/zahlen";
import { praxisFeedback } from "@/lib/rechenFeedback";
import { RechenFehlerHilfe } from "@/components/RechenFehlerHilfe";
import { QuellenHinweis } from "@/components/QuellenHinweis";

const SCHRITTE = ["Verstehen", "Selbst erinnern", "Rechnen", "Baustellenfall"];
const LABEL: Record<Bewertung, string> = { richtig: "Passt", teilweise: "Teilweise", falsch: "Noch unsicher" };
const rahmen = { borderColor: "var(--border)", background: "var(--surface)" };
const feld = "mt-2 min-h-28 w-full rounded-xl border p-3";
const weiter = "mt-4 min-h-14 w-full rounded-xl p-4 font-medium disabled:opacity-40";

export function Lernweg() {
  const text = useSyncExternalStore(lernwegStore.subscribe, lernwegStore.getSnapshot, lernwegStore.getServerSnapshot);
  const auswahl = useSyncExternalStore(lernwegAuswahl.subscribe, lernwegAuswahl.getSnapshot, lernwegAuswahl.getServerSnapshot);
  const e = LERNWEGE.find((e) => e.id === auswahl) ?? LERNWEGE[0];
  const staende = leseLernwege(text);
  const stand = staende[e.id] ?? leererLernweg(e.id);
  const fertig = LERNWEGE.filter((e) => staende[e.id]?.schritt === 4).length;

  return <div>
    <h1 className="text-[26px] font-semibold">Dein geführter Lernweg</h1>
    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Sechs Grundlagen-Einheiten: erst verstehen, dann selbst erklären, rechnen und auf eine Baustellensituation anwenden.</p>
    <p className="mt-2 text-sm">{fertig} von {LERNWEGE.length} Einheiten bearbeitet. Deine Stelle und Eingaben werden auf diesem Gerät gespeichert und mitgesichert.</p>
    <label className="mt-4 block text-sm">Lerneinheit wählen
      <select className="mt-2 min-h-11 w-full rounded-xl border p-3" style={rahmen} value={e.id} onChange={(event) => lernwegAuswahl.set(event.target.value)}>
        {LERNWEGE.map((e) => <option key={e.id} value={e.id}>{e.titel}{staende[e.id]?.schritt === 4 ? " · Bearbeitet" : ""}</option>)}
      </select>
    </label>
    <Einheit key={e.id} einheit={e} stand={stand} />
    <Link href="/lernen" className="mt-6 inline-block min-h-11 py-2 text-sm underline">Alle Lernfelder frei erkunden</Link>
  </div>;
}

function Einheit({ einheit: e, stand: s }: { einheit: LernwegEinheit; stand: LernwegStand }) {
  const fall = PRAXISFAELLE.find((f) => f.id === e.id)!;
  const update = (aenderung: Partial<LernwegStand>) => speichereLernweg(e.id, { ...s, ...aenderung });
  return <section className="mt-5">
    <h2 className="text-lg font-semibold">{e.titel}</h2>
    <ol aria-label="Schritte im Lernweg" className="my-4 grid grid-cols-2 gap-2 text-sm">
      {SCHRITTE.map((titel, i) => <li key={titel} aria-current={s.schritt === i ? "step" : undefined}
        className="rounded-xl border p-3" style={{ ...rahmen, background: s.schritt === i ? "var(--accent-soft)" : "var(--surface)" }}>{i + 1}. {titel}</li>)}
    </ol>

    {s.schritt === 0 && <div>
      <h3 className="font-semibold">1. Verstehen</h3>
      <div className="mt-3 space-y-3 rounded-xl border p-4 text-sm leading-relaxed" style={rahmen}>
        {e.erklaerung.map((absatz) => <p key={absatz}>{absatz}</p>)}
      </div>
      <p className="mt-3 text-sm">Lies die Erklärung und finde ein eigenes Beispiel. Im nächsten Schritt wird die Theorie ausgeblendet.</p>
      <Weiter onClick={() => update({ schritt: 1 })}>Weiter: aus dem Kopf erklären</Weiter>
    </div>}

    {s.schritt === 1 && <div>
      <h3 className="font-semibold">2. Selbst erinnern</h3>
      <p className="mt-2 text-sm">Versuche es ohne Nachlesen. Diese Antwort entsteht direkt nach der Erklärung und ist noch kein langfristiger Wissensnachweis.</p>
      <label className="mt-3 block text-sm">{e.abrufFrage}
        <textarea value={s.erinnerung} disabled={s.erinnerungVerglichen} className={feld} style={rahmen}
          onChange={(event) => update({ erinnerung: event.target.value })} />
      </label>
      {!s.erinnerungVerglichen ? <Weiter disabled={!s.erinnerung.trim()} onClick={() => update({ erinnerungVerglichen: true })}>Mit Musterantwort vergleichen</Weiter>
        : <Vergleich muster={e.abrufMuster} bewertung={s.erinnerungBewertung} onBewertung={(b) => update({ erinnerungBewertung: b })} />}
      {s.erinnerungBewertung && <Weiter onClick={() => update({ schritt: 2 })}>Weiter: selbst rechnen</Weiter>}
      {s.erinnerungVerglichen && <button className="mt-2 min-h-11 text-sm underline" onClick={() => update({ erinnerungVerglichen: false, erinnerungBewertung: undefined })}>Antwort überarbeiten</button>}
    </div>}

    {s.schritt === 2 && <div>
      <h3 className="font-semibold">3. Rechnen</h3>
      <p className="mt-3 rounded-xl p-4 text-sm leading-relaxed" style={{ background: "var(--accent-soft)" }}>{fall.situation}</p>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Nur Zahlen eingeben. Ein Dezimalkomma ist möglich.</p>
      {fall.rechnungen.map((r, i) => {
        const richtig = pruefePraxisZahl(s.zahlen[i], r.ergebnis);
        const feedback = s.rechnungGeprueft ? praxisFeedback(e.id, i, s.zahlen) : null;
        return <div key={r.frage} className="mt-4">
          <label className="block text-sm">{r.frage}
            <div className="mt-2 flex items-center gap-2">
              <input aria-label={r.frage} inputMode="decimal" value={s.zahlen[i]} className="min-h-11 w-32 rounded-lg border p-3" style={rahmen}
                onChange={(event) => update({ zahlen: s.zahlen.map((v, j) => j === i ? event.target.value : v), rechnungGeprueft: false })} />
              <span>{r.einheit}</span>
            </div>
          </label>
          {s.zahlen[i].trim() && leseDezimalzahl(s.zahlen[i]) === null && <p className="mt-2 text-sm">Gib nur die Zahl ohne Einheit oder Tausendertrennzeichen ein.</p>}
          {s.rechnungGeprueft && <div className="mt-2 rounded-xl border p-3 text-sm" style={{ borderColor: richtig ? "var(--ok)" : "var(--bad)" }}>
            <p className="font-medium">{richtig ? "Richtig" : "Prüfe diesen Schritt"}</p>
            {feedback && <RechenFehlerHilfe key={s.zahlen.join("|")} feedback={feedback} />}
            <p className="mt-2">{r.loesungsweg}</p>
          </div>}
        </div>;
      })}
      <Weiter disabled={s.zahlen.some((v) => leseDezimalzahl(v) === null)} onClick={() => update({ rechnungGeprueft: true })}>Rechnung prüfen</Weiter>
      {rechnungGeschafft(e.id, s) ? <Weiter onClick={() => update({ schritt: 3 })}>Weiter: auf die Baustelle übertragen</Weiter>
        : s.rechnungGeprueft && <p className="mt-3 text-sm" role="status">Bearbeite die Hinweise und korrigiere deine Zahlen. Prüfe danach erneut, bevor du weitergehst.</p>}
    </div>}

    {s.schritt === 3 && <div>
      <h3 className="font-semibold">4. Baustellenfall</h3>
      <p className="mt-3 rounded-xl p-4 text-sm leading-relaxed" style={{ background: "var(--accent-soft)" }}>{e.baustelle}</p>
      <label className="mt-3 block text-sm">{e.transferFrage}
        <textarea value={s.transfer} disabled={s.transferVerglichen} className={feld} style={rahmen}
          onChange={(event) => update({ transfer: event.target.value })} />
      </label>
      {!s.transferVerglichen ? <Weiter disabled={!s.transfer.trim()} onClick={() => update({ transferVerglichen: true })}>Begründung vergleichen</Weiter>
        : <Vergleich muster={e.transferMuster} bewertung={s.transferBewertung} onBewertung={(b) => update({ transferBewertung: b })} />}
      {s.transferBewertung && <Weiter onClick={() => update({ schritt: 4 })}>Einheit abschließen</Weiter>}
      {s.transferVerglichen && <button className="mt-2 min-h-11 text-sm underline" onClick={() => update({ transferVerglichen: false, transferBewertung: undefined })}>Begründung überarbeiten</button>}
    </div>}

    {s.schritt === 4 && <div className="rounded-xl border p-4" style={rahmen}>
      <h3 className="font-semibold">Einheit bearbeitet</h3>
      <p className="mt-2 text-sm">Du hast die Erklärung gelesen, aus dem Kopf geantwortet, gerechnet und eine Baustellensituation begründet.</p>
      <p className="mt-2 text-sm">Deine Selbsteinschätzung: Erinnern — {s.erinnerungBewertung && LABEL[s.erinnerungBewertung]}; Baustellenfall — {s.transferBewertung && LABEL[s.transferBewertung]}.</p>
      <p className="mt-2 text-sm">{s.erinnerungBewertung !== "richtig" || s.transferBewertung !== "richtig"
        ? "Wiederhole besonders die Erklärung und deine Begründung. Dort hast du noch Unsicherheit angegeben."
        : "Prüfe später an einem anderen Tag, ob du die Schritte ohne Nachlesen noch erklären kannst."}</p>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Bearbeitet bedeutet nicht dauerhaft beherrscht. Freie Antworten wurden von dir selbst eingeschätzt. Die Einheit wird getrennt vom langfristigen Aufgaben-Lernstand gespeichert.</p>
      <Weiter onClick={() => {
        const index = LERNWEGE.findIndex((a) => a.id === e.id);
        const naechste = LERNWEGE.slice(index + 1).find((a) => leseLernwege(lernwegStore.getSnapshot())[a.id]?.schritt !== 4)
          ?? LERNWEGE.find((a) => a.id !== e.id && leseLernwege(lernwegStore.getSnapshot())[a.id]?.schritt !== 4);
        if (naechste) lernwegAuswahl.set(naechste.id);
      }} disabled={LERNWEGE.every((a) => leseLernwege(lernwegStore.getSnapshot())[a.id]?.schritt === 4)}>Nächste offene Einheit</Weiter>
      <button className="mt-3 min-h-11 text-sm underline" onClick={() => speichereLernweg(e.id, leererLernweg(e.id))}>Diese Einheit erneut beginnen</button>
    </div>}

    {s.schritt > 0 && s.schritt < 4 && <button className="mt-4 min-h-11 text-sm underline" onClick={() => update({ schritt: s.schritt - 1 })}>Einen Schritt zurück</button>}
    <QuellenHinweis quelle={fall.quelle} />
  </section>;
}

function Weiter({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button className={weiter} disabled={disabled} onClick={onClick} style={{ background: "var(--accent)", color: "var(--accent-text)" }}>{children}</button>;
}

function Vergleich({ muster, bewertung, onBewertung }: { muster: string; bewertung?: Bewertung; onBewertung: (b: Bewertung) => void }) {
  return <div className="mt-4 rounded-xl border p-4 text-sm" style={rahmen}>
    <h4 className="font-semibold">Musterantwort zum Vergleichen</h4>
    <p className="mt-2 leading-relaxed">{muster}</p>
    <p className="mt-3">Wie gut passt deine Antwort? Du schätzt sie selbst ein.</p>
    <div className="mt-2 flex flex-wrap gap-2">{(["richtig", "teilweise", "falsch"] as Bewertung[]).map((b) =>
      <button key={b} className="min-h-11 rounded-xl border p-3" style={{ ...rahmen, background: bewertung === b ? "var(--accent-soft)" : "var(--surface)" }}
        aria-pressed={bewertung === b} onClick={() => onBewertung(b)}>{LABEL[b]}</button>)}</div>
  </div>;
}
