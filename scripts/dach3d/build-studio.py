"""Reproduce the five v2 studio overviews without changing published v1 media.

Run python3 scripts/dach3d/build-studio.py --resume. At most two Blender
processes run, each with two render threads. OIDN production prerequisites are
documented in DENOISING.md; they are not web or Mac-app dependencies.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import os
import pathlib
import struct
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
VARIANTS = ['steildach-falzziegel', 'steildach-biber-doppel',
            'walmdach-falzziegel', 'walmdach-biber-doppel', 'flachdach-warmdach']
STATE = ROOT / '.dach3d-build-state/studio'


def note(event, **values):
    print(json.dumps({'event': event,
                      'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                      **values}), flush=True)


def source_hash(options):
    digest = hashlib.sha256()
    for name in ['common.py', 'roofs.py', 'denoise.py', 'denoise-requirements.txt', 'optimize.mjs']:
        digest.update(name.encode())
        digest.update((ROOT / 'scripts/dach3d' / name).read_bytes())
    digest.update(json.dumps({'samples': options.samples, 'width': options.width,
                              'asset_version': 2}, sort_keys=True).encode())
    return digest.hexdigest()


def paths(variant):
    base = ROOT / 'public/dach-medien/v2' / variant
    return [base / 'uebersicht.glb', base / 'uebersicht.webp',
            ROOT / 'public/dach-vorschau/v2' / variant / 'uebersicht.webp']


def file_records(files):
    records = []
    for file in files:
        data = file.read_bytes()
        records.append({'path': str(file.relative_to(ROOT)), 'bytes': len(data),
                        'sha256': hashlib.sha256(data).hexdigest()})
    return records


def verified(variant):
    files = paths(variant)
    data = files[0].read_bytes()
    if data[:4] != b'glTF' or struct.unpack_from('<I', data, 8)[0] != len(data):
        raise RuntimeError('Invalid GLB: ' + variant)
    doc = json.loads(data[20:20 + struct.unpack_from('<I', data, 12)[0]])
    mesh_counts = [sum(doc['accessors'][p.get('indices', p['attributes']['POSITION'])]['count'] // 3
                       for p in mesh['primitives']) for mesh in doc['meshes']]
    triangles = sum(mesh_counts[node['mesh']] for node in doc['nodes'] if 'mesh' in node)
    if len(data) > 6 * 1024 * 1024 or triangles > 100000:
        raise RuntimeError('Studio model budget exceeded: ' + variant + ' ' + str((len(data), triangles)))
    for file in files[1:]:
        image = file.read_bytes()
        if image[:4] != b'RIFF' or image[8:12] != b'WEBP':
            raise RuntimeError('Invalid studio view: ' + str(file))
    if files[2].stat().st_size > 140000:
        raise RuntimeError('Studio preview is too large: ' + variant)
    return {'bytes': len(data), 'triangles': triangles}


def run_variant(variant, options, fingerprint):
    receipt = STATE / (variant + '.json')
    if options.resume:
        try:
            saved = json.loads(receipt.read_text())
            if saved['source'] == fingerprint and saved['files'] == file_records(paths(variant)):
                note('studio-reused', variant=variant, **verified(variant))
                return
        except (OSError, ValueError, KeyError):
            pass
    logs = pathlib.Path(options.logs)
    logs.mkdir(parents=True, exist_ok=True)
    path = logs / (variant + '.log')
    note('studio-start', variant=variant, log=str(path))
    start = time.time()
    command = ['blender', '-b', '-t', '2', '--python', 'scripts/dach3d/roofs.py', '--',
               variant, '--asset-version', '2', '--samples', str(options.samples),
               '--width', str(options.width)]
    with path.open('w') as output:
        result = subprocess.run(command, cwd=ROOT, stdin=subprocess.DEVNULL,
                                stdout=output, stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError('Studio production failed: ' + variant + '\n' + path.read_text()[-4000:])
    stats = verified(variant)
    # If a source file changed during a long render, never claim that this
    # output was made from the new version. Resume will rerender it next time.
    if source_hash(options) != fingerprint:
        raise RuntimeError('Studio production source changed during rendering: ' + variant)
    STATE.mkdir(parents=True, exist_ok=True)
    temporary = receipt.with_suffix('.tmp')
    temporary.write_text(json.dumps({'version': 2, 'source': fingerprint,
                                     'files': file_records(paths(variant))}, indent=2) + '\n')
    temporary.replace(receipt)
    note('studio-done', variant=variant, seconds=round(time.time() - start, 1), **stats)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('variants', nargs='*', choices=VARIANTS)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--samples', type=int, default=64)
    parser.add_argument('--width', type=int, default=1440)
    parser.add_argument('--workers', type=int, choices=[1, 2], default=2)
    parser.add_argument('--logs', default='/tmp/dach-studio-production')
    parser.add_argument('--completion-marker', default='/tmp/dach014-overviews-complete')
    options = parser.parse_args()
    if options.samples < 32 or options.width < 1200:
        raise ValueError('Studio quality requires at least 32 samples and 1200 pixels width')
    denoise_python = os.environ.get('DACH_DENOISE_PYTHON', 'python3')
    try:
        subprocess.run([denoise_python, '-c', 'import oidn, OpenEXR, numpy, PIL'],
                       check=True, capture_output=True, text=True)
    except (OSError, subprocess.CalledProcessError) as error:
        raise RuntimeError('Studio denoising tools are unavailable. Install the pinned '
                           'requirements from DENOISING.md and set DACH_DENOISE_PYTHON '
                           'before starting a long render.') from error
    fingerprint = source_hash(options)
    completion = pathlib.Path(options.completion_marker)
    completion.unlink(missing_ok=True)
    note('studio-production-start', source=fingerprint, variants=options.variants or VARIANTS)
    with concurrent.futures.ThreadPoolExecutor(max_workers=options.workers) as workers:
        jobs = [workers.submit(run_variant, variant, options, fingerprint)
                for variant in (options.variants or VARIANTS)]
        for job in concurrent.futures.as_completed(jobs):
            job.result()
    note('studio-production-complete')
    completion.write_text(json.dumps({'source': fingerprint, 'variants': options.variants or VARIANTS}) + '\n')


if __name__ == '__main__':
    main()
