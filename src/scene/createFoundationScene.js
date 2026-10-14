import { createMeasuredGrid } from './createMeasuredGrid.js';
import {
  Scene, Color, Group, Mesh, PlaneGeometry, BoxGeometry, MeshStandardMaterial,
  HemisphereLight, DirectionalLight, MathUtils,
} from 'three';

// Translate the plain layout data into Three.js objects.
export function createFoundationScene(layout) {
  const scene = new Scene();
  scene.background = new Color(layout.background);

  const floor = new Mesh(
    new PlaneGeometry(...layout.floor.size),
    new MeshStandardMaterial({ color: layout.floor.color, roughness: 0.95 }),
  );
  floor.name = 'Floor';
  floor.rotation.x = -Math.PI / 2; // A plane starts upright; lay it flat.
  floor.receiveShadow = true;
  scene.add(floor);

  const cube = new Mesh(
    new BoxGeometry(...layout.subject.size),
    new MeshStandardMaterial({ color: layout.subject.color, roughness: 0.65 }),
  );
  const subject = new Group(); subject.add(cube); cube.position.y = 0.5;
  subject.name = layout.subject.name;
  subject.position.set(0, 0, 0);
  subject.rotation.set(...layout.subject.rotationDegrees.map(MathUtils.degToRad));
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(subject);

  const props = [];
  for (const item of layout.backgroundObjects ?? []) {
    const prop = new Mesh(new BoxGeometry(...item.size), new MeshStandardMaterial({ color: item.color, roughness: 0.85 }));
    prop.name = item.name;
    prop.userData.showLabel = item.showLabel !== false;
    prop.position.set(...item.position);
    prop.castShadow = true;
    prop.receiveShadow = true;
    scene.add(prop);
    props.push(prop);
  }

  const grid = createMeasuredGrid();
  scene.add(grid);

  const ambient = new HemisphereLight('#fff7e9', '#637564', layout.lighting.ambientIntensity);
  const key = new DirectionalLight('#fff3dc', layout.lighting.keyIntensity);
  key.position.set(...layout.lighting.keyPosition);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 1.5;
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.1, far: 25 });
  scene.add(ambient, key);

  return { scene, subject, props, grid, floor, key, ambient };
}



