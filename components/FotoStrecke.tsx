import type { Foto } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";

/**
 * Zeigt die Foto-Plätze einer Lektion. Ist ein echtes Foto hinterlegt (`datei`,
 * liegt in public/fotos und ist offline gecacht), wird es angezeigt. Sonst
 * erscheint die Ausschnitt-Skizze `musterSvg` als Platzhalter — sie zeigt, wie
 * das eigene Foto auf der Baustelle aufgenommen werden soll.
 */
export function FotoStrecke({ fotos }: { fotos: Foto[] }) {
  if (fotos.length === 0) return null;

  return (
    <div className={`my-3 grid gap-3 ${fotos.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {fotos.map((f) => (
        <figure key={f.id}>
          {f.datei ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/fotos/${f.datei}`}
                alt={f.alt}
                loading="lazy"
                className="w-full rounded-[var(--r-md)] border"
                style={{ borderColor: "var(--border)" }}
              />
              {f.bildunterschrift && (
                <figcaption className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {f.bildunterschrift}
                </figcaption>
              )}
            </>
          ) : f.musterSvg ? (
            <div
              className="overflow-hidden rounded-[var(--r-md)] border border-dashed"
              style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)" }}
            >
              <div
                className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-medium"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8l4-3h10l4 3v11H3zM12 16a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                  So soll dein Foto aussehen
                </span>
                {f.winkel && (
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{ border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)" }}
                  >
                    {f.winkel}
                  </span>
                )}
              </div>
              <SafeSvg markup={f.musterSvg} className="flex justify-center px-3 py-3" />
              {f.bildunterschrift && (
                <p className="px-3 pb-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {f.bildunterschrift}
                </p>
              )}
            </div>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
