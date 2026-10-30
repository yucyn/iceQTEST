import {applyMultiPuckPlan} from './drill-pucks.js';
import {cleanMotionPaths} from './motion-paths.js';
import {cleanInk} from './board-ink.js';
import {sideFor,playerPoint,distance,icePoint,MAX_MOVE,MAX_TURNS,trialTurn,assessTrial,isOnIce} from './trial-model.js';
// One simultaneous, manually authored step; no automatic move by either side.
export function applyTrialPlan(before,{moves={},owner,passTo=null,puckPosition,paths={},passPath=null,puckActions},role){
 if(Array.isArray(before.pucks))return applyMultiPuckPlan(before,{moves,owner,passTo,puckPosition,paths,passPath,puckActions},role,applyTrialPlan);
 if(before.turn>=MAX_TURNS)throw Error(`已到 ${MAX_TURNS} 步，請撤銷或重設`);
 if(!Object.keys(moves).length&&owner===undefined&&!passTo&&!puckPosition&&passPath?.type!=='shot')throw Error('請先安排球員落點、球權或傳球');
 const next=structuredClone(before),events=[];next.responses=[];const routes=cleanMotionPaths(paths);if(Array.isArray(before.activePlayers)){next.motionPaths={};next.puckPass=null;}for(const id of Object.keys(routes))if(!moves[id])throw Error('路線需要對應球員落點');
 for(const [id,p] of Object.entries(moves)){
  const side=sideFor(before,id);if(!side||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error('球員或落點無效');
  const to=icePoint(p);if(Array.isArray(next.activePlayers)&&!next.activePlayers.includes(id))next.activePlayers.push(id);
  if(Array.isArray(before.activePlayers)){
   const line=routes[id]||{type:'solid',color:'blue',points:[isOnIce(before,id)?playerPoint(before,id):to,to]};
   if(distance(line.points.at(-1),to)>.2)throw Error('路線終點與球員落點不一致');
   const start=isOnIce(before,id)?playerPoint(before,id):to;
   const points=line.points.map(icePoint);points[0]={...start};points[points.length-1]={...to};next.motionPaths[id]={...line,points};
  }
  next[side][id]=to;events.push(`${id} 移動${next.owner===id?'並帶球':''}。`);
 }
 if(owner!==undefined){if(owner!==null&&(!sideFor(next,owner)||!isOnIce(next,owner)))throw Error('持球者無效');next.owner=owner;events.push(owner?`手動指定 ${owner} 控球（情境設定，非自動搶斷）。`:'手動設定無人控球。');}
 if(puckPosition){next.puck=icePoint(puckPosition);next.owner=null;next.puckOnIce=true;}
 if(next.owner&&Array.isArray(next.activePlayers))next.puckOnIce=true;
 if(passTo&&next.puckOnIce===false)throw Error('請先把冰球放入場內並交給已入場的球員');
 if(next.owner&&(!Array.isArray(before.activePlayers)||moves[next.owner]))next.puck={...playerPoint(next,next.owner)};
 if(passPath?.type==='shot'){
  if(!Array.isArray(before.activePlayers)||!next.owner||!isOnIce(next,next.owner)||passTo||puckPosition)throw Error('射門必須由持球球員發起');
  const from=next.owner,line=cleanInk([passPath])[0];line.points=[{...playerPoint(next,from)},icePoint(line.points.at(-1))];next.puckPass={from,to:null,startsAt:Object.keys(moves).length?.55:0,line};next.owner=null;next.puck={...line.points.at(-1)};events.push(`${from} 射門，冰球沿雙線箭頭到指定地點。`);
 }
 if(passTo){if(!sideFor(next,passTo)||!isOnIce(next,passTo)||!next.owner||sideFor(next,next.owner)!==sideFor(next,passTo)||next.owner===passTo)throw Error('接球者須與本步持球者同隊且不是本人');if(Array.isArray(before.activePlayers)){
  const from=next.owner,start=playerPoint(next,from),end=playerPoint(next,passTo),line=cleanInk([passPath||{type:'pass',color:'blue',points:[start,end]}])[0];
  if(line.type!=='pass')throw Error('傳球須使用虛線');line.points=[{...start},{...end}];
  next.puckPass={from,to:passTo,startsAt:Object.keys(moves).length?.55:0,line};next.owner=passTo;next.puck={...end};events.push(`${from} 依你指定的虛線傳給 ${passTo}（編排演示，不判定成功率）。`);
 }else{const passed=trialTurn(next,{type:'pass',role:passTo},{policy:'hold'});next.owner=passed.owner;next.puck=passed.puck;events.push(...passed.events.slice(0,-1));}}
 if(Array.isArray(before.activePlayers)){next.puckFollows=!passTo&&!puckPosition&&next.owner&&next.motionPaths[next.owner]?next.owner:null;next.annotations=cleanInk([...(before.annotations||[]),...Object.values(next.motionPaths),...(next.puckPass?[next.puckPass.line]:[])]);}
 next.turn=before.turn+1;next.events=[...events,'自由編排：只演示你安排的球員移動，兩隊均不追加自動走位。'];next.notes=assessTrial(next,role);return next;
}

// Preview the puck at its arranged carrier's destination without changing history.
export function previewPlannedPuck(state,{moves={},owner,puckPosition}={}){
 const carrier=owner===undefined?state.owner:owner;
 if(puckPosition)return {puck:{...icePoint(puckPosition)},owner:null,puckOnIce:true};
 if(carrier){const p=moves[carrier]||state.puck;return {puck:{...p},owner:carrier,puckOnIce:true};}
 return {puck:{...state.puck},owner:null,puckOnIce:state.puckOnIce};
}
