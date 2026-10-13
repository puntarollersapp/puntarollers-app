import test from 'node:test'
import assert from 'node:assert/strict'
import {reconcileKidsCheckIns} from '../src/lib/prKidsPRCheckBridge.js'
const links=[{child_id:'kid-a',profile_id:'student-a',verified:true}]
test('only confirmed mapped check-ins count once',()=>{
 const result=reconcileKidsCheckIns({childProfiles:links,scans:[
 {id:1,profile_id:'student-a',scanned_at:'2026-10-17T22:00:00Z',confirmed:true},
 {id:1,profile_id:'student-a',scanned_at:'2026-10-17T22:00:00Z',confirmed:true},
 {id:2,profile_id:'student-a',scanned_at:'2026-10-17T22:01:00Z',confirmed:false},
 {id:3,profile_id:'other',scanned_at:'2026-10-17T22:02:00Z',confirmed:true}
 ]})
 assert.equal(result.eligible.length,1)
 assert.equal(result.eligible[0].source_event_id,'pr_check:1')
 assert.deepEqual(result.skipped,{unverified:1,unmapped:1,duplicate:1,invalid:0})
})
test('unverified or ambiguous child mapping never produces a stamp',()=>{
 assert.equal(reconcileKidsCheckIns({scans:[{id:1,profile_id:'x',scanned_at:'2026-10-17',confirmed:true}],childProfiles:[{child_id:'a',profile_id:'x',verified:true},{child_id:'b',profile_id:'x',verified:true}]}).eligible.length,0)
 assert.equal(reconcileKidsCheckIns({scans:[{id:1,profile_id:'x',scanned_at:'2026-10-17',confirmed:true}],childProfiles:[{child_id:'a',profile_id:'x',verified:false}]}).eligible.length,0)
})
