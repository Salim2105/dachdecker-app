# Dachdecker-Lernapp

Lernapp für Dachdecker-Azubis (1.–3. Lehrjahr) zur Vorbereitung auf Zwischen- und Gesellenprüfung. Zielgruppe: begleitend ab dem 1. Lehrjahr, deutschsprachig, mobile-first.

## Struktur

Inhalte folgen 1:1 dem KMK-Rahmenlehrplan Dachdecker/Dachdeckerin (Beschluss 29.01.2016): 17 Lernfelder plus WiSo. Metadaten in `content/lernfelder.json`. LF 7 kommt fachlich vor LF 8–10 — in der UI als empfohlene Reihenfolge anzeigen, nichts sperren.

## Datenintegrität (nicht verhandelbar)

- Kein Fachinhalt ohne Quelle. Jede Aufgabe hat `quelle` und `konfidenz` (`hoch | mittel | pruefen`). Einträge mit `pruefen` erscheinen nicht in der App, bis sie verifiziert sind.
- Keine erfundenen Fachwerte (Regeldachneigungen, Überdeckungen, Grenzwerte). Was nicht belegt ist, wird nicht behauptet.
- Das ZVDH-Regelwerk ist urheberrechtlich geschützt: als Referenz zum Verifizieren nutzen, niemals Text oder Tabellen daraus kopieren. Gleiches gilt für Fachbücher und echte Prüfungsbögen. Alle Aufgaben sind Eigenformulierungen.
- Sicherheitsthemen (Absturzsicherung, Strom, Gefahrstoffe) besonders sorgfältig: lieber weglassen als raten.

## Stack

- Next.js (App Router) + TypeScript, Deployment auf Vercel
- PWA, mobile-first; Fortschritt im MVP in localStorage, keine Accounts, keine Datenbank
- Inhalte als versionierte JSON-Dateien in `content/`, kein CMS
- Schema: `content/schema.ts`. Aufgabentypen: `mc`, `cloze`, `calc`, `diagram`

## Aufgabentypen

- `mc` / `cloze`: klassische Wissensfragen mit Erklärung zur Lösung
- `calc`: parametrisierte Rechenaufgaben. Parameter werden zur Laufzeit im definierten Bereich randomisiert, die Lösung wird aus der Formel berechnet. Lösungsweg schrittweise anzeigen.
- `diagram`: SVG-Grafik mit Verständnisfrage (z. B. Dachteile benennen). SVGs selbst erstellen, keine fremden Grafiken einbinden.

## MVP-Schnitt

Erst Lernfeld 1–6 komplett und gut, dann erweitern. Prüfungsmodus (Zwischenprüfung = LF 1–9 gemischt, mit Timer) erst nach den Inhalten von LF 1–6.

## Arbeitsweise

Ergänzend gilt die globale `arbeitsregeln.md`. Vor UI-Abnahme: Dev-Server starten und Features im Browser durchklicken, auch Randfälle.
