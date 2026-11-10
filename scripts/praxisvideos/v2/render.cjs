#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- This production CLI is intentionally CommonJS. */
/** Full-timeline 1080p/30fps workshop films; production-only dependencies. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..'),BUILD=path.join(ROOT,'.praxisvideo-production/v2'),OUT=path.join(ROOT,'public/praxisvideos/v2');
const FPS=30,WIDTH=1920,HEIGHT=1080,args=process.argv.slice(2),preview=args.includes('--preview')||args.includes('--stills');
const backend=args.find(a=>a.startsWith('--backend='))?.slice(10)||'mesa-egl';
if(!['mesa-egl','swiftshader'].includes(backend))throw new Error('Unknown rendering backend: '+backend);
const backendEnv=backend==='mesa-egl'?{EGL_PLATFORM:'surfaceless',LP_NUM_THREADS:'4',MESA_NO_ERROR:'1'}:{};
const backendFlags=backend==='mesa-egl'?['--use-gl=angle','--use-angle=gl-egl','--ozone-platform=headless','--enable-webgl','--ignore-gpu-blocklist']:['--enable-unsafe-swiftshader','--use-angle=swiftshader'];
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const atomic=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');fs.renameSync(file+'.tmp',file)};
const log=(event,data={})=>console.log(JSON.stringify({time:new Date().toISOString(),event,...data}));
const artifacts={sources:Object.fromEntries(['scene.mjs','scene.html','render.cjs','models.py','content.mjs'].map(f=>[f,sha(path.join(__dirname,f))])),models:Object.fromEntries(['bench','tile','tile-cut','marking','cutting'].map(f=>[f,sha(path.join(BUILD,'models',f+'.glb'))])),system:sha(path.join(BUILD,'system.json')),light:sha(path.join(ROOT,'public/dach-medien/v2/gemeinsam/royal_esplanade_1k.hdr'))};
let sourceSha,renderProfile,browser,server,page;
async function command(bin,argv,file){return new Promise((resolve,reject)=>{const fd=fs.openSync(file,'a'),p=spawn(bin,argv,{cwd:ROOT,stdio:['ignore',fd,fd]});p.on('error',e=>{fs.closeSync(fd);reject(e)});p.on('exit',code=>{fs.closeSync(fd);if(code===0)resolve();else reject(new Error(`${bin} exit ${code}; ${file}`))})})}
async function init(){
 fs.mkdirSync(BUILD,{recursive:true});fs.mkdirSync(OUT,{recursive:true});
 const {chromium}=require(path.join(ROOT,'.praxisvideo-production/browser/node_modules/playwright'));
 server=http.createServer((req,res)=>{try{const input=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(ROOT,'.'+(input==='/'?'/scripts/praxisvideos/v2/scene.html':input));if(!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}res.setHeader('Content-Type',/\.(mjs|js)$/.test(file)?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end()}).pipe(res)}catch{res.writeHead(400).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,env:{...process.env,...backendEnv},args:['--no-sandbox','--disable-dev-shm-usage','--renderer-process-limit=1','--js-flags=--max-old-space-size=768','--num-raster-threads=2',...backendFlags]});
 page=await browser.newPage({viewport:{width:WIDTH,height:HEIGHT}});page.on('pageerror',e=>log('page-error',{message:e.message}));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.ready||window.productionError,null,{timeout:120000});const error=await page.evaluate(()=>window.productionError);if(error)throw new Error(error);
 const graphics=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),info=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:info&&gl.getParameter(info.UNMASKED_VENDOR_WEBGL),renderer:info&&gl.getParameter(info.UNMASKED_RENDERER_WEBGL),version:gl.getParameter(gl.VERSION),shading:gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}});
 if(backend==='mesa-egl'&&!String(graphics.vendor).includes('Mesa'))throw new Error('Mesa/EGL renderer unavailable; explicitly select --backend=swiftshader for the slower fallback.');
 renderProfile={backend,environment:backendEnv,flags:backendFlags,chromium:browser.version(),graphics,width:WIDTH,height:HEIGHT,fps:FPS};
 sourceSha=hash(JSON.stringify({artifacts,renderProfile}));log('renderer-ready',{sourceSha,renderProfile});
}
const encoder=['-c:v','libx264','-preset','veryfast','-crf','20','-profile:v','high','-level:v','4.1','-maxrate','2100k','-bufsize','4200k','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-threads','2'];
async function picture(clip,seconds,file){const frame=await page.evaluate(({seconds})=>window.frame(seconds),{seconds});fs.mkdirSync(path.dirname(file),{recursive:true});const bytes=Buffer.from(frame,'base64');fs.writeFileSync(file+'.tmp',bytes);fs.renameSync(file+'.tmp',file)}
async function makePreview(clips){
 const folder=path.join(BUILD,'preview');fs.mkdirSync(folder,{recursive:true});
 for(const c of clips){await page.evaluate(c=>window.loadClip(c),c);const index=c.slug==='schnitt'?3:4,k=c.kapitel[index],seconds=k.start+(k.ende-k.start)*.7;await picture(c,seconds,path.join(folder,c.slug+'.jpg'));log('still-ready',{id:c.id,seconds,file:path.join(folder,c.slug+'.jpg')})}
 if(args.includes('--stills')){atomic(path.join(folder,'stills-receipt.json'),{sourceSha,renderProfile,artifacts});return}
 const c=clips.find(c=>c.slug==='bearbeiten');await page.evaluate(c=>window.loadClip(c),c);
 const start=c.kapitel[4].start,frames=300,dir=path.join(folder,'frames-'+sourceSha.slice(0,12));fs.mkdirSync(dir,{recursive:true});const began=Date.now();
 for(let f=0;f<frames;f++){const file=path.join(dir,String(f).padStart(6,'0')+'.jpg');if(!fs.existsSync(file))await picture(c,start+f/FPS,file);if((f+1)%30===0)log('preview-progress',{frame:f+1,total:frames,seconds:(Date.now()-began)/1000})}
 const output=path.join(folder,'schneiden-10s.mp4');await command('ffmpeg',['-hide_banner','-loglevel','warning','-y','-framerate',String(FPS),'-i',path.join(dir,'%06d.jpg'),'-ss',String(start),'-i',path.join(BUILD,'audio',c.id,'audio.wav'),'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=full:out_range=tv,format=yuv420p',...encoder,'-c:a','aac','-b:a','96k','-ar','44100','-ac','1','-t','10','-movflags','+faststart',output],path.join(folder,'encode.log'));
 atomic(path.join(folder,'receipt.json'),{sourceSha,renderProfile,artifacts,frames,width:WIDTH,height:HEIGHT,fps:FPS,seconds:(Date.now()-began)/1000,output,sha256:sha(output),sampleClip:c.id,sampleStart:start});log('preview-ready',{output,renderSeconds:(Date.now()-began)/1000});
}
async function makeFilm(c){
 const work=path.join(BUILD,'render',c.id),audio=path.join(BUILD,'audio',c.id,'audio.wav'),voice=json(path.join(BUILD,'audio',c.id,'receipt.json'));
 if(voice.audioSha256!==sha(audio)||voice.dauer!==c.dauer)throw new Error('Measured narration mismatch: '+c.id);
 const signature=hash(sourceSha+JSON.stringify(c)+voice.audioSha256),dir=path.join(work,signature.slice(0,20));fs.mkdirSync(dir,{recursive:true});
 const final=path.join(OUT,c.id+'.mp4'),receiptFile=path.join(work,'receipt.json');
 if(fs.existsSync(receiptFile)&&fs.existsSync(final)){const old=json(receiptFile);if(old.signature===signature&&old.sha256===sha(final)){log('cached',{id:c.id});return}}
 await page.evaluate(c=>window.loadClip(c),c);const frames=Math.ceil(c.dauer*FPS),start=Date.now();
 for(let f=0;f<frames;f++){
  const file=path.join(dir,String(f).padStart(6,'0')+'.jpg');if(!fs.existsSync(file))await picture(c,f/FPS,file);
  if((f+1)%150===0)log('frames',{id:c.id,frame:f+1,total:frames,seconds:(Date.now()-start)/1000});
 }
 atomic(path.join(dir,'receipt.json'),{signature,sourceSha,renderProfile,artifacts,frames,width:WIDTH,height:HEIGHT,fps:FPS,timeline:'one actually rendered frame for every 1/30 second; no repeated end-pose padding',clip:c.id});
 const temporary=path.join(OUT,c.id+'.tmp.mp4');
 await command('ffmpeg',['-hide_banner','-loglevel','warning','-y','-framerate',String(FPS),'-i',path.join(dir,'%06d.jpg'),'-i',audio,'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=full:out_range=tv,format=yuv420p',...encoder,'-c:a','aac','-b:a','96k','-ar','44100','-ac','1','-t',String(c.dauer),'-movflags','+faststart',temporary],path.join(work,'encode.log'));
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',temporary],{encoding:'utf8'}));const v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
 if(v?.codec_name!=='h264'||v.width!==WIDTH||v.height!==HEIGHT||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==frames||a?.codec_name!=='aac'||Math.abs(Number(probe.format.duration)-c.dauer)>.1||fs.statSync(temporary).size>25*1024*1024)throw new Error('Final film inspection failed: '+c.id);
 fs.renameSync(temporary,final);const chapter=c.kapitel[c.slug==='schnitt'?3:4],posterTime=chapter.start+(chapter.ende-chapter.start)*.90;
 await command('ffmpeg',['-hide_banner','-loglevel','warning','-y','-threads','1','-ss',String(posterTime),'-i',final,'-frames:v','1','-c:v','libwebp','-quality','86','-threads','1',path.join(OUT,c.id+'.webp')],path.join(work,'encode.log'));
 atomic(receiptFile,{id:c.id,version:2,signature,sourceSha,renderProfile,artifacts,audioSha256:voice.audioSha256,sha256:sha(final),bytes:fs.statSync(final).size,duration:Number(probe.format.duration),width:WIDTH,height:HEIGHT,fps:FPS,frames,sourceFrames:frames,framesDirectory:dir,posterTime,chapters:c.kapitel.map(k=>({id:k.id,start:k.start,ende:k.ende})),modelSystem:'werkstatt-system-falzziegel',productionSeconds:(Date.now()-start)/1000});log('film-ready',{id:c.id,frames,bytes:fs.statSync(final).size,seconds:(Date.now()-start)/1000});
}
(async()=>{
 const clips=json(path.join(BUILD,'content.json')).videos;await init();
 if(preview)await makePreview(clips);else{const id=args.find(a=>a.startsWith('--id='))?.slice(5);for(const c of clips.filter(c=>!id||c.id===id))await makeFilm(c)}
 log('complete',{preview});
})().catch(e=>{log('fatal',{message:e.stack});process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
