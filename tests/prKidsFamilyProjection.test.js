import test from 'node:test'
import assert from 'node:assert/strict'
import {projectFamilyHome} from '../src/lib/prKidsFamilyProjection.js'
const id='12345678-1234-1234-1234-123456789abc'
test('family projection drops private fields and drafts',()=>{
 const result=projectFamilyHome({ok:true,guardian:{nombre:'Madre',documento:'123'},children:[{id,nombre:'Niña',medical_note:'secret',class_posts:[{status:'published'},{status:'draft'}]}]})
 assert.equal(result.guardian.documento,undefined)
 assert.equal(result.children[0].medical_note,undefined)
 assert.equal(result.children[0].class_posts.length,1)
})
test('duplicate and invalid child IDs are ignored',()=>{
 const result=projectFamilyHome({ok:true,guardian:{nombre:'Padre'},children:[{id},{id},{id:'invalid'}]})
 assert.equal(result.children.length,1)
})
