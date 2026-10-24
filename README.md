# Dachdecker Lernwerkstatt

Lokale Lernapp für die Dachdecker-Ausbildung mit Mac-Oberfläche und offline nutzbarem Web-Export. Bestehende Lernfelder, Schulbuchbezüge und Aufgaben-IDs bleiben erhalten.

Neu in 0.3: [Illustrierte Lernwelten und gestalteter Lernpfad](docs/gestaltung-0.3.md).

## Die vier Arbeitsbereiche

- **Meine Übersicht:** Weiterlernen, Tagesempfehlung und nächste Wiederholungen.
- **Lernpfad:** Lernfelder, Kapitel und überschaubare Einheiten. LF7 ist das redaktionell ausgearbeitete Muster mit sechs Kapiteln und 18 Einheiten.
- **Übungsraum:** Zuordnungen, Reihenfolgen, Skizzenfehler, Baustellenfälle, freies Üben und digitales Zeichnen oder Papierfoto.
- **Prüfungsraum:** drei LF7-Stufen und gemischtes Training; optionaler Timer, gespeicherte Antworten und nachvollziehbare Punktwertung mit internem Trainingsziel 80 %.

Rechner und Begriffshilfe öffnen sich neben der Aufgabe. Indexierte Lernstände, Prüfungen, Vektorzeichnungen und Fotos liegen auf dem Gerät. Vollständige Sicherungen sind ZIP-Dateien; ältere JSON-Sicherungen bleiben importierbar. Es gibt keine Konten oder Cloud-Synchronisierung.

## Auf dem Mac aktualisieren

Die App vollständig beenden. Im bisherigen Projektordner ausführen:

```bash
cd ~/Downloads/dachdecker-chatgpt
git pull --ff-only
bash scripts/install-mac-neu.sh
```

Das Installationsskript baut **Dachdecker Neu.app** und legt sie unter `~/Applications` ab. Lernstände liegen außerhalb des Programmpakets und bleiben bei einem Update erhalten. Vor größeren Updates unter „Lernstand & Sicherungen“ eine vollständige Sicherung erstellen. Die alte App ist ein eigener Speicherbereich; Daten zwischen beiden Apps über Export/Import übertragen.

Falls eine ältere Version beim Aktualisieren lokale Änderungen an `public/sw.js` meldet: `git restore -- public/sw.js` ausführen und erneut aktualisieren. Die Datei wird generiert und in neuen Versionen nicht mehr von Git verwaltet.

## Entwickeln und prüfen

Node.js 24 LTS und npm verwenden:

```bash
npm ci
npm run dev
```

Die Entwicklungsadresse steht im Terminal. Prüfungen:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run export
```

`npm run export` erzeugt `out/` für die lokale Mac-App. Den normalen Build und den Export nacheinander ausführen, da beide `.next/` verwenden. `npm run desktop:build:neu` baut auf macOS die unsignierte App. HEIC-Fotos werden dort lokal über den fest begrenzten Electron-IPC und `/usr/bin/sips` umgewandelt.

## Inhaltspflege und nächste Abnahme

Die LF7-Einheiten stehen in `content/lf07/lernwerkstatt.ts`. IDs, Inhaltsversion, Lernziel, Quelllektionen, Kontrollaufgaben und Aktivität sind ausdrücklich zugeordnet. Für die übrigen Lernfelder sind Quellenabschnitte und Aufgaben im gemeinsamen Einheitenaufbau verfügbar; die Zuordnungen in `content/curriculum-verknuepfungen.json` können redaktionell geprüft und geändert werden, ohne Aufgabentitel angleichen zu müssen. Die vollständige inhaltliche Überarbeitung der übrigen Lernfelder folgt nach Erprobung des LF7-Musters.

[Funktionsabnahme und Lernendentest](docs/lernwerkstatt-abnahme.md) · [Mac-App](docs/desktop-app.md) · [Quellenstand](docs/FACHLICHER-PRUEFSTAND.md)
