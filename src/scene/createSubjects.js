import { Group, Mesh, MeshStandardMaterial, SphereGeometry, CylinderGeometry, BoxGeometry, TorusGeometry, Box3, Vector3 } from 'three';
function part(group, geometry, material, position, scale) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
export function createSubjects(scene) {
  const clay = new MeshStandardMaterial({ color: 0xd2c3ae, roughness: 0.61 });
  const sage = new MeshStandardMaterial({ color: 0x6c8172, roughness: 0.38 });
  const metal = new MeshStandardMaterial({ color: 0xb9b7ad, metalness: 0.7, roughness: 0.28 });
  const pale = new MeshStandardMaterial({ color: 0xd7d9cd, roughness: 0.67 });
  const portrait = new Group();
  // A deliberate sculptural portrait proxy: head, nose, neck and shoulders.
  part(portrait, new SphereGeometry(0.3, 40, 28), clay, [0, 1.76, 0], [0.83, 1.16, 0.91]);
  part(portrait, new SphereGeometry(0.08, 20, 16), clay, [0, 1.72, 0.265], [0.45, 0.8, 0.85]);
  part(portrait, new CylinderGeometry(0.12, 0.15, 0.26, 28), clay, [0, 1.36, 0]);
  part(portrait, new SphereGeometry(0.5, 36, 24), clay, [0, 1.04, 0], [1.12, 0.69, 0.54]);
  part(portrait, new CylinderGeometry(0.34, 0.32, 0.16, 36), clay, [0, 0.7, 0]);

  const product = new Group();
  part(product, new CylinderGeometry(0.2, 0.23, 0.68, 48), sage, [0, 1.04, 0]);
  part(product, new SphereGeometry(0.21, 32, 20), sage, [0, 1.37, 0], [1, 0.55, 1]);
  part(product, new CylinderGeometry(0.09, 0.09, 0.16, 32), metal, [0, 1.51, 0]);
  part(product, new BoxGeometry(0.48, 0.34, 0.38), pale, [-0.43, 0.81, -0.12]);

  const geometry = new Group();
  part(geometry, new BoxGeometry(0.3, 0.77, 0.34), pale, [-0.43, 1.04, 0]);
  part(geometry, new BoxGeometry(0.3, 0.77, 0.34), pale, [0.43, 1.04, 0]);
  part(geometry, new TorusGeometry(0.43, 0.15, 20, 48, Math.PI), pale, [0, 1.42, 0]);
  part(geometry, new SphereGeometry(0.21, 32, 24), sage, [0.08, 0.87, 0.23]);
  const subjects = { portrait, product, geometry };
  for (const group of Object.values(subjects)) { group.visible = false; scene.add(group); }

  let selected;
  function select(name) {
    for (const [key, group] of Object.entries(subjects)) group.visible = key === name;
    selected = subjects[name];
    if (!selected) throw new Error('Unknown subject: ' + name);
    selected.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(selected, true);
    return { bounds, target: bounds.getCenter(new Vector3()), group: selected };
  }
  return { select, subjects };
}