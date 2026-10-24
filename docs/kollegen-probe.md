# Die App auf dem iPhone ausprobieren

Salim lädt eine eigene Test-Website hoch. Der Kollege braucht weder Konto noch Passwort. Jeder mit dem Link kann diese Testversion öffnen; Lernstände liegen jeweils auf dem eigenen Gerät. Die vorhandene private Website und die Mac-App behalten ihre bisherigen Einstellungen.

## Einmal auf Salims Mac

Im Projektordner `bash scripts/probe-teilen.sh` ausführen. Das Skript baut die aktuelle Version, öffnet die Cloudflare-Anmeldung und lädt eine separate Testversion hoch. Salim benötigt dafür ein Cloudflare-Konto; falls noch keines vorhanden ist, einmal im Browser anlegen. Der fertige Link erscheint im Terminal und wird auf dem Mac in die Zwischenablage kopiert. In WhatsApp einfügen und dem Kollegen schicken.

## Auf dem iPhone des Kollegen

1. Den Link in Safari öffnen. Direkt loslernen, ohne Anmeldung.
2. Optional: Teilen → „Zum Home-Bildschirm“ → „Hinzufügen“. Danach über das Dachdecker-Symbol starten.
3. Für Offline-Nutzung die App zunächst online laden lassen, bis sie die Offline-Bereitschaft meldet. iOS kann Website-Daten bei Speicherknappheit entfernen; wichtige Lernstände über die Sicherungsfunktion exportieren.

Safari ist für den Einstieg ausreichend. Eine App-Store-Installation oder ein Entwicklerprofil ist nicht nötig. Die Lernstände des Kollegen werden nicht automatisch an Salim übertragen. Für Rückmeldungen kann er Nachrichten oder Bildschirmfotos schicken; der Beobachtungsbogen liegt im Übungsraum.

## Technischer Stand

`.probe-export/` wird ausschließlich aus dem statischen Export erstellt. Der Zugangsschutz-Worker wird nur aus dieser Kopie entfernt. `public/_worker.js` und `out/_worker.js` bleiben unverändert. Ohne Hosting-Anmeldung kann die Cloud-Umgebung keinen tatsächlichen Freigabelink erstellen. Nach Änderungen dasselbe Skript erneut ausführen und den neu ausgegebenen Link verwenden.
