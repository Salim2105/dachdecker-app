"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Bewertung, BewertungsKontext } from "@/content/schema";
import { getAufgaben, getLektionen } from "@/lib/content";
import { getCurriculum, type LernCurriculum, type LernEinheit } from "@/lib/curriculum";
import { appStorage } from "@/lib/lernSpeicher";
import { getBegriff, sucheBegriffe } from "@/lib/glossar";
import { kursStandKey, ladeKursStand, type KursStand } from "@/lib/kursStand";
import { GlossarText, oeffneGlossarBegriff } from "@/components/GlossarText";
import { LernSkizze } from "@/components/LernSkizze";
import { AktivitaetsKarte } from "@/components/AktivitaetsKarte";
import { AufgabenKontext } from "@/components/useAufgabenEntwurf";
import { AufgabeSwitch } from "@/components/session/AufgabeSwitch";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { LektionCard } from "@/components/LektionCard";
import { useProgress } from "@/components/useProgress";
import { SessionRunner } from "@/components/session/SessionRunner";
import { ladeGespeicherteAufgaben } from "@/lib/uebungStand";

const PHASEN = ["Verstehen", "Selbst erklären", "Kontrollfragen", "Anwenden", "Abschluss"];
export function LernwerkstattKurs({ lfId }: { lfId: string }) {
  const kurs = getCurriculum(lfId);
  const [alteRunde] = useState(() => ladeGespeicherteAufgaben(`dd-session-${lfId}-einheit`, getAufgaben(lfId)));
  const [alteRundeOffen, setAlteRundeOffen] = useState(() => !!alteRunde && appStorage.getItem("letzte-session") === `${lfId}-einheit`);
  const [auswahl, setAuswahl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const id = window.location.hash.slice(1) || appStorage.getItem(`lernwerkstatt-auswahl-${lfId}`);
    return kurs?.kapitel.some((k) => k.einheiten.some((e) => e.id === id)) ? id : null;
  });
  if (!kurs) return null;
  if (alteRunde && alteRundeOffen) return <section className="mt-6"><button className="mb-4 min-h-11 underline" onClick={() => setAlteRundeOffen(false)}>← Zu den neuen Kapiteln</button><p className="mb-5">Deine bisherige Übungsrunde ist erhalten geblieben. Du kannst sie hier beenden.</p><SessionRunner aufgaben={alteRunde} lfId={`${lfId}-einheit`} zurueck={`/lernen/${lfId}`} /></section>;
  const einheiten = kurs.kapitel.flatMap((k) => k.einheiten);
  const einheit = einheiten.find((e) => e.id === auswahl);
  function waehle(id: string | null) {
    setAuswahl(id);
    if (id) { appStorage.setItem(`lernwerkstatt-auswahl-${lfId}`, id); appStorage.setItem("lernwerkstatt-zuletzt", JSON.stringify({ lfId, unitId: id })); }
    else appStorage.removeItem(`lernwerkstatt-auswahl-${lfId}`);
    window.history.replaceState(null, "", `${window.location.pathname}${id ? `#${id}` : ""}`);
    window.scrollTo({ top: 0 });
  }
  return <section className="mt-7" aria-label="Kapitel und Lerneinheiten">
    {alteRunde && <button className="mb-5 min-h-12 rounded-xl border p-3 text-left" onClick={() => setAlteRundeOffen(true)}>Bisherige Übungsrunde fortsetzen →</button>}
    {einheit ? <Einheit key={`${einheit.id}:${einheit.version}`} kurs={kurs} einheit={einheit} zurueck={() => waehle(null)} naechste={() => waehle(einheiten[einheiten.indexOf(einheit) + 1]?.id ?? null)} />
    : <><h2 className="text-2xl font-semibold">Deine Kapitel</h2><p className="mt-2 mb-5" style={{ color: "var(--text-muted)" }}>{kurs.redaktionell ? "Sechs Kapitel, 18 Einheiten. Etwa 5–10 Minuten für einen überschaubaren Lernschritt." : "Deine vorhandenen Lektionen in kürzeren Schritten. Die ausführlichen Quellenabschnitte bleiben zum Nachschlagen verfügbar."}</p><div className="space-y-5">{kurs.kapitel.map((k, index) => <section key={k.id} className="werkstatt-karte"><span className="text-sm" style={{ color: "var(--accent)" }}>KAPITEL {index + 1}</span><h3 className="mt-1">{k.titel}</h3><div className="mt-4 space-y-3">{k.einheiten.map((e) => <button key={e.id} className="flex min-h-16 w-full items-center justify-between gap-4 rounded-xl border p-4 text-left" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} onClick={() => waehle(e.id)}><span><strong>{e.titel}</strong><span className="mt-1 block text-sm" style={{ color: "var(--text-muted)" }}>{e.minuten} Minuten · {e.aufgabenIds.length} Kontrollaufgaben</span></span><span aria-label={ladeKursStand(e).abgeschlossen ? "Abgeschlossen" : "Öffnen"}>{ladeKursStand(e).abgeschlossen ? "✓" : "→"}</span></button>)}</div></section>)}</div></>}
  </section>;
}

