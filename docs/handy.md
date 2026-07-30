# Die App auf dem Handy

Läuft unter `dachdecker-lernapp.pages.dev` (Cloudflare Pages), geschützt durch
einen Schlüssel, offline nutzbar als App auf dem Home-Bildschirm.

---

## Wie der Zugang funktioniert

`public/_worker.js` steht vor jeder Anfrage. Es gibt genau zwei Antworten:

- **200** — wenn der Schlüssel als `?k=…` in der Adresse steht oder als Cookie
  `dd_zugang` vorliegt
- **404** — sonst. Nicht 403: die 404 bestätigt nicht einmal, dass hier etwas liegt

Beim ersten Aufruf mit `?k=…` setzt der Worker das Cookie für ein Jahr. Danach
reicht die nackte Adresse.

Der Schlüssel liegt als Secret `ZUGANG` im Pages-Projekt und **nirgends im
Repo**. Neu setzen:

```bash
openssl rand -hex 32
npx wrangler pages secret put ZUGANG --project-name=dachdecker-lernapp
```

Ohne gesetztes Secret liefert der Worker `503` — er fällt geschlossen aus, nie
offen.

### Warum nicht Cloudflare Access

Access wurde am 30.07.2026 wieder entfernt. Es leitet auf eine fremde
Login-Domain um, und ein Service Worker darf für eine Navigation **keine
umgeleitete Antwort** zurückgeben (`Response served by service worker has
redirections`). Bei einer Offline-App bedeutet das: Jede abgelaufene Sitzung,
jede fehlende Datei wird zum Totalausfall, aus dem sich das Gerät nicht selbst
befreien kann — der kaputte Worker verhindert genau den Vorgang, der ihn
ersetzen würde.

Der eigene Torwächter leitet nie um. Damit ist die Fehlerklasse weg, nicht
abgefangen.

---

## Aufs Handy holen

1. In **Safari** (muss Safari sein) die Adresse mit `?k=DEIN_SCHLÜSSEL` öffnen
2. **Teilen** → **Zum Home-Bildschirm** → **Hinzufügen**
3. App vom Symbol starten und liegen lassen, bis unten **„Offline bereit."**
   erscheint
4. Test: **Flugmodus an** → App antippen → Aufgabe lösen

---

## Vorladen: Reihenfolge ist nicht egal

`scripts/gen-sw.mjs` erzeugt die Liste. Zwei Dinge daran sind nicht kosmetisch:

**Saubere Adressen statt Dateinamen.** Pages leitet `/lernen.html` per `308`
auf `/lernen` um. Stünden die Dateinamen in der Liste, liefe jede Seite beim
Vorladen in eine Umleitung — nicht cachebar, nicht zurückgebbar. Deshalb
`saubereUrl()`.

**Kern vor Bildern.** 528 Kern-Dateien (Seiten, JavaScript, Symbole, ~9 MB)
gehen komplett durch, bevor die 1070 Buchbilder (~31 MB) anfangen. Ohne das
JavaScript rendert die App nicht — Seitengerüst ohne Code ist ein schwarzer
Bildschirm.

**6 gleichzeitig, ein Wiederholungsversuch.** Alle auf einmal überfordert eine
Handyverbindung; die Fehlschläge wurden früher stillschweigend geschluckt und
der Cache blieb halbleer.

Der Service Worker meldet `kern-fertig` und `alles-fertig` an die Seite,
`ServiceWorkerRegister.tsx` zeigt das an. Ohne diese Rückmeldung kann niemand
wissen, ab wann der Flugmodus gefahrlos ist.

---

## Neue Version hochladen

```bash
npm run export
npx wrangler pages deploy out --project-name=dachdecker-lernapp --branch=main
```

Die App aktualisiert sich beim nächsten Start mit Netz selbst
(`skipWaiting` + `clients.claim`).

**Nach jedem Deploy prüfen** — jede Adresse der Vorladeliste muss `200` ohne
Umleitung liefern. Ein einziger `308` reicht, um das Offline-Laden zu
zerstören, und man sieht es der App online nicht an.

---

## Was offline gilt

Der Fortschritt liegt im `localStorage` des Geräts. Handy und MacBook zählen
getrennt — kein Server, keine Konten, keine Daten unterwegs.

Der Schlüssel im Cookie hält ein Jahr. Löscht iOS die Website-Daten, muss der
Link mit `?k=…` einmal neu geöffnet werden — deshalb den Schlüssel aufbewahren.
