import {defaultFlag,validateFlag} from './flagState.js';
import {defaultReflector,validateReflector} from './reflectorState.js';

export function validateEquipment(items, type, legacy) {
  const flag=type==='flag',limit=flag?4:2,validate=flag?validateFlag:validateReflector;
  if(items===undefined)return [{name:flag?'Flag 1':'Reflector 1',state:validate(legacy)}];
  if(!Array.isArray(items)||items.length>limit)throw new Error(`A setup supports up to ${limit} ${flag?'flags':'reflectors'}.`);
  return items.map(item=>{
    if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>60||!item.state)throw new Error('Invalid equipment name or settings.');
    return {name:item.name.trim(),state:validate(item.state)};
  });
}
export function defaultEquipmentState(type,index) {
  if(type==='flag')return {...defaultFlag,enabled:true,x:index%2?1.2:-1.2,z:Math.floor(index/2),yaw:index%2?-90:90};
  return {...defaultReflector,enabled:true,x:index%2?-.85:.85,yaw:index%2?135:-135};
}
