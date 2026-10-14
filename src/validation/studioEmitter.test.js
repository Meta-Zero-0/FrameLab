import { it, expect } from 'vitest';
import { Scene, DirectionalLight } from 'three';
import { createStudioEmitter, emitterSamples } from '../scene/createStudioEmitter.js';
it('preserves total output as size changes and switches light models cleanly',()=>{
 const scene=new Scene(), source=new DirectionalLight(); source.position.set(0,2,5);
 const emitter=createStudioEmitter(scene);
 const state={mode:'studio',enabled:true,values:{'light-intensity':3,'light-size':.5,'light-beam':90}};
 emitter.update(source,state);
 expect(source.intensity).toBe(0);
 expect(emitter.samples.reduce((sum,l)=>sum+l.intensity,0)).toBe(75);
 expect(emitter.samples.every(l=>l.decay===2 && l.distance===0 && l.visible)).toBe(true);
 state.values['light-size']=2; emitter.update(source,state);
 expect(emitter.samples.reduce((sum,l)=>sum+l.intensity,0)).toBe(75);
 expect(emitterSamples(2)[1]).toEqual([-1,-.5]);
 state.mode='directional'; emitter.update(source,state);
 expect(emitter.samples.every(l=>!l.visible)).toBe(true); expect(source.intensity).toBe(3); expect(source.castShadow).toBe(true);
 state.mode='studio';state.enabled=false;emitter.update(source,state); expect(emitter.samples.every(l=>!l.visible)).toBe(true);
});

it('reserves texture capacity for textured GLBs with all three lights enabled', () => {
 const scene = new Scene();
 const state = {mode:'studio', enabled:true, values:{'light-intensity':1,'light-size':1,'light-beam':90}};
 const emitters = Array.from({length:3}, () => {
  const source = new DirectionalLight(); source.position.set(0,2,5);
  const emitter = createStudioEmitter(scene); emitter.update(source,state); return emitter;
 });
 const shadowCount = emitters.flatMap(e => e.samples).filter(l => l.visible && l.castShadow).length;
 // WebGL2 guarantees 16 fragment texture units; reserve seven for material maps.
 expect(shadowCount).toBeLessThanOrEqual(9);
 const offsets = emitterSamples(1);
 expect(offsets.reduce((sum,p) => sum+p[0],0)).toBe(0);
 expect(offsets.reduce((sum,p) => sum+p[1],0)).toBe(0);
});