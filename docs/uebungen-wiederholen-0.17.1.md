# Übungen direkt wiederholen – Version 0.17.1

Nach einer bewerteten Quizaufgabe erscheint der Button **„Diese Übung wiederholen“**. Er öffnet dieselbe Aufgabe mit leeren Antwortfeldern. Bei Rechenaufgaben bleiben die Zahlen des Beispiels gleich. Anschließend kann die Runde normal fortgesetzt werden.

Die erste Bewertung bestimmt weiterhin das Rundenergebnis und den geplanten Wiederholungstermin. Ein Versuch unmittelbar nach der Erklärung überschreibt diese Bewertung nicht. Begonnene Wiederholungen einschließlich ihrer Eingaben und Rückmeldungen bleiben beim Neuladen erhalten.

Auch am Ende einer Fachwissen-Einheit gibt es den Button. Der vollständige bisherige Versuch wird vor dem Neustart dauerhaft archiviert. Frühere Notizen und Kontrollbewertungen sind unter **„Frühere Notizen und Lernstände“** erreichbar und in vollständigen Sicherungen enthalten. Die Einheit beginnt wieder beim ersten Lernschritt mit neuen Antwortfeldern. Bereits erreichte Abschlüsse bleiben im Katalog und auf der Übersicht berücksichtigt. Speicherfehler erhalten den bisherigen Versuch und zeigen eine Rückmeldung.

Andere bestehende Wiederholungswege und Lerninhalte bleiben verfügbar. Dieses Update verändert keine Videos.

## Prüfung

Regressionstests prüfen insbesondere erste Bewertungen und Fälligkeiten, wiederholtes Neuladen, leere Antwortfelder, unveränderte Rechenzahlen, Fehlernacharbeit, archivierte Notizen, Speicherfehler und vollständige Sicherungen. Hinzu kommen TypeScript, Lint, Produktionsbuild und statischer Export.

Bestanden: 1.520 Tests in 141 Dateien, TypeScript, Produktionsbuild und statischer Export einschließlich Inhalts- und Medienprüfungen. Lint meldet keine Fehler; die zwei bestehenden Warnungen in `public/_worker.js` und `scripts/repariere-umlaute.mjs` bleiben unverändert.

Im Chromium-Browser wurden die vollständigen Quiz- und Kursabläufe bei 390 Pixeln (hell) und 1.280 Pixeln (dunkel) geprüft: Wiederholen, leere Felder, tatsächliches Neuladen, erhaltene IndexedDB-Bewertungen, Archivnotizen, nächste Frage und unveränderter Abschlusszähler. Es gab keine Produktfehler oder horizontalen Überläufe.

Tatsächliche Bedienung auf einem Mac oder iPhone wird durch diese automatisierten Prüfungen nicht ersetzt.
