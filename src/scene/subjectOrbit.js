export function orbitCoordinates(position, center) {
  const x=position.x-center.x,z=position.z-center.z;
  return {angle:Math.atan2(x,z)*180/Math.PI,radius:Math.hypot(x,z)};
}
export function orbitPlacement(position, center, angle, radius, limit=8) {
  const radians=angle*Math.PI/180,dx=Math.sin(radians),dz=Math.cos(radians);
  let reach=Math.max(0,radius);
  for(const [c,d] of [[center.x,dx],[center.z,dz]])if(Math.abs(d)>1e-8)reach=Math.min(reach,Math.max(0,((d>0?limit:-limit)-c)/d));
  return {x:Math.max(-limit,Math.min(limit,center.x+dx*reach)),z:Math.max(-limit,Math.min(limit,center.z+dz*reach))};
}
export function orbitYaw(yaw, previousAngle, angle) {
  return ((yaw+angle-previousAngle+180)%360+360)%360-180;
}
