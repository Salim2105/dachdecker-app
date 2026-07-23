import Link from "next/link";
import type { Lernfeld } from "@/content/schema";

export function LernfeldCard({
  lernfeld,
  fortschritt,
  anzahlAufgaben,
}: {
  lernfeld: Lernfeld;
  fortschritt: number;
  anzahlAufgaben: number;
}) {
  const begonnen = fortschritt > 0;
  return (
    <Link
      href={`/lernen/${lernfeld.id}`}
      className="flex items-center gap-4 rounded-[var(--r-lg)] border px-4 py-4 transition-transform active:scale-[0.99]"
      style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <span
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        {lernfeld.nr}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{lernfeld.titel}</span>
        <span className="mt-0.5 block text-xs" style={{ color: "var(--text-muted)" }}>
          {anzahlAufgaben > 0 ? `${anzahlAufgaben} Aufgaben` : `${lernfeld.themen.length} Themen`}
          {begonnen && <span className="tnum"> · {Math.round(fortschritt * 100)} %</span>}
        </span>
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-faint)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="flex-shrink-0"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
