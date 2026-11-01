# 3D-Lernstudio · Update 0.14

## Was sich sichtbar verändert

Unter **Baustellenprojekte → 3D-Dach entdecken** steht das Modell im Mittelpunkt einer zusammenhängenden Arbeitsfläche. Auf breiten Fenstern liegen die Erklärungen und Aufgaben rechts daneben; auf schmalen Bildschirmen folgen sie darunter. Dachform und Deckungsart bleiben direkt wählbar. Die Bauteilauswahl, Ansichtshilfen, Notizen, Systemangaben und Offline-Pakete lassen sich bei Bedarf öffnen. Die 16 Hauptbereiche bleiben erhalten.

Der Lernablauf bleibt vollständig: **Erkennen → Aufbau → Montage → Kontrolle → Selbst prüfen**. Der rechte Lernbereich führt durch die einzelnen Schritte, statt mehrere große Karten gleichzeitig anzuzeigen. Die beschriftete Bauteilliste bietet weiterhin dieselben Einstiege wie die Markierungen am Modell. Kameraschaltflächen und Tastaturbedienung ergänzen Maus und Touch.

Die Kamera richtet sich nach den tatsächlich sichtbaren Modellteilen. Drehungen und Zoom wechseln über kurze Übergänge; eine begonnene Drehung klingt aus. Ein bewusst gestarteter Rundgang führt einmal um das Dach und lässt sich pausieren. Auch Montage- und Schichtwechsel erhalten begrenzte Übergänge. Im Ruhezustand soll der Betrachter keine dauerhafte Animation berechnen. Bei reduzierter Bewegung bleiben unmittelbare Ansichts- und Schrittwechsel verfügbar.

Die Übersichten wurden mit ausgearbeiteten Keramikprofilen, Fensteröffnungen, Laibungen, Rahmen und Materialoberflächen neu hergestellt. Die Detailbilder erhalten dieselbe abgestimmte Materialdarstellung. Die festen Ansichten werden aus den jeweiligen Lehrszenen gerendert und mit einem dafür vorgesehenen Verfahren entrauscht. Die Bilder sind eigene Renderdarstellungen; sie dokumentieren keine ausgeführten Praxisdächer.

## Umfang und Medienherkunft

Die fünf Dach-/Deckungsvarianten bleiben bestehen:

- Satteldach mit Gaube, jeweils mit Falzziegeln oder Biberschwanz-Doppeldeckung.
- Walmdach mit denselben beiden getrennten Deckungsvarianten.
- Flachdach als festgelegtes Warmdach-Beispiel.

Die 34 Detailthemen und 68 Kontrollfragen bleiben erhalten. Daraus entstehen 104 passende Detailkontexte. Die zweite Medienfassung enthält **109 GLB-Modelle, 421 große Renderansichten und eine HDR-Lichtumgebung**, insgesamt 531 optional ladbare Dateien. Hinzu kommen 421 kleine Vorschaubilder im Grundpaket. Inhaltlich identische Detailkontexte dürfen dieselben Dateibytes verwenden.

Das größte neue Modell hat 5.297.108 Byte, die höchste Dreiecksanzahl beträgt 94.522. Damit bleiben die produzierten Modelle unter den vorgesehenen Grenzen von 6 MiB und 100.000 Dreiecken. Diese Dateigrenzen sind kein Nachweis einer bestimmten Bildrate auf einem iPhone.

Die Dachgeometrie und Materialdarstellung sind eigene Arbeiten. Die lokal ausgelieferte Lichtumgebung **Royal Esplanade 1K** ist ein unter CC0 angebotenes HDRI. Herkunft, erfolgreich geprüfte Lizenzquelle und tatsächlich abgerufene Gestaltungsreferenzen stehen in [Quellen und Gestaltungsvorbildern](dach-materialien-quellen.md). Die blockierten Hersteller- und Modellplattformen wurden nicht als angesehene Videos oder geprüfte fremde Dachmodelle ausgegeben. Es wurden keine fremden Dachmodelle oder Videoclips übernommen.

