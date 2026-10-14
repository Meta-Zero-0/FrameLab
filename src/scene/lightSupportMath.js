import { Box3, Frustum, Matrix4, Vector3 } from 'three';
import { outsideStudio } from './studioBounds.js';

// Typical stand dimensions are warnings, not geometry clamps. Larger crane
// arrangements remain visible and connected, but need appropriate real equipment.
export const SUPPORT_LIMITS = Object.freeze({ minHeight: .6, maxHeight: 3.6, maxReach: 2.25, maxRise: 1.5, footprint: .55 });
const up = new Vector3(0, 1, 0);
const bar = (a, b, radius = .025) => ({ a, b, radius });
export function barBounds(part) {
  return new Box3().setFromPoints([part.a, part.b]).expandByScalar(part.radius);
}
export function supportLayout(position, type = 'stand', angle = 0, reach = 1.5) {
  const mount = position.clone().add(new Vector3(0, -.16, 0));
  const offset = new Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(type === 'boom' ? reach : 0);
  const base = new Vector3(position.x + offset.x, 0, position.z + offset.z);
  const requestedHeight = mount.y - (type === 'boom' ? Math.min(.3, mount.y / 2) : 0);
  const height = Math.max(.02, requestedHeight);
  const pivot = base.clone().addScaledVector(up, height);
  const bars = [
    bar(base.clone().addScaledVector(up, Math.min(.05, height * .2)), base.clone().addScaledVector(up, height * .42), .04),
    bar(base.clone().addScaledVector(up, height * .42), base.clone().addScaledVector(up, height * .74), .032),
    bar(base.clone().addScaledVector(up, height * .74), pivot, .024),
  ];
  for (let i = 0; i < 3; i++) {
    const theta = angle + i * Math.PI * 2 / 3;
    const foot = base.clone().add(new Vector3(Math.cos(theta) * SUPPORT_LIMITS.footprint, .03, Math.sin(theta) * SUPPORT_LIMITS.footprint));
    bars.push(bar(base.clone().addScaledVector(up, Math.min(.4, height * .7)), foot));
  }
  let supported = requestedHeight >= SUPPORT_LIMITS.minHeight && requestedHeight <= SUPPORT_LIMITS.maxHeight;
  let end = pivot.clone();
  if (type === 'boom') {
    supported = height >= SUPPORT_LIMITS.minHeight && height <= SUPPORT_LIMITS.maxHeight && mount.y - height <= SUPPORT_LIMITS.maxRise && reach <= SUPPORT_LIMITS.maxReach;
    end = mount.clone();
    const direction = end.clone().sub(pivot).normalize();
    const counterEnd = pivot.clone().addScaledVector(direction, -.55);
    bars.push(bar(counterEnd, end, .03));
    bars.push(bar(counterEnd.clone().addScaledVector(up, -.09), counterEnd.clone().addScaledVector(up, .09), .11));
  }
  // The mounting spigot always joins the support to the lamp, including tall rigs.
  bars.push(bar(end, position.clone(), .04));
  const bounds = new Box3();
  bars.forEach(part => bounds.union(barBounds(part)));
  return { type, base, height, reach: type === 'boom' ? reach : 0, bars, bounds, supported, end, position: position.clone() };
}

export function cameraFrustum(camera) {
  camera.updateMatrixWorld(true);
  return new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
}

// Conservative intersection: do not assume a subject's bounding box is opaque.
// Small pieces reduce false positives from a diagonal boom's large axis-aligned box.
export function frameIntersectionLength(layout, frustum) {
  let length = 0;
  for (const part of layout.bars) {
    const distance = part.a.distanceTo(part.b), steps = Math.max(1, Math.ceil(distance / .15));
    for (let i = 0; i < steps; i++) {
      const piece = bar(part.a.clone().lerp(part.b, i / steps), part.a.clone().lerp(part.b, (i + 1) / steps), part.radius);
      if (frustum.intersectsBox(barBounds(piece))) length += distance / steps;
    }
  }
  return length;
}

export function chooseLightSupport(position, mode, camera, studio) {
  const frustum = cameraFrustum(camera);
  const assess = layout => {
    layout.outside = outsideStudio(layout.bounds.min, layout.bounds.max, studio);
    layout.frameLength = frameIntersectionLength(layout, frustum);
    layout.baseFrameLength = frameIntersectionLength({ bars: layout.bars.slice(0, 6) }, frustum);
    return layout;
  };
  const stand = assess(supportLayout(position));
  if (mode === 'stand' || (mode === 'auto' && !stand.outside && stand.frameLength === 0)) return stand;
  const candidates = mode === 'boom' ? [] : [stand];
  // Include larger crane arrangements when ordinary boom reach cannot clear a
  // wide shot. These still receive a typical-equipment warning, never a fake gap.
  for (const reach of [.75, 1.5, SUPPORT_LIMITS.maxReach, 3, 4, 5, 6]) {
    for (let i = 0; i < 16; i++) candidates.push(assess(supportLayout(position, 'boom', i * Math.PI / 8, reach)));
  }
  // A short visible stand must not beat an offset boom just because its TOTAL
  // visible tube length is smaller. Clear the mast and feet first; an arm or
  // lamp in the frame is reported separately rather than silently ignored.
  candidates.sort((a, b) => Number(a.outside) - Number(b.outside)
    || Number(a.frameLength > 0) - Number(b.frameLength > 0)
    || Number(a.baseFrameLength > 0) - Number(b.baseFrameLength > 0)
    || a.baseFrameLength - b.baseFrameLength
    || Number(!a.supported) - Number(!b.supported)
    || a.frameLength - b.frameLength
    || a.reach - b.reach);
  return candidates[0];
}
