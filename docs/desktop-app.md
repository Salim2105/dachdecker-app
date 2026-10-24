# Dachdecker als echte Mac-App

Die App gibt es als richtige `.app` fürs MacBook — Doppelklick, komplett
offline, kein Server, kein Internet. Sie ist ein statischer Export der Web-App,
verpackt mit Electron.

## Einmalig: App installieren

1. Die fertige App liegt nach dem Bauen hier:
   `dist-desktop/mac-arm64/Dachdecker.app`
2. Zieh sie in deinen **Programme**-Ordner (oder aufs Dock).
3. **Erster Start:** Weil die App nicht bei Apple signiert ist (kostet Geld,
   brauchst du für privat nicht), meckert macOS beim ersten Mal. Deshalb:
   **Rechtsklick auf die App → „Öffnen" → im Dialog nochmal „Öffnen".**
   Danach startet sie ab sofort ganz normal per Doppelklick.

## Wenn sich Inhalte ändern (neue App-Version bauen)

Immer wenn am Inhalt etwas geändert wurde, einmal im Terminal im Projektordner:

```
npm run desktop:build
```

Das baut den Export neu und packt eine frische `Dachdecker.app` nach
`dist-desktop/mac-arm64/`. Die alte im Programme-Ordner einfach ersetzen.

Zum schnellen Ausprobieren ohne Verpacken:

```
npm run desktop:dev
```

Das öffnet die App direkt aus dem Projekt (gut zum Testen).

## Technisch (kurz)

- `next.config.ts`: mit `EXPORT=1` baut Next reine statische Dateien nach `out/`.
- `electron/main.js`: startet einen winzigen lokalen Server auf `127.0.0.1`
  (fester Port: 39217 beziehungsweise 39218 für Dachdecker Neu) und öffnet das Fenster darauf. Externe Links (Referenzen)
  gehen im normalen Browser auf.
- `electron-builder.yml`: baut die unsignierte `.app` (arm64 / Apple Silicon),
  ohne `node_modules`, mit dem Export als mitgelieferte Dateien.
- Die App ist bewusst **nicht** signiert/notarisiert — reine Privatnutzung.

## iPad / iPhone

Das ist ein eigenes Thema: Eine echte iOS-App braucht Xcode + Apple-ID zum
Signieren (gratis = 7 Tage gültig, 99 $/Jahr = dauerhaft). Ohne Apple bleibt der
Weg „Zum Home-Bildschirm" (App-Icon) — offline dann nur über lokales HTTPS.
Siehe Gespräch; wird separat entschieden.

## Lernwerkstatt-Update

Die neue breite Oberfläche startet mit 1280 × 900 Pixeln. Rechner und Glossar liegen rechts neben der Aufgabe. Der Lernspeicher verwendet IndexedDB; alte lokale Lernstände werden beim ersten Öffnen übernommen. Vollständige ZIP-Sicherungen einschließlich Fotos findest du unter „Lernstand & Sicherungen“.

Dachdecker Neu und die alte Dachdecker-App haben getrennte Benutzerverzeichnisse. Beim Aktualisieren derselben Variante bleibt ihr Benutzerverzeichnis erhalten. Übertrage Daten zwischen Varianten mit Export/Import, bevor du eine alte Variante entfernst. Native Installation: `bash scripts/install-mac-neu.sh`.
