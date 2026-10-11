import test from 'node:test'
import assert from 'node:assert/strict'
import {createPrivateClassDraft} from '../src/server/prKidsPrivateDrafts.js'
test('private storage rejects anonymous callers',async()=>{
 const result=await createPrivateClassDraft({input:{}})
 assert.equal(result.ok,false)
 assert.equal(result.error,'Acceso no autorizado')
})
test('private storage rejects invalid content before database access',async()=>{
 const result=await createPrivateClassDraft({db:{},authorized:true,author:{id:'staff'},input:{title:'X'}})
 assert.equal(result.ok,false)
 assert.equal(result.error,'Publicación inválida')
})
