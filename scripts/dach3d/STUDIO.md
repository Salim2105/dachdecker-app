# Studiomedien v2 für Update 0.14

Stand der Produktion und Sichtprüfung: 1. November 2026. Die Dateien unter
`public/dach-medien/v2` ergänzen die veröffentlichten v1-Dateien. Bestehende
v1-Dateien, Aufgaben und eingefrorene Medienverweise werden nicht überschrieben.

## Eigene Modelle und Bilder

Die fünf Übersichten zeigen Satteldach und Walmdach mit jeweils Falzziegeln
beziehungsweise Biberschwanz-Doppeldeckung sowie das Warmdach. Sie werden mit
Blender 4.3.2 aus `roofs.py` erzeugt. Die neuen Keramikprofile, tatsächlichen
Fensteröffnungen, Rahmen, Laibungen und zurückhaltenden Oberflächen sind eigene
Geometrien und Materialien. Es wurden keine fremden Dachmodelle oder Videos
kopiert.

`studio_details.py` verwendet die vorhandenen Lehrkonstruktionen aus `details.py`
mit denselben funktionalen Schichten, Anschlüssen und Fehlerbeispielen. Nur der
v2-Prozess ersetzt Material-, Keramikprofil- und Renderfunktionen. Modell,
Nahansicht, Schnitt, Aufbauansicht und Fehlerbild entstehen aus derselben Szene.
Die gemeinsamen Anschlusskonstruktionen von Sattel- und Walmdach werden
wiederverwendet; die Walmdachdetails besitzen eigene Grat- und Zuschnittszenen.

Produziert sind fünf Übersichten und 104 Detailkontexte zu allen 34 Themen:
109 GLBs, 421 große WebPs und 421 kleine Vorschauen. Von den Detailkontexten
werden 68 separat erzeugt und 36 unverändert gemeinsam genutzt. Ein zusätzliches
HDR-Bild ergibt insgesamt 531 optionale Mediendateien mit 73.443.370 Byte.
Die kleinen Vorschauen gehören zum Grundangebot; große Medien laden gesondert.

Die Renderbilder sind Lehrdarstellungen definierter Aufbauten, keine Aufnahmen
ausgeführter Baustellen. Freigestellte Schichten und absichtlich eingebaute Fehler
sind Teil des jeweiligen Lernmodus.

## Produktion wiederholen

Zuerst die festgelegten optionalen Produktionspakete wie in
[DENOISING.md](DENOISING.md) installieren. Die Website und die Mac-App benötigen
weder Blender noch Python oder den Denoiser.

```bash
export DACH_DENOISE_PYTHON=/tmp/dach-denoise-env/bin/python
python3 scripts/dach3d/build-studio.py --resume
python3 scripts/dach3d/studio_details.py --produce-all --resume --workers 2
```

Höchstens zwei Blender-Prozesse mit jeweils zwei Threads laufen gleichzeitig.
Übersichten verwenden 64 Cycles-Samples bei 1.440 × 960 Pixeln; Details verwenden
16 Samples bei 960 × 640 Pixeln. Danach bereinigt Intel OpenImageDenoise 1.4.3
die linearen Float32-Bilder mit Albedo- und Normal-Hilfskanälen. Erst anschließend
folgen AgX und WebP. Vorschauen haben 480 × 320 Pixel. Die Receipts unter
`.dach3d-build-state` prüfen Parameter, Quelldateien, Hashes und Ausgabedateien,
bevor `--resume` einen Produktionsschritt überspringt.

Das tatsächliche Apache-2.0-Lizenzdokument des installierten `oidn`-0.2.1-Pakets
liegt unverändert unter [licenses/oidn-0.2.1-LICENSE.txt](licenses/oidn-0.2.1-LICENSE.txt).
OIDN und seine Binärdateien sind reine Produktionswerkzeuge und werden nicht mit
der App ausgeliefert. Die Herkunft des separat ausgelieferten CC0-HDR-Lichts
„Royal Esplanade“ und die geprüften Gestaltungsreferenzen stehen in
[dach-materialien-quellen.md](../../docs/dach-materialien-quellen.md).

## Durchgeführte Medienprüfung

Alle 109 GLBs wurden auf Dateistruktur, tatsächliche instanzierte Dreiecke,
Dateigröße und eingebettete Puffer geprüft; alle 842 WebPs lassen sich vollständig
decodieren. Jede Übersicht bleibt unter 6 MiB und 100.000 Dreiecken, jedes Detail
unter 10 MiB und 100.000 Dreiecken. Das größte Modell ist die Walmdachübersicht
mit Biberdeckung: 5.297.108 Byte und 94.522 Dreiecke.

Alle fünf fertigen Übersichten sowie richtige und fehlerhafte Ansichten aller
34 Themen wurden visuell geprüft. Zusätzlich wurden Biberdeckung, Biberkehle,
Walmschnitt, Flachdachschichten und Flachdach-PV in Nahansicht und Schnitt
kontrolliert. Keine schwarzen koplanaren Fassadenecken; PV und Fallrohre bleiben
vollständig im Bild; Kehlen, Grate und ausgesparte Anschlüsse bleiben sichtbar.
Die v1-Medien und ihr Manifest weisen gegenüber dem bestehenden Git-Stand keine
Änderungen auf.

Diese Medienprüfung ersetzt keine echte iPhone-Leistungsmessung, keinen
beobachteten Azubi-Test und keine fachliche Produktfreigabe. Solche Erprobungen
werden getrennt mit tatsächlich verwendetem Gerät und Aufbau dokumentiert.
