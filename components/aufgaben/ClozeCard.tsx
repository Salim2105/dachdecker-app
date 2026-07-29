"use client";
import { useMemo, useState } from "react";
import type { ClozeAufgabe, Bewertung, AufgabeModus } from "@/content/schema";
import { parseCloze, pruefeLuecke } from "@/lib/cloze";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { Buchbild } from "@/components/aufgaben/Buchbild";
import { wortbankStore } from "@/lib/appStores";
import { useSyncExternalStore } from "react";
import { trefferRueckmeldung, pulsKlasse } from "@/lib/rueckmeldung";

/** Reihenfolge stabil pro Aufgabe mischen, damit sie beim Tippen nicht springt. */
function mischen<T>(xs: T[], saat: string): T[] {
  let h = 0;
  for (let i = 0; i < saat.length; i++) h = (h * 31 + saat.charCodeAt(i)) >>> 0;
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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
  const [bewertung, setBewertung] = useState<Bewertung | null>(null);
  const [aktiveLuecke, setAktiveLuecke] = useState<number | null>(null);

  // Auf dem Dach ist Freitext mit Arbeitshandschuhen praktisch nicht tippbar.
  // Die Wortbank ersetzt die Tastatur durch antippbare Wörter — bewusst als
  // Schalter und nicht als Standard, weil freies Schreiben schwerer ist und
  // drinnen die ehrlichere Übung bleibt.
  const wortbankAn = useSyncExternalStore(
    wortbankStore.subscribe,
    wortbankStore.getSnapshot,
    wortbankStore.getServerSnapshot,
  );

  const gaps = teile.filter((t) => t.type === "gap") as Extract<
    (typeof teile)[number],
    { type: "gap" }
  >[];

  const woerter = useMemo(
    () => mischen(gaps.map((g) => g.antwort), aufgabe.id),
    [gaps, aufgabe.id],
  );

  const istGapKorrekt = (antwort: string, eingabe: string) =>
    pruefeLuecke(eingabe ?? "", antwort, aufgabe.akzeptiert?.[antwort] ?? []);

  const pruefen = () => {
    setGeprueft(true);
    const richtig = gaps.filter((g) => istGapKorrekt(g.antwort, eingaben[g.index] ?? "")).length;
    const b: Bewertung =
      richtig === gaps.length ? "richtig" : richtig === 0 ? "falsch" : "teilweise";
    setBewertung(b);
    trefferRueckmeldung(b);
    onErgebnis(b);
  };

  const randfarbe = (g: { antwort: string; index: number }) => {
    if (!geprueft || !aufloesen) return "var(--border)";
    return istGapKorrekt(g.antwort, eingaben[g.index] ?? "") ? "var(--ok)" : "var(--bad)";
  };

  // Wort aus der Bank in die aktive Lücke setzen, sonst in die erste leere.
  const wortSetzen = (wort: string) => {
    if (geprueft) return;
    const ziel =
      aktiveLuecke ?? gaps.find((g) => !(eingaben[g.index] ?? "").trim())?.index ?? gaps[0]?.index;
    if (ziel === undefined) return;
    setEingaben((prev) => ({ ...prev, [ziel]: wort }));
    setAktiveLuecke(null);
  };

  const verbraucht = (wort: string) =>
    Object.values(eingaben).filter((v) => v === wort).length >=
    woerter.filter((w) => w === wort).length;

  return (
    <div className={pulsKlasse(geprueft, bewertung)}>
      <p className="text-[17px] leading-loose">
        {teile.map((t, i) =>
          t.type === "text" ? (
            <span key={i}>{t.value}</span>
          ) : wortbankAn ? (
            <button
              key={i}
              onClick={() => {
                if (geprueft) return;
                // Gefüllte Lücke antippen leert sie wieder.
                if ((eingaben[t.index] ?? "").trim()) {
                  setEingaben((prev) => ({ ...prev, [t.index]: "" }));
                  setAktiveLuecke(t.index);
                } else {
                  setAktiveLuecke(aktiveLuecke === t.index ? null : t.index);
                }
              }}
              aria-label={`Lücke ${t.index + 1}`}
              className="mx-1 inline-flex min-h-11 min-w-28 items-center justify-center rounded-[var(--r-sm)] border px-3 align-middle text-[15px]"
              style={{
                borderColor: aktiveLuecke === t.index ? "var(--accent)" : randfarbe(t),
                borderWidth: aktiveLuecke === t.index ? 2 : 1,
                background: "var(--surface-2)",
                color: (eingaben[t.index] ?? "") ? "var(--text)" : "var(--text-faint)",
              }}
            >
              {(eingaben[t.index] ?? "") || "…"}
            </button>
          ) : (
            <input
              key={i}
              value={eingaben[t.index] ?? ""}
              onChange={(e) => setEingaben((prev) => ({ ...prev, [t.index]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !geprueft) pruefen();
              }}
              disabled={geprueft}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={`Lücke ${t.index + 1}`}
              className="mx-1 min-h-11 w-36 rounded-[var(--r-sm)] border px-3 text-[15px]"
              style={{ borderColor: randfarbe(t), background: "var(--surface)", color: "var(--text)" }}
            />
          ),
        )}
      </p>

      {wortbankAn && !geprueft && (
        <div className="mt-4 flex flex-wrap gap-2">
          {woerter.map((w, i) => (
            <button
              key={`${w}-${i}`}
              onClick={() => wortSetzen(w)}
              disabled={verbraucht(w)}
              className="min-h-14 rounded-[var(--r-md)] border px-4 text-[15px] font-medium disabled:opacity-35"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {!geprueft && (
        <button
          onClick={() => wortbankStore.set(!wortbankAn)}
          className="mt-3 text-[13px] underline underline-offset-2"
          style={{ color: "var(--text-muted)" }}
        >
          {wortbankAn ? "Lieber selbst tippen" : "Wörter antippen statt tippen"}
        </button>
      )}

      {geprueft && aufloesen && (
        <p className="mt-3 text-[15px]" style={{ color: "var(--text-muted)" }}>
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
          className="mt-4 min-h-14 w-full rounded-xl py-3 text-[17px] font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {aufloesen ? "Prüfen" : "Antwort abgeben"}
        </button>
      ) : (
        aufloesen && (
          <>
            <Erklaerung text={aufgabe.erklaerung} />
            {aufgabe.bildDatei && (
              <Buchbild datei={aufgabe.bildDatei} unterschrift={aufgabe.bildunterschrift} />
            )}
          </>
        )
      )}
    </div>
  );
}
