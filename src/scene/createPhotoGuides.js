import { BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial, Vector3 } from 'three';
import { createCameraTripod } from './createCameraTripod.js';

// Layer 1 is enabled only on the overview camera. No guide casts a shadow.
export function createPhotoGuides(scene, camera, target) {
  const equipment = createCameraTripod(scene, camera);
  const marker = equipment.rig;
  const status = document.createElement('p');
  status.className = 'guide-note'; status.setAttribute('role','status');
  document.querySelector('#camera-height').insertAdjacentElement('afterend',status);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(48), 3));
  const lines = new LineSegments(geometry, new LineBasicMaterial({ color: '#356f94', transparent: true, opacity: 0.8 }));
  lines.layers.set(1);
  scene.add(lines);

  function update() {
    camera.updateMatrixWorld(true);
    const report = equipment.update();
    status.hidden = report.supported;
    status.textContent = report.supported ? '' : 'Beyond typical tripod height (0.45–2.1 m): a low camera mount or elevated platform is required. Support is illustrative.';
    // Show the viewing cone only as far as the target plane, not the 100m far clip.
    const depth = camera.position.distanceTo(target);
    const halfHeight = Math.tan(camera.fov * Math.PI / 360) * depth;
    const halfWidth = halfHeight * camera.aspect;
    const corners = [[-1,-1], [1,-1], [1,1], [-1,1]].map(([x,y]) =>
      new Vector3(x * halfWidth, y * halfHeight, -depth).applyMatrix4(camera.matrixWorld));
    const positions = geometry.attributes.position;
    let index = 0;
    function vertex(point) { positions.setXYZ(index++, point.x, point.y, point.z); }
    corners.forEach((corner, i) => {
      vertex(camera.position); vertex(corner);
      vertex(corner); vertex(corners[(i + 1) % 4]);
    });
    positions.needsUpdate = true;
    geometry.computeBoundingSphere();
  }
  const toggle = document.querySelector('#show-camera-guides');
  toggle.addEventListener('input', () => { marker.visible = lines.visible = toggle.checked; });
  update();
  return { update, equipment };
}
