#!/usr/bin/env python3
"""Offline German neural narration, measured chapters and matching WebVTT.

Run in the dedicated voice environment. Cached speech is keyed by text and
model identity, so repeated roof-detail narration is synthesized only once.
No browser speech, remote inference, microphone or replacement robot voice.
"""
from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import json
import os
import sys
from pathlib import Path
import re
import subprocess
import textwrap
import time
import wave

for key in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[key] = "2"
os.environ.setdefault("LRU_CACHE_CAPACITY", "1")
os.environ.setdefault("ONEDNN_PRIMITIVE_CACHE_CAPACITY", "1")
os.environ.setdefault("MALLOC_ARENA_MAX", "2")
os.environ.setdefault("NUMBA_CACHE_DIR", "/tmp/dach-video-numba-cache")
os.environ.setdefault("MPLCONFIGDIR", "/tmp/dach-video-matplotlib")
os.environ.setdefault("HF_HOME", "/tmp/dach-video-huggingface")
os.environ.setdefault("TTS_HOME", "/tmp/dach-video-tts")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp/dach-video-cache")
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

ROOT = Path(__file__).resolve().parents[2]
MODEL_SHA256 = "665f718c558693f5bd0747db19f4b5b4ce81b8903e48b7a51dd5f634475d7d6b"
MODEL_ID = "tts_models/de/thorsten/vits"
VOICE_VERSION = "voice-v2-measured-sentences"


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def atomic_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def wav_seconds(path: Path) -> float:
    with wave.open(str(path), "rb") as f:
        return f.getnframes() / f.getframerate()


def spoken(text: str) -> str:
    # Typography is expanded explicitly; authored orthography and terminology
    # remain intact. Gruut supplies the German IPA lexicon, never eSpeak.
    text = text.replace("·", ", ").replace("×", " mal ").replace("−", " minus ")
    text = re.sub(r"\bcm\b", "Zentimeter", text)
    text = re.sub(r"\bmm\b", "Millimeter", text)
    return re.sub(r"\s+", " ", text).strip()


def timestamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d}.{ms % 1000:03d}"


def phrase_cues(text: str, start: float, end: float) -> list[dict]:
    # A cue has at most two 42-character lines. Sentence boundaries come from
    # synthesis; a long sentence is divided proportionally into readable cues.
    lines = textwrap.wrap(text, width=42, break_long_words=False, break_on_hyphens=False)
    chunks = ["\n".join(lines[i:i + 2]) for i in range(0, len(lines), 2)]
    total = sum(len(t) for t in chunks)
    duration = end - start
    result = []
    used = 0
    for chunk in chunks:
        a = start + duration * used / total
        used += len(chunk)
        b = start + duration * used / total
        result.append({"start": round(a, 3), "ende": round(b, 3), "text": chunk})
    return result


