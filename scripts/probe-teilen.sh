#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
projekt="dachdecker-probe-salim2105"
echo "Die iPhone-Testversion wird erstellt. Das kann einige Minuten dauern."
if [ ! -x node_modules/.bin/wrangler ]; then npm ci; fi
npm run export
node scripts/prepare-probe.mjs
echo "Jetzt einmal dein Cloudflare-Konto im Browser verbinden. Dein Kollege braucht kein Konto."
npx wrangler login
projekte="$(npx wrangler pages project list)"
if ! printf '%s' "$projekte" | grep -Fq -- "$projekt"; then
  npx wrangler pages project create "$projekt" --production-branch=main
fi
echo "Die Testversion wird hochgeladen."
if ausgabe="$(npx wrangler pages deploy .probe-export --project-name="$projekt" --branch=main --commit-dirty=true 2>&1)"; then
  printf '%s\n' "$ausgabe"
else
  printf '%s\n' "$ausgabe"
  exit 1
fi
link="https://${projekt}.pages.dev/"
printf '%s\n' "$link" > .probe-link.txt
if command -v pbcopy >/dev/null 2>&1; then printf '%s' "$link" | pbcopy || true; fi
echo "Fertig! Diese dauerhafte Adresse deinem Kollegen schicken (auch für spätere Updates):"
printf '%s\n' "$link"
echo "Auf dem Mac ist der Link auch in deiner Zwischenablage: In WhatsApp einfach Einfügen."