function Einheit({ kurs, einheit: e, zurueck, naechste }: { kurs: LernCurriculum; einheit: LernEinheit; zurueck: () => void; naechste: () => void }) {
  const [stand, setStand] = useState(() => ladeKursStand(e));
  const [fehler, setFehler] = useState("");
  const standRef = useRef(stand);
  const { bewerte } = useProgress();
  const aufgaben = e.aufgabenIds.flatMap((id) => { const a = getAufgaben(kurs.lfId).find((q) => q.id === id); return a ? [a] : []; });
  const quellen = getLektionen(kurs.lfId).filter((l) => e.lektionIds.includes(l.id));
  function speichern(aenderung: Partial<KursStand>) {
    const neu = { ...standRef.current, ...aenderung };
    standRef.current = neu;
    setStand(neu);
    try { appStorage.setItem(kursStandKey(e), JSON.stringify(neu)); }
    catch { setFehler("Dein Entwurf konnte nicht gespeichert werden. Bitte den Lernspeicher prüfen."); }
  }
  useEffect(() => {
    const hilfe = () => {
      const neu = { ...standRef.current, hilfen: [...new Set([...standRef.current.hilfen, "begriffshilfe"])] };
      standRef.current = neu; setStand(neu);
      try { appStorage.setItem(kursStandKey(e), JSON.stringify(neu)); } catch { /* Speicherfehler erscheinen in der gemeinsamen Statusanzeige. */ }
    };
    window.addEventListener("dachdecker:begriff", hilfe);
    return () => window.removeEventListener("dachdecker:begriff", hilfe);
  }, [e]);
  const aktuell = aufgaben[stand.kontrolleIndex];
  const ergebnis = aktuell && stand.ergebnisse.find((r) => r.id === aktuell.id);
  const begriffe = e.begriffe.flatMap((id) => { const b = getBegriff(id) ?? sucheBegriffe(id)[0]; return b ? [b] : []; });
  const phase = (n: number) => { speichern({ phase: n }); window.scrollTo({ top: 0 }); };
  return <div>
    <button className="mb-5 min-h-11 underline" onClick={zurueck}>← Alle Kapitel</button>
    <p className="text-sm" style={{ color: "var(--accent)" }}>LERNEINHEIT · ETWA {e.minuten} MINUTEN</p><h2 className="mt-1 text-2xl font-semibold">{e.titel}</h2>
    <p className="my-4 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--werkstatt-gruen)" }}><strong>Dein Lernziel:</strong> {e.lernziel}</p>
    <ol className="mb-6 flex flex-wrap gap-2" aria-label="Schritte der Lerneinheit">{PHASEN.map((p, index) => <li key={p}><button className="min-h-11 rounded-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: stand.phase === index ? "var(--accent)" : "var(--surface)", color: stand.phase === index ? "var(--accent-text)" : "var(--text-muted)" }} aria-current={stand.phase === index ? "step" : undefined} disabled={index > stand.phase} onClick={() => phase(index)}>{index + 1}. {p}</button></li>)}</ol>
    {fehler && <p role="alert" style={{ color: "var(--bad)" }}>{fehler}</p>}
    {stand.phase === 0 && <section className="werkstatt-karte"><h3>Kurz verstehen</h3><p className="mt-4 max-w-prose whitespace-pre-line text-lg leading-relaxed"><GlossarText text={e.textschritte[stand.textIndex]} /></p>{e.illustration && <LernSkizze illustration={e.illustration} />}{quellen[0]?.svg && !e.illustration && <details className="mt-4"><summary className="min-h-11 cursor-pointer">Darstellung aus der Lektion ansehen</summary><LektionCard lektion={quellen[0]} /></details>}<div className="mt-5 flex items-center justify-between gap-3"><span className="text-sm">Textschritt {stand.textIndex + 1} von {e.textschritte.length}</span><button className="hauptaktion" onClick={() => stand.textIndex < e.textschritte.length - 1 ? speichern({ textIndex: stand.textIndex + 1 }) : phase(1)}>{stand.textIndex < e.textschritte.length - 1 ? "Nächster Textschritt" : "Jetzt selbst erklären"}</button></div></section>}
    {stand.phase === 1 && <section className="werkstatt-karte"><h3>Aus dem Kopf erklären</h3><p>{e.abrufFrage}</p><label className="mt-4 block">Deine Erklärung (du kannst auch laut antworten)<textarea value={stand.notiz} onChange={(event) => speichern({ notiz: event.target.value })} className="mt-2 min-h-32 w-full rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} /></label>{!stand.verglichen ? <button className="hauptaktion mt-4" onClick={() => speichern({ verglichen: true })}>Mit der Musterantwort vergleichen</button> : <><div className="mt-5 rounded-xl p-4" style={{ background: "var(--accent-soft)" }}><h4 className="font-semibold">Musterantwort</h4><p><GlossarText text={e.abrufMuster} /></p></div><p>Wie gut passt deine erste Erklärung? Das ist deine Selbsteinschätzung.</p><div className="mt-3 flex flex-wrap gap-3">{([["richtig", "Sicher erklärt"], ["teilweise", "Teilweise erklärt"], ["falsch", "Noch unsicher"]] as const).map(([b, text]) => <button key={b} className="min-h-12 rounded-xl border p-3" aria-pressed={stand.selbstbewertung === b} onClick={() => speichern({ selbstbewertung: b })}>{text}</button>)}</div><button className="hauptaktion mt-5" disabled={!stand.selbstbewertung} onClick={() => phase(2)}>Zu den Kontrollfragen</button></>}</section>}
    {stand.phase === 2 && <section className="werkstatt-karte"><h3>Selbst beantworten</h3><p className="mb-5">Kontrollfrage {stand.kontrolleIndex + 1} von {aufgaben.length}. Nimm dir Zeit für eine eigene Antwort.</p>{aktuell ? <>{ergebnis ? <div role="status"><strong>Gespeicherte Rückmeldung: {ergebnis.bewertung === "richtig" ? "richtig" : ergebnis.bewertung === "teilweise" ? "teilweise richtig" : "noch üben"}</strong><Erklaerung text={aktuell.erklaerung} quelle={aktuell.quelle} /></div> : <AufgabenKontext.Provider value={e.id}><AufgabeSwitch key={aktuell.id} aufgabe={aktuell} onErgebnis={(b: Bewertung, kontext?: BewertungsKontext) => {
      if (stand.ergebnisse.some((r) => r.id === aktuell.id)) return;
      bewerte(aktuell.id, b, { ...kontext, nachErklaerung: true }); speichern({ ergebnisse: [...stand.ergebnisse, { id: aktuell.id, bewertung: b }] });
    }} /></AufgabenKontext.Provider>}{ergebnis && <button className="hauptaktion mt-5" onClick={() => stand.kontrolleIndex < aufgaben.length - 1 ? speichern({ kontrolleIndex: stand.kontrolleIndex + 1 }) : phase(3)}>{stand.kontrolleIndex < aufgaben.length - 1 ? "Nächste Kontrollfrage" : "Jetzt anwenden"}</button>}</> : <button className="hauptaktion mt-5" onClick={() => phase(3)}>Zur Anwendung</button>}</section>}
    {stand.phase === 3 && <>{e.aktivitaet ? <AktivitaetsKarte aktivitaet={e.aktivitaet} antwort={stand.aktivitaet} geprueft={stand.aktivitaetGeprueft} onChange={(antwort) => speichern({ aktivitaet: antwort, aktivitaetGeprueft: false })} onPruefen={() => speichern({ aktivitaetGeprueft: true })} /> : <section className="werkstatt-karte"><h3>Auf die Baustelle übertragen</h3><p>Lies deine Erklärung noch einmal. Wo würde dir dieser Zusammenhang bei einer echten Aufgabe helfen? Ergänze ein konkretes Beispiel in deiner Notiz.</p><label className="mt-4 block">Mein Beispiel<textarea className="mt-2 min-h-28 w-full rounded-xl border p-3" value={stand.notiz} onChange={(event) => speichern({ notiz: event.target.value })} /></label></section>}{(!e.aktivitaet || stand.aktivitaetGeprueft) && <button className="hauptaktion mt-5" onClick={() => { speichern({ phase: 4, abgeschlossen: true }); }}>Einheit abschließen</button>}</>}
    {stand.phase === 4 && <section className="werkstatt-karte"><h3>Ein Lernschritt geschafft.</h3><p>{e.lernziel}</p><p>{stand.ergebnisse.some((r) => r.bewertung !== "richtig") || stand.selbstbewertung !== "richtig" ? "Einige Antworten waren noch unsicher. Wiederhole den Zusammenhang und nutze die Tagesrunde für die nächsten fälligen Aufgaben." : "Du hast die Kontrollfragen bearbeitet. Ob der Zusammenhang auch später sitzt, zeigen deine nächsten Wiederholungen."}</p><p className="text-sm">Ein abgeschlossener Lernschritt ist noch kein Nachweis langfristiger Beherrschung.</p><button className="hauptaktion mt-5" onClick={naechste}>Nächste Einheit →</button><Link className="ml-4 inline-block underline" href="/heute">Später wiederholen</Link></section>}
    {begriffe.length > 0 && <section className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--border)" }} aria-label="Fachbegriffe der Einheit"><h3 className="font-semibold">Begriffe dieser Einheit</h3><div className="mt-3 flex flex-wrap gap-2">{begriffe.map((b) => <button key={b.id} className="min-h-11 rounded-lg border px-3" onClick={() => oeffneGlossarBegriff(b.id)}>{b.begriff}</button>)}</div></section>}
    <details className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}><summary className="min-h-11 cursor-pointer font-semibold">Quellen, Tabellen und ausführliche Lektionen</summary><p className="text-sm">Eigene Lernaufbereitung auf Grundlage der folgenden vorhandenen Schulbuchabschnitte. Aufgaben-IDs bleiben erhalten; diese Einheit hat Version {e.version}.</p>{quellen.map((l) => <LektionCard key={l.id} lektion={l} />)}</details>
  </div>;
}