Die Herstellung und Medienkontrolle sind in [Studiomedien v2](../scripts/dach3d/STUDIO.md) beschrieben. Die optionale Bildentrauschung gehört ausschließlich zur Medienproduktion; sie muss auf dem Mac oder iPhone der Lernenden nicht installiert werden.

## Bestehende Antworten bleiben nachvollziehbar

Die veröffentlichten Dateien unter `/dach-medien/v1/` und `/dach-vorschau/v1/` bleiben unverändert vorhanden. Neu erzeugte Modelle und Bilder liegen unter `v2`. Neue Aufgaben verwenden die neue Bildfassung. Bereits eingefrorene Antworten und Tagesrunden behalten ihre tatsächliche ursprüngliche Medienreferenz; ein Update ersetzt deren Bildfassung nicht nachträglich.

Der vorhandene Lernstand verwendet weiterhin dieselben Speicherzugriffe und Schlüssel. Dachform, Deckung, Detail, Lernschritt, Kamera, Antworten, Hilfen und Notizen bleiben Teil dieses Lernstands. Die Speicheranzeige bestätigt erst das dauerhaft abgeschlossene Speichern. Eine Fehlermeldung lässt die aktuelle Arbeit für einen erneuten Speicherversuch geöffnet.

Bloßes Erkunden erzeugt weiterhin keinen Wissensnachweis. Eine beantwortete Kontrollfrage wird mit ihrer konkreten Aufgabe und Medienfassung festgehalten. Genutzte Erklärungen und Hilfen bleiben erkennbar; digitales Verständnis wird getrennt von einer praktischen Ausführung geführt. Ein erneut geöffnetes Ergebnis zählt keinen zusätzlichen Versuch.

Öffentliche Modelle bleiben von privaten Zeichnungen und Fotos getrennt. Vollständige Lernstand-Sicherungen speichern Medienverweise, ohne herunterladbare Modellpakete in jeder Sicherung zu duplizieren. Historische Bildverweise bleiben beim Import gültig.

## Laden, Offline-Nutzung und Fehlerfälle

Texte, Oberfläche und kleine Vorschaubilder gehören weiterhin zum Grundpaket. Große Dateien laden bei Bedarf. Die getrennten Dachpakete enthalten auch die bisherige Medienfassung, damit alte eingefrorene Aufgaben offline lesbar bleiben. Das gemeinsame HDRI wird von den Dachpaketen wiederverwendet. Es ist kein externes CDN erforderlich.

Ein Paket gilt erst nach vollständigem Download mit gültigen Größen und Prüfsummen als gespeichert. Ein unterbrochener neuer Download ersetzt kein bereits vollständiges Paket. Das Entfernen eines Dachpakets löscht keine Lernantworten oder privaten Bilder. Ohne verfügbares 3D oder bei einem fehlerhaften Modell bleiben feste Ansichten und die Lernaufgaben erreichbar.

Wenn ein Modell innerhalb von 60 Sekunden kein Bild zeichnet, wechselt der Betrachter ebenfalls zur festen Ansicht. „3D erneut versuchen“ startet einen neuen Ladeversuch. Bereitschaft, Dachwechsel, ein verdeckter Tab, die feste Ansicht und das Schließen beenden die jeweilige Ladefrist.

Die alte Medienprüfung bleibt aktiv. Zusätzlich prüft `npm run studio:check` die neue Medienfassung. Build und statischer Export führen beide Medienprüfungen aus.

## Abnahme dieser Version

Medienproduktion und Sichtprüfung sind abgeschlossen und im [Produktionsbericht](../scripts/dach3d/STUDIO.md) festgehalten. Die folgenden Prüfungen wurden am 1. November 2026 durchgeführt. Offene Punkte sind keine bestätigten Testergebnisse.

