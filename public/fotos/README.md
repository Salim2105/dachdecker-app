# Eigene Praxisfotos

Hierhin kommen ausschließlich selbst aufgenommene Fotos. Keine Bilder aus dem
Internet, aus Herstellerunterlagen oder aus Büchern.

Einbinden in einer Lektion (content/lfXX/lektionen.json):

    "fotos": [
      { "datei": "lf09-schiefer-gebinde.jpg",
        "alt": "Schieferdeckung von schräg unten",
        "bildunterschrift": "Die Gebindesteigung wird zum First hin flacher." }
    ]

`scripts/verify-lf.mjs` prüft, dass jede referenzierte Datei existiert und einen
alt-Text hat. Der Service Worker nimmt alles aus public/ automatisch in den
Offline-Cache auf.

Was fotografiert werden soll, steht in docs/fotoliste.md.
