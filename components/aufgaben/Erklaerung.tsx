/**
 * Zeigt nur die Erklärung. Die Quelle steht weiterhin in den Inhalts-Daten
 * (Feld `quelle`) als Nachweis, wird aber bewusst nicht angezeigt.
 */
export function Erklaerung({ text }: { text: string }) {
  return (
    <div
      className="mt-4 flex gap-2.5 rounded-[var(--r-md)] p-3 text-sm leading-relaxed"
      style={{ background: "var(--accent-soft)" }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-0.5 flex-shrink-0"
      >
        <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0012 2z" />
      </svg>
      <p style={{ color: "var(--text)" }}>{text}</p>
    </div>
  );
}
