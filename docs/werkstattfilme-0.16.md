# Werkstattfilme · Update 0.16

Stand: 13. November 2026. Die drei Filme sind vollständig produziert und eingebunden. Browser- und Offline-Abnahme bestehen. Diese Seite trennt bestätigte technische Prüfungen von noch offenen Erprobungen auf echten Geräten und mit Lernenden.

## Drei überarbeitete Handgriffe

Unter **Baustellenprojekte → Handgriffe lernen → Falzziegel** werden zuerst drei Filme erneuert:

- **Passstück und Schnitt planen:** Bezug und Schablone, Anriss, Nutzstück und Funktionsbereiche.
- **Bearbeitung vorbereiten und verstehen:** Auflage und geschützte stationäre Schneideinrichtung, Führung am Anriss, Trennung und Kantenkontrolle.
- **Ziegel richtig anordnen:** vier bezeichnete Ziegel, untere und obere Reihe, Aufhängung und Falzschluss.

Die Filme verwenden eigene Blender-Modelle und Oberflächen. Maße und Schnittbezug stammen aus der vorhandenen Falzziegel-Systemkarte und der bestehenden Werkstattaufgabe. Ganze Ziegel besitzen eine durchgehende Oberfläche; geschnittene Teilstücke werden erst beim entsprechenden Bearbeitungsschritt gezeigt. Werkzeug und Werkstück stehen im Mittelpunkt. Es werden keine Hände und keine echten Baustellenaufnahmen dargestellt.

Jeder Zeitpunkt wird als eigenes Full-HD-Bild bei 30 Bildern pro Sekunde berechnet. Die Bewegung folgt dem jeweiligen Arbeitsschritt und der Erzählung; die bisherige allgemeine Zwei-Sekunden-Bewegung mit anschließendem verlängertem Standbild entfällt bei diesen drei Filmen. Große feste Titelbalken entfallen, damit die Nahaufnahme mehr Platz erhält. Die sieben Kapitel, die deutsche Erzählspur und die getrennt schaltbaren Untertitel bleiben.

Die übrigen **109 aktiven Videos**, alle 16 Hauptbereiche und die bestehenden Werkstattinhalte bleiben erhalten. Die drei bisherigen Fassungen bleiben zusätzlich als historische Dateien verfügbar. Das Angebot umfasst weiterhin **112 Videokontexte**.

| Neue Filmfassung | Laufzeit der MP4 | Tatsächliche Bilder | MP4-Größe |
| --- | --- | --- | --- |
| Anzeichnen | 83,87 Sekunden | 2.516 | 21,99 MiB |
| Schneiden | 83,87 Sekunden | 2.516 | 21,43 MiB |
| Verlegen | 83,90 Sekunden | 2.517 | 18,48 MiB |

Alle drei Dateien enthalten H.264 in 1.920 × 1.080 Pixeln mit 30 Bildern pro Sekunde und eine AAC-Tonspur. Die Filme wurden vollständig decodiert; für alle 7.549 Bildpositionen liegt jeweils ein tatsächlich berechnetes Ausgangsbild vor. Sprecher und Untertitel verwenden die gemessenen Kapitelzeiten.

## Anschauen oder mitmachen

**Anschauen** ist voreingestellt. **Mitmachen** pausiert an einem festgelegten Lernpunkt und öffnet die passende vorhandene Aufgabe unter dem Film:

| Film | Aufgabe |
| --- | --- |
| Anzeichnen | Schnittlinie und Nutzstück festlegen |
| Schneiden | Ein Musterstück bearbeiten – Arbeitsschritte ordnen |
| Verlegen | Vier Ziegel im vorgegebenen Schema |

Die Aufgaben verwenden denselben Werkstattversuch wie die normale Übungsansicht. Entwürfe und bisherige Abgaben bleiben erhalten; eine Aufgabe wird nicht zugleich an zwei Stellen dargestellt oder doppelt bewertet. Bereits verwendete Videoerklärungen werden als Hilfe dokumentiert. Das Ansehen oder Überspringen erzeugt keinen Wissens- oder Praxisnachweis.

Nach dem Prüfen führt **Film fortsetzen** bewusst zur Wiedergabe zurück. **Später üben** schließt die Aufgabe ohne neue Bewertung; über Play geht der Film weiter. **Aufgabe nachholen** öffnet eine ausgelassene Aufgabe ohne erzwungene Rückspulung. Auch ein Vorwärtssprung oder Moduswechsel spult den Film nicht unerwartet zurück.

