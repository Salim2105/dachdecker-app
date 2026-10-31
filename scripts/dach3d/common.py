"""Own reproducible Blender geometry and PBR materials for the roof learning models.
All dimensions are metres. These are named training constructions, not product approvals.
Run from Blender 4.3 or newer in background mode.
"""
import bpy, math, os, random, subprocess
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
_TEXTURE_DIR = '/tmp/dach3d-own-textures'
_MATERIALS = None

def reset_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        if block.users == 0: bpy.data.meshes.remove(block)
    bpy.context.scene.world = None
    bpy.context.scene.render.film_transparent = False

def tag(obj, detail_id=None, layer=None, step=0, **kwargs):
    if detail_id: obj['detail_id'] = detail_id
    if layer: obj['layer'] = layer
    obj['montage_step'] = int(step)
    for key, value in kwargs.items(): obj[key] = value
    return obj

def _texture(kind, size=256):
    os.makedirs(_TEXTURE_DIR, exist_ok=True)
    name = 'RoofOwn_' + kind
    if name in bpy.data.images: return bpy.data.images[name]
    im = bpy.data.images.new(name, width=size, height=size, alpha=False)
    rnd = random.Random(901 + sum(ord(c) for c in kind)); pixels=[]
    colors={'clay':(.48,.155,.065),'clay_dark':(.24,.085,.045),'wood':(.43,.27,.12),'zinc':(.48,.53,.56),'membrane':(.105,.115,.12),'plaster':(.73,.71,.65),'concrete':(.48,.49,.47),'insulation':(.69,.52,.18),'pv':(.025,.06,.09)}
    base=colors.get(kind,(.5,.5,.5))
    for y in range(size):
      for x in range(size):
        grain=rnd.uniform(-.035,.035)
        if kind=='wood': grain += .065*math.sin(x*.27+2*math.sin(y*.019)) + .023*math.sin(x*.91+y*.022)
        elif kind=='zinc': grain += .018*math.sin(y*.9)+.012*math.sin(x*.11)
        elif kind=='clay' or kind=='clay_dark': grain += .025*math.sin(x*.042)*math.sin(y*.07)
        elif kind=='pv':
          # Fine individual cell grid remains visible in rendered close-ups.
          if x%43<1 or y%43<1: grain+=.13
        pixels.extend([max(.002,min(.98,c+grain)) for c in base]+[1])
    im.pixels.foreach_set(pixels); im.filepath_raw=os.path.join(_TEXTURE_DIR,kind+'.png'); im.file_format='PNG'; im.save(); return im

def material(name, color=(.5,.5,.5,1), roughness=.55, metallic=0, texture=None, transmission=0, **kwargs):
    mat=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes=True; nodes=mat.node_tree.nodes; nodes.clear()
    out=nodes.new('ShaderNodeOutputMaterial'); bs=nodes.new('ShaderNodeBsdfPrincipled'); mat.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    rgba=tuple(color) if len(color)==4 else tuple(color)+(1,)
    bs.inputs['Base Color'].default_value=rgba; bs.inputs['Roughness'].default_value=roughness; bs.inputs['Metallic'].default_value=metallic
    bs.inputs['Transmission Weight'].default_value=transmission
    if transmission: bs.inputs['IOR'].default_value=1.46
    if texture:
      tex=nodes.new('ShaderNodeTexImage'); tex.image=_texture(texture); mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
      # Exportable roughness is explicit; the same own colour map adds fine relief for renders.
      bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.12; bump.inputs['Distance'].default_value=.006
      mat.node_tree.links.new(tex.outputs['Color'],bump.inputs['Height']); mat.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    mat.diffuse_color=rgba
    return mat

def make_materials():
    global _MATERIALS
    if _MATERIALS is not None: return _MATERIALS
    _MATERIALS={
      'ceramic':material('Tonziegel naturrot',(.50,.19,.085,1),.46,texture='clay'),
      'ceramic_dark':material('Tonziegel dunkle Nuance',(.32,.11,.06,1),.49,texture='clay_dark'),
      'wood':material('Holz sichtbare Faser',(.49,.29,.13,1),.65,texture='wood'),
      'metal':material('Verzinkte Befestigung',(.48,.54,.58,1),.31,.82),
      'zinc':material('Titanzink gewalzt',(.52,.58,.61,1),.36,.8,texture='zinc'),
      'membrane':material('Dachbahn dunkle Oberfläche',(.12,.13,.14,1),.9,texture='membrane'),
      'insulation':material('Mineralische Dämmung',(.73,.56,.22,1),.95,texture='insulation'),
      'plaster':material('Warmer mineralischer Putz',(.76,.74,.69,1),.95,texture='plaster'),
      'concrete':material('Beton Tragschale',(.51,.52,.5,1),.88,texture='concrete'),
      'glass':material('Glas leicht bläulich',(.30,.48,.56,1),.12,.25,transmission=.18),
      'pv':material('Solarzellen blau schwarz',(.025,.055,.085,1),.24,.32,texture='pv'),
      'steel':material('Beschichteter Stahl dunkel',(.10,.13,.145,1),.34,.68),
      'seal':material('Dichtungs- und Luftdichtungsebene',(.11,.31,.32,1),.8),
      'ground':material('Neutraler Steinboden',(.65,.65,.61,1),.96,texture='concrete'),
    }
    return _MATERIALS

def _mat(obj, mat):
    if isinstance(mat,str): mat=make_materials()[mat]
    if mat: obj.data.materials.append(mat)
    return obj

