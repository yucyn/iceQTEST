import {LESSON} from './lesson.js';
export const ROLE_IDS=Object.keys(LESSON.roles);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function sample(points,t){t=clamp(t,0,LESSON.duration);if(t<=points[0][0])return {x:points[0][1],y:points[0][2]};for(let i=1;i<points.length;i++){if(t<=points[i][0]){const a=points[i-1],b=points[i],u=(t-a[0])/(b[0]-a[0]);return {x:a[1]+(b[1]-a[1])*u,y:a[2]+(b[2]-a[2])*u};}}const p=points.at(-1);return {x:p[1],y:p[2]};}
export function position(role,t){return sample(LESSON.roles[role]?.points||LESSON.opponents[role],t);}
export function puck(t){
 t=clamp(t,0,LESSON.duration);
 const segment=LESSON.puckSegments.find(s=>t>=s.start&&t<s.end)||LESSON.puckSegments.at(-1);
 if(segment.kind==='hold')return {...segment.point};
 if(segment.kind==='follow')return position(segment.role,t);
 const u=clamp((t-segment.start)/(segment.end-segment.start),0,1),a=segment.fromPoint||position(segment.fromRole,segment.start),b=position(segment.toRole,segment.end);
 return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
}
export function phaseIndex(t){return t>=LESSON.duration?LESSON.phases.length-1:Math.max(0,LESSON.phases.findIndex(p=>t>=p.start&&t<p.end));}
export function getPhase(t){return t>=LESSON.duration?LESSON.phases.at(-1):LESSON.phases[phaseIndex(t)];}
export function pathBetween(role,start,end){const pts=[];for(let t=start;t<end;t+=.15)pts.push(position(role,t));pts.push(position(role,end));return pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');}
export function comparePrediction(role,p){const target=position(role,LESSON.predictionTime);return {target,near:Math.hypot(p.x-target.x,p.y-target.y)<=55};}
export function readProgress(raw){let a;try{a=JSON.parse(raw||'{}')}catch{return {viewed:[],notes:{},predictions:{}}}const result={viewed:[],notes:{},predictions:{}};if(!a||typeof a!=='object')return result;result.viewed=ROLE_IDS.filter(r=>Array.isArray(a.viewed)&&a.viewed.includes(r));for(const r of ROLE_IDS){if(typeof a.notes?.[r]==='string')result.notes[r]=a.notes[r].slice(0,2000);const p=a.predictions?.[r];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=40&&p.x<=960&&p.y>=50&&p.y<=550)result.predictions[r]={x:p.x,y:p.y};}return result;}
