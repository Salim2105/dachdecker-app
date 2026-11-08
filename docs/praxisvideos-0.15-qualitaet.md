# Praxisvideos 0.15 – dokumentierte Sichtprüfung

Stand der ersten Sichtprüfung: 8. November 2026. Geprüfter Renderer:
`three-geometry-015-r1`, `sceneSha`
`97a9264b22cb61dfd8078c5a132a54441f6d89d5aff25a527bb81001a7acefe7`.
Diese Prüfung ist eine begrenzte Sichtprüfung und keine fachliche Freigabe
sämtlicher Arbeitsschritte.

## Umfang und Nachweise

Die Stichprobe umfasst alle 34 unterschiedlichen Dachthemen, alle acht
Werkstattclips und die fünf Kombinationen aus Dachform und Deckung. Tatsächlich
angesehen wurden 173 unterschiedliche Render-Einzelbilder und alle 112
veröffentlichten WebP-Poster. Die Einzelbilder wurden überwiegend in
Kontaktbögen verglichen; die auffälligen Fälle `f02` und `f09` zusätzlich mit
1280 Pixel breiten Detailbildern.

Für jedes Dachthema wurden Kapitel 4, Pose 30, sowie Kapitel 7, Pose 0 und
Pose 47, verglichen. Für alle acht Werkstattclips wurden die Endposen der
Kapitel 3 bis 6 und drei Zustände des Fehlerkapitels betrachtet. Zusätzliche
Folgen mit Pose 0, 24 und 47 zeigen Anzeichnen, Werkzeugführung,
Reststücktrennung, Einsetzen der Reihen und Korrektur eines angehobenen Ziegels.
Die fünf Dachübersichten wurden mit den zugehörigen Postern verglichen.

Die Auswahl stammt aus den `visualCache`-Pfaden der jeweiligen
`.praxisvideo-production/render/clips/<id>/receipt.json`, nicht aus einem
unabhängigen Demonstrationsmodell. Lokale Prüfnachweise liegen unter
`.praxisvideo-production/review/`:

- `selection.json`: die 42 ausgewählten Clips mit ihren Kapiteltexten.
- `topics-1.jpg` bis `topics-6.jpg`: alle 34 Dachthemen, Schnitt und
  Fehler/Korrektur im Vergleich.
- `craft-1.jpg` bis `craft-4.jpg`, `craft-fault-1.jpg` und
  `craft-fault-2.jpg`: alle acht Werkstattclips.
- `motion-1.jpg` und `motion-2.jpg`: sechs Bewegungsfolgen mit drei Posen.
- `contexts.jpg`: fünf veröffentlichte Poster neben der tatsächlichen
  Dachübersicht.
- `posters-all-1.jpg` bis `posters-all-4.jpg`: alle 112 veröffentlichten Poster.
- `dach-flachdach-warmdach-f02-detail.jpg` und
  `dach-flachdach-warmdach-f09-detail.jpg`: die beiden gesondert betrachteten
  Auffälligkeiten.

`make-sheets.py` und `motion-sheets.py` im selben lokalen Prüfverzeichnis
erzeugen die Kontaktbögen erneut aus vorhandenen Bilddateien. Diese lokalen
Produktions- und Prüfartefakte sind kein Bestandteil der ausgelieferten App.

## Sichtbar bestätigte Eigenschaften

Die fünf Übersichten zeigen das jeweils bezeichnete Dach: Satteldach mit
Gaube oder Walmdach, jeweils mit Falzziegeln beziehungsweise
Biberschwanz-Doppeldeckung, sowie das Flachdach/Warmdach. In der Stichprobe
wurde keine vertauschte Dachform oder Deckung festgestellt. Die Titel- und
Kapitelbeschriftungen passen in den betrachteten Postern in ihre Textflächen.

Die Werkstattanimationen zeigen einen Bleistift am Anriss, getrennt beschriftete
Nutz- und Reststücke, Auflage/Klemmen, ein Werkzeug mit sichtbarem Schutz,
Bewegung entlang der Schnittlinie und anschließendes Absetzen des Reststücks.
In den Verlegefolgen bewegen sich die Ziegel in das Feld; Falzziegel und
Biberschwänze unterscheiden sich sichtbar. Bei der Kontrolle bewegen sich
Prüfmarkierung und fehlerhaft angehobenes beziehungsweise versetztes Teil.
Das sind erkennbare, vereinfachte 3D-Darstellungen. Sie zeigen keine real
gefilmten Hände oder Baustellenarbeit.

