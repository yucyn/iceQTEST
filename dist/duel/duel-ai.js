// Lightweight baseline policy. Receives only current state (no advance knowledge of player actions).
import {OWN,OPP,distance,icePoint} from '../trial-model.js';
import {actorSide} from './duel-core.js';
const ids=[...OWN,...OPP];
function toward(p,q,max){const d=distance(p,q);return d<1?{...p}:icePoint({x:p.x+(q.x-p.x)*Math.min(1,max/d),y:p.y+(q.y-p.y)*Math.min(1,max/d)});}
export function planBaselineAI(state,{policy='press'}={}){
  if(!['press','hold'].includes(policy))throw Error('Unknown policy');
  const aiIds=ids.filter(id=>!state.controlledPlayers.includes(id));
  if(policy==='hold')return aiIds.map(role=>({type:'hold',role}));
  const actions=[],carrier=state.owner;
  for(const role of aiIds){
    const team=actorSide(role),p=state[team][role];
    if(role===carrier){
      // Carrier moves toward the opposing goal, without looking ahead at player's hidden turn.
      const goal={x:team==='own'?890:110,y:300};
      actions.push({type:'move',role,to:toward(p,goal,Math.min(35,65*state.tickSeconds))});continue;
    }
    const sameSide=carrier&&actorSide(carrier)===team;
    const target=sameSide
      ? {x:(p.x+state.puck.x)/2,y:p.y*.55+300*.45}
      : state.puck;
    actions.push({type:'move',role,to:toward(p,target,Math.min(20,50*state.tickSeconds))});
  }
  return actions;
}
