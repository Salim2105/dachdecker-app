"""Build the five own roof overviews and their matching rendered views.
blender -b -t 4 --python scripts/dach3d/roofs.py -- [variant|all]
"""
import os,sys,math,random,json,argparse
sys.path.insert(0,os.path.dirname(__file__))
import bpy
from mathutils import Vector
from common import *
from production import record as production_record,overview_files

VARIANTS=['steildach-falzziegel','steildach-biber-doppel','walmdach-falzziegel','walmdach-biber-doppel','flachdach-warmdach']
COMMON=['g%02d'%i for i in range(1,7)]
STEEP=['s%02d'%i for i in range(1,12)]
HIP=['s%02d'%i for i in (1,2,3,5,7,8,9,11)]+['w%02d'%i for i in range(1,5)]
FLAT=['f%02d'%i for i in range(1,10)]
EQUIP=['a%02d'%i for i in range(1,5)]

def shell(name,polygon,thickness,mat,detail_id,layer,step=0,normal=(0,0,1)):
    n=Vector(normal).normalized()*thickness; low=[Vector(p) for p in polygon]; high=[p+n for p in low]
    verts=low+high;l=len(low);faces=[tuple(range(l-1,-1,-1)),tuple(range(l,l*2))]+[(i,(i+1)%l,(i+1)%l+l,i+l)for i in range(l)]
    return mesh(name,verts,faces,mat,detail_id,layer,step)

def batch_add(verts,faces,poly,normal,thickness,head_dir=None):
    k=len(verts);l=len(poly);n=Vector(normal).normalized()*thickness
    # Overview LOD omits only the hidden bottom of each deck tile. The detailed
    # teaching meshes retain closed solids; visible feet, edges and laps remain.
    verts.extend(poly);verts.extend([Vector(p)+n for p in poly]);faces.append(tuple(k+l+i for i in range(l)))
    head=max(Vector(p).dot(head_dir) for p in poly) if head_dir is not None else None
    for i in range(l):
      # The covered head cap contributes no visible surface in an overview.
      if head is not None and all(abs(Vector(poly[j]).dot(head_dir)-head)<.00001 for j in[i,(i+1)%l]):continue
      faces.append((k+i,k+(i+1)%l,k+(i+1)%l+l,k+i+l))

def clip(poly, value):
    out=[]
    for i,p in enumerate(poly):
      q=poly[(i+1)%len(poly)];vp=value(p);vq=value(q)
      if vp>=-.00001:out.append(p)
      if (vp>=0)!=(vq>=0):out.append(Vector(p)+(Vector(q)-Vector(p))*(vp/(vp-vq)))
    return out

def without_rectangle(poly,xmin,xmax,ymin,ymax):
    """Disjoint remaining tile fragments around a rectangular roof opening."""
    left=clip(poly,lambda q:xmin-q.x)
    right=clip(poly,lambda q:q.x-xmax)
    middle=clip(clip(poly,lambda q:q.x-xmin),lambda q:xmax-q.x)
    below=clip(middle,lambda q:ymin-q.y)
    above=clip(middle,lambda q:q.y-ymax)
    return [p for p in [left,right,below,above] if len(p)>2]

def roof_tiles(side,hip,biber,M):
    eave=3.48;rise=2.65;half=4.75;length=11.5;hipridge=2.2
    u=Vector((-side*half,0,rise)).normalized();h=Vector((0,1,0));n=h.cross(u)
    if n.z<0:n=-n
    L=.38 if biber else .42;W=.178 if biber else .28;pitch=.15 if biber else .34;breadth=.18 if biber else .24
    total=math.hypot(half,rise);batches=[([],[]),([],[])];rnd=random.Random(17+side)
    for r in range(int(total/pitch)+1):
      for c in range(int(length/breadth)+2):
        along=-length/2+c*breadth+((r%2)*breadth*.5 if biber else 0)
        p=Vector((side*half,along,eave))+u*(r*pitch)+n*(.115+r*.0005)
        if not hip:
          x,y=p.x,p.y
          # The dormer and window are actual openings in the positive roof plane.
          if side>0:
            if -2.08<y<.08 and x<4.10 and x>(6.13-(5.95-.85*abs(y+1)))/(.558):continue
        outline=[(-W/2,L),(W/2,L),(W/2,.045),(W*.25,0),(-W*.25,0),(-W/2,.045)] if biber else [(-W/2,L),(W/2,L),(W/2,0),(-W/2,0)]
        # A real shingle has a slightly raised foot and a lower head. Keeping
        # every tile perfectly coplanar hid all head laps in the overview and
        # made the roof resemble long metal strips instead of separate tiles.
        laprise=.031 if biber else .024
        poly=[p+h*a+u*b+n*(laprise*(1-b/L)) for a,b in outline]
        poly=clip(poly,lambda q:length/2-q.y);poly=clip(poly,lambda q:q.y+length/2)
        poly=clip(poly,lambda q:side*q.x+.07)
        if hip:
          poly=clip(poly,lambda q:hipridge+(length/2-hipridge)*(abs(q.x)/half)-abs(q.y))
        if len(poly)<3:continue
        group=1 if rnd.random()<.016 else 0;v,f=batches[group]
        fragments=without_rectangle(poly,2.45,3.65,2.59,3.85) if side>0 else [poly]
        for fragment in fragments:batch_add(v,f,fragment,n,.014,u)
        if not biber and len(poly)==4:
          for sign in [-1,1]:
            edge=p+h*(sign*(W/2-.018))+u*(L*.5)+n*.019
            strip=[edge+h*(-.011)+u*(-L*.49),edge+h*.011+u*(-L*.49),edge+h*.011+u*(L*.49),edge+h*(-.011)+u*(L*.49)]
            if hip:strip=clip(strip,lambda q:hipridge+(length/2-hipridge)*(abs(q.x)/half)-abs(q.y))
            strip=clip(strip,lambda q:side*q.x+.07)
            if len(strip)>2:
              strips=without_rectangle(strip,2.45,3.65,2.59,3.85) if side>0 else [strip]
              for fragment in strips:batch_add(v,f,fragment,n,.009,u)
    for i,(v,f)in enumerate(batches):
      if v:mesh('Deckziegel '+('Biber'if biber else'Falz')+' Dachfläche '+str(side)+' Nuance'+str(i),v,f,M['ceramic_dark'if i else'ceramic'],'s01','deckung',4)
    if hip:
      # The triangular hipped end planes are independently tiled, with real clipped edge pieces.
      run=length/2-hipridge;u0=Vector((0,-side*run,rise)).normalized();h0=Vector((1,0,0));n0=h0.cross(u0)
      if n0.z<0:n0=-n0
      v=[];f=[];tot=math.hypot(run,rise)
      for r in range(int(tot/pitch)+1):
       for c in range(int(half*2/breadth)+2):
        along=-half+c*breadth+((r%2)*breadth*.5 if biber else 0);p=Vector((along,side*length/2,eave))+u0*(r*pitch)+n0*.115
        outline=[(-W/2,L),(W/2,L),(W/2,.045),(W*.25,0),(-W*.25,0),(-W/2,.045)] if biber else [(-W/2,L),(W/2,L),(W/2,0),(-W/2,0)]
        poly=[p+h0*a+u0*b+n0*((.031 if biber else .024)*(1-b/L)) for a,b in outline]
        poly=clip(poly,lambda q:half*(abs(q.y)-hipridge)/run-abs(q.x));poly=clip(poly,lambda q:side*q.y-hipridge)
        if len(poly)>2:batch_add(v,f,poly,n0,.014,u0)
      if v:mesh('Walmfläche mit Grat-Zuschnitten '+str(side),v,f,M['ceramic'],'w04','deckung',4)

