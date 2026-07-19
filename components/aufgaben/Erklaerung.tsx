export function Erklaerung({ text, quelle }: { text: string; quelle: string }) {
  return (
    <div
      className="mt-4 rounded-lg border-l-2 p-3 text-sm"
      style={{ background: "var(--surface-2)", borderColor: "var(--accent)" }}
    >
      <p style={{ color: "var(--text)" }}>{text}</p>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        Quelle: {quelle}
      </p>
    </div>
  );
}
