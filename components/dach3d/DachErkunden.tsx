"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LernLink } from "@/components/LernLink";
import { useBearbeitungsSperre } from "@/components/useBearbeitungsSperre";
import { appStorage, flushStorage } from "@/lib/lernSpeicher";
import { registrierePruefungsHilfen } from "@/lib/pruefungsHilfen";
import { DACH_MODELLE, dachDetailsFuer, getDachDetail, getDachModell } from "@/lib/dach3dInhalte";
import { dachAntwort, dachHilfe, ladeDachStand, neuerDachStand, pruefeDachAufgabe, speichereDachStand } from "@/lib/dach3dStand";
import { dachPakete } from "@/lib/dach3dMedien";
import { dachPaketStatus, ladeDachPaket, loescheDachPaket, subscribeDachDownloads } from "@/lib/dach3dDownloads";
import { syncDachNachweise } from "@/lib/dach3dNachweise";
import type { DachAnsicht, DachDeckung, DachErkundungStand, DachForm, DachGruppe, DachPhase, DachPosition } from "@/lib/dach3dTypen";
import { DachBetrachter } from "./DachBetrachter";
import { DachBild } from "./DachBild";
import styles from "./DachErkunden.module.css";

const subscribe = () => () => {};
const ready = () => true;
const notReady = () => false;
const fail = (error: unknown) => error instanceof Error ? error.message : "Deine Eingaben sind noch nicht dauerhaft gespeichert. Lass die Aufgabe geöffnet und sichere deinen Stand.";
const gruppen: { id: DachGruppe; label: string }[] = [
  { id: "dachraender", label: "Dachflächen & Ränder" }, { id: "oeffnungen", label: "Öffnungen & Anschlüsse" },
  { id: "aufbau", label: "Aufbau & Schichten" }, { id: "entwaesserung", label: "Entwässerung" }, { id: "ausstattung", label: "Dachausstattung" },
];
const phasen: { id: DachPhase; label: string }[] = [
  { id: "erkennen", label: "1. Erkennen" }, { id: "aufbau", label: "2. Aufbau" },
  { id: "montage", label: "3. Montage" }, { id: "kontrolle", label: "4. Kontrollieren" }, { id: "aufgaben", label: "5. Selbst prüfen" },
];
const ansichten: { id: DachAnsicht; label: string }[] = [{ id: "nah", label: "Nahansicht" }, { id: "schnitt", label: "Schnitt" }, { id: "aufbau", label: "Auseinanderziehen" }];
const schichten = [{ id: "deckung", label: "Deckung / Abdichtung" }, { id: "lattung", label: "Lattung" }, { id: "zusatzebene", label: "Zusätzliche Schutzebene" }, { id: "daemmung", label: "Dämmung" }, { id: "luftdichtheit", label: "Luftdichtheit / Dampfbremse" }, { id: "tragwerk", label: "Tragwerk / Tragschale" }];
const deckungTitel: Record<DachDeckung, string> = { falzziegel: "Falzziegel", "biber-doppel": "Biber-Doppeldeckung", warmdach: "Warmdach" };
const dateiGroesse = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
const route = (form: DachForm, detailId?: string | null, deckung?: DachDeckung) => `/projekte${deckung ? `?deckung=${deckung}` : ""}#dach-${form}${detailId ? `-${detailId}` : ""}`;

export function DachErkunden({ form, detailId, deckung }: { form?: DachForm; detailId?: string; deckung?: DachDeckung }) {
  return useSyncExternalStore(subscribe, ready, notReady) ? <DachAufGeraet form={form} detailId={detailId} deckung={deckung} /> : <p>Dein 3D-Dach wird geöffnet …</p>;
}

