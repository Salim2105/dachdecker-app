# -*- coding: utf-8 -*-
"""Baut die Fach-Zeichnungen mit svglib und schreibt sie in die Lektionen.
Aufruf: python3 scripts/build_svgs.py [lf01 lf02 ...]  (ohne Argument: alle bekannten)"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from svglib import Fig, ACCENT, GOOD, BAD, CUR  # noqa: E402

FIGS = {}


def fig(fid):
    def deco(fn):
        FIGS[fid] = fn
        return fn
    return deco


# ======================================================================
# LF 01 — Baustelle einrichten
# ======================================================================
@fig("lf01-l01")
def _():
    f = Fig("Beteiligte am Bau und ihre Rollen", width=380)
    f.boxlabel(130, 16, 120, 32, "Bauherr", size=13, accent=True)
    f.line(190, 48, 190, 66, w=1.2)
    f.line(70, 66, 310, 66, w=1.2)
    for cx in (70, 190, 310):
        f.line(cx, 66, cx, 84, w=1.2)
    f.boxlabel(18, 84, 104, 46, ["Planungs-", "büro"], size=12)
    f.boxlabel(138, 84, 104, 46, ["Bau-", "firmen"], size=12)
    f.boxlabel(258, 84, 104, 46, ["Bau-", "aufsicht"], size=12)
    f.set_art_height(140)
    f.legend([
        (None, "Planung: plant und zeichnet"),
        (None, "Baufirmen: führen aus"),
        (None, "Bauaufsicht: überwacht"),
    ])
    f.caption("Reihenfolge am Bau: Rohbauer, Zimmerer, Dachdecker, Klempner.", color=CUR)
    f.caption("Du kommst erst, wenn Rohbau und Dachstuhl stehen.", color=ACCENT)
    return f.render()


@fig("lf01-l02")
def _():
    f = Fig("Baustelleneinrichtungsplan in der Draufsicht", width=380)
    f.rect(18, 16, 344, 152, sw=1, dash="5 4")
    f.rect(150, 52, 96, 62)                       # Gebäude
    f.circle(300, 60, 10, color=ACCENT)          # Kran-Symbol
    f.line(300, 50, 300, 70, w=1.4, color=ACCENT); f.line(290, 60, 310, 60, w=1.4, color=ACCENT)
    f.rect(44, 40, 60, 26)                        # Baubude
    f.rect(44, 96, 60, 34)                        # Lager
    f.line(50, 106, 98, 106, w=0.7); f.line(50, 114, 98, 114, w=0.7); f.line(50, 122, 98, 122, w=0.7)
    f.path("M300 118 L340 118 L340 152", w=1.4)  # Zufahrt
    f.callout(1, 198, 83)
    f.callout(2, 300, 92)
    f.callout(3, 74, 53)
    f.callout(4, 74, 113)
    f.callout(5, 340, 100)
    f.set_art_height(180)
    f.legend([
        (1, "Gebäude"), (2, "Kran"),
        (3, "Baubude"), (4, "Materiallager"),
        (5, "Zufahrt"),
    ], cols=2)
    f.caption("Draufsicht mit genormten Sinnbildern, Maßstab 1:100.", color=CUR)
    f.caption("Kurze Wege sparen Zeit und verhindern Unfälle.", color=ACCENT)
    return f.render()


@fig("lf01-l03")
def _():
    f = Fig("STOP-Prinzip: Rangfolge der Schutzmaßnahmen", width=380)
    bars = [
        ("S — Substitution: Gefahr vermeiden", True),
        ("T — Technisch: Geländer, Gerüst, Netz", False),
        ("O — Organisatorisch: Ablauf, Unterweisung", False),
        ("P — Persönlich: PSA, Auffanggurt", False),
    ]
    y = 40
    for text, acc in bars:
        f.barlabel(18, y, 306, 30, text, size=12, accent=acc)
        y += 36
    f.arrow(346, y - 12, 346, 34, w=2, color=ACCENT)
    f.label(340, 26, "wirksamer", size=11, color=ACCENT, anchor="end")
    f.set_art_height(y + 4)
    f.caption("Die höhere Stufe hat immer Vorrang. PSA steht an letzter Stelle.", color=ACCENT)
    return f.render()


# ======================================================================
# LF 02 — Dachziegel und Dachsteine
# ======================================================================
@fig("lf02-l01")
def _():
    f = Fig("Satteldach mit First, Traufe und Ortgang", width=380)
    ax, ay = 190, 54
    lx, rx, ey = 66, 314, 120
    f.poly([(lx, ey), (ax, ay), (rx, ey)], w=2)
    f.line(lx, ey, rx, ey, w=2)
    f.rect(66, 120, 248, 34, sw=1.4)             # Giebelwand
    f.arrow(150, 78, 120, 104, w=1.4, color=ACCENT)   # Wasserlauf
    f.arrow(230, 78, 260, 104, w=1.4, color=ACCENT)
    f.label(190, 44, "First", size=12.5, anchor="middle")
    f.label(46, 138, "Traufe", size=12, anchor="start", color=CUR)
    f.line(96, 133, 118, 121, w=0.8)
    f.label(40, 92, "Ortgang", size=12)
    f.line(92, 96, 110, 88, w=0.8)
    f.set_art_height(162)
    f.caption("Wasser fließt vom First zur Traufe; in der Kehle sammelt es sich.", color=ACCENT)
    return f.render()


@fig("lf02-l02")
def _():
    f = Fig("Biberschwanz, Falzziegel und Hohlpfanne", width=380)
    # Biberschwanz (Rundschnitt)
    f.path("M40 46 L104 46 L104 92 Q72 108 40 92 Z", w=1.8)
    f.callout(1, 72, 66)
    # Falzziegel mit seitlichen Falzen
    f.rect(150, 46, 70, 54, sw=1.8)
    f.line(158, 46, 158, 100, w=1.6, color=ACCENT); f.line(162, 46, 162, 100, w=1.6, color=ACCENT)
    f.line(208, 46, 208, 100, w=1.6, color=ACCENT); f.line(212, 46, 212, 100, w=1.6, color=ACCENT)
    f.callout(2, 185, 70)
    # Hohlpfanne (Wellenprofil)
    f.path("M262 100 Q286 50 310 100 Q334 50 358 100", w=1.8)
    f.callout(3, 310, 74)
    f.set_art_height(118)
    f.legend([
        (1, "Biberschwanz – ohne Falz"),
        (2, "Falzziegel – Falze führen das Wasser"),
        (3, "Hohlpfanne – Wellenprofil"),
    ])
    f.caption("Ziegel werden aus Ton gebrannt, Dachsteine aus Zement gepresst.")
    return f.render()


@fig("lf02-l03")
def _():
    f = Fig("Regeldachneigung und die fünf Klassen der Zusatzmaßnahmen", width=380)
    f.poly([(24, 116), (200, 116), (200, 62)], w=2, closed=True)
    f.path("M56 116 A32 32 0 0 0 50 100", w=1.3, color=ACCENT)
    f.label(62, 110, "RDN", size=12, color=ACCENT)
    f.label(24, 140, "bis zur Regeldachneigung", size=12)
    f.label(24, 156, "regensicher ohne Zusatz", size=12, color=ACCENT)
    f.set_art_height(168)
    f.legend([
        (1, "Klasse 1 – Unterdach (höchste)"),
        (2, "Klasse 2 – Unterdach"),
        (3, "Klasse 3 – Unterdeckung"),
        (4, "Klasse 4 – Unterspannung"),
        (5, "Klasse 5 – einfachste Stufe"),
    ])
    f.caption("Je flacher das Dach oder je höher die Anforderung, desto höher die Klasse.")
    return f.render()


@fig("lf02-l04")
def _():
    f = Fig("Windsog: die Sogspitzen liegen an Rand und Ecke", width=380)
    lx, rx, ey, ax, ay = 60, 320, 130, 190, 58
    f.poly([(lx, ey), (ax, ay), (rx, ey)], w=2)
    f.line(lx, ey, rx, ey, w=2)
    # Sog-Zonen betonen
    f.path(f"M{lx} {ey} L{lx+26} {ey} L{lx+18} {ey-22} Z", fill=ACCENT, color="none")
    f.path(f"M{rx} {ey} L{rx-26} {ey} L{rx-18} {ey-22} Z", fill=ACCENT, color="none")
    f.path(f"M{ax-20} {ay+14} L{ax+20} {ay+14} L{ax} {ay} Z", fill=ACCENT, color="none")
    f.arrow(44, 96, 66, 108, w=1.4)
    f.arrow(336, 96, 314, 108, w=1.4)
    f.arrow(190, 34, 190, 52, w=1.4)
    f.set_art_height(146)
    f.legend([
        (None, "Sogspitzen: Ortgang, First, Kehle, Traufecke"),
        (None, "Windlastzonen 1–4, Zone 4 an Küste und Inseln"),
    ])
    f.caption("Dort dichter verklammern. Ab 65° Dachneigung wird jeder Ziegel gesichert.", color=ACCENT)
    return f.render()


# ======================================================================
# LF 03 — Einschalige Baukörper mauern
# ======================================================================
@fig("lf03-l01")
def _():
    f = Fig("Vollziegel, Hochlochziegel und Kalksandstein", width=380)
    f.rect(30, 46, 78, 50, sw=1.8); f.callout(1, 69, 71)
    f.rect(150, 46, 78, 50, sw=1.8)
    for gx in range(160, 224, 12):
        f.line(gx, 52, gx, 90, w=2.2, color=ACCENT)
    f.callout(2, 189, 71)
    f.rect(270, 46, 78, 50, sw=1.8)
    f.line(278, 62, 340, 62, w=0.7); f.line(278, 78, 340, 78, w=0.7)
    f.callout(3, 309, 71)
    f.set_art_height(114)
    f.legend([
        (1, "Vollziegel – massiv, tragfähig"),
        (2, "Hochlochziegel – dämmt besser"),
        (3, "Kalksandstein – druckfest, schalldämmend"),
    ])
    return f.render()


@fig("lf03-l02")
def _():
    f = Fig("Oktametrisches System: Raster aus 12,5 cm", width=380)
    x0, y0 = 40, 40
    for i in range(9):
        f.line(x0 + i * 26, y0, x0 + i * 26, y0 + 70, w=0.6)
    for j in range(4):
        f.line(x0, y0 + j * 23 + (1 if j == 3 else 0), x0 + 208, y0 + j * 23, w=0.6)
    f.rect(x0, y0 + 23, 52, 24, sw=2, color=ACCENT)
    f.dim(x0, y0 + 84, x0 + 52, y0 + 84, "12,5 cm = ⅛ m")
    f.set_art_height(y0 + 100)
    f.legend([
        (None, "Richtmaß – Rastermaß mit Fuge"),
        (None, "Nennmaß – Bauteilmaß"),
        (None, "Öffnungsmaß – für Tür und Fenster"),
    ])
    f.caption("Alle Maße sind Vielfache von 12,5 cm – so passen Steine und Öffnungen zusammen.")
    return f.render()


@fig("lf03-l03")
def _():
    f = Fig("Läuferverband: Stoßfugen versetzen", width=380)
    def wall(ox, offset):
        rows = [0, 1, 0]
        y = 46
        for r in rows:
            x = ox - (0 if offset else 30) if r else ox
            # einfache Reihe aus zwei Steinen
            if r:
                f.rect(ox, y, 30, 18, sw=1.3)
                f.rect(ox + 30, y, 60, 18, sw=1.3)
                f.rect(ox + 90, y, 30, 18, sw=1.3)
            else:
                f.rect(ox, y, 60, 18, sw=1.3)
                f.rect(ox + 60, y, 60, 18, sw=1.3)
            y += 20
    wall(24, False)
    f.label(24, 118, "richtig", size=13, color=GOOD)
    # falsch: durchgehende Fuge
    ox = 236
    y = 46
    for _r in range(3):
        f.rect(ox, y, 60, 18, sw=1.3); f.rect(ox + 60, y, 60, 18, sw=1.3)
        y += 20
    f.line(ox + 60, 44, ox + 60, 106, w=2.4, color=BAD)
    f.label(236, 118, "falsch", size=13, color=BAD)
    f.set_art_height(128)
    f.caption("Kein Stein darf genau über der Stoßfuge des darunterliegenden sitzen.")
    return f.render()


@fig("lf03-l04")
def _():
    f = Fig("Lagerfuge und Stoßfuge im Mauerwerk", width=380)
    f.rect(60, 44, 90, 26, sw=1.4); f.rect(150, 44, 90, 26, sw=1.4)
    f.rect(60, 78, 90, 26, sw=1.4); f.rect(150, 78, 90, 26, sw=1.4)
    f.fillrect(60, 70, 180, 8, color=ACCENT, opacity="0.55")
    f.fillrect(146, 44, 8, 26, color=ACCENT, opacity="0.55")
    f.leader(1, 250, 74, 300, 74)
    f.leader(2, 150, 40, 300, 44)
    f.set_art_height(116)
    f.legend([
        (1, "Lagerfuge – waagerecht, ca. 12 mm"),
        (2, "Stoßfuge – senkrecht, ca. 10 mm"),
    ])
    f.caption("Der Mörtel verbindet die Steine und gleicht Maßtoleranzen aus.")
    return f.render()


# ======================================================================
# LF 04 — Stahlbetonbauteile
# ======================================================================
@fig("lf04-l01")
def _():
    f = Fig("Beton besteht aus Zement, Gesteinskörnung und Wasser", width=380)
    f.boxlabel(20, 44, 92, 40, "Zement", size=12)
    f.label(120, 70, "+", size=18, anchor="middle")
    f.boxlabel(134, 44, 92, 40, ["Gesteins-", "körnung"], size=11)
    f.label(234, 70, "+", size=18, anchor="middle")
    f.boxlabel(248, 44, 92, 40, "Wasser", size=12, accent=True)
    f.set_art_height(96)
    f.caption("Zement bindet durch Hydratation ab, nicht durch Trocknen.", color=CUR)
    f.caption("w/z-Wert = Wassermasse ÷ Zementmasse. Je kleiner, desto fester der Beton.", color=ACCENT)
    return f.render()


@fig("lf04-l02")
def _():
    f = Fig("Beton nimmt Druck auf, Stahl den Zug", width=380)
    f.rect(34, 52, 120, 42, sw=1.8)
    f.arrow(70, 28, 70, 48, w=1.8, color=ACCENT); f.arrow(120, 28, 120, 48, w=1.8, color=ACCENT)
    f.label(34, 116, "Beton – Druck ✓", size=12)
    f.label(34, 132, "Zug ✗, er reißt", size=12, color=BAD)
    f.line(210, 72, 320, 72, w=3, color=CUR)
    f.arrow(210, 72, 184, 72, w=1.8, color=ACCENT); f.arrow(320, 72, 346, 72, w=1.8, color=ACCENT)
    f.label(210, 116, "Stahl – Zug ✓", size=12)
    f.label(210, 132, "= Verbundbaustoff", size=12, color=ACCENT)
    f.set_art_height(140)
    return f.render()


@fig("lf04-l03")
def _():
    f = Fig("Bewehrung liegt in der Zugzone", width=380)
    # Träger auf zwei Auflagern
    f.rect(28, 48, 120, 26, sw=1.6)
    f.poly([(28, 82), (38, 94), (18, 94)], w=1.4); f.poly([(148, 82), (158, 94), (138, 94)], w=1.4)
    f.line(34, 70, 142, 70, w=2.6, color=ACCENT)
    for ax in (60, 88, 116):
        f.arrow(ax, 30, ax, 46, w=1.3)
    f.label(24, 116, "Träger", size=12)
    f.label(24, 132, "Zug unten", size=12, color=ACCENT)
    # Kragarm
    f.rect(214, 48, 30, 58, sw=1.6); f.rect(244, 48, 104, 26, sw=1.6)
    f.line(220, 54, 344, 54, w=2.6, color=ACCENT)
    for ax in (280, 320):
        f.arrow(ax, 30, ax, 46, w=1.3)
    f.label(214, 122, "Kragarm", size=12)
    f.label(214, 138, "Zug oben", size=12, color=ACCENT)
    f.set_art_height(146)
    f.caption("Falsch eingelegt trägt das Bauteil nicht – ein schwerer Fehler.", color=BAD)
    return f.render()


@fig("lf04-l04")
def _():
    f = Fig("Schalungsdruck, Verdichten und Nachbehandeln", width=380)
    f.rect(40, 40, 16, 84, sw=1.6); f.rect(150, 40, 16, 84, sw=1.6)
    for i, ln in enumerate((22, 32, 42)):
        f.arrow(64, 54 + i * 20, 64 + ln, 54 + i * 20, w=1.4, color=ACCENT)
        f.arrow(142, 54 + i * 20, 142 - ln, 54 + i * 20, w=1.4, color=ACCENT)
    f.label(40, 142, "Schalungsdruck", size=12, color=ACCENT)
    f.label(40, 158, "nimmt nach unten zu", size=12)
    f.line(250, 34, 250, 104, w=3); f.circle(250, 110, 5, sw=2)
    f.rect(214, 104, 72, 24, sw=1.4)
    f.label(214, 148, "Innenrüttler", size=12)
    f.label(214, 164, "treibt Luftporen heraus", size=12)
    f.set_art_height(172)
    return f.render()


# ======================================================================
# LF 05 — Holzkonstruktionen
# ======================================================================
@fig("lf05-l01")
def _():
    f = Fig("Nadelholz und Laubholz", width=380)
    f.line(80, 108, 80, 84, w=1.6)
    f.poly([(64, 84), (96, 84), (80, 62)], w=1.6); f.poly([(66, 68), (94, 68), (80, 48)], w=1.6)
    f.label(46, 130, "Nadelholz", size=12.5)
    f.line(280, 108, 280, 82, w=1.6); f.circle(280, 62, 22, sw=1.6)
    f.label(250, 130, "Laubholz", size=12.5)
    f.set_art_height(140)
    f.legend([
        (None, "Nadelholz: leicht, gerade – das Bauholz"),
        (None, "Laubholz: schwerer, härter, dauerhafter"),
    ])
    f.caption("Für tragende Teile nur sortiertes Bauholz mit Festigkeitsklasse.")
    return f.render()


@fig("lf05-l02")
def _():
    f = Fig("Holz schwindet beim Trocknen und quillt bei Feuchte", width=380)
    f.rect(40, 46, 84, 60, sw=1.8); f.label(40, 124, "feucht", size=12)
    f.rect(220, 44, 84, 62, sw=0.9, dash="4 3")
    f.rect(220, 50, 70, 50, sw=1.8); f.label(220, 124, "getrocknet", size=12, color=ACCENT)
    f.arrow(146, 76, 200, 76, w=1.6, color=ACCENT)
    f.label(150, 66, "trocknet", size=12, color=ACCENT)
    f.set_art_height(136)
    f.caption("Deshalb wird Bauholz vor dem Einbau getrocknet, sonst reißt und verzieht es sich.")
    return f.render()


@fig("lf05-l03")
def _():
    f = Fig("Konstruktiver Holzschutz geht dem chemischen vor", width=380)
    f.path("M40 60 L150 60 L162 44 L52 44 Z", w=1.4)     # Dachüberstand
    f.rect(40, 60, 110, 20, sw=1.6)                        # Holz
    for ax in (66, 96, 126):
        f.arrow(ax, 96, ax, 84, w=1.3, color=ACCENT)
    f.label(40, 122, "1. konstruktiv: trocken halten", size=12, color=ACCENT)
    f.rect(238, 54, 60, 38, sw=1.6)
    f.path("M256 46 L256 36 L280 36 L280 46", w=1.4)
    f.label(238, 122, "2. chemisch", size=12)
    f.set_art_height(132)
    f.caption("Chemie ersetzt niemals eine fehlerhafte Konstruktion.")
    return f.render()


@fig("lf05-l04")
def _():
    f = Fig("Sparrendach und Pfettendach", width=380)
    f.poly([(30, 110), (95, 50), (160, 110)], w=2)
    f.line(30, 110, 160, 110, w=2.6, color=ACCENT)
    f.arrow(44, 122, 26, 122, w=1.2, color=ACCENT); f.arrow(146, 122, 164, 122, w=1.2, color=ACCENT)
    f.label(48, 138, "Zugband", size=11.5, color=ACCENT)
    f.label(30, 158, "Sparrendach", size=12.5)
    f.poly([(220, 110), (285, 50), (350, 110)], w=2)
    for (px, py) in ((285, 46), (252, 74), (318, 74), (222, 106), (348, 106)):
        f.rect(px - 6, py, 12, 10, sw=1.5, color=ACCENT)
    f.label(220, 158, "Pfettendach", size=12.5)
    f.set_art_height(168)
    f.legend([
        (None, "Sparrendach: Dreieck mit Zugband unten"),
        (None, "Pfettendach: Sparren auf drei Pfetten"),
    ])
    return f.render()


# ======================================================================
# LF 06 — Bauteile beschichten und bekleiden
# ======================================================================
@fig("lf06-l01")
def _():
    f = Fig("Dämmstoffe schließen ruhende Luft ein", width=380)
    f.rect(28, 44, 150, 74, sw=1.6)
    import random
    random.seed(3)
    for (cx, cy, r) in [(52, 64, 7), (78, 78, 9), (104, 62, 8), (132, 76, 7),
                        (56, 98, 8), (88, 100, 6), (120, 98, 8), (150, 90, 7)]:
        f.circle(cx, cy, r, sw=1, color=ACCENT)
    f.label(190, 66, "ruhende Luft in Poren", size=12, color=ACCENT)
    f.label(190, 84, "Luft leitet Wärme schlecht", size=12)
    f.set_art_height(130)
    f.legend([
        (None, "mineralisch · synthetisch · nachwachsend"),
    ])
    f.caption("λ in W/(m·K) – je kleiner, desto besser dämmt der Stoff.", color=ACCENT)
    return f.render()


@fig("lf06-l02")
def _():
    f = Fig("Dämmstoffe nach Brandverhalten und Einsatz", width=380)
    f.boxlabel(20, 44, 104, 52, ["Mineralwolle", "nicht brennbar"], size=11)
    f.boxlabel(138, 44, 104, 52, ["EPS / XPS", "brennbar"], size=11)
    f.boxlabel(256, 44, 104, 52, ["PUR / PIR", "sehr gutes λ"], size=11)
    f.set_art_height(110)
    f.legend([
        (None, "Mineralwolle: wo Brandschutz zählt"),
        (None, "XPS: druckfest, wasserfest – Umkehrdach"),
        (None, "PUR/PIR: Flachdach, Aufsparrendämmung"),
    ])
    return f.render()


@fig("lf06-l03")
def _():
    f = Fig("Schutzschicht (Patina) bei Titanzink und Kupfer", width=380)
    f.rect(40, 48, 100, 44, sw=1.8); f.fillrect(40, 48, 100, 9, color=CUR, opacity="0.4")
    f.label(40, 110, "Titanzink", size=12.5)
    f.label(40, 126, "blaugraue Patina", size=12)
    f.rect(240, 48, 100, 44, sw=1.8, color=ACCENT); f.fillrect(240, 48, 100, 9, color=GOOD, opacity="0.6")
    f.label(240, 110, "Kupfer", size=12.5, color=ACCENT)
    f.label(240, 126, "grüne Patina", size=12)
    f.set_art_height(136)
    f.caption("Die Patina schützt das Metall. Regel: Kupfer nie oberhalb von Zink.", color=BAD)
    return f.render()


@fig("lf06-l04")
def _():
    f = Fig("sd-Wert als gleichwertige Luftschichtdicke", width=380)
    f.rect(34, 50, 16, 46, sw=2, color=ACCENT)
    f.label(60, 78, "≙", size=17)
    f.rect(86, 50, 168, 46, sw=1, dash="4 3")
    f.label(94, 78, "gleichwertige Luftschicht", size=12)
    f.dim(86, 108, 254, 108, "sd in Metern", color=CUR)
    f.label(34, 132, "sd = µ · d", size=13, color=ACCENT)
    f.set_art_height(146)
    f.legend([
        (None, "Dampfbremse: großer sd-Wert, bremst stark"),
        (None, "Unterdeckbahn: kleiner sd-Wert, diffusionsoffen"),
    ])
    return f.render()


# ======================================================================
# LF 07 — Niederschlagswasser ableiten
# ======================================================================
@fig("lf07-l01")
def _():
    f = Fig("Traufe mit vorgehängter halbrunder Rinne", width=380)
    f.line(40, 48, 214, 122, w=2.2)                     # Dachfläche
    f.path("M192 132 A24 24 0 0 0 240 132", w=2.2)      # Rinne
    f.line(192, 132, 192, 122, w=2.2); f.line(240, 132, 240, 126, w=2.2)
    f.arrow(210, 124, 214, 138, w=1.5, color=ACCENT)    # Wasser tropft rein
    f.path("M150 150 Q170 150 178 134 L200 120", w=1.6, color=ACCENT)  # Rinneneisen
    f.callout(1, 120, 70)
    f.callout(2, 216, 150)
    f.callout(3, 158, 150)
    f.set_art_height(168)
    f.legend([
        (1, "Dachfläche"), (2, "Rinne (halbrund)"),
        (3, "Rinneneisen"),
    ], cols=2)
    f.caption("Vorderkante tiefer als Hinterkante, damit das Wasser abläuft.", color=ACCENT)
    return f.render()


@fig("lf07-l02")
def _():
    f = Fig("Bemessung: die wirksame Fläche ist die waagerechte Projektion", width=380)
    f.line(70, 52, 250, 112, w=2.2)
    f.label(96, 74, "geneigte Fläche", size=12)
    f.line(70, 52, 70, 138, w=1, dash="4 3")
    f.line(250, 112, 250, 138, w=1, dash="4 3")
    f.dim(70, 138, 250, 138, "wirksame Fläche A")
    f.set_art_height(152)
    f.legend([(None, "Abflussbeiwert C: Dach 1,0 – Kies weniger")])
    f.caption("Q = r · A · C ÷ 10000. Die Regenspende r kommt aus der Tabelle.", color=ACCENT)
    return f.render()


@fig("lf07-l03")
def _():
    f = Fig("Thermische Längenänderung von Metall", width=380)
    f.rect(40, 48, 200, 18, sw=1.6); f.label(248, 62, "kalt", size=12)
    f.rect(40, 88, 250, 18, sw=1.6); f.label(298, 102, "warm", size=12)
    f.line(240, 46, 240, 118, w=1, dash="4 3")
    f.dim(240, 118, 290, 118, "Δl")
    f.set_art_height(134)
    f.label(40, 30, "Δl = α · L · ΔT", size=13, color=ACCENT)
    f.caption("Titanzink dehnt sich stark. Lange Rinnen brauchen Dehnungsausgleicher.")
    return f.render()


@fig("lf07-l04")
def _():
    f = Fig("Kontaktkorrosion: Kupfer nie oberhalb von Zink", width=380)
    f.line(24, 116, 88, 84, w=3); f.line(88, 84, 152, 52, w=3, color=ACCENT)
    f.label(96, 44, "Kupfer", size=12, color=ACCENT)
    f.label(20, 134, "Zink", size=12)
    f.arrow(118, 66, 100, 78, w=1.2)
    f.label(38, 156, "✗ falsch", size=13, color=BAD)
    f.line(228, 116, 292, 84, w=3, color=ACCENT); f.line(292, 84, 356, 52, w=3)
    f.label(300, 44, "Zink", size=12)
    f.label(224, 134, "Kupfer", size=12, color=ACCENT)
    f.label(228, 156, "✓ richtig", size=13, color=GOOD)
    f.set_art_height(166)
    f.caption("Das Wasser trägt Kupferionen nach unten – sie zerstören das Zink.")
    return f.render()


# ======================================================================
# LF 08 — Wärmegedämmte Dächer
# ======================================================================
def _layers(f, layers, x=40, w=150, y0=44, lh=20):
    """Waagerechter Schichtstapel mit Callouts rechts. layers: [(text, accent)]"""
    y = y0
    pts = []
    for i, (text, acc) in enumerate(layers):
        f.rect(x, y, w, lh - 4, sw=1.6, color=(None if not acc else None),
               fill=("none"))
        if acc:
            f.fillrect(x, y, w, lh - 4, color=ACCENT, opacity="0.18")
        f.callout(i + 1, x + w + 18, y + (lh - 4) / 2)
        pts.append((i + 1, text))
        y += lh
    return y, pts


@fig("lf08-l01")
def _():
    f = Fig("Funktionsschichten des gedämmten Steildachs", width=380)
    y, pts = _layers(f, [
        ("Deckung", False),
        ("Traglattung", False),
        ("Konterlattung (Lüftung)", True),
        ("Unterdeckbahn", True),
        ("Sparren + Dämmung", False),
        ("Dampfbremse, luftdicht", True),
        ("Innenbekleidung", False),
    ], x=40, w=150, y0=40, lh=22)
    f.label(40, 30, "außen", size=11)
    f.label(40, y + 4, "innen", size=11)
    f.set_art_height(y + 12)
    f.legend([(n, t) for n, t in pts], cols=1)
    f.caption("Innen dicht, in der Mitte warm, außen regensicher und belüftet.", color=ACCENT)
    return f.render()


@fig("lf08-l02")
def _():
    f = Fig("Unterdach, Unterdeckung, Unterspannung", width=380)
    f.line(24, 96, 96, 58, w=2.4, color=ACCENT)
    f.callout(1, 60, 62)
    f.line(150, 96, 222, 58, w=2.4, color=ACCENT, dash="12 4")
    f.callout(2, 186, 62)
    f.path("M276 92 Q300 96 312 78 Q324 60 348 58", w=2.4, color=ACCENT)
    f.callout(3, 300, 66)
    f.set_art_height(112)
    f.legend([
        (1, "Unterdach – dicht gefügt, höchste Stufe"),
        (2, "Unterdeckung – Nähte gesichert"),
        (3, "Unterspannung – frei gespannt, einfachste"),
    ])
    return f.render()


@fig("lf08-l03")
def _():
    f = Fig("U-Wert aus den Widerständen der Schichten", width=380)
    f.rect(60, 44, 24, 76, sw=1.4); f.callout(1, 72, 132) if False else f.label(66, 136, "R₁", size=12)
    f.rect(84, 44, 96, 76, sw=1.4); f.label(120, 136, "R₂ = d/λ", size=12)
    f.rect(180, 44, 22, 76, sw=1.4); f.label(184, 136, "R₃", size=12)
    f.arrow(40, 82, 224, 82, w=1.6, color=ACCENT)
    f.label(30, 40, "warm", size=11); f.label(206, 40, "kalt", size=11)
    f.set_art_height(150)
    f.label(24, 168, "U = 1 / (Rsi + ΣR + Rse)", size=13, color=ACCENT)
    f.set_art_height(178)
    f.caption("Je kleiner der U-Wert, desto besser gedämmt (GEG).")
    return f.render()


@fig("lf08-l04")
def _():
    f = Fig("Diffusion durch die Fläche, Konvektion durch die Fuge", width=380)
    f.rect(28, 44, 130, 66, sw=1.6)
    for gx in range(48, 150, 20):
        f.arrow(gx, 108, gx, 92, w=1, color=CUR)
    f.label(28, 132, "Diffusion", size=12.5)
    f.label(28, 148, "langsam, überall verteilt", size=12)
    f.rect(222, 44, 130, 66, sw=1.6)
    f.line(282, 44, 282, 110, w=1, dash="4 3", color=ACCENT)
    f.line(292, 44, 292, 110, w=1, dash="4 3", color=ACCENT)
    f.arrow(287, 118, 287, 50, w=3, color=ACCENT)
    f.label(222, 132, "Konvektion", size=12.5, color=ACCENT)
    f.label(222, 148, "schnell, durch eine Fuge", size=12)
    f.set_art_height(158)
    f.caption("Durch eine Fuge kommt weit mehr Feuchte ins Bauteil als durch Diffusion.")
    return f.render()


# ======================================================================
# LF 09 — Schiefer & Faserzement
# ======================================================================
@fig("lf09-l01")
def _():
    f = Fig("Schieferung: Mineralien richten sich quer zum Druck aus", width=380)
    f.rect(90, 56, 150, 64, sw=1.6)
    for gy in range(66, 118, 10):
        f.line(90, gy, 240, gy, w=0.7)
    for gx in (120, 155, 190):
        f.arrow(gx, 34, gx, 54, w=1.8, color=ACCENT)
        f.arrow(gx, 142, gx, 122, w=1.8, color=ACCENT)
    f.label(248, 44, "Druck", size=12, color=ACCENT)
    f.set_art_height(154)
    f.legend([(None, "Schieferung – die Ebene, in der der Stein spaltet")])
    return f.render()


@fig("lf09-l02")
def _():
    f = Fig("Deckarten und ihre Regeldachneigungen", width=380)
    def tri(ox, ang_label, h):
        f.poly([(ox, 116), (ox + 84, 116), (ox + 84, 116 - h)], w=1.8, closed=True)
        f.label(ox + 42, 108, ang_label, size=12, color=ACCENT, anchor="middle")
    tri(20, "22°", 34); tri(148, "30°", 52); tri(276, "40°", 74)
    f.set_art_height(128)
    f.legend([
        (None, "Altdeutsche Doppeldeckung – ab 22°"),
        (None, "Spitzwinkel-Deckung – ab 30°"),
        (None, "Rechteck-Doppeldeckung – ab 40°"),
    ])
    return f.render()


@fig("lf09-l03")
def _():
    f = Fig("Schiefer auf Vollschalung: Nagelkopf und -länge", width=380)
    f.rect(40, 108, 250, 26, sw=1.6); f.label(48, 125, "Vollschalung ≥ 24 mm", size=11)
    f.line(40, 104, 290, 104, w=1.4, dash="6 3", color=ACCENT)
    f.rect(60, 86, 120, 16, sw=1.5); f.rect(140, 68, 120, 16, sw=1.5)
    f.line(96, 86, 96, 134, w=2.6, color=ACCENT)        # Nagelschaft
    f.line(86, 86, 106, 86, w=3.4, color=ACCENT)        # Kopf
    f.dim(86, 64, 106, 64, "Kopf ≥ 9 mm")
    f.dim(300, 86, 300, 134, "≥ 32 mm")
    f.label(196, 60, "Schiefer, überdeckt", size=11)
    f.set_art_height(150)
    f.caption("Ein zu kleiner Kopf rutscht durch den Stein.")
    return f.render()


@fig("lf09-l04")
def _():
    f = Fig("Lochung von der Rückseite und Gebindesteigung", width=380)
    f.rect(30, 48, 120, 28, sw=1.6)
    f.path("M72 48 L96 48 L88 76 L80 76 Z", w=1.6, color=ACCENT)   # Trichter öffnet zur Sichtseite
    f.arrow(84, 104, 84, 82, w=1.8, color=ACCENT)
    f.label(158, 56, "Sichtseite", size=11)
    f.label(158, 72, "Rückseite", size=11)
    f.poly([(220, 116), (284, 116), (284, 84)], w=1.6, closed=True)
    for k in range(3):
        f.line(230 + k * 14, 112, 244 + k * 14, 100 - k * 4, w=1.4, color=ACCENT)
    f.label(220, 138, "flaches Dach: steiles Gebinde", size=11)
    f.set_art_height(150)
    f.caption("Falsch herum gelocht steht der Kopf vor – das Gebinde reitet auf und bricht.", color=BAD)
    return f.render()


# ======================================================================
# LF 10 — Dachflächen abdichten
# ======================================================================
@fig("lf10-l01")
def _():
    f = Fig("Aufbau einer Bitumenbahn", width=380)
    f.rect(50, 48, 190, 14, sw=1.4)
    f.fillrect(50, 62, 190, 16, color=ACCENT, opacity="0.5"); f.rect(50, 62, 190, 16, sw=1.6, color=ACCENT)
    f.rect(50, 78, 190, 14, sw=1.4)
    f.leader(1, 240, 55, 300, 50)
    f.leader(2, 240, 70, 300, 76)
    f.leader(3, 240, 85, 300, 102)
    f.set_art_height(118)
    f.legend([
        (1, "Bitumen-Deckschicht"),
        (2, "Trägereinlage (Festigkeit)"),
        (3, "Bitumen-Deckschicht"),
    ])
    f.caption("APP → plastomer (hitzefest) · SBS → elastomer (kälteflexibel).", color=ACCENT)
    return f.render()


@fig("lf10-l02")
def _():
    f = Fig("Heißluftnaht bei Kunststoffbahnen", width=380)
    f.rect(40, 54, 160, 16, sw=1.6)
    f.rect(160, 70, 170, 16, sw=1.6)
    f.fillrect(160, 54, 40, 16, color=ACCENT, opacity="0.45")
    f.dim(160, 44, 200, 44, "Naht ≥ 2 cm")
    f.set_art_height(102)
    f.legend([
        (None, "PVC von Hand ca. 430–500 °C"),
        (None, "mit Automat ca. 480–580 °C"),
    ])
    f.caption("Erst ab +5 °C verarbeiten. Kunststoffbahnen werden geschweißt, nicht geflämmt.", color=BAD)
    return f.render()


@fig("lf10-l03")
def _():
    f = Fig("Warmdach mit Gefälledämmung und Anschluss", width=380)
    f.line(30, 150, 214, 150, w=1.6)
    f.path("M30 148 L214 148 L214 118 L30 138 Z", w=1.6)
    f.line(30, 138, 214, 118, w=2.4, color=ACCENT)      # Abdichtung mit Gefälle
    f.rect(214, 60, 34, 90, sw=1.6)                      # aufgehendes Bauteil
    f.path("M214 118 L206 118 L206 92", w=2.4, color=ACCENT)
    f.rect(200, 84, 12, 8, sw=1.4, color=ACCENT)        # Klemmschiene
    f.dim(188, 118, 188, 92, "≥ 15 cm")
    f.label(30, 30, "1 % Gefälle = 1 cm je Meter", size=12, color=ACCENT)
    f.set_art_height(164)
    f.caption("Aufbau von unten: Tragschale, Dampfsperre, Dämmung, Abdichtung.")
    return f.render()


@fig("lf10-l04")
def _():
    f = Fig("Dachbegrünung: extensiv oder intensiv", width=380)
    f.rect(30, 92, 130, 12, sw=1.6); f.rect(30, 78, 130, 14, sw=1.4)
    for gx in range(44, 150, 16):
        f.line(gx, 78, gx, 70, w=1.4, color=ACCENT)
    f.label(30, 126, "extensiv", size=12.5)
    f.rect(220, 92, 130, 12, sw=1.6); f.rect(220, 66, 130, 26, sw=1.4)
    f.circle(250, 76, 8, sw=1.4, color=ACCENT); f.line(290, 66, 290, 54, w=1.4, color=ACCENT)
    f.label(220, 126, "intensiv", size=12.5)
    f.set_art_height(138)
    f.legend([
        (None, "extensiv: Moos, Sedum – ca. 80–170 kg/m²"),
        (None, "intensiv: Stauden, Rasen – ab ca. 300 kg/m²"),
    ])
    f.caption("Immer zuerst die Statik prüfen und durchwurzelungsfest abdichten.", color=BAD)
    return f.render()


# ======================================================================
# LF 11 — Außenwandflächen bekleiden
# ======================================================================
@fig("lf11-l01")
def _():
    f = Fig("Aufbau der vorgehängten hinterlüfteten Fassade", width=380)
    f.rect(40, 40, 34, 120, sw=1.8); f.callout(1, 57, 100)
    f.fillrect(74, 40, 24, 120, color=ACCENT, opacity="0.14"); f.rect(74, 40, 24, 120, sw=1, dash="4 3")
    f.callout(2, 86, 100)
    f.rect(118, 40, 10, 120, sw=1.6); f.callout(3, 123, 100)   # Luftschicht (Spalt)
    f.rect(140, 40, 12, 120, sw=1.6, color=ACCENT); f.callout(4, 146, 100)
    f.rect(160, 40, 10, 120, sw=2, color=ACCENT); f.callout(5, 165, 100)
    f.set_art_height(172)
    f.legend([
        (1, "tragende Wand"), (2, "Wärmedämmung"),
        (3, "Hinterlüftung"), (4, "Unterkonstruktion"),
        (5, "Bekleidung"),
    ], cols=2)
    return f.render()


@fig("lf11-l02")
def _():
    f = Fig("Kamineffekt in der Hinterlüftung", width=380)
    f.rect(120, 40, 30, 130, sw=1.8)
    f.rect(168, 40, 12, 130, sw=2, color=ACCENT)
    f.arrow(174, 160, 174, 50, w=2.6, color=ACCENT)
    f.arrow(158, 168, 172, 162, w=1.6)
    f.arrow(174, 40, 190, 32, w=1.6)
    f.label(200, 34, "Abluft oben", size=12)
    f.label(200, 168, "Zuluft unten", size=12)
    f.dim(168, 182, 180, 182, "≥ 20 mm")
    f.set_art_height(196)
    f.caption("Zugebaute Öffnungen stoppen die Strömung, dann bleibt Feuchte stehen.", color=BAD)
    return f.render()


@fig("lf11-l03")
def _():
    f = Fig("Zweistufige Holzunterkonstruktion", width=380)
    f.rect(30, 40, 24, 130, sw=1.8); f.label(30, 30, "Wand", size=11)
    f.rect(66, 40, 14, 130, sw=1.8, color=ACCENT)       # Konterlattung senkrecht
    f.rect(150, 40, 14, 130, sw=1.8, color=ACCENT)
    for gy in (58, 96, 134):
        f.rect(66, gy, 120, 12, sw=1.6)                 # Traglattung waagerecht
    f.callout(1, 73, 180) if False else None
    f.set_art_height(180)
    f.legend([
        (None, "senkrechte Konterlattung – schafft den Luftraum"),
        (None, "waagerechte Traglattung – trägt die Bekleidung"),
    ])
    f.caption("In Rand- und Eckbereichen dichter verankern, korrosionsbeständig.")
    return f.render()


@fig("lf11-l04")
def _():
    f = Fig("Deckbild anreißen: Schnurabstand und Sprungmaß", width=380)
    for gy in (48, 80, 112, 144):
        f.line(30, gy, 250, gy, w=0.8, dash="5 4")
    rows = [(40, 118), (66, 86), (40, 54)]
    for (ox, y) in rows:
        for k in range(3):
            f.rect(ox + k * 52, y, 44, 28, sw=1.4)
    f.dim(258, 112, 258, 144, "Schnur-\nabstand") if False else f.dim(258, 112, 258, 144, "Abstand")
    f.dim(40, 158, 66, 158, "Sprungmaß")
    f.set_art_height(174)
    f.caption("Nur angerissen laufen die Fugen über die ganze Fassade in Flucht.")
    return f.render()


# ======================================================================
# LF 12 — Geneigte Dächer mit Metallen decken
# ======================================================================
@fig("lf12-l01")
def _():
    f = Fig("Doppelstehfalz und Leistendeckung im Querschnitt", width=380)
    f.path("M24 96 L64 96 L64 60 L76 60 L76 72 L68 72 L68 96 L120 96", w=2)
    f.label(24, 120, "Doppelstehfalz", size=12.5)
    f.label(24, 136, "ab ca. 3° Dachneigung", size=12, color=ACCENT)
    f.path("M212 96 L252 96 L252 66 L288 66 L288 96 L328 96", w=2)
    f.rect(256, 58, 24, 12, sw=1.6, color=ACCENT)
    f.label(212, 120, "Leistendeckung", size=12.5)
    f.label(212, 136, "Scharen an einer Leiste", size=12)
    f.set_art_height(146)
    f.caption("Befestigt wird unsichtbar über Hafte, die im Falz liegen.")
    return f.render()


@fig("lf12-l02")
def _():
    f = Fig("Festhafte und Schiebehafte auf der Schar", width=380)
    f.line(30, 58, 350, 58, w=2.6)
    f.rect(30, 82, 320, 16, sw=1.4); f.label(38, 94, "Unterkonstruktion", size=11)
    f.path("M188 82 L188 58 L200 58", w=2.6, color=ACCENT); f.callout(1, 176, 116)
    f.path("M78 82 L78 58 L90 58", w=2.2); f.arrow(70, 44, 52, 44, w=1.2)
    f.path("M282 82 L282 58 L294 58", w=2.2); f.arrow(292, 44, 310, 44, w=1.2)
    f.callout(2, 78, 116); f.callout(2, 282, 116)
    f.set_art_height(132)
    f.legend([
        (1, "Festhaft – starr, der Fixpunkt"),
        (2, "Schiebehaft – lässt die Schar wandern"),
    ])
    f.caption("Scharlänge bis 10 m, mit Schwerlasthaften bis 16 m (max. 30°).")
    return f.render()


@fig("lf12-l03")
def _():
    f = Fig("Strukturierte Trennlage schafft Luftraum gegen Weißrost", width=380)
    f.line(30, 52, 350, 52, w=2.6); f.label(30, 44, "Metalldeckung", size=11)
    wave = "M34 66 "
    for i in range(34, 346, 8):
        wave += f"Q{i+4} 56 {i+8} 66 "
    f.path(wave, w=1.5, color=ACCENT)
    f.rect(30, 70, 320, 16, sw=1.4); f.label(38, 82, "Schalung", size=11)
    f.set_art_height(98)
    f.legend([(None, "Trennlage – kapillarbrechender Luftraum")])
    f.caption("Kondensat läuft ab und trocknet. Bleibt es stehen, entsteht Weißrost.", color=BAD)
    return f.render()


@fig("lf12-l04")
def _():
    f = Fig("Die vier Grundtechniken am Blech", width=380)
    f.path("M28 58 L68 58 L68 40", w=2.4); f.label(24, 82, "Kanten", size=12.5)
    f.path("M120 58 L152 58 L152 48 L144 48 L144 56 L160 56", w=2.4); f.label(116, 82, "Falzen", size=12.5)
    f.path("M28 136 L60 136 A6 6 0 1 0 60 124", w=2.4); f.label(24, 160, "Bördeln", size=12.5)
    f.path("M212 136 Q232 122 252 136 Q272 150 292 136", w=2.4); f.label(208, 160, "Schweifen", size=12.5)
    f.set_art_height(170)
    f.legend([(None, "Abwicklung = Deckbreite plus alle Zugaben")])
    return f.render()


# ======================================================================
# LF 13a — Details an geneigten Dächern
# ======================================================================
@fig("lf13a-l01")
def _():
    f = Fig("Grat und Kehle: Wasser läuft auseinander oder zusammen", width=380)
    f.poly([(24, 120), (84, 58), (144, 120)], w=2)
    f.line(84, 58, 84, 120, w=2.6, color=ACCENT)
    f.arrow(78, 80, 56, 100, w=1.3); f.arrow(90, 80, 112, 100, w=1.3)
    f.label(24, 142, "Grat", size=12.5, color=ACCENT)
    f.label(24, 158, "Wasser läuft auseinander", size=12)
    f.poly([(214, 58), (274, 120), (334, 58)], w=2)
    f.line(274, 120, 274, 58, w=2.6, color=ACCENT)
    f.arrow(238, 84, 262, 108, w=1.3); f.arrow(310, 84, 286, 108, w=1.3)
    f.label(214, 142, "Kehle", size=12.5, color=ACCENT)
    f.label(214, 158, "Wasser von zwei Flächen", size=12, color=BAD)
    f.set_art_height(168)
    f.caption("Die Kehle ist die am stärksten beanspruchte Stelle des geneigten Daches.")
    return f.render()


@fig("lf13a-l02")
def _():
    f = Fig("Offene und verdeckte Kehle, flachere Kehlneigung", width=380)
    f.poly([(24, 104), (74, 62), (124, 104)], w=1.8)
    f.path("M62 104 L74 80 L86 104", w=2.6, color=ACCENT)
    f.label(24, 128, "offene Kehle", size=12)
    f.poly([(214, 104), (264, 62), (314, 104)], w=1.8)
    f.path("M252 104 L264 80 L276 104", w=1.4, dash="3 3")
    f.label(214, 128, "verdeckte Kehle", size=12)
    f.set_art_height(140)
    f.legend([
        (None, "offen: Metallrinne bleibt sichtbar"),
        (None, "Kehle ist immer flacher als die Dachflächen"),
    ])
    return f.render()


@fig("lf13a-l03")
def _():
    f = Fig("Schornsteinanschluss mit Rückenrinne (Draufsicht)", width=380)
    f.rect(150, 70, 80, 54, sw=1.8); f.label(190, 100, "Schornstein", size=11, anchor="middle")
    f.line(142, 70, 142, 124, w=1.6); f.line(238, 70, 238, 124, w=1.6)
    f.path("M142 64 L190 42 L238 64", w=2.6, color=ACCENT)
    f.line(142, 130, 238, 130, w=1.6)
    f.arrow(190, 30, 190, 44, w=1.4)     # First oben, Wasser kommt von oben
    f.callout(1, 190, 30) if False else None
    f.label(248, 48, "Rückenrinne", size=12, color=ACCENT)
    f.set_art_height(140)
    f.legend([(None, "Die Rückenrinne führt das Wasser bergseitig herum")])
    f.caption("Auch die Unterdeckbahn muss um die Durchdringung geführt werden.")
    return f.render()


@fig("lf13a-l04")
def _():
    f = Fig("Gaubenformen", width=380)
    f.path("M24 96 L24 68 L96 52 L96 96", w=1.8); f.label(24, 118, "Schleppgaube", size=12)
    f.path("M140 96 L140 70 L176 46 L212 70 L212 96", w=1.8); f.label(150, 118, "Satteldach", size=12)
    f.path("M248 96 Q266 96 282 72 Q298 50 314 72 Q330 96 348 96", w=2.2, color=ACCENT)
    f.label(250, 118, "Fledermaus", size=12, color=ACCENT)
    f.set_art_height(130)
    f.caption("Die Fledermausgaube ist am anspruchsvollsten – nach ZVDH erhöhte Anforderung.", color=ACCENT)
    return f.render()


# ======================================================================
# LF 14 — Abdichtungsdetails und Bauwerksabdichtung
# ======================================================================
@fig("lf14-l01")
def _():
    f = Fig("Anschlusshöhe wird ab der wasserführenden Ebene gemessen", width=380)
    f.line(24, 150, 214, 150, w=1.6)
    f.path("M24 144 L204 144 L204 84", w=2.4, color=ACCENT)
    f.rect(198, 76, 14, 8, sw=1.4, color=ACCENT)
    f.rect(214, 50, 34, 100, sw=1.6)
    f.line(24, 132, 200, 132, w=1, dash="5 3")
    for cx in (60, 84, 108, 132, 156):
        f.circle(cx, 137, 3, sw=1, color=CUR)
    f.dim(170, 132, 170, 84, "≥ 15 cm")
    f.label(252, 82, "Klemmschiene", size=11, color=ACCENT)
    f.set_art_height(164)
    f.caption("Gemessen ab Oberkante Kies (wasserführende Ebene), nicht ab der Abdichtung.", color=ACCENT)
    return f.render()


@fig("lf14-l02")
def _():
    f = Fig("Gully mit Klemmflansch und Rohr mit Manschette", width=380)
    f.line(24, 70, 150, 70, w=1.6)
    f.path("M24 64 L60 64 L64 96 L96 96 L100 64 L150 64", w=1.6)
    f.fillrect(52, 58, 16, 6, color=ACCENT, opacity="0.6"); f.fillrect(96, 58, 16, 6, color=ACCENT, opacity="0.6")
    f.label(24, 120, "Gully – Bahn im Flansch", size=12)
    f.rect(250, 24, 26, 46, sw=1.6)
    f.line(196, 70, 322, 70, w=1.6)
    f.path("M210 64 L242 64 L246 44 L246 36", w=2.2, color=ACCENT)
    f.path("M312 64 L280 64 L276 44 L276 36", w=2.2, color=ACCENT)
    f.label(210, 120, "Rohr – Manschette", size=12, color=ACCENT)
    f.set_art_height(132)
    f.caption("Für verwinkelte Stellen: Flüssigkunststoff, Vlies mind. 5 cm überlappt.")
    return f.render()


@fig("lf14-l03")
def _():
    f = Fig("Nicht drückendes und drückendes Wasser", width=380)
    f.rect(40, 56, 70, 80, sw=1.8)
    for gy in (74, 98, 122):
        f.arrow(30, gy - 8, 30, gy, w=1.1); f.arrow(120, gy - 8, 120, gy, w=1.1)
    f.label(40, 158, "nicht drückend", size=12)
    f.rect(240, 56, 70, 80, sw=1.8)
    f.line(216, 72, 334, 72, w=1.6, color=ACCENT)
    for gy in (88, 108, 128):
        f.arrow(224, gy, 238, gy, w=1.4, color=ACCENT); f.arrow(326, gy, 312, gy, w=1.4, color=ACCENT)
    f.label(240, 158, "drückend", size=12, color=ACCENT)
    f.set_art_height(168)
    f.legend([
        (None, "nicht drückend: Wasser versickert, kein Druck"),
        (None, "drückend: Grundwasser steht an, Druck steigt"),
    ])
    return f.render()


@fig("lf14-l04")
def _():
    f = Fig("Schwarze und weiße Wanne", width=380)
    f.path("M40 50 L40 130 L120 130 L120 50", w=1.8)
    f.path("M32 50 L32 138 L128 138 L128 50", w=3, color=ACCENT)
    f.label(24, 160, "schwarze Wanne", size=12.5)
    f.path("M232 50 L232 130 L312 130 L312 50", w=6)
    f.line(272, 126, 272, 134, w=2.4, color=ACCENT)
    f.label(224, 160, "weiße Wanne", size=12.5, color=ACCENT)
    f.set_art_height(170)
    f.legend([
        (None, "schwarz: Abdichtungsbahnen von außen"),
        (None, "weiß: WU-Beton, dichte Fugen, keine Haut"),
    ])
    return f.render()


# ======================================================================
# LF 15 — An- und Abschlüsse an Wänden
# ======================================================================
@fig("lf15-l01")
def _():
    f = Fig("Unterer, seitlicher und oberer Abschluss", width=380)
    f.rect(150, 30, 30, 150, sw=1.8)
    f.rect(196, 30, 12, 150, sw=2, color=ACCENT)      # Bekleidung
    f.path("M190 26 L214 26", w=2.4)                  # Abdeckblech
    f.rect(194, 178, 16, 7, sw=1.4)                   # Lüftungsprofil
    f.arrow(202, 44, 202, 60, w=1.4, color=ACCENT)    # Abluft
    f.arrow(202, 172, 202, 156, w=1.4, color=ACCENT)  # Zuluft
    f.callout(1, 240, 38); f.leader(1, 208, 32, 240, 38) if False else None
    f.callout(2, 240, 100)
    f.callout(3, 240, 176)
    f.set_art_height(196)
    f.legend([
        (1, "oben: Abdeckblech, Abluft"),
        (2, "seitlich: Profil lässt Bewegung zu"),
        (3, "unten: Lüftungsprofil, Zuluft"),
    ])
    return f.render()


@fig("lf15-l02")
def _():
    f = Fig("Außenecke und Innenecke im Grundriss", width=380)
    f.path("M24 140 L24 60 L104 60", w=1.8)
    f.path("M14 140 L14 50 L104 50", w=2.2, color=ACCENT)
    f.label(30, 100, "Außenecke", size=12)
    f.path("M214 140 L214 60 L294 60", w=1.8)
    f.path("M224 140 L224 70 L294 70", w=2.2, color=ACCENT)
    f.arrow(252, 96, 232, 82, w=1.3, color=BAD)
    f.label(240, 130, "Innenecke", size=12)
    f.set_art_height(150)
    f.legend([(None, "Die Luftschicht muss um beide Ecken durchgehen")])
    f.caption("Innenecke: Wasser von zwei Flächen, wie eine stehende Kehle.")
    return f.render()


@fig("lf15-l03")
def _():
    f = Fig("Fensterbank mit Gefälle, Aufkantung und Tropfkante", width=380)
    f.rect(120, 40, 120, 56, sw=1.6); f.label(180, 72, "Fenster", size=11, anchor="middle")
    f.path("M108 100 L250 112 L250 124", w=2.6, color=ACCENT)   # Bank mit Gefälle + Tropfkante
    f.line(120, 96, 120, 100, w=2.6, color=ACCENT)              # Aufkantung
    f.leader(1, 122, 100, 40, 96) if False else None
    f.callout(1, 40, 96); f.callout(2, 250, 132); f.callout(3, 180, 116)
    f.set_art_height(150)
    f.legend([
        (1, "Aufkantung"), (2, "Tropfkante"),
        (3, "Gefälle nach außen"),
    ], cols=2)
    f.caption("Ohne Tropfkante läuft das Wasser unten zurück zur Fassade.")
    return f.render()


@fig("lf15-l04")
def _():
    f = Fig("Was in eine Detailskizze gehört", width=380)
    f.rect(30, 40, 40, 96, sw=1.6); f.rect(70, 40, 26, 96, sw=1, dash="3 3")
    f.line(112, 40, 112, 136, w=2, color=ACCENT)
    f.dim(126, 40, 126, 136, "Maß")
    f.set_art_height(150)
    f.legend([
        (None, "Schichtenfolge von innen nach außen"),
        (None, "Bauteilnamen und maßgebende Maße"),
        (None, "die wasserführende Ebene"),
    ])
    f.caption("Maßstab meist 1:5 oder 1:10. Am Ende mit dem Finger als Tropfen abfahren.")
    return f.render()


# ======================================================================
# LF 16 — Energiesammler, Blitzschutz, Einbauteile
# ======================================================================
@fig("lf16-l01")
def _():
    f = Fig("Photovoltaik erzeugt Strom, Solarthermie Wärme", width=380)
    f.rect(24, 44, 80, 34, sw=2, color=ACCENT)
    f.arrow(104, 61, 138, 61, w=1.5, color=ACCENT)
    f.boxlabel(140, 44, 40, 34, "~", size=13)
    f.label(24, 100, "Photovoltaik → Strom", size=12, color=ACCENT)
    f.rect(210, 44, 80, 34, sw=2)
    f.arrow(290, 61, 320, 61, w=1.5, color=ACCENT)
    f.circle(336, 61, 14, sw=1.6)
    f.label(210, 100, "Solarthermie → Wärme", size=12)
    f.set_art_height(112)
    f.legend([
        (None, "Aufdach: über der Deckung aufgeständert"),
        (None, "Indach: Module sind die wasserführende Ebene"),
    ])
    return f.render()


@fig("lf16-l02")
def _():
    f = Fig("Ein PV-Modul steht unter Spannung, sobald Licht fällt", width=380)
    f.rect(40, 56, 96, 46, sw=2.4, color=ACCENT)
    for (sx, sy) in ((60, 34), (88, 30), (116, 34)):
        f.arrow(sx, sy, sx - 6, 52, w=1.3)
    f.path("M150 78 L166 78 M158 70 L152 80 L160 80 L154 90", w=2.4, color=BAD)
    f.label(178, 74, "Spannung liegt an,", size=12.5, color=BAD)
    f.label(178, 92, "auch bei Bewölkung", size=12.5, color=BAD)
    f.set_art_height(116)
    f.legend([
        (None, "Du: Unterkonstruktion, Durchdringung, Befestigung"),
        (None, "Anschluss nur durch die Elektrofachkraft"),
    ])
    return f.render()


@fig("lf16-l03")
def _():
    f = Fig("Äußerer Blitzschutz: Fangeinrichtung, Ableitung, Erdung", width=380)
    f.poly([(70, 120), (160, 66), (250, 120)], w=1.8)
    f.line(160, 66, 160, 34, w=2.6, color=ACCENT); f.circle(160, 31, 3, fill=ACCENT, color=ACCENT)
    f.line(70, 120, 70, 160, w=2.2, color=ACCENT); f.line(250, 120, 250, 160, w=2.2, color=ACCENT)
    f.line(50, 160, 270, 160, w=1.6)
    f.path("M66 160 L66 176 L120 176", w=2.2, color=ACCENT)
    f.path("M254 160 L254 176 L200 176", w=2.2, color=ACCENT)
    f.callout(1, 160, 31) if False else None
    f.label(176, 40, "Fangstange", size=11, color=ACCENT)
    f.set_art_height(190)
    f.legend([(None, "PV liegt im Schutzbereich, mit Trennungsabstand s")])
    return f.render()


@fig("lf16-l04")
def _():
    f = Fig("Windlast bei Aufständerung, Lastabtrag beim Schneefang", width=380)
    f.line(24, 96, 150, 96, w=1.6)
    f.path("M44 96 L44 80 L96 62 L96 96", w=1.8)
    f.arrow(20, 60, 40, 68, w=1.6, color=ACCENT); f.arrow(20, 46, 40, 56, w=1.6, color=ACCENT)
    f.label(24, 122, "steiler = mehr Windlast", size=12, color=ACCENT)
    f.line(200, 118, 320, 62, w=1.8)
    f.rect(232, 92, 18, 14, sw=1.4); f.line(241, 92, 241, 78, w=2.4, color=ACCENT); f.line(230, 78, 252, 78, w=2.4, color=ACCENT)
    f.label(200, 142, "Schneefang", size=12, color=ACCENT)
    f.set_art_height(152)
    f.caption("Der Schneefang muss die Last in die Tragkonstruktion einleiten, nicht in die Latte.")
    return f.render()


# ======================================================================
# LF 17 — Instandhaltung
# ======================================================================
@fig("lf17-l01")
def _():
    f = Fig("Die vier Maßnahmen der Instandhaltung", width=380)
    f.boxlabel(120, 24, 140, 28, "Instandhaltung", size=13, accent=True)
    f.line(190, 52, 190, 66, w=1.2)
    xs = [46, 142, 238, 334]
    f.line(46, 66, 334, 66, w=1.2)
    for x in xs:
        f.line(x, 66, x, 80, w=1.2)
    f.boxlabel(10, 80, 72, 40, "Wartung", size=11)
    f.boxlabel(106, 80, 72, 40, "Inspektion", size=11)
    f.boxlabel(202, 80, 72, 40, ["Instand-", "setzung"], size=11)
    f.boxlabel(298, 80, 72, 40, ["Verbes-", "serung"], size=11)
    f.set_art_height(132)
    f.caption("Die Inspektion stellt nur fest — repariert wird erst bei der Instandsetzung.")
    return f.render()


@fig("lf17-l02")
def _():
    f = Fig("Der Feuchtefleck liegt nicht unter der Eintrittsstelle", width=380)
    f.line(30, 50, 320, 50, w=1.8)
    f.line(228, 44, 240, 44, w=3, color=BAD); f.label(248, 42, "Eintritt", size=11, color=BAD)
    f.line(30, 78, 320, 78, w=1.4, dash="5 3"); f.label(30, 72, "Dampfsperre", size=11)
    f.path("M232 52 L232 78 L120 84 L114 96", w=1.6, color=ACCENT)
    f.circle(112, 104, 10, sw=1.4, color=ACCENT)
    f.label(60, 128, "Feuchtefleck", size=12, color=ACCENT)
    f.set_art_height(140)
    f.caption("Das Wasser läuft auf der Sperre weiter – deshalb oberhalb suchen.")
    return f.render()


@fig("lf17-l03")
def _():
    f = Fig("Reparatur, Teilsanierung, Komplettsanierung", width=380)
    f.rect(24, 44, 88, 50, sw=1.4); f.fillrect(56, 62, 18, 14, color=ACCENT, opacity="0.6")
    f.label(24, 114, "Reparatur", size=12)
    f.rect(146, 44, 88, 50, sw=1.4); f.fillrect(146, 44, 88, 24, color=ACCENT, opacity="0.4")
    f.label(146, 114, "Teilsanierung", size=12)
    f.rect(268, 44, 88, 50, sw=1.4); f.fillrect(268, 44, 88, 50, color=ACCENT, opacity="0.4")
    f.label(268, 114, "Komplett", size=12)
    f.set_art_height(126)
    f.caption("Immer wieder flicken kostet am Ende mehr als einmal sanieren.", color=BAD)
    return f.render()


@fig("lf17-l04")
def _():
    f = Fig("Nach dem Sturm: Reihenfolge und Asbest", width=380)
    f.boxlabel(24, 40, 96, 30, "1 absperren", size=12, accent=True)
    f.arrow(120, 55, 140, 55, w=1.4)
    f.boxlabel(142, 40, 96, 30, "2 sichern", size=12)
    f.arrow(238, 55, 258, 55, w=1.4)
    f.boxlabel(260, 40, 96, 30, "3 abdichten", size=12)
    f.set_art_height(84)
    f.legend([
        (None, "Altes Faserzement kann Asbest enthalten"),
        (None, "Verboten: Hochdruck, Schleifen, Bohren, Bürsten", BAD),
    ])
    f.caption("Erst danach dokumentieren und reparieren.")
    return f.render()


# ======================================================================
# WiSo — Wirtschafts- und Sozialkunde
# ======================================================================
@fig("wiso-l01")
def _():
    f = Fig("Probezeit und Kündigung im Ausbildungsverhältnis", width=380)
    f.line(24, 60, 356, 60, w=2)
    f.line(24, 52, 24, 68, w=2); f.line(356, 52, 356, 68, w=2)
    f.line(104, 52, 104, 68, w=2.4, color=ACCENT)
    f.fillrect(24, 52, 80, 16, color=ACCENT, opacity="0.35")
    f.label(24, 44, "Probezeit 1–4 Mon.", size=11, color=ACCENT)
    f.label(356, 44, "Ausbildung, 3 Jahre", size=11, anchor="end")
    f.set_art_height(80)
    f.legend([
        (None, "in der Probezeit: beide fristlos, ohne Grund"),
        (None, "danach: Betrieb nur aus wichtigem Grund"),
        (None, "du zusätzlich mit 4 Wochen Frist"),
    ])
    f.caption("Ohne Eintragung bei der Handwerkskammer keine Zulassung zur Prüfung.", color=ACCENT)
    return f.render()


@fig("wiso-l02")
def _():
    f = Fig("Pflichten von Auszubildendem und Betrieb", width=380)
    f.rect(20, 40, 160, 108, sw=1.8, color=ACCENT)
    f.label(30, 60, "Du musst", size=12.5, color=ACCENT)
    for i, t in enumerate(["lernen, dich bemühen", "zur Berufsschule gehen",
                           "Berichtsheft führen", "Werkzeug pflegen"]):
        f.label(30, 80 + i * 16, "· " + t, size=11.5)
    f.rect(200, 40, 160, 108, sw=1.8)
    f.label(210, 60, "Der Betrieb muss", size=12.5)
    for i, t in enumerate(["ausbilden bis zum Ziel", "Mittel kostenlos stellen",
                           "für Schule freistellen", "Vergütung zahlen"]):
        f.label(210, 80 + i * 16, "· " + t, size=11.5)
    f.set_art_height(158)
    f.caption("Unter 18: höchstens 8 Stunden am Tag, 40 in der Woche.", color=ACCENT)
    return f.render()


@fig("wiso-l03")
def _():
    f = Fig("Tarifpartner und die Sozialkasse SOKA-DACH", width=380)
    f.boxlabel(20, 26, 130, 28, "Gewerkschaft", size=12)
    f.boxlabel(230, 26, 130, 28, "Arbeitgeber", size=12)
    f.arrow(150, 40, 230, 40, w=1.5, color=ACCENT); f.label(160, 32, "Tarif", size=10, color=ACCENT)
    f.boxlabel(110, 70, 160, 26, "SOKA-DACH", size=12.5, accent=True)
    f.set_art_height(108)
    f.legend([
        (None, "Urlaubskasse: Ansprüche bleiben beim Wechsel"),
        (None, "Ausbildungsförderung und Zusatzrente"),
    ])
    f.caption("Günstigkeitsprinzip: Der Arbeitsvertrag darf besser sein als der Tarif.")
    return f.render()


@fig("wiso-l04")
def _():
    f = Fig("Wer trägt die Beiträge der Sozialversicherung", width=380)
    zweige = ["Krankenversicherung", "Pflegeversicherung", "Rentenversicherung",
              "Arbeitslosenversicherung"]
    y = 34
    for t in zweige:
        f.rect(20, y, 150, 16, sw=1.2)
        f.fillrect(20, y, 75, 16, color=CUR, opacity="0.28")
        f.label(180, y + 12, t, size=11)
        y += 22
    f.rect(20, y, 150, 16, sw=1.6, color=ACCENT); f.fillrect(20, y, 150, 16, color=ACCENT, opacity="0.5")
    f.label(180, y + 12, "Unfallversicherung", size=11, color=ACCENT)
    f.set_art_height(y + 30)
    f.legend([
        (None, "links Arbeitnehmer · rechts Arbeitgeber"),
        (None, "Unfallversicherung: allein der Arbeitgeber", ACCENT),
    ])
    return f.render()


@fig("wiso-l05")
def _():
    f = Fig("Die Abnahme ist der Wendepunkt im Werkvertrag", width=380)
    f.line(24, 60, 356, 60, w=2)
    f.line(190, 44, 190, 76, w=2.8, color=ACCENT)
    f.label(190, 36, "Abnahme", size=13, color=ACCENT, anchor="middle")
    f.label(60, 96, "vorher", size=12, anchor="middle")
    f.label(300, 96, "nachher", size=12, anchor="middle")
    f.set_art_height(110)
    f.legend([
        (None, "vorher: Betrieb muss Mangelfreiheit beweisen"),
        (None, "nachher: Verjährung läuft, Beweislast kehrt um"),
    ])
    f.caption("Mängelansprüche bei Bauwerken: BGB 5 Jahre, VOB/B 4 Jahre.", color=ACCENT)
    return f.render()


@fig("wiso-l06")
def _():
    f = Fig("Die Meisterprüfung in vier Teilen", width=380)
    f.boxlabel(16, 40, 78, 44, ["Teil I", "Fachpraxis"], size=11)
    f.boxlabel(102, 40, 78, 44, ["Teil II", "Fachtheorie"], size=11)
    f.boxlabel(188, 40, 78, 44, ["Teil III", "Wirtschaft"], size=11)
    f.boxlabel(274, 40, 90, 44, ["Teil IV", "Pädagogik"], size=11, accent=True)
    f.label(274, 100, "= Ausbildereignung", size=11, color=ACCENT)
    f.set_art_height(112)
    f.legend([(None, "Geselle → Vorarbeiter → Werkpolier → Meister")])
    f.caption("Mit Meisterbrief geht auch ein Studium ohne Abitur.")
    return f.render()


def build(only=None):
    changed = 0
    by_lf = {}
    for fid in FIGS:
        by_lf.setdefault(fid.rsplit("-l", 1)[0], []).append(fid)
    for lf, ids in by_lf.items():
        if only and lf not in only:
            continue
        p = pathlib.Path(f"content/{lf}/lektionen.json")
        data = json.loads(p.read_text())
        for lekt in data:
            if lekt["id"] in FIGS:
                lekt["svg"] = FIGS[lekt["id"]]()
                changed += 1
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"{changed} Zeichnungen gebaut.")


if __name__ == "__main__":
    build(set(sys.argv[1:]) or None)
