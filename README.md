# FrameLab

### Studio reflector
Studio → White reflector → Add reflector enables one diffuse white board in the main application. Position, size, rotation, tilt and reflectance drive one-bounce fill on opaque static subjects, with opaque scene triangles blocking both light paths. Changes automatically clear stale lighting and recalculate in a worker after a short pause; there is no manual calculation step. Fast and Detailed quality use 16 and 64 board patches. Disabling the reflector removes the board and restores original subject geometry/materials. Reset all disables it. Reflector settings travel with the current setup and every named shot; older files default to no reflector.

This is approximate vertex-interpolated diffuse transport, not full global illumination. Fine shadow boundaries, transparent/animated subjects, metallic reflector finishes, directional sources and further room bounces are not supported. Complexity limits and timeouts report an error instead of retaining incorrect fill. The normal route has no benchmark controls. Automatic integration, persistence and tilt have passed automated tests (64 total); live browser/GPU verification remains outstanding.

### Named editable shots
The compact Shots menu beside Camera / Lighting / Studio saves, loads, updates, renames and deletes named setups (up to 50). Delete offers a one-step Undo. Switching shots retains edits to the active shot; switching from an unnamed working scene preserves it as “Previous working setup”. Update replaces the selected shot with the current scene. Reset all resets the working scene without deleting the collection. Save project downloads the current scene and all shots in one `.framelab` file; Open project also accepts older single-setup files. Models are embedded per shot, with a 72 MB total file limit. Shot collections live in memory until downloaded: reloading or closing the page discards undownloaded work. A/B captures remain separate. Project validation checks every shot before restoration. Live browser verification remains outstanding.

Camera support: the studio overview now shows an adaptive tripod with telescoping legs, braces, a centre column and an articulated head. It follows camera position, height, tilt and portrait orientation without moving the photographic camera. The existing Camera and field of view checkbox controls its visibility. The rig is overview-only and casts no shadows. Room-fit checks include its footprint. Heights outside the illustrative 0.45–2.1 m tripod range show a warning; elevated geometry is a planning illustration, not a claim that a normal tripod can reach that height. At floor-level mounting positions, impossible inverted legs are hidden and the low-mount warning remains. Geometry derives from the saved camera settings, so no additional setup-file fields are needed.

FrameLab is a local Three.js photography and studio-planning app. It has shared overview/photo views, full-frame camera controls with portrait/landscape orientation, subject presets and GLB import, four adjustable lights, studio dimensions, editable setup files and A/B image captures.

Open `C:\App Tools\FrameLab` in a terminal and run `npm.cmd run dev`, then open the local address printed by Vite. `npm.cmd test` runs the regression checks; `npm.cmd run build` produces `dist`. On a fresh installation run `npm.cmd ci` first.

Current work: physical light housings and adaptive stands/booms driven by the existing lamp controls. Next: adaptive camera support, named editable shots and shoot-sheet exports. Reflector simulation is a separate investigation; free camera movement remains deferred. The older `createCameraRig.js` is not part of the active app.

## Development history

The notes below record successive checkpoints. Later sections supersede earlier descriptions.

### First visible checkpoint

This stage renders one cube, a floor, a grid and lighting. It has an exploration camera with orbit controls, not the final photographic camera. Distances use metres by convention. No editor service or remote assets are required.

## Run it yourself

Open C:\App Tools\FrameLab in VS Code. Open Terminal > New Terminal, then run:

```powershell
npm.cmd run dev
```

Open the Local URL printed by Vite. Keep the terminal running. Save a source file to see Vite update the browser. JavaScript edits at this stage reload the page, so the exploration camera returns to its starting position. CSS can update without a full reload. Ctrl+C stops the server. The .cmd suffix avoids PowerShell's npm.ps1 execution-policy issue.

On a fresh copy of the project, first run `npm.cmd ci` to install the dependency versions recorded in package-lock.json. You do not need to reinstall packages each time you work.

## How the pieces connect

index.html loads src/main.js with a module script. main.js imports styles, plain layout data, the scene builder and the rendering helper. It connects them and starts the drawing loop.

