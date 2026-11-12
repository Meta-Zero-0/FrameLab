import { exposureAxis, moveExposure, trianglePoint } from '../camera/exposureTriangle.js';

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
  triangle.innerHTML = `
    <p class="triangle-aperture">Wider aperture</p>
    <div class="triangle-surface" aria-hidden="true" data-help="Drag to adjust all three settings.">
      <div class="triangle-marker-area"><span class="triangle-marker"></span></div>
    </div>
    <div class="triangle-base"><span>Higher ISO</span><span>Slower shutter</span></div>`;
  const surface = triangle.querySelector('.triangle-surface');
  const markerArea = triangle.querySelector('.triangle-marker-area');
  const marker = triangle.querySelector('.triangle-marker');
  const axes = selects.map((select, index) => exposureAxis(select.options.length - 1, index === 0));
  const selectedIndices = () => selects.map(select => select.selectedIndex);
  const markerPoint = indices => trianglePoint(axes.map((axis, index) => axis.fraction(indices[index])));
  let drag = null;
  function pointerPoint(event, rect) {
    return {x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height};
  }
  function applyPoint(event) {
    const point = pointerPoint(event, markerArea.getBoundingClientRect());
    const to = {x: point.x - drag.offset.x, y: point.y - drag.offset.y};
    const next = moveExposure(axes, drag.indices, drag.from, to);
    if (next.every((index, axis) => selects[axis].selectedIndex === index)) return;
    selects.forEach((select, index) => { select.selectedIndex = next[index]; });
    update();
  }
  surface.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = markerArea.getBoundingClientRect();
    const indices = selectedIndices();
    const from = markerPoint(indices);
    const point = pointerPoint(event, rect);
    const dx = point.x - from.x;
    const dy = point.y - from.y;
    const onMarker = Math.hypot(dx * rect.width, dy * rect.height) <= marker.offsetWidth / 2;
    drag = {indices, from, offset: onMarker ? {x: dx, y: dy} : {x: 0, y: 0}};
    surface.setPointerCapture(event.pointerId);
    applyPoint(event);
  });
  surface.addEventListener('pointermove', event => {
    if (drag && surface.hasPointerCapture(event.pointerId)) applyPoint(event);
  });
  surface.addEventListener('lostpointercapture', () => { drag = null; });
  function sync() {
    selects.forEach((select, index) => {
      ranges[index].value = select.selectedIndex;
      ranges[index].setAttribute('aria-valuetext', select.selectedOptions[0].textContent);
    });
    const {x,y} = markerPoint(selectedIndices());
    marker.style.left = `${x * 100}%`;
    marker.style.top = `${y * 100}%`;
  }
  return {triangle, sync};
}
