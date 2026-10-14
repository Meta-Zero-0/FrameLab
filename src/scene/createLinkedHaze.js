import {Mesh,PlaneGeometry,ShaderMaterial,Color,Vector3,AdditiveBlending,DoubleSide} from 'three';
// Local depth-tested haze approximation; no extra lamp or shadow texture.
export function createLinkedHaze(scene) {
 const material=new ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide,
 uniforms:{tint:{value:new Color()},strength:{value:0},axis:{value:new Vector3()},origin:{value:new Vector3()},spread:{value:1}},
 vertexShader:'varying vec2 coord; void main(){coord=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:'varying vec2 coord; uniform vec3 tint; uniform float strength; uniform vec3 axis; uniform vec3 origin; uniform float spread; void main(){float r=length(coord);float profile=exp(-5.0*r*r)*(1.0-smoothstep(.65,1.0,r));float facing=smoothstep(cos(spread),1.0,dot(normalize(cameraPosition-origin),axis));gl_FragColor=vec4(tint*strength,profile*facing);}'});
 const mesh=new Mesh(new PlaneGeometry(2,2),material);mesh.name='Background linked haze';mesh.layers.set(2);mesh.frustumCulled=false;scene.add(mesh);
 const direction=new Vector3();
 function update(light,state) {
  const power=state.values['light-intensity'];mesh.visible=state.enabled && power>0;
  direction.subVectors(light.target.position,light.position).normalize();
  mesh.position.copy(light.position).addScaledVector(direction,.1);mesh.quaternion.setFromUnitVectors(new Vector3(0,0,1),direction);
  const angle=state.values['light-beam']*Math.PI/360;
  mesh.scale.setScalar(Math.max(.15,Math.tan(angle)*4));
  material.uniforms.tint.value.copy(light.color);material.uniforms.strength.value=power*.1;
  material.uniforms.axis.value.copy(direction);material.uniforms.origin.value.copy(light.position);material.uniforms.spread.value=angle;
 }
 return {update,mesh};
}
