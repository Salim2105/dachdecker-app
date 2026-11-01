# 3D-Dach entdecken · Update 0.13

## Einstieg und Lernablauf

Unter **Baustellenprojekte → 3D-Dach entdecken** stehen drei Lehrdächer: ein Satteldach mit Gaube, ein Walmdach und ein beispielhaft festgelegtes Flachdach als Warmdach. Sattel- und Walmdach besitzen getrennte Falzziegel- und Biberschwanz-Doppeldeckungen. Die 16 Hauptbereiche und bisherigen Lernstände bleiben erhalten.

34 Detailthemen verbinden Bauteilfunktion, Aufbau, vier bis sechs Montageschritte, eine richtige Ausführung, einen dargestellten Fehler und zwei Kontrollfragen. Insgesamt gibt es 68 neue Fragen. Die beschriftete Bauteilliste bietet dieselben Einstiege wie die Markierungen am Modell. Öffnungen, Ränder, Aufbau, Wasserwege und Ausstattung sind getrennt auswählbar.

Die 3D-Ansicht lässt sich mit Maus und Touch drehen und zoomen. Schaltflächen und Pfeiltasten bieten die gleichen Kamerabewegungen. Feste Ansichten, Schnitte und auseinandergezogene Bauteile stehen zusätzlich bereit. Animationen beginnen durch bewusstes Abspielen; reduzierte Bewegung lässt die Schritte einzeln wechseln. Bei fehlendem WebGL oder einem nicht geladenen Modell bleiben eigene feste Renderansichten verfügbar.

Passende Einheiten in LF2, LF7 und LF8 sowie die beiden Werkstattpfade führen zum jeweiligen Detail. Biber-Verweise enthalten eine ausdrücklich geprüfte Deckungsangabe. Die bisherigen präzisen Werkstattzeichnungen bleiben ergänzend aufklappbar; ihre Koordinaten und interaktiven Übungen werden weiterverwendet.

## Gleicher Aufbau in Modell und Bild

Die Geometrie und Materialoberflächen entstehen mit eigenen Blender-Skripten unter `scripts/dach3d/`. Es werden keine fremden Fotos, Videoclips oder Modelle als eigene Arbeiten ausgegeben. Die Materialien verwenden selbst erzeugte Texturen und physikalisch basierte Materialwerte. Es handelt sich um gerenderte Lehrmodelle, nicht um Fotos von ausgeführten Dächern.

Die fünf Dach-/Deckungsvarianten bilden insgesamt 104 passende Detailkontexte ab. Für jeden Kontext werden ein GLB-Modell und vier feste Ansichten erzeugt: Nahansicht, geometrischer Schnitt, auseinandergezogener Aufbau und bewusst veränderte Fehlerausführung. Die Bilder stammen aus derselben Szene; die Fehlerbilder verändern die im Text beschriebene Geometrie. Inhaltlich identische Detailausschnitte von Sattel- und Walmdach dürfen dieselben Dateibytes verwenden.

Die Systemkarten legen die gezeigten Übungsaufbauten und ihre Grenzen offen. Sie ersetzen keine produktbezogene Ausführungsplanung. Falzziegel und Biber werden getrennt dargestellt; das Flachdach besitzt seinen eigenen Schichtenaufbau. Individuelle Produktmaße, Befestigungsnachweise und Sonderkonstruktionen gehören weiterhin zur konkreten Planung in Betrieb oder Schule.

## Speicherung und ehrliche Auswertung

`dach3d-erkundung-v1` speichert je Dachform den ausgewählten Bereich, Deckungsart, Kameraposition, sichtbare Schichten, Lernschritt und Modus. Notizen und erste Antworten bleiben erhalten. Eine Antwort friert ihren Fragetext, Lösungsvorgaben, Inhaltsversion und tatsächliche Bildreferenz bereits vor der Abgabe ein. Ein späterer Dachwechsel ändert diese Referenz nicht.

Erkunden vergibt keine Wissenspunkte. Zwei beantwortete Kontrollfragen können einen digitalen Verständnisnachweis erzeugen; praktische Ausführung und Transfer werden dadurch nicht behauptet. Geöffnete Erklärungen, Begriffshilfen und unmittelbare Antworten nach einem Feedback bleiben als Unterstützung erkennbar. Dieser Kontext wird auch beim Wechsel zwischen 3D-Detail und Tagesrunde berücksichtigt. Erneutes Öffnen einer Auswertung zählt denselben Versuch nicht doppelt.

