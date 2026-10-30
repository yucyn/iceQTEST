import assert from 'node:assert/strict';
import {createBlankBoard,placeInitialPlayer,groupReplays,BOARD_ID} from '../dist/tactics-board.js';
import {applyTrialPlan} from '../dist/trial-plan.js';
import {createTrial,blendFrames,insideIce,isOnIce} from '../dist/trial-model.js';
import {prepareReplay} from '../dist/replay-store.js';
const empty=createBlankBoard();assert.deepEqual(empty.activePlayers,[]);assert.equal(empty.owner,null);
const one=placeInitialPlayer(empty,'C',{x:60,y:300}),two=placeInitialPlayer(one,'OC',{x:940,y:300});
assert.equal(two.turn,0);assert.deepEqual(empty.activePlayers,[]);assert.deepEqual(createTrial(two).activePlayers,two.activePlayers);
const after=applyTrialPlan(two,{moves:{C:{x:930,y:450},OC:{x:70,y:150}},owner:'C'},'C');assert.equal(after.turn,1);assert.ok(insideIce(after.own.C));assert.ok(after.own.C.x>900);assert.ok(after.opponents.OC.x<100);
const extra=applyTrialPlan(after,{moves:{LW:{x:600,y:200}}},'LW');assert.ok(isOnIce(extra,'LW'));assert.equal(isOnIce(after,'LW'),false);
assert.equal(isOnIce(blendFrames(after,extra,0),'LW'),false);assert.equal(isOnIce(blendFrames(after,extra,.5),'LW'),true);assert.deepEqual(blendFrames(after,extra,.5).own.LW,extra.own.LW,'late placement does not fly from hidden placeholder');
assert.throws(()=>applyTrialPlan(two,{owner:'LW'},'C'));
const saved=prepareReplay({title:'全場演練',courseTitle:'空白戰術板',caseLabel:'自由戰術',role:'C',history:[two,after,extra]});assert.equal(saved.record.courseId,BOARD_ID);assert.deepEqual(prepareReplay(saved.record,saved.record.id,saved.record.createdAt),saved);
const bad=structuredClone(saved.record);bad.history[1].activePlayers=['C','C'];assert.throws(()=>prepareReplay(bad));
const records=[{courseId:'course-a',caseId:'a',title:'換邊',courseTitle:'自區出球',caseLabel:'低位支援'},{courseId:'course-a',caseId:'b',title:'另一種走法',courseTitle:'自區出球',caseLabel:'門後反向'},{courseId:BOARD_ID,caseId:'blank',title:'自訂二打一',courseTitle:'空白戰術板',caseLabel:'自由戰術'}];
assert.equal(groupReplays(records,{courseId:'course-a',caseId:'a'}).flatMap(g=>g.items).length,1);assert.equal(groupReplays(records,{scope:'all',query:'門後'}).at(0).items[0].caseId,'b');assert.equal(groupReplays(records,{scope:'all'}).length,3);assert.equal(groupReplays(records,{courseId:BOARD_ID,caseId:'blank'}).at(0).title,'空白戰術板');assert.deepEqual(groupReplays(records,{scope:'all',query:'不存在'}),[]);
console.log('PASS: blank board, bench placement without step cost, full-rink moves, late placement/replay, saved active roster, legacy context grouping and cross-context search.');
const {cleanInk,inkSegments}=await import('../dist/board-ink.js');
assert.equal(empty.puckOnIce,false);assert.equal(createTrial(empty).puckOnIce,false);
const outside=applyTrialPlan(two,{moves:{C:{x:300,y:300}}},'C');assert.equal(outside.puckOnIce,false);
assert.throws(()=>applyTrialPlan(two,{passTo:'LW'},'C'));
const loose=applyTrialPlan(two,{puckPosition:{x:850,y:400}},'C');assert.equal(loose.owner,null);assert.equal(loose.puckOnIce,true);assert.deepEqual(loose.puck,{x:850,y:400});
const possessed=applyTrialPlan(two,{owner:'C'},'C');assert.equal(possessed.puckOnIce,true);assert.equal(two.puckOnIce,false);
const line={color:'blue',type:'carry',points:[{x:100,y:300},{x:800,y:300}]};
const ink=cleanInk([line,{...line,type:'pass',color:'red'},{...line,type:'shot'}]);
assert.ok(inkSegments(ink[0]).some(([a,b])=>a.y!==300||b.y!==300),'carry wave');assert.ok(inkSegments(ink[1]).length<inkSegments(ink[0]).length,'dashed gaps');assert.ok(inkSegments(ink[2]).length>inkSegments(ink[0]).length,'double lines');
assert.throws(()=>cleanInk([{...line,color:'url(evil)'}]));assert.throws(()=>cleanInk(Array(61).fill(line)));assert.throws(()=>cleanInk([{...line,points:[{x:NaN,y:300},line.points[1]]}]));
const marked={...two,annotations:ink};const advanced=applyTrialPlan(marked,{moves:{C:{x:700,y:100}}},'C');assert.deepEqual(advanced.annotations.slice(0,3),ink);assert.equal(advanced.annotations.at(-1).type,'solid');advanced.annotations.pop();assert.equal(marked.annotations.length,3);
const still=prepareReplay({title:'戰術紙',role:'C',history:[marked]});assert.equal(still.record.steps,0);assert.deepEqual(still.record.history[0].annotations,ink);assert.equal(still.record.history[0].puckOnIce,false);
const legacy=structuredClone(saved.record);for(const f of legacy.history){delete f.annotations;delete f.puckOnIce;}assert.equal(prepareReplay(legacy).record.history[0].puckOnIce,true,'legacy puck remains visible');
assert.deepEqual(blendFrames(marked,advanced,.5).annotations,advanced.annotations);
console.log('PASS: off-ice puck, placement/possession, bounded validated three-style ink, retained movement/replay, static save and legacy compatibility.');
const {previewPlannedPuck}=await import('../dist/trial-plan.js');
const carrierBoard=placeInitialPlayer(createBlankBoard(),'OC',{x:200,y:300});carrierBoard.owner='OC';carrierBoard.puckOnIce=true;carrierBoard.puck={...carrierBoard.opponents.OC};
const planned={moves:{OC:{x:850,y:400}}};const preview=previewPlannedPuck(carrierBoard,planned);assert.deepEqual(preview.puck,planned.moves.OC);assert.deepEqual(carrierBoard.puck,{x:200,y:300});
const carried=applyTrialPlan(carrierBoard,planned,'OC');assert.deepEqual(carried.puck,carried.opponents.OC);assert.deepEqual(blendFrames(carrierBoard,carried,.5).puck,blendFrames(carrierBoard,carried,.5).opponents.OC);
const newlyAssigned=previewPlannedPuck(two,{owner:'C',moves:{C:{x:750,y:100}}});assert.deepEqual(newlyAssigned.puck,{x:750,y:100});assert.equal(newlyAssigned.puckOnIce,true);
assert.equal(previewPlannedPuck(carrierBoard,{owner:null}).owner,null);assert.deepEqual(previewPlannedPuck(carrierBoard,{puckPosition:{x:600,y:450}}).puck,{x:600,y:450});
console.log('PASS: arranged carrier preview, opponent carry animation and explicit reassignment keep puck in sync without mutating history.');
const {sampleMotionPath,cleanMotionPaths}=await import('../dist/motion-paths.js');
const {sampleTrialReplay}=await import('../dist/trial-replay.js');
const routeStart=placeInitialPlayer(createBlankBoard(),'C',{x:200,y:200});routeStart.owner='C';routeStart.puckOnIce=true;routeStart.puck={x:200,y:200};
const bend={type:'pass',color:'red',points:[{x:200,y:200},{x:200,y:400},{x:400,y:400}]};
const bendStep=applyTrialPlan(routeStart,{moves:{C:{x:400,y:400}},paths:{C:bend}},'C');
assert.deepEqual(sampleMotionPath(bend.points,.25),{x:200,y:300});assert.deepEqual(sampleMotionPath(bend.points,.5),{x:200,y:400});
assert.deepEqual(blendFrames(routeStart,bendStep,.5).own.C,{x:200,y:400},'curve follows elbow, not diagonal chord');
for(const u of [0,.1,.5,.8,1]){const f=blendFrames(routeStart,bendStep,u);assert.deepEqual(f.puck,f.own.C,'puck stays with curved carrier');}
assert.deepEqual(sampleTrialReplay([routeStart,bendStep],1).frame.own.C,{x:200,y:400});
const halfway=sampleTrialReplay([routeStart,bendStep],1).frame;assert.deepEqual(blendFrames(halfway,halfway,0).own.C,halfway.own.C,'2D playback frame must not restart its path');
const curveSaved=prepareReplay({title:'彎曲帶球',role:'C',history:[routeStart,bendStep]});assert.deepEqual(sampleTrialReplay(curveSaved.record.history,1).frame.puck,{x:200,y:400});
const stillNext=applyTrialPlan(bendStep,{owner:'C'},'C');assert.deepEqual(stillNext.motionPaths,{});assert.deepEqual(blendFrames(bendStep,stillNext,.5).own.C,{x:400,y:400},'old path does not replay next turn');
const foeStart=placeInitialPlayer(routeStart,'OC',{x:800,y:200});foeStart.owner='OC';foeStart.puck={x:800,y:200};const foeLine={...bend,points:[{x:800,y:200},{x:800,y:400},{x:600,y:400}]};const foeStep=applyTrialPlan(foeStart,{moves:{OC:{x:600,y:400}},paths:{OC:foeLine}},'OC');assert.deepEqual(blendFrames(foeStart,foeStep,.5).puck,{x:800,y:400});
assert.throws(()=>cleanMotionPaths({C:{...bend,points:[{x:NaN,y:200},{x:400,y:400}]}}));assert.throws(()=>applyTrialPlan(routeStart,{moves:{C:{x:600,y:400}},paths:{C:bend}},'C'));
const malformed=structuredClone(curveSaved.record);malformed.history[1].motionPaths.C.points[0].x=300;assert.throws(()=>prepareReplay(malformed));
const straightStep=applyTrialPlan(routeStart,{moves:{C:{x:800,y:200}}},'C');assert.equal(straightStep.annotations.at(-1).type,'solid');assert.deepEqual(blendFrames(routeStart,straightStep,.5).puck,{x:500,y:200});
console.log('PASS: solid paths, curved movement by arc length for both teams, puck follows, 2D/3D sampling, saved curved replay and route validation.');
const targetStart=placeInitialPlayer(routeStart,'LW',{x:600,y:400});
const passLine={type:'pass',color:'red',points:[{x:200,y:200},{x:200,y:400},{x:600,y:400}]};
const targetPass=applyTrialPlan(targetStart,{passTo:'LW',passPath:passLine},'C');assert.equal(targetPass.owner,'LW');assert.deepEqual(targetPass.own,targetStart.own,'targeted pass does not move skaters');
const midPass=blendFrames(targetStart,targetPass,1/3);assert.ok(Math.abs(midPass.puck.x-1000/3)<.001&&Math.abs(midPass.puck.y-800/3)<.001,'puck follows straight pass despite a curved input');assert.deepEqual(midPass.own.C,targetStart.own.C);
assert.deepEqual(blendFrames(targetStart,targetPass,1).puck,targetStart.own.LW);
const passedSaved=prepareReplay({role:'C',history:[targetStart,targetPass]});assert.equal(passedSaved.record.history[1].puckPass.to,'LW');assert.ok(Math.abs(sampleTrialReplay(passedSaved.record.history,2/3).frame.puck.x-1000/3)<.001);
const movePass=applyTrialPlan(targetStart,{moves:{C:{x:400,y:200}},passTo:'LW'},'C');assert.deepEqual(blendFrames(targetStart,movePass,.275).puck,{x:300,y:200});assert.deepEqual(blendFrames(targetStart,movePass,.55).puck,{x:400,y:200});assert.deepEqual(blendFrames(targetStart,movePass,1).puck,targetStart.own.LW);
assert.throws(()=>applyTrialPlan(targetStart,{passTo:'OC'},'C'));
const badPass=structuredClone(passedSaved.record);badPass.history[1].puckPass.line.points[0].x=700;assert.throws(()=>prepareReplay(badPass));
console.log('PASS: targeted straight passes animate puck only, carry then pass sequencing, saved replay and invalid recipient/route rejection.');
// Long press: real event listener flow with a deterministic timer, no browser dependency.
const {bindPlayerHold}=await import('../dist/player-hold.js');let holdTimer=null,heldRoles=[];const holdTarget=new EventTarget();
const disposeHold=bindPlayerHold(holdTarget,{enabled:()=>true,onHold:(id)=>heldRoles.push(id),setTimer:fn=>(holdTimer=fn,1),clearTimer:()=>{holdTimer=null;}});
const holdEvent=(name,x=0,y=0,extra={})=>{const e=new Event(name,{cancelable:true});Object.defineProperty(e,'target',{value:{closest:()=>({dataset:{trialRole:'C'}})}});Object.assign(e,{button:0,pointerId:1,clientX:x,clientY:y,...extra});holdTarget.dispatchEvent(e);};
holdEvent('pointerdown');holdEvent('pointerup');assert.equal(holdTimer,null);assert.deepEqual(heldRoles,[]);
holdEvent('pointerdown');holdEvent('pointermove',20,0);assert.equal(holdTimer,null,'drawing cancels long press');
holdEvent('pointerdown');holdTimer();assert.deepEqual(heldRoles,['C']);holdEvent('contextmenu');assert.deepEqual(heldRoles,['C'],'native menu does not duplicate held action');
holdEvent('pointerdown');holdEvent('pointercancel');assert.equal(holdTimer,null);disposeHold();
console.log('PASS: long press, ordinary click, drawing cancellation, native menu deduplication and gesture disposal.');
const {queueDrillExample,queueDrillSetup}=await import('../dist/drill-presets.js');
const {visiblePucks,cleanPucks,addDrillPuck,editDrillPuck,selectDrillPuck}=await import('../dist/drill-pucks.js');
let multi=queueDrillSetup();assert.equal(multi.pucks.length,8);const multiOriginal=structuredClone(multi);
const both=applyTrialPlan(multi,{moves:{C:{x:200,y:200},OC:{x:800,y:400}}},'C');assert.equal(both.turn,1);assert.deepEqual(multi,multiOriginal);for(const u of [0,.25,.5,1]){const f=blendFrames(multi,both,u);assert.deepEqual({x:f.pucks[0].x,y:f.pucks[0].y},f.own.C);assert.deepEqual({x:f.pucks[1].x,y:f.pucks[1].y},f.opponents.OC);assert.deepEqual(f.pucks[2],multi.pucks[2]);}
const twoPasses=applyTrialPlan(both,{puckActions:{P1:{passTo:'LW'},P2:{passTo:'OL'}}},'C');assert.equal(twoPasses.pucks[0].owner,'LW');assert.equal(twoPasses.pucks[1].owner,'OL');assert.deepEqual(twoPasses.own,both.own);const passMiddle=blendFrames(both,twoPasses,.5);assert.notDeepEqual(passMiddle.pucks[0],both.pucks[0]);assert.notDeepEqual(passMiddle.pucks[1],both.pucks[1]);assert.deepEqual(passMiddle.pucks[2],both.pucks[2]);
const singleAction=applyTrialPlan(both,{puckActions:{P2:{passTo:'OL'}}},'OC');assert.equal(singleAction.pucks[0].owner,'C','another puck cannot inherit selected action');assert.equal(singleAction.pucks[1].owner,'OL');
const twoCurves=applyTrialPlan(both,{moves:{C:{x:200,y:400}},paths:{C:{type:'carry',color:'blue',points:[both.own.C,{x:100,y:300},{x:200,y:400}]}},puckActions:{P2:{passTo:'OL'}}},'C');const curveMid=blendFrames(both,twoCurves,.275);assert.deepEqual({x:curveMid.pucks[0].x,y:curveMid.pucks[0].y},curveMid.own.C);assert.deepEqual(curveMid.pucks[1],{...both.pucks[1],owner:'OL'});
const queueHistory=queueDrillExample(),queueSave=prepareReplay({title:'自由排隊範例',role:'C',history:queueHistory});assert.equal(queueHistory.length,9);assert.ok(queueSave.meta.byteLength<100*1024);assert.deepEqual(prepareReplay(queueSave.record,queueSave.record.id,queueSave.record.createdAt),queueSave);
const restored=queueSave.record.history;assert.equal(blendFrames(restored[1],restored[2],.5).pucks.length,8);assert.equal(selectDrillPuck(structuredClone(restored[2]),'P2').owner,'OL');
assert.throws(()=>cleanPucks([{id:'P1',x:500,y:300,owner:'C'},{id:'P2',x:500,y:300,owner:'C'}]));assert.throws(()=>applyTrialPlan(multi,{puckActions:{P99:{owner:'C'}}},'C'));
let twenty=createBlankBoard();for(let i=0;i<20;i++)twenty=addDrillPuck(twenty);assert.equal(twenty.pucks.length,20);assert.throws(()=>addDrillPuck(twenty));const positioned=editDrillPuck(twenty,'P2',{x:700,y:300});assert.equal(positioned.pucks[1].x,700);assert.equal(twenty.pucks[1].x,500);
const staticMulti=prepareReplay({role:'C',history:[multi]});assert.equal(staticMulti.record.steps,0);assert.equal(staticMulti.record.history[0].pucks.length,8);
console.log('PASS: 20 independent pucks, immutable free setup, simultaneous carries/passes, mixed curved carry/pass, reserve pucks, one-step count, saved 8-step example and static setup.');
const {removeDrillPuck}=await import('../dist/drill-pucks.js');let removable=addDrillPuck(createBlankBoard());removable=removeDrillPuck(removable,'P1');assert.deepEqual(removable.pucks,[]);assert.equal(removable.puckOnIce,false);assert.equal(removable.owner,null);assert.equal(removable.activePuckId,null);
// Adding a reserve puck after authored steps keeps earlier snapshots and replay valid.
const priorLast=structuredClone(queueHistory.at(-1));const expandedLast=addDrillPuck(priorLast,{x:450,y:95});const lateHistory=[...queueHistory.slice(0,-1),expandedLast];assert.equal(expandedLast.turn,8);assert.equal(priorLast.pucks.length,8);assert.equal(expandedLast.pucks.length,9);assert.equal(prepareReplay({role:'C',history:lateHistory}).record.history.at(-1).pucks.length,9);assert.equal(blendFrames(lateHistory.at(-2),expandedLast,.5).pucks.length,9);const lateNext=applyTrialPlan(expandedLast,{puckActions:{P9:{puckPosition:{x:500,y:200}}}},'C');assert.deepEqual(lateNext.pucks.find(p=>p.id==='P9'),{id:'P9',x:500,y:200,owner:null});assert.equal(prepareReplay({role:'C',history:[...lateHistory,lateNext]}).record.steps,9);
const {puckDisplayPoint}=await import('../dist/drill-pucks.js');
for(const u of [0,.25,.5,.75,1]){const f=sampleTrialReplay([multi,both],u*2).frame;for(const [id,role] of [['P1','C'],['P2','OC']]){const ball=f.pucks.find(p=>p.id===id),shown=puckDisplayPoint(ball),carrier=f.own[role]||f.opponents[role];assert.equal(shown.x,carrier.x);assert.equal(shown.y,carrier.y);}}
assert.deepEqual(puckDisplayPoint({x:500,y:300,owner:null}),{x:500,y:300});
console.log('PASS: shared 2D/3D puck display follows both carriers throughout committed replay.');
const shotLine={type:'shot',color:'red',points:[multi.own.C,{x:700,y:150},{x:900,y:300}]};
const shotNext=applyTrialPlan(multi,{puckActions:{P1:{passPath:shotLine}}},'C');assert.equal(shotNext.turn,1);assert.equal(shotNext.pucks[0].owner,null);assert.deepEqual({x:shotNext.pucks[0].x,y:shotNext.pucks[0].y},{x:900,y:300});assert.deepEqual(shotNext.own,multi.own);assert.equal(shotNext.annotations.at(-1).type,'shot');assert.deepEqual(shotNext.pucks[1],multi.pucks[1]);
const shotReplay=prepareReplay({role:'C',history:[multi,shotNext]}).record;const shotMid=sampleTrialReplay(shotReplay.history,1).frame.pucks[0];const expectedShotMid=(await import('../dist/motion-paths.js')).sampleMotionPath([shotLine.points[0],shotLine.points.at(-1)],.5);assert.ok(Math.hypot(shotMid.x-expectedShotMid.x,shotMid.y-expectedShotMid.y)<.2);assert.deepEqual(prepareReplay(shotReplay,shotReplay.id,shotReplay.createdAt).record.history[1].puckTransitions.P1.pass.line.type,'shot');
const carryShot=applyTrialPlan(multi,{moves:{C:{x:600,y:200}},puckActions:{P1:{passPath:shotLine}}},'C');assert.deepEqual({x:blendFrames(multi,carryShot,.275).pucks[0].x,y:blendFrames(multi,carryShot,.275).pucks[0].y},blendFrames(multi,carryShot,.275).own.C);assert.equal(prepareReplay({role:'C',history:[multi,carryShot]}).record.steps,1);
const noBall=structuredClone(multi);noBall.pucks[0].owner=null;selectDrillPuck(noBall,'P1');assert.throws(()=>applyTrialPlan(noBall,{puckActions:{P1:{passPath:shotLine}}},'C'));
console.log('PASS: shot-only step, straight puck motion, carry then shoot, released possession, other pucks unchanged, save/import replay and no-owner rejection.');

