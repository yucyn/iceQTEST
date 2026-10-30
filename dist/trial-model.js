import {sampleDrillPucks,selectDrillPuck} from './drill-pucks.js';
import {sampleMotionPath} from './motion-paths.js';
// Deterministic teaching sandbox. Board units / illustrative turns, not real-game prediction.
export const OWN=['C','LW','RW','LD','RD'];
export const MAX_MOVE=Infinity,MAX_TURNS=30;
export const sideFor=(s,id)=>Object.hasOwn(s.own,id)?'own':Object.hasOwn(s.opponents,id)?'opponents':null;
export const OPP=['OC','OL','OR','ODL','ODR'];
export const isOnIce=(s,id)=>!Array.isArray(s.activePlayers)||s.activePlayers.includes(id);
export const playerPoint=(s,id)=>s.own[id]||s.opponents[id];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const copy=x=>JSON.parse(JSON.stringify(x));
export function insideIce(p){if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;const dx=Math.max(0,Math.abs(p.x-500)-350),dy=Math.max(0,Math.abs(p.y-300)-140);return Math.abs(p.x-500)<=460&&Math.abs(p.y-300)<=250&&dx*dx+dy*dy<=110*110;}
export function icePoint(p){const q={x:Math.max(45,Math.min(955,p.x)),y:Math.max(55,Math.min(545,p.y))};if(insideIce(q))return q;const cx=q.x<500?150:850,cy=q.y<300?160:440,dx=q.x-cx,dy=q.y-cy,d=Math.hypot(dx,dy);return {x:cx+dx/d*105,y:cy+dy/d*105};}
export function laneDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,u=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return {distance:distance(p,{x:a.x+u*dx,y:a.y+u*dy}),u};}
export function nearestOwner(frame){const entries=Object.entries({...frame.own,...frame.opponents}).map(([id,p])=>({id,d:distance(p,frame.puck)})).sort((a,b)=>a.d-b.d);return entries[0]?.d<=24?entries[0].id:null;}
export function createTrial(frame){const s={own:copy(frame.own),opponents:copy(frame.opponents),puck:copy(frame.puck),owner:Object.prototype.hasOwnProperty.call(frame,'owner')?frame.owner:nearestOwner(frame),turn:0,baseTime:frame.t??frame.baseTime??0,direction:frame.direction||'attack',lessonId:frame.lessonId,caseId:frame.caseId,events:[],responses:[],...(Array.isArray(frame.activePlayers)?{activePlayers:[...frame.activePlayers],puckOnIce:frame.puckOnIce!==false,annotations:structuredClone(frame.annotations||[])}:{})};return s;}
function toward(a,b,step){const d=distance(a,b);return d<.001?{...a}:icePoint({x:a.x+(b.x-a.x)*Math.min(step/d,1),y:a.y+(b.y-a.y)*Math.min(step/d,1)});}
export function assessTrial(state,role){if(!isOnIce(state,role))return [{kind:'observe',title:'球員尚未放入球場',body:'先選旁邊的球員，再點球場放入。'}];if(Array.isArray(state.activePlayers)){state={...state,own:Object.fromEntries(Object.entries(state.own).filter(([id])=>isOnIce(state,id))),opponents:Object.fromEntries(Object.entries(state.opponents).filter(([id])=>isOnIce(state,id)))};}if(!OWN.includes(role)){const p=state.opponents[role];if(!p)return [];const notes=[],owner=sideFor(state,state.owner);const crowded=Object.entries(state.opponents).find(([id,q])=>id!==role&&distance(p,q)<48);if(crowded)notes.push({kind:'risk',title:'對手隊內間距縮小',body:`${role} 與 ${crowded[0]} 靠近，可能擠壓接應空間。`});if(owner==='opponents'&&state.owner!==role){const block=Object.entries(state.own).find(([,q])=>{const d=laneDistance(q,state.puck,p);return d.u>.08&&d.u<.92&&d.distance<28;});notes.push(block?{kind:'risk',title:'對手接應線受壓',body:`己方 ${block[0]} 靠近這條直線傳球通道。`}:{kind:'open',title:'對手目前有直線接應空間',body:'模型未發現己方球員封住這條直線；仍需讀實際速度與球桿方向。'});}if(!notes.length)notes.push({kind:'observe',title:'從對手位置觀察',body:'比較此移動如何改變兩隊的間距、傳球通道與壓迫；這不是此球員的戰術正確性評分。'});return notes;}const p=state.own[role],notes=[],friendly=OWN.includes(state.owner);const others=OWN.filter(id=>id!==role&&state.own[id]);const crowded=others.find(id=>distance(p,state.own[id])<48);if(crowded)notes.push({kind:'risk',title:'隊友間距縮小',body:`${role} 和 ${crowded} 的落點很靠近，可能擠壓接球或轉身空間；本模型沒有判斷身體朝向。`});
 if(friendly&&state.owner!==role){const blocked=Object.entries(state.opponents).find(([,q])=>{const d=laneDistance(q,state.puck,p);return d.u>.08&&d.u<.92&&d.distance<28;});if(blocked)notes.push({kind:'risk',title:'直線接應通道受壓',body:`對手 ${blocked[0]} 接近持球者與 ${role} 之間的直線。若仍直傳，這個模型會視為有被攔截的風險。`});else notes.push({kind:'open',title:'目前直線未被模型封住',body:'這條線上暫無對手進入設定的攔截範圍；仍需讀球桿、速度與傳球時機。'});if(distance(p,state.puck)>240)notes.push({kind:'risk',title:'與持球者距離拉長',body:'你離球較遠，短傳支援可能接不上；較遠接應也可能有戰術用途，要搭配隊友分工判讀。'});
 if(state.puck.x<650&&p.x>650)notes.push({kind:'risk',title:'進區時機要再確認',body:'球仍在進攻藍線之前，你的落點已在另一側。請確認球與球員的先後；本模型不判定完整越位規則。'});}
 if(!friendly&&role==='RW'&&p.x>825&&p.y>420)notes.push({kind:'risk',title:'中路可能少一層支援',body:'右翼也深入持球側角落，可能和前兩位隊友重複追球；先確認原本由誰保護中路。'});
 if((role==='LD'||role==='RD')&&p.x>740)notes.push({kind:'risk',title:'後衛回防距離增加',body:'後衛往深處移動後，後方層次可能減少。是否能搶上仍取決於搭檔、球權和對方位置。'});
 if(!friendly){const goal={x:110,y:300};const attacker=Object.entries(state.opponents).sort((a,b)=>distance(a[1],goal)-distance(b[1],goal))[0];if(attacker&&p.x>attacker[1].x+45&&['C','LD','RD'].includes(role))notes.push({kind:'risk',title:'留意人與己方球門的關係',body:'較靠近己方球門的對手仍在你身後。你的移動可能讓門前缺少內側保護，需確認隊友是否接手。'});}
 if(!notes.length)notes.push({kind:'observe',title:'先看下一個變化',body:'目前沒有觸發這組簡化規則；這不代表走法一定正確。請比較隊友、對手與持球者的新關係。'});return notes;}
