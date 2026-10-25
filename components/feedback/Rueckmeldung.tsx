"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { appStorage } from "@/lib/lernSpeicher";
import { PracticeArtwork } from "@/components/practice/PracticeArtwork";
import { FEEDBACK_KEY, FEEDBACK_KATEGORIEN, feedbackFehler, feedbackKontext, feedbackPayload, feedbackText, ladeFeedback, merkeFeedbackAktion, neuerFeedbackEntwurf, speichereFeedback, wechsleFeedbackEntwurf, type FeedbackAktion, type FeedbackEntwurf, type FeedbackKategorie, type FeedbackStand } from "@/lib/feedback";
import styles from "./Feedback.module.css";

function download(text: string, name: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Rueckmeldung() {
  const suche=useSearchParams().toString();
  return <RueckmeldungForm key={suche} suche={suche}/>;
}
function RueckmeldungForm({suche}:{suche:string}) {
  const [kontext] = useState(() => feedbackKontext(suche));
  const [stand, setStand] = useState(() => ladeFeedback(kontext));
  const ref = useRef(stand);
  const [fehler, setFehler] = useState("");
  const [meldung, setMeldung] = useState("");
  const [busy, setBusy] = useState(false);
  const aktiv = useRef(false);
  function speichern(neu: FeedbackStand) {
    ref.current = neu; setStand(neu); setMeldung("");
    try { speichereFeedback(neu); setFehler(""); }
    catch { setFehler("Dein Entwurf konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen."); }
  }
  if (!stand) return <section className="werkstatt-karte"><h1>Gespeicherte Rückmeldung prüfen</h1><p>Die vorhandenen Daten konnten nicht gelesen werden und bleiben unverändert.</p><button className="hauptaktion mt-4" onClick={() => download(appStorage.getItem(FEEDBACK_KEY) ?? "", "rueckmeldung-original.txt", "text/plain")}>Originaldaten sichern</button><Link className="mt-4 block underline" href="/fortschritt">Vollständige Sicherung öffnen</Link></section>;
  const d = stand.entwurf;
  const andererBereich = kontext.bereich !== "/" && (kontext.bereich !== d.bereich || kontext.aufgabeId !== d.aufgabeId);
  function aendern(patch: Partial<FeedbackEntwurf>) { speichern({ ...ref.current!, entwurf: { ...ref.current!.entwurf, ...patch } }); }
  function merke(aktion: FeedbackAktion, text: string) { speichern(merkeFeedbackAktion(ref.current!, aktion)); setMeldung(text); }
  async function ausgeben(aktion: "teilen" | "kopieren" | "json" | "text") {
    if (aktiv.current) return;
    const aktuell = ref.current!.entwurf;
    const problem = feedbackFehler(aktuell);
    if (problem) { setFehler(problem); return; }
    aktiv.current = true; setBusy(true); setMeldung(""); setFehler("");
    try {
      if (aktion === "teilen") {
        if (!navigator.share) { setMeldung("Die Teilen-Funktion ist hier nicht verfügbar. Du kannst den Text kopieren oder eine Datei herunterladen."); return; }
        await navigator.share({ title: "Rückmeldung zur Dachdecker-Lernwerkstatt", text: feedbackText(aktuell) });
        merke("geteilt", "Deine Rückmeldung wurde an die Teilen-Funktion übergeben.");
      } else if (aktion === "kopieren") {
        if (!navigator.clipboard?.writeText) { setMeldung("Kopieren ist hier nicht verfügbar. Lade die Rückmeldung als Textdatei herunter."); return; }
        await navigator.clipboard.writeText(feedbackText(aktuell));
        merke("kopiert", "Rückmeldung kopiert. Du kannst sie jetzt selbst in eine Nachricht einfügen.");
      } else {
        const json = aktion === "json";
        download(json ? JSON.stringify(feedbackPayload(aktuell), null, 2) : feedbackText(aktuell), `dachdecker-rueckmeldung-${aktuell.id}.${json ? "json" : "txt"}`, json ? "application/json" : "text/plain;charset=utf-8");
        merke("exportiert", "Deine Rückmeldung wurde als Datei zum Download bereitgestellt.");
      }
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "AbortError") setMeldung("Teilen abgebrochen. Dein Entwurf bleibt gespeichert.");
      else setFehler("Das hat gerade nicht funktioniert. Dein Entwurf bleibt erhalten; versuche Kopieren oder den Dateiexport.");
    } finally { aktiv.current = false; setBusy(false); }
  }
  return <div className={styles.werkstatt}>
    <section className={styles.hero}><div><span>DEINE ERFAHRUNG HILFT WEITER</span><h1>Was können wir verständlicher machen?</h1><p>Beschreibe kurz, wo du hängen geblieben bist und was dir geholfen hätte. Dein Entwurf bleibt auf diesem Gerät gespeichert.</p></div><PracticeArtwork art="begriffe"/></section>
    <section className={styles.kontext} aria-label="Kontext der Rückmeldung"><div><strong>App-Version {d.appVersion}</strong><p>Bereich: {d.bereich}{d.aufgabeId ? ` · Aufgabe: ${d.aufgabeId}` : ""}</p></div><Link href={d.bereich}>Zum Bereich zurück →</Link>{andererBereich && <button className="min-h-11 underline" disabled={busy} onClick={() => aendern({ ...kontext, aufgabeId: kontext.aufgabeId, aufgabeText: kontext.aufgabeText, aufgabeAnhaengen: false })}>Aktuell aufgerufenen Bereich übernehmen</button>}</section>
    <form className={styles.form} onSubmit={ev => { ev.preventDefault(); void ausgeben("teilen"); }}>
      <label>Worum geht es?<select aria-label="Kategorie" value={d.kategorie} disabled={busy} onChange={ev => aendern({ kategorie: ev.target.value as FeedbackKategorie })}>{FEEDBACK_KATEGORIEN.map(k => <option key={k}>{k}</option>)}</select></label>
      <label>Was war unverständlich oder hat nicht funktioniert?<textarea maxLength={5000} disabled={busy} value={d.beobachtung} onChange={ev => aendern({ beobachtung: ev.target.value })}/><small>Zum Beispiel: „Ich wusste nach der Erklärung nicht, welche Länge ich einsetzen soll.“</small></label>
      <label>Was hast du erwartet oder gebraucht?<textarea maxLength={5000} disabled={busy} value={d.erwartet} onChange={ev => aendern({ erwartet: ev.target.value })}/><small>Zum Beispiel eine beschriftete Skizze oder eine Erklärung zu einem Fachwort.</small></label>
      {d.aufgabeText && <><label className={styles.anhaengen}><input type="checkbox" disabled={busy} checked={d.aufgabeAnhaengen} onChange={ev => aendern({ aufgabeAnhaengen: ev.target.checked })}/><span>Die angezeigte Aufgabenangabe anhängen</span></label>{d.aufgabeAnhaengen && <p className={styles.aufgabe}>{d.aufgabeText}</p>}</>}
      <p className={styles.hinweis}>Du bestimmst, wann und an wen du die Rückmeldung weitergibst. Geteilt werden die Angaben in diesem Bogen und der angezeigte Aufgabenbezug.</p>
      <div className={styles.aktionen}><button className="hauptaktion" type="submit" disabled={busy}>{busy ? "Wird vorbereitet …" : "Rückmeldung teilen"}</button><button type="button" disabled={busy} onClick={() => void ausgeben("kopieren")}>Text kopieren</button><button type="button" disabled={busy} onClick={() => void ausgeben("text")}>Textdatei herunterladen</button><button type="button" disabled={busy} onClick={() => void ausgeben("json")}>JSON herunterladen</button></div>
      {fehler && <p role="alert" className={styles.fehler}>{fehler}</p>}{meldung && <p role="status" className={styles.status}>{meldung}</p>}
    </form>
    <button className={styles.neue} disabled={busy} onClick={() => speichern(wechsleFeedbackEntwurf(ref.current!, neuerFeedbackEntwurf(kontext)))}>Neue Rückmeldung beginnen</button>
    {stand.entwuerfe.length > 0 && <section className={styles.historie}><h2>Weitere gespeicherte Entwürfe</h2><ul>{stand.entwuerfe.map(e => <li key={e.id}><strong>{e.beobachtung.slice(0, 120) || e.erwartet.slice(0, 120)}</strong><button disabled={busy} onClick={() => speichern(wechsleFeedbackEntwurf(ref.current!, { ...e }))}>Entwurf öffnen</button></li>)}</ul></section>}
    {stand.eintraege.length > 0 && <section className={styles.historie}><h2>Auf diesem Gerät aufbewahrt</h2><p className={styles.hinweis}>Diese Liste dokumentiert deine eigenen Rückmeldungen. Sie bestätigt keinen Empfang durch eine andere Person.</p><ul>{stand.eintraege.map(e => <li key={e.entwurf.id}><strong>{e.entwurf.kategorie}: {e.entwurf.beobachtung.slice(0, 120)}</strong><p>{new Date(e.am).toLocaleString("de-DE")} · {e.aktion === "geteilt" ? "Teilen-Funktion verwendet" : e.aktion === "kopiert" ? "Text kopiert" : "Datei vorbereitet"} · Version {e.entwurf.appVersion}</p><button disabled={busy} onClick={() => speichern(wechsleFeedbackEntwurf(ref.current!, { ...e.entwurf }))}>Wieder öffnen</button></li>)}</ul></section>}
    <p className={styles.hinweis}>Für eine gemeinsame beobachtete Erprobung: <Link className="underline" href="/erprobung">Beobachtungsbogen mit Azubis öffnen →</Link></p>
  </div>;
}