- index.html: HTML structure, buttons, instructions, and the canvas element.
- src/main.js: entry point and coordinator; wires the page to the scene, resizing and reset button.
- src/scene/sceneLayout.js: editable data for positions, colours, sizes, lighting and starting view. No Three.js imports.
- src/scene/createFoundationScene.js: turns layout data into Three.js objects.
- src/render/createOverviewRenderer.js: sets up WebGL drawing, the perspective camera and OrbitControls.
- src/styles.css: appearance and responsive page layout.

A scene is a collection of objects. A mesh combines geometry (shape) and a material (surface appearance). A camera defines the viewpoint. A renderer draws the scene from that camera onto the HTML canvas. The animation loop repeats that drawing as you orbit. Vite is the development server and build tool; it does not render the 3D scene.

## Your first manual change

In src/scene/sceneLayout.js, under subject, change:

```js
position: [0, 0.5, 0],
```

to:

```js
position: [1, 0.5, 0],
```

Save. The cube moves one metre along the world X axis. X is left/right, Y is up/down, and Z is depth in the scene's coordinates. Orbiting changes your view, not these axes. The centre of the 1m cube starts at Y=0.5 so its bottom sits on the floor at Y=0. Setting Y=0 would sink half the cube into the floor.

Restore X=0 when done. Next try rotationDegrees: [0, 30, 0] for a 30-degree turn around the vertical axis. Three.js uses radians internally; the builder performs the conversion. To enlarge the cube, edit size; if you change its height, set the position's Y to half that height to keep it on the floor. Reset view restores the camera, not your edited layout.

To add another object manually: add its settings to the layout file, then create a Mesh in the scene builder and add it to the scene. UI controls belong in separate modules as they grow. Camera maths should stay independent of UI and renderer code. Future engine/editor integration still requires work; these boundaries reduce it.

## Checks and build

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Tests check existing camera calculations, not the picture. Build generates dist, the deployable website. Preview serves that build locally; it does not rebuild when you edit source. Use the dev command for everyday development. Do not edit dist by hand.

Existing advanced studio, subjects, photo renderer and camera modules are retained but are not connected to this first scene. Photography controls, two views and Electron packaging are later stages. No deployment or Electron installation has happened at this checkpoint.
## Checkpoint 2: two cameras and focal length

The active page now has two canvases displaying ONE shared scene. main.js creates the scene once, then renders it from the overview camera and a fixed photographic camera each frame. OrbitControls only affects the overview.

src/render/createPhotoView.js sets up the second renderer and uses the existing cameraModel.js full-frame camera. sceneLayout.js now includes photoView.position and photoView.target. These stay fixed when the lens changes. The photographic frame stays 3:2 at every window size.

The HTML range input emits an input event when dragged or changed with arrow keys. main.js reads its number and calls applyLens(camera, mm). Three.js setFocalLength converts millimetres into the field of view for our 36x24mm sensor. A longer focal length shows less of the scene, making the subject larger in the frame. This is not moving the camera closer.

Try the 24 mm and 85 mm buttons, then orbit the overview. Only the lens changes the photographic picture. Edit subject.position in sceneLayout.js and save: the same object moves in BOTH views. No focus blur or automatic framing movement is connected yet. createCameraRenderer.js is the earlier advanced effect helper and is still unused; createPhotoView.js is the active simple photographic renderer for this checkpoint.

## Checkpoint 3: visible camera and distance

createPhotoGuides.js adds a blue camera marker and viewing-boundary lines. These use Three.js layer 1, which only the overview camera can see. They do not cast shadows in the photograph. The cone stops at the target plane for readability: it is not the full near/far clipping frustum and does not describe depth of field.

cameraTravel.js moves the photographic camera along its initial viewing direction, keeping the target fixed. The slider measures straight-line distance in metres from camera to target (initially the cube centre), not distance from camera to the cube surface. Moving the cube manually does not automatically move this target; edit photoView.target if needed.

