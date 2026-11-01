"""Version 2 studio details, derived from the validated teaching constructions.

The original v1 files remain untouched. This producer changes material finish
and the ceramic surface profile, not the functional layers, anchors or faults.
Fixed images and the GLB are built from the same version 2 scene. Real OIDN
uses linear beauty/albedo/normal passes through common.render_studio_webp.

One sample:
  blender -b -t 2 --python scripts/dach3d/studio_details.py -- \
    --variant steildach-falzziegel --details s03 --samples 16 --width 960

Full production, at most two Blender processes with two threads each:
  python3 scripts/dach3d/studio_details.py --produce-all --resume --workers 2
"""
import argparse
import concurrent.futures
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "public/dach-medien/v2"
PREVIEW = ROOT / "public/dach-vorschau/v2"
STATE = ROOT / ".dach3d-build-state/studio-details-v2"
VARIANTS = ["steildach-falzziegel", "steildach-biber-doppel", "walmdach-falzziegel", "walmdach-biber-doppel", "flachdach-warmdach"]
SHARED = [f"g{i:02}" for i in range(1, 7)]
STEEP = SHARED + [f"s{i:02}" for i in range(1, 12)] + [f"a{i:02}" for i in range(1, 5)]
HIP_SHARED = SHARED + ["s01", "s02", "s03", "s05", "s07", "s08", "s09", "s11"] + [f"a{i:02}" for i in range(1, 5)]
FLAT = SHARED + [f"f{i:02}" for i in range(1, 10)] + ["a01", "a03", "a04"]
VIEWS = ["nah", "schnitt", "aufbau", "fehler"]


def note(event, **data):
    print(json.dumps({"event": event, "at": time.time(), **data}), flush=True)


def source_fingerprint():
    digest = hashlib.sha256()
    for name in ["studio_details.py", "details.py", "common.py", "denoise.py", "denoise-requirements.txt", "optimize.mjs"]:
        digest.update(name.encode())
        digest.update((ROOT / "scripts/dach3d" / name).read_bytes())
    return digest.hexdigest()


def output_files(variant, detail, views=VIEWS):
    base = MEDIA / variant / detail
    return [base / "modell.glb"] + [base / (v + ".webp") for v in views] + [PREVIEW / variant / (detail + "-" + v + ".webp") for v in views]


def receipt_path(variant, detail):
    return STATE / variant / (detail + ".json")


def complete(variant, detail, fingerprint, params):
    try:
        record = json.loads(receipt_path(variant, detail).read_text())
        files = output_files(variant, detail, params["views"])
        if record["fingerprint"] != fingerprint or record["params"] != params or len(record["files"]) != len(files):
            return False
        for path, info in zip(files, record["files"]):
            data = path.read_bytes()
            if info["path"] != str(path.relative_to(ROOT)) or info["bytes"] != len(data) or info["sha256"] != hashlib.sha256(data).hexdigest():
                return False
        return True
    except (OSError, ValueError, KeyError, TypeError):
        return False


