"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Aufgabe, Bewertung } from "@/content/schema";
import { AufgabeSwitch } from "@/components/session/AufgabeSwitch";
import { useProgress } from "@/components/useProgress";
import { letztesLfStore } from "@/lib/appStores";
import { leereCalcCache } from "@/lib/calc";
// Bewusst aus lib/reifegrad: das Modul kennt nur Zahlen, keine Aufgabentexte.
import { pruefungsreife, GESAMT_AUFGABEN } from "@/lib/reifegrad";

// Gespeicherten Übungsstand laden (z. B. nach Abstecher zum Rechner).
function ladeStand(key: string, total: number): { index: number; ergebnisse: Bewertung[]; beantwortet: boolean } {
  if (typeof window !== "undefined") {
    try {
      const s = JSON.parse(localStorage.getItem(key) || "null");
      if (s && typeof s.index === "number" && s.index < total) {
        return {
          index: s.index,
          ergebnisse: Array.isArray(s.ergebnisse) ? s.ergebnisse : [],
          beantwortet: !!s.beantwortet,
        };
      }
    } catch {}
  }
  return { index: 0, ergebnisse: [], beantwortet: false };
}

export function SessionRunner({ aufgaben, lfId }: { aufgaben: Aufgabe[]; lfId: string }) {
  const { bewerte } = useProgress();
  const KEY = `dd-session-${lfId}`;
  const [index, setIndex] = useState(() => ladeStand(KEY, aufgaben.length).index);
  const [beantwortet, setBeantwortet] = useState(() => ladeStand(KEY, aufgaben.length).beantwortet);
  const [ergebnisse, setErgebnisse] = useState<Bewertung[]>(() => ladeStand(KEY, aufgaben.length).ergebnisse);
  const [fertig, setFertig] = useState(false);

  useEffect(() => {
    letztesLfStore.set(lfId);
  }, [lfId]);

  // Neue Frage → oben anfangen, sonst landet man mitten in der nächsten Aufgabe.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  // Stand sichern; bei Abschluss aufräumen (inkl. gemerkter Rechen-Zufallszahlen).
  useEffect(() => {
    try {
      if (fertig) {
        localStorage.removeItem(KEY);
        leereCalcCache();
      } else localStorage.setItem(KEY, JSON.stringify({ index, ergebnisse, beantwortet }));
    } catch {}
  }, [KEY, index, ergebnisse, beantwortet, fertig]);

  const aktuell = aufgaben[index];

  const zumNaechsten = () => {
    if (index < aufgaben.length - 1) {
      setIndex((i) => i + 1);
      setBeantwortet(false);
    } else {
      setFertig(true);
    }
  };

  // Alle Typen halten jetzt nach der Bewertung an. Früher sprangen draw und
  // fachbegriff sofort weiter, weil bei ihnen das Antippen der Bewertung schon
  // die Antwort war — die Lösung stand ja bereits darüber. Seit die Bewertung
  // VOR der Lösung kommt, ist das Antippen der Anfang und nicht das Ende: erst
  // danach erscheint die Musterlösung bzw. die Definition, und die will gelesen
  // werden, bevor es weitergeht.
  const handleErgebnis = (b: Bewertung) => {
    if (beantwortet) return;
    bewerte(aktuell.id, b);
    setErgebnisse((prev) => [...prev, b]);
    setBeantwortet(true);
  };

  if (fertig) {
    return (
      <Abschluss
        ergebnisse={ergebnisse}
        // "heute" ist kein Lernfeld — der Weg zurück führt auf die Startseite.
        zurueck={lfId === "heute" ? "/" : `/lernen/${lfId}`}
        nochmal={() => {
          leereCalcCache();
          setIndex(0);
          setBeantwortet(false);
          setErgebnisse([]);
          setFertig(false);
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${((index + (beantwortet ? 1 : 0)) / aufgaben.length) * 100}%`, background: "var(--accent)" }}
          />
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {aufgaben.length}
        </span>
      </div>

      <AufgabeSwitch key={aktuell.id} aufgabe={aktuell} onErgebnis={handleErgebnis} />

      {beantwortet && (
        <button
          onClick={zumNaechsten}
          className="mt-6 w-full rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {index < aufgaben.length - 1 ? "Weiter" : "Ergebnis anzeigen"}
        </button>
      )}
    </div>
  );
}

/**
 * Der Abschluss einer Sitzung.
 *
 * Hier darf Rückmeldung laut sein, und nur hier: Alle Bewertungen sind zu
 * diesem Zeitpunkt längst geschrieben, das Feedback kann also die Entscheidung,
 * die es belohnt, nicht mehr beeinflussen. Bei jeder einzelnen Aufgabe wäre das
 * anders.
 *
 * Der Balken ist derselbe, der oben während der Sitzung vollgelaufen ist — jetzt
 * nach Ergebnis eingefärbt. Er läuft einmal von links auf, sonst passiert
 * nichts. Bewegung statt Sättigung: die --ok/--bad-Töne bleiben gedämpft, weil
 * Sonnenlicht auf dem Dach Farbnuancen wegbrennt.
 */
function Abschluss({
  ergebnisse,
  zurueck,
  nochmal,
}: {
  ergebnisse: Bewertung[];
  zurueck: string;
  nochmal: () => void;
}) {
  const { fortschritt } = useProgress();
  const [aufgelaufen, setAufgelaufen] = useState(false);

  // Erst nach dem Mount, damit der Balken sichtbar von 0 aufläuft statt fertig
  // dazustehen.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAufgelaufen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const zaehle = (b: Bewertung) => ergebnisse.filter((e) => e === b).length;
  const gesamt = Math.max(1, ergebnisse.length);
  const teile: { b: Bewertung; label: string; farbe: string }[] = [
    { b: "richtig", label: "Sitzt", farbe: "var(--ok)" },
    { b: "teilweise", label: "Fast", farbe: "var(--accent)" },
    { b: "falsch", label: "Nochmal", farbe: "var(--bad)" },
  ];

  const punkte = Math.round(pruefungsreife(fortschritt, Date.now()).punkte);

  return (
    <div>
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
        {ergebnisse.length} {ergebnisse.length === 1 ? "Aufgabe" : "Aufgaben"} geschafft.
      </h1>

      <div
        className="ergebnis-balken mt-5 flex h-3 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-2)" }}
        role="img"
        aria-label={teile.map((t) => `${zaehle(t.b)} ${t.label}`).join(", ")}
      >
        {teile.map((t, i) => (
          <div
            key={t.b}
            className="h-full"
            style={
              {
                width: aufgelaufen ? `${(zaehle(t.b) / gesamt) * 100}%` : "0%",
                background: t.farbe,
                "--verzug": `${i * 90}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="mt-4 flex gap-6">
        {teile.map((t) => (
          <div key={t.b}>
            <div className="tnum text-[26px] font-semibold leading-none" style={{ color: t.farbe }}>
              {zaehle(t.b)}
            </div>
            <div className="mt-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* Der Bezug zum Ganzen. Ohne ihn sind die drei Zahlen oben eine Insel:
          zwanzig Aufgaben fühlen sich nach nichts an, wenn 2039 dahinterstehen
          und niemand sagt, wo man steht. */}
      <p className="mt-6 text-[15px]" style={{ color: "var(--text-muted)" }}>
        Damit sitzen{" "}
        <span className="tnum font-semibold" style={{ color: "var(--text)" }}>
          {punkte}
        </span>{" "}
        von <span className="tnum">{GESAMT_AUFGABEN}</span> Aufgaben.
      </p>

      <div className="mt-8 flex flex-col gap-2">
        <button
          onClick={nochmal}
          className="min-h-14 rounded-[var(--r-lg)] py-3 font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Nochmal üben
        </button>
        <Link
          href={zurueck}
          className="flex min-h-14 items-center justify-center rounded-[var(--r-lg)] border py-3 font-semibold"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Fertig
        </Link>
      </div>
    </div>
  );
}
