// Local import/export tools, also usable before a CMS exists. Does not publish.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {readContent} from './build-content.mjs';
import {assertValidCourses} from './content-contract.mjs';
const [command,file,destination]=process.argv.slice(2);
if(!file||!['export','check','import'].includes(command)||(command==='import'&&!destination))throw new Error('用法：node scripts/content-package.mjs export <新檔案> | check <資料包> | import <資料包> <新資料夾>');
if(command==='export'){
 const bundle={format:'courtiq-course-package',schemaVersion:1,exportedAt:new Date().toISOString(),courses:await readContent()};
 await writeFile(resolve(file),JSON.stringify(bundle,null,2)+'\n',{flag:'wx'});console.log('已匯出課程資料；不包含影片或學習紀錄。');
}else{
 const bundle=JSON.parse(await readFile(resolve(file),'utf8'));
 if(bundle.format!=='courtiq-course-package'||bundle.schemaVersion!==1||Object.keys(bundle).some(k=>!['format','schemaVersion','exportedAt','courses'].includes(k)))throw new Error('不支援的資料包格式');
 assertValidCourses(bundle.courses);
 if(command==='import'){
  // A new directory is required. Review its diff before replacing real content.
  const directory=resolve(destination);await mkdir(directory);await mkdir(join(directory,'courses'));
  for(const course of bundle.courses)await writeFile(join(directory,'courses',course.id+'.json'),JSON.stringify(course,null,2)+'\n');
  await writeFile(join(directory,'catalog.json'),JSON.stringify({schemaVersion:1,courses:bundle.courses.map(c=>'courses/'+c.id+'.json')},null,2)+'\n');
  console.log('已匯入新資料夾供檢查，未覆寫正式內容，也未發布。');
 }else console.log('PASS: 資料包格式與所有課程檢查通過');
}