export function trialTurn(before,action,{policy='press'}={}){
 const team=sideFor(before,action.role);if(!team)throw new Error('請先選一名場上球員');
 if(!['move','pass'].includes(action.type))throw new Error('不支援的試走動作');
 if(!['press','hold'].includes(policy))throw new Error('不支援的回應假設');
 if(before.turn>=MAX_TURNS)throw new Error(`已到 ${MAX_TURNS} 步，請撤銷或重設再比較`);
 const s=copy(before),role=action.role,other=team==='own'?'opponents':'own',selected=s[team],responders=s[other];s.events=[];s.responses=[];const from={...selected[role]};
 if(action.type==='move'){
  if(!action.to||!Number.isFinite(action.to.x)||!Number.isFinite(action.to.y))throw new Error('請先在冰場選落點');
  const to=icePoint(action.to);
  selected[role]=to;if(s.owner===role)s.puck={...to};s.events.push(`${role} 移動${s.owner===role?'並帶球':''}；同隊其他球員維持原位。`);
 }else{
  if(sideFor(s,s.owner)!==team)throw new Error('請選擇持球者同隊的球員作為接球點');
  if(s.owner===role)throw new Error('請選擇持球者以外的隊友作為接球點');
  const a=selected[s.owner],b=selected[role];const blocks=Object.entries(responders).filter(([id])=>isOnIce(s,id)).map(([id,p])=>({id,p,...laneDistance(p,a,b)})).filter(x=>x.u>.06&&x.u<.94&&x.distance<28).sort((a,b)=>a.u-b.u);
  if(blocks.length){s.owner=blocks[0].id;s.puck={...blocks[0].p};s.events.push(`傳球直線經過 ${s.owner} 的模型攔截範圍，示意由另一隊取得球。`);}else{s.events.push(`${s.owner} 傳給 ${role}；此步假設傳球速度與接球配合成立。`);s.owner=role;s.puck={...b};}
 }
 if(policy==='press'){
  if(sideFor(s,s.owner)===other){const old={...responders[s.owner]},to=toward(old,{x:team==='own'?110:890,y:300},42);responders[s.owner]=to;s.puck={...to};s.responses.push({id:s.owner,from:old,to,body:`${s.owner} 持球向其進攻球門前進，是這次選定的回應假設。`});}
  const choices=Object.entries(responders).filter(([id])=>id!==s.owner);if(choices.length){const [id,p]=choices.sort((a,b)=>distance(a[1],selected[role])-distance(b[1],selected[role]))[0];const target=sideFor(s,s.owner)===team?(role===s.owner?selected[role]:{x:(s.puck.x+selected[role].x)/2,y:(s.puck.y+selected[role].y)/2}):selected[role];const to=toward(p,target,Math.min(55,Math.max(0,distance(p,target)-32)));s.responses.push({id,from:{...p},to,body:`${id} 向${sideFor(s,s.owner)===team?role===s.owner?'持球者':'接應通道':'你移動的位置'}靠近；其餘未指定的球員維持原位。`});responders[id]=to;}
 }else s.events.push('本步假設另一隊維持原位，沒有追加施壓。');
 s.turn++;s.notes=assessTrial(s,role);return s;
}
export function blendFrames(a,b,u){u=Math.max(0,Math.min(1,u));const lerp=(p,q)=>({x:p.x+(q.x-p.x)*u,y:p.y+(q.y-p.y)*u});const passing=b.turn===a.turn+1?b.puckPass:null,moveEnd=b.turn===a.turn+1?(b.moveEndsAt||passing?.startsAt||0):0,moveU=moveEnd?Math.min(1,u/moveEnd):u;const pathPoint=(id,p,q)=>b.turn===a.turn+1&&b.motionPaths?.[id]?sampleMotionPath(b.motionPaths[id].points,moveU):moveEnd?{x:p.x+(q.x-p.x)*moveU,y:p.y+(q.y-p.y)*moveU}:lerp(p,q);const result={...b,own:Object.fromEntries(OWN.map(id=>[id,Array.isArray(b.activePlayers)&&!isOnIce(a,id)?{...b.own[id]}:pathPoint(id,a.own[id],b.own[id])])),opponents:Object.fromEntries(Object.keys(a.opponents).map(id=>[id,Array.isArray(b.activePlayers)&&!isOnIce(a,id)?{...b.opponents[id]}:pathPoint(id,a.opponents[id],b.opponents[id])])),puck:lerp(a.puck,b.puck)};if(b.turn===a.turn+1&&b.puckFollows&&b.owner===b.puckFollows&&b.motionPaths?.[b.puckFollows])result.puck={...(result.own[b.puckFollows]||result.opponents[b.puckFollows])};if(passing){if(passing.startsAt&&u<passing.startsAt)result.puck={...(result.own[passing.from]||result.opponents[passing.from])};else result.puck=sampleMotionPath(passing.line.points,passing.startsAt?(u-passing.startsAt)/(1-passing.startsAt):u);}
 if(Array.isArray(b.activePlayers))result.activePlayers=u===0?[...a.activePlayers]:[...b.activePlayers];if(Array.isArray(b.pucks)){result.pucks=b.turn===a.turn+1?sampleDrillPucks(a,b,u,result):structuredClone(b.pucks);selectDrillPuck(result,b.activePuckId);}return result;}