main.js connects distance input to camera travel and refreshes the guides after either distance or focal length changes. Lens changes leave distance unchanged; distance changes leave focal length unchanged. Guides share the real camera's orientation and field of view. Reset view affects the overview only. Refresh restores the sceneLayout starting position, rounded to the distance slider's 0.01m step and limited to 1.5-40m.

To try it manually: select 24 mm, then 85 mm, and watch the viewing cone narrow. Keep 50 mm and move from 5m toward 2m. The marker approaches the subject and the subject appears larger. These are different operations: one changes the lens, the other the viewpoint. The overview starts farther out now so you can see the marker as well as the cube.

## Checkpoint 4: maintain framing

Enable Maintain framing to capture the cube's current projected size. Changing the lens then uses framing.js to find a camera distance that preserves that size. framingLock.js converts the cube's bounding-box corners to the coordinate system expected by that maths. main.js connects the checkbox, lens, distance and status message. Background objects are in sceneLayout.backgroundObjects and are excluded from this calculation.

Occupancy means the fraction of image width or height taken up by the subject. We preserve the larger fraction; this is not a promise that every edge stays pixel-identical, because moving the viewpoint changes perspective on a 3D object. The solver considers the cube's depth rather than simply multiplying distance by a focal-length ratio.

The distance range remains 1.5-40m. When a lens needs more travel, a visible message says framing cannot be maintained. Switching back to an achievable lens restores the original captured size. Manually changing distance while locked deliberately captures a new size. Turning the toggle off leaves the camera where it is and makes the controls independent again.

Try: reload, enable the toggle at 50mm, compare 24mm and 85mm. Watch the cube remain similar in size and the background columns change relative size. The default 50mm framing now works through 200mm. More extreme captured framings can still reach a travel limit; an orange FRAMING NOT MATCHED message explains when this happens. Change column positions or sizes in sceneLayout.js and save to experiment with perspective.

## Checkpoint 5: focus and aperture

Focus distance changes where the camera focuses, not its position. The amber plane is perpendicular to the photographic camera, at the selected distance, and appears only in the overview. Focus is manual: after moving the camera (including maintain-framing movements), click Focus at target to refocus. This focuses at the configured target, initially the centre of the cube; its front face is slightly closer.

connectFocusControls.js connects the controls to calculateDof and the visual effect and places the focus plane. createPhotoView.js now reuses createCameraRenderer.js: an EffectComposer renders the scene, applies BokehPass (approximate blur), then OutputPass for display colour. main.js calls photo.render() instead of drawing the photo directly. The overview still renders normally.

Aperture is shown as an f-number. Smaller numbers such as f/1.4 mean a wider opening and shallower depth of field. Larger numbers such as f/16 give a deeper sharp range. The readings use the brief's hyperfocal formula with a 0.03mm circle of confusion. BokehPass is not a calibrated physical simulation: blur strength is an artistic mapping, and exposure is held constant. Disabling approximate blur leaves the numerical readings unchanged.

Try at 85mm: click Focus at target, compare f/1.4 and f/16, then move focus farther towards the background columns. Watch the amber plane move without moving the camera. For manual implementation, add HTML controls, listen for input, pass the values to the maths/effect modules, and update the guide transform. No extra dependency installation was needed: these effects ship with Three.js.

## Checkpoint 6: expanded photographic workspace

Expand photo view hides the overview and gives its column to the photographic panel. Return to split view or Escape restores the overview. This is a page-layout change, not browser fullscreen. Controls stay accessible below the photograph; the image retains 3:2 proportions and is height-limited to fit comfortably on screen.

connectWorkspaceControls.js changes a CSS class and the overview's hidden property. It does not recreate cameras, canvases or scene objects. The existing ResizeObserver notices the new panel dimensions and updates the renderer and post-processing buffers. Lens, distance, manual focus, aperture, framing lock and overview orbit are therefore preserved. The button exposes its expanded state to assistive technology and keeps keyboard focus when switching.

To implement this manually: add a button in HTML, define the expanded grid layout in CSS, then connect click/Escape events to the layout class. Let resize handling update the drawing resolution; never stretch a fixed-size canvas to fake a larger rendered image.

