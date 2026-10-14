import { Box3, BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { chooseLightSupport, cameraFrustum } from './lightSupportMath.js';
import { defaultStudio, outsideStudio } from './studioBounds.js';
import { modifierDimensions, modifierOrientation } from './lightModifiers.js';

export function createLightEquipment(scene, camera) {
  const equipment = new Map();
  const steel = new MeshStandardMaterial({ color: '#424a4f', metalness: .55, roughness: .48 });
  const housing = new MeshStandardMaterial({ color: '#242b30', roughness: .85 });
  const tube = new CylinderGeometry(1, 1, 1, 10), cube = new BoxGeometry(1, 1, 1);
  const octagon = new CylinderGeometry(.5, .5, 1, 8).rotateX(Math.PI / 2);
  const up = new Vector3(0, 1, 0);
  let studio = { ...defaultStudio }, lastKey = '', reports = {};
  function mesh(geometry, material, parent) {
    const object = new Mesh(geometry, material); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function make(name) {
    const root = new Group(); root.name = name + ' physical equipment'; scene.add(root);
    const support = new Group(), head = new Group(); root.add(support, head);
    const faceMaterial = new MeshStandardMaterial({ color: '#f2f1e9', roughness: .9 });
    const face = mesh(cube, faceMaterial, head);
    const back = mesh(cube, housing, head);
    const edges = Array.from({ length: 8 }, () => mesh(cube, housing, head));
    const bars = Array.from({ length: 9 }, () => mesh(tube, steel, support));
    return { root, head, support, face, back, edges, bars };
  }
  function update(lights, states) {
    camera.updateMatrixWorld(true);
    const cacheKey = JSON.stringify([states, studio, camera.matrixWorld.elements, camera.projectionMatrix.elements,
      Object.values(lights).map(light => [light.position.toArray(), light.target.position.toArray()])]);
    if (cacheKey === lastKey) return;
    lastKey = cacheKey; reports = {};
    const frustum = cameraFrustum(camera);
    for (const [name, state] of Object.entries(states)) {
      if (!equipment.has(name)) equipment.set(name, make(name));
      const model = equipment.get(name), light = lights[name];
      model.root.visible = state.enabled && state.mode === 'studio';
      if (!model.root.visible) continue;
      const plan = chooseLightSupport(light.position, state.support || 'auto', camera, studio);
      model.bars.forEach((object, index) => {
        const part = plan.bars[index]; object.visible = !!part;
        if (!part) return;
        const direction = part.b.clone().sub(part.a);
        object.position.copy(part.a).addScaledVector(direction, .5);
        object.scale.set(part.radius, direction.length(), part.radius);
        object.quaternion.setFromUnitVectors(up, direction.normalize());
      });
      const size = state.source === 'soft' ? state.values['light-size'] : .18;
      const shape = state.source === 'soft' ? state.modifier || 'square' : 'square';
      const {width, height} = modifierDimensions(size, shape);
      // Local -Z is the emitting direction. Housing stays BEHIND the light samples.
      model.head.position.copy(light.position);
      const direction = light.target.position.clone().sub(light.position).normalize();
      model.head.quaternion.copy(modifierOrientation(direction, state.source === 'soft' ? state.modifierRotation ?? 0 : 0));
      model.face.geometry = model.back.geometry = shape === 'octa' ? octagon : cube;
      model.face.position.set(0, 0, .02); model.face.scale.set(width, height, .02);
      model.back.position.set(0, 0, .22); model.back.scale.set(width, height, .035);
      model.edges.forEach((edge, i) => {
        edge.visible = shape === 'octa' || i < 4;
        edge.rotation.set(0, 0, 0);
        if (shape === 'octa') {
          const angle = (i + .5) * Math.PI / 4;
          const radius = size * .5 * Math.cos(Math.PI / 8) + .015;
          edge.position.set(Math.sin(angle)*radius, Math.cos(angle)*radius, .115);
          edge.rotation.z = -angle;
          edge.scale.set(size*Math.sin(Math.PI/8), .03, .23);
        } else {
          edge.position.set(i < 2 ? (i === 0 ? -1 : 1) * (width / 2 + .015) : 0, i >= 2 ? (i === 2 ? -1 : 1) * (height / 2 + .015) : 0, .115);
          edge.scale.set(i < 2 ? .03 : width, i < 2 ? height : .03, .23);
        }
      });
      model.root.updateMatrixWorld(true);
      const headBounds = new Box3().setFromObject(model.head);
      const bounds = plan.bounds.clone().union(headBounds);
      reports[name] = { type: plan.type, base: plan.base.toArray(), height: plan.height, reach: plan.reach, supported: plan.supported,
        baseInFrame: plan.baseFrameLength > 0, supportInFrame: plan.frameLength > 0, headInFrame: frustum.intersectsBox(headBounds), outside: outsideStudio(bounds.min, bounds.max, studio), bounds };
    }
  }
  return { update, setStudio(value) { studio = { ...value }; lastKey = ''; }, reports: () => reports };
}
