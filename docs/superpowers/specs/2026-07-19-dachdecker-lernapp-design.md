# Design-Spec: Dachdecker Gesellenprüfung — Lernapp

**Datum:** 2026-07-19
**Status:** Entwurf zur Abnahme
**Zweck:** Premium-Lernapp zur Vorbereitung auf die Dachdecker-Gesellenprüfung.
Rein privater Gebrauch (nicht zur Veröffentlichung).

---

## 1. Ziel & Kontext

Der Nutzer (Dachdecker-Azubi, Prüfung in Eslohe/Sauerland) will bestmöglich auf die
Gesellenprüfung vorbereitet sein. Die App soll umfassend sein — „vom Material bis zum Bau" —
und sich premium anfühlen (Meisterwerk-Anspruch).

- **Plattform:** Next.js (App Router) + TypeScript, PWA, mobile-first, läuft offline auf dem iPad.
- **Kein Backend:** Fortschritt in `localStorage`, keine Accounts, keine Datenbank.
- **Inhalte:** versionierte JSON-Dateien in `content/`, kein CMS.
- **Nutzung:** ausschließlich privat. Falls später doch Veröffentlichung gewünscht wird,
  muss der Inhalt vorher auf § 5 UrhG-Werke + Eigenformulierungen reduziert werden (siehe §3).

---

## 2. Prüfungsstruktur (Orientierung)

- Prüfungsbereiche: Dachdeckungs-/Außenwandbekleidungstechnik 30 %, Abdichtungstechnik 25 %,
  Außenwandbekleidung 25 %, WiSo 20 %.
- Schriftlich z. B. 150 min (Dach-/Wandtechnik), 60 min (Abdichtung).
- Praktische Arbeitsaufgabe bis 12–14 h + situatives Fachgespräch bis 20 min.
- Zwischenprüfung: LF 1–9 relevant.
- Curriculum: 17 Lernfelder + WiSo (KMK-Rahmenlehrplan 2016). LF 7 fachlich vor LF 8–10
  (nur als empfohlene Reihenfolge anzeigen, nichts sperren).

---

## 3. Inhalts-Strategie & Rechtslage

Quellenbasis: kuratierter Forschungsbericht in `quellen/00-quellen-index.md` (Teil 1 + 2).

**Rechtslage (privater Gebrauch, § 53 UrhG):** Da die App rein privat bleibt, dürfen die
frei zugänglichen Materialien direkt als Lerngrundlage genutzt werden (wie eigene Lernzettel
aus einem Fachbuch). Trotzdem gilt aus Qualitäts- und Zukunftssicherungsgründen:

- **Fakten/Werte** (Regeldachneigung, w/z-Wert, Schweißtemperaturen, Formeln…) werden aus den
  Quellen entnommen, **gegen die Quelle verifiziert**, und in **eigenen Formulierungen** als
  Aufgaben gestellt. Fakten selbst sind nicht urheberrechtlich geschützt.
- **Amtliche Werke** (§ 5 UrhG: DachAusbV, KMK-Rahmenlehrplan, Ausbildungsrahmenplan, DWD-Lastzonen)
  bilden das Gerüst und dürfen auch wörtlich genutzt werden.
- **Zeichnungen** werden als **eigene SVGs** neu erstellt (fremde Prospekt-Grafiken werden nicht
  nachgepaust). Vorteil: sauber, interaktiv, passt ins App-Design.
- **Jede Aufgabe** trägt `quelle` + `konfidenz` (`hoch | mittel | pruefen`). Einträge mit
  `pruefen` erscheinen nicht in der App, bis verifiziert.
- **Sicherheitsthemen** (Absturz, Strom, Gefahrstoffe): im Zweifel weglassen statt raten.

---

## 4. Aufgabentypen

Bestehend (`content/schema.ts`): `mc`, `cloze`, `calc`, `diagram`.
Neu ergänzt: `draw`, `fachbegriff`. Zusätzlich Theorie-Karten (Mikro-Lektionen).

