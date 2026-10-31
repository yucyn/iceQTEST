import assert from 'node:assert/strict';import {LESSON} from './dist/lesson.js';import {ROLE_IDS,position,puck,getPhase,comparePrediction,readProgress} from './dist/engine.js';import fs from 'node:fs';
assert.deepEqual(ROLE_IDS,['C','LW','RW','LD','RD']);for(const r of ROLE_IDS){const points=LESSON.roles[r].points;assert.equal(LESSON.roles[r].tasks.length,LESSON.phases.length);assert.equal(points[0][0],0);assert.equal(points.at(-1)[0],LESSON.duration);assert.ok(points.every((p,i)=>p.every(Number.isFinite)&&(i===0||p[0]>points[i-1][0])));for(let t=0;t<=10;t+=.1){const p=position(r,t);assert.ok(p.x>=40&&p.x<=960&&p.y>=50&&p.y<=550);}}for(let t=0;t<=10;t+=.05){const p=puck(t);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}assert.deepEqual(puck(3),position('LD',3));assert.deepEqual(puck(8.2),position('C',8.2));assert.deepEqual(puck(10),position('C',10));assert.equal(getPhase(10).title,LESSON.phases.at(-1).title);const c=position('C',5.4);assert.ok(c.x<position('C',3).x);assert.equal(comparePrediction('C',c).near,true);assert.equal(comparePrediction('C',{x:950,y:520}).near,false);for(const t of [0,2,5,8,10]){assert.ok(position('LW',t).x<650);assert.ok(position('RW',t).x<650);}assert.deepEqual(readProgress('invalid'),{viewed:[],notes:{},predictions:{}});assert.deepEqual(readProgress(JSON.stringify({viewed:['C','FAKE'],notes:{C:'hello'},predictions:{C:{x:1,y:999},RW:{x:500,y:400}}})),{viewed:['C'],notes:{C:'hello'},predictions:{RW:{x:500,y:400}}});for(const f of ['dist/app.js','dist/lesson.js','dist/engine.js']){assert.ok(!fs.readFileSync(f,'utf8').includes('fetch('));}console.log('PASS: all five roles, bounded motion, possession handoffs, phase transitions, before-blue-line wings, prediction comparison, progress validation; no AI network calls.');

const {COURSES,activateLesson,storageKey}=await import('./dist/lesson.js');
const keys=new Set();
for(const course of COURSES)for(const scenario of course.cases){
 activateLesson(course.id,scenario.id);keys.add(storageKey());
 for(const role of ROLE_IDS){const data=LESSON.roles[role];assert.equal(data.tasks.length,LESSON.phases.length);assert.equal(data.points[0][0],0);assert.equal(data.points.at(-1)[0],LESSON.duration);assert.ok(data.points.every((p,i)=>p.every(Number.isFinite)&&(i===0||p[0]>data.points[i-1][0])));}
 for(let t=0;t<=LESSON.duration;t+=.05){for(const p of [puck(t),...ROLE_IDS.map(r=>position(r,t))])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=40&&p.x<=960&&p.y>=50&&p.y<=550);}
 for(const segment of LESSON.puckSegments||[]){if(segment.kind==='pass'){assert.deepEqual(puck(segment.start),segment.fromPoint||position(segment.fromRole,segment.start));assert.deepEqual(puck(segment.end),position(segment.toRole,segment.end));}}
 assert.equal(getPhase(LESSON.duration),LESSON.phases.at(-1));
 if(course.number==='02'){for(let t=0;t<=LESSON.duration&&puck(t).x<650;t+=.02){assert.ok(position('LW',t).x<=650);assert.ok(position('RW',t).x<=650);assert.ok(position('C',t).x<=650);}assert.equal(LESSON.checkpoint,4.8);assert.equal(LESSON.predictionTime,7.2);}
}
assert.equal(keys.size,20);activateLesson(COURSES[0].id);assert.equal(storageKey(),'courtiq-ice-learning:neutral-faceoff:v1');
activateLesson('post-up-regroup','open');const openPuck=puck(7.2);activateLesson('post-up-regroup','pressure');assert.notDeepEqual(puck(7.2),openPuck);assert.deepEqual(puck(7.2),position('C',7.2));
console.log('PASS: seven lessons / fourteen scenarios; independent storage, dynamic phases, possession handoffs, forward entry timing.');

