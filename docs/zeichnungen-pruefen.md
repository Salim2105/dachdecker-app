# Zeichnungen prüfen

Alle Zeichnungen werden mit der Layout-Engine erzeugt:

    python3 scripts/build_svgs.py            # baut alle
    python3 scripts/build_svgs.py lf07 lf08  # nur einzelne Lernfelder

Die Engine (`scripts/svglib.py`) verhindert Überlappungen und Überläufe schon
beim Bauen: kurze Labels am Bau, Erklärungen in einer strukturierten Legende
unter dem Bild, Build-Guards für Textbreite und Callout-Abstand. Trotzdem
danach beide Prüfungen laufen lassen — die eine findet nicht, was die andere
findet.

## 1. Inhaltlich: PNG rendern und ansehen

    node scripts/verify-lf.mjs lf09 <ausgabeordner>

Rendert jede Zeichnung als PNG auf dunklem Grund. Damit prüft man, ob die
Zeichnung **fachlich stimmt** — ob das Wasser in die Rinne läuft statt daneben,
ob der Nagelkopf auf dem Stein liegt statt darin.

Das PNG wird von librsvg mit einer **anderen Schrift** gerendert als im Browser.
Textbreiten stimmen dort also nicht mit der Realität überein. Deshalb:

## 2. Typografisch: im Browser messen

Am gründlichsten ALLE 125 SVGs auf einmal: ein Prüfdokument mit jedem SVG
erzeugen (Lektionen + Diagramm- + Zeichen-Aufgaben aus dem JSON), im Browser
laden und per `getBBox` messen.

```python
# erzeugt public/_svgcheck.html mit allen SVGs (danach wieder löschen!)
import json, glob, pathlib, html
svgs = []
for p in sorted(glob.glob('content/*/lektionen.json')):
    for l in json.load(open(p)):
        if l.get('svg'): svgs.append((l['id'], l['svg']))
for p in sorted(glob.glob('content/*/aufgaben.json')):
    for a in json.load(open(p)):
        for k in ('svg','vorgabeSvg','loesungSvg'):
            if a.get(k): svgs.append((a['id']+'/'+k, a[k]))
body = "".join(f'<div data-name="{html.escape(n)}">{s}</div>' for n,s in svgs)
pathlib.Path('public/_svgcheck.html').write_text('<!doctype html><meta charset=utf-8><body style="width:343px">'+body)
```

Danach `/_svgcheck.html` öffnen und im Konsolenfenster über `div[data-name]`
messen (Überlappung Text/Text sowie Text außerhalb der viewBox). `public/_svgcheck.html`
danach löschen, damit es nicht ausgeliefert wird.

Die zweite Variante prüft nur die Lektions-Zeichnungen über die echten Seiten:

```js
(async () => {
  const lfs = ['lf01','lf02','lf03','lf04','lf05','lf06','lf07','lf08','lf09',
               'lf10','lf11','lf12','lf13a','lf14','lf15','lf16','lf17','wiso'];
  const probleme = []; let svgs = 0;
  for (const lf of lfs) {
    const html = await (await fetch('/lernen/' + lf, { cache: 'reload' })).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;left:-9999px;top:0;width:343px';
    document.body.appendChild(h);
    doc.querySelectorAll('article').forEach(a => h.appendChild(a.cloneNode(true)));
    h.querySelectorAll('svg').forEach(svg => {
      svgs++;
      const vb = (svg.getAttribute('viewBox') || '0 0 0 0').split(' ').map(Number);
      const texte = [...svg.querySelectorAll('text')];
      for (let i = 0; i < texte.length; i++) for (let j = i + 1; j < texte.length; j++) {
        const a = texte[i].getBBox(), b = texte[j].getBBox();
        if (Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 2 &&
            Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 2)
          probleme.push(lf + ' Überlappung: "' + texte[i].textContent + '" / "' + texte[j].textContent + '"');
      }
      texte.forEach(t => {
        const bb = t.getBBox();
        if (bb.x + bb.width > vb[2] + 1) probleme.push(lf + ' ragt rechts raus: "' + t.textContent + '"');
        if (bb.y + bb.height > vb[3] + 1) probleme.push(lf + ' ragt unten raus: "' + t.textContent + '"');
      });
    });
    h.remove();
  }
  return { zeichnungen: svgs, probleme };
})()
```

**Wichtig vorher:** Wenn zuvor ein Produktions-Build lief, ist der Service Worker
noch registriert und liefert alte Dateien aus. Dann sieht man die Änderungen
nicht. Erst abmelden:

```js
(async () => {
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
})()
```

`navigator.serviceWorker.controller` muss danach `null` sein.
