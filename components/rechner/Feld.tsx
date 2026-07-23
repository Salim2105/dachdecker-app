"use client";

export function Feld({
  label,
  einheit,
  wert,
  onWert,
  schritt = "any",
}: {
  label: string;
  einheit?: string;
  wert: string;
  onWert: (v: string) => void;
  schritt?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={schritt}
          value={wert}
          onChange={(e) => onWert(e.target.value)}
          className="w-28 rounded-lg border px-3 py-2 text-right text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
        />
        <span className="w-10 text-xs" style={{ color: "var(--text-muted)" }}>
          {einheit}
        </span>
      </span>
    </label>
  );
}

export function Ergebnis({
  label,
  wert,
  einheit,
  gross = false,
}: {
  label: string;
  wert: string;
  einheit: string;
  gross?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span
        className={gross ? "text-2xl font-medium tabular-nums" : "text-base tabular-nums"}
        style={{ color: gross ? "var(--accent)" : "var(--text)" }}
      >
        {wert} <span className="text-xs">{einheit}</span>
      </span>
    </div>
  );
}

export function Hinweis({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-3 flex gap-2.5 rounded-[var(--r-md)] p-3 text-xs leading-relaxed"
      style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
    >
      <svg
        width="15"
        height="15"
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
      <div>{children}</div>
    </div>
  );
}

export function Block({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {children}
    </div>
  );
}

export function num(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
