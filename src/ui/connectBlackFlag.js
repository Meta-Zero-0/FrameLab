import {createBlackFlag} from '../scene/createBlackFlag.js';
import {defaultFlag,flagRanges} from '../scene/flagState.js';
import {Vector3} from 'three';
import {connectOrbitControls} from './connectOrbitControls.js';
import {orbitYaw} from '../scene/subjectOrbit.js';
import {connectEquipmentCollection} from './connectEquipmentCollection.js';

export function connectBlackFlag(scene, subject) {
  const flags=Array.from({length:4},()=>createBlackFlag(scene)),section=document.createElement('section');
  let flag=flags[0];
  section.className='black-flag-controls';
  section.innerHTML='<h3>Black flags</h3><div data-collection></div><label><input type="checkbox" data-enabled> Selected flag on</label><div data-options hidden><div class="subject-fields" data-fields></div><button type="button" data-reset>Reset flag placement</button><details class="control-help"><summary>Using a flag</summary><p>Place the panel between a light and the area you want to shade. Both sides block direct light and calculated reflector bounce. The panel and stand can appear in the photograph. Up to four flags per setup.</p></details></div>';
  document.querySelector('.studio-controls').append(section);
  const fields=section.querySelector('[data-fields]'),inputs={},sliders={};
  const collection=connectEquipmentCollection({parent:section.querySelector('[data-collection]'),type:'flag',onChange:()=>{
    flags.forEach((model,i)=>{const item=collection.items[i];const state=model.apply(item?.state||defaultFlag);if(item){item.state=state;model.panel.name=item.name;model.support.group.name=item.name+' stand';}});
    flag=flags[collection.index];sync();
  }});
  const orbit=connectOrbitControls({parent:fields,prefix:'flag-orbit',position:()=>flag.snapshot(),center:()=>subject().getCenter(new Vector3()),
    change:(placement,angle,previous)=>restore({...flag.snapshot(),...placement,yaw:orbitYaw(flag.snapshot().yaw,previous,angle)})});
  const labels={x:'Left / right (m)',y:'Height (m)',z:'Front / back (m)',width:'Width (m)',height:'Panel height (m)',yaw:'Rotation (°)',pitch:'Tilt (°)'};
  for(const [key,[min,max]] of Object.entries(flagRanges)) {
    const label=document.createElement('label');label.textContent=labels[key];
    const input=document.createElement('input'),slider=document.createElement('input');
    for(const control of [input,slider]){control.min=min;control.max=max;control.step=key==='yaw'||key==='pitch'?1:.05;control.setAttribute('aria-label','Black flag '+labels[key]);}
    input.type='number';input.step='any';slider.type='range';inputs[key]=input;sliders[key]=slider;
    function change(control){if(control.value!==''&&control.checkValidity())restore({...flag.snapshot(),[key]:Number(control.value)});}
    input.addEventListener('input',()=>change(input));slider.addEventListener('input',()=>change(slider));
    input.addEventListener('blur',()=>sync());label.append(input,slider);fields.append(label);
  }
  const exact=document.createElement('details');exact.className='secondary-controls';exact.innerHTML='<summary>Exact flag placement</summary><div class="subject-fields"></div>';exact.querySelector('div').append(inputs.x.parentElement,inputs.z.parentElement);fields.after(exact);
  function sync(){const state=flag.snapshot();for(const key of Object.keys(inputs))inputs[key].value=sliders[key].value=state[key];section.querySelector('[data-enabled]').checked=state.enabled;section.querySelector('[data-enabled]').disabled=!collection.selected;section.querySelector('[data-options]').hidden=!collection.selected||!state.enabled;orbit.sync();}
  function restore(value){if(!collection.selected)return;collection.selected.state=flag.apply(value);collection.refresh();sync();}
  section.querySelector('[data-enabled]').addEventListener('change',e=>restore({...flag.snapshot(),enabled:e.target.checked}));
  section.querySelector('[data-reset]').addEventListener('click',()=>restore({...defaultFlag,enabled:flag.snapshot().enabled}));
  sync();return {snapshot:()=>flag.snapshot(),snapshotAll:collection.snapshot,restore:(legacy,items)=>collection.restore(items,legacy),reset:collection.reset,tick:orbit.sync};
}
