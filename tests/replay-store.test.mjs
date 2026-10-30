import assert from 'node:assert/strict';
import {createTrial,trialTurn,MAX_MOVE,MAX_TURNS} from '../dist/trial-model.js';
import {prepareReplay,checkReplayQuota,REPLAY_LIMITS} from '../dist/replay-store.js';
import {COURSES,activateLesson,LESSON} from '../dist/lesson.js';
import {position,puck} from '../dist/engine.js';
for(const course of COURSES)for(const scenario of course.cases){
 activateLesson(course.id,scenario.id);const base=createTrial({t:LESSON.checkpoint,lessonId:course.id,caseId:scenario.id,direction:LESSON.direction,own:Object.fromEntries(Object.keys(LESSON.roles).map(r=>[r,position(r,LESSON.checkpoint)])),opponents:Object.fromEntries(Object.keys(LESSON.opponents).map(r=>[r,position(r,LESSON.checkpoint)])),puck:puck(LESSON.checkpoint)});
 base.owner='OC';base.puck={...base.opponents.OC};const frozen=JSON.stringify(base),move=trialTurn(base,{type:'move',role:'OC',to:{x:base.opponents.OC.x-50,y:base.opponents.OC.y}},{policy:'hold'});
 assert.equal(move.opponents.OC.x,base.opponents.OC.x-50);assert.deepEqual(move.puck,move.opponents.OC);assert.equal(JSON.stringify(base),frozen);
 const passed=trialTurn(move,{type:'pass',role:'OL'},{policy:'hold'});assert.ok(passed.owner);assert.throws(()=>trialTurn(move,{type:'pass',role:'C'},{policy:'hold'}));
 const response=trialTurn(base,{type:'move',role:'OC',to:{x:base.opponents.OC.x-50,y:base.opponents.OC.y}},{policy:'press'});assert.deepEqual(response.opponents.OC,move.opponents.OC,'manual opponent move not auto-moved twice');assert.ok(response.responses.every(x=>Object.hasOwn(base.own,x.id)),'other team responds');
 const history=[base,move];while(history.length<=MAX_TURNS){const s=history.at(-1),p=s.opponents.OC;history.push(trialTurn(s,{type:'move',role:'OC',to:p},{policy:'hold'}));}
 assert.equal(history.at(-1).turn,30);assert.throws(()=>trialTurn(history.at(-1),{type:'move',role:'OC',to:history.at(-1).opponents.OC}));
 const pack=prepareReplay({title:'對手演練',courseTitle:LESSON.title,caseLabel:scenario.label,role:'OC',history});assert.ok(pack.meta.byteLength<REPLAY_LIMITS.perReplay);assert.equal(pack.record.steps,30);assert.ok(!Object.hasOwn(pack.meta,'history'));
 assert.deepEqual(prepareReplay(pack.record,pack.record.id,pack.record.createdAt),pack,'stored data round-trip');
 const invalid=structuredClone(history);invalid[1].turn=99;assert.throws(()=>prepareReplay({role:'OC',history:invalid}));
}
assert.equal(MAX_MOVE,Infinity);assert.equal(MAX_TURNS,30);
checkReplayQuota([],{byteLength:1000});assert.throws(()=>checkReplayQuota(Array.from({length:10},()=>({byteLength:1})),{byteLength:1}));assert.throws(()=>checkReplayQuota([],{byteLength:REPLAY_LIMITS.perReplay+1}));assert.throws(()=>checkReplayQuota([{byteLength:REPLAY_LIMITS.total-1}],{byteLength:2}));
console.log('PASS: both teams move/pass/respond independently; 30-step limit; all-course saved snapshots below per-replay quota; safe metadata-only list, schema checks and exact load round-trip.');
