"use client";
import { useEffect, useState } from "react";
import type { Aufgabe, Bewertung } from "@/content/schema";
import { AufgabeSwitch } from "@/components/session/AufgabeSwitch";
import { Wiederholung } from "@/components/session/Wiederholung";
import { useProgress } from "@/components/useProgress";
import { getLernfeld } from "@/lib/content";
import { leereCalcCache } from "@/lib/calc";
import {
  getPruefungsteile,
  poolFuer,
  zieheAufgaben,
  prozentFuer,
  noteFuer,
  bestanden,
  formatiereZeit,
  punkteFuer,
  type Pruefungsteil,
} from "@/lib/pruefung";

interface Lauf {
  teil: Pruefungsteil;
  aufgaben: Aufgabe[];
  endeAm: number;
}

export function PruefungRunner() {
  const { bewerte } = useProgress();
  const teile = getPruefungsteile();

  const [lauf, setLauf] = useState<Lauf | null>(null);
  const [index, setIndex] = useState(0);
  const [ergebnisse, setErgebnisse] = useState<Bewertung[]>([]);
  const [beantwortet, setBeantwortet] = useState(false);
  const [abgegeben, setAbgegeben] = useState(false);
  const [jetzt, setJetzt] = useState(0);
  const [nachbereitung, setNachbereitung] = useState<Aufgabe[] | null>(null);

  // Tickt nur, solange eine Prüfung läuft. setState passiert im Intervall-
  // Callback, nicht im Effekt-Körper.
  useEffect(() => {
    if (!lauf || abgegeben) return;
    const id = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lauf, abgegeben]);

  // Neue Frage → nach oben scrollen.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index, lauf]);

  // jetztMs kommt aus dem Event-Handler, damit im Render keine Zeit gelesen wird.
  const starte = (teil: Pruefungsteil, jetztMs: number) => {
    leereCalcCache(); // frische Zahlen für jede Prüfung
    const gezogen = zieheAufgaben(poolFuer(teil), teil.anzahl);
    setLauf({ teil, aufgaben: gezogen, endeAm: jetztMs + teil.minuten * 60_000 });
    setIndex(0);
    setErgebnisse([]);
    setBeantwortet(false);
    setAbgegeben(false);
    setJetzt(jetztMs);
    setNachbereitung(null);
  };

  const zurueck = () => {
    setLauf(null);
    setNachbereitung(null);
  };

  // ---------- Nachbereitung: falsche Aufgaben mit voller Auflösung ----------
  if (nachbereitung) {
    return <Wiederholung aufgaben={nachbereitung} titel="Nachbereitung" onFertig={zurueck} />;
  }

  // ---------- Auswahl ----------
  if (!lauf) {
    return (
      <div>
        <h1 className="text-xl font-medium">Prüfungssimulation</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Auf Zeit, ohne Zwischenlösungen — die Auswertung kommt am Ende. Gezogen
          werden nur automatisch bewertbare Aufgaben; Zeichnen und Fachbegriffe
          übst du im Lernbereich.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {teile.map((t) => {
            const verfuegbar = poolFuer(t).length;
            const anzahl = Math.min(t.anzahl, verfuegbar);
            return (
              <button
                key={t.id}
                onClick={() => starte(t, Date.now())}
                disabled={verfuegbar === 0}
                className="rounded-xl border p-4 text-left disabled:opacity-40"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div className="font-medium" style={{ color: "var(--text)" }}>
                  {t.titel}
                </div>
                <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {t.beschreibung}
                </div>
                <div className="mt-2 text-xs" style={{ color: "var(--accent)" }}>
                  {anzahl} Aufgaben · {t.minuten} Minuten
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
          Aufgabenzahl und Zeit sind Übungswerte, keine amtlichen Prüfungsvorgaben.
          Wie deine Prüfung genau abläuft, legt die Handwerkskammer fest.
        </p>
      </div>
    );
  }

  const restSekunden = (lauf.endeAm - jetzt) / 1000;
  const zeitAbgelaufen = restSekunden <= 0;
  const fertig = abgegeben || zeitAbgelaufen;

  // ---------- Ergebnis ----------
  if (fertig) {
    const prozent = prozentFuer(ergebnisse, lauf.aufgaben.length);
    const note = noteFuer(prozent);
    const ok = bestanden(prozent);
    const falsche = lauf.aufgaben.filter((_, i) => ergebnisse[i] !== "richtig");

    const proLernfeld = new Map<string, { richtig: number; gesamt: number }>();
    lauf.aufgaben.forEach((a, i) => {
      const e = proLernfeld.get(a.lernfeld) ?? { richtig: 0, gesamt: 0 };
      e.gesamt += 1;
      e.richtig += punkteFuer(ergebnisse[i] ?? "falsch");
      proLernfeld.set(a.lernfeld, e);
    });

    return (
      <div>
        <h1 className="text-xl font-medium">
          {zeitAbgelaufen && !abgegeben ? "Zeit abgelaufen" : "Prüfung ausgewertet"}
        </h1>

        <div
          className="mt-5 rounded-xl border p-5 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="text-4xl font-medium" style={{ color: ok ? "var(--ok)" : "var(--bad)" }}>
            {prozent.toFixed(0)} %
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--text)" }}>
            Note {note.note} — {note.text}
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {ergebnisse.filter((e) => e === "richtig").length} von {lauf.aufgaben.length} voll richtig
            {ergebnisse.length < lauf.aufgaben.length &&
              ` · ${lauf.aufgaben.length - ergebnisse.length} nicht bearbeitet`}
          </div>
        </div>

        <h2 className="mt-6 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Nach Lernfeld
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          {[...proLernfeld.entries()]
            .sort((a, b) => a[1].richtig / a[1].gesamt - b[1].richtig / b[1].gesamt)
            .map(([lfId, e]) => {
              const anteil = e.richtig / e.gesamt;
              const nr = getLernfeld(lfId)?.nr;
              // WiSo hat keine Nummer — dann steht dort kein "LF" davor.
              const label = !nr ? lfId : /^\d/.test(nr) ? `LF ${nr}` : nr;
              return (
                <div key={lfId} className="flex items-center gap-3">
                  <span className="w-28 flex-shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${anteil * 100}%`,
                        background: anteil >= 0.5 ? "var(--ok)" : "var(--bad)",
                      }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                    {e.richtig} / {e.gesamt}
                  </span>
                </div>
              );
            })}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          {falsche.length > 0 && (
            <button
              onClick={() => setNachbereitung(falsche)}
              className="rounded-xl py-3 font-medium"
              style={{ background: "var(--accent)", color: "var(--accent-text)" }}
            >
              {falsche.length} Aufgabe{falsche.length === 1 ? "" : "n"} durchgehen
            </button>
          )}
          <button
            onClick={() => starte(lauf.teil, Date.now())}
            className="rounded-xl border py-3 font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Neue Prüfung, gleicher Teil
          </button>
          <button
            onClick={zurueck}
            className="rounded-xl py-3 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Zur Auswahl
          </button>
        </div>
      </div>
    );
  }

  // ---------- Laufende Prüfung ----------
  const aktuell = lauf.aufgaben[index];
  const knapp = restSekunden < 300;

  const handleErgebnis = (b: Bewertung) => {
    if (beantwortet) return;
    setBeantwortet(true);
    bewerte(aktuell.id, b);
    setErgebnisse((prev) => [...prev, b]);
  };

  const weiter = () => {
    if (index < lauf.aufgaben.length - 1) {
      setIndex((i) => i + 1);
      setBeantwortet(false);
    } else {
      setAbgegeben(true);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${((index + (beantwortet ? 1 : 0)) / lauf.aufgaben.length) * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {lauf.aufgaben.length}
        </span>
        <span
          className="rounded-md px-2 py-1 text-xs font-medium tabular-nums"
          style={{
            background: "var(--surface-2)",
            color: knapp ? "var(--bad)" : "var(--text)",
          }}
          aria-label="Verbleibende Zeit"
        >
          {formatiereZeit(restSekunden)}
        </span>
      </div>

      <AufgabeSwitch key={aktuell.id} aufgabe={aktuell} onErgebnis={handleErgebnis} modus="pruefung" />

      {beantwortet && (
        <button
          onClick={weiter}
          className="mt-6 w-full rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {index < lauf.aufgaben.length - 1 ? "Nächste Aufgabe" : "Prüfung abgeben"}
        </button>
      )}

      <button
        onClick={() => setAbgegeben(true)}
        className="mt-3 w-full rounded-xl py-2 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        Vorzeitig abgeben
      </button>
    </div>
  );
}
