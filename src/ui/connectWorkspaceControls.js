// Layout changes only: retain the same canvases, cameras and controls.
export function connectWorkspaceControls() {
  const workspace = document.querySelector('.workspace');
  const overview = document.querySelector('#overview-panel');
  const button = document.querySelector('#expand-photo');
  const splitter = document.createElement('div');
  splitter.className = 'view-splitter';
  splitter.tabIndex = 0;
  splitter.setAttribute('role', 'separator');
  splitter.setAttribute('aria-label', 'Resize studio overview and camera view');
  splitter.setAttribute('aria-orientation', 'vertical');
  splitter.setAttribute('aria-controls', 'overview-panel photo-frame');
  splitter.setAttribute('aria-valuemin', '25');
  splitter.setAttribute('aria-valuemax', '75');
  splitter.title = 'Drag to resize views. Arrow keys adjust; double-click to reset.';
  workspace.append(splitter);
  let share = 50;
  let pointer = null;
  let pending = null;
  let frame = 0;
  function setSplit(value) {
    share = Math.max(25, Math.min(75, value));
    workspace.style.setProperty('--overview-track', `${share}fr`);
    workspace.style.setProperty('--camera-track', `${100 - share}fr`);
    splitter.setAttribute('aria-valuenow', String(Math.round(share)));
    splitter.setAttribute('aria-valuetext', `Studio overview ${Math.round(share)}%, camera view ${Math.round(100 - share)}%`);
  }
  function flushSplit() {
    frame = 0;
    if (pending !== null) { setSplit(pending); pending = null; }
  }
  function stopDrag() {
    if (frame) cancelAnimationFrame(frame);
    flushSplit();
    const id = pointer; pointer = null;
    if (id !== null && splitter.hasPointerCapture(id)) splitter.releasePointerCapture(id);
    workspace.classList.remove('resizing-views');
  }
  splitter.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId;
    splitter.setPointerCapture(pointer);
    splitter.focus({preventScroll:true});
    workspace.classList.add('resizing-views');
  });
  splitter.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    const rect = workspace.getBoundingClientRect();
    pending = (event.clientX - rect.left - workspace.clientLeft) / workspace.clientWidth * 100;
    if (!frame) frame = requestAnimationFrame(flushSplit);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) splitter.addEventListener(event, stopDrag);
  splitter.addEventListener('dblclick', () => setSplit(50));
  splitter.addEventListener('keydown', event => {
    const step = event.shiftKey ? 5 : 1;
    const values = {ArrowLeft:share-step, ArrowRight:share+step, Home:25, End:75, Enter:50};
    if (!(event.key in values)) return;
    event.preventDefault(); setSplit(values[event.key]);
  });
  setSplit(50);
  let expanded = false;
  function setExpanded(value) {
    stopDrag();
    expanded = value;
    workspace.classList.toggle('photo-expanded', expanded);
    overview.hidden = expanded;
    button.setAttribute('aria-expanded', String(expanded));
    const label = expanded ? 'Return to split view' : 'Expand camera view';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.focus({ preventScroll: true });
    button.scrollIntoView({ block: 'nearest' });
    // Existing ResizeObservers resize both drawing outputs automatically.
  }
  button.addEventListener('click', () => setExpanded(!expanded));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      setExpanded(false);
    }
  });
  return { reset: () => { stopDrag(); setSplit(50); if (expanded) setExpanded(false); } };
}

