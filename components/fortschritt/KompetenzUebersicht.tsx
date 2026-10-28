"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { LernLink } from "@/components/LernLink";
import { KOMPETENZEN, VORBEREITUNGS_PROFIL, type KompetenzId } from "@/lib/pruefungsVorbereitungTypen";
import { KOMPETENZ_STATUS, kompetenzSnapshot, kompetenzStand, parseKompetenzNachweise, subscribeKompetenzNachweise, type KompetenzNachweis } from "@/lib/kompetenzNachweise";

const THEMEN = [["ziegeldach","Ziegeldach"],["flachdach","Flachdach"],["sanierung","Sanierung"],["schiefer","Schiefer"],["metalldach","Metalldeckung"],["fassade","Fassade"]] as const;
const karte = {background:"var(--surface)",borderColor:"var(--border-soft)"};
const datum = (am:number) => new Date(am).toLocaleDateString("de-DE");
const eigenerVergleich = (k:KompetenzId) => k === "detail" || k === "erklaeren";
function belegText(n:KompetenzNachweis):string {
  if(n.art === "selbst") return "Selbsteinschätzung · keine automatische Fachbewertung";
  if(n.art === "praxis") return "Eigene Praxisangabe · keine verifizierte Prüfungsabnahme";
  if(n.modus === "begleitet") return "Begleitet geübt";
  if(n.nachErklaerung || n.hilfen.length) return "Mit Lernhilfe bearbeitet";
  return n.richtig ? "Selbstständig richtig" : "Noch gezielt üben";
}
export function KompetenzUebersicht() {
  const [jetzt, setJetzt] = useState(() => Date.now());
  const subscribe = useCallback((listener: () => void) => subscribeKompetenzNachweise(() => { setJetzt(Date.now()); listener(); }), []);
  const raw = useSyncExternalStore(subscribe, kompetenzSnapshot, () => "");
  const nachweise = useMemo(() => parseKompetenzNachweise(raw || null), [raw]);
  const [gewaehlt, setGewaehlt] = useState<KompetenzId>("rechnen");
  const werte = nachweise ?? [];
  const staende = (Object.keys(KOMPETENZEN) as KompetenzId[]).map(k => kompetenzStand(k, werte, jetzt));
  const aktiv = staende.find(s => s.kompetenz === gewaehlt)!;
  return <section id="kompetenzen" aria-labelledby="kompetenz-titel" className="mt-7">
    <header className="bereichs-einstieg"><span>DEINE PRÜFUNGSVORBEREITUNG</span><h2 id="kompetenz-titel" className="mt-2 text-2xl font-semibold">Was du schon selbstständig gezeigt hast</h2><p>{VORBEREITUNGS_PROFIL.titel} · {VORBEREITUNGS_PROFIL.hinweis}</p></header>
    <p className="mt-3 text-sm" style={{color:"var(--text-muted)"}}>Hier zählen dokumentierte Versuche. Alte Lernstände bleiben erhalten und werden nicht rückwirkend zu Prüfungsnachweisen. Deine Bestehenschance wird daraus nicht berechnet.</p>
    {!nachweise && <p role="alert" className="mt-4 rounded-xl border p-4" style={{borderColor:"var(--bad)",color:"var(--bad)"}}>Die Kompetenznachweise können nicht gelesen werden. Sichere deinen Stand, bevor du weiterarbeitest.</p>}
    <div role="group" aria-label="Kompetenz auswählen" className="mt-5 grid gap-3 sm:grid-cols-2">
      {staende.map(s => <button key={s.kompetenz} type="button" className="min-h-24 rounded-2xl border p-4 text-left" style={{...karte,...(gewaehlt===s.kompetenz?{borderColor:"var(--accent)",background:"var(--accent-soft)"}:{})}} aria-pressed={gewaehlt===s.kompetenz} onClick={()=>setGewaehlt(s.kompetenz)}>
        <strong className="block">{KOMPETENZEN[s.kompetenz]}</strong>{" "}<span className="mt-1 block text-sm">{eigenerVergleich(s.kompetenz) ? s.selbst ? "Selbst eingeschätzt" : "Eigener Vergleich noch offen" : KOMPETENZ_STATUS[s.status]}</span>{" "}
        <span className="mt-1 block text-xs" style={{color:"var(--text-muted)"}}>{eigenerVergleich(s.kompetenz) ? `${s.selbst} eigene Vergleiche · getrennt von automatischen Punkten` : `${s.unabhaengig} selbstständige Nachweise · ${s.familien} Aufgabenfamilien${s.auffrischen ? " · Auffrischung empfohlen" : ""}`}</span>
      </button>)}
    </div>
    <details className="mt-4 rounded-xl border p-4" style={karte}><summary className="min-h-10 cursor-pointer font-semibold">Wann heißt es „später bestätigt“?</summary><p className="mt-2 text-sm">Drei vollständig richtige Erstversuche ohne Lernhilfe, jeweils mindestens 24 Stunden auseinander und insgesamt über mindestens sieben Tage. Dazu gehören mindestens zwei Aufgabenfamilien und eine Aufgabe mit verändertem Zusammenhang. Das ist unser interner Trainingsstandard.</p><p className="mt-2 text-sm" style={{color:"var(--text-muted)"}}>Zugelassene Taschenrechner sind keine Lernhilfe. Sofortige Nacharbeit, wiederholte gleiche Varianten, freie Texte, Zeichnungen und praktische Selbsteinschätzungen bestätigen die automatische Leistung nicht. Frühere Nachweise bleiben auch dann sichtbar, wenn eine spätere Antwort noch Übung braucht.</p></details>
    <section className="mt-5 rounded-2xl border p-5" style={karte} aria-labelledby="kompetenz-belege">
      <h3 id="kompetenz-belege" className="text-lg font-semibold">{KOMPETENZEN[gewaehlt]}: deine Belege</h3>
      {!aktiv.nachweise.length ? <p className="mt-3" style={{color:"var(--text-muted)"}}>Hier fehlt noch ein dokumentierter Versuch. Starte mit einem passenden Fall oder einer selbstständigen Rechenaufgabe.</p> : <>
        <p className="mt-2 text-sm">{aktiv.transfer ? "Ein selbstständiger Kontexttransfer liegt vor." : "Ein selbstständiger Kontexttransfer ist noch offen."} {aktiv.selbst ? `${aktiv.selbst} Selbsteinschätzungen werden getrennt ausgewiesen.` : ""}</p>
        <ul className="mt-4 space-y-3">{[...aktiv.nachweise].reverse().slice(0,12).map(n=><li key={n.id} className="rounded-xl border p-3" style={{borderColor:"var(--border-soft)"}}><strong className="block">{n.thema}</strong><span className="block text-sm">{datum(n.am)} · {belegText(n)}{n.transfer ? n.transferArt === "anderer-fallkontext" ? " · Anderer Fallkontext" : " · Transferaufgabe" : ""}</span>{n.art==="automatisch"&&<span className="block text-xs" style={{color:"var(--text-muted)"}}>{n.erreicht} von {n.moeglich} Punkten · Variante {n.variante.length < 45 ? n.variante : "gespeichert"}</span>}</li>)}</ul>
        {aktiv.nachweise.length>12&&<p className="mt-3 text-sm">Die zwölf neuesten Belege werden angezeigt. Alle {aktiv.nachweise.length} bleiben gespeichert und sind Teil deiner vollständigen Sicherung.</p>}
      </>}
    </section>
    <section className="mt-5 rounded-2xl border p-5" style={karte} aria-labelledby="kompetenz-abdeckung">
      <h3 id="kompetenz-abdeckung" className="text-lg font-semibold">Welche Themen sind bereits erprobt?</h3>
      <p className="mt-2 text-sm" style={{color:"var(--text-muted)"}}>Die Anzeige bezieht sich auf „{KOMPETENZEN[gewaehlt]}“. Ein Erfolg beim Ziegeldach bedeutet nicht automatisch, dass jeder andere Zusammenhang schon erprobt ist.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{THEMEN.map(([id,titel])=>{const stand=kompetenzStand(gewaehlt,werte.filter(n=>n.familie===id),jetzt);return <li key={id} className="rounded-xl p-3" style={{background:"var(--surface-2)"}}><strong className="block text-sm">{titel}</strong><span className="text-sm">{stand.unabhaengig?`${stand.unabhaengig} selbstständige Nachweise`:stand.nachweise.some(n=>n.art==="automatisch")?"Begleitet oder noch nicht vollständig richtig":stand.selbst?"Bisher selbst eingeschätzt":"Noch kein Nachweis"}</span></li>;})}</ul>
    </section>
    <div className="mt-5 flex flex-wrap gap-3"><LernLink href="/pruefung" className="hauptaktion">Passenden Prüfungsfall öffnen →</LernLink><LernLink href="/projekte?ansicht=praxis" className="min-h-12 rounded-xl border px-4 py-3" style={{borderColor:"var(--border)"}}>Praktische Vorbereitung und Rückmeldungen →</LernLink><LernLink href="/heute" className="min-h-12 rounded-xl border px-4 py-3" style={{borderColor:"var(--border)"}}>Fällige Wiederholungen öffnen →</LernLink></div>
  </section>;
}
