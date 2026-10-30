import {icePoint} from './trial-model.js';
export const INK_COLORS={blue:'#236cbe',red:'#d63c45'};
export function cleanInk(lines=[]){
 if(!Array.isArray(lines)||lines.length>60)throw Error('畫線最多 60 筆，請先刪除部分線條');
 return lines.map(s=>{if(!['blue','red'].includes(s.color)||!['solid','carry','pass','shot'].includes(s.type)||!Array.isArray(s.points)||s.points.length<2||s.points.length>100)throw Error('戰術畫線資料無效');return {color:s.color,type:s.type,points:s.points.map(p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error('畫線座標無效');const q=icePoint(p);return {x:+q.x.toFixed(1),y:+q.y.toFixed(1)};})};});
}
// Shared line geometry for both renderers; motion paths are stored separately.
export function inkSegments(stroke){
 const pts=stroke.points,out=[];let phase=0;
 for(let j=1;j<pts.length;j++){const a=pts[j-1],b=pts[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(!d)continue;const nx=-dy/d,ny=dx/d,n=Math.max(1,Math.ceil(d/3));let prev;
 for(let k=0;k<=n;k++){const u=k/n,t=phase+d*u,offset=stroke.type==='carry'?Math.sin(t/6)*4:0,p={x:a.x+dx*u+nx*offset,y:a.y+dy*u+ny*offset};if(prev&&(stroke.type!=='pass'||Math.floor(t/9)%2===0)){if(stroke.type==='shot'){for(const sign of [-1,1])out.push([{x:prev.x+nx*3*sign,y:prev.y+ny*3*sign},{x:p.x+nx*3*sign,y:p.y+ny*3*sign}]);}else out.push([prev,p]);}prev=p;}phase+=d;
 }
 const b=pts.at(-1);let a=pts.at(-2);for(let j=pts.length-2;j>=0;j--)if(Math.hypot(b.x-pts[j].x,b.y-pts[j].y)>10){a=pts[j];break;}const d=Math.hypot(b.x-a.x,b.y-a.y)||1,ux=(b.x-a.x)/d,uy=(b.y-a.y)/d;for(const sign of [-1,1])out.push([b,{x:b.x-ux*15-uy*7*sign,y:b.y-uy*15+ux*7*sign}]);return out;
}
