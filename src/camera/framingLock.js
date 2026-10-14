import { Box3, Vector3 } from 'three';
import { frameOccupancy, distanceForFraming } from './framing.js';

export function createFramingLock(subject, camera, target) {
  let points = [], occupancy = null;
  function measure() {
    const { min, max } = typeof subject === 'function' ? subject() : new Box3().setFromObject(subject);
    const inverse = camera.quaternion.clone().invert();
    points = [];
    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) points.push(new Vector3(x, y, z).sub(target).applyQuaternion(inverse));
  }
  const sensor = () => ({width:camera.getFilmWidth(),height:camera.getFilmHeight()});
  function capture(focalLength, distance) { measure(); occupancy = frameOccupancy(points, focalLength, distance, sensor()).size; }
  function solve(focalLength, limits) { return distanceForFraming(points, focalLength, occupancy, limits, sensor()); }
  function fit(focalLength, limits) { measure(); occupancy = .78; return solve(focalLength, limits); }
  return { capture, solve, fit, snapshot: () => ({points:points.map(p=>p.toArray()),occupancy}), restore(state) { points=state.points.map(p=>new Vector3(...p)); occupancy=state.occupancy; } };
}
