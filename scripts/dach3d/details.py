"""Reproducible own close-up roof teaching assets, Blender 4.3+.

No third-party geometry or textures. All dimensions are metres and refer only to
these explicit teaching constructions. The renderer, GLB and fixed views share
exactly the same scene. Run: blender -b --python scripts/dach3d/details.py --
  --variant steildach-falzziegel --detail s03 --samples 24 --views nah,schnitt,aufbau,fehler
"""
import os, sys, math, json, argparse, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from common import reset_scene, make_materials, material, box, cylinder, mesh, tag, beam_between, pipe_between, setup_render, export_glb, render_webp
from production import complete as production_complete,record as production_record

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
MEDIA = os.path.join(ROOT, 'public/dach-medien/v1')
PREVIEW = os.path.join(ROOT, 'public/dach-vorschau/v1')
VARIANTS = ['steildach-falzziegel','steildach-biber-doppel','walmdach-falzziegel','walmdach-biber-doppel','flachdach-warmdach']
SHARED = ['g%02d'%i for i in range(1,7)]
STEEP = ['s%02d'%i for i in range(1,12)]
HIP_SHARED = ['s01','s02','s03','s05','s07','s08','s09','s11']
HIP = ['w%02d'%i for i in range(1,5)]
FLAT = ['f%02d'%i for i in range(1,10)]
EQUIPMENT = ['a01','a02','a03','a04']
SLOPE = math.radians(30)
M = None
DETAIL = None
BIBER = False
FLACH = False
PARTS = []
WATER = []


def ids_for(variant):
    return SHARED + (FLAT if variant.startswith('flachdach') else HIP_SHARED+HIP if variant.startswith('walmdach') else STEEP) + (['a01','a03','a04'] if variant.startswith('flachdach') else EQUIPMENT)


def part(obj, suffix, layer=None, step=0):
    tag(obj, DETAIL, layer, step, part_id=DETAIL+'-'+suffix)
    PARTS.append(obj)
    return obj


def cb(name, loc, size, mat='wood', suffix='untergrund', layer='tragwerk', step=0, bevel=.012, rotation=None):
    return part(box(name, loc, size, M[mat], bevel=bevel, rotation=rotation),suffix,layer,step)


def cy(name, loc, radius, depth, mat='metal', suffix='befestigung', layer=None, step=3, rotation=None, vertices=24):
    return part(cylinder(name, loc, radius, depth, M[mat], rotation=rotation,vertices=vertices),suffix,layer,step)


def cm(name, verts, faces, mat='zinc', suffix='anschluss', layer=None, step=2):
    return part(mesh(name, verts, faces, M[mat]),suffix,layer,step)


def line(name, a, b, width=.015, depth=.015, mat='metal', suffix='befestigung', layer=None, step=3):
    return part(beam_between(name,a,b,width,depth,M[mat]),suffix,layer,step)


def pipe(name, a, b, radius=.025, mat='zinc', suffix='anschluss', layer=None, step=3):
    return part(pipe_between(name,a,b,radius,M[mat],vertices=20),suffix,layer,step)


def tube(name,loc,radius,depth,mat='zinc',suffix='stutzen',step=3,inner_radius=None):
    x,y,z=loc;n=28;verts=[]
    for zz in [z-depth/2,z+depth/2]:
        for r in [radius,inner_radius if inner_radius is not None else radius-.004]:
            verts.extend([(x+r*math.cos(i*2*math.pi/n),y+r*math.sin(i*2*math.pi/n),zz) for i in range(n)])
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,2*n+j,2*n+i),(n+i,3*n+i,3*n+j,n+j),(2*n+i,2*n+j,3*n+j,3*n+i),(i,n+i,n+j,j)])
    return cm(name,verts,faces,mat,suffix,None,step)


def xyz(x,y,z=0, base=.65, slope=SLOPE):
    return (x, y*math.cos(slope)-z*math.sin(slope), base+y*math.sin(slope)+z*math.cos(slope))


def sb(name,x,y,z,size,mat='wood',suffix='untergrund',layer='tragwerk',step=0,base=.65):
    return cb(name,xyz(x,y,z,base),size,mat,suffix,layer,step,rotation=(SLOPE,0,0))


def water(points):
    for i,p in enumerate(points):
        ob=bpy.data.objects.new('Wasser_'+str(i),None);bpy.context.collection.objects.link(ob);ob.location=p;ob['water_step']=i;ob['detail_id']=DETAIL
    WATER.extend(points)


def solid_polygon(name, polygon, thickness, mat, suffix, layer='deckung', step=3):
    # polygon has local x/y/z coordinates, closed volume is exported with proper edge faces.
    n=len(polygon); verts=polygon+[(x,y,z-thickness) for x,y,z in polygon]
    faces=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return cm(name,verts,faces,mat,suffix,layer,step)


def tile(x,y,z=.12, width=None, length=None, suffix='deckung', slope=SLOPE, base=.65, clipped=None, angle=0):
    width=width or (.178 if BIBER else .28);length=length or (.38 if BIBER else .42)
    # local foot is y=0; the upper hooked end is y=length. Real lap is achieved by row spacing.
    if BIBER:
        r=width/2; pts=[(-width/2,length),(-width/2,r)]
        pts += [(r*math.cos(t),r+r*math.sin(t)) for t in [math.pi+i*math.pi/12 for i in range(13)]]
        pts += [(width/2,length)]
    else: pts=[(-width/2,0),(-width/2,length),(width/2,length),(width/2,0)]
    coords=[]
    for xx,yy in pts:
        # Mild formed ceramic profile, not a flat orange rectangle.
        # A real shingle inclination lifts the foot above the next tile head.
        # At a 150 mm Biber pitch this gives >11 mm separation for 11 mm clay,
        # including the third covering layer; the surfaces do not interpenetrate.
        zz=z+.032*(1-yy/length)+(0 if BIBER else .016*math.sin((xx/width+.5)*2*math.pi))
        px=x+xx*math.cos(angle)-yy*math.sin(angle);py=y+xx*math.sin(angle)+yy*math.cos(angle)
        coords.append(xyz(px,py,zz,base,slope))
    ob=solid_polygon('Biberschwanz Rundschnitt' if BIBER else 'Falzziegel geformt',coords,.011,'ceramic_dark' if (round(x*100)+round(y*100))%11==0 else 'ceramic',suffix,'deckung',3)
    if not BIBER:
        for xx in [-width/2+.014,width/2-.014]:
            a=xyz(x+xx,y+.035,z+.025,base,slope);b=xyz(x+xx,y+length-.025,z+.025,base,slope)
            line('Geformter Seitenfalz',a,b,.014,.013,'ceramic',suffix,'deckung',3)
        a=xyz(x-width*.43,y+length-.025,z+.035,base,slope);b=xyz(x+width*.43,y+length-.025,z+.035,base,slope)
        line('Kopffalz',a,b,.018,.015,'ceramic',suffix,'deckung',3)
    return ob


def slope_patch(width=2.05,length=1.65,deck=True,cut=None,base=.65,full=True):
    # Separate material layers and edge faces remain visible in both GLB and rendered cutaway.
    sb('Dampfbremse luftdichte Ebene',0,length/2,-.23,(width,length,.006),'seal','luftdichtheit','luftdichtheit',0,base)
    sb('Mineralische Wärmedämmung',0,length/2,-.135,(width,length,.17),'insulation','daemmung','daemmung',1,base)
    for x in [-width*.42,0,width*.42]:
        sb('Sparren und Auflager',x,length/2,-.15,(.075,length+.08,.19),'wood','sparren','tragwerk',0,base)
    sb('Unterdeckung durchgehend',0,length/2,-.035,(width+.04,length+.04,.009),'membrane','zusatzebene','zusatzebene',2,base)
    for x in [-width*.42,0,width*.42]:
        sb('Konterlatte',x,length/2,.0,(.055,length,.04),'wood','lattung','lattung',2,base)
    pitch=.15 if BIBER else .34
    rows=max(2,int((length-.2)/pitch))
    for row in range(rows+1):
        y=.08+row*pitch
        sb('Traglatte Reihe %d'%(row+1),0,y,.045,(width,.035,.035),'wood','lattung','lattung',2,base)
        # A restrained number of real fixings per teaching patch, all decorative model details.
        for x in [-width*.42,0,width*.42]:
            pos=xyz(x,y,.065,base); screw=cy('Lattenbefestigung',pos,.006,.03,'metal','befestigung','lattung',2,rotation=(SLOPE,0,0),vertices=8)
    if deck:
        effective=.18 if BIBER else .24
        cols=int(width/effective)
        for row in range(rows):
            y=-.10+row*pitch
            offset=effective/2 if BIBER and row%2 else 0
            for col in range(cols):
                x=-width/2+effective/2+col*effective+offset
                if x+effective/2>width/2: continue
                if cut and cut(x,y): continue
                tile(x,y,.105+row*.001,suffix='deckziegel',base=base)
    return width,length


