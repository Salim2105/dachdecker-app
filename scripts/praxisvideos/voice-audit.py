#!/usr/bin/env python3
"""Validate produced narration, hashes, measured chapters and German captions."""
import argparse
from array import array
import hashlib
import json
from pathlib import Path
import wave

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--partial", action="store_true", help="Allow contexts not produced yet")
args = parser.parse_args()
videos = json.loads((ROOT / "content/praxisvideos-inhalte.json").read_text())["videos"]
audio_root = Path("/tmp/dach-video-audio")
errors, pending, produced = [], [], []
for video in videos:
    folder = audio_root / video["id"]
    receipt_path = folder / "receipt.json"
    if not receipt_path.exists() or json.loads(receipt_path.read_text()).get("version") != 2:
        pending.append(video["id"])
        continue
    try:
        receipt = json.loads(receipt_path.read_text())
        raw = (folder / "audio.wav").read_bytes()
        assert hashlib.sha256(raw).hexdigest() == receipt["audioSha256"], "audio hash"
        with wave.open(str(folder / "audio.wav")) as wav:
            assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 22050), "PCM format"
            seconds = wav.getnframes() / wav.getframerate()
            samples = array("h", wav.readframes(wav.getnframes()))
        assert 45 <= seconds <= 90, "duration range"
        assert abs(seconds - video["dauer"]) <= .001, "manifest duration"
        assert abs(seconds - receipt["dauer"]) <= .001, "receipt duration"
        assert 150 < max(abs(s) for s in samples) <= 29500, "audible unclipped peak"
        assert sum(s * s for s in samples) / len(samples) > 10000, "audible RMS"
        end = 0
        for authored, measured in zip(video["kapitel"], receipt["kapitel"], strict=True):
            assert authored["id"] == measured["id"], "chapter identity"
            assert authored["start"] == measured["start"] and authored["ende"] == measured["ende"], "chapter manifest timing"
            assert authored["start"] == end < authored["ende"], "continuous chapter timing"
            end = authored["ende"]
        assert abs(end - seconds) <= .001, "last chapter end"
        cues = receipt["cues"]
        assert " ".join(" ".join(c["text"].split()) for c in cues) == " ".join(video["transkript"].split()), "caption transcript"
        end = 0
        for cue in cues:
            assert end <= cue["start"] < cue["ende"] <= video["dauer"], "caption timing"
            lines = cue["text"].splitlines()
            assert len(lines) <= 2, "caption line count"
            assert all(len(line) <= 42 or len(line.split()) == 1 for line in lines), "caption line width"
            end = cue["ende"]
        vtt = (ROOT / "public/praxisvideos/v1" / f"{video['id']}.vtt").read_text()
        assert vtt.startswith("WEBVTT\n") and vtt.count(" --> ") == len(cues), "WebVTT cues"
        produced.append({"id": video["id"], "seconds": seconds, "cues": len(cues), "audioSha256": receipt["audioSha256"]})
    except (AssertionError, OSError, ValueError, KeyError) as error:
        errors.append({"id": video["id"], "error": str(error)})
result = {"catalogCount": len(videos), "producedCount": len(produced), "pendingCount": len(pending), "complete": len(produced) == 112 and not errors, "errors": errors, "pending": pending, "produced": produced}
(audio_root / "audit.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({key: result[key] for key in ("catalogCount", "producedCount", "pendingCount", "complete", "errors")}, ensure_ascii=False))
raise SystemExit(1 if errors or (pending and not args.partial) else 0)
