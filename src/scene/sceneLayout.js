// Edit this file to arrange the scene. It contains plain data, not Three.js code.
// Distances are metres by convention. Positions use [X, Y, Z]; +Y is up.
// Rotation values here are degrees; the scene builder converts them to radians.
export const sceneLayout = {
  // Starting photographic camera; distance control moves along this viewing direction.
  photoView: { position: [0, 1.2, 5], target: [0, 0.5, 0] },
  // These props reveal perspective changes; only the orange cube is framing-locked.
  backgroundObjects: [
    { name: 'Near green column', position: [-1.4, 1, -2], size: [0.6, 2, 0.6], color: '#668d77' },
    { name: 'Middle blue column', position: [1.5, 1.4, -4], size: [0.8, 2.8, 0.8], color: '#698b9f' },
    { name: 'Far backdrop', showLabel: false, position: [0, 1.8, -5.5], size: [12, 3.6, 0.2], color: '#edf2f8' },
  ],
  background: '#dce3dc',
  floor: { size: [12, 12], color: '#ffffff' },
  subject: {
    name: 'Subject',
    size: [1, 1, 1],
    position: [0, 0.5, 0], // TRY: change the first 0 to 1, then save.
    rotationDegrees: [0, 0, 0],
    color: '#c1784d',
  },
  lighting: {
    ambientIntensity: 2,
    keyPosition: [-3, 2, 4],
    keyIntensity: 3,
  },
  view: { position: [11, 9, 14], target: [0, 0.5, 3] },
};