## Smoother photographic edges

The photographic pipeline now runs RenderPass -> BokehPass -> SMAAPass -> OutputPass. SMAA is Three.js's image-based anti-aliasing pass: it detects edges and smooths pixel stair-steps. In the installed Three.js version it runs before OutputPass in linear colour space. Renderer antialias:true alone does not smooth the composer's intermediate image buffers. The photo pixel-ratio cap is also increased from 1.5 to 2 for sharper output on high-density screens. Both changes cost some GPU work; the overview stays unchanged. This does not make the approximate bokeh physically accurate or eliminate all blur-boundary artefacts.

The background columns and wall are depth references: compare their size relative to the cube with Maintain framing enabled, or focus between cube and background to see different sharpness. Their positions are editable in sceneLayout.backgroundObjects; they are not required by Three.js.

## Scene references: visibility and depth labels

Each background prop now has a checkbox in Scene references, affecting both renderers because they share the same scene object. Its visibility is changed, not its position, and its label hides with it. The toggle settings last for the current page session.

connectSceneReferences.js builds the controls and HTML overview labels. It measures each prop centre relative to the photographic camera and cube centre along the camera's forward direction (a dot product). These are axial depths, not diagonal distances or distances to the focus plane. Changing focus alone does not change these readings. Labels are projected into overview screen coordinates each frame so they follow orbiting; they are never part of the photo image. The panel retains readings for hidden props, and is the accessible text equivalent of the visual labels.

## Step 7: Subjects and local GLB import

Choose a model in the Subject panel. Human uses simple mannequin geometry with standing, arms-out and seated poses. Headshot and head-and-shoulders change the camera target and framing bounds; the whole human stays in the scene. These are composition aids, not anatomically detailed people.

`src/scene/createSubjectSystem.js` builds presets, loads GLB with Three.js GLTFLoader, and handles size/placement. A Three.js Group is a container: moving or scaling it moves/scales all its child meshes. `src/ui/connectSubjectControls.js` connects HTML inputs to that system. `src/camera/framingLock.js` measures a bounding box (an invisible box enclosing the selected subject region) to fit and maintain its projected size. `src/main.js` coordinates those pieces.

To adjust manually, choose a preset, open Size and placement, and enter height in metres, X/Z position, or rotation in degrees. Changing these reframes/refocuses automatically. For code edits, change the preset geometry in createSubjectSystem.js and save; Vite reloads the app. To use a model from Blender, export a self-contained GLB without compression and choose it under Import your own GLB. Confirm its physical height. Files stay in browser memory and must be selected again after reload; no server upload or project saving is implemented yet. Animation clips are not played. Limit: 50 MB; compressed Draco/Meshopt/KTX2 assets are not supported in this first importer.

## Step 8: complete lens, distance and focus controls

Focal length, camera distance and focus distance now have exact number fields as well as sliders. Enter a value and press Enter or leave the field to apply it. HTML minimum, maximum and step validation prevents invalid entries reaching the camera. Lens presets span 18, 24, 35, 50, 85, 100, 135 and 200 mm; the active preset is highlighted.

Follow subject focus is optional. It continually focuses on the selected framing target whenever camera controls change, including camera movements from Maintain framing. Manual focus inputs are disabled while following; turn the toggle off to keep the last distance and focus independently. Focus at target is still a one-time action. The target is the centre of the chosen framing region, not automatic eye detection or the nearest surface.

`connectNumberInput.js` links each number field to its slider's existing input event, so both use the same camera-update code. `connectFocusControls.js` handles follow/manual focus. The subject rotation slider and degree field are visible outside Size and placement and turn the model about its vertical axis. Subject edits still automatically frame and focus it.

Overview prop labels now measure the highest projected corner of each object's bounding box, then place the label above that edge. Overlaps stack upward, never downward over a prop. When orbiting or zooming leaves no room above an object inside the overview, its label hides until room is available; the readings remain in Scene references. The wall label remains off.

