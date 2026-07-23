"use client";
import { useMemo, useState } from "react";
import type { ClozeAufgabe, Bewertung, AufgabeModus } from "@/content/schema";
import { parseCloze, pruefeLuecke } from "@/lib/cloze";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";

export function ClozeCard({
  aufgabe,
  onErgebnis,
  modus = "uebung",
}: {
  aufgabe: ClozeAufgabe;
  onErgebnis: (b: Bewertung) => void;
  modus?: AufgabeModus;
}) {
  const aufloesen = modus === "uebung";
  const teile = useMemo(() => parseCloze(aufgabe.text), [aufgabe.text]);
  const [eingaben, setEingaben] = useState<Record<number, string>>({});
  const [geprueft, setGeprueft] = useState(false);

  const gaps = teile.filter((t) => t.type === "gap") as Extract<
    (typeof teile)[number],
    { type: "gap" }
  >[];

  const istGapKorrekt = (antwort: string, eingabe: string) =>
    pruefeLuecke(eingabe ?? "", antwort, aufgabe.akzeptiert?.[antwort] ?? []);

  const pruefen = () => {
    setGeprueft(true);
    const richtig = gaps.filter((g) => istGapKorrekt(g.antwort, eingaben[g.index] ?? "")).length;
    const bewertung: Bewertung =
      richtig === gaps.length ? "richtig" : richtig === 0 ? "falsch" : "teilweise";
    onErgebnis(bewertung);
  };

  const randfarbe = (g: { antwort: string; index: number }) => {
    if (!geprueft || !aufloesen) return "var(--border)";
    return istGapKorrekt(g.antwort, eingaben[g.index] ?? "") ? "var(--ok)" : "var(--bad)";
  };

  return (
    <div>
      <p className="text-base leading-loose">
        {teile.map((t, i) =>
          t.type === "text" ? (
            <span key={i}>{t.value}</span>
          ) : (
            <input
              key={i}
              value={eingaben[t.index] ?? ""}
              onChange={(e) =>
                setEingaben((prev) => ({ ...prev, [t.index]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !geprueft) pruefen();
              }}
              disabled={geprueft}
              aria-label={`Lücke ${t.index + 1}`}
              className="mx-1 w-32 rounded-md border px-2 py-1 text-sm"
              style={{ borderColor: randfarbe(t), background: "var(--surface)", color: "var(--text)" }}
            />
          ),
        )}
      </p>
      {geprueft && aufloesen && (
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          Lösung:{" "}
          {gaps.map((g, i) => (
            <span key={g.index} style={{ color: "var(--text)" }}>
              {g.antwort}
              {i < gaps.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}
      {!geprueft ? (
        <button
          onClick={pruefen}
          className="mt-4 w-full rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {aufloesen ? "Prüfen" : "Antwort abgeben"}
        </button>
      ) : (
        aufloesen && <Erklaerung text={aufgabe.erklaerung} />
      )}
    </div>
  );
}
