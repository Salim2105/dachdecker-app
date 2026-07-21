# App privat online stellen (Cloudflare) — für iPad/iPhone offline ohne Mac

Ziel: Die App liegt kostenlos und **nur für dich** (E-Mail-Login) bei Cloudflare.
Dein iPhone/iPad lädt sie einmal, speichert sie und läuft danach **für immer
offline — ohne Mac, ohne Apple**.

> Die Schritte mit **Account** und **Login** musst du selbst machen — an deine
> Zugangsdaten darf ich nicht. Alles andere ist vorbereitet; für dich sind es
> ein paar Befehle. Dauer: ~10 Minuten, einmalig.

---

## Schritt 1 — Cloudflare-Konto (kostenlos)

1. Auf **dash.cloudflare.com/sign-up** ein kostenloses Konto anlegen
   (E-Mail + Passwort). Keine Kreditkarte nötig.

## Schritt 2 — Einloggen & hochladen (Terminal, im Projektordner)

```
npx wrangler login
```

Das öffnet den Browser → auf **„Allow"** klicken. Dann:

```
npm run deploy
```

Beim ersten Mal legt das automatisch das Projekt **„dachdecker"** an und lädt
die App hoch. Am Ende steht eine Adresse wie:

```
https://dachdecker.pages.dev
```

(Ist der Name vergeben, meldet wrangler das — dann in `package.json` beim
Script `deploy` einen anderen `--project-name` eintragen, z. B. `dachdecker-ss`.)

## Schritt 3 — WICHTIG: Zugang auf deine E-Mail beschränken

Ohne diesen Schritt könnte theoretisch jeder die Adresse öffnen. Damit **nur du**
reinkommst:

1. Im Cloudflare-Dashboard links **„Zero Trust"** öffnen. Beim ersten Mal einen
   beliebigen Team-Namen vergeben und den **kostenlosen** Plan wählen (Free,
   0 €). Falls nach Karte gefragt wird: es bleibt kostenlos, 0 € Auswahl.
2. **Access → Applications → Add an application → Self-hosted.**
3. **Application domain:** `dachdecker.pages.dev` (deine Adresse von oben).
4. Bei den Policies eine Regel anlegen:
   - Action: **Allow**
   - Include: **Emails** → deine E-Mail (**salimsakkali@gmail.com**).
5. Speichern.

Ab jetzt fragt die Seite beim Öffnen nach deiner E-Mail, schickt dir einen
**Einmal-Code** per Mail, und nur damit kommt man rein.

## Schritt 4 — Aufs iPhone/iPad holen (einmalig)

1. In **Safari** die Adresse öffnen → E-Mail eingeben → Code aus der Mail
   eingeben. Die App lädt.
2. Einmal **kurz durch die App klicken** (Start, ein Lernfeld, Rechner) — dabei
   speichert sie sich fürs Offline.
3. **Teilen-Symbol → „Zum Home-Bildschirm".** Fertig.

Ab jetzt startet das Icon die App im Vollbild — **offline, ohne Mac, ohne WLAN.**

---

## Aktualisieren (wenn Inhalte dazukommen)

1. Am Mac einmal: `npm run deploy` (lädt die neue Version hoch).
2. iPhone/iPad einmal **online** öffnen → die App aktualisiert sich von selbst.
   Danach wieder offline nutzbar.

## Gut zu wissen

- Kostet nichts: Cloudflare Pages (Hosting) und Access (Login-Schutz) sind im
  Free-Plan.
- Privat: Durch den E-Mail-Schutz kommt niemand sonst rein. Die Dateien liegen
  aber auf Cloudflares Servern (nicht mehr nur auf deinem Mac) — das ist der
  Unterschied zum reinen Lokal-Betrieb. Inhalte sind alle deine eigenen.
- Der **Mac wird nur noch zum Hochladen neuer Versionen** gebraucht, nie mehr
  zum Lernen.
