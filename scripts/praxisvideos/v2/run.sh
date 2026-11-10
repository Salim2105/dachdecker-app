#!/bin/sh
# Production-only resumable background run, not called by installation/build.
set -eu
cd "$(dirname "$0")/../../.."
build="$PWD/.praxisvideo-production/v2"
mkdir -p "$build"
pidfile="$build/render.pid"
if [ -f "$pidfile" ]; then
  previous=$(cat "$pidfile")
  case "$previous" in
    ''|*[!0-9]*) : ;;
    *)
      state=$(ps -o stat= -p "$previous" 2>/dev/null || true)
      command=$(ps -o args= -p "$previous" 2>/dev/null || true)
      case "$state:$command" in
        Z*|*Z*:*) : ;;
        *scripts/praxisvideos/v2/render.cjs*) printf 'Videoproduktion läuft bereits: PID %s.\n' "$previous"; exit 0 ;;
      esac
      ;;
  esac
fi
nohup node scripts/praxisvideos/v2/render.cjs "$@" >> "$build/render.log" 2>&1 < /dev/null &
printf '%s\n' "$!" > "$pidfile"
printf 'V2-Videoproduktion gestartet: PID %s, Protokoll %s/render.log\n' "$!" "$build"