function DachAufGeraet({ form: routeForm, detailId: routeDetail, deckung: routeDeckung }: { form?: DachForm; detailId?: string; deckung?: DachDeckung }) {
  const [anfang] = useState(() => {
    try {
      let stand = ladeDachStand() ?? neuerDachStand();
      if (routeForm && getDachModell(routeForm)) {
        const detail = routeDetail ? getDachDetail(routeDetail) : undefined;
        const p = stand.jeDach[routeForm];
        const target = routeDetail && detail?.formen.includes(routeForm) ? routeDetail : null;
        const deckung = routeDeckung && getDachModell(routeForm)!.deckungen.includes(routeDeckung) ? routeDeckung : p.deckung;
        const ziel = { ...p, deckung, detailId: target, ...(p.detailId !== target ? { phase: p.modus === "probelauf" ? "aufgaben" as const : "erkennen" as const, schritt: 0, kamera: target ? "nah" as const : "gesamt" as const, orbit: undefined } : {}) };
        stand = { ...stand, revision: stand.revision + 1, aktualisiertAm: Math.max(stand.aktualisiertAm, Date.now()), form: routeForm,
          jeDach: { ...stand.jeDach, [routeForm]: ziel } };
      }
      return { stand, fehler: "" };
    } catch (e) { return { stand: null, fehler: fail(e) }; }
  });
  const [stand, setStand] = useState(anfang.stand), aktuell = useRef(stand);
  const [fehler, setFehler] = useState(anfang.fehler), [gruppe, setGruppe] = useState<DachGruppe>(() => getDachDetail(anfang.stand?.jeDach[anfang.stand.form].detailId ?? "")?.gruppe ?? "dachraender"), [suche, setSuche] = useState("");
  const [spielen, setSpielen] = useState(false), [reduziert, setReduziert] = useState(false), [fehlerBild, setFehlerBild] = useState(false), [kameraReset, setKameraReset] = useState(0), [hinweisOffen, setHinweisOffen] = useState(false);
  const navigationLaeuft = useRef(false);
  const [navigationBusy, setNavigationBusy] = useState(false);
  const [auswahlOffen, setAuswahlOffen] = useState(() => !anfang.stand?.jeDach[anfang.stand.form].detailId);
  const ansichtenMenue = useRef<HTMLDetailsElement>(null);
  const routeKey = `${routeForm ?? ""}:${routeDetail ?? ""}:${routeDeckung ?? ""}`;
  const angewendetesZiel = useRef(routeKey);
  const letzteExposition = useRef("");
  const sperre = useBearbeitungsSperre("dachdecker-dach3d-bearbeitung");
  const editierbar = (sperre.status === "frei" || sperre.status === "nicht-verfuegbar") && !navigationBusy;
  const speichern = useCallback((neu: DachErkundungStand) => {
    if (!editierbar) return false;
    aktuell.current = neu; setStand(neu);
    try { speichereDachStand(neu); syncDachNachweise(neu); setFehler(""); return true; }
    catch (e) { setFehler(fail(e)); return false; }
  }, [editierbar]);
  const patch = (wert: Partial<DachErkundungStand>, basis = aktuell.current!) => ({ ...basis, ...wert, revision: basis.revision + 1, aktualisiertAm: Math.max(Date.now(), basis.aktualisiertAm) });
  const position = (wert: Partial<DachPosition>, basis = aktuell.current!) => patch({ jeDach: { ...basis.jeDach, [basis.form]: { ...basis.jeDach[basis.form], ...wert } } }, basis);

  useEffect(() => {
    const ausserhalb = (event: PointerEvent) => {
      const menue = ansichtenMenue.current;
      if (menue?.open && event.target instanceof Node && !menue.contains(event.target)) menue.open = false;
    };
    const schliessen = (event: KeyboardEvent) => {
      const menue = ansichtenMenue.current;
      if (event.key !== "Escape" || !menue?.open) return;
      event.preventDefault(); menue.open = false;
      menue.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", ausserhalb);
    document.addEventListener("keydown", schliessen);
    return () => { document.removeEventListener("pointerdown", ausserhalb); document.removeEventListener("keydown", schliessen); };
  }, []);

  useEffect(() => {
    if (!editierbar || !aktuell.current) return;
    try { speichereDachStand(aktuell.current); syncDachNachweise(aktuell.current); }
    catch (e) { queueMicrotask(() => setFehler(fail(e))); }
  }, [anfang, editierbar]);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wechseln = () => { setReduziert(mq.matches); if (mq.matches) setSpielen(false); };
    wechseln(); mq.addEventListener("change", wechseln);
    const versteckt = () => { if (document.hidden) setSpielen(false); };
    document.addEventListener("visibilitychange", versteckt);
    return () => { mq.removeEventListener("change", wechseln); document.removeEventListener("visibilitychange", versteckt); };
  }, []);
  useEffect(() => {
    if (!editierbar || !routeForm || !aktuell.current || angewendetesZiel.current === routeKey) return;
    const s = aktuell.current, p = s.jeDach[routeForm], d = routeDetail ? getDachDetail(routeDetail) : undefined;
    if (routeDetail && !d?.formen.includes(routeForm)) return;
    const id = routeDetail ?? null;
    const deckung = routeDeckung && getDachModell(routeForm)!.deckungen.includes(routeDeckung) ? routeDeckung : p.deckung;
    angewendetesZiel.current = routeKey;
    if (s.form === routeForm && p.detailId === id && p.deckung === deckung) return;
    setSpielen(false); setHinweisOffen(false); setFehlerBild(false);
    setGruppe(d?.gruppe ?? "dachraender"); setSuche(""); setAuswahlOffen(!id);
    speichern(patch({ form: routeForm, jeDach: { ...s.jeDach, [routeForm]: { ...p, deckung, detailId: id, ...(p.detailId !== id ? { phase: p.modus === "probelauf" ? "aufgaben" as const : "erkennen" as const, schritt: 0, kamera: id ? "nah" as const : "gesamt" as const, orbit: undefined } : {}) } } }, s));
    // Only an actual browser-route change applies these initial targets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeForm, routeDetail, routeDeckung, routeKey, editierbar]);

  const p = stand?.jeDach[stand.form], detail = p?.detailId ? getDachDetail(p.detailId) : undefined;
  useEffect(() => {
    const s = aktuell.current;
    if (!editierbar || !s) return;
    const p = s.jeDach[s.form], d = p.detailId ? getDachDetail(p.detailId) : undefined;
    if (!d) return;
    const exposition = `${s.form}:${p.deckung}:${d.id}:${p.phase}:${p.schritt}`;
    // A save/navigation lock toggling off and on is no new explanation exposure.
    // In particular it must not dismiss a failed navigation's storage warning.
    if (letzteExposition.current === exposition) return;
    letzteExposition.current = exposition;
    if (p.phase !== "aufgaben") {
      speichern(dachHilfe(s, d.id, `${p.phase}:${p.schritt}`));
    } else {
      const neu = { ...s.antworten };
      let fehlt = false;
      for (const a of d.aufgaben) if (!neu[a.id]) { neu[a.id] = dachAntwort(s, a); fehlt = true; }
      if (fehlt) speichern(patch({ antworten: neu }, s));
    }
    // This effect records exposure once per displayed phase/step, not per write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editierbar, detail?.id, p?.phase, p?.schritt]);
  useEffect(() => {
    const versuchId = aktuell.current?.id;
    if (!editierbar || !versuchId) return;
    const ende = registrierePruefungsHilfen(versuchId);
    const listener = (event: Event) => {
      const d = (event as CustomEvent<{ art?: unknown; versuchId?: unknown }>).detail, s = aktuell.current;
      if (!s || d?.versuchId !== s.id || typeof d.art !== "string" || !d.art || d.art.length > 120 || d.art === "taschenrechner" || d.art === "werkzeug:taschenrechner") return;
      const id = s.jeDach[s.form].detailId;
      if (id) speichern(dachHilfe(s, id, d.art));
    };
    window.addEventListener("dachdecker:pruefung-hilfe", listener);
    if (document.querySelector('#werkzeug-panel:not([hidden])[data-werkzeug="glossar"]') && aktuell.current?.jeDach[aktuell.current.form].detailId) speichern(dachHilfe(aktuell.current, aktuell.current.jeDach[aktuell.current.form].detailId!, "glossar"));
    return () => { ende(); window.removeEventListener("dachdecker:pruefung-hilfe", listener); };
  }, [editierbar, stand?.id, detail?.id, speichern]);
  useEffect(() => {
    if (!spielen || reduziert || !editierbar || !detail || p?.phase !== "montage") return;
    const timer = window.setInterval(() => {
      const s = aktuell.current;
      if (!s || document.hidden) { setSpielen(false); return; }
      const ps = s.jeDach[s.form], d = getDachDetail(ps.detailId!);
      if (!d || ps.phase !== "montage" || ps.schritt + 1 >= d.schritte.length) { setSpielen(false); return; }
      speichern(position({ schritt: ps.schritt + 1, ansicht: d.schritte[ps.schritt + 1].ansicht }, s));
    }, 4500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spielen, reduziert, editierbar, detail?.id, p?.phase]);

  async function zielSpeichern(s: DachErkundungStand) {
    if (navigationLaeuft.current || !editierbar) return;
    const vorher = aktuell.current!;
    const vorigeRoute = appStorage.getItem("lernwerkstatt-zuletzt-route");
    const vorigeAuswahl = appStorage.getItem("bauprojekte-auswahl");
    let zielGeschrieben = false;
    navigationLaeuft.current = true; setNavigationBusy(true); setSpielen(false);
    try {
      // Commit the current work before changing the selected roof or detail.
      await flushStorage();
      speichereDachStand(s); zielGeschrieben = true;
      syncDachNachweise(s);
      const href = route(s.form, s.jeDach[s.form].detailId, s.jeDach[s.form].deckung);
      appStorage.setItem("lernwerkstatt-zuletzt-route", href);
      appStorage.setItem("bauprojekte-auswahl", href.split("#")[1]);
      await flushStorage();
      aktuell.current = s; setStand(s);
      setFehler("");
      window.history.pushState(null, "", href);
      // pushState itself emits no hashchange; keep the containing project view
      // in sync so browser Back/Forward can apply the actual previous target.
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } catch (e) {
      // A failing target write must keep the previous working surface visible.
      // Restore its position with a fresh revision; answers themselves never
      // change during navigation, even if the failed write is retried later.
      if (zielGeschrieben) {
        const zurueck = { ...vorher, revision: s.revision + 1, aktualisiertAm: Math.max(s.aktualisiertAm, Date.now()) };
        aktuell.current = zurueck; setStand(zurueck);
        try {
          speichereDachStand(zurueck);
          if (vorigeRoute === null) appStorage.removeItem("lernwerkstatt-zuletzt-route"); else appStorage.setItem("lernwerkstatt-zuletzt-route", vorigeRoute);
          if (vorigeAuswahl === null) appStorage.removeItem("bauprojekte-auswahl"); else appStorage.setItem("bauprojekte-auswahl", vorigeAuswahl);
        } catch { /* The in-memory draft and the visible storage error remain. */ }
      }
      setFehler(fail(e));
    }
    finally { navigationLaeuft.current = false; setNavigationBusy(false); }
  }
  function waehleForm(form: DachForm) {
    if (!aktuell.current) return;
    setSpielen(false); setHinweisOffen(false); setFehlerBild(false);
    const ziel = aktuell.current.jeDach[form].detailId;
    setGruppe(ziel ? getDachDetail(ziel)!.gruppe : "dachraender"); setSuche(""); setAuswahlOffen(!ziel);
    void zielSpeichern(patch({ form }));
  }
  function waehleDetail(id: string | null) {
    const s = aktuell.current!, ps = s.jeDach[s.form], d = id ? getDachDetail(id) : undefined;
    if (id && !d?.formen.includes(s.form)) return;
    setSpielen(false); setHinweisOffen(false); setFehlerBild(false);
    if (d) setGruppe(d.gruppe);
    setAuswahlOffen(!id);
    void zielSpeichern(position({ detailId: id, phase: ps.modus === "probelauf" ? "aufgaben" : "erkennen", schritt: 0, kamera: id ? "nah" : "gesamt", orbit: undefined, ansicht: "nah", wasser: 0 }));
  }
  function waehlePhase(phase: DachPhase) {
    setSpielen(false); setHinweisOffen(false); setFehlerBild(false);
    const ps = aktuell.current!.jeDach[aktuell.current!.form];
    speichern(position({ phase, schritt: phase === ps.phase ? ps.schritt : 0, ansicht: phase === "aufbau" ? "aufbau" : "nah" }));
  }
  function kamera(preset: DachPosition["kamera"]) {
    setKameraReset(n => n + 1); speichern(position({ kamera: preset, orbit: undefined }));
  }
  function waehleDeckung(deckung: DachDeckung) {
    setSpielen(false);
    const neu = position({ deckung, orbit: undefined });
    if (!speichern(neu)) return;
    // Keep a contextual workshop link truthful after the learner chooses a
    // different covering. Reloading must restore that last selected covering.
    window.history.replaceState(null, "", route(neu.form, neu.jeDach[neu.form].detailId, deckung));
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  if (sperre.status === "gesperrt") return <section className={styles.problem}><h1>In einem anderen Fenster geöffnet</h1><p role="alert">{sperre.fehler}</p><LernLink href="/projekte?ansicht=uebersicht">Zu den Baustellenangeboten →</LernLink></section>;
  if (!stand || !p) return <section className={styles.problem}><h1>Dein gespeichertes Dach bleibt erhalten.</h1><p role="alert">{fehler}</p><LernLink href="/fortschritt" className="hauptaktion">Vollständige Sicherung erstellen →</LernLink></section>;
  const modell = getDachModell(stand.form)!;
  const alleDetails = dachDetailsFuer(stand.form);
  const liste = alleDetails.filter(d => d.gruppe === gruppe && (!suche || `${d.titel} ${d.funktion}`.toLocaleLowerCase("de-DE").includes(suche.toLocaleLowerCase("de-DE"))));
  const schritt = detail?.schritte[Math.min(p.schritt, detail.schritte.length - 1)];
  const vorlageAufgabe = detail?.aufgaben[Math.min(p.schritt, 1)];
  const antwort = vorlageAufgabe ? stand.antworten[vorlageAufgabe.id] : undefined;
  const aufgabe = antwort?.aufgabe ?? vorlageAufgabe;
  const notizKey = detail?.id ?? stand.form;

  return <div className={styles.page}>
    <header className={styles.hero}>
      <div><LernLink className={styles.back} href="/projekte?ansicht=uebersicht">Baustellenprojekte <span aria-hidden="true">/</span></LernLink><span className={styles.breadcrumb}>Dachstudio</span><h1>3D-Dach entdecken</h1><p>Räumlich verstehen. Sicher entscheiden. Im Handwerk anwenden.</p></div>
      <div className={styles.heroMeta}><span>INTERAKTIVES LEHRMODELL</span><strong>34 Details <i aria-hidden="true">·</i> 68 Kontrollfragen</strong></div>
    </header>
    {fehler && <div role="alert" className={styles.error}><p>{fehler}</p><button className={styles.secondary} type="button" onClick={() => speichern(aktuell.current!)}>Speichern erneut versuchen</button></div>}
    {sperre.status === "nicht-verfuegbar" && <details className={styles.compat}><summary>Bearbeitung in einem Fenster</summary><p>{sperre.fehler}</p></details>}
    <section className={styles.studio} aria-label="Interaktives Dachstudio">
      <div className={styles.studioRail}>
        <div className={styles.forms} role="group" aria-label="Dachform auswählen">{DACH_MODELLE.map(m => <button type="button" key={m.id} aria-label={`${m.titel} auswählen`} disabled={!editierbar} aria-pressed={stand.form === m.id} onClick={() => waehleForm(m.id)}><DachSymbol form={m.id}/><span>{m.id === "steildach" ? "Satteldach" : m.id === "walmdach" ? "Walmdach" : "Flachdach"}</span><span className={styles.selectedDot} aria-hidden="true"/></button>)}</div>
        <label className={styles.coverLabel}>Deckungsart<select disabled={!editierbar || modell.deckungen.length < 2} value={p.deckung} onChange={e => waehleDeckung(e.target.value as DachDeckung)}>{modell.deckungen.map(d => <option value={d} key={d}>{deckungTitel[d]}</option>)}</select></label>
      </div>
      <div className={styles.workspace}>
        <section className={styles.visual} aria-label="Dein Dachmodell">
          {detail && p.phase === "aufgaben" && aufgabe && antwort?.medienRef ? <div className={styles.questionImage}><DachBild medium={antwort.medienRef} alt={`Aufgabenansicht: ${detail.titel}`} /><p><strong>Aufgabenansicht · {deckungTitel[antwort.medienRef.deckung]}</strong><br />Ohne Lösungsbeschriftungen. Deine Antwort gehört zu dieser gespeicherten Ansicht; ein Wechsel der Deckungsart verändert sie nicht.</p></div> : <DachBetrachter form={stand.form} deckung={p.deckung} detailId={detail?.id ?? null} ansicht={p.ansicht} phase={p.phase} schritt={p.schritt} schichten={p.schichten} kamera={p.kamera} orbit={p.orbit} onOrbit={orbit => speichern(position({ orbit }))} resetSignal={kameraReset} wasser={p.wasser} reduzierteBewegung={reduziert} pruefmodus={p.phase === "aufgaben"} fehler={p.phase === "kontrolle" && fehlerBild} activeDetailIds={liste.map(d => d.id)} onDetail={waehleDetail} onKamera={kamera} />}
          {p.phase !== "aufgaben" && <div className={styles.displayRail}>
            <fieldset className={styles.camera} disabled={!editierbar}><legend className="sr-only">{detail ? "Das Detail untersuchen" : "Feste Blickrichtungen"}</legend>{detail ? ansichten.map(v => <button key={v.id} type="button" aria-pressed={p.ansicht === v.id} onClick={() => speichern(position({ ansicht: v.id }))}>{v.label}</button>) : ([{ id: "gesamt", label: "Ganzes Dach" }, { id: "nah", label: "Detail" }, { id: "seite", label: "Seite" }, { id: "oben", label: "Von oben" }] as const).map(c => <button type="button" key={c.id} aria-pressed={p.kamera === c.id} onClick={() => kamera(c.id)}>{c.label}</button>)}</fieldset>
            <details ref={ansichtenMenue} className={styles.displayOptions}><summary>Ansichten & Schichten</summary><div className={styles.displayPopover}>
              {detail && <fieldset className={styles.camera} disabled={!editierbar}><legend>Feste Blickrichtungen</legend>{([{ id: "gesamt", label: "Ganzes Dach" }, { id: "nah", label: "Detail" }, { id: "seite", label: "Seite" }, { id: "oben", label: "Von oben" }] as const).map(c => <button type="button" key={c.id} aria-pressed={p.kamera === c.id} onClick={() => kamera(c.id)}>{c.label}</button>)}</fieldset>}
              <fieldset className={styles.layers} disabled={!editierbar}><legend>Sichtbare Schichten</legend>{schichten.map(l => <label key={l.id}><input type="checkbox" checked={p.schichten.includes(l.id)} onChange={e => speichern(position({ schichten: e.target.checked ? [...p.schichten, l.id] : p.schichten.filter(id => id !== l.id) }))}/>{l.label}</label>)}</fieldset>
              {detail && <button type="button" className={styles.waterButton} disabled={!editierbar} onClick={() => speichern(position({ wasser: (p.wasser + 1) % 5 }))}>Wasserweg: Schritt {p.wasser} von 4</button>}
            </div></details>
          </div>}
        </section>
        <aside className={styles.inspector} aria-label="Bauteile und Lernschritte">
          <div className={styles.inspectorToolbar}><span className={styles.eyebrow}>DEIN LERNMODUS</span><fieldset disabled={!editierbar} className={styles.mode}><legend className="sr-only">Wie möchtest du lernen?</legend><button type="button" aria-label="Mit Erklärung erkunden" aria-pressed={p.modus === "begleitet"} onClick={() => { setSpielen(false); speichern(position({ modus: "begleitet", phase: "erkennen", schritt: 0 })); }}>Mit Erklärung</button><button type="button" aria-pressed={p.modus === "probelauf"} onClick={() => { setSpielen(false); speichern(position({ modus: "probelauf", phase: "aufgaben", schritt: 0 })); }}>Selbst prüfen</button></fieldset></div>
          <div className={styles.picker} aria-label="Bauteile auswählen"><button type="button" className={styles.pickerToggle} disabled={!editierbar} aria-expanded={auswahlOffen} aria-controls="dach-bauteile" onClick={() => setAuswahlOffen(v => !v)}><span><span className={styles.eyebrow}>{detail ? "ANDERES DETAIL ENTDECKEN" : "WO MÖCHTEST DU ANFANGEN?"}</span><strong>{detail ? "Bauteil wechseln" : "Bauteil auswählen"}</strong></span><span aria-hidden="true">{auswahlOffen ? "−" : "+"}</span></button>
            <div id="dach-bauteile" className={styles.pickerContent} hidden={!auswahlOffen}>
              <label>Bereich auswählen<select value={gruppe} onChange={e => { setGruppe(e.target.value as DachGruppe); setSuche(""); }}>{gruppen.map(g => <option value={g.id} key={g.id}>{g.label}</option>)}</select></label>
              <label className={styles.searchLabel}>In diesem Bereich suchen<input type="search" value={suche} onChange={e => setSuche(e.target.value)} placeholder="Bauteil suchen …"/></label>
              <div className={styles.detailList}>{liste.length ? liste.map(d => <button key={d.id} type="button" disabled={!editierbar} aria-pressed={detail?.id === d.id} onClick={() => waehleDetail(d.id)}><span>{d.id.toUpperCase()}</span><strong>{d.titel}</strong><span aria-hidden="true">↗</span></button>) : <p>Kein passendes Bauteil. Wähle einen anderen Bereich oder kürze den Suchbegriff.</p>}</div>
              {detail && <button type="button" className={styles.textLink} disabled={!editierbar} onClick={() => waehleDetail(null)}>← Zur Dachübersicht</button>}
            </div>
          </div>
          {detail ? <section className={styles.lesson} aria-label={`Detail lernen: ${detail.titel}`} data-aufgabe-id={`dach3d-${detail.id}`} data-aufgabe-text={detail.titel}>
      <header className={styles.lessonHead}><div className={styles.inspectorMeta}><span className={styles.eyebrow}>DETAIL {String(modell.detailIds.indexOf(detail.id) + 1).padStart(2, "0")} / {modell.detailIds.length}</span><span>{detail.aufgaben.filter(a => stand.antworten[a.id]?.geprueft).length} / 2 Fragen</span></div><h2>{detail.titel}</h2></header>
      <nav className={styles.phases} aria-label="Lernschritte im Dachdetail">{phasen.map(ph => <button type="button" key={ph.id} disabled={!editierbar} aria-current={p.phase === ph.id ? "step" : undefined} aria-label={ph.label} onClick={() => waehlePhase(ph.id)}><span className={styles.phaseNumber} aria-hidden="true">{ph.label.slice(0, 1)}</span><span aria-hidden="true">{ph.id === "kontrolle" ? "Kontrolle" : ph.id === "aufgaben" ? "Prüfen" : ph.label.slice(3)}</span></button>)}</nav>
      {p.phase === "erkennen" && <div className={styles.content}><span className={styles.eyebrow}>FUNKTION & ZUSAMMENHANG</span><p className={styles.lead}>{detail.funktion}</p><div className={styles.parts}>{detail.bauteile.map(teil => <article key={teil.id}><h3>{teil.name}</h3><p>{teil.funktion}</p></article>)}</div><button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => waehlePhase("aufbau")}>Den Aufbau öffnen →</button></div>}
      {p.phase === "aufbau" && <div className={styles.content}><h3>So gehören die Teile zusammen</h3><ol className={styles.buildList}>{detail.aufbau.map((text, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span><p>{text}</p></li>)}</ol><p className={styles.muted}>Wechsle zwischen Nahansicht, Schnitt und auseinandergezogenen Bauteilen. Die Systemkarte beschreibt das gezeigte Beispiel.</p><button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => waehlePhase("montage")}>Den Arbeitsablauf ansehen →</button></div>}
      {p.phase === "montage" && schritt && <div className={styles.content}><div className={styles.stepHeader}><span className={styles.eyebrow}>SCHRITT {p.schritt + 1} VON {detail.schritte.length}</span><h3>{schritt.titel}</h3></div><p className={styles.lead}>{schritt.handlung}</p><div className={styles.explainGrid}><article><h4>Warum mache ich das so?</h4><p>{schritt.warum}</p></article><article><h4>Darauf achtest du</h4><p>{schritt.kontrolle}</p></article></div><div className={styles.actions}><button type="button" className={styles.secondary} disabled={!editierbar || p.schritt === 0} onClick={() => { setSpielen(false); speichern(position({ schritt: p.schritt - 1, ansicht: detail.schritte[p.schritt - 1].ansicht })); }}>← Zurück</button><button type="button" className={styles.secondary} disabled={!editierbar || reduziert} aria-pressed={spielen} onClick={() => { if (!spielen && p.schritt === detail.schritte.length - 1) speichern(position({ schritt: 0, ansicht: detail.schritte[0].ansicht })); setSpielen(v => !v); }}>{spielen ? "Animation pausieren" : "Schritte abspielen"}</button><button type="button" className={styles.secondary} disabled={!editierbar} onClick={() => { setSpielen(false); speichern(position({ schritt: 0, ansicht: detail.schritte[0].ansicht })); }}>Von vorne</button>{p.schritt < detail.schritte.length - 1 ? <button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => { setSpielen(false); speichern(position({ schritt: p.schritt + 1, ansicht: detail.schritte[p.schritt + 1].ansicht })); }}>Nächster Schritt →</button> : <button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => waehlePhase("kontrolle")}>Die Ausführung kontrollieren →</button>}</div>{reduziert && <p className={styles.muted}>Reduzierte Bewegung ist aktiv. Du wechselst die Schritte mit den Schaltflächen.</p>}</div>}
      {p.phase === "kontrolle" && <div className={styles.content}><div className={styles.comparison} role="group" aria-label="Ausführung vergleichen"><button type="button" aria-pressed={!fehlerBild} onClick={() => setFehlerBild(false)}>Richtiges Beispiel</button><button type="button" aria-pressed={fehlerBild} onClick={() => setFehlerBild(true)}>Fehlerbeispiel</button></div><p className={styles.lead}>{fehlerBild ? detail.kontrolle.fehler : detail.kontrolle.richtig}</p><div className={styles.explainGrid}><article><h3>So prüfst du die Ausführung</h3><ul>{detail.kontrolle.kriterien.map(k => <li key={k}>{k}</li>)}</ul></article><article><h3>Die passende Korrektur</h3><p>{detail.kontrolle.korrektur}</p></article></div><button type="button" className="hauptaktion" disabled={!editierbar} onClick={() => waehlePhase("aufgaben")}>Mein Verständnis prüfen →</button></div>}
      {p.phase === "aufgaben" && aufgabe && <div className={styles.content}><div className={styles.questions} role="group" aria-label="Kontrollaufgabe auswählen">{detail.aufgaben.map((a, i) => <button type="button" disabled={!editierbar} key={a.id} aria-pressed={Math.min(p.schritt, 1) === i} onClick={() => { setHinweisOffen(false); speichern(position({ schritt: i })); }}>{stand.antworten[a.id]?.geprueft ? "✓ " : ""}Frage {i + 1}: {a.titel}</button>)}</div><h3>{aufgabe.frage}</h3>{antwort ? <><fieldset className={styles.answers} disabled={!editierbar || antwort.geprueft}><legend>Wähle alle passenden Aussagen.</legend>{aufgabe.optionen.map(o => <label key={o.id}><input type="checkbox" checked={antwort.auswahl.includes(o.id)} onChange={e => { const s = aktuell.current!, a = s.antworten[aufgabe.id]; speichern(patch({ antworten: { ...s.antworten, [aufgabe.id]: { ...a, auswahl: e.target.checked ? [...a.auswahl, o.id] : a.auswahl.filter(id => id !== o.id) } } }, s)); }} /><span>{o.text}</span></label>)}</fieldset>{antwort.geprueft ? <div className={styles.feedback} role="status"><strong>{antwort.bewertung === "richtig" ? "Das hast du richtig verstanden." : antwort.bewertung === "teilweise" ? "Ein Teil deiner Antwort passt bereits." : "Diesen Zusammenhang üben wir weiter."}</strong><p>{antwort.aufgabe.erklaerung}</p><p className={styles.muted}>{antwort.hilfen.length || antwort.nachErklaerung ? "Mit Erklärung oder Lernhilfe bearbeitet. Deine erste Antwort bleibt erhalten." : "Als selbstständige Antwort gespeichert."}</p><LernLink href="/heute" className={styles.textLink}>Später in der Tagesrunde wiederholen →</LernLink></div> : <div className={styles.actions}><button type="button" className="hauptaktion" disabled={!editierbar || !antwort.auswahl.length} onClick={() => { try { speichern(pruefeDachAufgabe(aktuell.current!, aufgabe.id)); } catch (e) { setFehler(fail(e)); } }}>Meine Antwort prüfen</button><button type="button" className={styles.secondary} disabled={!editierbar} aria-expanded={hinweisOffen} onClick={() => { if (!hinweisOffen) speichern(dachHilfe(aktuell.current!, detail.id, "fragehinweis")); setHinweisOffen(v => !v); }}>{hinweisOffen ? "Lernhilfe schließen" : "Lernhilfe ansehen"}</button></div>}{hinweisOffen && <p className={styles.hint}>{detail.funktion}</p>}</> : <p>Deine Aufgabe wird vorbereitet …</p>}</div>}
      <div className={styles.related}><h3>Im Lernfeld und in der Werkstatt weiterarbeiten</h3><div>{detail.lfIds.map(id => <LernLink key={id} href={`/lernen/${id}`} className={styles.textLink}>{id.toUpperCase()} öffnen →</LernLink>)}{detail.werkstattIds.map(id => <LernLink key={id} href={`/projekte#${id}`} className={styles.textLink}>Passende Werkstatteinheit →</LernLink>)}</div></div>
    </section> : <section className={styles.overview}><span className={styles.eyebrow}>VOM GANZEN INS DETAIL</span><h2>Ein Dach. Viele Zusammenhänge.</h2><p>Wähle ein Bauteil im Modell oder in der Liste. Dann öffnest du seinen Aufbau und gehst den Arbeitsablauf Schritt für Schritt durch.</p><ol className={styles.startSteps}><li><span>01</span><div><strong>Bauteil erkennen</strong><p>Wo sitzt es und welche Aufgabe hat es?</p></div></li><li><span>02</span><div><strong>Aufbau untersuchen</strong><p>Schichten öffnen, Montage verfolgen, Fehler vergleichen.</p></div></li><li><span>03</span><div><strong>Verständnis festigen</strong><p>Zwei Fragen beantworten und später wiederholen.</p></div></li></ol></section>}
        </aside>
      </div>
      <footer className={styles.studioFooter}><span><strong>{Object.values(stand.antworten).filter(a => a.geprueft).length} / 68</strong> Kontrollfragen bearbeitet</span><p>Digitales Verständnis und praktische Ausführung werden getrennt festgehalten.</p></footer>
    </section>
    <section className={styles.utilities} aria-label="Notizen, Modellgrundlagen und Offline-Pakete">
      <details className={styles.utility}><summary><span className={styles.utilityIcon} aria-hidden="true">✎</span><span><strong>Meine Notizen</strong><small>{stand.notizen[notizKey]?.trim() ? "Deine Notiz weiterführen" : "Fragen und Beobachtungen festhalten"}</small></span><span className={styles.utilityArrow} aria-hidden="true">+</span></summary><label className={styles.notes}>Meine Notizen zu {detail?.titel ?? modell.titel}<textarea maxLength={12000} disabled={!editierbar} value={stand.notizen[notizKey] ?? ""} onChange={e => speichern(patch({ notizen: { ...aktuell.current!.notizen, [notizKey]: e.target.value } }))} placeholder="Was möchte ich im Betrieb prüfen oder nachfragen?"/></label></details>
      <details className={styles.utility} onToggle={e => { if (e.currentTarget.open && detail && editierbar) speichern(dachHilfe(aktuell.current!, detail.id, "systemkarte")); }}><summary><span className={styles.utilityIcon} aria-hidden="true">⌁</span><span><strong>Modell & Grundlagen</strong><small>Aufbau, Annahmen und Quellen</small></span><span className={styles.utilityArrow} aria-hidden="true">+</span></summary><div className={styles.system}><h2>{modell.systemkarte.titel}</h2><p>{modell.systemkarte.beschreibung}</p><ul>{modell.systemkarte.angaben.map(x => <li key={x}>{x}</li>)}</ul><ul>{modell.systemkarte.grenzen.map(x => <li key={x}>{x}</li>)}</ul>{detail && <p className={styles.muted}>{detail.quellen.join(" · ")}</p>}</div></details>
      <details className={styles.utility}><summary><span className={styles.utilityIcon} aria-hidden="true">↓</span><span><strong>Offline lernen</strong><small>Dachpakete auf diesem Gerät verwalten</small></span><span className={styles.utilityArrow} aria-hidden="true">+</span></summary><DachDownloads/></details>
    </section>
  </div>;
}

function DachSymbol({ form }: { form: DachForm }) {
  const path = form === "steildach" ? "M3 15 18 5l15 10M7 13v17h22V13M15 30v-8h6v8" : form === "walmdach" ? "M3 17 11 7h14l8 10H3Zm8-10 4 10m10-10-4 10M7 17v13h22V17" : "M3 9h30v5H3zM6 14v16h24V14M13 30v-9h9v9";
  return <svg className={styles.roofIcon} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path}/></svg>;
}

function DachDownloads() {
  const pakete = dachPakete();
  const [status, setStatus] = useState<Record<string, string>>({}), [busy, setBusy] = useState<string | null>(null), [fehler, setFehler] = useState("");
  const [fortschritt, setFortschritt] = useState({ geladen: 0, gesamt: 0, dateien: 0, gesamtDateien: 0 });
  const controller = useRef<AbortController | null>(null), alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const aktualisieren = () => { void Promise.all(pakete.map(async p => [p.id, (await dachPaketStatus(p)).status] as const)).then(werte => { if (alive.current) setStatus(Object.fromEntries(werte)); }).catch(e => { if (alive.current) setFehler(fail(e)); }); };
    aktualisieren(); const ende = subscribeDachDownloads(aktualisieren);
    return () => { alive.current = false; controller.current?.abort(); ende(); };
    // Package metadata is fixed for this application bundle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!pakete.some(p => p.assets.length)) return null;
  async function laden(paket: ReturnType<typeof dachPakete>[number]) {
    if (busy) return;
    const abort = new AbortController(); controller.current = abort; setBusy(paket.id); setFehler(""); setFortschritt({ geladen: 0, gesamt: paket.bytes, dateien: 0, gesamtDateien: paket.assets.length });
    try { await ladeDachPaket(paket, { signal: abort.signal, onProgress: p => { if (alive.current) setFortschritt(p); } }); }
    catch (e) { if (alive.current) setFehler(abort.signal.aborted ? "Download angehalten. Bereits vollständig gespeicherte Pakete bleiben erhalten." : fail(e)); }
    finally { if (alive.current) setBusy(null); controller.current = null; }
  }
  return <section className={styles.downloads} aria-labelledby="dach-offline"><header><span className={styles.eyebrow}>AUCH OHNE NETZ WEITERLERNEN</span><h2 id="dach-offline">Deine Dächer für unterwegs</h2><p>Vorschaubilder und Texte gehören zur App. Die 3D-Modelle und großen Detailbilder kannst du je Dachform zusätzlich auf diesem Gerät speichern.</p></header>{fehler && <p role="alert" className={styles.error}>{fehler}</p>}<div className={styles.downloadGrid}>{pakete.map(p => <article key={p.id}><h3>{p.titel}</h3><p>{dateiGroesse(p.bytes)} · {status[p.id] === "gespeichert" ? "Auf diesem Gerät offline verfügbar" : status[p.id] === "aelter" ? "Älteres Paket vorhanden" : "Noch nicht vollständig offline gespeichert"}</p>{busy === p.id ? <><progress value={fortschritt.geladen} max={Math.max(1, fortschritt.gesamt)} aria-label={`Download ${p.titel}`} /><p aria-live="polite">{dateiGroesse(fortschritt.geladen)} von {dateiGroesse(fortschritt.gesamt)} · {fortschritt.dateien} von {fortschritt.gesamtDateien} Dateien</p><button type="button" className={styles.secondary} onClick={() => controller.current?.abort()}>Download anhalten</button></> : <div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy !== null || !p.assets.length} onClick={() => void laden(p)}>{status[p.id] === "gespeichert" ? "Paket erneut prüfen" : "Offline speichern"}</button>{status[p.id] !== undefined && status[p.id] !== "fehlt" && <button type="button" className={styles.textLink} disabled={busy !== null} onClick={() => { void loescheDachPaket(p).catch(e => setFehler(fail(e))); }}>Download entfernen</button>}</div>}</article>)}</div><p className={styles.muted}>Deine Antworten und privaten Zeichnungen bleiben beim Entfernen eines Downloads erhalten.</p></section>;
}
