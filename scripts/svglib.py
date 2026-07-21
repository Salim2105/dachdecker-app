# -*- coding: utf-8 -*-
"""
Baukasten für saubere, kollisionsfreie Fach-Zeichnungen im Bauzeichnungs-Stil.

Regeln gegen die Fehler der Vergangenheit:
  - Geometrie oben, kurze Labels; Erklärungen in Legende/Caption UNTER dem Bild.
  - Materialien bekommen genormte Schraffuren (Holz, Mauerwerk, Beton, Dämmung).
  - Maßlinien: Beschriftung steht IMMER frei — nie auf der Linie.
  - Beim Bauen wird geprüft: Textbreite, Callout-Abstand und — entscheidend —
    ob irgendeine Linie durch irgendeinen Text läuft. Wenn ja: Build-Abbruch.
  - Jeder Text im Bild bekommt einen Halo in Kartenfarbe (var(--surface)),
    damit selbst eine nahe Linie die Lesbarkeit nicht stört.
"""
import math
import re

CUR = "currentColor"
ACCENT = "#c07d4a"
GOOD = "#4f9d78"
BAD = "#c25f4f"

_W_NARROW = set("iIl.,:;'|!ftj()[]/ ")
_W_WIDE = set("mMwW@—–")
_W_CAP = set("ABCDEFGHKNOPQRSUVXYZÄÖÜ")


def _char_em(c: str) -> float:
    if c in _W_NARROW:
        return 0.30
    if c in _W_WIDE:
        return 0.88
    if c in _W_CAP:
        return 0.70
    if c.isdigit():
        return 0.58
    return 0.55


def text_width(s: str, size: float) -> float:
    """Textbreite in px, leicht konservativ. Endkontrolle ist getBBox im Browser."""
    return sum(_char_em(c) for c in s) * size * 1.02 + 0.18 * len(s)


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def wrap(s: str, size: float, max_w: float) -> list:
    worte = s.split()
    zeilen, akt = [], ""
    for wort in worte:
        test = wort if not akt else akt + " " + wort
        if text_width(test, size) <= max_w or not akt:
            akt = test
        else:
            zeilen.append(akt)
            akt = wort
    if akt:
        zeilen.append(akt)
    return zeilen


def _seg_hits_box(x1, y1, x2, y2, bx0, by0, bx1, by1) -> bool:
    """Schneidet die Strecke (x1,y1)-(x2,y2) das Rechteck?"""
    def inside(px, py):
        return bx0 <= px <= bx1 and by0 <= py <= by1
    if inside(x1, y1) or inside(x2, y2):
        return True
    # Trennachsen-Schnelltest
    if max(x1, x2) < bx0 or min(x1, x2) > bx1 or max(y1, y2) < by0 or min(y1, y2) > by1:
        return False
    # Strecke gegen die vier Kanten
    def cross(ax, ay, bx, by, cx, cy):
        return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    def segs_intersect(p1, p2, p3, p4):
        d1 = cross(*p3, *p4, *p1)
        d2 = cross(*p3, *p4, *p2)
        d3 = cross(*p1, *p2, *p3)
        d4 = cross(*p1, *p2, *p4)
        return ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0))
    ecken = [(bx0, by0), (bx1, by0), (bx1, by1), (bx0, by1)]
    for i in range(4):
        if segs_intersect((x1, y1), (x2, y2), ecken[i], ecken[(i + 1) % 4]):
            return True
    return False


