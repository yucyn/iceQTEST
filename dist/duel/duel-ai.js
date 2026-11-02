// CourtIQ Ice tactical policy v0.2: role assignments, space and passing.
// Deterministic heuristics, not calibrated real-match predictions.
import {OWN,OPP,distance,icePoint,laneDistance} from '../trial-model.js';
import {actorSide} from './duel-core.js';
const ids=[...OWN,...OPP],point=(p)=>({x:p.x,y:p.y});
function toward(p,q,max){const d=distance(p,q);return d<1?point(p):icePoint({x:p.x+(q.x-p.x)*Math.min(1,max/d),y:p.y+(q.y-p.y)*Math.min(1,max/d)});}
const goal=team=>({x:team==='own'?890:110,y:300});
const at=(s,id)=>s[actorSide(id)][id];
function laneBlocked(s,a,b,team){
 return Object.entries(s[team==='own'?'opponents':'own']).some(([,p])=>{const q=laneDistance(p,a,b);return q.u>.08&&q.u<.92&&q.distance<26;});
}
function pickPass(s,carrier,team){
 const from=at(s,carrier),g=goal(team);
 return (team==='own'?OWN:OPP).filter(id=>id!==carrier).map(id=>{
 const p=at(s,id),clear=!laneBlocked(s,from,p,team),progress=distance(from,g)-distance(p,g),spacing=distance(from,p);
 return {id,score:(clear?35:-100)+progress*.38-Math.abs(spacing-125)*.12};
 }).sort((a,b)=>b.score-a.score)[0];
}
function desired(s,role){
 const team=actorSide(role),ours=team==='own'?OWN:OPP,enemies=team==='own'?OPP:OWN;
 const p=at(s,role),carrier=s.owner,withPuck=carrier&&actorSide(carrier)===team;
 const ownGoal=goal(team==='own'?'opponents':'own'),attackGoal=goal(team);
 const rank=ours.indexOf(role),defender=rank>=3;
 if(withPuck){
   // Defensive players hold shape instead of blindly following possession.
   if(defender) return {x:team==='own'?Math.min(620,p.x):Math.max(380,p.x),y:rank===3?220:380};
   if(role===carrier)return attackGoal;
   const carrierP=at(s,carrier),x=carrierP.x+(team==='own'?90:-90);
   return {x:Math.max(65,Math.min(935,x)),y:rank===1?170:rank===2?430:300};
 }
 // Defending: C protects slot, defenders divide puck and weak-side coverage, wings guard high lanes.
 const threats=enemies.filter(id=>id!==carrier).map(id=>({id,p:at(s,id),d:distance(at(s,id),ownGoal)})).sort((a,b)=>a.d-b.d);
 const puck=s.puck;
 if(rank===0)return {x:team==='own'?205:795,y:Math.max(230,Math.min(370,threats[0]?.p.y||300))};
 if(rank===3)return puck;
 if(rank===4)return {x:team==='own'?205:795,y:puck.y<300?355:245};
 return {x:team==='own'?375:625,y:rank===1?195:405};
}
export function planBaselineAI(state,{policy='press'}={}){
 if(!['press','hold'].includes(policy))throw Error('Unknown policy');
 const aiIds=ids.filter(id=>!state.controlledPlayers.includes(id));
 if(policy==='hold')return aiIds.map(role=>({type:'hold',role}));
 const carrier=state.owner,carrierAI=carrier&&aiIds.includes(carrier);
 let pass=null;
 if(carrierAI){
   const team=actorSide(carrier),p=at(state,carrier),g=goal(team),nearGoal=distance(p,g)<230;
   const receiver=pickPass(state,carrier,team),block=laneBlocked(state,p,g,team);
   if(receiver&&receiver.score>27&&(block||nearGoal))pass={type:'pass',role:carrier,to:receiver.id};
 }
 return aiIds.map(role=>{
   if(pass?.role===role)return pass;
   const p=at(state,role),q=desired(state,role);
   const step=role===carrier?Math.min(32,55*state.tickSeconds):Math.min(25,50*state.tickSeconds);
   const to=toward(p,q,step);
   return distance(p,to)<2?{type:'hold',role}:{type:'move',role,to};
 });
}
export function explainAI(state,actions){
 const pass=actions.find(a=>a.type==='pass');
 if(pass)return `AI 判斷持球路線受到限制，嘗試傳球給 ${pass.to}。這是啟發式戰術選擇，並非成功率預測。`;
 if(state.owner&&actions.some(a=>a.role===state.owner&&a.type==='move'))return 'AI 持球者嘗試推進；其他球員依照位置分工維持支援與防守覆蓋。';
 return 'AI 根據持球方、球員職責和球門前危險區域調整站位；沒有要求所有人追球。';
}
