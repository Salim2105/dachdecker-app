/** Own Blender geometry, real full-timeline motion and clear workshop close-ups. */
import * as THREE from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '/node_modules/three/examples/jsm/loaders/RGBELoader.js';

const WIDTH=1920,HEIGHT=1080,BASE='/.praxisvideo-production/v2/';
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.setSize(WIDTH,HEIGHT);renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor('#e8e5dc');document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e8e5dc');scene.fog=new THREE.Fog('#e8e5dc',4.8,10);
scene.add(new THREE.HemisphereLight(0xfff5e7,0x6c7976,.65));
const light=new THREE.DirectionalLight(0xfff0d7,3.0);light.position.set(-1.6,3.2,1.1);light.target.position.set(0,.8,0);light.castShadow=true;
light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-1.25,right:1.25,top:1.25,bottom:-1.25,near:.2,far:7});
light.shadow.bias=-.00003;light.shadow.normalBias=.0003;scene.add(light,light.target);
const fill=new THREE.DirectionalLight(0xc8d9e2,1.0);fill.position.set(1.5,1.8,-2);scene.add(fill);
const camera=new THREE.PerspectiveCamera(36,WIDTH/HEIGHT,.025,15);
const output=document.createElement('canvas');output.width=WIDTH;output.height=HEIGHT;const ctx=output.getContext('2d');
const loader=new GLTFLoader(), pmrem=new THREE.PMREMGenerator(renderer);
const source={};let clip,system,group,refs={},annotations=[];
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const ease=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
const ramp=(t,start,end)=>ease((t-start)/(end-start));
const lerp=THREE.MathUtils.lerp;
const BOARD=.8025, TILE=.025;
const profile=[[-.14,.009],[-.132,.012],[-.12,.014],[-.106,.010],[-.093,.007],[-.06,.005],[.025,.006],[.065,.012],[.09,.027],[.108,.032],[.127,.028],[.14,.022]];
function height(x,z){for(let i=0;i<profile.length-1;i++){const[a,ay]=profile[i],[b,by]=profile[i+1];if(x>=a&&x<=b)return lerp(ay,by,(x-a)/(b-a))+.010*(-z/.42+.5)}return .02}
function surfaceMaterial(color,roughness=.6,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
function meshBox(name,size,pos,material,parent=group){const o=new THREE.Mesh(new THREE.BoxGeometry(...size),material);o.name=name;o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function rod(name,a,b,r,color,parent=group){const d=b.clone().sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),12),surfaceMaterial(color));o.name=name;o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());o.castShadow=true;parent.add(o);return o}
function drawLine(name,a,b,color=0x252825,r=.0009){const root=new THREE.Group();root.name=name;group.add(root);const o=rod(name,a,b,r,color,root);return {root,mesh:o,a,b}}
function progressLine(line,p){const target=line.a.clone().lerp(line.b,Math.max(.001,p)),d=target.clone().sub(line.a);line.mesh.scale.y=Math.max(.001,p);line.mesh.position.copy(line.a).add(target).multiplyScalar(.5);line.mesh.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());line.root.visible=p>.001}
function cloneModel(key,name=key){const o=source[key].clone(true);o.name=name;o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;for(const m of Array.isArray(c.material)?c.material:[c.material]){if(m.map)m.map.anisotropy=1;if(m.normalMap)m.normalMap.anisotropy=1;}}});group.add(o);return o}
function addNote(text,point,dx=0,dy=0,color='#1b5148'){annotations.push({text,point:point.clone(),dx,dy,color})}
function world(o,point=V()){return o.localToWorld(point.clone())}
function inspection(point,radius=.028,color=0x1c8a73){const o=new THREE.Mesh(new THREE.TorusGeometry(radius,.0018,8,48),new THREE.MeshBasicMaterial({color,depthTest:false}));o.rotation.x=-Math.PI/2;o.position.copy(point);o.renderOrder=10;group.add(o);return o}
function clear(){if(group){scene.remove(group);group.traverse(o=>{if(o.userData.ownGeometry)o.geometry?.dispose()})}group=new THREE.Group();scene.add(group);refs={};annotations=[];}

