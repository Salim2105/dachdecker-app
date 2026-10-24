"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { PracticeArtwork } from "@/components/practice/PracticeArtwork";
import {
  BEOBACHTUNGS_LABEL, ERPROBUNG_KEY, ERPROBUNGS_AUFGABEN, erprobungAlsCsv, erprobungAlsJson, erprobungsAuswertung,
  ladeErprobung, leereBeobachtung, neueErprobungsSitzung, speichereErprobung,
  type Beobachtung, type BeobachtungsErgebnis, type ErprobungsSitzung, type ErprobungsStand,
} from "@/lib/erprobung";
import { appStorage } from "@/lib/lernSpeicher";
import styles from "./Erprobung.module.css";

function herunterladen(inhalt: string, name: string, typ: string) {
  const url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  const link = document.createElement("a"); link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ErprobungsWerkstatt() {
  const [stand, setStand] = useState(ladeErprobung);
  const ref = useRef(stand);
  const [code, setCode] = useState(() => appStorage.getItem("erprobung-naechstes-kuerzel") ?? "");
  const [fehler, setFehler] = useState("");
  const [meldung, setMeldung] = useState("");
  const ueberschrift = useRef<HTMLHeadingElement>(null);
  function speichern(neu: ErprobungsStand) {
    ref.current = neu; setStand(neu); setMeldung("");
    try { speichereErprobung(neu); setFehler(""); }
    catch { setFehler("Die Erprobung konnte nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen und deine Beobachtungen exportieren."); }
  }
  if (!stand) return <section className="werkstatt-karte"><h1>Gespeicherte Erprobung prüfen</h1><p>Die vorhandene Datei konnte nicht gelesen werden. Sie wurde nicht überschrieben.</p><button className="hauptaktion mt-4" onClick={() => herunterladen(appStorage.getItem(ERPROBUNG_KEY) ?? "", "erprobung-original.txt", "text/plain;charset=utf-8")}>Gespeicherte Originaldatei sichern</button><Link className="mt-4 block underline" href="/fortschritt">Vollständige Datensicherung öffnen</Link></section>;
  const sitzung = stand.sitzungen.find((s) => s.id === stand.auswahl);
  const aufgabe = ERPROBUNGS_AUFGABEN.find((a) => a.id === sitzung?.aufgabeId) ?? ERPROBUNGS_AUFGABEN[0];
  const b = sitzung?.beobachtungen[aufgabe.id] ?? leereBeobachtung();
  const zahlen = sitzung ? erprobungsAuswertung(sitzung) : null;
  function sitzungAendern(patch: Partial<ErprobungsSitzung>) {
    const aktuell = ref.current;
    if (!aktuell || !sitzung) return;
    speichern({ ...aktuell, sitzungen: aktuell.sitzungen.map((s) => s.id === sitzung.id ? { ...s, ...patch } : s) });
  }
  function beobachtungAendern(patch: Partial<Beobachtung>) {
    const aktuell = ref.current?.sitzungen.find((s) => s.id === sitzung?.id);
    if (!aktuell) return;
    sitzungAendern({ beobachtungen: { ...aktuell.beobachtungen, [aufgabe.id]: { ...(aktuell.beobachtungen[aufgabe.id] ?? leereBeobachtung()), ...patch } } });
  }
  function exportieren(format: "json" | "csv") {
    const aktuell = ref.current?.sitzungen.find((s) => s.id === sitzung?.id);
    if (!aktuell || !erprobungsAuswertung(aktuell).erfasst) return;
    herunterladen(format === "json" ? erprobungAlsJson(aktuell) : erprobungAlsCsv(aktuell), `dachdecker-erprobung-${aktuell.id.replace(/[^a-zA-Z0-9_-]/g, "-")}.${format}`, format === "json" ? "application/json" : "text/csv;charset=utf-8");
    setMeldung("Deine erfassten Beobachtungen wurden zum Download bereitgestellt.");
  }
  return <div className={styles.werkstatt}>
    <section className={styles.hero}><div><span>GEMEINSAM MIT AZUBIS VERBESSERN</span><h1>Lernen beobachten. Die App besser machen.</h1><p>Hier hältst du fest, was bei einer tatsächlichen Erprobung klappt und wo Lernende Hilfe brauchen. Die Einträge bleiben auf diesem Gerät.</p></div><PracticeArtwork art="baustelle" /></section>
    {!stand.sitzungen.length && <section className={styles.leer}><h2>Noch keine Nutzertests erfasst</h2><p>Der Testablauf ist vorbereitet. Er sagt noch nichts darüber aus, wie gut echte Azubis mit der App lernen. Dafür braucht es beobachtete Erprobungen.</p></section>}
    <details className={styles.anleitung}><summary>So funktioniert eine Erprobung</summary><ol><li>Eine beobachtende Person und ein Azubi arbeiten gemeinsam. Erkläre: Wir erproben die App; es gibt keine Schulnote.</li><li>Lass den Azubi eine Aufgabe in eigenen Worten wiedergeben und selbst bearbeiten. Hilf erst, wenn er darum bittet oder nicht weiterkommt.</li><li>Notiere den tatsächlichen Ablauf und jede Hilfe. Lass unbekannte Begriffe erklären und prüfe den Rechenweg an einem neuen Beispiel.</li><li>Ihr könnt einzelne Aufgaben auswählen, Pausen machen und später fortsetzen. Nicht beobachtete Aufgaben bleiben offen.</li></ol><p>Zum Vergleichen mehrere Personen mit unterschiedlichen Vorkenntnissen einbeziehen. Keine Ergebnisse vorab eintragen.</p></details>
    <section className={styles.sitzungsLeiste} aria-label="Erprobung auswählen oder anlegen">
      {!!stand.sitzungen.length && <label>Gespeicherte Erprobung<select value={stand.auswahl ?? ""} onChange={(ev) => speichern({ ...ref.current!, auswahl: ev.target.value })}><option value="" disabled>Bitte auswählen</option>{stand.sitzungen.map((s) => <option value={s.id} key={s.id}>{s.code} · {new Date(s.angelegt).toLocaleDateString("de-DE")}</option>)}</select></label>}
      <form onSubmit={(ev) => { ev.preventDefault(); const aktuell = ref.current!; speichern(neueErprobungsSitzung(aktuell, code)); setCode(""); appStorage.removeItem("erprobung-naechstes-kuerzel"); }}><label>Kürzel für die nächste Person <small>Optional, zum Beispiel A03. Kein Name erforderlich.</small><input maxLength={80} value={code} onChange={(ev) => { setCode(ev.target.value); appStorage.setItem("erprobung-naechstes-kuerzel", ev.target.value); }} /></label><button className="hauptaktion" type="submit">Neue Erprobung anlegen</button></form>
    </section>
    {fehler && <p role="alert" className={styles.fehler}>{fehler}</p>}
    {sitzung && zahlen && <>
      <section className={styles.sitzung}><div><span>AKTUELLE ERPROBUNG</span><h2>{sitzung.code}</h2><p>{zahlen.erfasst} von {ERPROBUNGS_AUFGABEN.length} Aufgaben mit Beobachtung · {zahlen.ergebnisOffen} Ergebnisse noch offen</p></div><label>Vorkenntnisse laut Selbstauskunft <small>Optional: Ausbildungsjahr, bisherige Erfahrung mit dem Thema.</small><textarea maxLength={2000} value={sitzung.vorwissen} onChange={(ev) => sitzungAendern({ vorwissen: ev.target.value })} rows={2} /></label></section>
      <div className={styles.raster}>
        <nav className={styles.aufgaben} aria-label="Erprobungsaufgaben">{ERPROBUNGS_AUFGABEN.map((a, index) => <button key={a.id} aria-current={aufgabe.id === a.id ? "step" : undefined} onClick={() => { sitzungAendern({ aufgabeId: a.id }); requestAnimationFrame(() => ueberschrift.current?.focus()); }}><span>{String(index + 1).padStart(2, "0")}</span><span><strong>{a.titel}</strong><small>{BEOBACHTUNGS_LABEL[sitzung.beobachtungen[a.id]?.ergebnis ?? "offen"]}</small></span></button>)}</nav>
        <section className={styles.beobachtung} aria-labelledby="beobachtungs-titel"><div className={styles.auftrag}><span>AUFGABE FÜR DEN AZUBI</span><h2 ref={ueberschrift} tabIndex={-1} id="beobachtungs-titel">{aufgabe.titel}</h2><p>{aufgabe.auftrag}</p><Link href={aufgabe.route}>Aufgabe in der App öffnen →</Link><small>Die Beobachtung wird bei jeder Eingabe gespeichert. Danach über den Übungsraum hierher zurückkehren.</small></div>
          <div className={styles.kriterium}><strong>Darauf achten</strong><p>{aufgabe.kriterium}</p></div>
          <fieldset className={styles.ergebnis}><legend>Was hast du tatsächlich beobachtet?</legend>{(Object.entries(BEOBACHTUNGS_LABEL) as [BeobachtungsErgebnis, string][]).map(([wert, label]) => <label key={wert}><input type="radio" name={`ergebnis-${sitzung.id}-${aufgabe.id}`} value={wert} checked={b.ergebnis === wert} onChange={() => beobachtungAendern({ ergebnis: wert })} />{label}</label>)}</fieldset>
          <div className={styles.notizen}>{([
            ["hilfe", "Welche Hilfe war nötig?", "Zum Beispiel: Formel geöffnet, Wort erklärt, nächste Schaltfläche gezeigt."],
            ["begriffe", "Welche Wörter waren unverständlich?", "Begriffe oder unverständliche Formulierungen möglichst wörtlich notieren."],
            ["missverstaendnis", "Was wurde anders verstanden?", "Den beobachteten Denkweg beschreiben. Nicht raten, warum ein Fehler passiert ist."],
            ["notiz", "Weitere Beobachtung oder Rückmeldung", "Was war hilfreich? Was würde die Person ändern?"],
          ] as const).map(([key, label, hinweis]) => <label key={key}>{label}<small>{hinweis}</small><textarea maxLength={5000} rows={3} value={b[key]} onChange={(ev) => beobachtungAendern({ [key]: ev.target.value })} /></label>)}</div>
          <label className={styles.zeit}>Beobachtete Dauer in Sekunden <small>Optional. Ohne Zeitdruck; nur tatsächlich gemessene Zeit eintragen.</small><input type="number" min={0} max={86400} step={1} value={b.dauerSekunden ?? ""} onChange={(ev) => { const n = ev.target.value === "" ? null : Number(ev.target.value); if (n === null || (Number.isInteger(n) && n >= 0 && n <= 86400)) beobachtungAendern({ dauerSekunden: n }); }} /></label>
        </section>
      </div>
      <section className={styles.auswertung}><div><span>NUR DEINE EINGETRAGENEN BEOBACHTUNGEN</span><h2>Was zeigt diese Erprobung?</h2></div><div className={styles.zahlen}><p><strong>{zahlen.selbststaendig}</strong> selbstständig geschafft</p><p><strong>{zahlen.mitHilfe}</strong> mit Hilfe geschafft</p><p><strong>{zahlen.nichtGelungen}</strong> noch nicht geschafft</p><p><strong>{zahlen.ergebnisOffen}</strong> noch ohne Ergebnis</p></div><p>Einzelne Beobachtungen liefern Hinweise für Verbesserungen. Sie belegen noch keine allgemeine Lernwirksamkeit. Exportiert werden ausschließlich Aufgaben mit eingetragenen Beobachtungen.</p><div className={styles.export}><button disabled={!zahlen.erfasst} className="hauptaktion" onClick={() => exportieren("json")}>Diese Erprobung als JSON sichern</button><button disabled={!zahlen.erfasst} onClick={() => exportieren("csv")}>Als Tabelle herunterladen (CSV)</button></div>{meldung && <p role="status">{meldung}</p>}<Link href="/fortschritt">Alle lokalen Daten vollständig sichern →</Link></section>
    </>}
  </div>;
}
