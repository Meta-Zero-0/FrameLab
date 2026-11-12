export function connectSetupMenu() {
  const menu = document.querySelector('.setup-menu');
  const toggle = menu.querySelector('.setup-menu-toggle');
  const actions = menu.querySelector('.setup-actions');
  const mobile = window.matchMedia('(max-width: 850px)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function close(restoreFocus = false) {
    if (!isOpen()) return;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', String(!isOpen()));
  });
  actions.addEventListener('click', event => {
    if (event.target.closest('button')) close(true);
  }, {capture: true});
  document.addEventListener('pointerdown', event => {
    if (!menu.contains(event.target)) close(actions.contains(document.activeElement));
  });
  document.addEventListener('focusin', event => {
    if (!menu.contains(event.target)) close();
  });
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !isOpen()) return;
    event.preventDefault();
    close(true);
  });
  mobile.addEventListener('change', () => close());
}