function cameraShot(index,t,targets){
 const shot=targets[index], p=shot[0], target=shot[1];
 // Slow, authored travel throughout the shot. Chapters are deliberate edits.
 const angle=(t-.5)*.07, offset=V(...p).sub(V(...target));offset.applyAxisAngle(V(0,1,0),angle);
 camera.position.copy(V(...target).add(offset));camera.lookAt(V(...target));camera.updateMatrixWorld(true);
}
function prepareMarking(){
 refs.tile=cloneModel('tile','MarkingTile');refs.tile.position.y=BOARD+TILE;
 const parts=cloneModel('marking');refs.pencil=parts.getObjectByName('Pencil');refs.template=parts.getObjectByName('Template');refs.ruler=parts.getObjectByName('Ruler');
 refs.pencilBase=refs.pencil.quaternion.clone();
 refs.template.position.set(refs.cut-.012,BOARD+TILE+.021,0);refs.ruler.position.set(-.24,BOARD+.006,0);
 refs.mark=drawLine('Anriss',V(refs.cut,BOARD+TILE+height(refs.cut,-.18)+.001,-.18),V(refs.cut,BOARD+TILE+height(refs.cut,.18)+.001,.18));
 refs.wrong=drawLine('Falscher Bezug',V(refs.cut-.065,BOARD+TILE+height(refs.cut-.065,-.18)+.001,-.18),V(refs.cut-.065,BOARD+TILE+height(refs.cut-.065,.18)+.001,.18),0xb14336);
 refs.halo=inspection(V());

}
const markShots=[[[.82,1.50,.98],[0,.82,0]],[[.44,1.23,.53],[0,.85,0]],[[.26,1.31,.30],[0,.85,0]],[[.30,1.38,.39],[.025,.86,0]],[[.41,1.23,.43],[.015,.86,0]],[[.43,1.03,-.34],[0,.85,-.12]],[[.27,1.26,.33],[.005,.85,0]]];
function marking(index,t){
 refs.tile.position.set(0,BOARD+TILE,0);refs.tile.rotation.set(0,0,0);
 refs.pencil.visible=false;refs.template.visible=false;refs.ruler.visible=index<3;refs.halo.visible=false;
 progressLine(refs.mark,index>=4?1:0);progressLine(refs.wrong,0);
 if(index===0){refs.ruler.position.x=lerp(-.26,-.19,ramp(t,0,.65));}
 if(index===1){refs.halo.visible=true;refs.halo.position.set(lerp(-.08,.115,ease(t)),BOARD+TILE+.045,-.14);if(t>.2)addNote('42 cm · Schulmodell',V(-.16,BOARD+TILE+.02,0),-150,0);}
 if(index===2){
  const q=ramp(t,0,.55);refs.template.visible=true;refs.template.position.set(lerp(-.22,refs.cut-.012,q),BOARD+TILE+.021+(.11*(1-q)),0);
  if(t>.55){addNote('2',V(refs.cut,BOARD+TILE+.035,-.18),110,-45);addNote('4',V(refs.cut,BOARD+TILE+.035,.18),100,50);}
 }
 if(index===3){
  refs.template.visible=true;refs.pencil.visible=true;
  const q=ramp(t,.05,.88),z=lerp(-.18,.18,q);refs.pencil.position.set(refs.cut,BOARD+TILE+height(refs.cut,z)+.0005,z);
  refs.pencil.quaternion.copy(refs.pencilBase);progressLine(refs.mark,q);
  if(t>.9){refs.pencil.position.y+=ramp(t,.90,1)*.035;}
 }
 if(index===4){
  addNote('Nutzstück',V(-.065,BOARD+TILE+.03,.02),-160,55);addNote('Reststück',V(.104,BOARD+TILE+.05,.04),160,50,'#8f4639');
  refs.halo.visible=true;refs.halo.position.set(refs.cut,BOARD+TILE+.045,lerp(-.17,.17,ease(t)));refs.halo.scale.setScalar(.65);
 }
 if(index===5){refs.halo.visible=true;refs.halo.scale.setScalar(.75);refs.halo.position.set(lerp(-.071,.115,ramp(t,.1,.9)),BOARD+TILE+.035,-.17);addNote(t<.55?'Aufhängung prüfen':'Falzbereich prüfen',refs.halo.position,-120,-70);}
 if(index===6){
  const remove=ramp(t,.10,.38),correct=ramp(t,.45,.90);progressLine(refs.wrong,1-remove);progressLine(refs.mark,correct);
  refs.pencil.visible=true;const z=lerp(-.18,.18,correct);refs.pencil.position.set(refs.cut,BOARD+TILE+height(refs.cut,z)+.0005,z);refs.pencil.quaternion.copy(refs.pencilBase);
  if(t<.4)addNote('Bezug korrigieren',V(refs.cut-.065,BOARD+TILE+.03,0),-180,-90,'#8f4639');
 }
 cameraShot(index,t,markShots);
}

