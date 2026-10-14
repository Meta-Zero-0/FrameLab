export function validatePlanGeometry(value) {
  if(value===undefined)return undefined;
  const vector=p=>Array.isArray(p)&&p.length===3&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<1000);
  if(!value||!vector(value.min)||!vector(value.max)||!vector(value.aim)||!vector(value.camera)||value.min.some((n,i)=>n>value.max[i]))throw new Error('Invalid saved plan geometry.');
  return {min:[...value.min],max:[...value.max],aim:[...value.aim],camera:[...value.camera]};
}
