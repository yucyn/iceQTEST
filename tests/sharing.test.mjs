import assert from 'node:assert/strict';
import vm from 'node:vm';
import {portableReplay,portableHTML,encodeShare,decodeShare,paintPortable} from '../dist/replay-sharing.js';
import {createBlankBoard,placeInitialPlayer} from '../dist/tactics-board.js';
import {applyTrialPlan} from '../dist/trial-plan.js';
import {prepareReplay} from '../dist/replay-store.js';
import {sampleTrialReplay} from '../dist/trial-replay.js';
let a=placeInitialPlayer(createBlankBoard(),'C',{x:200,y:200});let b=applyTrialPlan(a,{moves:{C:{x:600,y:400}},motionPaths:{C:{type:'solid',color:'blue',points:[{x:200,y:200},{x:350,y:300},{x:600,y:400}]}}},'C');
const record=prepareReplay({title:'測試 </script><script>alert(1)</script>',role:'C',history:[a,b],courseTitle:'戰術板',caseLabel:'情境'}).record,data=portableReplay(record);
assert.equal(data.frames.length,41);assert.equal(data.duration,2);
for(const t of [0,.25,1,1.75,2]){const expected=sampleTrialReplay(record.history,t).frame.own.C,p=data.frames[Math.round(t*20)].players.find(x=>x[0]==='C');assert.ok(Math.abs(p[1]-expected.x)<.01);assert.ok(Math.abs(p[2]-expected.y)<.01);}
const html=portableHTML(record);assert.ok(!html.includes('<script>alert'));assert.ok(!html.includes('src='));const script=html.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);
const restored=await decodeShare(await encodeShare(record));assert.deepEqual(restored,record);await assert.rejects(()=>decodeShare('x'.repeat(24001)));await assert.rejects(()=>decodeShare('bad!'));
const calls=[],ctx=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});paintPortable({width:1000,height:600,getContext:()=>ctx},data,2);assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='C'));
assert.equal(portableReplay({...record,history:[b]}).frames.length,1);
console.log('PASS: share compression round trip, limits, exact replay sampling, standalone HTML syntax/escaping and canvas rendering.');
