import Link from "next/link";
import type { Lernfeld } from "@/content/schema";
import { ProgressBar } from "@/components/ProgressBar";

export function LernfeldCard({
  lernfeld,
  fortschritt,
  anzahlAufgaben,
}: {
  lernfeld: Lernfeld;
  fortschritt: number;
  anzahlAufgaben: number;
}) {
  return (
    <Link
      href={`/lernen/${lernfeld.id}`}
      className="flex items-center gap-3 rounded-xl border p-3"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <span
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium"
        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
      >
        {lernfeld.nr}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{lernfeld.titel}</span>
        <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)" }}>
          {anzahlAufgaben > 0 ? `${anzahlAufgaben} Aufgaben` : `${lernfeld.themen.length} Themen`}
        </span>
        <span className="mt-2 block">
          <ProgressBar value={fortschritt} />
        </span>
      </span>
    </Link>
  );
}
