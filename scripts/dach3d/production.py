"""Fingerprinted production receipts; never published or mixed with learner data."""
import hashlib, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
STATE=ROOT/'.dach3d-build-state'
# Capture the source used by this Python/Blender process, not whatever happens
# to be on disk after a later edit while a long-running renderer is busy.
SOURCES={name:(ROOT/'scripts/dach3d'/name).read_bytes() for name in ['common.py','details.py','roofs.py','optimize.mjs','production.py']}

def fingerprint(kind,params):
    names=['common.py','optimize.mjs','production.py','roofs.py' if kind=='overview' else 'details.py']
    digest=hashlib.sha256()
    for name in names:digest.update(name.encode());digest.update(SOURCES[name])
    digest.update(json.dumps(params,sort_keys=True).encode())
    return digest.hexdigest()

def receipt_path(kind,variant,detail=None):return STATE/variant/(kind+('-'+detail if detail else '')+'.json')

def complete(kind,variant,detail,params,files):
    try:
        receipt=json.loads(receipt_path(kind,variant,detail).read_text())
        if receipt['fingerprint']!=fingerprint(kind,params) or len(receipt['files'])!=len(files):return False
        for file,record in zip(files,receipt['files']):
            path=pathlib.Path(file);data=path.read_bytes()
            if record['path']!=str(path.relative_to(ROOT)) or len(data)!=record['bytes'] or hashlib.sha256(data).hexdigest()!=record['sha256']:return False
        return True
    except (OSError,ValueError,KeyError,TypeError):return False

def record(kind,variant,detail,params,files):
    records=[]
    for file in files:
        path=pathlib.Path(file);data=path.read_bytes()
        records.append({'path':str(path.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    receipt={'version':1,'kind':kind,'variant':variant,'detail':detail,'fingerprint':fingerprint(kind,params),'params':params,'files':records}
    path=receipt_path(kind,variant,detail);path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(receipt,indent=2)+'\n');temporary.replace(path)

def overview_files(variant):return [ROOT/'public/dach-medien/v1'/variant/'uebersicht.glb',ROOT/'public/dach-medien/v1'/variant/'uebersicht.webp',ROOT/'public/dach-vorschau/v1'/variant/'uebersicht.webp']
