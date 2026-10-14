import { Quaternion, Vector3 } from 'three';
// Size is the longest face dimension in metres. Three samples share fixed output.
export const lightModifiers = {
  square: { label: 'Square softbox', aspect: 1, beam: 90 },
  rectangle: { label: 'Rectangular softbox', aspect: 2 / 3, beam: 90 },
  strip: { label: 'Strip softbox', aspect: 1 / 4, beam: 70 },
  octa: { label: 'Octagonal softbox', aspect: 1, beam: 90 },
};
export function modifierDimensions(size, shape = 'square') {
  return { width: size * (lightModifiers[shape] || lightModifiers.square).aspect, height: size };
}

// Roll around the lamp's local emitting axis, after aiming it at the subject.
export function modifierOrientation(direction, degrees = 0) {
  return new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), direction)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, -1), degrees * Math.PI / 180));
}