def gutter(name,a,b,M,detail='s03'):
    a,b=Vector(a),Vector(b);d=(b-a).normalized();side=Vector((d.y,-d.x,0));radius=.16;verts=[];faces=[]
    for p in [a,b]:
      for rr in [radius,radius-.006]:
        for i in range(17):
          t=math.pi*i/16;verts.append(p+side*math.cos(t)*rr+Vector((0,0,-math.sin(t)*rr)))
    for j in range(16):
      faces.append((j,j+1,34+j+1,34+j));faces.append((17+j,51+j,51+j+1,17+j+1))
    for j in [0,16]:faces.append((j,34+j,51+j,17+j))
    mesh(name,verts,faces,M['zinc'],detail,'deckung',3)
    for sign in [-1,1]:pipe_between(name+' Wulst '+str(sign),a+side*(radius*sign),b+side*(radius*sign),.009,M['zinc'],detail,'deckung',3)
    for i in range(1,max(2,int((b-a).length/.7))):
      p=a+d*(i*(b-a).length/max(2,int((b-a).length/.7)))
      vv=[];ff=[]
      for offset in[-.016,.016]:
        for j in range(17):
          t=math.pi*j/16;vv.append(p+d*offset+side*math.cos(t)*(radius+.012)+Vector((0,0,-math.sin(t)*(radius+.012))))
      ff=[(j,j+1,17+j+1,17+j)for j in range(16)]
      mesh('Rinnenhalter '+str(i),vv,ff,M['steel'],detail,'deckung',2)
      beam_between('Rinnenhalter Befestigung',p+Vector((0,0,-.08)),p-side*.27+Vector((0,0,.07)),.035,.016,M['steel'],detail,'lattung',2,bevel=.004)

def dormer_deck(side,biber,M):
    center=-1;front=4.18;edge=5.10;top=5.95
    u=Vector((0,-side,.85)).normalized();h=Vector((1,0,0));n=h.cross(u)
    if n.z<0:n=-n
    L=.38 if biber else .42;W=.178 if biber else .28;pitch=.15 if biber else .34;breadth=.18 if biber else .24
    verts=[];faces=[]
    for row in range(int(math.hypot(1,.85)/pitch)+1):
      for col in range(24 if biber else 19):
        x=.15+col*breadth+(breadth/2 if biber and row%2 else 0)
        p=Vector((x,center+side,edge))+u*(row*pitch)+n*.065
        outline=[(-W/2,L),(W/2,L),(W/2,.045),(W*.25,0),(-W*.25,0),(-W/2,.045)] if biber else [(-W/2,L),(W/2,L),(W/2,0),(-W/2,0)]
        poly=[p+h*a+u*b+n*((.031 if biber else .024)*(1-b/L)) for a,b in outline]
        poly=clip(poly,lambda q:front-q.x)
        poly=clip(poly,lambda q:q.z-(6.13-2.65*q.x/4.75))
        poly=clip(poly,lambda q:side*(q.y-center))
        poly=clip(poly,lambda q:1.02-side*(q.y-center))
        if len(poly)>2:batch_add(verts,faces,poly,n,.012,u)
    mesh('Gaubendeckung '+('Biber-Doppeldeckung' if biber else 'Falzziegel')+' '+str(side),verts,faces,M['ceramic'],'s10','deckung',4)

