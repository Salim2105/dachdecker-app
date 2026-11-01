# Saubere eigene Renderbilder

Der optionale externe Produktionsschritt verwendet Intel OpenImageDenoise 1.4.3 über `oidn` 0.2.1. Das ist ein trainierter Raytracing-Denoiser, kein gewöhnlicher Weichzeichner. Die getestete Produktionsumgebung ist Linux x86_64 mit Python 3.12; die fertige App benötigt diese Werkzeuge nicht.

## Reproduzierbar installieren

```bash
python3 -m venv /tmp/dach-denoise-env
/tmp/dach-denoise-env/bin/pip install -r scripts/dach3d/denoise-requirements.txt
```

`oidn`/Intel OIDN verwenden Apache-2.0, OpenEXR BSD-3-Clause, NumPy BSD-3-Clause und Pillow HPND. Die Bibliotheken werden nur als lokale Produktionswerkzeuge verwendet und nicht in Website-Dateien oder GLBs eingebettet. Die gerenderten Bilder und Geometrien bleiben eigene Arbeiten.

## Linearer HDR-Weg

Blender rendert mit Cycles, ohne den in diesem Build fehlenden internen Denoiser. Für die Hilfskanäle und das unveränderte lineare Bild:

```python
scene.cycles.use_denoising = False
bpy.context.view_layer.cycles.denoising_store_passes = True
scene.render.image_settings.file_format = 'OPEN_EXR_MULTILAYER'
scene.render.image_settings.color_depth = '32'
scene.render.image_settings.exr_codec = 'ZIP'
scene.render.filepath = raw_exr
bpy.ops.render.render(write_still=True)
```

```bash
/tmp/dach-denoise-env/bin/python scripts/dach3d/denoise.py raw.exr clean.exr --threads 2
```

Der CLI liest `ViewLayer.Combined.R/G/B`, `Denoising Albedo.R/G/B` und `Denoising Normal.X/Y/Z` automatisch. Bei mehreren View-Layern ist `--layer NAME` erforderlich. Er schreibt weiterhin lineare Float32-Pixel und übernimmt Alpha sowie Bildfenster. Es wird vor dem Denoising kein AgX- oder sRGB-Tonemapping eingebrannt.

Erst danach lädt Blender das bereinigte EXR und wendet beim WebP-Export denselben AgX-View-Transform wie die unveränderte Szene an:

```python
image = bpy.data.images.load(clean_exr, check_existing=False)
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.quality = 93
image.save_render(final_webp, scene=scene)
bpy.data.images.remove(image)
```

Ein vorhandenes PNG/WebP kann ebenfalls als Kontrollbild bereinigt werden; dann arbeitet der CLI ausdrücklich im sRGB/LDR-Modus. Für neue hochwertige Produktionsbilder ist der Float32-Weg mit Albedo- und Normal-Hilfskanälen vorzuziehen. Höhere Samples bleiben nötig, weil ein Denoiser fehlende Geometrie, Reflexionsdetails oder schlecht gewählte Beleuchtung nicht erfindet.

Der CLI setzt maximal vier CPU-Threads, begrenzt Produktionsbilder auf 16 Megapixel und verweigert unvollständige oder nicht endliche Renderwerte. Für diesen Cloud-Aufbau werden zwei Threads pro Vorgang verwendet.
