import {validateEquipment,defaultEquipmentState} from '../scene/equipmentCollections.js';

// A single editor selects lightweight saved entries; scene models are managed by its owner.
export function connectEquipmentCollection({parent,type,onChange}) {
  const limit=type==='flag'?4:2,label=type==='flag'?'Flag':'Reflector';
  let items=validateEquipment(undefined,type),index=0;
  const toolbar=document.createElement('div');toolbar.className='equipment-collection';
  toolbar.innerHTML='<label>Selected '+label.toLowerCase()+'<select data-select></select></label><label>Name<input data-name maxlength="60" /></label><div class="presets"><button type="button" data-add>Add '+label.toLowerCase()+'</button><button type="button" data-copy>Duplicate</button><button type="button" data-remove>Remove</button></div>';
  parent.append(toolbar);
  const select=toolbar.querySelector('[data-select]'),name=toolbar.querySelector('[data-name]');
  function refresh(){
    select.replaceChildren();items.forEach((item,i)=>{const option=document.createElement('option');option.value=i;option.textContent=item.name+(item.state.enabled?'':' (off)');select.append(option);});
    select.value=index;select.disabled=!items.length;name.disabled=!items.length;name.value=items[index]?.name||'';
    toolbar.querySelector('[data-add]').disabled=items.length>=limit;
    toolbar.querySelector('[data-copy]').disabled=!items.length||items.length>=limit;
    toolbar.querySelector('[data-remove]').disabled=!items.length;
  }
  function notify(reason){refresh();onChange(reason);}
  select.addEventListener('change',()=>{index=Number(select.value);notify('select');});
  name.addEventListener('change',()=>{if(items[index]&&name.value.trim()){items[index].name=name.value.trim().slice(0,60);notify('rename');}else refresh();});
  toolbar.querySelector('[data-add]').addEventListener('click',()=>{
    if(items.length>=limit)return;
    let number=1;while(items.some(item=>item.name===`${label} ${number}`))number++;
    items.push({name:`${label} ${number}`,state:defaultEquipmentState(type,items.length)});index=items.length-1;notify('add');
  });
  toolbar.querySelector('[data-copy]').addEventListener('click',()=>{
    if(!items[index]||items.length>=limit)return;
    const copy=structuredClone(items[index]);copy.name=(copy.name+' copy').slice(0,60);
    // Offset the duplicate so two opaque panels do not coincide and block one another.
    const bound=type==='flag'?8:5;copy.state.x += copy.state.x+.4<=bound ? .4 : -.4;copy.state.enabled=true;
    items.push(copy);index=items.length-1;notify('duplicate');
  });
  toolbar.querySelector('[data-remove]').addEventListener('click',()=>{items.splice(index,1);index=Math.max(0,Math.min(index,items.length-1));notify('remove');});
  refresh();
  return {toolbar,get items(){return items;},get index(){return index;},get selected(){return items[index];},
    refresh,snapshot:()=>structuredClone(items),
    restore(value,legacy){items=validateEquipment(value,type,legacy);index=0;notify('restore');},
    reset(){items=validateEquipment(undefined,type);index=0;notify('reset');}};
}
