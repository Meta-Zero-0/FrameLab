import { SpotLight, Vector3 } from 'three';
import { modifierDimensions, modifierOrientation } from './lightModifiers.js';

// Three centred samples approximate an emitter while reserving texture units for GLB materials.
export function emitterSamples(size, shape = 'square') {
  const { width, height } = modifierDimensions(size, shape);
  const inset = shape === 'octa' ? .8 : 1;
  return [[0,.5],[-.5,-.25],[.5,-.25]].map(([x,y]) => [x*width*inset,y*height*inset]);
}
export function createStudioEmitter(scene) {
  const samples = emitterSamples(1).map(() => {
    const light = new SpotLight('#ffffff', 0, 0, Math.PI / 4, .25, 2);
    light.castShadow = true; light.visible = false;
    // Higher edge resolution without adding lights, shadow passes or samplers.
    light.shadow.mapSize.set(1024,1024); light.shadow.normalBias = .015;
    // Slightly wider PCF smoothing; retains the shader's fixed five samples.
    light.shadow.radius = 1.5;
    light.shadow.camera.near = .05; light.shadow.camera.far = 60;
    scene.add(light,light.target); return light;
  });
  function update(source, state) {
    const studio = state.mode === 'studio';
    source.castShadow = !studio;
    source.intensity = studio ? 0 : state.values['light-intensity'];
    const direction = source.target.position.clone().sub(source.position).normalize();
    const rotation = modifierOrientation(direction, state.source === 'hard' ? 0 : state.modifierRotation ?? 0);
    const hard = state.source === 'hard';
    const offsets = hard ? [[0,0]] : emitterSamples(state.values['light-size'], state.modifier);
    samples.forEach((light,index) => {
      light.visible = studio && state.enabled && index < offsets.length;
      if (!light.visible) return;
      const offset = new Vector3(...offsets[index],0).applyQuaternion(rotation);
      light.position.copy(source.position).add(offset);
      light.target.position.copy(source.target.position).add(offset); light.target.updateMatrixWorld();
      light.color.copy(source.color);
      // Fixed output scale: strength 1 is 25 cd total, regardless of emitter size or distance.
      light.intensity = state.values['light-intensity'] * 25 / offsets.length;
      light.angle = state.values['light-beam'] * Math.PI / 360;
      light.decay = 2; light.distance = 0;
    });
  }
  return {update, samples};
}
