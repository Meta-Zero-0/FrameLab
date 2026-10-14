import { WebGLRenderer, PerspectiveCamera, ACESFilmicToneMapping, SRGBColorSpace, PCFShadowMap } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export function createOverviewRenderer(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFShadowMap;
  const camera = new PerspectiveCamera(43, 1, 0.1, 100);
  camera.position.set(8.8, 6.7, 11); camera.layers.enable(1);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.05, -1.6); controls.enableDamping = true;
  controls.minDistance = 4; controls.maxDistance = 30; controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.update();
  function resize(width, height) {
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  return { renderer, camera, controls, resize };
}