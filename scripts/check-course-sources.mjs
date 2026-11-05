import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/catalog.json')));
const register=JSON.parse(fs.readFileSync(path.join(root,'docs/course-source-register.json')));
if(register.schemaVersion!==1||!Array.isArray(register.courses))throw Error('來源紀錄格式錯誤');
const ids=new Set(),hashes=new Map();
for(const entry of register.courses){
 if(ids.has(entry.courseId))throw Error('來源紀錄重複課程ID：'+entry.courseId);ids.add(entry.courseId);
 if(!catalog.courses.includes(`courses/${entry.courseId}.json`))throw Error('來源紀錄含未知課程：'+entry.courseId);
 const c=JSON.parse(fs.readFileSync(path.join(root,`content/courses/${entry.courseId}.json`)));
 if(entry.title!==c.title||entry.number!==c.number||JSON.stringify(entry.scenarios)!==JSON.stringify(c.scenarios.map(s=>({id:s.id,label:s.label}))))throw Error('來源紀錄與課程不一致：'+entry.courseId);
 if(!entry.sources?.length||!entry.duplicateReview)throw Error('缺少來源備註：'+entry.courseId);
 for(const s of c.scenarios)if(!entry.sources.some(x=>JSON.stringify(x,Object.keys(x).sort())===JSON.stringify(s.content.source,Object.keys(s.content.source).sort())))throw Error('來源標示不一致：'+entry.courseId);
 if(entry.sha256!==null){if(!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('無效指紋');if(hashes.has(entry.sha256))throw Error('相同影片指紋已用於：'+hashes.get(entry.sha256)+' / '+entry.courseId);hashes.set(entry.sha256,entry.courseId);}
}
if(ids.size!==catalog.courses.length)throw Error('有課程未留檔');
console.log(`PASS: ${ids.size}堂課來源與情境均已留檔；${hashes.size}份原檔指紋。`);
if(process.argv[2]){
 const hash=crypto.createHash('sha256').update(fs.readFileSync(process.argv[2])).digest('hex');
 const match=hashes.get(hash);
 if(match){console.error('重複影片，已用於課程：'+match);process.exitCode=2;}
 else console.log('未匹配相同檔案；仍須核對來源與動作，排除重新錄製或剪輯版本。SHA256='+hash);
}