def downpipe(x,y,z,M,detail='s03'):
    # Linked bevelled curves make bends continuous, with visible sleeve rings.
    points=[(x,y,z-.12),(x+.18,y,z-.38),(x+.26,y,z-.58),(x+.26,y,.43),(x+.46,y,.24)]
    curve=bpy.data.curves.new('Fallrohr Rundprofil','CURVE');curve.dimensions='3D';curve.bevel_depth=.064;curve.bevel_resolution=3;sp=curve.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    ob=bpy.data.objects.new('Fallrohr mit Bögen',curve);bpy.context.collection.objects.link(ob);ob.data.materials.append(M['zinc']);tag(ob,detail,'deckung',4)
    for zz in [.8,2.2]:
      bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=6,location=(x+.26,y,zz),major_radius=.067,minor_radius=.012);o=bpy.context.object;o.name='Rohrschelle';o.data.materials.append(M['metal']);tag(o,detail,'deckung',4)
      beam_between('Schellenhalter',(x+.26,y,zz),(x-.22,y,zz),.027,.027,M['metal'],detail,'deckung',4)

def ridge(a,b,M,detail='s05',width=.28):
    a,b=Vector(a),Vector(b);length=(b-a).length;d=(b-a).normalized();side=d.cross(Vector((0,0,1))).normalized();up=side.cross(d).normalized()
    if up.z<0:up=-up
    for i in range(max(1,int(length/.37))):
      p=a+d*(i*.37);q=a+d*min(length,i*.37+.41);vv=[]
      for endpoint in[p,q]:
        for j in range(9):
          t=math.pi*j/8;vv.append(endpoint+side*math.cos(t)*width*.5+up*math.sin(t)*width*.5)
      mesh('First-/Gratziegel '+detail+' '+str(i),vv,[(j,j+1,9+j+1,9+j)for j in range(8)],M['ceramic'],detail,'deckung',5)

def solar_panel(name,center,u,h,M,detail='a01',flat=False):
    p=Vector(center);u=Vector(u).normalized();h=Vector(h).normalized();n=h.cross(u)
    if n.z<0:n=-n
    w=1.03;l=1.72
    poly=[p+h*(-w/2)+u*(-l/2),p+h*(w/2)+u*(-l/2),p+h*(w/2)+u*(l/2),p+h*(-w/2)+u*(l/2)]
    shell(name+' Alurahmen',poly,.045,M['metal'],detail,'deckung',4,n)
    cell=[p+h*(-w/2+.025)+u*(-l/2+.025)+n*.046,p+h*(w/2-.025)+u*(-l/2+.025)+n*.046,p+h*(w/2-.025)+u*(l/2-.025)+n*.046,p+h*(-w/2+.025)+u*(l/2-.025)+n*.046]
    shell(name+' Solarzellen',cell,.004,M['pv'],detail,'deckung',5,n)
    for aa in [-.72,.72]:
      beam_between(name+' Montageschiene',p+u*aa-h*.59-n*.045,p+u*aa+h*.59-n*.045,.04,.045,M['metal'],detail,'lattung',2)
      for hh in[-.36,.36]:
        pp=p+u*aa+h*hh
        if flat:box(name+' Ballast',(pp.x,pp.y,3.62),(.45,.3,.12),M['concrete'],detail,'tragwerk',1)
        else:beam_between(name+' Dachhaken',pp-n*.05,pp-n*.21,.025,.038,M['metal'],detail,'lattung',1)

