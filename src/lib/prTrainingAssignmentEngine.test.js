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


test('mandatory demo unavailable is excluded from assignment',()=>{
  const catalog=[
    duty('B2-01','B2',{requiresDemo:true,demoAvailable:false}),
    ...Array.from({length:6},(_,i)=>duty(`B2-${String(i+2).padStart(2,'0')}`,'B2',{requiresDemo:true}))
  ]
  const r=selectMonthlyDuties({...base,progression:'B2',catalog})
  assert.equal(r.ok,true)
  assert.equal(r.duties.some(x=>x.stableCode==='B2-01'),false)
})

test('missing learned technique never gets forced to fill the six',()=>{
  const catalog=[
    ...Array.from({length:5},(_,i)=>duty(`B3-${String(i+1).padStart(2,'0')}`,'B3')),
    duty('B3-06','B3',{eligibilityRules:{requiresLearnedTechnique:'curvas'}})
  ]
  const r=selectMonthlyDuties({...base,progression:'B3',catalog})
  assert.equal(r.ok,false)
  assert.equal(r.incident.eligibleCount,5)
})

test('learned technique unlocks an otherwise gated duty',()=>{
  const catalog=[
    ...Array.from({length:5},(_,i)=>duty(`B3-${String(i+1).padStart(2,'0')}`,'B3')),
    duty('B3-06','B3',{eligibilityRules:{requiresLearnedTechnique:'curvas'}})
  ]
  const r=selectMonthlyDuties({...base,progression:'B3',catalog,learnedTechniques:['curvas']})
  assert.equal(r.ok,true)
  assert.equal(r.duties.some(x=>x.stableCode==='B3-06'),true)
})

test('recent duties are avoided when six non-recent safe duties exist',()=>{
  const catalog=Array.from({length:8},(_,i)=>duty(`B3-${String(i+1).padStart(2,'0')}`,'B3'))
  const r=selectMonthlyDuties({...base,progression:'B3',catalog,recentDutyCodes:['B3-01','B3-02']})
  assert.equal(r.ok,true)
  assert.equal(r.duties.some(x=>['B3-01','B3-02'].includes(x.stableCode)),false)
})

test('B1 historical snapshot keeps temporary target at four',()=>{
  const catalog=Array.from({length:6},(_,i)=>duty(`B1-${String(i+1).padStart(2,'0')}`,'B1'))
  const r=selectMonthlyDuties({...base,progression:'B1',catalog})
  assert.equal(r.ok,true)
  assert.equal(r.rulesSnapshot.targetCount,4)
  assert.equal(r.rulesSnapshot.temporaryOverrides.reason,'initial_b1_catalog')
})

test('assignment output has unique stable duty codes',()=>{
  const catalog=[
    duty('B3-01','B3'),duty('B3-01','B3'),
    ...Array.from({length:5},(_,i)=>duty(`B3-${String(i+2).padStart(2,'0')}`,'B3'))
  ]
  const r=selectMonthlyDuties({...base,progression:'B3',catalog})
  assert.equal(r.ok,true)
  assert.equal(new Set(r.duties.map(x=>x.stableCode)).size,6)
})


test('newest eligible version wins for the same stable duty code',()=>{
  const catalog=[duty('B3-01','B3',{version:1}),duty('B3-01','B3',{version:2}),...Array.from({length:5},(_,i)=>duty(`B3-${String(i+2).padStart(2,'0')}`,'B3'))]
  const r=selectMonthlyDuties({...base,progression:'B3',catalog})
  assert.equal(r.ok,true)
  const picked=r.duties.find(x=>x.stableCode==='B3-01')
  assert.equal(picked.version,2)
})
