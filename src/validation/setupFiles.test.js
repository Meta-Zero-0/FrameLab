import {it,expect,vi,afterEach} from 'vitest';
import {validateSetup,validateProject} from '../ui/connectSetupFiles.js';
import {defaultReflector,validateReflector} from '../scene/reflectorState.js';
import {defaultFlag} from '../scene/flagState.js';
const numeric={'subject-height':['.05','3','1'],'subject-x':['-4','4','0'],'subject-z':['-4','4','0'],'subject-yaw':['-180','180','0'],'focal-length':['18','200','50'],'camera-distance':['.5','40','5'],'focus-distance':['.5','60','5']};
const selects={'subject-type':['cube','human','import'],'subject-pose':['standing','seated'],'subject-region':['full','head'],'aperture':['2.8','8']};
const flags=['maintain-framing','follow-focus','visual-blur','show-grid','show-camera-guides','show-focus-plane','show-dof-guides','show-prop-labels'];
function fixture(){
 const els={},fields={};
 for(const [id,[min,max,value]] of Object.entries(numeric)){els[id]={type:'number',min,max};fields[id]=value;}
 for(const [id,values] of Object.entries(selects)){els[id]={tagName:'SELECT',options:values.map(value=>({value}))};fields[id]=values[0];}
 for(const id of flags){els[id]={type:'checkbox'};fields[id]=false;}
 vi.stubGlobal('document',{getElementById:id=>els[id],querySelectorAll:()=>[{id:'light-intensity',min:'0',max:'10'}]});
 const lights=Object.fromEntries(['key','fill','hair','background'].map(name=>[name,{mode:'studio',source:'hard',colour:'#ffffff',enabled:false,follow:false,customColour:false,values:{'light-intensity':3}}]));
 return {format:'FrameLab',version:1,fields,lights,target:[0,.5,0],overview:{position:[4,4,4],target:[0,0,0]},props:[true,true,true],markers:true,lock:{points:Array.from({length:8},()=>[0,0,0]),occupancy:.78}};
}
afterEach(()=>vi.unstubAllGlobals());
it('saves black flag placement independently in projects and shots with legacy off',()=>{
 const data=fixture();expect(validateSetup(data).blackFlag.enabled).toBe(false);
 data.blackFlag={...defaultFlag,enabled:true,x:2,pitch:25};
 const result=validateProject(JSON.parse(JSON.stringify({...data,shots:[{id:'flag',name:'Cut spill',setup:data}]})));
 expect(result.blackFlag).toEqual(data.blackFlag);expect(result.shots[0].setup.blackFlag).toEqual(data.blackFlag);
 data.blackFlag.width=-1;expect(()=>validateSetup(data)).toThrow(/flag/);
});
it('preserves independent softbox rotation in saved lights and shots, accepting legacy setups',()=>{
 const data=fixture();expect(validateSetup(data).lights.key.modifierRotation).toBeUndefined();
 data.lights.key.modifierRotation=90;data.lights.fill.modifierRotation=-45;
 const result=validateProject(JSON.parse(JSON.stringify({...data,shots:[{id:'a',name:'Rotated strip',setup:data}]})));
 expect(result.shots[0].setup.lights.key.modifierRotation).toBe(90);
 expect(result.lights.fill.modifierRotation).toBe(-45);
 for(const angle of [181,-181,Infinity,NaN,'90',null]){
   data.lights.key.modifierRotation=angle;expect(()=>validateSetup(data)).toThrow(/rotation/);
 }
});
it('round-trips modifier shapes in projects and rejects unknown shapes',()=>{
 const data=fixture();
 expect(validateSetup(data).lights.key.modifier).toBeUndefined();
 data.lights.key.modifier='strip';
 const result=validateProject(JSON.parse(JSON.stringify({...data,shots:[{id:'a',name:'Strip portrait',setup:data}]})));
 expect(result.shots[0].setup.lights.key.modifier).toBe('strip');
 data.lights.key.modifier='unknown';expect(()=>validateSetup(data)).toThrow(/modifier/);
});
it('preserves camera tilt in named shots and supports older setups',()=>{
 const setup=fixture();expect(validateSetup(setup).cameraTilt).toBeUndefined();
 setup.cameraTilt=-25;
 const project=validateProject(JSON.parse(JSON.stringify({...setup,shots:[{id:'tilted',name:'Low angle',setup}]})));
 expect(project.cameraTilt).toBe(-25);expect(project.shots[0].setup.cameraTilt).toBe(-25);
 for(const cameraTilt of [86,-86,Infinity,null,'25'])expect(()=>validateSetup({...setup,cameraTilt})).toThrow(/tilt/);
});
it('preserves reflector placement in projects and named shots with legacy defaults',()=>{
 const setup=fixture();expect(validateSetup(setup).reflector.enabled).toBe(false);
 setup.reflector={...defaultReflector,enabled:true,x:2,pitch:25,quality:8};
 const project=validateProject(JSON.parse(JSON.stringify({...setup,shots:[{id:'one',name:'Reflector portrait',setup}],activeShotId:'one'})));
 expect(project.reflector).toEqual(setup.reflector);
 expect(project.shots[0].setup.reflector).toEqual(setup.reflector);
 expect(()=>validateReflector({...defaultReflector,reflectance:1.1})).toThrow();
 expect(()=>validateReflector({...defaultReflector,pitch:Infinity})).toThrow();
 expect(()=>validateReflector({...defaultReflector,enabled:'true'})).toThrow();
 expect(()=>validateReflector({...defaultReflector,quality:999})).toThrow();
});
it('loads legacy setups and round-trips independently editable named shots',()=>{
 const data=fixture();expect(validateProject(data).shots).toEqual([]);
 const second=structuredClone(data);second.fields['focal-length']='85';
 const project=JSON.parse(JSON.stringify({...data,shots:[{id:'a',name:'Portrait A',setup:data},{id:'b',name:'Portrait B',setup:second}],activeShotId:'b'}));
 const result=validateProject(project);
 expect(result.activeShotId).toBe('b');expect(result.shots[1].setup.fields['focal-length']).toBe('85');
 result.shots[0].setup.fields['focal-length']='35';
 expect(result.shots[1].setup.fields['focal-length']).toBe('85');
});
it('rejects malformed shot collections before any scene is restored',()=>{
 const data=fixture(),shot={id:'a',name:'A',setup:structuredClone(data)};
 expect(()=>validateProject({...data,shots:[shot,shot]})).toThrow(/identifier/);
 expect(()=>validateProject({...data,shots:[shot],activeShotId:'missing'})).toThrow(/missing/);
 expect(()=>validateProject({...data,shots:[{...shot,name:' '}]})).toThrow(/name/);
 expect(()=>validateProject({...data,shots:[{...shot,setup:{...shot.setup,shots:[]}}]})).toThrow(/Nested/);
 shot.setup.fields['focal-length']='999';
 expect(()=>validateProject({...data,shots:[shot]})).toThrow(/focal-length/);
});
it('round-trips support choices, accepts legacy lights and rejects invalid support types',()=>{
 const data=fixture();expect(validateSetup(data).lights.key.support).toBeUndefined();
 data.lights.key.support='boom';expect(validateSetup(JSON.parse(JSON.stringify(data))).lights.key.support).toBe('boom');
 data.lights.key.support='unlimited';expect(()=>validateSetup(data)).toThrow(/support/);
});
it('round-trips supported settings and ignores unknown restore fields',()=>{const data=fixture();data.fields['not-a-control']='bad';data.lights.extra={};const result=validateSetup(JSON.parse(JSON.stringify(data)));expect(result.fields['not-a-control']).toBeUndefined();expect(result.lights.extra).toBeUndefined();expect(result.lights.key).toEqual(data.lights.key);});
it('rejects invalid versions, numeric limits and missing embedded models',()=>{const data=fixture();data.version=2;expect(()=>validateSetup(data)).toThrow();data.version=1;data.fields['focal-length']='Infinity';expect(()=>validateSetup(data)).toThrow();data.fields['focal-length']='50';data.fields['subject-type']='import';expect(()=>validateSetup(data)).toThrow(/GLB/);});
it('rejects invalid lighting and framing references before restore',()=>{const data=fixture();data.lights.background.source='soft';expect(()=>validateSetup(data)).toThrow(/Background/);data.lights.background.source='hard';data.lock.occupancy=0;expect(()=>validateSetup(data)).toThrow(/framing/);});