1. **`mc`** — Multiple Choice (eine/mehrere richtig) mit Erklärung.
2. **`cloze`** — Lückentext mit akzeptierten Alternativschreibweisen.
3. **`calc`** — parametrisierte Rechenaufgabe. Parameter werden zur Laufzeit im definierten
   Bereich randomisiert, Lösung aus Formel berechnet (mathjs). Lösungsweg **schrittweise**.
   Beispiele: Fläche, U-Wert (R=d/λ), Dachneigung, Sparrenlänge (Pythagoras), Rinnendimensionierung,
   Materialbedarf/Verschnitt.
4. **`diagram`** — vorhandene SVG-Grafik, Bauteile **benennen/zuordnen** (data-id → Bezeichnung).
   SVGs selbst erstellt.
5. **`draw`** ⭐ (Signature-Feature) — **Aufgabe → selbst zeichnen → Lösung aufdecken:**
   - App zeigt eine Zeichenaufgabe (Text + optional eine Vorgabe-Skizze, z. B. ein Grundriss).
   - Nutzer zeichnet auf Papier/iPad (außerhalb der App).
   - Button „Lösung zeigen" blendet eine saubere **Muster-SVG** + **Schritt-für-Schritt-Erklärung** ein.
   - **Selbstbewertung:** *richtig / fast / nochmal* → fließt in den Fortschritt (Spaced Repetition
     der schwachen Aufgaben).
   - Beispiele: Dachausmittlung (Grat-/Kehl-/Firstlinien über Winkelhalbierende), Kehlkonstruktion,
     Deckbild, Blech-Abwicklung, Schichtenaufbau Warmdach.
6. **`fachbegriff`** — Karteikarte für Fachdeutsch (Begriff ⇄ Erklärung/Bild), Spaced Repetition.
   Optional Komposita-Zerlegung (Dampf-brems-folie).

**Theorie-Karten:** kurze Mikro-Lektionen pro Thema (Text + optional eigene SVG), vor den Übungen.

---

## 5. Screens & Navigation

Bottom-Nav (mobile): Start · Lernen · Rechner · Fortschritt.

1. **Start / Dashboard** — Prüfungs-Countdown, „Weiterlernen"-Button (letzte Position),
   Fortschritt gesamt, Schnellstart Prüfungssimulation.
2. **Lernfelder-Übersicht** — alle 17 LF + WiSo, gruppiert nach Lehrjahr, Fortschrittsbalken je LF.
   Empfohlene Reihenfolge sichtbar (LF 7 vor 8–10), nichts gesperrt.
3. **Lernfeld-Detail** — Themenliste; je Thema Theorie-Karten dann Übungen. Fortschritt je Thema.
4. **Übungs-Session** — Aufgabe → antworten → **sofort Feedback + Erklärung + Quelle** →
   nächste Aufgabe. Fortschrittsanzeige, Abbrechen/Weiter.
5. **Rechner** — eigenständige Kalkulatoren: U-Wert, Fläche/Materialbedarf, Dachneigung,
   Rinnendimensionierung. Frei nutzbar (auch außerhalb von Aufgaben).
6. **Fortschritt / Statistik** — pro LF, schwache Themen, fällige Wiederholungen.
7. **Prüfungssimulation** — gemischte Aufgaben mehrerer Lernfelder **mit Timer**
   (realistische Dauer), danach Auswertung + Schwachstellen. Zwischenprüfungsmodus: LF 1–9 gemischt.

---

## 6. Design

**Richtung B · „Schiefer & Kupfer"** — dunkler Standard + heller Lesemodus (umschaltbar,
Einstellung in localStorage; respektiert auch System-Präferenz beim ersten Start).

