import {blendFrames} from './trial-model.js';
export const STEP_SECONDS=2;
export const replayDuration=history=>Math.max(0,history.length-1)*STEP_SECONDS;
// Read-only playback of committed turns. Never generates new moves or responses.
export function sampleTrialReplay(history,time){
 if(!history.length)return null;
 const duration=replayDuration(history),t=Math.max(0,Math.min(duration,Number.isFinite(time)?time:0));
 const step=Math.min(history.length-1,Math.floor(t/STEP_SECONDS)),u=(t-step*STEP_SECONDS)/STEP_SECONDS;
 return {frame:u===0?structuredClone(history[step]):blendFrames(history[step],history[step+1],u),time:t,step,progress:t/STEP_SECONDS,duration};
}
