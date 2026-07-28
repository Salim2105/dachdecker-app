"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { SessionRunner } from "@/components/session/SessionRunner";
import { useProgress } from "@/components/useProgress";
import { datumStore } from "@/lib/appStores";
import { heuteAufgaben, pruefungsreife, tagesdosis, type Modus } from "@/lib/tagesplan";

const TAG = 86_400_000;

// Zwei Sitzungsarten, weil zwei Inhaltsarten existieren: Fachbegriffe und
// Einzelwerte lassen sich in einer Pause abfragen, mehrschrittige Rechnungen
// nicht — die brauchen die ganze Kette am Stück.
const MODI: { id: Modus; titel: string; dauer: string; text: string }[] = [
  {
    id: "kurz",
    titel: "Kurz",
    dauer: "2–5 Min",
    text: "Begriffe, Werte, Regeln. Passt in die Pause.",
  },
  {
    id: "tief",
    titel: "Rechnen",
    dauer: "10–15 Min",
    text: "Mehrschrittige Aufgaben am Stück. Besser mit Ruhe.",
  },
  { id: "alles", titel: "Alles", dauer: "gemischt", text: "Fällige Wiederholungen und Neues." },
];

export default function HeutePage() {
  const { fortschritt } = useProgress();
  const datum = useSyncExternalStore(
    datumStore.subscribe,
    datumStore.getSnapshot,
    datumStore.getServerSnapshot,
  );
  const [now] = useState(() => Date.now());
  const [modus, setModus] = useState<Modus | null>(null);

  const tageBis = datum
    ? Math.ceil((new Date(datum + "T00:00:00").getTime() - now) / TAG)
    : null;
  const grad = pruefungsreife(fortschritt, now);
  const dosis = tagesdosis(grad, tageBis);

  if (modus) {
    const aufgaben = heuteAufgaben(fortschritt, now, dosis, modus);
    if (aufgaben.length === 0) {
      return (
        <div>
          <button onClick={() => setModus(null)} className="text-sm" style={{ color: "var(--text-muted)" }}>
            ← Zurück
          </button>
          <p className="mt-6 text-[17px]">Für heute ist in dieser Sitzungsart nichts offen.</p>
          <p className="mt-2 text-[15px]" style={{ color: "var(--text-muted)" }}>
            Wähle eine andere Sitzungsart oder üb ein Lernfeld gezielt.
          </p>
          <Link href="/lernen" className="mt-4 inline-block text-[15px]" style={{ color: "var(--accent)" }}>
            Zu den Lernfeldern
          </Link>
        </div>
      );
    }
    return (
      <div>
        <button onClick={() => setModus(null)} className="text-sm" style={{ color: "var(--text-muted)" }}>
          ← Heute
        </button>
        <div className="mt-3">
          <SessionRunner aufgaben={aufgaben} lfId="heute" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Heute dran</h1>
        <p className="mt-1.5 text-[17px]" style={{ color: "var(--text-muted)" }}>
          {tageBis !== null && tageBis > 0 ? (
            <>
              <span className="tnum font-semibold" style={{ color: "var(--text)" }}>
                {dosis}
              </span>{" "}
              Aufgaben, damit du bis zur Prüfung durchkommst.
            </>
          ) : (
            <>
              <span className="tnum font-semibold" style={{ color: "var(--text)" }}>
                {dosis}
              </span>{" "}
              Aufgaben für heute.
            </>
          )}
        </p>
      </div>

      {/* Was ansteht — nackte Zahlen, keine Auszeichnungen. */}
      <div
        className="grid grid-cols-2 gap-3 rounded-[var(--r-lg)] border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div>
          <div className="tnum text-[26px] font-semibold leading-none">{grad.faellig}</div>
          <div className="mt-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
            fällig zur Wiederholung
          </div>
        </div>
        <div>
          <div className="tnum text-[26px] font-semibold leading-none">{grad.neu}</div>
          <div className="mt-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
            noch nie bearbeitet
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {MODI.map((m) => (
          <button
            key={m.id}
            onClick={() => setModus(m.id)}
            className="flex min-h-14 items-center justify-between rounded-[var(--r-lg)] border px-5 py-4 text-left transition-transform active:scale-[0.99]"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <span className="min-w-0">
              <span className="block text-[17px] font-semibold">{m.titel}</span>
              <span className="mt-0.5 block text-[13px]" style={{ color: "var(--text-muted)" }}>
                {m.text}
              </span>
            </span>
            <span
              className="ml-3 flex-shrink-0 text-[13px] font-medium tnum"
              style={{ color: "var(--text-faint)" }}
            >
              {m.dauer}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
