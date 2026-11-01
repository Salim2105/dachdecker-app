"""CPU ray-tracing denoising for own rendered roof media.

This optional production tool runs outside Blender. Linear Blender multilayer
EXRs stay linear float32; Blender applies its configured AgX view transform only
when it later saves the final WebP. It is never shipped into the web viewer.
See DENOISING.md for the pinned Linux production dependencies and licenses.
"""
import argparse
import ctypes
import json
from pathlib import Path
import sys
import time


def _float_image(value, name, np):
    result = np.ascontiguousarray(value, dtype=np.float32)
    if result.ndim != 3 or result.shape[2] != 3:
        raise ValueError(name + " must contain three channels")
    if result.shape[0] * result.shape[1] > 16_000_000:
        raise ValueError("The production image exceeds the 16 megapixel limit")
    if not np.isfinite(result).all():
        raise ValueError(name + " contains non-finite render values")
    return result


def _read_exr(path, layer, beauty_only, np, OpenEXR):
    source = OpenEXR.File(str(path), separate_channels=True)
    channels = source.channels()
    if layer:
        prefix = layer + ".Combined"
    else:
        choices = [name[:-2] for name in channels if name.endswith(".Combined.R")]
        if not choices and all(c in channels for c in ["R", "G", "B"]):
            choices = [""]
        if len(choices) != 1:
            raise ValueError("Choose exactly one Blender view layer with --layer")
        prefix = choices[0]

    def stack(prefix, suffixes):
        names = [(prefix + "." if prefix else "") + c for c in suffixes]
        if not all(name in channels for name in names):
            return None
        return np.stack([channels[name].pixels for name in names], axis=-1)

    color = stack(prefix, "RGB")
    if color is None:
        raise ValueError("No complete RGB beauty pass was found")
    base = prefix.removesuffix(".Combined")
    albedo = None if beauty_only else stack(base + ".Denoising Albedo", "RGB")
    normal = None if beauty_only else stack(base + ".Denoising Normal", "XYZ")
    alpha_name = (prefix + "." if prefix else "") + "A"
    alpha = channels[alpha_name].pixels.copy() if alpha_name in channels else None
    header = {k: source.header()[k] for k in ["dataWindow", "displayWindow", "pixelAspectRatio"] if k in source.header()}
    return color, albedo, normal, alpha, header


def _denoise(color, albedo, normal, hdr, threads, np, oidn):
    # oidn 0.2.1 bundles Intel OIDN 1.4.3. Its minimal Python wrapper does not
    # expose typed parameter setters, so declare only the two required C calls.
    if sys.platform != "linux":
        raise RuntimeError("This external OIDN production path is verified on Linux x86_64 only; use Blender's native denoiser on other production systems")
    library = Path(oidn.__file__).parent / "lib.linux.x64/libOpenImageDenoise.so.1.4.3"
    lib = ctypes.CDLL(str(library))
    lib.oidnSetDevice1i.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int]
    lib.oidnSetDevice1i.restype = None
    lib.oidnSetFilter1b.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_bool]
    lib.oidnSetFilter1b.restype = None
    color = _float_image(color, "Beauty pass", np)
    output = np.empty_like(color)
    h, w, _ = color.shape
    device, filter_handle = oidn.NewDevice(), None
    if not device:
        raise RuntimeError("OIDN could not create its CPU device")
    try:
        lib.oidnSetDevice1i(device, b"numThreads", threads)
        oidn.CommitDevice(device)
        filter_handle = oidn.NewFilter(device, "RT")
        oidn.SetSharedFilterImage(filter_handle, "color", color, oidn.FORMAT_FLOAT3, w, h)
        oidn.SetSharedFilterImage(filter_handle, "output", output, oidn.FORMAT_FLOAT3, w, h)
        auxiliaries = []
        for name, value in [("albedo", albedo), ("normal", normal if albedo is not None else None)]:
            if value is None:
                continue
            value = _float_image(value, name, np)
            if value.shape != color.shape:
                raise ValueError(name + " and beauty dimensions differ")
            auxiliaries.append(value)  # Keep shared buffers alive until ExecuteFilter returns.
            oidn.SetSharedFilterImage(filter_handle, name, value, oidn.FORMAT_FLOAT3, w, h)
        lib.oidnSetFilter1b(filter_handle, b"hdr", hdr)
        lib.oidnSetFilter1b(filter_handle, b"srgb", not hdr)
        oidn.CommitFilter(filter_handle)
        oidn.ExecuteFilter(filter_handle)
        error = oidn.GetDeviceError(device)
        if error:
            raise RuntimeError("OIDN rejected the render (error " + str(error) + ")")
        if not np.isfinite(output).all():
            raise RuntimeError("OIDN returned non-finite pixels")
        return output
    finally:
        if filter_handle:
            oidn.ReleaseFilter(filter_handle)
        oidn.ReleaseDevice(device)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--threads", type=int, default=2, choices=range(1, 5))
    parser.add_argument("--layer", help="Blender view layer when the EXR contains several beauty passes")
    parser.add_argument("--beauty-only", action="store_true", help="Ignore optional albedo and normal guides")
    args = parser.parse_args()
    import numpy as np
    from PIL import Image
    import oidn
    started = time.time()
    hdr = args.input.suffix.lower() == ".exr"
    if hdr:
        if args.output.suffix.lower() != ".exr":
            raise ValueError("A linear EXR must produce a linear EXR; let Blender apply AgX for the final WebP")
        import OpenEXR
        color, albedo, normal, alpha, header = _read_exr(args.input, args.layer, args.beauty_only, np, OpenEXR)
    else:
        color = np.asarray(Image.open(args.input).convert("RGB"), dtype=np.float32) / 255
        albedo, normal, alpha, header = None, None, None, {}
    result = _denoise(color, albedo, normal, hdr, args.threads, np, oidn)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if hdr:
        header.update({"compression": OpenEXR.ZIP_COMPRESSION, "type": OpenEXR.scanlineimage})
        channels = {c: np.ascontiguousarray(result[:, :, i]) for i, c in enumerate("RGB")}
        if alpha is not None:
            channels["A"] = np.ascontiguousarray(alpha, dtype=np.float32)
        OpenEXR.File(header, channels).write(str(args.output))
    else:
        Image.fromarray(np.uint8(np.clip(result, 0, 1) * 255 + .5)).save(args.output, quality=93)
    print(json.dumps({"denoiser": "Intel OpenImageDenoise " + oidn.oidn_version, "hdr": hdr,
        "albedo": albedo is not None, "normal": normal is not None and albedo is not None,
        "pixels": [result.shape[1], result.shape[0]], "threads": args.threads, "seconds": round(time.time() - started, 2)}))


if __name__ == "__main__":
    main()
