#!/usr/bin/env python3
"""Keep the single CPU narration worker alive; resume only verified receipts."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
BUILD = Path(os.environ.get('PRAXISVIDEO_BUILD', ROOT / '.praxisvideo-production')).resolve()
AUDIO = BUILD / 'audio'
LOG = BUILD / 'voice-batch.log'
WORKER = str(BUILD / 'voice-env/bin/python')
MAX_RSS_KIB = 6 * 1024 * 1024
STALL_SECONDS = 600


def process_state(pid: int) -> tuple[bool, int]:
    try:
        stat = Path(f'/proc/{pid}/stat').read_text().split(') ', 1)[1].split()
        status = Path(f'/proc/{pid}/status').read_text().splitlines()
        rss = next((int(line.split()[1]) for line in status if line.startswith('VmRSS:')), 0)
        return stat[0] != 'Z', rss
    except (FileNotFoundError, ProcessLookupError):
        return False, 0


def stop(pid: int, child: subprocess.Popen | None) -> None:
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    until = time.monotonic() + 10
    while process_state(pid)[0] and time.monotonic() < until:
        time.sleep(.2)
    if process_state(pid)[0]:
        os.kill(pid, signal.SIGKILL)
    if child is not None:
        child.wait()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adopt-pid', type=int)
    args, worker_args = parser.parse_known_args()
    if worker_args[:1] == ['--']:
        worker_args = worker_args[1:]
    pid = args.adopt_pid
    child = None
    failures = 0
    while True:
        if pid is None:
            child = subprocess.Popen([WORKER, '-u', str(ROOT / 'scripts/praxisvideos/voice.py'), '--first', 'dach-steildach-falzziegel-s03', *worker_args], cwd=ROOT, stdin=subprocess.DEVNULL)
            pid = child.pid
            print(f'WATCH worker={pid} rssLimitMiB={MAX_RSS_KIB // 1024} stallLimitSeconds={STALL_SECONDS}', flush=True)
        launched = time.monotonic()
        while True:
            alive, rss = process_state(pid)
            if not alive:
                break
            # Model import receives a full initial grace period. Each chapter
            # and context logs progress, so long synthesis cannot stall silently.
            quiet = time.time() - LOG.stat().st_mtime if LOG.exists() else 0
            reason = f'RSS {rss // 1024} MiB' if rss > MAX_RSS_KIB else (f'no progress for {quiet:.0f}s' if quiet > STALL_SECONDS and time.monotonic() - launched > STALL_SECONDS else None)
            if reason:
                print(f'WATCH restarting worker {pid}: {reason}', flush=True)
                stop(pid, child)
                break
            time.sleep(15)
        if child is not None:
            child.wait()
        state = json.loads((AUDIO / 'production.json').read_text()) if (AUDIO / 'production.json').exists() else {}
        if state.get('state') == 'complete':
            subprocess.run(['python3', str(ROOT / 'scripts/praxisvideos/voice-audit.py')], cwd=ROOT, check=True)
            print(f"WATCH complete {len(state.get('completed', []))}/{state.get('total')}; all measured audio/captions audited", flush=True)
            return
        failures += 1
        if failures > 3:
            print('WATCH stopped after three unsuccessful worker resumes; inspect preceding error.', flush=True)
            raise SystemExit(1)
        print(f'WATCH resume {failures}/3 after worker {pid} stopped before completion', flush=True)
        pid = None
        child = None
        time.sleep(1)


if __name__ == '__main__':
    main()
