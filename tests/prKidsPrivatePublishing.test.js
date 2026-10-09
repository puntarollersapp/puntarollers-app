import test from 'node:test'
import assert from 'node:assert/strict'
import {validatePrivatePost,canPublishPrivatePost} from '../src/lib/prKidsPrivatePublishing.js'
test('publication requires a Saturday and recipients',()=>{
 assert.equal(validatePrivatePost({class_date:'2026-10-09',title:'Frenadas',summary:'Trabajamos frenadas y giros',audience_child_ids:[]}).valid,false)
})
test('photo without consent blocks publishing',()=>{
 assert.equal(canPublishPrivatePost({post:{status:'draft',class_date:'2026-10-10'},audience:[{approved_child:true}],media:[{content_type:'image/jpeg',consent_confirmed:false}]}).ready,false)
})
test('approved recipients and media pass readiness',()=>{
 assert.equal(canPublishPrivatePost({post:{status:'draft',class_date:'2026-10-10'},audience:[{approved_child:true}],media:[{content_type:'image/png',consent_confirmed:true}]}).ready,true)
})