function prepareCutting(){
 refs.station=cloneModel('cutting');refs.station.position.y=BOARD;
 refs.tile=cloneModel('tile','CuttingTile');refs.tile.position.y=BOARD+.05;
 refs.cutTile=cloneModel('tile-cut','CutParts');refs.cutTile.position.y=BOARD+.05;
 refs.rest=refs.cutTile.getObjectByName('Reststueck');refs.restOriginal=refs.rest.position.clone();
 refs.head=refs.station.getObjectByName('SawHead');refs.headOriginal=refs.head.position.clone();
 refs.clampLeft=refs.station.getObjectByName('ClampLeft');refs.clampRight=refs.station.getObjectByName('ClampRight');
 refs.clampParts=[];
 for(const clamp of [refs.clampLeft,refs.clampRight]){
  const x=clamp.position.x, z=clamp.position.z-.045, top=.05+height(x,z);
  for(const name of ['Druckauflage','Spannpratze']){
   const mesh=clamp.children.find(o=>o.name.startsWith(name));if(mesh)refs.clampParts.push({mesh,base:mesh.position.y,target:top+(name==='Druckauflage'?.0045:.0195)});
  }
 }
 refs.mark=drawLine('Schnittanriss',V(refs.cut,BOARD+.05+height(refs.cut,-.205)+.001,-.205),V(refs.cut,BOARD+.05+height(refs.cut,.205)+.001,.205));
 refs.halo=inspection(V(),.027);refs.crack=drawLine('Kantenschaden',V(refs.cut-.004,BOARD+.05+.02,.12),V(refs.cut-.024,BOARD+.05+.018,.095),0x341f17,.0018);
 refs.spinner=new THREE.Group();refs.head.add(refs.spinner);
 const strip=meshBox('Sichtbare Modellrotation',[.003,.17,.004],[.0025,0,0],surfaceMaterial(0x4e5453),refs.spinner);strip.castShadow=false;
}
const cutShots=[[[.89,1.53,1.07],[0,.92,0]],[[.58,1.26,.65],[.015,.91,0]],[[.38,1.20,.44],[.025,.91,-.015]],[[.46,1.22,.57],[.025,.89,0]],[[.40,1.16,.47],[.045,.93,0]],[[.29,1.13,.35],[.035,.91,.04]],[[.28,1.14,.36],[.025,.91,.08]]];
function cutting(index,t){
 refs.tile.position.set(0,BOARD+.05,0);refs.tile.rotation.set(0,0,0);refs.cutTile.visible=index>=5;refs.tile.visible=index<5;refs.rest.position.copy(refs.restOriginal);
 refs.head.position.copy(refs.headOriginal);refs.head.position.y=.145;refs.head.position.z=-.28;
 refs.halo.visible=false;progressLine(refs.mark,1);progressLine(refs.crack,0);
 for(const p of refs.clampParts)p.mesh.position.y=p.target;
 refs.spinner.rotation.x=0;
 if(index===0){refs.head.position.y+=.025;}
 if(index===1){refs.halo.visible=true;refs.halo.position.set(lerp(-.075,.095,ease(t)),BOARD+.10,.09);addNote('Beide Seiten abstützen',V(.05,BOARD+.05,0),180,90);}
 if(index===2){refs.halo.visible=true;refs.halo.position.set(refs.cut,BOARD+.29,-.26);addNote('Schutzhaube',refs.halo.position,160,-55);}
 if(index===3){
  const q=ramp(t,.15,.8);for(const p of refs.clampParts)p.mesh.position.y=p.target+.055*(1-q);
  addNote('Anriss · freier Schnittweg',V(refs.cut,BOARD+.07,.10),120,105);
 }
 if(index===4){
  const q=ramp(t,.05,.95);refs.head.position.z=lerp(-.28,.28,q);refs.spinner.rotation.x=t*85;
  // The blade first crosses the finite tile. Separation begins only after the
  // head has completely left the workpiece in the following chapter.
  refs.halo.visible=t>.10&&t<.90;refs.halo.position.set(refs.cut,BOARD+.10,refs.head.position.z);refs.halo.scale.setScalar(.58);
 }
 if(index===5){
  refs.head.position.z=.28;
  const release=ramp(t,.08,.30);for(const p of refs.clampParts)p.mesh.position.y=p.target+.055*release;
  const q=ramp(t,.38,.90);refs.rest.position.x+=q*.085;refs.rest.position.y+=q*.035;
  refs.halo.visible=t>.45;refs.halo.position.set(refs.cut-.01,BOARD+.077,lerp(-.12,.12,ramp(t,.45,.98)));refs.halo.scale.setScalar(.7);
  if(t>.4)addNote('Schnittkante kontrollieren',refs.halo.position,-180,-70);
 }
 if(index===6){
  refs.head.position.z=.28;for(const p of refs.clampParts)p.mesh.position.y=p.target+.055;
  refs.rest.position.x+=.085;refs.rest.position.y+=.035;progressLine(refs.crack,1);
  refs.halo.visible=true;refs.halo.position.set(refs.cut-.014,BOARD+.085,.11);refs.halo.scale.setScalar(.60);
  addNote(t<.55?'Kantenschaden erkennen':'Eignung vor Einbau klären',refs.halo.position,-160,-85,t<.55?'#8f4639':'#1b5148');
 }
 cameraShot(index,t,cutShots);
}

