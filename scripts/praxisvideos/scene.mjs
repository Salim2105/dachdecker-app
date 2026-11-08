/** Deterministic, real geometry animations. Frame progress is independent of
 * narration length; production retimes each chapter to its measured WAV. */
import * as THREE from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from '/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

const W=1280,H=720;
const inspection=new URLSearchParams(location.search).has('inspect');
const renderer=inspection?{setSize(){},setPixelRatio(){},setClearColor(){},render(){},domElement:document.createElement('canvas')}:new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.setClearColor('#e7ece9');
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;renderer.localClippingEnabled=true;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x788479,2.5));
for(const [p,intensity] of [[[5,9,7],3], [[-4,4,-5],1.2]]){
 const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.set(...p);scene.add(light);
}
const camera=new THREE.PerspectiveCamera(38,W/H,.01,200);
const loader=new GLTFLoader();
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)};
const clamp=THREE.MathUtils.clamp;
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const layerHeight={tragwerk:0,luftdichtheit:.22,daemmung:.43,zusatzebene:.66,lattung:.89,deckung:1.11};
const colors={red:0xde594c,green:0x21a586,blue:0x2d96cc,yellow:0xf5bf52};
let model,parts=[],water=[],center=v(),extent=3,radius=3,config={},extra=new THREE.Group(),faultParts=[],gapParts=[],floor;
scene.add(extra);