- **Dunkel (Standard):** Anthrazit/Schiefer-Grund (~#23262b), dunklere Ebenen (~#1a1c20),
  Kupfer-Akzent (~#c07d4a), warmes Off-White für Text (~#ece7df), gedämpftes Grau für Sekundärtext.
- **Hell (Lesemodus):** warmes Off-White (~#faf7f2 / #fff), Kupfer/Ziegel-Akzent, dunkler Text.
- **Typografie:** kräftige, gut lesbare Sans; klare Hierarchie; Zahlen in Rechenaufgaben groß/prominent.
- **Prinzipien:** flach, hochwertig, ruhig; großzügiger Weißraum; Fortschritt sichtbar; edle SVGs.
- **Semantik:** richtig = grünlich, falsch = rötlich, Akzent/aktiv = Kupfer.
- Design-Tokens als CSS-Variablen, ein zentrales Theme, beide Modi aus denselben Tokens.

---

## 7. Datenmodell (Schema-Erweiterung)

`content/schema.ts` wird erweitert:

- `Aufgabe`-Union um `DrawAufgabe` (`typ: "draw"`, `aufgabentext`, optional `vorgabeSvg`,
  `loesungSvg` (Pfad zu eigener SVG), `schritte: string[]` Erklärung, `selbstbewertung: true`).
- `FachbegriffAufgabe` (`typ: "fachbegriff"`, `begriff`, `erklaerung`, optional `bildSvg`,
  optional `bestandteile: string[]`).
- `Lektion` (Theorie-Karte: `id`, `lernfeld`, `thema`, `titel`, `inhalt` (Markdown/Textblöcke),
  optional `svg`, `quelle`).
- Fortschritt-Typ in localStorage: pro Aufgabe {gesehen, richtig/falsch/teilweise, letzteWiederholung,
  faelligkeit} für Spaced Repetition.

Content-Ablage: `content/lfXX/aufgaben.json`, `content/lfXX/lektionen.json`,
`content/lfXX/svg/*.svg`. Fachbegriffe evtl. zentral `content/fachbegriffe.json`.

---

## 8. Baureihenfolge (Weg A: Maschine zuerst)

1. **App-Maschine + Design-System** (Schiefer & Kupfer, dunkel + hell), App-Shell, Navigation,
   Schema-Erweiterung, Fortschritts-Store (localStorage).
2. **Alle 6 Aufgabentypen** als funktionierende Renderer, inkl. `draw` (Lösung aufdecken +
   Selbstbewertung) und `calc` (mathjs, Schrittlösung).
3. **LF 1 komplett als Showcase** — Theorie-Karten + Aufgaben aller Typen mit echtem Stoff.
4. **LF 2–6** mit verifiziertem Stoff aus den Quellen füllen.
5. **Rechner-Screen** (U-Wert, Fläche, Dachneigung, Rinne).
6. **Prüfungssimulation** (Timer, Auswertung) — nach LF 1–6.
7. **LF 7–17 + WiSo** sukzessive; Fachbegriff-Trainer wächst mit.

**MVP-Definition:** Punkte 1–3 = spielbarer, premium-fühlender Kern mit LF 1. Danach iterativ Inhalte.

---

## 9. Qualität & Verifikation

- Jeder Fachwert gegen amtliche/Verbands-Quelle geprüft; veraltete Quellen (z. B. EnEV statt GEG)
  durch aktuelle ersetzen.
- Vor UI-Abnahme: Dev-Server starten, Features im Browser durchklicken, auch Randfälle
  (leerer Fortschritt, `pruefen`-Filter, calc-Randbereiche, Theme-Umschaltung).
- Fehlt zu einem LF eine freie Primärquelle: auf ZVDH-Erläuterungen / BauNetz Wissen zurückgreifen,
  nichts erfinden.

---

## 10. Offene Punkte / später

- Genaue reale Prüfungszeiten je Simulationsmodus final aus HWK-Ordnung bestätigen.
- Umfang Fachdeutsch-Modul (nur Kernbegriffe vs. breit) nach LF 1–6.
- Optionaler Export/Backup des Fortschritts (localStorage ist gerätegebunden).
