import { it, expect } from 'vitest';
import { Mesh, BoxGeometry, Vector3 } from 'three';
import { createPhotoCamera, applyLens } from '../camera/cameraModel.js';
import { createFramingLock } from '../camera/framingLock.js';
import { createCameraTravel } from '../camera/cameraTravel.js';
import { sceneLayout } from '../scene/sceneLayout.js';

it('preserves default framing through 200mm using actual camera projection', () => {
  const subject = new Mesh(new BoxGeometry(...sceneLayout.subject.size));
  subject.position.set(...sceneLayout.subject.position);
  const camera = createPhotoCamera();
  camera.position.set(...sceneLayout.photoView.position);
  camera.lookAt(...sceneLayout.photoView.target);
  const travel = createCameraTravel(camera, sceneLayout.photoView.target);
  const lock = createFramingLock(subject, camera, travel.target);
  const initial = Math.round(travel.initialDistance * 100) / 100;
  travel.setDistance(initial);
  function projectedSize() {
    subject.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const corners = [];
    for (const x of [-0.5,0.5]) for (const y of [-0.5,0.5]) for (const z of [-0.5,0.5]) {
      corners.push(new Vector3(x,y,z).applyMatrix4(subject.matrixWorld).project(camera));
    }
    return Math.max(...['x','y'].map(axis => (Math.max(...corners.map(p => p[axis])) - Math.min(...corners.map(p => p[axis]))) / 2));
  }
  const captured = projectedSize();
  lock.capture(50, initial);
  for (const mm of [18,24,85,100,135,200]) {
    applyLens(camera, mm);
    const result = lock.solve(mm, { min: 1.5, max: 40 });
    expect(result.limited).toBe(false);
    travel.setDistance(Math.round(result.distance * 100) / 100);
    expect(Math.abs(projectedSize() / captured - 1)).toBeLessThan(0.03);
  }
});