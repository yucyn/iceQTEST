import {createTrial,OWN,OPP,icePoint} from './trial-model.js';
export const BOARD_ID='tactics-board';
export function createBlankBoard(){return {...createTrial({t:0,lessonId:BOARD_ID,caseId:'blank',owner:null,puck:{x:500,y:300},own:Object.fromEntries(OWN.map(id=>[id,{x:500,y:300}])),opponents:Object.fromEntries(OPP.map(id=>[id,{x:500,y:300}]))}),activePlayers:[],puckOnIce:false,annotations:[],pucks:[],activePuckId:null,puckTransitions:{}};}
export function placeInitialPlayer(state,id,point){
 if(state.turn!==0||![...OWN,...OPP].includes(id)||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))throw Error('放入球員資料無效');
 const next=structuredClone(state);next[OWN.includes(id)?'own':'opponents'][id]=icePoint(point);if(!next.activePlayers.includes(id))next.activePlayers.push(id);return next;
}
export function groupReplays(items,{courseId,caseId,scope='current',query=''}={}){
 const q=query.trim().toLocaleLowerCase();const filtered=items.filter(item=>(scope==='all'||item.courseId===courseId&&item.caseId===caseId)&&(!q||[item.title,item.courseTitle,item.caseLabel,item.courseId,item.caseId].some(v=>String(v||'').toLocaleLowerCase().includes(q))));
 const groups=new Map();for(const item of filtered){const key=item.courseId+':'+item.caseId;if(!groups.has(key))groups.set(key,{key,title:item.courseId===BOARD_ID?'空白戰術板':item.courseTitle||item.courseId,label:item.caseLabel||item.caseId,items:[]});groups.get(key).items.push(item);}return [...groups.values()];
}
