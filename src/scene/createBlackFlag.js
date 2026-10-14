import {Mesh,PlaneGeometry,MeshStandardMaterial,DoubleSide} from 'three';
import {createReflectorSupport} from './reflectorSupport.js';
import {defaultFlag,validateFlag} from './flagState.js';

export function createBlackFlag(scene) {
  const panel=new Mesh(new PlaneGeometry(1,1),new MeshStandardMaterial({color:'#080808',roughness:1,side:DoubleSide,shadowSide:DoubleSide}));
  panel.name='Black flag';panel.castShadow=panel.receiveShadow=true;scene.add(panel);
  const support=createReflectorSupport(scene);support.group.name='Black flag stand';
  let state;
  function apply(value) {
    state=validateFlag(value);
    // Keep the lower edge and its stand mount above the floor as the panel tilts.
    state.y=Math.max(state.y,state.height*.5*Math.abs(Math.cos(state.pitch*Math.PI/180))+.12);
    panel.visible=state.enabled;panel.position.set(state.x,state.y,state.z);
    panel.rotation.set(state.pitch*Math.PI/180,state.yaw*Math.PI/180,0,'YXZ');
    panel.scale.set(state.width,state.height,state.width);
    panel.updateMatrixWorld(true);support.update(panel);
    return {...state};
  }
  apply(defaultFlag);
  return {panel,support,apply,snapshot:()=>({...state}),reset:()=>apply(defaultFlag)};
}
