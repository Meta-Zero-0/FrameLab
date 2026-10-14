// Points are in the camera-oriented basis, relative to the subject target.
// Positive z points toward the camera. Occupancy is a fraction of image size.
export function frameOccupancy(points, focalLength, distance, sensor = {width:36,height:24}) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    const depth = distance - p.z;
    if (depth <= 0) return { width: Infinity, height: Infinity, size: Infinity };
    const x = p.x * focalLength / (sensor.width / 2 * depth);
    const y = p.y * focalLength / (sensor.height / 2 * depth);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const width = (maxX - minX) / 2, height = (maxY - minY) / 2;
  return { width, height, size: Math.max(width, height) };
}
export function distanceForFraming(points, focalLength, targetOccupancy, limits = { min: 0.5, max: 40 }, sensor = {width:36,height:24}) {
  if (!Number.isFinite(targetOccupancy) || targetOccupancy <= 0 || !points.length) {
    throw new RangeError('A non-empty subject and positive occupancy are required.');
  }
  let low = Math.max(limits.min, ...points.map(p => p.z + 0.06));
  let high = limits.max;
  if (frameOccupancy(points, focalLength, high, sensor).size > targetOccupancy) {
    return { distance: high, limited: true };
  }
  if (frameOccupancy(points, focalLength, low, sensor).size < targetOccupancy) {
    return { distance: low, limited: true };
  }
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (frameOccupancy(points, focalLength, mid, sensor).size > targetOccupancy) low = mid;
    else high = mid;
  }
  return { distance: (low + high) / 2, limited: false };
}