#!/usr/bin/env python3
"""Audit actual neural WAVs, receipts, measured chapters and published captions."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import wave

from voice import BUILD, MODEL_SHA256, VOICE_VERSION, timestamp

ROOT = Path(__file__).resolve().parents[2]


def sha256(path: Path) -> str:
    result = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-partial', action='store_true')
    parser.add_argument('--audio-dir', type=Path, default=BUILD / 'audio')
    args = parser.parse_args()
    catalog = json.loads((ROOT / 'content/praxisvideos-inhalte.json').read_text())['videos']
    missing, errors, valid = [], [], []
    for video in catalog:
        video_id = video['id']
        directory = args.audio_dir / video_id
        if not (directory / 'receipt.json').exists():
            missing.append(video_id)
            continue
        try:
            receipt = json.loads((directory / 'receipt.json').read_text())
            audio = directory / 'audio.wav'
            assert receipt['id'] == video_id, 'Receipt ID differs'
            assert receipt['modelArchiveSha256'] == MODEL_SHA256, 'Model provenance differs'
            signature = hashlib.sha256((MODEL_SHA256 + video['transkript'] + VOICE_VERSION).encode()).hexdigest()
            assert signature == receipt['signature'], 'Authored script/model signature differs'
            assert sha256(audio) == receipt['audioSha256'], 'WAV SHA-256 differs'
            with wave.open(str(audio)) as stream:
                duration = stream.getnframes() / stream.getframerate()
                assert stream.getframerate() == receipt['sampleRate'] == 22050, 'Sample rate differs'
                assert stream.getnchannels() == 1 and stream.getsampwidth() == 2, 'Expected mono PCM16'
            assert 45 <= duration <= 90, f'Duration {duration:.3f}s outside 45–90s'
            assert abs(duration - receipt['dauer']) < .002, 'Receipt duration differs'
            assert video['dauer'] == receipt['dauer'], 'Manifest duration differs'
            assert len(video['kapitel']) == len(receipt['kapitel']), 'Chapter count differs'
            previous_end = 0
            for chapter, timing in zip(video['kapitel'], receipt['kapitel']):
                assert chapter['id'] == timing['id'], 'Chapter ID differs'
                assert chapter['start'] == timing['start'] and chapter['ende'] == timing['ende'], 'Manifest chapter timing differs'
                assert abs(chapter['start'] - previous_end) <= .002, 'Chapter timing gap'
                assert 0 <= chapter['start'] < chapter['ende'] <= duration + .002, 'Chapter bounds invalid'
                previous_end = chapter['ende']
            assert abs(previous_end - duration) <= .002, 'Last chapter does not end at WAV duration'
            previous_end = 0
            for cue in receipt['cues']:
                assert 0 <= cue['start'] < cue['ende'] <= duration + .002, 'Caption bounds invalid'
                assert cue['start'] >= previous_end - .002, 'Captions overlap'
                assert len(cue['text'].splitlines()) <= 2, 'Caption exceeds two lines'
                previous_end = cue['ende']
            vtt = (ROOT / 'public/praxisvideos/v1' / f'{video_id}.vtt').read_text()
            assert vtt.startswith('WEBVTT\n'), 'Published VTT header missing'
            assert vtt.count(' --> ') == len(receipt['cues']), 'Published VTT cue count differs'
            for cue in receipt['cues']:
                expected = f"{timestamp(cue['start'])} --> {timestamp(cue['ende'])}\n{cue['text']}"
                assert expected in vtt, 'Published VTT text/timing differs'
            caption_text = ' '.join(' '.join(cue['text'].split()) for cue in receipt['cues'])
            authored_text = ' '.join(' '.join(chapter['text'].split()) for chapter in video['kapitel'])
            assert caption_text == authored_text, 'Captions do not cover the complete authored narration'
            valid.append({'id': video_id, 'dauer': receipt['dauer'], 'audioSha256': receipt['audioSha256']})
        except (AssertionError, KeyError, FileNotFoundError, wave.Error) as error:
            errors.append({'id': video_id, 'error': str(error)})
    report = {'total': len(catalog), 'valid': len(valid), 'missing': missing, 'errors': errors, 'receipts': valid}
    target = args.audio_dir / 'audit.json'
    temporary = target.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(target)
    print(f"Neural audio audit: {len(valid)}/{len(catalog)} valid, {len(missing)} missing, {len(errors)} errors. {target}")
    for error in errors:
        print(f"ERROR {error['id']}: {error['error']}")
    if errors or (missing and not args.allow_partial):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