def fall_height(x,y,width=2.2,length=1.85,low=(.55,.72)):
    """Height on four planar fall faces meeting at the actual drain low point."""
    corners=[(-width/2,0),(width/2,0),(width/2,length),(-width/2,length)]
    for i,a in enumerate(corners):
        b=corners[(i+1)%4];cx,cy=low
        det=(a[1]-b[1])*(cx-b[0])+(b[0]-a[0])*(cy-b[1])
        w=((a[1]-b[1])*(x-b[0])+(b[0]-a[0])*(y-b[1]))/det
        u=((b[1]-cy)*(x-b[0])+(cx-b[0])*(y-b[1]))/det
        v=1-w-u
        if min(w,u,v)>=-.00001:return .42*w+.57*(u+v)
    raise ValueError('Point outside fall teaching field')


def fall_layer(name,width,length,low,bottom,mat,suffix,layer,step):
    top=[(-width/2,0,.57),(width/2,0,.57),(width/2,length,.57),(-width/2,length,.57),(low[0],low[1],.42)]
    underside=[(x,y,z-bottom if bottom<.1 else bottom) for x,y,z in top]
    faces=[(4,i,(i+1)%4) for i in range(4)]+[(9,(i+1)%4+5,i+5) for i in range(4)]+[(i,i+5,(i+1)%4+5,(i+1)%4) for i in range(4)]
    return cm(name,top+underside,faces,mat,suffix,layer,step)


def flat_patch(width=2.2,length=1.85,membrane=True,fall=False,drain_point=(.55,.72)):
    cb('Beton-Tragschale',(0,length/2,.12),(width,length,.22),'concrete','untergrund','tragwerk',0)
    cb('Dampfbremse',(0,length/2,.24),(width,length,.008),'seal','luftdichtheit','luftdichtheit',0,bevel=0)
    if fall:
        fall_layer('Gefälledämmung zum Tiefpunkt',width,length,drain_point,.245,'insulation','gefaelle','daemmung',1)
    else:cb('Wärmedämmung',(0,length/2,.35),(width,length,.21),'insulation','daemmung','daemmung',1)
    if membrane:
        if fall:fall_layer('Abdichtung mit Gefälle zum Ablauf',width,length,drain_point,.013,'membrane','abdichtung','deckung',2)
        else:cb('Abdichtungsfläche',(0,length/2,.465),(width+.02,length+.02,.015),'membrane','abdichtung','deckung',2,bevel=.005)
        for y in [.55,1.10]:
            if fall:
                breaks=[-width/2,width/2]
                for xx,yy in [(-width/2,0),(width/2,0),(width/2,length),(-width/2,length)]:
                    if (y-drain_point[1])*(y-yy)<0:
                        t=(y-drain_point[1])/(yy-drain_point[1]);breaks.append(drain_point[0]+t*(xx-drain_point[0]))
                breaks=sorted(set(breaks))
                for a,b in zip(breaks,breaks[1:]):line('Überdeckte Bahnennaht auf Gefälle',(a,y,fall_height(a,y,width,length,drain_point)+.008),(b,y,fall_height(b,y,width,length,drain_point)+.008),.085,.006,'membrane','naht','deckung',3)
            else:cb('Überdeckte Bahnennaht',(0,y,.478),(width,.085,.006),'membrane','naht','deckung',3,bevel=.002)
    return width,length


def gutter(width=2.3, suffix='rinne', y=-.24,z=.61,downpipe=True):
    r=.13;segments=22;verts=[]
    for x in [-width/2,width/2]:
        for rad in [r,r-.004]:
            for i in range(segments+1):
                a=math.pi+i*math.pi/segments;verts.append((x,y+rad*math.cos(a),z+rad*math.sin(a)))
    n=segments+1;faces=[]
    for i in range(segments):
        faces += [(i,i+1,2*n+i+1,2*n+i),(n+i,3*n+i,3*n+i+1,n+i+1)]
    faces += [(0,2*n,3*n,n),(n-1,2*n-1,4*n-1,3*n-1)]
    for i in range(segments):faces += [(i,n+i,n+i+1,i+1),(2*n+i,2*n+i+1,3*n+i+1,3*n+i)]
    ob=cm('Halbrunde Dachrinne mit Materialstärke',verts,faces,'zinc',suffix,None,3)
    for edge_y in [y-r,y+r]:pipe('Gerollter Rinnenrand',(-width/2,edge_y,z),(width/2,edge_y,z),.009,'zinc',suffix)
    for x in [-width*.37,0,width*.37]:
        pts=[(x,y+r+.02,z+.12),(x,y+r+.015,z-.01),(x,y+.09,z-.105),(x,y,z-.145),(x,y-.10,z-.08),(x,y-r-.01,z+.01)]
        for a,b in zip(pts,pts[1:]):line('Rinnenhalter gekröpft',a,b,.025,.008,'steel','halter',None,2)
    if downpipe:
        x=width*.31
        tube('Rinnenstutzen',(x,y,z-.18),.058,.16,'zinc','stutzen')
        # True opening through the gutter bottom into the hollow outlet.
        cutter=cylinder('Temporärer Auslassschnitt',(x,y,z-.10),.050,.46,vertices=28)
        bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Auslassöffnung','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        tube('Fallrohr',(x,y,z-.57),.052,.67,'zinc','fallrohr')
        for zz in [z-.31,z-.73]:
            # Small rolled clamp around the pipe.
            cy('Rohrschelle',(x,y,zz),.057,.022,'metal','halter',None,3)
        water([(0,.6,.98),(0,.15,.74),(0,y,z-.06),(x,y,z-.20),(x,y,z-.84)])
    return ob


def flashing(name,coords,suffix='anschluss',layer='zusatzebene'):
    # Solid sheet with explicit thin edge, so it is physically legible at close range.
    return solid_polygon(name,coords,.004,'zinc',suffix,layer,2)


