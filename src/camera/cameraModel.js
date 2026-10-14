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
  const ratios = { '3:2': 1.5, '4:3': 4/3, '16:9': 16/9, '1:1': 1 };
  const ratio = ratios[camera.userData.aspectRatio] || SENSOR.aspect;
  const width = Math.min(SENSOR.width, SENSOR.height * ratio);
  const height = width / ratio;
  camera.aspect = camera.userData.orientation === 'portrait' ? 1 / ratio : ratio;
  // Three uses the longer film dimension; cropping must not enlarge the sensor.
  camera.filmGauge = Math.max(width, height);
  camera.setFocalLength(focalLength);
  camera.updateProjectionMatrix();
}
