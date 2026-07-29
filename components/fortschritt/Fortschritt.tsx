"use client";
import { useState } from "react";
import Link from "next/link";
import type { Aufgabe } from "@/content/schema";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { istFaellig } from "@/lib/progress";
import { pruefungsreife } from "@/lib/reifegrad";
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

  // Prüfungsreife statt Fortschritt: der Wert verfällt, wenn Wiederholungen
  // liegen bleiben. Ein Balken, der nur steigen kann, misst Aktivität — nicht,
  // ob der Stoff am Prüfungstag noch abrufbar ist.
  //
  // Er steht hier und nicht auf der Startseite: eine Zahl, die beim Öffnen als
  // Erstes ins Auge fällt, liest sich als Urteil. Hier ist sie Rechenschaft,
  // die man sich holt.
  const grad = pruefungsreife(fortschritt, jetzt);
  const prozent = Math.round(grad.anteil * 100);

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
      <h1 className="text-[26px] font-semibold tracking-tight">Dein Fortschritt</h1>

      {/* Prüfungsreife */}
      <div
        className="mt-4 flex items-center gap-4 rounded-[var(--r-lg)] border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <Ring prozent={prozent} />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">Prüfungsreife</div>
          <div className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            {/* punkte, nicht "bearbeitet": eine falsch beantwortete Aufgabe ist
                bearbeitet, sitzt aber nicht. Die Kachel darunter zählt beides
                getrennt — hier stünden sonst zwei Zahlen, die sich widersprechen. */}
            <span className="tnum" style={{ color: "var(--text)" }}>
              {Math.round(grad.punkte)}
            </span>{" "}
            von <span className="tnum">{grad.gesamt}</span> Aufgaben sitzen. Der Wert sinkt,
            wenn Wiederholungen liegen bleiben.
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${prozent}%`,
                background: "var(--accent)",
                transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Kachel label="Bearbeitet" wert={`${bearbeitet.length}`} zusatz={`von ${alle.length}`} />
        <Kachel label="Quote Richtig" wert={`${quote.toFixed(0)} %`} zusatz={`${richtig.length} richtig`} farbe="var(--ok)" />
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
          <h2 className="mt-6 text-sm font-semibold" style={{ color: "var(--text)" }}>
            Schwachstellen <span style={{ color: "var(--text-muted)" }}>(Übe-Empfehlung)</span>
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {schwach.map(([thema, e]) => (
              <Link
                key={thema}
                href={`/lernen/${e.lernfeld}`}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
                <span className="flex-1 text-sm" style={{ color: "var(--text)" }}>
                  {thema}
                </span>
                <span className="text-xs tnum" style={{ color: "var(--bad)" }}>
                  {e.falsch} / {e.gesamt} offen
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Nach Lernfeld */}
      <h2 className="mt-6 text-sm font-semibold" style={{ color: "var(--text)" }}>
        Fortschritt nach Lernfeld
      </h2>
      <div className="mt-3 flex flex-col gap-3.5">
        {lernfelder.map((lf) => {
          const ids = getAufgaben(lf.id).map((a) => a.id);
          if (ids.length === 0) return null;
          const fertig = ids.filter(
            (id) => fortschritt[id] && fortschritt[id].bewertung === "richtig",
          ).length;
          const anteil = fertig / ids.length;
          return (
            <Link key={lf.id} href={`/lernen/${lf.id}`} className="block">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm" style={{ color: "var(--text)" }}>
                  {/^\d/.test(lf.nr) ? `LF ${lf.nr}` : lf.nr}: {lf.titel}
                </span>
                <span className="flex-shrink-0 text-sm font-semibold tnum" style={{ color: "var(--text-muted)" }}>
                  {Math.round(anteil * 100)} %
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${anteil * 100}%`, background: "var(--accent)" }}
                />
              </div>
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

function Ring({ prozent }: { prozent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - prozent / 100);
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0" aria-hidden="true">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 34 34)"
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text
        x="34"
        y="34"
        textAnchor="middle"
        dominantBaseline="central"
        className="tnum"
        style={{ fontSize: prozent >= 100 ? "14px" : "16px", fontWeight: 600, fill: "var(--text)" }}
      >
        {prozent}%
      </text>
    </svg>
  );
}

function Kachel({ label, wert, zusatz, farbe = "var(--accent)" }: { label: string; wert: string; zusatz: string; farbe?: string }) {
  return (
    <div
      className="rounded-xl border p-3 text-center"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="text-xl font-medium tabular-nums" style={{ color: farbe }}>
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
