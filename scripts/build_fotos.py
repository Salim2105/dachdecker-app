#!/usr/bin/env python3
"""Baut die Foto-Plätze (Ausschnitt-Skizzen als Muster) in die Lektionen ein.

Jede Skizze zeigt, wie das eigene Baustellenfoto aufgenommen werden soll. Sie
liegt als `musterSvg` im Foto-Platz und wird von der App angezeigt, solange kein
echtes Foto (`datei`) hinterlegt ist. Aufruf: python3 scripts/build_fotos.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

# gemeinsame Sucher-Ecken (viewBox 0 0 300 180)
TICKS = (
    "<g fill='none' stroke='currentColor' stroke-opacity='.4' stroke-width='2' "
    "stroke-linecap='round'><path d='M10 24V10H24'/><path d='M276 10H290V24'/>"
    "<path d='M10 156V170H24'/><path d='M276 170H290V156'/></g>"
)


def svg(aria: str, body: str) -> str:
    return (
        "<svg viewBox='0 0 300 180' width='100%' style='max-width:340px;height:auto' "
        "xmlns='http://www.w3.org/2000/svg' font-family='system-ui, sans-serif' "
        f"role='img' aria-label='{aria}'>{TICKS}{body}</svg>"
    )


# --- die zwölf Szenen -------------------------------------------------------
SZENE = {
    "schiefer_flaeche": (
        "<g fill='none' stroke='currentColor' stroke-opacity='.62' stroke-width='1.6' stroke-linecap='round'>"
        "<line x1='26' y1='150' x2='274' y2='150'/><line x1='38' y1='123' x2='262' y2='123'/>"
        "<line x1='50' y1='98' x2='250' y2='98'/><line x1='62' y1='75' x2='238' y2='75'/>"
        "<line x1='80' y1='150' x2='80' y2='137'/><line x1='140' y1='150' x2='140' y2='137'/><line x1='205' y1='150' x2='205' y2='137'/>"
        "<line x1='110' y1='123' x2='110' y2='111'/><line x1='175' y1='123' x2='175' y2='111'/><line x1='235' y1='123' x2='235' y2='111'/>"
        "<line x1='95' y1='98' x2='95' y2='87'/><line x1='150' y1='98' x2='150' y2='87'/><line x1='210' y1='98' x2='210' y2='87'/>"
        "<line x1='120' y1='75' x2='120' y2='65'/><line x1='180' y1='75' x2='180' y2='65'/></g>"
        "<path d='M60 152L150 72' fill='none' stroke='#c07d4a' stroke-width='2.4' stroke-dasharray='2 5' stroke-linecap='round'/>"
        "<g fill='none' stroke='#c07d4a' stroke-width='2' stroke-linecap='round'><path d='M255 150V123'/><path d='M251 128l4-5 4 5'/><path d='M251 145l4 5 4-5'/></g>"
        "<path d='M22 168q10 -6 20 -16' fill='none' stroke='#c07d4a' stroke-width='1.8'/><path d='M40 149l3 3 -6 1z' fill='#c07d4a'/>"
    ),
    "einzelschiefer": (
        "<path d='M78 40h70a4 4 0 0 1 4 4v96l-39 12l-39-12V44a4 4 0 0 1 4-4z' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='1.8'/>"
        "<circle cx='113' cy='62' r='5.5' fill='none' stroke='#c07d4a' stroke-width='2.4'/>"
        "<g fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M188 150l14-26l-8-6l16-24l-8-6l14-22'/></g>"
        "<text x='207' y='120' font-size='10' fill='currentColor' fill-opacity='.55' transform='rotate(-58 207 120)'>cm</text>"
    ),
    "rinnenhalter": (
        "<path d='M70 40l40 -18' fill='none' stroke='currentColor' stroke-opacity='.55' stroke-width='6' stroke-linecap='round'/>"
        "<path d='M74 78h48a26 26 0 0 0 26 26' fill='none' stroke='#c07d4a' stroke-width='2.6' stroke-linecap='round'/>"
        "<path d='M148 82a22 22 0 1 0 44 0' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4'/>"
        "<line x1='148' y1='82' x2='148' y2='70' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4' stroke-linecap='round'/>"
        "<line x1='192' y1='82' x2='192' y2='70' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4' stroke-linecap='round'/>"
        "<path d='M96 132h96' fill='none' stroke='#c07d4a' stroke-width='1.8' stroke-dasharray='2 5'/><path d='M192 132l-7 -3v6z' fill='#c07d4a'/>"
    ),
    "rinnenstutzen": (
        "<path d='M40 60v18a20 20 0 0 0 20 20h55' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4'/>"
        "<path d='M260 60v18a20 20 0 0 1 -20 20h-55' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4'/>"
        "<line x1='40' y1='60' x2='260' y2='60' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4'/>"
        "<path d='M128 98l-6 26h56l-6 -26z' fill='none' stroke='#c07d4a' stroke-width='2.6' stroke-linejoin='round'/>"
        "<path d='M128 124l4 34h36l4 -34' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4'/>"
    ),
    "wandanschluss": (
        "<path d='M40 30v120h230' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.6'/>"
        "<g stroke='currentColor' stroke-opacity='.3' stroke-width='1.3'><path d='M28 50l12 -12'/><path d='M28 74l12 -12'/><path d='M28 98l12 -12'/><path d='M28 122l12 -12'/></g>"
        "<path d='M170 150h-120q-8 0 -8 -8v-72' fill='none' stroke='#c07d4a' stroke-width='2.8' stroke-linecap='round'/>"
        "<g fill='none' stroke='currentColor' stroke-opacity='.75' stroke-width='1.6'><path d='M92 150V70'/><path d='M88 146l4 4 4 -4'/><path d='M88 74l4 -4 4 4'/></g>"
        "<path d='M100 118l16 -22l-8 -4l14 -18' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='1.8' stroke-linejoin='round'/>"
    ),
    "gully": (
        "<path d='M150 52l88 46l-88 46l-88 -46z' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.2' stroke-linejoin='round'/>"
        "<ellipse cx='150' cy='98' rx='30' ry='15' fill='none' stroke='#c07d4a' stroke-width='2.6'/>"
        "<ellipse cx='150' cy='98' rx='13' ry='6.5' fill='none' stroke='#c07d4a' stroke-opacity='.6' stroke-width='2'/>"
        "<path d='M150 34v12' stroke='currentColor' stroke-opacity='.7' stroke-width='1.8'/>"
        "<path d='M146 42l4 5 4 -5' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='1.8'/>"
    ),
    "schweissnaht": (
        "<path d='M40 118h220' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4'/>"
        "<path d='M120 118V96h140' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4' stroke-linejoin='round'/>"
        "<path d='M118 100q6 4 14 0t14 0t14 0t14 0t14 0t14 0t14 0' fill='none' stroke='#c07d4a' stroke-width='2.8' stroke-linecap='round'/>"
        "<g fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2' stroke-linecap='round'><path d='M60 60l34 30'/><path d='M52 54l14 -6l4 14z'/></g>"
        "<path d='M96 92q6 -8 0 -16' fill='none' stroke='#c07d4a' stroke-width='1.8'/>"
    ),
    "doppelstehfalz": (
        "<g fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2' stroke-linecap='round'>"
        "<path d='M64 40v112'/><path d='M70 40v112'/><path d='M60 44h10'/>"
        "<path d='M112 40v112'/><path d='M118 40v112'/><path d='M108 44h10'/>"
        "<path d='M208 40v112'/><path d='M214 40v112'/><path d='M204 44h10'/>"
        "<path d='M256 40v112'/><path d='M262 40v112'/><path d='M252 44h10'/></g>"
        "<g fill='none' stroke='#c07d4a' stroke-width='2.4' stroke-linecap='round'><path d='M160 40v112'/><path d='M166 40v112'/><path d='M156 44h10'/></g>"
    ),
    "hafte": (
        "<rect x='40' y='104' width='220' height='42' rx='3' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.2'/>"
        "<g stroke='currentColor' stroke-opacity='.3' stroke-width='1.2'><path d='M40 118h220'/><path d='M40 132h220'/></g>"
        "<path d='M132 104v-30h24v10h-12v20' fill='none' stroke='#c07d4a' stroke-width='2.8' stroke-linejoin='round' stroke-linecap='round'/>"
        "<circle cx='150' cy='120' r='3' fill='#c07d4a'/>"
        "<path d='M180 104V64' fill='none' stroke='currentColor' stroke-opacity='.55' stroke-width='2.2' stroke-dasharray='3 4'/>"
    ),
    "kehle": (
        "<path d='M142 34l-8 132' fill='none' stroke='#c07d4a' stroke-width='2.6'/>"
        "<path d='M158 34l8 132' fill='none' stroke='#c07d4a' stroke-width='2.6'/>"
        "<g fill='none' stroke='currentColor' stroke-opacity='.62' stroke-width='1.6' stroke-linecap='round'>"
        "<path d='M32 58l106 20'/><path d='M32 96l102 28'/><path d='M34 134l98 30'/>"
        "<path d='M268 58l-106 20'/><path d='M268 96l-102 28'/><path d='M266 134l-98 30'/></g>"
    ),
    "schornstein": (
        "<path d='M40 152L262 78' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='2.4'/>"
        "<path d='M120 122l58 -20v-46l-58 20z' fill='none' stroke='currentColor' stroke-opacity='.78' stroke-width='2.2' stroke-linejoin='round'/>"
        "<path d='M120 122l58 -20' fill='none' stroke='#c07d4a' stroke-width='2.8'/>"
        "<path d='M178 102l16 -6l-6 -12l-16 6z' fill='none' stroke='#c07d4a' stroke-width='2.4' stroke-linejoin='round'/>"
    ),
    "dachaufbau": (
        "<path d='M52 150L236 66' fill='none' stroke='currentColor' stroke-opacity='.6' stroke-width='9' stroke-linecap='round'/>"
        "<path d='M56 140q14 2 28 -5t28 -5t28 -5t28 -5t28 -5' fill='none' stroke='currentColor' stroke-opacity='.7' stroke-width='1.6'/>"
        "<g fill='none' stroke='#c07d4a' stroke-width='6' stroke-linecap='round'><path d='M92 128l4 -2'/><path d='M132 110l4 -2'/><path d='M172 92l4 -2'/></g>"
        "<g fill='none' stroke='currentColor' stroke-opacity='.8' stroke-width='2.4' stroke-linecap='round'><path d='M84 108l14 26'/><path d='M124 90l14 26'/><path d='M164 72l14 26'/></g>"
    ),
}


def foto(fid, szene, aria, winkel, unterschrift):
    return {
        "id": fid,
        "alt": aria,
        "winkel": winkel,
        "bildunterschrift": unterschrift,
        "musterSvg": svg(aria, SZENE[szene]),
    }


# --- Zuordnung: (LF, Lektion) -> Foto-Plätze -------------------------------
PLAETZE = {
    ("lf09", "lf09-l02"): [
        foto("lf09-schiefer-flaeche", "schiefer_flaeche",
             "Schieferdeckung von schräg unten, Gebindelinien laufen diagonal nach oben",
             "schräg von unten",
             "Steh unten an der Traufe und halt schräg nach oben. Die diagonalen Gebindelinien und die Überdeckung (Doppelpfeil) müssen laufen. Formatfüllend."),
    ],
    ("lf09", "lf09-l04"): [
        foto("lf09-einzelschiefer", "einzelschiefer",
             "Einzelner Schiefer mit Nagelloch, Zollstock daneben",
             "Rückseite",
             "Stein in die Hand, Rückseite zur Kamera, sodass das Nagelloch drauf ist. Zollstock daneben legen — dann sieht man die Größe."),
    ],
    ("lf07", "lf07-l01"): [
        foto("lf07-rinnenhalter", "rinnenhalter",
             "Rinnenhalter von der Seite mit eingehängter Rinne und Gefälle",
             "von der Seite",
             "Seitlich fotografieren, damit man den Haken, das Gefälle (gestrichelt) und den Überstand der Rinne sieht."),
        foto("lf07-rinnenstutzen", "rinnenstutzen",
             "Rinnenstutzen als Übergang von der Rinne ins Fallrohr",
             "Übergang",
             "Den Stutzen (kupfern) formatfüllend: wie die Rinne oben ins Fallrohr unten übergeht."),
    ],
    ("lf14", "lf14-l01"): [
        foto("lf14-wandanschluss", "wandanschluss",
             "Wandanschluss auf dem Flachdach, Bahn hochgeführt, Zollstock misst die Höhe",
             "mit Zollstock",
             "Die hochgeführte Bahn (kupfern) an der Wand. Zollstock senkrecht anlegen — dann kann ich die Anschlusshöhe einzeichnen."),
    ],
    ("lf14", "lf14-l02"): [
        foto("lf14-gully", "gully",
             "Dachgully mit quadratischem Flansch und rundem Einlauf",
             "von oben",
             "Am besten vor oder frisch nach dem Einbau. Der breite Flansch und der runde Einlauf (kupfern) müssen ganz drauf."),
    ],
    ("lf10", "lf10-l01"): [
        foto("lf10-schweissnaht", "schweissnaht",
             "Schweißnaht an Bitumenbahn mit ausgetretener Nahtwulst und Brenner",
             "Nahaufnahme",
             "Nah ran an die Naht. Die ausgetretene Bitumenwulst (kupfern) muss als durchgehende Raupe zu sehen sein."),
    ],
    ("lf12", "lf12-l01"): [
        foto("lf12-doppelstehfalz", "doppelstehfalz",
             "Doppelstehfalz-Fläche, mehrere stehende Falze laufen längs",
             "längs",
             "Längs die Fläche fotografieren, sodass mehrere Falze als parallele Reihe laufen."),
    ],
    ("lf12", "lf12-l02"): [
        foto("lf12-hafte", "hafte",
             "Hafte auf der Schalung befestigt, bevor die nächste Schar kommt",
             "Detail",
             "Die festgeschraubte Hafte (kupfern) auf der Schalung — bevor die nächste Schar drüberkommt."),
    ],
    ("lf13a", "lf13a-l02"): [
        foto("lf13a-kehle", "kehle",
             "Dachkehle von oben, zwei Flächen laufen in das Kehlblech",
             "von oben",
             "Von oben fotografieren: beide Dachflächen laufen von links und rechts in das Kehlblech (kupfern) in der Mitte."),
    ],
    ("lf13a", "lf13a-l03"): [
        foto("lf13a-schornstein", "schornstein",
             "Schornsteinanschluss mit Seitenanschluss und Rückenrinne dahinter",
             "komplett",
             "Ganzer Anschluss: der Seitenanschluss unten (kupfern) und die Rückenrinne oberhalb, hinter dem Schornstein."),
    ],
    ("lf08", "lf08-l02"): [
        foto("lf08-dachaufbau", "dachaufbau",
             "Offener Dachaufbau: Sparren, Unterspannbahn, Konterlatte und Lattung sichtbar",
             "während der Arbeit",
             "Alle Schichten gleichzeitig: Sparren (dicker Balken), Unterspannbahn (Wellenlinie), Konterlatte (kupfern, längs) und Lattung (quer). Gibt's nur jetzt auf der Baustelle."),
    ],
}


def build():
    # nach LF gruppieren
    per_lf: dict[str, dict[str, list]] = {}
    for (lf, lek), fotos in PLAETZE.items():
        per_lf.setdefault(lf, {})[lek] = fotos

    total = 0
    for lf, lektionen_map in per_lf.items():
        p = CONTENT / lf / "lektionen.json"
        data = json.loads(p.read_text(encoding="utf-8"))
        for l in data:
            if l["id"] in lektionen_map:
                l["fotos"] = lektionen_map[l["id"]]
                total += len(l["fotos"])
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"{total} Foto-Plätze in {len(PLAETZE)} Lektionen eingebaut.")


if __name__ == "__main__":
    build()
