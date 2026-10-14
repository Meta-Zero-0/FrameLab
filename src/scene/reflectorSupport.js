import {Group,Mesh,CylinderGeometry,SphereGeometry,MeshStandardMaterial,Vector3} from 'three';
export function orbitReflector(values,center,degrees,radius) {
 const a=degrees*Math.PI/180,dx=Math.sin(a),dz=Math.cos(a);
 let reach=Math.max(0,radius);
 for(const [c,d] of [[center.x,dx],[center.z,dz]])if(Math.abs(d)>1e-8)reach=Math.min(reach,Math.max(0,((d>0?5:-5)-c)/d));
 const old=Math.atan2(values.x-center.x,values.z-center.z)*180/Math.PI;
 return {x:center.x+dx*reach,z:center.z+dz*reach,yaw:((values.yaw+degrees-old+540)%360+360)%360-180};
}
export function createReflectorSupport(scene) {
 const group=new Group();group.name='Reflector stand';scene.add(group);
 const material=new MeshStandardMaterial({color:'#424a4f',metalness:.55,roughness:.5});
 const geometry=new CylinderGeometry(1,1,1,8);
 const rods=Array.from({length:5},()=>{const m=new Mesh(geometry,material);m.castShadow=m.receiveShadow=true;group.add(m);return m;});
 const clamp=new Mesh(new SphereGeometry(.045,10,8),material);clamp.castShadow=clamp.receiveShadow=true;group.add(clamp);
 const up=new Vector3(0,1,0);
 function rod(mesh,a,b,r){const delta=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(r,delta.length(),r);mesh.quaternion.setFromUnitVectors(up,delta.normalize());}
 function update(board){
  group.visible=board.visible;if(!group.visible)return;
  board.updateMatrixWorld(true);
  const mount=new Vector3(0,-.5,-.035/board.scale.x).applyMatrix4(board.matrixWorld);
  const base=new Vector3(mount.x,.045,mount.z),joint=base.clone().lerp(mount,.58);
  rod(rods[0],base,joint,.024);rod(rods[1],joint,mount,.017);clamp.position.copy(mount);
  for(let i=0;i<3;i++){const angle=i*Math.PI*2/3;rod(rods[i+2],new Vector3(base.x,Math.min(.25,mount.y*.6),base.z),new Vector3(base.x+Math.cos(angle)*.32,.025,base.z+Math.sin(angle)*.32),.017);}
 }
 return {group,update};
}
