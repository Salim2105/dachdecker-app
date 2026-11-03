#!/usr/bin/env node
/** Resumable 720p/24fps Three/ffmpeg production. No v1/v2 roof media changes.
 * Run: nohup node scripts/praxisvideos/render.cjs --all > /tmp/dach-video-render.log 2>&1 &
 * A single Chromium owns WebGL; ffmpeg is limited to two threads. Chapter
 * source images encode actual mesh transforms, clipping, water and repairs.
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..'),CACHE=process.env.PRAXISVIDEO_CACHE||'/tmp/dach-video-render';
const AUDIO=process.env.PRAXISVIDEO_AUDIO||'/tmp/dach-video-audio',OUT=path.join(ROOT,'public/praxisvideos/v1');
const FRAMES=Number(process.env.PRAXISVIDEO_FRAMES||48),FPS=24,REVISION='three-geometry-015-r1';
const args=process.argv.slice(2),all=args.includes('--all'),selected=args.find(a=>a.startsWith('--id='))?.slice(5)||'dach-steildach-falzziegel-s03';
let browser,server,page,stopping=false;
const log=(event,data={})=>console.log(JSON.stringify({time:new Date().toISOString(),event,...data}));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const atomic=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');fs.renameSync(file+'.tmp',file)};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const exists=file=>fs.existsSync(file);
// Cache identity follows the actual renderer sources, not a manually bumped
// revision. Interrupted runs can never silently reuse obsolete animation.
const SCENE_SHA=sha(path.join(__dirname,'scene.mjs'));
const PIPELINE_SHA=crypto.createHash('sha256').update(sha(__filename)+SCENE_SHA+sha(path.join(__dirname,'scene.html'))).digest('hex');
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
async function command(bin,argv,logfile){
 return await new Promise((resolve,reject)=>{
  const fd=fs.openSync(logfile,'a');const p=spawn(bin,argv,{cwd:ROOT,stdio:['ignore',fd,fd],env:{...process.env,OMP_NUM_THREADS:'2',OPENBLAS_NUM_THREADS:'2'}});
  p.on('error',e=>{fs.closeSync(fd);reject(e)});p.on('exit',code=>{fs.closeSync(fd);code===0?resolve():reject(new Error(bin+' exit '+code+'; '+logfile))});
 });
}
function modelInfo(clip,overview=false){
 if(clip.typ==='handgriff')return {...clip,overview:false,cacheKey:crypto.createHash('sha256').update(REVISION+SCENE_SHA+FRAMES+clip.pfadId+clip.slug).digest('hex').slice(0,24)};
 const model='/public/dach-medien/v2/'+clip.form+'-'+clip.deckung+'/'+(overview?'uebersicht.glb':clip.detailId+'/modell.glb');
 return {typ:clip.typ,form:clip.form,deckung:clip.deckung,detailId:clip.detailId,model,overview,cacheKey:crypto.createHash('sha256').update(REVISION+SCENE_SHA+FRAMES+sha(path.join(ROOT,model))+(overview?'overview':'detail')).digest('hex').slice(0,24)};
}
async function init(){
 fs.mkdirSync(CACHE,{recursive:true});fs.mkdirSync(OUT,{recursive:true});
 const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/tmp/dachdecker-browser/node_modules/playwright');
 server=http.createServer((q,r)=>{
  const url=decodeURIComponent(q.url.split('?')[0]);const file=path.resolve(ROOT,'.'+(url==='/'?'/scripts/praxisvideos/scene.html':url));
  if(!file.startsWith(ROOT+path.sep)){r.writeHead(403);r.end();return}
  try{r.setHeader('Content-Type',/\.(mjs|js)$/.test(file)?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');fs.createReadStream(file).on('error',()=>{r.statusCode=404;r.end()}).pipe(r)}catch(e){r.statusCode=404;r.end(e.message)}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--renderer-process-limit=1','--js-flags=--max-old-space-size=512','--num-raster-threads=2']});
 page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>log('page-error',{error:e.message}));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.ready);
}
async function renderScene(clip,index){
 const info=modelInfo(clip,index===0),dir=path.join(CACHE,'scenes',info.cacheKey,'chapter-'+index),receipt=path.join(dir,'receipt.json');
 if(exists(receipt)){const r=json(receipt);if(r.revision===REVISION&&r.sceneSha===SCENE_SHA&&r.frames===FRAMES&&exists(path.join(dir,`${String(FRAMES-1).padStart(4,'0')}.jpg`)))return dir}
 fs.mkdirSync(dir,{recursive:true});const started=Date.now();
 const geometry=await page.evaluate(input=>window.loadScene(input),info);
 for(let i=0;i<FRAMES;i++){
  const file=path.join(dir,`${String(i).padStart(4,'0')}.jpg`);if(exists(file))continue;
  const data=await page.evaluate(({index,t})=>window.frame(index,t),{index,t:i/(FRAMES-1)});fs.writeFileSync(file,Buffer.from(data,'base64'));
 }
 atomic(receipt,{revision:REVISION,sceneSha:SCENE_SHA,frames:FRAMES,width:1280,height:720,animation:'physical-geometry',chapter:index,model:info.model||'procedural-school-workpiece',modelSha:info.model?sha(path.join(ROOT,info.model)):null,geometry,seconds:(Date.now()-started)/1000});
 log('scene-ready',{id:clip.id,chapter:index,seconds:(Date.now()-started)/1000,cache:info.cacheKey});return dir;
}
function wrap(text,max=62){const words=text.split(/\s+/);let lines=[''];for(const word of words){const last=lines.length-1;if(lines[last].length+word.length+1>max)lines.push(word);else lines[last]+=(lines[last]?' ':'')+word}return lines.join('\n')}
async function encode(clip,dirs){
 const receiptPath=path.join(AUDIO,clip.id,'receipt.json'),audio=path.join(AUDIO,clip.id,'audio.wav');
 while(!exists(receiptPath)||!exists(audio)){if(stopping)throw new Error('Interrupted waiting for audio');log('waiting-audio',{id:clip.id});await wait(15000)}
 const measured=json(receiptPath);if(!measured.kapitel||measured.kapitel.length!==7)throw new Error('Expected seven measured chapters '+receiptPath);
 const duration=Number(measured.dauer);if(!(duration>=45&&duration<=90.01))throw new Error('Measured duration outside 45–90s: '+clip.id+' '+duration);
 const work=path.join(CACHE,'clips',clip.id);fs.mkdirSync(work,{recursive:true});
 const audioSha=sha(audio),sourceSha=crypto.createHash('sha256').update(JSON.stringify({revision:REVISION,pipelineSha:PIPELINE_SHA,sceneSha:SCENE_SHA,visuals:dirs.map(dir=>sha(path.join(dir,'receipt.json'))),clip,frames:FRAMES,audioSha,chapters:measured.kapitel})).digest('hex');
 const finalReceipt=path.join(work,'receipt.json'),output=path.join(OUT,clip.id+'.mp4');
 if(exists(finalReceipt)&&exists(output)&&json(finalReceipt).sourceSha===sourceSha&&json(finalReceipt).sha256===sha(output)){log('clip-cached',{id:clip.id});return}
 const files=[];
 const context=clip.typ==='handgriff'?(clip.pfadId==='biber-doppel'?'Biberschwanz · Doppeldeckung':'Falzziegel'):(clip.form==='steildach'?'Satteldach mit Gaube':clip.form==='walmdach'?'Walmdach':'Flachdach · Warmdach')+(clip.form==='flachdach'?'':clip.deckung==='falzziegel'?' · Falzziegel':' · Biber-Doppeldeckung');
 atomic(path.join(work,'title.txt'),wrap(clip.titel,64));atomic(path.join(work,'context.txt'),context+'  |  Schulmodell');
 for(let i=0;i<7;i++){
  const ch=measured.kapitel[i],seconds=Number(ch.ende)-Number(ch.start),part=path.join(work,'chapter-'+i+'.mp4');
  const key=crypto.createHash('sha256').update(sourceSha+i+seconds).digest('hex');
  if(!(exists(part)&&exists(part+'.json')&&json(part+'.json').key===key)){
   const title=clip.kapitel.find(x=>x.id===ch.id)?.titel||clip.kapitel[i].titel;
   atomic(path.join(work,'chapter.txt'),`${String(i+1).padStart(2,'0')} / 07   ${title}`);
   atomic(path.join(work,'phase.txt'),i===6?'FEHLER SICHTBAR MACHEN  →  BAUTEIL KORRIGIEREN  →  ERNEUT PRÜFEN':i===3?'SCHNITT DURCH DAS 3D-MODELL':i===4?'BAUTEILE IN IHRER REIHENFOLGE ZUSAMMENFÜHREN':i===1?'DIE SCHICHTEN UND IHRE AUFGABEN':i===0?'EINORDNUNG AM DACH / SCHULMODELL':'ANIMATION AM RÄUMLICHEN LEHRMODELL');
   const font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
   const filter=`fps=24,tpad=stop_mode=clone:stop_duration=${seconds},trim=duration=${seconds},setpts=PTS-STARTPTS,drawbox=x=0:y=0:w=iw:h=108:color=0x133b37@0.96:t=fill,drawtext=fontfile=${font}:textfile=${work}/title.txt:fontcolor=white:fontsize=29:x=40:y=18:line_spacing=4,drawtext=fontfile=${font}:textfile=${work}/context.txt:fontcolor=0xb9ddd2:fontsize=18:x=42:y=79,drawbox=x=0:y=628:w=iw:h=92:color=0x133b37@0.96:t=fill,drawtext=fontfile=${font}:textfile=${work}/chapter.txt:fontcolor=white:fontsize=24:x=42:y=642,drawtext=fontfile=${font}:textfile=${work}/phase.txt:fontcolor=0xb9ddd2:fontsize=14:x=43:y=683,format=yuv420p`;
   await command('ffmpeg',['-hide_banner','-loglevel','warning','-y','-threads','2','-filter_threads','2','-framerate',String(FRAMES/Math.min(2,seconds)),'-start_number','0','-i',path.join(dirs[i],'%04d.jpg'),'-vf',filter,'-an','-c:v','libx264','-preset','veryfast','-crf','24','-maxrate','1100k','-bufsize','2200k','-r','24','-t',String(seconds),'-threads','2',part+'.tmp.mp4'],path.join(work,'encode.log'));
   fs.renameSync(part+'.tmp.mp4',part);atomic(part+'.json',{key,seconds});
  }
  files.push(part);
 }
 atomic(path.join(work,'concat.txt'),files.map(file=>'file '+quote(file)).join('\n')+'\n');
 const temp=path.join(OUT,clip.id+'.tmp.mp4');
 await command('ffmpeg',['-hide_banner','-loglevel','warning','-y','-threads','2','-f','concat','-safe','0','-i',path.join(work,'concat.txt'),'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','80k','-ar','44100','-ac','1','-t',String(duration),'-movflags','+faststart',temp],path.join(work,'encode.log'));
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',temp],{encoding:'utf8'}));
 const vs=probe.streams.find(s=>s.codec_type==='video'),as=probe.streams.find(s=>s.codec_type==='audio');
 if(!vs||vs.codec_name!=='h264'||vs.width!==1280||vs.height!==720||vs.avg_frame_rate!=='24/1'||!as||as.codec_name!=='aac'||fs.statSync(temp).size>15*1024*1024||Math.abs(Number(probe.format.duration)-duration)>.35)throw new Error('Invalid final video '+clip.id);
 fs.renameSync(temp,output);
 const poster=path.join(OUT,clip.id+'.webp');await command('ffmpeg',['-hide_banner','-loglevel','warning','-y','-threads','2','-ss',String(measured.kapitel[4].start+1),'-i',output,'-frames:v','1','-c:v','libwebp','-quality','83','-threads','2',poster],path.join(work,'encode.log'));
 atomic(finalReceipt,{id:clip.id,revision:REVISION,pipelineSha:PIPELINE_SHA,sceneSha:SCENE_SHA,sourceSha,audioSha,sha256:sha(output),bytes:fs.statSync(output).size,duration:Number(probe.format.duration),width:1280,height:720,fps:24,videoCodec:'h264',audioCodec:'aac',sourceFramesPerChapter:FRAMES,chapters:measured.kapitel,visualCache:dirs,animation:'48 actual geometry poses at 24fps, then intentional final-pose hold; no blended or invented poses'});
 log('clip-ready',{id:clip.id,seconds:Number(probe.format.duration),bytes:fs.statSync(output).size,output});
}
async function manifest(){
 const clips=json(path.join(ROOT,'content/praxisvideos-inhalte.json')).videos,assets=[];
 for(const clip of clips)for(const [ext,typ] of [['mp4','video'],['webp','bild'],['vtt','untertitel']]){
  const id=clip.id+'.'+ext,file=path.join(OUT,id);if(!exists(file))throw new Error('Manifest incomplete: '+id);assets.push({id,url:'/praxisvideos/v1/'+id,bytes:fs.statSync(file).size,sha256:sha(file),typ});
 }
 atomic(path.join(ROOT,'content/praxisvideos-medien.json'),{version:1,assets});log('manifest-ready',{assets:assets.length});
}
async function main(){
 const lock=path.join(CACHE,'render.lock');fs.mkdirSync(CACHE,{recursive:true});
 if(exists(lock)){const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);throw new Error('Renderer already running PID '+pid)}catch(e){if(e.code!=='ESRCH')throw e}}
 fs.writeFileSync(lock,String(process.pid));
 try{
  if(args.includes('--manifest')){await manifest();return}
  const clips=json(path.join(ROOT,'content/praxisvideos-inhalte.json')).videos;
  const ordered=all?[...clips.filter(c=>c.id===selected),...clips.filter(c=>c.id!==selected)]:clips.filter(c=>c.id===selected);
  if(!ordered.length)throw new Error('Unknown clip '+selected);await init();log('start',{clips:ordered.length,frames:FRAMES,revision:REVISION,pid:process.pid});
  for(const clip of ordered){const dirs=[];for(let i=0;i<7;i++)dirs.push(await renderScene(clip,i));await encode(clip,dirs)}
  if(all){while(json(path.join(ROOT,'content/praxisvideos-inhalte.json')).videos.some(c=>!exists(path.join(OUT,c.id+'.vtt')))){log('waiting-captions');await wait(15000)}await manifest()}
  log('complete',{clips:ordered.length});
 }finally{await browser?.close();server?.close();fs.rmSync(lock,{force:true})}
}
process.on('SIGTERM',()=>{stopping=true;browser?.close();server?.close()});
main().catch(e=>{log('fatal',{error:e.stack});process.exitCode=1});
