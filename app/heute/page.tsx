"use client";
import { appStorage } from "@/lib/lernSpeicher";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Aufgabe } from "@/content/schema";
import { SessionRunner } from "@/components/session/SessionRunner";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { ladeGespeicherteAufgaben } from "@/lib/uebungStand";
import { progressStore } from "@/lib/progressStore";
import { LernzeitWahl } from "@/components/LernzeitWahl";
import { zeitAuswahl } from "@/lib/lernzeit";
import { lernzeitStore } from "@/lib/appStores";
import { heuteAufgaben, istVerkettet, type Modus } from "@/lib/tagesplan";
import { erklaereLernplan } from "@/lib/lernplan";

const SESSION_ID = "heute";
const subscribeClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

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
  const [runde, setRunde] = useState(0);
  const [modus, setModus] = useState<Modus>("alles");

  const wechsle = (m: Modus) => {
    if (m === modus) return;
    // Der gespeicherte Stand gehört zur alten Liste und würde mitten in die
    // neue springen.
    try {
      appStorage.removeItem(`dd-session-${SESSION_ID}`);
    } catch {}
    setModus(m);
  };

  return (
    <div>
      <LernzeitWahl />
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Eine laufende Runde bleibt erhalten. Die Zeitwahl gilt für die nächste Runde.</p>
      <button onClick={() => {
        try { appStorage.removeItem(`dd-session-${SESSION_ID}`); } catch {}
        setRunde((n) => n + 1);
      }} className="my-3 min-h-11 rounded-xl border px-4 text-sm" style={{ borderColor: "var(--border)" }}>
        Neue Runde mit gewählter Zeit
      </button>
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

      <Sitzung key={runde} modus={modus} />
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
  const minuten = useSyncExternalStore(lernzeitStore.subscribe, lernzeitStore.getSnapshot, lernzeitStore.getServerSnapshot);
  const client = useSyncExternalStore(subscribeClient, getClientSnapshot, getServerSnapshot);

  if (!client) {
    return (
      <p className="mt-6 text-[15px]" style={{ color: "var(--text-muted)" }}>
        Aufgaben werden zusammengestellt …
      </p>
    );
  }

  return <GeplanteSitzung key={modus} modus={modus} minuten={minuten} />;
}

function GeplanteSitzung({ modus, minuten }: { modus: Modus; minuten: number }) {
  // Erst nach der Hydrierung lesen, dann die Auswahl für die Sitzung einfrieren.
  // Antworten dürfen die laufende Liste nicht verschieben.
  const [plan] = useState(() => {
    const pool = getLernfelder().flatMap((lf) => getAufgaben(lf.id)).filter((a) =>
      modus === "alles" || (modus === "tief" ? istVerkettet(a) : !istVerkettet(a)),
    );
    const gespeichert = ladeGespeicherteAufgaben(`dd-session-${SESSION_ID}`, pool);
    const fortschritt = progressStore.getSnapshot();
    const jetzt = Date.now();
    const aufgaben: Aufgabe[] = gespeichert ?? zeitAuswahl(heuteAufgaben(fortschritt, jetzt, 60, modus), minuten);
    return { aufgaben, themen: erklaereLernplan(aufgaben, fortschritt, jetzt) };
  });
  const { aufgaben } = plan;

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

  return <>
    <details className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <summary className="min-h-11 cursor-pointer font-medium">Warum diese {aufgaben.length} Aufgaben?</summary>
      <p className="mt-2" style={{ color: "var(--text-muted)" }}>Fällige Wiederholungen kommen zuerst. Danach lernst du Neues aus Lernfeldern, in denen bisher weniger Aufgaben gefestigt sind. Der Plan bleibt während dieser Runde gleich.</p>
      <ul className="mt-3 space-y-2">
        {plan.themen.map((t) => <li key={`${t.lernfeld}:${t.thema}`}>
          <strong>{t.thema || "Übung"}</strong> · {getLernfelder().find((lf) => lf.id === t.lernfeld)?.titel ?? t.lernfeld}
          <div style={{ color: "var(--text-muted)" }}>{[
            t.faellig ? `${t.faellig} fällige Wiederholungen` : "",
            t.neu ? `${t.neu} neue Aufgaben` : "",
            t.freiwillig ? `${t.freiwillig} Aufgaben aus deiner gespeicherten Runde` : "",
          ].filter(Boolean).join(" · ")}</div>
        </li>)}
      </ul>
      <p className="mt-3">Erst selbst antworten, dann die Erklärung vergleichen. Fehler bearbeitest du am Ende der Runde erneut.</p>
    </details>
    <SessionRunner key={modus} aufgaben={aufgaben} lfId={SESSION_ID} />
  </>;
}
