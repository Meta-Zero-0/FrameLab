import {it,expect} from 'vitest';
import {exposureMultiplier,validateExposure} from '../camera/exposure.js';
it('keeps reference brightness and follows exposure stops',()=>{
 expect(exposureMultiplier()).toBe(1);
 expect(exposureMultiplier(200,1/125,2.8)).toBe(2);
 expect(exposureMultiplier(100,1/250,2.8)).toBe(.5);
 expect(exposureMultiplier(100,1/125,5.6)).toBe(.25);
 expect(exposureMultiplier(400,1/125,5.6)).toBe(1);
});
it('defaults older projects and rejects invalid exposure settings',()=>{
 expect(validateExposure(undefined)).toEqual({iso:100,shutter:1/125});
 expect(validateExposure({iso:800,shutter:1/60})).toEqual({iso:800,shutter:1/60});
 for(const value of [null,{iso:0,shutter:1/125},{iso:100,shutter:0},{iso:'100',shutter:1/125}])expect(()=>validateExposure(value)).toThrow();
});
