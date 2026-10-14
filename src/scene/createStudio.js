import { Scene, Color, Fog, Mesh, Group, BoxGeometry, PlaneGeometry, CylinderGeometry, MeshStandardMaterial, MeshBasicMaterial, HemisphereLight, DirectionalLight, GridHelper, CanvasTexture, Sprite, SpriteMaterial } from 'three';
const mat = (color, roughness = 0.8) => new MeshStandardMaterial({ color, roughness });
function mesh(geometry, material, position, scene) {
  const object = new Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = true; object.receiveShadow = true; scene.add(object);
  return object;
}
export function createStudio() {
  const scene = new Scene();
  scene.background = new Color(0xdeddd5);
  scene.fog = new Fog(0xdeddd5, 22, 55);
  const floor = mesh(new PlaneGeometry(20, 28), mat(0xbdbfb5), [0, 0, -2], scene);
  floor.rotation.x = -Math.PI / 2;
  mesh(new BoxGeometry(19, 8, 0.3), mat(0xd9d9cf), [0, 4, -9], scene);
  mesh(new CylinderGeometry(0.66, 0.69, 0.6, 64), mat(0x888c80), [0, 0.3, 0], scene);
  mesh(new CylinderGeometry(0.64, 0.64, 0.045, 64), mat(0xbec0b3), [0, 0.6225, 0], scene);
  const frameMaterial = mat(0xa6ad9c);
  [-2.5, -4.5, -6.5].forEach((z, i) => {
    const width = 3.7 + i * 0.45, height = 3.8;
    for (const x of [-width / 2, width / 2]) mesh(new BoxGeometry(0.16, height, 0.18), frameMaterial, [x, height / 2, z], scene);
    mesh(new BoxGeometry(width + 0.16, 0.16, 0.18), frameMaterial, [0, height, z], scene);
  });
  mesh(new CylinderGeometry(0.38, 0.38, 1.2, 40), mat(0xb9ae99), [-2.4, 0.6, 1.4], scene);
  mesh(new BoxGeometry(0.72, 0.7, 0.72), mat(0x889b8b), [2.5, 0.35, 2], scene);
  mesh(new BoxGeometry(1.0, 1.8, 0.7), mat(0xc1b69f), [3.5, 0.9, -4], scene);
  const hemisphere = new HemisphereLight(0xfff9e9, 0x69756a, 2.25);
  scene.add(hemisphere);
  const key = new DirectionalLight(0xfff3df, 3.2);
  key.position.set(-4, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.normalBias = 0.035;
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 0.5, far: 30 });
  scene.add(key);
  const fill = new DirectionalLight(0xe9f1ff, 1.4);
  fill.position.set(5, 4, -4); scene.add(fill);

  const referenceGroup = new Group(); referenceGroup.layers.set(1); scene.add(referenceGroup);
  const grid = new GridHelper(20, 20, 0x878e80, 0xa7aea0);
  grid.position.y = 0.006; grid.layers.set(1); grid.material.transparent = true; grid.material.opacity = 0.34;
  referenceGroup.add(grid);
  for (let z = -8; z <= 12; z += 2) {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 48;
    const ctx = canvas.getContext('2d'); ctx.font = '24px monospace'; ctx.fillStyle = '#3e4b41'; ctx.textAlign = 'center';
    ctx.fillText(z === 0 ? 'SUBJECT' : Math.abs(z) + ' m', 64, 32);
    const label = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), depthWrite: false }));
    label.position.set(-0.95, 0.08, z); label.scale.set(0.65, 0.24, 1); label.layers.set(1); referenceGroup.add(label);
  }
  // Lighting is isolated here so a later Lighting Lab can reuse the scene.
  return { scene, referenceGroup, lights: { key, fill, hemisphere } };
}