function dispose(object){
 const textures=new Set(),materials=new Set(),geometries=new Set();
 object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value)}});
 for(const item of geometries)item.dispose();for(const item of materials)item.dispose();for(const item of textures)item.dispose();
}
function material(color,roughness=.58){return new THREE.MeshStandardMaterial({color,roughness,metalness:.08})}
function box(size,pos,color,parent=extra){const o=new THREE.Mesh(new THREE.BoxGeometry(...size),material(color));o.position.set(...pos);parent.add(o);return o}
function line(a,b,color,width=.012,parent=extra){const d=b.clone().sub(a);const o=new THREE.Mesh(new THREE.CylinderGeometry(width,width,d.length(),10),material(color));o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());parent.add(o);return o}
function label(text,pos,color='#173e3a',scale=.28,parent=extra){
 const canvas=document.createElement('canvas');canvas.width=text.length===1?128:512;canvas.height=128;
 const c=canvas.getContext('2d');c.fillStyle='rgba(248,251,248,.94)';c.fillRect(0,0,canvas.width,128);
 c.fillStyle=color;c.font=`bold ${text.length===1?96:64}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,canvas.width/2,64,canvas.width-20);
 const tex=new THREE.CanvasTexture(canvas),o=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));
 o.position.copy(pos);o.scale.set(scale*canvas.width/128,scale,1);parent.add(o);return o;
}
function ring(position,color=colors.green,size=.15){const o=new THREE.Mesh(new THREE.TorusGeometry(size,size*.075,8,48),material(color));o.rotation.x=-Math.PI/2;o.position.copy(position);extra.add(o);return o}
function chooseFault(){
 const id=config.detailId,flat=config.form==='flachdach';
 const suffixes={g01:'innenanschluss',g02:flat?'unterlage':'pfette',g03:flat?'daemmanschluss':'anschluss',g04:'anschluss',g05:'anker',g06:flat?'flansch':'stutzen',s01:'deckziegel',s03:'fallrohr',s04:'befestigung',s05:'firstziegel',s06:'kehlblech',s07:'anschlussblech',s08:'rueckenteil',s09:'zusatzebene',s10:'wangenanschluss',s11:'formteil',w01:'gratziegel',w02:'befestigung',w03:'knoten',w04:'ziegel',f02:'ablauf',f03:'flansch',f05:'ecke',f06:'befestigung',f07:'anschluss',f08:'anschluss',f09:'fugenprofil',a01:'wetteranschluss',a02:'verankerung',a03:'halter',a04:'ableitung'};
 if(['s02','f01'].includes(id))gapParts=parts.filter(o=>id==='s02'?o.userData.part_id===id+'-zusatzebene':o.userData.layer==='deckung');
 else if(id==='f04'){
  const blocker=box([.42,.16,.035],[0,.64,-1.69],0x77858a,model);blocker.userData.part_id='f04-fehler';blocker.userData.montage_step=3;
  remember(blocker);parts.push(blocker);blocker.userData.addedFault=true;faultParts=[blocker];
 }else{
  faultParts=parts.filter(o=>o.userData.part_id===id+'-'+suffixes[id]);
  if(['s01','s04','s05','w01','w02','w04','g02','a01','a02','a03'].includes(id))faultParts=faultParts.slice(0,1);
  if(id==='a04')faultParts=faultParts.slice(Math.floor(faultParts.length/2),Math.floor(faultParts.length/2)+1);
 }
 if(id==='f09'){
  // Native details.py fault: Blender (x,y,z) becomes Three (x,z,-y).
  const bridge=box([2.22,.065,.17],[0,.53,-1.04],0x879397,model);
  bridge.userData.part_id='f09-starre-ueberbrueckung';remember(bridge);
  bridge.visible=false;bridge.userData.frameWhenHidden=true;config.rigidBridge=bridge;
  for(const o of faultParts)o.userData.frameWhenHidden=true;
 }
 if(['g05','s04','w02','a02'].includes(id)){
  const group=new THREE.Group();extra.add(group);config.fixingCallout=group;
  const halo=new THREE.Mesh(new THREE.RingGeometry(extent*.028,extent*.038,48),new THREE.MeshBasicMaterial({color:colors.red,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));
  group.add(halo);config.fixingHalo=halo;
  const text=label('BEFESTIGUNG',v(extent*.13,extent*.11,0),'#173e3a',extent*.055,group);text.renderOrder=11;text.material.toneMapped=false;
  const arrow=line(v(extent*.10,extent*.08,0),v(extent*.028,extent*.022,0),colors.yellow,extent*.003,group);
  arrow.renderOrder=10;arrow.material.toneMapped=false;arrow.material.depthTest=false;arrow.material.depthWrite=false;config.fixingLabel=text;group.visible=false;
 }
 if(!faultParts.length&&!gapParts.length)throw new Error('No physical fault part for '+id);
}
function remember(o){
 o.userData.originalPosition=o.position.clone();o.userData.originalQuaternion=o.quaternion.clone();o.userData.originalScale=o.scale.clone();
 const source=Array.isArray(o.material)?o.material[0]:o.material;
 // Preserve the source's PBR appearance and all surface textures. Software GL
 // screen-space transmission renders the entire scene repeatedly per frame;
 // simple glass alpha gives the same readable school model at practical cost.
 const surface={};
 for(const key of ['color','map','roughness','roughnessMap','metalness','metalnessMap','normalMap','normalScale','bumpMap','bumpScale','aoMap','aoMapIntensity','emissive','emissiveMap','emissiveIntensity','alphaMap','alphaTest','opacity','transparent','depthWrite','vertexColors'])if(source[key]!==undefined)surface[key]=source[key]?.clone&& !source[key]?.isTexture?source[key].clone():source[key];
 if(source.transmission>0){surface.opacity=(source.opacity??1)*(1-source.transmission);surface.transparent=true;surface.depthWrite=false}
 o.material=new THREE.MeshStandardMaterial(surface);
 o.material.side=THREE.DoubleSide;o.userData.originalColor=o.material.color.clone();
 // The published F02 membrane and insulation share their sloping top faces.
 // Offset raster depth only: source GLB vertices and teaching dimensions stay exact.
 if(config.detailId==='f02'&&o.userData.part_id==='f02-abdichtung'){
  o.material.polygonOffset=true;o.material.polygonOffsetFactor=-2;o.material.polygonOffsetUnits=-2;
 }
}
// GLTFLoader can produce both regular and interleaved attributes from one GLB.
// BufferGeometryUtils deliberately refuses to merge their incompatible layouts.
// Partition by the complete layout, retaining each exact transformed geometry
// if a future Three version still cannot join a partition.
function geometryLayout(g){
 const attr=a=>[a.itemSize,a.normalized,a.isInterleavedBufferAttribute?'interleaved':'plain',(a.array||a.data?.array)?.constructor.name,a.gpuType];
 return JSON.stringify({indexed:!!g.index,attributes:Object.entries(g.attributes).sort(([a],[b])=>a.localeCompare(b)).map(([name,a])=>[name,attr(a)]),morph:Object.entries(g.morphAttributes).map(([name,list])=>[name,list.map(attr)]),relative:g.morphTargetsRelative});
}
function joinOverview(source){
 source.updateMatrixWorld(true);const groups=new Map();
 source.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry.clone();
  // KHR_mesh_quantization stores local positions as normalized integers.
  // Baking a metre-scale world matrix back into that integer range would
  // wrap or clamp vertices. Decode every attribute before transforming;
  // accessor getters preserve the source's normalized/interleaved values.
  for(const [name,a] of Object.entries(g.attributes)){
   const values=new Float32Array(a.count*a.itemSize);
   for(let i=0;i<a.count;i++)for(let c=0;c<a.itemSize;c++)values[i*a.itemSize+c]=a.getComponent(i,c);
   g.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize));
  }
  g.applyMatrix4(o.matrixWorld);
  // Multi-material primitives retain their original material groups intact.
  const key=(Array.isArray(o.material)?o.material.map(m=>m.uuid).join(','):o.material.uuid)+'|'+geometryLayout(g)+(Array.isArray(o.material)?'|'+o.uuid:'');
  if(!groups.has(key))groups.set(key,{material:o.material,geometries:[]});
  groups.get(key).geometries.push(g);
 });
 const joined=new THREE.Group();
 for(const {material,geometries} of groups.values()){
  const merged=geometries.length>1?mergeGeometries(geometries,false):null;
  if(merged){joined.add(new THREE.Mesh(merged,material));geometries.forEach(g=>g.dispose())}
  else for(const g of geometries)joined.add(new THREE.Mesh(g,material));
 }
 return joined;
}
function pathPoints(){
 const nodes=[];model.traverse(o=>{if(o.userData.water_step!==undefined)nodes.push(o)});
 nodes.sort((a,b)=>a.userData.water_step-b.userData.water_step);
 let points=nodes.map(o=>o.getWorldPosition(v()));
 if(points.length<2){
  // A traversal over the actual covering is an inspection path, never a
  // fabricated hydraulic claim when this detail has no encoded water route.
  const b=new THREE.Box3().setFromObject(model);points=[v(b.min.x,b.max.y+.05,center.z),v(b.max.x,b.max.y+.05,center.z)];
 }
 return points;
}
function makeWater(){
 const points=pathPoints();const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
 for(let i=0;i<12;i++){
  const o=new THREE.Mesh(new THREE.SphereGeometry(extent*.010,10,8),material(colors.blue));extra.add(o);water.push(o);
 }
 config.waterCurve=curve;config.hasWater=!!model.getObjectByName('Wasser_0');
}
function reset(){
 if(config.rigidBridge)config.rigidBridge.visible=false;
 if(config.fixingCallout)config.fixingCallout.visible=false;
 for(const o of parts){o.position.copy(o.userData.originalPosition);o.quaternion.copy(o.userData.originalQuaternion);o.scale.copy(o.userData.originalScale);o.visible=!o.userData.addedFault;o.material.color.copy(o.userData.originalColor);o.material.clippingPlanes=[];o.material.clipIntersection=false;}
 water.forEach(o=>o.visible=false);
}
function cameraAt(t,explode=0){
 const angle=.74+(t-.5)*.12,dist=radius*(config.overview?1.16:1.04);
 const target=center.clone().add(v(0,explode*.3,0));
 camera.position.copy(target).add(v(Math.sin(angle)*dist,dist*.61+explode*.45,Math.cos(angle)*dist));camera.lookAt(target);
}
function separate(amount){for(const o of parts){const level=layerHeight[o.userData.layer]??(o.userData.montage_step>1?1.18:0);o.position.y+=level*amount*extent*.33}}
function section(amount){
 const b=config.bounds;const x=THREE.MathUtils.lerp(b.max.x+.1,center.x,amount);
 for(const o of parts){o.material.clippingPlanes=[new THREE.Plane(v(-1,0,0),x)]}
}
function waterFrame(t,show=true){
 for(let i=0;i<water.length;i++){const o=water[i];o.visible=show;o.position.copy(config.waterCurve.getPointAt((t*1.5+i/water.length)%1));}
}
function assemble(t){
 for(const o of parts){const step=Number(o.userData.montage_step??0);const local=smooth((t-(step*.12))/.42);o.position.y+=(1-local)*(step+1)*extent*.22;
  o.position.x+=(1-local)*((step%2?1:-1)*extent*.12);
 }
}
function fault(t){
 const repaired=smooth((t-.48)/.34),amount=1-repaired;
 for(const o of faultParts){
  const id=config.detailId;
  if(id==='f09'){
   o.visible=repaired>.001;o.position.y+=amount*extent*.22;
  }else if(o.userData.addedFault){o.visible=amount>.001;o.position.x+=repaired*extent*.65;continue}
  else if(id==='s03'){o.position.y-=.22*amount}
  else if(['s01','s05','w01'].includes(id)){o.position.y+=.21*amount;o.rotation.z+=.08*amount}
  else if(id==='w04'){o.position.x-=.25*amount;o.position.y+=.05*amount}
  else if(id==='f02'){o.position.y+=.16*amount}
  else{
   // The actual missing connector is set aside, then physically inserted
   // into its encoded position; the neighbouring geometry stays in place.
   o.position.x+=amount*extent*.64;o.position.y+=amount*extent*.24;
  }
  o.material.color.copy(o.userData.originalColor).lerp(new THREE.Color(t<.48?colors.red:colors.green),.38*amount);
 }
 if(config.rigidBridge){
  const bridge=config.rigidBridge;bridge.visible=amount>.025;
  bridge.position.set(repaired*extent*.5,.53+repaired*extent*.18,-1.04);
  bridge.material.color.set(colors.red);
 }
 if(config.fixingCallout&&faultParts[0]){
  config.fixingCallout.visible=true;model.updateMatrixWorld(true);
  const target=new THREE.Box3().setFromObject(faultParts[0]).getCenter(v());
  config.fixingCallout.position.copy(target);config.fixingCallout.quaternion.copy(camera.quaternion);
  config.fixingHalo.material.color.set(t<.48?colors.red:colors.green);
 }
 for(const o of gapParts){
  const sourceCenter=config.detailId==='s02'?.13:.84,width=(config.detailId==='s02'?.18:.08)*amount;
  if(width>.001){const z=-sourceCenter;o.material.clippingPlanes=[new THREE.Plane(v(0,0,-1),z-width/2),new THREE.Plane(v(0,0,1),-z-width/2)];o.material.clipIntersection=true}
 }
 waterFrame(t,t>.76&&config.hasWater);
}

// Dedicated workshop geometry: cut workpiece consists of complementary solid
// polygons; blade follows the marked kerf and offcut separates only afterwards.
let craft={};
function polygonTile(poly,y,color,parent=extra){
 const sh=new THREE.Shape();poly.forEach(([x,z],i)=>i?sh.lineTo(x,z):sh.moveTo(x,z));sh.closePath();
 const geo=new THREE.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:true,bevelSize:.005,bevelThickness:.003,bevelSegments:1,steps:1});geo.rotateX(-Math.PI/2);
 const ob=new THREE.Mesh(geo,material(color));ob.position.y=y;parent.add(ob);return ob;
}
function tile(biber,parent=extra){
 const group=new THREE.Group();parent.add(group);const width=biber?.18:.24,len=biber?.38:.42;
 let poly=biber?[[-width/2,-len/2],[width/2,-len/2],[width/2,len/2-.07],[.055,len/2-.018],[0,len/2],[-.055,len/2-.018],[-width/2,len/2-.07]]:[[-width/2,-len/2],[width/2,-len/2],[width/2,len/2],[-width/2,len/2]];
 polygonTile(poly,0,biber?0xb45c3c:0x9e422e,group);
 box([width*.6,.025,.025],[0,-.012,-len/2+.035],0x9b442d,group);
 if(!biber){box([.012,.024,len],[width/2-.015,.036,0],0x873723,group);box([width,.024,.012],[0,.037,-len/2+.02],0x873723,group)}
 return group;
}
function setupCraft(){
 const biber=config.pfadId==='biber-doppel',slug=config.slug;
 craft={biber,slug,animated:[],marks:[],labels:[]};
 box([2.25,.13,1.55],[0,-.18,0],0x8b6b4a);
 for(const x of [-.85,.85])box([.09,.55,1.1],[x,-.5,0],0x687370);
 if(['schnitt','bearbeiten'].includes(slug)){
  const w=.72,l=1.05; // an enlarged actual school workpiece
  craft.used=polygonTile([[-w/2,-l/2],[.08,-l/2],[-.10,l/2],[-w/2,l/2]],-.04,0xb55c3e);
  craft.rest=polygonTile([[.08,-l/2],[w/2,-l/2],[w/2,l/2],[-.10,l/2]],-.04,0xa44c36);
  craft.start=v(.08,.025,-l/2);craft.end=v(-.10,.025,l/2);
  craft.mark=line(craft.start,craft.end,colors.yellow,.007);craft.mark.scale.y=.001;
  craft.pencil=box([.014,.014,.27],[0,.08,0],0xf6cc51);craft.pencil.rotation.x=.65;
  const guide=new THREE.Group();extra.add(guide);box([.016,.018,1.25],[0,.07,0],0xd8e0db,guide);guide.rotation.y=-.17;guide.position.x=-.012;craft.guide=guide;
  craft.labels.push(label('NUTZSTÜCK',v(-.48,.16,.16),'#166c5c',.09));
  craft.labels.push(label('RESTSTÜCK',v(.46,.16,.16),'#a34c36',.09));
  craft.clamps=[box([.15,.10,.1],[-.32,.035,-.45],0x3d6a76),box([.15,.10,.1],[.3,.035,.45],0x3d6a76)];
  craft.tool=new THREE.Group();extra.add(craft.tool);
  const blade=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.012,48),material(0xa9b7bb,.24));blade.rotation.z=Math.PI/2;craft.tool.add(blade);craft.blade=blade;
  box([.13,.16,.25],[.07,.17,0],0x2c7787,craft.tool);box([.15,.035,.38],[.07,-.14,0],0x555e60,craft.tool);box([.075,.07,.19],[.1,.3,0],0x354c50,craft.tool);
  // Fixed tool guard covers the upper blade sector.
  const guard=new THREE.Mesh(new THREE.CylinderGeometry(.195,.195,.045,32,1,false,0,Math.PI),material(0x435b60));guard.rotation.z=Math.PI/2;craft.tool.add(guard);
  craft.chip=box([.006,.02,.10],[0,-.003,0],0x484c49);craft.chip.visible=false;
 }else{
  craft.field=new THREE.Group();extra.add(craft.field);craft.field.rotation.x=-.22;
  const dx=biber?.18:.24,dz=biber?.15:.34;
  for(let r=0;r<3;r++)box([1.25,.035,.04],[0,.025,-r*dz+.3],0xb28d57,craft.field);
  for(let r=0;r<3;r++)for(let c=0;c<4;c++){
   const ob=tile(biber,craft.field);ob.position.set((c-1.5)*dx+(biber&&r%2?dx/2:0),.07+r*.025,.34-r*dz);
   ob.userData.target=ob.position.clone();ob.userData.row=r;ob.userData.col=c;craft.animated.push(ob);
  }
  // Four exercise tiles: A/B in the lower course, then C/D above.
  for(const [i,n] of [4,5,9,10].entries()){
   const ob=craft.animated[n];ob.userData.exercise=i;
   label('ABCD'[i],ob.position.clone().add(v(0,.15,0)),'#173e3a',.22,ob);
   // Labels follow their actual tile, including its loose starting position.
   ob.children.at(-1).position.set(0,.24,0);
  }
  craft.ruler=box([1.25,.012,.045],[0,.11,.6],0xeadbb6);for(let i=0;i<25;i++)box([.003,.014,i%5===0?.035:.02],[-.6+i*.05,.12,.6],0x605744);
  craft.inspect=ring(v(0,.22,0),colors.green,.12);
  craft.fasteners=[];for(let i=0;i<3;i++){const n=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.1,10),material(0xc4ced0));n.position.set(-.35+i*.35,.13,-.1);extra.add(n);craft.fasteners.push(n);label(String(i+1),n.position.clone().add(v(0,.13,0)),'#173e3a',.035)}
  craft.flow=[];for(let i=0;i<8;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(.013,8,6),material(colors.blue));extra.add(o);craft.flow.push(o)}
 }
 center=v(0,0,0);extent=2.2;radius=3.3;
}
function craftFrame(index,t){
 const {slug}=craft;
 cameraAt(t,0);camera.position.set(1.7+.12*(t-.5),2.35,2.6);camera.lookAt(0,-.02,0);
 if(['schnitt','bearbeiten'].includes(slug)){
  const cut=slug==='bearbeiten',progress=index===4?smooth(t):index>4?1:0;
  craft.used.position.set(0,-.04,0);craft.rest.position.set(0,-.04,0);
  craft.mark.visible=index>=2;craft.mark.scale.y=index===3?Math.max(.001,smooth(t)):1;
  craft.mark.position.copy(craft.start).add(craft.end).multiplyScalar(.5);
  if(index===3)craft.mark.position.lerp(craft.start,(1-smooth(t))*.5);
  craft.pencil.visible=!cut&&index===3;craft.pencil.position.copy(craft.start).lerp(craft.end,t).add(v(0,.1,0));
  craft.guide.visible=!cut&&index<5;craft.tool.visible=cut&&index>=3&&index<6;
  craft.clamps.forEach(o=>{o.visible=cut;o.position.y=.035+(index===3?(1-smooth(t))*.35:0)});
  craft.tool.position.copy(craft.start).lerp(craft.end,progress).add(v(.018,.19,0));craft.blade.rotation.x=progress*80;
  craft.rest.position.x=cut&&index>=4?smooth(index===4?(t-.82)*5:1)*.2:0;
  craft.chip.visible=cut&&index>=4;craft.chip.position.copy(craft.start).lerp(craft.end,progress);craft.chip.scale.z=clamp(progress,.001,1)*10;
  if(index===6){
   // Incorrect mirrored template is withdrawn before a correct line returns.
   const repair=smooth((t-.35)/.35);craft.rest.position.x=(1-repair)*.17;
   craft.mark.material.color.set(t<.4?colors.red:colors.green);craft.used.rotation.z=(1-repair)*.08;
  }else{craft.mark.material.color.set(colors.yellow);craft.used.rotation.z=0}
  craft.labels.forEach(o=>o.visible=index>=2);
 }else{
  const placing=slug==='verlegen';
  for(let i=0;i<craft.animated.length;i++){
   const o=craft.animated[i],row=o.userData.row,col=o.userData.col;o.position.copy(o.userData.target);o.rotation.set(0,0,0);
   if(placing&&o.userData.exercise!==undefined){
    const exercise=o.userData.exercise,course=exercise<2?1:2,order=exercise%2;
    const p=index<3?0:index===3?(course===1?smooth((t-order*.18)/.55):0):index===4?(course===2?smooth((t-order*.18)/.55):1):1;
    o.position.x+=(1-p)*(1.1+col*.1);o.position.y+=(1-p)*(.25+row*.05);
   }
  }
  const affected=craft.animated[6];
  if(index===6){const p=1-smooth((t-.4)/.38);affected.position.y+=p*.12;affected.rotation.z=p*.12;if(craft.biber)affected.position.x+=p*.09}
  else if(!placing&&index===3){affected.position.y+=.1;affected.rotation.z=.10}
  craft.inspect.visible=index>=3;craft.inspect.position.set(-.45+.9*t,.23,.35-.6*(index===5?t:0));craft.inspect.material.color.set(index===6&&t<.5?colors.red:colors.green);
  for(let i=0;i<craft.flow.length;i++){const o=craft.flow[i];o.visible=index>=4;const p=(t+i/craft.flow.length)%1;o.position.set(-.05,.18-.10*p,-.35+.95*p)}
  craft.ruler.visible=index!==4;craft.fasteners.forEach((o,i)=>{o.position.y=.13+(index===4?(1-smooth((t-i*.15)/.5))*.3:0)});
 }
}

window.loadScene=async input=>{
 config={...input};parts=[];water=[];faultParts=[];gapParts=[];craft={};
 if(model){scene.remove(model);dispose(model)}scene.remove(extra);dispose(extra);extra=new THREE.Group();scene.add(extra);
 if(floor){scene.remove(floor);dispose(floor)}
 if(input.typ==='handgriff'){model=null;setupCraft()}
 else{
  const loaded=await loader.loadAsync(input.model);model=loaded.scene;
  if(input.overview){
   // Keep every original roof vertex. Static overview parts need no individual
   // draw calls; joining by their original material makes software GL feasible.
   model=joinOverview(model);
  }
  scene.add(model);model.traverse(o=>{if(o.isMesh){remember(o);parts.push(o)}});
  const b=new THREE.Box3().setFromObject(model);config.bounds=b;center=b.getCenter(v());extent=b.getSize(v()).length();
  radius=extent*1.32;
  if(!input.overview){chooseFault();makeWater()}
 }
 const y=input.typ==='handgriff'?-.8:config.bounds.min.y-.06;
 floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),material(0xd4ddd6));floor.rotation.x=-Math.PI/2;floor.position.y=y;scene.add(floor);
 cameraAt(.5,0);renderer.render(scene,camera);return {parts:parts.length,extent,water:!!config.hasWater,faultParts:faultParts.map(o=>o.userData.part_id),gapParts:gapParts.map(o=>o.userData.part_id)};
};
function framedPoints(){
 const points=[];
 scene.updateMatrixWorld(true);
 const visit=o=>{
  if(!o.visible&&!(config.frameFaultBounds&&o.userData.frameWhenHidden))return;
  if(o.geometry){
   const positions=o.geometry.getAttribute('position');
   for(let i=0;i<positions.count;i++)points.push(v().fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld));
  }else if(o.isSprite){
   const p=o.getWorldPosition(v()),s=o.getWorldScale(v());
   const right=v(1,0,0).applyQuaternion(camera.quaternion),up=v(0,1,0).applyQuaternion(camera.quaternion);
   for(const x of [-.5,.5])for(const y of [-.5,.5])points.push(p.clone().addScaledVector(right,x*s.x).addScaledVector(up,y*s.y));
  }
  for(const child of o.children)visit(child);
 };
 if(model)visit(model);visit(extra);return points;
}
function projection(points){
 camera.updateMatrixWorld(true);
 const a=points.map(p=>p.clone().project(camera));
 const b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 for(const p of a){const x=(p.x+1)*W/2,y=(1-p.y)*H/2;b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y)}return b;
}
function fitAnimatedFrame(){
 const points=framedPoints(),before=projection(points);
 config.framing={adjusted:false,before,after:before};
 // Always solve the same camera fit. Switching abruptly at a safe-area
 // threshold would introduce a visible jump during an otherwise smooth pose.
 // Solve perspective bounds in the camera's existing orientation. This includes
 // every animated layer, loose piece, repair and workshop tile, excluding floor.
 const local=points.map(p=>p.clone().applyMatrix4(camera.matrixWorldInverse));
 const bounds=new THREE.Box3().setFromPoints(local),min=axis=>bounds.min[axis],max=axis=>bounds.max[axis];
 const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanX=tanY*camera.aspect;
 const shiftX=(min('x')+max('x'))/2,depth=-(min('z')+max('z'))/2;
 const shiftY=(min('y')+max('y'))/2-(-.0222222222222222)*depth*tanY;
 let retreat=0;
 for(const p of local){
  retreat=Math.max(retreat,Math.abs(p.x-shiftX)/(tanX*.9625)+p.z);
  const y=p.y-shiftY;retreat=Math.max(retreat,y/(tanY*(y>=0?.6666666666666666:-.7111111111111111))+p.z);
 }
 camera.position.add(v(shiftX,shiftY,Math.max(0,retreat)+extent*.006).applyQuaternion(camera.quaternion));
 camera.updateMatrixWorld(true);config.framing={adjusted:true,before,after:projection(points)};
}
function pose(index,t){
 // Reserve the same geometry bounds while fault parts are revealed/removed.
 // Visibility changes must not make the camera jump between repair states.
 config.frameFaultBounds=config.detailId==='f09'&&index===6;
 if(config.typ==='handgriff')craftFrame(index,t);
 else{
  reset();
  if(config.overview){cameraAt(t,0);model.rotation.y=(t-.5)*.20}
  else{
   let explode=0;
   if(index===1){explode=.3+Math.sin(t*Math.PI)*.6;separate(explode)}
   else if(index===2){explode=1-smooth(t)*.55;separate(explode);waterFrame(t,config.hasWater)}
   else if(index===3){section(smooth(t)*.72);waterFrame(t,config.hasWater)}
   else if(index===4){assemble(t);waterFrame(t,t>.7&&config.hasWater)}
   else if(index===5){section(.42+Math.sin(t*Math.PI)*.12);waterFrame(t,config.hasWater)}
   else if(index===6){fault(t)}
   cameraAt(t,explode);
  }
 }
 fitAnimatedFrame();
 if(config.fixingCallout?.visible)config.fixingCallout.quaternion.copy(camera.quaternion);
}
window.frame=(index,t)=>{pose(index,t);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.92).slice(23)};
window.inspectFrame=(index,t)=>{pose(index,t);return config.framing};
window.ready=true;
