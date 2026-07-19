"use client";
import { useState } from "react";
import type { DrawAufgabe, Bewertung } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";

export function DrawCard({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: DrawAufgabe;
  onErgebnis: (b: Bewertung) => void;
}) {
  const [gezeigt, setGezeigt] = useState(false);

  const bewerten = (b: Bewertung) => onErgebnis(b);

  return (
    <div>
      <div
        className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: "var(--surface-2)", color: "var(--accent)" }}
      >
        ✎ Zeichnen
      </div>
      <p className="text-base font-medium leading-relaxed">{aufgabe.aufgabentext}</p>

      {aufgabe.vorgabeSvg && (
        <SafeSvg
          markup={aufgabe.vorgabeSvg}
          className="my-4 flex justify-center rounded-lg border p-3"
        />
      )}

      {!gezeigt ? (
        <>
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Zeichne die Lösung auf Papier oder deinem iPad. Wenn du fertig bist, decke die
            Musterlösung auf und vergleiche.
          </p>
          <button
            onClick={() => setGezeigt(true)}
            className="mt-4 w-full rounded-xl py-3 font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            Lösung zeigen
          </button>
        </>
      ) : (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Musterlösung
          </p>
          <SafeSvg
            markup={aufgabe.loesungSvg}
            className="flex justify-center rounded-lg border p-3"
          />
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            {aufgabe.schritte.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs"
                  style={{ background: "var(--surface-2)", color: "var(--accent)" }}
                >
                  {i + 1}
                </span>
                <span style={{ color: "var(--text)" }}>{s}</span>
              </li>
            ))}
          </ol>

          <Erklaerung text={aufgabe.erklaerung} quelle={aufgabe.quelle} />

          <p className="mt-4 mb-2 text-sm font-medium">Wie war deine Zeichnung?</p>
          <div className="flex gap-2">
            <button
              onClick={() => bewerten("richtig")}
              className="flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: "var(--ok)", color: "#08281f" }}
            >
              Richtig
            </button>
            <button
              onClick={() => bewerten("teilweise")}
              className="flex-1 rounded-xl border py-3 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Fast
            </button>
            <button
              onClick={() => bewerten("falsch")}
              className="flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: "var(--bad)", color: "#2a0d0d" }}
            >
              Nochmal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
