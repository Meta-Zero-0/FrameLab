import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial, Vector3 } from 'three';
export function createCameraRig(scene, camera) {
  const rig = new Group(); rig.add(camera);
  const housing = new MeshStandardMaterial({ color: 0x303b35, roughness: 0.48 });
  const glass = new MeshStandardMaterial({ color: 0x577265, metalness: 0.7, roughness: 0.2 });
  function part(geometry, material, x, y, z) {
    const obj = new Mesh(geometry, material); obj.position.set(x, y, z); obj.layers.set(1);
    obj.castShadow = false; rig.add(obj); return obj;
  }
  part(new BoxGeometry(0.36, 0.26, 0.2), housing, 0, 0, 0.1);
  const lens = part(new CylinderGeometry(0.105, 0.115, 0.23, 32), housing, 0, 0, -0.105);
  lens.rotation.x = Math.PI / 2;
  const front = part(new CylinderGeometry(0.095, 0.095, 0.018, 32), glass, 0, 0, -0.23);
  front.rotation.x = Math.PI / 2;
  part(new BoxGeometry(0.12, 0.055, 0.11), housing, 0, 0.157, 0.1);
  part(new SphereGeometry(0.07, 16, 12), housing, 0, -0.21, 0.08);
  const tripod = new Group(); scene.add(tripod);
  const legGeometry = new CylinderGeometry(0.018, 0.026, 1, 10);
  const legs = Array.from({ length: 3 }, () => {
    const leg = new Mesh(legGeometry, housing); leg.layers.set(1); tripod.add(leg); return leg;
  });
  scene.add(rig);
  const axis = new Vector3(0, 0.2, 4.5).normalize();
  function place(target, distance) {
    rig.position.copy(target).addScaledVector(axis, distance);
    rig.lookAt(target); rig.updateMatrixWorld(true);
    const top = rig.position.clone().add(new Vector3(0, -0.22, 0.08));
    legs.forEach((leg, i) => {
      const angle = i * Math.PI * 2 / 3;
      const bottom = new Vector3(rig.position.x + Math.cos(angle) * 0.5, 0.02, rig.position.z + Math.sin(angle) * 0.5);
      const delta = top.clone().sub(bottom);
      leg.position.copy(bottom).addScaledVector(delta, 0.5);
      leg.scale.y = delta.length();
      leg.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
    });
  }
  // Group.lookAt points local +Z at the target; camera must point local -Z.
  // Flip the group after aiming so both the lens and photographic camera face it.
  const originalPlace = place;
  function update(target, distance) {
    originalPlace(target, distance); rig.rotateY(Math.PI); rig.updateMatrixWorld(true);
  }
  return { rig, update, axis };
}