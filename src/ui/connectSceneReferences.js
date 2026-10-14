import { placeAbove } from './labelPlacement.js';
import { Vector3, Box3 } from 'three';

// HTML labels are projected onto the overview; they never enter the photo renderer.
export function connectSceneReferences(props, subject, photoCamera, overviewCamera) {
  const panel = document.querySelector('#reference-list');
  const labelsToggle = document.querySelector('#show-prop-labels');
  labelsToggle.addEventListener('input', update);
  const overlay = document.querySelector('#reference-labels');
  const forward = new Vector3();
  const cameraPosition = new Vector3();
  const subjectCentre = new Vector3();
  const centre = new Vector3();
  const anchor = new Vector3();
  const box = new Box3();
  const rows = props.map(prop => {
    const row = document.createElement('div');
    row.className = 'reference-row';
    const label = document.createElement('label');
    const toggle = document.createElement('input');
    toggle.type = 'checkbox'; toggle.checked = prop.visible;
    label.append(toggle, document.createTextNode(` ${prop.name}`));
    const reading = document.createElement('p');
    row.append(label, reading); panel.append(row);
    const tag = document.createElement('div');
    tag.className = 'reference-tag';
    tag.style.backgroundColor = '#' + prop.material.color.getHexString();
    tag.style.borderColor = '#' + prop.material.color.getHexString();


    const detail = document.createElement('span');
    tag.append(detail); overlay.append(tag);
    toggle.addEventListener('change', () => { prop.visible = toggle.checked; update(); });
    return { prop, reading, tag, detail };
  });
  function update() {
    photoCamera.getWorldPosition(cameraPosition);
    photoCamera.getWorldDirection(forward);
    subjectCentre.copy(box.setFromObject(subject).getCenter(centre));
    overviewCamera.updateMatrixWorld();
    const placed = [];
    const width = overlay.clientWidth, height = overlay.clientHeight;
    for (const { prop, reading, tag, detail } of rows) {
      box.setFromObject(prop).getCenter(centre);
      const cameraDepth = centre.clone().sub(cameraPosition).dot(forward);
      const subjectDepth = centre.clone().sub(subjectCentre).dot(forward);
      const relation = subjectDepth >= 0 ? 'behind subject' : 'in front of subject';
      const text = `${cameraDepth.toFixed(2)} m from camera\n${Math.abs(subjectDepth).toFixed(2)} m ${relation}`;
      if (reading.textContent !== text) { reading.textContent = text; detail.textContent = text; }
      // Project all box corners: the visible top changes when the overview orbits.
      let screenTop = Infinity;
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        anchor.set(x, y, z).project(overviewCamera);
        screenTop = Math.min(screenTop, (1 - anchor.y) * height / 2);
      }
      anchor.copy(centre).project(overviewCamera);
      tag.hidden = !labelsToggle.checked || prop.userData.showLabel === false || !prop.visible || anchor.z < -1 || anchor.z > 1 || Math.abs(anchor.x) > 1 || Math.abs(anchor.y) > 1;
      if (!tag.hidden && width > 0) {
        const w = tag.offsetWidth, h = tag.offsetHeight;
        const x = Math.max(8, Math.min(width - w - 8, (anchor.x + 1) * width / 2 - w / 2));
        const position = placeAbove({ x, top: screenTop, w, h }, placed);
        tag.style.left = `${position.x}px`;
        tag.style.top = `${position.y}px`;
        // Hide when no space exists above, instead of covering the object.
        tag.hidden = position.y < 0;
        if (!tag.hidden) placed.push(position);
      }
    }
  }
  return { update };
}

