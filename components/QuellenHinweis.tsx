export function QuellenHinweis({ quelle }: { quelle: string }) {
  if (!quelle.trim()) return null;
  return (
    <details className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
      <summary className="min-h-9 cursor-pointer py-2">Quelle ansehen</summary>
      <p className="mt-1 break-words leading-relaxed">{quelle}</p>
    </details>
  );
}
