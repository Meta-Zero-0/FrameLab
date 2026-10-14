import { it, expect } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { createCameraTravel } from '../camera/cameraTravel.js';

function setup() {
  const camera = new PerspectiveCamera();
  camera.position.set(0, 1.2, 5);
  camera.lookAt(0, .5, 0);
  return { camera, travel: createCameraTravel(camera, [0, .5, 0]) };
}

it.each([-85, -30, 0, 30, 85])('tilts to %s degrees in place, preserving distance', degrees => {
  const { camera, travel } = setup();
  const position = camera.position.clone();
  travel.setTilt(degrees);
  expect(camera.position.equals(position)).toBe(true);
  expect(camera.position.distanceTo(travel.target)).toBeCloseTo(travel.initialDistance, 10);
  expect(camera.getWorldDirection(new Vector3()).y).toBeCloseTo(Math.sin(degrees * Math.PI / 180), 10);
  expect(travel.getTilt()).toBeCloseTo(degrees, 10);
});

it('keeps tilt when raising the camera and moving along its viewing axis', () => {
  const { camera, travel } = setup();
  travel.setTilt(-20);
  travel.setHeight(3);
  const target = travel.target.clone();
  travel.setDistance(6);
  expect(travel.target.distanceTo(target)).toBeLessThan(1e-10);
  expect(camera.position.distanceTo(target)).toBeCloseTo(6, 10);
  expect(camera.getWorldDirection(new Vector3()).y).toBeCloseTo(-Math.sin(Math.PI / 9), 10);
});

it('restores a saved tilted pose and the starting pose without drift', () => {
  const { camera, travel } = setup();
  travel.setTilt(25);
  travel.setHeight(2);
  const saved = JSON.parse(JSON.stringify({ tilt: travel.getTilt(), target: travel.target.toArray(), distance: camera.position.distanceTo(travel.target) }));
  const position = camera.position.clone();
  travel.setTilt(-50); travel.setHeight(4);
  travel.setTilt(saved.tilt); travel.target.fromArray(saved.target); travel.setDistance(saved.distance);
  expect(camera.position.distanceTo(position)).toBeLessThan(1e-10);
  travel.setTilt(travel.initialTilt); travel.target.set(0, .5, 0); travel.setDistance(travel.initialDistance);
  expect(camera.position.distanceTo(new Vector3(0, 1.2, 5))).toBeLessThan(1e-10);
});
