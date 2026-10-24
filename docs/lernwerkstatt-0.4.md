# Lernwerkstatt 0.4

## Alle vorhandenen Lernfelder

Die bisherige automatische Textaufteilung wird für sämtliche vorhandenen Lernfelder, die drei Anhänge und WiSo durch eigenständig formulierte kurze Einheiten ersetzt. Insgesamt 402 Einheiten decken sämtliche 387 sichtbaren Quellenlektionen ab. LF1–17 enthalten mit den getrennten Varianten LF13a und LF13b insgesamt 18 berufliche Lernbereiche. Eine zusätzliche offizielle Nummer LF18 wird nicht erfunden.

Die Einheiten enthalten ein konkretes Lernziel, 80–150 Wörter je Textschritt, einen eigenen Abrufversuch, zwei bis vier ausdrücklich zugeordnete Bestandsaufgaben und eine aktive Anwendung. Die vier Formen sind Zuordnen, Reihenfolge, Skizzenfehler und Baustellenfall. Vorhandene Quellenzeichnungen erscheinen direkt beim Lerntext, ausführliche Quellen und Tabellen bleiben zusätzlich erreichbar. Geeignete Kontrollaufgaben können aus anderen Lernfeldern stammen, etwa bauphysikalische Aufgaben zum Dachaufbau.

LF7 behält seine bestehenden Einheits-IDs und Version 1. Die weiteren Kurse erhalten Version 2 bei stabilen Quellenbezügen. Eine alte Notiz wird bei passender Einheits-ID übernommen; neue Kontrollen und Anwendungen starten offen. Frühere Versionen und weggefallene Textteile bleiben im aufklappbaren Kursarchiv lesbar. Weder alte Quelldateien noch Aufgaben-IDs oder frühere Lernstände werden gelöscht.

## Fachmathe, Deutsch und Englisch

Fachmathe umfasst zehn Einheiten mit 30 Rechenaufgaben: Längen, Flächeneinheiten, Brüche, Prozent, Dreisatz, Flächen, Pythagoras, Maßstab, Gefälle und Volumen. Zu jeder Einheit gehören eine erklärende Skizze, selbst eingegebene Ergebnisse mit Einheit und drei aufdeckbare Rechenhilfen. Rückmeldungen benennen typische Fehler wie einen falschen Flächenfaktor oder die Verwechslung von Reserve und Gesamtmenge. Eingaben, Notizen und genutzte Hilfen bleiben gespeichert.

Deutsch fürs Handwerk und Baustellenenglisch enthalten jeweils sechs Einheiten mit insgesamt 36 objektiv geprüften Sprachaufgaben. Arbeitsaufträge, Grenzwörter, Berichtsheft, Fachbegriffe, Übergaben und Rückfragen ergänzen Werkzeuge, Werkstoffe, Maße und einfache englische Anweisungen. Die freiwilligen eigenen Formulierungen werden anhand von Muster und Kriterien selbst eingeschätzt; sie werden nicht automatisch als fachlich oder sprachlich richtig bewertet. Die englischen Beispielsätze lassen sich bei verfügbarer Geräte-Stimme anhören.

Die Übersicht, der Lernpfad und der Übungsraum führen zu den neuen Bereichen. Die Hauptaktion „Weiterlernen“ berücksichtigt auch zuletzt geöffnete Mathe- und Spracheinheiten.

## Gezielte Hilfe statt fester Lerntypen

Ein freiwilliger Standortcheck enthält sechs Aufgaben. Danach und nach weiteren Übungen entstehen konkrete Hinweise zu Einheiten, Formeln, Rechenwegen, Begriffen oder Sprache. Grundlage sind jüngste automatisch geprüfte Antworten und tatsächlich genutzte Hilfen. Zwei verschiedene, aufeinanderfolgend ohne Hilfe gelöste Aufgaben desselben Lernziels lösen frühere Hinweise auf. Wiederholungen nach Musterlösung und Selbsteinschätzungen zählen nicht als unabhängiger Nachweis.

Lernende können jederzeit selbst einen anderen Bereich wählen. Die Hinweise behaupten keine medizinische, schulpsychologische oder dauerhafte Einstufung. Alle Daten bleiben auf dem Gerät und sind in der vollständigen ZIP-Sicherung enthalten.

## Erprobung mit Azubis

Unter `/erprobung` stehen acht Beobachtungsaufgaben bereit. Eine Testleitung kann getrennte anonyme Sitzungen, benötigte Hilfen, unbekannte Begriffe, Missverständnisse und tatsächliche Ergebnisse festhalten und als JSON oder CSV exportieren. Nicht beobachtete Aufgaben bleiben offen. [Ablauf und Abnahmekriterien](ERPROBUNG.md).

Die Software und der Testablauf sind vorbereitet. Tatsächliche beobachtete Tests mit Lernenden und eine anschließende Überarbeitung aufgrund dieser Beobachtungen stehen aus. Die Sprachwerkstätten sind eigene ergänzende Übungsangebote, keine Behauptung eines aktuell verifizierten Stundenplans einer bestimmten Schule.

## Technische Prüfung

Inhaltstests prüfen Quellenabdeckung, stabile IDs, sichtbare Kontrollaufgaben, kurze Texte und vollständige Aktivitäten. Funktionsprüfungen prüfen Zahlenwerte und Einheiten, beschädigte Entwürfe, Notizübernahme, Archiv, Unterbrechung und Wiederöffnung, Hilfeverwendung und getrennte Selbsteinschätzung. Browserdurchläufe prüfen die tatsächliche IndexedDB-Speicherung und neue Bereiche in verschiedenen Fenstergrößen. Produktionsbuild und statischer Mac-Export werden getrennt ausgeführt.

Native Mac-Paketierung und HEIC-Konvertierung müssen weiterhin auf macOS ausgeführt werden. Die neue Version wird mit `scripts/install-mac-neu.sh` im bestehenden Projektordner installiert; Lernstände liegen außerhalb des Programmpakets.

## Prüflauf am 24. Oktober 2026

- 512 automatisierte Tests in 67 Dateien bestanden; abschließend 17 betroffene UI-Tests nach kleinen Beschriftungsänderungen erneut bestanden.
- TypeScript fehlerfrei; ESLint ohne Fehler, mit zwei unveränderten Warnungen in vorhandenen Hilfsskripten.
- Produktionsbuild und statischer Mac-Export erfolgreich; alle fünf neuen Routen im Offline-Export enthalten.
- Chromium am tatsächlichen lokalen Desktop-Server: alle 22 Kurse geöffnet; Mathe- und Sprachentwürfe nach Neustart erhalten; Diagnose nach Fehler und Auflösung durch zwei verschiedene neue Aufgaben geprüft; Weiterlernen und Beobachtungsexport geprüft.
- Neue Bereiche bei 390, 760 und 1280 Pixeln und 130 % Schrift ohne horizontales Überlaufen; Hell- und Dunkelansicht kontrolliert.
- Bestehende Prüfungssnapshots, Rechner-/Glossarzustand, Tastaturzeichnung, Papierfoto und vollständige ZIP-Wiederherstellung weiterhin erfolgreich geprüft.
- Tatsächliche Nutzertests und native Ausführung auf einem Mac wurden in dieser Cloud-Umgebung nicht durchgeführt.
