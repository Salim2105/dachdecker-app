"use client";
import { useState, useSyncExternalStore } from "react";
import type { Aufgabe, Lektion } from "@/content/schema";
import { LektionCard } from "@/components/LektionCard";
import { SessionRunner } from "@/components/session/SessionRunner";
import { progressStore } from "@/lib/progressStore";
import { ladeGespeicherteAufgaben } from "@/lib/uebungStand";

type Props = { lfId: string; lektionen: Lektion[]; aufgaben: Aufgabe[] };
const subscribeClient = () => () => {};
export function LernEinheiten(props: Props) {
  const client = useSyncExternalStore(subscribeClient, () => true, () => false);
  return client ? <AktiveLernEinheiten key={props.lfId} {...props} /> : <p className="mt-5">Lerneinheit wird geladen …</p>;
}

function AktiveLernEinheiten({ lfId, lektionen, aufgaben }: Props) {
  const themen = [...new Set([...lektionen.map((l) => l.thema), ...aufgaben.map((a) => a.thema)])];
  const [gespeichert] = useState(() => ladeGespeicherteAufgaben(`dd-session-${lfId}-einheit`, aufgaben));
  const [thema, setThema] = useState(gespeichert?.[0]?.thema ?? themen[0] ?? "");
  const [lektionIndex, setLektionIndex] = useState(0);
  const [runde, setRunde] = useState<Aufgabe[] | null>(gespeichert);
  const [notiz, setNotiz] = useState("");
  const theorie = lektionen.filter((l) => l.thema === thema);
  const passend = aufgaben.filter((a) => a.thema === thema);

  if (runde) return (
    <div className="mt-5">
      <button onClick={() => setRunde(null)} className="mb-4 min-h-11 text-sm underline">Zur Lerneinheit</button>
      <SessionRunner aufgaben={runde} lfId={`${lfId}-einheit`} zurueck={`/lernen/${lfId}`} nachErklaerung={theorie.length > 0} />
    </div>
  );

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">In kleinen Einheiten lernen</h2>
      <label className="mt-3 block text-sm">Thema wählen
        <select value={thema} onChange={(e) => { setThema(e.target.value); setLektionIndex(0); setNotiz(""); }}
          className="mt-2 min-h-11 w-full rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {themen.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <p className="my-3 text-sm" style={{ color: "var(--text-muted)" }}>Verstehen → aus dem Kopf erklären → selbst lösen.</p>
      {theorie[lektionIndex] && <LektionCard lektion={theorie[lektionIndex]} />}
      {theorie.length > 1 && <div className="my-3 flex items-center justify-between text-sm">
        <button disabled={lektionIndex === 0} onClick={() => setLektionIndex((n) => n - 1)} className="min-h-11 px-3 disabled:opacity-40">Zurück</button>
        <span>{lektionIndex + 1} / {theorie.length}</span>
        <button disabled={lektionIndex === theorie.length - 1} onClick={() => setLektionIndex((n) => n + 1)} className="min-h-11 px-3 disabled:opacity-40">Nächster Abschnitt</button>
      </div>}
      <label className="mt-4 block text-sm">Erkläre den wichtigsten Punkt mit eigenen Worten. Nenne ein Beispiel vom Dach.
        <textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border p-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
      </label>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Diese Notiz ist für dich und wird nicht automatisch bewertet oder dauerhaft gespeichert.</p>
      {passend.length ? <button onClick={() => {
        const gespeichert = ladeGespeicherteAufgaben(`dd-session-${lfId}-einheit`, passend);
        if (gespeichert) { setRunde(gespeichert); return; }
        const f = progressStore.getSnapshot();
        const jetzt = Date.now();
        const rang = (a: Aufgabe) => !f[a.id] ? 1 : f[a.id].faelligAm <= jetzt ? 0 : 2;
        setRunde([...passend].sort((a, b) => rang(a) - rang(b) || (f[a.id]?.gesehenAm ?? 0) - (f[b.id]?.gesehenAm ?? 0)).slice(0, 4));
      }} className="mt-4 min-h-14 w-full rounded-xl p-4 font-medium" style={{ background: "var(--accent)", color: "var(--accent-text)" }}>
        Kleine Übung starten · bis zu 4 Aufgaben
      </button> : <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>Für diesen Abschnitt sind noch keine passenden Aufgaben verknüpft. Wähle ein anderes Thema zum Üben.</p>}
    </section>
  );
}
