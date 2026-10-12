# Fachlicher Prüfstand

Diese Dokumentation trennt technische Inhaltsprüfungen von einer fachlichen Freigabe.
Die Quellenangaben im Bestand sind übernommene Verweise. Die Originalbücher liegen
in dieser Arbeitsumgebung nicht vor; ihre Richtigkeit und Aktualität sind nicht
vollständig bestätigt. Die vorhandene Kennzeichnung „hoch“ ist kein Nachweis einer
unabhängigen Prüfung.

## Bearbeitete Unklarheiten

- **309 Quellenhinweise in Lektionen:** Die unbelegte Formulierung
  „abgeleitet aus den geprüften Aufgaben“ wurde durch „Zusammenfassung auf Basis
  der zitierten Aufgaben“ ersetzt. Der Hinweis auf den noch ausstehenden
  unabhängigen Abgleich der Originalquellen ist ausdrücklich ergänzt.

- **24 Rechenaufgaben:** Nicht definierte Platzhalter mit Umlauten wurden auf
  die tatsächlich vorhandenen Parameternamen korrigiert. Dadurch sind Maße wie
  Dachüberstände und Behältergrößen wieder im Aufgabentext sichtbar.
- **285 Rechenaufgaben:** Formeln werden mit je fünf deterministischen
  Zahlenproben ausgeführt; Textplatzhalter und Parameterbereiche werden geprüft.
  Das prüft Ausführbarkeit, nicht jede Formel fachlich oder die Baugeometrie.
- **Arbeitssicherheit, LF 8:** Aufgabe `lf08-082` und Lektion `lf08-l07` sind
  vorläufig als `pruefen` ausgeblendet. Die pauschale Absturzhöhen-Angabe und
  die zahlenbezogenen Vorgaben der Lektion sind anhand aktueller Originalquellen
  zu prüfen. Die Inhalte bleiben im Repository erhalten. Der Online-Abruf bei
  der BG BAU wurde von der Netzwerkumgebung mit HTTP 403 blockiert.

- **Steildach, LF 2 / LF 5:** Identische Fragen hatten unterschiedliche Antworten
  (über 22° / über 40°). Fragen und Lektionen benennen jetzt die jeweilige
  Buchklassifikation. Eine Klassifikation ersetzt keine Auswahl des Dachaufbaus.
- **Holzschindelfugen, LF 9 / LF 11:** Die Fragen nennen jetzt Dachdeckung bzw.
  Fassade und die jeweilige Buchstelle. Die Werte sind nicht als austauschbare
  allgemeine Ausführungsvorgabe dargestellt.
- **Sechs Praxisfälle:** Flächen, Zuschläge, Aufrunden, Pythagoras, Prozentgefälle,
  Bahnenüberdeckung und Regenvolumen sind mit ausdrücklich vorgegebenen Annahmen
  gerechnet. Die neuen Rechenwege werden unabhängig in Tests nachgerechnet.
  Keine Überdeckungs-, Gefälle- oder Entwässerungsannahme ist eine Fachregelvorgabe.

## Weiter zu prüfen

Stand 12. Oktober 2026: Der Nutzer hat die angefragten Originalquellen aktuell
noch nicht zur Verfügung. Die vollständige fachliche Prüfung (Schritt 3) bleibt
offen, bis passende Buchseiten/PDFs und aktuelle Fachquellen vorliegen. Die
vorläufig zurückgestellten Sicherheitseinträge bleiben bis zur Bestätigung
ausgeblendet. Dieser offene Punkt ist bei weiteren Updates zu berücksichtigen.

Eine fachkundige Person muss die zitierten Buchstellen und gegebenenfalls aktuelle
Fachregeln und Herstellerangaben vergleichen. Besonders Zahlenwerte zu Neigungen,
Befestigung, Überdeckung und Sicherheit brauchen den richtigen Anwendungsbereich
und Quellenstand. Das ist noch keine abgeschlossene Prüfung des gesamten Bestands.

`npm run content:check` findet fehlende Quellenangaben, doppelte IDs, ungültige
Antwortindizes, fehlende Erklärungen und identische MC-Fragen mit unterschiedlichen
Antworten. Zusätzlich prüft es Parameter, Textplatzhalter und fünf Zahlenproben
je Rechenaufgabe. Es beweist nicht, dass eine fachliche Aussage richtig ist.
