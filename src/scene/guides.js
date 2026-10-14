import { CameraHelper, Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Vector3 } from 'three';
export function createGuides(scene, photoCamera) {
  const frustum = new CameraHelper(photoCamera);
  frustum.layers.set(1);
  frustum.setColors(0xb1a445, 0xb1a445, 0xb1a445, 0xb1a445, 0xb1a445);
  scene.add(frustum);
  const focusPlane = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
    color: 0xc8dc65, transparent: true, opacity: 0.13, side: DoubleSide, depthWrite: false,
  }));
  focusPlane.layers.set(1); scene.add(focusPlane);
  function update(state) {
    photoCamera.updateMatrixWorld(true); frustum.update(); frustum.visible = state.guides;
    focusPlane.visible = state.focusPlane && state.guides;
    const position = photoCamera.getWorldPosition(new Vector3());
    const direction = photoCamera.getWorldDirection(new Vector3());
    focusPlane.position.copy(position).addScaledVector(direction, state.focusDistance);
    focusPlane.quaternion.copy(photoCamera.getWorldQuaternion(focusPlane.quaternion));
    focusPlane.scale.set(state.focusDistance * 36 / state.focalLength, state.focusDistance * 24 / state.focalLength, 1);
  }
  return { update };
}