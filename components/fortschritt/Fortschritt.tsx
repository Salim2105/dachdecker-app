"use client";
import { useState } from "react";
import Link from "next/link";
import type { Aufgabe } from "@/content/schema";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { istFaellig } from "@/lib/progress";
import { progressStore } from "@/lib/progressStore";
import { useProgress } from "@/components/useProgress";
import { Wiederholung } from "@/components/session/Wiederholung";
import { zieheAufgaben } from "@/lib/pruefung";
import { Datensicherung } from "@/components/fortschritt/Datensicherung";

export function Fortschritt() {
  const { fortschritt } = useProgress();
  // Einmal beim Mounten festgehalten, damit Render rein bleibt.
  const [jetzt] = useState(() => Date.now());
  const [wiederholung, setWiederholung] = useState<Aufgabe[] | null>(null);
  const [loeschenGefragt, setLoeschenGefragt] = useState(false);

  const lernfelder = getLernfelder();
  const alle: Aufgabe[] = lernfelder.flatMap((lf) => getAufgaben(lf.id));

  const bearbeitet = alle.filter((a) => fortschritt[a.id]);
  const richtig = bearbeitet.filter((a) => fortschritt[a.id].bewertung === "richtig");
  const faellig = bearbeitet.filter((a) => istFaellig(fortschritt[a.id], jetzt));
  const neu = alle.length - bearbeitet.length;
  const quote = bearbeitet.length > 0 ? (richtig.length / bearbeitet.length) * 100 : 0;

  if (wiederholung) {
    return (
      <Wiederholung
        aufgaben={wiederholung}
        titel="Wiederholung"
        onFertig={() => setWiederholung(null)}
      />
    );
  }

  // Schwächste Themen: nur Themen, die schon bearbeitet wurden
  const proThema = new Map<string, { falsch: number; gesamt: number; lernfeld: string }>();
  for (const a of bearbeitet) {
    const e = proThema.get(a.thema) ?? { falsch: 0, gesamt: 0, lernfeld: a.lernfeld };
    e.gesamt += 1;
    if (fortschritt[a.id].bewertung !== "richtig") e.falsch += 1;
    proThema.set(a.thema, e);
  }
  const schwach = [...proThema.entries()]
    .filter(([, e]) => e.falsch > 0)
    .sort((a, b) => b[1].falsch / b[1].gesamt - a[1].falsch / a[1].gesamt)
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-xl font-medium">Fortschritt</h1>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Kachel label="Bearbeitet" wert={`${bearbeitet.length}`} zusatz={`von ${alle.length}`} />
        <Kachel label="Richtig-Quote" wert={`${quote.toFixed(0)} %`} zusatz={`${richtig.length} richtig`} />
        <Kachel label="Noch neu" wert={`${neu}`} zusatz="nie bearbeitet" />
      </div>

      {/* Fällige Wiederholungen */}
      <div
        className="mt-4 rounded-xl border p-4"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {faellig.length > 0 ? (
          <>
            <div className="text-sm" style={{ color: "var(--text)" }}>
              <strong style={{ color: "var(--accent)" }}>{faellig.length}</strong>{" "}
              {faellig.length === 1 ? "Aufgabe ist" : "Aufgaben sind"} zur Wiederholung fällig.
            </div>
            <button
              onClick={() => setWiederholung(zieheAufgaben(faellig, 20))}
              className="mt-3 w-full rounded-xl py-3 font-medium"
              style={{ background: "var(--accent)", color: "var(--accent-text)" }}
            >
              Jetzt wiederholen
            </button>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Es werden bis zu 20 Aufgaben gezogen. Was du richtig hast, kommt beim nächsten
              Mal in größerem Abstand wieder.
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {bearbeitet.length === 0
              ? "Noch nichts bearbeitet. Fang mit einem Lernfeld an — danach steht hier, was zur Wiederholung ansteht."
              : "Gerade ist nichts zur Wiederholung fällig. Gut so."}
          </p>
        )}
      </div>

      {/* Schwächste Themen */}
      {schwach.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Daran hakt es
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {schwach.map(([thema, e]) => (
              <Link
                key={thema}
                href={`/lernen/${e.lernfeld}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  {thema}
                </span>
                <span className="text-xs" style={{ color: "var(--bad)" }}>
                  {e.falsch} / {e.gesamt} offen
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Nach Lernfeld */}
      <h2 className="mt-6 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Nach Lernfeld
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {lernfelder.map((lf) => {
          const ids = getAufgaben(lf.id).map((a) => a.id);
          if (ids.length === 0) return null;
          const fertig = ids.filter(
            (id) => fortschritt[id] && fortschritt[id].bewertung === "richtig",
          ).length;
          const anteil = fertig / ids.length;
          return (
            <Link key={lf.id} href={`/lernen/${lf.id}`} className="flex items-center gap-3">
              <span className="w-14 flex-shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                {/^\d/.test(lf.nr) ? `LF ${lf.nr}` : lf.nr}
              </span>
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${anteil * 100}%`, background: "var(--accent)" }}
                />
              </div>
              <span className="w-14 text-right text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {fertig} / {ids.length}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Datensicherung */}
      <Datensicherung />

      {/* Zurücksetzen */}
      <div className="mt-10 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        {loeschenGefragt ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: "var(--text)" }}>
              Wirklich den gesamten Fortschritt löschen? Das lässt sich nicht rückgängig machen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  progressStore.zuruecksetzen();
                  setLoeschenGefragt(false);
                }}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                style={{ background: "var(--bad)", color: "var(--accent-text)" }}
              >
                Ja, löschen
              </button>
              <button
                onClick={() => setLoeschenGefragt(false)}
                className="flex-1 rounded-xl border py-2.5 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLoeschenGefragt(true)}
            className="text-xs underline"
            style={{ color: "var(--text-muted)" }}
          >
            Fortschritt zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}

function Kachel({ label, wert, zusatz }: { label: string; wert: string; zusatz: string }) {
  return (
    <div
      className="rounded-xl border p-3 text-center"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="text-xl font-medium tabular-nums" style={{ color: "var(--accent)" }}>
        {wert}
      </div>
      <div className="mt-0.5 text-xs" style={{ color: "var(--text)" }}>
        {label}
      </div>
      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {zusatz}
      </div>
    </div>
  );
}
