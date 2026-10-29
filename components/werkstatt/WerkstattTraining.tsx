"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LernLink } from "@/components/LernLink";
import { useBearbeitungsSperre } from "@/components/useBearbeitungsSperre";
import { appStorage, flushStorage } from "@/lib/lernSpeicher";
import { registrierePruefungsHilfen } from "@/lib/pruefungsHilfen";
import { WERKSTATT_PFADE, getWerkstattEinheit, getWerkstattPfad } from "@/lib/werkstattInhalte";
import { syncWerkstattNachweise, werkstattNacharbeitAusVorversuchen } from "@/lib/werkstattNachweise";
import { archiviereWerkstattStand, hilfeWerkstatt, ladeWerkstattStand, neuerWerkstattStand, parseWerkstattStand, pruefeWerkstattAufgabe, setWerkstattModus, speichereWerkstattStand, werkstattKey } from "@/lib/werkstattStand";
import type { WerkstattAnsicht, WerkstattAntwort, WerkstattEinheit as Einheit, WerkstattStand } from "@/lib/werkstattTypen";
import { WerkstattAufgabe } from "./WerkstattAufgabe";
import { WerkstattSzene } from "./WerkstattSzene";
import styles from "./WerkstattTraining.module.css";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;
const textFehler = (e: unknown) => e instanceof Error ? e.message : "Dein Werkstattstand konnte nicht gespeichert werden. Lass die Aufgabe geöffnet und sichere deinen Stand.";
const phasen = [{ id: "anleitung", label: "1. Ansehen & verstehen" }, { id: "uebung", label: "2. Selbst entscheiden" }, { id: "praxis", label: "3. Praktisch ausprobieren" }] as const;
const ansichten: { id: WerkstattAnsicht; label: string }[] = [{ id: "draufsicht", label: "Draufsicht" }, { id: "schnitt", label: "Schnitt" }, { id: "einzelziegel", label: "Einzelziegel" }];

export function WerkstattTraining({ einheitId }: { einheitId?: string }) {
  const bereit = useSyncExternalStore(subscribe, client, server);
  if (!bereit) return <p>Dein Werkstatttraining wird geöffnet …</p>;
  const einheit = einheitId ? getWerkstattEinheit(einheitId) : undefined;
  return einheit ? <WerkstattEinheit key={einheit.id} vorlage={einheit} /> : <WerkstattKatalog />;
}

function gespeicherterStand(id: string) {
  return parseWerkstattStand(appStorage.getItem(werkstattKey(id)));
}
function status(s: WerkstattStand | null, vorhanden: boolean): string {
  if (!s) return vorhanden ? "Gespeicherten Stand prüfen" : "Noch offen";
  const abgaben = s.einheit.aufgaben.map(a => s.abgaben[a.id]?.at(-1));
  if (s.geprueft.length === 2 && abgaben.every(a => a?.bewertung.richtig)) {
    return abgaben.some(a => a!.hilfen.length || a!.nachErklaerung || a!.modus === "begleitet") ? "Mit Hilfe digital verstanden" : "Selbstständig digital verstanden";
  }
  return s.geprueft.length ? `${s.geprueft.length} von 2 Aufgaben bearbeitet` : "Angefangen · hier weiterarbeiten";
}

