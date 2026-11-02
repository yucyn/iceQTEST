// Explicit cooperation policy for lesson trial. Teammate actions are bounded and inspectable.
import {OWN,distance,icePoint} from '../trial-model.js';
const LIMIT=32;
function toward(a,b,step){const d=distance(a,b);return d<1?{...a}:icePoint({x:a.x+(b.x-a.x)*Math.min(1,step/d),y:a.y+(b.y-a.y)*Math.min(1,step/d)});}
function onIce(s,id){return !Array.isArray(s.activePlayers)||s.activePlayers.includes(id);}
export function cooperate(before,after,controlled,{maxStep=LIMIT}={}){
 if(!OWN.includes(controlled)||!after?.own||!after?.opponents)return after;
 const next=structuredClone(after),other=OWN.filter(id=>id!==controlled&&onIce(after,id));
 const events=[],responses=[];
 const defending=after.owner&&!OWN.includes(after.owner);
 const goal={x:130,y:300};
 if(defending){
   const attacker=Object.entries(after.opponents).filter(([id])=>id!==after.owner&&onIce(after,id)).map(([id,p])=>({id,p,d:distance(p,goal)})).sort((a,b)=>a.d-b.d)[0];
   const slot={x:225,y:300};
   const c=after.own.C;
   const centerHasSlot=controlled!=='C'&&distance(c,slot)<75 || controlled==='C'&&distance(c,slot)<75;
   // A defender already pursuing the puck cannot simultaneously cover the net-front.
   const puck=after.puck;
   const chasing=other.filter(id=>['LD','RD'].includes(id)).map(id=>({id,d:distance(after.own[id],puck)})).sort((a,b)=>a.d-b.d)[0];
   const uncovered=!!attacker&&attacker.d<210&&!centerHasSlot;
   if(uncovered){
     const candidates=other.filter(id=>id!==chasing?.id&&['LD','RD','C'].includes(id));
     const cover=candidates.map(id=>({id,d:distance(after.own[id],attacker.p)})).sort((a,b)=>a.d-b.d)[0];
     if(cover){
       // Place the defender between the unmarked attacker and own goal.
       const target=icePoint({x:Math.max(155,Math.min(255,attacker.p.x-32)),y:Math.max(225,Math.min(375,attacker.p.y))});
       const from=before.own[cover.id],to=toward(from,target,Math.min(maxStep,42));
       if(distance(from,to)>2){
         next.own[cover.id]=to;responses.push({id:cover.id,from:{...from},to:{...to},body:cover.id+' 看到門前 '+attacker.id+' 無人盯防，向內補位。'});
         events.push(cover.id+' 補向門前 '+attacker.id+'。');
       }
     }
   }
   // Only pressure if the puck has moved into a nearby defender's reach.
   if(chasing&&chasing.d>32&&chasing.d<95&&!responses.some(r=>r.id===chasing.id)){
     const from=before.own[chasing.id],to=toward(from,puck,Math.min(maxStep*.65,20));
     if(distance(from,to)>3){next.own[chasing.id]=to;responses.push({id:chasing.id,from:{...from},to:{...to},body:chasing.id+' 繼續對持球者施壓。'});events.push(chasing.id+' 持續施壓。');}
   }
 }else if(after.owner&&OWN.includes(after.owner)){
   const carrier=after.own[after.owner];
   const receiver=other.filter(id=>['LW','RW','C'].includes(id)&&id!==after.owner).map(id=>({id,d:distance(after.own[id],carrier)})).sort((a,b)=>a.d-b.d)[0];
   if(receiver&&receiver.d>145&&receiver.d<260){
     const from=before.own[receiver.id];
     const target={x:Math.max(55,Math.min(945,carrier.x+65)),y:from.y};
     const to=toward(from,target,Math.min(maxStep*.7,22));
     if(distance(from,to)>3){next.own[receiver.id]=to;responses.push({id:receiver.id,from:{...from},to:{...to},body:receiver.id+' 向持球隊友提供接應位置。'});events.push(receiver.id+' 前往接應。');}
   }
 }
 if(next.owner&&OWN.includes(next.owner))next.puck={...next.own[next.owner]};
 next.responses=[...(next.responses||[]),...responses];
 next.events=[...(next.events||[]),...events];
 return next;
}
