"""Non-rendering construction and fault audit for Blender 4.3+.

Run: blender -b -t 2 --python scripts/dach3d/audit_geometry.py --
     [--variant flachdach-warmdach] [--details g06,f02] [--report /tmp/audit.json]

This checks actual scene construction, real comparison changes and the fall
surface numerics. It does not replace a trade review or visual learner test.
"""
import argparse, json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import details


def state():
    return {o.name: (o.hide_render, tuple(round(n, 6) for row in o.matrix_world for n in row),
                    len(o.data.vertices) if o.type == 'MESH' else 0)
            for o in bpy.context.scene.objects}


def check_visible_deck(parts,detail):
    """Check actual tile geometry against the actual supporting plane.

    The prior rounded height formulas passed the part-count audit while
    burying most of each tile in the timber. Plane clearance catches that
    visible construction error without repeating the tile height formula.
    """
    if detail in ['s06','w01','w02','w03','w04']:
        support_suffix='unterlage' if detail=='s06' else 'walmflaeche'
        supports=[o for o in parts if o.get('part_id')==detail+'-'+support_suffix]
        assert len(supports)==2,'Both adjoining roof supports must exist'
        planes=[]
        for ob in supports:
            pts=[ob.matrix_world@v.co for v in list(ob.data.vertices)[:4]]
            normal=(pts[1]-pts[0]).cross(pts[2]-pts[0]).normalized()
            if normal.z<0:normal=-normal
            planes.append((sum(p.x for p in pts)/len(pts),pts[0],normal))
        for ob in [o for o in parts if o.get('part_id')==detail+'-ziegel']:
            vertices=[ob.matrix_world@v.co for v in ob.data.vertices]
            mean_x=sum(p.x for p in vertices)/len(vertices)
            _,origin,normal=min(planes,key=lambda p:abs(p[0]-mean_x))
            assert min((p-origin).dot(normal) for p in vertices)>.004,'A deck tile intersects its roof support: '+ob.name
    if detail=='s10':
        connectors=[o for o in parts if o.get('part_id')=='s10-wangenanschluss']
        assert len(connectors)==4,'Both cheeks need an apron and upstand'
        for ob in connectors:
            points=[ob.matrix_world@v.co for v in ob.data.vertices]
            assert min(abs(p.x) for p in points)>=.665,'Cheek connector crosses the dormer roof'
            assert all(.64<=p.y<=1.43 for p in points),'Cheek connector leaves its wall junction'
    if detail=='f05':
        caps=[o for o in parts if o.name in ['Attikaabdeckung mit Überstand','Attikaabdeckung Ecke']]
        assert len(caps)==2,'Both parapet caps must exist'
        ranges=[]
        for ob in caps:
            points=[ob.matrix_world@v.co for v in ob.data.vertices]
            ranges.append((min(p.x for p in points),max(p.x for p in points)))
        overlap=min(r[1] for r in ranges)-max(r[0] for r in ranges)
        assert abs(overlap)<1e-6,'Parapet corner caps must meet without coplanar overlap or an open gap'


def open_notablauf(parts):
    """A physical ray through the intended opening must remain unobstructed."""
    origin=details.Vector((0,1.0,.64));direction=details.Vector((0,1,0))
    for ob in parts:
        if ob.type!='MESH' or ob.hide_render:continue
        inverse=ob.matrix_world.inverted()
        hit=ob.ray_cast(inverse@origin,(inverse.to_3x3()@direction).normalized(),distance=2)
        if hit[0]:return False
    return True
    if detail=='s11':
        form=next(o for o in parts if o.name=='Dachformteil mit Anschlussflansch')
        boot=next(o for o in parts if o.name=='Dichtmanschette am Rohr')
        pipe=next(o for o in parts if o.name=='Entlüftungsrohr')
        lower=next(o for o in parts if o.name=='Unterdeckungs-Manschette')
        center=form.matrix_world.translation
        pipe_points=[pipe.matrix_world@v.co for v in pipe.data.vertices]
        for axis in [0,1]:
            pipe_center=sum(p[axis] for p in pipe_points)/len(pipe_points)
            assert abs(pipe_center-center[axis])<1e-5,'Pipe and form tile axes differ'
        assert abs(lower.matrix_world.translation.y-center.y)<1e-5,'Lower boot has a different pipe axis'
        boot_points=[boot.matrix_world@v.co for v in boot.data.vertices]
        form_points=[form.matrix_world@v.co for v in form.data.vertices]
        assert max(p.z for p in boot_points)>max(p.z for p in form_points)+.01,'The seal is concealed below the form tile'
        inv=form.matrix_world.inverted()
        hit,*_=form.ray_cast(inv@(center+Vector((0,0,.5))),(inv.to_3x3()@Vector((0,0,-1))).normalized())
        assert not hit,'The ceramic closes the supposed annular pipe opening'
        inv=lower.matrix_world.inverted()
        hit,*_=lower.ray_cast(inv@(center+Vector((.125,0,.5))),(inv.to_3x3()@Vector((0,0,-1))).normalized())
        assert hit,'The lower boot does not bridge the annular opening to the pipe'


def main():
    argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    parser=argparse.ArgumentParser()
    parser.add_argument('--variant',choices=details.VARIANTS)
    parser.add_argument('--details')
    parser.add_argument('--report',default='/tmp/dach3d-geometrie-audit.json')
    args=parser.parse_args(argv)
    for low in [(.55,.72),(.60,.27)]:
        assert abs(details.fall_height(*low,low=low)-.42)<1e-9
        for i in range(101):
            for j in range(101):
                x=-1.1+2.2*i/100;y=1.85*j/100
                z=details.fall_height(x,y,low=low)
                assert .42-1e-8<=z<=.57+1e-8
                if math.hypot(x-low[0],y-low[1])>.001:assert z>.42
    # The defined Biber training tile really covers two 150 mm row pitches,
    # leaving 80 mm headlap. The formed slope separates the 11 mm clay layers.
    assert abs(.38-2*.15-.08)<1e-9
    assert .032*.15/.38+.001>.011
    report=[]
    for variant in [args.variant] if args.variant else details.VARIANTS:
        for detail in args.details.split(',') if args.details else details.ids_for(variant):
            if detail not in details.ids_for(variant):continue
            try:
                parts=details.detail_scene(detail,variant)
                assert parts and all(o.get('detail_id')==detail and o.get('part_id','').startswith(detail+'-') for o in parts)
                bpy.context.view_layer.update()
                check_visible_deck(parts,detail)
                details.teaching_exposure(detail,parts)
                bpy.context.view_layer.update()
                if detail=='f04':assert open_notablauf(parts),'The correct emergency outlet is already blocked'
                before=state()
                details.apply_fault(detail,parts)
                bpy.context.view_layer.update()
                assert state()!=before,'The fault view did not change any physical part'
                if detail=='f04':assert not open_notablauf(list(details.PARTS)),'The fault does not block the actual emergency opening'
                report.append({'variant':variant,'detail':detail,'parts':len(parts),'ok':True})
                print('AUDIT_OK',variant,detail,flush=True)
            except Exception as error:
                report.append({'variant':variant,'detail':detail,'ok':False,'error':str(error)})
                print('AUDIT_ERROR',variant,detail,str(error),flush=True)
    with open(args.report,'w') as out:json.dump(report,out,indent=2)
    failed=sum(not r['ok'] for r in report)
    print('AUDIT_DONE',len(report),failed,flush=True)
    if failed:raise RuntimeError('Geometry audit failed for '+str(failed)+' contexts')


if __name__=='__main__':main()
