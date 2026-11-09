"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushStorage } from "@/lib/lernSpeicher";
import { praxisVideoClipPaket, praxisVideoDachPaket, praxisVideoMedien } from "@/lib/praxisVideoMedien";
import { ladePraxisVideoEinstellungen, ladePraxisVideoPosition, speicherePraxisVideoEinstellungen, speicherePraxisVideoPosition, subscribePraxisVideoEinstellungen } from "@/lib/praxisVideoStand";
import { ladePraxisVideoPaket, loeschePraxisVideoPaket, praxisVideoPaketStatus, subscribePraxisVideoDownloads } from "@/lib/praxisVideoDownloads";
import { getVorherigePraxisVideoFassung } from "@/lib/praxisVideoInhalte";
import { ladePraxisVideoLernStand, neuerPraxisVideoLernStand, speicherePraxisVideoLernStand, type PraxisVideoLernStand, type PraxisVideoLernModus } from "@/lib/praxisVideoLernStand";
import type { PraxisVideo, PraxisVideoLernpunkt, PraxisVideoPaket } from "@/lib/praxisVideoTypen";
import type { DachForm } from "@/lib/dach3dTypen";
import styles from "./PraxisVideoPlayer.module.css";

const zeit = (sekunden: number) => `${Math.floor(sekunden / 60)}:${String(Math.floor(sekunden % 60)).padStart(2, "0")}`;
const fehlermeldung = (error: unknown) => error instanceof Error ? error.message : "Deine Videoeinstellungen konnten nicht gespeichert werden.";
type Einstellungen = { sprecher: boolean; untertitel: boolean };

export type PraxisVideoPlayerProps = {
  video: PraxisVideo;
  onPlay?: (video: PraxisVideo) => void;
  disabled?: boolean;
  versuchId?: string;
  renderLernpunkt?: (punkt: PraxisVideoLernpunkt) => ReactNode;
  istLernpunktBearbeitet?: (punkt: PraxisVideoLernpunkt) => boolean;
  onLernpunktAktiv?: (punkt: PraxisVideoLernpunkt | null) => void;
  /** Keep the film in the same reserved space as the roof model. */
  studio?: boolean;
};

export function PraxisVideoPlayer(props: PraxisVideoPlayerProps) {
  return <PraxisVideoEdition key={props.video.id} {...props} />;
}

function PraxisVideoEdition(props: PraxisVideoPlayerProps) {
  const [alteFassung, setAlteFassung] = useState(false), [altGespeichert, setAltGespeichert] = useState(false);
  const vorher = getVorherigePraxisVideoFassung(props.video);
  useEffect(() => {
    let lebt = true;
    if (!vorher) return;
    const pruefen = () => { void praxisVideoPaketStatus(praxisVideoClipPaket(vorher)).then(status => { if (lebt) setAltGespeichert(status.status === "gespeichert"); }).catch(() => {}); };
    pruefen(); const ende = subscribePraxisVideoDownloads(pruefen);
    return () => { lebt = false; ende(); };
  }, [vorher]);
  const gewaehlt = alteFassung && vorher ? vorher : props.video;
  return <div className={styles.edition}>
    {vorher && (altGespeichert || alteFassung) && <div className={styles.editionChoice}><p>{alteFassung ? "Du siehst die gespeicherte ältere Fassung mit ihren eigenen Kapiteln und Untertiteln." : "Eine ältere Fassung ist auf diesem Gerät vollständig gespeichert."}</p><button type="button" disabled={props.disabled} onClick={() => setAlteFassung(!alteFassung)}>{alteFassung ? "Aktuelle Fassung öffnen" : "Gespeicherte ältere Fassung ansehen"}</button></div>}
    <PraxisVideoAufGeraet key={`${gewaehlt.id}:${gewaehlt.version}:${props.versuchId ?? ""}`} {...props} video={gewaehlt} aeltereWiedergabe={alteFassung && !!vorher} />
  </div>;
}

