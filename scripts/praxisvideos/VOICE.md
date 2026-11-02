# Deutsche neuronale Erzählspur

Die 112 Skripte in `content/praxisvideos-inhalte.json` werden lokal mit
`coqui-tts 0.27.5`, dem deutschen Einzelsprecher-Modell
`tts_models/de/thorsten/vits`, Gruut und PyTorch auf der CPU gesprochen.
Die erzeugten Medien benötigen zur Wiedergabe weder ein Sprachsystem noch
eine Netzwerkverbindung. Es gibt keine Browser-Sprachausgabe.

## Reproduzierbare Umgebung

Python 3.12, FFmpeg und eine eigene virtuelle Umgebung verwenden. Modelle,
Umgebung und unkomprimierte Arbeitsdateien gehören nicht ins Repository.

```sh
python3 -m venv /tmp/dach-video-voice-env
/tmp/dach-video-voice-env/bin/python -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
/tmp/dach-video-voice-env/bin/python -m pip install -r scripts/praxisvideos/voice-requirements.txt
```

Das offizielle Modellarchiv kommt ausschließlich aus dem
[Coqui-Release](https://github.com/coqui-ai/TTS/releases/download/v0.7.0_models/tts_models--de--thorsten--vits.zip).
Als `/tmp/dach-video-model/thorsten-vits.zip` ablegen und darunter nach
`tts_models--de--thorsten--vits/` entpacken. Die Produktion prüft vor der
Modellverwendung die SHA-256:

```text
665f718c558693f5bd0747db19f4b5b4ce81b8903e48b7a51dd5f634475d7d6b
```

Die Modellregistrierung von Coqui nennt Thorsten Müller als Autor und
Apache 2.0 als Modelllizenz. Coqui TTS steht unter MPL 2.0; Gruut unter MIT.
Modell und Sprachlexikon werden lokal geladen. Hugging-Face-Netzwerkzugriffe
sind bei der Produktion ausdrücklich deaktiviert.

## Produktion und Fortsetzung

Aus dem Repository-Stamm:

```sh
sh scripts/praxisvideos/voice-run.sh
tail -f /tmp/dach-video-voice-batch.log
```

Der Start läuft mit `nohup`, schreibt seine PID nach
`/tmp/dach-video-voice-batch.pid` und produziert zuerst
`dach-steildach-falzziegel-s03`, danach die übrigen 111 Kontexte. Der
Fortschritt steht in `/tmp/dach-video-audio/production.json`. Derselbe Befehl
setzt einen unterbrochenen Lauf fort: Text, Modell und Produktionsversion
bestimmen die Signatur; vorhandene vollständige WAV-Dateien werden zusätzlich
gegen die Prüfsumme im Beleg geprüft. Kapitel mit identischem Text teilen
einen lokalen Synthesecache. Es läuft jeweils eine Sprachproduktion mit zwei
CPU-Threads; parallel sind zwei Threads für die Videoproduktion vorgesehen.

Einzelner Kontext:

```sh
/tmp/dach-video-voice-env/bin/python scripts/praxisvideos/voice.py --ids dach-steildach-falzziegel-s03
```

## Übergabe an die Videoproduktion

Pro Kontext entstehen unter `/tmp/dach-video-audio/<id>/`:

- `audio.wav`: PCM 16 Bit, mono, 22.050 Hz, vollständige Erzählspur.
- `receipt.json`: Modell- und Audioprüfsumme, Dauer, Tempo, gemessene
  Kapitelgrenzen und Untertitelzeiten.
- Einzelne Kapitel-WAV-Dateien als Arbeitsmaterial.

Die gemessenen Kapitelgrenzen und die Gesamtdauer werden atomar in das
Inhaltsmanifest übernommen. Untertitel liegen unter
`public/praxisvideos/v1/<id>.vtt`. Satzgrenzen werden von der tatsächlichen
Synthese gemessen; lange Sätze werden innerhalb dieser Grenzen proportional
auf kurze Untertitel verteilt. Eine Einblendung hat höchstens zwei Zeilen mit
je 42 Zeichen, außer einem einzelnen längeren untrennbaren Wort.

Die Erzählspur erhält höchstens 90 Prozent Spitzenpegel und kurze
Kapitelpausen. Nur außerhalb des Produktionsfensters von 45–90 Sekunden wird
das Tempo mit FFmpegs tonhöhenerhaltendem `atempo` angepasst. Kapitel- und
Untertitelzeiten beziehen sich auf das fertig gemessene Ergebnis. Das
Inhaltsgeneratorskript erhält bereits gemessene Zeiten, solange sich der
zugehörige Text nicht ändert.
