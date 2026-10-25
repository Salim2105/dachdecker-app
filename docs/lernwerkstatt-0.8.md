# Version 0.8.0: Direkte Wege zu allen Lernbereichen

Die bisherigen vier Sammelseiten machten die Lernwerkstatt schwer überschaubar. Jetzt führen 16 eigenständige Menüpunkte direkt zu den vorhandenen Angeboten. Inhalte, Aufgaben-IDs, Bewertungen und Speicherschlüssel bleiben erhalten.

## Orientierung und Einstiege

Die gemeinsame Definition in `lib/navigation.ts` steuert Seitenleiste, vollständiges Handy-Menü und aktive Bereichsmarkierung. Vier Überschriften ordnen die 16 Ziele. Serviceeinträge für Rückmeldungen und Erprobung sind getrennt erreichbar. Die vier mobilen Schnellzugriffe sind separat definiert.

Die Startseite bietet Weiterlernen, Tagesrunde und persönliche Lernhinweise. Lernstand und Woche folgen kompakt darunter; der Prüfungstermin bleibt aufklappbar. Frühere Quizrunden bleiben über die gemeinsame Fortsetzungsfunktion erreichbar. Die Lernfelderseite beschränkt sich auf alle 22 beruflichen Lernbereiche einschließlich Anhängen und WiSo. Quiz & Aufgaben bietet eine gezielte Lernfeldauswahl statt weiterer Angebotskataloge.

Praxisfälle zeigen zwei Wege für dieselben sechs kurzen Grundlagenfälle: mit Erklärung lernen oder selbst lösen. Beide bisherigen Speicher bleiben erhalten. Die sechs umfangreichen Baustellenprojekte besitzen weiterhin ihren eigenen Bereich. Fachbegriffe lassen sich unter `/fachbegriffe` suchen und direkt auf derselben Seite erklären. Fachwörter im Lerntext öffnen weiterhin die seitliche Hilfe.

## Sicher navigieren und fortsetzen

Menülinks zu Fachmathe, beiden Sprachen, Bildtraining und Projekten verwenden `?ansicht=uebersicht`. Das zeigt den Katalog, ohne gespeicherte Bearbeitungspunkte oder Entwürfe zu löschen. Ein gültiger Einheitshash hat Vorrang; alte Links ohne Parameter setzen ihre gespeicherte Auswahl wie bisher fort. Die Auswahl einer Einheit entfernt den Katalogparameter.

`LernLink` wartet vor dem Bereichswechsel auf den dauerhaften Gerätespeicher. Erst danach schließt der neue Rückruf das Handy-Menü und die Zieladresse wird geöffnet. Bei einem Speicherfehler bleiben Menü und Aufgabe geöffnet. Abbrechen während eines noch laufenden Speichervorgangs löst keinen verspäteten Sprung aus.

Das Handy-Menü hält den Fokus, unterstützt Escape, eine sichtbare Schließen-Taste und die Rückkehr zum Auslöser. Der Hintergrund bleibt währenddessen inaktiv. Menü und Rechner-/Begriffshilfe öffnen sich gegenseitig ablösend; die Hilfe bleibt mit ihren Eingaben im Hintergrund montiert. Bestehende Routen, die geführten Praxisfälle unter `/lernweg` und Lernfeld-Übungslinks funktionieren weiter.

## Veröffentlichung

Das Update wird über `codex/lernverbesserungen` bereitgestellt. Die bestehenden Mac- und Website-Skripte verwenden denselben Stand und Version 0.8.0. Zum Aktualisieren auf Salims Mac:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
bash scripts/install-mac-neu.sh
```

Danach die Kollegenversion über `bash scripts/probe-teilen.sh` neu veröffentlichen. Die dauerhafte Adresse bleibt https://dachdecker-probe-salim2105.pages.dev/. Die Anmeldung beim Hosting erfolgt auf Salims Mac. Die neue Fachbegriffsseite gehört zum Offline-Export.

## Abnahme

Die technische Abnahme prüft Navigation und Datenerhalt automatisiert und im Chromium-Browser. Die Durchführung und Ergebnisse werden vor der Bereitstellung unten dokumentiert. Native Mac-Installation und Safari beziehungsweise die iPhone-Home-Bildschirm-App müssen zusätzlich auf echten Apple-Geräten erprobt werden; hier steht Linux zur Verfügung.

Abgeschlossen am 25.10.2026:

- Gesamtsuite: **724 Tests in 90 Dateien bestanden**. Nach der abschließenden Service-Markierung wurden die 48 betroffenen Navigationstests erneut erfolgreich geprüft.
- TypeScript, ESLint, Produktionsbuild und statischer Export bestanden. ESLint meldet nur die zwei bereits bestehenden Warnungen in `public/_worker.js` und `scripts/repariere-umlaute.mjs`; keine Fehler.
- Alle 16 Bereiche, Lernfeld-Unterseiten, Übungsseiten, Praxisalias und Serviceeinträge aktivieren im Browser den passenden Menüpunkt. Zurück/Vorwärts, Katalogaufruf und Weiterlernen wurden mit gespeichertem Matheentwurf geprüft.
- Handy-Menü: vollständige Liste, Fokusanfang, Tab-Umlauf, Escape und Rückkehr zum Auslöser bestanden. Unfertiger Rechenwert „0,“, Rechnerhilfe, Projektnotizen, digitale Zeichnung sowie eine beantwortete laufende Prüfung bleiben beim Öffnen, Schließen und Bereichswechsel erhalten; Aufgabenvarianten und Antworten wurden mit den gespeicherten Daten verglichen.
- 390, 760 und 1.280 Pixel, Hell und Dunkel, tatsächliche 130-%-Einstellung: keine Überbreite; Schließen-Taste und untere Menüpunkte erreichbar. Die anfänglich bei CSS-Zoom zu hohe Mac-Seitenleiste und Werkzeughilfe wurden an die tatsächliche Fensterhöhe angepasst.
- Offline geprüft: Bereichsmenü, neue Fachbegriffsseite mit Erklärung/Skizze und Fachmathe-Katalog über den Link mit `?ansicht=uebersicht` funktionieren bei abgeschaltetem Netzwerk.
- Der Export für die Test-Website wurde mit dem vorhandenen Skript vorbereitet. Cloudflare-Veröffentlichung und native Mac-Installation erfolgen anschließend auf Salims Mac; Apple-Gerätetests und beobachtete Lernendentests wurden hier nicht durchgeführt.
