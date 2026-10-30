import {sampleMotionPath} from './motion-paths.js';
// Apply only to fresh pointer input. Saved routes are never smoothed again.
export function smoothDrawnLine(line){
 const copy=p=>({x:p.x,y:p.y}),raw=line.points.map(copy);
 if(raw.length<3)return {...line,points:raw};
 if(['shot','pass'].includes(line.type))return {...line,points:[raw[0],raw.at(-1)]};
 // A short weighted filter removes alternating hand jitter without moving endpoints.
 const filtered=raw.map((p,i)=>i===0||i===raw.length-1?p:{x:(raw[i-1].x+2*p.x+raw[i+1].x)/4,y:(raw[i-1].y+2*p.y+raw[i+1].y)/4});
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
 const simplify=pts=>{if(pts.length<3)return pts;let best=5,index=0;for(let i=1;i<pts.length-1;i++){const d=distance(pts[i],pts[0],pts.at(-1));if(d>best){best=d;index=i;}}return index?[...simplify(pts.slice(0,index+1)).slice(0,-1),...simplify(pts.slice(index))]:[pts[0],pts.at(-1)];};
 let points=simplify(filtered);
 // Five corner-cutting passes produce a smooth polyline that both renderers and
 // the movement sampler can use, with exactly the original start and finish.
 for(let pass=0;pass<5&&points.length>2;pass++){
  const next=[points[0]];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];next.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y},{x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y});}next.push(points.at(-1));points=next;
 }
 if(points.length>100){const curve=points;points=Array.from({length:100},(_,i)=>sampleMotionPath(curve,i/99));}
 return {...line,points:points.map(copy)};
}
