// Move existing controls, preserving their listeners and saved-state IDs.
export function organizeControls() {
  const find = selector => document.querySelector(selector);
  function group(parent, title, nodes, className = 'secondary-controls') {
    const details = document.createElement('details'); details.className = className;
    const summary = document.createElement('summary'); summary.textContent = title;
    details.append(summary, ...nodes.filter(Boolean)); parent.append(details);
    return details;
  }
  const camera = find('.camera-controls');
  find('#camera-orientation').parentElement.classList.add('select-row');
  const formatRow = document.createElement('div');
  formatRow.className = 'camera-format-row';
  const orientationLabel = find('#camera-orientation').parentElement;
  orientationLabel.before(formatRow);
  formatRow.append(orientationLabel, find('#camera-aspect').parentElement);
  const presets = camera.querySelector('.presets');
  const framing = camera.querySelector('.framing-control');
  // Keep lens, distance and camera height together before secondary choices.
  camera.append(framing);
  group(camera, 'Lens presets and camera details', [presets, camera.querySelector('dl'), camera.querySelector('.control-help')]);
  const focus = find('.focus-controls');
  group(focus, 'Focus and exposure details', [...focus.querySelectorAll('dl, .control-help')]);
  const subject = find('.subject-controls');
  group(subject, 'Subject help', [find('#subject-status')]);
  for(const selector of ['.guide-section', '.scene-references']) {
    const section = find(selector);
    const title = selector === '.guide-section' ? 'Overview guides' : 'Scene references';
    const nodes = [...section.children];
    const details = group(section,title,nodes);
    const summary = details.querySelector('summary');
    summary.id = selector === '.guide-section' ? 'overview-guides-heading' : 'scene-references-heading';
    // The disclosure is the visible title; preserve the fieldset's accessible name.
    const fieldset = details.querySelector('fieldset');
    if (fieldset) {
      fieldset.setAttribute('aria-labelledby', summary.id);
      fieldset.querySelector('legend')?.remove();
    }
    section.querySelector('h3')?.remove();
  }
  const lights = find('.lighting-controls');
  const toolbar = document.createElement('div'); toolbar.className = 'light-toolbar';
  toolbar.append(find('#light-legend'),find('#key-enabled').parentElement);
  lights.querySelector('h3').after(toolbar);
  const source = document.createElement('div'); source.className = 'light-source-row';
  source.append(find('#light-source').parentElement,find('#light-colour').parentElement);
  toolbar.after(source);
  source.before(find('#light-naming'));
  source.append(find('#modifier-control'));
  const fields = find('#light-fields'); source.after(fields);
  fields.after(find('#modifier-sizes'));
  find('#modifier-sizes').after(find('#modifier-dimensions'));
  for(const id of ['light-intensity','light-x','light-y','light-z','light-size','light-beam','light-temperature']) fields.append(find('#'+id).parentElement);
  find('#light-size').parentElement.after(find('#modifier-rotation-control'));
  find('#light-intensity').parentElement.after(find('#light-orbit-angle').parentElement,find('#light-orbit-radius').parentElement);
  group(lights,'Exact light placement', [find('#light-x').parentElement,find('#light-z').parentElement]);
  const aim = find('#light-follow').closest('p'); fields.after(aim); aim.after(find('#aim-fields'));
  const equipment = find('.equipment-controls');
  group(lights,'Light support and equipment', [...equipment.children]); equipment.remove();
  group(lights,'Presets and light behaviour', [find('#lighting-preset').parentElement,find('#apply-lighting-preset'),find('#lighting-preset-note'),find('#light-model').parentElement,find('#light-model-note'),find('#light-role'),find('#light-marker').closest('p'),find('#reset-lighting')]);
  lights.append(find('#light-status'));
  // Warnings remain visible, but don't consume unbounded space above controls.
  find('.control-deck').setAttribute('aria-label','Scene controls');
  find('.control-deck').setAttribute('tabindex','0');
}
