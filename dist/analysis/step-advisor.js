// CourtIQ Ice: explainable tactical geometry, no LLM inference or win probabilities.
// Analysis is relative to the current 2D snapshot; not a certified coaching decision.
import {OWN,OPP,distance,laneDistance,insideIce} from '../trial-model.js';
const center={x:500,y:300};
const bySide=(s,side)=>side==='own'?s.own:s.opponents;
const opponents=(side)=>side==='own'?'opponents':'own';
const goal=(side)=>({x:side==='own'?110:890,y:300});
const live=(s,side)=>Object.entries(bySide(s,side)).filter(([id,p])=>(!Array.isArray(s.activePlayers)||s.activePlayers.includes(id))&&p&&insideIce(p));
export function analyzeStep(before,after,{defending='own'}={}){
 if(!['own','opponents'].includes(defending))throw Error('Invalid defending side');
 if(!after||!after.own||!after.opponents)throw Error('Missing analysis frame');
 const own=live(after,defending),attack=live(after,opponents(defending)),g=goal(defending);
 const zones=[
  {id:'net-front',name:'球門前',p:{x:defending==='own'?205:795,y:300}},
  {id:'upper',name:'上側弱區',p:{x:defending==='own'?275:725,y:185}},
  {id:'lower',name:'下側弱區',p:{x:defending==='own'?275:725,y:415}},
  {id:'high-slot',name:'高位中路',p:{x:defending==='own'?365:635,y:300}}
 ];
 const coverage=zones.map(z=>{
  const nearest=own.map(([id,p])=>({id,d:distance(p,z.p)})).sort((a,b)=>a.d-b.d)[0];
  const threat=attack.map(([id,p])=>({id,d:distance(p,z.p)})).sort((a,b)=>a.d-b.d)[0];
  const exposed=!!threat&&threat.d<105&&(!nearest||nearest.d>threat.d+32);
  return {...z,defender:nearest?.id??null,defenderDistance:nearest?.d??null,attacker:threat?.id??null,attackerDistance:threat?.d??null,exposed};
 });
 const beforeOwn=before?live(before,defending):[];
 const changed=own.filter(([id,p])=>{const old=beforeOwn.find(([k])=>k===id)?.[1];return old&&distance(old,p)>=8;}).map(([id,p])=>({id,from:beforeOwn.find(([k])=>k===id)[1],to:p}));
 const lanes=[];
 for(const [id,a] of attack){
  for(const [toId,b] of attack){
   if(toId===id||distance(a,b)>320||distance(a,b)<35)continue;
   const blocker=own.map(([defId,p])=>({id:defId,...laneDistance(p,a,b)})).filter(x=>x.u>.10&&x.u<.90&&x.distance<30).sort((x,y)=>x.distance-y.distance)[0];
   if(!blocker&&distance(b,g)<285)lanes.push({from:id,to:toId,distance:distance(a,b)});
  }
 }
 const unique=lanes.filter((l,i)=>lanes.findIndex(v=>[v.from,v.to].sort().join(':')===[l.from,l.to].sort().join(':'))===i).slice(0,3);
 const notes=[];
 const exposed=coverage.filter(z=>z.exposed);
 if(exposed.length){
  for(const z of exposed.slice(0,2))notes.push({kind:'risk',title:z.name+'可能出現空檔',body:'進攻方 '+z.attacker+' 距離該區較近，防守方最近的是 '+(z.defender||'無')+'。請確認是否需要換防或補位。',zone:z.id});
 }else notes.push({kind:'observe',title:'目前未發現明顯的區域人數失衡',body:'僅代表這組位置與距離條件未觸發警示，不代表防守一定安全。'});
 if(unique.length)notes.push({kind:'risk',title:'注意可能的傳球通道',body:unique.map(l=>l.from+' → '+l.to).join('、')+' 的直線尚無防守者位於設定的攔截範圍；仍需考慮球桿方向與傳球速度。'});
 if(changed.length)notes.push({kind:'context',title:'本步移動',body:changed.map(c=>c.id).join('、')+' 改變了位置，請比較移動前後的門前、弱側與高位覆蓋。'});
 const suggestion=exposed[0];
 if(suggestion)notes.push({kind:'observe',title:'可能的下一步',body:'優先檢查 '+suggestion.name+' 是否可由鄰近隊友接手；不要為了補位同時放掉持球者。'});
 return {notes,coverage,openLanes:unique,moved:changed,method:'heuristic-v1'};
}
