# 0.7.1: Fachwörter verstehen und gezielt weiterüben

Dieses Update setzt die beiden gewünschten nächsten Schritte um: Fachworterklärungen in den neuen Bereichen und präzisere Fehlernacharbeit.

## Fachwörter direkt an der Aufgabe

- 38 ergänzende Begriffe für Mathe und Baustellenprojekte, jeweils mit einfacher Erklärung, Baustellenbeispiel und beschrifteter schematischer Skizze. Dazu gehören Hypotenuse, Deckmaß, Wärmedurchlasswiderstand, Festpunkt und Befund.
- Vorhandene Glossar-IDs, Fachdefinitionen und Quellverweise bleiben erhalten. Geeignete bestehende Einträge wie U-Wert und Attika erhalten ebenfalls eine Darstellung.
- Grundlagen-Mathe, Aufbau-Mathe, Projekte, Bildtraining und neue Tagesrunden markieren passende Wörter. Unter den Einheiten steht zusätzlich eine aufklappbare Fachwortliste. Eingabefelder und Antwortoptionen bleiben gewöhnliche Bedienelemente.
- Die Begriffshilfe öffnet sich neben der Aufgabe beziehungsweise als bestehender Dialog auf schmalen Geräten. Antworten, halbfertige Zahlen und Notizen bleiben erhalten. Tastaturbedienung, Escape und Fokus-Rückkehr wurden geprüft.
- Vor einer Auswertung aufgerufene Worterklärungen werden als Hilfe gespeichert. Eine Erklärung nach einer bereits abgegebenen Antwort verändert deren ursprüngliches Ergebnis nicht.

## Konkrete Hinweise statt einer pauschalen Fehlermeldung

- Aufbau-Mathe unterscheidet nachweisbar falsch gewählte Einheiten und noch nicht passende Rechenschritte. Bei gebrochener Stückzahl verweist sie auf die geforderte ganze Anzahl. Die App behauptet keine nicht beobachtete Denkfehlerursache.
- Projektberechnungen führen zu passenden Aufbau-Einheiten, etwa Sparrenlänge → wahre Längen, Materialmenge → Bedarf, U-Wert → Schichtwiderstände.
- Projektentscheidungen, Arbeitsfolgen und Bildaufgaben erhalten Hinweise zu Auftrag, Wasserweg, Schichten, Befund oder Ablauf. Eine falsche Bildzuordnung benennt die tatsächlich noch offenen Bildbereiche.
- Direkt nach dem Prüfen zeigt „Dein nächster Übungsschritt“ einen passenden Link. Unter `/lernhilfe` werden dieselben Hinweise mit Anlass, Thema und erklärendem Text zusammengeführt.
- Übungssprünge schließen zuerst den dauerhaften Speichervorgang ab und öffnen dann die genaue Ziel-Einheit. Das funktioniert auch bei einem Wechsel zwischen zwei Bildaufgaben derselben Seite. Ein Speicherfehler hält die bisherige Aufgabe geöffnet.
- Zwei verschiedene unabhängige richtige Aufgaben zum passenden Lernziel können frühere Hinweise auflösen. Nachschlagen, direkte Wiederholung nach einer Lösung und Selbsteinschätzung werden davon unterschieden. Lernende erhalten keine dauerhaften Leistungslabels.

## Speicherung

Neue Wiederholungsversuche speichern ihre Hinweise zusammen mit dem tatsächlichen Ergebnis. Die Empfehlungsansicht leitet daraus eindeutige Ereignisse ab; wiederholtes Öffnen erzeugt keine zusätzlichen Versuche. Projektentscheidungen speichern ihre Diagnoseereignisse zuerst im Projektentwurf und übernehmen sie anschließend mit stabiler ID. Eine unterbrochene Übernahme wird beim nächsten Öffnen nachgeholt.

Alte Versuche ohne die neuen Metadaten bleiben unverändert. Aus ihnen werden keine nachträglichen Erfolgsereignisse erfunden. Zeichnungen und freie Erklärungen erzeugen keine automatische Diagnose. Vollständige ZIP-Sicherungen enthalten auch die neuen Hinweise; ein Wiederherstellungstest prüft dies.

Die getrennte dauerhafte Wiederholung und die bisherige Begrenzung der Diagnosehistorie bleiben bestehen. Es gibt weiterhin keine Anmeldung und keine automatische Übermittlung von Lernständen oder Rückmeldungen.

## Tatsächlich ausgeführte Prüfung

- 679 Tests in 86 Testdateien bestanden, darunter neue Tests für Einheitenhinweise, passende Übungsziele, Hilfeverwendung, eindeutige Ereignisse, alte Stände, Sicherungen und Navigation erst nach dem Speichern.
- TypeScript und ESLint ohne Fehler; zwei bestehende ESLint-Warnungen außerhalb dieser Änderungen.
- Produktionsbuild und statischer Export bestanden. Das Offline-Bundle enthält 1.717 Dateien.
- Chromium am lokalen Produktionsserver: Fachwort per Tastatur geöffnet, Skizze angezeigt, halbfertige Zahl nach Schließen erhalten, Fokus zurückgegeben, falsche Einheit ausgewertet und persönliche Empfehlung geöffnet.
- Projekt- und Bildfehler samt konkretem Übungsziel gespeichert; nach Neuladen keine Doppelzählung.
- Breiten 390/760/1.280 Pixel, tatsächliche 130-%-Einstellung, Hell/Dunkel und mobile Begriffshilfe geprüft; keine horizontale Überbreite.
- Die Links Projekt → passende Matheeinheit und Bildfehler → andere passende Bildaufgabe durch Anklicken geprüft. Begriffshilfe mit Skizze und Übungssprung funktionieren auch ohne Netzwerk.

Dies sind technische Prüfungen unter Linux/Chromium. Eine echte Safari-/iPhone-Erprobung und beobachtete Tests mit Auszubildenden werden dadurch nicht ersetzt. Der Cloudflare-Upload erfolgt weiterhin über Salims Mac mit `bash scripts/probe-teilen.sh`; hier wurde kein Hosting-Upload vorgenommen.
