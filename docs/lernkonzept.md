# Lernkonzept — Didaktik-Roadmap

Leitlinie: **Active Recall + Microlearning**. Kein passiver Fließtext; Wissen über Mini-Quizzes, Zuordnungen, Flashcards. Quelle: Vorgaben Salim (2026-07-25).

## Sofort im Content umsetzbar (gilt ab LF1-Neuaufbau)
- **Active Recall / Microlearning**: kleine Aufgaben statt Lesetexte. Aufgabentypen mischen (mc, cloze, calc, diagram, draw, fachbegriff). ✅ passt zum bestehenden Schema.
- **Interleaving**: jede Aufgabe trägt `thema` (Materialkunde, Statik, Sicherheit …). Übe-Session muss Themen **mischen** statt Block. → prüfen, ob `progressStore`/Session-Engine bereits mischt; sonst nachrüsten.
- **Spatial Contiguity (Punkt 2)**: bei `diagram` gehören die Bezeichnungen **direkt an das Element**, nicht in eine separate Legende am Bildrand (Split-Attention-Effekt). → Diagram-Renderer prüfen: Labels mit mittlerem Abstand am data-id-Element ankern.

## App-Features — eigene Baustellen (nach dem Content, priorisiert)
1. **Spaced Repetition 2-3-5-7** (Punkt 1): Intervalle dynamisch; Fehler verkürzt, richtig verlängert. Basis existiert (`AufgabenFortschritt.intervallTage/faelligAm`) → auf 2-3-5-7 kalibrieren + Interleaving erzwingen.
2. **Visuospatial Retrieval / interaktives Zeichnen (Punkt 3)**: Drag-&-Drop fehlender Bauteile in Dach-Querschnitt; Touch-Nachzeichnen von Neigungswinkeln/Linien. → neuer Aufgabentyp, groß.
3. **Konfidenzmessung + Hyperkorrektur (Punkt 4)**: Sicherheits-Slider vor der Lösung; bei Fehler trotz hoher Sicherheit → besonders ausführliches, visuelles Erklär-Feedback.
4. **Fehlerjagd / Error Spotting (Punkt 5)**: gamifiziert, Konstruktionsfehler in Zeichnung/Foto per Tipp markieren. Braucht eigene Fotos/Zeichnungen mit markierten Fehlerzonen.
5. **Motor Imagery / Audio-Guides (Punkt 6)**: Audio leitet mentales Proben von Handgriffen an. Eigene Audioaufnahmen nötig.
6. **Gamification (Punkt 7)**: Streaks (Tage in Folge), Highscores, Quiz-Duelle, Auszeichnungen.

## Reihenfolge
Erst Content aller Lernfelder aus dem Buch (belegt, geprüft). Parallel „frei" umsetzbare Punkte (Interleaving, Diagram-Labels). Danach die großen Features in obiger Priorität.
