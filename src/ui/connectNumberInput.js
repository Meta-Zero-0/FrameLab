// A number field and slider share one value and the same input event pathway.
export function connectNumberInput(rangeId, numberId) {
  const range = document.getElementById(rangeId), number = document.getElementById(numberId);
  function sync() { number.value = range.value; number.setCustomValidity(''); }
  number.addEventListener('change', () => {
    if (number.value === '' || !number.checkValidity()) { number.reportValidity(); return; }
    range.value = number.value;
    range.dispatchEvent(new Event('input', { bubbles: true }));
    sync();
  });
  number.addEventListener('keydown', event => { if (event.key === 'Enter') number.blur(); });
  range.addEventListener('input', sync);
  sync(); return { sync };
}
