// CourtIQ Ice duel core v0.1. Isolated from lesson playback and free-board tools.
// Deterministic, simultaneous tactical turns; illustrative board units, not real hockey physics.
import {OWN, OPP, insideIce, distance} from '../trial-model.js';
const IDs=[...OWN,...OPP];
const clone=x=>structuredClone(x);
const point=p=>({x:p.x,y:p.y});
const side=(id)=>OWN.includes(id)?'own':OPP.includes(id)?'opponents':null;
export function createDuel(frame,{mode='individual',controlledRole='C',tickSeconds=1}={}){
  if(!['individual','team'].includes(mode)||!OWN.includes(controlledRole))throw Error('Invalid duel control mode');
  if(!Number.isFinite(tickSeconds)||tickSeconds<=0||tickSeconds>3)throw Error('Invalid tick');
  const own=clone(frame.own),opponents=clone(frame.opponents);
  for(const id of IDs){const p=(OWN.includes(id)?own:opponents)[id];if(!p||!insideIce(p))throw Error('Invalid player '+id);}
  const owner=frame.owner??null;if(owner!==null&&!IDs.includes(owner))throw Error('Invalid puck owner');
  const puck=owner?point((side(owner)==='own'?own:opponents)[owner]):clone(frame.puck);
  if(!puck||!insideIce(puck))throw Error('Invalid puck');
  return {version:1,mode,controlledRole,controlledPlayers:mode==='team'?[...OWN]:[controlledRole],own,opponents,puck,owner,tick:0,tickSeconds,lessonId:frame.lessonId||null,caseId:frame.caseId||null,lastTurn:null};
}
export function actorSide(id){return side(id);}
export function legalActions(state,actions,allowed, {maxStep=70}={}){
  if(!Array.isArray(actions)||actions.length>IDs.length)throw Error('Invalid actions');
  const seen=new Set();
  for(const a of actions){
    if(!a||!allowed.includes(a.role)||seen.has(a.role))throw Error('Unauthorized or repeated role');
    seen.add(a.role);
    if(a.type==='move'){
      if(!a.to||!insideIce(a.to))throw Error('Move off ice');
      const p=(side(a.role)==='own'?state.own:state.opponents)[a.role];
      if(distance(p,a.to)>maxStep*state.tickSeconds+1e-6)throw Error('Move exceeds speed limit');
    }else if(a.type==='pass'){
      if(a.role!==state.owner||!IDs.includes(a.to)||side(a.to)!==side(a.role)||a.to===a.role)throw Error('Invalid pass');
    }else if(a.type!=='hold')throw Error('Invalid action type');
  }
  return true;
}
export function stepDuel(before,playerActions=[],aiActions=[],opts={}){
  const controlled=before.controlledPlayers;
  const aiControlled=IDs.filter(id=>!controlled.includes(id));
  legalActions(before,playerActions,controlled,opts);
  legalActions(before,aiActions,aiControlled,opts);
  const combined=[...playerActions,...aiActions],next=clone(before),events=[];
  // All orders are validated against the same pre-turn snapshot.
  for(const a of combined){if(a.type==='move'){next[side(a.role)][a.role]=point(a.to);events.push({type:'move',role:a.role});}}
  const passes=combined.filter(a=>a.type==='pass');
  if(passes.length>1)throw Error('Only one puck pass per turn');
  if(passes.length){
    const a=passes[0],origin=before[side(a.role)][a.role],target=next[side(a.to)][a.to];
    // First-version clear-lane heuristic. Not a measured interception probability.
    const defenders=Object.entries(next[side(a.role)==='own'?'opponents':'own']);
    const dx=target.x-origin.x,dy=target.y-origin.y,len=dx*dx+dy*dy;
    const blocked=defenders.map(([id,p])=>{const t=len?Math.max(0,Math.min(1,((p.x-origin.x)*dx+(p.y-origin.y)*dy)/len)):0;return {id,t,d:Math.hypot(p.x-(origin.x+t*dx),p.y-(origin.y+t*dy))};}).filter(x=>x.t>.08&&x.t<.92&&x.d<22).sort((a,b)=>a.t-b.t)[0];
    next.owner=blocked?.id||a.to;events.push({type:blocked?'intercept':'pass',from:a.role,to:next.owner});
  }
  // Puck retrieval: a loose puck can be picked up by the nearest skater.
  // Controlled possession is not stolen merely by occupying the same coordinates:
  // physical challenges require a future contested-possession model.
  if(!next.owner){
    const candidates=IDs.map(id=>({id,p:next[side(id)][id]}))
      .map(x=>({...x,d:distance(x.p,next.puck)}))
      .filter(x=>x.d<=22).sort((a,b)=>a.d-b.d||a.id.localeCompare(b.id));
    if(candidates.length){next.owner=candidates[0].id;events.push({type:'pickup',to:next.owner});}
  }
  if(next.owner)next.puck=point(next[side(next.owner)][next.owner]);
  next.tick=before.tick+1;
  next.lastTurn={playerActions:clone(playerActions),aiActions:clone(aiActions),events};
  return next;
}
export function switchDuelMode(state,mode,controlledRole='C'){
  if(!['individual','team'].includes(mode)||!OWN.includes(controlledRole))throw Error('Invalid control mode');
  return {...clone(state),mode,controlledRole,controlledPlayers:mode==='team'?[...OWN]:[controlledRole]};
}
export function createDuelHistory(initial){
  const states=[clone(initial)];let index=0;
  return {current:()=>clone(states[index]),commit:(next)=>{states.splice(index+1);states.push(clone(next));index++;return clone(next);},undo:()=>{index=Math.max(0,index-1);return clone(states[index]);},redo:()=>{index=Math.min(states.length-1,index+1);return clone(states[index]);},length:()=>states.length};
}