# Genormte Material-Schraffuren (currentColor → themefähig).
# (kachel_w, kachel_h, inhalt)
_PATTERNS = {
    # Mauerwerk: einfache 45°-Schraffur
    "mauerwerk": (9, 9, "<path d='M-2 11 L11 -2' stroke='currentColor' stroke-width='0.9' opacity='0.45'/>"),
    # Vollholz im Schnitt: Kreuzschraffur
    "holz": (9, 9, "<path d='M-2 11 L11 -2 M-2 -2 L11 11' stroke='currentColor' stroke-width='0.7' opacity='0.4'/>"),
    # Beton: 45°-Schraffur mit Zuschlagskörnern
    "beton": (16, 16, "<path d='M-2 18 L18 -2' stroke='currentColor' stroke-width='0.8' opacity='0.4'/>"
                      "<circle cx='4' cy='5' r='1.1' fill='none' stroke='currentColor' stroke-width='0.7' opacity='0.5'/>"
                      "<circle cx='11' cy='12' r='1.4' fill='none' stroke='currentColor' stroke-width='0.7' opacity='0.5'/>"),
    # Dämmung: die typische Wellen-Signatur
    "daemmung": (14, 10, "<path d='M0 5 Q3.5 0 7 5 Q10.5 10 14 5' fill='none' stroke='currentColor' stroke-width='0.9' opacity='0.55'/>"),
    # Brett/Schalung (Holz längs): feine Maserungslinien
    "brett": (12, 5, "<path d='M0 2.5 H12' stroke='currentColor' stroke-width='0.6' opacity='0.4'/>"),
}


