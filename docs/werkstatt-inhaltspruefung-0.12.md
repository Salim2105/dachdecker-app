# Inhaltsprüfung für das Werkstatttraining 0.12

Stand: 29. Oktober 2026. Dies dokumentiert eine interne Konsistenz- und Rechenprüfung der neuen Schulmodelle und ihrer unmittelbar verknüpften Erklärungen. Eine externe Prüfung aktueller Herstelleranleitungen, eine Freigabe realer Ausführungsdetails und eine beobachtete Erprobung im Betrieb sind damit nicht behauptet.

## Geprüfte Schulmodelle

- **Falzziegel:** Einteilungsstrecke 204 cm / sechs Abstände = 34 cm; Feldbreite 120 cm / fünf Deckbreiten = 24 cm. Der ausdrücklich angenommene Längsbereich 33–35 cm wird eingehalten. Sechs Abstände besitzen einschließlich beider Enden sieben Bezugslinien. Außenmaße und wirksame Deckmaße bleiben verschieden.
- **Biberschwanz-Doppeldeckung:** Bei angenommener Ziegellänge 38 cm und 8 cm Höhenüberdeckung über zwei Reihenabstände ist der Lattenabstand (38 − 8) / 2 = 15 cm. Zwei unmittelbar benachbarte Reihen überlappen um 38 − 15 = 23 cm. Diese 23 cm sind nicht die vorgegebenen 8 cm Höhenüberdeckung über zwei Abstände. 90 cm / sechs Abstände = 15 cm; 17,8 cm Ziegelbreite + ausdrücklich angenommene 0,2 cm Fuge = 18 cm; 90 cm / fünf Deckbreiten = 18 cm.
- **Vergleich der Deckarten:** Doppeldeckung erhält jeweils eine Reihe an einer Latte, Kronendeckung zwei Reihen an einer Latte. Daraus folgt keine gemeinsame, austauschbare Lattweite.
- Beide Systemkarten bezeichnen Maße und Befestigungspunkte ausdrücklich als herstellerneutrale Schulvorgaben. Die Auswahl für ein tatsächliches Betriebsprodukt richtet sich nach dessen Planung, Produktunterlagen und Arbeitsanweisung.

## Gezielt überarbeitete Bestandslektionen

Die IDs, Themen, Quellenhinweise und vorhandenen Aufgaben bleiben erhalten. Geändert wurden die Erklärungsabsätze folgender Lektionen:

| Lektion | Befund und Änderung |
|---|---|
| LF02-l06 | Widersprüchliche universelle Fehlkantenlage gegenüber LF08-l18 entfernt. Auflage, Befestigungsbereich, Sortierung und konkrete Einbauangaben werden gemeinsam geprüft. Pauschale Querschnitts-, Feuchte-, Verankerungs- und Schalungswerte wurden nicht als allgemeine Ausführungsregeln beibehalten. |
| LF08-l07 | Historischen Normbezug DIN 1055-4 sowie pauschale Klammer-, Winkel-, Kraft- und Absturzgrenzen aus dem Alttext entfernt. Windnachweis, Systemkombination, Befestigungsplan und Gefährdungsbeurteilung sind getrennte Voraussetzungen. Der vorhandene Status `konfidenz: pruefen` bleibt bestehen; diese Lektion bleibt ausgeblendet. |
| LF08-l11 | Konterlattung als Bestandteil von Lastabtragung, Wasserweg und gegebenenfalls geplanter Lüftung erklärt. Pauschale Latten-, Nagel-, Lüftungs-, Bahnüberdeckungs- und Firstendmaße durch den konkreten Aufbau und seine Vorgaben ersetzt. |
| LF08-l12 | Einteilungsstrecke und Anzahl der Abstände ausdrücklich definiert: E = n × Lattweite; zwischen beiden Randlatten liegen n + 1 Reihen. Aufrunden wird nur mit anschließender Prüfung beider Produktgrenzen erklärt. Doppeldeckung und Falzziegel-Decklängenbereich werden unterschieden. |
| LF08-l18 | Gleiche Fehlkantenprüfung wie in LF02 statt gegensätzlicher Traufrichtungsregel. Keine allgemeine Nachweisfreiheit allein aufgrund eines Sparrenabstands und keine universellen Verbindungsmittelfaktoren mehr. |
| LF08-l19 | Zusatzmaßnahmen aus dem vollständigen Dachfall erklärt. Allgemeine Gradabzüge, Mindestneigungen, Fügebreiten und Überdeckungsmaße werden nicht aus dem Quellenbeispiel zu einer Freigabe beliebiger Produkte gemacht. Unterschiede von Unterspannung, Unterdeckung und Unterdach bleiben erläutert. |
| LF08-l21 | Zusammenhängenden Wasserweg von Deckung und Zusatzebene bis zum Traufdetail beschrieben. Rinnen-, Überdeckungs-, Lüftungs- und Einbauteilmaße werden ihrem jeweiligen System zugeordnet. |
| LF08-l23 | Quellenbeispiel neu nachvollziehbar bezeichnet: 580,5 cm / 17 Abstände = 34,147058… cm, auf zwei Stellen **34,15 cm**. Die alte Angabe 34,14 cm war keine korrekte Rundung. 17 Abstände besitzen 18 begrenzende Latten. Die Breitenrechnung bleibt 1044,9 cm / 49 = 21,32 cm. Fugenwerte des Biber-Schulmodells sind ausdrücklich Aufgabenwerte. |

## Nachvollziehbare Prüfungen

- `werkstattBestandsinhalte.test.ts` kontrolliert die beibehaltene Ausblendung des ungeprüften Windsog-Altbestands, die Beseitigung der widersprüchlichen Fehlkantenanweisung, beide unabhängigen Rechenbeispiele und die Modellgeometrie.
- Die bestehende Inhaltsprüfung kontrolliert Datenstruktur, Quellenfelder, Aufgabenverweise und Rechenparameter. Sie ersetzt keine fachliche Freigabe realer Ausführung.
- Weitere Werkstatt-Inhalts-, Speicher-, Interaktions- und Browserprüfungen werden im allgemeinen Releasebericht dokumentiert.
