#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
pidfile=/tmp/dach-video-voice-batch.pid
if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
  printf 'Sprachproduktion läuft bereits mit PID %s.\n' "$(cat "$pidfile")"
  exit 0
fi
mkdir -p /tmp/dach-video-audio
nohup /tmp/dach-video-voice-env/bin/python -u scripts/praxisvideos/voice.py \
  --first dach-steildach-falzziegel-s03 "$@" \
  > /tmp/dach-video-voice-batch.log 2>&1 < /dev/null &
printf '%s\n' "$!" > "$pidfile"
printf 'Sprachproduktion gestartet: PID %s, Protokoll /tmp/dach-video-voice-batch.log\n' "$!"
