// PR Training 2.0 — pure assignment engine (Beta)
// No Supabase writes. PR SPIN must only reveal the persisted output of this engine.

const PROGRESSION = ['B1','B2','B3','B4']

function hash32(value='') {
  let h = 2166136261
  for (let i=0;i<value.length;i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h,16777619)
  }
  return h >>> 0
}

function seededOrder(seed, stableCode) {
  return hash32(`${seed}|${stableCode}`)
}

function allowedProgressions(current) {
  const i = PROGRESSION.indexOf(current)
  return i < 0 ? [] : PROGRESSION.slice(0,i+1)
}

function requirementMet(duty, ctx) {
  const rules = duty.eligibilityRules || {}
  const learned = new Set(ctx.learnedTechniques || [])
  const enabled = new Set(ctx.enabledTechniques || [])

  if (duty.requiresDemo && duty.demoAvailable === false) return false
  if (rules.requiresPrepared10k && !ctx.prepared10k) return false
  if (rules.requiresBraking && !ctx.brakingEnabled) return false
  if (rules.requiresLearnedTechnique && !learned.has(rules.requiresLearnedTechnique)) return false
  if (rules.requiresEnabledTechnique && !enabled.has(rules.requiresEnabledTechnique)) return false
  if (Array.isArray(rules.requiresAnyLearned) && !rules.requiresAnyLearned.some(x=>learned.has(x))) return false
  return true
}

function varietyPenalty(duty, selected) {
  let penalty = 0
  const category = duty.category || duty.evidenceType || 'other'
  const technique = duty.technique || duty.stableCode
  penalty += selected.filter(x=>(x.category||x.evidenceType||'other')===category).length * 20
  penalty += selected.filter(x=>(x.technique||x.stableCode)===technique).length * 40
  return penalty
}

/**
 * Returns {ok:true,duties:[6],rulesSnapshot} or {ok:false,incident}.
 * recentDutyCodes affects preference, never historical eligibility.
 * B4-13 / Series 4x500m is one duty. Its 1/4..4/4 lives in result subprogress.
 */
export function selectMonthlyDuties({
  cycleKey,
  profileId,
  progression,
  catalog,
  recentDutyCodes=[],
  learnedTechniques=[],
  enabledTechniques=[],
  prepared10k=false,
  brakingEnabled=false,
  rulesVersion='v1'
}) {
  const allowed = new Set(allowedProgressions(progression))
  const recent = new Set(recentDutyCodes)
  const context = {learnedTechniques,enabledTechniques,prepared10k,brakingEnabled}

  const eligible = (catalog||[]).filter(d =>
    d.active !== false &&
    allowed.has(d.progression) &&
    requirementMet(d,context)
  )

  if (eligible.length < 6) {
    return {
      ok:false,
      incident:{
        code:'INSUFFICIENT_SAFE_DUTIES',
        eligibleCount:eligible.length,
        requiredCount:6,
        progression,
        cycleKey
      }
    }
  }

  const seed = `${cycleKey}|${profileId}|${rulesVersion}`
  const selected = []

  while (selected.length < 6) {
    const candidates = eligible.filter(d=>!selected.some(s=>s.stableCode===d.stableCode))
    candidates.sort((a,b)=>{
      const recentA = recent.has(a.stableCode) ? 100 : 0
      const recentB = recent.has(b.stableCode) ? 100 : 0
      const scoreA = recentA + varietyPenalty(a,selected)
      const scoreB = recentB + varietyPenalty(b,selected)
      if (scoreA !== scoreB) return scoreA-scoreB
      return seededOrder(seed,a.stableCode)-seededOrder(seed,b.stableCode)
    })
    selected.push(candidates[0])
  }

  return {
    ok:true,
    duties:selected.map((d,index)=>({...d,position:index+1})),
    rulesSnapshot:{
      rulesVersion,
      progression,
      recentDutyCodes:[...recent],
      selectionSeed:seed,
      invariants:{
        exactDutyCount:6,
        persistedBeforeSpin:true,
        spinMayNotRerandomize:true,
        series4x500OccupiesOneDuty:true
      }
    }
  }
}
