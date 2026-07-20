"use client";
import { useState } from "react";
import {
  wahreDachflaeche,
  sparrenlaenge,
  firsthoehe,
  neigungAusMassen,
  gradZuProzent,
  waermedurchlasswiderstand,
  uWert,
  regenwasserabfluss,
  laengenausdehnung,
  materialbedarf,
  zahl,
  RSI_WERTE,
  RSE,
  AUSDEHNUNG,
  type Schicht,
} from "@/lib/rechner";
import { Feld, Ergebnis, Hinweis, Block, num } from "@/components/rechner/Feld";

const TABS = [
  { id: "dach", label: "Dachneigung" },
  { id: "uwert", label: "U-Wert" },
  { id: "wasser", label: "Entwässerung" },
  { id: "metall", label: "Ausdehnung" },
  { id: "material", label: "Material" },
];

export function Rechner() {
  const [tab, setTab] = useState("dach");

  return (
    <div>
      <h1 className="text-xl font-medium">Rechner</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Die Formeln aus den Lernfeldern — zum Nachrechnen und Kontrollieren.
      </p>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-shrink-0 rounded-full border px-3 py-1.5 text-sm"
            style={{
              borderColor: tab === t.id ? "var(--accent)" : "var(--border)",
              background: tab === t.id ? "var(--accent)" : "transparent",
              color: tab === t.id ? "var(--accent-text)" : "var(--text-muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "dach" && <DachRechner />}
        {tab === "uwert" && <UWertRechner />}
        {tab === "wasser" && <WasserRechner />}
        {tab === "metall" && <MetallRechner />}
        {tab === "material" && <MaterialRechner />}
      </div>
    </div>
  );
}

function DachRechner() {
  const [neigung, setNeigung] = useState("30");
  const [grundflaeche, setGrundflaeche] = useState("100");
  const [halbeBreite, setHalbeBreite] = useState("4");
  const [hoehe, setHoehe] = useState("2.31");
  const [breite, setBreite] = useState("4");

  const a = num(neigung);

  return (
    <div className="flex flex-col gap-4">
      <Block>
        <h2 className="mb-2 text-sm font-medium">Wahre Dachfläche und Sparren</h2>
        <Feld label="Dachneigung" einheit="°" wert={neigung} onWert={setNeigung} />
        <Feld label="Grundrissfläche" einheit="m²" wert={grundflaeche} onWert={setGrundflaeche} />
        <Feld label="Halbe Gebäudebreite" einheit="m" wert={halbeBreite} onWert={setHalbeBreite} />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis
            label="Wahre Dachfläche"
            wert={zahl(wahreDachflaeche(num(grundflaeche), a))}
            einheit="m²"
            gross
          />
          <Ergebnis label="Sparrenlänge" wert={zahl(sparrenlaenge(num(halbeBreite), a))} einheit="m" />
          <Ergebnis label="Firsthöhe über Traufe" wert={zahl(firsthoehe(num(halbeBreite), a))} einheit="m" />
          <Ergebnis label="Neigung in Prozent" wert={zahl(gradZuProzent(a), 1)} einheit="%" />
        </div>
        <Hinweis>
          Wahre Dachfläche = Grundrissfläche / cos α. Sparrenlänge = halbe Breite / cos α,
          Firsthöhe = halbe Breite · tan α. Die Grundrissfläche ist die Fläche von oben
          gesehen — nicht die geneigte Fläche.
        </Hinweis>
      </Block>

      <Block>
        <h2 className="mb-2 text-sm font-medium">Neigung aus Höhe und Länge</h2>
        <Feld label="Höhe" einheit="m" wert={hoehe} onWert={setHoehe} />
        <Feld label="Waagerechte Länge" einheit="m" wert={breite} onWert={setBreite} />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis
            label="Dachneigung"
            wert={zahl(neigungAusMassen(num(hoehe), num(breite)), 1)}
            einheit="°"
            gross
          />
          <Ergebnis
            label="entspricht"
            wert={zahl(gradZuProzent(neigungAusMassen(num(hoehe), num(breite))), 1)}
            einheit="%"
          />
        </div>
        <Hinweis>α = arctan(Höhe / Länge). 45° entsprechen genau 100 %.</Hinweis>
      </Block>
    </div>
  );
}

const START_SCHICHTEN: Schicht[] = [
  { name: "Zwischensparrendämmung", dickeCm: 20, lambda: 0.035 },
  { name: "Holzfaserplatte", dickeCm: 2.4, lambda: 0.13 },
];

function UWertRechner() {
  const [schichten, setSchichten] = useState<Schicht[]>(START_SCHICHTEN);
  const [rsiId, setRsiId] = useState("aufwaerts");

  const rsi = RSI_WERTE.find((r) => r.id === rsiId)?.rsi ?? 0.1;
  const r = waermedurchlasswiderstand(schichten);
  const u = uWert(r, rsi, RSE);

  const setze = (i: number, feld: keyof Schicht, wert: string) => {
    setSchichten((prev) =>
      prev.map((s, j) =>
        j !== i ? s : { ...s, [feld]: feld === "name" ? wert : num(wert) },
      ),
    );
  };

  return (
    <Block>
      <h2 className="mb-2 text-sm font-medium">U-Wert des Bauteils</h2>

      <label className="mb-3 block">
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Bauteil
        </span>
        <select
          value={rsiId}
          onChange={(e) => setRsiId(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
        >
          {RSI_WERTE.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-3">
        {schichten.map((s, i) => (
          <div key={i} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <input
                value={s.name}
                onChange={(e) => setze(i, "name", e.target.value)}
                aria-label={`Name Schicht ${i + 1}`}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
              />
              <button
                onClick={() => setSchichten((p) => p.filter((_, j) => j !== i))}
                aria-label={`Schicht ${i + 1} entfernen`}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>
            <Feld
              label="Dicke"
              einheit="cm"
              wert={String(s.dickeCm)}
              onWert={(v) => setze(i, "dickeCm", v)}
            />
            <Feld
              label="λ (Wärmeleitfähigkeit)"
              einheit="W/mK"
              wert={String(s.lambda)}
              onWert={(v) => setze(i, "lambda", v)}
              schritt="0.001"
            />
            <div className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
              R = {zahl(s.lambda > 0 ? s.dickeCm / 100 / s.lambda : 0, 3)} m²K/W
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setSchichten((p) => [...p, { name: "Neue Schicht", dickeCm: 0, lambda: 0.04 }])}
        className="mt-3 w-full rounded-lg border py-2 text-sm"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
      >
        Schicht hinzufügen
      </button>

      <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <Ergebnis label="R der Schichten" wert={zahl(r, 3)} einheit="m²K/W" />
        <Ergebnis label={`Rsi + Rse`} wert={zahl(rsi + RSE, 2)} einheit="m²K/W" />
        <Ergebnis label="U-Wert" wert={zahl(u, 3)} einheit="W/m²K" gross />
      </div>

      <Hinweis>
        R = d / λ je Schicht, U = 1 / (Rsi + ΣR + Rse). Rse ist mit {zahl(RSE, 2)} angesetzt,
        Rsi je nach Richtung des Wärmestroms. Das sind Richtwerte für den Überschlag —
        ruhende Luftschichten, Wärmebrücken und Befestigungen sind hier nicht enthalten.
      </Hinweis>
    </Block>
  );
}

function WasserRechner() {
  const [regenspende, setRegenspende] = useState("300");
  const [flaeche, setFlaeche] = useState("200");
  const [beiwert, setBeiwert] = useState("1");
  const [leistung, setLeistung] = useState("5");

  const q = regenwasserabfluss(num(regenspende), num(flaeche), num(beiwert));
  const gullys = num(leistung) > 0 ? Math.ceil(q / num(leistung)) : 0;

  return (
    <Block>
      <h2 className="mb-2 text-sm font-medium">Regenwasserabfluss</h2>
      <Feld label="Regenspende r" einheit="l/s·ha" wert={regenspende} onWert={setRegenspende} />
      <Feld label="Wirksame Fläche A" einheit="m²" wert={flaeche} onWert={setFlaeche} />
      <Feld label="Abflussbeiwert C" einheit="" wert={beiwert} onWert={setBeiwert} schritt="0.1" />
      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <Ergebnis label="Abfluss Q" wert={zahl(q)} einheit="l/s" gross />
      </div>

      <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <Feld label="Leistung je Ablauf" einheit="l/s" wert={leistung} onWert={setLeistung} />
        <Ergebnis label="Abläufe nötig" wert={String(gullys)} einheit="Stück" />
      </div>

      <Hinweis>
        Q = r · A · C / 10000. Die Regenspende hängt vom Ort ab und wird der Berechnungsregen-
        Tabelle entnommen. Zusätzlich zur Hauptentwässerung ist eine Notentwässerung
        erforderlich — die wird getrennt bemessen und ist hier nicht enthalten.
      </Hinweis>
    </Block>
  );
}

function MetallRechner() {
  const [materialId, setMaterialId] = useState("titanzink");
  const [alpha, setAlpha] = useState("22");
  const [laenge, setLaenge] = useState("10");
  const [deltaT, setDeltaT] = useState("50");

  const waehle = (id: string) => {
    setMaterialId(id);
    const m = AUSDEHNUNG.find((x) => x.id === id);
    if (m) setAlpha(String(m.alpha));
  };

  return (
    <Block>
      <h2 className="mb-2 text-sm font-medium">Thermische Längenänderung</h2>

      <label className="mb-2 block">
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Material
        </span>
        <select
          value={materialId}
          onChange={(e) => waehle(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
        >
          {AUSDEHNUNG.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <Feld label="α" einheit="10⁻⁶/K" wert={alpha} onWert={setAlpha} schritt="0.1" />
      <Feld label="Länge L" einheit="m" wert={laenge} onWert={setLaenge} />
      <Feld label="Temperaturdifferenz ΔT" einheit="K" wert={deltaT} onWert={setDeltaT} />

      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <Ergebnis
          label="Längenänderung Δl"
          wert={zahl(laengenausdehnung(num(alpha), num(laenge), num(deltaT)))}
          einheit="mm"
          gross
        />
      </div>

      <Hinweis>
        Δl = α · L · ΔT. Die Werte für α sind Richtwerte — maßgebend ist die Angabe des
        Herstellers. ΔT ist die Spanne zwischen kältestem und heißestem Zustand des Bauteils,
        nicht die Lufttemperatur: Dunkles Metall wird im Sommer deutlich wärmer als die Luft.
        Deshalb brauchen lange Scharen und Rinnen Dehnungsausgleich.
      </Hinweis>
    </Block>
  );
}

function MaterialRechner() {
  const [flaeche, setFlaeche] = useState("100");
  const [stueck, setStueck] = useState("12.5");
  const [verschnitt, setVerschnitt] = useState("5");

  return (
    <Block>
      <h2 className="mb-2 text-sm font-medium">Materialbedarf</h2>
      <Feld label="Wahre Dachfläche" einheit="m²" wert={flaeche} onWert={setFlaeche} />
      <Feld label="Stück je m²" einheit="St/m²" wert={stueck} onWert={setStueck} schritt="0.1" />
      <Feld label="Verschnitt" einheit="%" wert={verschnitt} onWert={setVerschnitt} />
      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <Ergebnis
          label="Benötigt"
          wert={String(materialbedarf(num(flaeche), num(stueck), num(verschnitt)))}
          einheit="Stück"
          gross
        />
      </div>
      <Hinweis>
        Immer aufgerundet. Wichtig: Gerechnet wird mit der wahren Dachfläche, nicht mit der
        Grundrissfläche — die Umrechnung machst du im Reiter „Dachneigung“. Der Bedarf je m²
        hängt vom Modell und von der gewählten Lattweite ab.
      </Hinweis>
    </Block>
  );
}