function WerkstattKatalog() {
  return <div className={styles.training}>
    <LernLink className={styles.back} href="/projekte?ansicht=uebersicht">← Alle Baustellenangebote</LernLink>
    <header className={styles.hero}>
      <div><span className={styles.eyebrow}>DEINE DIGITALE WERKSTATT</span><h1>Vom ersten Strich<br />zum gedeckten Feld.</h1><p>Anzeichnen, einteilen, verlegen und kontrollieren. Zwei vollständige Lernpfade zeigen dir die Handgriffe und ihre Zusammenhänge.</p><div className={styles.heroTags}><span>20 kurze Einheiten</span><span>40 aktive Übungen</span><span>Für Betrieb & Schule</span></div></div>
      <div className={styles.heroArt} aria-hidden="true"><svg viewBox="0 0 360 240"><path d="M30 190 170 35 335 190Z" fill="#dba080" stroke="#384f43" strokeWidth="5"/><path d="M70 145H285M100 110H250M132 76H214M70 145 118 190M121 110 198 190M170 76 276 190" stroke="#a9583a" strokeWidth="7"/><path d="M35 205H325" stroke="#c28c47" strokeWidth="17"/><path d="m255 57 45 33-16 22-45-33Z" fill="#edd296" stroke="#384f43" strokeWidth="3"/><path d="m248 76-45 62" stroke="#384f43" strokeWidth="7"/><circle cx="84" cy="65" r="30" fill="#2b7b70"/><path d="m70 65 10 10 17-21" stroke="white" strokeWidth="5" fill="none"/></svg></div>
    </header>
    <div className={styles.pathGrid}>{WERKSTATT_PFADE.map(pfad => {
      const staende = pfad.einheiten.map(e => gespeicherterStand(e.id));
      const bearbeitet = staende.filter(s => s?.geprueft.length === 2).length;
      const offen = staende.filter((s): s is WerkstattStand => !!s && !s.abgeschlossenAm).sort((a, b) => b.aktualisiertAm - a.aktualisiertAm)[0];
      const fortsetzen = pfad.einheiten.find(e => e.id === offen?.einheit.id) ?? pfad.einheiten.find((_, i) => !staende[i]) ?? pfad.einheiten[0];
      return <section className={styles.path} key={pfad.id} aria-labelledby={`pfad-${pfad.id}`}>
        <div className={styles.pathHead}><span className={styles.eyebrow}>{pfad.id === "falzziegel" ? "PFAD 01 · MIT FALZEN" : "PFAD 02 · MIT ÜBERDECKUNG"}</span><h2 id={`pfad-${pfad.id}`}>{pfad.titel}</h2><p>{pfad.kurz}</p><span className={styles.progressText}>{bearbeitet} von 10 Einheiten digital bearbeitet</span><progress value={bearbeitet} max={10} aria-label={`Bearbeitete Einheiten: ${pfad.titel}`} /><LernLink className="hauptaktion" href={`/projekte#${fortsetzen.id}`}>{staende.some(Boolean) ? "Im Lernpfad weiterarbeiten →" : "Mit dem Aufmaß starten →"}</LernLink></div>
        <ol className={styles.unitList}>{pfad.einheiten.map((e, i) => <li key={e.id}><LernLink href={`/projekte#${e.id}`} className={styles.unitLink}><span className={styles.unitNumber}>{String(i + 1).padStart(2, "0")}</span><span><strong>{e.titel}</strong><small>{status(staende[i], appStorage.getItem(werkstattKey(e.id)) !== null)} · {e.minuten} Min.</small></span><span aria-hidden="true">↗</span></LernLink></li>)}</ol>
        <LernLink className={styles.practiceLink} href={`/projekte#werkstatt-praxis-${pfad.id}`}>Das Praxisblatt zu diesem Lernpfad öffnen →</LernLink>
      </section>;
    })}</div>
    <aside className={styles.note}><h2>Verstehen und Ausführen gehören zusammen.</h2><p>Die Zeichnungen verwenden klar benannte Schulmodelle. Im Praxisblatt hältst du getrennt fest, was du geplant, tatsächlich geübt und mit Betrieb oder Schule besprochen hast. Die eigenen Produkt- und Arbeitsangaben gehören zu jeder realen Ausführung.</p></aside>
  </div>;
}

