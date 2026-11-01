"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { dachMedien } from "@/lib/dach3dMedien";
import { getDachDetail, getDachModell } from "@/lib/dach3dInhalte";
import type { DachAnsicht, DachDeckung, DachForm, DachPhase, DachPosition } from "@/lib/dach3dTypen";
import type { DachOrbit } from "./dach3dScene";
import styles from "./DachBetrachter.module.css";

const DachCanvas = dynamic(() => import("./DachCanvas"), { ssr: false, loading: () => <div className={styles.loading}>3D-Betrachter wird geladen …</div> });
export type DachBefehl = "links" | "rechts" | "oben" | "unten" | "naeher" | "weiter" | "reset" | "rundgang" | "pause";
export interface DachBetrachterProps {
  form: DachForm; deckung: DachDeckung; detailId: string | null; ansicht: DachAnsicht;
  phase: DachPhase; schritt: number; schichten: string[]; kamera: DachPosition["kamera"]; wasser: number;
  reduzierteBewegung?: boolean; pruefmodus?: boolean; fehler?: boolean; resetSignal?: number;
  activeDetailIds?: string[]; orbit?: DachOrbit;
  onDetail: (id: string) => void; onKamera?: (preset: DachPosition["kamera"]) => void; onOrbit?: (orbit: DachOrbit) => void;
}

class ModellGrenze extends Component<{ children: ReactNode; onError: (message: string) => void }, { kaputt: boolean }> {
  state = { kaputt: false };
  static getDerivedStateFromError() { return { kaputt: true }; }
  componentDidCatch(error: Error) { this.props.onError(error.message); }
  render() { return this.state.kaputt ? null : this.props.children; }
}