class Fig:
    _seq = 0

    def __init__(self, aria: str, width: int = 380, pad: int = 18):
        Fig._seq += 1
        self.uid = f"fg{Fig._seq}"
        self.w = width
        self.pad = pad
        self.aria = aria
        self.art = []
        self.art_h = 0
        self.legend_items = []
        self.legend_cols = 1
        self.caption_lines = []
        self._segments = []      # (x1,y1,x2,y2, beschreibung)
        self._textboxes = []     # (x0,y0,x1,y1, text)
        self._markers = []       # (x,y,r)
        self._patterns = {}      # art -> pattern-id

    # ---- intern ---------------------------------------------------------
    def _col(self, c):
        return CUR if c is None else c

    def _seg(self, x1, y1, x2, y2, was=""):
        self._segments.append((x1, y1, x2, y2, was))

    def _register_text(self, x_left, y_baseline, w, size, text):
        self._textboxes.append(
            (x_left - 2, y_baseline - 0.80 * size - 2, x_left + w + 2, y_baseline + 0.26 * size + 2, text))

    def _parse_path_segs(self, d):
        """Zerlegt absolute M/L/Q/A/Z-Pfade näherungsweise in Strecken."""
        tok = re.findall(r"[MLQAZmlqaz]|-?\d+\.?\d*", d)
        i, cur, start = 0, None, None
        while i < len(tok):
            t = tok[i]
            if t in ("M", "L"):
                x, y = float(tok[i + 1]), float(tok[i + 2])
                if t == "L" and cur:
                    self._seg(cur[0], cur[1], x, y, "path")
                cur = (x, y)
                if t == "M":
                    start = cur
                i += 3
            elif t == "Q":
                cx, cy, x, y = (float(tok[i + 1]), float(tok[i + 2]), float(tok[i + 3]), float(tok[i + 4]))
                if cur:
                    mx, my = (cur[0] + 2 * cx + x) / 4, (cur[1] + 2 * cy + y) / 4
                    self._seg(cur[0], cur[1], mx, my, "path")
                    self._seg(mx, my, x, y, "path")
                cur = (x, y)
                i += 5
            elif t == "A":
                x, y = float(tok[i + 6]), float(tok[i + 7])
                if cur:
                    self._seg(cur[0], cur[1], x, y, "path")
                cur = (x, y)
                i += 8
            elif t in ("Z", "z"):
                if cur and start:
                    self._seg(cur[0], cur[1], start[0], start[1], "path")
                i += 1
            else:
                i += 1

    # ---- Geometrie ------------------------------------------------------
    def line(self, x1, y1, x2, y2, w=1.8, color=None, dash=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        self._seg(x1, y1, x2, y2, "Linie")
        self.art.append(
            f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' "
            f"stroke='{self._col(color)}' stroke-width='{w}'{d}/>")
        return self

    def rect(self, x, y, w, h, sw=1.8, color=None, fill="none", dash=None, rx=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        r = f" rx='{rx}'" if rx else ""
        for (a, b, c, e) in ((x, y, x + w, y), (x + w, y, x + w, y + h),
                             (x + w, y + h, x, y + h), (x, y + h, x, y)):
            self._seg(a, b, c, e, "Rechteck")
        self.art.append(
            f"<rect x='{x}' y='{y}' width='{w}' height='{h}'{r} fill='{fill}' "
            f"stroke='{self._col(color)}' stroke-width='{sw}'{d}/>")
        return self

    def fillrect(self, x, y, w, h, color=ACCENT, opacity="0.16"):
        self.art.append(
            f"<rect x='{x}' y='{y}' width='{w}' height='{h}' fill='{color}' "
            f"stroke='none' opacity='{opacity}'/>")
        return self

    def _use_pattern(self, art):
        if art not in _PATTERNS:
            raise ValueError(f"Unbekannte Schraffur '{art}'")
        if art not in self._patterns:
            self._patterns[art] = f"{self.uid}-{art}"
        return self._patterns[art]

    def hatch_rect(self, x, y, w, h, art, sw=1.8, color=None):
        """Rechteck mit Material-Schraffur (mauerwerk/holz/beton/daemmung/brett)."""
        pid = self._use_pattern(art)
        self.art.append(
            f"<rect x='{x}' y='{y}' width='{w}' height='{h}' fill='url(#{pid})' stroke='none'/>")
        return self.rect(x, y, w, h, sw=sw, color=color)

    def hatch_path(self, d, art, w=1.8, color=None):
        """Geschlossene Fläche mit Material-Schraffur und Kontur."""
        pid = self._use_pattern(art)
        self._parse_path_segs(d)
        self.art.append(
            f"<path d='{d}' fill='url(#{pid})' stroke='{self._col(color)}' stroke-width='{w}'/>")
        return self

    def path(self, d, w=1.8, color=None, fill="none", dash=None):
        da = f" stroke-dasharray='{dash}'" if dash else ""
        self._parse_path_segs(d)
        self.art.append(
            f"<path d='{d}' fill='{fill}' stroke='{self._col(color)}' stroke-width='{w}'{da}/>")
        return self

    def poly(self, pts, w=1.8, color=None, fill="none", closed=False):
        d = "M" + " L".join(f"{x} {y}" for x, y in pts)
        if closed:
            d += " Z"
        return self.path(d, w=w, color=color, fill=fill)

    def circle(self, cx, cy, r, sw=1.8, color=None, fill="none"):
        self.art.append(
            f"<circle cx='{cx}' cy='{cy}' r='{r}' fill='{fill}' "
            f"stroke='{self._col(color)}' stroke-width='{sw}'/>")
        return self

    def arrow(self, x1, y1, x2, y2, w=1.8, color=None, head=6.5):
        ang = math.atan2(y2 - y1, x2 - x1)
        c = self._col(color)
        self._seg(x1, y1, x2, y2, "Pfeil")
        self.art.append(
            f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{c}' stroke-width='{w}'/>")
        for s in (0.5, -0.5):
            hx = x2 - head * math.cos(ang - s * 0.5)
            hy = y2 - head * math.sin(ang - s * 0.5)
            self.art.append(
                f"<line x1='{x2}' y1='{y2}' x2='{hx:.1f}' y2='{hy:.1f}' stroke='{c}' stroke-width='{w}'/>")
        return self

    def dim(self, x1, y1, x2, y2, label, size=12, color=ACCENT, side="auto"):
        """Maßlinie mit beidseitigen Pfeilen. Der Text steht IMMER frei:
        waagerecht → mittig über der Linie, senkrecht → neben der Linie."""
        c = color
        self._seg(x1, y1, x2, y2, "Maßlinie")
        self.art.append(
            f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{c}' stroke-width='1.1'/>")
        ang = math.atan2(y2 - y1, x2 - x1)
        for (px, py, a) in ((x1, y1, ang), (x2, y2, ang + math.pi)):
            for s in (0.5, -0.5):
                hx = px + 6 * math.cos(a - s * 0.5)
                hy = py + 6 * math.sin(a - s * 0.5)
                self.art.append(
                    f"<line x1='{px}' y1='{py}' x2='{hx:.1f}' y2='{hy:.1f}' stroke='{c}' stroke-width='1.1'/>")
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if abs(y2 - y1) < 0.5:      # waagerecht → Text darüber oder daneben
            if side == "right":
                self.label(max(x1, x2) + 9, my + size * 0.35, label, size=size, color=c)
            elif side == "left":
                self.label(min(x1, x2) - 9, my + size * 0.35, label, size=size, color=c, anchor="end")
            else:
                self.label(mx, my - 7, label, size=size, color=c, anchor="middle")
        elif abs(x2 - x1) < 0.5:    # senkrecht → Text daneben
            ty = my + size * 0.35
            if side == "left" or (side == "auto" and x1 > self.w * 0.55):
                self.label(x1 - 9, ty, label, size=size, color=c, anchor="end")
            else:
                self.label(x1 + 9, ty, label, size=size, color=c, anchor="start")
        else:                        # schräg → senkrecht zur Linie versetzt
            nx, ny = -math.sin(ang), math.cos(ang)
            self.label(mx - 12 * nx, my - 12 * ny, label, size=size, color=c, anchor="middle")
        return self

    # ---- Text -----------------------------------------------------------
    def label(self, x, y, s, size=12, color=None, anchor="start", weight=None):
        w = text_width(s, size)
        left = x if anchor == "start" else (x - w if anchor == "end" else x - w / 2)
        if left < -2 or left + w > self.w + 2:
            raise ValueError(
                f"Label '{s}' ragt aus dem Bild (x={x}, anchor={anchor}, w={w:.0f}, W={self.w})")
        self._register_text(left, y, w, size, s)
        return self._art_text(x, y, s, size=size, color=self._col(color), anchor=anchor, weight=weight)

    def _art_text(self, x, y, s, size=12, color=CUR, anchor="start", weight=None, halo=True):
        fw = f" font-weight='{weight}'" if weight else ""
        h = (" stroke='var(--surface)' stroke-width='3.5' paint-order='stroke' "
             "stroke-linejoin='round'") if halo else ""
        self.art.append(
            f"<text x='{x}' y='{y}' fill='{color}' font-size='{size}' "
            f"text-anchor='{anchor}'{fw}{h}>{_esc(s)}</text>")
        return self

    def boxlabel(self, x, y, w, h, lines, size=12, color=None, accent=False,
                 fill="none", dash=None):
        if isinstance(lines, str):
            lines = [lines]
        col = ACCENT if accent else self._col(color)
        for ln in lines:
            if text_width(ln, size) > w - 12:
                raise ValueError(f"Kastentext '{ln}' passt nicht in Breite {w}")
        self.rect(x, y, w, h, sw=2 if accent else 1.6, color=col, fill=fill, dash=dash)
        n = len(lines)
        cy = y + h / 2 - (n - 1) * (size + 3) / 2 + size * 0.35
        for i, ln in enumerate(lines):
            self._art_text(x + w / 2, cy + i * (size + 3), ln, size=size,
                           color=col, anchor="middle", halo=False)
        return self

    def barlabel(self, x, y, w, h, text, size=12, color=None, accent=False):
        col = ACCENT if accent else self._col(color)
        if text_width(text, size) > w - 20:
            raise ValueError(f"Balkentext '{text}' zu breit für {w}")
        self.rect(x, y, w, h, sw=2 if accent else 1.6, color=col)
        self._art_text(x + 12, y + h / 2 + size * 0.35, text, size=size, color=col, halo=False)
        return self

    def callout(self, n, x, y, r=11):
        for (mx, my, mr) in self._markers:
            if ((x - mx) ** 2 + (y - my) ** 2) ** 0.5 < r + mr - 1:
                raise ValueError(f"Callout {n} bei ({x},{y}) überlappt einen anderen Marker")
        self._markers.append((x, y, r))
        self.art.append(
            f"<circle cx='{x}' cy='{y}' r='{r}' fill='{ACCENT}'/>"
            f"<text x='{x}' y='{y + 4.5}' fill='#1b1d20' font-size='13' "
            f"text-anchor='middle' font-weight='bold'>{n}</text>")
        return self

    def leader(self, n, x, y, tx, ty, r=11):
        self.line(tx, ty, x, y, w=1, color=ACCENT)
        return self.callout(n, tx, ty, r=r)

    # ---- Legende / Caption ----------------------------------------------
    def set_art_height(self, h):
        self.art_h = h
        return self

    def legend(self, items, cols=1):
        norm = []
        for it in items:
            norm.append((it[0], it[1], None) if len(it) == 2 else it)
        self.legend_items = norm
        self.legend_cols = cols
        return self

    def caption(self, text, color=None):
        self.caption_lines.append((text, color))
        return self

    # ---- Kollisionen ----------------------------------------------------
    def _check_collisions(self):
        for (bx0, by0, bx1, by1, text) in self._textboxes:
            for (x1, y1, x2, y2, was) in self._segments:
                if _seg_hits_box(x1, y1, x2, y2, bx0, by0, bx1, by1):
                    raise ValueError(
                        f"{was} ({x1:.0f},{y1:.0f})→({x2:.0f},{y2:.0f}) läuft durch Text '{text}'")
        n = len(self._textboxes)
        for i in range(n):
            a = self._textboxes[i]
            for j in range(i + 1, n):
                b = self._textboxes[j]
                if min(a[2], b[2]) - max(a[0], b[0]) > 1 and min(a[3], b[3]) - max(a[1], b[1]) > 1:
                    raise ValueError(f"Texte überlappen: '{a[4]}' und '{b[4]}'")

    # ---- Zusammenbau -----------------------------------------------------
    def render(self) -> str:
        self._check_collisions()
        pad = self.pad
        y = self.art_h
        body = list(self.art)

        if self.legend_items:
            y += 14
            body.append(
                f"<line x1='{pad}' y1='{y - 8}' x2='{self.w - pad}' y2='{y - 8}' "
                f"stroke='{CUR}' stroke-width='1' stroke-dasharray='2 4' opacity='0.5'/>")
            row_h = 22
            cols = self.legend_cols
            col_w = (self.w - 2 * pad) / cols
            ts = 12.5
            for i, (marker, text, color) in enumerate(self.legend_items):
                col, row = i % cols, i // cols
                lx = pad + col * col_w
                ly = y + row * row_h + 6
                tx = lx + (24 if marker is not None else 12)
                avail = col_w - (24 if marker is not None else 12) - 8
                if text_width(text, ts) > avail:
                    raise ValueError(
                        f"Legende '{text}' zu breit ({text_width(text, ts):.0f} > {avail:.0f}).")
                if marker is not None:
                    body.append(
                        f"<circle cx='{lx + 9}' cy='{ly + 3.5}' r='9' fill='{ACCENT}'/>"
                        f"<text x='{lx + 9}' y='{ly + 7.5}' fill='#1b1d20' font-size='11' "
                        f"text-anchor='middle' font-weight='bold'>{marker}</text>")
                body.append(
                    f"<text x='{tx}' y='{ly + 8}' fill='{color if color else CUR}' "
                    f"font-size='{ts}'>{_esc(text)}</text>")
            rows = (len(self.legend_items) + cols - 1) // cols
            y += rows * row_h + 6

        if self.caption_lines:
            y += 10
            for text, color in self.caption_lines:
                for zeile in wrap(text, 12, self.w - 2 * pad):
                    body.append(
                        f"<text x='{pad}' y='{y + 9}' fill='{color or CUR}' font-size='12'>{_esc(zeile)}</text>")
                    y += 17
            y += 2

        defs = ""
        if self._patterns:
            teile = []
            for art, pid in self._patterns.items():
                pw, ph, inhalt = _PATTERNS[art]
                teile.append(
                    f"<pattern id='{pid}' width='{pw}' height='{ph}' patternUnits='userSpaceOnUse'>{inhalt}</pattern>")
            defs = "<defs>" + "".join(teile) + "</defs>"

        h = int(y + pad)
        return (
            f"<svg viewBox='0 0 {self.w} {h}' width='100%' "
            f"style='max-width:{self.w}px;height:auto' xmlns='http://www.w3.org/2000/svg' "
            f"font-family='system-ui, sans-serif' role='img' aria-label='{_esc(self.aria)}'>{defs}{body and ''.join(body)}</svg>")