| Prüfung | Stand |
|---|---|
| Neue Medien: Dateiprüfung, Budgets, Dekodierung und Sichtprüfung | Abgeschlossen; Einzelheiten im Produktionsbericht |
| Vollständiger Testlauf, TypeScript und Lint | 1.316 Tests in 126 Dateien bestanden; `tsc --noEmit` erfolgreich; ESLint ohne Fehler, mit zwei bestehenden Warnungen in `_worker.js` und `repariere-umlaute.mjs` |
| Produktionsbuild, statischer Export und Website-Paket | `npm run build`, `npm run export` und `node scripts/prepare-probe.mjs` erfolgreich; beide Medienprüfungen bestanden; Mac-/Website-Shellskripte syntaktisch geprüft |
| Tatsächlicher WebGL-Modellaufbau aller fünf Varianten | Im Chromium-Cloudbrowser jeweils Übersicht und Detail tatsächlich gezeichnet; v2-URL und Geometrie-Zeichenereignis geprüft |
| Kamera, Rundgang, Pause und Ruhezustand | Weiche Kamera-/Schichtwechsel, Rundgang und erneuter Start geprüft; im Ruhezustand und nach Pause jeweils 0 zusätzliche GL-Zeichenaufrufe über 2 Sekunden |
| Fertiger statischer Export im Browser | v2-Satteldachübersicht und Rinnendetail tatsächlich in WebGL gezeichnet; Rundgang und Pause, 0 zusätzliche GL-Zeichenaufrufe im Ruhezustand, 390 Pixel ohne Überlauf, keine JavaScript-Seitenfehler |
| Alte Bildreferenzen, Speichern, Neustart und Offline-Pakete | v1/v2-Kompatibilität, unveränderte erste Antworten und genau einmal gezählte Tagesrunden getestet. Im fertigen Export: Offline-Neustart erhält Notizen, Auswahl und v2-Aufgabenbild; vollständiges Flachdachpaket mit beiden Medienfassungen und HDR gespeichert; Modell/HDR im Cache unabhängig per SHA-256 geprüft; v2-Ablaufmodell tatsächlich offline gezeichnet; Paketlöschen erhält Lernarbeit und aktiviert die feste Ansicht, keine JavaScript-Seitenfehler |
| 390, 760 und 1.280 Pixel, Hell/Dunkel und 130 Prozent Schrift | Tatsächliche 130-%-Einstellung ohne horizontalen Überlauf geprüft; Tastaturauswahl sowie Escape und Fokus-Rückgabe funktionieren |
| Safari und Touch-Bildrate auf einem echten iPhone | Noch nicht durchgeführt |
| Installation und Ausführung des nativen macOS-Bundles | In dieser Cloud nicht durchgeführt |
| Beobachtete Erprobung mit Azubis | Noch nicht durchgeführt |

Cloud-Browserprüfungen ersetzen die drei zuletzt genannten Erprobungen nicht. Praxisvideos und NotebookLM-Clips bleiben ein späterer eigener Ausbau.

Im langen Entwicklungs-Browserlauf erreichte die fünfte Dachvariante nach vier vorherigen Kontexten und Hot Reload einmal die WebGL-Bereitschaft nicht. Ein frischer Browser zeichnete dieselbe Flachdachübersicht und das Ablaufdetail korrekt; der Hänger ließ sich dabei nicht wiederholen. Die Ursache ist damit nicht abschließend geklärt. Die neue Ladefrist verhindert unbegrenztes Warten, ohne einen behobenen Treiberfehler zu behaupten. Die anschließende Prüfung ohne WebGL erhielt Notizen, Deckung, Lernschritt und Antworten bei Dachwechsel, Browser-Zurück und Neustart.

## Aktualisieren und bereitstellen

Nach Bereitstellung auf `codex/lernverbesserungen` die installierte Mac-App vollständig schließen und im bisherigen Projektordner ausführen:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
bash scripts/install-mac-neu.sh
```

Der Website-Upload erfolgt anschließend mit `bash scripts/probe-teilen.sh` über Salims bestehende Hosting-Anmeldung. Der dauerhafte Test-Link bleibt `https://dachdecker-probe-salim2105.pages.dev/`. Der Kollege benötigt weiterhin kein Konto. Ein erfolgreich vorbereiteter Export veröffentlicht die Website noch nicht.