function WerkstattEinheit({ vorlage }: { vorlage: Einheit }) {
  const [anfang] = useState(() => {
    try { return { stand: ladeWerkstattStand(vorlage.id) ?? neuerWerkstattStand(vorlage), fehler: "" }; }
    catch (e) { return { stand: null, fehler: textFehler(e) }; }
  });
  const [stand, setStand] = useState(anfang.stand), aktuell = useRef(stand);
  const [fehler, setFehler] = useState(anfang.fehler);
  const [neustartBusy, setNeustartBusy] = useState(false), neustartLaeuft = useRef(false);
  const sperre = useBearbeitungsSperre(`dachdecker-werkstatt-${vorlage.id}`);
  const editierbar = sperre.status === "frei" || sperre.status === "nicht-verfuegbar";

  const speichern = useCallback((neu: WerkstattStand) => {
    if (!editierbar) return false;
    aktuell.current = neu; setStand(neu);
    try { speichereWerkstattStand(neu); syncWerkstattNachweise(neu); setFehler(""); return true; }
    catch (e) { setFehler(textFehler(e)); return false; }
  }, [editierbar]);
  function patch(wert: Partial<WerkstattStand>, basis = aktuell.current!) {
    return { ...basis, ...wert, revision: basis.revision + 1, aktualisiertAm: Math.max(Date.now(), basis.aktualisiertAm) };
  }
  useEffect(() => {
    const jetzt = aktuell.current;
    if (!editierbar || !anfang.stand || !jetzt) return;
    try {
      // StrictMode may replay this effect after a visible helper panel has
      // already recorded a newer revision. Never replace that newer draft.
      speichereWerkstattStand(jetzt); syncWerkstattNachweise(jetzt);
      appStorage.setItem("lernwerkstatt-zuletzt-route", `/projekte#${vorlage.id}`);
    } catch (e) { queueMicrotask(() => setFehler(textFehler(e))); }
  }, [anfang, editierbar, vorlage.id]);
  useEffect(() => {
    const s = aktuell.current;
    if (!editierbar || !s) return;
    const ende = registrierePruefungsHilfen(s.id);
    const hilfe = (art: string) => {
      const alt = aktuell.current;
      if (!alt || art === "taschenrechner" || art === "werkzeug:taschenrechner") return;
      const a = alt.einheit.aufgaben[alt.aufgabeIndex ?? 0];
      const id = alt.phase === "anleitung" ? `begriff:${art}` : `${a.id}:${art}`;
      speichern(hilfeWerkstatt(alt, id));
    };
    const listener = (event: Event) => {
      const d = (event as CustomEvent<{ art?: unknown; versuchId?: unknown }>).detail;
      if (d?.versuchId === aktuell.current?.id && typeof d.art === "string" && d.art.length > 0 && d.art.length <= 120) hilfe(d.art);
    };
    window.addEventListener("dachdecker:pruefung-hilfe", listener);
    if (document.querySelector('#werkzeug-panel:not([hidden])[data-werkzeug="glossar"]')) hilfe("glossar");
    return () => { ende(); window.removeEventListener("dachdecker:pruefung-hilfe", listener); };
  }, [editierbar, stand?.id, stand?.aufgabeIndex, stand?.phase, speichern]);

  if (sperre.status === "gesperrt") return <section className={styles.note}><h1>In einem anderen Fenster geöffnet</h1><p role="alert">{sperre.fehler}</p><LernLink href="/projekte#werkstatt" className={styles.back}>Zur Werkstattübersicht →</LernLink></section>;
  if (!stand) return <section className={styles.note}><h1>Dein Werkstattstand bleibt erhalten.</h1><p role="alert">{fehler}</p><LernLink href="/fortschritt" className="hauptaktion">Vollständige Sicherung erstellen →</LernLink><LernLink href="/projekte#werkstatt" className={styles.back}>Zur Werkstattübersicht →</LernLink></section>;
  const s = stand, e = s.einheit, pfad = getWerkstattPfad(e.pfadId)!, bild = e.bildschritte[s.schritt], aufgabeIndex = s.aufgabeIndex ?? 0, aufgabe = e.aufgaben[aufgabeIndex];
  const letzte = s.abgaben[aufgabe.id]?.at(-1);
  const erstStart = s.phase === "anleitung" && s.gesehen.length === 0;
  const allesGeprueft = e.aufgaben.every(a => s.geprueft.includes(a.id));

  function bildOeffnen(index: number, basis = aktuell.current!) {
    const b = basis.einheit.bildschritte[index];
    const mitHilfe = hilfeWerkstatt(basis, `bildschritt:${b.id}`);
    speichern(patch({ phase: "anleitung", schritt: index, ansicht: b.ansicht, gesehen: [...new Set([...mitHilfe.gesehen, b.id])] }, mitHilfe));
  }
  function modusWaehlen(modus: WerkstattStand["modus"]) {
    const neu = setWerkstattModus(aktuell.current!, modus);
    if (modus === "begleitet") bildOeffnen(neu.schritt, neu);
    else speichern(neu);
  }
  function antwortAendern(antwort: WerkstattAntwort) {
    const basis = aktuell.current!;
    const mitHilfe = basis.geprueft.includes(aufgabe.id) ? hilfeWerkstatt(basis, `${aufgabe.id}:vergleich`) : basis;
    speichern(patch({ antworten: { ...mitHilfe.antworten, [aufgabe.id]: antwort }, geprueft: mitHilfe.geprueft.filter(id => id !== aufgabe.id), abgeschlossenAm: null }, mitHilfe));
  }
  function pruefen() {
    try { const now = Date.now(); speichern(pruefeWerkstattAufgabe(aktuell.current!, aufgabe.id, now, werkstattNacharbeitAusVorversuchen(aktuell.current!, now))); }
    catch (err) { setFehler(textFehler(err)); }
  }
  function phaseWaehlen(phase: WerkstattStand["phase"]) {
    if (phase === "anleitung") bildOeffnen(aktuell.current!.schritt);
    else speichern(patch({ phase }));
  }
  async function neuerVersuch() {
    if (!editierbar || neustartLaeuft.current || !window.confirm("Einen neuen digitalen Versuch beginnen? Dein bisheriger Versuch mit Antworten, Hilfen und Notizen bleibt im Gerätespeicher archiviert und in der vollständigen Sicherung enthalten.")) return;
    const alt = aktuell.current!;
    neustartLaeuft.current = true; setNeustartBusy(true);
    try {
      if (!speichern(alt)) return;
      await flushStorage();
      if (aktuell.current?.id !== alt.id || aktuell.current.revision !== alt.revision) throw new Error("Deine letzten Eingaben bleiben erhalten. Beginne den neuen Versuch nach dem Speichern noch einmal.");
      archiviereWerkstattStand(alt);
      await flushStorage();
      if (aktuell.current?.id !== alt.id || aktuell.current.revision !== alt.revision) throw new Error("Deine letzten Eingaben bleiben erhalten. Beginne den neuen Versuch nach dem Speichern noch einmal.");
      speichern(neuerWerkstattStand(vorlage));
    } catch (err) { setFehler(textFehler(err)); }
    finally { neustartLaeuft.current = false; setNeustartBusy(false); }
  }

  return <div className={styles.training}>
    <LernLink className={styles.back} href="/projekte#werkstatt">← Alle Werkstatt-Lernpfade</LernLink>
    <header className={styles.unitHero}><span className={styles.eyebrow}>{pfad.titel.toLocaleUpperCase("de-DE")} · EINHEIT {e.nummer} VON 10</span><h1>{e.titel}</h1><p>{e.lernziel}</p><span className={styles.unitMeta}>Etwa {e.minuten} Minuten · Dein Stand bleibt auf diesem Gerät.</span></header>
    {fehler && <div className={styles.error} role="alert"><p>{fehler}</p><button type="button" className={styles.secondary} onClick={() => speichern(aktuell.current!)}>Speichern erneut versuchen</button></div>}
    {sperre.status === "nicht-verfuegbar" && <details className={styles.compat}><summary>Bearbeitung in einem Fenster</summary><p>{sperre.fehler}</p></details>}
    <fieldset className={styles.mode} disabled={!editierbar}><legend>Wie möchtest du arbeiten?</legend><button type="button" aria-pressed={s.modus === "begleitet"} onClick={() => modusWaehlen("begleitet")}>Mit Begleitung</button><button type="button" aria-pressed={s.modus === "probelauf"} onClick={() => modusWaehlen("probelauf")}>Selbst probieren</button><p>Du kannst jederzeit wechseln. Deine Antworten und bereits genutzten Hilfen bleiben erhalten.</p></fieldset>
    <nav className={styles.phaseNav} aria-label="Ablauf deiner Werkstatteinheit">{phasen.map(p => <button key={p.id} type="button" disabled={!editierbar} aria-current={s.phase === p.id ? "step" : undefined} onClick={() => phaseWaehlen(p.id)}>{p.label}</button>)}</nav>
    <details className={styles.system}><summary>Übungsmodell und vorgegebene Angaben ansehen</summary><h2>{e.systemkarte.titel}</h2><p>{e.systemkarte.hinweis}</p><ul>{e.systemkarte.angaben.map(a => <li key={a}>{a}</li>)}</ul><h3>Befestigung in diesem Modell</h3><ul>{e.systemkarte.befestigung.map(a => <li key={a}>{a}</li>)}</ul><p className={styles.muted}>{e.systemkarte.quellen.join(" · ")}</p></details>
    {erstStart ? <section className={styles.launch}><span className={styles.launchIcon} aria-hidden="true">⌁</span><h2>Erst ansehen oder direkt ausprobieren?</h2><p>Die Bildanleitung führt dich durch den Arbeitsschritt. Wenn du dein Vorwissen ausprobieren möchtest, kannst du sofort mit den Aufgaben anfangen.</p><div className={styles.actions}><button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => bildOeffnen(0)}>Bildanleitung starten →</button><button type="button" className={styles.secondary} disabled={!editierbar} onClick={() => { const neu = setWerkstattModus(aktuell.current!, "probelauf"); speichern(patch({ phase: "uebung" }, neu)); }}>Direkt selbst probieren →</button></div></section> : s.phase === "anleitung" ? <section className={styles.guide} aria-label="Bildanleitung">
      <div className={styles.guideHeading}><span className={styles.eyebrow}>BILDSCHRITT {s.schritt + 1} VON {e.bildschritte.length}</span><h2>{bild.titel}</h2></div>
      <div className={styles.guideGrid}><div><WerkstattSzene systemkarte={e.systemkarte} szene={bild.szene} ansicht={s.ansicht} wasser={s.wasser} schritt={s.schritt}/><fieldset className={styles.viewTools} disabled={!editierbar}><legend>Dieselbe Stelle anders ansehen</legend>{ansichten.map(v => <button key={v.id} type="button" aria-pressed={s.ansicht === v.id} onClick={() => speichern(patch({ ansicht: v.id }))}>{v.label}</button>)}<button type="button" onClick={() => speichern(patch({ wasser: (s.wasser + 1) % 5 }))}>Wasserweg: Schritt {s.wasser} von 4</button></fieldset></div>
      <div className={styles.guideText}><section><span className={styles.eyebrow}>SO GEHST DU VOR</span><p>{bild.handlung}</p></section><section className={styles.why}><h3>Warum mache ich das so?</h3><p>{bild.warum}</p></section><section className={styles.control}><h3>Darauf achtest du</h3><p>{bild.kontrolle}</p></section></div></div>
      <div className={styles.guideFooter}><button type="button" className={styles.secondary} disabled={!editierbar || s.schritt === 0} onClick={() => bildOeffnen(s.schritt - 1)}>← Vorheriges Bild</button><span>{s.schritt + 1} / {e.bildschritte.length}</span>{s.schritt + 1 < e.bildschritte.length ? <button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => bildOeffnen(s.schritt + 1)}>Nächstes Bild →</button> : <button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => phaseWaehlen("uebung")}>Jetzt selbst entscheiden →</button>}</div>
    </section> : s.phase === "uebung" ? <section aria-label="Deine Werkstattübungen">
      <div className={styles.taskNav} role="group" aria-label="Übung auswählen">{e.aufgaben.map((a, i) => <button key={a.id} type="button" disabled={!editierbar} aria-pressed={aufgabeIndex === i} onClick={() => speichern(patch({ aufgabeIndex: i }))}>{s.geprueft.includes(a.id) ? "✓ " : ""}Übung {i + 1}: {a.titel}</button>)}</div>
      <WerkstattAufgabe key={aufgabe.id} aufgabe={aufgabe} systemkarte={e.systemkarte} antwort={s.antworten[aufgabe.id]} geprueft={s.geprueft.includes(aufgabe.id)} bewertung={letzte?.bewertung} disabled={!editierbar} onChange={antwortAendern} onPruefen={pruefen} onHilfe={() => speichern(hilfeWerkstatt(aktuell.current!, `${aufgabe.id}:hinweis`))}/>
      {s.geprueft.includes(aufgabe.id) && <div className={styles.guideFooter}><p>{letzte?.hilfen.length || letzte?.nachErklaerung || letzte?.modus === "begleitet" ? "Mit Unterstützung bearbeitet. Deine erste Antwort bleibt gespeichert." : "Deine Antwort ist als eigenständiger Versuch gespeichert."}</p>{aufgabeIndex === 0 ? <button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => speichern(patch({ aufgabeIndex: 1 }))}>Zur zweiten Übung →</button> : <button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => phaseWaehlen("praxis")}>Zum praktischen Auftrag →</button>}</div>}
    </section> : <section className={styles.practice} aria-label="Dein praktischer Auftrag"><span className={styles.eyebrow}>JETZT AM ÜBUNGSMODELL</span><h2>{e.praxis.auftrag}</h2><p>Besprich Material, Ausführung und Arbeitsanweisung mit Betrieb oder Schule. Digitale Antworten und tatsächliche praktische Arbeit bleiben getrennt dokumentiert.</p><div className={styles.practiceGrid}><div><h3>Werkzeuge</h3><ul>{e.praxis.werkzeuge.map(x => <li key={x}>{x}</li>)}</ul><h3>Material</h3><ul>{e.praxis.material.map(x => <li key={x}>{x}</li>)}</ul></div><div><h3>Dein Arbeitsablauf</h3><ol>{e.praxis.ablauf.map(x => <li key={x}>{x}</li>)}</ol></div></div><div className={styles.practiceGrid}><div><h3>Sicher vorbereiten</h3><ul>{e.praxis.sicherheit.map(x => <li key={x}>{x}</li>)}</ul></div><div><h3>Ergebnis kontrollieren</h3><ul>{e.praxis.kontrolle.map(x => <li key={x}>{x}</li>)}</ul></div></div><h3>Erkläre deinen Arbeitsschritt</h3><ul>{e.praxis.gespraech.map(x => <li key={x}>{x}</li>)}</ul><LernLink href={`/projekte#werkstatt-praxis-${e.pfadId}`} className="hauptaktion">Praktische Ausführung und Rückmeldung festhalten →</LernLink></section>}
    <label className={styles.notes}>Meine Werkstattnotizen<textarea maxLength={12000} disabled={!editierbar} value={s.notiz} onChange={event => speichern(patch({ notiz: event.target.value }))} placeholder="Welcher Handgriff oder Zusammenhang ist mir klar geworden?" /></label>
    <section className={styles.result} aria-label="Dein Lernstand in dieser Einheit"><h2>Dein Lernstand in dieser Einheit</h2><p>{status(s, true)}.</p><p className={styles.muted}>Die digitale Bearbeitung bewertet dein Verständnis. Praktische Ausführung und Rückmeldung trägst du im eigenen Praxisblatt ein.</p>{allesGeprueft && <button type="button" className={styles.secondary} disabled={!editierbar || !!s.abgeschlossenAm} onClick={() => speichern(patch({ abgeschlossenAm: Date.now() }))}>{s.abgeschlossenAm ? "Digitale Einheit als bearbeitet gespeichert ✓" : "Digitale Einheit als bearbeitet festhalten"}</button>}<details className={styles.compat}><summary>Später noch einmal ohne Anleitung probieren</summary><p>Ein neuer Versuch beginnt mit eigenen Antworten. Der bisherige Versuch einschließlich seiner Hilfen bleibt archiviert.</p><button type="button" className={styles.secondary} disabled={!editierbar || neustartBusy} onClick={() => void neuerVersuch()}>{neustartBusy ? "Bisherigen Versuch sichern …" : "Neuen digitalen Versuch beginnen"}</button></details></section>
    <footer className={styles.unitFooter}>{e.nummer > 1 && <LernLink className={styles.back} href={`/projekte#${pfad.einheiten[e.nummer - 2].id}`}>← Vorherige Einheit</LernLink>}{e.nummer < 10 ? <LernLink className="hauptaktion" href={`/projekte#${pfad.einheiten[e.nummer].id}`}>Nächste Einheit →</LernLink> : <LernLink className="hauptaktion" href="/projekte#werkstatt">Zur Werkstattübersicht →</LernLink>}</footer>
  </div>;
}
