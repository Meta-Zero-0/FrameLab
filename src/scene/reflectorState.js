export const defaultReflector={enabled:false,x:.85,y:.65,z:.85,size:1,yaw:-135,pitch:-25,reflectance:.8,quality:4};
export function validateReflector(value) {
 if(value===undefined)return {...defaultReflector};
 if(!value||typeof value.enabled!=='boolean')throw new Error('Invalid reflector settings.');
 const ranges={x:[-5,5],y:[.2,5],z:[-5,5],size:[.2,3],yaw:[-180,180],pitch:[-90,90],reflectance:[0,1]};
 for(const [key,[min,max]] of Object.entries(ranges))if(!Number.isFinite(value[key])||value[key]<min||value[key]>max)throw new Error('Invalid reflector '+key+'.');
 if(![4,8].includes(value.quality))throw new Error('Invalid reflector quality.');
 return Object.fromEntries(Object.keys(defaultReflector).map(key=>[key,value[key]]));
}
