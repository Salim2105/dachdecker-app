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
    <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
      {children}
    </p>
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
