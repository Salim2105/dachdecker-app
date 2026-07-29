"use client";
import { useState } from "react";
import type { FachbegriffAufgabe, Bewertung } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";
import { Buchbild } from "@/components/aufgaben/Buchbild";

export function FachbegriffCard({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: FachbegriffAufgabe;
  onErgebnis: (b: Bewertung) => void;
}) {
  // Erst festlegen, dann aufdecken. Vorher stand "Umdrehen" zuerst und die
  // Bewertung danach — man urteilte über das eigene Wissen, nachdem man die
  // Definition gelesen hatte. Alles wirkt vertraut, sobald es dasteht, und der
  // Klick "Gewusst" verdoppelt das Wiederholungsintervall (lib/progress.ts:12).
  const [bewertung, setBewertung] = useState<Bewertung | null>(null);
  const umgedreht = bewertung !== null;

  const bewerten = (b: Bewertung) => {
    setBewertung(b);
    onErgebnis(b);
  };

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
            {aufgabe.bildDatei && (
              <div className="text-left">
                <Buchbild datei={aufgabe.bildDatei} unterschrift={aufgabe.bildunterschrift} />
              </div>
            )}
          </div>
        )}
      </div>

      {!umgedreht ? (
        <>
          <p className="mt-4 mb-2 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Sag die Definition laut auf. Dann leg dich fest — danach deckt sie auf.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => bewerten("richtig")}
              className="min-h-14 flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: "var(--ok)", color: "#08281f" }}
            >
              Gewusst
            </button>
            <button
              onClick={() => bewerten("falsch")}
              className="min-h-14 flex-1 rounded-xl border py-3 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Nochmal
            </button>
          </div>
        </>
      ) : (
        <p className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Du hast getippt:{" "}
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {bewertung === "richtig" ? "Gewusst" : "Nochmal"}
          </span>
        </p>
      )}
    </div>
  );
}
