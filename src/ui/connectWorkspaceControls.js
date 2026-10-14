// Layout changes only: retain the same canvases, cameras and controls.
export function connectWorkspaceControls() {
  const workspace = document.querySelector('.workspace');
  const overview = document.querySelector('#overview-panel');
  const button = document.querySelector('#expand-photo');
  let expanded = false;
  function setExpanded(value) {
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
  return { reset: () => { if (expanded) setExpanded(false); } };
}