Try: enable Maintain framing and Follow subject focus, compare 35 mm and 135 mm, and watch camera distance and focus distance change together. Turn Follow subject focus off, change camera distance, and observe focus stay at the previous distance. Enter a subject rotation in degrees to turn it in both views.

### Placement behavior correction

Size, position and rotation now apply on valid input immediately, without moving or refocusing the camera. Previously automatic reframing compensated for those edits, making them hard to see. Selecting a new model/pose/framing preset still frames it; use Frame and focus subject explicitly after manual placement. Follow subject focus, when enabled, tracks the moved subject region's depth while leaving the camera stationary. With Maintain framing enabled, a placement edit captures the new visible size for subsequent lens changes.

## Step 9: clearer visual guides

Overview guides have separate toggles and a colour key: blue camera/viewing cone, amber focus plane, green near/far depth-of-field outlines. Green limits start disabled to avoid clutter. The amber fill is lighter and has a crisp outline. These objects are on Three.js layer 1, excluded from the photographic camera and its post-processing passes.

createFocusGuides.js positions rectangles perpendicular to the camera at the distances returned by the existing dofMath.js. Their size follows the camera field of view. Green boundaries describe an acceptable sharpness criterion, not an abrupt physical transition. For infinity or a finite far limit beyond 60 m, no false far boundary is drawn; the panel explains this and retains the calculated reading. Hyperfocal distance is now displayed using the same existing maths; this adds a reading, not a new optical model.

Try: turn on Near and far sharpness limits, then change aperture from f/2.8 to f/16. The green boundaries spread apart while the amber focus plane remains fixed. Toggle blue camera guides off if they obscure the comparison. Nothing is drawn into the photograph.

### Grid and label visibility

Overview guides now includes Floor grid (1 m squares) and Prop distance labels. Both start enabled. The grid is a 12 m square divided into 12 intervals, and now uses overview-only layer 1 so it does not appear in the photograph. The labels toggle hides only the labels: props and the Scene references readings remain available. Individual prop visibility and the wall's permanently disabled label are still respected.

### Grid edge rulers

The overview grid now has tick marks and numbered metre coordinates from -6 to +6 along two adjacent edges, with transparent text backgrounds. X and Z labels identify the two floor axes; zero is the studio origin, not the subject's current location. createMeasuredGrid.js groups the grid, ticks and camera-facing text sprites so the existing grid toggle controls them together. All remain excluded from the photograph.


## Step 4: Reset and comparison

Reset all (in the header) restores the learning cube, default size/position/rotation, 50 mm lens, starting camera distance/target, f/2.8, target focus, manual focus mode, framing lock off, blur on, default guide visibility, all props visible, overview orbit and split layout. It clears A/B captures. Imported GLBs remain available in the model menu. Reset view still changes only the overview camera.

The A/B comparison section below the workspace captures frozen photographs at the current photo canvas resolution. Capture A, change the setup, then Capture B. Each card has a concise lens/distance/focus/aperture summary and expandable settings including subject, placement, props, guides and optical readings. Capture replaces that slot; clear removes one or both; Download PNG exports the photograph (settings remain in the card, not embedded in the image). Captures last for the page session and are cleared by Reset all or reload. These are image comparisons, not saved editable scene presets.

connectComparison.js explicitly renders before reading the canvas into a PNG, then stores independent image and settings data. This is why changing the live scene does not change a previous capture. Reset synchronizes both controls and the underlying scene instead of just changing what the form displays. No new library was installed.

## Step 6: compact interface and quality pass

The large slogan and workspace badge are removed. Full frame view has an overlay label and an expand/restore icon with an accessible name, tooltip, keyboard support and Escape to return. Both live views now sit above a responsive control deck, avoiding the empty column beside the old long form. Subject, lens/distance and focus/aperture controls are grouped; guides and prop controls have their own row. Exact number fields replace duplicate visible value headings; screen-reader slider labels remain. Longer explanations are available in named disclosures. The old exercise panel is removed while step 5 is deferred. Capture, reset, import and camera behavior are retained; no new dependencies.

