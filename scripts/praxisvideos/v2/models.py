"""Own Blender workbench, formed Falzziegel and guarded model cutting station.

Coordinates/metres derive from the Falzziegel system card exported by content.mjs.
Production source assets stay outside the runtime app: .praxisvideo-production/v2.
"""
import bpy, math, os, json
import numpy as np
from mathutils import Vector

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../..'))
BUILD=os.path.join(ROOT,'.praxisvideo-production/v2')
OUT=os.path.join(BUILD,'models');os.makedirs(OUT,exist_ok=True)
SYSTEM=json.load(open(os.path.join(BUILD,'system.json')))
CARD=SYSTEM['systemkarte']
W=CARD['masse']['ziegelBreite']/100;L=CARD['masse']['ziegelLaenge']/100

def reset():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def texture(kind):
    size=1024;rng=np.random.default_rng(1606);y,x=np.mgrid[0:size,0:size];noise=rng.normal(0,.018,(size,size))
    if kind=='wood':
        grain=np.sin(x*.16+np.sin(y*.009)*2.5)*.038+np.sin(x*.51+y*.003)*.015+noise*.4
        rgb=np.stack([.50+grain,.34+grain*.85,.19+grain*.6],-1);rough=.66+noise
    else:
        grain=noise+np.sin(x*.017)*np.sin(y*.025)*.012
        rgb=np.stack([.49+grain,.185+grain*.7,.087+grain*.6],-1);rough=.70+noise
    height=grain;gy,gx=np.gradient(height);normal=np.stack([-gx*1.7,-gy*1.7,np.ones_like(gx)],-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True);normal=normal*.5+.5
    paths={}
    for name,data in [('color',rgb),('rough',np.stack([rough]*3,-1)),('normal',normal)]:
        rgba=np.concatenate([np.clip(data,0,1),np.ones((size,size,1))],axis=-1).astype(np.float32)
        im=bpy.data.images.new(kind+'_'+name,width=size,height=size,alpha=False)
        im.pixels.foreach_set(rgba.ravel());im.filepath_raw=os.path.join(OUT,kind+'-'+name+'.png');im.file_format='PNG';im.save();paths[name]=im
    return paths

def mat(name,color,rough=.5,metal=0,maps=None):
    m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    if maps:
        for kind,socket in [('color','Base Color'),('rough','Roughness')]:
            t=n.new('ShaderNodeTexImage');t.image=maps[kind]
            if kind!='color':t.image.colorspace_settings.name='Non-Color'
            m.node_tree.links.new(t.outputs['Color'],bs.inputs[socket])
        t=n.new('ShaderNodeTexImage');t.image=maps['normal'];t.image.colorspace_settings.name='Non-Color';normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.28;m.node_tree.links.new(t.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    m.diffuse_color=(*color,1);return m

wood=mat('Werkbank · geölte Holzfaser',(.50,.34,.19),.66,maps=texture('wood'))
clay=mat('Ton · matte eigene Oberflächenstruktur',(.49,.185,.087),.7,maps=texture('clay'))
steel=mat('Gebürsteter Stahl',(.36,.40,.43),.29,.88)
dark=mat('Pulverbeschichteter Stahl',(.035,.055,.060),.48,.35)
rubber=mat('Elastische Auflage',(.027,.031,.029),.9)
yellow=mat('Schutzhaube · Modellmarkierung',(.77,.40,.055),.42,.08)
pencilmat=mat('Zimmermannsstift',(.42,.055,.03),.6)
graphite=mat('Graphitspitze',(.025,.027,.029),.78)
white=mat('Messskala',(.78,.78,.71),.65)

def empty(name,parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o)
    if parent:o.parent=parent
    return o
def finish(o,name,material,parent=None,bevel=0):
    o.name=name;o.data.materials.append(material)
    if parent:o.parent=parent
    if bevel:
        mod=o.modifiers.new('Kleine reale Kantenrundung','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def box(name,pos,size,material,parent=None,bevel=.001):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,parent,bevel)
def cylinder(name,pos,radius,depth,material,parent=None,rotation=(0,0,0),vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=pos,rotation=rotation);o=bpy.context.object
    return finish(o,name,material,parent,.0005)
def mesh(name,verts,faces,material,parent=None,bevel=.0006):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);finish(o,name,material,parent,bevel)
    # Stable metre-scale box UV mapping for source colour, roughness and normal.
    uv=o.data.uv_layers.new(name='Own metre mapped UV')
    for poly in o.data.polygons:
        for li in poly.loop_indices:
            co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co.x*3.8,co.y*3.8)
    return o
