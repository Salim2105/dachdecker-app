"use client";

import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import type { WerkstattAnsicht, WerkstattAntwort, WerkstattAufgabe, WerkstattPunkt, WerkstattSzene as Szene, WerkstattSystemkarte } from "@/lib/werkstattTypen";
import { leseDezimalzahl } from "@/lib/zahlen";
import styles from "./Werkstatt.module.css";

export interface WerkstattSzeneProps {
  systemkarte: WerkstattSystemkarte; szene: Szene; ansicht?: WerkstattAnsicht;
  wasser?: number; schritt?: number; aufgabe?: WerkstattAufgabe; antwort?: WerkstattAntwort;
  geprueft?: boolean; onPunkt?: (id: string) => void; onZiel?: (id: string) => void;
}
const TITEL: Record<Szene, string> = { messen: "Bezug finden und Maß übertragen", ziegel: "Einzelziegel und wirksame Maße", laengen: "Die Reihen in der Dachlänge", breiten: "Die Fläche in der Breite einteilen", wasser: "Zwei wasserführende Ebenen verstehen", verlegen: "Ein Deckfeld Schritt für Schritt aufbauen", schnitt: "Anriss, Nutzstück und Reststück", bearbeiten: "Bearbeitung am Musterstück vorbereiten", befestigen: "Befestigung im vorgegebenen Übungsplan", kontrolle: "Die eigene Deckung kontrollieren", kronenvergleich: "Doppeldeckung und Kronendeckung vergleichen" };
const ink = "#293a35", clay = "#b6593f", clayLight = "#dfa080", wood = "#c99559", teal = "#216f6b", sky = "#236c99";
const n = (v: number) => v.toLocaleString("de-DE", { maximumFractionDigits: 2 });
const ANSICHT: Record<WerkstattAnsicht, string> = { draufsicht: "Draufsicht", schnitt: "Schnitt", einzelziegel: "Einzelziegel" };

