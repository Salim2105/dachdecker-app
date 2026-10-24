"use client";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ZEICHENBREITE, ZEICHENHOEHE, begrenzePunkt, fuegeElementHinzu, zeichnungAlsSvg,
  zeichnungLeeren, zeichnungWiederholen, zeichnungZurueck,
  type ZeichenElement, type ZeichenEntwurf, type ZeichenPunkt, type ZeichenWerkzeug,
} from "@/lib/zeichenEntwurf";

const WERKZEUGE: { id: ZeichenWerkzeug; name: string }[] = [
  { id: "freihand", name: "Freihand" }, { id: "linie", name: "Linie" },
  { id: "kreis", name: "Kreis" }, { id: "text", name: "Beschriftung" },
];
const buttonClass = "min-h-11 rounded-lg border px-3 py-2 text-sm disabled:opacity-40";

function Element({ element: e }: { element: ZeichenElement }) {
  const style = { stroke: e.farbe, strokeWidth: e.breite, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (e.typ === "linie") return <line x1={e.start.x} y1={e.start.y} x2={e.ende.x} y2={e.ende.y} {...style} />;
  if (e.typ === "kreis") return <circle cx={e.mitte.x} cy={e.mitte.y} r={e.radius} {...style} />;
  if (e.typ === "text") return <text x={e.position.x} y={e.position.y} fill={e.farbe} fontSize={20} fontFamily="sans-serif">{e.text}</text>;
  if (e.punkte.length === 1) return <circle cx={e.punkte[0].x} cy={e.punkte[0].y} r={e.breite / 2} fill={e.farbe} />;
  return <polyline points={e.punkte.map((p) => `${p.x},${p.y}`).join(" ")} {...style} />;
}

export function ZeichenFlaeche({ entwurf, onChange, titel }: {
  entwurf: ZeichenEntwurf; onChange: (entwurf: ZeichenEntwurf) => void; titel: string;
}) {
  const [vorschau, setVorschau] = useState<ZeichenElement | null>(null);
  const [zeiger, setZeiger] = useState<ZeichenPunkt>({ x: 100, y: 100 });
  const [meldung, setMeldung] = useState("");
  const aktiv = useRef<number | "tastatur" | null>(null);
  const vorschauRef = useRef<ZeichenElement | null>(null);
  const rasterId = useId().replace(/:/g, "");
  const beschreibungId = useId();
  const { verlauf, werkzeug, raster, zoom } = entwurf;

  function setzeVorschau(e: ZeichenElement | null) { vorschauRef.current = e; setVorschau(e); }
  function punkt(e: PointerEvent<SVGSVGElement>): ZeichenPunkt {
    const rect = e.currentTarget.getBoundingClientRect();
    return begrenzePunkt({ x: (e.clientX - rect.left) * ZEICHENBREITE / (rect.width || ZEICHENBREITE), y: (e.clientY - rect.top) * ZEICHENHOEHE / (rect.height || ZEICHENHOEHE) });
  }
  function anfang(p: ZeichenPunkt) {
    const d = entwurf;
    const basis = { id: crypto.randomUUID(), farbe: d.farbe, breite: d.breite };
    if (d.werkzeug === "text") {
      if (!d.beschriftung.trim()) { setMeldung("Trage zuerst eine Beschriftung ein."); return; }
      einfuegen({ ...basis, typ: "text", position: p, text: d.beschriftung.trim() });
      return;
    }
    setzeVorschau(d.werkzeug === "freihand" ? { ...basis, typ: "freihand", punkte: [p] }
      : d.werkzeug === "linie" ? { ...basis, typ: "linie", start: p, ende: p }
      : { ...basis, typ: "kreis", mitte: p, radius: 0 });
  }
  function bewegen(p: ZeichenPunkt) {
    const alt = vorschauRef.current;
    if (!alt) return;
    if (alt.typ === "freihand") {
      const letzter = alt.punkte[alt.punkte.length - 1];
      if (Math.hypot(letzter.x - p.x, letzter.y - p.y) < 1 || alt.punkte.length >= 10000) return;
      setzeVorschau({ ...alt, punkte: [...alt.punkte, p] });
    } else if (alt.typ === "linie") setzeVorschau({ ...alt, ende: p });
    else if (alt.typ === "kreis") setzeVorschau({ ...alt, radius: Math.hypot(p.x - alt.mitte.x, p.y - alt.mitte.y) });
  }
  function einfuegen(e: ZeichenElement) {
    try {
      onChange({ ...entwurf, verlauf: fuegeElementHinzu(entwurf.verlauf, e) });
      setMeldung("Zeichenelement hinzugefügt.");
    } catch (error) { setMeldung(error instanceof Error ? error.message : "Das Element konnte nicht ergänzt werden."); }
  }
  function fertig() {
    if (vorschauRef.current) einfuegen(vorschauRef.current);
    setzeVorschau(null); aktiv.current = null;
  }
  function abbrechen() { setzeVorschau(null); aktiv.current = null; }
  function tastatur(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "Escape") { e.preventDefault(); abbrechen(); return; }
    const richtung: Record<string, ZeichenPunkt> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    if (richtung[e.key]) {
      e.preventDefault();
      const schritt = e.shiftKey ? 1 : 10;
      const p = begrenzePunkt({ x: zeiger.x + richtung[e.key].x * schritt, y: zeiger.y + richtung[e.key].y * schritt });
      setZeiger(p);
      if (aktiv.current === "tastatur") bewegen(p);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (aktiv.current === "tastatur") fertig();
      else { aktiv.current = "tastatur"; anfang(zeiger); if (werkzeug === "text") aktiv.current = null; }
    }
  }
  function exportieren() {
    const blob = new Blob([zeichnungAlsSvg(verlauf.aktuell, titel)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `zeichnung-${entwurf.aufgabenId}.svg`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section aria-label="Digitale Zeichenwerkstatt" className="mt-4 space-y-3" onKeyDown={(e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault(); abbrechen();
      onChange({ ...entwurf, verlauf: e.shiftKey ? zeichnungWiederholen(verlauf) : zeichnungZurueck(verlauf) });
    }
  }}>
    <div role="group" aria-label="Zeichenwerkzeuge" className="flex flex-wrap gap-2">
      {WERKZEUGE.map((w) => <button key={w.id} type="button" aria-pressed={werkzeug === w.id} className={buttonClass} style={{ background: werkzeug === w.id ? "var(--accent)" : "var(--surface)", color: werkzeug === w.id ? "var(--accent-text)" : "var(--text)", borderColor: "var(--border)" }} onClick={() => { abbrechen(); onChange({ ...entwurf, werkzeug: w.id }); }}>{w.name}</button>)}
    </div>
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2">Stiftfarbe <select aria-label="Stiftfarbe" className="min-h-11 rounded-lg border p-2" value={entwurf.farbe} onChange={(e) => onChange({ ...entwurf, farbe: e.target.value })}>
        <option value="#1f2937">Dunkel</option><option value="#b42318">Rot</option><option value="#1d4ed8">Blau</option><option value="#15803d">Grün</option>
      </select></label>
      <label className="flex items-center gap-2">Strich <select aria-label="Strichbreite" className="min-h-11 rounded-lg border p-2" value={entwurf.breite} onChange={(e) => onChange({ ...entwurf, breite: Number(e.target.value) })}>
        <option value={2}>Fein</option><option value={3}>Normal</option><option value={6}>Kräftig</option>
      </select></label>
      <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={raster} onChange={(e) => onChange({ ...entwurf, raster: e.target.checked })} /> Raster</label>
      <label className="flex items-center gap-2">Zoom <select aria-label="Zeichenzoom" className="min-h-11 rounded-lg border p-2" value={zoom} onChange={(e) => onChange({ ...entwurf, zoom: Number(e.target.value) })}>
        <option value={0.5}>50 %</option><option value={0.75}>75 %</option><option value={1}>100 %</option><option value={1.5}>150 %</option><option value={2}>200 %</option>
      </select></label>
    </div>
    {werkzeug === "text" && <label className="block text-sm">Beschriftungstext
      <input className="mt-1 block min-h-11 w-full rounded-lg border p-2" maxLength={200} value={entwurf.beschriftung} onChange={(e) => onChange({ ...entwurf, beschriftung: e.target.value })} placeholder="Zum Beispiel: Fallrohr" />
    </label>}
    <p id={beschreibungId} className="text-sm" style={{ color: "var(--text-muted)" }}>Mit Maus, Trackpad oder Stift zeichnen. Per Tastatur: Zeichenfläche anwählen, Pfeile bewegen den Zeiger, Umschalt + Pfeil für feine Schritte. Enter beginnt und beendet ein Element; Escape bricht ab.</p>
    <div className="max-h-[600px] overflow-auto rounded-xl border" style={{ borderColor: "var(--border)", background: "#fff" }}>
      <svg role="application" aria-label="Zeichenfläche" aria-describedby={beschreibungId} tabIndex={0}
        viewBox={`0 0 ${ZEICHENBREITE} ${ZEICHENHOEHE}`} width={ZEICHENBREITE * zoom} height={ZEICHENHOEHE * zoom}
        style={{ touchAction: "none", cursor: werkzeug === "text" ? "text" : "crosshair", display: "block", maxWidth: zoom <= 1 ? "100%" : undefined, height: zoom <= 1 ? "auto" : undefined }}
        onKeyDown={tastatur}
        onPointerDown={(e) => {
          if (e.button !== 0 || aktiv.current !== null) return;
          e.preventDefault(); e.currentTarget.focus();
          e.currentTarget.setPointerCapture?.(e.pointerId);
          aktiv.current = e.pointerId; const p = punkt(e); setZeiger(p); anfang(p);
          if (werkzeug === "text") aktiv.current = null;
        }}
        onPointerMove={(e) => { if (aktiv.current === e.pointerId) { const p = punkt(e); setZeiger(p); bewegen(p); } }}
        onPointerUp={(e) => { if (aktiv.current === e.pointerId) { bewegen(punkt(e)); fertig(); e.currentTarget.releasePointerCapture?.(e.pointerId); } }}
        onPointerCancel={abbrechen} onLostPointerCapture={() => { if (typeof aktiv.current === "number") abbrechen(); }}>
        <title>Eigene Zeichnung</title>
        <rect width={ZEICHENBREITE} height={ZEICHENHOEHE} fill="#fff" />
        {raster && <><defs><pattern id={rasterId} width={20} height={20} patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dbe1e6" strokeWidth={1} /></pattern></defs><rect width={ZEICHENBREITE} height={ZEICHENHOEHE} fill={`url(#${rasterId})`} /></>}
        {verlauf.aktuell.map((e) => <Element key={e.id} element={e} />)}
        {vorschau && <Element element={vorschau} />}
        <g aria-hidden="true" stroke="#a64619" strokeWidth={1} pointerEvents="none"><path d={`M ${zeiger.x - 6} ${zeiger.y} h 12 M ${zeiger.x} ${zeiger.y - 6} v 12`} /><circle cx={zeiger.x} cy={zeiger.y} r={9} fill="none" /></g>
      </svg>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={buttonClass} disabled={!verlauf.vorher.length} onClick={() => { abbrechen(); onChange({ ...entwurf, verlauf: zeichnungZurueck(verlauf) }); }}>Rückgängig</button>
      <button type="button" className={buttonClass} disabled={!verlauf.nachher.length} onClick={() => { abbrechen(); onChange({ ...entwurf, verlauf: zeichnungWiederholen(verlauf) }); }}>Wiederholen</button>
      <button type="button" className={buttonClass} disabled={!verlauf.aktuell.length} onClick={() => { abbrechen(); onChange({ ...entwurf, verlauf: zeichnungLeeren(verlauf) }); }}>Zeichnung leeren</button>
      <button type="button" className={buttonClass} disabled={!verlauf.aktuell.length} onClick={exportieren}>Eigene Zeichnung als SVG</button>
    </div>
    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{verlauf.aktuell.length} Elemente · Zeiger {Math.round(zeiger.x)} / {Math.round(zeiger.y)} · Leeren lässt sich rückgängig machen.</p>
    <p role="status" className="text-sm">{meldung}</p>
  </section>;
}
