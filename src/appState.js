export const DEFAULTS = Object.freeze({
  focalLength: 50, distance: 4.5, focusDistance: 4.5, fNumber: 2.8,
  maintainFraming: false, focusOnSubject: true, visualDof: true,
  subject: 'portrait', expanded: false, guides: true, focusPlane: false,
});
export function createAppState() { return { ...DEFAULTS }; }