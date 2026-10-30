// Shared publication gate: use this same validator for a future CMS importer.
export const ROLES=['C','LW','RW','LD','RD'];
const OPPONENTS=['OC','OL','OR','ODL','ODR'];
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validateCourses(courses){
 const errors=[];const fail=(path,message)=>errors.push(`${path}: ${message}`);
 const object=(v,p)=>{if(!v||typeof v!=='object'||Array.isArray(v)){fail(p,'須為物件');return false;}return true;};
 const text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p,'須為非空文字');};
 const number=(v,p,min,max)=>{if(!Number.isFinite(v)||v<min||v>max)fail(p,`須為 ${min}–${max} 的數字`);};
 const fields=(v,p,allowed)=>Object.keys(v).forEach(k=>{if(!allowed.includes(k))fail(`${p}.${k}`,'未知欄位，請確認拼字或升級格式');});
 const point=(v,p)=>{if(!object(v,p))return;fields(v,p,['x','y']);number(v.x,`${p}.x`,40,960);number(v.y,`${p}.y`,50,550);};
 const paths=(v,p,duration)=>{if(!Array.isArray(v)||v.length<2){fail(p,'至少兩個時間／位置點');return;}v.forEach((a,i)=>{const q=`${p}[${i}]`;if(!Array.isArray(a)||a.length!==3){fail(q,'須為 [秒,x,y]');return;}number(a[0],q+'.time',0,duration);number(a[1],q+'.x',40,960);number(a[2],q+'.y',50,550);if(i&&a[0]<=v[i-1]?.[0])fail(q,'時間須遞增');});if(v[0]?.[0]!==0||v.at(-1)?.[0]!==duration)fail(p,'路線須涵蓋 0 秒至課程結束');};
 if(!Array.isArray(courses)||!courses.length)return ['courses: 至少一堂課'];
 const ids=new Set(),numbers=new Set();
 courses.forEach((course,ci)=>{
  const p=`courses[${ci}]`;if(!object(course,p))return;
  fields(course,p,['schemaVersion','id','number','title','category','focus','scenarios']);
  if(course.schemaVersion!==1)fail(p+'.schemaVersion','不支援的格式版本');
  if(!ID.test(course.id)||typeof course.id!=='string')fail(p+'.id','須為固定英文識別碼');
  if(ids.has(course.id))fail(p+'.id','重複課程 ID');ids.add(course.id);
  for(const f of ['number','title','category','focus'])text(course[f],p+'.'+f);
  if(numbers.has(course.number))fail(p+'.number','重複課程編號');numbers.add(course.number);
  if(!Array.isArray(course.scenarios)||!course.scenarios.length){fail(p+'.scenarios','至少一個情境');return;}
  const caseIds=new Set();course.scenarios.forEach((scenario,si)=>{
   const q=`${p}.scenarios[${si}]`;if(!object(scenario,q))return;
   fields(scenario,q,['id','label','revision','content']);
   if(typeof scenario.id!=='string'||!ID.test(scenario.id))fail(q+'.id','須為固定英文識別碼');
   if(caseIds.has(scenario.id))fail(q+'.id','同課程情境 ID 重複');caseIds.add(scenario.id);text(scenario.label,q+'.label');
   if(!Number.isInteger(scenario.revision)||scenario.revision<1)fail(q+'.revision','須為正整數');
   const c=scenario.content,r=q+'.content';if(!object(c,r))return;
   fields(c,r,['duration','checkpoint','predictionTime','title','subtitle','context','roles','opponents','phases','eyebrow','practiceIntro','source','takeaways','supportRoles','puckSegments','defaultRole','question','setting','ticks','direction','previewTime','learningFocus']);
   for(const f of ['title','context','eyebrow','practiceIntro'])text(c[f],r+'.'+f);
   for(const f of ['subtitle','question','setting','learningFocus'])if(c[f]!==undefined)text(c[f],r+'.'+f);
   number(c.duration,r+'.duration',.1,3600);const d=c.duration;
   number(c.checkpoint,r+'.checkpoint',0,d);number(c.predictionTime,r+'.predictionTime',0,d);
   if(c.predictionTime<=c.checkpoint)fail(r+'.predictionTime','示範答案須在預判時間之後');
   if(c.previewTime!==undefined)number(c.previewTime,r+'.previewTime',0,d);
   if(c.direction!==undefined&&!['attack','defend'].includes(c.direction))fail(r+'.direction','只能是 attack 或 defend');
   if(c.defaultRole!==undefined&&!ROLES.includes(c.defaultRole))fail(r+'.defaultRole','未知球員位置');
   if(c.supportRoles!==undefined&&(!Array.isArray(c.supportRoles)||c.supportRoles.length!==3||new Set(c.supportRoles).size!==3||c.supportRoles.some(x=>!ROLES.includes(x))))fail(r+'.supportRoles','須為三個不同的己方位置');
   if(c.ticks!==undefined&&(!Array.isArray(c.ticks)||c.ticks.length!==4||c.ticks.some(x=>typeof x!=='string'||!x.trim())))fail(r+'.ticks','須有四個時間軸標籤');
   if(!Array.isArray(c.phases)||!c.phases.length)fail(r+'.phases','至少一個階段');
   else c.phases.forEach((v,i)=>{const z=`${r}.phases[${i}]`;if(!object(v,z))return;fields(v,z,['start','end','title','body','cue']);text(v.title,z+'.title');text(v.cue,z+'.cue');if(v.body!==undefined)text(v.body,z+'.body');number(v.start,z+'.start',0,d);number(v.end,z+'.end',0,d);if(v.end<=v.start||v.start!==(i?c.phases[i-1]?.end:0)||(i===c.phases.length-1&&v.end!==d))fail(z,'階段須連續涵蓋整段影片，不可重疊或留空');});
   if(object(c.roles,r+'.roles')){fields(c.roles,r+'.roles',ROLES);for(const id of ROLES){const role=c.roles[id],z=r+'.roles.'+id;if(!object(role,z))continue;fields(role,z,['name','job','watch','risk','prediction','why','points','tasks','practiceIntro']);for(const f of ['name','job','watch','risk','prediction','why'])text(role[f],z+'.'+f);if(role.practiceIntro!==undefined)text(role.practiceIntro,z+'.practiceIntro');paths(role.points,z+'.points',d);if(!Array.isArray(role.tasks)||role.tasks.length!==c.phases?.length||role.tasks.some(x=>typeof x!=='string'||!x.trim()))fail(z+'.tasks','每個階段須有對應的球員工作文字');}}
   if(object(c.opponents,r+'.opponents')){fields(c.opponents,r+'.opponents',OPPONENTS);for(const id of OPPONENTS)paths(c.opponents[id],r+'.opponents.'+id,d);}
   if(object(c.source,r+'.source')){fields(c.source,r+'.source',['label','url','kind','fileName']);text(c.source.label,r+'.source.label');if(c.source.url!==undefined){try{if(!['http:','https:'].includes(new URL(c.source.url).protocol))throw Error();}catch{fail(r+'.source.url','來源連結須為 HTTP／HTTPS');}}for(const k of ['kind','fileName'])if(c.source[k]!==undefined)text(c.source[k],r+'.source.'+k);}
   if(!Array.isArray(c.takeaways)||c.takeaways.length!==3)fail(r+'.takeaways','須有三個重點');else c.takeaways.forEach((v,i)=>{const z=`${r}.takeaways[${i}]`;if(object(v,z)){fields(v,z,['title','body']);text(v.title,z+'.title');text(v.body,z+'.body');}});
   if(!Array.isArray(c.puckSegments)||!c.puckSegments.length)fail(r+'.puckSegments','須明確設定冰球路線');
   else c.puckSegments.forEach((v,i)=>{const z=`${r}.puckSegments[${i}]`;if(!object(v,z))return;fields(v,z,['kind','start','end','role','fromRole','toRole','point','fromPoint']);number(v.start,z+'.start',0,d);number(v.end,z+'.end',0,d);if(v.end<=v.start||v.start!==(i?c.puckSegments[i-1]?.end:0)||(i===c.puckSegments.length-1&&v.end!==d))fail(z,'冰球路線須連續涵蓋整段時間');const role=(id,key)=>{if(![...ROLES,...OPPONENTS].includes(id))fail(z+'.'+key,'未知球員位置');};if(v.kind==='follow'){role(v.role,'role');if(v.fromRole!==undefined||v.toRole!==undefined||v.point!==undefined||v.fromPoint!==undefined)fail(z,'follow 只能設定 role');}else if(v.kind==='hold'){point(v.point,z+'.point');if(v.role!==undefined||v.fromRole!==undefined||v.toRole!==undefined||v.fromPoint!==undefined)fail(z,'hold 只能設定 point');}else if(v.kind==='pass'){role(v.toRole,'toRole');if((v.fromRole===undefined)===(v.fromPoint===undefined))fail(z,'pass 須擇一設定 fromRole 或 fromPoint');if(v.fromRole!==undefined)role(v.fromRole,'fromRole');if(v.fromPoint!==undefined)point(v.fromPoint,z+'.fromPoint');if(v.role!==undefined||v.point!==undefined)fail(z,'pass 不使用 role／point');}else fail(z+'.kind','只支援 hold、follow、pass');});
  });
 });
 return errors;
}
export function assertValidCourses(courses){const errors=validateCourses(courses);if(errors.length)throw new Error('課程資料檢查失敗：\n'+errors.join('\n'));return courses;}
