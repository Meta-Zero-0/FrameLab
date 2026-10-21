import {validateExposure} from '../camera/exposure.js';
import {defaultStudio,validStudio} from '../scene/studioBounds.js';
import {validateReflector} from '../scene/reflectorState.js';
import {lightModifiers} from '../scene/lightModifiers.js';
import {validateFlag} from '../scene/flagState.js';
import {validateEquipment} from '../scene/equipmentCollections.js';
import {noteLabels,validateShotNotes} from '../scene/shotNotes.js';
import {validatePlanGeometry} from '../scene/planGeometry.js';
const fieldIds=['subject-type','subject-pose','subject-region','subject-height','subject-x','subject-z','subject-yaw','focal-length','camera-distance','focus-distance','aperture','maintain-framing','follow-focus','visual-blur','show-grid','show-camera-guides','show-focus-plane','show-dof-guides','show-prop-labels'];
const byId=id=>document.getElementById(id);
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<1000);
export function validateSetup(data) {
 if(!data || data.format!=='FrameLab' || data.version!==1) throw new Error('Choose a FrameLab setup file (version 1).');
 const exposure=validateExposure(data.exposure);
 const reflector=validateReflector(data.reflector);
 const blackFlag=validateFlag(data.blackFlag);
 const notes=validateShotNotes(data.notes);
 const planGeometry=validatePlanGeometry(data.planGeometry);
 const flags=validateEquipment(data.flags,'flag',data.blackFlag),reflectors=validateEquipment(data.reflectors,'reflector',data.reflector);
 if(data.cameraTilt!==undefined&&(!Number.isFinite(data.cameraTilt)||Math.abs(data.cameraTilt)>85))throw new Error('Invalid camera tilt.');
 if(data.aspectRatio!==undefined&&!['3:2','4:3','16:9','1:1'].includes(data.aspectRatio))throw new Error('Invalid camera aspect ratio.');
 if(data.orientation!==undefined&&!['landscape','portrait'].includes(data.orientation))throw new Error('Invalid camera orientation.');
 if(data.studio!==undefined&&!validStudio(data.studio))throw new Error('Invalid studio dimensions or surface colours.');
 if(!data.fields || !data.lights || !vector(data.target) || !vector(data.overview?.position)||!vector(data.overview?.target)) throw new Error('Setup data is incomplete.');
 for(const id of fieldIds) {
  const el=byId(id),v=data.fields[id];
  if(el.type==='checkbox') {if(typeof v!=='boolean') throw new Error('Invalid '+id);}
  else if(el.tagName==='SELECT') {if(![...el.options].some(o=>o.value===v)) throw new Error('Invalid '+id);}
  else {const n=Number(v);if(typeof v!=='string'||v.trim()===''||!Number.isFinite(n)||n<Number(el.min)||n>Number(el.max)) throw new Error('Invalid '+id);}
 }
 for(const name of ['key','fill','hair','background']) {
  const s=data.lights[name];
  if(s?.name!==undefined&&(typeof s.name!=='string'||!s.name.trim()||s.name.length>60))throw new Error('Invalid light name: '+name);
  if(s?.modifier!==undefined&&!Object.hasOwn(lightModifiers,s.modifier))throw new Error('Invalid light modifier: '+name);
  if(s?.modifierRotation!==undefined&&(!Number.isFinite(s.modifierRotation)||Math.abs(s.modifierRotation)>180))throw new Error('Invalid softbox rotation: '+name);
  if(s?.support!==undefined&&!['auto','stand','boom'].includes(s.support)) throw new Error('Invalid light support: '+name);
  if(!s||!['studio','directional'].includes(s.mode)||!['hard','soft'].includes(s.source)||!/^#[0-9a-f]{6}$/i.test(s.colour)||!['enabled','follow','customColour'].every(k=>typeof s[k]==='boolean')) throw new Error('Invalid lamp: '+name);
  for(const el of document.querySelectorAll('.lighting-controls input[type=number]')) {if(el.id==='modifier-rotation'||el.dataset?.orbitControl)continue;const n=s.values?.[el.id];if(!Number.isFinite(n)||n<Number(el.min)||n>Number(el.max)) throw new Error('Invalid lamp value: '+el.id);}
  if(name==='background'&&(s.mode!=='studio'||s.source!=='hard')) throw new Error('Background requires hard Studio mode.');
 }
 if(!Array.isArray(data.props)||data.props.length!==3||!data.props.every(v=>typeof v==='boolean')||typeof data.markers!=='boolean') throw new Error('Invalid visibility settings.');
 if(!Array.isArray(data.lock?.points)||data.lock.points.length!==8||!data.lock.points.every(vector)||!Number.isFinite(data.lock.occupancy)||data.lock.occupancy<=0) throw new Error('Invalid framing reference.');
 if(data.fields['subject-type']==='import' && (!data.model || typeof data.model.name!=='string'||typeof data.model.base64!=='string'||data.model.base64.length>70000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(data.model.base64))) throw new Error('The imported GLB is missing or invalid.');
 return {...data,exposure,planGeometry,notes,flags,reflectors,blackFlag,reflector,orientation:data.orientation||'landscape',aspectRatio:data.aspectRatio||'3:2',studio:{...defaultStudio,...data.studio},fields:Object.fromEntries(fieldIds.map(id=>[id,data.fields[id]])),lights:Object.fromEntries(['key','fill','hair','background'].map(name=>[name,data.lights[name]]))};
}
export function validateProject(data) {
 const current=validateSetup(data);
 if(data.shots===undefined)return {...current,shots:[],activeShotId:null};
 if(!Array.isArray(data.shots)||data.shots.length>50)throw new Error('A project supports up to 50 shots.');
 const ids=new Set();
 const shots=data.shots.map(shot=>{
  if(!shot||typeof shot.id!=='string'||!shot.id||ids.has(shot.id)||typeof shot.name!=='string'||!shot.name.trim()||shot.name.length>80)throw new Error('Invalid shot name or identifier.');
  ids.add(shot.id);
  if(shot.setup?.shots!==undefined)throw new Error('Nested shot collections are not supported.');
  const setup=validateSetup(shot.setup);
  return {id:shot.id,name:shot.name.trim(),setup};
 });
 if(data.activeShotId!=null&&!ids.has(data.activeShotId))throw new Error('The active shot is missing.');
 return {...current,shots,activeShotId:data.activeShotId??null};
}
export function connectSetupFiles({subjects,snapshot,restore}) {
 const status=byId('setup-status'),fileInput=byId('setup-file');let busy=false;
 let shots=[],activeShotId=null;
 const menu=document.createElement('details');menu.className='shot-menu';
 menu.innerHTML='<summary>Shots (0)</summary><div class="shot-popover"><label>Saved shot<select id="shot-select" aria-label="Saved shot"></select></label><label>Shot name<input id="shot-name" maxlength="80" placeholder="e.g. Portrait A" /></label><div class="shot-actions"><button type="button" id="shot-new">Save as new</button><button type="button" id="shot-load">Load</button><button type="button" id="shot-update">Update</button><button type="button" id="shot-rename">Rename</button><button type="button" id="shot-delete">Delete</button><button type="button" id="shot-undo" hidden>Undo delete</button></div><p class="guide-note">Edits to the active shot are kept when switching. Save project downloads all shots; reload clears shots that have not been downloaded.</p><p id="shot-status" role="status" class="guide-note"></p></div>';
 document.querySelector('.control-switch').append(menu);
 const noteMenu=document.createElement('details');noteMenu.className='shot-menu shoot-notes-menu';
 noteMenu.innerHTML='<summary>Shoot notes</summary><div class="shot-popover"><p data-note-shot class="guide-note"></p><div data-note-fields></div><p class="guide-note">Notes belong to the current working shot and appear in its shoot plan. Save project to keep them after closing.</p></div>';
 document.querySelector('.control-switch').append(noteMenu);
 const noteInputs={};
 for(const [key,label] of Object.entries(noteLabels)){
   const wrapper=document.createElement('label');wrapper.textContent=label;
   const input=document.createElement('textarea');input.rows=3;input.maxLength=4000;input.setAttribute('aria-label',label);input.id='shoot-note-'+key;
   wrapper.append(input);noteMenu.querySelector('[data-note-fields]').append(wrapper);noteInputs[key]=input;
 }
 const readNotes=()=>Object.fromEntries(Object.entries(noteInputs).map(([key,input])=>[key,input.value]));
 function restoreNotes(value){for(const [key,text] of Object.entries(validateShotNotes(value)))noteInputs[key].value=text;}
 byId('save-setup').textContent='Save project';byId('open-setup').textContent='Open project';
 let deleted=null;
 const shotStatus=byId('shot-status');
 function refresh(selected=activeShotId) {
  noteMenu.querySelector('[data-note-shot]').textContent='Editing: '+(shots.find(s=>s.id===activeShotId)?.name||'Untitled shoot');
  const select=byId('shot-select');select.replaceChildren();
  for(const shot of shots){const option=document.createElement('option');option.value=shot.id;option.textContent=shot.name+(shot.id===activeShotId?' (active)':'');select.append(option);}
  if(shots.some(s=>s.id===selected))select.value=selected;
  byId('shot-name').value=shots.find(s=>s.id===select.value)?.name||'';
  for(const id of ['shot-load','shot-update','shot-rename','shot-delete'])byId(id).disabled=!shots.length;
  byId('shot-undo').hidden=!deleted;
  menu.querySelector('summary').textContent='Shots ('+shots.length+')';
 }
 const selectedShot=()=>shots.find(s=>s.id===byId('shot-select').value);
 byId('shot-select').addEventListener('change',()=>{byId('shot-name').value=selectedShot()?.name||'';});
 async function capture() {
  const invalid=[...document.querySelectorAll('.photo-panel input[type=number]')].find(el=>!el.disabled&&(el.value===''||!el.checkValidity()));
  if(invalid)throw new Error('Correct the invalid number before saving.');
  const data={format:'FrameLab',version:1,fields:fields(),...snapshot(),notes:readNotes()};
  if(data.fields['subject-type']==='import') {
   const file=subjects.getImportedFile();if(!file)throw new Error('Import the model before saving.');
   const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Could not read the model.'));reader.readAsDataURL(file);});
   data.model={name:file.name,base64};
  }
  return structuredClone(validateSetup(data));
 }
 async function apply(data) {
  if(data.fields['subject-type']==='import') {
   const bytes=Uint8Array.from(atob(data.model.base64),c=>c.charCodeAt(0));
   await subjects.importFile(new File([bytes],data.model.name,{type:'model/gltf-binary'}));
   byId('import-option').disabled=false;byId('import-option').textContent='Imported GLB: '+data.model.name;
  }
  await restore(data);
  restoreNotes(data.notes);
 }
 function keepCurrent(data) {
  const active=shots.find(s=>s.id===activeShotId);
  if(active)active.setup=data;
 }
 for(const action of ['new','load','update','rename','delete','undo'])byId('shot-'+action).addEventListener('click',async()=>{
  if(busy||byId('subject-type').disabled)return;
  let previous;
  try {
   setBusy(true);
   const selected=selectedShot(),name=byId('shot-name').value.trim();
   if(['new','rename'].includes(action)&&!name)throw new Error('Enter a shot name.');
   if(action==='new') {
    if(shots.length>=50)throw new Error('The project already contains 50 shots.');
    const setup=await capture();keepCurrent(structuredClone(setup));
    const shot={id:crypto.randomUUID(),name,setup};shots.push(shot);activeShotId=shot.id;
   } else if(action==='load'&&selected) {
    previous=await capture();
    if(!activeShotId&&shots.length>=50)throw new Error('Save the current setup separately before switching: this project is full.');
    if(selected.id!==activeShotId)await apply(selected.setup);
    if(activeShotId)keepCurrent(previous);
    else shots.push({id:crypto.randomUUID(),name:'Previous working setup',setup:previous});
    activeShotId=selected.id;
   } else if(action==='update'&&selected) {
    const setup=await capture();keepCurrent(structuredClone(setup));selected.setup=setup;activeShotId=selected.id;
   } else if(action==='rename'&&selected)selected.name=name;
   else if(action==='delete'&&selected) {
    deleted={shot:selected,index:shots.indexOf(selected)};
    shots=shots.filter(s=>s.id!==selected.id);if(activeShotId===selected.id)activeShotId=null;
   } else if(action==='undo'&&deleted) {
    if(shots.length>=50)throw new Error('The project already contains 50 shots.');
    shots.splice(deleted.index,0,deleted.shot);deleted=null;
   }
   refresh();shotStatus.textContent=action==='load'?'Shot loaded. Previous edits retained.':action==='delete'?'Shot removed. The current scene is unchanged.':'Shot collection updated. Save project to keep it after closing.';
  }catch(e){
   if(previous)try{await apply(previous);}catch{status.textContent='Could not restore the previous scene after the failed load.';}
   shotStatus.textContent=e.message;
  }finally{setBusy(false);}
 });
 refresh();
 function setBusy(value) {
  busy=value;
  byId('save-setup').disabled=byId('open-setup').disabled=byId('reset-all').disabled=value;
  document.querySelector('.workspace').inert=value;
  document.querySelector('#comparison-status').closest('section').inert=value;
 }
 byId('save-setup').dataset.help='Download the current setup and all named shots, including their imported models. A/B photographs are separate.';
 byId('open-setup').dataset.help='Open a FrameLab project or older single setup. Replaces the current scene and shot collection; save your project first to keep it.';
 const fields=()=>Object.fromEntries(fieldIds.map(id=>{const el=byId(id);return [id,el.type==='checkbox'?el.checked:el.value];}));
 byId('save-setup').addEventListener('click',async()=>{
 if(busy||byId('subject-type').disabled)return;
 try {
  setBusy(true);
  const current=await capture();keepCurrent(structuredClone(current));
  const data=validateProject({...current,shots,activeShotId});
  const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  if(blob.size>72*1024*1024)throw new Error('Project exceeds 72 MB. Reduce imported model sizes or the number of shots.');
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='FrameLab-project.framelab';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Project downloaded with '+shots.length+' named shots. A/B captures are separate.';
 }catch(e){status.textContent='Could not save: '+e.message;}finally{setBusy(false);}
 });
 byId('open-setup').addEventListener('click',()=>{if(!busy&&!byId('subject-type').disabled)fileInput.click();});
 fileInput.addEventListener('change',async()=>{
 const file=fileInput.files[0];if(!file)return;
 try {
  if(file.size>72*1024*1024)throw new Error('Setup exceeds 72 MB.');
  setBusy(true);
  const data=validateProject(JSON.parse(await file.text()));
  await apply(data);
  shots=data.shots;activeShotId=data.activeShotId;deleted=null;refresh();
  status.textContent='Project restored with '+shots.length+' named shots. Existing A/B photographs remain unchanged.';
 }catch(e){status.textContent='Could not open: '+e.message;}finally{setBusy(false);fileInput.value='';}
 });
 return {activeShotName:()=>shots.find(shot=>shot.id===activeShotId)?.name||'Untitled shoot',notes:readNotes,resetNotes:()=>restoreNotes(),shootPack:()=>({shots,activeId:activeShotId})};
}
