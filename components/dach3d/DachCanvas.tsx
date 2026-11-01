"use client";
/* eslint-disable react-hooks/immutability -- R3F exposes mutable Three.js scene, camera and renderer objects. Mutations here occur in effects, frame callbacks and user events, never React state. */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping, Box3, Color, DataTexture, LinearFilter, LinearSRGBColorSpace, Mesh, Object3D, PCFSoftShadowMap, PerspectiveCamera, PMREMGenerator, RGBAFormat, Spherical, Vector3, type WebGLRenderTarget } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getDachDetail } from "@/lib/dach3dInhalte";
import { DACH_MEDIEN } from "@/lib/dach3dMedien";
import type { DachAnsicht, DachPhase, DachPosition } from "@/lib/dach3dTypen";
import type { DachBefehl } from "./DachBetrachter";
import { dachBewegung, dachOrbitZwischen, dachProjektionsAbstand, dachRessource, detailVonObjekt, entsorgeDachModell, gueltigerOrbit, hatSichtbareDachGeometrie, konfiguriereDachModell, sichtbareDachBounds, vorbereiteDachModell, wasserPunkte, type DachOrbit } from "./dach3dScene";
import styles from "./DachBetrachter.module.css";

const erlaubteMedien = new Set(DACH_MEDIEN.map(a => a.url));

export interface DachCanvasProps {
  url: string; detailId: string | null; ansicht: DachAnsicht; phase: DachPhase; schritt: number;
  schichten: string[]; kamera: DachPosition["kamera"]; wasser: number; reduziert: boolean;
  erlaubt: string[]; resetSignal: number; befehl: { art: DachBefehl; nummer: number };
  orbit?: DachOrbit; onOrbit?: (orbit: DachOrbit) => void;
  onDetail: (id: string) => void; onBereit: () => void; onFehler: (message: string) => void; onLeer?: (leer: boolean) => void;
  onRundgangEnde?: () => void;
}

function Umgebung() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl), raum = new RoomEnvironment();
    const fallback = pmrem.fromScene(raum, .055), abort = new AbortController();
    let aktiv = true, natuerlich: WebGLRenderTarget | null = null;
    const vorher = scene.environment, vorherIntensity = scene.environmentIntensity, vorherDrehung = scene.environmentRotation.clone();
    scene.environment = fallback.texture; scene.environmentIntensity = .72; scene.background = new Color("#f2f2ee");
    raum.dispose(); invalidate();
    const hdr = DACH_MEDIEN.find(a => a.id.endsWith("/royal_esplanade_1k.hdr"));
    if (hdr) void (async () => {
      const response = await fetch(hdr.url, { signal: abort.signal, redirect: "error" });
      if (!response.ok) return;
      const bytes = await response.arrayBuffer();
      if (!aktiv || bytes.byteLength !== hdr.bytes) return;
      const data = new HDRLoader().parse(bytes);
      if (!data || data.width > 4096 || data.height > 2048) return;
      const texture = new DataTexture(data.data, data.width, data.height, RGBAFormat, data.type);
      texture.colorSpace = LinearSRGBColorSpace; texture.minFilter = LinearFilter; texture.magFilter = LinearFilter;
      texture.generateMipmaps = false; texture.flipY = true; texture.needsUpdate = true;
      try {
        natuerlich = pmrem.fromEquirectangular(texture);
        if (aktiv) { scene.environment = natuerlich.texture; scene.environmentRotation.y = .65; invalidate(); }
      } finally { texture.dispose(); }
    })().catch(() => { /* A local studio remains available when optional HDRI is offline. */ });
    return () => { aktiv = false; abort.abort(); scene.environment = vorher; scene.environmentIntensity = vorherIntensity; scene.environmentRotation.copy(vorherDrehung); natuerlich?.dispose(); fallback.dispose(); pmrem.dispose(); };
  }, [gl, scene, invalidate]);
  return <><ambientLight intensity={.12}/><hemisphereLight args={["#fffaf1", "#98a29b", .52]}/></>;
}