### Contextual help, branding and studio surfaces

connectTooltips.js provides hover and keyboard-focus explanations for settings, including how they interact. Escape dismisses the tooltip. The supplied SVG is stored at public/framelab-logo.svg and displayed as an image with an accessible FrameLab name. Floor material is white and the backdrop is pale blue-white; lighting and tone mapping still affect their displayed colour. No dependency was added. Lighting controls are the next stage before broader photoshoot planning.

## Lighting: first stage

Camera / Lighting buttons under the views switch the controls without changing the scene. Subject controls stay shared. Lighting includes key enable, XYZ position, intensity, approximate colour temperature (2700-10000 K), ambient fill, subject-region tracking or manual XYZ aim, and an overview-only lamp/aim-line marker. Reset lighting affects only lights. Reset all restores lights and returns to Camera. A/B captures record lighting values.

This first key uses Three.js DirectionalLight, so rays are parallel and distance does not cause falloff. Position matters relative to its target to set direction. Intensity uses renderer units rather than calibrated flash power; the temperature slider interpolates a warm/neutral/cool colour approximation. Ambient fill is neutral hemisphere illumination rather than another lamp. Shadow softness, additional fill/rim lights, exposure simulation and presets remain future stages. connectLighting.js owns these controls; createFoundationScene.js still creates the shared lights. No dependencies were installed.

### Lighting input reliability correction

Lighting numeric inputs now retain their last valid values during incomplete edits, validate independently and restore invalid entries on blur. Other controls remain responsive. Automatic/manual aim switches update disabled state before validation, with precise target readouts. Number fields accept in-range decimals rather than rejecting values that do not match a step increment. Paired sliders offer coarse adjustment. A coincident light/aim point retains the last valid direction without blocking intensity or toggles. The marker remains visible in grey when the key is disabled.

### Three-light roles and colour

Lighting now has an Edit light selector for Key, Fill and Hair / rim. Each retains its own on/off, position, intensity, temperature or custom colour, and follow/manual aim. Fill and hair start disabled for an incremental workflow. All use directional lighting for now. The overview marker indicates the selected light. The colour picker overrides temperature; editing temperature restores temperature tint. Ambient light remains global. Reset lighting resets all three; A/B includes all three stored states, not only the selected lamp.

### Studio lighting: distance, beam and emitter size

Each lamp now defaults to Studio mode. createStudioEmitter.js builds five Three.js SpotLight samples across a square emitter; connectLighting.js connects their state to the controls. Each sample uses inverse-square distance falloff. Increasing emitter width spreads the samples without increasing total intensity, approximating softer shadows. This is a realtime approximation: large emitters may produce stepped or multiple shadow edges, and three enabled lamps require fifteen shadow maps. It is not a calibrated softbox or exposure simulator.

Beam width is the full cone angle in degrees. Emitter width is the square source width in metres; these are different controls. Studio intensity 1 maps to 25 candela summed across the samples, but the scene, tone mapping and simplified emitter do not predict real fixture output. Directional mode retains parallel rays and no distance falloff; size and beam controls are disabled there. Switching modes keeps the lamp position, aim and colour, but brightness can differ.

Try: choose Key, lower Ambient light, and move the lamp closer while leaving intensity unchanged. Then compare emitter widths 0.02 m and 1 m at the same position. Fill and Hair/rim retain independent settings. All colour-coded markers remain visible, including disabled lamps. Reset lighting restores Studio mode with only Key enabled; A/B captures record the new settings. No new dependency was installed.

Lighting compatibility fix: the emitter now uses three centred samples (nine shadow maps with all lamps on), reserving texture capacity for imported GLB materials. This supersedes the five-sample description above; softness remains approximate.


### Camera height, smoother edges and lighting help

Camera height moves the camera and aiming target vertically together (a pedestal move), keeping tilt, focal length and camera-to-target distance unchanged. This lets you aim higher on the mannequin before zooming. The number and slider live in Lens and distance; A/B records height and Reset all restores it. Frame and focus subject recentres the chosen framing region. Distance moves still follow the tilted viewing line, so height can change during those moves; the height readout stays synchronized. cameraTravel.js owns the move; main.js connects controls, guides and focus.

