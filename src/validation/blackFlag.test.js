import {it,expect} from 'vitest';
import {Scene,Vector3,DoubleSide} from 'three';
import {createBlackFlag} from '../scene/createBlackFlag.js';
import {defaultFlag,validateFlag} from '../scene/flagState.js';
import {buildTree,occluded} from '../experiments/triangleVisibility.js';

function tree(scene){
 scene.updateMatrixWorld(true);const triangles=[];
 scene.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,idx=o.geometry.index;
 for(let i=0;i<(idx?idx.count:p.count);i+=3){const t=[];for(let k=0;k<3;k++)t.push(...new Vector3().fromBufferAttribute(p,idx?idx.getX(i+k):i+k).applyMatrix4(o.matrixWorld).toArray());triangles.push(t);}});
 return buildTree(triangles);
}
it('blocks light paths from both sides and clears them when moved or disabled',()=>{
 const scene=new Scene(),flag=createBlackFlag(scene);
 const state={...defaultFlag,enabled:true,x:0,y:1.2,z:0,yaw:0};flag.apply(state);
 const a=[0,1.2,-2],b=[0,1.2,2];
 expect(occluded(tree(scene),a,b)).toBe(true);expect(occluded(tree(scene),b,a)).toBe(true);
 expect(flag.panel.castShadow).toBe(true);expect(flag.panel.material.shadowSide).toBe(DoubleSide);
 flag.apply({...state,x:3});expect(occluded(tree(scene),a,b)).toBe(false);
 flag.apply({...state,enabled:false});expect(occluded(tree(scene),a,b)).toBe(false);expect(flag.support.group.visible).toBe(false);
});
it('keeps the panel above the floor while its stand follows tilt and placement',()=>{
 const flag=createBlackFlag(new Scene());
 for(const pitch of [-80,0,65]){
 flag.apply({...defaultFlag,enabled:true,x:2,y:.2,width:2,height:3,yaw:35,pitch});
 const lower=new Vector3(0,-.5,0).applyMatrix4(flag.panel.matrixWorld);
 expect(lower.y).toBeGreaterThanOrEqual(.119999);
 const mount=flag.support.group.children[5].position;
 expect(mount.distanceTo(lower)).toBeCloseTo(.035);
 }
 flag.reset();expect(flag.snapshot()).toEqual(defaultFlag);expect(flag.support.group.visible).toBe(false);
});
it('validates flag dimensions and supports old projects',()=>{
 expect(validateFlag()).toEqual(defaultFlag);
 for(const change of [{width:0},{height:4},{pitch:90},{x:Infinity},{enabled:'yes'}])expect(()=>validateFlag({...defaultFlag,...change})).toThrow(/flag/);
});