export function LadeModell(props: DachCanvasProps) {
  const { url } = props;
  const [gltf, setGltf] = useState<{ url: string; root: Object3D } | null>(null);
  const onFehler = useRef(props.onFehler);
  useEffect(() => { onFehler.current = props.onFehler; }, [props.onFehler]);
  useEffect(() => {
    const abort = new AbortController();
    let aktiv = true, geladen: Object3D | null = null;
    const loader = new GLTFLoader();
    // Imported lesson state never supplies model or texture URLs. These assets
    // come exclusively from the authored, versioned same-origin manifest.
    loader.manager.setURLModifier(value => dachRessource(value, window.location.origin, erlaubteMedien));
    void (async () => {
      const asset = DACH_MEDIEN.find(a => a.url === url && a.typ === "modell");
      if (!asset) throw new Error("Dieses Dachmodell gehört nicht zum verfügbaren Medienpaket.");
      const response = await fetch(url, { signal: abort.signal, redirect: "error" });
      if (!response.ok) throw new Error("Die Modelldatei konnte nicht geladen werden.");
      const bytes = await response.arrayBuffer();
      if (!aktiv) return;
      if (bytes.byteLength !== asset.bytes) throw new Error("Das Dachmodell ist unvollständig. Deine Eingaben bleiben erhalten.");
      const result = await loader.parseAsync(bytes, `${window.location.origin}${url.slice(0, url.lastIndexOf("/") + 1)}`);
      geladen = result.scene;
      if (aktiv) setGltf({ url, root: geladen });
      else entsorgeDachModell(geladen);
    })().catch((err: unknown) => {
      // Missing optional media are an expected offline state. Report them to
      // the poster fallback instead of throwing through the WebGL React root.
      if (aktiv && !abort.signal.aborted) onFehler.current(err instanceof Error ? err.message : "Das Modell konnte nicht geöffnet werden.");
    });
    return () => { aktiv = false; abort.abort(); if (geladen) entsorgeDachModell(geladen); };
  }, [url]);
  return gltf?.url === url ? <GeladenesModell key={url} {...props} root={gltf.root}/> : null;
}