The photographic renderer now uses a multisampled offscreen target (up to four samples per pixel), renders at twice CSS resolution, and applies SMAA after output colour conversion. The original canvas antialias flag alone did not cover the EffectComposer buffers. This improves silhouette edges but increases GPU work, especially when expanded. Depth-of-field boundary artifacts and sampled-light shadow steps are separate limitations.

Hover or keyboard-focus the coloured Key, Fill and Hair/rim buttons for each role's practical purpose and typical placement. The light selector explains how to choose the lamp being edited. No new dependencies.


### Lighting presets and source types
Eight editable presets: Classic three-light, Two-light key + fill, Loop, Rembrandt, Split, Rim-light, Top light, Backlight. Choose then Apply preset; this replaces all lamp settings and ambient light only. Positions are relative to the current subject, using studio +Z as front, with fixed aims (portrait presets aim near the top of the selected bounds). Reapply after moving the subject. Detailed face geometry is required for loop and Rembrandt shadows; very large subjects can hit control limits. lightingPresets.js stores these starting arrangements separately from UI and rendering.
Each Studio lamp offers Hard (one centred sample) or Soft (three area samples); output is conserved when switching. Soft size is retained while hard mode disables its control. Directional mode disables both source and emitter controls. Source type is included in A/B, and reset restores Soft. The existing prop-label checkbox now lives in Scene references, retaining reset and comparison integration. Independent background lighting remains a later addition.


### Background light and form styling
An independent fourth Background lamp starts off, positioned at (0, 1.8, -3) and aimed at the front of the backdrop (0, 1.8, -5.4). It uses a hard studio spotlight to limit all-four-light shadow usage to ten textures; emitter type and directional mode are disabled for this lamp. Colour, intensity, beam width, position and aim remain editable. It illuminates any geometry in its beam, without emissive-wall tricks or simulated bounced light. Its rose B marker is always available in overview. Reset and presets turn it off; A/B records its state. Dropdowns share the Subject Model styling; checkbox accents use #6CF8A6.


### Lighting isolation correction
Removed the global ambient-fill control and set hemisphere illumination to zero. Lamp-off photographs now have unlit surfaces and a black clear background; overview guides remain visible. Emissive or unlit imported materials can still appear luminous by their own material definition. Backlight and rim presets use narrower beams aimed near the upper subject with no ambient fill. Background cannot follow the subject; its independent manual aim defaults to the wall. The duplicate Edit light selector is removed in favour of the coloured role buttons. Sliders and exact number fields remain intentionally paired.


### Linked rear-light haze
B now combines a real rear spotlight and one linked depth-tested gradient near the lamp. Its position, aim, colour, intensity, beam and enabled state drive both. Backlight preset activates B alone and aligns it behind the upper subject relative to the photo camera. This local planar haze approximation is not volumetric scattering: it does not calculate light shafts, multiple scattering or transparent-hair transmission. Opaque geometry depth-occludes the glow. The haze is excluded from the opaque focus depth prepass and appears only in the photograph; no additional shadow maps or controls are added.

Background default and Backlight preset now use a 100-degree beam and stronger direct output. The preset offsets B sideways and upward from the camera-subject line to expose a brighter rim. Linked haze intensity is balanced lower relative to direct light so it does not overpower the outline; both still share one intensity control.


### Save and reopen editable setups
Save setup downloads a versioned .framelab JSON file containing camera target/lens/distance/focus, framing-lock reference, subject placement and pose, all four lights, prop visibility, guides and overview viewpoint. When the active subject is an imported GLB its original bytes are embedded as base64, making the setup portable (and approximately one-third larger). Open setup validates settings and restores the embedded model locally; no upload or account is involved. Save the current setup before opening another. A/B photographs and panel expansion state are not included; existing A/B captures remain unchanged when opening. Active GLBs are limited to 50 MB and setup files to 72 MB. Use the header Save setup and Open setup buttons. connectSetupFiles.js handles file IO and validation; main.js applies state in dependency order.


