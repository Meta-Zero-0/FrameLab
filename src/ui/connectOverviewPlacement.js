import { BufferGeometry, DoubleSide, Float32BufferAttribute, MathUtils, Mesh, MeshBasicMaterial, Plane, Raycaster, RingGeometry, Vector2, Vector3 } from 'three';
import { orbitYaw } from '../scene/subjectOrbit.js';

const rotationInner = .86;
const rotationOuter = 1;

function createRotationArrow() {
  const end = 7 * Math.PI / 4;
  const gap = .85;
  const arc = new RingGeometry(rotationInner, rotationOuter, 64, 1, end + gap, Math.PI * 2 - gap);
  const positions = Array.from(arc.attributes.position.array);
  const indices = Array.from(arc.index.array);
  const head = positions.length / 3;
  for (const [radius, angle] of [[1.17, end], [.93, end + .42], [.74, end]]) {
    positions.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
  }
  indices.push(head, head + 1, head + 2);
  arc.dispose();
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3)).setIndex(indices);
}

export function connectOverviewPlacement({scene, overview, items}) {
  const {camera, controls, renderer} = overview;
  const canvas = renderer.domElement;
  const hint = document.querySelector('#overview-interaction');
  const defaultHint = hint.textContent;
  const ray = new Raycaster();
  const pointer = new Vector2();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const intersection = new Vector3();
  const ringRadius = .56;
  const ring = new Mesh(new RingGeometry(.44, ringRadius, 48), new MeshBasicMaterial({
    side: DoubleSide, depthTest: false, depthWrite: false, toneMapped: false,
  }));
  ring.rotation.x = -Math.PI / 2;
  ring.layers.set(1);
  ring.renderOrder = 20;
  ring.visible = false;
  const rotationRing = new Mesh(createRotationArrow(), ring.material);
  rotationRing.layers.set(1);
  rotationRing.renderOrder = ring.renderOrder;
  rotationRing.visible = false;
  ring.add(rotationRing);
  scene.add(ring);
  let selection = null;
  let drag = null;
  let background = null;

  function setRay(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      1 - (event.clientY - rect.top) / rect.height * 2);
    camera.updateMatrixWorld();
    ray.layers.mask = camera.layers.mask;
    ray.setFromCamera(pointer, camera);
  }

  function visibleParts(object, parts) {
    if (!object?.visible) return;
    if (object.isMesh || object.isSprite) parts.push(object);
    for (const child of object.children) visibleParts(child, parts);
  }

  function hitEquipment(kind) {
    const owners = new Map();
    for (const item of items) {
      const parts = [];
      for (const object of item[kind]?.() ?? []) visibleParts(object, parts);
      for (const part of parts) owners.set(part, item);
    }
    const hit = ray.intersectObjects([...owners.keys()], false)[0];
    return hit && owners.get(hit.object);
  }

  function stopDrag() {
    if (!drag) return;
    const {id} = drag;
    drag = null;
    window.removeEventListener('wheel', rotateWhileMoving, {capture: true});
    controls.enabled = true;
    canvas.style.cursor = '';
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }

  function clear() {
    stopDrag();
    background = null;
    selection = null;
    ring.visible = false;
    rotationRing.visible = false;
    hint.textContent = defaultHint;
  }

  function tick() {
    if (!selection) return;
    const {item, identity} = selection;
    const markers = item.marker?.() ?? [];
    if (identity !== item.identity() || (!markers.length && !item.objects().some(object => object?.visible))) {
      clear();
      return;
    }
    const [x, , z] = item.floorPosition();
    ring.position.set(x, .015, z);
    rotationRing.visible = !!item.rotate;
    // The parent lies flat, so the arrow's local Z axis is world up.
    if (rotationRing.visible) rotationRing.rotation.z = MathUtils.degToRad(item.yaw());
    ring.updateMatrixWorld();
    const gesture = item.rotate ? 'Drag inner ring to move · Drag curved arrow or scroll while moving to rotate'
      : 'Drag ring to move' + (markers.length ? ' · Drag marker for height' : '');
    const message = item.label() + ' selected · ' + gesture + ' · Click away to deselect';
    if (hint.textContent !== message) hint.textContent = message;
  }

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0) {
      background = null;
      return;
    }
    if (drag) return;
    setRay(event);
    // A low light's marker can overlap its floor ring.
    const marker = hitEquipment('marker');
    const radius = ring.visible && ray.ray.intersectPlane(ground, intersection)
      ? Math.hypot(intersection.x - ring.position.x, intersection.z - ring.position.z) : Infinity;
    const ringHit = radius <= ringRadius + .18;
    const rotating = !marker && rotationRing.visible && (ray.intersectObject(rotationRing, false).length > 0 ||
      (radius >= rotationInner - .1 && radius <= rotationOuter + .14));
    const item = marker ?? (rotating || ringHit ? selection.item : hitEquipment('objects'));
    if (!item) {
      background = {id: event.pointerId, x: event.clientX, y: event.clientY};
      return;
    }
    const vertical = marker === item && selection?.item === item;
    item.select();
    selection = {item, identity: item.identity()};
    ring.material.color.set(item.colour);
    ring.visible = true;
    tick();

    const initial = item.position.clone();
    const normal = camera.position.clone().sub(initial).setY(0).normalize();
    const plane = vertical ? new Plane().setFromNormalAndCoplanarPoint(normal, initial) : ground;
    const start = ray.ray.intersectPlane(plane, new Vector3());
    // Capture before OrbitControls sees the press, including a marker selection click.
    event.preventDefault();
    event.stopImmediatePropagation();
    controls.enabled = false;
    drag = {id: event.pointerId, item, vertical, initial, plane, start,
      movable: !!start && (!marker || vertical),
      rotation: rotating ? {pivot: ring.position.clone(), yaw: item.yaw()} : null,
      x: event.clientX, y: event.clientY, moved: false};
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = vertical ? 'ns-resize' : 'grabbing';
    canvas.focus({preventScroll: true});
    if (!rotating && drag.movable && item.rotate) window.addEventListener('wheel', rotateWhileMoving, {capture: true, passive: false});
  }
  canvas.addEventListener('pointerdown', startDrag, {capture: true});

  function rotateWhileMoving(event) {
    if (!drag || event.ctrlKey || event.deltaY === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const degrees = event.deltaMode === 0 ? event.deltaY / 16 : event.deltaY * 3;
    drag.item.rotate(orbitYaw(drag.item.yaw(), 0, Math.max(-15, Math.min(15, degrees))));
  }

  canvas.addEventListener('keydown', event => {
    const direction = {ArrowLeft: -1, ArrowRight: 1}[event.key];
    if (!direction || !selection?.item.rotate) return;
    event.preventDefault();
    const {item} = selection;
    item.rotate(orbitYaw(item.yaw(), 0, direction * (event.shiftKey ? 15 : 5)));
  });

  canvas.addEventListener('pointermove', event => {
    if (background?.id === event.pointerId && Math.hypot(event.clientX - background.x, event.clientY - background.y) > 4) background = null;
    if (drag?.id !== event.pointerId || !drag.movable) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
    drag.moved = true;
    setRay(event);
    if (!ray.ray.intersectPlane(drag.plane, intersection)) return;
    if (drag.rotation) {
      const {pivot, yaw} = drag.rotation;
      const x = intersection.x - pivot.x;
      const z = intersection.z - pivot.z;
      if (Math.hypot(x, z) < .15) return;
      const initialAngle = Math.atan2(drag.start.x - pivot.x, drag.start.z - pivot.z);
      const delta = Math.atan2(x, z) - initialAngle;
      drag.item.rotate(orbitYaw(yaw, 0, MathUtils.radToDeg(delta)));
      return;
    }
    intersection.sub(drag.start).add(drag.initial);
    const round = value => Math.round(value * 1000) / 1000;
    drag.item.move(drag.vertical ? {y: round(intersection.y)} : {x: round(intersection.x), z: round(intersection.z)});
    tick();
  });

  canvas.addEventListener('pointerup', event => {
    if (background?.id === event.pointerId) clear();
    if (drag?.id === event.pointerId) stopDrag();
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => {
      if (background?.id === event.pointerId) background = null;
      if (drag?.id === event.pointerId) stopDrag();
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selection && !event.defaultPrevented) clear();
  });
  return {clear, tick};
}