function PraxisVideoAufGeraet({ video, onPlay, disabled = false, studio = false, versuchId, renderLernpunkt, istLernpunktBearbeitet, onLernpunktAktiv, aeltereWiedergabe = false }: PraxisVideoPlayerProps & { aeltereWiedergabe?: boolean }) {
  const [anfang] = useState(() => {
    try { const gespeichert = ladePraxisVideoPosition(video.id, video.version); return { einstellungen: ladePraxisVideoEinstellungen(), position: gespeichert?.videoVersion === video.version ? gespeichert.position : 0, fehler: "" }; }
    catch (error) { return { einstellungen: { sprecher: true, untertitel: true }, position: 0, fehler: fehlermeldung(error) }; }
  });
  const kannMitmachen = !!versuchId && !!renderLernpunkt && video.version === 2 && !!video.lernpunkte?.length;
  const [lernStart] = useState(() => {
    if (!kannMitmachen) return { stand: null as PraxisVideoLernStand | null, fehler: "" };
    try { return { stand: ladePraxisVideoLernStand(versuchId!, video), fehler: "" }; }
    catch (error) { return { stand: neuerPraxisVideoLernStand(versuchId!, video), fehler: fehlermeldung(error) }; }
  });
  const [lernStand, setLernStand] = useState(lernStart.stand);
  const lernAktuell = useRef(lernStand), letzteZeit = useRef(anfang.position), sucht = useRef(false), lernTitel = useRef<HTMLHeadingElement>(null);
  const aktiverPunkt = lernStand?.modus === "mitmachen" ? video.lernpunkte?.find(p => p.id === lernStand.aktivLernpunktId) : undefined;
  useEffect(() => {
    onLernpunktAktiv?.(aktiverPunkt ?? null);
    if (aktiverPunkt) lernTitel.current?.focus();
    return () => { onLernpunktAktiv?.(null); };
    // An edition's point definitions are immutable. Depending on a freshly
    // supplied point object would repeatedly close/reopen the parent panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktiverPunkt?.id, onLernpunktAktiv]);
  const [einstellungen, setEinstellungen] = useState<Einstellungen>(anfang.einstellungen);
  const [fehler, setFehler] = useState(anfang.fehler || lernStart.fehler), [medienFehler, setMedienFehler] = useState(false);
  const [rate, setRate] = useState(1), [position, setPosition] = useState(anfang.position);
  const aktuell = useRef(einstellungen), element = useRef<HTMLVideoElement>(null), lebt = useRef(true);
  const wiederhergestellt = useRef(false), letztePosition = useRef(anfang.position), letzteSicherung = useRef(0);
  const medien = praxisVideoMedien(video);

  const sicherePosition = useCallback((film: HTMLVideoElement) => {
    if (!Number.isFinite(film.currentTime) || film.currentTime < 0) return;
    // Opening and closing an unplayed film must retain its saved position.
    if (!wiederhergestellt.current && film.readyState === 0 && film.currentTime === 0 && letztePosition.current > 0) return;
    try { speicherePraxisVideoPosition(video.id, film.currentTime, video.version); letztePosition.current = film.currentTime; }
    catch (error) { if (lebt.current) setFehler(fehlermeldung(error)); }
  }, [video.id, video.version]);
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

  function lernSpeichern(neu: PraxisVideoLernStand) {
    if (disabled) return false;
    lernAktuell.current = neu; setLernStand(neu);
    try { const gespeichert = speicherePraxisVideoLernStand(neu); lernAktuell.current = gespeichert; setLernStand(gespeichert); setFehler(""); return true; }
    catch (error) { setFehler(fehlermeldung(error)); return false; }
  }
  function modusWaehlen(modus: PraxisVideoLernModus) {
    const alt = lernAktuell.current;
    if (!alt || disabled) return;
    if (element.current) pausieren(element.current);
    lernSpeichern({ ...alt, modus, aktivLernpunktId: null });
  }
  function punktOeffnen(punkt: PraxisVideoLernpunkt, natuerlich: boolean) {
    const film = element.current, alt = lernAktuell.current;
    if (!film || !alt || disabled) return;
    film.pause();
    const zeitpunkt = video.kapitel.find(k => k.id === punkt.kapitelId)?.start;
    if (natuerlich && zeitpunkt !== undefined) { film.currentTime = zeitpunkt; letzteZeit.current = zeitpunkt; setPosition(zeitpunkt); }
    sicherePosition(film);
    lernSpeichern({ ...alt, modus: "mitmachen", aktivLernpunktId: punkt.id });
  }
  function punktSchliessen(spaeter: boolean) {
    const alt = lernAktuell.current;
    if (!alt || !aktiverPunkt || disabled) return;
    const bearbeitet = !!istLernpunktBearbeitet?.(aktiverPunkt);
    if (!spaeter && !bearbeitet) return;
    if (!lernSpeichern({ ...alt, aktivLernpunktId: null, lernpunkte: { ...alt.lernpunkte, [aktiverPunkt.id]: bearbeitet ? "bearbeitet" : "uebersprungen" } })) return;
    element.current?.focus();
    if (!spaeter && element.current) void element.current.play().catch(error => setFehler(fehlermeldung(error)));
  }
  function zeitAktualisieren(film: HTMLVideoElement) {
    const jetzt = film.currentTime, vorher = letzteZeit.current;
    letzteZeit.current = jetzt; setPosition(jetzt);
    const alt = lernAktuell.current;
    if (!disabled && !film.paused && !film.seeking && !sucht.current && alt?.modus === "mitmachen" && !alt.aktivLernpunktId) {
      const punkt = video.lernpunkte?.find(p => {
        const start = video.kapitel.find(k => k.id === p.kapitelId)?.start;
        return alt.lernpunkte[p.id] === "offen" && start !== undefined && vorher < start && jetzt >= start;
      });
      if (punkt) { punktOeffnen(punkt, true); return; }
    }
    if (Math.abs(jetzt - letzteSicherung.current) >= 5) { sicherePosition(film); letzteSicherung.current = jetzt; }
  }

  function kapitelOeffnen(start: number) {
    const film = element.current;
    if (!film || disabled) return;
    sucht.current = true; letzteZeit.current = start;
    letztePosition.current = start;
    film.currentTime = start; setPosition(start); sicherePosition(film);
  }

  return <section className={`${styles.player} ${studio ? styles.studio : ""}`} aria-label={`Lernvideo: ${video.titel}`}>
    <div className={styles.heading}><span>{video.typ === "handgriff" ? "3D-HANDGRIFF" : "3D-LERNVIDEO"}</span><strong>{video.titel}</strong><small>{zeit(video.dauer)} Minuten</small></div>
    {medien.video ? <video ref={element} className={styles.film} controls playsInline preload="none" poster={medien.poster?.url} aria-label={video.titel}
      onPlay={event => { if (disabled || document.hidden || lernAktuell.current?.aktivLernpunktId && lernAktuell.current.modus === "mitmachen") { pausieren(event.currentTarget); return; } letzteZeit.current = event.currentTarget.currentTime; onPlay?.(video); }}
      onPause={event => sicherePosition(event.currentTarget)} onEnded={event => sicherePosition(event.currentTarget)}
      onSeeking={() => { sucht.current = true; }}
      onSeeked={event => { sucht.current = false; letzteZeit.current = event.currentTarget.currentTime; setPosition(event.currentTarget.currentTime); sicherePosition(event.currentTarget); }}
      onTimeUpdate={event => zeitAktualisieren(event.currentTarget)}
      onVolumeChange={event => { const film = event.currentTarget, an = !film.muted && film.volume > 0; if (an !== aktuell.current.sprecher) speichern({ ...aktuell.current, sprecher: an }); }}
      onRateChange={event => setRate(event.currentTarget.playbackRate)}
      onLoadedMetadata={event => { setMedienFehler(false); anwenden(aktuell.current); if (!wiederhergestellt.current) { wiederhergestellt.current = true; const film = event.currentTarget; film.currentTime = letztePosition.current < film.duration ? letztePosition.current : 0; letzteZeit.current = film.currentTime; setPosition(film.currentTime); } }}
      onError={() => setMedienFehler(true)}>
      <source src={medien.video.url} type="video/mp4" onError={() => setMedienFehler(true)} />
      {medien.untertitel && <track kind="captions" label="Deutsch" srcLang="de" src={medien.untertitel.url} default={anfang.einstellungen.untertitel} onLoad={() => anwenden(aktuell.current)} />}
      Dein Browser kann diesen Film nicht abspielen. Die Kapitel und der vollständige Text stehen darunter.
    </video> : <p className={styles.unavailable}>Der Film ist auf diesem Gerät noch nicht verfügbar. Du kannst die Arbeitsschritte unten als Text lesen.</p>}
    {kannMitmachen && lernStand && <fieldset className={styles.learningModes} disabled={disabled}><legend>Wie möchtest du das Lernvideo nutzen?</legend><button type="button" aria-pressed={lernStand.modus === "anschauen"} onClick={() => modusWaehlen("anschauen")}>Anschauen</button><button type="button" aria-pressed={lernStand.modus === "mitmachen"} onClick={() => modusWaehlen("mitmachen")}>Mitmachen</button><p>Im Mitmachmodus hält der Film an einer Aufgabe an. Deine Antworten gehören zu diesem Werkstattversuch.</p></fieldset>}
    {kannMitmachen && lernStand?.modus === "mitmachen" && !aktiverPunkt && video.lernpunkte?.filter(p => lernStand.lernpunkte[p.id] !== "bearbeitet" && position >= (video.kapitel.find(k => k.id === p.kapitelId)?.start ?? Infinity)).map(p => <button className={styles.catchUp} type="button" key={p.id} disabled={disabled} onClick={() => punktOeffnen(p, false)}>Aufgabe nachholen</button>)}
    {aktiverPunkt && <section className={styles.checkpoint} aria-label="Mitmachaufgabe im Lernvideo"><h3 tabIndex={-1} ref={lernTitel}>Jetzt selbst ausprobieren</h3>{renderLernpunkt?.(aktiverPunkt)}<div className={styles.checkpointActions}><button type="button" disabled={disabled || !istLernpunktBearbeitet?.(aktiverPunkt)} onClick={() => punktSchliessen(false)}>Film fortsetzen</button><button type="button" disabled={disabled} onClick={() => punktSchliessen(true)}>Später üben</button></div></section>}
    {medienFehler && <p role="status" className={styles.unavailable}>Der Film kann gerade nicht geladen werden. Prüfe deine Verbindung oder das gespeicherte Videopaket. Der vollständige Text bleibt erreichbar.</p>}
    <fieldset className={styles.settings} disabled={disabled}><legend>Ton und Untertitel getrennt einstellen</legend>
      <button type="button" aria-pressed={einstellungen.sprecher} onClick={() => { const neu = { ...aktuell.current, sprecher: !aktuell.current.sprecher }; anwenden(neu); speichern(neu); }}>Sprecher: {einstellungen.sprecher ? "An" : "Aus"}</button>
      <button type="button" aria-pressed={einstellungen.untertitel} onClick={() => { const neu = { ...aktuell.current, untertitel: !aktuell.current.untertitel }; anwenden(neu); speichern(neu); }}>Untertitel: {einstellungen.untertitel ? "An" : "Aus"}</button>
      <label>Tempo<select value={rate} disabled={!medien.video} onChange={event => { if (element.current) element.current.playbackRate = Number(event.target.value); setRate(Number(event.target.value)); }}>{[.5, .75, 1, 1.25].map(wert => <option key={wert} value={wert}>{String(wert).replace(".", ",")}×</option>)}</select></label>
    </fieldset>
    {fehler && <p role="alert" className={styles.error}>{fehler}</p>}
    {!aeltereWiedergabe && medien.assets.length === 3 && <PraxisVideoPaketDownload paket={praxisVideoClipPaket(video)} />}
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
