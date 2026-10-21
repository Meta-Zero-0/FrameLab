// Shared hover and keyboard-focus help. Text describes behavior, not implementation.
export function connectTooltips() {
  const tips = {
    'subject-type': 'Choose the subject. Switching models automatically frames and focuses the camera; lens and aperture stay unchanged.',
    'subject-pose': 'Change the mannequin pose. This changes its outline and automatically reframes and focuses the selected region.',
    'subject-region': 'Choose full body, shoulders or head. The whole model stays in the scene; the camera frames and focuses the chosen region.',
    'subject-height': 'Physical height in metres; scales the whole subject proportionally. The camera stays still, so a taller subject occupies more of the image.',
    'subject-x': 'Move the subject sideways along the studio X axis. The camera stays still; the subject moves across the frame. Zero is the studio centre.',
    'subject-z': 'Move the subject along the studio Z axis. Positive values move toward the starting camera side, usually making it appear larger. Follow focus tracks its new depth.',
    'subject-yaw': 'Turn the subject around its vertical axis in degrees. Camera position stays fixed; visible shape and perspective change. Zero restores its original facing direction.',
    'subject-rotation': 'Turn the subject around its vertical axis. This is the same setting as Degrees below; it changes which surfaces face the camera.',
    'subject-file': 'Open a local, self-contained GLB up to 50 MB. Nothing is uploaded. Check its height after import; reloading the page clears the file.',
    'fit-subject': 'Move and aim the camera to fit the selected subject region, then focus on it. Keeps the lens and aperture; replaces the framing lock reference when enabled.',
    'focal-length': 'Lens focal length in millimetres. Longer lenses narrow the view and enlarge the subject. Maintain framing compensates by moving the camera, changing perspective.',
    'camera-distance': 'Move the camera along its viewing direction, in metres from the aiming target. Closer usually makes the subject larger. Follow focus refocuses; Maintain framing captures the new size.',
    'focus-distance': 'Set the sharpest plane in metres from the camera without moving it. Aperture and focal length determine how much around that plane is acceptably sharp. Disabled while following the subject.',
    'maintain-framing': 'Capture the subject region’s current image size. Lens changes then move the camera to preserve that size, changing background perspective. Travel limits can prevent a match.',
    'follow-focus': 'Keep focus at the selected subject region’s depth when camera or subject changes. Disables manual focus entry. Turning this off keeps the last focus distance.',
    'focus-target': 'Focus once at the selected subject region’s centre depth. Does not move the camera or enable follow focus; this is not eye detection.',
    'aperture': 'Aperture is the lens opening. A low f-number (f/2.8) lets in more light and blurs more of the background: useful for isolating a subject. A high f-number (f/8 or f/11) keeps more depth sharp but makes the image darker: useful for products or groups. To recover brightness, use a slower shutter, higher ISO or more light.',
    'camera-iso': 'ISO controls how bright the captured image appears. Low ISO (100–200) usually gives cleaner results on a real camera. Raise ISO when you need a fast shutter or a small aperture but cannot add more light. ISO 200 is one stop brighter than ISO 100. Higher ISO can mean more visible noise and less highlight headroom; FrameLab changes brightness but does not simulate sensor noise.',
    'camera-shutter': 'Shutter speed is the time spent collecting light. Fast (1/1000 s) helps freeze movement but makes the image darker; compensate with higher ISO, a lower f-number or more light. Slow (1/30 s or longer) makes it brighter, but moving subjects or camera shake can blur: use a tripod for still subjects. FrameLab simulates continuous-light brightness, not motion blur or flash timing.',
    'visual-blur': 'Show approximate depth-of-field blur in the camera view. Turning it off leaves the optical readings unchanged; the blur is illustrative, not a calibrated simulation.',
    'show-grid': 'Show the overview floor grid and edge rulers. Each square is one metre; coordinates are relative to the studio origin. Never appears in photographs.',
    'show-prop-labels': 'Show distances above visible props in the overview. Does not hide the props. Distances use centres along the camera viewing direction; the wall label stays off.',
    'show-camera-guides': 'Show the camera marker and blue viewing cone in the overview. The cone ends at the aiming target, not at the far sharpness limit.',
    'show-focus-plane': 'Show the amber focus plane in the overview. It follows focus distance, not camera distance unless Follow subject focus is enabled.',
    'show-dof-guides': 'Show green near and far acceptable-sharpness boundaries. Aperture, lens and focus distance move them. Infinity and far limits beyond 60 metres have no drawn far boundary.',
    'reset-view': 'Restore only the studio overview viewpoint. Leaves the photographic camera, subject, settings and comparisons unchanged.',
    'reset-all': 'Restore the starting subject, camera, focus, props, guides and layout. Clears A/B captures. Imported GLBs remain available until page reload.',
    'expand-photo': 'Expand the full frame view or return to split view. Does not change the lens, framing or saved captures. Escape returns to split view.',
    'clear-comparison': 'Clear both saved comparison photographs and settings. Leaves the live scene unchanged.',
  };
  // Full-frame examples are starting points, not rules about which lens is allowed.
  const lensUses = {
    18: '18 mm · Ultra-wide: interiors, expansive landscapes and dramatic foregrounds. Close camera positions exaggerate near/far proportions; keep faces away from frame edges.',
    24: '24 mm · Wide: rooms, landscapes and portraits showing the surroundings. Useful in tight spaces; moving close can exaggerate facial proportions.',
    35: '35 mm · Wide-normal: street, documentary and environmental portraits. Includes context without the extremely wide view of 18 mm.',
    50: '50 mm · Standard: everyday scenes, products and portraits with some surroundings. A versatile starting point; tight headshots may require getting closer than you want.',
    85: '85 mm · Short telephoto: portraits and head-and-shoulders shots. Allows more working distance than 50 mm at the same framing and shows less background.',
    100: '100 mm · Short telephoto: headshots and product details with comfortable working distance. Focal length alone does not make a lens macro-capable.',
    135: '135 mm · Telephoto: tight portraits and isolating details from farther away. Needs more room for the same framing; useful for simplifying busy backgrounds.',
    200: '200 mm · Telephoto: distant action, wildlife and portraits with plenty of working space. A narrow view isolates details; real handheld shots need care with shutter speed or support.',
  };
  tips['focal-length'] = 'On full frame, wide lenses suit spaces and context; longer lenses suit distant details and tighter portraits. A longer lens enlarges the subject unless Maintain framing moves the camera back. Camera position determines perspective.';
  tips['aperture'] = 'Low f-numbers admit more light and usually blur more background: useful in dim light or for isolating a portrait. High f-numbers deepen the sharp range but need more light, slower shutter or higher ISO for equal exposure. More blur is not automatically better bokeh. Here, brightness stays fixed.';
  tips['camera-distance'] = 'Closer viewpoints exaggerate near/far proportions; stepping back makes them look more similar. This matters for faces and product shape. Changing distance also changes framing; Follow focus keeps the selected region in focus.';
  tips['focus-distance'] = 'Choose which depth looks sharpest. For portraits, photographers often focus on the nearer eye; for products, on the important detail. Close focusing makes depth of field shallower at the same lens and aperture. This control does not move the camera.';
  tips['maintain-framing'] = 'Compare lenses while keeping subject size similar, as a photographer might by stepping back with a longer lens. The changed viewpoint alters proportions and background size. Camera travel limits can prevent a match.';
  tips['follow-focus'] = 'Useful when moving the camera or subject: keeps the selected region at the focus distance, loosely like continuous focus. This demo tracks its centre depth, not eyes or real autofocus performance. Turn off for deliberate manual focus.';
  tips['subject-z'] = 'Move the subject along the floor depth axis; the camera stays still. Bringing a subject closer usually enlarges it. More separation from the background can help blur that background; Follow focus adjusts to the new subject depth.';
  tips['visual-blur'] = 'Preview background separation from lens, aperture and focus distance. Real bokeh quality also depends on lens design and background detail; this approximate blur cannot judge a real lens. Turning it off keeps the numerical readings.';
  tips['focal-number'] = tips['focal-length']; tips['distance-number'] = tips['camera-distance']; tips['focus-number'] = tips['focus-distance'];
  tips['camera-height'] = tips['camera-height-number'] = 'Raise or lower the camera between floor level (0 m) and 10 m above it, moving its aim together, without tilting or changing lens or distance. Useful for moving a portrait from torso to face; eye-level is a common headshot starting point. Follow focus updates focus. Frame and focus subject recentres the chosen region; dollying along a tilted view can also change height.';
  const tooltip = document.createElement('div'); tooltip.className = 'setting-tooltip'; tooltip.id = 'setting-tooltip'; tooltip.role = 'tooltip'; tooltip.hidden = true; document.body.append(tooltip);
  let active = null;
  function hide() { if (active) active.removeAttribute('aria-describedby'); active = null; tooltip.hidden = true; }
  function show(element, text) {
    if (active !== element) hide(); active = element; tooltip.textContent = text; tooltip.hidden = false; element.setAttribute('aria-describedby', tooltip.id);
    const rect = element.getBoundingClientRect(), box = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(innerWidth - box.width - 8, rect.left))}px`;
    tooltip.style.top = `${Math.max(8, rect.bottom + box.height + 12 < innerHeight ? rect.bottom + 8 : rect.top - box.height - 8)}px`;
  }
  document.querySelectorAll('input, select, button, summary').forEach(element => {
    let text = element.dataset.help || tips[element.id];
    if (element.dataset.focal) text = `${lensUses[element.dataset.focal]} Full-frame examples. Maintain framing moves the camera to keep subject size similar.`;
    if (element.matches('#reference-list input')) text = 'Show or hide this prop in both views, including its shadow. Lens, focus and the subject remain unchanged.';
    if (element.hasAttribute('data-capture')) text = 'Capture the current camera image and settings in this slot, replacing its previous capture. Later scene edits do not change the saved image.';
    if (element.hasAttribute('data-download')) text = 'Download this saved photograph as a PNG at its captured resolution. Settings are shown in the card, not embedded in the image.';
    if (element.hasAttribute('data-clear')) text = 'Clear this comparison slot only. The live scene and the other capture stay unchanged.';
    if (element.tagName === 'SUMMARY') text = 'Open or close this section for additional controls or explanation. Opening it does not change the scene.';
    if (!text) return;
    for (const label of element.labels || []) { label.addEventListener('pointerenter', () => show(element, text)); label.addEventListener('pointerleave', hide); }
    element.addEventListener('pointerenter', () => show(element, text)); element.addEventListener('pointerleave', hide);
    element.addEventListener('focus', () => show(element, text)); element.addEventListener('blur', hide);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  document.addEventListener('scroll', hide, true); window.addEventListener('resize', hide);
}



