import { it, expect } from 'vitest';
import { placeAbove } from '../ui/labelPlacement.js';
it('keeps colliding labels above their own objects and each other', () => {
  const first = placeAbove({ x: 20, top: 200, w: 120, h: 40 }, []);
  const second = placeAbove({ x: 80, top: 205, w: 120, h: 40 }, [first]);
  expect(first.y + first.h).toBeLessThan(200);
  expect(second.y + second.h).toBeLessThan(first.y);
  expect(second.y + second.h).toBeLessThan(205);
});
it('never pushes a label onto its object even at the top of the viewport', () => {
  const label = placeAbove({ x: 0, top: 15, w: 120, h: 40 }, []);
  expect(label.y).toBeLessThan(0);
  expect(label.y + label.h).toBeLessThan(15);
});