Die 68 Fragen stehen zusätzlich als kurze Bildaufgaben in der Tagesrunde bereit. Eine tatsächlich abgegebene Antwort im Dachdetail erhält dort einen Wiederholungstermin; genutzte Hilfen bleiben berücksichtigt. Diese Runde benötigt keinen laufenden 3D-Betrachter. Auch ihre Auswertung zeigt dieselbe eingefrorene Renderansicht.

Vollständige ZIP-Sicherungen enthalten den neuen Lernstand, Antworten sowie private Zeichnungen und Fotos. Herunterladbare öffentliche Modelle liegen getrennt davon und werden nicht in jeder privaten Sicherung dupliziert. Alte Sicherungsformate bleiben importierbar.

## Offline-Pakete und Updates

Texte, Oberfläche und kleine feste Vorschaubilder gehören zum Grundpaket. Große GLB-Dateien und große Ansichten unter `/dach-medien/` werden erst bei Bedarf geladen. Drei getrennte Dachpakete zeigen ihre Größe und ihren Downloadfortschritt; sie lassen sich wieder entfernen.

Jede Datei besitzt eine Größe und SHA-256-Prüfsumme im Medienverzeichnis. Ein Paket wird erst nach dem vollständigen geprüften Download bestätigt. Abbruch, ein Speicherfehler oder fehlerhafte Bytes ersetzen kein bisher vollständiges Paket. Gemeinsame Inhaltsbytes werden wiederverwendet. Das Entfernen eines Downloads löscht keine Antworten oder privaten Fotos.

Der Betrachter verwendet Three.js, React Three Fiber und Drei ausschließlich auf dem Gerät. Eingebettete Texturen und die unterstützte Standard-Quantisierung benötigen keine externen Decoder oder CDNs. Es läuft jeweils eine aktive Szene; verdeckte Szenen werden beendet. Die vorhandene ausdrückliche Freigabe eines Webseiten-Updates bleibt erhalten.

## Herstellung und technische Abnahme

Die tatsächlich ausgeführten Prüfungen und die noch offenen Gerätetests stehen im [Abnahmebericht](abnahme-dach-0.13.md).

Die lokale Produktionsumgebung benötigt Blender 4.3 oder neuer sowie die in `package-lock.json` festgelegten Node-Werkzeuge. Inhaltsexport und Medienverzeichnis werden erzeugt mit:

```bash
node scripts/dach3d/export-inhalte.mjs
python3 scripts/dach3d/build.py
node scripts/dach3d/manifest.mjs
npm run media:check
```

`media:check` prüft alle 104 Kontexte, 530 große Medien und 421 kleine Vorschaubilder, Dateigrößen, Prüfsummen, gültige GLB-Dateien, eingebettete Texturen und die zugeordneten Bauteilmarkierungen. Das Budget beträgt höchstens 6 MiB je Übersichtsmodell, 10 MiB je Detailpaket und 100.000 sichtbare Dreiecke. Build und statischer Export führen diese Prüfung verpflichtend aus.

Zu den automatisierten Prüfungen gehören Inhaltsvollständigkeit, plausibel getrennte Dachzuordnungen, Kamerawiederaufnahme, feste Antworten, Hilfeverwendung, einmalige Nachweise, Sicherungswiederherstellung sowie unterbrochene und fehlerhafte Downloads. Browserprüfungen ergänzen den tatsächlichen Modellaufbau und die Bedienung ohne WebGL.

**Noch getrennt durchzuführen:** tatsächliche Übungen mit Azubis, Safari auf einem echten iPhone, die Bildrate bei Touch-Bedienung auf diesem Gerät und das native macOS-Bundle. Diese Erprobungen werden durch einen Chromium-Test in der Cloud nicht ersetzt. Praxisvideos und NotebookLM-Clips sind nicht Teil dieser Version.

## Auf dem Mac und auf der Test-Website

Die installierte App vollständig schließen und den bisherigen Update-Ablauf verwenden:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
bash scripts/install-mac-neu.sh
```

Das Website-Paket wird anschließend mit `bash scripts/probe-teilen.sh` über Salims vorhandene Hosting-Anmeldung hochgeladen. Der dauerhafte Test-Link bleibt `https://dachdecker-probe-salim2105.pages.dev/`. Der Kollege benötigt kein Konto. Ein vorbereiteter Export in der Cloud veröffentlicht die Website noch nicht.
