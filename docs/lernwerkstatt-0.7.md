# Lernwerkstatt 0.7: Prüfungen, Wiederholung, Mathe und Baustellen

Die drei geplanten Ausbaustufen sind im gemeinsamen Stand 0.7.0 zusammengeführt. Die bisherigen 402 Fachwissen-Einheiten und Aufgaben-IDs bleiben bestehen. Neue Inhalte ergänzen den Bestand; Geräte brauchen weiterhin kein Konto. Diese Datei beschreibt den implementierten Stand, keine bereits erfolgte Veröffentlichung oder beobachtete Erprobung.

## Prüfungen und Tagesrunde (Umfang 0.5)

- Alle 22 Lernbereiche (18 berufliche Bereiche einschließlich LF13a/b, drei Anhänge und WiSo) besitzen Grundlagen, Anwendung und Prüfungsnah. Neue Feldprüfungen: zehn Aufgaben, freiwillig 15/20/30 Minuten. Die bestehenden LF7-Prüfungen und gemischten Trainings behalten ihre IDs und Umfänge.
- `content/pruefung/metadaten.json` ordnet jede sichtbare automatisch bewertbare Frage ausdrücklich einer Stufe, Punkten, Inhaltsversion und Lernzielen zu. `ergaenzungen.json` ergänzt fehlende Aufgaben. Die Stufenpools besitzen jeweils mindestens zwölf Aufgaben; LF7 Prüfungsnah weiterhin mindestens zwanzig. Der Fallbezug einer Aufgabe entscheidet über ihre Stufe.
- Eine Prüfung speichert tatsächliche Fragen, Zahlen, Antworten, Markierungen, Zeitstand und Lernzielverweise. Nach Abgabe werden richtige, teilweise richtige und falsche Ergebnisse genau einmal in die Wiederholung übernommen. Das 80-Prozent-Ziel bleibt ein internes Trainingsziel.
- Die gemeinsame Tagesrunde verbindet Fachwissen, Grundlagen-/Aufbau-Mathe, Sprachen, kurze Projekttransfers und Bildaufgaben. Ganze Projekte bleiben im Übungsraum. Lange Rechenketten werden nicht auseinandergerissen.
- Jeder Filter behält seine eigene angefangene Runde. Zeitwechsel gelten für die nächste Runde. Ein ausdrücklicher Neubeginn archiviert die bisherige Runde. Alte angefangene Fachwissenrunden bleiben fertig bearbeitbar.
- `ReviewRef`, `ReviewResult` und `ReviewSession` trennen Aufgabenbezug, einzelne bewertete Versuche und eingefrorene Runden. Die begrenzte Diagnosehistorie ist kein Terminplaner. Fachwissen behält seinen bisherigen kanonischen Fortschritt; andere Quellen erhalten eigene dauerhafte Termine. Aus alten Mathe- und Sprachentwürfen entstehen keine rückwirkenden Erfolge.
- Antworten werden vor ihrer Wiederholungsbewertung gespeichert. Eindeutige Versuch-IDs machen die Wiederaufnahme idempotent. Hilfen, Selbsteinschätzungen, erneute Antworten am selben Tag und direkt nach einer Lösung bearbeitete Varianten verlängern keine langfristigen Erfolgsabstände. Verspätete ältere Ergebnisse setzen neuere Termine nicht zurück.
- „Rückmeldung geben“ ist global erreichbar. Bereich, Version und verfügbarer Aufgabenbezug werden vorbereitet. Die Person teilt, kopiert oder exportiert die Rückmeldung selbst; eine automatische Übermittlung findet nicht statt.

## Aufbau-Mathe und erste Projekte (Umfang 0.6)

Zehn Aufbau-Einheiten enthalten jeweils Erklärung, beschriftete Skizze, Beispiel und drei eigene Rechenaufgaben: Formelumstellung, Trigonometrie, zusammengesetzte Flächen, wahre Längen, Lattweiten, Deckmaße/Bedarf, Schichtwiderstände/U-Wert, Gefälle/Winkel, Volumen/Masse und Kostenplanung.

Die 30 Aufgaben besitzen je fünf gültige Zahlenvarianten. Aufgaben und Zahlen entstehen einmal und werden gespeichert. Zwischenschritte, Einheiten, Dezimalstellen, absolute Toleranzen und gegebenenfalls Ganzzahligkeit sind ausdrücklich definiert. Intern wird ungerundet weitergerechnet. Eigene Teilantworten bleiben sichtbar; richtige Schritte zählen getrennt. Neue Zahlen archivieren den bisherigen Versuch und markieren die bereits gesehene Erklärung als Hilfe.

