"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { wahreDachflaeche, sparrenlaenge, firsthoehe, neigungAusMassen, gradZuProzent, waermedurchlasswiderstand, uWert, regenwasserabfluss, ablaufanzahl, laengenausdehnung, materialbedarf, gratsparren, kehle, schleppgaube, satteldachgaube, haftabstand, scharen, ziegelProQm, zahl, RSI_WERTE, RSE, AUSDEHNUNG } from "@/lib/rechner";
import { leseDezimalzahl } from "@/lib/zahlen";
import { leseRechnerEntwurf, rechnerEntwurfStore, RECHNER_TABS, type RechnerEntwurf, type RechnerTab } from "@/lib/rechnerEntwurf";
import { Feld, Ergebnis, Hinweis, Block } from "./Feld";
import { RechenSkizze, type SkizzenArt } from "./RechenSkizze";

type Regel = "positiv" | "nichtNegativ" | "winkel" | "anteil" | "beliebig";
interface Eingabe { id: string; label: string; einheit?: string; regel?: Regel; hilfe?: string }
interface Zeile { label: string; wert: number; einheit: string; formel: string; eingesetzt: string; stellen?: number; transfer?: "flaeche" | "stueck" }
type Zahlen = Record<string, number>;
const feld = (id: string, label: string, einheit?: string, regel: Regel = "positiv", hilfe?: string): Eingabe => ({ id, label, einheit, regel, hilfe });
const zeile = (label: string, wert: number, einheit: string, formel: string, eingesetzt: string, extra: Partial<Zeile> = {}): Zeile => ({ label, wert, einheit, formel, eingesetzt, ...extra });
const n = (wert: number) => zahl(wert, 4).replace(/,?0+$/, "");
const buttonClass = "rounded-xl border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2";
const buttonStyle = { borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)", outlineColor: "var(--accent)" };

function eingabeFehler(text: string, regel: Regel = "positiv"): string | undefined {
  const v = leseDezimalzahl(text);
  if (v === null) return text.trim() ? "Bitte nur eine Zahl eingeben, zum Beispiel 2,5. Die Einheit steht daneben." : "Bitte einen Wert eingeben.";
  if (regel === "positiv" && v <= 0) return "Der Wert muss größer als 0 sein.";
  if ((regel === "nichtNegativ" || regel === "winkel" || regel === "anteil") && v < 0) return "Der Wert darf nicht negativ sein.";
  if (regel === "winkel" && v >= 90) return "Bitte einen Winkel von 0° bis unter 90° eingeben.";
  if (regel === "anteil" && v > 1) return "Der Abflussbeiwert liegt zwischen 0 und 1.";
}