assert.equal(COURSES.length,9);assert.equal(COURSES.flatMap(c=>c.cases).length,20);
for(const course of COURSES){assert.ok(course.category&&course.focus);for(const scenario of course.cases){
 activateLesson(course.id,scenario.id);assert.ok(LESSON.checkpoint<LESSON.predictionTime&&LESSON.predictionTime<=LESSON.duration);
 for(const points of Object.values(LESSON.opponents)){assert.equal(points[0][0],0);assert.equal(points.at(-1)[0],LESSON.duration);assert.ok(points.every((p,i)=>p.every(Number.isFinite)&&(i===0||p[0]>points[i-1][0])));}
 for(const segment of LESSON.puckSegments||[]){const before=puck(Math.max(0,segment.start-.00001)),after=puck(segment.start);assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.05,`${course.id}/${scenario.id}: continuous possession`);}
 for(const id of ROLE_IDS)for(const key of ['job','watch','why','risk','prediction'])assert.ok(LESSON.roles[id][key].length>3);
}}
activateLesson('defensive-side','cut');assert.equal(LESSON.direction,'defend');for(let t=0;t<=9;t+=.05){assert.ok(position('LD',t).x<position('OL',t).x,'defender stays between cutter and own goal');}assert.deepEqual(puck(6.5),position('OC',6.5));
activateLesson('two-on-one','lane');const carrier=puck(6.5);activateLesson('two-on-one','challenge');assert.notDeepEqual(puck(6.5),carrier);assert.deepEqual(puck(6.5),position('RW',6.5));
activateLesson('give-and-go','return');assert.deepEqual(puck(6.5),position('C',6.5));activateLesson('give-and-go','covered');assert.deepEqual(puck(6.5),position('LW',6.5));
activateLesson('zone-breakout','reverse');for(let t=2;t<=4;t+=.05)assert.ok(puck(t).x<110,'reverse pass stays behind own goal line');
for(const f of fs.readdirSync('dist').filter(f=>f.endsWith('.js'))){assert.ok(!fs.readFileSync('dist/'+f,'utf8').includes('fetch('));}
console.log('PASS: all 14 scenarios, continuous puck transitions, defensive-side relation, distinct passing decisions and safe reverse route.');

const {coursePage:getCatalogPage}=await import('./dist/catalog.js');
const catalog=Array.from({length:47},(_,i)=>({number:String(i+1),title:`課程 ${i+1}`,category:i%2?'防守':'進攻',focus:'支援角度',cases:[{label:i===46?'門後反向':'低位'}]}));
let page=getCatalogPage(catalog,{page:7});assert.equal(page.pages,8);assert.equal(page.items.length,5);assert.equal(page.items[0].number,'43');assert.equal(getCatalogPage(catalog,{page:999}).index,7);
page=getCatalogPage(catalog,{query:'門後反向',page:7});assert.equal(page.count,1);assert.equal(page.index,0);assert.equal(page.items[0].number,'47');
page=getCatalogPage(catalog,{category:'防守',query:'支援'});assert.equal(page.count,23);assert.equal(page.items.length,6);
page=getCatalogPage(catalog,{query:'不存在'});assert.equal(page.count,0);assert.equal(page.pages,1);assert.equal(page.index,0);assert.deepEqual(page.items,[]);
console.log('PASS: 47-course catalog pagination, category + title/scenario search, clamped pages and empty results.');


const film=COURSES.find(c=>c.id==='film-forecheck');assert.equal(film.cases.length,3);
for(const scenario of film.cases){activateLesson(film.id,scenario.id);assert.equal(LESSON.source.kind,'uploaded');assert.ok(!LESSON.source.url);assert.ok(!LESSON.roleAliases&&!LESSON.checkpointFocus);
 for(const role of ROLE_IDS){assert.ok(!LESSON.roles[role].guidance);assert.ok(LESSON.roles[role].why.includes('本題條件：'));assert.equal(comparePrediction(role,position(role,LESSON.predictionTime)).near,true);}
 for(let t=0;t<=LESSON.duration;t+=.05){assert.deepEqual(puck(t),position('ODL',t));assert.ok(position('RW',t).x<820);for(const role of ['LD','RD'])assert.ok(position(role,t).x<=650);}
}
activateLesson(COURSES[0].id);assert.equal(storageKey(),'courtiq-ice-learning:neutral-faceoff:v1');
console.log('PASS: every lesson uses the shared position-comparison schema; forecheck conditions in existing explanation fields, stable progress keys and opponent possession.');

for(const role of ROLE_IDS){for(const key of ['job','watch','why','risk','prediction','practiceIntro']){assert.equal(new Set(film.cases.map(c=>c.lesson.roles[role][key])).size,3,`${role}/${key} changes with the scenario`);}}
const previewTimes=[];const previewPhases=[];for(const scenario of film.cases){activateLesson(film.id,scenario.id);assert.equal(LESSON.previewTime,LESSON.checkpoint);assert.ok(LESSON.learningFocus);previewTimes.push(LESSON.previewTime);previewPhases.push(getPhase(LESSON.previewTime).title);}
assert.equal(new Set(previewTimes).size,3);assert.equal(new Set(previewPhases).size,3);
console.log('PASS: all five roles have distinct feedback in each forecheck scenario; each scenario opens at its own decision moment and phase.');