def roof_opening(kind='window'):
    if kind!='pipe':slope_patch(cut=lambda x,y:abs(x)<.53 and .42<y<1.45)
    if kind=='window':
        # An actual window opening continues through the support and functional
        # layers. Glass over an uncut roof would teach the wrong section.
        cutter=box('Temporäre Fensteröffnung',xyz(0,.95,-.08),(.95,.94,.85),rotation=(SLOPE,0,0),bevel=0)
        for ob in list(PARTS):
            if ob.type!='MESH':continue
            bpy.context.view_layer.objects.active=ob
            mod=ob.modifiers.new('Öffnung für Dachfenster','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
        for x in [-.52,.52]:sb('Fensterrahmen seitlich',x,.95,.17,(.07,1.04,.08),'steel','rahmen',None,3)
        for y in [.43,1.47]:sb('Fensterrahmen quer',0,y,.17,(1.1,.07,.08),'steel','rahmen',None,3)
        sb('Verglasung Dachflächenfenster',0,.95,.18,(.95,.94,.025),'glass','fenster',None,3)
        for x in [-.60,.60]:sb('Seitlicher Eindeckrahmen',x,.95,.12,(.13,1.25,.012),'zinc','anschluss','deckung',2)
        sb('Unteres Anschlussblech',0,.33,.12,(1.25,.22,.012),'zinc','anschluss','deckung',2)
        sb('Entwässerungsrinne oberhalb Fenster',0,1.57,.08,(1.35,.10,.025),'zinc','zusatzebene','zusatzebene',2)
        for x in [-.64,.64]:sb('Unterdeckungsanschluss',x,.95,.02,(.15,1.25,.009),'membrane','zusatzebene','zusatzebene',1)
    elif kind=='chimney':
        cb('Schornstein gemauert',(0,.91,1.66),(.72,.7,1.5),'plaster','schornstein',None,1,bevel=.015)
        cb('Schornsteinabdeckung',(0,.91,2.43),(.85,.83,.07),'concrete','schornstein',None,3)
        for x in [-.24,.24]:cy('Schornsteinöffnung',(x,.91,2.48),.11,.035,'steel','schornstein',None,3)
        sb('Vorderes Anschlussblech',0,.38,.15,(.96,.35,.014),'zinc','vorderteil','deckung',2)
        for x in [-.47,.47]:
            sb('Seitliches Anschlussblech',x,.90,.12,(.23,1.03,.014),'zinc','seitenteil','deckung',2)
            cb('Seitliche Aufkantung',(x*.83,.91,1.29),(.008,.96,.27),'zinc','seitenteil','deckung',2)
        sb('Rückseitige Wasserführung',0,1.44,.16,(1.04,.35,.018),'zinc','rueckenteil','deckung',2)
        cb('Vordere Anschlussaufkantung',(0,.553,1.10),(.9,.008,.25),'zinc','vorderteil','deckung',2)
        cb('Rückseitige Anschlussaufkantung',(0,1.269,1.58),(.93,.008,.27),'zinc','rueckenteil','deckung',2)
    else:
        slope_patch()
        axis=Vector(xyz(0,.83,.14))
        # Replace only the footprint of the actual form tile, not the large
        # rectangular window opening used by the other examples.
        footprint=box('Temporärer Formziegel-Ausschnitt',xyz(0,.83,.105),(.48,.59,.20),rotation=(SLOPE,0,0),bevel=0)
        for ob in [o for o in PARTS if o.get('part_id')==DETAIL+'-deckziegel']:
            bpy.context.view_layer.objects.active=ob
            mod=ob.modifiers.new('Platz für Formziegel','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=footprint
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(footprint,do_unlink=True)
        form=sb('Dachformteil mit Anschlussflansch',0,.83,.14,(.48,.59,.035),'ceramic','formteil','deckung',3)
        under_z=-.025
        under_y=(axis.y+under_z*math.sin(SLOPE))/math.cos(SLOPE)
        under=sb('Unterdeckungs-Manschette',0,under_y,under_z,(.65,.73,.009),'membrane','zusatzebene','zusatzebene',2)
        # The same vertical axis passes through the ceramic and the lower
        # functional layer. A real annular opening makes the missing boot in
        # the fault view visible instead of concealing it under a solid plate.
        cutter=cylinder('Temporäre Rohröffnung',(axis.x,axis.y,axis.z-.05),.148,1.30,vertices=40)
        for ob in list(PARTS):
            if ob.type!='MESH' or ob==under:continue
            bpy.context.view_layer.objects.active=ob
            mod=ob.modifiers.new('Durchgehende Rohröffnung','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
        cutter=cylinder('Temporäre innere Manschettenöffnung',(axis.x,axis.y,axis.z-.05),.1045,1.30,vertices=40)
        bpy.context.view_layer.objects.active=under
        mod=under.modifiers.new('Passende untere Rohrmanschette','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        tube('Entlüftungsrohr',(axis.x,axis.y,axis.z+.28),.105,1.10,'steel','rohr')
        cy('Rohrabschluss',(axis.x,axis.y,axis.z+.86),.15,.055,'steel','rohr',None,3)
        n=40;verts=[]
        # A sloped outer apron follows the form tile; the raised neck joins
        # the vertical pipe. This whole annulus disappears in the fault view.
        for bottom in [False,True]:
            for radius,height in [(.188,None),(.155,.14),(.1045,.19)]:
                for i in range(n):
                    a=i*2*math.pi/n;x=axis.x+radius*math.cos(a);y=axis.y+radius*math.sin(a)
                    z=axis.z+(math.tan(SLOPE)*(y-axis.y)+.022 if height is None else height)-(.006 if bottom else 0)
                    verts.append((x,y,z))
        faces=[]
        for i in range(n):
            j=(i+1)%n
            for ring in range(2):
                a=ring*n;b=(ring+1)*n
                faces.extend([(a+i,a+j,b+j,b+i),(3*n+a+i,3*n+b+i,3*n+b+j,3*n+a+j)])
            faces.extend([(i,3*n+i,3*n+j,j),(2*n+i,2*n+j,5*n+j,5*n+i)])
        cm('Dichtmanschette am Rohr',verts,faces,'seal','formteil','deckung',2)


def detail_scene(detail,variant):
    global M,DETAIL,BIBER,FLACH,PARTS,WATER
    reset_scene(); M=make_materials(); DETAIL=detail;BIBER='biber' in variant;FLACH=variant.startswith('flachdach');PARTS=[];WATER=[]
    if detail in ['s02','s03']:
        slope_patch(length=1.36)
        cb('Stirnbrett an Sparrenenden',(0,-.015,.49),(2.08,.045,.24),'wood','lattung','tragwerk',0)
        flashing('Traufblech und Einlaufkante',[(-1.07,.16,.69),(1.07,.16,.69),(1.07,-.21,.56),(-1.07,-.21,.56)],'traufblech')
        gutter()
    elif detail=='s01':slope_patch(width=1.55,length=1.15)
    elif detail=='s04':
        slope_patch(width=1.75,length=1.5)
        sb('Ortgangbrett',-.91,.73,.0,(.05,1.65,.24),'wood','abschluss','tragwerk',1)
        pitch=.15 if BIBER else .34
        for i in range(int(1.5/pitch)):
            y=-.1+i*pitch
            tile(-.82,y,.14,width=.23,suffix='randziegel')
            sb('Seitlicher Ortgangabschluss',-.95,y+.17,.055,(.018,.38,.18),'ceramic','abschluss','deckung',3)
            pos=xyz(-.82,y+.32,.18);cy('Ortgangbefestigung',pos,.009,.035,'metal','befestigung','deckung',3,rotation=(SLOPE,0,0),vertices=10)
    elif detail=='s05':
        # Two proper slopes meet at the ridge line, continuous dry-ridge component above them.
        slope_patch(length=1.20)
        mirror_ridge_patch(ridge_y=1.10)
        z=.65+1.23*math.sin(SLOPE)
        cb('Firstlatte',(0,1.10,z+.10),(2.15,.06,.09),'wood','firstlatte','lattung',2)
        for i in range(5):ridge_cap(-1.0+i*.42,1.10,z+.17,.43,'firstziegel')
        sb('Firstseitiger Anschlussstreifen',0,1.10,.10,(2.2,.28,.008),'seal','anschluss','zusatzebene',2)
    elif detail=='s06':valley_scene()
    elif detail=='s07':
        slope_patch(length=1.45)
        cb('Aufgehende Außenwand',(0,1.43,1.73),(2.25,.16,1.65),'plaster','wand',None,0)
        sb('Anschlussblech auf Deckung',0,1.24,.15,(2.15,.33,.015),'zinc','anschlussblech','deckung',2)
        cb('Wandaufkantung Anschlussblech',(0,1.335,1.45),(2.15,.012,.32),'zinc','anschlussblech','deckung',2)
        cb('Abdeckleiste am Wandanschluss',(0,1.32,1.62),(2.18,.038,.035),'zinc','anschlussblech',None,3)
        cb('Zusatzebene am Wandanschluss',(0,1.35,1.26),(2.12,.009,.24),'membrane','zusatzebene','zusatzebene',1)
    elif detail=='s08':roof_opening('chimney')
    elif detail=='s09':roof_opening('window')
    elif detail=='s10':dormer_scene()
    elif detail=='s11':roof_opening('pipe')
    elif detail.startswith('w'):hip_scene(detail)
    elif detail.startswith('f'):flat_scene(detail)
    elif detail.startswith('a'):equipment_scene(detail)
    else:foundation_scene(detail)
    return list(PARTS)


def ridge_cap(x,y,z,length=.42,suffix='gratziegel', direction='x'):
    r=.135;verts=[];n=16
    for axis in [x,x+length]:
        for i in range(n+1):
            t=math.pi*i/n
            if direction=='x':verts.append((axis,y+r*math.cos(t),z+r*math.sin(t)))
            else:verts.append((y+r*math.cos(t),axis,z+r*math.sin(t)))
    faces=[(i,i+1,n+2+i,n+1+i) for i in range(n)]
    ob=cm('Geformter First- oder Gratziegel',verts,faces,'ceramic',suffix,'deckung',3)
    mod=ob.modifiers.new('Keramische Materialstärke','SOLIDIFY');mod.thickness=.012
    return ob


def mirror_ridge_patch(ridge_y=1.10):
    """Mirror the just-created slope patch into a genuine second ridge slope.

    Call immediately after slope_patch(), before adding ridge components. Mesh
    coordinates and face winding are transformed together, so exported normals
    and the fixed renders describe the same solid construction.
    """
    from mathutils import Matrix
    reflection=Matrix.Diagonal((1,-1,1,1));reflection.translation=Vector((0,2*ridge_y,0))
    added=[]
    for source in list(PARTS):
        obj=source.copy();obj.data=source.data.copy();obj.name='First Gegenseite · '+source.name
        bpy.context.collection.objects.link(obj)
        bm=bmesh.new();bm.from_mesh(obj.data);bm.transform(reflection@source.matrix_world)
        bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.normal_update();bm.to_mesh(obj.data);bm.free()
        obj.matrix_world=Matrix.Identity(4);PARTS.append(obj);added.append(obj)
    return added


def variant_surface_tile(name, a, b, surface, suffix='ziegel', max_b=None):
    """One ceramic element on a supplied roof plane, with a real rounded Biber foot.

    a is the cross-course coordinate and b the uphill coordinate. The two
    coverings differ in shape, joint offset and row pitch at their call sites.
    """
    width=.178 if BIBER else .28; length=.38 if BIBER else .42
    if BIBER:
        radius=width/2
        outline=[(-radius,length),(-radius,radius)]
        outline += [(radius*math.cos(t),radius+radius*math.sin(t)) for t in [math.pi+i*math.pi/12 for i in range(13)]]
        outline += [(radius,length)]
    else:
        outline=[(-width/2,0),(-width/2,length),(width/2,length),(width/2,0)]
    if max_b is not None:
        # Clip the terminal course to this teaching patch instead of letting
        # whole tiles extend beyond its ridge/end reference.
        clipped=[]
        for i,p in enumerate(outline):
            q=outline[(i+1)%len(outline)];vp=max_b-b-p[1];vq=max_b-b-q[1]
            if vp>=0:clipped.append(p)
            if (vp>=0)!=(vq>=0):
                t=vp/(vp-vq);clipped.append((p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t))
        outline=clipped
    if len(outline)<3:return None
    coords=[]
    for aa,bb in outline:
        x,y,z=surface(a+aa,b+bb)
        coords.append((x,y,z+.012+.032*(1-bb/length)))
    obj=solid_polygon(name+' · '+('Biber Rundschnitt' if BIBER else 'Falzziegel'),coords,.011,'ceramic',suffix,'deckung',3)
    if not BIBER:
        for sign in [-1,1]:
            start=surface(a+sign*(width/2-.018),b+.025)
            end=surface(a+sign*(width/2-.018),min(b+length-.025,max_b) if max_b is not None else b+length-.025)
            if (Vector(end)-Vector(start)).length>.03:
                line('Seitliche Falzkante',Vector(start)+Vector((0,0,.031)),Vector(end)+Vector((0,0,.021)),.012,.012,'ceramic',suffix,'deckung',3)
    return obj


def pitched_grat_cap(start,end,suffix='gratziegel'):
    """A real curved cap follows the inclined ridge axis rather than floating level."""
    a,b=Vector(start),Vector(end);direction=(b-a).normalized()
    side=Vector((1,0,0));up=side.cross(direction).normalized()
    if up.z<0:up=-up
    verts=[];n=16;r=.135
    for p in [a,b]:
        for i in range(n+1):
            t=math.pi*i/n;verts.append(p+side*r*math.cos(t)+up*r*math.sin(t))
    obj=cm('Geneigter Gratziegel',verts,[(i,i+1,n+2+i,n+1+i) for i in range(n)],'ceramic',suffix,'deckung',3)
    mod=obj.modifiers.new('Keramische Materialstärke','SOLIDIFY');mod.thickness=.012
    return obj


def valley_scene():
    # Two inclined roof planes meet at a visibly lower valley, draining toward the front.
    for sign in [-1,1]:
        verts=[(sign*.28,-.10,.71),(sign*1.15,-.10,1.08),(sign*1.15,1.65,1.98),(sign*.28,1.65,1.61)]
        solid_polygon('Geneigte Dachfläche an Kehle',verts,.08,'wood','unterlage','tragwerk',0)
        pitch=.15 if BIBER else .34;breadth=.18 if BIBER else .24
        for row in range(math.ceil(1.75/pitch)):
            for col in range(int(.87/breadth)):
                x=sign*(.29+breadth/2+col*breadth+(breadth/2 if BIBER and row%2 else 0))
                if abs(x)+breadth/2>1.15:continue
                # Project onto the very same plane as the support polygon,
                # then allow the physical tile thickness above that support.
                # A separately rounded slope previously buried the heads in
                # the board and left only red stripes visible in the render.
                variant_surface_tile('Deckziegel neben Kehle',x,-.10+row*pitch,lambda x,y:(x,y,.71+(y+.10)*(.90/1.75)+(abs(x)-.28)*(.37/.87)+.024),'ziegel',1.65)
    verts=[(-.29,-.20,.72),(0,-.20,.67),(.29,-.20,.72),(.29,1.78,1.74),(0,1.78,1.69),(-.29,1.78,1.74)]
    flashing('Durchgehendes gekantetes Kehlblech',verts,'kehlblech')
    for x in [-.31,.31]:line('Seitliche Kehlaufkantung',(x,-.2,.73),(x,1.78,1.75),.014,.025,'zinc','kehlblech','deckung',2)
    cb('Zusatzebene unter Kehle',(0,.78,.88),(.62,2.0,.01),'membrane','zusatzebene','zusatzebene',1,rotation=(SLOPE,0,0))
    water([(0,1.65,1.63),(0,1.2,1.39),(0,.75,1.15),(0,.3,.91),(0,-.2,.64)])


def dormer_scene():
    slope_patch(width=2.35,length=2.0,cut=lambda x,y:abs(x)<.62 and .60<y<1.8)
    # The two local lower-plane openings are bridged by the actual cheek
    # aprons below. Removing an apron must reveal a real break, not just a
    # black patch over an otherwise uninterrupted black roof membrane.
    for sign in [-1,1]:
        cutter=box('Temporäre Öffnung der Wangenanschlusslage',(sign*.785,1.035,1.2),(.245,.77,2),bevel=0)
        for ob in [o for o in PARTS if o.name=='Unterdeckung durchgehend']:
            bpy.context.view_layer.objects.active=ob
            mod=ob.modifiers.new('Anschlussöffnung an Gaubenwange','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
    cb('Gaubenfront',(0,.68,1.38),(1.22,.10,.72),'plaster','wange',None,1)
    for x in [-.62,.62]:
        cb('Gaubenwange',(x,1.14,1.32),(.09,1.02,.64),'plaster','wange',None,1)
    cb('Fenster der Gaube',(0,.615,1.40),(.90,.035,.48),'glass','wange',None,3)
    for sign in [-1,1]:
        pts=[(0,.52,2.03),(0,1.86,2.03),(sign*.76,1.86,1.61),(sign*.76,.52,1.61)]
        solid_polygon('Gaubendach geneigt',pts,.075,'wood','gaubendach','tragwerk',1)
        pitch=.15 if BIBER else .34;breadth=.18 if BIBER else .24
        for row in range(math.ceil(.76/pitch)):
            for col in range(int(1.34/breadth)):
                across=.52+breadth/2+col*breadth+(breadth/2 if BIBER and row%2 else 0)
                if across+breadth/2>1.86:continue
                variant_surface_tile('Deckung der Gaube',across,row*pitch,lambda a,b,s=sign:(s*(.76-b),a,1.61+b*(.42/.76)),'gaubendach',.76)
        # The valley follows the actual intersection of the main roof and the
        # little dormer roof. It does not start at the dormer's front eave.
        # Main tile plane: .771 + tan(30°) * y; dormer: 2.03 - (.42/.76)*|x|.
        main_deck=lambda y:.65+(.105/math.cos(SLOPE))+math.tan(SLOPE)*y
        valley_start_y=(1.61-(.65+.105/math.cos(SLOPE)))/math.tan(SLOPE)
        valley_end_x=(2.03-main_deck(1.86))/(.42/.76)
        line('Wangenkehle und Anschluss',(sign*.76,valley_start_y,1.61),(sign*valley_end_x,1.86,main_deck(1.86)),.14,.012,'zinc','kehle','deckung',2)
        # The additional water-carrying connector is an L-shaped return at
        # the CHEEK/main-roof junction, not a black strap on the dormer tiles.
        # Its lower apron follows the exact main underlay plane. The vertical
        # return is below the dormant eave and remains visible in the matching
        # teaching cutaway used by both correct and fault comparison images.
        membrane=lambda y:.65+(-.035/math.cos(SLOPE))+math.tan(SLOPE)*y
        y0,y1=.65,1.42;wall_x=sign*.668;outer_x=sign*.91
        apron=[(wall_x,y0,membrane(y0)+.006),(outer_x,y0,membrane(y0)+.006),(outer_x,y1,membrane(y1)+.006),(wall_x,y1,membrane(y1)+.006)]
        solid_polygon('Zusatzebene Wangenanschluss Schürze',apron,.006,'membrane','wangenanschluss','zusatzebene',1)
        upstand=[(wall_x,y0,membrane(y0)+.004),(wall_x,y1,membrane(y1)+.004),(wall_x,y1,membrane(y1)+.14),(wall_x,y0,membrane(y0)+.14)]
        cm('Zusatzebene Wangenanschluss Aufkantung',upstand,[(0,1,2,3)],'seal','wangenanschluss','zusatzebene',1)
    for y in [.52,.91,1.30,1.69]:ridge_cap(y,0,2.06,.41,'gaubendach','y')


def hip_scene(detail):
    # Ridge slopes upward with y. Both adjoining planes slope away from it.
    for sign in [-1,1]:
        pts=[(0,-.15,.72),(0,1.85,1.78),(sign*1.13,1.85,1.28),(sign*1.13,-.15,.22)]
        solid_polygon('Dachfläche am Grat',pts,.07,'wood','walmflaeche','tragwerk',0)
        pitch=.15 if BIBER else .34;breadth=.18 if BIBER else .24
        for r in range(math.ceil(2.0/pitch)):
            for c in range(int(1.13/breadth)):
                x=sign*(breadth/2+c*breadth+(breadth/2 if BIBER and r%2 else 0))
                if abs(x)+breadth/2>1.13:continue
                # The support polygon has a fixed plane. Derive the deck from
                # its endpoints instead of using an approximate intercept:
                # the old .76 value put most of each tile below the wood.
                variant_surface_tile('Walmziegel und Passstücke',x,-.15+r*pitch,lambda x,y:(x,y,.72+(y+.15)*(1.06/2.0)-abs(x)*(.50/1.13)+.024),'ziegel',1.85)
    line('Durchgehende Gratlatte',(0,-.17,.79),(0,1.9,1.88),.075,.065,'wood','gratlatte','lattung',2)
    for i in range(6):
        y=-.17+i*.34;pitched_grat_cap((0,y,.82+y*.53),(0,min(y+.38,1.92),.82+min(y+.38,1.92)*.53),'gratziegel')
        cy('Gratbefestigung',(0,y+.08,1.01+y*.53),.008,.045,'metal','befestigung','deckung',3)
    if detail=='w02':
        gutter(width=2.28,y=-.23,z=.35,downpipe=False)
        cy('Gratfußabschluss',(0,-.20,.84),.15,.025,'ceramic','gratfuss','deckung',3,rotation=(math.pi/2,0,0))
    if detail=='w03':
        for sign in [-1,1]:
            for i in range(3):ridge_cap(sign*(i*.36),1.85,1.85,.38,'first')
        cy('Dreiwege-Knotenstück',(0,1.85,1.93),.18,.08,'ceramic','knoten','deckung',3)
    if detail=='w04':
        # Physical guide cord is a tool/model reference, not a painted solution annotation.
        pipe('Bezugsschnur zur Einteilung',(.25,-.18,.74),(.25,1.87,1.83),.004,'seal','bezuege',None,1)


def trim_box_local_min(obj,axis,amount):
    """Remove a strip from a box before a separately named connector fills it.

    Mutating local mesh coordinates preserves the existing rotated roof plane.
    Merely hiding an overlapping strip would otherwise leave no real fault gap.
    """
    values=[v.co[axis] for v in obj.data.vertices]
    lo,hi=min(values),max(values);span=hi-lo
    for v in obj.data.vertices:v.co[axis]=lo+amount+(v.co[axis]-lo)*(span-amount)/span
    obj.data.update()


def split_part_band(obj,axis,center,width):
    """Replace one solid by two real bodies with a specified construction joint."""
    for right in [False,True]:
        copy=obj.copy();copy.data=obj.data.copy();copy.name=obj.name+(' · B' if right else ' · A')
        bpy.context.collection.objects.link(copy)
        bm=bmesh.new();bm.from_mesh(copy.data)
        point=Vector((0,0,0));point[axis]=center+(width/2 if right else -width/2)
        normal=Vector((0,0,0));normal[axis]=1
        co=copy.matrix_world.inverted()@point;no=copy.matrix_world.to_3x3().transposed()@normal
        result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=co,plane_no=no,clear_inner=right,clear_outer=not right)
        edges=[e for e in result.get('geom_cut',[]) if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
        if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
        bm.to_mesh(copy.data);bm.free();PARTS.append(copy)
    PARTS.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)


def foundation_scene(detail):
    if FLACH:
        flat_patch(membrane=detail not in ['g02','g03','g04'],fall=detail=='g06')
        if detail=='g01':
            for ob in PARTS:
                if ob.name=='Dampfbremse':trim_box_local_min(ob,1,.045)
            cb('Innere Anschlusslage sichtbar',(0,-.015,.27),(2.2,.12,.055),'seal','innenanschluss','luftdichtheit',0)
        if detail=='g02':
            for x in [-.8,0,.8]:cb('Auflager unter der Tragschale',(x,.9,-.05),(.18,1.9,.18),'concrete','unterlage','tragwerk',0)
        if detail=='g03':
            for ob in PARTS:
                if ob.name=='Wärmedämmung':trim_box_local_min(ob,0,.18)
            cb('Dämm-Anschlussstreifen',(-1.01,.925,.35),(.18,1.85,.21),'insulation','daemmanschluss','daemmung',1)
        if detail in ['g04','g03']:
            cb('Aufgehende Wand',(0,1.83,.72),(2.2,.14,1.1),'plaster','wand',None,0)
            cb('Luftdichter Wandanschluss',(0,1.745,.45),(2.15,.008,.40),'seal','anschluss','luftdichtheit',1)
            cb('Überlappung der Dampfbremse',(0,.86,.25),(2.18,.16,.009),'seal','stoss','luftdichtheit',1)
        if detail=='g05':
            for x in [-.75,0,.75]:
                for y in [.45,1.3]:
                    cy('Sichtbarer Befestigungsteller',(x,y,.50),.035,.014,'metal','halter','deckung',3)
                    cy('Verankerung bis in Tragschale',(x,y,.38),.012,.34,'metal','anker','tragwerk',2)
        if detail=='g06':
            drain(.55,.72,.42);water([(x,y,fall_height(x,y)+.01) for x,y in [(-.8,1.5),(-.4,1.2),(0,.9),(.55,.72)]]+[(.55,.72,.2)])
    else:
        slope_patch(deck=detail not in ['g02','g03','g04'])
        if detail=='g01':
            for ob in PARTS:
                if ob.name=='Dampfbremse luftdichte Ebene':trim_box_local_min(ob,1,.095)
            sb('Innere Anschlusslage sichtbar',0,.03,-.23,(2.1,.13,.018),'seal','innenanschluss','luftdichtheit',0)
        if detail=='g02':sb('Pfette unter Sparren',0,.60,-.29,(2.25,.14,.19),'wood','pfette','tragwerk',0)
        if detail=='g03':
            # Deliberately visible insulation edge exposes the thermal bridge relationship.
            for ob in PARTS:
                if ob.name=='Mineralische Wärmedämmung':trim_box_local_min(ob,0,.18)
            sb('Gedämmter Anschlussstreifen',-.935,.825,-.135,(.18,1.65,.17),'insulation','anschluss','daemmung',1)
        if detail=='g04':
            cb('Anschlusswand',(0,1.48,1.38),(2.2,.13,1.40),'plaster','wand',None,0)
            sb('Dampfbremse sichtbarer Stoß',0,.78,-.24,(2.15,.13,.011),'seal','stoss','luftdichtheit',1)
            cb('Luftdichter Wandanschluss',(0,1.39,1.13),(2.05,.009,.30),'seal','anschluss','luftdichtheit',1)
        if detail=='g05':
            for x in [-2.05*.42,0,2.05*.42]:
                pipe('Befestigungsstift bis zum Sparren',xyz(x,.58,-.15),xyz(x,.58,.18),.009,'metal','anker','tragwerk',2)
                sb('Sturmklammer geformt',x,.56,.12,(.02,.16,.02),'steel','halter','deckung',3)
        if detail=='g06':gutter()


def drain(x=.55,y=.72,z=.477):
    before=len(PARTS)
    # The inlet is a real opening, not a black cylinder placed on an intact roof.
    cutter=cylinder('Temporärer Dachablaufschnitt',(x,y,.35),.142,1.2,vertices=28)
    for ob in list(PARTS):
        if ob.type!='MESH' or ob.get('layer') not in ['tragwerk','luftdichtheit','daemmung','deckung']:continue
        bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Öffnung des Dachablaufs','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    tube('Hohler Ablaufkörper',(x,y,.30),.13,.35,'steel','ablauf',1,inner_radius=.10)
    # Top of the inlet flange is flush with the defined low-point surface.
    tube('Anschlussflansch mit freier Einlauföffnung',(x,y,.468),.24,.018,'membrane','flansch',2,inner_radius=.10)
    cy('Dunkler Rohrinnenraum',(x,y,.16),.098,.008,'steel','ablauf',None,3)
    for i in range(7):
        a=i*math.pi/7
        pipe('Laubfangbügel',(x-.10*math.cos(a),y-.10*math.sin(a),.51),(x+.10*math.cos(a),y+.10*math.sin(a),.51),.005,'metal','ablauf',None,3)
    for obj in PARTS[before:]:obj.location.z += z-.477


def flat_scene(detail):
    flat_patch(fall=detail=='f02',drain_point=(.60,.27))
    if detail=='f01':
        cb('Oberlage mit sichtbarer Überdeckung',(.12,1.24,.49),(1.96,.80,.013),'membrane','abdichtung','deckung',3)
        cb('Nahtbereich Oberlage',(.12,.84,.50),(1.96,.10,.008),'membrane','naht','deckung',3)
    elif detail=='f02':
        drain(.60,.27,.42);water([(x,y,fall_height(x,y,low=(.60,.27))+.01) for x,y in [(-.6,1.5),(-.3,1.2),(0,.8),(.3,.5),(.6,.27)]])
    elif detail=='f03':drain()
    elif detail=='f04':
        for x in [-.67,.67]:cb('Attika neben Notwasseröffnung',(x,1.83,.81),(.86,.18,.70),'plaster','untergrund',None,0)
        cb('Attika über Notwasseröffnung',(0,1.83,1.01),(.48,.18,.30),'plaster','untergrund',None,0)
        cb('Attika unter Notwasseröffnung',(0,1.83,.49),(.48,.18,.06),'plaster','untergrund',None,0)
        for x in [-.22,.22]:cb('Notablauf seitlicher Durchlass',(x,1.80,.64),(.012,.38,.18),'zinc','notablauf',None,2)
        for z in [.55,.73]:cb('Notablauf Boden und Decke',(0,1.80,z),(.44,.38,.012),'zinc','notablauf',None,2)
        # The flange surrounds the opening instead of sealing its mouth shut.
        for x in [-.2675,.2675]:cb('Abdichtungsanschluss seitlich Notablauf',(x,1.72,.64),(.095,.015,.33),'membrane','abdichtung','deckung',2)
        for z in [.5125,.7675]:cb('Abdichtungsanschluss oben und unten Notablauf',(0,1.72,z),(.44,.015,.075),'membrane','abdichtung','deckung',2)
        cb('Auslauf außerhalb Attika',(0,2.05,.60),(.44,.35,.04),'zinc','auslauf',None,3)
        water([(0,.65,.49),(0,1.15,.51),(0,1.65,.60),(0,1.9,.61),(0,2.25,.53)])
    elif detail=='f05':
        cb('Attika Längsseite',(0,1.79,.83),(2.35,.20,.78),'plaster','attika',None,0)
        cb('Attika Ecke',(-1.06,.91,.83),(.20,1.94,.78),'plaster','ecke',None,0)
        cb('Abdichtung hochgeführt',(0,1.68,.82),(2.15,.012,.76),'membrane','abdichtung','deckung',2)
        cb('Abdichtung Eckaufkantung',(-.95,.92,.82),(.012,1.65,.76),'membrane','abdichtung','deckung',2)
        # The two caps meet at a butt joint. Coplanar overlapping sheets caused
        # a black flickering square in the supposedly correct corner example.
        cb('Attikaabdeckung mit Überstand',(.1675,1.79,1.25),(2.115,.34,.018),'zinc','abdeckung',None,3)
        cb('Attikaabdeckung Ecke',(-1.06,.895,1.25),(.34,2.13,.018),'zinc','ecke',None,3)
        for y in [1.61,1.96]:cb('Abdeckung Abtropfkante',(.1675,y,1.21),(2.115,.012,.08),'zinc','abdeckung',None,3)
    elif detail=='f06':
        cb('Randabschlussprofil',(0,-.03,.50),(2.30,.19,.025),'zinc','randprofil',None,2)
        cb('Abtropfschenkel',(0,-.12,.37),(2.30,.015,.24),'zinc','randprofil',None,2)
        cb('Abdichtung über Randflansch',(0,.11,.485),(2.20,.23,.012),'membrane','abdichtung','deckung',3)
        for x in [-.8,-.4,0,.4,.8]:cy('Befestigung am Randprofil',(x,.01,.52),.01,.025,'metal','befestigung',None,3)
    elif detail=='f07':
        cb('Wandanschluss links',(-.75,1.83,1.0),(.75,.15,1.5),'plaster','wand',None,0)
        cb('Wandanschluss rechts',(.85,1.83,1.0),(.5,.15,1.5),'plaster','wand',None,0)
        cb('Türrahmen',(0,1.80,1.03),(.88,.09,1.2),'steel','tuer',None,1)
        cb('Verglaste Türfläche',(0,1.745,1.09),(.73,.018,.98),'glass','tuer',None,3)
        cb('Anschluss an Schwelle',(0,1.66,.49),(.99,.20,.023),'zinc','anschluss','deckung',2)
        for x in [-.51,.51]:cb('Abdichtung seitlich der Tür',(x,1.69,.71),(.16,.012,.47),'membrane','anschluss','deckung',2)
        cb('Wandaufkantung',(-.75,1.73,.67),(.75,.014,.41),'membrane','abdichtung','deckung',2)
    elif detail=='f08':
        cy('Rohrdurchdringung',(-.64,.72,.89),.105,.92,'steel','rohr',None,2)
        cy('Rohrmanschette',(-.64,.72,.52),.21,.10,'membrane','anschluss','deckung',3)
        cb('Lichtkuppel Aufsetzkranz',(.40,1.00,.68),(.94,.93,.38),'plaster','lichtkuppel',None,1)
        cb('Lichtkuppel Glas',(.40,1.0,.90),(1.01,1.00,.11),'glass','lichtkuppel',None,3,bevel=.05)
        for x in [-.13,.93]:cb('Abdichtung am Aufsetzkranz',(x,1.0,.60),(.06,1.04,.25),'membrane','anschluss','deckung',2)
        for y in [.46,1.54]:cb('Abdichtung am Aufsetzkranz',(.4,y,.60),(1.04,.06,.25),'membrane','anschluss','deckung',2)
    elif detail=='f09':
        # Clearly separate two structural sections and carry the movement profile upward.
        for ob in list(PARTS):split_part_band(ob,1,1.04,.07)
        cb('Nachgiebige Fugenfüllung zwischen Baukörpern',(0,1.04,.10),(2.20,.055,.24),'seal','bauwerksfuge','tragwerk',0)
        cb('Bewegungsfugenprofil',(0,1.04,.53),(2.22,.13,.095),'seal','fugenprofil','deckung',3,bevel=.025)
        for y in [.90,1.18]:cb('Abdichtungsflansch Fugenprofil',(0,y,.49),(2.2,.17,.012),'membrane','abdichtung','deckung',2)


def equipment_scene(detail):
    if FLACH:flat_patch()
    else:slope_patch(width=2.1,length=1.6)
    if detail=='a01':
        for x in [-.62,.62]:
            if FLACH:cb('Wetterseitiger Halteranschluss',(x,.92,.48),(.35,1.35,.018),'membrane','wetteranschluss','deckung',2)
            else:
                for y in [.38,1.30]:sb('Wetterseitiger Halteranschluss',x,y,.125,(.22,.30,.014),'seal','wetteranschluss','deckung',2)
        if not FLACH:
            for y in [.38,1.30]:sb('Befestigungsbohle PV-Unterkonstruktion',0,y,.045,(2.1,.12,.05),'wood','befestigungsuntergrund','lattung',1)
        for x in [-.62,.62]:
            if FLACH:
                cb('Auflager PV-Unterkonstruktion',(x,.92,.56),(.24,1.25,.12),'concrete','untergrund',None,0)
                cy('Verankerung durch Anschlussmanschette',(x,.38,.43),.018,.38,'metal','halter','tragwerk',1)
                line('Aufgeständerte Schiene',(x,.36,.70),(x,1.54,1.04),.05,.05,'metal','schiene',None,2)
                for y in [.45,1.45]:line('Dreieckstütze PV',(x,y,.63),(x,y,.70+(y-.36)*.288),.035,.035,'metal','halter',None,1)
            else:
                for y in [.38,1.30]:
                    p=xyz(x,y,.045);q=xyz(x,y,.30)
                    line('Dachhaken am Tragwerk',p,q,.025,.018,'metal','halter',None,1)
                a=xyz(x,.27,.31);b=xyz(x,1.49,.31);line('PV-Montageschiene',a,b,.045,.045,'metal','schiene',None,2)
        if FLACH:
            cb('PV-Modul mit Zellstruktur',(0,.96,.96),(1.72,1.15,.035),'pv','modul',None,3,rotation=(math.radians(16),0,0))
            for x in [-.88,.88]:cb('Modulrahmen',(x,.96,.96),(.027,1.19,.05),'metal','modul',None,3,rotation=(math.radians(16),0,0))
        else:
            sb('PV-Modul mit Zellstruktur',0,.90,.36,(1.72,1.14,.035),'pv','modul',None,3)
            for x in [-.88,.88]:sb('PV-Modulrahmen',x,.90,.36,(.027,1.18,.05),'metal','modul',None,3)
    elif detail=='a02':
        sb('Befestigungsbohle Schneefang',0,.37,.045,(2.1,.12,.05),'wood','befestigungsuntergrund','lattung',1)
        for x in [-.70,0,.70]:
            p=xyz(x,.37,.16);q=xyz(x,.37,.42);line('Schneefanghalter',p,q,.04,.025,'steel','halter',None,2)
        for x in [-.70,0,.70]:line('Verankerung Schneefang',xyz(x,.37,-.08),xyz(x,.37,.17),.024,.024,'metal','verankerung','tragwerk',1)
        for z in [.31,.43]:pipe('Schneefangrohr',xyz(-.91,.37,z),xyz(.91,.37,z),.025,'steel','fangsystem',None,3)
    elif detail=='a03':
        if not FLACH:sb('Befestigungsbohle Dachtritt',0,.54,.045,(2.1,.12,.05),'wood','befestigungsuntergrund','lattung',1)
        for x in [-.52,.52]:
            if FLACH:
                cb('Auflager Laufrost',(x,.79,.57),(.12,.9,.16),'metal','halter',None,2)
            else:
                line('Traghalter Dachtritt',xyz(x,.54,.045),(x,.76,1.39),.035,.035,'metal','halter',None,2)
        z=.70 if FLACH else 1.40
        for i in range(13):cb('Rutschhemmender Laufrost',(-.78+i*.13,.79,z),(.035,.58,.035),'steel','tritt',None,3,bevel=.004)
        for y in [.48,1.1]:cb('Laufrost Randrahmen',(0,y,z),(1.65,.035,.05),'steel','tritt',None,3)
        if not FLACH:
            sb('Dachausstieg Glas',0,1.35,.17,(.75,.65,.03),'glass','ausstieg',None,1)
            for x in [-.42,.42]:sb('Dachausstieg Rahmen',x,1.35,.17,(.055,.75,.06),'steel','ausstieg',None,1)
    elif detail=='a04':
        surface=lambda x,y:(x,y,.52) if FLACH else xyz(x,y,.19)
        stand=Vector(surface(0,1.12))
        cy('Fangstange',stand+Vector((0,0,.65)),.014,1.30,'metal','fangeinrichtung',None,3,vertices=12)
        for i in range(4):
            y=.12+i*.42;start=Vector(surface(-.73,y));end=Vector(surface(-.73,y+.42))
            pipe('Fangleitung / Ableitung',start,end,.007,'metal','ableitung',None,3)
            cy('Leitungshalter',start-Vector((0,0,.03)),.028,.05,'steel','halter',None,2,vertices=12)
        pipe('Verbindung zur Fangstange',surface(-.73,1.12),stand,.007,'metal','ableitung',None,3)
        pipe('Ableitung am Rand',surface(-.73,.12),(-.73,-.05,-.25),.007,'metal','erdanschluss',None,3)


def join_parts():
    groups={}
    for obj in PARTS:
        if obj.type!='MESH':continue
        k=(obj.get('part_id'),obj.get('layer',''),obj.get('montage_step',0),tuple(m.name for m in obj.data.materials))
        groups.setdefault(k,[]).append(obj)
    result=[]
    for k,objs in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True);bpy.context.view_layer.objects.active=o
            for mod in list(o.modifiers):
                try:bpy.ops.object.modifier_apply(modifier=mod.name)
                except RuntimeError:pass
        bpy.context.view_layer.objects.active=objs[0]
        if len(objs)>1:bpy.ops.object.join()
        o=objs[0];o.name=k[0]+'_'+k[1];result.append(o)
    return result


def camera_to(loc,target,lens=48):
    cam=bpy.context.scene.camera;cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=lens


def fit_visible_render(target):
    """Verify the projected visible geometry, including lifted teaching parts.

    A pre-explosion bounding box alone did not prevent PV modules from being
    cropped. This uses the actual camera projection after every pose/fault.
    """
    scene=bpy.context.scene;cam=scene.camera;target=Vector(target)
    for attempt in range(24):
        bpy.context.view_layer.update()
        points=[o.matrix_world@Vector(v) for o in scene.objects if o.type=='MESH' and o.get('detail_id')==DETAIL and not o.hide_render and len(o.data.vertices)>0 for v in o.bound_box]
        projected=[world_to_camera_view(scene,cam,p) for p in points]
        if projected and all(p.z>0 and .035<=p.x<=.965 and .035<=p.y<=.965 for p in projected):return
        cam.location=target+(cam.location-target)*1.12
    raise ValueError('Visible teaching geometry does not fit the render camera: '+DETAIL)


def teaching_exposure(detail,parts):
    """Open a prescribed part of the covering in BOTH comparison images.

    These are teaching cutaways of the correct scene, never red warning markers.
    The full uncut scene is rebuilt for the GLB below. Keeping the same exposure
    for the correct and faulty images makes concealed connections inspectable.
    """
    def crop(ob,axis,at,keep_greater=True):
        ob.data=ob.data.copy();bm=bmesh.new();bm.from_mesh(ob.data)
        point=Vector((0,0,0));point[axis]=at;normal=Vector((0,0,0));normal[axis]=1
        co=ob.matrix_world.inverted()@point;no=ob.matrix_world.to_3x3().transposed()@normal
        result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=co,plane_no=no,clear_inner=keep_greater,clear_outer=not keep_greater)
        edges=[e for e in result.get('geom_cut',[]) if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
        if edges:
            try:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
            except RuntimeError:pass
        bm.to_mesh(ob.data);bm.free()
    for ob in parts:
        layer=ob.get('layer');suffix=ob.get('part_id','').split('-',1)[-1]
        if detail=='g01' and layer in ['deckung','lattung','zusatzebene','daemmung','tragwerk']:crop(ob,1,.36)
        elif detail=='g02' and layer in ['deckung','lattung','zusatzebene','daemmung']:crop(ob,0,0)
        elif detail=='g03' and layer in ['deckung','lattung','zusatzebene']:crop(ob,0,-.45)
        elif detail=='g04' and layer in ['deckung','lattung','zusatzebene','daemmung','tragwerk']:crop(ob,1,.72,False)
        elif detail=='g05' and layer in ['deckung','lattung','zusatzebene','daemmung']:crop(ob,1,.85)
        elif detail=='s02' and (suffix=='deckziegel' or layer=='lattung'):crop(ob,1,.46)
        elif detail=='s09':
            if suffix=='deckziegel':crop(ob,0,.45,False)
            elif suffix=='anschluss' and ob.location.x>0:ob.hide_render=True
        elif detail=='s10':
            if suffix=='kehle':ob.hide_render=True
            elif suffix=='deckziegel' or layer=='lattung':crop(ob,0,.45,False)
        elif detail=='a01':
            if suffix=='modul':ob.location.z+=.80
            elif not FLACH and layer in ['deckung','zusatzebene','daemmung'] and suffix not in ['wetteranschluss']:crop(ob,1,.70)
        elif detail=='a02' and layer in ['deckung','zusatzebene','daemmung'] and suffix not in ['halter','verankerung','fangsystem']:crop(ob,1,.65)
        elif detail=='a03' and not FLACH and layer in ['deckung','zusatzebene','daemmung'] and suffix not in ['halter','tritt','ausstieg']:crop(ob,1,.85)


def render_variant(detail,variant,views,samples=24,resolution=(960,640),skip_existing=False):
    started=time.time();base=os.path.join(MEDIA,variant,detail);os.makedirs(base,exist_ok=True)
    files=[os.path.join(base,'modell.glb')]+[os.path.join(base,v+'.webp') for v in views]+[os.path.join(PREVIEW,variant,detail+'-'+v+'.webp') for v in views]
    params={'views':views,'samples':samples,'resolution':list(resolution)}
    if skip_existing and production_complete('detail',variant,detail,params,files):return
    detail_scene(detail,variant);parts=list(PARTS)
    # Preserve each physical element in the renders so a local fault remains local.
    coords=[o.matrix_world@Vector(v) for o in parts for v in o.bound_box]
    lo=Vector(tuple(min(p[i] for p in coords) for i in range(3)));hi=Vector(tuple(max(p[i] for p in coords) for i in range(3)))
    target=(lo+hi)/2;extent=max(hi.x-lo.x,hi.y-lo.y,hi.z-lo.z);distance=max(3.2,extent*1.8)
    setup_render((target.x+distance*.95,target.y-distance*1.05,target.z+distance*.85),target,resolution=resolution,samples=samples)
    bpy.context.scene.render.threads=2
    bpy.context.scene.cycles.use_denoising=False
    # Neutral studio floor gives material edges contact shadows without changing GLB geometry.
    box('Render-only neutral surface',(0,0,lo.z-.07),(200,200,.05),M['ground'],bevel=0)
    teaching_exposure(detail,parts)
    if detail=='a01':
        # The intentionally lifted module is part of this fixed teaching view.
        # Fit its new extent too; the old pre-opening camera cropped its top.
        bpy.context.view_layer.update()
        exposed=[o.matrix_world@Vector(v) for o in parts for v in o.bound_box]
        elo=Vector(tuple(min(p[i] for p in exposed) for i in range(3)));ehi=Vector(tuple(max(p[i] for p in exposed) for i in range(3)))
        target=(elo+ehi)/2;extent=max(ehi.x-elo.x,ehi.y-elo.y,ehi.z-elo.z);distance=max(3.2,extent*1.8)
    snapshots={o.name:(o.location.copy(),o.hide_render,o.data) for o in parts}
    for view in views:
        for o in parts:
            loc,hidden,data=snapshots[o.name];o.location=loc;o.hide_render=hidden;o.data=data
        if view=='aufbau':
            levels={'tragwerk':0,'luftdichtheit':.22,'daemmung':.46,'zusatzebene':.70,'lattung':.94,'deckung':1.18}
            for o in parts:o.location.z+=levels.get(o.get('layer'),1.30 if o.get('montage_step',0)>1 else 0)
            camera_to((target.x+distance,target.y-distance*1.12,target.z+distance*.95+1),(target.x,target.y,target.z+.55),44)
        elif view=='schnitt':
            # A true geometry cut uses the same assembled scene; the original mesh stays intact.
            # Cut through the functional inlet/outlet, not beside it: the old
            # generic mid-field cut removed the entire drain from its lesson.
            section_x = .60 if detail=='f02' else .55 if detail=='f03' or (detail=='g06' and FLACH) else .713 if detail in ['s02','s03'] else target.x+.15
            for o in parts:
                original=o.data;o.data=original.copy();bm=bmesh.new();bm.from_mesh(o.data)
                inv=o.matrix_world.inverted();co=inv@Vector((section_x,0,0));normal=(o.matrix_world.to_3x3().transposed()@Vector((1,0,0))).normalized()
                try:
                    cut=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=co,plane_no=normal,clear_outer=True,clear_inner=False)
                    edges=[e for e in cut.get('geom_cut',[]) if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
                    if edges:
                        try:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
                        except RuntimeError:pass
                    bm.to_mesh(o.data)
                finally:bm.free()
            camera_to((target.x+distance*.95,target.y-distance,target.z+distance*.55),target,48)
        elif view=='fehler':
            apply_fault(detail,parts)
            camera_to((target.x+distance*.95,target.y-distance*1.05,target.z+distance*.85),target,48)
        else:camera_to((target.x+distance*.95,target.y-distance*1.05,target.z+distance*.85),target,48)
        fit_visible_render((target.x,target.y,target.z+.55) if view=='aufbau' else target)
        path=os.path.join(base,view+'.webp');render_webp(path)
        # Preview files are deliberately small and included in the normal app's offline shell.
        img=bpy.data.images.load(path,check_existing=False);img.scale(480,320);img.filepath_raw=os.path.join(PREVIEW,variant,detail+'-'+view+'.webp');os.makedirs(os.path.dirname(img.filepath_raw),exist_ok=True);img.file_format='WEBP';img.save();bpy.data.images.remove(img)
    detail_scene(detail,variant);join_parts();export_glb(os.path.join(base,'modell.glb'))
    production_record('detail',variant,detail,params,files)
    print('DACH_DETAIL_DONE '+json.dumps({'detail':detail,'variant':variant,'seconds':round(time.time()-started,2),'bytes':os.path.getsize(os.path.join(base,'modell.glb'))}),flush=True)


# Comparison faults change the named physical element, not an arbitrary red marker.
def apply_fault(detail,parts):
    def selected(suffix):return [o for o in parts if o.get('part_id')==detail+'-'+suffix]
    def hide(suffix,one=False):
        found=selected(suffix)
        if not found:raise ValueError('Missing physical fault part '+detail+'-'+suffix)
        for ob in found[:1] if one else found:ob.hide_render=True
        return found
    def move(suffix,vector,one=False):
        found=selected(suffix)
        if not found:raise ValueError('Missing physical fault part '+detail+'-'+suffix)
        for ob in found[:1] if one else found:ob.location+=Vector(vector)
    def gap(ob,axis,center,width=.09):
        # Bisect both sides of the actual source mesh, leaving a visible through-gap.
        ob.hide_render=True
        for right in [False,True]:
            copy=ob.copy();copy.data=ob.data.copy();copy.hide_render=False;bpy.context.collection.objects.link(copy)
            bm=bmesh.new();bm.from_mesh(copy.data)
            point=Vector((0,0,0));point[axis]=center+(width/2 if right else -width/2)
            normal=Vector((0,0,0));normal[axis]=1
            co=copy.matrix_world.inverted()@point;no=copy.matrix_world.to_3x3().transposed()@normal
            bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=co,plane_no=no,clear_inner=right,clear_outer=not right)
            bm.to_mesh(copy.data);bm.free()
    if detail=='g01':hide('innenanschluss')
    elif detail=='g02':hide('unterlage' if FLACH else 'pfette',True)
    elif detail=='g03':hide('daemmanschluss' if FLACH else 'anschluss')
    elif detail=='g04':hide('anschluss')
    elif detail=='g05':
        # The visible clip/plate stays, while the real load path to the support is missing.
        hide('anker')
    elif detail=='g06':hide('flansch' if FLACH else 'stutzen')
    elif detail=='s01':move('deckziegel',(0,0,.19),True)
    elif detail=='s02':
        for ob in selected('zusatzebene'):gap(ob,1,.13,.18)
    elif detail=='s03':move('fallrohr',(0,0,-.22))
    elif detail=='s04':hide('befestigung',True)
    elif detail=='s05':move('firstziegel',(0,0,.21),True)
    elif detail=='s06':
        for ob in selected('kehlblech'):gap(ob,1,.70,.11)
    elif detail=='s07':
        for ob in selected('anschlussblech'):
            if 'Aufkantung' in ob.name or 'Abdeckleiste' in ob.name:ob.hide_render=True
    elif detail=='s08':hide('rueckenteil')
    elif detail=='s09':
        # Keep the roof's lower water-bearing sheet. Open only the local
        # connection on the camera-facing window edge described by the text.
        for ob in selected('zusatzebene'):
            if 'Unterdeckungsanschluss' in ob.name and ob.location.x>0:ob.hide_render=True
            elif 'Unterdeckung durchgehend' in ob.name:
                ob.data=ob.data.copy()
                cutter=box('Temporäre offene Fensteranschlussstelle',xyz(.64,.95,-.035),(.14,1.25,.15),rotation=(SLOPE,0,0),bevel=0)
                bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Offener unterer Fensteranschluss','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
                bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
    elif detail=='s10':hide('wangenanschluss')
    elif detail=='s11':
        for ob in selected('formteil'):
            if 'manschette' in ob.name.lower():ob.hide_render=True
    elif detail=='w01':move('gratziegel',(0,0,.21),True)
    elif detail=='w02':hide('befestigung',True)
    elif detail=='w03':hide('knoten')
    elif detail=='w04':move('ziegel',(-.25,0,.05),True)
    elif detail=='f01':
        for ob in parts:
            if ob.get('layer')=='deckung':gap(ob,1,.84,.08)
    elif detail=='f02':
        for suffix in ['ablauf','flansch']:move(suffix,(0,0,.16))
    elif detail=='f03':hide('flansch')
    elif detail=='f04':cb('Sichtbare Sperre vor der Notwasseröffnung',(0,1.69,.64),(.42,.035,.16),'metal','fehler',None,3)
    elif detail=='f05':
        for ob in selected('ecke'):
            if 'abdeckung' in ob.name.lower():ob.hide_render=True
    elif detail=='f06':
        hide('befestigung')
        for ob in selected('abdichtung'):gap(ob,1,.15,.08)
    elif detail=='f07':hide('anschluss')
    elif detail=='f08':
        for ob in selected('anschluss'):
            if 'Aufsetzkranz' in ob.name:ob.hide_render=True
    elif detail=='f09':
        hide('fugenprofil');cb('Starre Überbrückung der Bauwerksfuge',(0,1.04,.53),(2.22,.17,.065),'metal','fehler','deckung',3)
    elif detail=='a01':hide('wetteranschluss',True)
    elif detail=='a02':hide('verankerung',True)
    elif detail=='a03':hide('halter',True)
    elif detail=='a04':
        found=selected('ableitung')
        if not found:raise ValueError('Missing a04 conductor')
        # Remove the connecting conductor, leaving the neighbouring sections in place.
        found[len(found)//2].hide_render=True


def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser();p.add_argument('--variant',choices=VARIANTS);p.add_argument('--detail');p.add_argument('--details');p.add_argument('--views',default='nah,schnitt,aufbau,fehler');p.add_argument('--samples',type=int,default=24);p.add_argument('--width',type=int,default=960);p.add_argument('--skip-existing',action='store_true');opts=p.parse_args(args)
    variants=[opts.variant] if opts.variant else VARIANTS
    for variant in variants:
        details=opts.details.split(',') if opts.details else [opts.detail] if opts.detail else ids_for(variant)
        for detail in details:
            if detail not in ids_for(variant):continue
            render_variant(detail,variant,opts.views.split(','),opts.samples,(opts.width,round(opts.width*2/3)),opts.skip_existing)
if __name__=='__main__':main()
