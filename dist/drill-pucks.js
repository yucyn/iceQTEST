import {sampleMotionPath,cleanPuckPass} from './motion-paths.js';
const IDS=['C','LW','RW','LD','RD','OC','OL','OR','ODL','ODR'];
export const MAX_PUCKS=20;
export function visiblePucks(s){return Array.isArray(s.pucks)&&s.pucks.length?s.pucks:s.puckOnIce===false&&!s.owner?[]:[{id:'P1',...s.puck,owner:s.owner??null}];}
export function cleanPucks(items){
 if(!Array.isArray(items)||items.length>MAX_PUCKS)throw Error('每個戰術板最多 20 顆冰球');
 const ids=new Set(),owners=new Set();return items.map(p=>{if(!p||!/^P(?:[1-9]|1[0-9]|20)$/.test(p.id)||ids.has(p.id)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<40||p.x>960||p.y<50||p.y>550||p.owner!==null&&!IDS.includes(p.owner)||p.owner&&owners.has(p.owner))throw Error('冰球資料無效，同一球員一次只能帶一顆球');ids.add(p.id);if(p.owner)owners.add(p.owner);return {id:p.id,x:+p.x.toFixed(3),y:+p.y.toFixed(3),owner:p.owner};});
}
export function selectDrillPuck(s,id){const p=(Array.isArray(s.pucks)?s.pucks:visiblePucks(s)).find(p=>p.id===id);s.activePuckId=p?.id||null;s.puck=p?{x:p.x,y:p.y}:{x:500,y:300};s.owner=p?.owner||null;s.puckOnIce=!!p;const t=s.puckTransitions?.[id];s.puckPass=t?.pass||null;s.puckFollows=t?.follows||null;return s;}
export function addDrillPuck(s,point={x:500,y:200}){const n=structuredClone(s);n.pucks=visiblePucks(n).map(p=>({...p}));const id=Array.from({length:MAX_PUCKS},(_,i)=>'P'+(i+1)).find(id=>!n.pucks.some(p=>p.id===id));if(!id)throw Error('已放滿 20 顆冰球');n.pucks.push({id,...point,owner:null});cleanPucks(n.pucks);return selectDrillPuck(n,id);}
export function editDrillPuck(s,id,point,owner=null){const n=structuredClone(s);n.pucks=visiblePucks(n).map(p=>p.id===id?{id,...point,owner}:{...p});cleanPucks(n.pucks);return selectDrillPuck(n,id);}
export function cleanPuckTransitions(value={},pucks=[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>MAX_PUCKS)throw Error('多球動作資料無效');return Object.fromEntries(Object.entries(value).map(([id,t])=>{if(!pucks.some(p=>p.id===id)||!t||t.follows!==null&&!IDS.includes(t.follows))throw Error('多球動作資料無效');return [id,{follows:t.follows,pass:cleanPuckPass(t.pass)}];}));}
// Runs the same player plan once for each independent puck; only one authored turn.
export function applyMultiPuckPlan(before,plan,role,single){
 const inventory=before.pucks.length?before.pucks:before.owner||before.puckOnIce||plan.owner||plan.puckPosition?[{id:'P1',...before.puck,owner:before.owner??null}]:[];const pucks=cleanPucks(inventory),active=pucks.find(p=>p.id===before.activePuckId)||pucks[0],actions=plan.puckActions||{};
 if(!Object.keys(plan.moves||{}).length&&plan.owner===undefined&&!plan.passTo&&!plan.puckPosition&&plan.passPath?.type!=='shot'&&!Object.values(actions).some(a=>a.owner!==undefined||a.passTo||a.puckPosition||a.passPath?.type==='shot'))throw Error('請先安排球員落點、球權或傳球');
 for(const id of Object.keys(actions))if(!pucks.some(p=>p.id===id))throw Error('找不到要編排的冰球');
 if(!pucks.length){const frame={...before,pucks:undefined};const out=single(frame,plan,role);out.pucks=[];out.activePuckId=null;out.puckTransitions={};return out;}
 let result;const nextPucks=[],transitions={},passLines=[];
 for(const p of pucks){const action=actions[p.id]||(p.id===active?.id?{owner:plan.owner,puckPosition:plan.puckPosition,passTo:plan.passTo,passPath:plan.passPath}:{});const frame={...before,pucks:undefined,owner:p.owner,puck:{x:p.x,y:p.y},puckOnIce:true,puckPass:null,puckFollows:null};const step={...plan,owner:undefined,puckPosition:undefined,passTo:null,passPath:null,...action,puckActions:undefined};if(!Object.keys(step.moves||{}).length&&step.owner===undefined&&!step.passTo&&!step.puckPosition)step.owner=p.owner;const out=single(frame,step,role);result??=out;nextPucks.push({id:p.id,...out.puck,owner:out.owner});transitions[p.id]={pass:out.puckPass||null,follows:out.puckFollows||null};if(out.puckPass)passLines.push(out.puckPass.line);}
 cleanPucks(nextPucks);result.pucks=nextPucks;result.puckTransitions=transitions;result.moveEndsAt=Object.values(transitions).some(t=>t.pass?.startsAt===.55)?.55:0;
 result.annotations=[...(before.annotations||[]),...Object.values(result.motionPaths||{}),...passLines];if(result.annotations.length>60)throw Error('畫線最多 60 筆，請先清除部分線條');
 return selectDrillPuck(result,active?.id);
}
export function sampleDrillPucks(a,b,u,positions){
 const earlier=visiblePucks(a);return visiblePucks(b).map(p=>{const old=earlier.find(q=>q.id===p.id);if(!old)return {...p};const t=b.puckTransitions?.[p.id];let q;
 if(t?.pass){const pass=t.pass;if(pass.startsAt&&u<pass.startsAt)q=positions.own[pass.from]||positions.opponents[pass.from];else q=sampleMotionPath(pass.line.points,pass.startsAt?(u-pass.startsAt)/(1-pass.startsAt):u);}
 else if(t?.follows)q=positions.own[t.follows]||positions.opponents[t.follows];
 else q={x:old.x+(p.x-old.x)*u,y:old.y+(p.y-old.y)*u};return {...p,x:q.x,y:q.y};});
}
export function removeDrillPuck(s,id){const n=structuredClone(s);n.pucks=visiblePucks(n).filter(p=>p.id!==id).map(p=>({...p}));if(n.puckTransitions)delete n.puckTransitions[id];return selectDrillPuck(n,n.pucks[0]?.id);}

// Logical and visible puck centers match, including during pointer dragging.
export function puckDisplayPoint(p){return {x:p.x,y:p.y};}
