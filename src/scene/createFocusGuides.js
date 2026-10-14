import { Group, LineSegments, EdgesGeometry, PlaneGeometry, LineBasicMaterial, Mesh, MeshBasicMaterial, DoubleSide, Vector3 } from 'three';

// These guides share the photo camera's orientation, but only the overview sees layer 1.
export function createFocusGuides(scene, camera) {
  function rectangle(color, filled = false) {
    const group = new Group();
    group.add(new LineSegments(new EdgesGeometry(new PlaneGeometry(1, 1)), new LineBasicMaterial({ color, transparent: true, opacity: .9 })));
    if (filled) group.add(new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color, transparent: true, opacity: .09, side: DoubleSide, depthWrite: false })));
    group.traverse(object => object.layers.set(1)); scene.add(group); return group;
  }
  const focus = rectangle('#cf8b22', true), near = rectangle('#23836f'), far = rectangle('#23836f');
  const forward = new Vector3();
  function position(group, distance) {
    group.position.copy(camera.position).addScaledVector(forward, distance);
    group.quaternion.copy(camera.quaternion);
    const height = 2 * Math.tan(camera.fov * Math.PI / 360) * distance;
    group.scale.set(height * camera.aspect, height, 1);
  }
  function update(dof, distance, showFocus, showDof) {
    camera.getWorldDirection(forward);
    position(focus, distance); focus.visible = showFocus;
    // Do not draw a false far boundary for infinity or a huge finite distance.
    const limit = 60;
    near.visible = showDof && dof.near <= limit;
    far.visible = showDof && Number.isFinite(dof.far) && dof.far <= limit;
    if (near.visible) position(near, dof.near);
    if (far.visible) position(far, dof.far);
    return !Number.isFinite(dof.far) ? 'Far limit: infinity (no far boundary drawn).'
      : dof.far > limit ? 'Far limit exceeds 60 m; its guide is hidden. The reading remains exact.' : '';
  }
  return { update };
}