function prepareLaying(){
 refs.field=new THREE.Group();refs.field.position.set(0,BOARD+.045,0);refs.field.rotation.x=.28;group.add(refs.field);
 meshBox('Dachunterlage',[.68,.025,.84],[0,0,0],surfaceMaterial(0x4d5b52,.9),refs.field);
 const wood=source.bench.getObjectByName('Werkbankplatte')?.material||surfaceMaterial(0x966d43,.7);
 for(const z of [0,-.34])meshBox('Traglatte',[.64,.04,.035],[0,.035,z],wood,refs.field);
 refs.tiles=[];
 for(let i=0;i<4;i++){
  const tile=source.tile.clone(true);tile.name='Ziegel_'+String.fromCharCode(65+i);tile.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});refs.field.add(tile);
  const target=V(i%2===0?-.12:.12,.092,i<2?.17:-.17),loose=V(i%2===0?-.31:.31,.33,i<2?.28:-.21);
  tile.rotation.x=-.095;refs.tiles.push({tile,target,loose});
 }
 refs.halo=inspection(V(),.024);
 const lineMat=new THREE.LineDashedMaterial({color:0xd5ca9e,dashSize:.015,gapSize:.009});
 for(const x of [-.24,0,.24]){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x,.021,-.39),V(x,.021,.39)]),lineMat);line.computeLineDistances();refs.field.add(line)}
 refs.batten=inspection(V(),.023);
}
const layShots=[[[.91,1.58,1.16],[0,.96,0]],[[.53,1.28,.68],[0,.99,.02]],[[.78,1.90,1.10],[0,1.02,0]],[[.74,1.80,1.03],[0,1.01,.04]],[[.72,1.85,1.00],[0,1.04,-.01]],[[.28,1.12,.40],[0,1.03,.0]],[[.78,1.85,1.06],[0,1.02,0]]];
function tilePose(i,p,lift=0){const r=refs.tiles[i];r.tile.position.copy(r.loose).lerp(r.target,p);r.tile.position.y+=Math.sin(Math.PI*p)*.055+lift;r.tile.rotation.set(-.095,0,0);}
function laying(index,t){
 refs.halo.visible=false;refs.batten.visible=false;
 for(let i=0;i<4;i++)tilePose(i,0);
 if(index===0){for(let i=0;i<4;i++)tilePose(i,1);}
 if(index===1){for(let i=0;i<4;i++)tilePose(i,1);refs.halo.visible=true;refs.halo.position.copy(world(refs.field,V(-.12,.145,lerp(-.34,.15,ease(t)))));addNote(t<.5?'Aufhängung und Auflage':'Falzverbindung',refs.halo.position,-150,-65);}
 if(index===2){refs.batten.visible=true;refs.batten.position.copy(world(refs.field,V(0,.065,lerp(0,-.34,ease(t)))));}
 if(index===3){tilePose(0,ramp(t,.04,.44));tilePose(1,ramp(t,.52,.94));}
 if(index===4){tilePose(0,1);tilePose(1,1);tilePose(2,ramp(t,.04,.44));tilePose(3,ramp(t,.52,.94));}
 if(index===5){for(let i=0;i<4;i++)tilePose(i,1);refs.halo.visible=true;refs.halo.position.copy(world(refs.field,V(lerp(-.02,.02,ease(t)),.15,lerp(.12,-.15,ease(t)))));addNote('Falzschluss kontrollieren',refs.halo.position,190,-50);}
 if(index===6){
  for(let i=0;i<4;i++)tilePose(i,1);
  const retreat=ramp(t,.22,.48),repair=ramp(t,.56,.88),r=refs.tiles[3];r.tile.position.y+=lerp(.035,.10,retreat)*(1-repair);r.tile.position.x+=.035*(1-repair);r.tile.rotation.z=.08*(1-repair);
  refs.halo.visible=true;refs.halo.position.copy(world(r.tile,V(-.10,.035,0)));addNote(t<.52?'Sitzfehler':'Erneut prüfen',refs.halo.position,150,-90,t<.52?'#8f4639':'#1b5148');
 }
 // A–D name the physical tiles, never the empty target positions. Labels are
 // withheld before the checkpoint, then follow the actual moving piece.
 if([2,3,4,6].includes(index))for(let i=0;i<4;i++){const r=refs.tiles[i];addNote(String.fromCharCode(65+i),world(r.tile,V(0,.05,0)),i%2===0?-100:100,i<2?80:-85);}
 cameraShot(index,t,layShots);
}

