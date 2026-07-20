import Link from "next/link";
import { getLernfeld, getAufgaben, getLernfelder } from "@/lib/content";
import { SessionRunner } from "@/components/session/SessionRunner";

export default async function UebenPage({ params }: { params: Promise<{ lf: string }> }) {
  const { lf } = await params;
  const lernfeld = getLernfeld(lf);
  const aufgaben = getAufgaben(lf);

  if (!lernfeld || aufgaben.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-medium">Keine Aufgaben</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Für dieses Lernfeld sind noch keine Aufgaben verfügbar.
        </p>
        <Link href="/lernen" className="mt-3 inline-block" style={{ color: "var(--accent)" }}>
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/lernen/${lf}`} className="text-sm" style={{ color: "var(--text-muted)" }}>
        ← {lernfeld.titel}
      </Link>
      <div className="mt-3">
        <SessionRunner aufgaben={aufgaben} lfId={lf} />
      </div>
    </div>
  );
}

// Alle Lernfelder beim Build vorab erzeugen — die App braucht dann zur
// Laufzeit keinen Server mehr, der Seiten rendert.
export function generateStaticParams() {
  return getLernfelder().map((lf) => ({ lf: lf.id }));
}
