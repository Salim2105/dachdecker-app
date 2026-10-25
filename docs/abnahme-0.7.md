# Technische Abnahme 0.7.0

Stand: 25. Oktober 2026. Die Umfänge 0.5, 0.6 und 0.7 sind gemeinsam implementiert und als zusammengeführte Version geprüft. Es wurden keine drei getrennten Online-Veröffentlichungen vorgenommen.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm test -- --reporter=dot` | 83 Testdateien, 660 Tests bestanden |
| `npx tsc --noEmit` | Bestanden |
| `npm run lint` | Keine Fehler; zwei bestehende Warnungen in `public/_worker.js` und `scripts/repariere-umlaute.mjs` |
| `npm run build` | Produktionsbuild bestanden |
| `npm run export` | Statischer Export bestanden; 1.714 Dateien im Offline-Bundle |
| `node scripts/prepare-probe.mjs` | Separater Probeexport ohne Anmeldung vorbereitet; privater Export bleibt geschützt |
| `git diff --check` | Keine fehlerhaften Leerzeichen |

Der Aufgabenbestand enthält 2.183 sichtbare Fachaufgaben. Für alle 2.062 automatisch bewertbaren Aufgaben bestehen ausdrückliche Prüfungsmetadaten. 145 Ergänzungsfragen schließen Lücken in den Stufenpools. Die 66 Feldstufen besitzen jeweils mindestens zwölf passende Aufgaben; die bisherigen LF7-Umfänge bleiben erhalten.

Die Mathematiktests vergleichen die ersten Varianten aller 30 Aufbau-Aufgaben mit unabhängig nachgerechneten Referenzzahlen. Außerdem werden alle 150 Varianten auf Gültigkeit/Reproduzierbarkeit, Einheiten, Teilantworten, Rundungsgrenzen, Ganzzahligkeit und unzulässige Eingaben geprüft. Die Projektberechnungen besitzen zusätzliche unabhängige Mengenreferenzen.

Weitere Tests prüfen vollständige Prüfungssnapshots, deduplizierte Wiederholungsereignisse, Hilfen/Selbsteinschätzungen, verspätete ältere Ergebnisse, Filterwechsel, Projektabhängigkeiten, Archivierung und die Übernahme alter Daten ohne erfundene Erfolgsereignisse. Die vollständige ZIP-Sicherung wurde einschließlich neuer Lernstände, Rückmeldungen und privater Bildbytes wiederhergestellt.

## Browserdurchläufe

Tatsächlich ausgeführt mit lokalem Produktions-/Desktopserver und Chromium unter Linux. Die Durchläufe wurden mit automatisierten Browsereingaben durchgeführt; sie sind keine beobachteten Tests mit Auszubildenden.

- Neue Einstiege im Übungsraum, Projekt- und Bildauswahl, Aufbau-Mathe, Tagesrunde und Rückmeldeformular geöffnet.
- Falsche Dachschräge eingegeben, geprüft und als eigene Antwort erhalten. Übernommener Referenzwert gibt den nächsten Rechenschritt frei und bleibt als Hilfe gekennzeichnet.
- Notizen, Begleitungsmodus, konkrete Mathevariante und geprüfte Antworten nach Neuladen wiederhergestellt. Matheauswertung beim erneuten Öffnen nicht doppelt gezählt.
- Nummerierter Bildbereich führt zum zugehörigen Auswahlfeld. Konkrete Bildzuordnungen gespeichert und geprüft.
- Globale Rückmeldung übernimmt aktuellen Routerbereich und Aufgabenbezug. Angefangener Text und Version 0.7.0 bleiben erhalten. Eine zunächst entdeckte Verwechslung mit einer alten Browseradresse wurde korrigiert und durch einen Regressionstest abgesichert.
- Tagesrunde nach Filterwechsel und Neuladen mit identischen Aufgabensnapshots fortgesetzt.
- WiSo-Prüfungsnah gestartet: zehn Aufgaben aus dem passenden Bereich; Fragen nach Neuladen identisch.
- Projektzeichnung per Tastatur erstellt, beim Wechsel der Begleitung und nach Neuladen erhalten. Papierfoto importiert, nach Neustart angezeigt und gemeinsam mit Projektnotizen über einen echten ZIP-Download und -Import wiederhergestellt.
- Neue Projekt-, Bild-, Mathe- und Rückmeldeseiten ohne Netzwerk aus dem statischen Service-Worker-Bundle geöffnet.
- Breiten 390, 760 und 1.280 Pixel geprüft. Hell und Dunkel sowie vergrößerte Schrift wurden berücksichtigt. Der zusätzliche Durchlauf mit der tatsächlichen 130-%-Einstellung fand einen Umbruchfehler bei langen Projekttiteln; die Karten erlauben nun einen passenden Wortumbruch.

Der Service Worker wird zusätzlich als generiertes Programm getestet: wartende Aktivierung, ausdrückliche Freigabe, fehlende Offline-Dateien, mehrere offene Tabs, alte gehashte Bundles, statische RSC-Seitendaten mit wechselnder Abfrage und Schutz fremder Caches. Komponententests prüfen, dass ein Speicherfehler das Aktualisieren blockiert und ein anderer Tab keinen erzwungenen Neustart verursacht.

## Noch nicht ausgeführt

- Safari auf macOS und ein echtes iPhone einschließlich Start vom Home-Bildschirm.
- Beobachtete Nutzertests mit Lernenden und Auswertung ihrer tatsächlichen Rückmeldungen. Dafür bleibt `/erprobung` verfügbar; lokale Rückmeldungen werden nur auf ausdrückliche Aktion geteilt.
- Bau und Installation der nativen Mac-App auf einem Mac sowie Apple-Signierung.
- Veröffentlichung im Cloudflare-Konto. Die Hosting-Anmeldung ist in diesem Arbeitsbereich nicht vorhanden. Auf Salims Mac veröffentlicht `bash scripts/probe-teilen.sh` den geprüften Code unter der dauerhaften Probeadresse.

Der bisherige Versionslink und die dauerhafte Adresse haben getrennte Gerätespeicher. Für den einmaligen Umzug bleibt Export/Import erforderlich; siehe [Anleitung für den Kollegen](kollegen-probe.md).