assert.equal(shotNext.puckTransitions.P1.pass.line.points.length,2,'shots discard intermediate hand-drawn bends');
assert.deepEqual(shotNext.puckTransitions.P1.pass.line.points,[multi.own.C,{x:900,y:300}]);
{
const {smoothDrawnLine}=await import('../dist/drawn-line.js');
const shaky={type:'solid',color:'blue',points:Array.from({length:81},(_,i)=>({x:200+i*5,y:i===0||i===80?200:200+(i%2?4:-4)}))},shakyCopy=structuredClone(shaky),smooth=smoothDrawnLine(shaky);assert.deepEqual(shaky,shakyCopy);assert.deepEqual(smooth.points[0],shaky.points[0]);assert.deepEqual(smooth.points.at(-1),shaky.points.at(-1));assert.ok(smooth.points.every(p=>Math.abs(p.y-200)<1),'alternating hand tremor is removed');
const bend={type:'carry',color:'red',points:[{x:200,y:200},{x:300,y:200},{x:400,y:200},{x:400,y:300},{x:400,y:400},{x:300,y:400},{x:200,y:400}]},rounded=smoothDrawnLine(bend);assert.deepEqual(rounded.points[0],bend.points[0]);assert.deepEqual(rounded.points.at(-1),bend.points.at(-1));assert.ok(Math.max(...rounded.points.map(p=>p.x))>370,'intentional turn is retained');assert.ok(rounded.points.length<=100);assert.equal(smoothDrawnLine({...bend,type:'shot'}).points.length,2);
const dense=smoothDrawnLine({type:'pass',color:'blue',points:Array.from({length:100},(_,i)=>({x:300+i*3,y:300+Math.sin(i)*30}))});assert.ok(dense.points.length<=100);assert.ok(dense.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
const smoothedTurn=applyTrialPlan(routeStart,{moves:{C:smooth.points.at(-1)},paths:{C:smooth}},'C');const smoothSave=prepareReplay({role:'C',history:[routeStart,smoothedTurn]}).record;assert.deepEqual(smoothSave.history[1].motionPaths.C.points,smooth.points);assert.deepEqual(sampleTrialReplay(smoothSave.history,1).frame.own.C,{x:400,y:200});assert.deepEqual(prepareReplay(smoothSave,smoothSave.id,smoothSave.createdAt).record.history[1].motionPaths.C.points,smoothSave.history[1].motionPaths.C.points);
console.log('PASS: hand jitter reduction, retained turns and endpoints, immutable input, 100-point cap, straight shots and stable saved 2D/3D movement paths.');

}

{
 const loose=addDrillPuck(placeInitialPlayer(createBlankBoard(),'C',{x:490,y:200}),{x:500,y:205});
 const assigned=applyTrialPlan(loose,{puckActions:{P1:{owner:'C'}}},'C');
 assert.deepEqual(assigned.puck,loose.puck,'assignment changes only possession, not position');
 assert.equal(assigned.owner,'C');
 assert.deepEqual(puckDisplayPoint(assigned.pucks[0]),puckDisplayPoint(loose.pucks[0]),'assigning a holder does not change the visual position');
 assert.deepEqual(previewPlannedPuck(loose,{owner:'C'}).puck,loose.puck,'assignment preview stays at original puck position');
 const stationary=applyTrialPlan(assigned,{moves:{OC:{x:700,y:300}}},'OC');assert.deepEqual(stationary.puck,assigned.puck,'other skaters moving do not relocate a stationary owned puck');
 assert.equal(prepareReplay({role:'C',history:[loose,assigned,stationary]}).record.history[1].pucks[0].x,500);
 assert.equal(targetPass.puckPass.line.points.length,2);
 console.log('PASS: possession-only assignment preserves real/visual coordinates, stationary puck stays put, saved assignment and straight passing.');
}
{
 const {smoothDrawnLine}=await import('../dist/drawn-line.js');
 const rounded=smoothDrawnLine({type:'solid',color:'blue',points:[{x:200,y:200},{x:300,y:200},{x:400,y:200},{x:400,y:300},{x:400,y:400},{x:300,y:400},{x:200,y:400}]}).points;
 let maxTurn=0;for(let i=1;i<rounded.length-1;i++){const a=rounded[i-1],b=rounded[i],c=rounded[i+1],u=[b.x-a.x,b.y-a.y],v=[c.x-b.x,c.y-b.y],den=Math.hypot(...u)*Math.hypot(...v);if(den)maxTurn=Math.max(maxTurn,Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/den)))*180/Math.PI);}
 assert.ok(maxTurn<8,'rounded bends have no coarse angular corners');assert.deepEqual(rounded[0],{x:200,y:200});assert.deepEqual(rounded.at(-1),{x:200,y:400});
 assert.deepEqual(puckDisplayPoint({x:420,y:230,owner:null}),{x:420,y:230},'free puck center exactly matches pointer drop coordinates');
 assert.deepEqual(puckDisplayPoint({x:420,y:230,owner:'C'}),{x:420,y:230},'ownership never adds a display offset');
 console.log('PASS: continuously rounded turns, endpoint preservation and zero puck pointer/display offset.');
}
