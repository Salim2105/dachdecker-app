import type { Foto } from "@/content/schema";

/**
 * Zeigt eigene Praxisfotos zu einer Lektion. Die Dateien liegen in
 * public/fotos und werden vom Service Worker mit offline gespeichert.
 */
export function FotoStrecke({ fotos }: { fotos: Foto[] }) {
  if (fotos.length === 0) return null;

  return (
    <div className={`my-3 grid gap-3 ${fotos.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {fotos.map((f) => (
        <figure key={f.datei}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/fotos/${f.datei}`}
            alt={f.alt}
            loading="lazy"
            className="w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
          {f.bildunterschrift && (
            <figcaption className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {f.bildunterschrift}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
