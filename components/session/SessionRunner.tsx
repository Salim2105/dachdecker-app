"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Aufgabe, Bewertung, BewertungsKontext } from "@/content/schema";
import { AufgabeSwitch } from "@/components/session/AufgabeSwitch";
import { useProgress } from "@/components/useProgress";
import { letzteSessionStore, letztesLfStore, tonStore } from "@/lib/appStores";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { leereCalcCache } from "@/lib/calc";
// Bewusst aus lib/reifegrad: das Modul kennt nur Zahlen, keine Aufgabentexte.
import { lernStatus } from "@/lib/lernstand";
import { GESAMT_AUFGABEN } from "@/lib/reifegrad";

import { ladeStand, leererStand } from "@/lib/uebungStand";

const subscribeClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface SessionProps {
  aufgaben: Aufgabe[];
  lfId: string;
  zurueck?: string;
  nachErklaerung?: boolean;
}

export function SessionRunner(props: SessionProps) {
  const { aufgaben, lfId } = props;
  // Während SSR und Hydrierung denselben Platzhalter zeigen. Gespeicherte
  // Indizes dürfen erst danach den ersten Client-Render bestimmen.
  const client = useSyncExternalStore(subscribeClient, getClientSnapshot, getServerSnapshot);
  if (!client) return <p>Sitzung wird geladen …</p>;
  return <AktiveSitzung key={JSON.stringify([lfId, aufgaben.map((a) => a.id)])} {...props} />;
}

