export const defaultFlag = { enabled:false, x:-1.2, y:1.2, z:0, width:1, height:1.5, yaw:90, pitch:0 };
export const flagRanges = { x:[-8,8], y:[.2,5], z:[-8,8], width:[.2,3], height:[.2,3], yaw:[-180,180], pitch:[-80,80] };
export function validateFlag(value) {
  if(value===undefined)return {...defaultFlag};
  if(!value||typeof value.enabled!=='boolean')throw new Error('Invalid black flag settings.');
  for(const [key,[min,max]] of Object.entries(flagRanges))if(!Number.isFinite(value[key])||value[key]<min||value[key]>max)throw new Error('Invalid black flag '+key+'.');
  return Object.fromEntries(Object.keys(defaultFlag).map(key=>[key,value[key]]));
}
