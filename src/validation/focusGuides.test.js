import { it, expect } from 'vitest';
import { Scene, PerspectiveCamera, Vector3 } from 'three';
import { createFocusGuides } from '../scene/createFocusGuides.js';
it('positions guides at optical depths and excludes them from the photo camera', () => {
  const scene = new Scene(), camera = new PerspectiveCamera(40, 1.5);
  camera.position.set(2, 3, 5); camera.lookAt(0, 1, 0);
  const guides = createFocusGuides(scene, camera), forward = camera.getWorldDirection(new Vector3());
  guides.update({near: 3, far: 7}, 5, true, true);
  scene.children.forEach((guide, i) => {
    expect(guide.position.clone().sub(camera.position).dot(forward)).toBeCloseTo([5,3,7][i]);
    guide.traverse(object => expect(object.layers.test(camera.layers)).toBe(false));
  });
  expect(guides.update({near:3,far:Infinity},5,true,true)).toContain('infinity');
  expect(scene.children[2].visible).toBe(false);
  guides.update({near:3,far:70},5,true,true); expect(scene.children[2].visible).toBe(false);
  guides.update({near:3,far:7},5,false,false); expect(scene.children.every(child => !child.visible)).toBe(true);
});
