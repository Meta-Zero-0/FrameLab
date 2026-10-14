const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const unit=v=>{const length=Math.hypot(...v);return length?v.map(x=>x/length):[0,0,0];};

// Open segment against an opaque axis-aligned box. Endpoints are excluded.
export function blocked(a,b,boxes=[]) {
 const d=sub(b,a);
 return boxes.some(box=>{
  let lo=1e-6,hi=1-1e-6;
  for(let k=0;k<3;k++) {
   if(Math.abs(d[k])<1e-12){if(a[k]<box.min[k]||a[k]>box.max[k])return false;}
   else {let t0=(box.min[k]-a[k])/d[k],t1=(box.max[k]-a[k])/d[k];if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;}
  }
  return true;
 });
}

// Midpoint quadrature of direct irradiance on a one-sided Lambertian board.
// Positions and sizes are metres; intensity is cd, output irradiance is lux.
export function illuminateBoard({center=[0,1.2,0],size=1,yaw=0,pitch=0,reflectance=.8,divisions=8,light,blockers=[],twoSided=false}) {
 if(!Number.isInteger(divisions)||divisions<1||divisions>64||!Number.isFinite(size)||size<=0||!Number.isFinite(reflectance)||reflectance<0||reflectance>1)throw new Error('Invalid board sampling or reflectance.');
 const normal=[Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],right=[Math.cos(yaw),0,-Math.sin(yaw)],up=[Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),Math.cos(yaw)*Math.sin(pitch)];
 const area=size*size/(divisions*divisions),direction=unit(sub(light.target,light.position));
 const outer=Math.cos(light.angle),inner=Math.cos(light.angle*(1-(light.penumbra??.25)));
 const patches=[];
 for(let y=0;y<divisions;y++)for(let x=0;x<divisions;x++) {
  const u=((x+.5)/divisions-.5)*size,v=((y+.5)/divisions-.5)*size;
  const point=center.map((c,k)=>c+u*right[k]+v*up[k]);
  const fromLight=sub(point,light.position),distance2=dot(fromLight,fromLight),incoming=unit(fromLight);
  const cone=dot(incoming,direction);
  const t=inner===outer?Number(cone>=outer):Math.max(0,Math.min(1,(cone-outer)/(inner-outer)));
  const beam=t*t*(3-2*t);
  // Each white face reflects only into its own hemisphere: no transmission.
  for(const faceNormal of twoSided?[normal,normal.map(v=>-v)]:[normal]) {
   const cosine=Math.max(0,-dot(faceNormal,incoming));
   const irradiance=distance2>1e-10&&!blocked(light.position,point,blockers)?light.intensity*beam*cosine/distance2:0;
   patches.push({point,normal:faceNormal,area,irradiance,radiance:reflectance*irradiance/Math.PI});
  }
 }
 return patches;
}

// One board bounce arriving on an oriented measurement surface, before tone mapping.
export function bouncedIrradiance(point,normal,patches,blockers=[]) {
 let result=0;
 for(const patch of patches) {
  if(patch.radiance===0)continue;
  const delta=sub(point,patch.point),r2=dot(delta,delta);if(r2<1e-10)continue;
  const direction=unit(delta);
  const outgoing=Math.max(0,dot(patch.normal,direction));
  const receiving=Math.max(0,-dot(normal,direction));
  if(outgoing&&receiving&&!blocked(patch.point,point,blockers))result+=patch.radiance*patch.area*outgoing*receiving/r2;
 }
 return result;
}
