"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushStorage } from "@/lib/lernSpeicher";
import { praxisVideoClipPaket, praxisVideoDachPaket, praxisVideoMedien } from "@/lib/praxisVideoMedien";
import { ladePraxisVideoEinstellungen, ladePraxisVideoPosition, speicherePraxisVideoEinstellungen, speicherePraxisVideoPosition, subscribePraxisVideoEinstellungen } from "@/lib/praxisVideoStand";
import { ladePraxisVideoPaket, loeschePraxisVideoPaket, praxisVideoPaketStatus, subscribePraxisVideoDownloads } from "@/lib/praxisVideoDownloads";
import type { PraxisVideo, PraxisVideoPaket } from "@/lib/praxisVideoTypen";
import type { DachForm } from "@/lib/dach3dTypen";
import styles from "./PraxisVideoPlayer.module.css";

const zeit = (sekunden: number) => `${Math.floor(sekunden / 60)}:${String(Math.floor(sekunden % 60)).padStart(2, "0")}`;
const fehlermeldung = (error: unknown) => error instanceof Error ? error.message : "Deine Videoeinstellungen konnten nicht gespeichert werden.";
type Einstellungen = { sprecher: boolean; untertitel: boolean };

export type PraxisVideoPlayerProps = {
  video: PraxisVideo;
  onPlay?: (video: PraxisVideo) => void;
  disabled?: boolean;
  /** Keep the film in the same reserved space as the roof model. */
  studio?: boolean;
};

export function PraxisVideoPlayer(props: PraxisVideoPlayerProps) {
  return <PraxisVideoAufGeraet key={`${props.video.id}:${props.video.version}`} {...props} />;
}