def record(variant, detail, fingerprint, params):
    files = []
    for path in output_files(variant, detail, params["views"]):
        data = path.read_bytes()
        files.append({"path": str(path.relative_to(ROOT)), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    target = receipt_path(variant, detail)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(".tmp")
    temporary.write_text(json.dumps({"version": 2, "fingerprint": fingerprint, "params": params, "files": files}, indent=2) + "\n")
    temporary.replace(target)


def configure():
    """Patch the imported scene factory inside this private Blender process."""
    sys.path.insert(0, str(ROOT / "scripts/dach3d"))
    import bpy
    import details as d
    import common
    original_tile = d.tile
    original_surface_tile = d.variant_surface_tile

    def formed_mesh(name, surface, width, length, suffix, mat="ceramic", end=None):
        # Sample the formed ceramic surface, instead of evaluating sin(0) and
        # sin(2*pi) only at a quad's corners. A genuine pan, roll and interlock
        # remain within the existing frame/overlap envelope of the lesson.
        cross = [(-.50, .013), (-.44, .020), (-.36, .007), (-.22, .001), (.12, .001), (.29, .007), (.38, .022), (.46, .024), (.50, .012)]
        count = len(cross)
        verts = []
        for lower in [False, True]:
            for yy in [0, length if end is None else end]:
                for xx, profile in cross:
                    xx *= width
                    height = profile + .032 * (1 - yy / length) - (.011 if lower else 0)
                    verts.append(surface(xx, yy, height))
        faces = []
        for i in range(count - 1):
            faces.append((i, i + 1, count + i + 1, count + i))
        top_count = len(faces)
        offset = count * 2
        for i in range(count - 1):
            faces.append((offset + i, offset + count + i, offset + count + i + 1, offset + i + 1))
            faces.append((i, offset + i, offset + i + 1, i + 1))
            faces.append((count + i + 1, offset + count + i + 1, offset + count + i, count + i))
        faces += [(0, count, offset + count, offset), (count - 1, offset + count - 1, offset + 2 * count - 1, 2 * count - 1)]
        ob = d.cm(name, verts, faces, mat, suffix, "deckung", 3)
        for polygon in list(ob.data.polygons)[:top_count]:
            polygon.use_smooth = True
        return ob

    def studio_tile(x, y, z=.12, width=None, length=None, suffix="deckung", slope=d.SLOPE, base=.65, clipped=None, angle=0):
        if d.BIBER:
            return original_tile(x, y, z, width, length, suffix, slope, base, clipped, angle)
        width = width or .28
        length = length or .42
        def surface(xx, yy, height):
            px = x + xx * math.cos(angle) - yy * math.sin(angle)
            py = y + xx * math.sin(angle) + yy * math.cos(angle)
            return d.xyz(px, py, z + height, base, slope)
        mat = "ceramic_dark" if (round(x * 100) + round(y * 100)) % 11 == 0 else "ceramic"
        ob = formed_mesh("Profilierter Falzziegel · Studiomodell", surface, width, length, suffix, mat)
        # A restrained head hook remains a real ceramic component; the side
        # interlock is already formed in the sampled profile, not a huge bar.
        a = surface(-width * .40, length - .021, .025)
        b = surface(width * .40, length - .021, .025)
        d.line("Kopffalz Studioprofil", a, b, .014, .011, "ceramic", suffix, "deckung", 3)
        return ob

    def studio_surface_tile(name, a, b, surface, suffix="ziegel", max_b=None):
        if d.BIBER:
            return original_surface_tile(name, a, b, surface, suffix, max_b)
        end = min(.42, max_b - b) if max_b is not None else .42
        if end <= .0001:
            return None
        def positioned(xx, yy, height):
            x, y, z = surface(a + xx, b + yy)
            return x, y, z + .012 + height
        return formed_mesh(name + " · Studioprofil", positioned, .28, .42, suffix, end=end)

    d.make_materials = common.make_studio_materials
    d.setup_render = common.setup_studio_render
    d.render_webp = common.render_studio_webp
    d.MEDIA, d.PREVIEW = str(MEDIA), str(PREVIEW)
    d.tile = studio_tile
    d.variant_surface_tile = studio_surface_tile
    # Private v2 receipts below replace the original v1 producer's receipts.
    d.production_record = lambda *args, **kwargs: None
    d.production_complete = lambda *args, **kwargs: False
    return d, bpy


def validate_model(path, detail):
    raw = path.read_bytes()
    if raw[:4] != b"glTF" or int.from_bytes(raw[8:12], "little") != len(raw):
        raise ValueError("Invalid GLB: " + str(path))
    doc = json.loads(raw[20:20 + int.from_bytes(raw[12:16], "little")])
    per_mesh = [sum(doc["accessors"][p.get("indices", p["attributes"]["POSITION"])]["count"] // 3 for p in m["primitives"]) for m in doc["meshes"]]
    triangles = sum(per_mesh[n["mesh"]] for n in doc["nodes"] if "mesh" in n)
    if triangles > 100000 or len(raw) > 10 * 1048576:
        raise ValueError("Studio detail budget exceeded: " + str(path))
    if not any(n.get("extras", {}).get("detail_id") == detail for n in doc["nodes"]):
        raise ValueError("Missing semantic detail nodes: " + str(path))
    return triangles


def worker(opts):
    d, bpy = configure()
    fingerprint = source_fingerprint()
    params = {"views": opts.views.split(","), "samples": opts.samples, "width": opts.width}
    for variant in [opts.variant] if opts.variant else VARIANTS:
        ids = opts.details.split(",") if opts.details else d.ids_for(variant)
        for detail in ids:
            if detail not in d.ids_for(variant):
                raise ValueError("Unknown studio detail: " + variant + "/" + detail)
            if opts.resume and complete(variant, detail, fingerprint, params):
                note("studio-detail-reused", variant=variant, detail=detail)
                continue
            start = time.time()
            d.render_variant(detail, variant, params["views"], opts.samples, (opts.width, round(opts.width * 2 / 3)), False)
            triangles = validate_model(MEDIA / variant / detail / "modell.glb", detail)
            record(variant, detail, fingerprint, params)
            note("studio-detail-complete", variant=variant, detail=detail, seconds=round(time.time() - start, 2), triangles=triangles)


def produce_all(opts):
    logs = Path(opts.logs)
    logs.mkdir(parents=True, exist_ok=True)
    # One detail per process makes interruption cheap and allows the second
    # renderer slot to be released as soon as overview production is finished.
    jobs = [(VARIANTS[0], d) for d in STEEP] + [(VARIANTS[1], d) for d in STEEP] + [(VARIANTS[4], d) for d in FLAT]
    jobs += [(v, f"w{i:02}") for v in VARIANTS[2:4] for i in range(1, 5)]
    pending, active, finished = list(jobs), {}, []
    progress = logs / "progress.json"
    completion = Path("/tmp/dach014-details-complete")
    completion.unlink(missing_ok=True)
    def save_progress():
        temporary = progress.with_suffix(".tmp")
        temporary.write_text(json.dumps({"completed": len(finished), "total": len(jobs), "active": list(active.values()), "pending": len(pending), "at": time.time()}, indent=2) + "\n")
        temporary.replace(progress)
    def run(variant, detail):
        path = logs / (variant + "-" + detail + ".log")
        command = ["blender", "-b", "-t", "2", "--python", str(Path(__file__).resolve()), "--", "--variant", variant, "--details", detail, "--samples", str(opts.samples), "--width", str(opts.width)]
        if opts.resume:
            command.append("--resume")
        note("studio-job-start", variant=variant, detail=detail, log=str(path))
        with path.open("w") as out:
            result = subprocess.run(command, cwd=ROOT, stdout=out, stderr=subprocess.STDOUT)
        if result.returncode:
            raise RuntimeError(str(path) + "\n" + path.read_text()[-5000:])
        note("studio-job-done", variant=variant, detail=detail)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        while pending or active:
            limit = min(2, opts.workers)
            if opts.first_slot_only_until and not Path(opts.first_slot_only_until).exists():
                limit = 1
            while pending and len(active) < limit:
                job = pending.pop(0)
                active[pool.submit(run, *job)] = job
                save_progress()
            done, _ = concurrent.futures.wait(active, timeout=1, return_when=concurrent.futures.FIRST_COMPLETED)
            for future in done:
                future.result()
                finished.append(active.pop(future))
                save_progress()
    for covering in ["falzziegel", "biber-doppel"]:
        src, dst = "steildach-" + covering, "walmdach-" + covering
        for detail in HIP_SHARED:
            (MEDIA / dst / detail).mkdir(parents=True, exist_ok=True)
            (PREVIEW / dst).mkdir(parents=True, exist_ok=True)
            for name in ["modell.glb"] + [v + ".webp" for v in VIEWS]:
                shutil.copyfile(MEDIA / src / detail / name, MEDIA / dst / detail / name)
            for view in VIEWS:
                shutil.copyfile(PREVIEW / src / (detail + "-" + view + ".webp"), PREVIEW / dst / (detail + "-" + view + ".webp"))
    completion.write_text(json.dumps({"uniqueContexts": len(jobs), "publishedContexts": 104, "completedAt": time.time(), "sourceFingerprint": source_fingerprint()}) + "\n")
    note("studio-details-production-complete", uniqueContexts=len(jobs), publishedContexts=104)


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser()
    parser.add_argument("--variant", choices=VARIANTS)
    parser.add_argument("--details")
    parser.add_argument("--views", default=",".join(VIEWS))
    parser.add_argument("--samples", type=int, default=16)
    parser.add_argument("--width", type=int, default=960)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--produce-all", action="store_true")
    parser.add_argument("--workers", type=int, choices=[1, 2], default=2)
    parser.add_argument("--first-slot-only-until")
    parser.add_argument("--logs", default="/tmp/dach014-studio-details")
    opts = parser.parse_args(arguments)
    if opts.produce_all:
        produce_all(opts)
    else:
        worker(opts)


if __name__ == "__main__":
    main()