Modus und Mitmachzustand gehören zum jeweiligen Film, seiner Fassung und dem Werkstattversuch. Bereichswechsel, Neustart und „Weiterlernen“ erhalten eine angefangene Mitmachaufgabe. Der Tastaturfokus führt zur Aufgabe; die vorhandene Bearbeitungssperre gilt weiterhin.

## Alte Fassungen, Offline-Nutzung und Sicherungen

Die drei Film-IDs bleiben gleich, ihre Inhaltsversion steigt auf 2. Die neuen Dateien liegen unter `public/praxisvideos/v2/`; die alten Dateien unter `v1` werden nicht überschrieben. Metadaten und Medienverweise der drei ursprünglichen Filme bleiben im Archiv.

Abspielpositionen werden getrennt nach Fassung gespeichert. Die überarbeitete Fassung beginnt beim ersten Öffnen vorne. Die alte Zeitstelle bleibt für die alte Fassung erhalten. Sprecher- und Untertiteleinstellungen gelten weiterhin gemeinsam auf diesem Gerät.

Ist nur die ältere Fassung vollständig gespeichert, bietet der Player **Gespeicherte ältere Fassung ansehen** an. Diese verwendet ihre eigenen Kapitel, Untertitel und ihre eigene Abspielposition. Ein neuer Download ersetzt das vollständige alte Paket erst nach vollständiger Prüfung. Während des Ansehens wird der Film nicht ungefragt ausgetauscht.

Beim erneuten Öffnen erkennt der Player ein vollständig gespeichertes Paket, bevor er die Filmquelle festlegt. Die Wiedergabe erhält dann eine durch die Datei-Prüfsumme bestimmte Adresse. Das trennt sie von früheren Online-Streams im Browser und ermöglicht auch das Zurückspringen nach dem Wechsel zur Offline-Nutzung. Ein laufender Film wechselt beim Abschluss eines Downloads nicht die Quelle.

Filme werden weiterhin bewusst heruntergeladen; sie gehören nicht zum notwendigen Offline-Grunddownload. Die drei Full-HD-Filme dürfen je höchstens 25 MiB belegen. Bestehende Filme behalten ihr Limit von 15 MiB. Größe und SHA-256 werden vor Aktivierung geprüft. Öffentliche Filme gehören nicht zur privaten ZIP-Sicherung; neue Mitmachzustände und beide Positionsfassungen schon. Ältere JSON-Sicherungen bleiben importierbar.

## Herstellung und Prüfung

Blender, Three.js, Chromium, die Sprachumgebung und FFmpeg werden ausschließlich für die Produktion benötigt. Mac-Installation und Website-Build verwenden die fertigen Dateien und benötigen diese Werkzeuge nicht. Produktionsdateien, Modelle, WAV-Dateien und Einzelbilder liegen im ignorierten Verzeichnis `.praxisvideo-production/v2/`.

Die Vorschauen werden vor dem vollständigen Renderlauf auf Werkzeugkontakt, Materialwirkung, Schnittdarstellung, Kameraführung und Lesbarkeit geprüft. Die Produktion speichert Quellen- und Mediendateiprüfsummen; pro Sekunde entstehen 30 tatsächliche Bilder. Weitere Produktionsschritte stehen im README des v2-Renderers.

