const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Fractions run towards the labelled corner. Aperture's slider runs the other way.
export function exposureAxis(lastIndex, reverse = false) {
  return {
    fraction(index) {
      return (reverse ? lastIndex - index : index) / lastIndex;
    },
    index(fraction) {
      const index = Math.round(clamp(fraction, 0, 1) * lastIndex);
      return reverse ? lastIndex - index : index;
    }
  };
}

export function triangleWeights(x, y) {
  const row = clamp(y, 0, 1);
  const left = (1 - row) / 2;
  const right = (1 + row) / 2;
  const column = clamp(x, left, right);
  return [1 - row, right - column, column - left];
}

export function trianglePoint(fractions) {
  // Project the slider differences onto the triangle. A half-range lead over
  // both other settings is enough to reach a corner.
  const scores = fractions.map(fraction => 2 * fraction);
  const [high, middle, low] = [...scores].sort((a, b) => b - a);
  const threshold = Math.max(high - 1, (high + middle - 1) / 2, (high + middle + low - 1) / 3);
  const [aperture, , shutter] = scores.map(score => Math.max(0, score - threshold));
  return {x: aperture / 2 + shutter, y: 1 - aperture};
}

export function moveExposure(axes, initialIndices, from, to) {
  const start = triangleWeights(from.x, from.y);
  const end = triangleWeights(to.x, to.y);
  const movement = end.map((weight, index) => weight - start[index]);
  if (movement.every(delta => Math.abs(delta) < 1e-9)) return initialIndices;

  // Preserve the starting values when the user grabs the marker. As a drag
  // approaches a corner, carry its leading setting towards the slider limit.
  const startPeak = Math.max(...start);
  const endPeak = Math.max(...end);
  const towardsCorner = endPeak === 1 ? 1
    : Math.max(0, endPeak - startPeak) / Math.max(1e-9, 1 - startPeak);
  return axes.map((axis, index) => {
    const fraction = axis.fraction(initialIndices[index]);
    const relative = fraction + movement[index] / 2;
    const corner = (1 + end[index]) / 2 - Number.EPSILON;
    return axis.index(relative + (corner - relative) * towardsCorner);
  });
}
