"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { useProgress } from "@/components/useProgress";
import { datumStore, letztesLfStore } from "@/lib/appStores";

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
        style={{ fontSize: "17px", fontWeight: 600, fill: "var(--text)" }}
      >
        {prozent}
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

  // Gesamtfortschritt über alle Lernfelder
  const lernfelder = getLernfelder();
  let total = 0;
  let done = 0;
  for (const lf of lernfelder) {
    const ids = getAufgaben(lf.id).map((a) => a.id);
    total += ids.length;
    done += ids.filter((id) => fortschritt[id] && fortschritt[id].bewertung !== "falsch").length;
  }
  const prozent = total > 0 ? Math.round((done / total) * 100) : 0;

  const [now] = useState(() => Date.now());
  const tageBis = datum
    ? Math.ceil((new Date(datum + "T00:00:00").getTime() - now) / TAG)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Titel */}
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          Bereit für die Gesellenprüfung
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
          <div className="relative flex items-end justify-between">
            <div>
              <div
                className="text-[11px] font-medium uppercase tracking-[0.14em]"
                style={{ color: "var(--text-muted)" }}
              >
                {tageBis >= 0 ? "bis zur Gesellenprüfung" : "Prüfungstermin"}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className="tnum text-[46px] font-semibold leading-none tracking-tight"
                  style={{ color: "var(--accent)" }}
                >
                  {tageBis >= 0 ? tageBis : "—"}
                </span>
                <span className="text-lg font-medium" style={{ color: "var(--text)" }}>
                  {tageBis >= 0 ? (tageBis === 1 ? "Tag" : "Tage") : "vorbei"}
                </span>
              </div>
            </div>
            <button
              onClick={() => datumStore.set("")}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              ändern
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
          <div className="text-[15px] font-semibold">Gesamtfortschritt</div>
          <div className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="tnum" style={{ color: "var(--text)" }}>
              {done}
            </span>{" "}
            von <span className="tnum">{total}</span> Aufgaben · {lernfelder.length} Lernfelder
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

      {/* Aktionen */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/lernen/${letztesLf}`}
          className="flex items-center justify-between rounded-[var(--r-lg)] px-5 py-4 text-[15px] font-semibold transition-transform active:scale-[0.99]"
          style={{ background: "var(--accent)", color: "var(--accent-text)", boxShadow: "var(--shadow-md)" }}
        >
          <span>Weiterlernen</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/lernen", label: "Lernfelder", icon: "M4 5h16v14H4zM4 9h16M9 5v14" },
            { href: "/pruefung", label: "Prüfung", icon: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18" },
            { href: "/rechner", label: "Rechner", icon: "M6 3h12v18H6zM9 7h6M8 11h1m3 0h1m3 0h1M8 15h1m3 0h1m3 0h1" },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-2 rounded-[var(--r-md)] border px-2 py-4 text-xs font-medium transition-colors active:scale-[0.98]"
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