Bei den Dachdetails wird im Fehlerkapitel tatsächliche Bauteilgeometrie
versetzt, angehoben, ergänzt oder mit einer Lücke dargestellt und danach
korrigiert. Das ist mehr als ein Wechsel der Beschriftung. Kleine
Befestigungsteile bleiben bei verkleinerten Kontaktbildern allerdings schwer
erkennbar; daraus folgt keine Bestätigung ihrer Lesbarkeit auf jedem
Mobilbildschirm.

## Offene Befunde dieser ersten Sichtprüfung

| Befund | Beobachtung und Auswirkung | Nachweis |
| --- | --- | --- |
| Gefällefläche `f02` | Deutliche gestreifte beziehungsweise dreieckige Flächenartefakte überlagern die Gefällefläche. Betroffen sind unter anderem Kapitel 4, Pose 47, und Kapitel 7, Pose 0. Die Fläche erhält deshalb keine uneingeschränkte visuelle Freigabe. | `dach-flachdach-warmdach-f02-detail.jpg` |
| Bewegungsfuge `f09` | Der Kapiteltext beschreibt eine starre Überbrückung, die durch eine Bewegungsfugenlösung ersetzt werden soll. Die betrachtete Animation beginnt mit herausgesetztem Fugenprofil und offener Fuge; ein starres überbrückendes Fehlerbauteil ist dabei nicht zu sehen. Der erzählte Fehler und sein sichtbarer Ausgangszustand stimmen damit nicht ausreichend überein. | `topics-6.jpg`, `dach-flachdach-warmdach-f09-detail.jpg`, Kapiteltext und `scene.mjs` |
| Reihenfolge der vier Übungsziegel | Beide Verlegeclips nennen vier Übungsziegel: A und B in der unteren, C und D in der oberen Reihe. Die betrachtete Animation beschriftet dagegen vier Ziegel derselben mittleren Reihe mit A bis D und setzt je vier Ziegel der mittleren und oberen Reihe ein. Zuordnung und Zahl der bewegten Übungsteile stimmen damit nicht mit dem gesprochenen Auftrag überein. | `motion-1.jpg`, `motion-2.jpg`, Kapiteltexte und `setupCraft()` |
| Montageausschnitt | Bei zahlreichen Postern verdeckt die obere Titelfläche hochgesetzte Montagebauteile. Besonders deutlich ist dies bei den Walmdachthemen `w01` bis `w04`; auch die fünf `g01`-Kontexte sind betroffen. Die Kamera ist auf den Grundzustand ausgerichtet und berücksichtigt die maximal auseinandergezogenen Teile nicht vollständig. | `contexts.jpg`, `posters-all-1.jpg` bis `posters-all-4.jpg` |
| Herausgesetzte Fehlerteile | Lange Anschlussbauteile reichen im Anfangszustand des Fehlerkapitels teilweise über den rechten Bildrand hinaus, etwa bei `g01`, `g02`, `g04`, `s06`, `s07`, `s09` und `f09`. Das Hauptmodell bleibt sichtbar; die vollständige Form des ausgesetzten Teils ist dann nicht durchgehend ablesbar. | `topics-1.jpg` bis `topics-6.jpg` |

Der vermutete technische Grund für `f02` lässt sich im vorhandenen
Geometriequelltext eingrenzen: `flat_patch()` erzeugt die Oberseiten von
Gefälledämmung und Abdichtung mit denselben Höhen. Diese koplanaren Flächen
können sich im Renderbild überlagern. Diese Diagnose ersetzt keine Sichtprüfung
einer korrigierten Fassung.

## Grenzen des Ergebnisses

Die Kontaktbögen bestätigen ausgewählte sichtbare Zustände. Nicht alle 48
Posen jedes Kapitels und nicht alle 112 Filme wurden vollständig abgespielt.
Der Abgleich mit den gesprochenen Inhalten basiert hier auf den tatsächlichen
Kapiteltexten und der Geometriezuordnung; eine vollständige Hörprüfung wurde
in dieser Sichtprüfung nicht durchgeführt. Codec-, Hash-, Laufzeit-,
Untertitel-, Offline- und Browserprüfungen sind gesonderte Prüfaufgaben.

Die Produktionsbelege beschreiben 48 echte Geometrieposen je Kapitel bei
24 Bildern pro Sekunde mit anschließendem bewusstem Halten der Endpose.
Diese Aussage ist von einer Behauptung durchgehend neuer Bewegung über die
gesamte Kapitellänge zu unterscheiden. Eine abschließende Freigabe der hier
genannten Befunde setzt neue Bilder aus dem tatsächlich korrigierten
Produktionsstand voraus.

