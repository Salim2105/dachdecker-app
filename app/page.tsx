"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getLernfelder } from "@/lib/lernfelder";
import { useProgress } from "@/components/useProgress";
import { Fortsetzen } from "@/components/Fortsetzen";
import { datumStore, letztesLfStore } from "@/lib/appStores";
// Bewusst aus lib/reifegrad statt lib/tagesplan: Letzteres zieht die
// Aufgabensammlung mit, die diese Seite nie anzeigt.
import { pruefungsreife, tagesdosis } from "@/lib/reifegrad";

const TAG = 86_400_000;

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

export default function Home() {
  const { fortschritt } = useProgress();
  const datum = useSyncExternalStore(datumStore.subscribe, datumStore.getSnapshot, datumStore.getServerSnapshot);
  const letztesLf =
    useSyncExternalStore(
      letztesLfStore.subscribe,
      letztesLfStore.getSnapshot,
      letztesLfStore.getServerSnapshot,
    ) || "lf01";

  const lernfelder = getLernfelder();
  const [now] = useState(() => Date.now());
  const tageBis = datum
    ? Math.ceil((new Date(datum + "T00:00:00").getTime() - now) / TAG)
    : null;

  // Prüfungsreife statt Fortschritt: der Wert verfällt, wenn Wiederholungen
  // liegen bleiben. Ein Balken, der nur steigen kann, misst Aktivität — nicht,
  // ob der Stoff am Prüfungstag noch abrufbar ist.
  const grad = pruefungsreife(fortschritt, now);
  const prozent = Math.round(grad.anteil * 100);
  const dosis = tagesdosis(grad, tageBis);

  return (
    <div className="flex flex-col gap-5">
      {/* Titel */}
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          Bereit für die Gesellenprüfung?
        </h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--text-muted)" }}>
          Übe alle Lernfelder — vom Material bis zum Bau.
        </p>
      </div>

      {/* Countdown */}
      <div
        className="relative overflow-hidden rounded-[var(--r-lg)] border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
          style={{ background: "var(--accent-soft)", filter: "blur(8px)" }}
        />
        {tageBis !== null ? (
          <div className="relative flex items-center gap-3.5">
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--r-md)]"
              style={{ background: "var(--accent-soft)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                <path d="M3 9h18M8 2.5v4M16 2.5v4" />
                <circle cx="16" cy="14.5" r="2.4" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--text-faint)" }}
              >
                Gesellenprüfung Termin
              </div>
              <div className="mt-0.5 text-[17px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
                {new Date(datum + "T00:00:00").toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {tageBis >= 0 && (
                <div className="mt-0.5 text-xs" style={{ color: "var(--accent)" }}>
                  <span className="tnum font-semibold">noch {tageBis}</span> {tageBis === 1 ? "Tag" : "Tage"}
                </div>
              )}
            </div>
            <button
              onClick={() => datumStore.set("")}
              aria-label="Termin ändern"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center self-start rounded-full border transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="relative block">
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Wann ist deine Prüfung?
            </span>
            <input
              type="date"
              value={datum}
              onChange={(e) => datumStore.set(e.target.value)}
              className="mt-2.5 w-full rounded-[var(--r-md)] border px-3.5 py-2.5 text-[15px]"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
            />
          </label>
        )}
      </div>

      {/* Fortschritt */}
      <div
        className="flex items-center gap-4 rounded-[var(--r-lg)] border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <Ring prozent={prozent} />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">Prüfungsreife</div>
          <div className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            {grad.faellig > 0 ? (
              <>
                <span className="tnum" style={{ color: "var(--text)" }}>
                  {grad.faellig}
                </span>{" "}
                {grad.faellig === 1 ? "Aufgabe fällt" : "Aufgaben fallen"} gerade zurück
              </>
            ) : (
              <>
                <span className="tnum" style={{ color: "var(--text)" }}>
                  {grad.gesamt - grad.neu}
                </span>{" "}
                von <span className="tnum">{grad.gesamt}</span> Aufgaben sitzen
              </>
            )}
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

      {/* Aktionen. "Heute dran" steht bewusst vorn und nimmt die Auswahl ab:
          wer selbst wählt, greift zum Vertrauten und lässt die späten
          Lernfelder liegen. */}
      <div className="flex flex-col gap-3">
        <Link
          href="/heute"
          className="flex min-h-14 items-center justify-between rounded-[var(--r-lg)] px-5 py-4 transition-transform active:scale-[0.99]"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          <span className="min-w-0">
            <span className="block text-[17px] font-semibold">Heute dran</span>
            <span className="mt-0.5 block text-[13px] opacity-80">
              <span className="tnum">{dosis}</span> Aufgaben · die App wählt aus
            </span>
          </span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        <Fortsetzen />
        <Link
          href={`/lernen/${letztesLf}`}
          className="flex min-h-14 items-center justify-between rounded-[var(--r-lg)] border px-5 py-4 text-[15px] font-semibold transition-transform active:scale-[0.99]"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          <span>Einzelnes Lernfeld</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        <div
          className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--text-faint)" }}
        >
          Schnellzugriff
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/lernen", label: "Lernfelder", icon: "M4 5h16v14H4zM4 9h16M9 5v14" },
            { href: "/fortschritt", label: "Fortschritt", icon: "M4 20V10M10 20V4M16 20v-8M22 20H2" },
            { href: "/zeichnen", label: "Zeichnen", icon: "M3 21l4-1 11-11a2 2 0 00-3-3L4 17l-1 4zM14 5l3 3" },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex min-h-14 flex-col items-center gap-2 rounded-[var(--r-md)] border px-2 py-4 text-[13px] font-medium transition-colors active:scale-[0.98]"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={t.icon} />
              </svg>
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
