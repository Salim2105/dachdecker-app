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
  gratsparren,
  kehle,
  schleppgaube,
  satteldachgaube,
  haftabstand,
  scharen,
  ziegelProQm,
  zahl,
  RSI_WERTE,
  RSE,
  AUSDEHNUNG,
  type Schicht,
} from "@/lib/rechner";
import { Feld, Ergebnis, Hinweis, Block, num } from "@/components/rechner/Feld";

const TABS = [
  { id: "dach", label: "Dachneigung" },
  { id: "grat", label: "Grat & Kehle" },
  { id: "gaube", label: "Gauben" },
  { id: "uwert", label: "U-Wert" },
  { id: "wasser", label: "Entwässerung" },
  { id: "metall", label: "Ausdehnung" },
  { id: "scharen", label: "Scharen & Hafte" },
  { id: "material", label: "Material" },
];

export function Rechner() {
  const [tab, setTab] = useState("dach");

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight">Fachrechner</h1>
      <p className="mt-1 text-[15px]" style={{ color: "var(--text-muted)" }}>
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
        {tab === "grat" && <GratRechner />}
        {tab === "gaube" && <GaubenRechner />}
        {tab === "uwert" && <UWertRechner />}
        {tab === "wasser" && <WasserRechner />}
        {tab === "metall" && <MetallRechner />}
        {tab === "scharen" && <ScharenRechner />}
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

function GratRechner() {
  const [halbeBreite, setHalbeBreite] = useState("4");
  const [neigung, setNeigung] = useState("30");
  const [feld1, setFeld1] = useState("8");
  const [feld2, setFeld2] = useState("6");
  const [hoehe, setHoehe] = useState("2.31");

  const d = gratsparren(num(halbeBreite), num(neigung));
  const k = kehle(num(feld1), num(feld2), num(hoehe));

  return (
    <div className="flex flex-col gap-4">
      <Block>
        <h2 className="mb-2 text-sm font-medium">Gratsparren am Walmdach</h2>
        <Feld label="Halbe Gebäudebreite" einheit="m" wert={halbeBreite} onWert={setHalbeBreite} />
        <Feld label="Dachneigung" einheit="°" wert={neigung} onWert={setNeigung} />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis label="Gratsparren" wert={zahl(d.grat)} einheit="m" gross />
          <Ergebnis label="Flächensparren" wert={zahl(d.sparren)} einheit="m" />
          <Ergebnis label="Firsthöhe" wert={zahl(d.hoehe)} einheit="m" />
          <Ergebnis label="Gratneigung" wert={zahl(d.gratneigung, 1)} einheit="°" />
        </div>
        <Hinweis>
          Der Grat überwindet dieselbe Höhe wie der Flächensparren, legt dafür aber den
          längeren Weg über die Ecke zurück — seine Neigung ist deshalb immer flacher als
          die Dachneigung. Wer den Gratsparren mit der Dachneigung ablängt, schneidet zu kurz.
        </Hinweis>
      </Block>

      <Block>
        <h2 className="mb-2 text-sm font-medium">Kehllänge</h2>
        <Feld label="Feldbreite 1" einheit="m" wert={feld1} onWert={setFeld1} />
        <Feld label="Feldbreite 2" einheit="m" wert={feld2} onWert={setFeld2} />
        <Feld label="Firsthöhe über Traufe" einheit="m" wert={hoehe} onWert={setHoehe} />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis label="Kehllänge" wert={zahl(k.laenge)} einheit="m" gross />
          <Ergebnis label="Kehlneigung" wert={zahl(k.neigung, 1)} einheit="°" />
        </div>
        <Hinweis>
          k = √((f₁/2)² + (f₂/2)² + h²). Dieselbe Raumdiagonale wie beim Grat, nur nach
          innen. Bei gleich breiten Feldern sind Grat und Kehle exakt gleich lang.
        </Hinweis>
      </Block>
    </div>
  );
}

function GaubenRechner() {
  const [sges, setSges] = useState("5");
  const [ue, setUe] = useState("0.5");
  const [alpha, setAlpha] = useState("45");
  const [beta, setBeta] = useState("15");
  const [wangeH, setWangeH] = useState("1.2");
  const [wangeL, setWangeL] = useState("1.2");
  const [firstL, setFirstL] = useState("3");
  const [traufL, setTraufL] = useState("1.5");
  const [gaubeSparren, setGaubeSparren] = useState("1.4");

  const s = schleppgaube(num(sges), num(ue), num(alpha), num(beta));
  const g = satteldachgaube(
    num(wangeH),
    num(wangeL),
    num(firstL),
    num(traufL),
    num(gaubeSparren),
  );

  return (
    <div className="flex flex-col gap-4">
      <Block>
        <h2 className="mb-2 text-sm font-medium">Schleppdachgaube</h2>
        <Feld label="Sparrenlänge gesamt" einheit="m" wert={sges} onWert={setSges} />
        <Feld label="Dachüberstand" einheit="m" wert={ue} onWert={setUe} />
        <Feld label="Neigung Hauptdach" einheit="°" wert={alpha} onWert={setAlpha} />
        <Feld label="Neigung Gaube" einheit="°" wert={beta} onWert={setBeta} />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis label="Gaubentiefe" wert={zahl(s.tiefe)} einheit="m" gross />
          <Ergebnis label="Gaubenhöhe am Anschluss" wert={zahl(s.hoehe)} einheit="m" />
          <Ergebnis label="Anschlusslänge" wert={zahl(s.anschluss)} einheit="m" />
          <Ergebnis label="Vordere Sichthöhe" wert={zahl(s.sichthoehe)} einheit="m" />
          <Ergebnis label="Wangenfläche (je Seite)" wert={zahl(s.wange)} einheit="m²" />
        </div>
        <Hinweis>
          Buch S. 540. Die Gaubenhöhe kommt von der Neigung des HAUPTdachs: Über die
          Gaubentiefe hinweg steigt das Hauptdach um t · tan α. Die flachere Gaubenneigung
          bestimmt nur, wie weit die Gaube nach vorn reicht.
        </Hinweis>
      </Block>

      <Block>
        <h2 className="mb-2 text-sm font-medium">Satteldachgaube</h2>
        <Feld label="Wangenhöhe" einheit="m" wert={wangeH} onWert={setWangeH} />
        <Feld label="Wangenlänge" einheit="m" wert={wangeL} onWert={setWangeL} />
        <Feld label="Firstlänge" einheit="m" wert={firstL} onWert={setFirstL} />
        <Feld label="Trauflänge" einheit="m" wert={traufL} onWert={setTraufL} />
        <Feld label="Sparrenlänge Gaube" einheit="m" wert={gaubeSparren} onWert={setGaubeSparren} />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis label="Kehllänge" wert={zahl(g.kehle)} einheit="m" gross />
          <Ergebnis label="Neigung Hauptdach" wert={zahl(g.neigung, 1)} einheit="°" />
          <Ergebnis label="Anschlusslänge Wange" wert={zahl(g.anschluss)} einheit="m" />
          <Ergebnis label="Kehlwinkel" wert={zahl(g.kehlwinkel, 1)} einheit="°" />
          <Ergebnis label="Gaubendachfläche" wert={zahl(g.dachflaeche)} einheit="m²" />
        </div>
        <Hinweis>
          Buch S. 541. First und Traufe der Gaube sind unterschiedlich lang — das Gaubendach
          ist je Seite ein Trapez, und die Kehle läuft schräg über die Differenz.
        </Hinweis>
      </Block>
    </div>
  );
}

function ScharenRechner() {
  const [scharbreite, setScharbreite] = useState("0.52");
  const [hafte, setHafte] = useState("4");
  const [hafteEck, setHafteEck] = useState("6.4");
  const [dachlaenge, setDachlaenge] = useState("12");
  const [nutzbreite, setNutzbreite] = useState("0.525");
  const [deckbreite, setDeckbreite] = useState("20");
  const [decklaenge, setDecklaenge] = useState("34");

  const sch = scharen(num(dachlaenge), num(nutzbreite));

  return (
    <div className="flex flex-col gap-4">
      <Block>
        <h2 className="mb-2 text-sm font-medium">Haftabstand</h2>
        <Feld label="Scharbreite" einheit="m" wert={scharbreite} onWert={setScharbreite} schritt="0.01" />
        <Feld label="Hafte je m² (Fläche)" einheit="St/m²" wert={hafte} onWert={setHafte} schritt="0.1" />
        <Feld label="Hafte je m² (Rand/Ecke)" einheit="St/m²" wert={hafteEck} onWert={setHafteEck} schritt="0.1" />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis
            label="Abstand in der Fläche"
            wert={zahl(haftabstand(num(scharbreite), num(hafte)) * 100, 1)}
            einheit="cm"
            gross
          />
          <Ergebnis
            label="Abstand am Rand"
            wert={zahl(haftabstand(num(scharbreite), num(hafteEck)) * 100, 1)}
            einheit="cm"
          />
          <Ergebnis
            label="Laufende Meter Schar je m²"
            wert={zahl(num(scharbreite) > 0 ? 1 / num(scharbreite) : 0)}
            einheit="lfm"
          />
        </div>
        <Hinweis>
          1 / Scharbreite ergibt die laufenden Meter Schar auf einem Quadratmeter; darauf
          werden die geforderten Hafte verteilt. Am Rand und in der Ecke greift der Windsog
          stärker an — dort sind mehr Hafte je m² gefordert, der Abstand rückt zusammen.
        </Hinweis>
      </Block>

      <Block>
        <h2 className="mb-2 text-sm font-medium">Scharen einteilen</h2>
        <Feld label="Dachlänge (Traufe)" einheit="m" wert={dachlaenge} onWert={setDachlaenge} />
        <Feld label="Nutzbare Scharbreite" einheit="m" wert={nutzbreite} onWert={setNutzbreite} schritt="0.005" />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis label="Volle Scharen" wert={String(sch.anzahl)} einheit="Stück" gross />
          <Ergebnis label="Passbreite je Ortgang" wert={zahl(sch.passbreite * 100, 1)} einheit="cm" />
        </div>
        <Hinweis>
          Die nutzbare Breite ist kleiner als die Zuschnittbreite — die Falze zehren den
          Rest auf. Der Überhang wird auf beide Ortgänge verteilt, darum halbiert.
        </Hinweis>
      </Block>

      <Block>
        <h2 className="mb-2 text-sm font-medium">Ziegel je m²</h2>
        <Feld label="Deckbreite" einheit="cm" wert={deckbreite} onWert={setDeckbreite} schritt="0.5" />
        <Feld label="Decklänge (Lattweite)" einheit="cm" wert={decklaenge} onWert={setDecklaenge} schritt="0.5" />
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Ergebnis label="Bedarf" wert={zahl(ziegelProQm(num(deckbreite), num(decklaenge)), 1)} einheit="St/m²" gross />
        </div>
        <Hinweis>
          10000 / (Deckbreite · Decklänge). Deckbreite und Decklänge sind die überdeckten
          Maße, nicht die Ziegelmaße — die Überdeckung ist bereits abgezogen. Den Wert
          kannst du direkt im Reiter „Material“ weiterverwenden.
        </Hinweis>
      </Block>
    </div>
  );
}
