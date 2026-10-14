// Thin-lens / hyperfocal convention from the brief. Work in mm internally.
export function calculateDof(focalLengthMm, fNumber, focusDistanceM, circleOfConfusionMm = 0.03) {
  if (![focalLengthMm, fNumber, focusDistanceM, circleOfConfusionMm].every(Number.isFinite) ||
      focalLengthMm <= 0 || fNumber <= 0 || circleOfConfusionMm <= 0 || focusDistanceM * 1000 <= focalLengthMm) {
    throw new RangeError('Use positive optical values and focus beyond the focal length.');
  }
  const f = focalLengthMm;
  const s = focusDistanceM * 1000;
  const H = f * f / (fNumber * circleOfConfusionMm) + f;
  const near = H * s / (H + s - f) / 1000;
  const far = H > s - f ? H * s / (H - (s - f)) / 1000 : Infinity;
  return { near, far, total: far - near, hyperfocal: H / 1000 };
}