def export(name):
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',export_yup=True,export_apply=True,export_extras=True,export_image_format='AUTO')

reset()
box('Werkbankplatte',(0,0,.77),(1.36,.94,.065),wood,bevel=.008)
for x in [-.55,.55]:
    for y in [-.35,.35]:box('Werkbankbein',(x,y,.375),(.055,.055,.72),dark,bevel=.004)
for y in [-.35,.35]:box('Querholm',(0,y,.28),(1.14,.035,.065),dark)
box('Werkstattboden',(0,0,-.027),(8,8,.04),mat('Neutraler mineralischer Boden',(.29,.30,.28),.92),bevel=0)
export('bench')

reset();tile=empty('Falzziegel')
# Own shallow pan, side underlap/overlap and head channel. Same physical geometry
# is used for the single piece, the real cut halves and the four laying pieces.
cross=[(-.14,.009),(-.132,.012),(-.12,.014),(-.106,.010),(-.093,.007),(-.06,.005),(.025,.006),(.065,.012),(.09,.027),(.108,.032),(.127,.028),(.14,.022)]
_cut_task=next(u for u in SYSTEM['einheiten'] if u['slug']=='schnitt')['aufgaben'][0]
_cut_x=next(p['x'] for p in _cut_task['punkte'] if p['id']==_cut_task['loesung'][0])
CUT=(_cut_x-100)/440*W-W/2
def section_value(x):
    for (a,z),(b,zz) in zip(cross,cross[1:]):
        if a<=x<=b:return z+(zz-z)*(x-a)/(b-a)
    return cross[-1][1]
def tile_half(name,a,b):
    xs=sorted(set([a,b]+[x for x,z in cross if a<x<b]));verts=[]
    for y in [-L/2,L/2]:
        for x in xs:verts.append((x,y,section_value(x)+.010*(y/L+.5)))
    n=len(xs);verts += [(x,y,z-.010) for x,y,z in verts];faces=[]
    for i in range(n-1):
        faces.extend([(i,i+1,n+i+1,n+i),(2*n+i,3*n+i,3*n+i+1,2*n+i+1),(i,2*n+i,2*n+i+1,i+1),(n+i,n+i+1,3*n+i+1,3*n+i)])
    faces.extend([(0,n,3*n,2*n),(n-1,2*n-1,4*n-1,3*n-1)])
    return mesh(name,verts,faces,clay,tile)
tile_half('Ziegelkoerper',-W/2,W/2)
box('Aufhaengung',(-.071,L/2-.040,-.011),(.046,.017,.021),clay,tile,bevel=.002)
box('Kopfbereich',(-.018,L/2-.018,.016),(.20,.016,.016),clay,tile,bevel=.002)
tile['modellkarte']=CARD['id'];tile['aussenmass_m']=[W,L];tile['deckmass_m']=[.24,.34];tile['schnitt_x_m']=CUT
export('tile')
# A separate cut geometry is used only after the moving blade has passed the
# complete workpiece. Unworked tiles never contain a seam or a suggested answer.
for body in list(tile.children):
    if body.name.startswith('Ziegelkoerper'):bpy.data.objects.remove(body,do_unlink=True)
tile_half('Nutzstueck',-W/2,CUT-.0008);tile_half('Reststueck',CUT+.0008,W/2)
export('tile-cut')

