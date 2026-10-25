"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { appStorage } from "@/lib/lernSpeicher";
import { recordReviewResult } from "@/lib/review";
import { neueMatheRueckmeldung } from "@/lib/matheBewertung";
import { aufbauKey, erzeugeAufbauAufgabe, neuerAufbauStand, parseAufbauStand, pruefeAufbauAufgabe, type AufbauAntwort, type AufbauEinheit, type AufbauStand, type AufbauVersuch } from "@/lib/matheAufbau";
import { AufbauSkizze } from "./AufbauSkizze";
import { GlossarText, BegriffsListe, oeffneGlossarBegriff } from "@/components/GlossarText";
import { Nacharbeit } from "@/components/Nacharbeit";
import { aufbauNacharbeit } from "@/lib/lernNacharbeit";
import styles from "./Mathe.module.css";
import own from "./Aufbau.module.css";

export function AufbauWerkstatt({ einheit: e, zurueck, weiter }: { einheit: AufbauEinheit; zurueck: () => void; weiter: () => void }) {
  const [stand, setStand] = useState(() => parseAufbauStand(appStorage.getItem(aufbauKey(e.id)), e) ?? neuerAufbauStand(e));
  const [gesperrt, setGesperrt] = useState(() => !!appStorage.getItem(aufbauKey(e.id)) && !parseAufbauStand(appStorage.getItem(aufbauKey(e.id)), e));
  const [fehler, setFehler] = useState("");
  const ref = useRef(stand);
  const id = e.aufgabenIds[stand.index], v = stand.versuche[id], a = v.aufgabe;
  useEffect(() => {
    if (gesperrt) return;
    try {
      appStorage.setItem(aufbauKey(e.id), JSON.stringify(ref.current));
      appStorage.setItem("fachmathe-auswahl", e.id);
      appStorage.setItem("lernwerkstatt-zuletzt-route", `/grundlagen/mathe#${e.id}`);
      // A saved result is the retry log when the app closes between both writes.
      for (const versuch of [...Object.values(ref.current.versuche), ...(ref.current.archiv ?? [])]) if (versuch.reviewResult) recordReviewResult(versuch.reviewResult);
    } catch { queueMicrotask(() => setFehler("Dein Stand ist noch nicht vollständig gespeichert. Bitte den Speicherhinweis prüfen.")); }
  }, [e.id, gesperrt]);
  function speichern(neu: AufbauStand): boolean {
    if (gesperrt) return false;
    ref.current = neu; setStand(neu);
    try { appStorage.setItem(aufbauKey(e.id), JSON.stringify(neu)); return true; }
    catch { setFehler("Dein Rechenentwurf konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen."); return false; }
  }
  function versuchAendern(patch: Partial<AufbauVersuch>) {
    const s = ref.current;
    return speichern({ ...s, versuche: { ...s.versuche, [id]: { ...s.versuche[id], ...patch } } });
  }
  function antwortAendern(schritt: string, patch: Partial<AufbauAntwort>) {
    const aktuell = ref.current.versuche[id];
    versuchAendern({ antworten: { ...aktuell.antworten, [schritt]: { ...(aktuell.antworten[schritt] ?? { wert: "", einheit: "" }), ...patch } } });
  }
  function hilfe(schritt: string) {
    const aktuell = ref.current.versuche[id];
    if (!aktuell.ergebnis && !aktuell.hilfen.includes(schritt)) versuchAendern({ hilfen: [...aktuell.hilfen, schritt] });
  }
  function begriff(id:string){hilfe(`begriff:${id}`);oeffneGlossarBegriff(id);}
  function pruefen() {
    const aktuell = ref.current.versuche[id];
    if (aktuell.ergebnis) return;
    const r = pruefeAufbauAufgabe(aktuell.aufgabe, aktuell.antworten);
    if (!r) { setFehler("Trage für jeden Schritt eine gültige Zahl ein und wähle jeweils eine Einheit."); return; }
    const result = neueMatheRueckmeldung(id, a.version, e.id, r.bewertung, aktuell.hilfen, aktuell.versuchId);
    result.hinweise=aufbauNacharbeit(aktuell.aufgabe,aktuell.antworten,r);
    setFehler("");
    if (versuchAendern({ ergebnis: r, reviewResult: result })) {
      try { recordReviewResult(result); }
      catch { setFehler("Deine Antwort ist gesichert. Der Wiederholungstermin konnte noch nicht gespeichert werden; beim erneuten Öffnen versuchen wir es wieder."); }
    }
  }
  function neueZahlen() {
    const s = ref.current, alt = s.versuche[id];
    if (!alt.ergebnis) return;
    const neu: AufbauVersuch = { aufgabe: erzeugeAufbauAufgabe(id, (alt.aufgabe.variante + 1) % 5), versuchId: `aufbau:${id}:${globalThis.crypto.randomUUID()}`, antworten: {}, hilfen: ["erklaerung"] };
    speichern({ ...s, abgeschlossen: false, archiv: [...(s.archiv ?? []), alt], versuche: { ...s.versuche, [id]: neu } });
    setFehler("");
  }
  function neuNachSicherung() {
    const raw = appStorage.getItem(aufbauKey(e.id));
    try {
      if (raw) appStorage.setItem(`${aufbauKey(e.id)}-archiv-${globalThis.crypto.randomUUID()}`, raw);
      const neu = neuerAufbauStand(e);
      appStorage.setItem(aufbauKey(e.id), JSON.stringify(neu));
      ref.current = neu; setStand(neu); setGesperrt(false); setFehler("");
    } catch { setFehler("Der alte Entwurf konnte nicht gesichert werden. Bitte zuerst den Speicherhinweis prüfen."); }
  }
  if (gesperrt) return <section className={styles.einheit}><button className={styles.back} onClick={zurueck}>← Alle Mathe-Einheiten</button><h1>{e.titel}</h1><p role="alert">Dein gespeicherter Entwurf kann nicht gelesen werden. Er bleibt erhalten. Sichere deinen Lernstand, bevor du neu beginnst.</p><Link href="/fortschritt">Vollständige Sicherung öffnen</Link><button className={styles.back} onClick={neuNachSicherung}>Alten Entwurf aufbewahren und neu beginnen</button>{fehler && <p role="alert">{fehler}</p>}</section>;
  const fertig = e.aufgabenIds.every(aufgabeId => !!stand.versuche[aufgabeId]?.ergebnis);
  return <div className={styles.einheit}>
    <button className={styles.back} onClick={zurueck}>← Alle Mathe-Einheiten</button>
    <header className={styles.unitHead}><span>FACHMATHE · AUFBAU · 10–15 MINUTEN</span><h1>{e.titel}</h1><p>{e.ziel}</p></header>
    {stand.abgeschlossen ? <section className={styles.success}><span className={own.erfolg} aria-hidden="true">✓</span><h2>Dein Rechenweg wächst.</h2><p>{e.aufgabenIds.reduce((sum, aufgabeId) => sum + (stand.versuche[aufgabeId].ergebnis?.erreicht ?? 0), 0)} von {e.aufgabenIds.reduce((sum, aufgabeId) => sum + stand.versuche[aufgabeId].aufgabe.schritte.length, 0)} zuletzt geprüften Schritten passen. Hilfen und Teilantworten bleiben in deinem Lernstand erkennbar.</p><button className="hauptaktion" onClick={weiter}>Nächste Aufbau-Einheit →</button><button className={styles.back} onClick={() => speichern({ ...ref.current, abgeschlossen: false })}>Meine Rechenwege nochmals ansehen</button><Link href="/heute">Später in der Tagesrunde wiederholen →</Link></section> : <>
      <section className={styles.text}><h2>Erst verstehen</h2><p><GlossarText text={e.text} onBegriff={begriff}/></p><AufbauSkizze art={e.art} /><strong><GlossarText text={e.merksatz} onBegriff={begriff}/></strong><div><span>DURCHGERECHNETES BEISPIEL</span><p><GlossarText text={e.beispiel} onBegriff={begriff}/></p></div></section>
      <BegriffsListe texte={[e.text,e.beispiel,e.merksatz,a.frage,...a.gegeben]} onBegriff={begriff}/>
      <section className={styles.task}>
        <div className={styles.taskHead}><span>JETZT DU · AUFBAU</span><span>Aufgabe {stand.index + 1} von {e.aufgabenIds.length}</span></div>
        <h2><GlossarText text={a.frage} onBegriff={begriff}/></h2><ul className={own.gegeben}>{a.gegeben.map(g => <li key={g}><GlossarText text={g} onBegriff={begriff}/></li>)}</ul>
        <p className={own.hinweis}>Rechne intern mit ungerundeten Werten weiter. Runde erst die angezeigten Eingaben wie angegeben. Jeder richtige Schritt zählt einzeln.</p>
        <div className={own.schritte}>{a.schritte.map((s, i) => <fieldset key={`${v.versuchId}:${s.id}`} className={own.schritt}>
          <legend><span aria-hidden="true">{i + 1}</span>{s.label}</legend>
          <p className={own.rundung}>{s.ganzzahl ? "Ganze Zahl erforderlich" : `${s.stellen} Nachkommastellen · Toleranz ±${s.toleranz.toLocaleString("de-DE", { maximumFractionDigits: 8 })}`} {s.einheit}</p>
          <div className={styles.antwort}><label htmlFor={`${s.id}-wert`}>Dein Wert für {s.label}<input id={`${s.id}-wert`} inputMode="decimal" type="text" value={v.antworten[s.id]?.wert ?? ""} disabled={!!v.ergebnis} onChange={ev => antwortAendern(s.id, { wert: ev.target.value })} /></label><label htmlFor={`${s.id}-einheit`}>Einheit für {s.label}<select id={`${s.id}-einheit`} value={v.antworten[s.id]?.einheit ?? ""} disabled={!!v.ergebnis} onChange={ev => antwortAendern(s.id, { einheit: ev.target.value })}><option value="">Bitte wählen</option>{s.einheiten.map(u => <option key={u}>{u}</option>)}</select></label></div>
          {!v.ergebnis && <details className={own.hilfe} onToggle={ev => { if (ev.currentTarget.open) hilfe(s.id); }}><summary>Hilfe für Schritt {i + 1}</summary><p><strong>Formel:</strong> {s.formel}</p><p><strong>Einsetzen:</strong> {s.einsetzen}</p></details>}
          {v.ergebnis && <div className={own.schrittAntwort}><strong>{v.ergebnis.schritte[s.id].richtig ? "✓ Dieser Schritt passt." : "Diesen Schritt nacharbeiten."}</strong><p>{v.ergebnis.schritte[s.id].hinweis}</p><p>{s.formel} → {s.einsetzen} → <strong>{s.wert.toLocaleString("de-DE", { minimumFractionDigits: s.stellen, maximumFractionDigits: s.stellen })} {s.einheit}</strong></p></div>}
        </fieldset>)}</div>
        {!v.ergebnis && <button className="hauptaktion" onClick={pruefen}>Alle Rechenschritte prüfen</button>}
        {v.ergebnis && <div role="status" className={styles.feedback}><strong>{v.ergebnis.erreicht} von {v.ergebnis.moeglich} Schritten passen.</strong><p><GlossarText text={a.erklaerung} onBegriff={begriff}/></p><span>{v.hilfen.length ? "Mit Hilfe oder unmittelbar nach einer Erklärung bearbeitet." : "Ohne aufgedeckte Rechenhilfe bearbeitet."}</span><div><button className={styles.back} onClick={neueZahlen}>Noch einmal mit neuen Zahlen</button>{stand.index < e.aufgabenIds.length - 1 && <button className="hauptaktion" onClick={() => speichern({ ...ref.current, index: stand.index + 1 })}>Nächste Aufbau-Aufgabe →</button>}</div></div>}
        {v.ergebnis&&<Nacharbeit hinweise={v.reviewResult?.hinweise} hilfen={v.hilfen}/>}
        {fehler && <p role="alert" className={styles.fehler}>{fehler}</p>}
      </section>
      <label className={styles.notiz}>Dein Merksatz in eigenen Worten<textarea value={stand.notiz} onChange={ev => speichern({ ...ref.current, notiz: ev.target.value })} /></label>
      <div className={styles.footer}><button className={styles.back} disabled={stand.index === 0} onClick={() => speichern({ ...ref.current, index: stand.index - 1 })}>Vorherige Aufbau-Aufgabe</button>{fertig && <button className="hauptaktion" onClick={() => speichern({ ...ref.current, abgeschlossen: true })}>Aufbau-Einheit abschließen</button>}<Link href={e.anschluss}>Im Lernfeld anwenden →</Link></div>
    </>}
  </div>;
}
