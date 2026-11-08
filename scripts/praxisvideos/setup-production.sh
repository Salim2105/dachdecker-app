#!/bin/sh
# Production tooling only. App installation and video playback never run this.
set -eu
cd "$(dirname "$0")/../.."
build="${PRAXISVIDEO_BUILD:-$PWD/.praxisvideo-production}"
mkdir -p "$build/model" "$build/audio" "$build/browser" "$build/pip-cache" "$build/npm-cache"
export PIP_CACHE_DIR="$build/pip-cache"
export NPM_CONFIG_CACHE="$build/npm-cache"
if [ ! -x "$build/voice-env/bin/python" ]; then python3 -m venv "$build/voice-env"; fi
"$build/voice-env/bin/python" -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
"$build/voice-env/bin/python" -m pip install -r scripts/praxisvideos/voice-requirements.txt
if [ ! -f "$build/model/thorsten-vits.zip" ]; then
  curl --fail --location --retry 3 --output "$build/model/thorsten-vits.zip.part" \
    https://github.com/coqui-ai/TTS/releases/download/v0.7.0_models/tts_models--de--thorsten--vits.zip
  mv "$build/model/thorsten-vits.zip.part" "$build/model/thorsten-vits.zip"
fi
"$build/voice-env/bin/python" - "$build/model" <<'PY'
import hashlib, pathlib, sys, zipfile
folder = pathlib.Path(sys.argv[1]); archive = folder / 'thorsten-vits.zip'
if hashlib.sha256(archive.read_bytes()).hexdigest() != '665f718c558693f5bd0747db19f4b5b4ce81b8903e48b7a51dd5f634475d7d6b':
    raise SystemExit('Die offizielle Modellprüfsumme stimmt nicht überein.')
if not (folder / 'tts_models--de--thorsten--vits/model_file.pth').exists():
    with zipfile.ZipFile(archive) as z:
        for name in z.namelist():
            if not (folder / name).resolve().is_relative_to(folder.resolve()): raise SystemExit('Ungültiger Archivpfad')
        z.extractall(folder)
PY
if ! node -e 'process.exit(require(process.argv[1]).version === "1.56.1" ? 0 : 1)' "$build/browser/node_modules/playwright/package.json" 2>/dev/null; then
  npm install --prefix "$build/browser" --no-audit --no-fund playwright@1.56.1
fi
printf 'Produktionsumgebung bereit: %s\n' "$build"
