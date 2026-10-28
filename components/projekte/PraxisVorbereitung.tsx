"use client";
import { useEffect, useRef, useState } from "react";
import { LernLink } from "@/components/LernLink";
import { SafeSvg } from "@/components/SafeSvg";
import { DrawCard } from "@/components/aufgaben/DrawCard";
import { FALL_THEMEN } from "@/lib/pruefungsFaelle";
import { appStorage } from "@/lib/lernSpeicher";
import { neuePraxisVorbereitung, parsePraxisVorbereitung, planungFesthalten, praxisVorbereitungKey, speicherePraxisVorbereitung, type PraxisVorbereitungStand } from "@/lib/praxisVorbereitung";
import type { DrawAufgabe } from "@/content/schema";

const flaeche = { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" };
const PRINT_CSS = `
.praxis-druck-text { display: none; }
@media print {
 html { zoom: 1 !important; --text: #111; --text-muted: #333; --bg: #fff; --surface: #fff; --surface-2: #f5f5f5; }
 body { background: #fff !important; color: #111 !important; }
 .werkstatt-nav, .werkstatt-kopf, .werkzeug-panel, .mobile-nav, .save-state, .skip-link, .praxis-nicht-drucken { display: none !important; }
 .app-shell, .app-shell.mit-werkzeug { display: block !important; min-height: 0 !important; }
 .arbeitsflaeche { max-width: none !important; padding: 0 !important; }
 .praxis-blatt-druck { width: 100%; color: #111; }
 .praxis-blatt-druck section, .praxis-blatt-druck figure { break-inside: avoid; box-shadow: none !important; }
 .praxis-blatt-druck textarea, .praxis-blatt-druck input, .praxis-blatt-druck button { display: none !important; }
 .praxis-druck-text { display: block; white-space: pre-wrap; border: 1px solid #bbb; padding: 8px; min-height: 35px; }
 .praxis-blatt-druck details > * { display: block !important; }
 .praxis-blatt-druck svg { max-height: 180px; }
}
`;

function NotizFeld({ label, wert, onChange }: {label:string;wert:string;onChange:(v:string)=>void}) {
  return <label className="mt-4 block font-semibold">{label}<textarea maxLength={12000} value={wert} onChange={e=>onChange(e.target.value)} className="mt-2 min-h-28 w-full rounded-xl border p-3 font-normal" style={flaeche}/><span className="praxis-druck-text font-normal">{wert||"Noch offen"}</span></label>;
}
function Liste({ texte }: {texte:string[]}) { return <ul className="mt-2 list-disc space-y-2 pl-5">{texte.map((x,i)=><li key={i}>{x}</li>)}</ul>; }

export function PraxisVorbereitung({ initialThema }: { initialThema?: string }) {
  const [thema, setThema] = useState(() => FALL_THEMEN.some(t=>t.id===initialThema) ? initialThema! : FALL_THEMEN[0].id);
  return <div>
    <style>{PRINT_CSS}</style>
    <header className="bereichs-einstieg praxis-nicht-drucken"><span>VORBEREITEN · AUSFÜHREN · BESPRECHEN</span><h1>Dein Praxisblatt für Betrieb und Schule</h1><p>Plane Werkzeug, Material und Arbeitsfolge. Halte anschließend getrennt fest, was du tatsächlich geübt und welche Rückmeldung du erhalten hast.</p><LernLink href="/projekte?ansicht=uebersicht" className="mt-4 inline-block min-h-11 py-2 underline">← Zu den Baustellenprojekten</LernLink></header>
    <label className="mt-6 block font-semibold praxis-nicht-drucken">Praxisthema auswählen<select value={thema} onChange={e=>setThema(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border p-3" style={flaeche}>{FALL_THEMEN.map(t=><option value={t.id} key={t.id}>{t.titel}</option>)}</select></label>
    <PraxisBlatt key={thema} thema={thema}/>
  </div>;
}

function PraxisBlatt({ thema }: { thema: string }) {
  const [anfang] = useState(() => {
    const raw=appStorage.getItem(praxisVorbereitungKey(thema)), geladen=parsePraxisVorbereitung(raw);
    return { unlesbar:raw!==null&&(!geladen||geladen.blatt.thema!==thema), stand:geladen?.blatt.thema===thema?geladen:neuePraxisVorbereitung(thema) };
  });
  const [stand,setStand]=useState(anfang.stand), aktuell=useRef(stand);
  const [fehler,setFehler]=useState(""), [zeichnen,setZeichnen]=useState(false);
  const s=stand,b=s.blatt;
  useEffect(()=>{
    if(anfang.unlesbar)return;
    try {speicherePraxisVorbereitung(anfang.stand);}
    catch(e){queueMicrotask(()=>setFehler(e instanceof Error?e.message:"Dein Praxisblatt konnte nicht gespeichert werden."));}
  },[anfang]);
  function speichern(patch:Partial<PraxisVorbereitungStand>){
    const neu={...aktuell.current,...patch,aktualisiertAm:Date.now()};aktuell.current=neu;setStand(neu);
    try{speicherePraxisVorbereitung(neu);setFehler("");}
    catch(e){setFehler(e instanceof Error?e.message:"Deine Eingabe ist noch nicht dauerhaft gespeichert. Lass das Blatt geöffnet.");}
  }
  function rueckmeldung(patch:Partial<PraxisVorbereitungStand["rueckmeldung"]>){speichern({rueckmeldung:{...aktuell.current.rueckmeldung,...patch},rueckmeldungErfasst:false});}
  const zeichnungsAufgabe:DrawAufgabe={id:`${s.id}-zeichnung`,typ:"draw",lernfeld:"praxis",thema:b.titel,quelle:"Eigenes Praxisblatt · schematische Lernzeichnung, keine Ausführungsplanung.",konfidenz:"hoch",aufgabentext:b.zeichenAuftrag,loesungSvg:b.musterSvg,schritte:b.zeichenKriterien,erklaerung:"Vergleiche die Funktion, Beschriftung und erforderlichen Maße. Deine Einschätzung einer Skizze bewertet keine tatsächliche handwerkliche Ausführung."};
  if(anfang.unlesbar)return <section className="werkstatt-karte mt-6"><h2>Dein vorhandener Praxisstand bleibt erhalten.</h2><p role="alert">Dieses Praxisblatt lässt sich gerade nicht lesen. Es wird nicht überschrieben. Erstelle zuerst eine vollständige Sicherung.</p><LernLink href="/fortschritt">Zur Datensicherung →</LernLink></section>;
  return <article className="praxis-blatt-druck mt-6 space-y-6" aria-label={`Praxisblatt ${b.titel}`}>
    <header className="werkstatt-karte"><p className="text-sm" style={{color:"var(--text-muted)"}}>PRAXISVORBEREITUNG · TRAININGSBLATT</p><h2 className="mt-2 text-2xl font-bold">{b.titel}</h2><p>{b.auftrag}</p><Liste texte={b.angaben}/><figure className="mt-5 rounded-xl border p-3" style={flaeche}><SafeSvg markup={b.svg} className="[&_svg]:h-auto [&_svg]:max-w-full"/><figcaption className="mt-2 text-sm">Schematische Lernzeichnung. Zusätzliche Ausführungsangaben werden mit Betrieb oder Schule geklärt.</figcaption></figure><button type="button" className="hauptaktion mt-4 praxis-nicht-drucken" onClick={()=>window.print()}>Praxisblatt drucken / als PDF sichern</button></header>
    {fehler&&<p role="alert" className="rounded-xl border p-4" style={{borderColor:"var(--bad)",color:"var(--bad)"}}>{fehler}</p>}
    <section className="werkstatt-karte" aria-label="Getrennte Praxisnachweise"><h3>Was ist bereits dokumentiert?</h3><ul className="mt-3 space-y-2"><li>{s.planung?"✓ In der App vorbereitet":"○ Vorbereitung noch offen"}</li><li>{s.ausgefuehrt?"✓ Nach eigener Angabe praktisch ausgeführt":"○ Praktische Ausführung noch nicht eingetragen"}</li><li>{s.rueckmeldungErfasst?"✓ Rückmeldung aus Betrieb oder Schule eingetragen":"○ Rückmeldung noch offen"}</li></ul><p>Diese Angaben bleiben getrennt. Ein fertiges Blatt ist keine Bestätigung fachgerechter handwerklicher Ausführung.</p></section>
    <section className="werkstatt-karte"><h3>1. Meine Arbeitsplanung</h3>
      <NotizFeld label="Welche Werkzeuge brauche ich?" wert={s.werkzeugeText} onChange={werkzeugeText=>speichern({werkzeugeText})}/><NotizFeld label="Welches Material und welche Angaben brauche ich?" wert={s.materialText} onChange={materialText=>speichern({materialText})}/><NotizFeld label="Wie gehe ich vor?" wert={s.ablaufText} onChange={ablaufText=>speichern({ablaufText})}/>
      <details className="mt-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold">Mit den Planungshinweisen vergleichen</summary><div className="mt-3 grid gap-4 md:grid-cols-2"><div><h4 className="font-semibold">Werkzeuge und Hilfsmittel</h4><Liste texte={b.werkzeuge}/></div><div><h4 className="font-semibold">Material und Systemangaben</h4><Liste texte={b.material}/></div></div><h4 className="mt-4 font-semibold">Mögliche Arbeitsfolge</h4><ol className="list-decimal pl-5">{b.ablauf.map((x,i)=><li key={i}>{x}</li>)}</ol></details>
      <button type="button" className="hauptaktion mt-4 praxis-nicht-drucken" disabled={!s.werkzeugeText.trim()||!s.materialText.trim()||!s.ablaufText.trim()} onClick={()=>speichern(planungFesthalten(aktuell.current))}>Meine Vorbereitung festhalten</button>
      {s.erstePlanung&&<details className="mt-4"><summary className="min-h-11 cursor-pointer py-2 font-semibold">Meine erste festgehaltene Planung</summary><p className="whitespace-pre-wrap">Werkzeuge: {s.erstePlanung.werkzeuge||"Noch offen"}{"\n"}Material: {s.erstePlanung.material||"Noch offen"}{"\n"}Arbeitsfolge: {s.erstePlanung.ablauf||"Noch offen"}</p></details>}
    </section>
    <section className="werkstatt-karte"><h3>2. Sicher vorbereiten und Qualität kontrollieren</h3><h4 className="mt-4 font-semibold">Arbeitsschutz und Vorbereitung</h4><Liste texte={b.sicherheit}/><fieldset className="mt-5"><legend className="font-semibold">Meine Kontrollpunkte</legend>{b.kontrolle.map((x,i)=><label className="mt-2 flex min-h-11 items-start gap-3" key={i}><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={s.kontrolliert.includes(`kontrolle-${i}`)} onChange={e=>speichern({kontrolliert:e.target.checked?[...aktuell.current.kontrolliert,`kontrolle-${i}`]:aktuell.current.kontrolliert.filter(k=>k!==`kontrolle-${i}`)})}/><span>{s.kontrolliert.includes(`kontrolle-${i}`)?"✓ ":"○ "}{x}</span></label>)}</fieldset></section>
    <section className="werkstatt-karte"><h3>3. Mein Detail</h3><p>{b.zeichenAuftrag}</p><Liste texte={b.zeichenKriterien}/><div className="praxis-nicht-drucken">{!zeichnen?<button type="button" className="hauptaktion mt-4" onClick={()=>setZeichnen(true)}>Skizze zeichnen oder Papierfoto ergänzen</button>:<div className="mt-4"><DrawCard aufgabe={zeichnungsAufgabe} anfangsBewertung={s.zeichnung} onErgebnis={zeichnung=>speichern({zeichnung})}/></div>}</div><p>Zeichenvergleich: {s.zeichnung?({richtig:"selbst als sicher eingeschätzt",teilweise:"selbst als teilweise sicher eingeschätzt",falsch:"noch einmal üben"} as const)[s.zeichnung]:"noch offen"}. Skizzen und Papierfotos bleiben bei diesem Praxisblatt gespeichert.</p></section>
    <section className="werkstatt-karte"><h3>4. Mein Gespräch mit Betrieb oder Schule</h3><ol className="mt-3 list-decimal space-y-3 pl-5">{b.gespraech.map((x,i)=><li key={i}>{x}</li>)}</ol><NotizFeld label="Meine Fragen und Merksätze" wert={s.notiz} onChange={notiz=>speichern({notiz})}/></section>
    <section className="werkstatt-karte"><h3>5. Praktische Ausführung dokumentieren</h3><label className="mt-4 flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={s.ausgefuehrt} onChange={e=>speichern({ausgefuehrt:e.target.checked})}/><span>Ich habe den Auftrag praktisch geübt.</span></label><label className="mt-4 block">Übungsdatum (freiwillig)<input type="date" className="ml-3 min-h-11 rounded-xl border p-2" style={flaeche} value={s.ausgefuehrtAm} onChange={e=>speichern({ausgefuehrtAm:e.target.value})}/><span className="praxis-druck-text">{s.ausgefuehrtAm||"Nicht angegeben"}</span></label><NotizFeld label="Was habe ich tatsächlich ausgeführt?" wert={s.ausfuehrungNotiz} onChange={ausfuehrungNotiz=>speichern({ausfuehrungNotiz})}/></section>
    <section className="werkstatt-karte"><h3>6. Rückmeldung festhalten</h3><p>Trage ein, was ihr besprochen oder beobachtet habt. Name und Rolle sind freiwillige Angaben; diese App bestätigt keine Identität.</p><div className="mt-4 grid gap-3 md:grid-cols-2"><label>Name (freiwillig)<input className="mt-1 min-h-11 w-full rounded-xl border p-3" style={flaeche} maxLength={200} value={s.rueckmeldung.name} onChange={e=>rueckmeldung({name:e.target.value})}/><span className="praxis-druck-text">{s.rueckmeldung.name||"Nicht angegeben"}</span></label><label>Rolle (freiwillig)<input className="mt-1 min-h-11 w-full rounded-xl border p-3" style={flaeche} maxLength={200} value={s.rueckmeldung.rolle} onChange={e=>rueckmeldung({rolle:e.target.value})}/><span className="praxis-druck-text">{s.rueckmeldung.rolle||"Nicht angegeben"}</span></label></div><label className="mt-4 block">Datum der Rückmeldung (freiwillig)<input type="date" className="ml-3 min-h-11 rounded-xl border p-2" style={flaeche} value={s.rueckmeldung.datum} onChange={e=>rueckmeldung({datum:e.target.value})}/><span className="praxis-druck-text">{s.rueckmeldung.datum||"Nicht angegeben"}</span></label><NotizFeld label="Welche Rückmeldung habe ich erhalten?" wert={s.rueckmeldung.text} onChange={text=>rueckmeldung({text})}/><button type="button" className="hauptaktion mt-4 praxis-nicht-drucken" disabled={!s.rueckmeldung.text.trim()} onClick={()=>speichern({rueckmeldungErfasst:true})}>Rückmeldung als eingetragen markieren</button><p>{s.rueckmeldungErfasst?"Rückmeldung eingetragen. Sie bleibt getrennt von automatischen Ergebnissen und deiner Selbsteinschätzung.":"Der Text ist ein Entwurf, bis du die Rückmeldung als eingetragen markierst."}</p></section>
  </article>;
}
