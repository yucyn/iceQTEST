import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('dist'),imports={},visited=new Set();
function visit(name){if(visited.has(name))return;visited.add(name);let code=fs.readFileSync(path.join(root,name),'utf8');code=code.replace(/(from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g,(_,prefix,rel)=>{const dep=path.posix.normalize(path.posix.join(path.posix.dirname(name),rel));visit(dep);return prefix+JSON.stringify('courtiq/'+dep);});if(name==='app.js')code+="\nselectLesson('net-reverse-attack','low-cycle');\n";imports['courtiq/'+name]='data:text/javascript;base64,'+Buffer.from(code).toString('base64');}
visit('app.js');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,name)=>'<style>'+fs.readFileSync(path.join(root,name),'utf8')+'</style>');
html=html.replace(/<script type="module" src="app.js"><\/script>/,'<script type="importmap">'+JSON.stringify({imports})+'</script><script type="module">import "courtiq/app.js";</script>');
if(!html.includes('type="importmap"'))throw Error('No entry module replaced');
html=html.replace('<title>CourtIQ Ice｜跑位學習室</title>','<title>備課預覽｜CourtIQ 原版課程介面</title>').replace('<body>','<body><div style="padding:12px 20px;background:#e3eee4;color:#20554e;font:14px system-ui">備課待確認：第08課 · 使用與正式學習室相同的介面及程式，尚未發布正式課程。此離線檔不含教材室；修改請回到對話。</div>');
html=html.replace('<a class="text-button" href="author.html">教材製作室</a>','');
fs.writeFileSync('dist/prep-net-reverse-full.html',html);
// Every dependency resolves within the import map; this file requires no server.
for(const value of Object.values(imports)){const code=Buffer.from(value.split(',')[1],'base64').toString();for(const m of code.matchAll(/from\s*["'](courtiq\/[^"']+)["']/g))if(!imports[m[1]])throw Error('Unresolved '+m[1]);}
console.log('Full UI preview bundled:',visited.size,'modules;',Buffer.byteLength(html),'bytes');
