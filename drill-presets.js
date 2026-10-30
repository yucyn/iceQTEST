import {createBlankBoard,placeInitialPlayer} from './tactics-board.js';
import {selectDrillPuck} from './drill-pucks.js';
import {applyTrialPlan} from './trial-plan.js';
const OWN=['C','LW','RW','LD','RD'],OPP=['OC','OL','OR','ODL','ODR'];
export function queueDrillSetup(){let s=createBlankBoard();for(let i=0;i<5;i++){s=placeInitialPlayer(s,OWN[i],{x:460,y:205+i*45});s=placeInitialPlayer(s,OPP[i],{x:540,y:205+i*45});}s.pucks=[{id:'P1',x:460,y:205,owner:'C'},{id:'P2',x:540,y:205,owner:'OC'},...Array.from({length:6},(_,i)=>({id:'P'+(i+3),x:465+(i%2)*70,y:80+Math.floor(i/2)*25,owner:null}))];return selectDrillPuck(s,'P1');}
// Authored training example inspired by the supplied queue-and-repeat format;
// it is not a reconstruction or an automated analysis of the clip.
export function queueDrillExample(){const history=[queueDrillSetup()];for(let i=0;i<4;i++){
 const s=history.at(-1),a=OWN[i],b=OPP[i],A=s.own[a],B=s.opponents[b],y=175+(i%2)*250;
 const routes={ [a]:{type:'carry',color:'blue',points:[A,{x:390,y:A.y},{x:260,y},{x:180,y:300}]},[b]:{type:'carry',color:'red',points:[B,{x:610,y:B.y},{x:740,y},{x:820,y:300}]} };
 history.push(applyTrialPlan(s,{moves:{[a]:routes[a].points.at(-1),[b]:routes[b].points.at(-1)},paths:routes},a));
 history.push(applyTrialPlan(history.at(-1),{puckActions:{P1:{passTo:OWN[i+1]},P2:{passTo:OPP[i+1]}}},a));
 }return history;}
