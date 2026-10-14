import {it,expect} from 'vitest';
import {Scene,Mesh,PlaneGeometry,MeshStandardMaterial,Vector3} from 'three';
import {createReflectorSupport,orbitReflector} from '../scene/reflectorSupport.js';
import {defaultReflector,validateReflector} from '../scene/reflectorState.js';
it('orbits the actual subject centre, preserves radius and turns board aim',()=>{
 const values={...defaultReflector,x:3,z:1,yaw:-90};
 const moved=orbitReflector(values,{x:1,z:1},0,2);
 expect(moved.x).toBeCloseTo(1);expect(moved.z).toBeCloseTo(3);expect(moved.yaw).toBe(-180);
 expect(Math.hypot(moved.x-1,moved.z-1)).toBeCloseTo(2);
 expect(validateReflector({...values,...moved}).y).toBe(values.y);
 const limited=orbitReflector(values,{x:4,z:0},90,3);expect(limited.x).toBeCloseTo(5);
});
it('connects the telescopic stand to a tilted board and keeps three feet grounded',()=>{
 const scene=new Scene(),board=new Mesh(new PlaneGeometry(1,1),new MeshStandardMaterial());scene.add(board);
 const support=createReflectorSupport(scene);
 for(const y of [.65,2,4]){
  board.position.set(1,y,1);board.rotation.set(-55*Math.PI/180,-135*Math.PI/180,0,'YXZ');support.update(board);
  const mount=new Vector3(0,-.5,-.035).applyMatrix4(board.matrixWorld);
  expect(support.group.children[5].position.distanceTo(mount)).toBeLessThan(1e-8);
  const mast=support.group.children[1];
  const top=new Vector3(0,.5,0).multiply(mast.scale).applyQuaternion(mast.quaternion).add(mast.position);
  expect(top.distanceTo(mount)).toBeLessThan(1e-8);
  for(const leg of support.group.children.slice(2,5)){
   const foot=new Vector3(0,.5,0).multiply(leg.scale).applyQuaternion(leg.quaternion).add(leg.position);
   expect(foot.y).toBeCloseTo(.025);
  }
 }
 board.visible=false;support.update(board);expect(support.group.visible).toBe(false);
});
