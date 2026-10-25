# Die App auf dem iPhone ausprobieren

Salim lädt eine eigene Test-Website hoch. Der Kollege braucht weder Konto noch Passwort. Jeder mit dem Link kann diese Testversion öffnen; Lernstände liegen jeweils auf dem eigenen Gerät. Die vorhandene private Website und die Mac-App behalten ihre bisherigen Einstellungen.

## Einmal auf Salims Mac

Im Projektordner `bash scripts/probe-teilen.sh` ausführen. Das Skript baut die aktuelle Version, öffnet die Cloudflare-Anmeldung und lädt eine separate Testversion hoch. Salim benötigt dafür ein Cloudflare-Konto; falls noch keines vorhanden ist, einmal im Browser anlegen. Nach erfolgreichem Upload erscheint die dauerhafte Adresse **https://dachdecker-probe-salim2105.pages.dev/** im Terminal und wird auf dem Mac in die Zwischenablage kopiert. In WhatsApp einfügen und dem Kollegen schicken. Bei späteren Updates bleibt diese Adresse gleich.

## Auf dem iPhone des Kollegen

1. Den Link in Safari öffnen. Direkt loslernen, ohne Anmeldung.
2. Optional: Teilen → „Zum Home-Bildschirm“ → „Hinzufügen“. Danach über das Dachdecker-Symbol starten.
3. Für Offline-Nutzung die App zunächst online laden lassen, bis sie die Offline-Bereitschaft meldet. iOS kann Website-Daten bei Speicherknappheit entfernen; wichtige Lernstände über die Sicherungsfunktion exportieren.

Safari ist für den Einstieg ausreichend. Eine App-Store-Installation oder ein Entwicklerprofil ist nicht nötig. Die Lernstände des Kollegen werden nicht automatisch an Salim übertragen. Für Rückmeldungen kann er Nachrichten oder Bildschirmfotos schicken; der Beobachtungsbogen liegt im Übungsraum.

## Einmal vom bisherigen Versionslink wechseln

Die bisher verschickte Adresse mit `95f6d713.` am Anfang bleibt eine eigene Version. Sie hat einen anderen Gerätespeicher als die dauerhafte Adresse. Deshalb auf dem iPhone einmal unter der **bisherigen Adresse** „Fortschritt & Sicherungen“ öffnen und eine vollständige Sicherung herunterladen. Dann die **dauerhafte Adresse** in Safari öffnen und diese Sicherung dort importieren. Anschließend das neue Symbol über „Zum Home-Bildschirm“ hinzufügen. Die gespeicherten Daten unter der bisherigen Adresse bleiben erhalten.

## Ein späteres Update öffnen

Die Website lädt eine neue Version im Hintergrund. Bei einer geöffneten Aufgabe erscheint „Ein Update ist verfügbar“. Mit **„Speichern und aktualisieren“** werden zuerst die Eingaben dauerhaft gespeichert und dann die neue Version geöffnet. Mit **„Später“** kann die Aufgabe weiterbearbeitet werden. Schlägt das Speichern fehl, bleibt die bisherige Ansicht geöffnet und zeigt einen Hinweis.

## Technischer Stand

`.probe-export/` wird ausschließlich aus dem statischen Export erstellt. Der Zugangsschutz-Worker wird nur aus dieser Kopie entfernt. `public/_worker.js` und `out/_worker.js` bleiben unverändert. Ohne Hosting-Anmeldung kann die Cloud-Umgebung keine Veröffentlichung durchführen. Nach Änderungen dasselbe Skript erneut ausführen; es aktualisiert die dauerhafte Adresse. Der beim Upload zusätzlich angezeigte Versionslink kann zum Vergleich einer bestimmten Veröffentlichung verwendet werden.
