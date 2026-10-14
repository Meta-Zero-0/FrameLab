import { it, expect } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { createCameraTravel } from '../camera/cameraTravel.js';
it('raises camera and target together while preserving tilt, distance and subsequent travel', () => {
 const camera = new PerspectiveCamera(); camera.position.set(0,1.2,5); camera.lookAt(0,.5,0);
 const travel = createCameraTravel(camera,[0,.5,0]);
 const direction = camera.getWorldDirection(new Vector3());
 travel.setHeight(1.8);
 expect(camera.position.y).toBeCloseTo(1.8);
 expect(travel.target.y).toBeCloseTo(1.1);
 expect(camera.position.distanceTo(travel.target)).toBeCloseTo(travel.initialDistance);
 expect(camera.getWorldDirection(new Vector3()).distanceTo(direction)).toBeLessThan(1e-10);
 travel.setDistance(3);
 expect(camera.position.distanceTo(travel.target)).toBeCloseTo(3);
 expect(travel.target.y).toBeCloseTo(1.1);
});

it('keeps camera within floor-to-10m limits during height and distance changes', () => {
 const camera = new PerspectiveCamera(); camera.position.set(0,1.2,5);
 const travel = createCameraTravel(camera,[0,.5,0]);
 travel.setHeight(-3); expect(camera.position.y).toBe(0);
 travel.setDistance(.5); expect(camera.position.y).toBe(0);
 travel.setHeight(15); expect(camera.position.y).toBe(10);
 travel.setDistance(40); expect(camera.position.y).toBe(10);
 expect(camera.position.distanceTo(travel.target)).toBeCloseTo(40);
});
