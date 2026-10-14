import {it,expect} from 'vitest';
import {orbitCoordinates,orbitPlacement,orbitYaw} from '../scene/subjectOrbit.js';

it.each([[0,2,7],[90,5,4],[-90,-1,4],[180,2,1]])('orbits a displaced subject at %s degrees', (angle,x,z)=>{
 const center={x:2,z:4},position={x:2,y:1.7,z:7};
 const result=orbitPlacement(position,center,angle,3);
 expect(result.x).toBeCloseTo(x);expect(result.z).toBeCloseTo(z);
 expect(orbitCoordinates(result,center).radius).toBeCloseTo(3);
 expect(position.y).toBe(1.7);expect(result.y).toBeUndefined();
});
it('limits distance at the placement boundary while retaining the requested angle',()=>{
 const center={x:4,z:3},result=orbitPlacement({x:0,z:0},center,45,20);
 expect(result.x).toBeCloseTo(8);expect(result.z).toBeCloseTo(7);
 expect(orbitCoordinates(result,center).angle).toBeCloseTo(45);
});
it('derives new orbit values after exact placement or subject movement without moving equipment',()=>{
 const position={x:3,z:4};
 expect(orbitCoordinates(position,{x:0,z:0}).radius).toBe(5);
 expect(orbitCoordinates(position,{x:3,z:0})).toEqual({angle:0,radius:4});
 expect(position).toEqual({x:3,z:4});
});
it('preserves flag facing relative to the subject across the angle wrap',()=>{
 expect(orbitYaw(90,0,90)).toBe(-180);
 expect(orbitYaw(170,170,-170)).toBe(-170);
 expect(orbitYaw(-45,20,20)).toBe(-45);
});
it('handles zero distance and diagonal boundaries without invalid coordinates',()=>{
 expect(orbitPlacement({x:1,z:1},{x:1,z:1},90,0)).toEqual({x:1,z:1});
 for(const angle of [-180,-135,-90,0,45,90,180]){
 const p=orbitPlacement({x:0,z:0},{x:-4,z:4},angle,23);
 expect(Math.abs(p.x)).toBeLessThanOrEqual(8);expect(Math.abs(p.z)).toBeLessThanOrEqual(8);
 }
});