interface Anker { id: string; punkt: Vector3 }
function GeladenesModell({ root, ...props }: DachCanvasProps & { root: Object3D }) {
  const basis = useMemo(() => vorbereiteDachModell(root), [root]);
  const { camera, invalidate, size, gl } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const manual = useRef(false), orbitSpeichern = useRef({ offen: false, ruhig: 0, frames: 0, position: new Vector3(), target: new Vector3() });
  const onBereit = useRef(props.onBereit), onOrbit = useRef(props.onOrbit), onLeer = useRef(props.onLeer), onRundgangEnde = useRef(props.onRundgangEnde);
  useEffect(() => { onBereit.current = props.onBereit; onOrbit.current = props.onOrbit; onLeer.current = props.onLeer; onRundgangEnde.current = props.onRundgangEnde; }, [props.onBereit, props.onOrbit, props.onLeer, props.onRundgangEnde]);
  const bewegung = useRef<{ start: DachOrbit; ziel: DachOrbit; zeit: number; dauer: number; speichern: boolean } | null>(null);
  const rundgang = useRef<{ theta: number; phi: number; radius: number; target: Vector3; zeit: number } | null>(null);
  const schichtBewegung = useRef<{ zeit: number; teile: { node: Object3D; start: Vector3; ziel: Vector3; ende: Vector3; sichtbar: boolean }[] } | null>(null);
  const zielBounds = useRef(basis.bounds.clone());
  const [anker, setAnker] = useState<Anker[]>([]), [wasser, setWasser] = useState<Vector3[]>([]);
  const layerKey = props.schichten.join("|"), erlaubteKey = props.erlaubt.join("|");
  const gezeichnet = useRef(false), modellGezeichnet = useRef(false), fertigFrame = useRef<number | null>(null), startFrames = useRef(0);
  useEffect(() => () => { if (fertigFrame.current !== null) cancelAnimationFrame(fertigFrame.current); }, []);
  useEffect(() => {
    const callbacks = new Map<Mesh, Mesh["onAfterRender"]>();
    root.traverse(node => {
      if (!(node instanceof Mesh)) return;
      callbacks.set(node, node.onAfterRender);
      const vorher = node.onAfterRender;
      node.onAfterRender = function (...args) { modellGezeichnet.current = true; vorher.apply(this, args); };
    });
    // The first demand frame can finish before passive effects attach these
    // handlers. Request a fresh frame after this browser turn, rather than
    // relying on layout changes or pointer movement to restart the idle loop.
    const frame = requestAnimationFrame(() => invalidate());
    return () => { cancelAnimationFrame(frame); for (const [mesh, vorher] of callbacks) mesh.onAfterRender = vorher; };
  }, [root, invalidate]);

  useEffect(() => {
    const vorher = new Map<Object3D, { position: Vector3; sichtbar: boolean }>();
    root.traverse(node => vorher.set(node, { position: node.position.clone(), sichtbar: node.visible }));
    konfiguriereDachModell(root, basis, { schichten: props.schichten, ansicht: props.ansicht, phase: props.phase, schritt: props.schritt });
    zielBounds.current = sichtbareDachBounds(root, props.ansicht, basis.center.x);
    const teile: NonNullable<typeof schichtBewegung.current>["teile"] = [];
    if (!props.reduziert && gezeichnet.current) {
      for (const [node, alt] of vorher) {
        const ziel = node.position.clone(), sichtbar = node.visible;
        if (alt.sichtbar === sichtbar && alt.position.distanceToSquared(ziel) < .0000001) continue;
        const start = alt.sichtbar ? alt.position : ziel.clone().add(new Vector3(0, basis.size.y * .08, 0));
        const ende = ziel.clone();
        if (!sichtbar) ziel.add(new Vector3(0, basis.size.y * .06, 0));
        node.visible = alt.sichtbar || sichtbar; node.position.copy(start);
        teile.push({ node, start, ziel, ende, sichtbar });
      }
    }
    schichtBewegung.current = teile.length ? { zeit: 0, teile } : null;
    gl.shadowMap.needsUpdate = true;
    onLeer.current?.(!hatSichtbareDachGeometrie(root));
    const a: Anker[] = [];
    if (!props.detailId) root.traverse(node => {
      const match = /^Hotspot_((?:g|s|w|f|a)\d{2})(?:\.\d+)?$/.exec(node.name);
      if (match && props.erlaubt.includes(match[1])) a.push({ id: match[1], punkt: node.getWorldPosition(new Vector3()) });
    });
    const wasser = wasserPunkte(root); let aktiv = true;
    queueMicrotask(() => { if (aktiv) { setAnker(a); setWasser(wasser); } }); invalidate();
    return () => { aktiv = false; };
  // Arrays are represented by their stable primitive keys to avoid redundant mutation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, basis, props.ansicht, props.phase, props.schritt, layerKey, erlaubteKey, props.detailId, props.reduziert, invalidate, gl]);

  // Commands belong to the currently mounted model. A newly opened roof must
  // not replay a prior model's tour or arrow click before the learner acts.
  const cameraBefehl = useRef(props.befehl.nummer);
  function kameraBewegen(ziel: Vector3, target: Vector3, schnell: boolean, speichern = false, dauer = .72) {
    if (!controls.current) return;
    if (rundgang.current) { rundgang.current = null; onRundgangEnde.current?.(); }
    orbitSpeichern.current.offen = false;
    if (schnell || props.reduziert || camera.position.distanceTo(ziel) < .0001) {
      bewegung.current = null; camera.position.copy(ziel); controls.current.target.copy(target); controls.current.update();
      controls.current.enableDamping = !props.reduziert;
      if (speichern) speichernOrbit();
    } else {
      controls.current.enableDamping = false;
      bewegung.current = { start: { position: camera.position.toArray() as DachOrbit["position"], target: controls.current.target.toArray() as DachOrbit["target"] },
        ziel: { position: ziel.toArray() as DachOrbit["position"], target: target.toArray() as DachOrbit["target"] }, zeit: 0, dauer, speichern };
    }
    invalidate();
  }
  function anpassen(schnell: boolean, neueAufteilung = false) {
    const orbit = neueAufteilung ? undefined : props.orbit;
    const bounds = zielBounds.current, viewSize = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3()), max = Math.max(viewSize.x, viewSize.y, viewSize.z, .2);
    const perspektive = camera as PerspectiveCamera;
    const aspect = Math.max(.3, size.width / Math.max(size.height, 1));
    const target = gueltigerOrbit(orbit) ? new Vector3(...orbit.target) : center;
    const direction = neueAufteilung && controls.current ? camera.position.clone().sub(controls.current.target) : props.kamera === "oben" ? new Vector3(.001, 1, .02) : props.kamera === "seite" ? new Vector3(1.5, .35, .1) : props.kamera === "nah" ? new Vector3(1, .64, 1.1) : new Vector3(1.35, .82, 1.35);
    const dist = dachProjektionsAbstand(viewSize, direction, perspektive.fov, aspect);
    const ziel = gueltigerOrbit(orbit) ? new Vector3(...orbit.position) : direction.normalize().multiplyScalar(dist).add(center);
    perspektive.near = Math.max(.001, max / 1000); perspektive.far = Math.max(100, max * 150); perspektive.updateProjectionMatrix();
    if (!controls.current) return;
    controls.current.minDistance = Math.max(.04, max * .18); controls.current.maxDistance = Math.max(2, max * 7);
    kameraBewegen(ziel, target, schnell || gueltigerOrbit(orbit), neueAufteilung);
  }
  const first = useRef(true), orbitKey = JSON.stringify(props.orbit ?? null);
  const aufteilung = [props.ansicht, props.phase, props.schritt, layerKey].join(":"), letzteAufteilung = useRef(aufteilung);
  useEffect(() => {
    const neueAufteilung = letzteAufteilung.current !== aufteilung;
    anpassen(first.current, neueAufteilung); first.current = false; letzteAufteilung.current = aufteilung;
  // Camera restoration depends on authored presets and captured orbit only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, props.kamera, props.ansicht, props.phase, props.schritt, layerKey, props.resetSignal, props.reduziert, size.width, size.height, orbitKey]);

  useFrame((_, delta) => {
    // R3F invokes useFrame before drawing. Observe the next browser frame so
    // readiness means the parsed GLB is mounted in a rendered WebGL scene.
    // An intentionally empty layer selection or a camera pointing away must
    // not leave a permanent loading indicator. The separate model-draw metric
    // lets browser checks prove actual geometry was drawn in a normal view.
    if (!gezeichnet.current && fertigFrame.current === null) {
      fertigFrame.current = requestAnimationFrame(() => {
        fertigFrame.current = null;
        startFrames.current++;
        if (gl.info.render.calls <= 0 || gl.info.render.triangles <= 0 || !modellGezeichnet.current && startFrames.current < 2) {
          // Loading a demand-driven scene must never depend on a later resize.
          // Limit retries so a broken renderer cannot start a permanent loop.
          if (startFrames.current < 4) invalidate();
          else props.onFehler("Die 3D-Ansicht konnte nicht gezeichnet werden. Die feste Ansicht bleibt verfügbar.");
          return;
        }
        gezeichnet.current = true;
        onBereit.current();
        window.dispatchEvent(new CustomEvent("dach3d:bereit", { detail: {
          url: props.url, renderer: "WebGLRenderer", drawCalls: gl.info.render.calls,
          dreiecke: gl.info.render.triangles,
          modellGezeichnet: modellGezeichnet.current,
        } }));
      });
    }
    const schicht = schichtBewegung.current;
    if (schicht) {
      schicht.zeit = Math.min(1, schicht.zeit + Math.min(delta, .05) / .6);
      for (const teil of schicht.teile) {
        teil.node.position.lerpVectors(teil.start, teil.ziel, dachBewegung(schicht.zeit));
        if (schicht.zeit === 1) { teil.node.position.copy(teil.ende); teil.node.visible = teil.sichtbar; }
      }
      root.updateMatrixWorld(true); gl.shadowMap.needsUpdate = true;
      if (schicht.zeit === 1) { schichtBewegung.current = null; onLeer.current?.(!hatSichtbareDachGeometrie(root)); }
      else invalidate();
    }
    if (!controls.current) return;
    const tour = rundgang.current;
    if (tour) {
      tour.zeit = Math.min(1, tour.zeit + Math.min(delta, .05) / 14);
      const angle = tour.theta + Math.PI * 2 * dachBewegung(tour.zeit);
      const position = new Vector3().setFromSpherical(new Spherical(tour.radius, tour.phi + Math.sin(Math.PI * 2 * tour.zeit) * .055, angle)).add(tour.target);
      camera.position.copy(position); controls.current.target.copy(tour.target); controls.current.update();
      if (tour.zeit === 1) { rundgang.current = null; controls.current.enableDamping = !props.reduziert; speichernOrbit(); onRundgangEnde.current?.(); }
      else invalidate();
    }
    const b = bewegung.current;
    if (b) {
      b.zeit = Math.min(1, b.zeit + Math.min(delta, .05) / b.dauer);
      const orbit = dachOrbitZwischen(b.start, b.ziel, b.zeit);
      camera.position.fromArray(orbit.position); controls.current.target.fromArray(orbit.target); controls.current.update();
      if (b.zeit === 1) { bewegung.current = null; controls.current.enableDamping = !props.reduziert; if (b.speichern) speichernOrbit(); }
      else invalidate();
    }
    const pending = orbitSpeichern.current;
    if (pending.offen && !manual.current && !b && !tour) {
      const delta = camera.position.distanceToSquared(pending.position) + controls.current.target.distanceToSquared(pending.target);
      pending.ruhig = delta < .000000001 ? pending.ruhig + 1 : 0; pending.frames++;
      pending.position.copy(camera.position); pending.target.copy(controls.current.target);
      if (pending.ruhig >= 3 || pending.frames > 160) { pending.offen = false; speichernOrbit(); }
      else invalidate();
    }
  });

  function speichernOrbit() {
    if (!controls.current) return;
    onOrbit.current?.({ position: camera.position.toArray() as DachOrbit["position"], target: controls.current.target.toArray() as DachOrbit["target"] });
  }
  useEffect(() => {
    if (!props.befehl.nummer || cameraBefehl.current === props.befehl.nummer || !controls.current) return;
    cameraBefehl.current = props.befehl.nummer; bewegung.current = null;
    if (props.befehl.art === "pause") {
      rundgang.current = null; controls.current.enableDamping = !props.reduziert; speichernOrbit(); return;
    }
    if (props.befehl.art === "rundgang") {
      if (props.reduziert) { onRundgangEnde.current?.(); return; }
      const spherical = new Spherical().setFromVector3(camera.position.clone().sub(controls.current.target));
      controls.current.enableDamping = false; orbitSpeichern.current.offen = false;
      rundgang.current = { theta: spherical.theta, phi: spherical.phi, radius: spherical.radius, target: controls.current.target.clone(), zeit: 0 };
      invalidate(); return;
    }
    rundgang.current = null; onRundgangEnde.current?.();
    const ziel = camera.position.clone(), target = controls.current.target.clone();
    if (props.befehl.art === "reset") {
      const bounds = zielBounds.current, center = bounds.getCenter(new Vector3()), aspect = Math.max(.3, size.width / Math.max(size.height, 1));
      const direction = props.detailId ? new Vector3(1, .64, 1.1) : new Vector3(1.35, .82, 1.35);
      const dist = dachProjektionsAbstand(bounds.getSize(new Vector3()), direction, (camera as PerspectiveCamera).fov, aspect);
      ziel.copy(direction.normalize().multiplyScalar(dist).add(center)); target.copy(center);
    } else {
      const kugel = new Spherical().setFromVector3(camera.position.clone().sub(controls.current.target));
      if (props.befehl.art === "links") kugel.theta -= .18;
      if (props.befehl.art === "rechts") kugel.theta += .18;
      if (props.befehl.art === "oben") kugel.phi = Math.max(.03, kugel.phi - .13);
      if (props.befehl.art === "unten") kugel.phi = Math.min(Math.PI * .49, kugel.phi + .13);
      if (props.befehl.art === "naeher") kugel.radius = Math.max(controls.current.minDistance, kugel.radius * .82);
      if (props.befehl.art === "weiter") kugel.radius = Math.min(controls.current.maxDistance, kugel.radius * 1.2);
      ziel.copy(new Vector3().setFromSpherical(kugel).add(target));
    }
    kameraBewegen(ziel, target, false, true, props.befehl.art === "reset" ? .72 : .38);
  // Commands are discrete user actions; callbacks use current refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.befehl.nummer]);

  function auswaehlen(event: ThreeEvent<MouseEvent>) {
    if (event.delta > 5) return;
    const id = detailVonObjekt(event.object, props.erlaubt);
    if (id) { event.stopPropagation(); props.onDetail(id); }
  }
  const radius = Math.max(basis.size.x, basis.size.y, basis.size.z, 1);
  const water = wasser.slice(0, Math.max(0, Math.min(5, props.wasser + 1)));
  return <>
    <directionalLight position={[radius * -1.4, radius * 2.6, radius * 1.5]} intensity={2.35} color="#fff7e8" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-radius} shadow-camera-right={radius} shadow-camera-top={radius} shadow-camera-bottom={-radius} shadow-camera-near={.01} shadow-camera-far={radius * 8} shadow-bias={-.0002} shadow-normalBias={.015} shadow-radius={3}/>
    <directionalLight position={[radius, radius * .8, -radius]} intensity={.7} color="#e9f0f4"/>
    <primitive object={root} onClick={auswaehlen} onPointerOver={(e: ThreeEvent<PointerEvent>) => { gl.domElement.style.cursor = detailVonObjekt(e.object, props.erlaubt) ? "pointer" : "grab"; }} onPointerOut={() => { gl.domElement.style.cursor = "grab"; }}/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.018, 0]} receiveShadow><planeGeometry args={[radius * 16, radius * 16]}/><shadowMaterial color="#25382f" opacity={.19} transparent depthWrite={false}/></mesh>
    {anker.map((a, i) => <Html key={a.id} position={a.punkt} center zIndexRange={[20, 10]}><button type="button" className={styles.hotspot} title={getDachDetail(a.id)?.titel ?? a.id} aria-label={`${getDachDetail(a.id)?.titel ?? a.id} am Dach öffnen`} onClick={e => { e.stopPropagation(); props.onDetail(a.id); }}><span>{String(i + 1).padStart(2, "0")}</span></button></Html>)}
    {props.wasser > 0 && water.length > 1 && <><Line points={water} color="#087dcb" lineWidth={4}/>{water.map((p, i) => <mesh key={i} position={p}><sphereGeometry args={[Math.max(.01, radius * .009), 12, 8]}/><meshStandardMaterial color="#35a8ee" roughness={.2}/></mesh>)}</>}
    <OrbitControls ref={controls} makeDefault enableDamping={!props.reduziert} dampingFactor={.1} rotateSpeed={.68} zoomSpeed={.75} panSpeed={.65} enablePan minPolarAngle={.025} maxPolarAngle={Math.PI * .49} maxDistance={radius * 7} minDistance={radius * .18} onStart={() => { manual.current = true; bewegung.current = null; rundgang.current = null; orbitSpeichern.current.offen = false; if (controls.current) controls.current.enableDamping = !props.reduziert; onRundgangEnde.current?.(); }} onChange={() => invalidate()} onEnd={() => { if (manual.current) { manual.current = false; if (props.reduziert) speichernOrbit(); else { orbitSpeichern.current = { offen: true, ruhig: 0, frames: 0, position: camera.position.clone(), target: controls.current!.target.clone() }; invalidate(); } } }}/>
  </>;
}

export default function DachCanvas(props: DachCanvasProps) {
  return <Canvas shadows dpr={[1, 1.5]} frameloop="demand" camera={{ position: [12, 10, 12], fov: 43 }} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} onCreated={({ gl }) => {
    gl.localClippingEnabled = true; gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1; gl.shadowMap.type = PCFSoftShadowMap; gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; gl.domElement.style.touchAction = "none";
  }} onPointerMissed={() => {}} aria-label="Drehbares dreidimensionales Dachmodell" tabIndex={-1}>
    <Umgebung/><KontextVerlust onFehler={props.onFehler}/><LadeModell {...props}/>
  </Canvas>;
}

function KontextVerlust({ onFehler }: { onFehler: (message: string) => void }) {
  const { gl } = useThree(), callback = useRef(onFehler);
  useEffect(() => { callback.current = onFehler; }, [onFehler]);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); callback.current("Die 3D-Verbindung wurde unterbrochen. Die feste Ansicht bleibt erreichbar."); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  return null;
}