## Korrekturstand der erneuten Produktion

Die anschließenden Korrekturen liegen in `9fe4d4b` und `9f4b4e3`. Der
Szenenquelltext hat SHA-256
`67169d5a000ef2119b61b3cc0ff15a6c7111934c2e93e8a5819bd1d1e1d584fd`.
Die Korrekturen verändern weder die veröffentlichten Dachmodelle v1/v2 noch
deren Maßangaben:

- Die Kameraberechnung berücksichtigt auch auseinandergezogene, bewegte und
  herausgesetzte Teile. Titel und Kapitelzeile werden als verdeckende Bereiche
  ausgespart; beschriftete Übungsziegel bleiben in diesem Ausschnitt.
- Ein Raster-Tiefenversatz der F02-Abdichtung verhindert das Überlagern der
  koplanaren Oberflächen, ohne die GLB-Geometrie oder Lehrmaße zu verändern.
- F09 zeigt zunächst das starre überbrückende Fehlerbauteil. Dieses wird
  herausgenommen und das vorgesehene Bewegungsfugenprofil eingesetzt.
- In beiden Verlegeübungen werden genau die vier mit A–D bezeichneten
  Übungsziegel bewegt: A/B in der unteren und C/D in der darüberliegenden
  Übungsreihe. Weitere Ziegel bilden den unveränderten räumlichen Kontext.
- Die Buchstaben besitzen größere quadratische Schilder. Kleine
  Befestigungsteile erhalten in den betroffenen Fehlerbeispielen eine
  zusätzliche beschriftete Hervorhebung.
- Werkstattfilme erhalten eine passende Fußzeile zum bodennahen Übungsmodell.
  Die nur für Dachdetails passende Bezeichnung „Schnitt durch das 3D-Modell“
  erscheint dort nicht mehr unter dem Einsetzen der unteren Ziegelreihe.

Die erneute Stichprobe umfasst zunächst die tatsächlich kodierten Filme
Traufe/Rinne S03, Falzziegel-Verlegen, Gefälle F02 und Bewegungsfuge F09.
Betrachtet wurden Titel und Fußzeile, der Verlegezwischenstand, der
Fehlerzustand und die korrigierte Fuge sowie die F02-Fläche im Schnitt.
Die genannten Auffälligkeiten sind in diesen geprüften Bildern behoben.
Die lokalen Nachweise heißen `visual-fix-r2/s03-final.jpg`,
`falz-verlegen-final-footer.jpg`, `f02-accurate.jpg` und
`f09-final-{fault,repair,correct}.jpg`. Sie wurden aus den neu kodierten MP4s
entnommen. Der zusätzliche Bogen `final-previews.jpg` zeigt sechs ergänzende
Zustände aus dem identischen Szenenquelltext vor der Videokodierung.

Der vollständige Produktionsdurchgang mit 112 Filmen ist abgeschlossen.
Alle 112 neu erzeugten Poster wurden erneut gesichtet. Die folgenden
Abschnitte dokumentieren die Kameraprüfung und die letzte Beschriftungskorrektur.

### Abschließender Szenenstand und Kameraprüfung

Der abschließende Szenenstand aus `be70032` besitzt SHA-256
`b4c898618767b6b984626b81868015052129814af327233b82f340dfca8f5567`.
Zusätzlich zu den ersten Korrekturen wird der Kameraausschnitt nun in jedem
Animationsschritt mit derselben stetigen Berechnung bestimmt. Eine zuvor
vorhandene Umschaltung an der Bildgrenze verursachte beispielsweise bei S01
einen Versatz von ungefähr 19 Bildpunkten zwischen zwei benachbarten Posen.
Im geprüften neuen Verlauf beträgt derselbe obere Bildrandversatz ungefähr
0,02 Bildpunkte. Beim Reparieren von F04 und F09 werden die Raumgrenzen der
ein- beziehungsweise ausgeblendeten Fehlerteile weiter berücksichtigt; ihre
Sichtbarkeit verursacht dadurch keinen plötzlichen Kamerasprung.

Die vollständige rechnerische Prüfung umfasst **469 unterschiedliche
Animationsphasen mit jeweils 48 Posen, insgesamt 22.512 Posen**. Alle
geprüften Bauteile und Beschriftungen bleiben zwischen den reservierten
Titel- und Kapitelbereichen: horizontal zwischen 24 und 1.256, vertikal
zwischen 120 und 616 Bildpunkten. Es wurden keine Überschreitungen gefunden.
Der Nachweis liegt lokal in `visual-fix-r2/continuity-inspection.json` und
`continuity-metrics.json`. Dies ist eine Prüfung der berechneten Geometrie
und Kameras; sie ersetzt keine Messung der Bildwiederholrate auf einem
physischen iPhone.

