// Offsets are in metres, relative to the current subject; +Z is the camera side.
export const lightingPresets = {
 three: {label:'Classic three-light', note:'Portrait starting point: key shapes the face, weaker fill lifts shadows, rear rim separates hair. Adjust for the face and pose.', portrait:true, ambient:0, lamps:[[-2,1.4,2.5,3,'soft',1],[2,.5,2.5,1,'soft',1.5],[1,1,-2,2,'soft',.6]]},
 two: {label:'Two-light: key + fill', note:'Products or portraits: broad key plus weaker fill reveal shape and shadow detail.', ambient:0, lamps:[[-2,2,2.5,3,'soft',1.2],[2,1,2,1.2,'soft',1.5]]},
 loop: {label:'Loop lighting', note:'Single key above and slightly to one side. Aim for a short nose shadow that does not join the cheek shadow. Needs detailed facial geometry.', portrait:true, ambient:0, lamps:[[-1,1,2.5,2,'hard',.6]]},
 rembrandt: {label:'Rembrandt lighting', note:'Single elevated side key. Adjust until a triangle of light remains on the shadow-side cheek. The basic mannequin cannot reproduce this reliably.', portrait:true, ambient:0, lamps:[[-2,1.5,2,2.5,'hard',.6]]},
 split: {label:'Split lighting', note:'Side key near face height divides the face into light and shadow. Rotate or reposition for the actual face.', portrait:true, ambient:0, lamps:[[-2.5,.1,0,2,'hard',.6]]},
 rim: {label:'Rim-light', note:'Rear-side light skims the outline. Front lights are off; adjust angle and power to avoid distracting bright edges.', portrait:true, beam:45, ambient:0, lamps:[null,null,[1.5,.8,-2,2.5,'hard',.6]]},
 top: {label:'Top light', note:'Light directly above emphasizes upper surfaces and downward shadows. Useful for exploring product form and dramatic portraits.', ambient:0, lamps:[[0,3,0,3,'soft',1]]},
 back: {label:'Backlight', note:'Light behind the subject, aimed toward it and the camera. Front lights are off. This lights edges, not the backdrop; transparent materials need additional rendering support.', portrait:true, beam:40, ambient:0, lamps:[null,null,[.6,.7,-2.5,3,'hard',.6]]}
};
export function buildLightingPreset(id, bounds, defaults) {
 const preset=lightingPresets[id]; if(!preset) throw new Error('Unknown lighting preset');
 const aim={x:(bounds.min.x+bounds.max.x)/2,y:bounds.min.y+(bounds.max.y-bounds.min.y)*(preset.portrait?.9:.5),z:(bounds.min.z+bounds.max.z)/2};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 aim.x=clamp(aim.x,-6,6); aim.y=clamp(aim.y,0,4); aim.z=clamp(aim.z,-6,6);
 const states=Object.fromEntries(['key','fill','hair'].map((name,i)=>{
 const lamp=preset.lamps[i]; const [x,y,z,power,source,size]=lamp||[0,2,3,1,'soft',.6];
 return [name,{enabled:!!lamp,mode:'studio',source,follow:false,customColour:false,colour:'#ffffff',values:{...defaults,
 'light-x':clamp(aim.x+x,-8,8),'light-y':clamp(aim.y+y,.2,10),'light-z':clamp(aim.z+z,-8,8),
 'light-aim-x':aim.x,'light-aim-y':aim.y,'light-aim-z':aim.z,'light-intensity':power,'light-size':size,'light-beam':preset.beam || 90,'light-temperature':5600,'light-fill':preset.ambient}}];
 })); return {states,ambient:preset.ambient};
}
