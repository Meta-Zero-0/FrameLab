import { createLinkedHaze } from '../scene/createLinkedHaze.js';
import { createLightEquipment } from '../scene/createLightEquipment.js';
import { lightingPresets, buildLightingPreset } from '../scene/lightingPresets.js';
import { createStudioEmitter } from '../scene/createStudioEmitter.js';
import { lightModifiers, modifierDimensions } from '../scene/lightModifiers.js';
import { connectOrbitControls } from './connectOrbitControls.js';
import { Group, Mesh, SphereGeometry, MeshBasicMaterial, BufferGeometry, Line, LineBasicMaterial, Vector3, Color, DirectionalLight, CanvasTexture, Sprite, SpriteMaterial } from 'three';

export function connectLighting(scene, key, ambient, subject, photoCamera) {
  const deck = document.querySelector('.control-deck');
  const switcher = document.createElement('div'); switcher.className = 'control-switch'; switcher.setAttribute('aria-label', 'Control workspace');
  switcher.innerHTML = '<button type="button" data-mode="camera" aria-pressed="true">Camera</button><button type="button" data-mode="lighting" aria-pressed="false">Lighting</button><button type="button" data-mode="studio" aria-pressed="false">Studio</button>';
  deck.before(switcher);
  const equipmentSummary = document.createElement('p'); equipmentSummary.className = 'equipment-summary guide-note'; equipmentSummary.setAttribute('role','status'); switcher.after(equipmentSummary);
  const panel = document.createElement('section'); panel.className = 'lighting-controls'; panel.hidden = true;
  panel.innerHTML = '<h3>Studio lights</h3><label>Preset <select id="lighting-preset"></select></label> <button id="apply-lighting-preset" type="button">Apply preset</button><p id="lighting-preset-note" class="guide-note" role="status"></p><div id="light-legend" class="light-legend"></div><p id="light-role" class="guide-note"></p><label>Light colour <input id="light-colour" type="color" value="#ffffff" /></label><label>Light model <select id="light-model"><option value="studio">Studio / distance falloff</option><option value="directional">Directional / no falloff</option></select></label><label>Source <select id="light-source"><option value="soft">Soft source</option><option value="hard">Hard source</option></select></label><p id="light-model-note" class="guide-note"></p><label><input id="key-enabled" type="checkbox" checked /> Selected light on</label><div id="light-fields" class="subject-fields"></div><p><label><input id="light-follow" type="checkbox" checked /> Aim at subject region</label></p><div id="aim-fields" class="subject-fields"></div><p><label><input id="light-marker" type="checkbox" checked /> Show all light markers</label></p><button id="reset-lighting" type="button">Reset lighting</button><p id="light-status" role="status" class="guide-note"></p>';
  deck.append(panel);
  panel.querySelector('#light-source').parentElement.insertAdjacentHTML('afterend', '<label id="modifier-control">Softbox <select id="light-modifier"></select></label><div id="modifier-sizes" class="presets" aria-label="Softbox size presets"><button type="button" data-size=".6">60 cm</button><button type="button" data-size=".9">90 cm</button><button type="button" data-size="1.2">120 cm</button><button type="button" data-size="1.8">180 cm</button></div><p id="modifier-dimensions" class="guide-note"></p>');
  for (const [id, modifier] of Object.entries(lightModifiers)) {
    const option = document.createElement('option'); option.value = id; option.textContent = modifier.label;
    panel.querySelector('#light-modifier').append(option);
  }
  panel.querySelector('#light-model-note').insertAdjacentHTML('afterend', '<div class="equipment-controls"><label>Light support <select id="light-support" data-help="Auto repositions the support as lens, camera distance or orientation changes. It prioritises keeping the mast and feet out of frame within the room. Stand or Boom forces that support type. Lamp position stays unchanged."><option value="auto">Auto</option><option value="stand">Stand</option><option value="boom">Boom</option></select></label><p id="light-equipment-status" class="guide-note" role="status"></p><details class="control-help"><summary>Equipment limits and frame checks</summary><p>Enabled Studio lamps include physical housings and supports in both views. They can appear in the photograph and cast shadows. Switching a lamp off removes its equipment; directional lights use markers only.</p><p>Supports extend continuously to the lamp. Mast heights outside 0.6–3.6 m and boom reach beyond 2.25 m need equipment beyond a typical stand. Auto considers crane reach up to 6 m. These are generic planning dimensions, not load or stability ratings.</p><p>Auto checks the current camera frame and studio boundaries, prioritising a clear mast and feet. An arm or lamp may remain in view; warnings stay visible in Camera mode too. Checks are conservative: equipment hidden behind the subject may still be flagged. Subject/equipment collisions and load balance are not checked.</p></details></div>');
  const definitions = [
    ['light-size','Softbox size (m)',.6,.02,2,.02,'Longest dimension of the softbox face. Rectangle and strip shapes are taller than they are wide. Larger or closer sources usually soften shadows. Three light samples approximate the face; total output stays fixed.'],
    ['light-beam','Beam width (degrees)',90,20,140,1,'Full spread of the studio beam. Narrow it to limit coverage or widen it for a broader wash. Beam edge feathering is separate from subject shadow softness.'],
    ['light-x','Light X (m)',-3,-8,8,.1,'Move the light sideways to change which side of the subject is illuminated. Side lighting reveals texture; studio mode dims with distance; directional mode does not.'],
    ['light-y','Light height (m)',2,.2,10,.1,'Raise the light for downward shadows, or lower it for more frontal illumination. Very low light can produce an unusual upward-lit look.'],
    ['light-z','Light Z (m)',4,-8,8,.1,'Move the light in front of or behind the subject to explore front, side and rim lighting. Studio mode also dims with distance: doubling distance gives roughly one-quarter illumination away from beam edges.'],
    ['light-intensity','Light intensity',3,0,10,.1,'Brighten the key light relative to fill. Higher intensity does not make shadows softer. These are renderer units, not flash power or exposure readings.'],
    ['light-temperature','Colour temperature (K)',5600,2700,10000,100,'Lower values give warmer light; higher values give cooler light. Useful for exploring mood and mixed light. This is an approximate colour tint, not calibrated white balance.'],
    ['light-aim-x','Aim X (m)',0,-6,6,.1,'Aim left or right. Disable Aim at subject region to set a fixed direction independent of subject movement.'],
    ['light-aim-y','Aim height (m)',.5,0,4,.1,'Aim higher or lower to alter the light direction and shadows. Disabled when the light follows the subject.'],
    ['light-aim-z','Aim Z (m)',0,-6,6,.1,'Set the depth of the fixed aim point. Studio mode aims a beam; directional mode sends parallel rays.'],
  ];
  for (const [id,label,value,min,max,step,help] of definitions) {
    const wrapper = document.createElement('label'); wrapper.textContent = label;
    const input = document.createElement('input'); Object.assign(input,{id,type:'number',min:String(min),max:String(max),step:'any',defaultValue:String(value),value:String(value)}); input.dataset.help = help; input.setAttribute('aria-label', label);
    const slider = document.createElement('input'); Object.assign(slider,{type:'range',min:String(min),max:String(max),step:String(step),value:String(value)}); slider.id = id + '-slider'; slider.setAttribute('aria-label', label + ' slider'); slider.dataset.help = help;
    slider.addEventListener('input', () => { input.value = slider.value; input.dispatchEvent(new Event('input')); });
    wrapper.append(input, slider); panel.querySelector(id.startsWith('light-aim') ? '#aim-fields' : '#light-fields').append(wrapper);
  }
  const byId = id => document.getElementById(id), value = id => Number(byId(id).value);
  byId('light-legend').insertAdjacentHTML('afterend','<div id="light-naming" class="equipment-collection"><label>Light name<input id="light-name" maxlength="60" /></label><button type="button" id="light-duplicate">Duplicate light</button></div>');
  byId('light-fields').insertAdjacentHTML('beforeend', '<label id="modifier-rotation-control">Softbox rotation (°)<input id="modifier-rotation" aria-label="Softbox rotation" type="number" min="-180" max="180" step="1" value="0" /><input id="modifier-rotation-slider" aria-label="Softbox rotation slider" type="range" min="-180" max="180" step="1" value="0" /></label>');
  let modifierRotation = 0;
  byId('modifier-rotation').dataset.help = 'Rotate the softbox around its aim direction. 0° is the starting orientation; 90° turns a vertical strip sideways. Light position, aim and total output stay unchanged.';
  byId('modifier-rotation-slider').addEventListener('input', () => {
    byId('modifier-rotation').value = byId('modifier-rotation-slider').value; update();
  });
  byId('modifier-rotation').addEventListener('blur', () => {
    byId('modifier-rotation').value = modifierRotation; update();
  });
  byId('key-enabled').dataset.help = 'Enable or disable only the selected lamp. Other lamps remain active. Does not change camera exposure or the stored key settings.';
  byId('light-follow').dataset.help = 'Keep the light aimed at the centre of the selected subject region as you move it. Turn off to keep an independently positioned aim point.';
  byId('light-marker').dataset.help = 'Show all four light positions and aim lines, even when lamps are off. K, F, H and B colours match the panel indicators and identify roles, not emitted light colours. Off lamps have wireframe markers.';
  scene.add(key.target);
  ambient.color.set('#ffffff'); ambient.groundColor.set('#c8c8c8');
  const target = new Vector3(), last = new Vector3(Infinity,Infinity,Infinity);
  const accepted = Object.fromEntries(definitions.map(([id,,initial]) => [id,initial]));
  let customColour = false, selected = 'key';
  const defaults = structuredClone(accepted);
  const orbit = connectOrbitControls({parent:byId('light-fields'),prefix:'light-orbit',
    position:()=>({x:accepted['light-x'],z:accepted['light-z']}),center:()=>subject().getCenter(new Vector3()),
    change:placement=>{byId('light-x').value=placement.x;byId('light-z').value=placement.z;update();}});
  ambient.intensity = 0;
  const lights = { key };
  for (const name of ['fill','hair','background']) {
    const light = new DirectionalLight('#ffffff', 1); light.castShadow = true;
    light.shadow.mapSize.set(1024,1024); light.shadow.normalBias = .025;
    light.shadow.radius = 1.5;
    Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:30});
    lights[name] = light; scene.add(light,light.target);
  }
  const emitters = Object.fromEntries(Object.keys(lights).map(name=>[name,createStudioEmitter(scene)]));
  const equipment = createLightEquipment(scene, photoCamera);
  const haze=createLinkedHaze(scene);
  function syncEmitters() {
    orbit.sync();
    for(const [name,state] of Object.entries(saved)) emitters[name].update(lights[name],state);
    if(saved.background) haze.update(lights.background,saved.background);
    equipment.update(lights,saved);
    const report=equipment.reports()[selected];
    const status=byId('light-equipment-status');
    let message='Lamp off: equipment removed from the scene.';
    if(saved[selected]?.mode==='directional') message='Directional light: no physical studio fixture.';
    else if(report) {
      message=(report.type==='boom'?'Boom':'Stand')+' · mast '+report.height.toFixed(2)+' m'+(report.type==='boom'?' · reach '+report.reach.toFixed(2)+' m':'')+'.';
      if(!report.supported) message+=' Beyond typical stand dimensions: a suitable tall stand or crane is required.';
      if(report.outside) message+=' Equipment extends outside the studio.';
      if(report.supportInFrame) message+=' Support may appear in the photograph.';
      if(report.headInFrame) message+=' Lamp head may appear in the photograph.';
    }
    if(status.textContent!==message) status.textContent=message;
    status.dataset.warning=String(!!report&&(!report.supported||report.outside||report.supportInFrame||report.headInFrame));
    const reports=Object.entries(equipment.reports());
    const inFrame=reports.filter(([,r])=>r.supportInFrame||r.headInFrame).map(([name,r])=>name+' ('+(r.baseInFrame?'mast/feet':r.supportInFrame?'boom/mount':'lamp')+(r.headInFrame&&r.supportInFrame?' and lamp':'')+')');
    const large=reports.filter(([,r])=>!r.supported).map(([name])=>name);
    const summary=(inFrame.length?'Equipment may enter the photograph: '+inFrame.join(', ')+'. Adjust support mode, lamp position or framing to clear it.':'')+(large.length?' Beyond typical stand dimensions: '+large.join(', ')+'.':'');
    equipmentSummary.hidden=!summary.trim();
    if(equipmentSummary.textContent!==summary) equipmentSummary.textContent=summary;
  }
  const roleHelp = {
    background: 'Background: one rear lamp with linked approximate haze glow. Position, aim, colour, intensity and beam width drive both edge lighting and glow. Opaque subjects block the glow. This is local haze, not a glowing wall or full volumetric scattering.',
    key: 'Key light: the main light shaping the subject. Often above eye level and to one side for portraits; moving it changes facial modelling and shadows. Establish this first, then add fill as needed.',
    fill: 'Fill light: lifts shadows created by the key and reduces contrast. Often near the camera or opposite the key, usually weaker and broad. Low fill gives a dramatic look; stronger fill makes shadow detail easier to see.',
    hair: 'Hair / rim light: placed behind and often above the subject to catch hair or edges and separate them from the background. Common in portraits and product shots. Aim carefully: excess power creates distracting bright edges.'
  };
  const identities = { key: ['Key', '#b46b00', 'K'], fill: ['Fill', '#176bd1', 'F'], hair: ['Hair / rim', '#9b3baa', 'H'], background: ['Background', '#b64262', 'B'] };
  const markers = {};
  for (const [name, [label, colour, letter]] of Object.entries(identities)) {
    const group = new Group(); group.name = label + ' light marker';
    const bulb = new Mesh(new SphereGeometry(.20,16,12), new MeshBasicMaterial({color:colour, depthTest:false}));
    const line = new Line(new BufferGeometry().setFromPoints([new Vector3(),new Vector3()]), new LineBasicMaterial({color:colour, transparent:true, opacity:.6}));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d'); context.fillStyle = colour; context.beginPath(); context.arc(32,32,30,0,Math.PI*2); context.fill();
    context.fillStyle = '#ffffff'; context.font = 'bold 38px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(letter,32,33);
    const tag = new Sprite(new SpriteMaterial({map:new CanvasTexture(canvas),depthTest:false,depthWrite:false})); tag.scale.set(.42,.42,1);
    group.add(bulb,line,tag); group.traverse(object=>object.layers.set(1)); scene.add(group);
    const button = document.createElement('button'); button.type = 'button'; button.style.setProperty('--light-colour',colour);
    button.dataset.help = roleHelp[name];
    button.addEventListener('click',()=>{ save(); load(name); }); byId('light-legend').append(button);
    markers[name] = {group,bulb,line,tag,button};
  }
  function updateMarkers() {
    for (const [name, light] of Object.entries(lights)) {
      const {group,bulb,line,tag,button} = markers[name];
      group.visible = byId('light-marker').checked;
      bulb.position.copy(light.position); bulb.material.wireframe = !light.visible;
      bulb.scale.setScalar(name === selected ? 1.3 : 1);
      tag.position.copy(light.position).add(new Vector3(0,.45,0));
      const attr = line.geometry.attributes.position;
      attr.setXYZ(0,...light.position.toArray()); attr.setXYZ(1,...light.target.position.toArray()); attr.needsUpdate = true; line.geometry.computeBoundingSphere();
      button.textContent = identities[name][2] + ' · ' + (saved[name]?.name||identities[name][0]) + (light.visible ? ' · On' : ' · Off');
      button.setAttribute('aria-pressed',String(name === selected));
    }
    const destination=['key','fill','hair'].find(name=>name!==selected&&!saved[name]?.enabled);
    byId('light-duplicate').disabled=!destination||selected==='background';
    byId('light-duplicate').textContent=destination&&selected!=='background'?'Duplicate to '+identities[destination][0]:'Duplicate light';
    byId('light-duplicate').title='Copies into an unused subject-light slot. The existing four-light limit stays unchanged.';
  }  const initial = {
    key: { ...defaults },
    fill: { ...defaults, 'light-x': 4, 'light-y': 3, 'light-z': 4, 'light-intensity': 1 },
    hair: { ...defaults, 'light-x': 1, 'light-y': 4, 'light-z': -3, 'light-intensity': 1.5 },
  };
  function backgroundState() { return {values:{...defaults,'light-x':1.2,'light-y':2.2,'light-z':-2.5,'light-aim-x':0,'light-aim-y':1.8,'light-aim-z':0,'light-intensity':8,'light-beam':100}, enabled:false,follow:false,mode:'studio',source:'hard',customColour:false,colour:'#ffffff'}; }
  let saved = {};
  function save() { saved[selected] = { name:byId('light-name').value.trim().slice(0,60)||identities[selected][0], values: {...accepted}, enabled: byId('key-enabled').checked, follow: byId('light-follow').checked, mode: byId('light-model').value, source: byId('light-source').value, modifier: byId('light-modifier').value, modifierRotation, support: byId('light-support').value, customColour, colour: byId('light-colour').value }; }
  byId('light-name').addEventListener('change',()=>{save();byId('light-name').value=saved[selected].name;updateMarkers();});
  byId('light-duplicate').addEventListener('click',()=>{
    save();const destination=['key','fill','hair'].find(name=>name!==selected&&!saved[name]?.enabled);
    if(!destination||selected==='background')return;
    const copy=structuredClone(saved[selected]);copy.name=(copy.name+' copy').slice(0,60);copy.enabled=true;
    copy.values['light-x'] += copy.values['light-x']+.5<=8 ? .5 : -.5;
    saved[destination]=copy;load(destination);
  });
  function applyOtherLights() {
    for (const [name, state] of Object.entries(saved)) {
      if (name === selected) continue;
      const light = lights[name], v = state.values;
      light.visible = state.enabled; light.intensity = v['light-intensity']; light.color.set(state.colour);
      light.position.set(v['light-x'],v['light-y'],v['light-z']);
      const aim = state.follow ? subject().getCenter(new Vector3()) : new Vector3(v['light-aim-x'],v['light-aim-y'],v['light-aim-z']);
      if (light.position.distanceToSquared(aim) > .0001) { light.target.position.copy(aim); light.target.updateMatrixWorld(); }
    }
  }
  function load(name) {
    selected = name; key = lights[name]; const state = saved[name];
    byId('light-name').value=state.name||identities[name][0];
    const ambientValue = accepted['light-fill']; Object.assign(accepted,state.values); accepted['light-fill'] = ambientValue;
    for (const [id] of definitions) byId(id).value = accepted[id];
    byId('key-enabled').checked = state.enabled; byId('light-follow').checked = state.follow;
    byId('light-model').value = state.mode; byId('light-source').value = state.source || 'soft';
    byId('light-support').value = state.support || 'auto';
    byId('light-modifier').value = state.modifier || 'square';
    modifierRotation = state.modifierRotation ?? 0;
    byId('modifier-rotation').value = byId('modifier-rotation-slider').value = modifierRotation;
    customColour = state.customColour; byId('light-colour').value = state.colour;
    byId('light-role').textContent = {background:'Background: rear light plus linked haze glow. One set of controls drives both; aim toward the subject and camera to reveal the glow.',key:'Key: the main light shaping the subject.',fill:'Fill: lights the shadow side to reduce contrast. Usually weaker than the key.',hair:'Hair / rim: behind and above the subject to create separation. Edge highlights depend on the subject and angle.'}[name];
    update();
  }
  byId('light-model').dataset.help = 'Studio mode adds inverse-square distance falloff and sampled emitter size. Directional mode behaves like a distant light with no falloff. Switching keeps position, aim and colour; brightness may differ.';
  byId('light-model').addEventListener('change',update);
  byId('light-source').addEventListener('change',update);
  byId('light-modifier').addEventListener('change', () => {
    byId('light-beam').value = lightModifiers[byId('light-modifier').value].beam;
    update();
  });
  byId('light-modifier').dataset.help = 'Shape changes the emitting face and shadow softness across each axis. Choosing a shape also sets a starting beam width; you can adjust it afterwards. Three samples approximate diffuse illumination, not continuous softbox reflections.';
  panel.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    byId('light-size').value = button.dataset.size; update();
  }));
  byId('light-support').addEventListener('change',update);
  byId('light-source').dataset.help = 'Hard uses one small source for crisp shadows. Soft spreads three samples over an adjustable area; larger or closer sources usually soften shadows. This approximates softness, not a physical softbox or its reflections. Studio mode only.';
  byId('light-colour').dataset.help = 'Choose the selected lamp colour, like adding a coloured gel. Overrides its temperature tint; editing temperature returns to temperature mode. Other lights keep their colours.';
  byId('light-colour').addEventListener('input',()=>{ customColour = true; update(); });
  byId('light-temperature').addEventListener('input',()=>{ customColour = false; update(); });  function update() {
    const background = selected === 'background';
    if (background) { byId('light-model').value='studio'; byId('light-source').value='hard'; }
    byId('light-model').disabled=background;
    const studio = byId('light-model').value === 'studio';
    byId('light-support').disabled = !studio;
    byId('light-source').disabled = !studio || background;
    const soft = studio && byId('light-source').value === 'soft';
    byId('modifier-control').hidden = byId('modifier-sizes').hidden = byId('modifier-dimensions').hidden = !soft;
    byId('light-modifier').disabled = !soft;
    byId('modifier-rotation-control').hidden = !soft;
    byId('modifier-rotation').disabled = byId('modifier-rotation-slider').disabled = !soft;
    for(const id of ['light-size','light-beam']) { const disabled = !studio || (id === 'light-size' && byId('light-source').value === 'hard'); byId(id).disabled = disabled; byId(id+'-slider').disabled = disabled; }
    byId('light-model-note').textContent = studio && byId('light-source').value === 'hard' ? 'Small point source with crisp shadows and distance falloff. Emitter size applies to Soft source.' : studio ? 'Distance falloff. Size uses three emitter samples: shadows may show stepped edges. Output stays fixed as size changes.' : 'Parallel light, no distance falloff. Emitter size and beam controls apply only in Studio mode.';
    byId('light-follow').disabled = false;
    const follow = byId('light-follow').checked;
    for (const axis of ['x','y','z']) { byId(`light-aim-${axis}`).disabled = follow; byId(`light-aim-${axis}-slider`).disabled = follow; }
    const invalid = [];
    const rotationInput = byId('modifier-rotation');
    if (soft) {
      if (rotationInput.value !== '' && rotationInput.checkValidity()) {
        modifierRotation = Number(rotationInput.value);
        byId('modifier-rotation-slider').value = modifierRotation;
      } else invalid.push('Softbox rotation');
    }
    for (const [id,label] of definitions) {
      const input = byId(id);
      if (!input.disabled) {
        if (input.value !== '' && Number.isFinite(Number(input.value)) && input.checkValidity()) {
          accepted[id] = Number(input.value); byId(id + '-slider').value = input.value;
        } else invalid.push(label);
      }
    }
    key.visible = byId('key-enabled').checked; key.intensity = accepted['light-intensity']; ambient.intensity = 0;
    orbit.sync();
    const dimensions = modifierDimensions(accepted['light-size'], byId('light-modifier').value);
    byId('modifier-dimensions').textContent = `${(dimensions.width*100).toFixed(0)} × ${(dimensions.height*100).toFixed(0)} cm face · width × height`;
    panel.querySelectorAll('[data-size]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.size) === accepted['light-size'])));
    const kelvin = accepted['light-temperature'], neutral = new Color('#ffffff');
    key.color.copy(kelvin < 5600 ? new Color('#ffb16e').lerp(neutral,(kelvin-2700)/2900) : neutral.lerp(new Color('#b8d3ff'),(kelvin-5600)/4400));
    if (customColour) key.color.set(byId('light-colour').value);
    else byId('light-colour').value = '#' + key.color.getHexString();


    if (follow) subject().getCenter(target); else target.set(accepted['light-aim-x'],accepted['light-aim-y'],accepted['light-aim-z']);
    const nextPosition = new Vector3(accepted['light-x'],accepted['light-y'],accepted['light-z']);
    if (nextPosition.distanceToSquared(target) < .0001) { byId('light-status').textContent = 'Light and aim point coincide. Last valid direction retained; brightness and switches still work.'; save(); applyOtherLights(); syncEmitters(); updateMarkers(); return; }
    key.position.copy(nextPosition);
    if (follow) for (const axis of ['x','y','z']) { const id = 'light-aim-' + axis; byId(id).value = target[axis].toFixed(3); accepted[id] = Number(byId(id).value); byId(id + '-slider').value = byId(id).value; }
    key.target.position.copy(target); key.target.updateMatrixWorld();
    save(); applyOtherLights(); syncEmitters(); updateMarkers();
    last.copy(target); byId('light-status').textContent = invalid.length ? 'Using the last valid value for: ' + invalid.join(', ') + '. Other controls remain active.' : '';
  }
  panel.querySelectorAll('input:not([type="range"]):not([data-orbit-control])').forEach(input => input.addEventListener('input',update));
  for (const [id] of definitions) byId(id).addEventListener('blur', () => {
    const input = byId(id);
    if (input.value === '' || !input.checkValidity()) input.value = accepted[id];
    update();
  });
  function setMode(mode) {
    deck.scrollTop = 0;
    deck.classList.toggle('lighting-mode', mode === 'lighting');
    for (const selector of ['.camera-controls','.focus-controls']) deck.querySelector(selector).hidden = mode !== 'camera';
    panel.hidden = mode !== 'lighting';
    const studioPanel = deck.querySelector('.studio-controls');
    if (studioPanel) studioPanel.hidden = mode !== 'studio';
    switcher.querySelectorAll('button[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === mode)));
  }
  switcher.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
  function reset() {
    saved = Object.fromEntries(Object.entries(initial).map(([name,values])=>[name,{values:{...values},enabled:name==='key',follow:true,mode:'studio',source:'soft',customColour:false,colour:'#ffffff'}]));
    saved.background = backgroundState();
    accepted['light-fill'] = 0; byId('light-marker').checked = true; load('key');
    byId('lighting-preset-note').textContent='Lighting reset to defaults. Choose a preset and Apply to use it.';
  }
  byId('reset-lighting').dataset.help = 'Reset all four lights: key on, fill, hair and background off, Studio mode, white colours, default emitter sizes and positions. There is no ambient fill. Camera and subject stay unchanged.';
  for (const [id,preset] of Object.entries(lightingPresets)) { const option=document.createElement('option'); option.value=id; option.textContent=preset.label; byId('lighting-preset').append(option); }
  function describePreset() { byId('lighting-preset-note').textContent=lightingPresets[byId('lighting-preset').value].note; }
  byId('lighting-preset').addEventListener('change',describePreset); describePreset();
  byId('lighting-preset').dataset.help='Choose a starting arrangement, then Apply preset. Replaces the three subject lamp settings and resets Background to off except for Backlight, which activates B alone, leaving camera and subject unchanged. Positions use the current subject and studio front (+Z); reapply after moving the subject. Detailed faces are needed for portrait shadow patterns.';
  byId('apply-lighting-preset').dataset.help='Replace lighting with the selected starting arrangement. Aim points are fixed so portrait lights can target the face rather than the torso. All settings remain editable. Very large or displaced subjects may require manual adjustment.';
  byId('apply-lighting-preset').addEventListener('click',()=>{
    const preset=buildLightingPreset(byId('lighting-preset').value,subject(),defaults);
    saved={...preset.states,background:backgroundState()};
    if(byId('lighting-preset').value==='back') {
      saved.background={...preset.states.hair,values:{...preset.states.hair.values,'light-beam':100,'light-intensity':8},enabled:true}; saved.hair.enabled=false;
      if(photoCamera) {
        const v=saved.background.values;
        const aim=new Vector3(v['light-aim-x'],v['light-aim-y'],v['light-aim-z']);
        const away=aim.clone().sub(photoCamera.position).normalize();
        const side=new Vector3().crossVectors(away,new Vector3(0,1,0)).normalize();
        const rear=aim.clone().addScaledVector(away,2.5).addScaledVector(side,1.2).add(new Vector3(0,.5,0));
        v['light-x']=Math.max(-8,Math.min(8,rear.x));v['light-y']=Math.max(.2,Math.min(10,rear.y));v['light-z']=Math.max(-8,Math.min(8,rear.z));
      }
    } accepted['light-fill']=preset.ambient; load(byId('lighting-preset').value==='back'?'background':'key');
    describePreset(); byId('lighting-preset-note').textContent += ' Applied. You can now adjust each light.';
  });
  byId('reset-lighting').addEventListener('click',reset); reset();
  return { reset, setMode, equipmentReports: equipment.reports, setStudio(value) { equipment.setStudio(value); syncEmitters(); }, restore(states,marker) { saved=structuredClone(states); byId('light-marker').checked=marker; load('key'); byId('lighting-preset-note').textContent='Saved lighting restored. The preset menu is available for a new arrangement.'; }, snapshot() { save(); return structuredClone(saved); }, tick() { applyOtherLights(); syncEmitters(); updateMarkers(); if(byId('light-follow').checked) { subject().getCenter(target); if(!target.equals(last)) update(); } } };
}



