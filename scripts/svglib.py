# -*- coding: utf-8 -*-
"""
Baukasten für saubere, kollisionsfreie Fach-Zeichnungen.

Grundidee gegen Überlappungen:
  - Die Zeichnung (Geometrie) lebt oben in einem großzügigen Koordinatenraum.
  - Beschriftungen im Bild sind kurz (1–4 Wörter) und werden am Bau platziert.
  - Erklärungen stehen in einer strukturierten Legende UNTER der Zeichnung,
    Zeile für Zeile mit fester Zeilenhöhe — so können sie sich nicht überlagern.
  - Jede Textbreite wird beim Bauen konservativ geschätzt. Passt ein Label
    nicht, bricht der Build mit Fehler ab, statt später abgeschnitten zu werden.

Das SVG ist responsiv (width 100 %, max-width) und skaliert verlustfrei.
"""

CUR = "currentColor"
ACCENT = "#c07d4a"
GOOD = "#4f9d78"
BAD = "#c25f4f"
MUTED_OPACITY = "0.62"

# Zeichenbreiten in em, konservativ (eher zu breit) für eine proportionale
# Sans wie system-ui / Helvetica. Lieber früher umbrechen als abschneiden.
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
    """Textbreite in px, leicht konservativ. Die echte Kontrolle ist der
    getBBox-Test im Browser (docs/zeichnungen-pruefen.md)."""
    return sum(_char_em(c) for c in s) * size * 1.02 + 0.18 * len(s)


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def wrap(s: str, size: float, max_w: float) -> list[str]:
    """Bricht Text an Wortgrenzen so um, dass jede Zeile in max_w passt."""
    worte = s.split()
    zeilen: list[str] = []
    akt = ""
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


