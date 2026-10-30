import assert from 'node:assert/strict';
import {bindRinkGestures,pinchCamera} from '../dist/rink-gestures.js';
const state={mode:'orbit',range:95,fov:55};
assert.equal(pinchCamera(state,2).range,47.5);assert.equal(pinchCamera(state,.5).range,145);
assert.equal(pinchCamera(state,100).range,35);assert.deepEqual(pinchCamera(state,NaN),state);
for(const mode of ['eye','follow']){const s={...state,mode};assert.ok(pinchCamera(s,1.5).fov<s.fov);assert.ok(pinchCamera(s,.7).fov>s.fov);assert.equal(pinchCamera(s,100).fov,35);assert.equal(pinchCamera(s,.001).fov,85);const out=pinchCamera(pinchCamera(s,1.2),1/1.2);assert.ok(Math.abs(out.fov-s.fov)<1e-8);}
class Canvas extends EventTarget{captures=[];setPointerCapture(id){this.captures.push(id);}}
const canvas=new Canvas(),drags=[],pinches=[];
const cleanup=bindRinkGestures(canvas,{onDrag:(x,y)=>drags.push([x,y]),onPinch:r=>pinches.push(r)});
function event(type,id,x,y,extra={}){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0,...extra});canvas.dispatchEvent(e);}
event('pointerdown',1,100,100);event('pointermove',1,110,90);assert.deepEqual(drags,[[10,-10]]);
event('pointerdown',2,210,90);event('pointermove',2,260,90);assert.equal(pinches.at(-1),1.5);assert.equal(drags.length,1,'pinch does not rotate');
event('pointermove',2,210,90);assert.equal(pinches.at(-1),2/3);
event('pointerup',2,210,90);event('pointermove',1,115,92);assert.deepEqual(drags.at(-1),[5,2],'return to one finger has no jump');
event('pointerdown',2,215,92);event('pointerdown',3,300,300);const before=pinches.length;event('pointermove',3,310,310);assert.equal(pinches.length,before,'third finger does not zoom or rotate');
event('pointercancel',2,215,92);event('lostpointercapture',3,310,310);event('pointermove',1,120,92);assert.deepEqual(drags.at(-1),[5,0]);
event('lostpointercapture',1,120,92);const count=drags.length;event('pointermove',1,999,999);assert.equal(drags.length,count);
event('pointerdown',4,50,50,{pointerType:'mouse',button:2});event('pointermove',4,70,70,{pointerType:'mouse'});assert.equal(drags.length,count,'right-click ignored');
cleanup();event('pointerdown',5,0,0);event('pointermove',5,100,100);assert.equal(drags.length,count);
assert.deepEqual(state,{mode:'orbit',range:95,fov:55});
console.log('PASS: pinch zoom for all cameras, bounds, one/two/three-finger transitions, cancel/capture loss, mouse and listener cleanup.');
