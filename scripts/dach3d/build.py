"""Reproduce the own Blender teaching media with two two-thread workers.

Requires Blender 4.3+, Node.js and npm ci. Run python3 scripts/dach3d/build.py.
--resume retains already complete renders after an interrupted production run.
All output is public own teaching geometry. Private learner media is untouched.
"""
import argparse, concurrent.futures, datetime, json, os, pathlib, shutil, struct, subprocess, time
from production import complete as production_complete,overview_files

ROOT=pathlib.Path(__file__).resolve().parents[2]
MEDIA=ROOT/'public/dach-medien/v1'
PREVIEW=ROOT/'public/dach-vorschau/v1'
VARIANTS=['steildach-falzziegel','steildach-biber-doppel','walmdach-falzziegel','walmdach-biber-doppel','flachdach-warmdach']
SHARED=['g%02d'%i for i in range(1,7)]
HIP_SHARED=SHARED+['s01','s02','s03','s05','s07','s08','s09','s11']+['a01','a02','a03','a04']
STEEP=SHARED+['s%02d'%i for i in range(1,12)]+['a01','a02','a03','a04']
FLAT=SHARED+['f%02d'%i for i in range(1,10)]+['a01','a03','a04']

def note(event,**data):
    print(json.dumps({'event':event,'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),**data}),flush=True)

def command(name,args,logs):
    start=time.time();log=logs/(name+'.log');note('start',job=name,log=str(log))
    with log.open('w') as output:
        process=subprocess.run(args,cwd=ROOT,stdout=output,stderr=subprocess.STDOUT)
    if process.returncode:
        note('failed',job=name,returncode=process.returncode,tail=log.read_text()[-4000:])
        raise RuntimeError(name+' failed; see '+str(log))
    note('done',job=name,seconds=round(time.time()-start,1))

def verify_overviews():
    for variant in VARIANTS:
        path=MEDIA/variant/'uebersicht.glb';raw=path.read_bytes()
        doc=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
        mesh_triangles=[sum(doc['accessors'][p.get('indices',p['attributes']['POSITION'])]['count']//3 for p in m['primitives']) for m in doc['meshes']]
        triangles=sum(mesh_triangles[n['mesh']] for n in doc['nodes'] if 'mesh' in n)
        if len(raw)>6*1024*1024 or triangles>100000:raise RuntimeError('Overview budget exceeded: '+variant+' '+str((len(raw),triangles)))
        note('overview-verified',variant=variant,bytes=len(raw),triangles=triangles)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--resume',action='store_true');parser.add_argument('--samples',type=int,default=8);parser.add_argument('--width',type=int,default=960);parser.add_argument('--logs',default='/tmp/dach3d-production');opts=parser.parse_args()
    logs=pathlib.Path(opts.logs);logs.mkdir(parents=True,exist_ok=True)
    note('production-start',samples=opts.samples,width=opts.width,resume=opts.resume)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        jobs=[]
        for variant in VARIANTS:
            if opts.resume and production_complete('overview',variant,None,{'samples':16,'width':1200},overview_files(variant)):continue
            args=['blender','-b','-t','2','--python','scripts/dach3d/roofs.py','--',variant,'--samples','16','--width','1200']
            jobs.append(pool.submit(command,'overview-'+variant,args,logs))
        for job in concurrent.futures.as_completed(jobs):job.result()
    verify_overviews()
    detail_jobs=[(VARIANTS[0],STEEP),(VARIANTS[1],STEEP),(VARIANTS[4],FLAT),(VARIANTS[2],['w01','w02','w03','w04']),(VARIANTS[3],['w01','w02','w03','w04'])]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        jobs=[]
        for variant,details in detail_jobs:
            args=['blender','-b','-t','2','--python','scripts/dach3d/details.py','--','--variant',variant,'--details',','.join(details),'--samples',str(opts.samples),'--width',str(opts.width)]
            if opts.resume:args.append('--skip-existing')
            jobs.append(pool.submit(command,'details-'+variant,args,logs))
        for job in concurrent.futures.as_completed(jobs):job.result()
    # Repeated junctions use one physical construction. Reuse those exact bytes
    # for the hipped roof; only its genuinely different hip topics are rebuilt.
    for deck in ['falzziegel','biber-doppel']:
        source='steildach-'+deck;target='walmdach-'+deck
        for detail in HIP_SHARED:
            out=MEDIA/target/detail;out.mkdir(parents=True,exist_ok=True)
            for file in ['modell.glb','nah.webp','schnitt.webp','aufbau.webp','fehler.webp']:shutil.copyfile(MEDIA/source/detail/file,out/file)
            for view in ['nah','schnitt','aufbau','fehler']:
                (PREVIEW/target).mkdir(parents=True,exist_ok=True)
                shutil.copyfile(PREVIEW/source/(detail+'-'+view+'.webp'),PREVIEW/target/(detail+'-'+view+'.webp'))
    command('manifest',['node','scripts/dach3d/manifest.mjs'],logs)
    command('validation',['node','scripts/dach3d/check.mjs'],logs)
    note('production-complete',contexts=104,optionalFiles=530,previews=421)

if __name__=='__main__':main()