function PraxisVideoAufGeraet({ video, onPlay, disabled = false, studio = false }: PraxisVideoPlayerProps) {
  const [anfang] = useState(() => {
    try { const gespeichert = ladePraxisVideoPosition(video.id); return { einstellungen: ladePraxisVideoEinstellungen(), position: gespeichert?.videoVersion === video.version ? gespeichert.position : 0, fehler: "" }; }
    catch (error) { return { einstellungen: { sprecher: true, untertitel: true }, position: 0, fehler: fehlermeldung(error) }; }
  });
  const [einstellungen, setEinstellungen] = useState<Einstellungen>(anfang.einstellungen);
  const [fehler, setFehler] = useState(anfang.fehler), [medienFehler, setMedienFehler] = useState(false);
  const [rate, setRate] = useState(1), [position, setPosition] = useState(anfang.position);
  const aktuell = useRef(einstellungen), element = useRef<HTMLVideoElement>(null), lebt = useRef(true);
  const wiederhergestellt = useRef(false), letztePosition = useRef(anfang.position), letzteSicherung = useRef(0);
  const medien = praxisVideoMedien(video);

  const sicherePosition = useCallback((film: HTMLVideoElement) => {
    if (!Number.isFinite(film.currentTime) || film.currentTime < 0) return;
    // Opening and closing an unplayed film must retain its saved position.
    if (!wiederhergestellt.current && film.readyState === 0 && film.currentTime === 0 && letztePosition.current > 0) return;
    try { speicherePraxisVideoPosition(video.id, film.currentTime); letztePosition.current = film.currentTime; }
    catch (error) { if (lebt.current) setFehler(fehlermeldung(error)); }
  }, [video.id]);
  const pausieren = useCallback((film: HTMLVideoElement) => {
    film.pause(); sicherePosition(film);
  }, [sicherePosition]);
  const speichern = useCallback((neu: Einstellungen) => {
    aktuell.current = neu; setEinstellungen(neu);
    try {
      speicherePraxisVideoEinstellungen(neu); setFehler("");
    } catch (error) { setFehler(fehlermeldung(error)); }
  }, []);
  const anwenden = useCallback((neu: Einstellungen) => {
    const film = element.current;
    if (!film) return;
    if (film.muted === neu.sprecher) film.muted = !neu.sprecher;
    if (neu.sprecher && film.volume === 0) film.volume = 1;
    for (const track of Array.from(film.textTracks ?? [])) {
      if (track.kind === "captions" || track.kind === "subtitles") track.mode = neu.untertitel ? "showing" : "disabled";
    }
  }, []);

  useEffect(() => { anwenden(einstellungen); }, [anwenden, einstellungen]);
  useEffect(() => {
    lebt.current = true;
    const film = element.current;
    const anhalten = () => { if (film) { pausieren(film); void flushStorage().catch(error => { if (lebt.current) setFehler(fehlermeldung(error)); }); } };
    const verborgen = () => { if (document.hidden) anhalten(); };
    const link = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const ziel = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (ziel && !ziel.hasAttribute("download") && ziel.getAttribute("target") !== "_blank") anhalten();
    };
    const synchronisieren = () => {
      try { const neu = ladePraxisVideoEinstellungen(); aktuell.current = neu; setEinstellungen(neu); anwenden(neu); }
      catch (error) { setFehler(fehlermeldung(error)); }
    };
    const untertitelAendern = () => {
      if (!film) return;
      const tracks = Array.from(film.textTracks ?? []).filter(track => track.kind === "captions" || track.kind === "subtitles");
      if (!tracks.length) return;
      const an = tracks.some(track => track.mode === "showing");
      if (an !== aktuell.current.untertitel) speichern({ ...aktuell.current, untertitel: an });
    };
    film?.textTracks?.addEventListener?.("change", untertitelAendern);
    document.addEventListener("visibilitychange", verborgen);
    document.addEventListener("click", link, true);
    window.addEventListener("pagehide", anhalten);
    window.addEventListener("beforeunload", anhalten);
    window.addEventListener("hashchange", anhalten);
    window.addEventListener("popstate", anhalten);
    const endeEinstellungen = subscribePraxisVideoEinstellungen(synchronisieren);
    window.addEventListener("storage", synchronisieren);
    return () => {
      lebt.current = false;
      if (film) { pausieren(film); void flushStorage().catch(() => {}); }
      film?.textTracks?.removeEventListener?.("change", untertitelAendern);
      document.removeEventListener("visibilitychange", verborgen);
      document.removeEventListener("click", link, true);
      window.removeEventListener("pagehide", anhalten);
      window.removeEventListener("beforeunload", anhalten);
      window.removeEventListener("hashchange", anhalten);
      window.removeEventListener("popstate", anhalten);
      endeEinstellungen();
      window.removeEventListener("storage", synchronisieren);
    };
  }, [anwenden, pausieren, speichern]);
  useEffect(() => { if (disabled && element.current) pausieren(element.current); }, [disabled, pausieren]);

  function kapitelOeffnen(start: number) {
    const film = element.current;
    if (!film || disabled) return;
    letztePosition.current = start;
    film.currentTime = start; setPosition(start); sicherePosition(film);
  }

  return <section className={`${styles.player} ${studio ? styles.studio : ""}`} aria-label={`Lernvideo: ${video.titel}`}>
    <div className={styles.heading}><span>{video.typ === "handgriff" ? "3D-HANDGRIFF" : "3D-LERNVIDEO"}</span><strong>{video.titel}</strong><small>{zeit(video.dauer)} Minuten</small></div>
    {medien.video ? <video ref={element} className={styles.film} controls playsInline preload="none" poster={medien.poster?.url} aria-label={video.titel}
      onPlay={event => { if (disabled || document.hidden) { pausieren(event.currentTarget); return; } onPlay?.(video); }}
      onPause={event => sicherePosition(event.currentTarget)} onEnded={event => sicherePosition(event.currentTarget)}
      onSeeked={event => { setPosition(event.currentTarget.currentTime); sicherePosition(event.currentTarget); }}
      onTimeUpdate={event => { const film = event.currentTarget; setPosition(film.currentTime); if (Math.abs(film.currentTime - letzteSicherung.current) >= 5) { sicherePosition(film); letzteSicherung.current = film.currentTime; } }}
      onVolumeChange={event => { const film = event.currentTarget, an = !film.muted && film.volume > 0; if (an !== aktuell.current.sprecher) speichern({ ...aktuell.current, sprecher: an }); }}
      onRateChange={event => setRate(event.currentTarget.playbackRate)}
      onLoadedMetadata={event => { anwenden(aktuell.current); if (!wiederhergestellt.current) { wiederhergestellt.current = true; const film = event.currentTarget; film.currentTime = letztePosition.current < film.duration ? letztePosition.current : 0; setPosition(film.currentTime); } }}
      onError={() => setMedienFehler(true)}>
      <source src={medien.video.url} type="video/mp4" onError={() => setMedienFehler(true)} />
      {medien.untertitel && <track kind="captions" label="Deutsch" srcLang="de" src={medien.untertitel.url} default={anfang.einstellungen.untertitel} onLoad={() => anwenden(aktuell.current)} />}
      Dein Browser kann diesen Film nicht abspielen. Die Kapitel und der vollständige Text stehen darunter.
    </video> : <p className={styles.unavailable}>Der Film ist auf diesem Gerät noch nicht verfügbar. Du kannst die Arbeitsschritte unten als Text lesen.</p>}
    {medienFehler && <p role="status" className={styles.unavailable}>Der Film kann gerade nicht geladen werden. Prüfe deine Verbindung oder das gespeicherte Videopaket. Der vollständige Text bleibt erreichbar.</p>}
    <fieldset className={styles.settings} disabled={disabled}><legend>Ton und Untertitel getrennt einstellen</legend>
      <button type="button" aria-pressed={einstellungen.sprecher} onClick={() => { const neu = { ...aktuell.current, sprecher: !aktuell.current.sprecher }; anwenden(neu); speichern(neu); }}>Sprecher: {einstellungen.sprecher ? "An" : "Aus"}</button>
      <button type="button" aria-pressed={einstellungen.untertitel} onClick={() => { const neu = { ...aktuell.current, untertitel: !aktuell.current.untertitel }; anwenden(neu); speichern(neu); }}>Untertitel: {einstellungen.untertitel ? "An" : "Aus"}</button>
      <label>Tempo<select value={rate} disabled={!medien.video} onChange={event => { if (element.current) element.current.playbackRate = Number(event.target.value); setRate(Number(event.target.value)); }}>{[.5, .75, 1, 1.25].map(wert => <option key={wert} value={wert}>{String(wert).replace(".", ",")}×</option>)}</select></label>
    </fieldset>
    {fehler && <p role="alert" className={styles.error}>{fehler}</p>}
    {medien.assets.length === 3 && <PraxisVideoPaketDownload paket={praxisVideoClipPaket(video)} />}
    <details className={styles.text}><summary>Kapitel und vollständigen Text öffnen</summary><ol className={styles.chapters}>{video.kapitel.map(kapitel => <li key={kapitel.id} aria-current={position >= kapitel.start && position < kapitel.ende ? "step" : undefined}><button type="button" disabled={disabled || !medien.video} onClick={() => kapitelOeffnen(kapitel.start)}><span>{zeit(kapitel.start)}</span> {kapitel.titel}</button><p>{kapitel.text}</p></li>)}</ol><h3>Vollständiger Sprechertext</h3><p className={styles.transcript}>{video.transkript}</p></details>
  </section>;
}

