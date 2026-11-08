# Lernwerkstatt · Update 0.15

**Stand: 8. November 2026 · Release in Validierung.** Die Oberfläche und alle 112 Praxisvideos sind hergestellt; die abschließenden Gesamt- und Browserprüfungen werden noch erfasst. Diese Seite unterscheidet vorhandene Produktionsnachweise von offenen Abnahmen. Die dauerhafte Test-Website ist für dieses Update noch nicht veröffentlicht.

## Klarer anfangen und genau weiterlernen

Die Startseite zeigt einen vorrangigen nächsten Schritt mit Bereich, tatsächlichem Titel und genauer Arbeitsposition. „Weiterlernen“ führt zum zuletzt gespeicherten gültigen, noch nicht abgeschlossenen Lernziel. Dazu gehören Fachwissen, Mathe, Sprachen, Werkstatt, Dachdetails, Projekte, Bildtraining, Tagesrunden und laufende Prüfungsvorbereitung. Wo eine passende Dauer hinterlegt ist, wird sie angezeigt. Abgeschlossene oder abgelaufene Versuche und unbekannte Ziele werden nicht als offene Arbeit angeboten. Ältere gespeicherte Fortsetzungen bleiben lesbar. Ohne offene Arbeit folgt eine fällige Tagesrunde oder die Lernfeldauswahl.

Bei Dachdetails bleibt die Deckungsart im Fortsetzungslink erhalten. Ein Ziel mit `?deckung=biber-doppel` öffnet weiterhin die Biberschwanz-Doppeldeckung und das gewählte Detail mit seinem gespeicherten Montageschritt. Die Auswahl einer anderen Deckungsart ersetzt keine eingefrorenen Aufgabenbilder oder früheren Antworten.

Die **16 Hauptbereiche in vier Menügruppen** bleiben bestehen. Innerhalb der Bereiche sind die Einstiege kürzer:

- **Baustellenprojekte:** „Handgriffe lernen“, „Dach in 3D verstehen“, „Baustellenauftrag bearbeiten“ und „Im Betrieb ausprobieren“ führen zu vier klaren Arbeitswegen. Die sechs bestehenden Baustellenaufträge bleiben erreichbar.
- **Fachmathe:** „Grundlagen“, „Aufbau“ und „Selbstständig rechnen“ zeigen jeweils die passende Auswahl.
- **Lernfelder:** Aufklappbare Kapitel zeigen die zugehörigen kurzen Einheiten und ihren Abschlussstand. Ein direkter Einheitenlink öffnet das passende Kapitel.

Tagesrunde, gezieltes Weiterüben und der kompakte Lernstand bleiben auf der Startseite direkt erreichbar. Prüfungsfahrplan und Termin lassen sich bei Bedarf öffnen.

## 112 Praxisvideos mit deutscher Erzählspur

Die 34 Dachdetailthemen ergeben über die vorhandenen Dachformen und Deckungsarten **104 passende Videokontexte**. Hinzu kommen **acht eigene Handgriffclips**: jeweils für Falzziegel und Biberschwanz-Doppeldeckung die vier Einheiten **Passstück und Schnitt planen**, **Bearbeitung vorbereiten und verstehen**, **Ziegel richtig anordnen** sowie **Eigene Arbeit prüfen und korrigieren**. Diese acht Clips zeigen die jeweilige Tätigkeit am bodennahen Schulmodell und besitzen dafür eigene Szenen und Sprechertexte.

Alle **112 Videos mit je MP4, WebVTT-Untertiteln und WebP-Vorschaubild**, insgesamt **336 Dateien**, liegen unter `public/praxisvideos/v1/`. Inhalt, sieben Kapitel, gemessene Zeiten und vollständiger Sprechertext stehen in `content/praxisvideos-inhalte.json`. `content/praxisvideos-medien.json` verzeichnet die ausgelieferten Dateien mit Größe und SHA-256. Die Filme dauern 45–90 Sekunden und werden als H.264-MP4 in **1.280 × 720 Pixeln bei 24 Bildern pro Sekunde mit AAC-Ton** ausgeliefert.

