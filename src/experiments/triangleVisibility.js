// Small median-split BVH for the experiment's opaque, static triangle snapshots.
export function buildTree(triangles) {
 function node(items) {
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const t of items)for(let i=0;i<9;i++){min[i%3]=Math.min(min[i%3],t[i]);max[i%3]=Math.max(max[i%3],t[i]);}
  if(items.length<=8)return {min,max,items};
  let axis=0;for(let i=1;i<3;i++)if(max[i]-min[i]>max[axis]-min[axis])axis=i;
  items.sort((a,b)=>(a[axis]+a[axis+3]+a[axis+6])-(b[axis]+b[axis+3]+b[axis+6]));
  const mid=items.length>>1;return {min,max,left:node(items.slice(0,mid)),right:node(items.slice(mid))};
 }
 return triangles.length?node(triangles):null;
}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export function occluded(tree,a,b) {
 const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d);if(length<.0002)return false;
 const epsilon=.0001/length;
 function visit(n) {
  if(!n)return false;let lo=epsilon,hi=1-epsilon;
  for(let k=0;k<3;k++){
   if(Math.abs(d[k])<1e-12){if(a[k]<n.min[k]||a[k]>n.max[k])return false;}
   else {let p=(n.min[k]-a[k])/d[k],q=(n.max[k]-a[k])/d[k];if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return false;}
  }
  if(!n.items)return visit(n.left)||visit(n.right);
  return n.items.some(t=>{
   const e1=[t[3]-t[0],t[4]-t[1],t[5]-t[2]],e2=[t[6]-t[0],t[7]-t[1],t[8]-t[2]];
   const p=cross(d,e2),det=dot(e1,p);if(Math.abs(det)<1e-12)return false;
   const s=[a[0]-t[0],a[1]-t[1],a[2]-t[2]],u=dot(s,p)/det;if(u<0||u>1)return false;
   const q=cross(s,e1),v=dot(d,q)/det;if(v<0||u+v>1)return false;
   const distance=dot(e2,q)/det;return distance>epsilon&&distance<1-epsilon;
  });
 }
 return visit(tree);
}
