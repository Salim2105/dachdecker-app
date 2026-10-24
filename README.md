# Dachdecker Lernwerkstatt

Lokale Lernapp für die Dachdecker-Ausbildung mit Mac-Oberfläche und offline nutzbarem Web-Export. Bestehende Lernfelder, Schulbuchbezüge und Aufgaben-IDs bleiben erhalten.

Neu in 0.4: [Kurze Einheiten für alle Lernfelder, Fachmathe und Sprachwerkstätten](docs/lernwerkstatt-0.4.md). Die [illustrierten Lernwelten](docs/gestaltung-0.3.md) bleiben die gemeinsame Oberfläche.

Für Kollegen mit iPhone: [Test-Link ohne Anmeldung erstellen](docs/kollegen-probe.md) mit `bash scripts/probe-teilen.sh`.

## Die vier Arbeitsbereiche

- **Meine Übersicht:** Weiterlernen, Tagesempfehlung und nächste Wiederholungen.
- **Lernpfad:** Alle vorhandenen Lernfelder, Anhänge und WiSo mit redigierten kurzen Einheiten. Dazu Fachmathe, Deutsch fürs Handwerk und Baustellenenglisch.
- **Übungsraum:** Zuordnungen, Reihenfolgen, Skizzenfehler, Baustellenfälle, freies Üben und digitales Zeichnen oder Papierfoto.
- **Prüfungsraum:** drei LF7-Stufen und gemischtes Training; optionaler Timer, gespeicherte Antworten und nachvollziehbare Punktwertung mit internem Trainingsziel 80 %.

Rechner und Begriffshilfe öffnen sich neben der Aufgabe. Indexierte Lernstände, Prüfungen, Vektorzeichnungen und Fotos liegen auf dem Gerät. Vollständige Sicherungen sind ZIP-Dateien; ältere JSON-Sicherungen bleiben importierbar. Es gibt keine Konten oder Cloud-Synchronisierung.

## Auf dem Mac aktualisieren

Die App vollständig beenden. Im bisherigen Projektordner ausführen:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
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

Die LF7-Einheiten stehen in `content/lf07/lernwerkstatt.ts`, alle weiteren redigierten Einheiten in `content/lernwerkstatt/`. IDs, Inhaltsversion, Lernziel, Quelllektionen, Kontrollaufgaben und Aktivität sind ausdrücklich zugeordnet. Verknüpfungen dürfen passende Aufgaben aus anderen Lernfeldern verwenden. Quellenlektionen und bestehende Aufgaben-IDs bleiben erhalten. Frühere Notizen und Lernstände sind im Kursarchiv lesbar.

Fachmathe und Sprache stehen in `lib/matheGrundlagen.ts` und `lib/sprachWerkstatt.ts`. `lib/lerndiagnose.ts` erzeugt begründete Übungshinweise aus jüngsten Antworten und genutzten Hilfen. Der [Erprobungsmodus](docs/ERPROBUNG.md) unterstützt echte beobachtete Tests; tatsächliche Erprobungen mit Azubis stehen noch aus.

[Funktionsabnahme und Lernendentest](docs/lernwerkstatt-abnahme.md) · [Mac-App](docs/desktop-app.md) · [Quellenstand](docs/FACHLICHER-PRUEFSTAND.md)
