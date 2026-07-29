"use client";
import { useState } from "react";
import type { DrawAufgabe, Bewertung } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";

/**
 * Zeichenaufgabe: auf Papier zeichnen, sich festlegen, dann vergleichen.
 *
 * Die Reihenfolge ist der Punkt. Vorher stand die Musterlösung ZUERST und die
 * Bewertung danach — man urteilte also über die eigene Zeichnung, nachdem man
 * die richtige gesehen hatte. Das ist Rückschaufehler in Reinform: Alles wirkt
 * vertraut, sobald es vor einem liegt ("wusste ich doch"). Der Klick "Richtig"
 * verdoppelt aber das Wiederholungsintervall (lib/progress.ts:12) — fünf
 * großzügige Klicks schieben eine Aufgabe von 2 auf 32 Tage. Bis zur Prüfung
 * kommt sie dann nicht mehr wieder.
 *
 * Jetzt: erst festlegen, dann aufdecken. Das Urteil ist weniger informiert,
 * aber unverzerrt — und für die Wiederholungsplanung ist unverzerrt besser,
 * denn der Rückschaufehler zieht systematisch in eine Richtung, Unsicherheit
 * dagegen streut. Die Musterlösung wird damit zur Rückmeldung statt zur
 * Vorlage für das eigene Urteil.
 */
const LABELS: Record<Bewertung, string> = {
  richtig: "Sitzt",
  teilweise: "Halb",
  falsch: "Nochmal",
};

export function DrawCard({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: DrawAufgabe;
  onErgebnis: (b: Bewertung) => void;
}) {
  const [bewertung, setBewertung] = useState<Bewertung | null>(null);

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
        ✎ Zeichnen
      </div>
      <p className="text-base font-medium leading-relaxed">{aufgabe.aufgabentext}</p>

      {aufgabe.vorgabeSvg && (
        <SafeSvg
          markup={aufgabe.vorgabeSvg}
          className="my-4 flex justify-center rounded-lg border p-3"
        />
      )}

      {bewertung === null ? (
        <>
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Zeichne die Lösung auf Papier oder deinem iPad. Wenn du fertig bist, leg dich fest —
            danach siehst du die Musterlösung.
          </p>
          <p className="mt-4 mb-2 text-sm font-medium">Wie sicher bist du?</p>
          <div className="flex gap-2">
            <button
              onClick={() => bewerten("richtig")}
              className="min-h-14 flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: "var(--ok)", color: "#08281f" }}
            >
              {LABELS.richtig}
            </button>
            <button
              onClick={() => bewerten("teilweise")}
              className="min-h-14 flex-1 rounded-xl border py-3 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              {LABELS.teilweise}
            </button>
            <button
              onClick={() => bewerten("falsch")}
              className="min-h-14 flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: "var(--bad)", color: "#2a0d0d" }}
            >
              {LABELS.falsch}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4">
          {/* Was man vorher gesagt hat, bleibt sichtbar — sonst korrigiert man
              es beim Vergleichen still nach oben. */}
          <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Du hast getippt:{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {LABELS[bewertung]}
            </span>
          </p>
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

          <Erklaerung text={aufgabe.erklaerung} />
        </div>
      )}
    </div>
  );
}