function paint(){
 renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0);
 // A modest context mark remains readable at full-screen; instructional labels
 // use fixed output-pixel sizes instead of shrinking with the model.
 ctx.font='500 32px sans-serif';ctx.fillStyle='#244d43';ctx.fillText('SCHULMODELL · FALZZIEGEL',48,56);
 for(const note of annotations){
  const p=note.point.clone().project(camera);if(p.z>1)continue;
  const x=(p.x*.5+.5)*WIDTH,y=(-p.y*.5+.5)*HEIGHT;
  const lx=THREE.MathUtils.clamp(x+note.dx,90,WIDTH-90),ly=THREE.MathUtils.clamp(y+note.dy,104,HEIGHT-80);
  ctx.font=`700 ${note.text.length===1?62:42}px sans-serif`;const w=ctx.measureText(note.text).width+32,h=note.text.length===1?78:64;
  ctx.strokeStyle=note.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(lx,ly);ctx.stroke();ctx.fillStyle='rgba(250,252,247,.94)';ctx.fillRect(lx-w/2,ly-h/2,w,h);ctx.fillStyle=note.color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(note.text,lx,ly+2);ctx.textAlign='left';ctx.textBaseline='alphabetic';
 }
}

window.loadClip=async input=>{
 clear();clip=input;system=await(await fetch(BASE+'system.json')).json();
 const a=system.einheiten.find(e=>e.slug==='schnitt').aufgaben[0],point=a.punkte.find(p=>p.id===a.loesung[0]);
 refs.cut=(point.x-100)/440*(system.systemkarte.masse.ziegelBreite/100)-(system.systemkarte.masse.ziegelBreite/200);
 cloneModel('bench');
 if(clip.slug==='schnitt')prepareMarking();else if(clip.slug==='bearbeiten')prepareCutting();else prepareLaying();
 return {cutX:refs.cut,modelSystem:system.systemkarte.id,edition:2};
};
window.frame=(seconds,quality=.93)=>{
 const total=clip.dauer,time=THREE.MathUtils.clamp(seconds,0,total-.000001);
 const index=clip.kapitel.findIndex(k=>time>=k.start&&time<k.ende),chapter=clip.kapitel[Math.max(0,index)],t=(time-chapter.start)/(chapter.ende-chapter.start);
 annotations=[];
 if(clip.slug==='schnitt')marking(Math.max(0,index),t);else if(clip.slug==='bearbeiten')cutting(Math.max(0,index),t);else laying(Math.max(0,index),t);
 scene.updateMatrixWorld(true);paint();return output.toDataURL('image/jpeg',quality).slice(23);
};
window.inspect=()=>({parts:group.children.length,camera:camera.position.toArray(),targetClip:clip.id,annotations:annotations.map(a=>a.text)});
try{
 const hdr=await new RGBELoader().loadAsync('/public/dach-medien/v2/gemeinsam/royal_esplanade_1k.hdr');scene.environment=pmrem.fromEquirectangular(hdr).texture;scene.environmentIntensity=.5;hdr.dispose();pmrem.dispose();
 for(const key of ['bench','tile','tile-cut','marking','cutting'])source[key]=(await loader.loadAsync(BASE+'models/'+key+'.glb')).scene;
 window.ready=true;
}catch(error){window.productionError=String(error);throw error}
