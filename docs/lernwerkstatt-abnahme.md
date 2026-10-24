# Lernwerkstatt – Umsetzung und Abnahme

Aktueller Ausbau: [Version 0.4 mit allen Lernfeldern, Fachmathe und Sprachen](lernwerkstatt-0.4.md).

## Umgesetzt

Die App besitzt eine breite Mac-Arbeitsfläche, vier Hauptbereiche, eine verstellbare Hilfeseitenleiste, Hell-/Dunkeldesign und Schriftvergrößerung. Vorhandene URLs bleiben gültig. Fällige Wiederholungen bleiben in der Tagesrunde; der Überblick beginnt mit dem nächsten Lernschritt.

LF7 enthält sechs Kapitel mit je drei eigenformulierten Einheiten. Jede Einheit hat eine stabile ID und Version, ein Lernziel, kurze Erklärungen, eine Darstellung, einen freien Abrufversuch, zwei bis vier ausdrücklich verknüpfte Bestandsaufgaben sowie eine aktive Anwendung. Vier Aufgabenformen sind per Tastatur bedienbar. Begriffe sind im Text und in einer Einheitenliste erreichbar. Seit 0.4 sind auch alle übrigen Lernfelder, Anhänge und WiSo eigenständig in kurze Einheiten mit Lernziel, Abruf, ausdrücklich verknüpften Kontrollfragen und Aktivitäten aufbereitet. Frühere Notizen und Versionen bleiben im Kursarchiv erreichbar.

Der Prüfungsraum speichert Aufgaben-Snapshots, tatsächliche Antworten, Rechenwerte, Index, Markierungen, Frist und Ergebnisse. Die LF7-Stufen haben 10/15/20 Aufgaben und freiwillige 15/25/40 Minuten. Das Trainingsziel beträgt intern 80 %. Teilpunkte und Fehlerpunkte sind nachvollziehbar; Selbsteinschätzung und Zeichnen verändern die automatisch ermittelte Punktzahl nicht.

Alle acht Rechnerbereiche prüfen Zahlen und die Voraussetzungen ihres Modells. Leere/ungültige Felder liefern keine scheinbar gültigen Ergebnisse. Formel, eingesetzte Werte, Einheiten und Skizze stehen beim Ergebnis. Eingaben bleiben beim Wechsel erhalten; zusammengehörige Flächen- und Bedarfswerte lassen sich übernehmen.

Die Zeichenwerkstatt bietet Freihand, Linien, Kreise und Text, Raster, Zoom, Rückgängig/Wiederholen sowie SVG-Export. Maus/Trackpad/Pointer und Tastatur können dieselbe Fläche bedienen. JPEG/PNG-Fotos werden lokal gespeichert; HEIC verwendet ausschließlich in der Mac-App eine lokale Konvertierung. Mustervergleich und Rubrik bleiben als Selbsteinschätzung gekennzeichnet.

IndexedDB speichert Lernstände und Dateien. Die Übernahme vorhandener localStorage-Daten erfolgt mit einer atomaren Transaktion. Vollständige ZIP-Sicherungen enthalten Entwürfe und Fotos. Vorschau und Validierung erfolgen vor dem Import; bekannte alte JSON-Sicherungen bleiben nutzbar. Speicherfehler werden sichtbar und verhindern kein Weiterlesen bereits geöffneter Aufgaben. Vor dem Schließen mit ausstehenden Änderungen wird gewarnt.

## Technische Prüfung

Automatisierte Prüfungen decken Migration und erneutes Öffnen, Sicherung und Wiederherstellung einschließlich Bilddateien, abgebrochene Transaktionen, wiederhergestellte Eingaben, Prüfungsnavigation und absolute Deadline, ungültige Rechnermodelle, Glossarfokus sowie Zeichenwerkzeuge und Fotoimport ab. Build und statischer Mac-Export werden getrennt geprüft.

Der Browserdurchlauf kontrolliert Navigation, LF7-Einheit, erhaltene Hilfen-/Aufgabeneingaben, Prüfung nach Reload und Zeichnung nach Reload. Ein echter signierter Mac-Build und die native sips-Konvertierung benötigen macOS; reine IPC-/Konvertierungslogik kann mit kontrollierten Tests in der Cloud geprüft werden.

