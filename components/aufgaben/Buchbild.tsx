/**
 * Zeigt eine Abbildung aus dem Fachbuch (WebP aus public/buch/…). Die Scans
 * haben einen hellen Hintergrund, deshalb sitzt das Bild bewusst auf einer
 * hellen, gerundeten Tafel — so wirkt es in Hell- und Dunkelmodus wie eine
 * saubere Bildtafel und nicht wie ein fremdes Kästchen.
 */
export function Buchbild({ datei, unterschrift }: { datei: string; unterschrift?: string }) {
  return (
    <figure
      className="mt-4 overflow-hidden rounded-[var(--r-md)] border"
      style={{ borderColor: "var(--border)", background: "#faf8f3" }}
    >
      {/* Bewusst <img> statt next/image: feste lokale WebP-Dateien, die im
          statischen Export (Electron) und offline identisch funktionieren
          müssen. next/image brächte hier nur JS-Overhead ohne Nutzen. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={datei}
        alt={unterschrift || "Abbildung aus dem Fachbuch"}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
      {unterschrift && (
        <figcaption
          className="px-3 py-2 text-xs"
          style={{ color: "#6a635a", borderTop: "1px solid #ece7dd" }}
        >
          {unterschrift}
        </figcaption>
      )}
    </figure>
  );
}
