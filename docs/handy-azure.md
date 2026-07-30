# Die App aufs Handy — über Azure

Ziel: App-Symbol auf dem Home-Bildschirm, läuft **offline**, auch wenn das
MacBook aus ist und kein Netz da ist.

Alles Technische ist vorbereitet. Du machst vier Schritte, ich den Rest.

---

## Wichtig vorab: die App ist von Anfang an zu

In `public/staticwebapp.config.json` steht, dass jede Seite die Rolle
`dachdecker` verlangt. **Diese Rolle hat zunächst niemand — auch du nicht.**

Das ist Absicht. Beim allerersten Hochladen kommt niemand rein, nicht einmal
versehentlich. Du gibst dir die Rolle danach in Schritt 3 selbst.

Grund: In der App stecken 1069 Bildausschnitte aus dem Fachbuch und 2039
Aufgaben mit Seitenverweisen. Das ist als private Lernhilfe gedacht, nicht als
Veröffentlichung.

---

## Schritt 1 — Static Web App anlegen (Browser, ~3 Minuten)

1. Öffne **portal.azure.com** und suche oben nach **Static Web Apps**
2. **Erstellen** klicken
3. Ausfüllen:

   | Feld | Wert |
   |---|---|
   | Ressourcengruppe | Neu erstellen → `dachdecker` |
   | Name | `dachdecker-lernapp` |
   | Plan | **Free** |
   | Region | **West Europe** |
   | Bereitstellungsquelle | **Andere** |

   > „Andere" ist wichtig — dann verbindet Azure **nicht** dein GitHub-Repo und
   > du bekommst stattdessen einen Schlüssel zum Hochladen.

4. **Überprüfen und erstellen** → **Erstellen**
5. Warten, bis „Bereitstellung abgeschlossen" steht → **Zu Ressource wechseln**

---

## Schritt 2 — Schlüssel holen und mir geben

Auf der Seite deiner neuen App:

1. Links im Menü auf **Übersicht**
2. Oben auf **Bereitstellungstoken verwalten**
3. Den langen Text kopieren

Diesen Schlüssel gibst du mir. Damit lade ich die App hoch — das ist der
einzige Schritt, den ich nicht ohne dich machen kann.

> Der Schlüssel erlaubt nur das Hochladen in genau diese eine App. Wenn du ihn
> später ungültig machen willst: auf derselben Seite **Zurücksetzen**.

---

## Schritt 3 — Dir selbst Zugriff geben (~2 Minuten)

Erst danach kommst du überhaupt rein.

1. Links im Menü auf **Rollenverwaltung**
2. **Einladen**
3. Ausfüllen:

   | Feld | Wert |
   |---|---|
   | Autorisierungsanbieter | **Microsoft** (Azure Active Directory) |
   | Empfänger | `salim.sakkali005@stud.fh-dortmund.de` |
   | Domäne | die `…azurestaticapps.net`-Adresse deiner App |
   | Rolle | `dachdecker` |

4. **Generieren** → du bekommst einen Einladungslink
5. **Diesen Link im Browser öffnen und die Einladung annehmen**

Fertig. Ab jetzt kommst nur du rein.

---

## Schritt 4 — Aufs Handy holen

Am Handy, **im WLAN** (das erste Laden zieht etwa 48 MB):

1. **Safari** öffnen (iPhone) bzw. **Chrome** (Android)
   → bei iPhone muss es Safari sein, andere Browser können keine PWA
     installieren
2. Die `…azurestaticapps.net`-Adresse eingeben
3. Mit deinem FH-Konto anmelden
4. Warten, bis die Startseite vollständig da ist — **einmal durch die
   Lernfelder tippen**, damit der Zwischenspeicher sich füllt
5. **Teilen-Symbol** (Quadrat mit Pfeil nach oben) → **Zum Home-Bildschirm**
6. Name bestätigen → **Hinzufügen**

Ab jetzt: Symbol antippen, fertig. Kein Browser, keine Adressleiste.

---

## Der Test, der zählt

1. **Flugmodus an**
2. App-Symbol antippen
3. Eine Aufgabe lösen

Läuft das, bist du fertig. Wenn nicht: Flugmodus aus, App nochmal öffnen,
ein paar Minuten laufen lassen (der Zwischenspeicher lädt im Hintergrund
weiter), dann erneut testen.

---

## Was du wissen solltest

**Dein Fortschritt liegt auf dem Handy**, nicht auf dem Server. Handy und
MacBook zählen getrennt — das ist keine Synchronisierung, das ist absichtlich
so (kein Server, keine Konten, keine Daten unterwegs).

**Updates** landen automatisch: Ich lade eine neue Version hoch, du öffnest die
App das nächste Mal mit Netz, sie aktualisiert sich im Hintergrund.

**Wenn iOS aufräumt:** Apple löscht Daten von Websites, die 7 Tage nicht
benutzt wurden. Apps auf dem Home-Bildschirm sind davon ausgenommen — deshalb
ist Schritt 4.5 (Zum Home-Bildschirm) nicht optional, sondern der eigentliche
Punkt.

**Kosten:** 0 €. Static Web Apps Free-Tier deckt 100 GB Traffic im Monat ab,
die App ist 48 MB groß. Dein Guthaben von 88 $ wird nicht angerührt.
