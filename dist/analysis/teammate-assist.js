// Explicit cooperation policy for lesson trial. Teammate actions are bounded and inspectable.
import {OWN,distance,icePoint} from '../trial-model.js';
const LIMIT=32;
function toward(a,b,step){const d=distance(a,b);return d<1?{...a}:icePoint({x:a.x+(b.x-a.x)*Math.min(1,step/d),y:a.y+(b.y-a.y)*Math.min(1,step/d)});}
function onIce(s,id){return !Array.isArray(s.activePlayers)||s.activePlayers.includes(id);}
export function cooperate(before,after,controlled,{maxStep=LIMIT,reserved=[]}={}){
 if(!OWN.includes(controlled)||!after?.own||!after?.opponents)return after;
 const next=structuredClone(after),other=OWN.filter(id=>id!==controlled&&!reserved.includes(id)&&onIce(after,id));
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
   // Attack: the puck carrier must keep possession; unselected teammates look for support.
   // A close receiver may move into an open lane, not automatically advance toward the goal.
   const carrierId=after.owner,carrier=after.own[carrierId];
   // Follow the play with defensive depth: the available backline shifts as a unit
   // only when a gap grows, without passing the puck or converging on one spot.
   // The attacking direction in the lesson trial is rightward (own goal left).
   const activeBacks=['LD','RD'].filter(id=>other.includes(id)&&id!==carrierId);
   for(const id of activeBacks){
     const p=after.own[id];
     const laneY=id==='LD'?220:380;
     const coverX=Math.max(195,Math.min(600,carrier.x-125));
     const target=icePoint({x:coverX,y:laneY});
     // Preserve defensive depth, and do not shuffle for tiny changes.
     if(distance(p,target)<22)continue;
     const to=toward(before.own[id],target,Math.min(maxStep,25));
     if(distance(before.own[id],to)>3){
       next.own[id]=to;
       responses.push({id,from:{...before.own[id]},to:{...to},body:id+' 隨進攻推進保持後方防守層次，防止失球後遭反擊。'});
       events.push(id+' 跟進並維持後方保護。');
     }
   }
   const candidates=other.filter(id=>id!==carrierId);
   const planned=candidates.map(id=>{
     const p=after.own[id],d=distance(p,carrier);
     // Prefer a nearby support player; allow movement even when within 145 units.
     const target=icePoint({
       x:Math.max(65,Math.min(935,carrier.x+Math.max(-85,Math.min(85,p.x-carrier.x)))),
       y:Math.max(75,Math.min(525,p.y+(p.y>=carrier.y?18:-18)))
     });
     const defenders=Object.values(after.opponents);
     const oldPressure=Math.min(...defenders.map(q=>distance(q,p)));
     const newPressure=Math.min(...defenders.map(q=>distance(q,target)));
     const gain=newPressure-oldPressure;
     return {id,p,target,d,gain,score:Math.abs(d-115)+Math.max(0,45-newPressure)*2};
   }).filter(x=>x.d<270&&x.d>25&&distance(x.p,x.target)>8)
     .sort((a,b)=>a.score-b.score);
   const selected=candidates.length?planned[0]:null;
   if(selected){
     const from=before.own[selected.id],to=toward(from,selected.target,Math.min(maxStep,26));
     if(distance(from,to)>3){
       next.own[selected.id]=to;
       responses.push({id:selected.id,from:{...from},to:{...to},body:selected.id+' 向 '+carrierId+' 提供側向接應，維持傳球選項。'});
       events.push(selected.id+' 移動形成接應。');
     }
   }

 }
 if(next.owner&&OWN.includes(next.owner))next.puck={...next.own[next.owner]};
 if(!responses.length){events.push('AI 隊友保持現有站位：尚未找到需要移動且不破壞分工的補位或接應。');}
 next.responses=[...(next.responses||[]),...responses];
 next.events=[...(next.events||[]),...events];
 return next;
}
