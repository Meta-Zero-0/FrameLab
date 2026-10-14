import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { createPhotoCamera, applyLens, fovDegrees } from '../camera/cameraModel.js';
import { calculateDof } from '../camera/dofMath.js';
import { frameOccupancy, distanceForFraming } from '../camera/framing.js';
import { visualDofSettings } from '../camera/visualDof.js';
describe('Full-frame optics', () => {
  it.each([[24, 73.7, 53.1], [50, 39.6, 27], [85, 23.9, 16.1], [135, 15.2, 10.2]])(
    '%s mm agrees with the independent sensor geometry', (focal, horizontal, vertical) => {
      const camera = createPhotoCamera(); applyLens(camera, focal);
      expect(fovDegrees(focal, 36)).toBeCloseTo(horizontal, 0);
      expect(camera.fov).toBeCloseTo(vertical, 0);
      expect(camera.getFilmHeight()).toBe(24);
    });
  it('projects the centre along the optical axis', () => {
    const camera = createPhotoCamera(); camera.position.set(0, 1, 4.5); camera.lookAt(0, 1, 0); camera.updateMatrixWorld();
    const projected = new Vector3(0, 1, 0).project(camera);
    expect(projected.x).toBeCloseTo(0); expect(projected.y).toBeCloseTo(0);
  });
});
describe('Physical depth of field', () => {
  it('passes the 50 mm / f2.8 / 2 m reference', () => {
    const result = calculateDof(50, 2.8, 2);
    expect(result.near).toBeCloseTo(1.877, 3);
    expect(result.far).toBeCloseTo(2.140, 3);
    expect(result.total).toBeCloseTo(0.263, 3);
    expect(result.hyperfocal).toBeCloseTo(29.812, 3);
  });
  it('gets deeper as the aperture closes', () => {
    expect(calculateDof(50, 8, 2).total).toBeGreaterThan(calculateDof(50, 2, 2).total);
  });
  it('handles infinity and invalid close focus', () => {
    const H = calculateDof(24, 8, 3).hyperfocal;
    expect(calculateDof(24, 8, H + 0.024).far).toBe(Infinity);
    expect(() => calculateDof(50, 2.8, 0.04)).toThrow(RangeError);
  });
});
describe('Maintain framing with subject depth', () => {
  const points = [-0.4, 0.4].flatMap(x => [-0.65, 0.65].flatMap(y => [-0.25, 0.25].map(z => ({ x, y, z }))));
  const occupancy = frameOccupancy(points, 50, 4.5).size;
  it.each([18, 24, 35, 85, 135, 200])('preserves occupancy at %s mm', focal => {
    const fit = distanceForFraming(points, focal, occupancy);
    expect(fit.limited).toBe(false);
    expect(frameOccupancy(points, focal, fit.distance).size / occupancy).toBeCloseTo(1, 6);
  });
  it('retreats at a longer lens and reports travel limits', () => {
    expect(distanceForFraming(points, 85, occupancy).distance).toBeGreaterThan(4.5);
    expect(distanceForFraming(points, 200, occupancy, { min: 0.5, max: 2 }).limited).toBe(true);
  });
});
it('visual blur weakens without changing physical calculations', () => {
  expect(visualDofSettings(50, 2, 2).aperture).toBeGreaterThan(visualDofSettings(50, 8, 2).aperture);
  expect(visualDofSettings(50, 1.4, 2).maxblur).toBeLessThanOrEqual(0.012);
});