const {createTrial,trialTurn,assessTrial,insideIce,icePoint,blendFrames}=await import('./dist/trial-model.js');
const fixture={t:3,lessonId:'fixture',caseId:'test',own:{C:{x:200,y:300},LW:{x:400,y:300},RW:{x:400,y:450},LD:{x:150,y:150},RD:{x:150,y:450}},opponents:{O1:{x:300,y:300},O2:{x:600,y:450}},puck:{x:200,y:300},owner:'C'};
const sourceJSON=JSON.stringify(fixture),trial=createTrial(fixture),beforeJSON=JSON.stringify(trial);
const held=trialTurn(trial,{type:'move',role:'C',to:{x:250,y:350}},{policy:'hold'});assert.deepEqual(held.puck,held.own.C);assert.deepEqual(held.own.LW,trial.own.LW);assert.deepEqual(held.opponents,trial.opponents);assert.equal(held.turn,1);assert.equal(JSON.stringify(fixture),sourceJSON);assert.equal(JSON.stringify(trial),beforeJSON);
const pressed=trialTurn(trial,{type:'move',role:'C',to:{x:250,y:350}},{policy:'press'});assert.notDeepEqual(pressed.opponents,held.opponents);assert.ok(pressed.responses.length>0);assert.ok(pressed.notes.length>0);
const intercepted=trialTurn(trial,{type:'pass',role:'LW'},{policy:'hold'});assert.equal(intercepted.owner,'O1');assert.deepEqual(intercepted.puck,trial.opponents.O1);assert.throws(()=>trialTurn(intercepted,{type:'pass',role:'C'}));assert.doesNotThrow(()=>trialTurn(trial,{type:'move',role:'C',to:{x:950,y:500}}));assert.throws(()=>trialTurn(trial,{type:'move',role:'C',to:{x:NaN,y:20}}));
const clear=createTrial({...fixture,opponents:{O1:{x:300,y:100}}});const passed=trialTurn(clear,{type:'pass',role:'LW'},{policy:'hold'});assert.equal(passed.owner,'LW');assert.deepEqual(passed.puck,passed.own.LW);
assert.ok(assessTrial(trial,'LW').some(n=>n.title==='直線接應通道受壓'));assert.equal(createTrial({...fixture,owner:null}).owner,null);assert.equal(createTrial(trial).baseTime,3);assert.equal(JSON.stringify(trial),beforeJSON);assert.ok(insideIce(icePoint({x:955,y:545})));assert.ok(!insideIce({x:955,y:545}));assert.deepEqual(blendFrames(trial,held,0).own,trial.own);assert.deepEqual(blendFrames(trial,held,1).own,held.own);
const {lookAt,perspective,multiply,projectPoint}=await import('./dist/rink-3d.js');const matrix=multiply(perspective(Math.PI/3,2),lookAt([0,10,20],[0,0,0]));const projected=projectPoint([0,0,0],matrix,800,400);assert.ok(Math.abs(projected.x-400)<.001&&Math.abs(projected.y-200)<.001&&projected.visible);assert.equal(projectPoint([0,20,40],matrix,800,400).visible,false);assert.ok([...matrix].every(Number.isFinite));
console.log('PASS: isolated trial state, carrying, passes/interceptions, distinct opponent policies, impossible-move rejection, reset ownership, rink bounds, interpolation and 3D camera projection.');

for(const course of COURSES)for(const scenario of course.cases){activateLesson(course.id,scenario.id);const time=LESSON.checkpoint,frame={t:time,lessonId:LESSON.id,caseId:LESSON.caseId,direction:LESSON.direction,own:Object.fromEntries(ROLE_IDS.map(id=>[id,position(id,time)])),opponents:Object.fromEntries(Object.keys(LESSON.opponents).map(id=>[id,position(id,time)])),puck:puck(time)};const frozen=JSON.stringify(frame),start=createTrial(frame),r=LESSON.defaultRole||'C',to=icePoint({x:start.own[r].x-15,y:start.own[r].y});const result=trialTurn(start,{type:'move',role:r,to},{policy:'press'});assert.equal(result.turn,1);assert.ok(Number.isFinite(result.puck.x)&&Number.isFinite(result.puck.y));assert.equal(JSON.stringify(frame),frozen);assert.equal(createTrial(start).baseTime,time);}
assert.ok(!fs.readFileSync('dist/experiences.js','utf8').includes('localStorage'));
console.log('PASS: every scenario supports independent trial snapshots and reset; no trial writes to original learning progress.');
