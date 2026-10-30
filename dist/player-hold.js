export function bindPlayerHold(target,{enabled,onHold,setTimer=setTimeout,clearTimer=clearTimeout}){
 let pending=null,timer=null,held=false;
 const cancel=()=>{if(timer!==null)clearTimer(timer);timer=null;pending=null;};
 const down=e=>{if(!enabled()||e.button!==0)return;if(e.isPrimary===false){cancel();return;}cancel();held=false;const token=e.target.closest?.('[data-trial-role]');if(!token)return;pending={id:token.dataset.trialRole,pointerId:e.pointerId,x:e.clientX,y:e.clientY};timer=setTimer(()=>{if(!pending)return;held=true;onHold(pending.id,{x:pending.x,y:pending.y});cancel();},450);};
 const move=e=>{if(pending&&(e.pointerId!==pending.pointerId||Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>9))cancel();};
 const context=e=>{if(!enabled())return;e.preventDefault();const token=e.target.closest?.('[data-trial-role]');if(token&&!held){cancel();onHold(token.dataset.trialRole,{x:e.clientX,y:e.clientY});}};
 const handlers=[['pointerdown',down],['pointermove',move],['pointerup',cancel],['pointercancel',cancel],['lostpointercapture',cancel],['contextmenu',context]];for(const [name,fn] of handlers)target.addEventListener(name,fn,true);
 return ()=>{cancel();for(const [name,fn] of handlers)target.removeEventListener(name,fn,true);};
}
