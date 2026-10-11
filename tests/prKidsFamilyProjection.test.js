import test from 'node:test'
import assert from 'node:assert/strict'
import {projectFamilyHome} from '../src/lib/prKidsFamilyProjection.js'
const id='12345678-1234-1234-1234-123456789abc'
test('family projection drops private fields and drafts',()=>{
 const result=projectFamilyHome({ok:true,guardian:{nombre:'Madre',documento:'123'},children:[{id,nombre:'Niña',medical_note:'secret',class_posts:[{status:'published',class_date:'2026-10-10',title:'Frenadas',summary:'Practicamos las frenadas',private_note:'NO MOSTRAR',photos:[{url:'private'}]},{status:'draft',class_date:'2026-10-10'}]}]})
 assert.equal(result.guardian.documento,undefined)
 assert.equal(result.children[0].medical_note,undefined)
 assert.equal(result.children[0].class_posts.length,1)
})
test('duplicate and invalid child IDs are ignored',()=>{
 const result=projectFamilyHome({ok:true,guardian:{nombre:'Padre'},children:[{id},{id},{id:'invalid'}]})
 assert.equal(result.children.length,1)
})

test('published posts exclude private metadata and photographs',()=>{
 const result=projectFamilyHome({ok:true,guardian:{nombre:'Tutor'},children:[{id,class_posts:[{id:'p1',status:'published',class_date:'2026-10-10',title:'Giros',summary:'Practicamos giros en grupo',medical_note:'private',photos:[{url:'private'}],teacher_note:'Bien'}]}]})
 const post=result.children[0].class_posts[0]
 assert.equal(post.medical_note,undefined)
 assert.deepEqual(post.photos,[])
 assert.equal(post.title,'Giros')
})
