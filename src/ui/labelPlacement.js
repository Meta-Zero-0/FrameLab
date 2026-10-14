// Move overlapping labels upward only. Never move one down onto its prop.
export function placeAbove({ x, top, w, h }, placed, gap = 8) {
  let y = top - h - gap;
  for (let i = 0; i <= placed.length; i++) {
    const hit = placed.find(r => x < r.x + r.w + gap && x + w + gap > r.x && y < r.y + r.h + gap && y + h + gap > r.y);
    if (!hit) break;
    y = hit.y - h - gap;
  }
  return { x, y, w, h };
}
