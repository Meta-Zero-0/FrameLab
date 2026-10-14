import {it,expect} from 'vitest';
import {Scene,DirectionalLight,PerspectiveCamera,Vector3} from 'three';
import {lightModifiers,modifierDimensions} from '../scene/lightModifiers.js';
import {createStudioEmitter,emitterSamples} from '../scene/createStudioEmitter.js';
import {createLightEquipment} from '../scene/createLightEquipment.js';

it.each(Object.keys(lightModifiers))('%s keeps samples within its face and preserves output and shadow budget',modifier=>{
 const scene=new Scene(),source=new DirectionalLight();source.position.set(0,2,4);source.target.position.set(0,2,0);
 const state={enabled:true,mode:'studio',source:'soft',modifier,values:{'light-size':1.2,'light-beam':lightModifiers[modifier].beam,'light-intensity':3}};
 const emitter=createStudioEmitter(scene);emitter.update(source,state);
 const {width,height}=modifierDimensions(1.2,modifier),offsets=emitterSamples(1.2,modifier);
 expect(offsets.reduce((sum,p)=>sum+p[0],0)).toBeCloseTo(0);expect(offsets.reduce((sum,p)=>sum+p[1],0)).toBeCloseTo(0);
 for(const [x,y] of offsets){expect(Math.abs(x)).toBeLessThanOrEqual(width/2);expect(Math.abs(y)).toBeLessThanOrEqual(height/2);}
 expect(emitter.samples.filter(l=>l.visible&&l.castShadow)).toHaveLength(3);
 expect(emitter.samples.reduce((sum,l)=>sum+l.intensity,0)).toBe(75);
 const camera=new PerspectiveCamera();camera.position.set(0,1.2,5);camera.lookAt(0,.5,0);
 const equipment=createLightEquipment(scene,camera);equipment.update({key:source},{key:state});
 const head=scene.getObjectByName('key physical equipment').children[1],face=head.children[0];
 expect(face.scale.x).toBeCloseTo(width);expect(face.scale.y).toBeCloseTo(height);
 expect(face.geometry.type).toBe(modifier==='octa'?'CylinderGeometry':'BoxGeometry');
 // Samples emit just ahead of the diffuser, so the housing cannot block their forward rays.
 for(const light of emitter.samples)expect(head.worldToLocal(light.position.clone()).z).toBeLessThan(face.position.z-face.scale.z/2);
 const position=source.position.clone();state.source='hard';equipment.update({key:source},{key:state});emitter.update(source,state);
 expect(source.position.distanceTo(position)).toBe(0);expect(emitter.samples.filter(l=>l.visible)).toHaveLength(1);
 expect(face.geometry.type).toBe('BoxGeometry');expect(face.scale.x).toBe(.18);
});

it('strip sources narrow horizontal spread while retaining vertical softness',()=>{
 const square=emitterSamples(1.2,'square'),strip=emitterSamples(1.2,'strip');
 for(let i=0;i<3;i++){expect(strip[i][0]).toBeCloseTo(square[i][0]/4);expect(strip[i][1]).toBe(square[i][1]);}
});

it.each([0,45,90,-90,180])('keeps softbox and samples aligned at %s degrees with an oblique aim',modifierRotation=>{
 const scene=new Scene(),source=new DirectionalLight();source.position.set(-3,2,4);source.target.position.set(0,.5,0);
 const state={enabled:true,mode:'studio',source:'soft',modifier:'strip',modifierRotation,values:{'light-size':1.2,'light-beam':70,'light-intensity':3}};
 const camera=new PerspectiveCamera();camera.position.set(0,1.2,5);camera.lookAt(0,.5,0);
 const equipment=createLightEquipment(scene,camera),emitter=createStudioEmitter(scene);
 equipment.update({key:source},{key:state});emitter.update(source,state);
 const head=scene.getObjectByName('key physical equipment').children[1];
 const direction=source.target.position.clone().sub(source.position).normalize();
 expect(new Vector3(0,0,-1).applyQuaternion(head.quaternion).distanceTo(direction)).toBeLessThan(1e-10);
 const offsets=emitterSamples(1.2,'strip');
 emitter.samples.forEach((light,i)=>{
   const local=head.worldToLocal(light.position.clone());
   expect(local.distanceTo(new Vector3(...offsets[i],0))).toBeLessThan(1e-10);
   expect(light.target.position.clone().sub(light.position).normalize().distanceTo(direction)).toBeLessThan(1e-10);
 });
 expect(emitter.samples.filter(l=>l.visible&&l.castShadow)).toHaveLength(3);
 expect(emitter.samples.reduce((sum,l)=>sum+l.intensity,0)).toBe(75);
 expect(head.position.distanceTo(source.position)).toBe(0);
});

it('a quarter turn swaps the strip light spread axes and returning to zero restores them',()=>{
 const source=new DirectionalLight();source.position.set(0,2,4);source.target.position.set(0,2,0);
 const emitter=createStudioEmitter(new Scene()),state={enabled:true,mode:'studio',source:'soft',modifier:'strip',modifierRotation:0,values:{'light-size':1.2,'light-beam':70,'light-intensity':3}};
 emitter.update(source,state);const starting=emitter.samples.map(l=>l.position.clone());
 state.modifierRotation=90;emitter.update(source,state);
 emitter.samples.forEach((l,i)=>{
   const before=starting[i].clone().sub(source.position),after=l.position.clone().sub(source.position);
   expect(after.x).toBeCloseTo(before.y);expect(after.y).toBeCloseTo(-before.x);
 });
 state.modifierRotation=0;emitter.update(source,state);
 emitter.samples.forEach((l,i)=>expect(l.position.distanceTo(starting[i])).toBeLessThan(1e-10));
});