Die deutsche Erzählspur wurde lokal mit **Coqui TTS 0.27.5 und Thorsten/VITS** auf der CPU erzeugt und als AAC in jedes MP4 eingebunden. Die App benötigt dafür kein Sprachmodell, keinen Sprachdienst und keine Browser-Sprachausgabe. Modellarchiv, Prüfsumme, Herstellung und Lizenzen sind in [Deutsche neuronale Erzählspur](../scripts/praxisvideos/VOICE.md) dokumentiert. Die [Coqui-Modellregistrierung](https://github.com/coqui-ai/TTS/blob/dev/TTS/.models.json) nennt Thorsten Müller als Modellautor und Apache 2.0 als Modelllizenz; Coqui TTS steht unter MPL 2.0, Gruut unter MIT.

Die Bildfolgen entstehen aus eigenen 3D-Lehrmodellen und eigenen Handgriffszenen. Pro Kapitel werden **48 tatsächlich gerenderte Geometriepositionen** mit bewegten Bauteilen, Schnittansichten, Wasserwegen oder Fehlerkorrekturen erzeugt. Diese Bewegung läuft zu Kapitelbeginn; anschließend bleibt die letzte Ansicht bewusst stehen, während die vollständige Erzählung weiterläuft. Es werden keine zusätzlichen Zwischenposen durch Bildüberblendung erzeugt. Die Kapitelüberschrift und kurze Modellbeschriftungen gehören zum Bild; der fortlaufende Sprechertext ist als abschaltbare Untertitelspur beigefügt und nicht ins Bild eingebrannt.

Die vorhandenen Dachmodelle, Ansichten und historischen Medien unter `v1` und `v2` bleiben unverändert. Die Videos verwenden die Lehrmodelle als Produktionsquelle. Herkunft der Dachmedien und Lichtumgebung steht weiterhin unter [Quellen und Gestaltungsvorbilder](dach-materialien-quellen.md). Die Filme sind eigene schematische Lehrdarstellungen; die Maße und gezeigten Arbeitsfolgen der Handgriffclips gehören zum jeweiligen Schulmodell.

## Sprecher, Untertitel und Lernstand

Sprecher und Untertitel besitzen getrennte Schalter. Beim ersten Öffnen sind beide eingeschaltet. Alle vier Kombinationen sind möglich und werden auf diesem Gerät für die nächsten Videos gespeichert:

| Sprecher | Untertitel | Wiedergabe |
|---|---|---|
| An | An | Erzählung mit mitlesbarem Text |
| An | Aus | Erzählung ohne Untertitel |
| Aus | An | Stummes Bild mit Untertiteln |
| Aus | Aus | Stummes Bild ohne Untertitel |

Die Wiedergabe beginnt erst mit „Play“. Kapitelwechsel positionieren den Film, ohne ihn automatisch zu starten. Native Videosteuerung, Tempoauswahl sowie aufklappbare Kapitel und vollständiger Sprechertext ergänzen den Player. Bei einem Ladefehler bleiben Kapitel und Text erreichbar.

Die Abspielposition wird für die konkrete Video-ID und Fassung gespeichert und bei derselben Fassung wiederhergestellt. Beim Schließen, Navigieren oder Verbergen der Seite pausiert der Film. Das bloße Öffnen eines Videos oder das Umstellen von Ton und Untertiteln erzeugt keinen Hilfeneintrag. Erst ein tatsächlicher Wiedergabestart wird im zugehörigen Dachdetail oder Werkstattversuch als verwendete Hilfe mit Video-ID und Fassung festgehalten. Das Ansehen bestätigt weder eine richtige Antwort noch handwerkliche Ausführung und erzeugt keinen Kompetenznachweis oder zusätzlichen Versuch.

## Bewusst herunterladen und offline abspielen

Videos lassen sich einzeln oder als getrennte Pakete je Dachform für unterwegs speichern. Große Videodateien werden nicht automatisch in den Grundcache geladen. Der angezeigte Download umfasst Film, Untertitel und Vorschaubild und beginnt erst nach Auswahl.

Jede Datei wird vollständig geladen und anhand von Größe und SHA-256 geprüft. Erst danach wird der vollständige Paketstand atomar aktiviert. Ein angehaltener oder fehlerhafter neuer Download ersetzt kein bereits gespeichertes vollständiges Paket. „Download anhalten“ beendet den laufenden Abruf. Das Löschen eines Videopakets erhält Lernantworten, Notizen, private Medien, Videoeinstellungen und Abspielpositionen.

Der lokale HTTP-Server der Mac-App und der Service Worker unterstützen **HEAD** sowie Byte-Range-Anfragen für die Videowiedergabe: gültige Teilbereiche erhalten **206**, ungültige Bereiche **416**. Der Service Worker bedient gespeicherte Filme aus dem geprüften Paket und legt keine bloß teilweise empfangenen Streamingantworten als vollständigen Film ab. Diese Implementierung ersetzt die noch offene Prüfung im nativen macOS-Bundle und auf einem echten iPhone nicht.

## Herstellung außerhalb der App

Die Sprach- und Videoproduktion läuft ausschließlich in der Entwicklungsumgebung. `npm ci`, App-Installation, Build, Export und Wiedergabe laden keine TTS-Modelle und starten keine Synthese oder Videoproduktion. Zur normalen Medienprüfung reicht Node.js; `npm run videos:check` untersucht auch MP4-Struktur, H.264-/AAC-Spuren, Auflösung, Bildrate und Laufzeit ohne FFmpeg-Abhängigkeit. Nur die zusätzliche Tiefenprüfung benötigt `ffprobe`.

Die dauerhaften Arbeitsdateien liegen standardmäßig im ignorierten Verzeichnis **`.praxisvideo-production/` im Repository-Stamm**, nicht unter `/tmp`. `PRAXISVIDEO_BUILD` kann ein anderes dauerhaftes Produktionsverzeichnis vorgeben. Sprachumgebung, Modellarchiv, WAV-Dateien, Szenenbilder, Produktionsbelege, Logs sowie Paket-Caches werden nicht eingecheckt. Private Lernstände oder Bilder gehören ebenfalls nicht in Produktions- oder Release-Commits.

Auf der vorgesehenen Produktionsmaschine mit Python 3.12, FFmpeg/FFprobe und Chromium:

```sh
sh scripts/praxisvideos/setup-production.sh
sh scripts/praxisvideos/voice-run.sh
tail -f .praxisvideo-production/voice-batch.log
```

`setup-production.sh` bereitet die lokale Sprachumgebung, das anhand seiner SHA-256 geprüfte offizielle Modellarchiv und das lokale Playwright-Paket vor. Der Sprachlauf setzt nur passende signierte und geprüfte Arbeitsdateien fort. Nach abgeschlossener Sprachproduktion:

```sh
python3 scripts/praxisvideos/voice-audit.py
sh scripts/praxisvideos/render-run.sh
tail -f .praxisvideo-production/render-batch.log
```

Die Videoproduktion verwendet die gemessenen Kapitel- und Audiozeiten. Ein erneut gestarteter Lauf prüft die Produktionssignaturen und nutzt passende vollständige Zwischenergebnisse. Abschließende Medienprüfungen:

```sh
npm run videos:check
node scripts/praxisvideos/check.mjs --deep
```

Der zweite Befehl ist die optionale Prüfung mit `ffprobe`. Weitere Details zur Erzählspur und ihrem Audit stehen in [VOICE.md](../scripts/praxisvideos/VOICE.md).

## Abnahme dieser Version

Die folgenden Einträge beziehen sich auf 0.15. Offene Zeilen sind keine bestätigten Ergebnisse; Ergebnisse früherer Versionen werden nicht als erneute Prüfung dieser Fassung ausgegeben.

| Prüfung | Stand |
|---|---|
| Vollständigkeit der Videoproduktion | 112 Videokontexte und alle 336 MP4-/VTT-/WebP-Dateien vorhanden; Medienverzeichnis mit Größen und SHA-256 erstellt |
| Tatsächliche Erzählspuren, Kapitelzeiten und veröffentlichte Untertitel | Gespeicherter vollständiger Sprachaudit: **112 von 112 gültig, 0 fehlend, 0 Fehler**; Beleg unter `.praxisvideo-production/audio/audit.json` |
| Abschließende Inhalts-, Dachmedien- und Videomedienprüfungen | Aktuelle Ergebnisse werden nach dem laufenden Prüflauf ergänzt |
| Vollständiger Testlauf, TypeScript und Lint | Aktuelle Ergebnisse werden nach dem laufenden Prüflauf ergänzt |
| Produktionsbuild, statischer Export und Website-Paket | Aktuelle Ergebnisse werden nach dem laufenden Prüflauf ergänzt |
| Startseite, Navigation, Player und vier Ton-/Untertitelkombinationen im fertigen Export | Abschließende Browserprüfung noch offen |
| Offline-Download, SHA-256, Range/HEAD, Neustart, Abbruch und Paketlöschen im Browser | Abschließende Browserprüfung noch offen |
| Schmale und breite Fenster, Hell/Dunkel, vergrößerte Schrift und Tastaturbedienung | Abschließende Browserprüfung noch offen |
| Safari und Wiedergabe auf einem echten iPhone | Noch nicht durchgeführt |
| Installation und Ausführung des nativen macOS-Bundles | In dieser Cloud nicht durchgeführt |
| Beobachtete Erprobung mit Azubis | Noch nicht durchgeführt |

## Auf dem Mac aktualisieren und Test-Website bereitstellen

Nach Bereitstellung auf dem bestehenden Branch `codex/lernverbesserungen` die App vollständig beenden und im bisherigen Projektordner ausführen:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
bash scripts/install-mac-neu.sh
```

Das Skript baut **Dachdecker Neu.app** unter `~/Applications`. Lernstände liegen außerhalb des Programmpakets und bleiben beim Update erhalten. Eine vollständige Sicherung lässt sich vorher unter „Lernstand & Sicherungen“ erstellen.

Die dauerhafte Testadresse bleibt **https://dachdecker-probe-salim2105.pages.dev/**. Der Export und die Vorbereitung des Website-Pakets veröffentlichen dieses Update noch nicht. Der Upload erfolgt mit `bash scripts/probe-teilen.sh` über die bestehende Hosting-Anmeldung. Der Kollege braucht weiterhin kein Konto; die Schritte für Safari und den Wechsel von einem älteren Versionslink stehen unter [Die App auf dem iPhone ausprobieren](kollegen-probe.md).
