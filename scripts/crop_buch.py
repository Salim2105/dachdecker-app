#!/usr/bin/env python3
"""Schneidet Abbildungen aus einem gescannten Buch-PDF hoch aufgelöst aus und
speichert sie als komprimierte WebP in public/buch/<lf>/.

Manifest (JSON): { "pdf": "/pfad/LF1.pdf", "lf": "lf01",
  "figuren": [ { "seite": 7, "box": [x0,y0,x1,y1], "name": "kran",
                 "alt": "...", "unterschrift": "..." }, ... ] }
- "seite" ist die 1-basierte PDF-Seite (nicht die Buchseitenzahl).
- "box" sind Bruchteile der Seite (0..1): links, oben, rechts, unten.

Aufruf:  python scripts/crop_buch.py scripts/buch-crops/lf01.json [--zoom 4] [--quality 82]
Braucht pymupdf und pillow (venv). Kein Netz.
"""
import json
import sys
import os
from pathlib import Path

import fitz  # pymupdf
from PIL import Image

def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: crop_buch.py <manifest.json> [--zoom N] [--quality Q]")
        return 1
    manifest = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    zoom = 4.0
    quality = 82
    for i, a in enumerate(sys.argv):
        if a == "--zoom" and i + 1 < len(sys.argv):
            zoom = float(sys.argv[i + 1])
        if a == "--quality" and i + 1 < len(sys.argv):
            quality = int(sys.argv[i + 1])

    repo = Path(__file__).resolve().parent.parent
    out_dir = repo / "public" / "buch" / manifest["lf"]
    out_dir.mkdir(parents=True, exist_ok=True)

    # Ein Lernfeld kann über mehrere PDF-Dateien verteilt sein (z. B. LF2 Teil 1/2).
    # Jede Figur darf deshalb ein eigenes "pdf" angeben; sonst gilt das oberste.
    docs: dict[str, fitz.Document] = {}

    def hole(pfad: str) -> fitz.Document:
        if pfad not in docs:
            docs[pfad] = fitz.open(pfad)
        return docs[pfad]

    ergebnis = []
    for fig in manifest["figuren"]:
        doc = hole(fig.get("pdf", manifest.get("pdf")))
        page = doc[fig["seite"] - 1]
        # Manche Buchseiten sind quer fotografiert. "rot" dreht die Seite gerade,
        # damit die Box im aufrechten (lesbaren) System angegeben werden kann.
        page.set_rotation(fig.get("rot", 0))
        r = page.rect
        x0, y0, x1, y1 = fig["box"]
        clip = fitz.Rect(r.width * x0, r.height * y0, r.width * x1, r.height * y1)
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip)
        tmp_png = out_dir / (fig["name"] + ".png")
        pix.save(tmp_png)
        with Image.open(tmp_png) as im:
            im.save(out_dir / (fig["name"] + ".webp"), "WEBP", quality=quality, method=6)
        tmp_png.unlink()
        kb = (out_dir / (fig["name"] + ".webp")).stat().st_size / 1024
        ergebnis.append(f"  {fig['name']}: {pix.width}x{pix.height}  {kb:.0f} KB")
    print(f"{manifest['lf']}: {len(ergebnis)} Abbildungen -> public/buch/{manifest['lf']}/")
    print("\n".join(ergebnis))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
