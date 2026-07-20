#!/bin/bash
# Doppelklick im Finder: baut die App neu und startet sie.
# Fenster offen lassen, solange du die App benutzt. Zum Beenden: Strg + C.
cd "$(dirname "$0")" || exit 1

echo "Dachdecker-App wird vorbereitet …"

# Läuft schon etwas auf dem Port? Dann sauber beenden.
if lsof -ti:3200 > /dev/null 2>&1; then
  echo "Alte Version wird beendet …"
  lsof -ti:3200 | xargs kill -9 2>/dev/null
  sleep 1
fi

npm run build || { echo; echo "Der Build ist fehlgeschlagen. Schick mir die Meldung oben."; read -r; exit 1; }

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

echo
echo "────────────────────────────────────────────"
echo "  App läuft."
echo
echo "  Auf diesem Mac:  http://localhost:3200"
[ -n "$IP" ] && echo "  Auf dem iPad:    http://$IP:3200"
echo
echo "  Fenster offen lassen. Beenden mit Strg + C."
echo "────────────────────────────────────────────"
echo

npm start
