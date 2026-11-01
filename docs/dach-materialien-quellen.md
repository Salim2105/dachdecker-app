# Quellen und Gestaltungsvorbilder für die Dachdarstellung

Recherche vom 1. November 2026. Der Netzwerk-Proxy blockiert die direkten Seiten von Poly Haven, ambientCG, Sketchfab, VELUX, Dörken und modelviewer.dev mit `CONNECT 403`. Die unten als geprüft genannten Quellen wurden tatsächlich über ihre offiziellen GitHub-Quellen abgerufen. Eine Prüfung dieser Quellen ist keine Behauptung, die blockierten Live-Webseiten oder Herstellerfilme angesehen zu haben.

## Übernommenes Material

| Angabe | Nachweis |
|---|---|
| Material | **Royal Esplanade 1K**, HDR-Umgebungslicht von Poly Haven/HDRI Haven |
| Verwendung | Licht und Reflexionen im 3D-Betrachter; keine fremde Dachgeometrie |
| Lokale Datei | `public/dach-medien/v2/gemeinsam/royal_esplanade_1k.hdr` |
| Größe | 1.667.276 Byte |
| SHA-256 | `d72031e24581a0f13911fbcdee475db0f8cafcf48bf1771c6b971c3310db6cb2` |
| Erfolgreich abgerufene Datei | [Three.js-Spiegel, festgelegter Stand r180](https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/textures/equirectangular/royal_esplanade_1k.hdr) |
| Herkunftsverweis im Three.js-Beispiel | [GLTF-Beispiel mit namentlichem HDRI-Haven-Verweis](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_loader_gltf.html) |
| Lizenznachweis | [Offizielle Poly-Haven-Lizenzbeschreibung im Website-Quellcode](https://raw.githubusercontent.com/Poly-Haven/polyhaven.com/master/public/locales/en/license.json) |
| Lizenz | **CC0 1.0**; die erfolgreich abgerufene Lizenzbeschreibung erlaubt kommerzielle Nutzung und Weitergabe der Assets |

Die ursprüngliche Projektseite ist [Poly Haven · Royal Esplanade](https://polyhaven.com/a/royal_esplanade); ihr Direktabruf war in dieser Umgebung blockiert. Der Three.js-Code und die erfolgreich abgerufene Datei benennen dasselbe HDRI. Die Poly-Haven-Lizenzbeschreibung gilt ausdrücklich für alle dort angebotenen HDRIs, Texturen und Modelle. Der individuelle Fotograf wurde nicht unabhängig nachgeprüft; es wird kein unbestätigter Personenname ergänzt.

Die HDRI-Datei wird lokal ausgeliefert. Zur Laufzeit ist kein Zugriff auf Three.js, Poly Haven oder ein anderes CDN erforderlich. Sie ersetzt kein fachlich richtig modelliertes Dach. Bei fehlender Datei oder eingeschränktem Gerätespeicher muss die bisherige lokale Lichtumgebung als Ersatz verfügbar bleiben.

## Geprüfte technische und gestalterische Referenzen

| Referenz | Tatsächlich geprüft | Konkrete Konsequenz für die Lernwerkstatt |
|---|---|---|
| [Three.js · GLTF-Produktdarstellung](https://threejs.org/examples/#webgl_loader_gltf) | [Quellcode](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_loader_gltf.html) und [Beispielbild](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/screenshots/webgl_loader_gltf.jpg) erfolgreich abgerufen; Bild angesehen | Eine zusammenhängende Lichtumgebung, nachvollziehbare Materialreflexionen und gedämpfte Kamerabewegung statt flacher Beleuchtung und harter Sprünge. |
| [Three.js · Physikalische Beleuchtung](https://threejs.org/examples/#webgl_lights_physical) | [Quellcode](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_lights_physical.html) erfolgreich abgerufen | Belichtung, Rauheit und Schatten bewusst abstimmen. Tonziegel brauchen eine matte Oberfläche; Zink und Glas dürfen unterscheidbare Reflexionen besitzen. |
| [Google model-viewer · Bauteilmarkierungen](https://modelviewer.dev/examples/annotations/) | [Offizieller Quellcode](https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/examples/annotations/index.html) erfolgreich abgerufen | Bauteilmarkierungen sollen das Modell erklären, ohne es mit Text zu verdecken. Beschriftete Auswahl und fokussierbare Bedienelemente bleiben gleichwertig erreichbar. |
| [Google model-viewer · Materialien und Auswahl](https://modelviewer.dev/examples/scenegraph/) | [Offizieller Quellcode](https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/examples/scenegraph/index.html) erfolgreich abgerufen | Auswahlzustand, Materialien und Modellansicht zusammenführen; das Modell bleibt der Mittelpunkt, ausführliche Informationen folgen in einer klar abgegrenzten Fläche. |
| [Three.js · Animationsübergänge](https://threejs.org/examples/#webgl_animation_skinning_morph) | [Quellcode](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_animation_skinning_morph.html) erfolgreich abgerufen; enthält zeitgesteuertes Überblenden | Bewegung anhand verstrichener Zeit interpolieren. Montagezustände nicht schlagartig ein-/ausblenden; Pause, Wiederholen und reduzierte Bewegung berücksichtigen. Die Figuren dieses Beispiels werden nicht übernommen. |
| [Three.js · Architektur/BIM-Auswahl](https://github.com/mrdoob/three.js/blob/r158/examples/webgl_loader_ifc.html) | Quellcode und [Beispielbild](https://raw.githubusercontent.com/mrdoob/three.js/r158/examples/screenshots/webgl_loader_ifc.jpg) erfolgreich abgerufen | Einzelne Bauteile in einer räumlich zusammenhängenden Konstruktion auswählen. Der technische Modellzusammenhang ist hilfreicher als eine Sammlung unverbundener Einzelbilder. Kein IFC-Modell oder Fremd-CDN aus diesem alten Beispiel wird übernommen. |

Zusätzlich wurde die [Drei-Stage-Implementierung](https://github.com/pmndrs/drei/blob/master/src/core/Stage.tsx) gelesen: Modellzentrierung, kontrollierte Kameraanpassung, Kontakt-/Bodenschatten und Umgebungslicht gehören zusammen. Die dortige CDN-basierte Standard-Umgebung ist kein Grund, fremde Laufzeit-Abhängigkeiten in die Offline-App aufzunehmen.

## Nicht übernommen

Es wurden keine ungeprüften Herstellerfilme, geschützten Sketchfab-Modelle oder Materialpakete ohne belegte Lizenz heruntergeladen. Die direkten Textur-APIs von Poly Haven und ambientCG waren blockiert. Daher wird kein angeblich überprüftes Tonziegel-, Holz- oder Zinkpaket behauptet. Eigene Geometrie und Materialien bleiben dort erhalten, bis ein nutzbarer, nachweislich lizenzierter Ersatz vorliegt.
