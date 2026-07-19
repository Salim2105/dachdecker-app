"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getLernfelder, getAufgaben } from "@/lib/content";
import { useProgress } from "@/components/useProgress";

const TAG = 86_400_000;

export default function Home() {
  const { fortschritt } = useProgress();
  const [datum, setDatum] = useState("");
  const [letztesLf, setLetztesLf] = useState("lf01");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDatum(localStorage.getItem("pruefungsdatum") ?? "");
    setLetztesLf(localStorage.getItem("letztesLf") ?? "lf01");
  }, []);

  const speichereDatum = (wert: string) => {
    setDatum(wert);
    try {
      if (wert) localStorage.setItem("pruefungsdatum", wert);
      else localStorage.removeItem("pruefungsdatum");
    } catch {}
  };

  // Gesamtfortschritt über alle Lernfelder
  let total = 0;
  let done = 0;
  for (const lf of getLernfelder()) {
    const ids = getAufgaben(lf.id).map((a) => a.id);
    total += ids.length;
    done += ids.filter((id) => fortschritt[id] && fortschritt[id].bewertung !== "falsch").length;
  }
  const prozent = total > 0 ? Math.round((done / total) * 100) : 0;

  const tageBis = (() => {
    if (!datum) return null;
    const diff = Math.ceil((new Date(datum + "T00:00:00").getTime() - Date.now()) / TAG);
    return diff;
  })();

  return (
    <div>
      <h1 className="text-2xl font-medium">Bereit für die Gesellenprüfung</h1>
      <p className="mt-1" style={{ color: "var(--text-muted)" }}>
        Übe alle Lernfelder — vom Material bis zum Bau.
      </p>

      {/* Countdown */}
      <div
        className="mt-5 rounded-xl border p-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {mounted && tageBis !== null ? (
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-medium" style={{ color: "var(--accent)" }}>
                {tageBis >= 0 ? `${tageBis} Tage` : "Prüfung vorbei"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                bis zur Gesellenprüfung
              </div>
            </div>
            <button
              onClick={() => speichereDatum("")}
              className="text-xs underline"
              style={{ color: "var(--text-muted)" }}
            >
              ändern
            </button>
          </div>
        ) : (
          <label className="block text-sm">
            <span style={{ color: "var(--text-muted)" }}>Wann ist deine Prüfung?</span>
            <input
              type="date"
              value={datum}
              onChange={(e) => speichereDatum(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
            />
          </label>
        )}
      </div>

      {/* Gesamtfortschritt */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Gesamtfortschritt</span>
          <span style={{ color: "var(--text)" }} suppressHydrationWarning>
            {mounted ? `${done} / ${total}` : `0 / ${total}`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${mounted ? prozent : 0}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      {/* Aktionen */}
      <div className="mt-6 flex flex-col gap-2">
        <Link
          href={`/lernen/${letztesLf}`}
          className="rounded-xl px-5 py-4 text-center font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Weiterlernen
        </Link>
        <Link
          href="/lernen"
          className="rounded-xl border px-5 py-4 text-center font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Alle Lernfelder
        </Link>
      </div>
    </div>
  );
}
