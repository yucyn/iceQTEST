// Limited AI teammate cooperation for lesson trial snapshots.
// Does not run in free-board mode. Other team never moves automatically.
import {OWN,distance,icePoint} from '../trial-model.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function toward(a,b,limit){const d=distance(a,b);return d<1?{...a}:icePoint({x:a.x+(b.x-a.x)*Math.min(1,limit/d),y:a.y+(b.y-a.y)*Math.min(1,limit/d)});}
export function cooperate(before,after,controlled,{maxStep=24}={}){
 if(!OWN.includes(controlled))return after;
 const next=structuredClone(after),puck=after.puck;
 const ownGoal={x:110,y:300};
 const isDefense=after.owner&&!OWN.includes(after.owner);
 const others=OWN.filter(id=>id!==controlled);
 let moved=[];
 if(isDefense){
   // Assign the nearest available defender to apply light pressure. Others protect their shape.
   const pressure=others.filter(id=>['LD','RD'].includes(id)).map(id=>({id,d:distance(after.own[id],puck)})).sort((a,b)=>a.d-b.d)[0];
   const coverage=others.filter(id=>id!==pressure?.id).map(id=>({id,d:distance(after.own[id],{x:225,y:300})})).sort((a,b)=>a.d-b.d)[0];
   for(const id of others){
     let target=null;
     if(id===pressure?.id&&pressure.d<125) target={x:clamp(puck.x+30,100,380),y:puck.y};
     else if(id===coverage?.id){
       const threat=Object.entries(after.opponents).filter(([r])=>r!==after.owner).map(([r,p])=>({r,p,d:distance(p,ownGoal)})).sort((a,b)=>a.d-b.d)[0];
       if(threat&&distance(threat.p,ownGoal)<215){
         target={x:clamp(threat.p.x-28,125,345),y:clamp(threat.p.y,225,375)};
       }
     }
     if(target&&distance(after.own[id],target)>18){
       const to=toward(before.own[id],target,maxStep);
       if(distance(to,before.own[id])>3){next.own[id]=to;moved.push(id);}
     }
   }
 }else if(after.owner&&OWN.includes(after.owner)){
   const carrier=after.own[after.owner];
   const receiver=others.filter(id=>['LW','RW','C'].includes(id)).map(id=>({id,d:distance(after.own[id],carrier)})).sort((a,b)=>a.d-b.d)[0];
   if(receiver&&receiver.d>180&&receiver.d<285){
     const id=receiver.id,to=toward(before.own[id],{x:carrier.x+65,y:after.own[id].y},maxStep);
     if(distance(to,before.own[id])>3){next.own[id]=to;moved.push(id);}
   }
 }
 // Keep possession synchronized to movement (without inventing a turnover).
 if(next.owner&&OWN.includes(next.owner))next.puck={...next.own[next.owner]};
 if(moved.length){
   next.responses=[...(next.responses||[]),...moved.map(id=>({id,from:{...before.own[id]},to:{...next.own[id]},body:'AI 隊友 '+id+' 依據門前覆蓋或接應需求調整站位。'}))];
   next.events=[...(next.events||[]),'AI 隊友協作：'+moved.join('、')+' 調整位置。'];
 }
 return next;
}
