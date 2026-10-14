import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { illuminateBoard,bouncedIrradiance } from './diffuseBounce.js';

const $=id=>document.getElementById(id),number=id=>Number($(id).value);
try {
 const renderer=new THREE.WebGLRenderer({canvas:$('arrangement'),antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 const scene=new THREE.Scene();scene.background=new THREE.Color('#dce3dc');
 const camera=new THREE.PerspectiveCamera(45,1,.1,40);camera.position.set(5,4,6);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.2,1);controls.update();
 scene.add(new THREE.GridHelper(8,8));
 function mesh(geometry,color){const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));scene.add(m);return m;}
 const board=mesh(new THREE.PlaneGeometry(1,1),'#ffffff');board.position.set(0,1.2,0);
 const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),board.position,.6,0x35634d);scene.add(arrow);
 const lamp=mesh(new THREE.SphereGeometry(.09,16,12),'#dc9a20');lamp.position.set(-2,3,2);
 const receiver=mesh(new THREE.PlaneGeometry(1.6,1.6),'#777777');receiver.position.set(0,1.2,2);
 const blocker=mesh(new THREE.BoxGeometry(1,1,1),'#303632');
 const fill=$('fill'),ctx=fill.getContext('2d');
 const preview=document.createElement('canvas');preview.width=preview.height=32;const pixels=preview.getContext('2d');
 const texture=new THREE.CanvasTexture(preview);texture.colorSpace=THREE.SRGBColorSpace;receiver.material.map=texture;receiver.material.color.set('#ffffff');
 function draw(){renderer.render(scene,camera);}
 controls.addEventListener('change',draw);
 const observer=new ResizeObserver(()=>{const c=renderer.domElement;renderer.setSize(c.clientWidth,c.clientHeight,false);camera.aspect=c.clientWidth/c.clientHeight;camera.updateProjectionMatrix();draw();});observer.observe(renderer.domElement);
 function calculate() {
  const start=performance.now(),yaw=number('yaw')*Math.PI/180,distance=number('distance'),size=number('size');
  board.scale.set(size,size,1);board.rotation.y=yaw;board.material.color.setScalar(number('rho'));
  arrow.setDirection(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)));receiver.position.z=distance;
  const incoming=$('blocker').value==='incoming';blocker.visible=$('blocker').value!=='none';
  blocker.position.set((incoming?-1:0)+number('offset'),incoming?2.1:1.2,incoming?1:distance/2);
  blocker.scale.set(incoming?.8:.45,incoming?.8:.65,.12);blocker.updateMatrixWorld();
  const bounds=new THREE.Box3().setFromObject(blocker),boxes=blocker.visible?[{min:bounds.min.toArray(),max:bounds.max.toArray()}]:[];
  const patches=illuminateBoard({size,yaw,reflectance:number('rho'),divisions:number('samples'),light:{position:lamp.position.toArray(),target:[0,1.2,0],intensity:number('power'),angle:Math.PI/4},blockers:boxes});
  const image=pixels.createImageData(32,32);let sum=0,max=0;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
   const e=bouncedIrradiance([((x+.5)/32-.5)*1.6,1.2+(.5-(y+.5)/32)*1.6,distance],[0,0,-1],patches,boxes);
   sum+=e;max=Math.max(max,e);
   // Fixed visualization curve, never normalize to each image's maximum.
   const value=Math.round(255*new THREE.Color().setRGB(1-Math.exp(-e*2),0,0).convertLinearToSRGB().r);
   const i=(y*32+x)*4;image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;
  }
  pixels.putImageData(image,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(preview,0,0,320,320);texture.needsUpdate=true;
  $('metrics').textContent=`Mean bounced illumination: ${(sum/1024).toFixed(4)} lx · Peak: ${max.toFixed(4)} lx · ${patches.length} board patches × 1,024 receiver points · CPU calculation: ${(performance.now()-start).toFixed(1)} ms`;
  for(const [id,suffix] of [['power',' cd'],['rho',''],['yaw','°'],['size',' m'],['distance',' m'],['offset',' m']])$(id+'-value').textContent=$(id).value+suffix;
  draw();
 }
 let pending;
 document.querySelectorAll('input,select').forEach(input=>input.addEventListener('input',()=>{clearTimeout(pending);pending=setTimeout(calculate,80);}));
 calculate();
}catch(error){$('error').hidden=false;$('error').textContent='Experiment could not start: '+error.message;console.error(error);}
