import { it, expect } from 'vitest';
import { Group, Vector3 } from 'three';
import { createSubjectSystem } from '../scene/createSubjectSystem.js';
import { createFramingLock } from '../camera/framingLock.js';
import { createPhotoCamera, applyLens } from '../camera/cameraModel.js';

it('keeps portrait regions inside the full mannequin and scales placement in metres', () => {
  const subjects = createSubjectSystem(new Group());
  subjects.select('human'); const full = subjects.bounds();
  subjects.setRegion('head'); const head = subjects.bounds();
  expect(full.containsBox(head)).toBe(true); expect(head.getSize(new Vector3()).y).toBeCloseTo(.28);
  subjects.setRegion('full'); subjects.place(2, 1, -2, 90);
  expect(subjects.height()).toBeCloseTo(2); expect(subjects.bounds().min.y).toBeCloseTo(0);
  subjects.place(1.5, 0, 0, 0); expect(subjects.height()).toBeCloseTo(1.5);
});
it('maintains a headshot through lens changes using actual projected corners', () => {
  const subjects = createSubjectSystem(new Group()); subjects.select('human'); subjects.setRegion('head');
  const camera = createPhotoCamera(), target = subjects.bounds().getCenter(new Vector3());
  const lock = createFramingLock(subjects.bounds, camera, target);
  for (const focal of [24, 50, 100, 200]) {
    applyLens(camera, focal); const result = lock.fit(focal, { min: .1, max: 40 });
    camera.position.copy(target).add(new Vector3(0, 0, result.distance)); camera.lookAt(target); camera.updateMatrixWorld();
    const { min, max } = subjects.bounds(), points = [];
    for (const x of [min.x,max.x]) for (const y of [min.y,max.y]) for (const z of [min.z,max.z]) points.push(new Vector3(x,y,z).project(camera));
    const occupancy = Math.max(...['x','y'].map(axis => (Math.max(...points.map(p=>p[axis]))-Math.min(...points.map(p=>p[axis])))/2));
    expect(occupancy).toBeCloseTo(.78, 4);
  }
});
function glb(json, bin = new Uint8Array()) {
  const text = JSON.stringify(json), bytes = new TextEncoder().encode(text + ' '.repeat((4-text.length%4)%4));
  const buffer = new ArrayBuffer(20+bytes.length+(bin.length ? 8+bin.length : 0)), view = new DataView(buffer);
  view.setUint32(0,0x46546c67,true); view.setUint32(4,2,true); view.setUint32(8,buffer.byteLength,true); view.setUint32(12,bytes.length,true); view.setUint32(16,0x4e4f534a,true); new Uint8Array(buffer,20,bytes.length).set(bytes);
  if(bin.length){view.setUint32(20+bytes.length,bin.length,true);view.setUint32(24+bytes.length,0x004e4942,true);new Uint8Array(buffer,28+bytes.length).set(bin);}
  return {size:buffer.byteLength,arrayBuffer:async()=>buffer};
}
it('imports embedded geometry, grounds it, and retains it after a rejected external file', async () => {
  const subjects = createSubjectSystem(new Group()); subjects.select('product');
  const vertices = new Float32Array([2,3,0, 4,3,0, 2,5,0]);
  await subjects.importFile(glb({asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[2,3,0],max:[4,5,0]}]},new Uint8Array(vertices.buffer)));
  expect(subjects.height()).toBeCloseTo(2); expect(subjects.bounds().min.y).toBeCloseTo(0); expect(subjects.bounds().getCenter(new Vector3()).x).toBeCloseTo(0);
  await expect(subjects.importFile(glb({asset:{version:'2.0'},buffers:[{uri:'https://example.com/model.bin'}]}))).rejects.toThrow('self-contained');
  expect(subjects.height()).toBeCloseTo(2);
  subjects.select('cube'); subjects.select('import'); expect(subjects.height()).toBeCloseTo(2);
});