function AktiveSitzung({ aufgaben, lfId, zurueck, nachErklaerung }: SessionProps) {
  const { bewerte } = useProgress();
  const KEY = `dd-session-${lfId}`;
  const [stand] = useState(() => ladeStand(KEY, aufgaben) ?? leererStand());
  const [index, setIndex] = useState(stand.index);
  const [beantwortet, setBeantwortet] = useState(stand.beantwortet);
  const [antwortWiederhergestellt, setAntwortWiederhergestellt] = useState(stand.beantwortet);
  const [ergebnisse, setErgebnisse] = useState<Bewertung[]>(stand.ergebnisse);
  const [nacharbeit, setNacharbeit] = useState(stand.nacharbeit);
  const [nacharbeitErgebnisse, setNacharbeitErgebnisse] = useState<Bewertung[]>(stand.nacharbeitErgebnisse);
  const [fertig, setFertig] = useState(false);
  const offeneAufgaben = aufgaben.filter((_, i) => ergebnisse[i] !== undefined && ergebnisse[i] !== "richtig");
  const liste = nacharbeit ? offeneAufgaben : aufgaben;

  useEffect(() => {
    if (lfId !== "heute" && aufgaben[0]) letztesLfStore.set(aufgaben[0].lernfeld);
  }, [lfId, aufgaben]);

  // Neue Frage → oben anfangen, sonst landet man mitten in der nächsten Aufgabe.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index, nacharbeit]);

  // Stand sichern; bei Abschluss aufräumen (inkl. gemerkter Rechen-Zufallszahlen).
  useEffect(() => {
    try {
      if (fertig) {
        localStorage.removeItem(KEY);
        if (letzteSessionStore.getSnapshot() === lfId) letzteSessionStore.set("");
        leereCalcCache();
      } else {
        localStorage.setItem(KEY, JSON.stringify({
          index, ergebnisse, beantwortet, nacharbeit, nacharbeitErgebnisse,
          aufgabenIds: aufgaben.map((a) => a.id),
        }));
        if (aufgaben.length && letzteSessionStore.getSnapshot() !== lfId) letzteSessionStore.set(lfId);
      }
    } catch {}
  }, [KEY, lfId, index, ergebnisse, beantwortet, nacharbeit, nacharbeitErgebnisse, fertig, aufgaben]);

  const aktuell = liste[index];

  const zumNaechsten = () => {
    setAntwortWiederhergestellt(false);
    if (index < liste.length - 1) {
      setIndex((i) => i + 1);
      setBeantwortet(false);
    } else if (!nacharbeit && offeneAufgaben.length > 0) {
      // Ein zusätzlicher Durchgang, keine Endlosschleife bis alles richtig ist.
      setNacharbeit(true);
      setIndex(0);
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
  const handleErgebnis = (b: Bewertung, kontext?: BewertungsKontext) => {
    if (beantwortet) return;
    if (nacharbeit) {
      // Abruf direkt nach der Erklärung ist kein Nachweis für langfristiges Wissen.
      // Die Bewertung des ersten Versuchs bestimmt weiterhin die nächste Fälligkeit.
      setNacharbeitErgebnisse((prev) => [...prev, b]);
    } else {
      bewerte(aktuell.id, b, { ...kontext, nachErklaerung: !!nachErklaerung });
      setErgebnisse((prev) => [...prev, b]);
    }
    setBeantwortet(true);
  };

  if (fertig) {
    return (
      <Abschluss
        ergebnisse={ergebnisse}
        nacharbeitErgebnisse={nacharbeit ? nacharbeitErgebnisse : null}
        // "heute" ist kein Lernfeld — der Weg zurück führt auf die Startseite.
        zurueck={zurueck ?? (lfId === "heute" ? "/" : `/lernen/${lfId}`)}
        nochmal={() => {
          leereCalcCache();
          setIndex(0);
          setBeantwortet(false);
          setAntwortWiederhergestellt(false);
          setErgebnisse([]);
          setNacharbeit(false);
          setNacharbeitErgebnisse([]);
          setFertig(false);
        }}
      />
    );
  }

  if (!aktuell) return <p>Für diese Sitzung sind keine Aufgaben vorhanden.</p>;

  return (
    <div>
      {nacharbeit && (
        <div className="mb-4 rounded-xl p-4" style={{ background: "var(--accent-soft)" }}>
          <h1 className="text-lg font-semibold">Fehler nacharbeiten</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Diese Aufgaben waren falsch oder teilweise richtig. Versuch sie noch einmal aus dem Kopf.
            Die nächste Wiederholung bleibt geplant.
          </p>
        </div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${((index + (beantwortet ? 1 : 0)) / liste.length) * 100}%`, background: "var(--accent)" }}
          />
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {liste.length}
        </span>
        {/* Der Schalter steht hier und nicht auf einer Einstellungsseite: Wer
            den Ton stört, merkt es mitten in der Sitzung — dann muss er in
            Reichweite sein, nicht zwei Bildschirme entfernt. */}
        <TonSchalter />
      </div>

      {antwortWiederhergestellt ? <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="font-semibold">Diese Aufgabe ist bereits bewertet</h2>
        <p className="mt-2 text-sm">Thema: {aktuell.thema}. Gespeicherte Bewertung: {({ richtig: "Richtig", teilweise: "Teilweise richtig", falsch: "Noch üben" })[(nacharbeit ? nacharbeitErgebnisse : ergebnisse)[index]]}.</p>
        <p className="mt-2 text-sm">Du kannst die Erklärung noch einmal lesen und danach weitermachen. Deine Bewertung bleibt erhalten.</p>
        <Erklaerung text={aktuell.erklaerung} quelle={aktuell.quelle} />
      </div> : <AufgabeSwitch key={`${nacharbeit}:${aktuell.id}`} aufgabe={aktuell} onErgebnis={handleErgebnis} />}

      {beantwortet && (
        <button
          onClick={zumNaechsten}
          className="mt-6 w-full rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {index < liste.length - 1 ? "Weiter" : !nacharbeit && offeneAufgaben.length > 0 ? "Fehler nacharbeiten" : "Ergebnis anzeigen"}
        </button>
      )}
      {nacharbeit && (
        <button
          onClick={() => setFertig(true)}
          className="mt-3 min-h-11 w-full rounded-xl border py-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          Nacharbeit beenden
        </button>
      )}
    </div>
  );
}

function TonSchalter() {
  const an = useSyncExternalStore(
    tonStore.subscribe,
    tonStore.getSnapshot,
    tonStore.getServerSnapshot,
  );
  return (
    <button
      onClick={() => tonStore.set(!an)}
      aria-pressed={an}
      aria-label={an ? "Ton ausschalten" : "Ton einschalten"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{ color: an ? "var(--accent)" : "var(--text-faint)" }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        {an ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="M22 9l-6 6M16 9l6 6" />}
      </svg>
    </button>
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
  nacharbeitErgebnisse,
  zurueck,
  nochmal,
}: {
  ergebnisse: Bewertung[];
  nacharbeitErgebnisse: Bewertung[] | null;
  zurueck: string;
  nochmal: () => void;
}) {
  const { fortschritt } = useProgress();
  const [aufgelaufen, setAufgelaufen] = useState(false);
  const [jetzt] = useState(() => Date.now());

  // Erst nach dem Mount, damit der Balken sichtbar von 0 aufläuft statt fertig
  // dazustehen.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAufgelaufen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const zaehle = (b: Bewertung) => ergebnisse.filter((e) => e === b).length;
  const gesamt = Math.max(1, ergebnisse.length);
  const teile: { b: Bewertung; label: string; farbe: string }[] = [
    { b: "richtig", label: "Richtig", farbe: "var(--ok)" },
    { b: "teilweise", label: "Fast", farbe: "var(--accent)" },
    { b: "falsch", label: "Nochmal", farbe: "var(--bad)" },
  ];

  const punkte = Object.values(fortschritt).filter((f) => lernStatus(f, jetzt) === "gefestigt").length;

  return (
    <div>
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
        {ergebnisse.length} {ergebnisse.length === 1 ? "Aufgabe" : "Aufgaben"} geschafft.
      </h1>
      {nacharbeitErgebnisse !== null && (
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Erster Durchgang</p>
      )}

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

      {nacharbeitErgebnisse !== null && (
        <div className="mt-6 rounded-xl p-4" style={{ background: "var(--accent-soft)" }}>
          <h2 className="font-semibold">Deine Nacharbeit</h2>
          <p className="mt-1 text-sm">
            {nacharbeitErgebnisse.filter((b) => b === "richtig").length} von {zaehle("falsch") + zaehle("teilweise")} {zaehle("falsch") + zaehle("teilweise") === 1 ? "Aufgabe" : "Aufgaben"}
            {" "}im zweiten Versuch richtig beantwortet.
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {nacharbeitErgebnisse.length < zaehle("falsch") + zaehle("teilweise") && (
              <>{zaehle("falsch") + zaehle("teilweise") - nacharbeitErgebnisse.length} {zaehle("falsch") + zaehle("teilweise") - nacharbeitErgebnisse.length === 1 ? "Aufgabe" : "Aufgaben"} noch nicht nachgearbeitet. </>
            )}
            Wiederhole sie zum geplanten Termin, um zu prüfen, was hängen geblieben ist.
          </p>
        </div>
      )}
      <p className="mt-6 text-[15px]" style={{ color: "var(--text-muted)" }}>
        An verschiedenen Tagen mehrfach erinnert:{" "}
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
