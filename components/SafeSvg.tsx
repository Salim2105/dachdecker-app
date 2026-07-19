export function SafeSvg({ markup, className }: { markup: string; className?: string }) {
  return (
    <div
      className={className}
      style={{ color: "var(--text)" }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