/** Capability detection is deliberately separate from the teaching information. */
export function kannDach3D(): boolean {
  if (typeof window === "undefined" || typeof window.WebGL2RenderingContext === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch { return false; }
}

export function DachBetrachter({ form, deckung, detailId, ansicht, phase, schritt, schichten, kamera, wasser,
  reduzierteBewegung = false, pruefmodus = false, fehler = false, resetSignal = 0, activeDetailIds, orbit,
  onDetail, onKamera, onOrbit,
}: DachBetrachterProps) {
  const id = useId(), medien = dachMedien(form, deckung, detailId ?? undefined);
  const detail = detailId ? getDachDetail(detailId) : undefined, modell = getDachModell(form);
  const titel = detail?.titel ?? modell?.titel ?? "Dachmodell";
  const erlaubt = (activeDetailIds ?? modell?.detailIds ?? []).filter(x => modell?.detailIds.includes(x));
  const [webgl, setWebgl] = useState<boolean | null>(null), [festeAnsicht, setFesteAnsicht] = useState(false);
  const [bereitUrl, setBereitUrl] = useState(""), [modellFehler, setModellFehler] = useState<{ url: string; text: string } | null>(null);
  const [leereUrl, setLeereUrl] = useState("");
  const [versuch, setVersuch] = useState(0), [befehl, setBefehl] = useState<{ art: DachBefehl; nummer: number }>({ art: "reset", nummer: 0 });
  const [sichtbar, setSichtbar] = useState(() => typeof document === "undefined" || !document.hidden);
  const [bildFehler, setBildFehler] = useState("");
  const dialog = useRef<HTMLDialogElement>(null), grossButton = useRef<HTMLButtonElement>(null);
  const [gross, setGross] = useState(false);
  const [rundgang, setRundgang] = useState(false);
  const url = medien.modell?.url ?? "";
  const bild = fehler && detailId ? medien.fehlerBild : detailId ? medien.bilder[ansicht] : medien.preview;
  const hdBild = fehler && detailId ? medien.hdFehlerBild : detailId ? medien.hdBilder[ansicht] : medien.hdPreview;
  const fehlerText = modellFehler?.url === url ? modellFehler.text : "";
  const dreid = !pruefmodus && !fehler && !festeAnsicht && webgl === true && !!url && !fehlerText && sichtbar;
  const bereit = dreid && bereitUrl === `${url}:${versuch}`;

  useEffect(() => {
    let aktiv = true;
    queueMicrotask(() => { if (aktiv) setWebgl(kannDach3D()); });
    return () => { aktiv = false; };
  }, [versuch]);
  useEffect(() => {
    const update = () => {
      // Returning to the tab creates a new Canvas. Its old rendered-frame
      // signal must not make that new scene appear ready before it was drawn.
      if (document.hidden) setBereitUrl("");
      setSichtbar(!document.hidden);
    };
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    let aktiv = true;
    queueMicrotask(() => { if (aktiv) { setRundgang(false); setBefehl({ art: "reset", nummer: 0 }); } });
    return () => { aktiv = false; };
  }, [url, dreid, reduzierteBewegung]);

  function kommando(art: DachBefehl) {
    setBefehl(v => ({ art, nummer: v.nummer + 1 }));
    if (art === "reset") onKamera?.(detailId ? "nah" : "gesamt");
  }
  function tastatur(e: KeyboardEvent<HTMLDivElement>) {
    if (!dreid || e.target !== e.currentTarget) return;
    const key: Record<string, DachBefehl> = { ArrowLeft: "links", ArrowRight: "rechts", ArrowUp: "oben", ArrowDown: "unten", "+": "naeher", "=": "naeher", "-": "weiter", Home: "reset" };
    if (key[e.key]) { e.preventDefault(); kommando(key[e.key]); }
  }
  function erneut() { if (bereit && !festeAnsicht) return; setModellFehler(null); setBereitUrl(""); setVersuch(v => v + 1); setFesteAnsicht(false); }
  function vergroessern() { if (rundgang) { kommando("pause"); setRundgang(false); } setGross(true); dialog.current?.showModal(); }
  const statustext = fehler ? "Fehlerbeispiel · feste Renderansicht" : pruefmodus ? "Aufgabenansicht ohne Lösungsmarkierungen" : festeAnsicht ? "Feste Ansicht aus demselben Lehrmodell" : fehlerText ? "3D konnte nicht geöffnet werden. Die feste Ansicht und deine Eingaben bleiben verfügbar." : webgl === false ? "Auf diesem Gerät ist 3D gerade nicht verfügbar. Du kannst mit denselben festen Ansichten weiterlernen." : !url ? "Feste Ansicht · das Modell ist derzeit nicht verfügbar." : !bereit ? "3D-Modell wird geladen …" : leereUrl === url ? "Für diesen Schritt sind alle Bauteile ausgeblendet. Blende eine Schicht ein oder wähle den nächsten Montageschritt." : "";

  return <figure className={styles.figure} data-dach-betrachter data-status={bereit ? "3d-bereit" : dreid ? "3d-laedt" : "feste-ansicht"} data-modell-url={url}>
    <div className={styles.stage}>
    <header className={styles.header}><div><span className={styles.eyebrow}>{detailId ? "DETAILANSICHT" : "DAS GANZE DACH"}</span><strong>{titel}</strong></div><span className={styles.badge}>{bereit ? "3D · interaktiv" : "Lehrmodell · feste Ansicht"}</span></header>
    <div className={styles.viewport} role="region" aria-label={`Dachansicht: ${titel}`} aria-describedby={`${id}-hilfe`} tabIndex={dreid ? 0 : undefined} onKeyDown={tastatur}>
      {/* These images are own same-scene renders; their aspect ratio must remain visible. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.poster} src={bild} width={960} height={640} alt={`${fehler ? "Fehlerbeispiel" : "Lehrmodell"}: ${titel}, ${ansicht === "nah" ? "Nahansicht" : ansicht === "schnitt" ? "Schnitt" : "auseinandergezogener Aufbau"}. ${detail?.funktion && !pruefmodus ? detail.funktion : "Bauteile ohne Lösungsmarkierungen betrachten."}`} aria-hidden={bereit || undefined} onError={() => setBildFehler(bild)}/>
      {dreid && <div className={styles.canvasLayer}><ModellGrenze key={`${url}:${versuch}`} onError={text => setModellFehler({ url, text })}>
        <DachCanvas url={url} detailId={detailId} ansicht={ansicht} phase={phase} schritt={schritt} schichten={schichten} kamera={kamera} wasser={wasser} reduziert={reduzierteBewegung} erlaubt={erlaubt} resetSignal={resetSignal} befehl={befehl} orbit={orbit} onOrbit={onOrbit} onDetail={onDetail} onBereit={() => setBereitUrl(`${url}:${versuch}`)} onLeer={leer => setLeereUrl(leer ? url : "")} onRundgangEnde={() => setRundgang(false)} onFehler={text => setModellFehler({ url, text })}/>
      </ModellGrenze></div>}
      {(statustext || bildFehler === bild) && <div className={styles.status} role="status">{bildFehler === bild ? "Die feste Ansicht konnte nicht geladen werden. Öffne das Dachpaket erneut; deine Antworten bleiben erhalten." : statustext}{fehlerText && <button type="button" onClick={erneut}>3D erneut versuchen</button>}</div>}
    </div>
    {dreid && <div className={styles.toolbar} role="group" aria-label="Kamera bedienen">
      <button type="button" className={styles.iconButton} disabled={!bereit} aria-label="Dach nach links drehen" title="Nach links drehen" onClick={() => kommando("links")}><ViewerIcon art="links"/></button>
      <button type="button" className={styles.iconButton} disabled={!bereit} aria-label="Dach nach rechts drehen" title="Nach rechts drehen" onClick={() => kommando("rechts")}><ViewerIcon art="rechts"/></button>
      <span className={styles.separator}/>
      <button type="button" className={styles.iconButton} disabled={!bereit} aria-label="Dachansicht vergrößern" title="Näher heran" onClick={() => kommando("naeher")}><ViewerIcon art="plus"/></button>
      <button type="button" className={styles.iconButton} disabled={!bereit} aria-label="Dachansicht verkleinern" title="Weiter weg" onClick={() => kommando("weiter")}><ViewerIcon art="minus"/></button>
      <span className={styles.separator}/>
      <button type="button" className={styles.iconButton} disabled={!bereit || reduzierteBewegung} aria-label={rundgang ? "Rundgang pausieren" : "Rundgang abspielen"} aria-pressed={rundgang} title={reduzierteBewegung ? "Rundgang bei reduzierter Bewegung ausgeschaltet" : rundgang ? "Rundgang pausieren" : "Dach in Ruhe von allen Seiten ansehen"} onClick={() => { kommando(rundgang ? "pause" : "rundgang"); setRundgang(v => !v); }}><ViewerIcon art={rundgang ? "pause" : "play"}/></button>
      <button type="button" className={styles.iconButton} disabled={!bereit} aria-label="Ansicht zurücksetzen" title="Ansicht zurücksetzen" onClick={() => kommando("reset")}><ViewerIcon art="reset"/></button>
    </div>}
    </div>
    <div className={styles.viewModes} role="group" aria-label="Darstellung des Dachmodells">{!pruefmodus && !fehler && <div className={styles.modeSwitch}><button type="button" className={styles.button} aria-pressed={dreid} disabled={webgl === false || !url} onClick={erneut}>3D ansehen</button><button type="button" className={styles.button} aria-pressed={festeAnsicht || webgl === false || !!fehlerText} onClick={() => { setRundgang(false); setFesteAnsicht(true); }}>Feste Ansicht</button></div>}<button ref={grossButton} type="button" className={styles.enlarge} onClick={vergroessern}><span aria-hidden="true">⤢</span> Bild groß ansehen</button></div>
    <details className={styles.help}><summary>Bedienung & Modellhinweise</summary><p id={`${id}-hilfe`}>{dreid ? "Drehen durch Ziehen; Zoomen mit zwei Fingern oder dem Mausrad. Mit fokussierter Dachansicht: Pfeiltasten drehen, +/− zoomen, Pos1 setzt die Ansicht zurück. Der Rundgang läuft einmal um das Dach und lässt sich jederzeit pausieren. Die beschriftete Bauteilauswahl bleibt zusätzlich erreichbar." : "Die festen Ansichten stammen aus demselben 3D-Modell. Auswahl, Erklärungen und Aufgaben bleiben ohne 3D bedienbar."}</p><p>{fehler ? "Dargestellte Abweichung bewusst als Fehlerbeispiel angelegt." : "Aufbau und Maße gehören zum beschriebenen Beispiel."} {!bereit && "Feste Ansichten sind teilweise als Lehrausschnitt geöffnet, damit verdeckte Anschlüsse erkennbar werden."}</p>{wasser > 0 && !pruefmodus && <p>Wasserweg: erklärende Darstellung am Modell; die Schritte zeigen den Verlauf ohne hydraulische Berechnung.</p>}</details>
    <figcaption className={styles.caption}>Eigenes Lehrmodell · {deckung === "biber-doppel" ? "Biberschwanz-Doppeldeckung" : deckung === "warmdach" ? "Warmdach-Beispiel" : "Falzziegel"}</figcaption>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-gross`} onClose={() => { setGross(false); grossButton.current?.focus(); }}>
      <header><h2 id={`${id}-gross`}>{titel} · {fehler ? "Fehlerbeispiel" : "feste Ansicht"}</h2><button type="button" autoFocus className={styles.button} onClick={() => dialog.current?.close()}>Bild schließen</button></header>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {gross && <img src={hdBild ?? bild} width={1200} height={800} alt={`${titel} in großer ${fehler ? "Fehlerdarstellung" : "Renderansicht"}`} onError={e => { if (e.currentTarget.getAttribute("src") !== bild) e.currentTarget.src = bild; }}/>} 
    </dialog>
  </figure>;
}

function ViewerIcon({ art }: { art: "links" | "rechts" | "plus" | "minus" | "reset" | "play" | "pause" }) {
  const paths = { links: "M5 8a8 8 0 1 1-1 9M5 3v5h5", rechts: "M19 8a8 8 0 1 0 1 9M19 3v5h-5", plus: "M12 5v14M5 12h14", minus: "M5 12h14", reset: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5", play: "m9 5 10 7-10 7V5Z", pause: "M9 5v14M16 5v14" };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[art]}/></svg>;
}