/** A half-plane clipped to the known model, using validated coordinates only. */
function halfPolygon(a: WerkstattPunkt, b: WerkstattPunkt, left: boolean): string {
  let first = a, last = b;
  if (first.y > last.y || first.y === last.y && first.x > last.x) [first, last] = [last, first];
  const cross = (p: { x: number; y: number }) => (last.x - first.x) * (p.y - first.y) - (last.y - first.y) * (p.x - first.x);
  const inside = (v: number) => left ? v >= 0 : v <= 0;
  const polygon = [{ x: 100, y: 52 }, { x: 540, y: 52 }, { x: 540, y: 300 }, { x: 100, y: 300 }];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length], cp = cross(p), cq = cross(q);
    if (inside(cp)) out.push(p);
    if (inside(cp) !== inside(cq)) { const t = cp / (cp - cq); out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }); }
  }
  return out.map(p => `${p.x},${p.y}`).join(" ");
}
function Tile({ x, y, w = 72, h = 47, biber, label, faint = false }: { x: number; y: number; w?: number; h?: number; biber: boolean; label?: string; faint?: boolean }) {
  const curve = Math.min(h * .16, w * .25);
  return <g transform={`translate(${x} ${y})`} opacity={faint ? .18 : 1}>
    <path d={biber ? `M0 0H${w}V${h - curve}Q${w / 2} ${h + curve} 0 ${h - curve}Z` : `M0 0H${w}V${h}H0Z`} fill={clayLight} stroke={ink} strokeWidth="1.5" />
    {biber ? <path d={`M${w / 2 - 5} 1v7h10V1`} fill={clay} stroke={ink} strokeWidth="1.2" /> : <><path d={`M6 1V${h - 2}M${w - 7} 1V${h - 2}M7 7H${w - 7}`} stroke={clay} strokeWidth="4" fill="none" /><path d={`M12 2v${h - 4}`} stroke="#f8d2b5" strokeWidth="2" /></>}
    {label && <text x={w / 2} y={h / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={ink}>{label}</text>}
  </g>;
}
function Ruler({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const vertical = x1 === x2;
  return <g stroke={ink} fill={ink} strokeWidth="1.4"><path d={`M${x1} ${y1}L${x2} ${y2}`} fill="none" /><path d={vertical ? `M${x1 - 5} ${y1}h10M${x2 - 5} ${y2}h10` : `M${x1} ${y1 - 5}v10M${x2} ${y2 - 5}v10`} /><text x={(x1 + x2) / 2 + (vertical ? -14 : 0)} y={(y1 + y2) / 2 + (vertical ? 0 : -9)} textAnchor="middle" fontSize="13" stroke="none" transform={vertical ? `rotate(-90 ${x1 - 14} ${(y1 + y2) / 2})` : undefined}>{label}</text></g>;
}
function Callout({ label, step }: { label: string; step: number }) {
  return <g><circle cx="76" cy="335" r="13" fill={teal} /><text x="76" y="340" textAnchor="middle" fontSize="12" fontWeight="800" fill="white">{step + 1}</text><text x="98" y="340" fontSize="12" fontWeight="700" fill={ink}>{label}</text></g>;
}
function Layers({ phase, wasser }: { phase: number; wasser: number }) {
  const shown = Math.min(4, phase + 1);
  const names = ["Deckung", "Traglattung", "Konterlattung", "Zusätzliche wasserführende Ebene"];
  return <g data-scene="schichten">
    <text x="75" y="35" fontSize="13" fontWeight="700" fill={ink}>AUẞEN / REGEN</text>
    {names.map((name, i) => <g key={name} opacity={i < shown ? 1 : .18}>
      <path d={`M85 ${83 + i * 56}L440 ${46 + i * 56}`} stroke={[clay, wood, wood, teal][i]} strokeWidth={i === 0 ? 15 : i === 3 ? 7 : 12} fill="none" />
      {i === 1 && [0, 1, 2, 3].map(j => <path key={j} d={`M${130 + j * 85} ${136 - j * 8.7}v-16h13v16`} fill={wood} stroke={ink} strokeWidth="1.5" />)}
      {i === 2 && [0, 1, 2].map(j => <path key={j} d={`M${180 + j * 85} ${191 - j * 8.7}l40-4`} stroke={ink} strokeWidth="3" />)}
      <text x="455" y={65 + i * 56} fill={ink} fontSize="12">{i + 1}. {name === names[3] ? "Zusatzebene" : name}</text>
    </g>)}
    {wasser > 0 && <path d="M410 32l-88 9m12-7-12 7 12 4" fill="none" stroke={sky} strokeWidth="4" />}
    {wasser > 1 && <path d="M280 46l-96 10m12-7-12 7 12 4" fill="none" stroke={sky} strokeWidth="4" />}
    {wasser > 2 && <path d="M413 205L95 238l-20 28m1-13-1 13 13-5" stroke={sky} strokeWidth="4" fill="none" strokeDasharray="7 4" />}
    {wasser > 3 && <><path d="M75 266l-8 34h55" stroke={sky} strokeWidth="4" fill="none" /><text x="135" y="299" fontSize="12" fill={ink}>Zum vorgesehenen Traufanschluss</text></>}
    <Callout step={phase} label={wasser > 2 ? "Den unteren Wasserweg getrennt bis zur Traufe verfolgen" : "Ebenen und ihre jeweiligen Aufgaben unterscheiden"} />
  </g>;
}
function SideSection({ system, phase, szene }: { system: WerkstattSystemkarte; phase: number; szene: Szene }) {
  const biber = system.pfadId === "biber-doppel", m = system.masse;
  const scale = biber ? 3 : 2.1, pitch = m.deckLaenge * scale, length = m.ziegelLaenge * scale;
  return <g data-scene="laengsschnitt">
    <text x="75" y="35" fontSize="13" fill={ink}>Längsschnitt · Schichten zur Erklärung überhöht</text>
    <path d="M70 215H565" stroke={teal} strokeWidth="6" />
    {[0, 1, 2, 3].map(i => { const head = 210 + i * pitch, y = 169 - i * 7; return <g key={i} opacity={szene === "verlegen" && i > phase ? .2 : 1}>
      <rect x={head - 7} y={y + 10} width="16" height="31" fill={wood} stroke={ink} strokeWidth="1.5" />
      <path d={`M${head - length} ${y + 3}H${head + 3}v12h-8v-9H${head - length}Z`} fill={clayLight} stroke={ink} strokeWidth="2" />
      <text x={head - 8} y={239 + (i % 2) * 16} textAnchor="middle" fill={ink} fontSize="11">Latte {i + 1}</text>
      {szene === "befestigen" && i <= phase && <path d={`M${head + 3} ${y - 3}v24l-12 7`} stroke={teal} strokeWidth="4" fill="none" />}
    </g>; })}
    <Ruler x1={210} y1={105} x2={210 + pitch} y2={105} label={`${n(m.deckLaenge)} cm Reihenabstand`} />
    {biber && <><path d={`M${210 + 2 * pitch - length} 128H210`} stroke={sky} strokeWidth="5" /><text x="82" y="286" fontSize="13" fill={ink}>{n(m.kopfUeberdeckung)} cm Höhenüberdeckung über zwei Reihenabstände</text><text x="82" y="308" fontSize="13" fill={ink}>{n(m.ziegelLaenge - m.deckLaenge)} cm Überlappung direkt benachbarter Reihen</text></>}
    {!biber && <><text x="80" y="285" fontSize="13" fill={ink}>Jede Aufhängung sitzt an der vorgesehenen Latte.</text><text x="80" y="306" fontSize="13" fill={ink}>Falzschluss und Auflage gehören zur Sitzkontrolle.</text></>}
    <text x="70" y="80" fontSize="12" fill={ink}>← TRAUFSEITE</text><text x="450" y="80" fontSize="12" fill={ink}>FIRSTSEITE →</text>
    <Callout step={phase} label={szene === "laengen" ? "Den Bezug und die Anzahl der Abstände prüfen" : "Auflage, Aufhängung und Überdeckung zusammen betrachten"} />
  </g>;
}
function SingleTile({ system, phase }: { system: WerkstattSystemkarte; phase: number }) {
  const biber = system.pfadId === "biber-doppel", m = system.masse;
  const height = 236, width = height * m.ziegelBreite / m.ziegelLaenge, x = 300 - width / 2, y = 48;
  return <g data-scene="einzelziegel">
    <Tile x={x} y={y} w={width} h={height} biber={biber} />
    <Ruler x1={x - 20} y1={y} x2={x - 20} y2={y + height} label={`${n(m.ziegelLaenge)} cm Gesamtmaß`} />
    <Ruler x1={x} y1={309} x2={x + width} y2={309} label={`${n(m.ziegelBreite)} cm Außenbreite`} />
    <path d={`M${x + width * .4} 45v24h${width * .2}V45`} fill={wood} stroke={ink} strokeWidth="2" />
    <text x="419" y="70" fontSize="13" fill={ink}>Aufhängung</text><path d={`M${x + width * .6} 55H410`} stroke={ink} />
    <text x="419" y="89" fontSize="11" fill={ink}>(Rückseite schematisch)</text>
    {biber ? <><text x="419" y="145" fontSize="13" fill={ink}>Ohne Kopf-/Seitenfalz</text><text x="419" y="171" fontSize="13" fill={ink}>Versatz + Überdeckung</text></> : <><text x="419" y="143" fontSize="13" fill={ink}>Kopffalz</text><path d={`M${x + width - 12} 60L409 136`} stroke={ink} fill="none" /><text x="419" y="216" fontSize="13" fill={ink}>Seitenfalz</text><path d={`M${x + width - 5} 180L409 208`} stroke={ink} /></>}
    {phase > 0 && <><path d={`M${x + 8} ${y + height - height * m.deckLaenge / m.ziegelLaenge}h${width - 16}`} stroke={teal} strokeWidth="3" strokeDasharray="6 5" /><text x="419" y="253" fontSize="12" fill={ink}>Deckmaß aus Systemkarte</text></>}
    <Callout step={phase} label="Außenmaß und wirksames Deckmaß unterscheiden" />
  </g>;
}
function CrownComparison({ phase }: { phase: number }) {
  return <g data-scene="deckartenvergleich"><text x="68" y="33" fontSize="18" fontWeight="800" fill={ink}>Doppeldeckung</text><text x="354" y="33" fontSize="18" fontWeight="800" fill={ink}>Kronendeckung</text>
    {[0, 1, 2].map(i => { const x = 150 + i * 48, y = 152 - i * 7; return <g key={i}><rect x={x - 7} y={y + 12} width="19" height="30" fill={wood} stroke={ink} /><path d={`M${x - 115} ${y}H${x + 5}v17h-9V${y + 5}H${x - 115}Z`} stroke={ink} strokeWidth="2" fill={clayLight} /><text x={x} y="219" textAnchor="middle" fontSize="10" fill={ink}>1 Reihe</text></g>; })}
    {[0, 1].map(i => { const x = 440 + i * 94, y = 154 - i * 9; return <g key={i}><rect x={x - 8} y={y + 16} width="30" height="30" fill={wood} stroke={ink} /><path d={`M${x - 113} ${y + 5}H${x + 3}v21h-7V${y + 10}H${x - 113}Z`} stroke={ink} strokeWidth="2" fill={clayLight} /><path d={`M${x - 105} ${y - 7}H${x + 14}v33h-7V${y - 2}H${x - 105}Z`} stroke={ink} strokeWidth="2" fill={clayLight} /><text x={x} y="219" textAnchor="middle" fontSize="10" fill={ink}>2 Reihen</text></g>; })}
    <text x="70" y="256" fontSize="13" fill={ink}>Eine Reihe an jeder Latte</text><text x="355" y="256" fontSize="13" fill={ink}>Zwei Reihen an einer Latte</text><text x="70" y="287" fontSize="12" fill={ink}>Schematischer Längsschnitt · Höhen zur Erklärung überhöht</text><Callout step={phase} label="Reihen je Latte zählen; die Latteneinteilung gehört zur Deckart" />
  </g>;
}

export function WerkstattSzene({ systemkarte: system, szene, ansicht, wasser = 0, schritt = 0, aufgabe, antwort, geprueft = false, onPunkt, onZiel }: WerkstattSzeneProps) {
  const id = useId().replace(/:/g, ""), biber = system.pfadId === "biber-doppel", m = system.masse;
  const svgRef = useRef<SVGSVGElement>(null), zoomRef = useRef<HTMLDialogElement>(null), zoomButton = useRef<HTMLButtonElement>(null);
  const [zoomQuelle, setZoomQuelle] = useState("");
  function vergroessern() {
    const source = svgRef.current?.cloneNode(true) as SVGSVGElement | undefined;
    if (!source) return;
    source.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    source.setAttribute("width", "640");source.setAttribute("height", "360");
    source.style.backgroundColor = "#faf4e9";
    setZoomQuelle(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(source.outerHTML)}`);
    zoomRef.current?.showModal();
  }
  function dialogFokus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first && last) { event.preventDefault();last.focus(); }
    else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault();first.focus(); }
  }
  const phase = Math.max(0, Math.min(5, schritt));
  const mark = aufgabe?.typ === "anzeichnen" ? aufgabe : null, grid = aufgabe?.typ === "einteilen" ? aufgabe : null, lay = aufgabe?.typ === "verlegen" ? aufgabe : null;
  const view: WerkstattAnsicht = mark || grid || lay ? "draufsicht" : ansicht ?? (szene === "ziegel" || szene === "schnitt" ? "einzelziegel" : szene === "wasser" ? "schnitt" : "draufsicht");
  const rawCount = antwort ? leseDezimalzahl(antwort.anzahl) : null, rawOffset = antwort ? leseDezimalzahl(antwort.versatz) : null;
  const validGrid = rawCount !== null && Number.isInteger(rawCount) && rawCount >= 1 && rawCount <= 30 && rawOffset !== null && rawOffset >= 0 && (!grid || rawOffset < grid.strecke);
  const count = grid && validGrid ? rawCount! : grid ? 0 : szene === "breiten" ? m.spalten : m.reihen;
  const selected = mark ? (antwort?.punkte ?? []).map(key => mark.punkte.find(p => p.id === key)).filter((p): p is WerkstattPunkt => !!p) : [];
  const description = `${TITEL[szene]}. ${biber ? "Biberschwanz-Doppeldeckung" : "Falzziegel"}. ${ANSICHT[view]}. Alle Maße sind Angaben dieser Schulübung. ${mark || lay ? "Nummerierte Ziele sind zusätzlich als Schaltflächen unter der Zeichnung bedienbar." : "Die Blickrichtung und Bezugslagen sind beschriftet."}`;
  let art: ReactNode;
  if (lay) {
    const fasten = szene === "befestigen";
    art = <g data-scene="platzieren"><rect x="75" y="40" width="490" height="270" rx="12" fill="#e6d9bd" stroke={ink} strokeWidth="2" />
      {lay.ziele.map((p, i) => { const placed = lay.teile.find(t => antwort?.belegung[t.id] === p.id), correct = placed?.zielId === p.id;
        return <g key={p.id} onClick={onZiel ? () => onZiel(p.id) : undefined} style={{ cursor: onZiel ? "pointer" : "default" }} aria-hidden="true"><rect x={p.x - 47} y={p.y - 29} width="94" height="64" rx="7" fill="#f9f3e9" stroke={geprueft && placed ? correct ? teal : "#a43b31" : "#7a7769"} strokeWidth="2" strokeDasharray="5 4" />
          {placed && (fasten ? <><path d={`M${p.x - 8} ${p.y - 20}v32h20v-25`} stroke={teal} strokeWidth="7" fill="none" /><text x={p.x + 30} y={p.y + 15} textAnchor="middle" fontSize="13" fill={ink}>{placed.label.slice(-1)}</text></> : <Tile x={p.x - 42} y={p.y - 25} w={84} h={52} biber={biber} label={placed.label.slice(-1)} />)}
          <circle cx={p.x - 40} cy={p.y - 25} r="12" fill={teal} /><text x={p.x - 40} y={p.y - 21} textAnchor="middle" fontSize="12" fill="white">{i + 1}</text></g>;
      })}<text x="95" y="334" fontSize="12" fill={ink}>{fasten ? "Dein Modellplan · Befestigungsteile an Planpositionen setzen" : "Dein Deckschema · Teil wählen, dann einen nummerierten Platz"}</text></g>;
  } else if (mark?.modus === "schnitt" || szene === "schnitt" && view !== "schnitt") {
    art = <g data-scene="zuschnitt"><rect x="100" y="52" width="440" height="248" rx="8" fill={clayLight} stroke={ink} strokeWidth="2.5" /><path d="M116 54V297M520 54V297M115 68H520" stroke={clay} strokeWidth={biber ? 0 : 10} fill="none" />{biber && <path d="M100 266Q320 330 540 266" stroke={ink} strokeWidth="2" fill="none" />}<path d="M155 54v24h42V54" fill={wood} stroke={ink} strokeWidth="2" /><text x="216" y="105" fontSize="13" fill={ink}>Aufhängung / Funktionsbereich</text>
      <path d="M390 52V300" stroke={ink} strokeWidth="1.5" strokeDasharray="2 7" opacity=".6" /><text x="420" y="150" fontSize="12" fill={ink}>Anschlusskante</text>
      {selected.length === 2 && antwort?.nutzseite && <><polygon points={halfPolygon(selected[0], selected[1], antwort.nutzseite === "links")} fill="#237a69" opacity=".24" /><polygon points={halfPolygon(selected[0], selected[1], antwort.nutzseite !== "links")} fill="#ab3b3b" opacity=".2" /><text x={antwort.nutzseite === "links" ? 195 : 445} y="193" textAnchor="middle" fontSize="16" fontWeight="800" fill={ink}>NUTZSTÜCK</text><text x={antwort.nutzseite === "links" ? 455 : 195} y="218" textAnchor="middle" fontSize="13" fill={ink}>RESTSTÜCK</text></>}
      {!mark && phase > 0 && <path d={`M${290 + phase * 25} 58V295`} stroke={teal} strokeWidth="3" strokeDasharray="8 5" />}<Callout step={phase} label="Anschlussform übertragen und verbleibende Funktion prüfen" /></g>;
  } else if (szene === "kronenvergleich" && view === "schnitt") art = <CrownComparison phase={phase} />;
  else if (view === "einzelziegel") art = <SingleTile system={system} phase={phase} />;
  else if (view === "schnitt") art = szene === "wasser" ? <Layers phase={phase} wasser={wasser} /> : <SideSection system={system} phase={phase} szene={szene} />;
  else if (szene === "bearbeiten") art = <g data-scene="bearbeitung"><rect x="80" y="229" width="475" height="50" rx="12" fill={wood} stroke={ink} strokeWidth="2" /><path d="M120 279v37M510 279v37" stroke={ink} strokeWidth="12" />
    {phase > 0 && <><rect x="177" y="208" width="55" height="21" fill="#e9c48a" stroke={ink} /><rect x="370" y="208" width="55" height="21" fill="#e9c48a" stroke={ink} /></>}
    <path d={biber ? "M165 80H435V190Q300 224 165 190Z" : "M165 80H435V208H165Z"} fill={clayLight} stroke={ink} strokeWidth="2" />
    <path d="M350 80V208" stroke={teal} strokeWidth="3" strokeDasharray="8 5" /><text x="190" y="137" fontSize="14" fill={ink}>Nutzstück</text><text x="371" y="137" fontSize="12" fill={ink}>Reststück</text>
    {phase > 1 && <><path d="M355 82V208" stroke="#fff1b3" strokeWidth="8" /><path d="M359 85l30-25h135" stroke={ink} fill="none" /><text x="394" y="54" fontSize="12" fill={ink}>Schnittfuge: Restseite</text></>}
    {phase > 2 && <><path d="M350 80V208" stroke={ink} strokeWidth="3" /><circle cx="350" cy="174" r="25" fill="#faf4e9" fillOpacity=".5" stroke={teal} strokeWidth="3" /><path d="M334 176l10 10 23-26" stroke={teal} strokeWidth="4" fill="none" /></>}
    <text x="85" y="32" fontSize="13" fill={ink}>{["Anriss, Nutzstück und Reststück kennzeichnen", "Vorgesehene stabile Werkstückauflage vorbereiten", "Schnittfuge anhand des bearbeiteten Musters vergleichen", "Kontur, Kante und verbleibende Funktion kontrollieren"][Math.min(3, phase)]}</text><Callout step={phase} label="Mustervergleich; tatsächliches Verfahren nach Arbeitsanweisung" /></g>;
  else {
    const x = 105, y = 65, w = 430, h = 225, pitchY = h / m.reihen, pitchX = w / m.spalten;
    const rows = Array.from({ length: m.reihen }, (_, i) => m.reihen - 1 - i);
    const drawTiles = ["verlegen", "befestigen", "kontrolle", "wasser"].includes(szene);
    art = <g data-scene="dachfeld"><defs><clipPath id={`${id}-feld`}><rect x={x} y={y} width={w} height={h} /></clipPath></defs><rect x={x} y={y} width={w} height={h} fill="#e8d9ba" stroke={ink} strokeWidth="2.5" />
      {Array.from({ length: m.reihen + 1 }, (_, i) => <path key={`batten-${i}`} d={`M${x} ${y + i * pitchY}h${w}`} stroke={wood} strokeWidth="8" />)}
      {drawTiles && <g clipPath={`url(#${id}-feld)`}>{rows.flatMap(row => Array.from({ length: m.spalten + 1 }, (_, col) => <Tile key={`${row}-${col}`} x={x + (col - (biber && row % 2 ? .5 : 0)) * pitchX} y={y + row * pitchY} w={pitchX * m.ziegelBreite / m.deckBreite} h={pitchY * m.ziegelLaenge / m.deckLaenge} biber={biber} faint={szene === "verlegen" && row < m.reihen - 1 - phase} />))}</g>}
      {(szene === "laengen" || szene === "breiten") && count > 0 && Array.from({ length: count + 1 }, (_, i) => { const vertical = grid ? grid.richtung === "breite" : szene === "breiten"; const offset = grid && validGrid ? rawOffset! / grid.strecke : 0; const frac = offset + (1 - offset) * i / count;
        return <path data-raster="true" key={`raster-${i}`} d={vertical ? `M${x + w * frac} ${y}v${h}` : `M${x} ${y + h * (1 - frac)}h${w}`} stroke={teal} strokeWidth="2.6" strokeDasharray="6 4" />;
      })}
      {szene === "messen" && <><path d={`M110 ${285 - phase * 28}H530`} stroke={teal} strokeWidth="3" strokeDasharray="6 4" /><rect x="118" y="244" width="45" height="38" rx="10" fill="#e8ba4d" stroke={ink} strokeWidth="2" /><path d="M160 255H480v14H160Z" fill="#fff1b3" stroke={ink} strokeWidth="1" />{[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${185 + i * 43} 256v${i % 2 ? 6 : 10}`} stroke={ink} />)}</>}
      {szene === "befestigen" && [0, 1, 2].map(i => <path key={i} d={`M${170 + i * 130} ${130 + (i % 2) * 65}v17h12v-13`} stroke={teal} strokeWidth="4" fill="none" />)}
      {szene === "kontrolle" && <><circle cx={195 + phase * 65} cy="170" r="35" fill="#faf4e9" fillOpacity=".5" stroke={teal} strokeWidth="4" /><path d={`M${220 + phase * 65} 197l27 28`} stroke={teal} strokeWidth="10" /><path d={`M${174 + phase * 65} 170l10 10 24-27`} stroke={teal} strokeWidth="4" fill="none" /></>}
      {szene === "wasser" && wasser > 0 && <path d="M480 85L480 262l-8-12m8 12 8-12" stroke={sky} strokeWidth="4" fill="none" />}
      <Ruler x1={105} y1={47} x2={535} y2={47} label={`${n(m.feldBreite)} cm Übungsbreite`} /><Ruler x1={82} y1={65} x2={82} y2={290} label={`${n(m.feldLaenge)} cm Einteilungsstrecke`} />
      <text x="390" y="21" fontSize="11" fill={ink}>FIRSTSEITE / oberer Bezug ↑</text><text x="112" y="310" fontSize="11" fill={ink}>↓ TRAUFSEITE / unterer Bezug · Randausbildung gesondert</text>
      <Callout step={phase} label={szene === "breiten" ? "Schnurschläge verbinden zueinander gehörende Bezugspunkte" : szene === "laengen" ? "Abstände und Begrenzungslinien getrennt zählen" : szene === "befestigen" ? "Befestigung aus dem vorgegebenen Modellplan übernehmen" : "Bezug prüfen · Maß übertragen · kontrollieren"} />
    </g>;
  }
  return <figure className={styles.scene}>
    <div className={styles.sceneHead}><strong>{biber ? "Biber · Doppeldeckung" : "Falzziegel"}</strong><span>{ANSICHT[view]}</span></div>
    <svg ref={svgRef} viewBox="0 0 640 360" className={styles.svg} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>{TITEL[szene]}</title><desc id={`${id}-desc`}>{description}</desc>
      <defs><pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#b7a88c" strokeWidth=".65" opacity=".22" /></pattern></defs><rect width="640" height="360" fill={`url(#${id}-grid)`} />
      <g fontFamily="system-ui, sans-serif" strokeLinejoin="round" strokeLinecap="round">{art}
        {selected.length === 2 && <><path data-anriss="true" d={`M${selected[0].x} ${selected[0].y}L${selected[1].x} ${selected[1].y}`} stroke="#a7442b" strokeWidth="4" /><text x="320" y="25" textAnchor="middle" fontSize="13" fontWeight="700" fill={ink}>Deine markierte Linie</text></>}
        {mark && geprueft && (() => { const a = mark.punkte.find(p => p.id === mark.loesung[0]), b = mark.punkte.find(p => p.id === mark.loesung[1]); return a && b ? <path data-vergleich="true" d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke={teal} strokeWidth="4" strokeDasharray="5 6" /> : null; })()}
        {mark?.punkte.map((p, i) => <g key={p.id} onClick={onPunkt ? () => onPunkt(p.id) : undefined} style={{ cursor: onPunkt ? "pointer" : "default" }} aria-hidden="true"><circle cx={p.x} cy={p.y} r="15" fill={selected.some(s => s.id === p.id) ? "#a7442b" : "#fff8ee"} stroke={ink} strokeWidth="2" /><text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={selected.some(s => s.id === p.id) ? "white" : ink}>{i + 1}</text></g>)}
      </g>
    </svg>
    <figcaption className={styles.caption}>Eigene schematische Lernzeichnung ohne Maßstab · {TITEL[szene]}. Maße und Befestigungen gelten für das beschriebene Übungsmodell.</figcaption>
    <div className={styles.zoomAction}><button ref={zoomButton} type="button" className={styles.secondary} onClick={vergroessern}>Zeichnung vergrößern</button></div>
    <dialog ref={zoomRef} className={styles.zoomDialog} onKeyDown={dialogFokus} aria-labelledby={`${id}-zoom-titel`} onClose={() => {setZoomQuelle("");zoomButton.current?.focus();}}>
      <header className={styles.zoomHeader}><h2 id={`${id}-zoom-titel`}>{TITEL[szene]}</h2><button type="button" autoFocus className={styles.secondary} onClick={() => zoomRef.current?.close()}>Zeichnung schließen</button></header>
      <p className={styles.zoomHelp}>Vergrößerte Ansicht deiner Zeichnung. Auf kleinen Bildschirmen kannst du seitlich scrollen. Zum Bearbeiten schließt du diese Ansicht.</p>
      <div className={styles.zoomScroll} tabIndex={0} role="region" aria-label="Vergrößerte Zeichnung verschieben">
        {/* The data URL is a snapshot of this own React SVG; it needs its original dimensions. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {zoomQuelle && <img className={styles.zoomImage} src={zoomQuelle} width={640} height={360} alt={description} />}
      </div>
    </dialog>
  </figure>;
}