def box(name, location, size, material=None, detail_id=None, layer=None, step=0, bevel=.02, rotation=None, **kwargs):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj=bpy.context.object; obj.name=name; obj.dimensions=size
    if rotation: obj.rotation_euler=rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    _mat(obj,material)
    if bevel and min(size)>bevel*1.1:
      mod=obj.modifiers.new('Kantenradius','BEVEL'); mod.width=min(bevel,min(size)*.15); mod.segments=2
      norm=obj.modifiers.new('Flächennormalen','WEIGHTED_NORMAL'); norm.keep_sharp=True
    return tag(obj,detail_id,layer,step,**kwargs)

def cylinder(name, loc=None, radius=.1, depth=1, material=None, detail_id=None, layer=None, step=0, rotation=None, vertices=20, location=None, **kwargs):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc if loc is not None else location)
    obj=bpy.context.object; obj.name=name
    if rotation: obj.rotation_euler=rotation
    _mat(obj,material)
    for p in obj.data.polygons: p.use_smooth=len(p.vertices)==4
    return tag(obj,detail_id,layer,step,**kwargs)

def mesh(name, verts, faces, material=None, detail_id=None, layer=None, step=0, **kwargs):
    data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces); data.update()
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj); _mat(obj,material)
    # Box-projected UVs make generated PBR textures deterministic on arbitrary surfaces.
    if data.polygons:
      uv=data.uv_layers.new(name='UVMap')
      for poly in data.polygons:
        n=poly.normal; axis=max(range(3),key=lambda i:abs(n[i])); axes=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
          co=data.vertices[data.loops[li].vertex_index].co; uv.data[li].uv=(co[axes[0]],co[axes[1]])
    return tag(obj,detail_id,layer,step,**kwargs)

def beam_between(name, start, end, width, depth, material=None, detail_id=None, layer=None, step=0, **kwargs):
    a,b=Vector(start),Vector(end); obj=box(name,(a+b)/2,(width,depth,(b-a).length),material,detail_id,layer,step,**kwargs)
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return obj

def pipe_between(name,start,end,radius,material=None,detail_id=None,layer=None,step=0,vertices=16):
    a,b=Vector(start),Vector(end); obj=cylinder(name,(a+b)/2,radius,(b-a).length,material,detail_id,layer,step,vertices=vertices)
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return obj

def empty_hotspot(detail_id, location):
    obj=bpy.data.objects.new('Hotspot_'+detail_id,None); obj.location=location; bpy.context.collection.objects.link(obj); tag(obj,detail_id,hotspot=True); return obj

def setup_render(camera_location, target, resolution=(960,640), samples=24):
    scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=samples; scene.cycles.use_denoising=False
    scene.cycles.max_bounces=6; scene.cycles.diffuse_bounces=3; scene.cycles.glossy_bounces=3; scene.render.threads_mode='FIXED'; scene.render.threads=2
    scene.render.resolution_x=resolution[0]; scene.render.resolution_y=resolution[1]; scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'; scene.view_settings.look='AgX - Medium High Contrast'; scene.view_settings.exposure=.35
    world=bpy.data.worlds.new('Heller bewölkter Himmel'); world.use_nodes=True; world.node_tree.nodes['Background'].inputs[0].default_value=(.66,.74,.83,1); world.node_tree.nodes['Background'].inputs[1].default_value=.45; scene.world=world
    bpy.ops.object.camera_add(location=camera_location); cam=bpy.context.object; cam.name='Lehrkamera'; cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='PERSP'; cam.data.lens=48; scene.camera=cam
    for name,loc,energy,size in [('Großes weiches Tageslicht',(-8,-10,15),1800,8),('Heller Reflektor',(8,-2,10),1100,7),('Rücklicht',(0,9,14),1500,6)]:
      bpy.ops.object.light_add(type='AREA',location=loc); light=bpy.context.object; light.name=name; light.data.energy=energy; light.data.shape='DISK'; light.data.size=size; light.rotation_euler=(Vector(target)-light.location).to_track_quat('-Z','Y').to_euler()
    return cam

def export_glb(path):
    os.makedirs(os.path.dirname(path),exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',export_extras=True,export_cameras=False,export_lights=False,export_apply=True,export_yup=True,export_texcoords=True,export_normals=True)
    subprocess.run(['node',os.path.join(ROOT,'scripts/dach3d/optimize.mjs'),path],check=True)

def render_webp(path, resolution=None):
    scene=bpy.context.scene
    if resolution: scene.render.resolution_x,scene.render.resolution_y=resolution
    os.makedirs(os.path.dirname(path),exist_ok=True)
    scene.render.image_settings.file_format='WEBP'; scene.render.image_settings.quality=86; scene.render.filepath=path
    bpy.ops.render.render(write_still=True)

def join_semantic_meshes():
    groups={}
    for obj in list(bpy.context.scene.objects):
      if obj.type!='MESH' or not obj.get('detail_id'):continue
      key=(obj.get('detail_id'),obj.get('layer',''),obj.get('montage_step',0),tuple(m.name for m in obj.data.materials))
      groups.setdefault(key,[]).append(obj)
    for key,objs in groups.items():
      if len(objs)<2:continue
      bpy.ops.object.select_all(action='DESELECT')
      for obj in objs:obj.select_set(True)
      bpy.context.view_layer.objects.active=objs[0]
      # Apply bevels before join so only one unchanged modifier does not alter every piece.
      for obj in objs:
        bpy.context.view_layer.objects.active=obj
        for mod in list(obj.modifiers):
          try:bpy.ops.object.modifier_apply(modifier=mod.name)
          except RuntimeError:pass
      bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();objs[0].name='Bauteil_'+key[0]+'_'+key[1]