### Reliability pass
Setup validation now filters unknown field and lamp names, rejecting unsupported versions, invalid numeric limits, missing embedded GLBs and invalid framing references before restoration. File operations temporarily disable scene and reset controls to avoid competing edits during asynchronous model loading. Reset/restored lighting messages no longer claim that an old preset is applied. Regression tests cover these validation paths. Browser checks restored the embedded treasure-chest GLB and rendered all four lights, including three soft sources plus hard Background. Layout checked at default width and 390 px; temporary viewport override removed afterward. Browser control calls occasionally stalled during added-light activation; smooth performance across devices is not established.


### Studio dimensions: first planning feature
Studio dimensions offers width/depth (2-30 m) and height (2-10 m). The floor stays centred at X/Z zero. The rear wall interior is at -depth/2 and its top matches studio height. Grid lines remain one metre apart; wider rooms label every second metre to reduce clutter. Height represents a planning boundary, not a rendered ceiling. Changes do not move or clamp camera, subject or lamps. A status checks the complete subject bounding box plus camera and enabled lamp positions; light stands, modifiers and reference props are not included in this fit check. Dimensions are in editable setup files and A/B settings. Older setup files receive the default 12 x 12 x 3.6 m room. Reset all restores those dimensions. Scene rendering and UI wiring are separated into studioBounds.js and connectStudioControls.js.

### Studio tab and surface colours
Camera, Lighting and Studio share the subject controls. Studio contains room dimensions, fit warnings and floor/backdrop colour pickers. These change MeshStandardMaterial colours, not emission or lighting; there is no bounced-light simulation. Colours persist in editable setup files and A/B settings, and Reset all restores white floor and pale blue-white backdrop. Legacy setup files receive those default colours.

### Portrait and landscape
Camera Orientation switches the full-frame sensor between 36×24 and 24×36 mm. Camera position and focal length remain unchanged; guides, render target and fitting maths follow the selected dimensions. Maintain framing captures a fresh reference after rotation. Frame and focus subject explicitly recomposes. Orientation is saved in setups and A/B; legacy files and Reset all use landscape.

### Physical lights and adaptive supports

Enabled Studio lights now have physical source housings, stands and booms. Light position drives support height; aim rotates the head; Soft emitter width drives housing width. Hard uses a small housing. The existing emitter samples remain responsible for illumination. Physical equipment appears in both views and casts shadows, including when it enters the photograph. Disabling a lamp removes its equipment. Directional lights retain their overview markers without physical fixtures; hiding markers does not hide physical equipment.

Light support offers Auto / Stand / Boom per lamp. Auto searches a stand and 112 offset boom/crane candidates with reach from 0.75 to 6 m. It prefers arrangements inside the room, then complete frame clearance, then clear masts and feet, before comparing how much arm remains in frame. This prevents a short visible stand from winning over a longer boom whose base is outside the photograph. A forced Boom still chooses its base automatically. Lens, camera movement, orientation and room changes trigger reevaluation. Frame warnings are conservative: occlusion behind a subject is not used to declare equipment clear. Auto can reduce intrusion without eliminating it; the head is checked separately, and warnings remain visible in Camera mode.

Supports always extend physically to the requested lamp position, including the initial 6 m key light. There is no height clamp or dashed substitute for the connection. Mast heights outside 0.6–3.6 m and boom reach beyond 2.25 m produce a separate warning that suitable equipment beyond a typical stand is required. Feet extend 0.55 m from the base. These are illustrative planning dimensions, not manufacturer specifications or stability/load calculations. Room warnings include the full equipment footprint and head. Subject/equipment collisions are not checked.

Support choices persist in setup files; older files default to Auto. Reset and lighting presets default to Auto. A/B settings record the support choice, resolved base, mast height, reach and warnings. The source modules separate support selection (`lightSupportMath.js`), geometry (`createLightEquipment.js`) and UI (`connectLighting.js`). This is why moving the existing light slider updates both illumination and equipment without duplicate controls.
