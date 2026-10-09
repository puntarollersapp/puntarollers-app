import test from 'node:test'
import assert from 'node:assert/strict'
import {isSaturday,nextSaturdayDate,normalizeSkills,validateClassDraft,sortClassPosts,filterClassPosts,serializeLocalClassDraft,parseLocalClassDraft} from '../src/lib/prKidsClassPosts.js'

test('Saturday date rules',()=>{
 assert.equal(isSaturday('2026-10-10'),true)
 assert.equal(isSaturday('2026-10-09'),false)
 assert.equal(isSaturday('2026-02-30'),false)
 assert.equal(nextSaturdayDate(new Date(2026,9,9,12)),'2026-10-10')
})
test('Skills and draft validation',()=>{
 assert.deepEqual(normalizeSkills([' Giros ','giros','Frenadas']),['Giros','Frenadas'])
 assert.deepEqual(validateClassDraft({date:'2026-10-10',title:'Equilibrio',summary:'Trabajamos equilibrio y giros',skills:[]}),[])
 assert.ok(validateClassDraft({date:'2026-10-09',title:'X',summary:'Breve'}).length>0)
})
test('History ordering and filtering',()=>{
 const posts=[{date:'2026-09-26',title:'Giros',skills:['Coordinación']},{date:'2026-10-10',title:'Frenadas',skills:['Equilibrio']}]
 assert.equal(sortClassPosts(posts)[0].title,'Frenadas')
 assert.equal(filterClassPosts(posts,{query:'equilibrio'}).length,1)
 assert.equal(filterClassPosts(posts,{date:'2026-09-26'})[0].title,'Giros')
})
test('Local text draft serialization',()=>{
 const draft={date:'2026-10-10',title:'Frenadas',summary:'Practicamos frenadas en equipo',teacherNote:'Muy bien',skills:['Giros']}
 assert.deepEqual(parseLocalClassDraft(serializeLocalClassDraft(draft)),draft)
 assert.equal(parseLocalClassDraft('invalid'),null)
})
