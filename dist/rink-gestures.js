const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function pinchCamera(state,ratio){
 if(!Number.isFinite(ratio)||ratio<=0)return {...state};
 if(state.mode==='orbit')return {...state,range:clamp(state.range/ratio,35,145)};
 const fov=2*Math.atan(Math.tan(state.fov*Math.PI/360)/ratio)*180/Math.PI;
 return {...state,fov:clamp(fov,35,85)};
}
// One pointer rotates; two pointers zoom without rotating. Pointer capture also
// handles a finger leaving the canvas. Remaining fingers retain their baseline.
export function bindRinkGestures(canvas,{onDrag,onPinch}){
 const pointers=new Map();
 const separation=()=>{const [a,b]=[...pointers.values()];return a&&b?Math.hypot(b.x-a.x,b.y-a.y):0;};
 const down=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);};
 const move=e=>{
  const previous=pointers.get(e.pointerId);if(!previous)return;e.preventDefault();
  const before=separation();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1)onDrag(e.clientX-previous.x,e.clientY-previous.y);
  else{const after=separation();if(before>8&&after>8&&after!==before)onPinch(after/before);}
 };
 const release=e=>pointers.delete(e.pointerId);
 const handlers={pointerdown:down,pointermove:move,pointerup:release,pointercancel:release,lostpointercapture:release};
 for(const [name,handler] of Object.entries(handlers))canvas.addEventListener(name,handler,{passive:false});
 return ()=>{for(const [name,handler] of Object.entries(handlers))canvas.removeEventListener(name,handler);pointers.clear();};
}
