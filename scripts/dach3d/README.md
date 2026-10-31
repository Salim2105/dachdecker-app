# Eigene Dach-Lehrmodelle

Die Geometrien und Texturen in dieser Produktion sind eigene Arbeiten. Es werden keine Schulbuchbilder, fremden Fotos oder heruntergeladenen Hausmodelle in die GLBs eingebettet. `common.py` erzeugt die Materialien und reproduzierbare Oberflächen, `roofs.py` die Gesamtdächer und `details.py` die zugehörigen Lehrdetails. Es gibt keine Fremd-CDNs und keine aus dem Internet geladenen Decoder.

Die Modelle sind herstellerneutrale, festgelegte **Lehrbeispiele**. Sie sind weder Ausführungsplanung noch Produktfreigabe. Reale Produktmaße, Lastnachweise und Anschlussanweisungen gehören zum jeweils verwendeten System. Ein Detail ist ein eigens modellierter Ausschnitt derselben beschriebenen Bauweise, kein automatisch maßidentisch aus dem Hausmodell geschnittener CAD-Ausschnitt.

## Produktion

Voraussetzungen: Blender 4.3+, Python 3, Node.js 24 und `npm ci`. Die GLB-Optimierung verwendet die festgelegten `@gltf-transform`-Entwicklungsabhängigkeiten. Die Standard-Erweiterung `KHR_mesh_quantization` wird vom lokalen Three.js-Loader direkt unterstützt.

```bash
node scripts/dach3d/export-inhalte.mjs
blender -b -t 2 --python scripts/dach3d/audit_geometry.py
python3 scripts/dach3d/build.py
npm run media:check
```

Der vollständige Lauf verwendet höchstens zwei Blender-Prozesse mit je zwei Threads. Ein unterbrochener Lauf lässt sich mit `python3 scripts/dach3d/build.py --resume` fortsetzen. Produktionsquittungen unter `.dach3d-build-state/` gehören nicht zur App und nicht zum Lernstand. Eine Wiederaufnahme prüft Quellcode-Fingerabdruck, Parameter, Dateigrößen und SHA-256-Hashes; bloß vorhandene Dateien genügen nicht. Nach einer Änderung am Modellcode werden betroffene Quittungen ungültig. Ein Blender-Prozess hält die beim Start gelesenen Quellen fest, damit nachträgliche Änderungen nicht fälschlich als seine verwendete Version quittiert werden.

Die fünf Dach-/Deckungsvarianten enthalten 104 Detailkontexte. Wiederkehrende konstruktiv gleiche Details von Sattel- und Walmdach verwenden dieselben Bytes. Die eigenständigen Grat- und Walmthemen werden getrennt erzeugt. Insgesamt werden 109 GLBs, 421 große Renderbilder und 421 kleine Vorschaubilder bereitgestellt. Das öffentliche Medienverzeichnis enthält ausschließlich die 530 optionalen großen Dateien mit Größen und Prüfsummen.

## Darstellung und Grenzen

Nahansicht, Schnitt, auseinandergezogener Aufbau und Fehlerbild eines Details entstehen aus derselben Szene. Schnittdarstellungen schneiden tatsächliche Geometrie. Die korrekte Szene wird für den GLB-Export vollständig neu aufgebaut; absichtlich geöffnete Lehransichten und Fehlerzustände werden nicht als korrektes Modell exportiert.

Verdeckte Anschlussstellen werden in den festen Bildern teilweise geöffnet: unter anderem Schichtanschlüsse, Fenster, Gaube, Befestigungen und Teile der Dachausstattung. PV-Module können dabei abgehoben dargestellt sein. Diese Lehröffnungen gelten für richtiges und fehlerhaftes Vergleichsbild gleichermaßen. Nur die jeweils im Text beschriebene Abweichung wird im Fehlerbild zusätzlich verändert. Bildunterschriften kennzeichnen die Ausschnittdarstellung. Die GLBs enthalten dagegen den vollständigen Aufbau mit bedienbaren Schichten.

Bewegung und Wasserweg sind erklärende Abläufe. Sie simulieren weder Baustellenphysik noch Hydraulik. Materialien besitzen eigene PBR-Oberflächen und Beleuchtung; die Bilder sind Renderings, keine Fotos realer Ausführungen. Die aktuelle Produktion verwendet 16 Samples für Übersichten und 8 Samples für Detailbilder; bei Vergrößerung kann Renderrauschen sichtbar bleiben.

## Prüfungen

`audit_geometry.py` prüft alle 104 Szenenkontexte auf vorhandene semantische Bauteile und tatsächliche Änderungen des Fehlerzustands. Zusätzlich prüft es die beiden Gefälleflächen an je 10.201 Punkten, Biber-Überdeckungen und den geometrischen Abstand der Deckelemente über den tatsächlichen Kehl-/Gratunterlagen. Diese maschinellen Prüfungen ersetzen keine Sichtkontrolle: Beispielsweise kann ein geändertes Teil weiterhin von einem anderen Bauteil verdeckt sein.

`media:check` prüft Vollständigkeit, Datei-Hashes, Dateigrößen, GLB-Struktur, eingebettete Texturen, Bauteilmarkierungen, maximal 100.000 Dreiecke, höchstens 6 MiB je Übersicht und höchstens 10 MiB je Detailpaket. Eine zusätzliche Sichtprüfung umfasst die richtigen und fehlerhaften Bilder aller 34 Themen, einschließlich gemeinsamer Themen am Flachdach. Geräte-Bildraten, echte Safari-/iPhone-Tests und Erprobungen mit Auszubildenden bleiben getrennte tatsächliche Tests.

Der abgeschlossene Produktionsstand für 0.13 enthält 530 optionale Dateien mit zusammen 129,8 MiB sowie 421 kleine Vorschaubilder. Die Dateiprüfung bestätigt alle 104 Modellkontexte; die größten Werte liegen bei 87.856 Dreiecken, 5,32 MiB pro Übersicht und 1,74 MiB pro Detailpaket. Der abschließende Geometrie-Lauf meldet `AUDIT_DONE 104 0`. Diese Angaben beschreiben die tatsächlich geprüften Dateien, keine gemessene Bildrate auf einem echten iPhone.

Die Kamera-Prüfung projiziert nach jeder Pose die tatsächlich sichtbaren Geometriegrenzen in die Renderansicht. Ein Rand von mindestens 3,5 Prozent bleibt frei; dazu gehören auch angehobene PV-Module und auseinandergezogene Schichten. Verdeckte Geometrie zählt dabei nicht als sichtbarer Inhalt. So ersetzen bloße Bauteilzählungen keine Prüfung, ob das Lernbild sein Motiv vollständig zeigt.
