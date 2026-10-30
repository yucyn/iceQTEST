import {CONTENT} from './content/published.js';
import {adaptCourses} from './course-adapter.js';
export const COURSES=adaptCourses(CONTENT);
export let LESSON=COURSES[0].cases[0].lesson;
export function activateLesson(courseId,caseId){const c=COURSES.find(c=>c.id===courseId)||COURSES[0];LESSON=(c.cases.find(x=>x.id===caseId)||c.cases[0]).lesson;return LESSON;}
export function storageKey(lesson=LESSON){return lesson.id==='neutral-faceoff-regroup'?'courtiq-ice-learning:neutral-faceoff:v1':`courtiq-ice-learning:${lesson.id}:${lesson.caseId}:v1`;}
