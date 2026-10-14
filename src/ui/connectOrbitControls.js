import {orbitCoordinates,orbitPlacement} from '../scene/subjectOrbit.js';

// These controls derive from saved X/Z values, so older projects need no migration.
export function connectOrbitControls({parent,prefix,position,center,change}) {
  const controls={},labels={},sliders={};let signature='',lastAngle=0;
  for(const [key,label,min,max,step] of [['angle','Orbit around subject (°)',-180,180,1],['radius','Distance from subject (m)',0,23,.05]]){
    const wrapper=document.createElement('label');wrapper.textContent=label;
    const input=document.createElement('input'),slider=document.createElement('input');
    input.type='number';slider.type='range';input.id=prefix+'-'+key;slider.id=input.id+'-slider';
    for(const el of [input,slider]){el.min=min;el.max=max;el.step=el===input?'any':step;el.dataset.orbitControl='true';el.setAttribute('aria-label',label);}
    input.dataset.help=key==='angle'?'Orbit around the subject horizontally. 0° is studio front (+Z), 90° is right (+X). Height stays unchanged.':'Horizontal distance from the subject centre. Travel stops at the placement boundary; height stays unchanged.';
    const apply=el=>{
      if(el.value===''||!el.checkValidity())return;
      const p=position(),c=center(),current=orbitCoordinates(p,c);
      const angle=key==='angle'?Number(el.value):(current.radius>1e-8?current.angle:lastAngle);
      const radius=key==='radius'?Number(el.value):current.radius;
      lastAngle=angle;
      change(orbitPlacement(p,c,angle,radius),angle,current.radius>1e-8?current.angle:angle);
      signature='';sync();
    };
    input.addEventListener('input',()=>apply(input));slider.addEventListener('input',()=>apply(slider));
    input.addEventListener('blur',()=>{signature='';sync();});
    wrapper.append(input,slider);parent.append(wrapper);controls[key]=input;labels[key]=wrapper;sliders[key]=slider;
  }
  function sync(){
    const p=position(),c=center(),next=[p.x,p.z,c.x,c.z].join(',');if(next===signature)return;signature=next;
    const {angle,radius}=orbitCoordinates(p,c);if(radius>1e-8)lastAngle=angle;
    controls.angle.value=sliders.angle.value=lastAngle.toFixed(1);
    controls.radius.value=sliders.radius.value=radius.toFixed(3);
  }
  return {sync,labels};
}
