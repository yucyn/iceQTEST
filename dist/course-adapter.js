// Compatibility boundary: content IDs stay stable while the UI keeps its API.
export function adaptCourses(records){
 return records.map(({schemaVersion,scenarios,...course})=>({...course,cases:scenarios.map(({id,label,revision,content})=>({id,label,lesson:{...structuredClone(content),id:course.id,caseId:id,number:course.number,version:revision}}))}));
}
