import {it,expect,vi,afterEach} from 'vitest';
import {percentile,summariseFrames} from '../experiments/performanceStats.js';
afterEach(()=>vi.unstubAllGlobals());
it('reports tail latency separately from median and sums complete-frame counters',()=>{
 const frames=Array.from({length:100},(_,i)=>({interval:i<90?16:40,submit:4,calls:120}));
 expect(summariseFrames(frames)).toMatchObject({frames:100,medianMs:16,p95Ms:40,medianDrawCalls:120});
 expect(percentile([],.95)).toBe(null);
});
it('combines lamp contributions, caches incident light and invalidates on board changes',async()=>{
 const postMessage=vi.fn();vi.stubGlobal('self',{postMessage});
 await import('../experiments/reflectorLoad.worker.js');
 const light={position:[0,2,3],target:[0,1.2,0],intensity:100,angle:Math.PI/3};
 const request={id:1,lights:[light],divisions:4,yaw:0,distance:2};
 self.onmessage({data:request});
 const first=postMessage.mock.calls.at(-1)[0];expect(first.cached).toBe(false);expect(first.result.some(v=>v>0)).toBe(true);
 self.onmessage({data:{...request,id:2}});
 expect(postMessage.mock.calls.at(-1)[0].cached).toBe(true);
 self.onmessage({data:{...request,lights:[light,light]}});
 const combined=postMessage.mock.calls.at(-1)[0];
 expect(combined.cached).toBe(false);
 for(let i=0;i<1024;i++)expect(combined.result[i]).toBeCloseTo(first.result[i]*2,5);
 self.onmessage({data:{...request,lights:[light,light],yaw:.1}});
 expect(postMessage.mock.calls.at(-1)[0].cached).toBe(false);
});
