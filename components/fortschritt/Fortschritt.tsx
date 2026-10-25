"use client";
import { useState } from "react";
import Link from "next/link";
import type { Aufgabe } from "@/content/schema";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { lernStatus, themenStand, STATUS_LABEL, type LernStatus } from "@/lib/lernstand";
import { progressStore } from "@/lib/progressStore";
import { useProgress } from "@/components/useProgress";
import { Wiederholung } from "@/components/session/Wiederholung";
import { Datensicherung } from "@/components/fortschritt/Datensicherung";

const STATUS: LernStatus[] = ["neu", "unsicher", "erinnert", "gefestigt", "faellig"];
export function Fortschritt() {
  const { fortschritt } = useProgress();
  const [jetzt] = useState(() => Date.now());
  const [wiederholung, setWiederholung] = useState<Aufgabe[] | null>(null);
  const [loeschenGefragt, setLoeschenGefragt] = useState(false);
  const lernfelder = getLernfelder();
  const alle = lernfelder.flatMap((lf) => getAufgaben(lf.id));
  const themen = themenStand(alle, fortschritt, jetzt);
  const zahlen = Object.fromEntries(STATUS.map((s) => [s, alle.filter((a) => lernStatus(fortschritt[a.id], jetzt) === s).length]));
  const faellig = alle.filter((a) => lernStatus(fortschritt[a.id], jetzt) === "faellig")
    .sort((a, b) => fortschritt[a.id].faelligAm - fortschritt[b.id].faelligAm);

  if (wiederholung) return <Wiederholung aufgaben={wiederholung} titel="Gezielt wiederholen" onFertig={() => setWiederholung(null)} />;

  return (
    <div>
      <h1 className="text-[26px] font-semibold">Dein Fachwissen-Lernstand</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        Eine richtige Antwort ist ein Anfang. „Mehrfach erinnert“ bedeutet mindestens drei erfolgreiche Abrufe ohne Hilfe an verschiedenen Tagen.
        Selbsteinschätzungen sind keine automatische Wissensprüfung.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {STATUS.map((s) => <div key={s} className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-xl font-semibold">{zahlen[s]}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{STATUS_LABEL[s]}</div>
        </div>)}
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>Ältere Lernstände bleiben erhalten. Erfolgsserien werden erst aus dem neuen Verlauf ermittelt.</p>
      {faellig.length > 0 && <button onClick={() => setWiederholung(faellig.slice(0, 10))}
        className="mt-4 min-h-14 w-full rounded-xl p-4 font-medium" style={{ background: "var(--accent)", color: "var(--accent-text)" }}>
        Fällige Aufgaben wiederholen · bis zu 10
      </button>}
      <div className="mt-6 flex flex-col gap-3">
        {lernfelder.map((lf) => <details key={lf.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <summary className="min-h-11 cursor-pointer font-semibold">{lf.nr}: {lf.titel}</summary>
          <Link href={`/lernen/${lf.id}`} className="mt-2 block min-h-9 text-sm underline">Lerneinheiten öffnen</Link>
          {themen.filter((t) => t.lernfeld === lf.id).map((t) => (
            <div key={t.thema} className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-sm font-semibold">{t.thema}</h2>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {STATUS.filter((s) => t.zahlen[s] > 0).map((s) => <li key={s}>{t.zahlen[s]} · {STATUS_LABEL[s]}</li>)}
              </ul>
              <button onClick={() => {
                const prioritaet: Record<LernStatus, number> = { faellig: 0, unsicher: 1, neu: 2, erinnert: 3, gefestigt: 4 };
                const sortiert = [...t.aufgaben].sort((a, b) => prioritaet[lernStatus(fortschritt[a.id], jetzt)] - prioritaet[lernStatus(fortschritt[b.id], jetzt)]);
                const bedarf = sortiert.filter((a) => lernStatus(fortschritt[a.id], jetzt) !== "gefestigt");
                setWiederholung((bedarf.length ? bedarf : sortiert).slice(0, 4));
              }} className="mt-2 min-h-11 text-sm underline">Dieses Thema üben · bis zu 4 Aufgaben</button>
            </div>
          ))}
        </details>)}
      </div>
      <Datensicherung />
      <div className="mt-8 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        {loeschenGefragt ? <div>
          <p className="text-sm">Gesamten Lernstand einschließlich Verlauf löschen?</p>
          <div className="mt-2 flex gap-3">
            <button onClick={() => { progressStore.zuruecksetzen(); setLoeschenGefragt(false); }} className="min-h-11 rounded-xl border p-3" style={{ borderColor: "var(--bad)" }}>Ja, löschen</button>
            <button onClick={() => setLoeschenGefragt(false)} className="min-h-11 p-3">Abbrechen</button>
          </div>
        </div> : <button onClick={() => setLoeschenGefragt(true)} className="min-h-11 text-xs underline">Fortschritt zurücksetzen</button>}
      </div>
    </div>
  );
}
