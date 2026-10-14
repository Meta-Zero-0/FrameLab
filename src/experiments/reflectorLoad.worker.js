import { illuminateBoard,bouncedIrradiance } from './diffuseBounce.js';
let cacheKey='',patches=[];
self.onmessage=({data})=>{
 try {
  const start=performance.now();
  const key=JSON.stringify([data.lights,data.divisions,data.yaw]);
  const cached=key===cacheKey;
  if(!cached) {
   patches=[];
   for(const light of data.lights) {
    const contribution=illuminateBoard({light,divisions:data.divisions,yaw:data.yaw,blockers:[]});
    if(!patches.length)patches=contribution;
    else contribution.forEach((patch,i)=>{patches[i].radiance+=patch.radiance;patches[i].irradiance+=patch.irradiance;});
   }
   cacheKey=key;
  }
  const boardMs=performance.now()-start;
  const result=new Float32Array(1024);
  const blockers=[{min:[-.2,.8,.8],max:[.2,1.5,.9]}];
  const bounceStart=performance.now();
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)result[y*32+x]=bouncedIrradiance([((x+.5)/32-.5)*1.6,1.2+(.5-(y+.5)/32)*1.6,data.distance],[0,0,-1],patches,blockers);
  self.postMessage({id:data.id,cached,boardMs,bounceMs:performance.now()-bounceStart,totalMs:performance.now()-start,result},[result.buffer]);
 }catch(error){self.postMessage({id:data.id,error:error.message});}
};
