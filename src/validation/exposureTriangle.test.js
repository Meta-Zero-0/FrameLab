import { expect, it } from 'vitest';
import { isoValues, shutterValues } from '../camera/exposure.js';
import { exposureAxis, moveExposure, trianglePoint } from '../camera/exposureTriangle.js';

const apertureValues = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
const defaults = [2, isoValues.indexOf(100), shutterValues.indexOf(1 / 125)];
const axes = [
  exposureAxis(apertureValues.length - 1, true),
  exposureAxis(isoValues.length - 1),
  exposureAxis(shutterValues.length - 1),
];
const point = indices => trianglePoint(axes.map((axis, i) => axis.fraction(indices[i])));

it('places f/1.4 at the apex with both other sliders halfway', () => {
  expect(point([0, 4, 9])).toEqual({x: .5, y: 0});
  expect(point([1, 4, 9]).y).toBeGreaterThan(0);
  expect(point([0, 8, 9])).toEqual({x: .25, y: .5});
});

it('grabbing the marker preserves any independent slider combination', () => {
  for (const a of apertureValues.keys()) {
    for (const i of isoValues.keys()) {
      for (const s of shutterValues.keys()) {
        const indices = [a, i, s];
        const marker = point(indices);
        expect(moveExposure(axes, indices, marker, marker)).toEqual(indices);
      }
    }
  }
});

it('reaches the labelled setting at each corner', () => {
  const from = point(defaults);
  expect(moveExposure(axes, defaults, from, {x: .5, y: 0})[0]).toBe(0);
  expect(moveExposure(axes, defaults, from, {x: 0, y: 1})[1]).toBe(isoValues.length - 1);
  expect(moveExposure(axes, defaults, from, {x: 1, y: 1})[2]).toBe(shutterValues.length - 1);
});
