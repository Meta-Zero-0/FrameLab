import { connectNumberInput } from './connectNumberInput.js';
import { Vector3 } from 'three';
import { createFocusGuides } from '../scene/createFocusGuides.js';
import { calculateDof } from '../camera/dofMath.js';
import { isoValues, shutterValues, shutterLabel } from '../camera/exposure.js';

export function connectFocusControls(scene, photo, target) {
  const focus = document.querySelector('#focus-distance');
  const focusNumber = connectNumberInput('focus-distance', 'focus-number');
  const follow = document.querySelector('#follow-focus');
  const aperture = document.querySelector('#aperture');
  const exposureRow = document.createElement('div');
  exposureRow.className = 'exposure-row';
  aperture.before(exposureRow);
  const apertureLabel = document.querySelector('label[for="aperture"]');
  apertureLabel.append(aperture); exposureRow.append(apertureLabel);
  function selector(id, label, values, initial, format=String) {
    const wrap=document.createElement('label'); wrap.textContent=label;
    const select=document.createElement('select'); select.id=id;
    for(const value of values) { const option=new Option(format(value),String(value),value===initial,value===initial); select.append(option); }
    wrap.append(select); exposureRow.append(wrap); return select;
  }
  const iso=selector('camera-iso','ISO',isoValues,100);
  const shutter=selector('camera-shutter','Shutter speed',shutterValues,1/125,shutterLabel);
  const help=document.createElement('details'); help.className='control-help';
  help.innerHTML='<summary>Relative exposure</summary><p class="guide-note">ISO, shutter speed and aperture change camera brightness for continuous lighting. Reference: ISO 100, 1/125 s, f/2.8. Light output is not calibrated to real fixtures. Flash timing, motion blur and sensor noise are not simulated.</p>';
  exposureRow.after(help);
  document.querySelector('.focus-controls h3').textContent='Focus and exposure';
  document.querySelector('.focus-controls').setAttribute('aria-label','Focus and exposure');
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
    photo.update({ focusDistance, fNumber, focalLength, iso:Number(iso.value), shutter:Number(shutter.value), visualDof: blur.checked });
    document.querySelector('#focus-value').textContent = format(focusDistance);
    document.querySelector('#dof-near').textContent = format(dof.near);
    document.querySelector('#dof-far').textContent = format(dof.far);
    document.querySelector('#dof-total').textContent = format(dof.total);
    document.querySelector('#hyperfocal').textContent = format(dof.hyperfocal);
    document.querySelector('#dof-guide-status').textContent = showDof.checked ? guides.update(dof, focusDistance, showPlane.checked, true) : '';
    if (!showDof.checked) guides.update(dof, focusDistance, showPlane.checked, false);
  }
  for (const input of [focus, aperture, iso, shutter, blur, showPlane, showDof, follow]) input.addEventListener('input', update);
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


