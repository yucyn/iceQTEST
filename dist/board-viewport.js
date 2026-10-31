// Camera-only transform: the rink and all replay coordinates stay unchanged.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function transformBoardView(camera,bounds,anchor,target,ratio){
 const zoom=clamp(bounds.w/camera.w*ratio,1,4),w=bounds.w/zoom,h=bounds.h/zoom,k=w/camera.w;
 return {x:clamp(anchor.x-(target.x-camera.x)*k,bounds.x,bounds.x+bounds.w-w),y:clamp(anchor.y-(target.y-camera.y)*k,bounds.y,bounds.y+bounds.h-h),w,h};
}
export function bindBoardViewport(rink,{enabled,onChange,eventRoot=window}){
 let bounds={x:0,y:0,w:1000,h:600},camera={...bounds},pair=null,gesturing=false,blockClickUntil=0;
 const touches=new Map();
 const apply=()=>{rink.setAttribute('viewBox',`${camera.x} ${camera.y} ${camera.w} ${camera.h}`);onChange?.(bounds.w/camera.w,{...camera});};
 const point=p=>{const q=rink.createSVGPoint();q.x=p.x;q.y=p.y;return q.matrixTransform(rink.getScreenCTM().inverse());};
 const measure=()=>{const [a,b]=[...touches.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};};
 const block=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const down=e=>{
  if(!enabled()||e.pointerType!=='touch'||!rink.contains(e.target))return;
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touches.size>=2){
   if(!gesturing){
    // Cancel previews, drawing and the long-press timer before taking over.
    rink.dispatchEvent(new Event('pointercancel',{bubbles:true}));
    gesturing=true;
   }
   pair=measure();block(e);
  }else if(gesturing)block(e);
 };
 const move=e=>{
  if(!touches.has(e.pointerId))return;
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(!gesturing)return;
  block(e);
  if(touches.size!==2){pair=null;return;}
  const next=measure();
  if(pair){camera=transformBoardView(camera,bounds,point(pair),point(next),next.d/pair.d);apply();}
  pair=next;
 };
 const up=e=>{
  if(!touches.has(e.pointerId))return;
  touches.delete(e.pointerId);pair=null;
  if(gesturing){block(e);blockClickUntil=Date.now()+500;if(touches.size===2)pair=measure();if(!touches.size)gesturing=false;}
 };
 const click=e=>{if(rink.contains(e.target)&&(gesturing||Date.now()<blockClickUntil))block(e);};
 const clear=()=>{touches.clear();pair=null;gesturing=false;};
 const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['click',click],['blur',clear]];
 for(const [name,fn] of listeners)eventRoot.addEventListener(name,fn,{capture:true,passive:false});
 return {reset(next=bounds){clear();bounds={...next};camera={...bounds};apply();},destroy(){clear();for(const [name,fn] of listeners)eventRoot.removeEventListener(name,fn,true);}};
}
