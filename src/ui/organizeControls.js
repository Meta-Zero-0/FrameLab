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
  const aspect = find('#camera-aspect');
  const aspectLabel = aspect.parentElement;
  const aspectRow = document.createElement('div'); aspectRow.className = 'aspect-row';
  const aspectTitle = document.createElement('span'); aspectTitle.textContent = 'Aspect Ratio';
  const aspectButtons = document.createElement('div'); aspectButtons.className = 'aspect-segments';
  aspectButtons.setAttribute('role', 'group');
  aspectButtons.setAttribute('aria-label', 'Aspect ratio');
  for (const option of aspect.options) {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = option.textContent;
    button.dataset.aspectRatio = option.value;
    button.dataset.help = aspect.dataset.help;
    button.setAttribute('aria-pressed', String(option.selected));
    button.addEventListener('click', () => {
      aspect.value = option.value;
      aspect.dispatchEvent(new Event('change'));
    });
    aspectButtons.append(button);
  }
  aspect.hidden = true;
  aspectRow.append(aspectTitle, aspectButtons, aspect);
  aspectLabel.remove();
  formatRow.append(orientationLabel, aspectRow);
  const presets = camera.querySelector('.presets');
  const framing = camera.querySelector('.framing-control');
  camera.append(framing);
  const lensInfo = camera.querySelector('dl');
  const lensHelp = camera.querySelector('.control-help');
  const framingToggle = framing.querySelector('label');
  camera.querySelector('h3').append(framingToggle);
  for (const id of ['focal-length', 'camera-distance', 'camera-height', 'camera-tilt', 'focus-distance']) {
    const slider = find(`#${id}`);
    const label = slider.previousElementSibling;
    const row = document.createElement('div'); row.className = 'adjustment-row';
    label.before(row); row.append(label, slider);
  }
  function card(title, className) {
    const section = document.createElement('section');
    section.className = className;
    const heading = document.createElement('h3'); heading.textContent = title;
    section.append(heading);
    return section;
  }
  const focus = find('.focus-controls');
  focus.setAttribute('aria-label', 'Focus');
  focus.querySelector('h3').textContent = 'Focus';
  const followToggle = find('#follow-focus').closest('label');
  const followRow = followToggle.parentElement;
  focus.querySelector('h3').append(followToggle); followRow.remove();
  const exposure = card('Exposure', 'exposure-controls camera-only');
  const blurToggle = find('#visual-blur').closest('label');
  const blurRow = blurToggle.parentElement;
  exposure.querySelector('h3').append(blurToggle); blurRow.remove();
  exposure.append(find('.exposure-triangle'), find('.exposure-row'), ...[...focus.querySelectorAll('.control-help')].filter(item => /Relative exposure|Blur and sharpness/.test(item.querySelector('summary').textContent)));
  group(focus, 'Depth of field', [...focus.querySelectorAll('dl, .control-help')]);
  const lensPresets = card('Lens presets', 'lens-presets-card');
  lensPresets.append(presets);
  const lensDetailsCard = document.createElement('section'); lensDetailsCard.className = 'lens-details-card';
  lensDetailsCard.setAttribute('aria-label', 'Lens details');
  lensDetailsCard.append(lensInfo, lensHelp);
  const focusStack = document.createElement('div'); focusStack.className = 'focus-stack camera-only';
  focus.before(focusStack); focusStack.append(focus, lensPresets, lensDetailsCard); focusStack.after(exposure);
  const subject = find('.subject-controls');
  subject.querySelector('h3').append(find('#fit-subject'));
  const subjectRow = document.createElement('div'); subjectRow.className = 'subject-row';
  const model = document.createElement('div'); model.className = 'subject-model';
  model.append(find('label[for="subject-type"]'), find('#subject-type'), find('#import-glb'), find('#subject-file'));
  const placement = find('#subject-height').closest('.subject-fields');
  const placementDisclosure = placement.closest('details');
  subjectRow.append(model, placement, find('.rotation-control'));
  placementDisclosure.remove();
  subject.querySelector('h3').after(subjectRow);
  group(subject, 'Subject help', [find('#subject-status')]);
  for(const selector of ['.guide-section', '.scene-references']) {
    const section = find(selector);
    const title = selector === '.guide-section' ? 'Overview guides' : 'Scene references';
    const nodes = [...section.children];
    const details = group(section,title,nodes);
    details.open = true;
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
  const side = document.createElement('aside'); side.className = 'workspace-guides';
  const guides = find('.guide-section'); guides.before(side);
  side.append(guides, find('.scene-references'));
  const studio = find('.studio-controls');
  const studioSections = [...studio.children].filter(node => node.tagName === 'H3');
  for (const heading of studioSections) {
    const section = document.createElement('section');
    section.className = 'studio-card';
    heading.before(section);
    section.append(heading);
    while (section.nextElementSibling?.matches('.subject-fields, .guide-note')) {
      section.append(section.nextElementSibling);
    }
  }
  studio.append(find('.reflector-controls'), find('.black-flag-controls'));
  const modeControls = document.createElement('div');
  modeControls.className = 'mode-controls';
  side.before(modeControls);
  modeControls.append(camera, focusStack, exposure, find('.lighting-controls'), studio);
  const logo = find('.brand-logo');
  logo.src = `${import.meta.env.BASE_URL}figma-revamp/wordmark.svg`;
  const lensDetails = [...lensInfo.children];
  for (const [index, detail] of lensDetails.slice(1).entries()) {
    const divider = document.createElement('img');
    divider.className = 'lens-detail-divider'; divider.alt = '';
    divider.src = `${import.meta.env.BASE_URL}figma-revamp/lens-divider-${index === 0 ? 'a' : 'b'}.svg`;
    detail.prepend(divider);
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
