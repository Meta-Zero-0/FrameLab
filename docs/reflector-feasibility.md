# Reflector feasibility assessment

Assessed 13 October 2026. This is a design assessment, not a completed reflector implementation or GPU benchmark.

## Implemented experiments

`/?reflectorMesh=1` adds an opt-in mesh prototype to FrameLab. Calculate bounce snapshots opaque scene triangles, constructs a median-split acceleration structure in a worker, and calculates RGB diffuse irradiance at subject vertices. Coarse subject meshes are subdivided; results feed the existing material's indirect diffuse calculation. Scene changes clear stale results. It supports static opaque Standard/Physical subject materials, with limits of 100,000 receiving vertices and 250,000 blocker triangles and a 30-second worker timeout. Other surfaces obstruct rays but do not receive this additional bounce. Unsupported geometry/materials are rejected. Interpolation can miss fine shadow boundaries; this is not per-pixel ray tracing. Board settings are experimental and are not saved in setup files.

After calculating, Compare rendering cost measures the original subject geometry/materials and then the enriched geometry with bounce enabled, keeping the physical board in both phases. It reports median/p95 frame intervals and complete-frame draw calls for both views. Preparation time on the main thread and worker/round-trip time are separately displayed. Tab hiding or resize cancels the comparison. This version has 62 passing project tests; browser shader compilation, appearance and representative imported-model timings still need live verification.

`/reflector-lab.html` contains the isolated numerical pilot. `/?reflectorPerf=run` opens the main renderer with an opt-in load benchmark and attempts to start once the page is ready. If the tab is hidden, use Run comparison after bringing it forward. No benchmark code is loaded on the ordinary app route. Tests cover energy scaling, both obstruction paths, quadrature convergence, combined lamp contributions and worker cache invalidation (59 project tests passing at this stage).

The benchmark temporarily enables three soft studio lights and a hard Background light, restores the original light states afterward, and measures both views with existing photo effects. Five phases compare baseline, cached board illumination, board movement, a finer calculation and baseline repeat. It uses one worker with no queued job backlog, at most ten updates per second, 1,024 receiver points, 64 or 256 board patches and one synthetic blocker. The tab must stay visible and the viewport fixed. Stop, worker failure, resize, tab hiding and a 60-second timeout end the run. Import a representative model before rerunning to increase the raster-rendering workload.

Results include frame median/p95, CPU submission time, complete-render-loop draw calls for both renderers, worker latency/computation time and cache hits. Download results exports JSON. Frame intervals are not GPU timer-query measurements. This is a lower-bound integration-cost experiment: it excludes arbitrary-model visibility, bounce shader integration and texture upload, and does not establish a final reflector performance budget. No on-device result has been inspected by the agent yet.

## Decision

Proceed to an isolated white, diffuse reflector prototype. Do not yet integrate it into the production lighting controls or describe it as calibrated photographic simulation. Compare a restricted single-bounce calculation against a path-traced reference before selecting the production approach. Silver/gold directional reflection needs a separate material and convergence investigation.

The first experiment should prove bounced illumination and obstruction, not merely display a board. A reflector changes the incident lighting of a subject; a mirror image drawn on a plane does not provide that functionality.

## Findings from this project

- Both views currently use WebGLRenderer and share a scene. Studio lights use three spot samples for Soft and one for Hard, with 1024-square shadow maps and a 1.5 filter radius. Three soft lights plus hard Background can require ten visible spotlight shadow maps. Additional shadowed fill samples would increase an already significant resource budget.
- The photographic view uses a twice-CSS-resolution render target, up to four MSAA samples, optional BokehPass, OutputPass and SMAA. A new renderer must account for resolution and postprocessing, not just compare nominal draw calls.
- MeshStandardMaterial is used for built-in subjects. Imported GLBs can have other material features. Transparency, textured surfaces and fine geometry require explicit verification.
- The background haze is a custom visual approximation, not participating-media transport. It cannot be assumed to work unchanged in a path tracer. Overview guides and the camera rig must be excluded from transported-light geometry.
- Existing source housings can obstruct rays. Their placement must be checked in the prototype so they do not accidentally block the simulated emitters.
- No live browser/GPU benchmark was obtained. The current browser automation route has previously failed; no performance claims are made for this machine.

## Candidate approaches

| Approach | What it can establish | Main cost or limitation | Verdict |
| --- | --- | --- | --- |
| Three.js Reflector addon | A mirror-like image on a plane | Does not solve diffuse bounced illumination on the subject | Wrong tool for this feature |
| Board plus arbitrary fill light | A controllable visual approximation | Can invent energy, miss partial shading and leak through objects | Does not satisfy the accurate-maths requirement |
| Numerical single-bounce diffuse transport | Lamp-to-white-board-to-subject lighting with angular response, distance, area and obstruction | Finite surface sampling; requires custom shading and visibility integration; excludes further bounces and metallic reflection | Worth prototyping for responsive feedback |
| Progressive path tracing | General surface light transport, including additional bounces | GPU compute, scene acceleration structures, noise and restart after changes; material/camera compatibility work | Reference candidate and possible optional refined preview |

