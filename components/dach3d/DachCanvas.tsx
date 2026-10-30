"use client";
/* eslint-disable react-hooks/immutability -- R3F exposes mutable Three.js scene, camera and renderer objects. Mutations here occur in effects, frame callbacks and user events, never React state. */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping, Color, Mesh, Object3D, PCFSoftShadowMap, PerspectiveCamera, PMREMGenerator, Spherical, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getDachDetail } from "@/lib/dach3dInhalte";
import { DACH_MEDIEN } from "@/lib/dach3dMedien";
import type { DachAnsicht, DachPhase, DachPosition } from "@/lib/dach3dTypen";
import type { DachBefehl } from "./DachBetrachter";
import { dachRessource, detailVonObjekt, entsorgeDachModell, gueltigerOrbit, hatSichtbareDachGeometrie, konfiguriereDachModell, vorbereiteDachModell, wasserPunkte, type DachOrbit } from "./dach3dScene";

const erlaubteMedien = new Set(DACH_MEDIEN.map(a => a.url));

export interface DachCanvasProps {
  url: string; detailId: string | null; ansicht: DachAnsicht; phase: DachPhase; schritt: number;
  schichten: string[]; kamera: DachPosition["kamera"]; wasser: number; reduziert: boolean;
  erlaubt: string[]; resetSignal: number; befehl: { art: DachBefehl; nummer: number };
  orbit?: DachOrbit; onOrbit?: (orbit: DachOrbit) => void;
  onDetail: (id: string) => void; onBereit: () => void; onFehler: (message: string) => void; onLeer?: (leer: boolean) => void;
}

function Umgebung() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl), raum = new RoomEnvironment();
    const renderTarget = pmrem.fromScene(raum, .04);
    const vorher = scene.environment;
    scene.environment = renderTarget.texture; scene.background = new Color("#e9e2d6");
    raum.dispose(); pmrem.dispose(); invalidate();
    return () => { scene.environment = vorher; renderTarget.dispose(); };
  }, [gl, scene, invalidate]);
  return <><ambientLight intensity={.65}/><hemisphereLight args={["#fff5df", "#71877b", .9]}/></>;
}

function LadeModell(props: DachCanvasProps) {
  const { url } = props;
  const [gltf, setGltf] = useState<{ url: string; root: Object3D } | null>(null);
  const [error, setError] = useState<{ url: string; error: Error } | null>(null);
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
      if (aktiv && !abort.signal.aborted) setError({ url, error: err instanceof Error ? err : new Error("Das Modell konnte nicht geöffnet werden.") });
    });
    return () => { aktiv = false; abort.abort(); if (geladen) entsorgeDachModell(geladen); };
  }, [url]);
  if (error?.url === url) throw error.error;
  return gltf?.url === url ? <GeladenesModell key={url} {...props} root={gltf.root}/> : null;
}

