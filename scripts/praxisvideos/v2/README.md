# Werkstattfilme v2 · Update 0.16

Drei eigene Falzziegel-Lehrfilme verwenden dieselbe Systemkarte und dieselben
Aufgaben wie die Werkstatt: Schnitt planen, Material bearbeiten und vier Ziegel
verlegen. Dateien unter `public/praxisvideos/v1` bleiben unverändert. Die neuen
Filme liegen unter `public/praxisvideos/v2`; sie werden als H.264/AAC-MP4 mit
1.920 × 1.080 Pixeln und 30 tatsächlich gerenderten Bildern je Sekunde erzeugt.
Es gibt kein Hochskalieren, keine Zwischenbild-Erfindung und kein pauschales
Auffüllen des Sprechertexts mit der letzten Bewegungsposition.

## Produktionsmaschine

Vorausgesetzt sind Blender 4.3+, Node.js, Chromium, FFmpeg/FFprobe und die
persistente Sprach-/Playwright-Umgebung aus [VOICE.md](../VOICE.md). Dies sind
**Produktionsabhängigkeiten**. `npm ci`, Mac-Installation, normaler Build und
Wiedergabe benötigen weder Blender noch TTS, FFmpeg oder die Modellgewichte.
Alle nachstehenden Befehle laufen aus dem Repository-Stamm.

```sh
node scripts/praxisvideos/v2/content.mjs
blender -b -t 4 --python scripts/praxisvideos/v2/models.py
.praxisvideo-production/voice-env/bin/python scripts/praxisvideos/voice.py \
  --content .praxisvideo-production/v2/content.json \
  --model-dir .praxisvideo-production/model/tts_models--de--thorsten--vits \
  --audio-dir .praxisvideo-production/v2/audio \
  --vtt-dir public/praxisvideos/v2
```

Der Inhaltsexport übernimmt vorhandene gemessene Zeiten nur bei identischem
Sprechertext. Blender erzeugt eigene Modelle sowie eigene Farb-, Rauheits- und
Normaltexturen in `.praxisvideo-production/v2/models`. Maße und die Lage des
Anrisses stammen aus Systemkarte und Aufgabenzeichnung. Ungeschnittene Ziegel
verwenden einen durchgehenden Körper; echte Schnittteile erscheinen erst nach
vollständig durchgeführtem Schnitt. Die gekrümmte Schutzhaube besitzt glatte
Kurvennormalen, während ihre geschlossenen Seiten eben bleiben.

## Vorschau und vollständige Produktion

```sh
node scripts/praxisvideos/v2/render.cjs --stills
node scripts/praxisvideos/v2/render.cjs --preview
sh scripts/praxisvideos/v2/run.sh
tail -f .praxisvideo-production/v2/render.log
```

`--stills` erzeugt die drei repräsentativen JPEGs. `--preview` ergänzt eine
10-Sekunden-Sequenz mit 300 echten Bildern. Vor dem vollständigen Lauf werden
Materialwirkung, Kontakt, Kameraführung, Markierungen und die Handyansicht
geprüft. Ein einzelner Film lässt sich mit
`--id=werkstatt-falzziegel-schnitt` auswählen. Derselbe Aufruf setzt passende,
vollständig geschriebene Einzelbilder fort.

Standard ist ANGLE mit **Mesa/EGL, llvmpipe und vier Rasterthreads**. Die CLI
setzt `EGL_PLATFORM=surfaceless`, `LP_NUM_THREADS=4` und `MESA_NO_ERROR=1` nur für
den gestarteten Chromium-Prozess. Es wird keine Hardware-GPU vorausgesetzt.
`--backend=swiftshader` erlaubt eine ausdrücklich gewählte langsamere
Alternative; ein anderer Backend-Name wird abgelehnt. Es gibt keinen stillen
Wechsel zwischen Renderern. Die dokumentierte Mesa-Optimierung ändert weder
Auflösung noch Bildrate, Modelle, Materialien, Schatten oder Animation.

Die verwendete, lokal ausgelieferte HDR-Lichtumgebung liegt bereits unter
`public/dach-medien/v2/gemeinsam/royal_esplanade_1k.hdr` und bleibt unverändert.
Material, Kameras und Licht stammen aus `scene.mjs`; alle sieben Kapitel haben
einen eigenen zeitlichen Ablauf. Titel und Kapitel stehen im App-Player;
notwendige Modellmarkierungen sind im Film enthalten, der Sprechertext als
getrennte WebVTT-Datei.

## Prüfnachweise und Veröffentlichung

`preview/receipt.json` enthält den gewählten Renderer und seine tatsächliche
GL-Kennung. Der Produktionsfingerabdruck enthält alle fünf Quellskripte, alle
fünf GLBs einschließlich `tile-cut`, Systemkarte/Aufgaben, HDR-Datei, Backend,
Parameter und Chromium-/Grafikversion. Unterschiedliche Konfigurationen teilen
keine Bild-Caches. Filmbelege unter `render/<video-id>/receipt.json` verzeichnen
zusätzlich Audio-SHA, jedes Kapitel, Bildzahl, Bildverzeichnis und MP4-SHA.

Für jeden Film muss `frames` genau `ceil(dauer × 30)` sein. Das zugehörige
Bildverzeichnis enthält für jede dieser Positionen eine tatsächlich gerenderte
JPEG-Datei; FFprobe prüft dieselbe Bildzahl sowie H.264, AAC und 1080p/30fps.
Die drei endgültigen MP4s bleiben jeweils unter 25 MiB. Der Renderlauf aktiviert
keinen unvollständigen App-Katalog. Erst nach vollständiger Produktion werden
aktuelle Metadaten und Medienmanifest auf die drei v2-Fassungen umgestellt;
die ursprünglichen Fassungen bleiben im Archiv erreichbar.

```sh
node scripts/praxisvideos/check.mjs --v016 --deep
```

Die Bild- und Kameraprüfung ist eine technische Sichtprüfung des Lehrmodells.
Sie ist keine Erprobung am echten Gerät oder an einer ausgeführten Baustelle.
Beobachtete Azubi-Tests und die Nutzung auf echten Mac-/iPhone-Geräten werden
getrennt dokumentiert.