The Three.js Reflector documentation describes a reflected camera view on a mirror surface: https://threejs.org/docs/pages/Reflector.html

The current main-branch three-gpu-pathtracer README uses WebGPU and lists Standard/Physical material support, with MIS required for point, spot and directional lights. Its package manifest exposes multiple entry points; do not assume an older WebGL API is removed or that a published release matches main. Select and pin a tested release and its matching Three.js/BVH dependencies before implementation. FrameLab currently declares Three.js as `latest`, so compatibility must be checked against its actual lockfile.

Sources: https://github.com/gkjohnson/three-gpu-pathtracer/blob/main/README.md and https://github.com/gkjohnson/three-gpu-pathtracer/blob/main/package.json

## What accurate means in the first experiment

Use a flat, opaque, white Lambertian board with known reflectance rho between zero and one. For each small board patch, calculate incident irradiance from each actual source sample, including its spotlight angular falloff, inverse-square distance, incidence cosine and source-to-patch visibility. Its outgoing diffuse radiance is rho times irradiance divided by pi.

Integrate that radiance over the board as seen from each receiving surface point. Each patch contribution includes its area, the outgoing board cosine, the receiving surface cosine, inverse-square board-to-receiver distance and patch-to-receiver visibility. Shade through the receiver material's BRDF. Work in linear light before tone mapping. Do not apply inverse-square falloff to directional sources.

This is a numerical approximation to a defined one-bounce transport model, not an arbitrary extra light. It still omits subsequent wall/floor bounces, transmission and specular reflector behaviour. Small patch counts can miss narrow shadows and behave poorly very close to the board, so convergence must be measured rather than assumed. The full rendering equation includes surface scattering and mutual visibility: https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/The_Light_Transport_Equation

## Prototype scope and acceptance checks

Use a separate experiment page so the current app remains usable. Start with a matte subject, black surroundings, one spotlight, a one-metre board and a movable opaque blocker. Keep physical parameters identical between candidate and reference renderers. Disable artistic depth of field and haze in the first comparison; restore them only after lighting correctness is established.

1. Lamp off: no reflector-generated illumination.
2. Board reflectance zero: no bounced contribution. Doubling reflectance doubles the isolated linear-light contribution, before tone mapping.
3. Turn the board away from the source or receiver: the front-face contribution tends to zero.
4. Block either light path: its contribution disappears. A partial blocker produces partial illumination, rather than switching the entire board on/off.
5. Check distance and area against a high-sample numerical solution; avoid claiming a simple inverse-square law for the entire near-field board.
6. Increase patch/ray samples and quantify convergence at fixed receiver points, especially close to the board and near shadow edges.
7. Compare against the reference with matching bounce limits. Extra wall bounces must not be mistaken for implementation error.
8. Repeat with all four lights and a representative textured imported model; test opaque obstruction first, then document transparency limitations.

## Performance gates — targets, not measurements

Record the existing app baseline and candidate at identical viewport sizes, scene settings and camera paths. Measure median and 95th-percentile frame time, GPU time where timer queries are available, draw calls, texture count/memory estimates, scene-build latency and time for noise/error to settle. Draw calls alone are not a meaningful budget for path tracing.

Proposed interactive gate: at least 30 fps with 95th-percentile frame time under 33 ms on the user's normal desktop scene, and no more than 20% regression against the baseline. If the baseline already fails that target, report it rather than attributing it to reflectors. Include both canvases in the measurement.

For a progressive option, keep editing responsive with an explicitly approximate preview and accumulate a refined photograph while stationary. Start the experiment at 640 by 426 pixels; test convergence after 0.5, 1 and 2 seconds, without promising those times are sufficient. Camera, lamp, board or subject edits must invalidate old accumulation immediately. Captures must identify whether they use the quick or refined result.

Browser capability detection and real GPU measurements are prerequisites for choosing WebGPU as a product requirement. Failure of that test should leave the current renderer intact, not silently present a decorative board as a working reflector.

## Integration only after the experiment passes

Add board position, tilt, size and material controls under Studio, with compact primary controls. Persist reflector data in named shots and project files. Add footprint checks, reset behaviour, photographic visibility, A/B capture compatibility and a documented accuracy scope. Keep the count limited initially to one board. Add silver/gold only after validating their directional scattering and noise characteristics.
