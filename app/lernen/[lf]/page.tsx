import Link from "next/link";
import { getLernfeld, getLektionen, getAufgaben } from "@/lib/content";
import { LektionCard } from "@/components/LektionCard";

export default async function LernfeldDetailPage({
  params,
}: {
  params: Promise<{ lf: string }>;
}) {
  const { lf } = await params;
  const lernfeld = getLernfeld(lf);

  if (!lernfeld) {
    return (
      <div>
        <h1 className="text-xl font-medium">Lernfeld nicht gefunden</h1>
        <Link href="/lernen" className="mt-3 inline-block" style={{ color: "var(--accent)" }}>
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const lektionen = getLektionen(lf);
  const aufgaben = getAufgaben(lf);

  return (
    <div>
      <Link href="/lernen" className="text-sm" style={{ color: "var(--text-muted)" }}>
        ← Lernfelder
      </Link>

      <div className="mt-2 flex items-start gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {lernfeld.nr}
        </span>
        <div>
          <h1 className="text-xl font-medium leading-tight">{lernfeld.titel}</h1>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {lernfeld.lehrjahr}. Lehrjahr{lernfeld.stunden > 0 ? ` · ${lernfeld.stunden} Std.` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lernfeld.themen.map((thema) => (
          <span
            key={thema}
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            {thema}
          </span>
        ))}
      </div>

      {lektionen.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Theorie
          </h2>
          <div className="flex flex-col gap-3">
            {lektionen.map((l) => (
              <LektionCard key={l.id} lektion={l} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8">
        {aufgaben.length > 0 ? (
          <Link
            href={`/lernen/${lf}/ueben`}
            className="block rounded-xl px-5 py-4 text-center font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            Üben starten · {aufgaben.length} Aufgaben
          </Link>
        ) : (
          <p
            className="rounded-xl border border-dashed p-4 text-center text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Für dieses Lernfeld sind noch keine Aufgaben verfügbar.
          </p>
        )}
      </div>
    </div>
  );
}
