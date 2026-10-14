import { connectStudioControls } from './ui/connectStudioControls.js';
import { connectSetupFiles } from './ui/connectSetupFiles.js';
import { connectLighting } from './ui/connectLighting.js';
import { connectTooltips } from './ui/connectTooltips.js';
import { connectComparison } from './ui/connectComparison.js';
import { connectNumberInput } from './ui/connectNumberInput.js';
import { createSubjectSystem } from './scene/createSubjectSystem.js';
import { connectSubjectControls } from './ui/connectSubjectControls.js';
import './styles.css';
import { connectSceneReferences } from './ui/connectSceneReferences.js';
import { connectWorkspaceControls } from './ui/connectWorkspaceControls.js';
import { connectFocusControls } from './ui/connectFocusControls.js';
import { createFramingLock } from './camera/framingLock.js';
import { sceneLayout } from './scene/sceneLayout.js';
import { createFoundationScene } from './scene/createFoundationScene.js';
import { createOverviewRenderer } from './render/createOverviewRenderer.js';
import { createPhotoView } from './render/createPhotoView.js';
import { createPhotoGuides } from './scene/createPhotoGuides.js';
import { createCameraTravel } from './camera/cameraTravel.js';
import { applyLens } from './camera/cameraModel.js';
import { organizeControls } from './ui/organizeControls.js';
import { createMeshReflector } from './experiments/meshReflector.js';
import { connectBlackFlag } from './ui/connectBlackFlag.js';
import { connectShootPlan } from './ui/connectShootPlan.js';
import { Box3, Vector3 } from 'three';

