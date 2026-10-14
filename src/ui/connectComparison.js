import { lightModifiers } from '../scene/lightModifiers.js';
// Captures are frozen images plus readable settings, independent of the live scene.
export function connectComparison(photo, resetScene, lighting) {
  const status = document.querySelector('#comparison-status');
  const slots = new Map();
  const fields = [
    ['camera-orientation','Orientation',''], ['camera-aspect','Aspect ratio',''], ['focal-length','Lens',' mm'], ['camera-distance','Camera distance',' m'],
    ['camera-height','Camera height',' m'], ['camera-tilt','Camera tilt','°'], ['focus-distance','Focus distance',' m'], ['aperture','Aperture',''],
    ['subject-type','Subject',''], ['subject-pose','Pose',''], ['subject-region','Framing region',''],
    ['subject-height','Height',' m'], ['subject-x','Subject X',' m'], ['subject-z','Subject Z',' m'], ['subject-yaw','Rotation',' degrees'],
    ['maintain-framing','Maintain framing',''], ['follow-focus','Follow focus',''], ['visual-blur','Approximate blur',''],
    ['show-grid','Grid',''], ['show-prop-labels','Labels',''], ['show-camera-guides','Camera guide',''], ['show-focus-plane','Focus plane',''], ['show-dof-guides','Sharpness guides',''],
  ];
  function settings() {
    const values = fields.filter(([id]) => !['subject-pose','subject-region'].includes(id) || document.querySelector('#subject-type').value === 'human').map(([id,label,unit]) => {
      const input = document.getElementById(id);
      const value = input.type === 'checkbox' ? (input.checked ? 'On' : 'Off') : input.tagName === 'SELECT' ? input.selectedOptions[0].textContent : input.value + unit;
      return [label, value];
    });
    document.querySelectorAll('#reference-list label').forEach(label => values.push([label.textContent.trim(), label.querySelector('input').checked ? 'Visible' : 'Hidden']));
    values.push(['View target (m)', photo.camera.position.clone().add(photo.camera.getWorldDirection(photo.camera.position.clone()).multiplyScalar(Number(document.querySelector('#camera-distance').value))).toArray().map(n => n.toFixed(2)).join(', ')]);
    values.push(['Camera position (m)', photo.camera.position.toArray().map(n => n.toFixed(2)).join(', ')]);
    for (const [id,label] of [['dof-near','Near sharp limit'],['dof-far','Far sharp limit'],['dof-total','Depth of field'],['hyperfocal','Hyperfocal distance']]) values.push([label, document.getElementById(id).textContent]);
    values.push(['Sensor', photo.camera.aspect < 1 ? '24 × 36 mm' : '36 × 24 mm']);
    for (const [name,state] of Object.entries(lighting.snapshot())) values.push([name+' name',state.name||name]);
    for (const [name,state] of Object.entries(lighting.snapshot())) if(state.mode === 'studio' && state.source === 'soft') values.push([name + ' modifier', lightModifiers[state.modifier || 'square'].label], [name + ' softbox rotation', (state.modifierRotation ?? 0) + '°']);
    for (const [name,state] of Object.entries(lighting.snapshot())) values.push([name + ' support selection', state.support || 'auto']);
    for (const [name,report] of Object.entries(lighting.equipmentReports())) {
      values.push([name + ' support', report.type], [name + ' stand base (m)', report.base.map(n=>n.toFixed(2)).join(', ')], [name + ' mast height (m)', report.height.toFixed(2)], [name + ' boom reach (m)', report.reach.toFixed(2)], [name + ' within typical support dimensions', report.supported?'Yes':'No'], [name + ' equipment outside studio', report.outside?'Yes':'No'], [name + ' equipment possibly in frame', report.supportInFrame||report.headInFrame?'Yes':'No']);
    }
    document.querySelectorAll('.lighting-controls input:not([type=range])').forEach(input => values.push([input.closest('label').textContent.trim(), input.type === 'checkbox' ? (input.checked ? 'On' : 'Off') : input.value]));
    for (const [name,state] of Object.entries(lighting.snapshot())) { values.push([name + ' light', state.enabled ? 'On' : 'Off'],[name + ' model', state.mode],[name + ' source', state.source],[name + ' colour', state.colour],[name + ' aim', state.follow ? 'Follow subject region' : 'Manual']); for (const [setting,value] of Object.entries(state.values)) if (setting !== 'light-fill') values.push([name + ' ' + setting.replace('light-',''), String(value)]); }
    return values;
  }
  function clear(slot) {
    slots.delete(slot);
    const card = document.querySelector(`#capture-${slot}`);
    card.querySelector('img').removeAttribute('src'); card.querySelector('img').hidden = true;
    card.querySelector('dl').replaceChildren(); card.querySelector('.capture-summary').textContent = 'No capture yet.';
    card.querySelector('details').hidden = true;
    card.querySelectorAll('[data-download], [data-clear]').forEach(button => button.disabled = true);
  }
  for (const slot of ['A','B']) {
    const card = document.querySelector(`#capture-${slot}`);
    card.querySelector('[data-capture]').addEventListener('click', () => {
      try {
        if (document.querySelector('#subject-type').disabled) throw new Error('Wait for the model to finish loading.');
        const invalid = Array.from(document.querySelectorAll('.photo-panel input[type=number]')).find(input => !input.disabled && (input.value === '' || !input.checkValidity()));
        if (invalid) { invalid.reportValidity(); throw new Error('Correct the invalid number before capturing.'); }
        photo.render(); // Read immediately after rendering; no preserveDrawingBuffer overhead.
        const image = photo.renderer.domElement.toDataURL('image/png');
        const values = settings(); slots.set(slot, { image, values });
        const img = card.querySelector('img'); img.src = image; img.hidden = false;
        card.querySelector('.capture-summary').textContent = values.slice(0,4).map(([key,value]) => `${key}: ${value}`).join(' · ');
        const list = card.querySelector('dl'); list.replaceChildren();
        for (const [key,value] of values) { const row = document.createElement('div'), term = document.createElement('dt'), description = document.createElement('dd'); term.textContent = key; description.textContent = value; row.append(term,description); list.append(row); }
        card.querySelector('details').hidden = false;
        card.querySelectorAll('[data-download], [data-clear]').forEach(button => button.disabled = false);
        status.textContent = `Captured ${slot}. ${slots.size === 2 ? 'Compare both photographs below.' : 'Change the controls, then capture the other slot.'}`;
      } catch (error) { status.textContent = `Capture failed: ${error.message}`; }
    });
    card.querySelector('[data-clear]').addEventListener('click', () => { clear(slot); status.textContent = `Cleared ${slot}.`; });
    card.querySelector('[data-download]').addEventListener('click', () => {
      const saved = slots.get(slot); if (!saved) return;
      const link = document.createElement('a'); link.href = saved.image; link.download = `FrameLab-${slot}.png`; link.click();
    });
    clear(slot);
  }
  document.querySelector('#clear-comparison').addEventListener('click', () => { clear('A'); clear('B'); status.textContent = 'Comparison cleared.'; });
  document.querySelector('#reset-all').addEventListener('click', () => {
    if (document.querySelector('#subject-type').disabled) { status.textContent = 'Wait for the model to finish loading before resetting.'; return; }
    resetScene(); clear('A'); clear('B');
    status.textContent = 'Reset to starting settings. Comparisons cleared. Any imported GLB remains available in the Model menu.';
  });
}





