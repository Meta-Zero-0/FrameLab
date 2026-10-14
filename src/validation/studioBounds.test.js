import {it,expect} from 'vitest';
import {validStudio,outsideStudio} from '../scene/studioBounds.js';
const room={width:4,depth:6,height:3};
it('accepts supported dimensions and rejects invalid rooms',()=>{expect(validStudio(room)).toBe(true);for(const width of [0,31,NaN,Infinity])expect(validStudio({...room,width})).toBe(false);expect(validStudio({...room,height:11})).toBe(false);});
it('checks full subject extents and points against all room limits',()=>{
 const min={x:-2,y:0,z:-3},max={x:2,y:3,z:3};expect(outsideStudio(min,max,room)).toBe(false);
 for(const [axis,value] of [['x',2.1],['y',3.1],['z',3.1]])expect(outsideStudio(min,{...max,[axis]:value},room)).toBe(true);
 expect(outsideStudio({...min,y:-.1},max,room)).toBe(true);
 const camera={x:0,y:1.5,z:5};expect(outsideStudio(camera,camera,room)).toBe(true);
});

it('accepts legacy rooms and valid surface colours but rejects malformed colours',()=>{expect(validStudio(room)).toBe(true);expect(validStudio({...room,floorColour:'#123abc',wallColour:'#FFFFFF'})).toBe(true);for(const floorColour of ['red','#fff',null,123])expect(validStudio({...room,floorColour})).toBe(false);});
