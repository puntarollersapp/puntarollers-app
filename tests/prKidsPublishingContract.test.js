import test from 'node:test'
import assert from 'node:assert/strict'
import {postInsertFromValidated,audienceInsertRows,publishTransition,archiveTransition,classPostAudit} from '../src/lib/prKidsPublishingContract.js'
test('draft needs validation and author',()=>{
 assert.equal(postInsertFromValidated({valid:false}, {id:'a',displayName:'Profesor'}),null)
 assert.equal(postInsertFromValidated({valid:true,post:{title:'Clase'}},null),null)
})
test('draft starts unpublished',()=>{
 const row=postInsertFromValidated({valid:true,post:{title:'Clase'}},{id:'staff',displayName:'Profesor'})
 assert.equal(row.status,'draft')
 assert.equal(row.published_at,null)
})
test('audience deduplicates children',()=>{
 assert.equal(audienceInsertRows('post',['child','child']).length,1)
})
test('transitions require review',()=>{
 assert.equal(publishTransition({post:{status:'draft'},ready:{ready:false},now:'today'}),null)
 assert.equal(archiveTransition({status:'draft'}),null)
 assert.equal(publishTransition({post:{status:'draft'},ready:{ready:true},now:'today'}).status,'published')
})
test('audit rejects unsupported actions',()=>{
 assert.equal(classPostAudit({postId:'p',actorId:'a',action:'delete'}),null)
})