const groesse = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;

function PraxisVideoPaketDownload({ paket }: { paket: PraxisVideoPaket }) {
  const [status, setStatus] = useState("fehlt"), [aktion, setAktion] = useState<"laden" | "loeschen" | null>(null), [fehler, setFehler] = useState("");
  const [speicherHinweis, setSpeicherHinweis] = useState("");
  const [fortschritt, setFortschritt] = useState({ geladen: 0, gesamt: paket.bytes, dateien: 0, gesamtDateien: paket.assets.length });
  const controller = useRef<AbortController | null>(null), lebt = useRef(true), laeuft = useRef(false);
  useEffect(() => {
    lebt.current = true;
    const aktualisieren = () => { void praxisVideoPaketStatus(paket).then(wert => { if (lebt.current) setStatus(wert.status); }).catch(() => { /* A user-initiated download explains unsupported storage. */ }); };
    aktualisieren(); const ende = subscribePraxisVideoDownloads(aktualisieren);
    return () => { lebt.current = false; controller.current?.abort(); ende(); };
    // The package is fixed for this clip/version or roof form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paket.id]);
  async function laden() {
    if (laeuft.current) return;
    laeuft.current = true; setAktion("laden"); setFehler(""); setSpeicherHinweis("");
    setFortschritt({ geladen: 0, gesamt: paket.bytes, dateien: 0, gesamtDateien: paket.assets.length });
    const abort = new AbortController(); controller.current = abort;
    try {
      await ladePraxisVideoPaket(paket, { signal: abort.signal, onProgress: wert => { if (lebt.current) setFortschritt(wert); } });
      if (lebt.current) setStatus("gespeichert");
    } catch (error) { if (lebt.current) setFehler(abort.signal.aborted ? "Download angehalten. Ein vorher gespeichertes Paket bleibt erhalten." : fehlermeldung(error)); }
    finally { controller.current = null; laeuft.current = false; if (lebt.current) setAktion(null); }
  }
  async function loeschen() {
    if (laeuft.current) return;
    laeuft.current = true; setAktion("loeschen"); setFehler(""); setSpeicherHinweis("");
    try {
      const ergebnis = await loeschePraxisVideoPaket(paket);
      if (lebt.current) {
        setStatus("fehlt");
        if (!ergebnis.speicherFreigegeben) setSpeicherHinweis("Paket entfernt. Videodaten bleiben vorerst im Gerätespeicher, damit ein Download in einem anderen Fenster weiterlaufen kann.");
      }
    }
    catch (error) { if (lebt.current) setFehler(fehlermeldung(error)); }
    finally { laeuft.current = false; if (lebt.current) setAktion(null); }
  }
  return <div className={styles.download}>
    <p>{status === "gespeichert" ? "Auf diesem Gerät offline gespeichert" : status === "aelter" ? "Ältere Fassung gespeichert · neue Fassung verfügbar" : "Für unterwegs auf diesem Gerät speichern"} · {groesse(paket.bytes)}</p>
    {aktion === "laden" ? <><progress value={fortschritt.geladen} max={Math.max(1, fortschritt.gesamt)} aria-label="Fortschritt des Videodownloads" /><span role="status">{fortschritt.dateien} von {fortschritt.gesamtDateien} Dateien · {groesse(fortschritt.geladen)}</span><button type="button" onClick={() => controller.current?.abort()}>Download anhalten</button></> : aktion === "loeschen" ? <span role="status">Videopaket wird entfernt …</span> : <><button type="button" onClick={() => void laden()}>{status === "gespeichert" ? "Videopaket erneut speichern" : status === "aelter" ? "Videopaket aktualisieren" : "Video offline speichern"}</button>{status !== "fehlt" && <button type="button" onClick={() => void loeschen()}>Offline-Videopaket löschen</button>}</>}
    {fehler && <p role="alert">{fehler}</p>}
    {speicherHinweis && <p role="status">{speicherHinweis}</p>}
  </div>;
}

/** Deliberately separate from the small model packages and private learner backups. */
export function PraxisVideoDachDownloads() {
  const pakete = (["steildach", "walmdach", "flachdach"] as DachForm[]).map(praxisVideoDachPaket).filter(paket => paket.assets.length > 0);
  if (!pakete.length) return null;
  return <div className={styles.roofDownloads}><p>Wähle die Lernvideos einer Dachform. Der angezeigte Download enthält Film, Untertitel und Vorschaubild; er startet erst mit deiner Auswahl.</p>{pakete.map(paket => <section key={paket.id}><h3>{paket.titel}</h3><PraxisVideoPaketDownload paket={paket} /></section>)}</div>;
}
