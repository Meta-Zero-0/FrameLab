import {Scene,DirectionalLight,Vector3} from 'three';
import {createPhotoCamera,applyLens} from '../camera/cameraModel.js';
import {createCameraTravel} from '../camera/cameraTravel.js';
import {sceneLayout} from '../scene/sceneLayout.js';
import {createLightEquipment} from '../scene/createLightEquipment.js';
import {defaultStudio} from '../scene/studioBounds.js';
import {validateEquipment} from '../scene/equipmentCollections.js';
import {validatePlanGeometry} from '../scene/planGeometry.js';
import {makeShootPlan} from './shootPlan.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function savedPlan(shot,date) {
  const s=shot.setup,f=s.fields,g=validatePlanGeometry(s.planGeometry),studio={...defaultStudio,...s.studio};
  const camera=createPhotoCamera();camera.position.set(...sceneLayout.photoView.position);
  camera.userData.aspectRatio=s.aspectRatio||'3:2';camera.userData.orientation=s.orientation||'landscape';applyLens(camera,Number(f['focal-length']));
  const travel=createCameraTravel(camera,sceneLayout.photoView.target);travel.setTilt(s.cameraTilt??travel.initialTilt);travel.target.fromArray(s.target);travel.setDistance(Number(f['camera-distance']));
  if(g){camera.position.fromArray(g.camera);camera.lookAt(travel.target);camera.updateMatrixWorld(true);}
  const centre=[Number(f['subject-x']),Number(f['subject-height'])/2,Number(f['subject-z'])];
  const names={cube:'Learning cube',product:'Product / bottle',human:'Human / mannequin',import:s.model?.name||'Imported GLB'};
  const aim=g?.aim||[s.lights.key.values['light-aim-x'],s.lights.key.values['light-aim-y'],s.lights.key.values['light-aim-z']];
  // Build only equipment geometry for support placement; no renderers, model import or bounce work.
  const scene=new Scene(),lights={};
  for(const [id,state] of Object.entries(s.lights)){
    const v=state.values,light=new DirectionalLight();light.position.set(v['light-x'],v['light-y'],v['light-z']);
    light.target.position.fromArray(state.follow&&g?aim:[v['light-aim-x'],v['light-aim-y'],v['light-aim-z']]);lights[id]=light;
  }
  const equipment=createLightEquipment(scene,camera);equipment.setStudio(studio);equipment.update(lights,s.lights);
  const supports=equipment.reports();
  const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  // Old shots have no full-subject footprint. Mark its saved position, never invent dimensions.
  return {title:shot.name,date,notes:s.notes,studio,
    camera:{position:camera.position.toArray(),target:travel.target.toArray(),focal:Number(f['focal-length']),orientation:s.orientation||'landscape',aspectRatio:s.aspectRatio||'3:2',aperture:f.aperture,focus:Number(f['focus-distance']),tilt:travel.getTilt(),distance:camera.position.distanceTo(travel.target)},
    subject:{name:names[f['subject-type']]||f['subject-type'],min:g?.min||centre,max:g?.max||centre,yaw:f['subject-yaw'],boundsUnavailable:!g},
    aim,lights:g?s.lights:Object.fromEntries(Object.entries(s.lights).map(([id,state])=>[id,{...state,follow:false}])),supports,reflectors:validateEquipment(s.reflectors,'reflector',s.reflector),flags:validateEquipment(s.flags,'flag',s.blackFlag)};
}

export function makeShootPack(shots,current,activeId) {
  if(!shots.length)throw new Error('Save at least one named shot before exporting a shoot pack.');
  const documents=shots.map(shot=>{
    const data=shot.id===activeId?{...current,title:shot.name}:savedPlan(shot,current.date);
    return {name:shot.name,html:makeShootPlan(data).replace(' · Current setup',' · Saved shot')};
  });
  if(!activeId)documents.push({name:'Current working setup (unsaved)',html:makeShootPlan({...current,title:'Current working setup (unsaved)'})});
  const style=documents[0].html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const cover=`<main class="pack-cover"><h1>FrameLab shoot pack</h1><p>${escape(current.date)} · ${documents.length} shots</p><p>Saved-shot order. The active shot includes its current edits; an unnamed working setup is included separately.</p><ol>${documents.map((doc,i)=>`<li><a href="#shot-${i+1}">${escape(doc.name)}</a></li>`).join('')}</ol><p class="note">Each shot starts on a new printed page. Save the project separately to retain editable scenes.</p></main>`;
  const pages=documents.map((doc,i)=>`<main class="pack-shot" id="shot-${i+1}"><p class="meta">Shot ${i+1} of ${documents.length}</p>${doc.html.match(/<main>([\s\S]*?)<\/main>/)[1]}</main>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FrameLab shoot pack</title><style>${style}li{margin:12px 0}a{color:inherit}.pack-shot{margin-top:30px}@media print{.pack-shot{break-before:page;margin-top:0}.pack-cover{min-height:150mm}}</style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>${cover}${pages}</body></html>`;
}
