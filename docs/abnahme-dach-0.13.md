# Technische Abnahme · 0.13.0

Prüfstand vom 1. November 2026, Linux-Cloudumgebung mit Chromium. Der abschließende Modellabruf-Fehlerfall ist in `f698cf2` korrigiert.

| Prüfung | Ergebnis |
|---|---|
| Gesamte Testsuite | 126 Dateien, 1.296 Tests bestanden |
| TypeScript | Ohne Fehler, zusätzlich im Produktionsbuild und Export geprüft |
| ESLint | Keine Fehler; zwei bestehende Warnungen in unveränderten Altdateien |
| Produktionsbuild und statischer Export | Erfolgreich; öffentlicher Probe-Export vorbereitet |
| Medienprüfung | 104 Modellkontexte, 530 große Dateien, 421 Vorschaubilder; Größen und SHA-256 geprüft |
| Geometrieprüfung | 104 Kontexte geprüft, keine Fehler im abschließenden numerischen Audit |
| Budgets | Maximal 87.856 Geometriedreiecke, 5,32 MiB je Übersicht, 1,74 MiB je Detailpaket |

Die Sichtprüfung umfasste richtige und fehlerhafte Ansichten aller 34 Themen sowie gemeinsame Themen am Flachdach. Dabei wurden unter anderem verdeckte Anschlüsse, versunkene Deckelemente, unpassende Schnittlagen und abgeschnittene PV-Darstellungen vor der Freigabe korrigiert. Die Darstellungen sind eigene gerenderte Lehrmodelle; sie sind keine Fotos oder amtlich freigegebenen Ausführungsdetails.

Im exportierten Paket wurden alle fünf Kombinationen aus Dachform und Deckung mit tatsächlich gezeichneter WebGL-Geometrie geprüft. Drehen, Zoom, direkte Bauteilauswahl, Filter, Schichten, Schnitt, auseinandergezogener Aufbau, Wasserweg, Montage und Fehlervergleich funktionierten. Tastaturbedienung, Notizen und Positionen je Dach, Deckungswahl, Browser-Zurück und Neustart bestanden ebenfalls. Bei 390, 760 und 1.280 Pixeln, Hell/Dunkel und tatsächlich eingestellten 130 % Schrift traten keine Überbreiten auf.

Der separate Offline-Test bestätigte:

- Das Grundpaket enthält feste Vorschaubilder und keine großen Dachmedien.
- Notizen und eingefrorene Antworten bleiben ohne Netz nach einem Neustart erhalten.
- Ein ausdrücklich gespeichertes Flachdachpaket wird offline als echte WebGL-Szene geladen.
- Nach Entfernen des Pakets bleibt der Lernstand erhalten; der fehlende Modellabruf wechselt ohne globalen Laufzeitfehler zur festen Ansicht.

Automatisierte Speicherprüfungen decken außerdem ZIP-Wiederherstellung mit Dachantworten und privaten Fotos, alte Sicherungsformate, Downloadabbruch, falsche Prüfsummen, Speicherfehler, verwaiste Zwischenspeicher und das Verhindern doppelter Lernnachweise ab.

**Noch nicht durchgeführt:** native Prüfung des macOS-Bundles, Safari und Bildraten auf einem echten iPhone sowie beobachtete Lernendentests. Software-Rendering in Chromium belegt keine iPhone-Bildrate. Die vorbereitete Test-Website benötigt weiterhin Salims Hosting-Upload; dieser Bericht behauptet keine bereits erfolgte Veröffentlichung auf Cloudflare.