export function Rechner({ compact = false }: { compact?: boolean }) {
  const raw = useSyncExternalStore(rechnerEntwurfStore.subscribe, rechnerEntwurfStore.getSnapshot, rechnerEntwurfStore.getServerSnapshot);
  const entwurf = useMemo(() => leseRechnerEntwurf(raw), [raw]);
  const set = (patch: Partial<RechnerEntwurf>) => rechnerEntwurfStore.set({ ...entwurf, ...patch });
  const setFeld = (id: string, wert: string) => set({ felder: { ...entwurf.felder, [id]: wert } });
  const transfer = (art: "flaeche" | "stueck", wert: number) => set({ tab: "material", felder: { ...entwurf.felder, [art === "flaeche" ? "materialFlaeche" : "stueck"]: String(wert) } });
  const block = (id: string, titel: string, eingaben: Eingabe[], berechne: (v: Zahlen) => Zeile[], skizze: SkizzenArt, hinweis: string, lf: string) => <RechenBlock key={id} {...{ id, titel, eingaben, berechne, skizze, hinweis, lf, transfer, compact }} werte={entwurf.felder} onWert={setFeld} />;
  let inhalt: ReactNode;
  switch (entwurf.tab) {
    case "dach": inhalt = <>
      {block("dach", "Wahre Dachfläche und Sparren", [feld("neigung", "Dachneigung α", "°", "winkel"), feld("grundflaeche", "Grundrissfläche A₀", "m²"), feld("halbeBreite", "Halbe Gebäudebreite b", "m")], (v) => [
        zeile("Wahre Dachfläche", wahreDachflaeche(v.grundflaeche, v.neigung), "m²", "A = A₀ / cos α", `${n(v.grundflaeche)} m² / cos(${n(v.neigung)}°)`, { transfer: "flaeche" }),
        zeile("Sparrenlänge", sparrenlaenge(v.halbeBreite, v.neigung), "m", "s = b / cos α", `${n(v.halbeBreite)} m / cos(${n(v.neigung)}°)`),
        zeile("Firsthöhe über Traufe", firsthoehe(v.halbeBreite, v.neigung), "m", "h = b · tan α", `${n(v.halbeBreite)} m · tan(${n(v.neigung)}°)`),
        zeile("Neigung in Prozent", gradZuProzent(v.neigung), "%", "p = tan α · 100", `tan(${n(v.neigung)}°) · 100`, { stellen: 1 }),
      ], "dach", "Die Grundrissfläche ist die Fläche von oben gesehen. Das Modell setzt eine einheitliche Dachneigung voraus; b ist die waagerechte Strecke von der Traufe zum First.", "lf08")}
      {block("neigung", "Neigung aus Höhe und Länge", [feld("hoehe", "Höhe h", "m", "nichtNegativ"), feld("breite", "Waagerechte Länge b", "m")], (v) => [
        zeile("Dachneigung", neigungAusMassen(v.hoehe, v.breite), "°", "α = arctan(h / b)", `arctan(${n(v.hoehe)} / ${n(v.breite)})`, { stellen: 1 }),
        zeile("Neigung in Prozent", v.hoehe / v.breite * 100, "%", "p = h / b · 100", `${n(v.hoehe)} m / ${n(v.breite)} m · 100`, { stellen: 1 }),
      ], "dach", "45° entsprechen 100 %. 100 cm sind 1 m: Beide Längen müssen vor dem Einsetzen in derselben Einheit vorliegen.", "lf02")}
    </>; break;
    case "grat": inhalt = <>
      {block("grat", "Gratsparren", [feld("gratBreite", "Halbe Gebäudebreite b", "m"), feld("gratNeigung", "Dachneigung α", "°", "winkel")], (v) => {
        const d = gratsparren(v.gratBreite, v.gratNeigung);
        return [zeile("Firsthöhe", d.hoehe, "m", "h = b · tan α", `${n(v.gratBreite)} m · tan(${n(v.gratNeigung)}°)`), zeile("Flächensparren", d.sparren, "m", "s = b / cos α", `${n(v.gratBreite)} m / cos(${n(v.gratNeigung)}°)`), zeile("Gratsparren", d.grat, "m", "g = √(b² + s²)", `√(${n(v.gratBreite)}² + ${n(d.sparren)}²) m`), zeile("Gratneigung", d.gratneigung, "°", "γ = arcsin(h / g)", `arcsin(${n(d.hoehe)} / ${n(d.grat)})`, { stellen: 1 })];
      }, "grat", "Modell: beide angrenzenden Dachflächen haben dieselbe Neigung und die Traufen dieselbe Höhe. Der Grat ist länger und flacher als der Flächensparren.", "lf13a")}
      {block("kehle", "Kehle als Raumdiagonale", [feld("feld1", "Feldbreite f₁", "m"), feld("feld2", "Feldbreite f₂", "m"), feld("kehlHoehe", "Firsthöhe h", "m", "nichtNegativ")], (v) => {
        const k = kehle(v.feld1, v.feld2, v.kehlHoehe);
        return [zeile("Kehllänge", k.laenge, "m", "k = √((f₁/2)² + (f₂/2)² + h²)", `√((${n(v.feld1)}/2)² + (${n(v.feld2)}/2)² + ${n(v.kehlHoehe)}²) m`), zeile("Kehlneigung", k.neigung, "°", "γ = arcsin(h / k)", `arcsin(${n(v.kehlHoehe)} / ${n(k.laenge)})`, { stellen: 1 })];
      }, "grat", "Die waagerechten Teilstrecken betragen jeweils die halbe Feldbreite. Das ist ein rechtwinkliges Raumdiagonalen-Modell; abweichende Anschlussgeometrien sind gesondert zu konstruieren.", "lf13a")}
    </>; break;
    case "gaube": inhalt = <>
      {block("schleppgaube", "Schleppdachgaube", [feld("sges", "Gesamtsparren s", "m"), feld("ue", "Überstand ü (am Sparren)", "m", "nichtNegativ"), feld("alpha", "Hauptdachneigung α", "°", "winkel"), feld("beta", "Gaubenneigung β", "°", "winkel")], (v) => {
        const g = schleppgaube(v.sges, v.ue, v.alpha, v.beta), s = v.sges - v.ue;
        return [zeile("Waagerechte Tiefe", g.tiefe, "m", "t = (s − ü) · cos β", `(${n(v.sges)} − ${n(v.ue)}) m · cos(${n(v.beta)}°)`), zeile("Höhe am Anschluss", g.hoehe, "m", "h = t · tan α", `${n(g.tiefe)} m · tan(${n(v.alpha)}°)`), zeile("Wangenanschluss", g.anschluss, "m", "a = √(t² + h²)", `√(${n(g.tiefe)}² + ${n(g.hoehe)}²) m`), zeile("Vordere Sichthöhe", g.sichthoehe, "m", "hᵥ = h − (s − ü) · sin β", `${n(g.hoehe)} m − ${n(s)} m · sin(${n(v.beta)}°)`), zeile("Fläche einer Wange", g.wange, "m²", "Aᵥ = hᵥ · t / 2", `${n(g.sichthoehe)} m · ${n(g.tiefe)} m / 2`)];
      }, "schleppgaube", "Das Modell benötigt ü < s und β < α. Der Überstand wird entlang des Gaubensparrens gemessen. Ein steileres Gaubendach ergibt in diesem Modell keine positive vordere Sichthöhe.", "lf15")}
      {block("sattelgaube", "Satteldachgaube", [feld("wangeH", "Wangenhöhe h", "m"), feld("wangeL", "Wangenlänge t", "m"), feld("firstL", "Firstlänge f", "m"), feld("traufL", "Trauflänge e", "m"), feld("gaubeSparren", "Gaubensparren s", "m")], (v) => {
        const g = satteldachgaube(v.wangeH, v.wangeL, v.firstL, v.traufL, v.gaubeSparren);
        return [zeile("Hauptdachneigung", g.neigung, "°", "α = arctan(h / t)", `arctan(${n(v.wangeH)} / ${n(v.wangeL)})`, { stellen: 1 }), zeile("Wangenanschluss", g.anschluss, "m", "a = √(h² + t²)", `√(${n(v.wangeH)}² + ${n(v.wangeL)}²) m`), zeile("Gaubenkehle", g.kehle, "m", "k = √((f − e)² + s²)", `√((${n(v.firstL)} − ${n(v.traufL)})² + ${n(v.gaubeSparren)}²) m`), zeile("Kehlwinkel zum First", g.kehlwinkel, "°", "γ = atan2(s, f − e)", `atan2(${n(v.gaubeSparren)}, ${n(v.firstL - v.traufL)})`, { stellen: 1 }), zeile("Beide Gaubendachflächen", g.dachflaeche, "m²", "A = 2 · (f + e) / 2 · s", `2 · (${n(v.firstL)} + ${n(v.traufL)}) m / 2 · ${n(v.gaubeSparren)} m`, { transfer: "flaeche" })];
      }, "sattelgaube", "Vereinfachtes symmetrisches Modell mit zwei trapezförmigen Dachflächen. Es setzt Firstlänge ≥ Trauflänge voraus. Der Sparren ist hier die schräge Trapezhöhe.", "lf15")}
    </>; break;
    case "uwert": inhalt = <UWertRechner entwurf={entwurf} set={set} compact={compact} />; break;
    case "wasser": inhalt = block("wasser", "Regenwasserabfluss", [feld("regenspende", "Regenspende r", "l/(s·ha)"), feld("wasserFlaeche", "Wirksame Fläche A", "m²"), feld("beiwert", "Abflussbeiwert C", "", "anteil"), feld("leistung", "Leistung je Ablauf qₐ", "l/s")], (v) => {
      const q = regenwasserabfluss(v.regenspende, v.wasserFlaeche, v.beiwert);
      return [zeile("Abfluss Q", q, "l/s", "Q = r · A · C / 10 000", `${n(v.regenspende)} l/(s·ha) · ${n(v.wasserFlaeche)} m² · ${n(v.beiwert)} / 10 000`), zeile("Abläufe rechnerisch nötig", ablaufanzahl(q, v.leistung), "Stück", "n = aufrunden(Q / qₐ)", `aufrunden(${n(q)} l/s / ${n(v.leistung)} l/s)`, { stellen: 0 })];
    }, "wasser", "Regenspende und Abflussbeiwert aus den zutreffenden Vorgaben übernehmen. Die Ablaufanzahl ist ein vereinfachter Kapazitätsvergleich. Leitungsführung, Anstauhöhe und getrennte Notentwässerung sind zusätzlich zu planen.", "lf07"); break;
    case "metall": inhalt = <>
      <Auswahl label="Material (Richtwert für α)" wert={entwurf.felder.materialId} optionen={AUSDEHNUNG} onWert={(id) => { const m = AUSDEHNUNG.find((a) => a.id === id); if (m) set({ felder: { ...entwurf.felder, materialId: id, metallAlpha: String(m.alpha) } }); }} />
      {block("metall", "Thermische Längenänderung", [feld("metallAlpha", "Ausdehnungskoeffizient α", "10⁻⁶/K"), feld("metallLaenge", "Ausgangslänge L", "m"), feld("deltaT", "Temperaturänderung ΔT", "K", "beliebig", "Erwärmung positiv, Abkühlung negativ; 0 K ergibt keine Längenänderung.")], (v) => [zeile("Längenänderung Δl", laengenausdehnung(v.metallAlpha, v.metallLaenge, v.deltaT), "mm", "Δl = α · 10⁻⁶ · L · ΔT · 1000", `${n(v.metallAlpha)} · 10⁻⁶/K · ${n(v.metallLaenge)} m · ${n(v.deltaT)} K · 1000 mm/m`)], "metall", "Positives Ergebnis: Ausdehnung. Negatives Ergebnis: Verkürzung. Maßgebend ist die Bauteiltemperatur und der vom Hersteller angegebene Ausdehnungskoeffizient. Der Materialname wählt einen Richtwert; α bleibt bearbeitbar.", "lf07")}
    </>; break;
    case "scharen": inhalt = <>
      {block("hafte", "Haftabstand", [feld("scharbreite", "Scharbreite b", "m"), feld("hafte", "Hafte im Innenbereich nᵢ", "1/m²"), feld("hafteEck", "Hafte im Eckbereich nₑ", "1/m²")], (v) => [zeile("Abstand innen", haftabstand(v.scharbreite, v.hafte), "m", "aᵢ = 1 / (b · nᵢ)", `1 / (${n(v.scharbreite)} m · ${n(v.hafte)} 1/m²)`, { stellen: 3 }), zeile("Abstand im Eckbereich", haftabstand(v.scharbreite, v.hafteEck), "m", "aₑ = 1 / (b · nₑ)", `1 / (${n(v.scharbreite)} m · ${n(v.hafteEck)} 1/m²)`, { stellen: 3 })], "scharen", "520 mm Scharbreite sind 0,52 m. Benötigte Haftzahlen sind aus dem Befestigungsnachweis zu übernehmen. Dieses Rechenmodell ersetzt keinen Windsognachweis.", "lf12")}
      {block("scharen", "Scharen einteilen", [feld("dachlaenge", "Dachlänge L", "m"), feld("nutzbreite", "Nutzbreite bₙ", "m")], (v) => { const s = scharen(v.dachlaenge, v.nutzbreite); return [zeile("Volle Scharen", s.anzahl, "Stück", "n = abrunden(L / bₙ)", `abrunden(${n(v.dachlaenge)} m / ${n(v.nutzbreite)} m)`, { stellen: 0 }), zeile("Passbreite je Ortgang", s.passbreite, "m", "p = (L − n · bₙ) / 2", `(${n(v.dachlaenge)} − ${s.anzahl} · ${n(v.nutzbreite)}) m / 2`, { stellen: 3 })]; }, "scharen", "Der Rest wird symmetrisch auf zwei Ortgänge verteilt. Falzzugaben und Anschlüsse sind nicht enthalten; die Passbreiten sind für die Ausführung zu prüfen. Modellgrenze: Nutzbreite ≤ Dachlänge.", "lf12")}
      {block("ziegel", "Ziegel je Quadratmeter", [feld("deckbreite", "Deckbreite b", "cm"), feld("decklaenge", "Decklänge l", "cm")], (v) => [zeile("Bedarf ohne Verschnitt", ziegelProQm(v.deckbreite, v.decklaenge), "Stück/m²", "n = 10 000 / (b · l)", `10 000 cm²/m² / (${n(v.deckbreite)} cm · ${n(v.decklaenge)} cm)`, { transfer: "stueck" })], "ziegel", "1 m² = 10 000 cm². Verwende Deckmaße nach Abzug der Überdeckung, keine Außenmaße. Bei variabler Decklänge den gewählten Herstellerwert einsetzen.", "lf02")}
    </>; break;
    case "material": inhalt = block("material", "Materialbedarf", [feld("materialFlaeche", "Wahre Dachfläche A", "m²"), feld("stueck", "Stück je m² n", "St./m²"), feld("verschnitt", "Verschnittzuschlag p", "%", "nichtNegativ")], (v) => [zeile("Benötigte Gesamtmenge", materialbedarf(v.materialFlaeche, v.stueck, v.verschnitt), "Stück", "N = aufrunden(A · n · (1 + p/100))", `aufrunden(${n(v.materialFlaeche)} m² · ${n(v.stueck)} St./m² · (1 + ${n(v.verschnitt)}/100))`, { stellen: 0 })], "material", "Die geneigte Dachfläche kannst du aus „Dachneigung“, den Ziegelbedarf aus „Scharen & Hafte“ übernehmen. Erst das Gesamtergebnis wird auf ganze Stück aufgerundet. Der Zuschlag hängt von Form und Deckung ab.", "lf02"); break;
  }
  return <div className="min-w-0">
    {compact ? <h2 className="text-xl font-semibold">Fachrechner</h2> : <h1 className="text-3xl font-semibold tracking-tight">Fachrechner</h1>}
    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Nachrechnen und den Rechenweg verstehen. Deine Eingaben bleiben beim Wechsel erhalten.</p>
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Rechnerbereiche">
      {RECHNER_TABS.map((t) => <button key={t.id} type="button" aria-pressed={entwurf.tab === t.id} onClick={() => set({ tab: t.id as RechnerTab })} className={buttonClass} style={{ ...buttonStyle, ...(entwurf.tab === t.id ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-text)" } : {}) }}>{t.label}</button>)}
    </div>
    <div className="mt-5 flex flex-col gap-4">{inhalt}</div>
  </div>;
}

function RechenBlock({ id, titel, eingaben, berechne, skizze, hinweis, lf, werte, onWert, transfer, compact }: {
  id: string; titel: string; eingaben: Eingabe[]; berechne: (v: Zahlen) => Zeile[]; skizze: SkizzenArt; hinweis: string; lf: string;
  compact: boolean; werte: Record<string, string>; onWert: (id: string, wert: string) => void; transfer: (art: "flaeche" | "stueck", wert: number) => void;
}) {
  const fehler = Object.fromEntries(eingaben.map((f) => [f.id, eingabeFehler(werte[f.id] ?? "", f.regel)]));
  const zahlen = Object.fromEntries(eingaben.map((f) => [f.id, leseDezimalzahl(werte[f.id] ?? "")!]));
  if (!Object.values(fehler).some(Boolean)) {
    if (id === "schleppgaube") {
      if (zahlen.ue >= zahlen.sges) fehler.ue = "Der Überstand muss kleiner als der Gesamtsparren sein.";
      if (zahlen.beta >= zahlen.alpha) fehler.beta = "Die Gaubenneigung muss in diesem Modell kleiner als die Hauptdachneigung sein.";
    }
    if (id === "sattelgaube" && zahlen.firstL < zahlen.traufL) fehler.firstL = "Dieses Modell benötigt Firstlänge ≥ Trauflänge.";
    if (id === "scharen" && zahlen.nutzbreite > zahlen.dachlaenge) fehler.nutzbreite = "Die Nutzbreite darf in diesem Modell die Dachlänge nicht überschreiten.";
  }
  let resultate: Zeile[] = [], modellFehler: string | undefined;
  if (!Object.values(fehler).some(Boolean)) {
    try {
      resultate = berechne(zahlen);
      if (resultate.some((r) => !Number.isFinite(r.wert))) throw new Error("Die Werte liegen außerhalb des darstellbaren Rechenbereichs.");
    } catch (error) { resultate = []; modellFehler = error instanceof Error ? error.message : "Bitte die eingegebenen Maße prüfen."; }
  }
  const Ueberschrift = compact ? "h3" : "h2";
  return <Block>
    <Ueberschrift className="text-lg font-semibold">{titel}</Ueberschrift>
    <RechenSkizze art={skizze} />
    {eingaben.map((f) => <Feld key={f.id} label={f.label} einheit={f.einheit} wert={werte[f.id] ?? ""} onWert={(v) => onWert(f.id, v)} fehler={fehler[f.id]} hilfe={f.hilfe} />)}
    {modellFehler && <p role="alert" className="mt-3 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--bad, #b42318)", color: "var(--bad, #b42318)" }}>{modellFehler}</p>}
    <div aria-live="polite" aria-atomic="true" className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
      {resultate.length ? resultate.map((r, i) => <div key={r.label} className={i ? "mt-4" : ""}>
        <Ergebnis label={r.label} wert={zahl(r.wert, r.stellen ?? 2)} einheit={r.einheit} gross={i === 0} />
        <p className="mt-1 break-words text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{r.formel}<br />{r.eingesetzt} = {zahl(r.wert, r.stellen ?? 2)} {r.einheit}</p>
        {r.transfer && <button type="button" onClick={() => transfer(r.transfer!, r.wert)} className={`${buttonClass} mt-2`} style={buttonStyle}>{r.transfer === "flaeche" ? "Dachfläche für Material übernehmen" : "Stückbedarf für Material übernehmen"}</button>}
      </div>) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sobald alle Eingaben zum Modell passen, siehst du hier den Rechenweg und das Ergebnis.</p>}
    </div>
    <Hinweis>{hinweis}</Hinweis>
    <Link href={`/lernen/${lf}/ueben?typ=rechnung`} className="mt-3 inline-block rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" style={{ color: "var(--accent)" }}>Passende Rechenaufgaben üben</Link>
  </Block>;
}

function Auswahl({ label, wert, optionen, onWert }: { label: string; wert: string; optionen: { id: string; label: string }[]; onWert: (id: string) => void }) {
  return <label className="block text-sm">{label}<select value={wert} onChange={(e) => onWert(e.target.value)} className="mt-2 w-full rounded-xl border p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2" style={buttonStyle}>{optionen.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
}

function UWertRechner({ entwurf, set, compact }: { entwurf: RechnerEntwurf; set: (patch: Partial<RechnerEntwurf>) => void; compact: boolean }) {
  const schichten = entwurf.schichten;
  const rsi = RSI_WERTE.find((s) => s.id === entwurf.felder.rsiId)?.rsi;
  const fehler = schichten.map((s) => ({ dicke: eingabeFehler(s.dickeCm), lambda: eingabeFehler(s.lambda) }));
  let r: number | undefined, u: number | undefined;
  let meldung = schichten.length ? "" : "Bitte mindestens eine Schicht hinzufügen.";
  if (rsi === undefined) meldung = "Bitte eine Richtung des Wärmestroms wählen.";
  if (!meldung && !fehler.some((f) => f.dicke || f.lambda)) {
    try { r = waermedurchlasswiderstand(schichten.map((s) => ({ name: s.name, dickeCm: leseDezimalzahl(s.dickeCm)!, lambda: leseDezimalzahl(s.lambda)! }))); u = uWert(r, rsi!, RSE); }
    catch (error) { meldung = error instanceof Error ? error.message : "Bitte die Schichten prüfen."; }
  }
  const setSchicht = (index: number, key: "name" | "dickeCm" | "lambda", wert: string) => set({ schichten: schichten.map((s, i) => i === index ? { ...s, [key]: wert } : s) });
  const Ueberschrift = compact ? "h3" : "h2";
  return <Block>
    <Ueberschrift className="text-lg font-semibold">U-Wert des Bauteils</Ueberschrift>
    <RechenSkizze art="uwert" />
    <Auswahl label="Richtung des Wärmestroms" wert={entwurf.felder.rsiId} optionen={RSI_WERTE} onWert={(id) => set({ felder: { ...entwurf.felder, rsiId: id } })} />
    <div className="mt-4 flex flex-col gap-3">{schichten.map((s, i) => <fieldset key={s.id} className="min-w-0 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
      <legend className="px-1 text-sm font-semibold">Schicht {i + 1}</legend>
      <label className="block text-sm">Bezeichnung<input value={s.name} onChange={(e) => setSchicht(i, "name", e.target.value)} aria-label={`Name Schicht ${i + 1}`} className="mt-1 w-full rounded-lg border p-2 text-base" style={buttonStyle} /></label>
      <Feld label={`Dicke Schicht ${i + 1}`} einheit="cm" wert={s.dickeCm} onWert={(v) => setSchicht(i, "dickeCm", v)} fehler={fehler[i].dicke} />
      <Feld label={`λ Schicht ${i + 1}`} einheit="W/(m·K)" wert={s.lambda} onWert={(v) => setSchicht(i, "lambda", v)} fehler={fehler[i].lambda} />
      {!fehler[i].dicke && !fehler[i].lambda && <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>R{i + 1} = d / λ = ({s.dickeCm} cm / 100) / {s.lambda} W/(m·K) = {zahl(leseDezimalzahl(s.dickeCm)! / 100 / leseDezimalzahl(s.lambda)!, 3)} m²K/W</p>}
      <button type="button" className={`${buttonClass} mt-2`} style={buttonStyle} onClick={() => set({ schichten: schichten.filter((_, j) => j !== i) })} aria-label={`Schicht ${i + 1} entfernen`}>Schicht entfernen</button>
    </fieldset>)}</div>
    <button type="button" className={`${buttonClass} mt-3`} style={buttonStyle} onClick={() => set({ schichten: [...schichten, { id: crypto.randomUUID(), name: "Neue Schicht", dickeCm: "", lambda: "" }] })}>Schicht hinzufügen</button>
    {meldung && <p role="alert" className="mt-3 text-sm" style={{ color: "var(--bad, #b42318)" }}>{meldung}</p>}
    <div aria-live="polite" className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
      {r !== undefined && u !== undefined ? <>
        <Ergebnis label="R der Schichten" wert={zahl(r, 3)} einheit="m²K/W" />
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>R = Σ(d / λ) = {schichten.map((s) => `${zahl(leseDezimalzahl(s.dickeCm)! / 100 / leseDezimalzahl(s.lambda)!, 3)}`).join(" + ")} = {zahl(r, 3)} m²K/W</p>
        <div className="mt-3"><Ergebnis label="U-Wert" wert={zahl(u, 3)} einheit="W/(m²·K)" gross /></div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>U = 1 / (Rsi + ΣR + Rse)<br />1 / ({zahl(rsi!, 2)} + {zahl(r, 3)} + {zahl(RSE, 2)}) m²K/W = {zahl(u, 3)} W/(m²·K)</p>
      </> : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bitte alle Schichten vollständig eingeben. Eine ungültige Schicht wird nicht aus der Rechnung weggelassen.</p>}
    </div>
    <Hinweis>Dicke in Zentimetern eingeben: 20 cm = 0,20 m. λ bezeichnet die Wärmeleitfähigkeit. Dieses eindimensionale Schichtenmodell enthält keine Wärmebrücken, Befestigungen oder Luftschichten; dafür ist ein gesonderter Nachweis nötig.</Hinweis>
    <Link href="/lernen/lf10/ueben?typ=rechnung" className="mt-3 inline-block text-sm font-medium underline underline-offset-4" style={{ color: "var(--accent)" }}>Passende Rechenaufgaben üben</Link>
  </Block>;
}
