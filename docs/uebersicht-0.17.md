# Update 0.17: Themen finden und übersichtlicher weiterlernen

Die App bekommt fünf zusammengehörige Änderungen. Bestehende Inhalte, Routen und Lernstände bleiben erhalten.

## Gemeinsame Themensuche

„Was möchtest du lernen?“ steht auf der Startseite. Über „Suchen“ in der Kopfzeile und „Thema suchen“ in der Bereichsnavigation lässt sich die Suche aus jeder Aufgabe erreichen. Die Seite `/suche` arbeitet mit vorhandenen lokalen Inhalten und benötigt keinen Suchdienst oder ein Konto. Der Suchbegriff steht in der Adresse, damit Ergebnisse nach Neuladen und über Zurück/Vorwärts wieder erreichbar sind.

Die Suche führt unterschiedliche Bezeichnungen eines Themas zusammen, insbesondere Flüssigkunststoff, Flüssigabdichtung, FLK und Schreibweisen mit „ue“. Angebote erhalten eine erkennbare Art und einen konkreten Lernort. Es werden nur vorhandene Inhalte angezeigt; markenspezifische Enke-Inhalte werden nicht behauptet.

## Weniger gleichzeitig sichtbare Bereiche

Alle 16 Bereiche bleiben erhalten. Die vier Menügruppen sind einzeln aufklappbar; ein neuer Bereich öffnet seine Gruppe. Eine persönliche Auswahl wird auf dem Gerät gespeichert. Verdeckte Links gehören nicht zur Tab-Reihenfolge. Das mobile Menü behält Schließen, Escape, Fokusführung und Speichern vor einem Bereichswechsel.

## Handwerk & Projekte

Der bisherige Menüpunkt „Baustellenprojekte“ heißt „Handwerk & Projekte“. Die Adresse `/projekte` bleibt erhalten. Der Einstieg unterscheidet Handgriffe, Dacherkundung, Baustellenaufträge und praktische Übungen im Betrieb.

## Passende Verbindungen

Lerneinheiten bieten einen direkten Zugang zu ihren bestehenden Kontrollfragen und passende, ausdrücklich zugeordnete Verweise auf weitere Erklärungen und vorhandene Medien. Eine direkte Kontrollrunde verwendet dieselben Aufgaben und Ergebnisse der Einheit; sie erfindet keine Selbsteinschätzung und schließt keine übersprungenen Lernphasen automatisch ab. Explizite Filmlinks öffnen die vorhandene Filmansicht im richtigen Kontext.

Freie Themenrunden speichern ihre Sitzung, Antwortentwürfe und erzeugten Rechenwerte getrennt. Der Wechsel zwischen zwei Themen desselben Lernfelds überschreibt dadurch weder die andere Themenrunde noch ein freies Quiz. Exakt passende ältere Themenstände werden übernommen; ihre Originaldaten bleiben erhalten. „Weiterlernen“ versteht beide Speicherformen.

## Darstellung und Service unter Mehr

In der Kopfzeile bleiben Suche, Rechner und Begriffshilfe erreichbar. „Mehr“ öffnet Schriftgröße, Hell/Dunkel, Rückmeldungen, Erprobungsbogen und Sicherungen. Das Menü verdeckt die Aufgabe vorübergehend; Eingaben bleiben erhalten. Rückmeldungen übernehmen weiterhin die aktuelle Einheit und ausdrücklich benannte Aufgabe. Ein Bereichswechsel wartet auf das dauerhafte Speichern. Bei einem Speicherfehler bleibt die Aufgabe geöffnet.

## Prüfung und Bereitstellung

Abgeschlossene Prüfungen:

- Gesamte automatisierte Testsuite: 1.511 Tests in 141 Dateien bestanden, einschließlich Suche, direkten Kontrollfragen, Menüs, Entwürfen, alten Sicherungen und Themenwechseln.
- TypeScript, Lint und Inhalts- beziehungsweise Medienprüfungen bestanden. Lint meldet weiterhin zwei bereits vorhandene Warnungen in `public/_worker.js` und `scripts/repariere-umlaute.mjs`.
- Produktionsbuild und statischer Export bestanden; `/suche` gehört zum Offline-Paket. Große Modell- und Videopakete werden weiterhin ausdrücklich heruntergeladen.
- Browserprüfungen in Chromium bei 390, 760 und 1.280 Pixeln, Hell/Dunkel und tatsächlicher 100-/130-%-Schrifteinstellung: 97 Prüfungen bestanden. Nach Sichtprüfung wurden die mobilen Kopfzeilenaktionen auf eine Reihe gebracht und überlappende Statistikbeschriftungen beseitigt.
- Im statischen Export mit aktivem Service Worker und deaktiviertem Netzwerk: 13 Prüfungen zu Suche, Neuladen, Darstellung, Navigation, Lernnotizen und Rückmeldung bestanden. Zwei zusätzliche Browserprüfungen bestätigten voneinander unabhängige Entwürfe zweier LF10-Themenrunden.

Tests auf einem echten Mac beziehungsweise iPhone, Safari und beobachtete Azubi-Erprobungen stehen noch aus. Browserautomation ersetzt diese Erprobung nicht.

Auf dem Mac wird der bestehende Ablauf verwendet:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
bash scripts/install-mac-neu.sh
```

Für die Test-Website folgt `bash scripts/probe-teilen.sh` mit Salims Hosting-Anmeldung. Ein lokaler Export allein veröffentlicht die Website nicht.
