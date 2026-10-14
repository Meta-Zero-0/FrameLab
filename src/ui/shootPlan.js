import {lightModifiers,modifierDimensions} from '../scene/lightModifiers.js';
import {noteLabels,validateShotNotes} from '../scene/shotNotes.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=value=>Number(value).toFixed(2);
const xyz=p=>p.map(n).join(', ');
const row=values=>'<tr>'+values.map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>';
const table=(head,rows)=>'<table><thead>'+row(head)+'</thead><tbody>'+rows.map(row).join('')+'</tbody></table>';

export function makeShootPlan(data) {
  const notes=Object.entries(validateShotNotes(data.notes)).filter(([,text])=>text.trim());
  const notesHtml=notes.length?'<section class="shoot-notes"><h2>Shoot notes</h2>'+notes.map(([key,text])=>'<h3>'+escape(noteLabels[key])+'</h3><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+escape(text)+'</p>').join('')+'</section>':'';
  const {studio,camera,subject}=data;
  const lights=Object.entries(data.lights).filter(([,s])=>s.enabled).map(([id,s])=>({id,state:s,position:[s.values['light-x'],s.values['light-y'],s.values['light-z']],aim:s.follow?data.aim:[s.values['light-aim-x'],s.values['light-aim-y'],s.values['light-aim-z']]}));
  const panels=[...data.reflectors.filter(i=>i.state.enabled).map((i,k)=>({...i,code:'R'+(k+1),kind:'White reflector'})),...data.flags.filter(i=>i.state.enabled).map((i,k)=>({...i,code:'F'+(k+1),kind:'Black flag'}))];
  const lightCodes={key:'K',fill:'L',hair:'H',background:'B'};
  const points=[[-studio.width/2,0,-studio.depth/2],[studio.width/2,0,studio.depth/2],camera.position,subject.min,subject.max,...lights.map(l=>l.position),...Object.values(data.supports).map(s=>s.base)];
  for(const {state:s} of panels){const r=(s.size||Math.max(s.width,s.height))/2;points.push([s.x-r,s.y,s.z-r],[s.x+r,s.y,s.z+r]);}
  const minX=Math.min(...points.map(p=>p[0]))-1,maxX=Math.max(...points.map(p=>p[0]))+1,minZ=Math.min(...points.map(p=>p[2]))-1,maxZ=Math.max(...points.map(p=>p[2]))+1;
  const scale=Math.min(800/(maxX-minX),480/(maxZ-minZ)),offsetX=(900-(maxX-minX)*scale)/2,offsetY=(580-(maxZ-minZ)*scale)/2;
  const point=p=>[offsetX+(p[0]-minX)*scale,offsetY+(p[2]-minZ)*scale];
  const line=(a,b,style='')=>{const p=point(a),q=point(b);return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" ${style}/>`;};
  const badge=(position,label,color)=>{const [x,y]=point(position);return `<g><circle cx="${x}" cy="${y}" r="13" fill="${color}" stroke="white" stroke-width="2"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${escape(label)}</text></g>`;};
  const rect=(a,b,attrs)=>{const p=point(a),q=point(b);return `<rect x="${p[0]}" y="${p[1]}" width="${q[0]-p[0]}" height="${q[1]-p[1]}" ${attrs}/>`;};
  let svg=rect([-studio.width/2,0,-studio.depth/2],[studio.width/2,0,studio.depth/2],'fill="#fafaf7" stroke="#65736b" stroke-width="2"');
  const step=Math.max(studio.width,studio.depth)>20?2:1;
  for(let x=Math.ceil(-studio.width/2/step)*step;x<=studio.width/2;x+=step)svg+=line([x,0,-studio.depth/2],[x,0,studio.depth/2],'stroke="#e2e7e2"');
  for(let z=Math.ceil(-studio.depth/2/step)*step;z<=studio.depth/2;z+=step)svg+=line([-studio.width/2,0,z],[studio.width/2,0,z],'stroke="#e2e7e2"');
  svg+=line([-studio.width/2,0,-studio.depth/2],[studio.width/2,0,-studio.depth/2],'stroke="#65736b" stroke-width="5"');
  svg+=rect(subject.min,subject.max,'fill="#d4c3b0" stroke="#745c45"');
  svg+=line(camera.position,camera.target,'stroke="#246f9b" stroke-width="2" stroke-dasharray="7 4"');
  for(const light of lights){
    svg+=line(light.position,light.aim,'stroke="#b78a25" stroke-width="1.5" stroke-dasharray="5 4"');
    const support=data.supports[light.id];if(support){const p=point(support.base);svg+=line(support.base,light.position,'stroke="#68727b"');svg+=`<circle cx="${p[0]}" cy="${p[1]}" r="${.55*scale}" fill="none" stroke="#68727b" stroke-dasharray="2 3"/>`;}
  }
  for(const panel of panels){
    const s=panel.state,w=s.size||s.width,h=s.size||s.height,a=s.yaw*Math.PI/180,t=s.pitch*Math.PI/180;
    const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([u,v])=>point([s.x+u*w*Math.cos(a)+v*h*Math.sin(a)*Math.sin(t),s.y,s.z-u*w*Math.sin(a)+v*h*Math.cos(a)*Math.sin(t)]).join(','));
    svg+=`<polygon points="${corners.join(' ')}" fill="${panel.kind==='Black flag'?'#343b40':'#e4f1dc'}" stroke="#465149" stroke-width="3"/>`;
    const base=[s.x-h*.5*Math.sin(a)*Math.sin(t)-.035*Math.sin(a)*Math.cos(t),0,s.z-h*.5*Math.cos(a)*Math.sin(t)-.035*Math.cos(a)*Math.cos(t)],p=point(base);
    svg+=`<circle cx="${p[0]}" cy="${p[1]}" r="${.32*scale}" fill="none" stroke="#68727b" stroke-dasharray="2 3"/>`;
    svg+=badge([s.x,s.y,s.z],panel.code,panel.kind==='Black flag'?'#343b40':'#457544');
  }
  svg+=badge(camera.position,'C','#246f9b')+badge(subject.min.map((v,i)=>(v+subject.max[i])/2),'S','#745c45');
  for(const light of lights)svg+=badge(light.position,lightCodes[light.id],'#a47313');
  const origin=point([0,0,0]);svg+=`<path d="M${origin[0]-4} ${origin[1]}h8 M${origin[0]} ${origin[1]-4}v8" stroke="#65736b"/>`;
  svg+=`<text x="450" y="18" text-anchor="middle" font-size="13">REAR / −Z · backdrop</text><text x="450" y="570" text-anchor="middle" font-size="13">FRONT / +Z · +X to the right · grid ${step} m</text>`;
  const cameraRows=[['Position X, Y, Z (m)',xyz(camera.position)],['Aim target X, Y, Z (m)',xyz(camera.target)],['Lens / sensor',`${camera.focal} mm / ${camera.orientation==='portrait'?'24 × 36':'36 × 24'} mm (${camera.orientation})`],['Aperture / focus',`f/${camera.aperture} / ${n(camera.focus)} m`],['Height / tilt',`${n(camera.position[1])} m / ${n(camera.tilt)}°`],['Distance to aim target',`${n(camera.distance)} m`]];
  const lightRows=lights.map(({id,state:s,position,aim})=>{
    const v=s.values,d=modifierDimensions(v['light-size'],s.modifier),support=data.supports[id];
    return [lightCodes[id],s.name||id,xyz(position),xyz(aim),s.mode==='directional'?'Directional':s.source==='soft'?`${lightModifiers[s.modifier||'square'].label}; ${n(d.width)} × ${n(d.height)} m; roll ${s.modifierRotation||0}°`:'Hard source',`${v['light-intensity']} units; ${s.colour}; beam ${v['light-beam']}°`,support?`${support.type}; base ${xyz(support.base)} m; mast ${n(support.height)} m; reach ${n(support.reach)} m`:'No physical fixture'];
  });
  const panelRows=panels.map(p=>{const s=p.state;return [p.code,p.name,p.kind,xyz([s.x,s.y,s.z]),s.size?`${n(s.size)} × ${n(s.size)}`:`${n(s.width)} × ${n(s.height)}`,`${s.yaw}° / ${s.pitch}°`,s.reflectance===undefined?'—':`${Math.round(s.reflectance*100)}%`];});
  const warnings=Object.entries(data.supports).flatMap(([id,s])=>[s.outside?`${data.lights[id]?.name||id}: equipment extends outside studio.`:'',!s.supported?`${data.lights[id]?.name||id}: support exceeds typical dimensions.`:''].filter(Boolean));
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(data.title)} — FrameLab shoot plan</title><style>
  *{box-sizing:border-box}body{font:14px system-ui,sans-serif;color:#20332b;background:#e9ece7;margin:0}main{max-width:1100px;margin:20px auto;background:white;padding:32px}h1{font-size:28px;margin:0 0 6px}h2{font-size:18px;margin:22px 0 10px}p{line-height:1.5}.meta,.note{color:#53655b;font-size:12px}svg{display:block;width:100%;max-height:570px;border:1px solid #d7ddd7}table{width:100%;border-collapse:collapse;font-size:11px;margin:10px 0;table-layout:fixed}td{border:1px solid #d7ddd7;padding:7px;vertical-align:top;overflow-wrap:anywhere}thead{font-weight:bold;background:#eef3eb}tr{break-inside:avoid}.camera{max-width:700px}.toolbar{padding:14px;text-align:center}button{padding:10px 18px;border:1px solid #738d7c;border-radius:6px;background:white;cursor:pointer}.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12px}.legend span{overflow-wrap:anywhere;max-width:100%}.warning{color:#87521d}@page{size:A4 landscape;margin:12mm}@media print{body{background:white}main{padding:0;margin:0;max-width:none}.toolbar{display:none}.schedule{break-before:page}svg{max-height:145mm}.meta{margin:4px 0}h1{font-size:23px}h2{margin:12px 0 6px}table{font-size:9px}td{padding:5px}thead{display:table-header-group}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div><main><h1>${escape(data.title)}</h1><p class="meta">FrameLab shoot plan · ${escape(data.date)} · Current setup</p><p class="meta">Studio ${n(studio.width)} × ${n(studio.depth)} m · height ${n(studio.height)} m · floor ${escape(studio.floorColour)} · backdrop ${escape(studio.wallColour)}</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="Scaled overhead equipment layout">${svg}</svg><div class="legend"><span><b>C</b> Camera</span><span><b>S</b> Subject</span>${lights.map(l=>`<span><b>${lightCodes[l.id]}</b> ${escape(l.state.name||l.id)}</span>`).join('')}${panels.map(p=>`<span><b>${p.code}</b> ${escape(p.name)}</span>`).join('')}</div><p class="note">Top-down projection, to scale; labels are not to scale and may overlap. Dashed lines show aim, dotted circles indicate approximate stand footprints. Positions are X (right), Y (height), Z (front), measured from the studio floor centre. Enabled equipment only.</p><section class="schedule"><h2>Camera and subject</h2><div class="camera">${table(['Setting','Value'],cameraRows)}</div><p class="note">Subject: ${escape(subject.name)} · bounds ${xyz(subject.min)} to ${xyz(subject.max)} m · rotation ${escape(subject.yaw)}°</p><h2>Lights (${lights.length})</h2>${lightRows.length?table(['ID','Name','Position (m)','Aim (m)','Source / modifier','Output / colour / beam','Support'],lightRows):'<p>No enabled lights.</p>'}<h2>Reflectors and flags (${panels.length})</h2>${panelRows.length?table(['ID','Name','Type','Centre position (m)','Width × height (m)','Rotation / tilt','Reflectance'],panelRows):'<p>No enabled panels.</p>'}${warnings.length?'<p class="warning">'+warnings.map(escape).join('<br>')+'</p>':''}<p class="note">Light intensity is in FrameLab units, not watts or flash power. Support geometry and lighting are planning approximations. Reference props and camera-tripod footprint are not included in this diagram. This document captures the working scene; save the FrameLab project separately to retain editable setups.</p></section></main></body></html>`;
  const geometryNote=subject.boundsUnavailable?'<p class="warning">This older shot records subject position but not its full footprint. S marks the saved position only. Load and update the shot to record its footprint.</p>':'';
  const result=html.replace('</main>',geometryNote+notesHtml+'</main>');
  return subject.boundsUnavailable?result.replace(' · bounds '+xyz(subject.min)+' to '+xyz(subject.max)+' m',' · position '+xyz(subject.min)+' m (footprint not recorded)'):result;
}
