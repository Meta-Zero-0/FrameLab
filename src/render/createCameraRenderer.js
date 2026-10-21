import { WebGLRenderer, ACESFilmicToneMapping, SRGBColorSpace, PCFShadowMap, WebGLRenderTarget, HalfFloatType } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { visualDofSettings } from '../camera/visualDof.js';
import { exposureMultiplier } from '../camera/exposure.js';
export function createCameraRenderer(canvas, scene, camera) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  // Twice CSS resolution also improves edges on standard-density displays.
  renderer.setPixelRatio(2);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFShadowMap;
  // Canvas antialiasing does not cover the offscreen post-processing buffers.
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType, samples: Math.min(4, renderer.capabilities.maxSamples)
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 4.5, aperture: 0.0012, maxblur: 0.012 });
  // Keep translucent haze out of the opaque depth prepass.
  const renderDepth=bokeh.render.bind(bokeh);
  bokeh.render=function(...args) {
    const mask=camera.layers.mask; camera.layers.disable(2);
    try { return renderDepth(...args); } finally { camera.layers.mask=mask; }
  };
  composer.addPass(bokeh);
  // Smooth edges in the processed image; renderer antialias alone does not cover this pipeline.
  composer.addPass(new OutputPass());
  composer.addPass(new SMAAPass());
  function update(state) {
    renderer.toneMappingExposure = exposureMultiplier(state.iso, state.shutter, state.fNumber);
    bokeh.enabled = state.visualDof;
    for (const [name, value] of Object.entries(visualDofSettings(state.focalLength, state.fNumber, state.focusDistance))) {
      bokeh.uniforms[name].value = value;
    }
  }
  function resize(width, height) {
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height, false); composer.setSize(width, height);
    // The view supplies dimensions matching the selected sensor orientation.
  }
  return { renderer, composer, bokeh, update, resize };
}
