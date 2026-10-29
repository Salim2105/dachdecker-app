# Werkstatttraining 0.12.0

Unter **Baustellenprojekte → Werkstatttraining** führen zwei vollständige Lernpfade vom Aufmaß bis zur kontrollierten Übungsfläche: Falzziegel und Biberschwanz-Doppeldeckung. Im Biberpfad werden Doppel- und Kronendeckung zusätzlich verglichen.

Die 16 Hauptbereiche bleiben erhalten. Vorhandene Projekte, Prüfungsfamilien, Aufgaben und lokale Lernstände werden weiterverwendet.

## Inhalt und Bedienung

- 20 Einheiten mit 81 kurzen Bildschritten: Handlung, Begründung und Kontrollpunkt.
- 40 aktive Übungen: Bezugspunkte und Schnittlinien markieren, Nutzstück bestimmen, Reihen und Breiten einteilen, Teile einsetzen, Arbeitsfolgen ordnen und Fehler erkennen.
- 20 eigenständig verständliche Wiederholungsaufgaben in der gemeinsamen Tagesrunde.
- Zwei neue Praxisblätter mit Werkzeugen, Material, Arbeitsfolge, Zeichnung/privatem Papierfoto, eigener Ausführungsmeldung und eingetragener Rückmeldung.

Jeder Pfad behandelt Messen, Ziegelmerkmale, Längen- und Breiteneinteilung, Wasserwege, Verlegen, Schnittplanung, Bearbeitung, Befestigung und Schlusskontrolle. Die Systemkarten enthalten ausdrücklich fiktive Schulmodelle. Die Modellwerte sind keine allgemeinen Ausführungsmaße oder Befestigungsregeln.

Eigene schematische Zeichnungen verbinden Draufsicht, Schnitt und Einzelziegel; Wasserwege lassen sich schrittweise einblenden. Markierungen und Zielplätze sind sowohl im Bild als auch über nummerierte Tastaturschaltflächen erreichbar. Große Zeichnungen lassen sich gesondert ansehen.

Der normale Einstieg ist begleitet. Vor dem ersten Bild kann unmittelbar mit „Selbst probieren“ begonnen werden. Bereits gesehene Anleitungen und verwendete Hilfen verschwinden beim Moduswechsel nicht. Eine neue Bearbeitung archiviert den bisherigen Versuch.

## Speicherung und ehrlicher Lernstand

Angefangene Einheiten speichern ihre Übungsangaben, aktuelle Bild- und Aufgabenposition, Ansichten, Wasserweg, Teilantworten, Notizen, Abgaben und Hilfen. Frühere Antworten und Bewertungen bleiben unveränderlich dokumentiert. Beschädigte Stände werden erhalten und mit einer sichtbaren Fehlermeldung versehen.

Gewöhnliche Werkstattübungen werden nicht als Kontexttransfer etikettiert. Pro Einheit und Kompetenz werden zusammengehörige Teilaufgaben gemeinsam ausgewertet. Wiederöffnen zählt keinen Versuch doppelt. Eine Tagesantwort innerhalb von 30 Minuten nach einer Anleitung, Hilfe oder Rückmeldung derselben Einheit wird als unmittelbare Nacharbeit erfasst; spätere Hilfe wird früheren Antworten nicht rückwirkend zugerechnet.

Unter **Lernstand & Sicherungen** stehen getrennt: digital verstandene Einheiten, davon mit Unterstützung bearbeitete Einheiten, eigene Praxisangaben und eingetragene Rückmeldungen. Die App bestätigt damit keine tatsächliche handwerkliche Ausführung oder fremde Identität.

Die Praxisblätter verwenden eigene Schlüssel für Falzziegel und Biber. Die sechs bisherigen Prüfungsfamilien und alten Praxisblätter bleiben unverändert erreichbar. Vollständige ZIP-Sicherungen enthalten auch die neuen Entwürfe, Zeichnungen und privaten Bilder. Alte JSON-Sicherungen bleiben importierbar; neue Daten sind Bestandteil der vollständigen ZIP-Sicherung.

## Überprüfung

Die direkt verknüpften LF2-/LF8-Erklärungen wurden gezielt auf Widersprüche und pauschale Ausführungswerte geprüft. Umfang und Grenzen stehen im [Inhaltsprüfbericht](werkstatt-inhaltspruefung-0.12.md).

Geprüfter Stand vom **29. Oktober 2026**:

- **1.073 Tests in 115 Dateien bestanden**, einschließlich aller bisherigen Tests und der neuen Inhalts-, Speicher-, Bewertungs-, Navigations-, Sicherungs- und Komponententests.
- TypeScript bestanden; ESLint ohne Fehler. Die beiden bestehenden Warnungen in `public/_worker.js` und `scripts/repariere-umlaute.mjs` bleiben unverändert.
- Produktionsbuild, statischer Export und Vorbereitung des öffentlichen Test-Exports bestanden. Das Offline-Bundle umfasst 1.730 Dateien; Export und öffentliche Testkopie benötigen jeweils ungefähr 50 MB.
- Chromium: falscher und korrigierter Anriss, Nutz-/Reststück, unveränderte erste Abgabe, archivierter Neustart mit ehrlicher Nacharbeitskennzeichnung, Einteilungsentwurf `0,`, exakte Wiederaufnahme, zweites Fenster, Verlegepositionen und Reihenfolge sowie seitliche Begriffshilfe bestanden.
- 54 Bereichsansichten bei 390, 760 und 1.280 Pixeln, Hell/Dunkel und tatsächlicher 130-Prozent-Einstellung ohne Überbreite oder Laufzeitfehler geprüft. Der Vergrößerungsdialog wurde zusätzlich mit Tab, Shift+Tab, Escape und Fokuswiederherstellung geprüft.
- Beide neuen Praxisblätter: getrennte Status, erste Planung, Themenwechsel/Neuladen, Tastaturzeichnung, privates Papierbild, echter PDF-Druck und vollständiger ZIP-Export/Import einschließlich Bilddateien bestanden.
- Nach vollständigem Vorladen ohne Netzwerk: beide Lernpfade, Teilantwort und Neustart, Bewertung, Tastaturmarkierung, vergrößerte eigene Zeichnung, Praxisblatt und Lernstand mit lokalen Schriften bestanden.

Echte Übungen mit Auszubildenden, die Ausführung am tatsächlichen Betriebsprodukt, Safari auf einem echten iPhone und das native Mac-Installationspaket benötigen weiterhin die jeweilige reale Umgebung. Sie werden nicht als bereits durchgeführte Erprobung ausgegeben.

## Aktualisieren

Die Mac-App vollständig beenden und im bisherigen Projektordner ausführen:

```bash
cd ~/Downloads/dachdecker-chatgpt &&
(git restore -- public/sw.js 2>/dev/null || true) &&
git pull --ff-only origin codex/lernverbesserungen &&
bash scripts/install-mac-neu.sh
```

Für die Test-Website anschließend im selben Ordner:

```bash
bash scripts/probe-teilen.sh
```

Die dauerhafte Adresse bleibt https://dachdecker-probe-salim2105.pages.dev/. Die Veröffentlichung benötigt Salims Hosting-Anmeldung; der Kollege benötigt kein Konto.