reset()
p=empty('Pencil')
box('Stiftkoerper',(0,0,.10),(.009,.005,.17),pencilmat,p,bevel=.0008)
bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.0003,radius2=.0045,depth=.015,location=(0,0,.0075));finish(bpy.context.object,'Graphitspitze',graphite,p)
p.rotation_euler=(.32,-.24,0)
t=empty('Template');box('Schablone',(0,0,0),(.022,.43,.0025),steel,t,bevel=.0007)
for sign in [-1,1]:box('Anschlag',(sign*.028,sign*.185,.002),(.075,.012,.008),dark,t)
r=empty('Ruler');box('Massstab',(0,0,0),(.025,.45,.003),white,r)
for i in range(45):box('Skalenstrich',(0,(i-22)*.01,.0022),(.015 if i%5==0 else .008,.0006,.0006),dark,r,bevel=0)
export('marking')

reset()
station=empty('CuttingStation')
box('Auffangwanne',(0,0,.005),(.63,.68,.035),dark,station,bevel=.012)
# Profiled school-fixture supports touch the actual tile underside; the left
# support ends before its hanging nib and both leave the marked cut channel free.
for index,(a,b,y0,y1) in enumerate([(-.095,-.025,-.18,.115),(.060,.130,-.18,.18)]):
    xs=sorted(set([a,b]+[x for x,z in cross if a<x<b]));verts=[]
    for y in [y0,y1]:
        for x in xs:verts.append((x,y,.05+section_value(x)+.010*(y/L+.5)-.010-.0003))
    n=len(xs);verts += [(x,y,.023) for x,y,z in verts];faces=[]
    for j in range(n-1):faces.extend([(j,j+1,n+j+1,n+j),(2*n+j,3*n+j,3*n+j+1,2*n+j+1),(j,2*n+j,2*n+j+1,j+1),(n+j,n+j+1,3*n+j+1,3*n+j)])
    faces.extend([(0,n,3*n,2*n),(n-1,2*n-1,4*n-1,3*n-1)])
    mesh('Profilierte_Werkstueckauflage_'+str(index+1),verts,faces,rubber,station,bevel=.0002)
for x in [-.27,.27]:
    box('Fuehrungsstuetze',(x,.28,.19),(.035,.035,.37),steel,station,bevel=.003)
box('Fuehrung',(0,.28,.37),(.60,.055,.055),dark,station,bevel=.004)
box('Schnittkanal',(CUT,0,.026),(.014,.60,.009),steel,station,bevel=.002)
head=empty('SawHead');head.location=(CUT,.28,.145)
cylinder('Trennscheibe',(0,0,0),.11,.0025,steel,head,rotation=(0,math.pi/2,0),vertices=64)
cylinder('Nabe',(0,0,0),.023,.034,dark,head,rotation=(0,math.pi/2,0))
verts=[];faces=[]
arc_segments=128;arc_points=arc_segments+1
for x in [-.018,.018]:
    for i in range(arc_points):
        angle=math.pi*i/arc_segments;verts.append((x,math.cos(angle)*.125,math.sin(angle)*.125))
for i in range(arc_segments):faces.append((i,i+1,arc_points+i+1,arc_points+i))
faces += [tuple(range(arc_segments,-1,-1)),tuple(range(arc_points,2*arc_points))]
guard=mesh('Schutzhaube',verts,faces,yellow,head,bevel=0)
# Smooth the curved manufactured rim while retaining the planar closed sides.
for polygon in guard.data.polygons:
    polygon.use_smooth=polygon.index<arc_segments
box('Antriebsgehaeuse',(-.060,0,.028),(.075,.11,.08),dark,head,bevel=.009)
for x in [-.105,.105]:
    clamp=empty('ClampLeft' if x<0 else 'ClampRight');clamp.location=(x,-.135,.0)
    box('Spannfuss',(0,0,.04),(.034,.045,.055),dark,clamp,bevel=.003)
    cylinder('Spannspindel',(0,0,.10),.006,.10,steel,clamp)
    box('Spannpratze',(0,.023,.081),(.022,.07,.015),steel,clamp,bevel=.002)
    box('Druckauflage',(0,.045,.066),(.025,.025,.009),rubber,clamp,bevel=.002)
export('cutting')
print('Own Blender assets ready:',OUT)