| Prüfung | Stand |
| --- | --- |
| Vollständiger Softwaretest | 1.470 Tests in 134 Dateien bestanden; TypeScript ohne Fehler. Lint ohne Fehler mit den beiden bisherigen Warnungen in `public/_worker.js` und `scripts/repariere-umlaute.mjs`. Der Produktionsbuild und der vollständige statische Export bestehen. |
| Daten-, Versions- und Sicherungsverträglichkeit | Gezielte Prüfungen zu alten/neuen Positionen, historischen Filmen, JSON-/ZIP-Sicherungen und gültigen Mitmachzuständen bestanden. |
| Mitmachablauf und eingefrorene Abgaben | Gezielte Komponentenprüfungen zu Pause, Fortsetzung, Überspringen, Wiederaufnahme und Aufgaben-ID-Zuordnung bestanden. |
| Vollständige Medienproduktion und Abgleich | Bestanden: drei Full-HD-Filme mit zusammen 7.549 Bildern, sieben Kapiteln je Film, passenden Erzählspuren und WebVTT. Vertiefte Prüfung aller 115 aktiven/historischen Fassungen ohne fehlende Dateien; die 109 übrigen aktiven Inhalte und alle ursprünglichen v1-Dateien wurden gegen den bisherigen Stand geprüft. |
| Browser und Bedienung | Neun vollständige Browserabläufe bestanden, einschließlich zwölf Ton-/Untertitelkombinationen und 18 Ansichten bei 390, 760 und 1.280 Pixeln, Hell/Dunkel und tatsächlichen 130 Prozent Schrift. Drei Aufgaben vollständig mit Tab, Leertaste und Enter bearbeitet. Keine JavaScript-Seitenfehler. |
| Offline, Sicherung und Update | Elf Szenarien bestanden: alte Fassungen, alte JSON-Sicherungen, tatsächlicher Downloadabbruch, Prüfsummenfehler ohne Paketverlust, Full-HD-Wiedergabe, vier Offline-Ton-/Untertitelzustände, ZIP-Rückimport, Paketlöschung mit erhaltenen Lernständen sowie tatsächlicher Service-Worker-Wechsel erst nach Bestätigung. Die erzeugte Worker-Datei wurde nach dem Update-Test bytegenau wiederhergestellt. |
| Online → Offline → gespeicherte Position → zurückspringen | Zusätzlicher nativer Browsertest bestanden: online bis Sekunde 37 ansehen, über die App speichern, laufende Quelle unverändert lassen, offline neu öffnen, Position wiederherstellen und zu Sekunde 13 zurückspringen. Keine manuelle Änderung der Videoquelle im Test. |
| Safari und echtes iPhone | Noch nicht durchgeführt. |
| Natives macOS-Bundle | In dieser Cloud nicht ausgeführt. |
| Beobachtete Erprobung mit zwei bis drei Azubis | Noch nicht durchgeführt. |

## Noch offene Erprobung auf Geräten

Für jeden Versuch Datum, Gerät, Betriebssystem, App-Version und Film festhalten.
Die folgenden Punkte sind ein Prüfbogen; sie sind noch keine bestandenen Tests:

- **Mac-App:** Einen Film im Mitmachmodus öffnen, die Aufgabe teilweise bearbeiten, die App beenden und erneut öffnen. „Weiterlernen“ muss zur selben Aufgabe mit denselben Eingaben führen. Nach dem Prüfen bleibt die erste Abgabe unverändert erhalten.
- **iPhone:** Alle drei Filme in Safari und vom Home-Bildschirm aus öffnen. Hoch-/Querformat, Kapitel, Vollbild und getrennte Ton-/Untertitelwahl ausprobieren. Schrift auf 130 Prozent stellen und die Lesbarkeit von Aufgabe und Markierungen beurteilen.
- **Offline auf dem iPhone:** Einen Film ausdrücklich vollständig speichern, dann Flugmodus einschalten. Nach erneutem Öffnen Wiedergabe, Kapitelwechsel und eine angefangene Mitmachaufgabe prüfen. Anschließend die Verbindung wieder einschalten.
- **Mit zwei bis drei Azubis:** Je einen Handgriff ohne zusätzliche Erklärung durch den Beobachter auswählen lassen. Festhalten, ob die Person den nächsten Schritt findet, die Aufgabe selbst bedient und Bezug, Nutzstück beziehungsweise Falzschluss anschließend an einer anderen Darstellung erklärt. Benötigte Hilfen und Missverständnisse wörtlich notieren.

| Versuch | Datum, Gerät und Version | Beobachtung | Bestanden / Änderung nötig |
| --- | --- | --- | --- |
| Mac-App | Offen | Noch nicht durchgeführt | Offen |
| iPhone Safari / Home-Bildschirm | Offen | Noch nicht durchgeführt | Offen |
| iPhone offline | Offen | Noch nicht durchgeführt | Offen |
| Azubi 1–3 | Offen | Noch nicht durchgeführt | Offen |

## Aktualisieren

Nach Bereitstellung auf dem bestehenden Update-Zweig die App beenden und auf dem Mac im bisherigen Projektordner ausführen:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
bash scripts/install-mac-neu.sh
```

Danach **Dachdecker Neu** öffnen. Für die dauerhafte Test-Website folgt `bash scripts/probe-teilen.sh` mit Salims Hosting-Anmeldung. Der Kollege benötigt weiterhin kein Konto. Ein vorbereiteter Export allein veröffentlicht die Website noch nicht.
