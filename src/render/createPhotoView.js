import { Color } from 'three';
import { createPhotoCamera, SENSOR } from '../camera/cameraModel.js';
import { createCameraRenderer } from './createCameraRenderer.js';

export function createPhotoView(canvas, layout, scene) {
  const camera = createPhotoCamera();
  camera.layers.enable(2);
  camera.position.set(...layout.position);
  camera.lookAt(...layout.target);
  const effects = createCameraRenderer(canvas, scene, camera);
  function resize(width) {
    if (width > 0) effects.resize(width, width / camera.aspect);
  }
  const darkBackground = new Color('#000000');
  function render() {
    // The overview's clear colour is a UI aid, not illumination in the photograph.
    const background = scene.background;
    scene.background = darkBackground;
    try { effects.composer.render(); } finally { scene.background = background; }
  }
  return { ...effects, camera, resize, render };
}