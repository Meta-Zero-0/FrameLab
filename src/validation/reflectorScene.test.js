import {it,expect,vi,afterEach} from 'vitest';
import {Scene,Mesh,BoxGeometry,PlaneGeometry,MeshStandardMaterial,DirectionalLight,PerspectiveCamera,Vector3,Matrix3} from 'three';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';
import {createStudioEmitter} from '../scene/createStudioEmitter.js';
import {createLightEquipment} from '../scene/createLightEquipment.js';
import {createReflectorSupport} from '../scene/reflectorSupport.js';
import {defaultReflector} from '../scene/reflectorState.js';
afterEach(()=>vi.unstubAllGlobals());
it.each([{name:'existing default',x:1.2,z:1.2,pitch:-55},{name:'closer low fill',x:.85,z:.85,pitch:-25},{name:'hair light front fill',x:0,y:.4,z:1.3,yaw:180,pitch:-65,hair:true},{name:'hair light reverse white face',x:0,y:.4,z:1.3,yaw:0,pitch:65,hair:true}])('delivers bounce through the complete scene: $name',async placement=>{
 const scene=new Scene(),mat=new MeshStandardMaterial();
 const cube=new Mesh(new TessellateModifier(.15,3).modify(new BoxGeometry(1,1,1)),mat);cube.position.y=.5;scene.add(cube);
 const floor=new Mesh(new PlaneGeometry(12,12),mat);floor.rotation.x=-Math.PI/2;scene.add(floor);
 const key=new DirectionalLight();key.position.set(...(placement.hair?[0,4,-2]:[-3,2,4]));key.target.position.set(0,.5,0);scene.add(key,key.target);
 const state={enabled:true,mode:'studio',source:'soft',support:'auto',values:{'light-size':.6,'light-beam':90,'light-intensity':3}};
 const emitter=createStudioEmitter(scene);emitter.update(key,state);
 const camera=new PerspectiveCamera(27,1.5,.1,100);camera.position.set(0,1.2,5);camera.lookAt(0,.5,0);
 createLightEquipment(scene,camera).update({key},{key:state});
 const r={...defaultReflector,...placement},board=new Mesh(new PlaneGeometry(1,1),mat);board.position.set(r.x,r.y,r.z);board.rotation.set(r.pitch*Math.PI/180,r.yaw*Math.PI/180,0,'YXZ');scene.add(board);createReflectorSupport(scene).update(board);
 scene.updateMatrixWorld(true);const triangles=[];
 scene.traverseVisible(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,index=o.geometry.index,count=index?index.count:p.count;for(let i=0;i<count;i+=3){const t=[];for(let k=0;k<3;k++)t.push(...new Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(o.matrixWorld).toArray());triangles.push(t);}});
 const p=cube.geometry.attributes.position,n=cube.geometry.attributes.normal,m=new Matrix3().getNormalMatrix(cube.matrixWorld),positions=[],normals=[];
 for(let i=0;i<p.count;i++){positions.push(...new Vector3().fromBufferAttribute(p,i).applyMatrix4(cube.matrixWorld).toArray());normals.push(...new Vector3().fromBufferAttribute(n,i).applyMatrix3(m).normalize().toArray());}
 const postMessage=vi.fn();vi.stubGlobal('self',{postMessage});vi.resetModules();await import('../experiments/meshBounce.worker.js');
 self.onmessage({data:{triangles,receivers:[{id:'cube',positions,normals}],lights:emitter.samples.map(l=>({position:l.position.toArray(),target:l.target.position.toArray(),intensity:l.intensity,angle:l.angle,penumbra:l.penumbra,color:[1,1,1]})),board:{center:[r.x,r.y,r.z],size:r.size,yaw:r.yaw*Math.PI/180,pitch:r.pitch*Math.PI/180,reflectance:r.reflectance,twoSided:true,divisions:4}}});
 const result=postMessage.mock.calls.at(-1)[0];expect(result.error).toBeUndefined();
 const maximum=Math.max(...result.results[0].values);let front=0;for(let i=0;i<normals.length;i+=3)if(normals[i+2]>.9)front=Math.max(front,result.results[0].values[i]);expect(maximum).toBeGreaterThan(.001);if(placement.name==='closer low fill')expect(front).toBeGreaterThan(.15);
 if(placement.hair)expect(front).toBeGreaterThan(.01);
});