def write_vtt(cues: list[dict], target: Path) -> None:
    lines = ["WEBVTT", "", "NOTE Neural German; measured sentence timing, proportional phrase subdivisions.", ""]
    for i, cue in enumerate(cues, 1):
        lines += [str(i), f"{timestamp(cue['start'])} --> {timestamp(cue['ende'])}", cue["text"], ""]
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(target.suffix + ".tmp")
    temporary.write_text("\n".join(lines), encoding="utf-8")
    temporary.replace(target)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--content", type=Path, default=ROOT / "content/praxisvideos-inhalte.json")
    p.add_argument("--model-dir", type=Path, default=Path("/tmp/dach-video-model/tts_models--de--thorsten--vits"))
    p.add_argument("--audio-dir", type=Path, default=Path("/tmp/dach-video-audio"))
    p.add_argument("--vtt-dir", type=Path, default=ROOT / "public/praxisvideos/v1")
    p.add_argument("--ids", nargs="*")
    p.add_argument("--first", help="Produce this context first, then the rest of the selected catalog")
    p.add_argument("--force", action="store_true")
    args = p.parse_args()
    data = json.loads(args.content.read_text(encoding="utf-8"))
    selected = args.ids or [v["id"] for v in data["videos"]]
    lookup = {v["id"]: v for v in data["videos"]}
    if set(selected) - lookup.keys():
        raise SystemExit(f"Unknown video IDs: {set(selected) - lookup.keys()}")
    if args.first:
        if args.first not in selected:
            raise SystemExit(f"Unknown priority video ID: {args.first}")
        selected = [args.first] + [i for i in selected if i != args.first]
    archive = args.model_dir.parent / "thorsten-vits.zip"
    if not archive.exists() or digest(archive) != MODEL_SHA256:
        raise SystemExit("Official model archive is missing or its SHA-256 differs. See VOICE.md.")
    import numpy as np
    import soundfile as sf
    import torch
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    torch.manual_seed(150)
    from TTS.api import TTS
    model = TTS(model_path=str(args.model_dir / "model_file.pth"), config_path=str(args.model_dir / "config.json"), progress_bar=False).to("cpu")
    # VITS normally allocates alignment/decoder tensors from predicted durations
    # before max_inference_len is applied. Reject outliers before that allocation;
    # retry the same authored text with another seed instead of clipping speech.
    def bounded_duration(module, inputs, output):
        mask = inputs[1]
        durations = torch.exp(output) * mask * model.synthesizer.tts_model.length_scale
        frames = torch.ceil(durations).sum()
        if not torch.isfinite(durations).all() or frames.item() > 2600:
            raise RuntimeError(f"VITS duration outlier rejected before allocation: {frames.item()} frames")
    model.synthesizer.tts_model.duration_predictor.register_forward_hook(bounded_duration)
    sample_rate = model.synthesizer.output_sample_rate
    if sample_rate != 22050:
        raise SystemExit(f"Unexpected model sample rate {sample_rate}")
    cache = args.audio_dir / ".segments"
    cache.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    status_path = args.audio_dir / "production.json"
    completed = []
    new_contexts = 0
    for n, video_id in enumerate(selected, 1):
        atomic_json(status_path, {"pid": os.getpid(), "version": VOICE_VERSION, "state": "running", "current": video_id, "completed": completed, "total": len(selected)})
        video = lookup[video_id]
        output = args.audio_dir / video_id
        output.mkdir(parents=True, exist_ok=True)
        signature = hashlib.sha256((MODEL_SHA256 + video["transkript"] + VOICE_VERSION).encode()).hexdigest()
        receipt_path = output / "receipt.json"
        if receipt_path.exists() and (output / "audio.wav").exists() and not args.force:
            receipt = json.loads(receipt_path.read_text())
            if receipt.get("signature") == signature and receipt.get("audioSha256") == digest(output / "audio.wav"):
                video["dauer"] = receipt["dauer"]
                for chapter, timing in zip(video["kapitel"], receipt["kapitel"]):
                    chapter.update(start=timing["start"], ende=timing["ende"])
                write_vtt(receipt["cues"], args.vtt_dir / f"{video_id}.vtt")
                atomic_json(args.content, data)
                completed.append(video_id)
                print(f"CACHED {n}/{len(selected)} {video_id} {video['dauer']:.3f}s", flush=True)
                continue
        segments = []
        sentence_timings = []
        for chapter in video["kapitel"]:
            text = spoken(chapter["text"])
            key = hashlib.sha256((MODEL_SHA256 + text + VOICE_VERSION).encode()).hexdigest()
            cached = cache / f"{key}.wav"
            timing_path = cache / f"{key}.json"
            if not cached.exists() or not timing_path.exists():
                print(f"SYNTH {video_id}/{chapter['id']} chars={len(text)}", flush=True)
                for attempt in range(3):
                    # Text-derived seed makes resumed and uninterrupted production
                    # agree, and a bounded retry can recover a stochastic outlier.
                    torch.manual_seed(int(key[:8], 16) + attempt)
                    capture = io.StringIO()
                    try:
                        with contextlib.redirect_stdout(capture), torch.inference_mode():
                            generated = model.tts(text=text, split_sentences=True, return_dict=True)
                            samples = np.asarray(generated["wav"], dtype=np.float32)
                        break
                    except RuntimeError as error:
                        if "VITS duration outlier" not in str(error) or attempt == 2:
                            raise
                        print(f"RETRY {video_id}/{chapter['id']} attempt={attempt + 1}: {error}", flush=True)
                if samples.ndim != 1 or samples.size < sample_rate / 4 or not np.isfinite(samples).all():
                    raise RuntimeError(f"Invalid neural voice output for {video_id}/{chapter['id']}")
                peak = float(np.abs(samples).max())
                if peak < .005:
                    raise RuntimeError(f"Silent neural voice output for {video_id}/{chapter['id']}")
                # Keep headroom and a short audible separation between chapters.
                samples *= min(1., .9 / peak)
                samples = np.concatenate((samples, np.zeros(round(sample_rate * .18), dtype=np.float32)))
                sf.write(cached.with_suffix(".tmp.wav"), samples, sample_rate, subtype="PCM_16")
                cached.with_suffix(".tmp.wav").replace(cached)
                atomic_json(timing_path, generated["segments"])
            segments.append(cached)
            authored_sentences = model.synthesizer.split_into_sentences(chapter["text"])
            timings = json.loads(timing_path.read_text())
            if len(authored_sentences) != len(timings):
                raise RuntimeError(f"Sentence timing mismatch: {video_id}/{chapter['id']}")
            sentence_timings.append([{**t, "text": s} for s, t in zip(authored_sentences, timings)])
        raw_duration = sum(wav_seconds(s) for s in segments)
        # Bounded, pitch-preserving editorial pace keeps all clips at 45–90s.
        pace = raw_duration / 84 if raw_duration > 88 else (raw_duration / 48 if raw_duration < 45 else 1.)
        position = 0.
        combined = []
        cues = []
        for i, (chapter, raw) in enumerate(zip(video["kapitel"], segments)):
            path = output / f"{i:02d}-{chapter['id']}.wav"
            if pace != 1.:
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-threads", "1", "-i", str(raw), "-af", f"atempo={pace:.8f}", "-ar", str(sample_rate), "-ac", "1", "-c:a", "pcm_s16le", str(path)], check=True)
            else:
                path.write_bytes(raw.read_bytes())
            samples, rate = sf.read(path, dtype="float32")
            chapter["start"] = round(position, 3)
            position += len(samples) / rate
            chapter["ende"] = round(position, 3)
            combined.append(samples)
            scale = (len(samples) / rate) / wav_seconds(raw)
            for sentence in sentence_timings[i]:
                cues.extend(phrase_cues(sentence["text"], chapter["start"] + sentence["start"] * scale, min(chapter["ende"], chapter["start"] + sentence["end"] * scale)))
        sf.write(output / "audio.tmp.wav", np.concatenate(combined), sample_rate, subtype="PCM_16")
        (output / "audio.tmp.wav").replace(output / "audio.wav")
        video["dauer"] = round(position, 3)
        if not 45 <= video["dauer"] <= 90:
            raise RuntimeError(f"Clip outside production duration: {video_id} {video['dauer']}")
        write_vtt(cues, args.vtt_dir / f"{video_id}.vtt")
        receipt = {"version": 2, "id": video_id, "signature": signature, "engine": "coqui-tts 0.27.5 / VITS / CPU", "model": MODEL_ID, "modelArchiveSha256": MODEL_SHA256, "sampleRate": sample_rate, "inferenceBounds": {"maxSentenceFrames": 2600, "cpuThreads": 2, "recycleNewContexts": 6, "seed": "chapter-cache-sha256-plus-attempt"}, "audioSha256": digest(output / "audio.wav"), "rawDuration": raw_duration, "pace": pace, "dauer": video["dauer"], "kapitel": [{k: c[k] for k in ("id", "start", "ende")} for c in video["kapitel"]], "cues": cues}
        atomic_json(receipt_path, receipt)
        atomic_json(args.content, data)
        completed.append(video_id)
        print(f"DONE {n}/{len(selected)} {video_id} {video['dauer']:.3f}s elapsed={time.monotonic() - started:.1f}s", flush=True)
        new_contexts += 1
        if new_contexts >= 6 and n < len(selected):
            # CPU convolution allocators retain variable-length inference buffers.
            # Re-exec releases all retained native memory without spawning a
            # concurrent worker; receipts make this a cheap, idempotent resume.
            print("RECYCLE native inference memory after 6 new contexts", flush=True)
            os.execv(sys.executable, [sys.executable, "-u", __file__, *sys.argv[1:]])
    atomic_json(status_path, {"pid": os.getpid(), "version": VOICE_VERSION, "state": "complete", "completed": completed, "total": len(selected), "elapsedSeconds": round(time.monotonic() - started, 3)})


if __name__ == "__main__":
    main()
