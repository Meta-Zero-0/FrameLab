import {Box3,Vector3} from 'three';
import {createMeasuredGrid} from '../scene/createMeasuredGrid.js';
import {defaultStudio,validStudio,outsideStudio} from '../scene/studioBounds.js';
export function connectStudioControls({floor,grid,wall,subject,camera,lighting,cameraEquipment}) {
 let state={...defaultStudio},lastCheck=0;
 const panel=document.createElement('section');panel.className='studio-controls';panel.hidden=true;panel.setAttribute('aria-label','Studio dimensions');
 panel.innerHTML='<h3>Studio dimensions</h3><div class="subject-fields">'+['width','depth','height'].map(k=>'<label>'+k[0].toUpperCase()+k.slice(1)+' (m)<input id="studio-'+k+'" type="number" min="2" max="'+(k==='height'?10:30)+'" step="0.1" value="'+state[k]+'"></label>').join('')+'</div><p class="guide-note">Floor centred on X/Z zero. The wall marks the rear edge. Height is a planning limit; side walls and ceiling are not rendered.</p><p id="studio-status" class="guide-note" role="status"></p>';
 panel.insertAdjacentHTML('beforeend','<h3>Surfaces</h3><div class="subject-fields"><label>Floor colour <input type="color" id="studio-floor-colour" value="#ffffff"></label><label>Backdrop colour <input type="color" id="studio-wall-colour" value="#edf2f8"></label></div><p class="guide-note">Surface colours reflect your lights. A white surface can look dark when unlit; these controls do not add light.</p>');
 document.querySelector('.control-deck').append(panel);
 const colours={floorColour:panel.querySelector('#studio-floor-colour'),wallColour:panel.querySelector('#studio-wall-colour')};
 for(const [key,input] of Object.entries(colours)) {
  input.dataset.help='Change the material colour, not the light. White reflects more light; dark surfaces give a darker background. Light colour and intensity still affect the result. Simulated bounced light is not included.';
  input.addEventListener('input',()=>{state[key]=input.value;applyColours();});
 }
 function applyColours(){floor.material.color.set(state.floorColour);wall.material.color.set(state.wallColour);for(const [key,input] of Object.entries(colours))input.value=state[key];}
 const inputs=Object.fromEntries(['width','depth','height'].map(k=>[k,panel.querySelector('#studio-'+k)]));
 for(const [k,input] of Object.entries(inputs)) {
  input.dataset.help='Studio '+k+' in metres. Resizes the room without moving your camera, subject or lamps. Out-of-room items are reported below; they are not clamped.';
  input.addEventListener('change',()=>{const next=Object.fromEntries(Object.entries(inputs).map(([k,i])=>[k,Number(i.value)]));if(validStudio(next)&&Object.values(inputs).every(i=>i.value!=='')){apply({...state,...next});}else{input.reportValidity();}});
 }
 function apply(next) {
  state={...defaultStudio,...next};applyColours();for(const k of Object.keys(inputs))inputs[k].value=state[k];
  lighting.setStudio(state);
  floor.scale.set(state.width/12,state.depth/12,1);
  wall.scale.set(state.width/12,state.height/3.6,1);wall.position.set(0,state.height/2,-state.depth/2-.1);
  const replacement=createMeasuredGrid(state.width,state.depth);
  grid.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});
  grid.clear();grid.add(...[...replacement.children]);lastCheck=0;tick();
 }
 function tick() {
  const now=performance.now();if(now-lastCheck<300)return;lastCheck=now;
  const outside=[];const box=new Box3().setFromObject(subject);
  if(outsideStudio(box.min,box.max,state))outside.push('Subject');
  if(outsideStudio(camera.position,camera.position,state))outside.push('Camera');
  const cameraBounds=cameraEquipment?.report().bounds;
  if(cameraBounds && outsideStudio(cameraBounds.min,cameraBounds.max,state))outside.push('Camera tripod/rig');
  for(const [name,s] of Object.entries(lighting.snapshot())) {if(!s.enabled)continue;const v=s.values,p=new Vector3(v['light-x'],v['light-y'],v['light-z']);if(outsideStudio(p,p,state))outside.push(name+' light');}
  for(const [name,report] of Object.entries(lighting.equipmentReports())) if(report.outside) outside.push(name+' equipment');
  const unsupported=Object.entries(lighting.equipmentReports()).filter(([,report])=>!report.supported).map(([name])=>name);
  const message=(outside.length?'Outside studio: '+outside.join(', ')+'.':'Camera, subject and enabled light equipment fit within the studio.')+(unsupported.length?' Beyond typical stand dimensions: '+unsupported.join(', ')+'.':'');
  panel.querySelector('#studio-status').textContent=message;
 }
 apply(state);
 return {tick,snapshot:()=>({...state}),restore:apply,reset:()=>apply(defaultStudio)};
}
