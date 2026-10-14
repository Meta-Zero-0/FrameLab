import {illuminateBoard} from './diffuseBounce.js';
import {buildTree,occluded} from './triangleVisibility.js';
self.onmessage=({data})=>{
 try {
  const start=performance.now(),tree=buildTree(data.triangles),buildMs=performance.now()-start;
  const patches=[];
  // Share the scene index and receiver traversal; add each board's direct-light bounce.
  for(const board of data.boards||[data.board]){
   let boardPatches=[];
   for(const light of data.lights){
    const ps=illuminateBoard({...board,light});
    if(!boardPatches.length)boardPatches=ps.map(p=>({...p,rgb:[0,0,0]}));
    ps.forEach((p,i)=>{if(p.radiance&&!occluded(tree,light.position,p.point))for(let k=0;k<3;k++)boardPatches[i].rgb[k]+=p.radiance*light.color[k];});
   }
   patches.push(...boardPatches.filter(p=>p.rgb.some(v=>v>0)));
  }
  const results=data.receivers.map(receiver=>{
   const values=new Float32Array(receiver.positions.length);
   for(let i=0;i<values.length;i+=3){
    const point=receiver.positions.slice(i,i+3),normal=receiver.normals.slice(i,i+3);
    const origin=point.map((v,k)=>v+normal[k]*.0002);
    for(const p of patches){
     if(!p.rgb.some(v=>v>0))continue;
     const d=point.map((v,k)=>v-p.point[k]),r2=d.reduce((s,v)=>s+v*v,0);if(r2<1e-8)continue;
     const r=Math.sqrt(r2),out=Math.max(0,d.reduce((s,v,k)=>s+v*p.normal[k],0)/r),inc=Math.max(0,-d.reduce((s,v,k)=>s+v*normal[k],0)/r);
     if(out&&inc&&!occluded(tree,p.point,origin))for(let k=0;k<3;k++)values[i+k]+=p.rgb[k]*p.area*out*inc/r2;
    }
   }
   return {id:receiver.id,values};
  });
  self.postMessage({results,buildMs,totalMs:performance.now()-start,triangles:data.triangles.length},results.map(r=>r.values.buffer));
 }catch(e){self.postMessage({error:e.message});}
};
