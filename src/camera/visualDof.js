// BokehPass is an artistic approximation, not a calibrated physical lens.
export const DOF_CALIBRATION = Object.freeze({ apertureAt50mmF28: 0.0012, maxBlur: 0.012 });
export function visualDofSettings(focalLength, fNumber, focusDistance) {
  return {
    focus: focusDistance,
    aperture: Math.min(0.008, DOF_CALIBRATION.apertureAt50mmF28 * (2.8 / fNumber) * (focalLength / 50) ** 2),
    maxblur: DOF_CALIBRATION.maxBlur,
  };
}