Ziegeldach, Flachdach und Sanierung verbinden sechs Arbeitsschritte: Auftrag, Befund, Rechnung, Maßnahme, Ablauf/Zeichnung und Erklärung. Begleitung ist zunächst sichtbar und jederzeit umschaltbar. Ein falscher Rechenvorwert bleibt erhalten; eine ausdrücklich übernommene Referenzhilfe gibt abhängige Schritte frei. Freie Zeichnungen und Erklärungen werden anhand konkreter Kriterien selbst eingeschätzt und getrennt von der automatischen Punktzahl dargestellt.

## Bildtraining und weitere Projekte (Umfang 0.7)

Schiefer/Durchdringung, Metalldeckung und hinterlüftete Fassade ergänzen die ersten drei Projekte. Alle sechs verwenden dieselbe Bedienung und Speicherung.

Je Projektthema gibt es vier Bildaufgaben: Bauteile zuordnen, Ablauf/Schichten ordnen, einen dargestellten Fehler finden und eine passende Befundprüfung auswählen. Insgesamt sind es 24 Aufgaben mit eigenen schematischen SVG-Zeichnungen, Bildbeschreibung und Erklärung. Nummerierte Bildbereiche und gewöhnliche Listen lassen sich mit Tastatur und Antippen bedienen; Ziehen ist nicht erforderlich. Private importierte Zeichnungsfotos gelangen nicht in den veröffentlichten Aufgabenbestand.

## Speicherung und Aktualisierung

Neue Lernstände und Rückmeldungen liegen im bestehenden IndexedDB-Speicher. Vollständige ZIP-Sicherungen enthalten auch neue Entwürfe, Wiederholungstermine und private Bilddateien. Alte JSON-Sicherungen bleiben importierbar. Nicht lesbare neue Entwürfe werden sichtbar gemeldet und erst nach ausdrücklichem Archivieren ersetzt.

Ein Webseiten-Update wartet auf die Entscheidung „Speichern und aktualisieren“. Vor Aktivierung und Neuladen wird der dauerhafte Speicher abgeschlossen; Speicherfehler verhindern das Neuladen. Andere offene Tabs werden nicht ungefragt neu geladen. Der Worker behält vorherige eigene Bundles für noch offene Seiten und löscht keine fremden App-Caches.

Die Mac-App verwendet weiterhin ihr lokal gebautes Bundle. `bash scripts/install-mac-neu.sh` baut und installiert sie auf dem Mac. Der Cloud-Arbeitsbereich stellt kein signiertes Mac-Installationspaket her.

`bash scripts/probe-teilen.sh` erstellt den Webexport und veröffentlicht ihn nach Anmeldung bei Salims Cloudflare-Konto. Erst nach erfolgreichem Upload kopiert das Skript die dauerhafte Adresse:

https://dachdecker-probe-salim2105.pages.dev/

Der alte Versionslink `https://95f6d713.dachdecker-probe-salim2105.pages.dev/` besitzt einen anderen Gerätespeicher. Einmal im alten Link eine vollständige Sicherung exportieren und unter der dauerhaften Adresse importieren. Weitere Updates unter derselben dauerhaften Adresse benötigen keinen solchen Umzug.

## Prüfung und noch ausstehende Erprobung

Automatisierte Prüfungen decken Aufgabenpools, unabhängige Rechenreferenzen, echte Antworten, doppelte Auswertungen, Filter-/Projektwechsel, Hilfeverwendung, Wiederaufnahme, vollständige Sicherungen, Tastaturbedienung und den wartenden Service Worker ab. Der [Abnahmebericht](abnahme-0.7.md) dokumentiert die tatsächlich ausgeführten Builds und Browserprüfungen.

Eine echte Erprobung auf Safari, auf dem iPhone vom Home-Bildschirm und mit Lernenden ist separat erforderlich und wird nicht durch Chromium-Gerätegrößen ersetzt. Bisher liegen im Arbeitsbereich keine neuen Rückmeldungen des Kollegen vor; deshalb werden keine daraus abgeleiteten Verbesserungen oder beobachteten Lernerfolge behauptet. Der vorhandene Beobachtungsbogen unter `/erprobung` bleibt dafür verfügbar.