interface Anker { id: string; punkt: Vector3 }
function GeladenesModell({ root, ...props }: DachCanvasProps & { root: Object3D }) {
  const basis = useMemo(() => vorbereiteDachModell(root), [root]);
  const { camera, invalidate, size, gl } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const manual = useRef(false);
  const onBereit = useRef(props.onBereit), onOrbit = useRef(props.onOrbit), onLeer = useRef(props.onLeer);
  useEffect(() => { onBereit.current = props.onBereit; onOrbit.current = props.onOrbit; onLeer.current = props.onLeer; }, [props.onBereit, props.onOrbit, props.onLeer]);
  const bewegung = useRef<{ start: Vector3; ziel: Vector3; altTarget: Vector3; zielTarget: Vector3; zeit: number } | null>(null);
  const [anker, setAnker] = useState<Anker[]>([]), [wasser, setWasser] = useState<Vector3[]>([]);
  const layerKey = props.schichten.join("|"), erlaubteKey = props.erlaubt.join("|");
  const gezeichnet = useRef(false), modellGezeichnet = useRef(false), fertigFrame = useRef<number | null>(null);
  useEffect(() => () => { if (fertigFrame.current !== null) cancelAnimationFrame(fertigFrame.current); }, []);
  useEffect(() => {
    const callbacks = new Map<Mesh, Mesh["onAfterRender"]>();
    root.traverse(node => {
      if (!(node instanceof Mesh)) return;
      callbacks.set(node, node.onAfterRender);
      const vorher = node.onAfterRender;
      node.onAfterRender = function (...args) { modellGezeichnet.current = true; vorher.apply(this, args); };
    });
    return () => { for (const [mesh, vorher] of callbacks) mesh.onAfterRender = vorher; };
  }, [root]);

  useEffect(() => {
    konfiguriereDachModell(root, basis, { schichten: props.schichten, ansicht: props.ansicht, phase: props.phase, schritt: props.schritt });
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
  }, [root, basis, props.ansicht, props.phase, props.schritt, layerKey, erlaubteKey, props.detailId, invalidate]);

  const cameraBefehl = useRef(0);
  function anpassen(schnell: boolean) {
    const orbit = props.orbit;
    const center = basis.center.clone(), max = Math.max(basis.size.x, basis.size.y, basis.size.z, .2);
    const perspektive = camera as PerspectiveCamera;
    const aspect = Math.max(.3, size.width / Math.max(size.height, 1));
    const dist = max / 2 / Math.tan(perspektive.fov * Math.PI / 360) / Math.min(1, aspect) * 1.3;
    const target = gueltigerOrbit(orbit) ? new Vector3(...orbit.target) : center;
    const direction = props.kamera === "oben" ? new Vector3(.001, 1, .02) : props.kamera === "seite" ? new Vector3(1.5, .35, .1) : props.kamera === "nah" ? new Vector3(1, .55, 1.1) : new Vector3(1.35, .8, 1.35);
    const ziel = gueltigerOrbit(orbit) ? new Vector3(...orbit.position) : direction.normalize().multiplyScalar(dist * (props.kamera === "nah" ? .84 : 1)).add(center);
    perspektive.near = Math.max(.001, max / 1000); perspektive.far = Math.max(100, max * 150); perspektive.updateProjectionMatrix();
    if (!controls.current) return;
    controls.current.minDistance = Math.max(.04, max * .18); controls.current.maxDistance = Math.max(2, max * 7);
    if (schnell || props.reduziert || gueltigerOrbit(orbit) || camera.position.distanceTo(ziel) < .0001) {
      bewegung.current = null; camera.position.copy(ziel); controls.current.target.copy(target); controls.current.update();
    } else bewegung.current = { start: camera.position.clone(), ziel, altTarget: controls.current.target.clone(), zielTarget: target, zeit: 0 };
    invalidate();
  }
  const first = useRef(true), orbitKey = JSON.stringify(props.orbit ?? null);
  useEffect(() => {
    anpassen(first.current); first.current = false;
  // Camera restoration depends on authored presets and captured orbit only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, props.kamera, props.resetSignal, props.reduziert, size.width, size.height, orbitKey]);

  useFrame((_, delta) => {
    // R3F invokes useFrame before drawing. Observe the next browser frame so
    // readiness means the parsed GLB is mounted in a rendered WebGL scene.
    // An intentionally empty layer selection or a camera pointing away must
    // not leave a permanent loading indicator. The separate model-draw metric
    // lets browser checks prove actual geometry was drawn in a normal view.
    if (!gezeichnet.current && fertigFrame.current === null) {
      fertigFrame.current = requestAnimationFrame(() => {
        fertigFrame.current = null;
        if (gl.info.render.calls <= 0 || gl.info.render.triangles <= 0) return;
        gezeichnet.current = true;
        onBereit.current();
        window.dispatchEvent(new CustomEvent("dach3d:bereit", { detail: {
          url: props.url, renderer: "WebGLRenderer", drawCalls: gl.info.render.calls,
          dreiecke: gl.info.render.triangles,
          modellGezeichnet: modellGezeichnet.current,
        } }));
      });
    }
    const b = bewegung.current;
    if (!b || !controls.current) return;
    b.zeit = Math.min(1, b.zeit + delta / .5);
    const t = 1 - Math.pow(1 - b.zeit, 3);
    camera.position.lerpVectors(b.start, b.ziel, t); controls.current.target.lerpVectors(b.altTarget, b.zielTarget, t); controls.current.update();
    if (b.zeit >= 1) bewegung.current = null;
    else invalidate();
  });

  function speichernOrbit() {
    if (!controls.current) return;
    onOrbit.current?.({ position: camera.position.toArray() as DachOrbit["position"], target: controls.current.target.toArray() as DachOrbit["target"] });
  }
  useEffect(() => {
    if (!props.befehl.nummer || cameraBefehl.current === props.befehl.nummer || !controls.current) return;
    cameraBefehl.current = props.befehl.nummer; bewegung.current = null;
    if (props.befehl.art === "reset") {
      const max = Math.max(basis.size.x, basis.size.y, basis.size.z, .2), aspect = Math.max(.3, size.width / Math.max(size.height, 1));
      const dist = max / 2 / Math.tan((camera as PerspectiveCamera).fov * Math.PI / 360) / Math.min(1, aspect) * 1.3;
      camera.position.copy((props.detailId ? new Vector3(1, .55, 1.1) : new Vector3(1.35, .8, 1.35)).normalize().multiplyScalar(dist * (props.detailId ? .84 : 1)).add(basis.center)); controls.current.target.copy(basis.center);
    } else {
      const kugel = new Spherical().setFromVector3(camera.position.clone().sub(controls.current.target));
      if (props.befehl.art === "links") kugel.theta -= .18;
      if (props.befehl.art === "rechts") kugel.theta += .18;
      if (props.befehl.art === "oben") kugel.phi = Math.max(.03, kugel.phi - .13);
      if (props.befehl.art === "unten") kugel.phi = Math.min(Math.PI * .49, kugel.phi + .13);
      if (props.befehl.art === "naeher") kugel.radius = Math.max(controls.current.minDistance, kugel.radius * .82);
      if (props.befehl.art === "weiter") kugel.radius = Math.min(controls.current.maxDistance, kugel.radius * 1.2);
      camera.position.copy(new Vector3().setFromSpherical(kugel).add(controls.current.target));
    }
    controls.current.update(); invalidate(); speichernOrbit();
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
    <directionalLight position={[radius * 1.1, radius * 1.8, radius * .9]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-radius} shadow-camera-right={radius} shadow-camera-top={radius} shadow-camera-bottom={-radius} shadow-camera-near={.01} shadow-camera-far={radius * 8} shadow-bias={-.00015}/>
    <directionalLight position={[-radius, radius * .5, -radius]} intensity={.75}/>
    <primitive object={root} onClick={auswaehlen} onPointerOver={(e: ThreeEvent<PointerEvent>) => { gl.domElement.style.cursor = detailVonObjekt(e.object, props.erlaubt) ? "pointer" : "grab"; }} onPointerOut={() => { gl.domElement.style.cursor = "grab"; }}/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.025, 0]} receiveShadow><planeGeometry args={[radius * 12, radius * 12]}/><meshStandardMaterial color="#ded5c6" roughness={1}/></mesh>
    {anker.map((a, i) => <Html key={a.id} position={a.punkt} center zIndexRange={[20, 10]} distanceFactor={Math.max(3, radius * 1.5)}><button type="button" aria-label={`${getDachDetail(a.id)?.titel ?? a.id} am Dach öffnen`} onClick={e => { e.stopPropagation(); props.onDetail(a.id); }} style={{ width: 44, height: 44, borderRadius: 22, border: "2px solid #fff", background: "#1f5d52ed", color: "white", fontWeight: 800, fontSize: 14, boxShadow: "0 2px 8px #0004", cursor: "pointer" }}>{i + 1}</button></Html>)}
    {props.wasser > 0 && water.length > 1 && <><Line points={water} color="#087dcb" lineWidth={4}/>{water.map((p, i) => <mesh key={i} position={p}><sphereGeometry args={[Math.max(.01, radius * .009), 12, 8]}/><meshStandardMaterial color="#35a8ee" roughness={.2}/></mesh>)}</>}
    <OrbitControls ref={controls} makeDefault enableDamping={false} enablePan minPolarAngle={.025} maxPolarAngle={Math.PI * .49} maxDistance={radius * 7} minDistance={radius * .18} onStart={() => { manual.current = true; bewegung.current = null; }} onChange={() => invalidate()} onEnd={() => { if (manual.current) { manual.current = false; speichernOrbit(); } }}/>
  </>;
}

export default function DachCanvas(props: DachCanvasProps) {
  return <Canvas shadows dpr={[1, 1.5]} frameloop="demand" camera={{ position: [12, 10, 12], fov: 43 }} gl={{ antialias: true, alpha: false, powerPreference: "low-power" }} onCreated={({ gl }) => {
    gl.localClippingEnabled = true; gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; gl.shadowMap.type = PCFSoftShadowMap; gl.domElement.style.touchAction = "none";
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
