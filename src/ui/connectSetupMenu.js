export function connectSetupMenu() {
  const menu = document.querySelector('.setup-menu');
  const toggle = menu.querySelector('.setup-menu-toggle');
  const actions = menu.querySelector('.setup-actions');
  const mobile = window.matchMedia('(max-width: 850px)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function closeShotTools() {
    actions.querySelector('.shot-menu[open]')?.removeAttribute('open');
  }

  function close(restoreFocus = false) {
    if (!isOpen()) return;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (isOpen()) close();
    else toggle.setAttribute('aria-expanded', 'true');
  });
  actions.addEventListener('click', event => {
    if (event.target.closest('button')?.parentElement !== actions) return;
    closeShotTools();
    close(true);
  }, {capture: true});
  document.addEventListener('pointerdown', event => {
    if (menu.contains(event.target)) return;
    closeShotTools();
    close(actions.contains(document.activeElement));
  });
  document.addEventListener('focusin', event => {
    if (!menu.contains(event.target)) {
      closeShotTools();
      close();
    }
  });
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openShotTool = actions.querySelector('.shot-menu[open]');
    if (openShotTool) {
      event.preventDefault();
      closeShotTools();
      openShotTool.querySelector('summary').focus();
    } else if (isOpen()) {
      event.preventDefault();
      close(true);
    }
  });
  mobile.addEventListener('change', () => close());
}