try {
  // Both renderers use this SAME scene, so edits appear in both views.
  const { scene, subject, props, grid, floor, key, ambient } = createFoundationScene(sceneLayout);
  const gridToggle = document.querySelector('#show-grid');
  gridToggle.addEventListener('input', () => { grid.visible = gridToggle.checked; });
  const subjects = createSubjectSystem(subject);
  const overview = createOverviewRenderer(document.querySelector('#scene'));
  overview.camera.position.set(...sceneLayout.view.position);
  overview.controls.target.set(...sceneLayout.view.target);
  overview.controls.minDistance = 1.5;
  overview.controls.update();
  overview.controls.saveState();
  const photo = createPhotoView(document.querySelector('#photo'), sceneLayout.photoView, scene);
  document.querySelector('#reset-view').addEventListener('click', () => overview.controls.reset());

  const travel = createCameraTravel(photo.camera, sceneLayout.photoView.target);
  const focusControls = connectFocusControls(scene, photo, () => subjects.bounds().getCenter(travel.target.clone()));
  const guides = createPhotoGuides(scene, photo.camera, travel.target);
  const lock = createFramingLock(subjects.bounds, photo.camera, travel.target);
  const maintain = document.querySelector('#maintain-framing');
  const framingStatus = document.querySelector('#framing-status');
  const distance = document.querySelector('#camera-distance');
  distance.value = travel.initialDistance.toFixed(2);
  const distanceNumber = connectNumberInput('camera-distance', 'distance-number');
  const focalNumber = connectNumberInput('focal-length', 'focal-number');
  const cameraHeight = document.querySelector('#camera-height');
  const heightNumber = connectNumberInput('camera-height', 'camera-height-number');
  const cameraTilt = document.querySelector('#camera-tilt');
  const tiltNumber = connectNumberInput('camera-tilt', 'camera-tilt-number');
  document.querySelector('#camera-tilt-number').addEventListener('input', event => {
    const input = event.target;
    if (input.value !== '' && input.checkValidity()) {
      cameraTilt.value = input.value;
      cameraTilt.dispatchEvent(new Event('input'));
    }
  });
  cameraTilt.addEventListener('input', () => {
    travel.setTilt(Number(cameraTilt.value));
    guides.update(); focusControls.update();
    if (maintain.checked) captureFraming();
  });
  document.querySelector('#camera-height-number').addEventListener('input', event => {
    const input = event.target;
    if (input.value !== '' && input.checkValidity()) {
      cameraHeight.value = input.value;
      cameraHeight.dispatchEvent(new Event('input'));
    }
  });
  cameraHeight.addEventListener('input', () => {
    travel.setHeight(Number(cameraHeight.value));
    guides.update(); focusControls.update();
    if (maintain.checked) captureFraming();
  });
  function updateDistance() {
    const metres = Number(distance.value);
    travel.setDistance(metres);
    distanceNumber.sync();
    cameraHeight.value = photo.camera.position.y.toFixed(2);
    heightNumber.sync();
    cameraTilt.value = travel.getTilt().toFixed(1);
    tiltNumber.sync();
    document.querySelector('#distance-value').textContent = `${metres.toFixed(2)} m`;
    guides.update();
    focusControls.update();
  }
  distance.addEventListener('input', () => {
    updateDistance();
    if (maintain.checked) captureFraming();
  });
  function captureFraming() {
    lock.capture(Number(document.querySelector('#focal-length').value), Number(distance.value));
    framingStatus.dataset.limited = 'false';
    framingStatus.textContent = 'Framing captured. Lens changes now move the camera.';
  }
  maintain.addEventListener('change', () => {
    framingStatus.dataset.limited = 'false';
    if (maintain.checked) captureFraming();
    else framingStatus.textContent = 'Off: lens and distance work independently.';
  });
  updateDistance();

  const focalLength = document.querySelector('#focal-length');
  function updateLens() {
    focalNumber.sync();
    const mm = Number(focalLength.value);
    document.querySelectorAll('[data-focal]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.focal) === mm)));
    applyLens(photo.camera, mm);
    if (maintain.checked) {
      const result = lock.solve(mm, { min: Number(distance.min), max: Number(distance.max) });
      distance.value = result.distance.toFixed(2);
      updateDistance();
      framingStatus.dataset.limited = String(result.limited);
      framingStatus.textContent = result.limited
        ? "FRAMING NOT MATCHED: camera travel limit reached. The subject will change size. Return towards the lens you captured, or adjust distance to capture a new framing."
        : 'Maintaining the captured subject size. Background perspective changes.';
    }
    guides.update();
    focusControls.update();
    document.querySelector('#focal-value').textContent = `${mm} mm`;
    document.querySelector('#vertical-fov').textContent = `${photo.camera.fov.toFixed(1)} degrees`;
  }
  focalLength.addEventListener('input', updateLens);
  document.querySelectorAll('[data-focal]').forEach(button => {
    button.addEventListener('click', () => {
      focalLength.value = button.dataset.focal;
      updateLens();
    });
  });
  updateLens();
  const orientation = document.querySelector('#camera-orientation');
  const aspectRatio = document.querySelector('#camera-aspect');
  function setOrientation(value, ratio = aspectRatio.value) {
    aspectRatio.value = ratio;
    photo.camera.userData.aspectRatio = ratio;
    orientation.value = value;
    photo.camera.userData.orientation = value;
    applyLens(photo.camera, Number(focalLength.value));
    const frame = document.querySelector('#photo-frame');
    frame.style.aspectRatio = String(photo.camera.aspect);
    frame.dataset.orientation = value;
    frame.style.setProperty('--frame-aspect', String(photo.camera.aspect));
    document.querySelector('#sensor-dimensions').textContent = value === 'portrait' ? '24 × 36 mm' : '36 × 24 mm';
    const displayedRatio = value === 'portrait' ? ratio.split(':').reverse().join(':') : ratio;
    document.querySelector('#camera-view-label').textContent = 'Camera view · ' + displayedRatio;
    document.querySelector('#photo').setAttribute('aria-label', 'Camera view, ' + displayedRatio + ' ' + value);
    photo.resize(frame.clientWidth);
    guides.update(); focusControls.update();
    document.querySelector('#vertical-fov').textContent = photo.camera.fov.toFixed(1) + ' degrees';
    if (maintain.checked) captureFraming();
  }
  orientation.addEventListener('change', () => setOrientation(orientation.value));
  aspectRatio.addEventListener('change', () => setOrientation(orientation.value));

  connectSubjectControls(subjects, (change = {}) => {
    if (change.placement) {
      // Editing the subject must not move the camera to cancel the visible edit.
      if (maintain.checked) captureFraming();
      focusControls.update();
      return;
    }
    subjects.bounds().getCenter(travel.target);
    updateDistance();
    const result = lock.fit(Number(focalLength.value), { min: Number(distance.min), max: Number(distance.max) });
    distance.value = result.distance.toFixed(2);
    updateDistance();
    focusControls.focusTarget();
    if (maintain.checked) captureFraming();
    if (!result.limited && !maintain.checked) { framingStatus.dataset.limited = 'false'; framingStatus.textContent = 'Off: lens and distance work independently.'; }
    if (result.limited) {
      framingStatus.dataset.limited = 'true';
      framingStatus.textContent = 'Camera travel limit reached: this subject cannot fit at this lens. Try a shorter focal length or a smaller subject.';
    }
  });
  const references = connectSceneReferences(props, subject, photo.camera, overview.camera);
  const workspace = connectWorkspaceControls();
  const lighting = connectLighting(scene, key, ambient, subjects.bounds, photo.camera);
  const studio=connectStudioControls({floor,grid,wall:props[2],subject,camera:photo.camera,lighting,cameraEquipment:guides.equipment});
  const meshReflector=createMeshReflector({scene,subject,overview,photo,production:true});
  const blackFlag=connectBlackFlag(scene,subjects.bounds);
  connectComparison(photo, () => {
    // Restore form defaults first, then synchronize the actual scene and renderers.
    document.querySelectorAll('.photo-panel input:not([type="file"])').forEach(input => {
      if (input.type === 'checkbox') input.checked = input.defaultChecked;
      else input.value = input.defaultValue;
    });
    for (const id of ['subject-type', 'subject-pose', 'subject-region', 'aperture']) {
      const select = document.getElementById(id);
      select.selectedIndex = Math.max(0, Array.from(select.options).findIndex(option => option.defaultSelected));
    }
    document.querySelector('#subject-type').dispatchEvent(new Event('change'));
    setOrientation('landscape', '3:2');
    travel.setTilt(travel.initialTilt);
    travel.target.set(...sceneLayout.photoView.target);
    distance.value = travel.initialDistance.toFixed(2);
    focalLength.value = 50;
    updateLens(); updateDistance(); focusControls.focusTarget();
    maintain.dispatchEvent(new Event('change'));
    for (const id of ['show-grid','show-camera-guides','show-focus-plane','show-dof-guides','show-prop-labels']) document.getElementById(id).dispatchEvent(new Event('input'));
    document.querySelectorAll('#reference-list input').forEach(input => { input.checked = true; input.dispatchEvent(new Event('change')); });
    overview.controls.reset(); workspace.reset(); studio.reset(); lighting.reset(); meshReflector.reset(); blackFlag.reset(); lighting.setMode('camera');
    setupFiles.resetNotes();
    document.querySelector('#subject-status').textContent = 'Starting subject restored. Size, placement and rotation update it live.';
  }, lighting);

  function capturePlanGeometry(){const bounds=new Box3().setFromObject(subject);return {min:bounds.min.toArray(),max:bounds.max.toArray(),aim:subjects.bounds().getCenter(new Vector3()).toArray(),camera:photo.camera.position.toArray()};}
  const setupFiles=connectSetupFiles({subjects,
    snapshot:()=>({planGeometry:capturePlanGeometry(),flags:blackFlag.snapshotAll(),reflectors:meshReflector.snapshotAll(),blackFlag:blackFlag.snapshot(),cameraTilt:travel.getTilt(),reflector:meshReflector.snapshot(),orientation:orientation.value,aspectRatio:aspectRatio.value,studio:studio.snapshot(),target:travel.target.toArray(),lights:lighting.snapshot(),markers:document.querySelector('#light-marker').checked,props:props.map(p=>p.visible),lock:(lock.snapshot().occupancy ? lock.snapshot() : (lock.capture(Number(focalLength.value),Number(distance.value)),lock.snapshot())),overview:{position:overview.camera.position.toArray(),target:overview.controls.target.toArray()}}),
    restore(data) {
      studio.restore(data.studio);
      maintain.checked=false;
      setOrientation(data.orientation, data.aspectRatio || '3:2');
      for(const id of ['subject-type','subject-pose','subject-region']) document.getElementById(id).value=data.fields[id];
      document.querySelector('#subject-type').dispatchEvent(new Event('change'));
      for(const [id,value] of Object.entries(data.fields)) { const el=document.getElementById(id);if(el.type==='checkbox')el.checked=value;else el.value=value; }
      subjects.place(...['subject-height','subject-x','subject-z','subject-yaw'].map(id=>Number(data.fields[id])));
      document.querySelector('#subject-rotation').value=data.fields['subject-yaw'];
      travel.setTilt(data.cameraTilt ?? travel.initialTilt);
      travel.target.fromArray(data.target);
      const enabled=maintain.checked;maintain.checked=false;updateLens();updateDistance();focusControls.update();maintain.checked=enabled;
      lock.restore(data.lock);framingStatus.textContent=enabled?'Saved framing reference restored.':'Off: lens and distance work independently.';
      for(const id of ['show-grid','show-camera-guides','show-focus-plane','show-dof-guides','show-prop-labels']) document.getElementById(id).dispatchEvent(new Event('input'));
      document.querySelectorAll('#reference-list input').forEach((input,i)=>{input.checked=data.props[i];input.dispatchEvent(new Event('change'));});
      lighting.restore(data.lights,data.markers);
      meshReflector.restore(data.reflector,data.reflectors);
      blackFlag.restore(data.blackFlag,data.flags);
      overview.camera.position.fromArray(data.overview.position);overview.controls.target.fromArray(data.overview.target);overview.controls.update();
      document.querySelector('#subject-status').textContent='Subject restored from setup.';
    }
  });
  connectShootPlan(()=>{
    lighting.tick();
    const bounds=new Box3().setFromObject(subject);
    const field=id=>document.getElementById(id).value;
    return {
      title:setupFiles.activeShotName(),notes:setupFiles.notes(),date:new Date().toLocaleString('en-GB'),studio:studio.snapshot(),
      camera:{position:photo.camera.position.toArray(),target:travel.target.toArray(),focal:Number(field('focal-length')),orientation:orientation.value,aspectRatio:aspectRatio.value,aperture:field('aperture'),focus:Number(field('focus-distance')),tilt:travel.getTilt(),distance:photo.camera.position.distanceTo(travel.target)},
      subject:{name:document.querySelector('#subject-type').selectedOptions[0].textContent,min:bounds.min.toArray(),max:bounds.max.toArray(),yaw:field('subject-yaw')},
      aim:subjects.bounds().getCenter(new Vector3()).toArray(),lights:lighting.snapshot(),supports:lighting.equipmentReports(),
      reflectors:meshReflector.snapshotAll(),flags:blackFlag.snapshotAll()
    };
  },setupFiles.shootPack);
  organizeControls();
  connectTooltips();
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target.id === 'overview-panel') overview.resize(entry.contentRect.width, entry.contentRect.height);
      else photo.resize(entry.contentRect.width);
    }
  });
  observer.observe(document.querySelector('#overview-panel'));
  observer.observe(document.querySelector('#photo-frame'));

  let reflectorPerformance;
  if(new URLSearchParams(location.search).has('reflectorPerf')) {
    import('./experiments/reflectorPerformance.js').then(({createReflectorPerformance})=>{
      reflectorPerformance=createReflectorPerformance({scene,overview,photo,lighting});
    }).catch(error=>console.error('Reflector benchmark failed to load:',error));
  }
  overview.renderer.setAnimationLoop(() => {
    reflectorPerformance?.begin();
    meshReflector?.begin();
    overview.controls.update();
    lighting.tick();
    studio.tick();
    references.update();
    meshReflector?.tick();
    blackFlag.tick();
    overview.renderer.render(scene, overview.camera);
    photo.render();
    reflectorPerformance?.end();
    meshReflector?.end();
  });
} catch (error) {
  const message = document.querySelector('#scene-error');
  message.hidden = false;
  message.textContent = 'The 3D views could not start. See the browser console for details.';
  console.error('FrameLab startup failed:', error);
}









