import { connectNumberInput } from './connectNumberInput.js';
import { Vector3 } from 'three';
import { createFocusGuides } from '../scene/createFocusGuides.js';
import { calculateDof } from '../camera/dofMath.js';

export function connectFocusControls(scene, photo, target) {
  const focus = document.querySelector('#focus-distance');
  const focusNumber = connectNumberInput('focus-distance', 'focus-number');
  const follow = document.querySelector('#follow-focus');
  const aperture = document.querySelector('#aperture');
  const blur = document.querySelector('#visual-blur');
  const showPlane = document.querySelector('#show-focus-plane');
  const guides = createFocusGuides(scene, photo.camera);
  const showDof = document.querySelector('#show-dof-guides');
  const forward = new Vector3();
  const format = value => Number.isFinite(value) ? `${value.toFixed(2)} m` : 'Infinity';
  function update() {
    if (follow.checked) setTargetDistance();
    focus.disabled = document.querySelector('#focus-number').disabled = follow.checked;
    focusNumber.sync();
    const focusDistance = Number(focus.value);
    const fNumber = Number(aperture.value);
    const focalLength = Number(document.querySelector('#focal-length').value);
    const dof = calculateDof(focalLength, fNumber, focusDistance);
    photo.update({ focusDistance, fNumber, focalLength, visualDof: blur.checked });
    document.querySelector('#focus-value').textContent = format(focusDistance);
    document.querySelector('#dof-near').textContent = format(dof.near);
    document.querySelector('#dof-far').textContent = format(dof.far);
    document.querySelector('#dof-total').textContent = format(dof.total);
    document.querySelector('#hyperfocal').textContent = format(dof.hyperfocal);
    document.querySelector('#dof-guide-status').textContent = showDof.checked ? guides.update(dof, focusDistance, showPlane.checked, true) : '';
    if (!showDof.checked) guides.update(dof, focusDistance, showPlane.checked, false);
  }
  for (const input of [focus, aperture, blur, showPlane, showDof, follow]) input.addEventListener('input', update);
  function setTargetDistance() {
    photo.camera.getWorldDirection(forward);
    const point = typeof target === 'function' ? target() : target;
    focus.value = point.clone().sub(photo.camera.position).dot(forward).toFixed(2);
  }
  function focusTarget() { setTargetDistance(); update(); }
  document.querySelector('#focus-target').addEventListener('click', focusTarget);
  focusTarget();
  return { update, focusTarget };
}