def steep_house(hip,biber,M):
    e=3.48;r=2.65;ridgeZ=e+r;half=4.75;length=11.5;hr=2.2
    box('Putzkörper Erdgeschoss',(0,0,1.55),(8.6,10.6,3.1),M['plaster'],'g02','tragwerk',0,bevel=.045)
    box('Sockelzone',(0,0,.23),(8.72,10.72,.4),M['concrete'],'g02','tragwerk',0)
    if not hip:
      for sy in[-1,1]:shell('Giebelwand', [(-4.3,sy*5.3,3.08),(4.3,sy*5.3,3.08),(0,sy*5.3,6.05)],.12,M['plaster'],'g02','tragwerk',normal=(0,sy,0))
    # Real openings and sober glazing on the visible elevations.
    for x in[-2.3,.0,2.3]:
      box('Fensterrahmen Front',(x,-5.325,1.75),(1.38,.11,1.35),M['steel'],'g02','tragwerk',0,bevel=.015)
      box('Fensterglas Front',(x,-5.389,1.75),(1.18,.022,1.16),M['glass'],'g02','tragwerk',0,bevel=.005)
      box('Fensterbank Front',(x,-5.46,1.05),(1.51,.32,.04),M['zinc'],'g02','tragwerk',0,bevel=.005)
    # Additional levels are separately selectable and form a physically continuous roof base.
    for sx in[-1,1]:
      poly=[(sx*.0,-length/2,ridgeZ),(sx*half,-length/2,e),(sx*half,length/2,e),(0,length/2,ridgeZ)]
      if hip:poly=[(0,-hr,ridgeZ),(sx*half,-length/2,e),(sx*half,length/2,e),(0,hr,ridgeZ)]
      shell('Zusatzebene '+str(sx),poly,-.015,M['membrane'],'g01','zusatzebene',2)
      for yy in[-5.1,-3.8,-2.5,-1.2,.1,1.4,2.7,4.0,5.2]:
        if hip and abs(yy)>hr:innerx=half*(abs(yy)-hr)/(length/2-hr)
        else:innerx=0
        beam_between('Sparren '+str(sx)+' '+str(yy),(sx*(half-.18),yy,e-.21),(sx*innerx,yy,ridgeZ-r*(innerx/half)-.21),.09,.18,M['wood'],'g02','tragwerk',0)
        beam_between('Konterlatte '+str(sx)+' '+str(yy),(sx*(half-.1),yy,e+.025),(sx*innerx,yy,ridgeZ-r*(innerx/half)+.025),.055,.045,M['wood'],'g02','lattung',2,bevel=.007)
      for j in range(16):
        xx=(j+.3)*half/16;zz=ridgeZ-r*xx/half+.045;hy=hr+(length/2-hr)*xx/half if hip else length/2
        beam_between('Traglatte '+str(sx)+' '+str(j),(sx*xx,-hy,zz),(sx*xx,hy,zz),.04,.06,M['wood'],'g02','lattung',3,bevel=.005)
      roof_tiles(sx,hip,biber,M)
      gutter('Dachrinne '+str(sx),(sx*4.95,-length/2,3.48),(sx*4.95,length/2,3.48),M)
      box('Traufbohle '+str(sx),(sx*4.72,0,3.32),(.14,length,.23),M['wood'],'s02','lattung',2)
      shell('Traufblech '+str(sx),[(sx*4.55,-length/2,3.51),(sx*4.98,-length/2,3.39),(sx*4.98,length/2,3.39),(sx*4.55,length/2,3.51)],.005,M['zinc'],'s02','deckung',3)
    # Hidden insulating and airtight layers are actual thin grouped volumes.
    for sx in[-1,1]:
      poly=[(0,-4.7,ridgeZ-.31),(sx*4.3,-4.7,e-.06),(sx*4.3,4.7,e-.06),(0,4.7,ridgeZ-.31)] if not hip else [(0,-hr,ridgeZ-.15),(sx*half,-length/2,e-.15),(sx*half,length/2,e-.15),(0,hr,ridgeZ-.15)]
      shell('Dämmung '+str(sx),poly,-.13,M['insulation'],'g03','daemmung',1)
      shell('Luftdichtung '+str(sx),[(x,y,z-.15)for x,y,z in poly],-.005,M['seal'],'g04','luftdichtheit',1)
    if hip:
      for sy in[-1,1]:
        # The hipped ends need their own triangular layers. Reusing full
        # rectangular gable-roof insulation made yellow planes float above
        # the lower hipped surface, an actual geometry error rather than a cut.
        poly=[(-half,sy*length/2,e),(half,sy*length/2,e),(0,sy*hr,ridgeZ)]
        shell('Walm Zusatzebene '+str(sy),poly,-.015,M['membrane'],'g01','zusatzebene',2)
        shell('Walm Dämmung '+str(sy),[(x,y,z-.15)for x,y,z in poly],-.13,M['insulation'],'g03','daemmung',1)
        shell('Walm Luftdichtung '+str(sy),[(x,y,z-.30)for x,y,z in poly],-.005,M['seal'],'g04','luftdichtheit',1)
        for x in[-3.8,-1.9,0,1.9,3.8]:
          beam_between('Walmsparren '+str(sy)+str(x),(x,sy*(length/2-.12),e-.21),(0,sy*hr,ridgeZ-.21),.08,.16,M['wood'],'g02','tragwerk',0,bevel=.008)
    ridge((0,-hr if hip else -length/2,ridgeZ+.055),(0,hr if hip else length/2,ridgeZ+.055),M)
    if hip:
      for sx in[-1,1]:
       for sy in[-1,1]:ridge((sx*half,sy*length/2,e+.07),(0,sy*hr,ridgeZ+.07),M,'w01',.32)
      for sy in[-1,1]:gutter('Walm-Traufrinne '+str(sy),(-4.95,sy*5.75,e),(4.95,sy*5.75,e),M)
    else:
      for sy in[-1,1]:
       for sx in[-1,1]:
        beam_between('Ortgang-Holzabschluss',(sx*4.8,sy*5.77,e-.02),(0,sy*5.77,ridgeZ-.02),.12,.17,M['wood'],'s04','lattung',2)
        for j in range(16):
          x=sx*(4.7-j*.3);z=ridgeZ-r*abs(x)/half+.025
          box('Ortgangziegel Seitenabschluss',(x,sy*5.81,z),(.34,.11,.13),M['ceramic'],'s04','deckung',4,bevel=.013,rotation=(0,sx*math.atan2(r,half),0))
      # Satteldachgaube: intersection with the main roof determines both valley lines.
      center=-1;front=4.02;top=5.95;edge=5.10
      shell('Gaubenfront',[ (front,-2,3.9),(front,0,3.9),(front,0,edge),(front,-1,top),(front,-2,edge)],.08,M['plaster'],'s10','tragwerk',1,normal=(1,0,0))
      for yy in[-2,0]:
        back=(ridgeZ-edge)/(r/half)
        shell('Gaubenwange '+str(yy),[(back,yy,edge),(front,yy,e+r*(1-front/half)),(front,yy,edge)],.07,M['plaster'],'s10','tragwerk',1,normal=(0,1,0))
      box('Gaubenfenster Rahmen',(front+.09,-1,4.62),(.08,1.34,1.03),M['steel'],'s10','deckung',3,bevel=.012)
      box('Gaubenfenster Glas',(front+.139,-1,4.62),(.015,1.18,.87),M['glass'],'s10','deckung',4,bevel=.003)
      for sy in[-1,1]:
        yy=center+sy;back_edge=(ridgeZ-edge)/(r/half);back_top=(ridgeZ-top)/(r/half)
        poly=[(back_top,center,top),(front+.16,center,top),(front+.16,yy,edge),(back_edge,yy,edge)]
        shell('Gauben Zusatzebene '+str(sy),poly,.008,M['membrane'],'s10','zusatzebene',2)
        dormer_deck(sy,biber,M)
        a=Vector((back_top,center,top+.025));b=Vector((back_edge,yy,edge+.025));v=(b-a).normalized();w=Vector((0,0,1)).cross(v).normalized()*.12
        shell('Kehlausbildung Gaube '+str(sy),[a-w,b-w,b+w,a+w],.005,M['zinc'],'s06','deckung',3)
      ridge((back_top,-1,top+.07),(front+.14,-1,top+.07),M,'s10',.22)
    # Roof window sits in its own cut-out on positive main slope.
    slope=math.atan2(r,half);p=Vector((3.05,3.22,ridgeZ-r*3.05/half));u=Vector((-half,0,r)).normalized();h=Vector((0,1,0));n=h.cross(u)
    if n.z<0:n=-n
    p+=n*.115
    poly=[p+h*(-.68)+u*(-.75),p+h*.68+u*(-.75),p+h*.68+u*.75,p-h*.68+u*.75]
    shell('Dachfenster Eindeckrahmen',poly,.055,M['zinc'],'s09','deckung',3,n)
    poly=[p+h*(-.53)+u*(-.59)+n*.064,p+h*.53-u*.59+n*.064,p+h*.53+u*.59+n*.064,p-h*.53+u*.59+n*.064]
    shell('Dachfenster Flügelrahmen',poly,.05,M['steel'],'s09','deckung',4,n)
    shell('Dachfenster Glas',[p+h*(-.46)+u*(-.5)+n*.12,p+h*.46-u*.5+n*.12,p+h*.46+u*.5+n*.12,p-h*.46+u*.5+n*.12],.008,M['glass'],'s09','deckung',4,n)
    # Chimney with each apron/back/side flashing represented as metal parts.
    cx=-1.55;cy=1.2;cz=ridgeZ-r*abs(cx)/half
    box('Schornsteinschaft',(cx,cy,cz+.85),(.72,.86,1.9),M['plaster'],'s08','tragwerk',1)
    box('Schornsteinkopf Abdeckung',(cx,cy,cz+1.84),(.88,1.02,.11),M['zinc'],'s08','deckung',5)
    for dx,dy,sx,sy in[(0,-.53,1.04,.2),(0,.53,1.04,.2),(-.51,0,.2,1.02),(.51,0,.2,1.02)]:
      box('Schornstein Anschlussblech',(cx+dx,cy+dy,cz+.10),(sx,sy,.12),M['zinc'],'s08','deckung',3,bevel=.01)
    cylinder('Entlüftungsrohr',(1.05,1.42,ridgeZ-r*1.05/half+.31),.10,.70,M['steel'],'s11','deckung',3)
    cylinder('Entlüfter Anschlussmanschette',(1.05,1.42,ridgeZ-r*1.05/half+.035),.22,.055,M['zinc'],'s11','zusatzebene',2)
    box('Entlüfter Haube',(1.05,1.42,ridgeZ-r*1.05/half+.7),(.32,.32,.07),M['zinc'],'s11','deckung',4,bevel=.03)
    # A higher annex wall creates a real upper and side wall junction.
    box('Anschlusswand Nachbarbauteil',(-4.5,4.55,3.80),(.32,1.75,1.6),M['plaster'],'s07','tragwerk',1)
    box('Wandanschluss Abdeckblech',(-4.3,4.55,3.66),(.35,1.83,.18),M['zinc'],'s07','deckung',3,bevel=.01)
    # Four solar modules and their visible load-transfer hardware.
    for row in[0,1]:
     for col in[0,1]:
      xx=1.5+row*1.48;yy=(-.6 if hip else -4.55)+col*1.12;zz=ridgeZ-r*xx/half+.16
      solar_panel('PV-Modul '+str(row)+str(col),(xx,yy,zz),u,h,M)
    for zz in[.0,.10]:
      pipe_between('Schneefang Rohr '+str(zz),(4.39,-5.45,e+.32+zz),(4.39,5.45,e+.32+zz),.025,M['steel'],'a02','deckung',5)
    for yy in[-4.7,-3.2,-1.7,-.2,1.3,2.8,4.3]:
      beam_between('Schneefang Stütze',(4.43,yy,e+.13),(4.39,yy,e+.47),.035,.025,M['metal'],'a02','lattung',3,bevel=.005)
    # Walkway and individual access steps near the chimney.
    for j in range(5):
      xx=-4.1+j*.48;zz=ridgeZ-r*abs(xx)/half+.13
      box('Dachtritt '+str(j),(xx,.28,zz),(.28,.42,.035),M['steel'],'a03','deckung',4,bevel=.006)
      for dy in[-.14,.14]:beam_between('Trittstütze',(xx,dy+.28,zz-.16),(xx,dy+.28,zz),.025,.03,M['metal'],'a03','lattung',2)

    # Lightning conductors are a clearly tagged example system, not a dimensioning rule.
    pipe_between('First-Fangleitung',(0,-hr if hip else -5.7,ridgeZ+.28),(0,hr if hip else 5.7,ridgeZ+.28),.016,M['metal'],'a04','deckung',5)
    pipe_between('Fangleitung zur Traufe',(0,-hr if hip else -5.7,ridgeZ+.28),(4.8,-5.73,e+.18),.016,M['metal'],'a04','deckung',5)
    pipe_between('Ableitung Fassade',(4.39,-5.37,e+.1),(4.39,-5.37,.2),.014,M['metal'],'a04','tragwerk',5)
    downpipe(4.95,-5.42,e,M)
    spots={
      'g01':(2.2,-.8,4.9),'g02':(-3.5,-3.2,3.8),'g03':(-2,-2,4.7),'g04':(-1,-1,4.6),'g05':(3.8,1.0,4.0),'g06':(4.8,-4.4,3.5),
      's01':(2.2,1,4.95),'s02':(4.65,.6,3.55),'s03':(4.98,-3.2,3.45),'s04':(2.7,-5.83,4.65),'s05':(0,1,6.32),'s06':(1.3,-1.65,5.45),
      's07':(-4.35,4.5,4.0),'s08':(cx,cy,cz+1.5),'s09':(3.05,3.22,4.63),'s10':(4.08,-1,5.2),'s11':(1.05,1.42,6.2),
      'w01':(2.4,-4.0,4.95),'w02':(4.7,-5.7,3.65),'w03':(0,-hr,6.3),'w04':(0,-4.2,4.5),
      'a01':(2.25,-4.0,5.1),'a02':(4.4,2.3,3.95),'a03':(-2.7,.28,4.85),'a04':(0,0,6.43)
    }
    if hip:spots['a01']=(2.25,0,5.1)
    for k in COMMON+(HIP if hip else STEEP)+EQUIP:empty_hotspot(k,spots[k])
    water=[(2.7,-4.0,4.8),(4.0,-4.0,3.94),(4.65,-4.0,3.55),(4.95,-5.42,3.33),(5.21,-5.42,.6)]
    for i,p in enumerate(water):o=empty_hotspot('wasser'+str(i),p);o.name='Wasser_'+str(i);o['water_step']=i

