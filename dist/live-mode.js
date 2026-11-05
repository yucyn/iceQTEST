const canvas=document.getElementById('rink'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id),W=960,H=600,HOME='#287c79',AWAY='#c86764',R=17;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),norm=(x,y)=>{const d=Math.hypot(x,y)||1;return {x:x/d,y:y/d}};
const keys=new Set();let game,frame=0,last=0,acc=0,replayIndex=0,guideTimer=0;
const roles=['C','LW','RW'];
function player(team,i,x,y){return {id:team+roles[i],team,role:roles[i],x,y,vx:0,vy:0,r:R,seek:null};}
function newGame(){game={players:[player('H',0,430,300),player('H',1,315,180),player('H',2,315,420),player('A',0,660,300),player('A',1,745,185),player('A',2,745,415)],puck:{x:446,y:300,vx:0,vy:0,owner:'HC',flight:null},selected:'HC',running:false,mode:'play',time:0,score:[0,0],history:[],message:'開球準備。按開始進行即時對弈。',coach:{title:'觀察位置',text:'按開始，注意持球者與防守者之間的距離。'},lastCoach:'',cool:0,resetIn:0};keys.clear();renderUI();draw();}
const byId=id=>game.players.find(p=>p.id===id),carrier=()=>byId(game.puck.owner);
function setting(id){return Number($(id).value)||1;}
function info(title,text,tag){if(game.lastCoach===tag)return;game.lastCoach=tag;game.coach={title,text};$('coachTitle').textContent=title;$('coachText').textContent=text;}
function message(s){game.message=s;$('status').textContent=s;}
function renderUI(){
 $('home').textContent=game.score[0];$('away').textContent=game.score[1];
 const mm=Math.floor(game.time/60),ss=Math.floor(game.time%60);$('clock').textContent=String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
 $('toggle').textContent=game.running?'Ⅱ 暫停':'▶ 開始';$('toggle').disabled=game.mode==='replay';
 $('replay').textContent=game.mode==='replay'?'■ 結束回放':'▶ 回放';$('replay').disabled=game.mode!=='replay'&&game.history.length<3;
 const owner=carrier(),sel=byId(game.selected);$('details').textContent='球權：'+(owner?(owner.team==='H'?'青隊 ':'紅隊 ')+owner.role:'飛行中／自由球')+' · 控制 '+sel.role;
 const receivers=game.players.filter(p=>p.team==='H'&&p.id!==game.puck.owner);
 const old=$('receiver').value;$('receiver').replaceChildren(...receivers.map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.role+' · '+(p.id===game.selected?'目前控制':'隊友');return o;}));if(receivers.some(p=>p.id===old))$('receiver').value=old;
}
function moveTowards(p,target,speed,dt,weight=1){const v=norm(target.x-p.x,target.y-p.y);const d=dist(p,target);if(d<7){p.vx*=.72;p.vy*=.72;return;}const k=clamp(d/40,.24,1);p.vx+=(v.x*speed*k-p.vx)*Math.min(1,dt*7*weight);p.vy+=(v.y*speed*k-p.vy)*Math.min(1,dt*7*weight);}
function guide(){
 const owner=carrier(),s=byId(game.selected);
 if(!owner)return;
 if(owner.team==='H'){
  const enemies=game.players.filter(p=>p.team==='A').sort((a,b)=>dist(a,owner)-dist(b,owner));
  const near=dist(enemies[0],owner);
  if(near<80){info('壓迫逼近','防守者已靠近持球者。觀察左右翼是否出現短傳出口。','press');}
  else if(owner.x>750){info('射門選擇','已接近進攻區，可嘗試射門或傳給弱側隊友。','shot');}
  else {info('保持進攻寬度','利用兩側隊友拉開防線，持球者向右推進。','width');}
 }else{
  if(dist(s,owner)<95)info('立即逼搶','靠近對方持球者，封鎖他前往球門的路線。','steal');
  else info('回防站位','紅隊持球。切換防守者或向左側收縮，避免中路被突破。','defend');
 }
}
function resetFaceoff(scored){const p=game.players;[[430,300],[315,180],[315,420],[660,300],[745,185],[745,415]].forEach((a,i)=>{Object.assign(p[i],{x:a[0],y:a[1],vx:0,vy:0,seek:null})});game.puck={x:446,y:300,vx:0,vy:0,owner:scored==='H'?'AC':'HC',flight:null};game.selected='HC';game.cool=1.5;game.lastCoach='';}
function passTo(id){if(!game.running||game.mode!=='play')return;const from=carrier(),to=byId(id);if(!from||from.team!=='H'||!to||to.team!=='H'||to.id===from.id){message('只有青隊持球者可以傳給其他青隊隊員。');return;} const d=dist(from,to);if(d<16)return;game.puck.owner=null;game.puck.flight={target:to.id,team:'H',time:0};const v=norm(to.x-from.x,to.y-from.y);game.puck.x=from.x+v.x*22;game.puck.y=from.y+v.y*22;game.puck.vx=v.x*470;game.puck.vy=v.y*470;game.selected=to.id;game.cool=.35;message(from.role+' 傳球給 '+to.role);renderUI();}
function pass(){let target=byId($('receiver').value);if(!target){const owner=carrier();target=game.players.find(p=>p.team==='H'&&p.id!==owner?.id);}if(target)passTo(target.id);}
function shoot(){if(!game.running||game.mode!=='play')return;const owner=carrier();if(!owner||owner.team!=='H'){message('青隊持球後才能射門。');return;}const v=norm(910-owner.x,300-owner.y);game.puck.owner=null;game.puck.flight={team:'H',shot:true,time:0};game.puck.x=owner.x+v.x*20;game.puck.y=owner.y+v.y*20;game.puck.vx=v.x*590;game.puck.vy=v.y*590;game.cool=.4;message(owner.role+' 射門！');info('射門路線','觀察守門員與防守者是否封住射門角度。','shot-action');}
function switchPlayer(){const h=game.players.filter(p=>p.team==='H');let i=h.findIndex(p=>p.id===game.selected);game.selected=h[(i+1)%h.length].id;message('控制球員：'+byId(game.selected).role);renderUI();}
function score(team){game.score[team==='H'?0:1]++;message((team==='H'?'青隊':'紅隊')+' 得分！重新開球。');info('攻防轉換','進球後重新開球，觀察防守者是否有封堵射門路線。','goal'+game.time);resetFaceoff(team);renderUI();}
function update(dt){
 const g=game,owner=carrier(),selected=byId(g.selected),difficulty=setting('difficulty'),speed=setting('speed');dt*=speed;g.time+=dt;g.cool=Math.max(0,g.cool-dt);
 const own=owner?.team;
 for(const p of g.players){
  if(p===selected){
   const dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);
   if(dx||dy){const n=norm(dx,dy);moveTowards(p,{x:p.x+n.x*100,y:p.y+n.y*100},190,dt);p.seek=null;}
   else if(p.seek){moveTowards(p,p.seek,185,dt);if(dist(p,p.seek)<11)p.seek=null;}
   else {p.vx*=Math.max(.01,1-dt*5);p.vy*=Math.max(.01,1-dt*5);}
  }else if(p.team==='H'){
   const base=p.role==='LW'?{x:clamp((owner?.x??450)+55,240,820),y:180}:p.role==='RW'?{x:clamp((owner?.x??450)+55,240,820),y:420}:{x:clamp((owner?.x??450)+72,220,845),y:300};
   if(own==='A'){base.x=clamp((owner?.x??620)-100,190,820);base.y=p.role==='LW'?210:p.role==='RW'?390:300;if(p===game.players[0]){base.x=owner.x-45;base.y=owner.y;}}
   if(p===owner){p.vx*=.9;p.vy*=.9;}else moveTowards(p,base,105,dt);
  }else{
   let target;
   if(own==='H'){const attackers=g.players.filter(v=>v.team==='H').sort((a,b)=>dist(a,p)-dist(b,p));const marked=owner&&p.role==='C'?owner:p.role==='LW'?attackers[0]:attackers[1];target={x:clamp((marked?.x??520)+48,380,900),y:clamp(marked?.y??300,90,510)};}
   else if(p===owner){target={x:135,y:clamp(p.y+(300-p.y)*.04,130,470)};if(dist(p,target)<90&&g.cool<=0){g.puck.owner=null;g.puck.flight={team:'A',shot:true,time:0};const v=norm(90-p.x,300-p.y);g.puck.x=p.x;g.puck.y=p.y;g.puck.vx=v.x*520;g.puck.vy=v.y*520;g.cool=1.4;message('紅隊射門！');}}
   else target={x:clamp((owner?.x??650)-80,150,850),y:p.role==='LW'?190:p.role==='RW'?410:300};
   if(p!==owner)moveTowards(p,target,108*difficulty,dt);else if(own==='A')moveTowards(p,target,118*difficulty,dt);
  }
  p.x=clamp(p.x+p.vx*dt,65,895);p.y=clamp(p.y+p.vy*dt,73,527);
 }
 const puck=g.puck;
 if(puck.owner){const h=byId(puck.owner);if(h){puck.x=h.x+(h.team==='H'?17:-17);puck.y=h.y+12;}}
 else{
  puck.x+=puck.vx*dt;puck.y+=puck.vy*dt;if(puck.y<62||puck.y>538){puck.y=clamp(puck.y,62,538);puck.vy*=-.65;}puck.flight&&(puck.flight.time+=dt);
  if(puck.x>914||puck.x<46){const attacking=puck.x>914?'H':'A';if(puck.y>258&&puck.y<342){const keeperChance=puck.flight?.shot?.62:.72;if(Math.random()>keeperChance){score(attacking);return;}message('守門員封住射門！');}puck.x=clamp(puck.x,65,895);puck.vx*=-.55;puck.flight=null;}
  const closest=g.players.map(p=>({p,d:dist(p,puck)})).sort((a,b)=>a.d-b.d)[0];
  if(closest&&closest.d<23&&g.cool<=0){puck.owner=closest.p.id;puck.flight=null;puck.vx=puck.vy=0;message((closest.p.team==='H'?'青隊 ':'紅隊 ')+closest.p.role+' 取得球權');renderUI();}
  puck.vx*=Math.max(.85,1-dt*.35);puck.vy*=Math.max(.85,1-dt*.35);
 }
 if(owner&&g.cool<=0){
  const opponents=g.players.filter(p=>p.team!==owner.team).sort((a,b)=>dist(a,owner)-dist(b,owner));
  if(opponents[0]&&dist(opponents[0],owner)<24&&Math.random()<dt*(own==='H'?0.7*difficulty:0.45)){puck.owner=opponents[0].id;g.cool=.75;message('球權遭到攔截！');renderUI();}
 }
 guideTimer+=dt;if(guideTimer>.65){guide();guideTimer=0;}
 if(Math.floor(g.time*10)%3===0)g.history.push(snapshot());if(g.history.length>1200)g.history.shift();
 if(Math.floor(g.time*10)%5===0)renderUI();
}
function snapshot(){return {players:game.players.map(p=>[p.x,p.y]),puck:[game.puck.x,game.puck.y],selected:game.selected,owner:game.puck.owner,time:game.time,score:[...game.score]};}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#e9f0ed';ctx.fillRect(0,0,W,H);ctx.save();ctx.beginPath();ctx.roundRect(44,50,872,500,96);ctx.clip();ctx.fillStyle='#fafdfc';ctx.fillRect(44,50,872,500);ctx.fillStyle='#eef5f3';ctx.fillRect(350,50,260,500);
 ctx.strokeStyle='#729db8';ctx.lineWidth=6;[350,610].forEach(x=>{ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x,550);ctx.stroke()});ctx.strokeStyle='#cb807d';ctx.lineWidth=3;[110,480,850].forEach(x=>{ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x,550);ctx.stroke()});
 ctx.strokeStyle='#bdced2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(480,300,65,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#d3aaa6';for(const x of [220,740])for(const y of [180,420]){ctx.beginPath();ctx.arc(x,y,57,0,7);ctx.stroke();ctx.fillStyle='#cb8b83';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();}
 ctx.fillStyle='#e1ecf2';ctx.fillRect(86,265,24,70);ctx.fillRect(850,265,24,70);ctx.restore();
 ctx.strokeStyle='#b1c4c0';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(44,50,872,500,96);ctx.stroke();
 for(const x of [106,854]){ctx.fillStyle=x<500?HOME:AWAY;ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(x,300,18,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='white';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('G',x,304);}
 for(const p of game.players){const selected=p.id===game.selected; if(selected){ctx.fillStyle='#d7a36a';ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle=p.team==='H'?HOME:AWAY;ctx.beginPath();ctx.arc(p.x,p.y,R,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(p.role,p.x,p.y+4);
 if(game.puck.owner===p.id){ctx.strokeStyle='#d5a04a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,21,0,7);ctx.stroke();}}
 ctx.fillStyle='#1c3237';ctx.beginPath();ctx.ellipse(game.puck.x,game.puck.y,7,5,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#4a6767';ctx.font='14px system-ui';ctx.textAlign='left';ctx.fillText('← 防守',52,32);ctx.textAlign='right';ctx.fillText('進攻 →',900,32);
 if(game.mode==='replay'){ctx.fillStyle='#17383aba';ctx.fillRect(365,15,230,35);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 17px system-ui';ctx.fillText('REPLAY · 動作回放',480,39);}
}
function replayStep(){if(replayIndex>=game.history.length){stopReplay();return;}const s=game.history[replayIndex++];s.players.forEach((a,i)=>{game.players[i].x=a[0];game.players[i].y=a[1]});game.puck.x=s.puck[0];game.puck.y=s.puck[1];game.puck.owner=s.owner;game.selected=s.selected;game.time=s.time;game.score=s.score;if(replayIndex%5===0)renderUI();}
function stopReplay(){game.mode='play';game.running=false;message('回放已結束。按開始繼續。');renderUI();}
function tick(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(game.mode==='replay'){acc+=dt;while(acc>=.12&&game.mode==='replay'){replayStep();acc-=.12;}}else if(game.running){acc+=dt;let loops=0;while(acc>=1/60&&loops++<4){update(1/60);acc-=1/60;}}draw();frame=requestAnimationFrame(tick);}
$('toggle').addEventListener('click',()=>{game.running=!game.running;message(game.running?'即時對弈進行中。':'已暫停。');renderUI();});
$('reset').addEventListener('click',()=>{newGame();message('已重新開局。');});
$('switch').addEventListener('click',switchPlayer);$('pass').addEventListener('click',pass);$('shoot').addEventListener('click',shoot);
$('replay').addEventListener('click',()=>{if(game.mode==='replay'){stopReplay();return;}if(game.history.length<3)return;game.running=false;game.mode='replay';replayIndex=0;acc=0;message('正在回放本局動作。');renderUI();});
canvas.addEventListener('pointerdown',e=>{if(game.mode==='replay')return;const b=canvas.getBoundingClientRect(),p={x:(e.clientX-b.left)*960/b.width,y:(e.clientY-b.top)*600/b.height};const h=game.players.filter(x=>x.team==='H').sort((a,b)=>dist(a,p)-dist(b,p));if(h[0]&&dist(h[0],p)<30){game.selected=h[0].id;message('控制球員：'+h[0].role);renderUI();}else{byId(game.selected).seek={x:clamp(p.x,65,895),y:clamp(p.y,73,527)};}canvas.focus();});
const bindKeys={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
window.addEventListener('keydown',e=>{const tag=e.target.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;const key=e.key.toLowerCase();if(bindKeys[key]){e.preventDefault();keys.add(bindKeys[key]);}else if(!e.repeat&&key==='q')switchPlayer();else if(!e.repeat&&key==='j')pass();else if(!e.repeat&&key==='k')shoot();else if(!e.repeat&&key===' '){e.preventDefault();if(game.mode!=='replay')$('toggle').click();}});
window.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(bindKeys[key])keys.delete(bindKeys[key]);});window.addEventListener('blur',()=>keys.clear());
document.querySelectorAll('[data-dir]').forEach(btn=>{const name=btn.dataset.dir;btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);keys.add(name);});for(const type of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(type,()=>keys.delete(name));});
newGame();last=performance.now();frame=requestAnimationFrame(tick);