import test from 'node:test';import assert from 'node:assert/strict';
import {createDuel,stepDuel,switchDuelMode,createDuelHistory} from '../dist/duel/duel-core.js';
import {planBaselineAI} from '../dist/duel/duel-ai.js';
const own={C:{x:250,y:300},LW:{x:400,y:150},RW:{x:400,y:450},LD:{x:160,y:220},RD:{x:160,y:390}};
const opponents={OC:{x:100,y:370},OL:{x:220,y:290},OR:{x:350,y:400},ODL:{x:500,y:150},ODR:{x:500,y:450}};
const frame={own,opponents,puck:{x:100,y:370},owner:'OC',lessonId:'center-net-front',caseId:'front-covered'};
test('individual AI controls nine and only user C',()=>{const s=createDuel(frame);assert.equal(s.controlledPlayers.length,1);const ai=planBaselineAI(s);assert.equal(ai.length,9);const n=stepDuel(s,[{type:'move',role:'C',to:{x:240,y:300}}],ai);assert.equal(n.tick,1);assert.equal(s.tick,0);assert.equal(n.puck.x,n.opponents.OC.x)});
test('team player controls five, AI controls five',()=>{const s=createDuel(frame,{mode:'team'});const ai=planBaselineAI(s);assert.equal(ai.length,5);assert(ai.every(a=>a.role.startsWith('O')));});
test('reject unauthorized, teleport, invalid pass',()=>{const s=createDuel(frame);assert.throws(()=>stepDuel(s,[{type:'move',role:'LW',to:{x:401,y:150}}]));assert.throws(()=>stepDuel(s,[{type:'move',role:'C',to:{x:800,y:300}}]));assert.throws(()=>stepDuel(s,[{type:'pass',role:'C',to:'LW'}]));});
test('history undo redo and mode switch',()=>{const s=createDuel(frame);const h=createDuelHistory(s);h.commit(stepDuel(s,[{type:'hold',role:'C'}]));assert.equal(h.undo().tick,0);assert.equal(h.redo().tick,1);assert.equal(switchDuelMode(s,'team').controlledPlayers.length,5);});

test('AI maintains defensive shape rather than sending every skater at puck',()=>{const s=createDuel(frame,{mode:'team'});const ai=planBaselineAI(s);assert.equal(ai.length,5);const positions=ai.filter(x=>x.type==='move').map(x=>x.to);assert(positions.length>1);assert(new Set(positions.map(x=>Math.round(x.y/20))).size>1);});
test('challenge requires proximity, does not grant automatic steal',()=>{const s=createDuel(frame);assert.throws(()=>stepDuel(s,[{type:'challenge',role:'C'}]));});
test('loose puck can be retrieved',()=>{const s=createDuel({...frame,owner:null,puck:{x:250,y:300}});const n=stepDuel(s,[],[]);assert.equal(n.owner,'C');});
