import {it,expect} from 'vitest';
import {Box3,Vector3,Scene,DirectionalLight} from 'three';
import {lightingPresets,buildLightingPreset} from '../scene/lightingPresets.js';
import {createStudioEmitter} from '../scene/createStudioEmitter.js';
it('applies all eight presets independently with bounded positions and correct active lamps',()=>{
 const bounds=new Box3(new Vector3(-.5,0,-.5),new Vector3(.5,2,.5));
 const counts={three:3,two:2,loop:1,rembrandt:1,split:1,rim:1,top:1,back:1};
 expect(Object.keys(lightingPresets)).toHaveLength(8);
 for(const id of Object.keys(lightingPresets)) {
  const {states}=buildLightingPreset(id,bounds,{});
  expect(Object.values(states).filter(s=>s.enabled)).toHaveLength(counts[id]);
  for(const state of Object.values(states)) {
   expect(state.mode).toBe('studio'); expect(state.follow).toBe(false);
   expect(state.values['light-y']).toBeGreaterThanOrEqual(.2);
   expect(state.values['light-y']).toBeLessThanOrEqual(10);
  }
 }
 const a=buildLightingPreset('split',bounds,{});a.states.key.values['light-intensity']=99;
 expect(buildLightingPreset('split',bounds,{}).states.key.values['light-intensity']).toBe(2);
 expect(buildLightingPreset('three',bounds,{}).states.key.values['light-aim-y']).toBe(1.8);
});
it('hard source uses one centred sample with the same total output and restores soft size',()=>{
 const scene=new Scene(),source=new DirectionalLight();source.position.set(0,2,3);
 const emitter=createStudioEmitter(scene);
 const state={mode:'studio',source:'hard',enabled:true,values:{'light-intensity':3,'light-size':1,'light-beam':90}};
 emitter.update(source,state);
 expect(emitter.samples.filter(l=>l.visible)).toHaveLength(1);
 expect(emitter.samples[0].position.equals(source.position)).toBe(true);
 expect(emitter.samples[0].intensity).toBe(75);
 state.source='soft';emitter.update(source,state);
 expect(emitter.samples.filter(l=>l.visible)).toHaveLength(3);
 expect(emitter.samples.reduce((sum,l)=>sum+l.intensity,0)).toBe(75);
 expect(emitter.samples[0].position.distanceTo(source.position)).toBeGreaterThan(0);
});