def flat_house(M):
    box('Putzkörper Flachdach',(0,0,1.65),(9,11,3.3),M['plaster'],'g02','tragwerk',0,bevel=.045)
    box('Sockel Flachdach',(0,0,.22),(9.1,11.1,.36),M['concrete'],'g02','tragwerk',0)
    box('Tragschale',(0,0,3.30),(9.15,11.15,.22),M['concrete'],'g02','tragwerk',0)
    box('Dampfbremse durchgehende Ebene',(0,0,3.423),(9.08,11.08,.012),M['seal'],'g04','luftdichtheit',1,bevel=0)
    for sign in[-1,1]:box('Dämmfeld '+str(sign),(sign*2.28,0,3.53),(4.49,11.05,.20),M['insulation'],'g03','daemmung',2,bevel=.006)
    # Four planar falls meet at the drain's true low point. A single tilted
    # plane would send water past the drain to the free edge instead.
    def surface(x,y):return 3.65+.0095*(abs(x+3.5)+abs(y+4.2))
    for sign in[-1,1]:
      xs=[-4.48,-3.5,-.045] if sign<0 else [.045,4.48]
      ys=[-5.45,-4.2,5.45]
      for i in range(len(xs)-1):
       for j in range(len(ys)-1):
        xa,xb=xs[i:i+2];ya,yb=ys[j:j+2]
        verts=[(xa,ya,surface(xa,ya)),(xb,ya,surface(xb,ya)),(xb,yb,surface(xb,yb)),(xa,yb,surface(xa,yb))]
        shell('Abdichtungsfeld '+str(sign)+' '+str(i)+str(j),verts,.012,M['membrane'],'f01','deckung',3)
      for yy in[-4.5,-3.5,-2.5,-1.5,-.5,.5,1.5,2.5,3.5,4.5]:
        for i in range(len(xs)-1):
          xa,xb=xs[i:i+2]
          shell('Bahnenstoß '+str(sign)+str(yy)+str(i),[(xa,yy-.018,surface(xa,yy-.018)+.015),(xb,yy-.018,surface(xb,yy-.018)+.015),(xb,yy+.018,surface(xb,yy+.018)+.015),(xa,yy+.018,surface(xa,yy+.018)+.015)],.004,M['membrane'],'f01','deckung',4)
    # Attica on three edges. The front is a genuinely free roof edge.
    for xx in[-4.51,4.51]:
      if xx<0:box('Attikawand links',(xx,0,3.88),(.23,11.2,.70),M['plaster'],'f05','tragwerk',1)
      else:
        for yy,ll in[(-4.65,1.8),(1.4,8.3)]:box('Attikawand rechts Teil',(xx,yy,3.88),(.23,ll,.70),M['plaster'],'f05','tragwerk',1)
        box('Notablauf-Brüstung',(xx,-3.5,3.70),(.23,.5,.23),M['plaster'],'f04','tragwerk',1)
        box('Notablauf Sturz',(xx,-3.5,4.12),(.23,.5,.23),M['plaster'],'f04','tragwerk',1)
      box('Attika Metallabdeckung '+str(xx),(xx,0,4.255),(.36,11.3,.045),M['zinc'],'f05','deckung',5,bevel=.012)
      box('Attika Anschlussaufkantung '+str(xx),(xx+(.13 if xx<0 else-.13),0,3.93),(.025,11,.5),M['membrane'],'f05','deckung',4,bevel=.003)
    box('Hintere Attikawand',(0,5.51,3.91),(9.1,.23,.7),M['plaster'],'f05','tragwerk',1)
    box('Hintere Abdeckung',(0,5.51,4.28),(9.35,.36,.045),M['zinc'],'f05','deckung',5,bevel=.01)
    box('Freier Dachrand Metallprofil',(0,-5.55,3.64),(9.3,.18,.17),M['zinc'],'f06','deckung',4,bevel=.008)
    # Emergency discharge is an actual rectangular opening with a projecting chute.
    shell('Notablauf Trog',[(4.35,-3.7,3.86),(4.35,-3.3,3.86),(5.08,-3.3,3.83),(5.08,-3.7,3.83)],.012,M['zinc'],'f04','deckung',4)
    for yy in[-3.71,-3.29]:box('Notablauf Seitenkante',(4.75,yy,3.90),(.83,.025,.15),M['zinc'],'f04','deckung',4,bevel=.005)
    # Circular roof drain with local flange and slotted removable grille.
    cylinder('Dachablauf Vertiefung',(-3.5,-4.2,3.628),.205,.018,M['steel'],'f03','deckung',3,vertices=32)
    vv=[];ff=[];segments=32
    for z in [3.652,3.666]:
      for radius in [.13,.34]:
       for i in range(segments):
        a=i*2*math.pi/segments;vv.append((-3.5+radius*math.cos(a),-4.2+radius*math.sin(a),z))
    for i in range(segments):
      j=(i+1)%segments
      ff.extend([(i,j,segments+j,segments+i),(2*segments+i,3*segments+i,3*segments+j,2*segments+j),(i,2*segments+i,2*segments+j,j),(segments+i,segments+j,3*segments+j,3*segments+i)])
    mesh('Dachablauf ringförmiger Anschlussflansch',vv,ff,M['membrane'],'f03','deckung',3)
    cylinder('Dachablauf Einlauf',(-3.5,-4.2,3.645),.13,.021,M['steel'],'f03','deckung',4,vertices=32)
    for j in range(8):
      a=j*math.pi/4;beam_between('Ablaufrost Steg',(-3.5-.12*math.cos(a),-4.2-.12*math.sin(a),3.662),(-3.5+.12*math.cos(a),-4.2+.12*math.sin(a),3.662),.012,.012,M['metal'],'f03','deckung',5,bevel=.002)
    pipe_between('Ablaufleitung in Tragschale',(-3.5,-4.2,3.6),(-3.5,-4.2,2.7),.09,M['steel'],'f03','tragwerk',2)
    # Cut the same physical opening through the membrane and support layers.
    # A dark disk laid on a continuous roof would only pretend to be a drain.
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.132,depth=1.5,location=(-3.5,-4.2,3.3))
    cutter=bpy.context.object;cutter.name='Ablauföffnung temporär'
    for ob in list(bpy.context.scene.objects):
      if ob.type!='MESH' or not (ob.name.startswith('Abdichtungsfeld') or ob.name.startswith('Tragschale') or ob.name.startswith('Dämmfeld') or ob.name.startswith('Dampfbremse durchgehende')):continue
      bpy.context.view_layer.objects.active=ob
      mod=ob.modifiers.new('Ablauföffnung','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
      bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    # Wall/door junction has a real door opening above the flat surface.
    for xx,w in[(-3.8,1.4),(1.1,6.4)]:box('Aufgehende Wand Teil',(xx,4.73,4.90),(w,.25,2.3),M['plaster'],'f07','tragwerk',1)
    box('Wandsturz über Austritt',(-2.45,4.73,5.96),(1.3,.25,.25),M['plaster'],'f07','tragwerk',1)
    box('Türrahmen Austritt',(-2.45,4.55,4.80),(1.20,.12,2.05),M['steel'],'f07','deckung',4,bevel=.014)
    box('Türverglasung Austritt',(-2.45,4.48,4.82),(1.02,.02,1.82),M['glass'],'f07','deckung',5,bevel=.004)
    box('Schwellenanschluss',(-2.45,4.38,3.81),(1.38,.43,.13),M['zinc'],'f07','deckung',3,bevel=.008)
    box('Wandanschluss Hochführung',(1.05,4.53,3.99),(6.3,.025,.48),M['membrane'],'f07','deckung',3,bevel=.004)
    # Skylight upstand and softly curved translucent cap.
    box('Lichtkuppel Aufsetzkranz',(1.35,1.55,3.98),(1.55,1.55,.55),M['plaster'],'f08','tragwerk',2,bevel=.025)
    box('Lichtkuppel Anschlusskragen',(1.35,1.55,3.79),(1.94,1.94,.065),M['membrane'],'f08','deckung',3,bevel=.015)
    vv=[];ff=[];rings=8;segs=24
    for rr in range(rings+1):
      t=(rr/rings)*math.pi/2
      for j in range(segs):
        a=j*2*math.pi/segs;vv.append((1.35+.72*math.sin(t)*math.cos(a),1.55+.72*math.sin(t)*math.sin(a),4.30+.42*math.cos(t)))
    for rr in range(rings):
      for j in range(segs):ff.append((rr*segs+j,rr*segs+(j+1)%segs,(rr+1)*segs+(j+1)%segs,(rr+1)*segs+j))
    mesh('Lichtkuppel gewölbte Verglasung',vv,ff,M['glass'],'f08','deckung',5)
    cylinder('Runddurchführung',(-1.1,.2,4.10),.13,.78,M['steel'],'f08','deckung',4)
    cylinder('Durchführung Anschlussmanschette',(-1.1,.2,3.78),.32,.13,M['membrane'],'f08','deckung',3)
    # Raised flexible cover bridges the movement joint between two fields.
    vv=[];ff=[]
    for yy in[-5.3,4.5]:
      for i in range(9):
        xx=-.13+i*.0325;zz=surface(xx,yy)+.03+.12*math.sin(i*math.pi/8);vv.append((xx,yy,zz))
    mesh('Bewegungsfuge flexible Überbrückung',vv,[(i,i+1,9+i+1,9+i)for i in range(8)],M['seal'],'f09','deckung',4)
    for row in[0,1]:
     for col in[0,1]:
      solar_panel('Flachdach PV '+str(row)+str(col),(1.45+col*1.1,-3.4+row*1.9,4.01),Vector((0,math.cos(.22),math.sin(.22))),Vector((1,0,0)),M,flat=True)
    for i in range(10):
      yy=3.6-i*.65;box('Wartungsweg Trittplatte',(-2.45,yy,surface(-2.45,yy)+.037),(.6,.56,.04),M['concrete'],'a03','deckung',5,bevel=.013)
    # Perimeter lightning conductor on supports; not a numerical lightning plan.
    for a,b in[((-4.5,-5.3,4.41),(-4.5,5.5,4.41)),((-4.5,5.5,4.41),(4.5,5.5,4.41)),((4.5,5.5,4.41),(4.5,-5.3,4.41))]:pipe_between('Fangleitung Dachrand',a,b,.015,M['metal'],'a04','deckung',5)
    pipe_between('Ableitung Flachdach',(4.51,-5.3,4.4),(4.51,-5.3,.2),.014,M['metal'],'a04','tragwerk',5)
    spots={'g01':(2.9,3.4,3.8),'g02':(-4.5,-2,3.3),'g03':(-2.9,-1,3.55),'g04':(-1.7,1.8,3.45),'g05':(2.8,-2,3.9),'g06':(-3.1,-3.5,3.8),
      'f01':(2.7,.2,3.9),'f02':(-2.5,2.5,3.9),'f03':(-3.5,-4.2,3.8),'f04':(4.9,-3.5,3.95),'f05':(-4.52,-.7,4.35),'f06':(1.5,-5.6,3.75),'f07':(-2.45,4.4,4.7),'f08':(1.35,1.55,4.6),'f09':(0,.3,3.95),'a01':(2.1,-2.6,4.35),'a03':(-2.45,2.2,3.95),'a04':(4.5,3.1,4.5)}
    for k in COMMON+FLAT+['a01','a03','a04']:empty_hotspot(k,spots[k])
    water=[(x,y,surface(x,y)+.045) for x,y in[(-1.8,2.4),(-2.5,.8),(-3.1,-2),(-3.5,-4.2)]]+[(-3.5,-4.2,2.8)]
    for i,p in enumerate(water):o=empty_hotspot('wasser'+str(i),p);o.name='Wasser_'+str(i);o['water_step']=i

def build(variant,samples=24,width=1200,model_only=False):
    reset_scene();M=make_materials();isflat=variant.startswith('flachdach');hip=variant.startswith('walmdach');biber=variant.endswith('biber-doppel')
    if isflat:flat_house(M)
    else:steep_house(hip,biber,M)
    # Small overview bevels need one segment at mobile scale. Detailed teaching
    # scenes keep their higher-resolution edges and closed component solids.
    for ob in bpy.context.scene.objects:
      if ob.type=='MESH' and min(ob.dimensions)<.3:
        for mod in ob.modifiers:
          if mod.type=='BEVEL':mod.segments=1
    join_semantic_meshes()
    root=os.path.join(ROOT,'public/dach-medien/v1',variant);os.makedirs(root,exist_ok=True)
    export_glb(os.path.join(root,'uebersicht.glb'))
    if model_only:
      print('DACH_OVERVIEW_MODEL '+variant,flush=True)
      return
    ground=box('Neutraler Renderboden',(0,0,-.055),(200,200,.1),M['ground'],bevel=0);ground['render_only']=True
    setup_render((16,-20,14 if not isflat else 15),(0,0,2.9 if not isflat else 3.1),(width,round(width*2/3)),samples)
    render_webp(os.path.join(root,'uebersicht.webp'))
    image=bpy.data.images.load(os.path.join(root,'uebersicht.webp'),check_existing=False);image.scale(480,320);preview=os.path.join(ROOT,'public/dach-vorschau/v1',variant,'uebersicht.webp');os.makedirs(os.path.dirname(preview),exist_ok=True);image.filepath_raw=preview;image.file_format='WEBP';image.save()
    stats={'variant':variant,'objects':len([o for o in bpy.context.scene.objects if o.type=='MESH' and not o.get('render_only')]),'triangles':sum(len(p.vertices)-2 for o in bpy.context.scene.objects if o.type=='MESH' and not o.get('render_only')for p in o.data.polygons),'bytes':os.path.getsize(os.path.join(root,'uebersicht.glb'))}
    print('DACH_OVERVIEW_STATS '+json.dumps(stats),flush=True)
    production_record('overview',variant,None,{'samples':samples,'width':width},overview_files(variant))

if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else[]
    parser=argparse.ArgumentParser();parser.add_argument('variants',nargs='*',default=['all']);parser.add_argument('--samples',type=int,default=24);parser.add_argument('--width',type=int,default=1200);parser.add_argument('--model-only',action='store_true');opts=parser.parse_args(args)
    for variant in VARIANTS if not opts.variants or opts.variants[0]=='all' else opts.variants:
      if variant not in VARIANTS:raise ValueError(variant)
      build(variant,opts.samples,opts.width,opts.model_only)
