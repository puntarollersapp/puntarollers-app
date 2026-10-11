import { describe, expect, it } from 'vitest'
import { selectMonthlyDuties } from './prTrainingAssignmentEngine'

const duty=(code,progression,extra={})=>({
  stableCode:code, progression, active:true, evidenceType:'video', demoAvailable:true, ...extra
})
const base={cycleKey:'2026-11',profileId:'beta-test',recentDutyCodes:[],learnedTechniques:[],enabledTechniques:[]}

describe('PR Training 2.0 assignment engine',()=>{
  it('B1 temporarily assigns exactly four and never fills with B2',()=>{
    const catalog=[
      duty('B1-01','B1'),duty('B1-02','B1'),duty('B1-03','B1'),duty('B1-04','B1'),
      duty('B2-01','B2'),duty('B2-02','B2'),duty('B2-03','B2')
    ]
    const r=selectMonthlyDuties({...base,progression:'B1',catalog})
    expect(r.ok).toBe(true)
    expect(r.duties).toHaveLength(4)
    expect(r.duties.every(x=>x.progression==='B1')).toBe(true)
    expect(r.rulesSnapshot.targetCount).toBe(4)
  })

  it('normal progression assigns exactly six',()=>{
    const catalog=Array.from({length:7},(_,i)=>duty(`B3-0${i+1}`,'B3'))
    const r=selectMonthlyDuties({...base,progression:'B3',catalog})
    expect(r.ok).toBe(true)
    expect(r.duties).toHaveLength(6)
  })

  it('returns an incident instead of unsafe fallback when safe pool is too small',()=>{
    const catalog=Array.from({length:5},(_,i)=>duty(`B3-0${i+1}`,'B3'))
    const r=selectMonthlyDuties({...base,progression:'B3',catalog})
    expect(r.ok).toBe(false)
    expect(r.incident.code).toBe('INSUFFICIENT_SAFE_DUTIES')
    expect(r.incident.requiredCount).toBe(6)
  })

  it('is deterministic for the same cycle/profile/rules',()=>{
    const catalog=Array.from({length:8},(_,i)=>duty(`B4-${String(i+1).padStart(2,'0')}`,'B4'))
    const a=selectMonthlyDuties({...base,progression:'B4',catalog})
    const b=selectMonthlyDuties({...base,progression:'B4',catalog})
    expect(a.duties.map(x=>x.stableCode)).toEqual(b.duties.map(x=>x.stableCode))
  })

  it('keeps B4-13 4x500 as one assignment slot',()=>{
    const catalog=[
      duty('B4-09','B4',{evidenceType:'strava'}),duty('B4-10','B4',{evidenceType:'strava'}),
      duty('B4-11','B4',{evidenceType:'strava'}),duty('B4-13','B4',{evidenceType:'strava',subrequirements:4}),
      duty('B4-15','B4'),duty('B4-16','B4')
    ]
    const r=selectMonthlyDuties({...base,progression:'B4',catalog})
    expect(r.ok).toBe(true)
    expect(r.duties).toHaveLength(6)
    expect(r.duties.filter(x=>x.stableCode==='B4-13')).toHaveLength(1)
  })
})
