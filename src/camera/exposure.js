export const defaultExposure = Object.freeze({iso:100, shutter:1/125});
export const isoValues = [50,100,200,400,800,1600,3200,6400,12800];
export const shutterValues = [1/8000,1/4000,1/2000,1/1000,1/500,1/250,1/125,1/60,1/30,1/15,1/8,1/4,1/2,1,2,4,8,15,30];
export function exposureMultiplier(iso=100, shutter=1/125, aperture=2.8) {
  return (iso/100) * (shutter/(1/125)) * (2.8/aperture)**2;
}
export function validateExposure(value) {
  if (value === undefined) return {...defaultExposure};
  if (!value || !isoValues.includes(value.iso) || !shutterValues.includes(value.shutter)) throw new Error('Invalid ISO or shutter speed.');
  return {iso:value.iso,shutter:value.shutter};
}
export const shutterLabel = seconds => seconds < 1 ? `1/${Math.round(1/seconds)} s` : `${seconds} s`;
