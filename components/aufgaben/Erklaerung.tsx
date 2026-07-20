/**
 * Zeigt nur die Erklärung. Die Quelle steht weiterhin in den Inhalts-Daten
 * (Feld `quelle`) als Nachweis, wird aber bewusst nicht angezeigt.
 */
export function Erklaerung({ text }: { text: string }) {
  return (
    <div
      className="mt-4 rounded-lg border-l-2 p-3 text-sm"
      style={{ background: "var(--surface-2)", borderColor: "var(--accent)" }}
    >
      <p style={{ color: "var(--text)" }}>{text}</p>
    </div>
  );
}
