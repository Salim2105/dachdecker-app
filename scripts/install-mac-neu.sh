#!/bin/bash
set -euo pipefail

if [ "$(uname -s)" != "Darwin" ]; then
  echo "Bitte diesen Befehl auf deinem MacBook ausführen."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Bitte zuerst Node.js 24 LTS von https://nodejs.org installieren und dann erneut starten."
  exit 1
fi

cd "$(dirname "$0")/.."
echo "Dachdecker Neu wird erstellt. Das kann einige Minuten dauern."
npm ci
npm run desktop:build:neu

case "$(uname -m)" in
  arm64) app_quelle="$PWD/dist-desktop/mac-arm64/Dachdecker Neu.app" ;;
  x86_64) app_quelle="$PWD/dist-desktop/mac/Dachdecker Neu.app" ;;
  *) echo "Diese Mac-Architektur wird nicht unterstützt."; exit 1 ;;
esac

if [ ! -d "$app_quelle" ]; then
  echo "Die neue App wurde nicht gefunden. Bitte diese Terminal-Ausgabe im Chat zeigen."
  exit 1
fi

mkdir -p "$HOME/Applications"
ditto "$app_quelle" "$HOME/Applications/Dachdecker Neu.app"
echo "Fertig! Im Finder Dachdecker Neu doppelklicken. Die alte App bleibt erhalten."
open -R "$HOME/Applications/Dachdecker Neu.app"
