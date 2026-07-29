"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Aufgabe } from "@/content/schema";
import { SessionRunner } from "@/components/session/SessionRunner";
import { useProgress } from "@/components/useProgress";
import { datumStore } from "@/lib/appStores";
import { heuteAufgaben, pruefungsreife, tagesdosis, type Modus } from "@/lib/tagesplan";

const TAG = 86_400_000;
const SESSION_ID = "heute";

// Zwei Sitzungsarten, weil zwei Inhaltsarten existieren: Fachbegriffe und
// Einzelwerte lassen sich in einer Pause abfragen, mehrschrittige Rechnungen
// nicht — die brauchen die ganze Kette am Stück.
//
// "alles" startet sofort. Die Wahl vorweg zu verlangen kostet eine Entscheidung
// genau dann, wenn am wenigsten Kapazität dafür da ist: abends nach der Schicht.
// Die Startseite verspricht "die App wählt aus" — ein Auswahlschirm bricht das
// Versprechen einen Tipp später. Wer umschalten will, tut es in der Sitzung.
const MODI: { id: Modus; titel: string }[] = [
  { id: "alles", titel: "Alles" },
  { id: "kurz", titel: "Kurz" },
  { id: "tief", titel: "Rechnen" },
];

export default function HeutePage() {
  const [modus, setModus] = useState<Modus>("alles");

  const wechsle = (m: Modus) => {
    if (m === modus) return;
    // Der gespeicherte Stand gehört zur alten Liste und würde mitten in die
    // neue springen.
    try {
      localStorage.removeItem(`dd-session-${SESSION_ID}`);
    } catch {}
    setModus(m);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {MODI.map((m) => {
          const aktiv = m.id === modus;
          return (
            <button
              key={m.id}
              onClick={() => wechsle(m.id)}
              aria-pressed={aktiv}
              className="min-h-9 rounded-full border px-4 text-[13px] font-medium transition-colors"
              style={
                aktiv
                  ? {
                      background: "var(--accent)",
                      borderColor: "var(--accent)",
                      color: "var(--accent-text)",
                    }
                  : {
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }
              }
            >
              {m.titel}
            </button>
          );
        })}
      </div>

      <Sitzung modus={modus} />
    </div>
  );
}

/**
 * Stellt die Aufgabenliste EINMAL je Sitzungsart zusammen.
 *
 * heuteAufgaben() liest den Fortschritt, und der ändert sich mit jeder Antwort:
 * Würde die Liste bei jedem Render neu entstehen, fiele die eben beantwortete
 * Aufgabe aus den Fälligen heraus, die Liste rutschte um eins — und der Index
 * der laufenden Sitzung zeigte plötzlich auf eine übersprungene Frage.
 */
function Sitzung({ modus }: { modus: Modus }) {
  const { fortschritt } = useProgress();
  const datum = useSyncExternalStore(
    datumStore.subscribe,
    datumStore.getSnapshot,
    datumStore.getServerSnapshot,
  );
  const [aufgaben, setAufgaben] = useState<Aufgabe[] | null>(null);

  // Erst nach dem Mount: währenddessen liefert der Fortschritts-Store noch den
  // leeren Server-Snapshot, und die Liste bestünde nur aus neuen Aufgaben.
  useEffect(() => {
    const jetzt = Date.now();
    const tageBis = datum
      ? Math.ceil((new Date(datum + "T00:00:00").getTime() - jetzt) / TAG)
      : null;
    const dosis = tagesdosis(pruefungsreife(fortschritt, jetzt), tageBis);
    setAufgaben(heuteAufgaben(fortschritt, jetzt, dosis, modus));
    // fortschritt bewusst nicht in den Abhängigkeiten — siehe Kommentar oben.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modus, datum]);

  if (aufgaben === null) {
    return (
      <p className="mt-6 text-[15px]" style={{ color: "var(--text-muted)" }}>
        Aufgaben werden zusammengestellt …
      </p>
    );
  }

  if (aufgaben.length === 0) {
    return (
      <div className="mt-6">
        <p className="text-[17px]">Für heute ist in dieser Sitzungsart nichts offen.</p>
        <p className="mt-2 text-[15px]" style={{ color: "var(--text-muted)" }}>
          Wähle oben eine andere Sitzungsart oder üb ein Lernfeld gezielt.
        </p>
        <Link
          href="/lernen"
          className="mt-4 inline-block text-[15px]"
          style={{ color: "var(--accent)" }}
        >
          Zu den Lernfeldern
        </Link>
      </div>
    );
  }

  return <SessionRunner key={modus} aufgaben={aufgaben} lfId={SESSION_ID} />;
}
