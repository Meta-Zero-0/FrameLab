export function connectExposureTriangle(selects, update) {
  const names = ['Aperture', 'ISO', 'Shutter speed'];
  const ranges = selects.map((select, index) => {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `${select.id}-slider`;
    slider.min = '0';
    slider.max = String(select.options.length - 1);
    slider.setAttribute('aria-label', `${names[index]} slider`);
    slider.addEventListener('input', () => {
      select.selectedIndex = Number(slider.value);
      update();
    });
    const label = select.parentElement;
    const setting = document.createElement('div');
    setting.className = 'exposure-setting';
    label.before(setting);
    setting.append(label, slider);
    return slider;
  });
  const triangle = document.createElement('div');
  triangle.className = 'exposure-triangle';
  triangle.innerHTML = '<p class="triangle-aperture">Wider aperture</p><div class="triangle-surface" aria-hidden="true"><span class="triangle-marker"></span></div><div class="triangle-base"><span>Higher ISO</span><span>Slower shutter</span></div><p class="guide-note">Drag to adjust all three settings.</p>';
  const surface = triangle.querySelector('.triangle-surface');
  const marker = triangle.querySelector('.triangle-marker');
  // Walk toward a vertex to favour that control. The centre starts at the reference exposure.
  const axes = selects.map((select, index) => {
    const reversed = index === 0;
    const last = select.options.length - 1;
    const reference = reversed ? last - select.selectedIndex : select.selectedIndex;
    return {reversed, last, reference};
  });
  const centre = 1 / 3;
  function applyPoint(event) {
    const rect = surface.getBoundingClientRect();
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    const x = Math.max((1-y)/2, Math.min((1+y)/2, (event.clientX - rect.left) / rect.width));
    const weights = [1-y, (1+y)/2-x, x-(1-y)/2];
    axes.forEach(({reversed,last,reference}, index) => {
      const weight = weights[index];
      const value = weight < centre ? reference * weight / centre
        : reference + (last-reference) * (weight-centre) / (1-centre);
      const step = Math.round(value);
      selects[index].selectedIndex = reversed ? last-step : step;
    });
    update();
    marker.style.left = `${x*100}%`;
    marker.style.top = `${y*100}%`;
  }
  surface.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    surface.setPointerCapture(event.pointerId);
    applyPoint(event);
  });
  surface.addEventListener('pointermove', event => {
    if (surface.hasPointerCapture(event.pointerId)) applyPoint(event);
  });
  function sync() {
    const weights = axes.map(({reversed,last,reference}, index) => {
      const select = selects[index];
      const step = select.selectedIndex;
      ranges[index].value = step;
      ranges[index].setAttribute('aria-valuetext', select.selectedOptions[0].textContent);
      const value = reversed ? last-step : step;
      return value <= reference ? centre*value/reference
        : centre+(1-centre)*(value-reference)/(last-reference);
    });
    // Three independent sliders span more combinations than the two-dimensional pad.
    const total = weights.reduce((sum, weight) => sum+weight, 0);
    const [aperture, , shutter] = total ? weights.map(weight => weight/total) : [centre,centre,centre];
    marker.style.left = `${(aperture/2+shutter)*100}%`;
    marker.style.top = `${(1-aperture)*100}%`;
  }
  return {triangle, sync};
}
