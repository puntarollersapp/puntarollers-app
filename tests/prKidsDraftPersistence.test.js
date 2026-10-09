import test from 'node:test'
import assert from 'node:assert/strict'
import {serializeLocalClassDraft,parseLocalClassDraft} from '../src/lib/prKidsClassPosts.js'
test('incomplete drafts cannot be serialized',()=>{
 assert.equal(serializeLocalClassDraft({date:'2026-10-10',title:'X',summary:'Breve'}),null)
})
test('valid Saturday draft can be restored',()=>{
 const value=serializeLocalClassDraft({date:'2026-10-10',title:'Practicamos frenadas',summary:'Trabajamos frenadas y giros',teacherNote:'Bien',skills:[]})
 assert.equal(parseLocalClassDraft(value)?.date,'2026-10-10')
})

test('incomplete saved content cannot be restored',()=>{
 const incomplete=JSON.stringify({version:1,date:'2026-10-10',title:'X',summary:'Breve',skills:[]})
 assert.equal(parseLocalClassDraft(incomplete),null)
})
