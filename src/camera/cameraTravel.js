import { Vector3 } from 'three';

// Travel follows the current viewing direction; tilt pivots at the camera.
export function createCameraTravel(camera, targetPosition) {
  const target = new Vector3(...targetPosition);
  const direction = camera.position.clone().sub(target).normalize();
  const initialDistance = camera.position.distanceTo(target);
  const heading = Math.atan2(direction.x, direction.z);
  const getTilt = () => -Math.asin(direction.y) * 180 / Math.PI;
  const initialTilt = getTilt();
  function setTilt(degrees) {
    if (!Number.isFinite(degrees)) return;
    const radians = Math.max(-85, Math.min(85, degrees)) * Math.PI / 180;
    const distance = camera.position.distanceTo(target);
    direction.set(Math.sin(heading) * Math.cos(radians), -Math.sin(radians), Math.cos(heading) * Math.cos(radians));
    target.copy(camera.position).addScaledVector(direction, -distance);
    camera.lookAt(target); camera.updateMatrixWorld(true);
  }
  function setDistance(metres) {
    camera.position.copy(target).addScaledVector(direction, metres);
    setHeight(camera.position.y);
  }
  function setHeight(metres) {
    // Raise camera and aim together without changing tilt or distance.
    const delta = Math.max(0, Math.min(10, metres)) - camera.position.y;
    camera.position.y += delta; target.y += delta;
    camera.lookAt(target); camera.updateMatrixWorld(true);
  }
  return { target, initialDistance, initialTilt, getTilt, setTilt, setDistance, setHeight };
}
