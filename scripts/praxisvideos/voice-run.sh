#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
pidfile=/tmp/dach-video-voice-batch.pid
if [ -f "$pidfile" ]; then
  previous=$(cat "$pidfile")
  state=$(ps -o stat= -p "$previous" 2>/dev/null || true)
  case "$state" in
    ""|Z*|*Z*) : ;; # kill -0 also accepts dead, unreaped zombie processes.
    *) printf 'Sprachproduktion läuft bereits mit PID %s.\n' "$previous"; exit 0 ;;
  esac
fi
mkdir -p /tmp/dach-video-audio
nohup env MALLOC_ARENA_MAX=2 LRU_CACHE_CAPACITY=1 ONEDNN_PRIMITIVE_CACHE_CAPACITY=1 python3 -u scripts/praxisvideos/voice-supervise.py \
  -- "$@" \
  > /tmp/dach-video-voice-batch.log 2>&1 < /dev/null &
printf '%s\n' "$!" > "$pidfile"
printf 'Sprachproduktion gestartet: PID %s, Protokoll /tmp/dach-video-voice-batch.log\n' "$!"
