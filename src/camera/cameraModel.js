import { PerspectiveCamera } from 'three';
export const SENSOR = Object.freeze({ width: 36, height: 24, aspect: 1.5, circleOfConfusion: 0.03 });
export function fovDegrees(focalLength, sensorDimension) {
  return 2 * Math.atan(sensorDimension / (2 * focalLength)) * 180 / Math.PI;
}
export function createPhotoCamera() {
  const camera = new PerspectiveCamera(27, SENSOR.aspect, 0.05, 100);
  camera.filmGauge = SENSOR.width;
  camera.setFocalLength(50);
  camera.updateProjectionMatrix();
  return camera;
}
export function applyLens(camera, focalLength) {
  camera.aspect = camera.userData.orientation === 'portrait' ? 1 / SENSOR.aspect : SENSOR.aspect;
  camera.filmGauge = SENSOR.width;
  camera.setFocalLength(focalLength);
  camera.updateProjectionMatrix();
}