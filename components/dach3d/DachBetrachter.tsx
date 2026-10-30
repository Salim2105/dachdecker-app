"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { dachMedien } from "@/lib/dach3dMedien";
import { getDachDetail, getDachModell } from "@/lib/dach3dInhalte";
import type { DachAnsicht, DachDeckung, DachForm, DachPhase, DachPosition } from "@/lib/dach3dTypen";
import type { DachOrbit } from "./dach3dScene";
import styles from "./DachBetrachter.module.css";

const DachCanvas = dynamic(() => import("./DachCanvas"), { ssr: false, loading: () => <div className={styles.loading}>3D-Betrachter wird geladen …</div> });
export type DachBefehl = "links" | "rechts" | "oben" | "unten" | "naeher" | "weiter" | "reset";
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
  const url = medien.modell?.url ?? "";
  const bild = fehler && detailId ? medien.fehlerBild : detailId ? medien.bilder[ansicht] : medien.preview;
  const hdBild = fehler && detailId ? medien.hdFehlerBild : detailId ? medien.hdBilder[ansicht] : undefined;
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

  function kommando(art: DachBefehl) {
    setBefehl(v => ({ art, nummer: v.nummer + 1 }));
    if (art === "reset") onKamera?.(detailId ? "nah" : "gesamt");
  }
  function tastatur(e: KeyboardEvent<HTMLDivElement>) {
    if (!dreid || e.target !== e.currentTarget) return;
    const key: Record<string, DachBefehl> = { ArrowLeft: "links", ArrowRight: "rechts", ArrowUp: "oben", ArrowDown: "unten", "+": "naeher", "=": "naeher", "-": "weiter", Home: "reset" };
    if (key[e.key]) { e.preventDefault(); kommando(key[e.key]); }
  }
  function erneut() { setModellFehler(null); setBereitUrl(""); setVersuch(v => v + 1); setFesteAnsicht(false); }
  function vergroessern() { setGross(true); dialog.current?.showModal(); }
  const statustext = fehler ? "Fehlerbeispiel · feste Renderansicht" : pruefmodus ? "Aufgabenansicht ohne Lösungsmarkierungen" : festeAnsicht ? "Feste Ansicht aus demselben Lehrmodell" : fehlerText ? "3D konnte nicht geöffnet werden. Die feste Ansicht und deine Eingaben bleiben verfügbar." : webgl === false ? "Auf diesem Gerät ist 3D gerade nicht verfügbar. Du kannst mit denselben festen Ansichten weiterlernen." : !url ? "Feste Ansicht · das Modell ist derzeit nicht verfügbar." : !bereit ? "3D-Modell wird geladen …" : leereUrl === url ? "Für diesen Schritt sind alle Bauteile ausgeblendet. Blende eine Schicht ein oder wähle den nächsten Montageschritt." : "";

  return <figure className={styles.figure} data-dach-betrachter data-status={bereit ? "3d-bereit" : dreid ? "3d-laedt" : "feste-ansicht"} data-modell-url={url}>
    <header className={styles.header}><strong>{titel}</strong><span className={styles.badge}>{bereit ? "Drehbares 3D-Lehrmodell" : "Lehrmodell · feste Ansicht"}</span></header>
    <div className={styles.viewport} role="region" aria-label={`Dachansicht: ${titel}`} aria-describedby={`${id}-hilfe`} tabIndex={dreid ? 0 : undefined} onKeyDown={tastatur}>
      {/* These images are own same-scene renders; their aspect ratio must remain visible. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.poster} src={bild} width={960} height={640} alt={`${fehler ? "Fehlerbeispiel" : "Lehrmodell"}: ${titel}, ${ansicht === "nah" ? "Nahansicht" : ansicht === "schnitt" ? "Schnitt" : "auseinandergezogener Aufbau"}. ${detail?.funktion && !pruefmodus ? detail.funktion : "Bauteile ohne Lösungsmarkierungen betrachten."}`} aria-hidden={bereit || undefined} onError={() => setBildFehler(bild)}/>
      {dreid && <div className={styles.canvasLayer}><ModellGrenze key={`${url}:${versuch}`} onError={text => setModellFehler({ url, text })}>
        <DachCanvas url={url} detailId={detailId} ansicht={ansicht} phase={phase} schritt={schritt} schichten={schichten} kamera={kamera} wasser={wasser} reduziert={reduzierteBewegung} erlaubt={erlaubt} resetSignal={resetSignal} befehl={befehl} orbit={orbit} onOrbit={onOrbit} onDetail={onDetail} onBereit={() => setBereitUrl(`${url}:${versuch}`)} onLeer={leer => setLeereUrl(leer ? url : "")} onFehler={text => setModellFehler({ url, text })}/>
      </ModellGrenze></div>}
      {(statustext || bildFehler === bild) && <div className={styles.status} role="status">{bildFehler === bild ? "Die feste Ansicht konnte nicht geladen werden. Öffne das Dachpaket erneut; deine Antworten bleiben erhalten." : statustext}{fehlerText && <button type="button" onClick={erneut}>3D erneut versuchen</button>}</div>}
    </div>
    <div className={styles.toolbar} role="group" aria-label="Darstellung des Dachmodells">
      {!pruefmodus && !fehler && <><button type="button" className={styles.button} aria-pressed={!festeAnsicht} disabled={webgl === false || !url} onClick={erneut}>3D ansehen</button><button type="button" className={styles.button} aria-pressed={festeAnsicht} onClick={() => setFesteAnsicht(true)}>Feste Ansicht</button></>}
      {dreid && <><button type="button" className={styles.button} aria-label="Dach nach links drehen" onClick={() => kommando("links")}>↶</button><button type="button" className={styles.button} aria-label="Dach nach rechts drehen" onClick={() => kommando("rechts")}>↷</button><button type="button" className={styles.button} aria-label="Dachansicht vergrößern" onClick={() => kommando("naeher")}>＋</button><button type="button" className={styles.button} aria-label="Dachansicht verkleinern" onClick={() => kommando("weiter")}>−</button><button type="button" className={styles.button} onClick={() => kommando("reset")}>Ansicht zurücksetzen</button></>}
      <button ref={grossButton} type="button" className={styles.button} onClick={vergroessern}>Bild groß ansehen</button>
    </div>
    <p id={`${id}-hilfe`} className={styles.help}>{dreid ? "Drehen durch Ziehen; Zoomen mit zwei Fingern oder dem Mausrad. Mit fokussierter Dachansicht: Pfeiltasten drehen, +/− zoomen, Pos1 setzt die Ansicht zurück. Die beschriftete Bauteilauswahl bleibt zusätzlich erreichbar." : "Die festen Ansichten stammen aus demselben 3D-Modell. Auswahl, Erklärungen und Aufgaben bleiben ohne 3D bedienbar."}</p>
    <figcaption className={styles.caption}>Eigenes Lehrmodell · {modell?.titel ?? form} · {deckung === "biber-doppel" ? "Biberschwanz-Doppeldeckung" : deckung === "warmdach" ? "Warmdach-Beispiel" : "Falzziegel"}. {fehler ? "Dargestellte Abweichung bewusst als Fehlerbeispiel angelegt." : "Aufbau und Maße gehören zum beschriebenen Beispiel."}</figcaption>
    {wasser > 0 && !pruefmodus && <p className={styles.waterNote}>Wasserweg: erklärende Darstellung am Modell; die Schritte zeigen den Verlauf ohne hydraulische Berechnung.</p>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-gross`} onClose={() => { setGross(false); grossButton.current?.focus(); }}>
      <header><h2 id={`${id}-gross`}>{titel} · {fehler ? "Fehlerbeispiel" : "feste Ansicht"}</h2><button type="button" autoFocus className={styles.button} onClick={() => dialog.current?.close()}>Bild schließen</button></header>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {gross && <img src={hdBild ?? bild} width={1200} height={800} alt={`${titel} in großer ${fehler ? "Fehlerdarstellung" : "Renderansicht"}`} onError={e => { if (e.currentTarget.getAttribute("src") !== bild) e.currentTarget.src = bild; }}/>} 
    </dialog>
  </figure>;
}
