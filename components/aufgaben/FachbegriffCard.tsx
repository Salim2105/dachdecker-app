"use client";
import { useState } from "react";
import type { FachbegriffAufgabe, Bewertung } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";

export function FachbegriffCard({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: FachbegriffAufgabe;
  onErgebnis: (b: Bewertung) => void;
}) {
  const [umgedreht, setUmgedreht] = useState(false);

  return (
    <div>
      <div
        className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: "var(--surface-2)", color: "var(--accent)" }}
      >
        Fachbegriff
      </div>

      <div
        className="rounded-xl border p-5 text-center"
        style={{ background: "var(--surface)", borderColor: "var(--border)", minHeight: "8rem" }}
      >
        <p className="text-lg font-medium">{aufgabe.begriff}</p>
        {aufgabe.bestandteile && aufgabe.bestandteile.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {aufgabe.bestandteile.map((teil, i) => (
              <span
                key={i}
                className="rounded px-2 py-0.5 text-xs"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
              >
                {teil}
              </span>
            ))}
          </div>
        )}

        {umgedreht && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            {aufgabe.bildSvg && <SafeSvg markup={aufgabe.bildSvg} className="mb-3 flex justify-center" />}
            <p className="text-sm" style={{ color: "var(--text)" }}>
              {aufgabe.definition}
            </p>
          </div>
        )}
      </div>

      {!umgedreht ? (
        <button
          onClick={() => setUmgedreht(true)}
          className="mt-4 w-full rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Umdrehen
        </button>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onErgebnis("richtig")}
            className="flex-1 rounded-xl py-3 text-sm font-medium"
            style={{ background: "var(--ok)", color: "#08281f" }}
          >
            Gewusst
          </button>
          <button
            onClick={() => onErgebnis("falsch")}
            className="flex-1 rounded-xl border py-3 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Nochmal
          </button>
        </div>
      )}
    </div>
  );
}
