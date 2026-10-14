import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshBasicMaterial, Vector3, Quaternion, Box3 } from 'three';

// Overview equipment never parents or moves the photographic camera.
export function createCameraTripod(scene, camera) {
  const rig = new Group(); rig.name = 'Camera and tripod';
  const body = new Group(); rig.add(body);
  const dark = new MeshBasicMaterial({ color: '#294f64' });
  const metal = new MeshBasicMaterial({ color: '#63777e' });
  const rubber = new MeshBasicMaterial({ color: '#163344' });
  function part(parent, geometry, material, position = [0,0,0]) {
    const mesh = new Mesh(geometry, material); mesh.position.fromArray(position);
    mesh.layers.set(1); parent.add(mesh); return mesh;
  }
  part(body, new BoxGeometry(.42,.28,.22), dark);
  const lens = part(body, new CylinderGeometry(.1,.1,.22,20), rubber, [0,0,-.2]);
  lens.rotation.x = Math.PI / 2;
  part(body, new BoxGeometry(.22,.035,.16), metal, [0,-.1575,0]);
  const head = part(rig, new SphereGeometry(.055,16,12), metal);
  const cylinder = new CylinderGeometry(1,1,1,12);
  const rods = Array.from({length: 11}, () => part(rig,cylinder,metal));
  const feet = Array.from({length:3}, () => part(rig,new SphereGeometry(.045,12,8),rubber));
  const up = new Vector3(0,1,0), roll = new Quaternion();
  let report;
  function rod(index, from, to, radius) {
    const delta = to.clone().sub(from), mesh = rods[index];
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    mesh.scale.set(radius,delta.length(),radius);
    mesh.quaternion.setFromUnitVectors(up,delta.normalize());
  }
  function update() {
    camera.updateWorldMatrix(true,false);
    camera.getWorldPosition(body.position); camera.getWorldQuaternion(body.quaternion);
    if(camera.userData.orientation === 'portrait') body.quaternion.multiply(roll.setFromAxisAngle(new Vector3(0,0,1),Math.PI/2));
    const mount = new Vector3(0,-.19,0).applyQuaternion(body.quaternion).add(body.position);
    head.position.copy(mount);
    const height = Math.max(.015,mount.y-.055);
    const shoulder = new Vector3(mount.x,Math.max(.015,height*.78),mount.z);
    const top = new Vector3(mount.x,height,mount.z);
    rod(0,new Vector3(mount.x,shoulder.y*.5,mount.z),top,.025); rod(1,top,mount,.018);
    const spread = Math.min(.65,Math.max(.12,height*.32));
    const direction = camera.getWorldDirection(new Vector3());
    const yaw = Math.atan2(direction.z,direction.x);
    for(let i=0;i<3;i++) {
      const angle = yaw + i*Math.PI*2/3;
      const foot = new Vector3(mount.x+Math.cos(angle)*spread,.025,mount.z+Math.sin(angle)*spread);
      const joint = shoulder.clone().lerp(foot,.55);
      rod(2+i*3,shoulder,joint,.025);
      rod(3+i*3,joint,foot,.017);
      rod(4+i*3,new Vector3(mount.x,shoulder.y*.5,mount.z),joint,.009);
      feet[i].position.copy(foot); feet[i].scale.set(1,.55,1);
    }
    const supported = body.position.y >= .45 && body.position.y <= 2.1 && mount.y > .08;
    head.visible = mount.y > .08;
    rods.forEach(mesh => { mesh.visible = head.visible; });
    feet.forEach(mesh => { mesh.visible = head.visible; });
    rig.updateMatrixWorld(true);
    report = { supported, height: body.position.y, bounds: new Box3().setFromObject(rig), mount: mount.clone() };
    return report;
  }
  scene.add(rig); update();
  return { rig, body, update, report: () => report };
}
