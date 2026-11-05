const canvas=document.getElementById('rink'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id),W=960,H=600,HOME='#287c79',AWAY='#c86764',R=17;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),norm=(x,y)=>{const d=Math.hypot(x,y)||1;return {x:x/d,y:y/d}};
const keys=new Set();let analog={x:0,y:0};let game,frame=0,last=0,acc=0,replayIndex=0,guideTimer=0;
const roles=['C','LW','RW','LD','RD'];
function player(team,i,x,y){return {id:team+roles[i],team,role:roles[i],x,y,vx:0,vy:0,r:R,seek:null};}
const START=[[430,300],[318,165],[318,435],[215,245],[215,355],[590,300],[695,165],[695,435],[790,245],[790,355]];
function newGame(){game={players:START.map(([x,y],i)=>player(i<5?'H':'A',i%5,x,y)),puck:{x:446,y:300,vx:0,vy:0,owner:'HC',flight:null},selected:'HC',running:false,mode:'play',time:0,score:[0,0],history:[],message:'開球準備。按開始進行即時對弈。',coach:{title:'觀察位置',text:'按開始，注意持球者與防守者之間的距離。'},lastCoach:'',cool:0,resetIn:0,stealCooldown:0};keys.clear();analog={x:0,y:0};setKnob(0,0);renderUI();draw();}
const byId=id=>game.players.find(p=>p.id===id),carrier=()=>byId(game.puck.owner);
function setting(id){return Number($(id).value)||1;}
function info(title,text,tag){if(game.lastCoach===tag)return;game.lastCoach=tag;game.coach={title,text};$('coachTitle').textContent=title;$('coachText').textContent=text;}
function message(s){game.message=s;$('status').textContent=s;}
function renderUI(){
 $('home').textContent=game.score[0];$('away').textContent=game.score[1];
 const mm=Math.floor(game.time/60),ss=Math.floor(game.time%60);$('clock').textContent=String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
 $('toggle').textContent=game.running?'暫停':'開始';$('toggle').disabled=game.mode==='replay';
 $('replay').textContent=game.mode==='replay'?'結束回放':'回放';$('replay').disabled=game.mode!=='replay'&&game.history.length<3;
 const owner=carrier(),sel=byId(game.selected);$('details').textContent='球權：'+(owner?(owner.team==='H'?'青隊 ':'紅隊 ')+owner.role:'飛行中／自由球')+' · 控制 '+sel.role;
 const receivers=game.players.filter(p=>p.team==='H'&&p.id!==game.puck.owner);
 const old=$('receiver').value;$('receiver').replaceChildren(...receivers.map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.role+' · '+(p.id===game.selected?'目前控制':'隊友');return o;}));if(receivers.some(p=>p.id===old))$('receiver').value=old;else {const preferred=receivers.find(p=>p.id!==game.selected);if(preferred)$('receiver').value=preferred.id;}
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
  if(dist(s,owner)<95)info('立即逼搶','靠近紅隊持球者後按 L／搶球；選中的青隊球員會伸桿奪球。','steal');
  else info('回防站位','紅隊持球。切換防守者或向左側收縮，避免中路被突破。','defend');
 }
}
function resetFaceoff(scored){const p=game.players;START.forEach((a,i)=>{Object.assign(p[i],{x:a[0],y:a[1],vx:0,vy:0,seek:null})});game.puck={x:446,y:300,vx:0,vy:0,owner:scored==='H'?'AC':'HC',flight:null};game.selected='HC';game.cool=1.0;game.stealCooldown=0;game.lastCoach='';}
function passTo(id){
 if(!game.running||game.mode!=='play')return;
 const from=carrier(),to=byId(id);
 if(!from||from.team!=='H'||!to||to.team!=='H'||to.id===from.id){message('只有青隊持球者能傳給青隊隊友。');return;}
 const d=dist(from,to);if(d<22){message('傳球目標太近。');return;}
 // Lead a moving receiver, then dynamically update guidance while the pass is in flight.
 const flightTime=clamp(d/490,.1,1.6),ahead=.2;
 const lead={x:clamp(to.x+to.vx*flightTime*ahead,65,895),y:clamp(to.y+to.vy*flightTime*ahead,73,527)};
 const v=norm(lead.x-from.x,lead.y-from.y);
 game.puck.owner=null;game.puck.flight={target:to.id,from:from.id,team:'H',time:0,shot:false};
 game.puck.x=from.x+v.x*23;game.puck.y=from.y+v.y*23;
 game.puck.vx=v.x*490;game.puck.vy=v.y*490;
 game.cool=.12;
 // Keep the current skater selected while the receiver skates toward the pass.
 // Once possession is confirmed, receivePuck switches control to the receiver.
 message(from.role+' 傳球給 '+to.role+'，接球者正在接應');renderUI();
}
function pass(){
 const owner=carrier();if(!owner||owner.team!=='H'){message('先取得球權再傳球。');return;}
 let target=byId($('receiver').value);
 if(!target||target.id===owner.id||target.team!=='H')target=game.players.filter(p=>p.team==='H'&&p.id!==owner.id).sort((a,b)=>dist(a,owner)-dist(b,owner))[0];
 if(target)passTo(target.id);
}
function steal(){
 if(!game.running||game.mode!=='play')return;
 if(game.stealCooldown>0){message('搶球動作冷卻中。');return;}
 const defender=byId(game.selected),owner=carrier();
 if(!defender||defender.team!=='H')return;
 game.stealCooldown=.4;
 if(!owner){
  const d=dist(defender,game.puck);
  if(d<=41){game.puck.owner=defender.id;game.puck.flight=null;game.puck.vx=0;game.puck.vy=0;game.cool=.45;message(defender.role+' 收下自由球！');renderUI();}
  else message('尚未接近冰球，請先滑向球的位置。');
  return;
 }
 if(owner.team==='H'){message('目前由青隊控球，不需要搶球。');return;}
 const distance=dist(defender,owner);
 if(distance>54){message('尚未進入搶球範圍（54）。請先靠近，或點選離持球者最近的青隊球員。');return;}
 // Distance and facing influence a deterministic tackle range; high-speed poke checks have longer reach.
 const relativeSpeed=Math.hypot(defender.vx-owner.vx,defender.vy-owner.vy);
 const reach=46+Math.min(8,relativeSpeed*.04);
 if(distance>reach){message('搶球距離不足，繼續逼近。');return;}
 game.puck.owner=defender.id;game.puck.flight=null;game.puck.vx=0;game.puck.vy=0;game.cool=.6;
 message(defender.role+' 成功搶球！');info('球權轉換','成功搶球後，觀察兩側隊友的出球路線。','tackle'+Math.floor(game.time));renderUI();
}
function shoot(){if(!game.running||game.mode!=='play')return;const owner=carrier();if(!owner||owner.team!=='H'){message('青隊持球後才能射門。');return;}const v=norm(910-owner.x,300-owner.y);game.puck.owner=null;game.puck.flight={team:'H',shot:true,time:0};game.puck.x=owner.x+v.x*20;game.puck.y=owner.y+v.y*20;game.puck.vx=v.x*590;game.puck.vy=v.y*590;game.cool=.4;message(owner.role+' 射門！');info('射門路線','觀察守門員與防守者是否封住射門角度。','shot-action');}
function switchPlayer(){const h=game.players.filter(p=>p.team==='H');let i=h.findIndex(p=>p.id===game.selected);game.selected=h[(i+1)%h.length].id;message('控制球員：'+byId(game.selected).role);renderUI();}
function score(team){game.score[team==='H'?0:1]++;message((team==='H'?'青隊':'紅隊')+' 得分！重新開球。');info('攻防轉換','進球後重新開球，觀察防守者是否有封堵射門路線。','goal'+game.time);resetFaceoff(team);renderUI();}
function unitTo(a,b){return norm(b.x-a.x,b.y-a.y);}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy||1,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1);return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y);}
function formation(p,owner,own){
 const baseY={C:300,LW:166,RW:434,LD:240,RD:360}[p.role];
 const isAttack=p.team===own,dir=p.team==='H'?1:-1;
 const center=owner||{x:480,y:300};
 if(isAttack){
  const gap=p.role==='LD'||p.role==='RD'?-125:p.role==='C'?60:90;
  return {x:clamp(center.x+dir*gap,105,855),y:clamp(baseY+(center.y-300)*.24,95,505)};
 }
 const gap=p.role==='LD'||p.role==='RD'? -130: p.role==='C'?30: -45;
 return {x:clamp(center.x+dir*gap,105,855),y:clamp(baseY+(center.y-300)*.34,90,510)};
}
function receivePuck(player,label){
 game.puck.owner=player.id;game.puck.flight=null;game.puck.vx=game.puck.vy=0;game.cool=.25;
 if(player.team==='H')game.selected=player.id;
 message((player.team==='H'?'青隊 ':'紅隊 ')+player.role+label);renderUI();
}
function update(dt){
 const g=game,selected=byId(g.selected),difficulty=setting('difficulty'),speed=setting('speed');
 dt*=speed;g.time+=dt;g.cool=Math.max(0,g.cool-dt);g.stealCooldown=Math.max(0,g.stealCooldown-dt);
 const owner=carrier(),own=owner?.team||null,puck=g.puck,flight=puck.flight;
 for(const p of g.players){
  if(p===selected && flight?.target!==p.id){
   const keyX=(keys.has('right')?1:0)-(keys.has('left')?1:0),keyY=(keys.has('down')?1:0)-(keys.has('up')?1:0);
   const dx=clamp(keyX+analog.x,-1,1),dy=clamp(keyY+analog.y,-1,1);
   if(dx||dy){const n=norm(dx,dy);moveTowards(p,{x:p.x+n.x*100,y:p.y+n.y*100},190,dt);p.seek=null;}
   else if(p.seek){moveTowards(p,p.seek,185,dt);if(dist(p,p.seek)<11)p.seek=null;}
   else {p.vx*=Math.max(.01,1-dt*5);p.vy*=Math.max(.01,1-dt*5);}
  }else if(p===owner){
   if(p.team==='A'){
    const target={x:130,y:clamp(p.y+(300-p.y)*.07,120,480)};
    moveTowards(p,target,120*difficulty,dt);
    if(p.x<220&&g.cool<=0){
     const v=norm(95-p.x,300-p.y);puck.owner=null;puck.flight={team:'A',shot:true,time:0,from:p.id};puck.x=p.x;puck.y=p.y;puck.vx=v.x*550;puck.vy=v.y*550;g.cool=.35;message('紅隊射門！');
    }
   }else {p.vx*=Math.max(.02,1-dt*6);p.vy*=Math.max(.02,1-dt*6);}
  }else{
   let target=formation(p,owner,own);
   if(flight?.target===p.id){
    // Receiver actively tracks the puck rather than remaining at the original pass destination.
    const lead=.09;target={x:clamp(puck.x+puck.vx*lead,65,895),y:clamp(puck.y+puck.vy*lead,73,527)};
   }else if(own&&p.team!==own){
    const contenders=g.players.filter(v=>v.team===own).sort((a,b)=>dist(a,p)-dist(b,p));
    const mark=p.role==='C'?owner:contenders[(p.role==='LD'||p.role==='RD')?0:1]||owner;
    if(mark)target={x:clamp(mark.x+(p.team==='H'?-38:38),90,870),y:clamp(mark.y+(p.role==='LW'?-30:p.role==='RW'?30:0),90,510)};
   }else if(!own && dist(p,puck)<110 && p.team==='A')target={x:puck.x,y:puck.y};
   moveTowards(p,target,(p.team==='H'?112:107*difficulty)+(flight?.target===p.id?65:0),dt);
  }
  p.x=clamp(p.x+p.vx*dt,65,895);p.y=clamp(p.y+p.vy*dt,73,527);
 }
 if(puck.owner){
  const h=carrier();if(h){puck.x=h.x+(h.team==='H'?18:-18);puck.y=h.y+12;}
 }else{
  const before={x:puck.x,y:puck.y};
  // Homing only compensates for receiver movement; opponents can still intercept the flight path.
  if(flight?.target){
   const target=byId(flight.target);
   if(target){
    const lead={x:target.x+target.vx*.035,y:target.y+target.vy*.035};
    const steer=unitTo(puck,lead),current=norm(puck.vx,puck.vy),rate=clamp(dt*9,0,.22);
    const n=norm(current.x*(1-rate)+steer.x*rate,current.y*(1-rate)+steer.y*rate);
    puck.vx=n.x*470;puck.vy=n.y*470;
   }
  }
  puck.x+=puck.vx*dt;puck.y+=puck.vy*dt;if(flight)flight.time+=dt;
  if(puck.y<62||puck.y>538){puck.y=clamp(puck.y,62,538);puck.vy*=-.72;if(flight?.target)puck.flight=null;}
  // Swept segment detection avoids missing a puck passing between physics frames.
  const candidates=g.players.map(p=>({p,d:segmentDistance(p,before,puck)}))
    .filter(x=>x.d<(flight?.target===x.p.id?40:22))
    .filter(x=>!(flight?.from===x.p.id&&flight.time<.22))
    .sort((a,b)=>a.d-b.d);
  if(candidates.length&&g.cool<=.12){
   // Defenders may intercept; same-team bystanders must not steal a targeted pass.
   const defenders=candidates.filter(x=>flight?.target&&x.p.team!==flight.team);
   const receiver=candidates.find(x=>flight?.target===x.p.id);
   const picked=defenders[0]?.d < (receiver?.d??Infinity)-5?defenders[0]:receiver||defenders[0]||(!flight?.target?candidates[0]:null);
   if(picked)receivePuck(picked.p,picked.p.team!==flight?.team?' 攔截傳球！':' 接球成功！');
  }
  // A clean pass closes once the receiver is within one stick-length of the puck.
  if(!puck.owner&&flight?.target&&flight.time>.18){const receiver=byId(flight.target);if(receiver&&dist(receiver,puck)<43){const blocked=g.players.some(p=>p.team!==flight.team&&segmentDistance(p,before,puck)<16);if(!blocked)receivePuck(receiver,' 接球成功！');}}
  if(!puck.owner&&flight?.target&&flight.time>2.6){puck.flight=null;message('傳球未接住，冰球成為自由球。');}
  if(!puck.owner&&(puck.x>914||puck.x<46)){
   const attacking=puck.x>914?'H':'A';
   if(puck.y>258&&puck.y<342&&flight?.shot){
    const saveChance=.67;
    if(Math.random()>saveChance){score(attacking);return;}
    message('守門員撲救成功！');
   }
   puck.x=clamp(puck.x,65,895);puck.vx*=-.62;puck.flight=null;
  }
  if(!puck.owner){puck.vx*=Math.max(.85,1-dt*.24);puck.vy*=Math.max(.85,1-dt*.24);}
 }
 const current=carrier();
 if(current&&g.cool<=0){
  const opponents=g.players.filter(p=>p.team!==current.team).sort((a,b)=>dist(a,current)-dist(b,current));
  const nearest=opponents[0];
  if(nearest&&dist(nearest,current)<28&&nearest.team==='A'&&Math.random()<dt*.34*difficulty)receivePuck(nearest,' 自動斷球！');
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
$('switch').addEventListener('click',switchPlayer);$('pass').addEventListener('click',pass);$('shoot').addEventListener('click',shoot);$('steal').addEventListener('click',steal);
$('replay').addEventListener('click',()=>{if(game.mode==='replay'){stopReplay();return;}if(game.history.length<3)return;game.running=false;game.mode='replay';replayIndex=0;acc=0;message('正在回放本局動作。');renderUI();});
canvas.addEventListener('pointerdown',e=>{if(game.mode==='replay')return;const b=canvas.getBoundingClientRect(),p={x:(e.clientX-b.left)*960/b.width,y:(e.clientY-b.top)*600/b.height};const h=game.players.filter(x=>x.team==='H').sort((a,b)=>dist(a,p)-dist(b,p));if(h[0]&&dist(h[0],p)<30){game.selected=h[0].id;message('控制球員：'+h[0].role);renderUI();}else{byId(game.selected).seek={x:clamp(p.x,65,895),y:clamp(p.y,73,527)};}canvas.focus();});
const bindKeys={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
window.addEventListener('keydown',e=>{const tag=e.target.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;const key=e.key.toLowerCase();if(bindKeys[key]){e.preventDefault();keys.add(bindKeys[key]);}else if(!e.repeat&&key==='q')switchPlayer();else if(!e.repeat&&key==='j')pass();else if(!e.repeat&&key==='k')shoot();else if(!e.repeat&&key==='l')steal();else if(!e.repeat&&key===' '){e.preventDefault();if(game.mode!=='replay')$('toggle').click();}});
window.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(bindKeys[key])keys.delete(bindKeys[key]);});window.addEventListener('blur',()=>{keys.clear();releaseJoy();});
const joy=$('joystick'),knob=$('joyKnob');let activeJoyPointer=null;
function setKnob(x,y){if(!knob)return;knob.style.transform='translate('+(x*43)+'px,'+(y*43)+'px)';}
function updateJoy(e){const rect=joy.getBoundingClientRect();const centerX=rect.left+rect.width/2,centerY=rect.top+rect.height/2;const radius=Math.max(1,Math.min(rect.width,rect.height)*.37);let x=(e.clientX-centerX)/radius,y=(e.clientY-centerY)/radius;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}if(len<.12){x=0;y=0;}analog={x,y};setKnob(x,y);}
function releaseJoy(){activeJoyPointer=null;analog={x:0,y:0};setKnob(0,0);}
joy.addEventListener('pointerdown',e=>{e.preventDefault();activeJoyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);updateJoy(e);});
joy.addEventListener('pointermove',e=>{if(activeJoyPointer===e.pointerId)updateJoy(e);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(type,e=>{if(activeJoyPointer===e.pointerId)releaseJoy();});
joy.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(bindKeys[key]){e.preventDefault();keys.add(bindKeys[key]);}});
joy.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(bindKeys[key])keys.delete(bindKeys[key]);});
newGame();last=performance.now();frame=requestAnimationFrame(tick);