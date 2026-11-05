// CourtIQ Ice conservative tactical AI v0.3.
// A role-based, spatially bounded baseline — NOT a trained hockey AI.
import {OWN,OPP,distance,icePoint,laneDistance} from '../trial-model.js';
import {actorSide} from './duel-core.js';
const IDS=[...OWN,...OPP];
const at=(s,id)=>s[actorSide(id)][id];
const goal=side=>({x:side==='own'?890:110,y:300});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function toward(a,b,step){const d=distance(a,b);return d<1?{...a}:icePoint({x:a.x+(b.x-a.x)*Math.min(step/d,1),y:a.y+(b.y-a.y)*Math.min(step/d,1)});}
function passLaneOpen(s,carrier,target){
 const side=actorSide(carrier),from=at(s,carrier),to=at(s,target);
 return !Object.values(s[side==='own'?'opponents':'own']).some(p=>{const l=laneDistance(p,from,to);return l.u>.1&&l.u<.9&&l.distance<27;});
}
export function planBaselineAI(state,{policy='press'}={}){
 if(!['press','hold'].includes(policy))throw Error('Unknown policy');
 const ai=IDS.filter(id=>!state.controlledPlayers.includes(id));
 if(policy==='hold')return ai.map(role=>({role,type:'hold'}));
 const carrier=state.owner,carrierSide=carrier?actorSide(carrier):null;
 // Select a single chasing defender, never the entire five-player unit.
 const pressure={};
 for(const side of ['own','opponents']){
   if(carrierSide===side)continue;
   const members=side==='own'?OWN:OPP;
   // A closer defender is preferred; no cross-ice teleporting or automatic pursuit.
   const pool=members.filter(id=>ai.includes(id)&&(members.indexOf(id)>=3||distance(at(state,id),state.puck)<85));
   const nearest=pool.map(id=>({id,d:distance(at(state,id),state.puck)})).sort((a,b)=>a.d-b.d)[0];
   if(nearest&&nearest.d<=120)pressure[side]=nearest.id;
 }
 const actions=[];
 for(const role of ai){
   const side=actorSide(role),team=side==='own'?OWN:OPP,idx=team.indexOf(role),p=at(state,role);
   const attacking=carrierSide===side;
   if(role===carrier){
     // Avoid constant goalward drift; take space only with a local, clear lane.
     const g=goal(side),nearOpponent=Object.values(state[side==='own'?'opponents':'own']).some(q=>distance(q,p)<90);
     const candidate={x:p.x+(side==='own'?28:-28),y:p.y+(300-p.y)*.12};
     if(!nearOpponent&&distance(p,g)>120){actions.push({type:'move',role,to:toward(p,candidate,Math.min(18,35*state.tickSeconds))});continue;}
     const receivers=team.filter(id=>id!==role&&ai.includes(role)&&distance(p,at(state,id))>=45&&distance(p,at(state,id))<=210&&passLaneOpen(state,role,id));
     const preferred=receivers.sort((a,b)=>Math.abs(at(state,a).y-p.y)-Math.abs(at(state,b).y-p.y))[0];
     actions.push(preferred?{type:'pass',role,to:preferred}:{type:'hold',role});continue;
   }
   // Keep shape in neutral or loose-puck situations.
   if(!carrier||attacking){actions.push({type:'hold',role});continue;}
   if(pressure[side]===role){
     const q=state.puck;
     // Stay outside the carrier and stop short rather than stack on the puck.
     const stop=toward(p,q,Math.min(19,34*state.tickSeconds));
     actions.push(distance(p,stop)>=3?{type:'move',role,to:stop}:{type:'hold',role});continue;
   }
   // All remaining players keep their current zone and coverage;
   // no absolute coordinate 'home' that pulls them unrealistically across the rink.
   actions.push({type:'hold',role});
 }
 return actions;
}
export function explainAI(state,actions){
 const pass=actions.find(a=>a.type==='pass');
 if(pass)return 'AI 觀察到持球路線受阻，嘗試向 '+pass.to+' 傳球；這是簡化的安全接應判斷。';
 const movers=actions.filter(a=>a.type==='move').map(a=>a.role);
 return movers.length?'AI 只安排局部持球推進或最近防守者施壓（'+movers.join('、')+'）；其他球員守住現有站位。':'當前沒有足夠理由改變站位，AI 選擇保持隊形。';
}
