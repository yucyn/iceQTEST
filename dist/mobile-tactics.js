import {bindBoardViewport} from './board-viewport.js';
// A small-screen shell around the existing board and controls. No separate
// editor state or replay format: every action uses the original controller.
export function mountMobileTactics({getState,selectRole,selectTool,onActivate,pickup,openExports}){
 const $=id=>document.getElementById(id);
 const root=document.createElement('section');root.className='mobile-tactics';root.hidden=true;root.setAttribute('aria-label','戰術板工作區');
 root.innerHTML=`<header class="mt-header"><button data-mt-back aria-label="返回課程，保留目前戰術板">‹ 返回</button><button data-mt-steps aria-label="查看演練步驟">第 0 步 ▾</button><button data-mt-people>人員／球</button><button data-mt-more aria-label="更多戰術板功能與儲存">⋯</button></header>
 <div class="mt-viewbar"><span data-mt-possession></span><div role="group" aria-label="冰場顯示範圍"><button data-mt-zoom-reset aria-label="還原球場縮放">100%</button><button data-mt-view="all" aria-pressed="true">全場</button><button data-mt-view="left" aria-pressed="false">左半</button><button data-mt-view="right" aria-pressed="false">右半</button></div></div>
 <div class="mt-stage"></div><p class="mt-hint" role="status"></p><button class="mt-resume" hidden>繼續編排最後一步</button>
 <nav class="mt-tools" aria-label="戰術工具"><button data-mt-tool="select">↖<span>選取</span></button><button data-mt-tool="solid">→<span>位移</span></button><button data-mt-tool="carry">〰<span>帶球</span></button><button data-mt-tool="pass">⇢<span>傳球</span></button><button data-mt-tool="shot">⇒<span>射門</span></button><button data-mt-add>＋<span>冰球</span></button><button data-mt-pickup>●<span>拿球權</span></button></nav>
 <div class="mt-actions"><button data-mt-undo>↶ 撤銷</button><button data-mt-commit>加入這一步 →</button><button data-mt-play>▶ 播放</button><button data-mt-empty>清空球場</button></div>
 <div class="mt-sheet-layer" hidden><button class="mt-scrim" aria-label="收起面板"></button><section class="mt-sheet" role="dialog" aria-modal="true" aria-label="戰術板功能面板"><header><strong class="mt-sheet-title"></strong><button data-mt-close aria-label="關閉面板">×</button></header><div class="mt-sheet-body">
 <div data-mt-panel="people"><p>選球員後，點冰場放入；已入場球員也可直接點選。</p><div class="mt-roster"></div><h3>冰球</h3><div class="mt-puck-slot"></div><div class="mt-puck-actions"><button data-mt-give>交給所選球員</button><button data-mt-place>移動所選冰球</button></div></div>
 <div data-mt-panel="steps" hidden><p>點步驟查看局面，收起後可繼續編排最後一步。</p><div class="mt-step-slot"></div></div>
 <div data-mt-panel="more" hidden><div class="mt-more-actions"><button data-mt-export>分享／匯出</button><button data-mt-scene>3D 預覽</button><button data-mt-clear>清除本步安排</button><button data-mt-reset>清空戰術板</button></div><h3>畫筆顏色</h3><div class="mt-color-slot"></div><details class="mt-help"><summary>操作說明</summary><p>選取球員或無人持有的冰球可直接拖動。位移、帶球可畫曲線；傳球與射門固定直線。兩指張開／捏合可縮放球場，兩指拖動可移動畫面；點百分比還原。先安排兩隊動作，再按「加入這一步」。有待加入安排時，撤銷只退回最近一個動作。長按球員可開啟進階工具。</p></details><div class="mt-example-slot"></div><div class="mt-library-slot"></div></div>
 </div></section></div>`;
 document.body.append(root);
 const find=selector=>root.querySelector(selector),layer=find('.mt-sheet-layer'),stage=find('.mt-stage'),rink=$('trialRink'),anchors=[];
 // Clip actual rink geometry as well as changing its camera. SVG letterboxing
 // can otherwise expose the other half outside the requested viewBox.
 const ns='http://www.w3.org/2000/svg',viewport=document.createElementNS(ns,'g'),defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),clipRect=document.createElementNS(ns,'rect');
 clip.id='tacticsViewClip';clip.setAttribute('clipPathUnits','userSpaceOnUse');clip.append(clipRect);defs.append(clip);
 while(rink.firstChild)viewport.append(rink.firstChild);rink.append(defs,viewport);

 const benches=[];
 for(const [side,label,ids] of [['own','己方待放',['C','LW','RW','LD','RD']],['opponent','對手待放',['OC','OL','OR','ODL','ODR']]]){
  const bench=document.createElement('aside');bench.className='mt-bench mt-bench-'+side;bench.setAttribute('aria-label',label);
  const title=document.createElement('strong');title.textContent=label;bench.append(title);
  for(const id of ids){const b=document.createElement('button');b.dataset.mtBench=id;b.textContent=id;b.onclick=()=>selectRole(id);bench.append(b);}
  const empty=document.createElement('small');empty.textContent='全部已入場';bench.append(empty);benches.push(bench);stage.append(bench);
 }
 const camera=bindBoardViewport(rink,{enabled:()=>active&&layer.hidden,onChange:(zoom,box)=>{find('[data-mt-zoom-reset]').textContent=Math.round(zoom*100)+'%';for(const [key,value] of Object.entries({x:box.x,y:box.y,width:box.w,height:box.h}))clipRect.setAttribute(key,value);}});
 let active=false,view='all',lastFocus=null;
 function relocate(node,target){const marker=document.createComment('mobile tactics return');node.before(marker);anchors.push([node,marker]);target.append(node);}
 function closeSheet(){if(layer.hidden)return;layer.hidden=true;stage.inert=false;find('.mt-tools').inert=false;find('.mt-actions').inert=false;if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
 function openSheet(name,trigger){lastFocus=trigger||document.activeElement;for(const panel of root.querySelectorAll('[data-mt-panel]'))panel.hidden=panel.dataset.mtPanel!==name;find('.mt-sheet-title').textContent={people:'人員與冰球',steps:'演練步驟',more:'更多功能'}[name];layer.hidden=false;stage.inert=true;find('.mt-tools').inert=true;find('.mt-actions').inert=true;find('[data-mt-close]').focus({preventScroll:true});}
 function setView(value){view=value;const x=value==='right'?500:0,w=value==='all'?1000:500;
  camera.reset({x,y:0,w,h:600});rink.setAttribute('preserveAspectRatio','xMidYMid meet');
  clipRect.setAttribute('x',x);clipRect.setAttribute('y',0);clipRect.setAttribute('width',w);clipRect.setAttribute('height',600);viewport.setAttribute('clip-path','url(#tacticsViewClip)');
  for(const b of root.querySelectorAll('[data-mt-view]'))b.setAttribute('aria-pressed',String(b.dataset.mtView===value));}

 const roster=find('.mt-roster');for(const [label,ids] of [['己方',['C','LW','RW','LD','RD']],['對手',['OC','OL','OR','ODL','ODR']]]){const h=document.createElement('h3');h.textContent=label;const row=document.createElement('div');for(const id of ids){const b=document.createElement('button');b.dataset.mtPlayer=id;b.onclick=()=>{selectRole(id);closeSheet();};row.append(b);}roster.append(h,row);}
 find('[data-mt-back]').onclick=()=>{closeSheet();$('trialTab').click();};
 for(const [selector,name] of [['[data-mt-people]','people'],['[data-mt-steps]','steps'],['[data-mt-more]','more']])find(selector).onclick=e=>openSheet(name,e.currentTarget);
 find('[data-mt-close]').onclick=closeSheet;find('.mt-scrim').onclick=closeSheet;
 for(const b of root.querySelectorAll('[data-mt-tool]'))b.onclick=()=>{const s=getState();selectTool(b.dataset.mtTool==='select'?(s.turn===0?'setup':'move'):b.dataset.mtTool);};
 find('[data-mt-zoom-reset]').onclick=()=>setView(view);
 for(const b of root.querySelectorAll('[data-mt-view]'))b.onclick=()=>setView(b.dataset.mtView);
 for(const [selector,id] of [['[data-mt-undo]','boardQuickUndo'],['[data-mt-commit]','boardQuickCommit'],['[data-mt-play]','boardQuickPlay'],['.mt-resume','boardResume'],['[data-mt-give]','puckToPlayer'],['[data-mt-clear]','clearTrialPlan']])find(selector).onclick=()=>{if(!$(id).disabled)$(id).click();if(selector==='[data-mt-give]')closeSheet();};
 find('[data-mt-place]').onclick=()=>{selectTool('puck');closeSheet();};
 find('[data-mt-scene]').onclick=()=>{closeSheet();$('sceneTab').click();};
 find('[data-mt-export]').onclick=()=>{closeSheet();openExports();};
 find('[data-mt-add]').onclick=()=>$('boardAddPuck').click();
 find('[data-mt-pickup]').onclick=()=>pickup();
 find('[data-mt-empty]').onclick=()=>find('[data-mt-reset]').click();
 find('[data-mt-reset]').onclick=()=>{if(confirm('清空目前戰術板？已儲存的演練會保留。')){closeSheet();$('trialCapture').click();setView('all');}};
 layer.addEventListener('click',e=>{if(e.target.closest('#boardPuckTray button,#boardAddPuck,#boardStepStrip button'))setTimeout(closeSheet,0);});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();return;}if(e.key==='Tab'&&!layer.hidden){const nodes=[...find('.mt-sheet').querySelectorAll('button,input,select,summary,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
 function sync(){
  const s=getState(),next=s.enabled;
  if(next!==active){active=next;if(active){onActivate();root.hidden=false;document.body.classList.add('mobile-tactics-open');relocate(rink,stage);relocate($('boardPuckTray'),find('.mt-puck-slot'));relocate($('boardAddPuck'),find('.mt-puck-slot'));relocate(document.querySelector('.drill-sequence'),find('.mt-step-slot'));relocate($('boardLoop').parentElement,find('.mt-step-slot'));relocate(document.querySelector('.board-quick-colors'),find('.mt-color-slot'));relocate(document.querySelector('.drill-examples'),find('.mt-example-slot'));relocate(document.querySelector('.replay-library'),find('.mt-library-slot'));setView(view);}else{camera.reset();closeSheet();for(const [node,marker] of anchors.splice(0).reverse()){marker.replaceWith(node);}rink.setAttribute('viewBox','0 0 1000 600');viewport.removeAttribute('clip-path');root.hidden=true;document.body.classList.remove('mobile-tactics-open');}}
  if(!active)return;
  find('[data-mt-pickup]').disabled=!s.canPickup;find('[data-mt-add]').disabled=$('boardAddPuck').disabled||s.inspecting;find('[data-mt-empty]').disabled=s.animating;

  for(const bench of benches){let waiting=0;for(const b of bench.querySelectorAll('[data-mt-bench]')){b.hidden=s.activePlayers.includes(b.dataset.mtBench);if(!b.hidden)waiting++;b.disabled=s.animating||s.inspecting;b.setAttribute('aria-pressed',String(b.dataset.mtBench===s.role));}bench.querySelector('small').hidden=waiting>0;}

  find('[data-mt-steps]').textContent=(s.inspecting?'查看 ':'第 ')+s.turn+' / 30 步 ▾';find('[data-mt-people]').textContent=s.role+' · 人員／球';
  find('[data-mt-possession]').textContent=s.owner?s.owner+' 持球':s.puckCount?'無人持球':'尚未放入冰球';
  for(const b of root.querySelectorAll('[data-mt-tool]')){const tool=b.dataset.mtTool;b.disabled=s.animating||['pass','shot'].includes(tool)&&s.owner!==s.role;b.setAttribute('aria-pressed',String(tool==='select'?['setup','move','puck'].includes(s.tool):tool===s.tool));}
  for(const b of root.querySelectorAll('[data-mt-player]')){const id=b.dataset.mtPlayer;b.textContent=id+(s.activePlayers.includes(id)?'':' 待放');b.disabled=s.animating;b.setAttribute('aria-pressed',String(id===s.role));}
  for(const [selector,id] of [['[data-mt-undo]','boardQuickUndo'],['[data-mt-commit]','boardQuickCommit'],['[data-mt-play]','boardQuickPlay'],['[data-mt-give]','puckToPlayer'],['[data-mt-clear]','clearTrialPlan']])find(selector).disabled=$(id).disabled;
  find('[data-mt-place]').disabled=!s.puckCount||s.animating;find('[data-mt-give]').disabled=!s.puckCount||s.animating||!s.activePlayers.includes(s.role);
  find('[data-mt-undo]').textContent=s.hasPlan?'↶ 撤銷動作':'↶ 撤銷一步';find('[data-mt-play]').textContent=s.playing?'Ⅱ 暫停':'▶ 播放';
  find('.mt-resume').hidden=!s.inspecting;
  const text=s.error||(s.inspecting?'正在查看已加入的局面。':s.animating?'正在演示已加入的步驟。':!s.activePlayers.length?'點「人員／球」選球員，再點冰場放入。':!s.activePlayers.includes(s.role)?'點冰場放入 '+s.role+'。':s.tool==='pass'?'畫直線，交給終點最近的同隊球員。':s.tool==='shot'?'畫直線射門，再加入這一步。':s.tool==='puck'?'點落點放球；無人持有的冰球也可直接拖動。':s.tool==='setup'?'直接拖動調整擺位；工具列可切換走位。':'從球員位置畫路線，再加入這一步。');
  find('.mt-hint').textContent=text;find('.mt-hint').classList.toggle('is-error',!!s.error);
 }
 sync();return {sync,closeSheet};
}
