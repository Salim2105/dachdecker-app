#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
build="${PRAXISVIDEO_BUILD:-$PWD/.praxisvideo-production}"
mkdir -p "$build/render"
pidfile="$build/render-batch.pid"
if [ -f "$pidfile" ]; then
  previous=$(cat "$pidfile")
  state=$(ps -o stat= -p "$previous" 2>/dev/null || true)
  case "$state" in
    ""|Z*|*Z*) : ;;
    *) printf 'Videoproduktion läuft bereits: PID %s.\n' "$previous"; exit 0 ;;
  esac
fi
nohup node scripts/praxisvideos/render.cjs --all "$@" >> "$build/render-batch.log" 2>&1 < /dev/null &
printf '%s\n' "$!" > "$pidfile"
printf 'Videoproduktion gestartet: PID %s, Protokoll %s/render-batch.log\n' "$!" "$build"
