export function percentile(values,p) {
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];
}
export function summariseFrames(frames) {
 return {frames:frames.length,medianMs:percentile(frames.map(f=>f.interval),.5),p95Ms:percentile(frames.map(f=>f.interval),.95),medianSubmitMs:percentile(frames.map(f=>f.submit),.5),medianDrawCalls:percentile(frames.map(f=>f.calls),.5),maxDrawCalls:frames.length?Math.max(...frames.map(f=>f.calls)):null};
}
