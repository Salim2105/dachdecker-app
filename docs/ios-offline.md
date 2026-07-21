# Dachdecker offline auf iPad / iPhone

Ziel: die App als Icon auf dem Home-Bildschirm, die **auch offline** läuft —
ohne Apple-Account, kostenlos. Der Trick: das iPad lädt die App einmal über ein
lokales HTTPS-Zertifikat aus deinem Mac, speichert alles (Service Worker) und
läuft danach ohne Mac weiter.

Das brauchst du nur **einmal** einrichten. Danach reicht: App-Icon antippen.

---

## Schritt 1 — Mac: Server starten

Im Projektordner im Terminal:

```
npm run ios
```

(oder doppelklick auf **„iPad-Server starten.command"**)

Der Mac baut die App und zeigt die Adresse an:

```
https://macbook-air-von-salim.local:3443
```

Mac und iPad müssen im **gleichen WLAN** sein. Das Terminal offen lassen,
solange du einrichtest. Beenden mit **Strg + C**.

## Schritt 2 — Zertifikat aufs iPad (nur einmal)

Damit das iPad dem lokalen HTTPS vertraut, muss die Datei
**`certs/rootCA.pem`** aufs Gerät. (Nur diese Datei — der Schlüssel
`key.pem`/`rootCA-key.pem` bleibt IMMER auf dem Mac.)

1. `certs/rootCA.pem` per **AirDrop** ans iPad schicken (oder per Mail an dich
   selbst und auf dem iPad öffnen).
2. iPad: **Einstellungen → Profil geladen → Installieren** (iPad-Code eingeben).
3. iPad: **Einstellungen → Allgemein → Info → ganz unten
   „Zertifikatsvertrauenseinstellungen"** → den Schalter für **„mkcert …"**
   **einschalten**. (Ohne diesen Schritt vertraut Safari dem Zertifikat nicht.)

## Schritt 3 — App laden & installieren

1. Auf dem iPad in **Safari**: `https://macbook-air-von-salim.local:3443`
   öffnen. Es muss ein **Schloss** ohne Warnung erscheinen.
   - Klappt der Name nicht, geht auch: `https://192.168.2.103:3443`
     (das Zertifikat deckt beide ab).
2. Einmal **kurz durch die App klicken** (Start, ein Lernfeld, Rechner) — dabei
   speichert der Service Worker alles fürs Offline.
3. **Teilen-Symbol → „Zum Home-Bildschirm"**. Fertig — das Icon startet die App
   künftig im Vollbild.

Ab jetzt läuft sie **offline**, auch ohne Mac und ohne WLAN.

---

## Aktualisieren

Weil die App offline gespeichert ist, bekommt das iPad Änderungen erst, wenn es
wieder Kontakt zum Mac hat:

1. Mac: `npm run ios` starten (gleiches WLAN).
2. App auf dem iPad öffnen → sie lädt die neue Version automatisch (einmal kurz
   warten / neu öffnen).

## Gut zu wissen

- Der Mac muss nur **zum Einrichten und zum Aktualisieren** laufen — zum
  normalen Lernen unterwegs nicht.
- Das Zertifikat gilt bis **2028**. Läuft es ab, neu erzeugen (mkcert) und
  Schritt 2 wiederholen.
- Alles bleibt privat und lokal: kein Server im Internet, keine Veröffentlichung.
