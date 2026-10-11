import test from 'node:test'
import assert from 'node:assert/strict'
import { selectMonthlyDuties } from './prTrainingAssignmentEngine.js'

const duty=(code,progression,extra={})=>({stableCode:code,progression,active:true,evidenceType:'video',demoAvailable:true,...extra})
const base={cycleKey:'2026-11',profileId:'beta-test',recentDutyCodes:[],learnedTechniques:[],enabledTechniques:[]}

test('B1 temporarily assigns exactly four and never fills with B2',()=>{
  const catalog=[duty('B1-01','B1'),duty('B1-02','B1'),duty('B1-03','B1'),duty('B1-04','B1'),duty('B2-01','B2'),duty('B2-02','B2')]
  const r=selectMonthlyDuties({...base,progression:'B1',catalog})
  assert.equal(r.ok,true); assert.equal(r.duties.length,4)
  assert.equal(r.duties.every(x=>x.progression==='B1'),true)
  assert.equal(r.rulesSnapshot.targetCount,4)
})

test('normal progression assigns exactly six',()=>{
  const catalog=Array.from({length:7},(_,i)=>duty(`B3-0${i+1}`,'B3'))
  const r=selectMonthlyDuties({...base,progression:'B3',catalog})
  assert.equal(r.ok,true); assert.equal(r.duties.length,6)
})

test('too-small safe pool returns incident instead of unsafe fallback',()=>{
  const catalog=Array.from({length:5},(_,i)=>duty(`B3-0${i+1}`,'B3'))
  const r=selectMonthlyDuties({...base,progression:'B3',catalog})
  assert.equal(r.ok,false); assert.equal(r.incident.code,'INSUFFICIENT_SAFE_DUTIES'); assert.equal(r.incident.requiredCount,6)
})

test('same cycle/profile/rules produces same persisted selection order',()=>{
  const catalog=Array.from({length:8},(_,i)=>duty(`B4-${String(i+1).padStart(2,'0')}`,'B4'))
  const a=selectMonthlyDuties({...base,progression:'B4',catalog})
  const b=selectMonthlyDuties({...base,progression:'B4',catalog})
  assert.deepEqual(a.duties.map(x=>x.stableCode),b.duties.map(x=>x.stableCode))
})

test('B4-13 4x500 occupies one of the six assignment slots',()=>{
  const catalog=[duty('B4-09','B4',{evidenceType:'strava'}),duty('B4-10','B4',{evidenceType:'strava'}),duty('B4-11','B4',{evidenceType:'strava'}),duty('B4-13','B4',{evidenceType:'strava',subrequirements:4}),duty('B4-15','B4'),duty('B4-16','B4')]
  const r=selectMonthlyDuties({...base,progression:'B4',catalog})
  assert.equal(r.ok,true); assert.equal(r.duties.length,6)
  assert.equal(r.duties.filter(x=>x.stableCode==='B4-13').length,1)
})
