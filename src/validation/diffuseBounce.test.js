import { it,expect } from 'vitest';
import { illuminateBoard,bouncedIrradiance,blocked } from '../experiments/diffuseBounce.js';
const config=()=>({center:[0,0,0],size:1,yaw:0,reflectance:.8,divisions:8,light:{position:[0,0,2],target:[0,0,0],intensity:100,angle:Math.PI/3}});
const measure=c=>bouncedIrradiance([0,0,3],[0,0,-1],illuminateBoard(c));
it('reflects from either white face without transmitting light through the board',()=>{
 const c={...config(),twoSided:true};
 expect(measure({...c,yaw:Math.PI})).toBeCloseTo(measure(c),10);
 expect(measure(c)).toBeCloseTo(measure(config()),10);
 expect(bouncedIrradiance([0,0,-3],[0,0,1],illuminateBoard(c))).toBe(0);
});
it('tilts board sampling positions and normals together',()=>{
 const patches=illuminateBoard({...config(),pitch:Math.PI/2});
 expect(patches[0].normal[1]).toBeCloseTo(-1);
 for(const p of patches)expect(p.point[1]).toBeCloseTo(0);
 expect(measure({...config(),pitch:Math.PI})).toBe(0);
});
it('matches the analytic central-patch geometric and Lambertian factors',()=>{
 const c={...config(),divisions:1};
 expect(measure(c)).toBeCloseTo((100/4)*.8/Math.PI/9,10);
});
it('is zero without incident power or reflectance and scales linearly',()=>{
 const c=config(),base=measure(c);
 expect(measure({...c,reflectance:0})).toBe(0);
 expect(measure({...c,light:{...c.light,intensity:0}})).toBe(0);
 expect(measure({...c,reflectance:.4})).toBeCloseTo(base/2,10);
 expect(measure({...c,light:{...c.light,intensity:200}})).toBeCloseTo(base*2,10);
});
it('rejects backside lighting and backside receiving',()=>{
 expect(measure({...config(),yaw:Math.PI})).toBe(0);
 expect(bouncedIrradiance([0,0,3],[0,0,1],illuminateBoard(config()))).toBe(0);
});
it('blocks both path segments and handles parallel rays correctly',()=>{
 const box={min:[-2,-2,.9],max:[2,2,1.1]};
 const c=config();expect(measure({...c,blockers:[box]})).toBe(0);
 expect(bouncedIrradiance([0,0,3],[0,0,-1],illuminateBoard(c),[box])).toBe(0);
 expect(blocked([3,0,0],[3,0,3],[box])).toBe(false);
 expect(blocked([0,0,0],[0,0,3],[box])).toBe(true);
});
it('partially occludes the board and converges with higher quadrature resolution',()=>{
 const c=config(),patches=illuminateBoard({...c,divisions:32});
 const full=bouncedIrradiance([0,0,3],[0,0,-1],patches);
 const partial=bouncedIrradiance([0,0,3],[0,0,-1],patches,[{min:[-.6,-1,1],max:[-.02,1,1.1]}]);
 expect(partial).toBeGreaterThan(0);expect(partial).toBeLessThan(full);
 expect(Math.abs(measure({...c,divisions:16})-full)/full).toBeLessThan(.002);
 const incident=patches.reduce((s,p)=>s+p.irradiance*p.area,0);
 const reflected=patches.reduce((s,p)=>s+p.radiance*Math.PI*p.area,0);
 expect(reflected).toBeCloseTo(incident*c.reflectance,10);
});
