import type { Lektion } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";

export function LektionCard({ lektion }: { lektion: Lektion }) {
  return (
    <article
      className="rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h3 className="font-medium">{lektion.titel}</h3>
      {lektion.svg && <SafeSvg markup={lektion.svg} className="my-3 flex justify-center" />}
      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
        {lektion.inhalt.map((absatz, i) => (
          <p key={i}>{absatz}</p>
        ))}
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Quelle: {lektion.quelle}
      </p>
    </article>
  );
}
