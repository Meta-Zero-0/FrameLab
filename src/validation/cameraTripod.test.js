import { it, expect } from 'vitest';
import { Scene, PerspectiveCamera, Vector3 } from 'three';
import { createCameraTripod } from '../scene/createCameraTripod.js';

it('follows camera travel and height without changing the camera, with grounded feet', () => {
  const scene = new Scene(), camera = new PerspectiveCamera();
  camera.position.set(0,1.2,5); camera.lookAt(0,.5,0);
  const equipment = createCameraTripod(scene,camera);
  for(const height of [.5,1.2,2,6,10]) {
    camera.position.set(2,height,8); camera.lookAt(0,1,0);
    const position = camera.position.clone(), rotation = camera.quaternion.clone();
    const report = equipment.update();
    expect(equipment.body.position.distanceTo(position)).toBeLessThan(1e-10);
    expect(camera.position.equals(position)).toBe(true);
    expect(camera.quaternion.equals(rotation)).toBe(true);
    expect(camera.parent).toBe(null);
    for(const foot of equipment.rig.children.slice(-3)) expect(foot.position.y).toBe(.025);
    const head = equipment.rig.children[1];
    expect(head.position.distanceTo(report.mount)).toBeLessThan(1e-10);
    expect(report.supported).toBe(height <= 2.1);
  }
});

it('rotates the body for portrait and keeps the support attached under the plate', () => {
  const camera = new PerspectiveCamera(); camera.position.set(0,1.5,5); camera.lookAt(0,0,0);
  const equipment = createCameraTripod(new Scene(),camera);
  const landscape = equipment.body.quaternion.clone();
  camera.userData.orientation = 'portrait';
  const report = equipment.update();
  expect(equipment.body.quaternion.angleTo(landscape)).toBeCloseTo(Math.PI/2);
  const mount = new Vector3(0,-.19,0).applyQuaternion(equipment.body.quaternion).add(camera.position);
  expect(report.mount.distanceTo(mount)).toBeLessThan(1e-10);
  equipment.rig.traverse(object => {
    if(object.isMesh) {
      expect(object.layers.test(camera.layers)).toBe(false);
      expect(object.castShadow).toBe(false);
    }
  });
});

it('warns at floor level without drawing inverted legs and updates footprint bounds', () => {
  const camera = new PerspectiveCamera(); camera.position.set(0,0,5);
  const equipment = createCameraTripod(new Scene(),camera);
  expect(equipment.report().supported).toBe(false);
  expect(equipment.rig.children.slice(1).every(mesh => !mesh.visible)).toBe(true);
  camera.position.set(4,1.2,8);
  const report = equipment.update();
  expect(report.supported).toBe(true);
  expect(report.bounds.min.x).toBeLessThan(4);
  expect(report.bounds.max.x).toBeGreaterThan(4);
  expect(report.bounds.min.z).toBeGreaterThan(7);
});
