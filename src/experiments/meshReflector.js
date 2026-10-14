import {Mesh,PlaneGeometry,MeshStandardMaterial,DoubleSide,Vector3,Matrix3,BufferAttribute,Box3} from 'three';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';
import {summariseFrames} from './performanceStats.js';
import {defaultReflector} from '../scene/reflectorState.js';
import {createReflectorSupport,orbitReflector} from '../scene/reflectorSupport.js';
import {connectEquipmentCollection} from '../ui/connectEquipmentCollection.js';

export function createMeshReflector({scene,subject,overview,photo,production=false}) {
 const panel=document.createElement('aside');
 panel.style.cssText='position:fixed;right:12px;top:12px;z-index:150;width:330px;max-height:85vh;overflow:auto;padding:12px;background:#f4f4ed;border:1px solid #8faaa1;border-radius:8px;font:13px Segoe UI,sans-serif';
 panel.innerHTML='<strong>Experimental mesh reflector</strong><p>White diffuse board · one bounce onto the subject. Opaque scene triangles block either path. Changes clear old lighting; press Calculate after editing.</p><div data-fields style="display:grid;grid-template-columns:1fr 1fr;gap:6px"></div><p><label>Sampling <select data-quality><option value="4">Quick · 16 patches</option><option value="8">Refined · 64 patches</option></select></label></p><button data-run>Calculate bounce</button> <button data-stop disabled>Cancel</button><p><label><input type="checkbox" data-show checked> Show calculated bounce</label></p><p data-status role="status">Ready. Import a model or use the starting subject.</p><p>Prototype limits: vertex-interpolated diffuse fill; opaque static meshes only. No metallic/specular bounce, alpha-cutout, transmission or skin/morph support. Floor receives direct light only. Reflector settings are not saved in projects.</p>';
 if(production){
  panel.removeAttribute('style');panel.className='reflector-controls';
  panel.innerHTML='<h3>White reflector</h3><label><input id="reflector-enabled" type="checkbox"> Add reflector</label><div data-options hidden><div class="subject-fields" data-fields></div><details class="secondary-controls"><summary>Reflector finish and quality</summary><label>Quality <select data-quality><option value="4">Fast</option><option value="8">Detailed</option></select></label><p class="guide-note">Diffuse white fill updates automatically after edits. Supports opaque, static subjects. Fine shadow detail is approximate; reflective metals, transparent materials and additional room bounces are not simulated.</p></details></div><p data-status class="guide-note" role="status"></p><button data-run hidden></button><button data-stop hidden></button><input data-show type="checkbox" checked hidden>';
  document.querySelector('.studio-controls').prepend(panel);
 }else document.body.append(panel);
 const measure=document.createElement('button');measure.textContent='Compare rendering cost';measure.disabled=true;measure.hidden=production;panel.append(measure);
 const results=document.createElement('pre');results.style.cssText='white-space:pre-wrap;font-size:12px';panel.append(results);
 let measurement=null,phaseFrames=[],phaseStart=0,previousFrame=null,frameStart=0,warmup=0,savedReset=[],measurementTimer;
 const renderers=[overview.renderer,photo.renderer];
 let values={...defaultReflector,enabled:!production};const inputs={},sliders={};
 for(const [key,label,min,max,step] of [['x','Left / right (m)',-5,5,.1],['y','Height (m)',.2,5,.1],['z','Front / back (m)',-5,5,.1],['size','Size (m)',.2,3,.1],['yaw','Rotation (°)',-180,180,5],['pitch','Tilt (°)',-90,90,5],['reflectance','Reflectance',0,1,.05]]){
  const wrap=document.createElement('label');wrap.textContent=label;
  const input=document.createElement('input');Object.assign(input,{type:'number',min,max,step:'any',value:values[key],defaultValue:String(values[key]),id:'reflector-'+key});input.style.width='100%';inputs[key]=input;
  const slider=document.createElement('input');Object.assign(slider,{type:'range',min,max,step,value:values[key]});slider.setAttribute('aria-label',label);sliders[key]=slider;
  input.oninput=()=>{if(input.value!==''&&input.checkValidity()){values[key]=Number(input.value);slider.value=input.value;place();invalidate();}};
  slider.oninput=()=>{input.value=slider.value;input.oninput();};
  wrap.append(input,slider);panel.querySelector('[data-fields]').append(wrap);
 }
 if(production)panel.querySelector('.secondary-controls').append(inputs.reflectance.parentElement);
 if(production){const compare=document.createElement('label'),toggle=panel.querySelector('[data-show]');toggle.hidden=false;compare.append(toggle,document.createTextNode(' Show reflected fill (comparison)'));panel.querySelector('.secondary-controls').append(compare);}
 const models=Array.from({length:2},()=>{
  const board=new Mesh(new PlaneGeometry(1,1),new MeshStandardMaterial({color:0xffffff,roughness:1,side:DoubleSide}));board.castShadow=board.receiveShadow=true;board.visible=false;scene.add(board);
  const support=createReflectorSupport(scene);support.group.visible=false;return {board,support};
 });
 const collectionHost=document.createElement('div');panel.prepend(collectionHost);
 const collection=connectEquipmentCollection({parent:collectionHost,type:'reflector',onChange:reason=>{
  values=collection.selected?.state||{...defaultReflector};place();syncSelection();
  if(reason!=='select'&&reason!=='rename')invalidate();
 }});
 collection.selected.state.enabled=!production;values=collection.selected.state;
 if(production){panel.querySelector('h3').textContent='White reflectors';panel.prepend(panel.querySelector('h3'));panel.querySelector('#reflector-enabled').parentElement.lastChild.textContent=' Selected reflector on';}
 else collectionHost.hidden=true;
 const activeItems=()=>collection.items.filter(item=>item.state.enabled);
 const center=()=>new Box3().setFromObject(subject).getCenter(new Vector3());
 const orbitWrap=document.createElement('div');orbitWrap.className='subject-fields';
 orbitWrap.innerHTML='<label>Orbit around subject (°)<input data-orbit-number type="number" min="-180" max="180" step="1"><input data-orbit type="range" min="-180" max="180" step="1" aria-label="Orbit reflector around subject"></label><label>Distance from subject (m)<input data-radius-number type="number" min="0.3" max="7.1" step="0.05"><input data-radius type="range" min="0.3" max="7.1" step="0.05" aria-label="Reflector distance from subject"></label>';
 panel.querySelector('[data-fields]').before(orbitWrap);if(production)panel.querySelector('[data-options]').prepend(orbitWrap);
 const orbit=orbitWrap.querySelector('[data-orbit]'),radius=orbitWrap.querySelector('[data-radius]'),orbitNumber=orbitWrap.querySelector('[data-orbit-number]'),radiusNumber=orbitWrap.querySelector('[data-radius-number]');
 orbitNumber.step='any';radiusNumber.step='any';
 if(production){const exact=document.createElement('details');exact.className='secondary-controls';exact.innerHTML='<summary>Exact left / right and depth</summary><div class="subject-fields"></div>';exact.querySelector('div').append(inputs.x.parentElement,inputs.z.parentElement);panel.querySelector('[data-fields]').after(exact);}
 function syncOrbit(){const c=center();const angle=Math.atan2(values.x-c.x,values.z-c.z)*180/Math.PI,distance=Math.hypot(values.x-c.x,values.z-c.z);orbit.value=orbitNumber.value=angle.toFixed(1);radius.value=radiusNumber.value=distance.toFixed(2);}
 function moveAround(angle,distance){Object.assign(values,orbitReflector(values,center(),angle,distance));place();invalidate();}
 orbit.oninput=()=>{const c=center();moveAround(Number(orbit.value),Math.hypot(values.x-c.x,values.z-c.z));};radius.oninput=()=>moveAround(Number(orbitNumber.value),Number(radius.value));
 orbitNumber.oninput=()=>{if(orbitNumber.value!==''&&orbitNumber.checkValidity())moveAround(Number(orbitNumber.value),Number(radiusNumber.value));};
 radiusNumber.oninput=()=>{if(radiusNumber.value!==''&&radiusNumber.checkValidity())moveAround(Number(orbitNumber.value),Number(radiusNumber.value));};
 const status=panel.querySelector('[data-status]'),run=panel.querySelector('[data-run]'),stop=panel.querySelector('[data-stop]');
 const gain={value:1},records=new Map();let worker=null,timeout=null,signature='',lastCheck=0,scheduled=null;
 function place(){
  models.forEach(({board,support},i)=>{
   const item=collection.items[i],s=item?.state;
   board.visible=!!s?.enabled;support.group.visible=board.visible;if(!s)return;
   s.y=Math.max(s.y,s.size*.5*Math.abs(Math.cos(s.pitch*Math.PI/180))+.12);
   board.name=item.name;support.group.name=item.name+' stand';
   board.position.set(s.x,s.y,s.z);board.rotation.set(s.pitch*Math.PI/180,s.yaw*Math.PI/180,0,'YXZ');board.scale.setScalar(s.size);board.material.color.setScalar(s.reflectance);board.updateMatrixWorld();support.update(board);
  });
  for(const key of Object.keys(inputs)){inputs[key].value=values[key];sliders[key].value=values[key];}syncOrbit();
 }
 function syncSelection(){
  panel.querySelector('[data-quality]').value=values.quality;
  if(production){const enabled=panel.querySelector('#reflector-enabled');enabled.checked=values.enabled;enabled.disabled=!collection.selected;panel.querySelector('[data-options]').hidden=!collection.selected||!values.enabled;}
 }
 function clear(){for(const r of records.values()){r.attribute.array.fill(0);r.attribute.needsUpdate=true;}}
 function cancel(){worker?.terminate();worker=null;clearTimeout(timeout);clearTimeout(scheduled);run.disabled=false;stop.disabled=true;}
 function release(mesh,r){mesh.geometry=r.originalGeometry;mesh.material=r.originalMaterial;r.bounceGeometry.dispose();for(const m of Array.isArray(r.bounceMaterial)?r.bounceMaterial:[r.bounceMaterial])m.dispose();records.delete(mesh);}
 function prune(all=false){const current=new Set();subject.traverse(o=>current.add(o));for(const [mesh,r] of records)if(all||!current.has(mesh))release(mesh,r);}
 function invalidate(){cancel();clear();prune(!activeItems().length);measure.disabled=true;signature=sceneSignature();status.textContent=production?'':'Scene changed. Calculate to update bounced lighting.';if(production&&activeItems().length)scheduled=setTimeout(calculate,300);}
 function opaque(material){return material&&(material.isMeshStandardMaterial||material.isMeshPhysicalMaterial)&&!material.transparent&&!material.alphaTest&&!material.transmission;}
 function mark(mesh){
  if(records.has(mesh))return records.get(mesh);
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(mesh.isSkinnedMesh||mesh.isInstancedMesh||mesh.morphTargetInfluences?.length||!materials.every(opaque))throw new Error('Reflector fill requires an opaque, static subject. This model contains unsupported materials or animated geometry.');
  const originalGeometry=mesh.geometry,originalMaterial=mesh.material;
  // Refine coarse subjects to reduce interpolation errors; dense imports keep their topology.
  const scale=mesh.getWorldScale(new Vector3()).length()/Math.sqrt(3);
  const geometry=originalGeometry.attributes.position.count<2000?new TessellateModifier(.15/Math.max(scale,.001),3).modify(originalGeometry):originalGeometry.clone();
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  const attribute=new BufferAttribute(new Float32Array(geometry.attributes.position.count*3),3);geometry.setAttribute('reflectorIrradiance',attribute);
  const clones=materials.map(source=>{const m=source.clone();m.onBeforeCompile=shader=>{
   shader.uniforms.reflectorGain=gain;
   shader.vertexShader='attribute vec3 reflectorIrradiance; varying vec3 vReflectorIrradiance;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvReflectorIrradiance = reflectorIrradiance;');
   shader.fragmentShader='uniform float reflectorGain; varying vec3 vReflectorIrradiance;\n'+shader.fragmentShader.replace('#include <lights_fragment_end>','irradiance += vReflectorIrradiance * reflectorGain;\n#include <lights_fragment_end>');
  };m.customProgramCacheKey=()=> 'framelab-diffuse-reflector-v1';return m;});
  mesh.geometry=geometry;mesh.material=Array.isArray(originalMaterial)?clones:clones[0];
  const record={mesh,attribute,originalGeometry,originalMaterial,bounceGeometry:geometry,bounceMaterial:mesh.material};records.set(mesh,record);return record;
 }
 function sceneSignature(){
  scene.updateMatrixWorld(true);const parts=[];
  scene.traverseVisible(o=>{if(o.isMesh&&o.layers.isEnabled(0))parts.push(o.uuid,o.geometry.uuid,...o.matrixWorld.elements);if(o.isSpotLight||o.isDirectionalLight)parts.push(o.uuid,o.visible,o.intensity,...o.position.toArray(),...o.target.position.toArray(),o.color.getHex(),o.angle);});return parts.join(',');
 }
 function calculate(){
  cancel();clear();
  if(!activeItems().length)return;
  const prepareStart=performance.now();
  try {
   scene.updateMatrixWorld(true);const receivers=[],triangles=[],lights=[];let count=0;
   subject.traverseVisible(mesh=>{if(!mesh.isMesh)return;const r=mark(mesh),p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,normalMatrix=new Matrix3().getNormalMatrix(mesh.matrixWorld),positions=[],normals=[];
    count+=p.count;if(count>100000)throw new Error('This subject is too detailed for reflector fill. Use a simpler model (up to 100,000 receiving vertices).');
    for(let i=0;i<p.count;i++){positions.push(...new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray());normals.push(...new Vector3().fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize().toArray());}
    receivers.push({id:mesh.uuid,positions,normals});
   });
   scene.traverseVisible(o=>{
    if(o.isDirectionalLight&&o.intensity>0)throw new Error('Reflector fill currently requires Studio lights. Change enabled directional lights to Studio mode.');
    if(o.isSpotLight&&o.intensity>0)lights.push({position:o.position.toArray(),target:o.target.position.toArray(),intensity:o.intensity,angle:o.angle,penumbra:o.penumbra,color:o.color.toArray()});
    if(!o.isMesh||!o.layers.isEnabled(0))return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    if(!mats.every(m=>m&&!m.transparent&&!m.alphaTest&&!m.transmission)||o.isSkinnedMesh||o.isInstancedMesh||o.morphTargetInfluences?.length)throw new Error('Reflector fill cannot calculate this scene’s transparent or animated geometry. Use opaque, static objects.');
    const g=o.geometry,p=g.attributes.position,idx=g.index,total=idx?idx.count:p.count;
    for(let i=0;i<total;i+=3){const t=[];for(let k=0;k<3;k++)t.push(...new Vector3().fromBufferAttribute(p,idx?idx.getX(i+k):i+k).applyMatrix4(o.matrixWorld).toArray());triangles.push(t);if(triangles.length>250000)throw new Error('Prototype limit: 250,000 occluding triangles.');}
   });
   signature=sceneSignature();run.disabled=true;stop.disabled=false;status.textContent=production?'Updating reflector lighting…':`Calculating ${count.toLocaleString()} vertices against ${triangles.length.toLocaleString()} triangles…`;
   worker=new Worker(new URL('./meshBounce.worker.js',import.meta.url),{type:'module'});
   const started=performance.now(),prepareMs=started-prepareStart;
   worker.onmessage=({data})=>{
    if(sceneSignature()!==signature){invalidate();return;}
    if(data.error){cancel();status.textContent=data.error;return;}
    for(const result of data.results){const r=[...records.values()].find(r=>r.mesh.uuid===result.id);if(r){r.attribute.array.set(result.values);r.attribute.needsUpdate=true;}}
    cancel();measure.disabled=false;status.textContent=production?'':`Main-thread preparation ${prepareMs.toFixed(0)} ms · round trip ${(performance.now()-started).toFixed(0)} ms · worker ${data.totalMs.toFixed(0)} ms · geometry index ${data.buildMs.toFixed(0)} ms. Toggle bounce to compare.`;
   };
   worker.onerror=e=>{cancel();status.textContent='Calculation failed: '+e.message;};
   const boards=activeItems().map(({state:s})=>({center:[s.x,s.y,s.z],size:s.size,yaw:s.yaw*Math.PI/180,pitch:s.pitch*Math.PI/180,reflectance:s.reflectance,twoSided:true,divisions:s.quality}));
   worker.postMessage({triangles,receivers,lights,boards});
   timeout=setTimeout(()=>{cancel();status.textContent='Stopped after 30 seconds. Reduce model complexity or use Quick sampling.';},30000);
  }catch(e){cancel();status.textContent=e.message;signature=sceneSignature();}
 }
 run.onclick=calculate;stop.onclick=()=>{cancel();status.textContent='Calculation cancelled.';};panel.querySelector('[data-show]').onchange=e=>{gain.value=e.target.checked?1:0;};
 place();syncSelection();signature=sceneSignature();
 function restore(state,items){collection.restore(items,state);}
 if(production)panel.querySelector('#reflector-enabled').onchange=e=>{if(!collection.selected)return;if(e.target.checked&&['x','z','yaw','pitch','y'].every(k=>values[k]===defaultReflector[k])){const c=center();values.x=Math.max(-5,Math.min(5,c.x+defaultReflector.x));values.z=Math.max(-5,Math.min(5,c.z+defaultReflector.z));}values.enabled=e.target.checked;panel.querySelector('[data-options]').hidden=!values.enabled;collection.refresh();place();invalidate();};
 panel.querySelector('[data-quality]').onchange=e=>{values.quality=Number(e.target.value);invalidate();};
 function endMeasurement(message){
  for(const r of records.values()){r.mesh.geometry=r.bounceGeometry;r.mesh.material=r.bounceMaterial;}
  renderers.forEach((r,i)=>{r.info.autoReset=savedReset[i];});
  measurement=null;clearTimeout(measurementTimer);document.querySelector('.workspace').inert=false;
  document.querySelector('.setup-actions').inert=false;document.querySelector('.comparison').inert=false;
  panel.querySelectorAll('input,select,button').forEach(el=>el.disabled=false);stop.disabled=true;
  gain.value=panel.querySelector('[data-show]').checked?1:0;signature=sceneSignature();if(message)results.textContent=message;
 }
 measure.onclick=()=>{
  if(worker||measurement)return;
  savedReset=renderers.map(r=>r.info.autoReset);renderers.forEach(r=>{r.info.autoReset=false;});
  panel.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);document.querySelector('.workspace').inert=true;
  document.querySelector('.setup-actions').inert=true;document.querySelector('.comparison').inert=true;
  measurement={baseline:null};phaseFrames=[];previousFrame=null;warmup=30;phaseStart=performance.now();
  for(const r of records.values()){r.mesh.geometry=r.originalGeometry;r.mesh.material=r.originalMaterial;}
  results.textContent='Measuring original subject geometry/materials, then applied reflector…';
  measurementTimer=setTimeout(()=>endMeasurement('Comparison timed out.'),30000);
 };
 document.addEventListener('visibilitychange',()=>{if(measurement&&document.hidden)endMeasurement('Comparison cancelled: keep the tab visible.');});
 window.addEventListener('resize',()=>{if(measurement)endMeasurement('Comparison cancelled: viewport changed.');});
 return {
  snapshot:()=>({...values}),snapshotAll:collection.snapshot,restore,reset:collection.reset,
  begin(){if(measurement){frameStart=performance.now();renderers.forEach(r=>r.info.reset());}},
  end(){
   if(!measurement)return;const now=performance.now();
   if(warmup)warmup--;else if(previousFrame!==null)phaseFrames.push({interval:frameStart-previousFrame,submit:now-frameStart,calls:renderers.reduce((sum,r)=>sum+r.info.render.calls,0)});
   previousFrame=frameStart;
   if(phaseFrames.length<120||now-phaseStart<3000)return;
   const stats=summariseFrames(phaseFrames);
   if(!measurement.baseline){
    measurement.baseline=stats;phaseFrames=[];warmup=30;phaseStart=now;previousFrame=null;gain.value=1;
    for(const r of records.values()){r.mesh.geometry=r.bounceGeometry;r.mesh.material=r.bounceMaterial;}
   }else{
    const baseline=measurement.baseline;
    endMeasurement(`Original → bounced subject\nMedian: ${baseline.medianMs.toFixed(1)} → ${stats.medianMs.toFixed(1)} ms\np95: ${baseline.p95Ms.toFixed(1)} → ${stats.p95Ms.toFixed(1)} ms\nDraw calls: ${baseline.medianDrawCalls} → ${stats.medianDrawCalls}\nBoth views; frame timing, not GPU timing.\nCalculation/preparation times are reported above.`);
   }
  },
  tick(){if(measurement||!activeItems().length)return;const now=performance.now();if(now-lastCheck<250)return;lastCheck=now;const next=sceneSignature();if(next!==signature){signature=next;invalidate();}}
 };
}
