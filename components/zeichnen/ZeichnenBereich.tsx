"use client";
import { useState } from "react";
import type { DrawAufgabe, Bewertung } from "@/content/schema";
import { DrawCard } from "@/components/aufgaben/DrawCard";
import { useProgress } from "@/components/useProgress";
import { getLernfeld } from "@/lib/content";
import { alleZeichenaufgaben, zeichenaufgabenNachLernfeld } from "@/lib/zeichnen";
import { zieheAufgaben } from "@/lib/pruefung";
import { ladeZeichenLauf, speichereZeichenLauf, type ZeichenLauf } from "@/lib/zeichenSpeicher";

export function ZeichnenBereich() {
  const { fortschritt, bewerte } = useProgress();
  const gruppen = zeichenaufgabenNachLernfeld();
  const alle = alleZeichenaufgaben();
  const [lauf, setLauf] = useState<ZeichenLauf | null>(() => ladeZeichenLauf(new Set(alle.map((a) => a.id))));
  const [aktiv, setAktiv] = useState(true);
  const [speicherFehler, setSpeicherFehler] = useState("");

  function aktualisiereLauf(neu: ZeichenLauf | null) {
    setLauf(neu);
    try { speichereZeichenLauf(neu); setSpeicherFehler(""); }
    catch { setSpeicherFehler("Der Zeichenlauf konnte nicht gespeichert werden. Deine einzelnen Entwürfe bleiben bei ihren Aufgaben."); }
  }

  const starte = (aufgaben: DrawAufgabe[]) => {
    if (!aufgaben.length) return;
    aktualisiereLauf({ ids: aufgaben.map((a) => a.id), index: 0, bewertungen: {} });
    setAktiv(true);
  };

  if (lauf && aktiv) {
    const aktuell = alle.find((a) => a.id === lauf.ids[lauf.index])!;
    const beantwortet = !!lauf.bewertungen[aktuell.id];
    const lf = getLernfeld(aktuell.lernfeld);
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setAktiv(false)} className="text-sm" style={{ color: "var(--text-muted)" }}>
            ← Zeichnen
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {lauf.index + 1} / {lauf.ids.length}
          </span>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {lf ? `LF ${lf.nr} · ${lf.titel}` : aktuell.lernfeld}
        </p>

        <DrawCard
          key={aktuell.id}
          aufgabe={aktuell}
          anfangsBewertung={lauf.bewertungen[aktuell.id]}
          onErgebnis={(b: Bewertung) => {
            if (beantwortet) return;
            aktualisiereLauf({ ...lauf, bewertungen: { ...lauf.bewertungen, [aktuell.id]: b } });
            bewerte(aktuell.id, b, { selbstBewertet: true });
          }}
        />

        {speicherFehler && <p role="alert" className="mt-3 text-sm" style={{ color: "var(--bad)" }}>{speicherFehler}</p>}
        {beantwortet && (
          <button
            onClick={() => {
              if (lauf.index < lauf.ids.length - 1) aktualisiereLauf({ ...lauf, index: lauf.index + 1 });
              else aktualisiereLauf(null);
            }}
            className="mt-6 w-full rounded-xl py-3 font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            {lauf.index < lauf.ids.length - 1 ? "Nächste Zeichnung" : "Fertig"}
          </button>
        )}
      </div>
    );
  }

  const geuebt = alle.filter((a) => fortschritt[a.id]).length;

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight">Zeichnen</h1>
      <p className="mt-1 text-[15px]" style={{ color: "var(--text-muted)" }}>
        Mit Maus, Trackpad oder Tastatur zeichnen – oder ein Papierfoto mit der Musterlösung vergleichen. Deine Entwürfe bleiben erhalten; die Bewertung erfolgt durch dich.
      </p>

      {lauf && <button onClick={() => setAktiv(true)} className="mt-4 min-h-14 w-full rounded-xl border p-3 text-left font-medium" style={{ borderColor: "var(--accent)", background: "var(--surface-2)" }}>Zeichenlauf fortsetzen · {lauf.index + 1} von {lauf.ids.length}</button>}
      {speicherFehler && <p role="alert" className="mt-3 text-sm" style={{ color: "var(--bad)" }}>{speicherFehler}</p>}
      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={() => starte(zieheAufgaben(alle, alle.length))}
          className="rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Alle {alle.length} zeichnen, gemischt
        </button>
        {geuebt < alle.length && (
          <button
            onClick={() => starte(alle.filter((a) => !fortschritt[a.id]))}
            className="rounded-xl border py-3 font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Nur die {alle.length - geuebt} noch offenen
          </button>
        )}
      </div>

      <h2
        className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--text-faint)" }}
      >
        Einzeln auswählen
      </h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {gruppen.map((g) => {
          const lf = getLernfeld(g.lernfeld);
          return g.aufgaben.map((a) => {
            const status = fortschritt[a.id]?.bewertung;
            const pille =
              status === "richtig"
                ? { text: "sitzt", farbe: "var(--ok)" }
                : status === "teilweise"
                  ? { text: "fast", farbe: "var(--accent)" }
                  : status === "falsch"
                    ? { text: "nochmal", farbe: "var(--bad)" }
                    : null;
            return (
              <button
                key={a.id}
                onClick={() => starte([a])}
                className="rounded-[var(--r-lg)] border p-4 text-left transition-transform active:scale-[0.99]"
                style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {lf ? (/^\d/.test(lf.nr) ? `LF ${lf.nr}` : lf.nr) : g.lernfeld} · {a.thema}
                  </span>
                  {pille && (
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `color-mix(in srgb, ${pille.farbe} 18%, transparent)`, color: pille.farbe }}
                    >
                      {pille.text}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {a.aufgabentext.split(/(?<=\.)\s/)[0]}
                </div>
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}
