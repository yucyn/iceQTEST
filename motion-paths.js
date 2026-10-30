const PLAYERS=['C','LW','RW','LD','RD','OC','OL','OR','ODL','ODR'];
export function cleanMotionPaths(paths={}){
 if(!paths||typeof paths!=='object'||Array.isArray(paths)||Object.keys(paths).length>10)throw Error('球員路線資料無效');
 return Object.fromEntries(Object.entries(paths).map(([id,s])=>{if(!PLAYERS.includes(id)||!s||!['solid','carry','pass'].includes(s.type)||!['blue','red'].includes(s.color)||!Array.isArray(s.points)||s.points.length<2||s.points.length>100)throw Error('球員路線資料無效');return [id,{type:s.type,color:s.color,points:s.points.map(p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<40||p.x>960||p.y<50||p.y>550)throw Error('球員路線座標無效');return {x:+p.x.toFixed(1),y:+p.y.toFixed(1)};})}];}));
}
// Constant distance along the drawn polyline, rather than a straight endpoint chord.
export function sampleMotionPath(points,u){
 u=Math.max(0,Math.min(1,u));if(u===0)return {...points[0]};if(u===1)return {...points.at(-1)};
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));let remaining=lengths.reduce((a,b)=>a+b,0)*u;
 for(let i=0;i<lengths.length;i++){const d=lengths[i];if(d>0&&remaining<=d){const t=remaining/d,a=points[i],b=points[i+1];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}remaining-=d;}return {...points.at(-1)};
}

export function cleanPuckPass(value){
 if(value==null)return null;
 const {from,to,startsAt,line}=value;const shot=line?.type==='shot';if(!PLAYERS.includes(from)||![0,.55].includes(startsAt)||shot&&to!==null||!shot&&(!PLAYERS.includes(to)||from===to||(PLAYERS.indexOf(from)<5)!==(PLAYERS.indexOf(to)<5)||line?.type!=='pass'))throw Error('傳球或射門路線資料無效');
 const cleaned=cleanMotionPaths({[from]:{...line,type:'pass'}})[from];return {from,to,startsAt,line:{...cleaned,type:shot?'shot':'pass'}};
}
