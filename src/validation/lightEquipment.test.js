import { describe, it, expect } from 'vitest';
import { Box3, DirectionalLight, PerspectiveCamera, Scene, Vector3 } from 'three';
import { chooseLightSupport, supportLayout, SUPPORT_LIMITS } from '../scene/lightSupportMath.js';
import { createLightEquipment } from '../scene/createLightEquipment.js';
import { defaultStudio } from '../scene/studioBounds.js';

function camera() {
  const c = new PerspectiveCamera(40, 1.5, .05, 100);
  c.position.set(0, 1.5, 5); c.lookAt(0, 1.5, 0); c.updateMatrixWorld(true); return c;
}
function fixture() {
  const scene = new Scene(), c = camera(), light = new DirectionalLight();
  light.position.set(-3, 2, 1); light.target.position.set(0, 1, 0);
  const state = { enabled: true, mode: 'studio', source: 'soft', support: 'auto', values: { 'light-size': .6 } };
  const equipment = createLightEquipment(scene, c);
  return { scene, c, light, state, equipment, update: () => equipment.update({ key: light }, { key: state }) };
}
describe('physical light supports', () => {
  it('extends the physical stand to the lamp and reports typical height limits separately', () => {
    const low = supportLayout(new Vector3(-3, 1, 1)), high = supportLayout(new Vector3(-3, 2, 1));
    expect(high.height - low.height).toBeCloseTo(1);
    expect(high.base.equals(low.base)).toBe(true);
    expect(high.supported).toBe(true);
    const impossible = supportLayout(new Vector3(-3, 8, 1));
    expect(impossible.supported).toBe(false);
    expect(impossible.height).toBeCloseTo(7.84);
    expect(impossible.bars.at(-1).b.equals(new Vector3(-3, 8, 1))).toBe(true);
    expect(impossible.bounds.max.y).toBeGreaterThanOrEqual(8);
  });
  it('keeps stands and booms physically connected throughout the lamp height range', () => {
    for (const y of [.2, 1, 2, 6, 10]) for (const type of ['stand','boom']) {
      const position=new Vector3(-3,y,1), plan=supportLayout(position,type);
      expect(plan.bars.at(-1).b.equals(position)).toBe(true);
      expect(plan.bars.at(-1).a.equals(plan.end)).toBe(true);
      if(type==='stand') expect(plan.bars[2].b.equals(plan.end)).toBe(true);
      else expect(plan.bars[6].b.equals(plan.end)).toBe(true);
    }
  });
  it('clears the mast and feet as a wider lens or greater camera distance expands the shot', () => {
    const c=camera(), p=new Vector3(1,2.5,-2);
    c.fov=20;c.updateProjectionMatrix();
    const narrow=chooseLightSupport(p,'auto',c,defaultStudio);
    c.fov=40;c.updateProjectionMatrix();
    const wide=chooseLightSupport(p,'auto',c,defaultStudio);
    expect(wide.baseFrameLength).toBe(0);
    expect(wide.outside).toBe(false);
    expect(wide.type).toBe('boom');
    expect(wide.base.equals(narrow.base)).toBe(false);
    c.position.z=8;c.lookAt(0,1.5,0);c.updateMatrixWorld(true);
    const distant=chooseLightSupport(p,'auto',c,defaultStudio);
    expect(distant.baseFrameLength).toBe(0);
    expect(distant.outside).toBe(false);
    expect(distant.base.equals(wide.base)).toBe(false);
  });
  it('reports unavoidable intrusion when a wide shot includes the whole room', () => {
    const c=camera();c.fov=90;c.position.set(0,2,15);c.lookAt(0,1,0);c.updateProjectionMatrix();c.updateMatrixWorld(true);
    const plan=chooseLightSupport(new Vector3(0,2,-1),'auto',c,{...defaultStudio,width:4,depth:4});
    expect(plan.frameLength).toBeGreaterThan(0);
    expect(plan.outside).toBe(false);
  });
  it('uses a stand outside the shot and an offset boom to reduce backlight support intrusion', () => {
    const c = camera();
    const side = chooseLightSupport(new Vector3(-3, 2, 1), 'auto', c, defaultStudio);
    expect(side.type).toBe('stand'); expect(side.frameLength).toBe(0);
    c.fov = 20; c.updateProjectionMatrix();
    const rear = new Vector3(0, 2.5, -2);
    const direct = chooseLightSupport(rear, 'stand', c, defaultStudio);
    const automatic = chooseLightSupport(rear, 'auto', c, defaultStudio);
    expect(automatic.type).toBe('boom');
    expect(automatic.frameLength).toBeLessThan(direct.frameLength);
    expect(automatic.supported).toBe(true);
    expect(automatic.outside).toBe(false);
  });
  it('honours manual support types, room footprints and unreachable lamp positions', () => {
    const c = camera();
    expect(chooseLightSupport(new Vector3(-3, 2, 1), 'boom', c, defaultStudio).type).toBe('boom');
    const edge = chooseLightSupport(new Vector3(5.9, 2, 0), 'stand', c, defaultStudio);
    expect(edge.outside).toBe(true);
    expect(chooseLightSupport(new Vector3(0, 10, 0), 'auto', c, defaultStudio).supported).toBe(false);
  });
  it('creates shadow-casting equipment without moving the light or camera', () => {
    const f = fixture(), before = f.c.position.clone(), lamp = f.light.position.clone(); f.update();
    const root = f.scene.getObjectByName('key physical equipment');
    expect(root.visible).toBe(true);
    const meshes = []; root.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
    expect(meshes.length).toBeGreaterThan(8);
    expect(meshes.every(o => o.castShadow && o.layers.isEnabled(0))).toBe(true);
    expect(f.c.position.equals(before)).toBe(true); expect(f.light.position.equals(lamp)).toBe(true);
    expect(f.equipment.reports().key.bounds).toBeInstanceOf(Box3);
  });
  it('updates housing size and aim, removes off lamps and omits directional fixtures', () => {
    const f = fixture(); f.update();
    const head = f.scene.getObjectByName('key physical equipment').children[1];
    const oldRotation = head.quaternion.clone();
    f.state.values['light-size'] = 1.2; f.light.target.position.set(1, 2, 3); f.update();
    expect(head.children[0].scale.x).toBe(1.2); expect(head.quaternion.equals(oldRotation)).toBe(false);
    f.state.enabled = false; f.update(); expect(f.equipment.reports().key).toBeUndefined();
    f.state.enabled = true; f.state.mode = 'directional'; f.update();
    expect(f.scene.getObjectByName('key physical equipment').visible).toBe(false);
  });
  it('refreshes frame warnings for orientation changes and bounds for room changes', () => {
    const f = fixture(); f.light.position.set(2.7, 2, -2); f.state.support = 'stand'; f.update();
    expect(f.equipment.reports().key.headInFrame).toBe(true);
    f.c.aspect = 2 / 3; f.c.updateProjectionMatrix(); f.update();
    expect(f.equipment.reports().key.headInFrame).toBe(false);
    f.equipment.setStudio({ ...defaultStudio, width: 2 }); f.update();
    expect(f.equipment.reports().key.outside).toBe(true);
  });
});
