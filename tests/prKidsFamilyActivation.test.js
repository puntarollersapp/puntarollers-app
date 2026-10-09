import test from 'node:test'
import assert from 'node:assert/strict'
import {assessFamilyActivation,sanitizeFamilyHome} from '../src/lib/prKidsFamilyActivation.js'
const request={estado:'pendiente'},guardian={id:'g',documento:'12345678',nombre:'Responsable'},children=[{id:'c',treasury_profile_id:'p'}],links=[{guardian_id:'g',child_id:'c',approved_at:'2026-10-09'}],review={identity_verified:true,relationship_verified:true,enrollment_verified:true,privacy_acknowledged:true}
test('approved family readiness requires every verification',()=>{
 assert.deepEqual(assessFamilyActivation({request,guardian,children,links,review}),{ready:true,blockers:[]})
})
test('cannot activate without a verified treasury link and child relationship',()=>{
 const result=assessFamilyActivation({request,guardian,children:[{id:'c'}],links:[],review})
 assert.equal(result.ready,false)
 assert.match(result.blockers.join(' '),/Tesorería/)
 assert.match(result.blockers.join(' '),/vínculo/)
})
test('no family activation with incomplete consent checks',()=>{
 assert.equal(assessFamilyActivation({request,guardian,children,links,review:{...review,privacy_acknowledged:false}}).ready,false)
})
test('public family payload omits financial and personal sensitive fields',()=>{
 assert.deepEqual(sanitizeFamilyHome({guardian:{nombre:'Responsable',documento:'12345678'},children:[{id:'c',nombre_confirmado:'Niño',approved:true,treasury_profile_id:'secret',medical_note:'secret'},{id:'x',approved:false}]}),{guardian:{nombre:'Responsable'},children:[{id:'c',nombre:'Niño'}]})
})