## Beobachteter Test mit Lernenden – noch durchzuführen

Mit vier bis sechs Auszubildenden unterschiedlicher Vorkenntnisse jeweils ungefähr 25 Minuten testen. Teilnahme und Aufzeichnung vorher vereinbaren. Keine dauerhaften Lerntyp-Etiketten vergeben; Aufgaben und Hilfebedarf beobachten.

1. Die Person findet auf der Übersicht den nächsten Lernschritt und öffnet LF7 ohne Erklärung durch die Testleitung.
2. Sie bearbeitet „Vier Bauteile, ein Wasserweg“. Bei einem unbekannten Begriff nutzt sie die Erklärung und kehrt zur Aufgabe zurück.
3. Sie erklärt den Wasserweg in eigenen Worten und bearbeitet Kontrolle und Zuordnung selbstständig.
4. Sie bearbeitet „Fläche wählen und schrittweise rechnen“ und überträgt den Rechenweg auf andere ausdrücklich vorgegebene Zahlen.
5. Sie beginnt ein LF7-Grundlagentraining, markiert eine Frage, wechselt zurück und schließt/öffnet die App. Die Antwort muss identisch sein.
6. Sie erstellt eine digitale Skizze oder importiert ein Papierfoto und nutzt die Vergleichskriterien.
7. Sie erstellt eine Sicherung und findet den Wiederherstellungsdialog; auf einem Testprofil die Sicherung inklusive Foto tatsächlich wiederherstellen.

Beobachtungsbogen je Aufgabe: Ziel gefunden? Selbstständig abgeschlossen? Benötigte Hinweise? Missverstandene Wörter? Fehler und vermutete Ursache? Zeit ohne Bewertung der Person? Aussage der Person im eigenen Wortlaut? Bei Rechenübertragung den nachvollziehbaren Weg und passende Einheiten prüfen, nicht nur das Endergebnis.

Abnahme: Alle Testpersonen müssen ohne verlorene Eingaben zu ihren Aufgaben zurückkehren können. Wiederkehrende Verständnis- oder Bedienprobleme zuerst korrigieren und den betroffenen Ablauf erneut beobachten. Der Aufbau wurde auf alle vorhandenen Bereiche übertragen. Beobachtete Verständnisschwierigkeiten in diesen Bereichen müssen anschließend ebenfalls mit Lernenden geprüft und verbessert werden. Der Erprobungsmodus unter `/erprobung` speichert diese tatsächlichen Beobachtungen; [Anleitung](ERPROBUNG.md).

## Bewusst nachgelagert

Beobachtete Lernendentests und anschließende Überarbeitung, Konten/Cloud-Synchronisierung, Meistervorbereitung, Apple-Signierung und Verlagsansprache. Aktuelle externe Webseitenvergleiche wurden wegen blockierter Abrufe nicht als Grundlage behauptet.

## Früherer Prüflauf für Version 0.2 am 24. Oktober 2026

- 369 automatisierte Tests in 53 Dateien bestanden.
- TypeScript ohne Fehler; ESLint ohne Fehler mit zwei unveränderten Warnungen in bestehenden Hilfsskripten.
- Produktionsbuild und statischer Export erfolgreich.
- Chromium am lokalen Desktop-Server: LF7-Entwurf, Rechner-/Glossarzustand, Prüfungsantworten und feste Fragen nach Reload, Tastaturzeichnung, Foto nach Reload und ZIP-Wiederherstellung erfolgreich; keine JavaScript-Laufzeitfehler.
- Fensterbreiten 390, 760, 1024 und 1280 Pixel geprüft; Schriftvergrößerung bis 130 % bei 390, 760 und 1280 Pixeln ohne horizontales Überlaufen geprüft. Das dabei gefundene Fieldset-Problem wurde korrigiert.
- Native macOS-Paketierung und tatsächliche sips-Konvertierung auf einem Mac sowie beobachtete Lernendentests stehen weiterhin aus.
