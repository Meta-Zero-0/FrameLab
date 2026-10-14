import { summariseFrames,percentile } from './performanceStats.js';

// Opt-in load experiment: no reflector shading is added to the production scene.
export function createReflectorPerformance({scene,overview,photo,lighting}) {
 const panel=document.createElement('aside');
 panel.style.cssText='position:fixed;right:12px;top:12px;z-index:200;width:min(460px,95vw);max-height:85vh;overflow:auto;background:#f4f4ed;border:1px solid #8faaa1;padding:14px;border-radius:8px;box-shadow:0 4px 20px #0003;font:13px Segoe UI,sans-serif';
 panel.innerHTML='<strong>Reflector load benchmark</strong><p>Four lights, both views and current photo effects. A worker computes a separate 32 × 32 receiving grid. This does not measure arbitrary-model visibility or applying bounce to scene materials.</p><button type="button" data-run>Run comparison</button> <button type="button" data-stop disabled>Stop</button> <button type="button" data-download disabled>Download results</button><p role="status" data-status>Import a representative model first if desired. Keep this tab visible and its size unchanged during the run.</p><pre data-results style="white-space:pre-wrap;font:12px monospace"></pre>';
 document.body.append(panel);
 const status=panel.querySelector('[data-status]'),output=panel.querySelector('[data-results]');
 const runButton=panel.querySelector('[data-run]'),stopButton=panel.querySelector('[data-stop]'),download=panel.querySelector('[data-download]');
 let running=false,worker=null,phase=null,previousTime=null,startTime=0,frames=[],jobs=[],inFlight=false,nextJob=0,serial=0,jobStart=0,jobPhase='',saved=null,lights=[],report=null,timer=null;
 const renderers=[overview.renderer,photo.renderer];let originalReset=[];
 const stages=[['Baseline',0],['Cached board / moving receiver',8],['Moving board',8],['Refined calculation',16],['Baseline repeat',0]];
 let stageIndex=-1,warmup=0,phaseStart=0;
 function launchPhase(){
  stageIndex++;
  if(stageIndex===stages.length){finish();return;}
  phase=stages[stageIndex];frames=[];jobs=[];warmup=30;previousTime=null;phaseStart=performance.now();nextJob=phaseStart;
  status.textContent=`${stageIndex+1}/${stages.length}: ${phase[0]}. Keep this tab visible.`;
 }
 function finish(error) {
  running=false;clearTimeout(timer);worker?.terminate();worker=null;
  if(saved){lighting.restore(saved.states,saved.markers);saved=null;}
  renderers.forEach((r,i)=>{if(originalReset[i]!==undefined)r.info.autoReset=originalReset[i];});
  document.querySelector('.workspace').inert=false;
  document.querySelector('.setup-actions').inert=false;
  document.querySelector('.comparison').inert=false;
  runButton.disabled=false;stopButton.disabled=true;
  if(error){status.textContent=error;report=null;download.disabled=true;return;}
  const base=report.stages[0].frames.p95Ms,end=report.stages.at(-1).frames.p95Ms;
  report.baselineDriftPercent=100*(end/base-1);
  report.notes=['CPU submission time is not GPU time. Frame intervals include scheduling and vsync.','Worker load uses a 1,024-point plane and one box blocker; no scene triangle traversal, bounce shader or texture upload is included.','Lights are fixed during each phase. Moving-board phase invalidates incident illumination.','Calculations are limited to one outstanding job, requested at most 10 times per second.'];
  output.textContent=report.stages.map(s=>`${s.name}\n  Frame median / p95: ${s.frames.medianMs.toFixed(1)} / ${s.frames.p95Ms.toFixed(1)} ms\n  Draw calls (both views): ${s.frames.medianDrawCalls}\n  Worker latency p95: ${s.jobLatencyP95Ms?.toFixed(1)??'—'} ms; completed: ${s.jobs}\n`).join('\n')+`\nBaseline drift: ${report.baselineDriftPercent.toFixed(1)}%`;
  status.textContent='Comparison complete. This measures worker-load headroom, not full reflector integration.';download.disabled=false;
 }
 function run(){
  if(running)return;
  if(document.hidden){status.textContent='Bring this tab to the foreground before starting.';return;}
  running=true;report={date:new Date().toISOString(),subject:document.getElementById('subject-type').value,stages:[],views:renderers.map(r=>({width:r.domElement.width,height:r.domElement.height,pixelRatio:r.getPixelRatio()})),visualDof:photo.bokeh.enabled};
  saved={states:lighting.snapshot(),markers:document.getElementById('light-marker').checked};
  const stress=structuredClone(saved.states);
  for(const [name,s] of Object.entries(stress)){s.enabled=true;s.mode='studio';s.source=name==='background'?'hard':'soft';}
  lighting.restore(stress,saved.markers);lighting.tick();
  lights=[];scene.traverse(o=>{if(o.isSpotLight&&o.visible)lights.push({position:o.position.toArray(),target:o.target.position.toArray(),intensity:o.intensity,angle:o.angle,penumbra:o.penumbra});});
  report.sourceSamples=lights.length;
  originalReset=renderers.map(r=>r.info.autoReset);renderers.forEach(r=>{r.info.autoReset=false;});
  document.querySelector('.workspace').inert=true;document.querySelector('.setup-actions').inert=true;document.querySelector('.comparison').inert=true;
  runButton.disabled=true;stopButton.disabled=false;download.disabled=true;output.textContent='';
  worker=new Worker(new URL('./reflectorLoad.worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{
   inFlight=false;if(data.error){finish(data.error);return;}
   if(phase&&jobPhase===phase[0]&&warmup===0)jobs.push({latency:performance.now()-jobStart,cpu:data.totalMs,board:data.boardMs,bounce:data.bounceMs,cached:data.cached});
  };
  worker.onerror=event=>finish('Worker failed: '+event.message);
  inFlight=false;stageIndex=-1;launchPhase();timer=setTimeout(()=>finish('Stopped after 60 seconds; no completed comparison. Try a lighter scene.'),60000);
 }
 runButton.onclick=()=>{try{run();}catch(e){finish('Benchmark could not start: '+e.message);}};
 stopButton.onclick=()=>finish('Comparison stopped; original lighting restored.');
 download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='FrameLab-reflector-benchmark.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.addEventListener('visibilitychange',()=>{if(running&&document.hidden)finish('Stopped because the tab was hidden; timing would be unreliable.');});
 window.addEventListener('resize',()=>{if(running)finish('Stopped because the viewport changed. Rerun at a fixed size.');});
 if(new URLSearchParams(location.search).get('reflectorPerf')==='run')setTimeout(()=>runButton.click(),1000);
 return {
  begin(){if(!running)return;startTime=performance.now();renderers.forEach(r=>r.info.reset());},
  end(){
   if(!running)return;
   const now=performance.now();
   if(warmup>0){warmup--;previousTime=startTime;}
   else if(previousTime!==null){frames.push({interval:startTime-previousTime,submit:now-startTime,calls:renderers.reduce((sum,r)=>sum+r.info.render.calls,0)});previousTime=startTime;}
   if(frames.length>=120&&now-phaseStart>=3000&&!inFlight){
    report.stages.push({name:phase[0],frames:summariseFrames(frames),jobs:jobs.length,jobLatencyP95Ms:percentile(jobs.map(j=>j.latency),.95),workerCpuP95Ms:percentile(jobs.map(j=>j.cpu),.95),boardCpuP95Ms:percentile(jobs.map(j=>j.board),.95),bounceCpuP95Ms:percentile(jobs.map(j=>j.bounce),.95),cacheHits:jobs.filter(j=>j.cached).length});
    launchPhase();return;
   }
   if(phase[1]&&!inFlight&&now>=nextJob){
    inFlight=true;jobStart=now;jobPhase=phase[0];nextJob=now+100;
    worker.postMessage({id:++serial,lights,divisions:phase[1],yaw:phase[0]==='Moving board'?Math.sin(serial*.3)*.25:0,distance:2+Math.sin(serial*.3)*.2});
   }
  }
 };
}