Die größte Kamerabewegung innerhalb eines einzelnen Bildschritts liegt bei
6,80 Prozent des jeweiligen Abstands der Kamera zum Szenenursprung; diese
größeren Werte gehören zu
fortlaufenden Montagebewegungen. Die Phasen verteilen sich nach ihrem jeweils
größten Bildschritt auf 309 bis ein Prozent, 92 zwischen einem und drei
Prozent, 24 zwischen drei und fünf Prozent und 44 zwischen fünf und sieben
Prozent. Der zuvor auffällige F09-Sichtbarkeitswechsel mit 15,5 Prozent liegt
an derselben Stelle jetzt bei ungefähr 0,23 Prozent. Feste Kapitelwechsel
bleiben absichtliche Ansichtswechsel.

Vorhandene Renderbilder wurden ausschließlich bei nachgewiesener Gleichheit
aller 48 Zustände einer Phase übernommen. Verglichen wurden Kameramatrizen,
Sichtbarkeit, Bauteiltransformationen, Geometrieattribute, Materialien und
Schnittebenen; übernommene Dateien besitzen zusätzlich eigene SHA-256-Werte.
Veränderte Phasen werden tatsächlich neu gerendert. Die abschließende
Übernahmeprüfung fand 467 unveränderte und zwei veränderte Phasen gegenüber
dem unmittelbar vorherigen Stand; 120 bereits vollständig vorhandene Phasen
konnten so übernommen werden. Dies behauptet keine erneute Berechnung
identischer Bilddateien.

Aus den bereits neu kodierten Dateien dieses abschließenden Standes wurden
F09 vor, während und nach der Korrektur sowie Falzziegel-Verlegen erneut
betrachtet. Die vergrößerten A–D-Schilder wurden zusätzlich auf ein 390 Pixel
breites Einzelbild verkleinert und bleiben dort unterscheidbar. Die lokalen
Nachweise heißen `f09-continuous-{fault,reveal,correct}.jpg`,
`falz-big-badges.jpg` und `falz-big-badges-390.jpg`. Eine solche verkleinerte
Bildprüfung ist von einer tatsächlichen Bedienprüfung auf dem iPhone zu
unterscheiden.


### Letzte Biber-Beschriftung und abschließende Medienprüfung

Bei der abschließenden Sichtung verdeckte das vergrößerte Schild B einen Teil
von C in der oberen Biber-Reihe. Commit `f879b0f` hebt deshalb ausschließlich
die C-/D-Schilder dieser Reihe an; Führungslinien zeigen ihren zugehörigen
Ziegel. Die beiden Filme Biber-Verlegen und Biber-Kontrollieren wurden mit
jeweils sieben Phasen und 48 echten Posen erneut hergestellt. Beide fertigen
WebP-Poster wurden bei 1.280 Pixeln nochmals betrachtet: A, B, C und D bleiben
unterscheidbar.

Die erneute vollständige Zustandsprüfung umfasst wieder 469 Phasen und
22.512 Posen: **455 unverändert, 14 verändert, keine Überschreitung der
reservierten Bildfläche**. Die 14 geänderten Phasen gehören genau zu diesen
zwei Biber-Filmen. Alle anderen 110 MP4-Dateien sind anhand ihrer SHA-256
identisch zum zuvor vollständig produzierten Kamerastand. Ihre ursprünglichen
Produktionsbelege bleiben erhalten; es wird keine erneute Herstellung dieser
110 Filme behauptet. Die Zuordnung samt ursprünglichem Szenenhash und
Prüfsumme des vollständigen Vergleichs steht lokal unter
`visual-fix-r2/final-clip-equivalence.json`.

Die abschließende Prüfung mit FFprobe und SHA-256 besteht für **112 von 112
Filmen und alle 336 veröffentlichten Dateien**. Die MP4-Dateien umfassen
zusammen **173,5 MiB**; die größte Datei hat **2,33 MiB**. Auflösung, Bildrate,
H.264-/AAC-Spuren, Laufzeiten, Kapitelzeiten und WebVTT-Dateien wurden
technisch geprüft. Die vorhandenen veröffentlichten Dachmodelle und
Vorschaudateien unter `v1` und `v2` wurden nicht verändert.
