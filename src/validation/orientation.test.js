import {it,expect} from 'vitest';
import {createPhotoCamera,applyLens,fovDegrees} from '../camera/cameraModel.js';
import {frameOccupancy,distanceForFraming} from '../camera/framing.js';
it.each([['3:2',36,24],['4:3',32,24],['16:9',36,20.25],['1:1',24,24]])('crops %s within the sensor in both orientations', (ratio,width,height)=>{
 const c=createPhotoCamera();c.userData.aspectRatio=ratio;
 for(const orientation of ['landscape','portrait']) {
  c.userData.orientation=orientation;applyLens(c,50);
  const [w,h]=orientation==='portrait'?[height,width]:[width,height];
  expect(c.getFilmWidth()).toBeCloseTo(w);expect(c.getFilmHeight()).toBeCloseTo(h);
  expect(c.fov).toBeCloseTo(fovDegrees(50,h));expect(c.getFocalLength()).toBeCloseTo(50);
 }
});
it('rotates full-frame sensor dimensions without changing focal length',()=>{const c=createPhotoCamera();c.userData.orientation='portrait';applyLens(c,50);expect(c.aspect).toBeCloseTo(2/3);expect(c.fov).toBeCloseTo(fovDegrees(50,36));expect(c.getFocalLength()).toBeCloseTo(50);c.userData.orientation='landscape';applyLens(c,50);expect(c.fov).toBeCloseTo(fovDegrees(50,24));});
it('fits and maintains framing against portrait dimensions',()=>{const points=[{x:-.5,y:-1,z:0},{x:.5,y:1,z:0}],sensor={width:24,height:36};const result=distanceForFraming(points,85,.78,{min:.5,max:40},sensor);expect(result.limited).toBe(false);expect(frameOccupancy(points,85,result.distance,sensor).size).toBeCloseTo(.78);expect(frameOccupancy(points,85,result.distance).height).toBeCloseTo(1.17);});
