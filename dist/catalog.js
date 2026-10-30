export function coursePage(courses,{category='全部',query='',page=0,pageSize=6}={}){
 const term=query.trim().toLocaleLowerCase();
 const matches=courses.filter(c=>(category==='全部'||c.category===category)&&[c.number,c.title,c.focus,c.category,...c.cases.map(x=>x.label)].join(' ').toLocaleLowerCase().includes(term));
 const size=Math.max(1,Math.floor(pageSize)||6),pages=Math.max(1,Math.ceil(matches.length/size)),index=Math.max(0,Math.min(Math.floor(page)||0,pages-1));
 return {items:matches.slice(index*size,(index+1)*size),count:matches.length,pages,index};
}
