import {it,expect} from 'vitest';
import {createPhotoCamera,applyLens,fovDegrees} from '../camera/cameraModel.js';
import {frameOccupancy,distanceForFraming} from '../camera/framing.js';
it('rotates full-frame sensor dimensions without changing focal length',()=>{const c=createPhotoCamera();c.userData.orientation='portrait';applyLens(c,50);expect(c.aspect).toBeCloseTo(2/3);expect(c.fov).toBeCloseTo(fovDegrees(50,36));expect(c.getFocalLength()).toBeCloseTo(50);c.userData.orientation='landscape';applyLens(c,50);expect(c.fov).toBeCloseTo(fovDegrees(50,24));});
it('fits and maintains framing against portrait dimensions',()=>{const points=[{x:-.5,y:-1,z:0},{x:.5,y:1,z:0}],sensor={width:24,height:36};const result=distanceForFraming(points,85,.78,{min:.5,max:40},sensor);expect(result.limited).toBe(false);expect(frameOccupancy(points,85,result.distance,sensor).size).toBeCloseTo(.78);expect(frameOccupancy(points,85,result.distance).height).toBeCloseTo(1.17);});
