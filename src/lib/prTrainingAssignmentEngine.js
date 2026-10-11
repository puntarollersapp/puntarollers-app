// PR Training 2.0 — pure assignment engine (Beta)
// No Supabase writes. PR SPIN only reveals the persisted output of this engine.

const PROGRESSION = ['B1','B2','B3','B4']
const DEFAULT_TARGET_COUNT = 6
// Temporary pedagogical exception approved for the initial catalog.
// Remove/raise this override when more B1 duties are added; no UI rewrite is needed.
const TARGET_COUNT_BY_PROGRESSION = { B1: 4 }

function hash32(value='') {
  let h=2166136261
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0
}
function seededOrder(seed,stableCode){return hash32(`${seed}|${stableCode}`)}
function allowedProgressions(current){const i=PROGRESSION.indexOf(current);return i<0?[]:PROGRESSION.slice(0,i+1)}

function requirementMet(duty,ctx){
  const rules=duty.eligibilityRules||{}
  const learned=new Set(ctx.learnedTechniques||[])
  const enabled=new Set(ctx.enabledTechniques||[])
  if(duty.requiresDemo&&duty.demoAvailable===false)return false
  if(rules.requiresPrepared10k&&!ctx.prepared10k)return false
  if(rules.requiresBraking&&!ctx.brakingEnabled)return false
  if(rules.requiresLearnedTechnique&&!learned.has(rules.requiresLearnedTechnique))return false
  if(rules.requiresEnabledTechnique&&!enabled.has(rules.requiresEnabledTechnique))return false
  if(Array.isArray(rules.requiresAnyLearned)&&!rules.requiresAnyLearned.some(x=>learned.has(x)))return false
  return true
}
function varietyPenalty(duty,selected){
  const category=duty.category||duty.evidenceType||'other'
  const technique=duty.technique||duty.stableCode
  return selected.filter(x=>(x.category||x.evidenceType||'other')===category).length*20+
    selected.filter(x=>(x.technique||x.stableCode)===technique).length*40
}

/**
 * Normal target is 6. Temporary B1 target is 4 while its catalog contains four approved duties.
 * PR SPIN still runs identically and reveals targetCount items one by one.
 * B4-13 / Series 4x500m occupies ONE assignment; 1/4..4/4 is result subprogress.
 */
export function selectMonthlyDuties({
  cycleKey,profileId,progression,catalog,recentDutyCodes=[],
  learnedTechniques=[],enabledTechniques=[],prepared10k=false,
  brakingEnabled=false,rulesVersion='v1'
}){
  const targetCount=TARGET_COUNT_BY_PROGRESSION[progression]||DEFAULT_TARGET_COUNT
  const allowed=new Set(allowedProgressions(progression))
  const recent=new Set(recentDutyCodes)
  const context={learnedTechniques,enabledTechniques,prepared10k,brakingEnabled}
  const eligibleRaw=(catalog||[]).filter(d=>d.active!==false&&allowed.has(d.progression)&&requirementMet(d,context))
  // Stable duty identity is the assignment unit. Catalog versioning may contain more than
  // one row for the same stable code; only the highest eligible version can participate.
  const latestByStableCode=new Map()
  for(const d of eligibleRaw){
    const current=latestByStableCode.get(d.stableCode)
    if(!current||Number(d.version||1)>Number(current.version||1))latestByStableCode.set(d.stableCode,d)
  }
  const eligible=[...latestByStableCode.values()]

  if(eligible.length<targetCount){
    return {ok:false,incident:{
      code:'INSUFFICIENT_SAFE_DUTIES',eligibleCount:eligible.length,
      requiredCount:targetCount,progression,cycleKey
    }}
  }

  const seed=`${cycleKey}|${profileId}|${rulesVersion}`
  const selected=[]
  while(selected.length<targetCount){
    const candidates=eligible.filter(d=>!selected.some(s=>s.stableCode===d.stableCode))
    candidates.sort((a,b)=>{
      const scoreA=(recent.has(a.stableCode)?100:0)+varietyPenalty(a,selected)
      const scoreB=(recent.has(b.stableCode)?100:0)+varietyPenalty(b,selected)
      if(scoreA!==scoreB)return scoreA-scoreB
      return seededOrder(seed,a.stableCode)-seededOrder(seed,b.stableCode)
    })
    selected.push(candidates[0])
  }

  return {ok:true,duties:selected.map((d,index)=>({...d,position:index+1})),rulesSnapshot:{
    rulesVersion,progression,targetCount,recentDutyCodes:[...recent],selectionSeed:seed,
    temporaryOverrides:progression==='B1'?{assignmentCount:4,reason:'initial_b1_catalog'}:{},
    invariants:{persistedBeforeSpin:true,spinMayNotRerandomize:true,series4x500OccupiesOneDuty:true}
  }}
}