class Fig:
    def __init__(self, aria: str, width: int = 380, pad: int = 18):
        self.w = width
        self.pad = pad
        self.aria = aria
        self.art: list[str] = []
        self.art_h = 0          # Höhe des Zeichnungsteils (wird gesetzt)
        self.legend_items: list = []   # (marker:int|None, text, color)
        self.legend_cols = 1
        self.caption_lines: list[tuple[str, str]] = []  # (text, color)

    # ---- Geometrie -------------------------------------------------------
    def _col(self, c):
        return CUR if c is None else c

    def line(self, x1, y1, x2, y2, w=1.8, color=None, dash=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        self.art.append(
            f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' "
            f"stroke='{self._col(color)}' stroke-width='{w}'{d}/>")
        return self

    def rect(self, x, y, w, h, sw=1.8, color=None, fill="none", dash=None, rx=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        r = f" rx='{rx}'" if rx else ""
        self.art.append(
            f"<rect x='{x}' y='{y}' width='{w}' height='{h}'{r} fill='{fill}' "
            f"stroke='{self._col(color)}' stroke-width='{sw}'{d}/>")
        return self

    def fillrect(self, x, y, w, h, color=ACCENT, opacity="0.16"):
        self.art.append(
            f"<rect x='{x}' y='{y}' width='{w}' height='{h}' fill='{color}' "
            f"stroke='none' opacity='{opacity}'/>")
        return self

    def path(self, d, w=1.8, color=None, fill="none", dash=None):
        da = f" stroke-dasharray='{dash}'" if dash else ""
        self.art.append(
            f"<path d='{d}' fill='{fill}' stroke='{self._col(color)}' "
            f"stroke-width='{w}'{da}/>")
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
        """Linie mit Pfeilspitze am Zielpunkt (x2,y2)."""
        import math
        ang = math.atan2(y2 - y1, x2 - x1)
        c = self._col(color)
        self.art.append(
            f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{c}' stroke-width='{w}'/>")
        for s in (0.5, -0.5):
            hx = x2 - head * math.cos(ang - s * 0.5)
            hy = y2 - head * math.sin(ang - s * 0.5)
            self.art.append(
                f"<line x1='{x2}' y1='{y2}' x2='{hx:.1f}' y2='{hy:.1f}' stroke='{c}' stroke-width='{w}'/>")
        return self

    def dim(self, x1, y1, x2, y2, label, size=12, color=ACCENT, off=0):
        """Bemaßungslinie mit Pfeilen an beiden Enden und Label."""
        import math
        c = color
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
        # Label knapp neben die Mitte, senkrecht versetzt
        self._art_text(mx, my - 5 + off, label, size=size, color=c, anchor="middle")
        return self

    def label(self, x, y, s, size=12, color=None, anchor="start", weight=None):
        """Kurzes Label direkt am Bau. Breite wird geprüft."""
        # Grobprüfung, dass ein In-Bild-Label nicht absurd breit ist.
        w = text_width(s, size)
        left = x if anchor == "start" else (x - w if anchor == "end" else x - w / 2)
        if left < -2 or left + w > self.w + 2:
            raise ValueError(f"Label '{s}' ragt aus dem Bild (x={x}, anchor={anchor}, w={w:.0f}, W={self.w})")
        return self._art_text(x, y, s, size=size, color=self._col(color), anchor=anchor, weight=weight)

    def _art_text(self, x, y, s, size=12, color=CUR, anchor="start", weight=None):
        fw = f" font-weight='{weight}'" if weight else ""
        self.art.append(
            f"<text x='{x}' y='{y}' fill='{color}' font-size='{size}' "
            f"text-anchor='{anchor}'{fw}>{_esc(s)}</text>")
        return self

    def boxlabel(self, x, y, w, h, lines, size=12, color=None, accent=False,
                 fill="none", dash=None):
        """Kasten mit zentrierter (ein- oder mehrzeiliger) Beschriftung.
        Prüft, dass jede Zeile in den Kasten passt."""
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
                           color=col, anchor="middle")
        return self

    def barlabel(self, x, y, w, h, text, size=12, color=None, accent=False):
        """Balken mit linksbündiger Beschriftung (für Ranglisten)."""
        col = ACCENT if accent else self._col(color)
        if text_width(text, size) > w - 20:
            raise ValueError(f"Balkentext '{text}' zu breit für {w}")
        self.rect(x, y, w, h, sw=2 if accent else 1.6, color=col)
        self._art_text(x + 12, y + h / 2 + size * 0.35, text, size=size, color=col)
        return self

    def callout(self, n, x, y, r=11):
        """Nummerierter Marker (gefüllter Kupferkreis) an einer Bau-Stelle.
        Prüft, dass er keinen anderen Marker berührt."""
        if not hasattr(self, "_markers"):
            self._markers = []
        for (mx, my, mr) in self._markers:
            if ((x - mx) ** 2 + (y - my) ** 2) ** 0.5 < r + mr + 2:
                raise ValueError(f"Callout {n} bei ({x},{y}) überlappt einen anderen Marker")
        self._markers.append((x, y, r))
        self.art.append(
            f"<circle cx='{x}' cy='{y}' r='{r}' fill='{ACCENT}'/>"
            f"<text x='{x}' y='{y + 4.5}' fill='#1b1d20' font-size='13' "
            f"text-anchor='middle' font-weight='bold'>{n}</text>")
        return self

    def leader(self, n, x, y, tx, ty, r=11):
        """Callout tx,ty mit dünner Führungslinie zur Bau-Stelle x,y."""
        self.line(tx, ty, x, y, w=1, color=ACCENT)
        return self.callout(n, tx, ty, r=r)

    # ---- Legende / Caption ----------------------------------------------
    def set_art_height(self, h):
        self.art_h = h
        return self

    def legend(self, items, cols=1):
        """items: Liste aus (marker:int|None, text) oder (marker, text, color)."""
        norm = []
        for it in items:
            if len(it) == 2:
                norm.append((it[0], it[1], None))
            else:
                norm.append(it)
        self.legend_items = norm
        self.legend_cols = cols
        return self

    def caption(self, text, color=None):
        self.caption_lines.append((text, color))
        return self

    # ---- Zusammenbau -----------------------------------------------------
    def render(self) -> str:
        pad = self.pad
        y = self.art_h
        body = list(self.art)   # Geometrie-Ebene

        # Legende
        if self.legend_items:
            y += 14
            body.append(
                f"<line x1='{pad}' y1='{y - 8}' x2='{self.w - pad}' y2='{y - 8}' "
                f"stroke='{CUR}' stroke-width='1' stroke-dasharray='2 4' opacity='0.5'/>")
            row_h = 22
            cols = self.legend_cols
            col_w = (self.w - 2 * pad) / cols
            text_size = 12.5
            for i, (marker, text, color) in enumerate(self.legend_items):
                col = i % cols
                row = i // cols
                lx = pad + col * col_w
                ly = y + row * row_h + 6
                tx = lx + (24 if marker is not None else 12)
                avail = col_w - (24 if marker is not None else 12) - 8
                if text_width(text, text_size) > avail:
                    raise ValueError(
                        f"Legende '{text}' zu breit ({text_width(text, text_size):.0f} > {avail:.0f}). "
                        f"Kürzer fassen, Breite erhöhen oder cols verringern.")
                if marker is not None:
                    body.append(
                        f"<circle cx='{lx + 9}' cy='{ly + 3.5}' r='9' fill='{ACCENT}'/>"
                        f"<text x='{lx + 9}' y='{ly + 7.5}' fill='#1b1d20' font-size='11' "
                        f"text-anchor='middle' font-weight='bold'>{marker}</text>")
                col_attr = color if color else CUR
                body.append(
                    f"<text x='{tx}' y='{ly + 8}' fill='{col_attr}' font-size='{text_size}'>{_esc(text)}</text>")
            rows = (len(self.legend_items) + cols - 1) // cols
            y += rows * row_h + 6

        # Caption (umgebrochen, mehrzeilig — kann nicht überlaufen)
        if self.caption_lines:
            y += 10
            for text, color in self.caption_lines:
                for zeile in wrap(text, 12, self.w - 2 * pad):
                    body.append(
                        f"<text x='{pad}' y='{y + 9}' fill='{color or CUR}' font-size='12'>{_esc(zeile)}</text>")
                    y += 17
            y += 2

        h = int(y + pad)
        inner = "".join(body)
        return (
            f"<svg viewBox='0 0 {self.w} {h}' width='100%' "
            f"style='max-width:{self.w}px;height:auto' xmlns='http://www.w3.org/2000/svg' "
            f"font-family='system-ui, sans-serif' role='img' aria-label='{_esc(self.aria)}'>{inner}</svg>")
