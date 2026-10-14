import {it,expect,vi,afterEach} from 'vitest';
import {buildTree,occluded} from '../experiments/triangleVisibility.js';
afterEach(()=>vi.unstubAllGlobals());
it('checks finite triangle intersections on either face without endpoint self-shadow',()=>{
 const tree=buildTree([[-1,-1,1,1,-1,1,0,1,1]]);
 expect(occluded(tree,[0,0,0],[0,0,2])).toBe(true);
 expect(occluded(tree,[0,0,2],[0,0,0])).toBe(true);
 expect(occluded(tree,[2,0,0],[2,0,2])).toBe(false);
 expect(occluded(tree,[0,0,0],[0,0,1])).toBe(false);
 expect(occluded(tree,[0,0,1],[0,0,2])).toBe(false);
});
it('traverses split nodes and misses triangles beyond the light segment',()=>{
 const tree=buildTree(Array.from({length:20},(_,i)=>[-1,-1,i+1,1,-1,i+1,0,1,i+1]));
 expect(occluded(tree,[0,0,0],[0,0,.5])).toBe(false);
 expect(occluded(tree,[0,0,0],[0,0,15])).toBe(true);
});
it('applies coloured bounce at mesh vertices and rejects blocked paths',async()=>{
 const postMessage=vi.fn();vi.stubGlobal('self',{postMessage});await import('../experiments/meshBounce.worker.js');
 const data={triangles:[],board:{center:[0,0,0],size:1,yaw:0,reflectance:.8,divisions:4},lights:[{position:[0,0,3],target:[0,0,0],intensity:100,angle:Math.PI/3,color:[1,.5,0]}],receivers:[{id:'surface',positions:[0,0,2],normals:[0,0,-1]}]};
 self.onmessage({data});let result=postMessage.mock.calls.at(-1)[0];
 expect(result.error).toBeUndefined();const rgb=result.results[0].values;
 expect(rgb[0]).toBeGreaterThan(0);expect(rgb[1]).toBeCloseTo(rgb[0]/2);expect(rgb[2]).toBe(0);
 data.triangles=[[-10,-10,1,10,-10,1,0,10,1]];
 self.onmessage({data});result=postMessage.mock.calls.at(-1)[0];expect([...result.results[0].values]).toEqual([0,0,0]);
});
