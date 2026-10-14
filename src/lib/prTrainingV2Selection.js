/**
 * PR Training 2.0 — deterministic, pure monthly selection.
 * No database writes, no client-side trust for eligibility.
 * Backend MUST lock (cycle_id, profile_id), validate status, and persist all six
 * within a single transaction before revealing them in PR SPIN.
 */
export const LEVELS = ['B1', 'B2', 'B3']
const monthSeed = (profileId, month) => {
  const input = String(profileId) + ':' + String(month)
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619)
  return hash >>> 0
}
function rankHash(seed, code) {
  let hash = seed
  for (let i = 0; i < code.length; i++) hash = Math.imul(hash ^ code.charCodeAt(i), 16777619)
  return hash >>> 0
}
/**
 * @param {object} options
 * @param {Array} options.catalog active duty records, with validated video readiness
 * @param {string} options.level B1/B2/B3 (B4 is not defined yet)
 * @param {string} options.profileId
 * @param {string} options.month YYYY-MM
 * @param {string[]} options.recentCodes codes assigned in recent cycles
 * @param {string[]} options.excludedCodes individual safety/technique exclusions
 * @param {string[]} options.enabledCodes optional explicit whitelist of technique-sensitive duties
 * @returns {{ok: boolean, duties: Array, reason?: string}}
 */
export function selectSixDuties({ catalog=[], level, profileId, month, recentCodes=[], excludedCodes=[], enabledCodes=[] }) {
  if (!LEVELS.includes(level)) return { ok:false, duties:[], reason:'LEVEL_NOT_CONFIGURED' }
  if (!profileId || !/^\d{4}-\d{2}$/.test(month || '')) return { ok:false, duties:[], reason:'INVALID_CONTEXT' }
  const allowed = new Set(LEVELS.slice(0, LEVELS.indexOf(level)+1))
  const recent = new Set(recentCodes)
  const excluded = new Set(excludedCodes)
  const enabled = new Set(enabledCodes)
  const seed = monthSeed(profileId, month)
  const compatible = catalog.filter(d => {
    if (!d || !d.active || !allowed.has(d.level_code) || excluded.has(d.duty_code)) return false
    const demos = d.metadata?.demo_ids || []
    if (demos.length && d.demo_ready !== true) return false
    if (d.requires_explicit_enable && !enabled.has(d.duty_code)) return false
    return true
  })
  const unique = [...new Map(compatible.map(d=>[d.duty_code,d])).values()]
  if (unique.length < 6) return { ok:false, duties:[], reason:'INSUFFICIENT_SAFE_POOL' }
  const ordered = unique.sort((a,b) => {
    const recentA=recent.has(a.duty_code)?1:0, recentB=recent.has(b.duty_code)?1:0
    if (recentA!==recentB) return recentA-recentB
    const currentA=a.level_code===level?0:1, currentB=b.level_code===level?0:1
    if (currentA!==currentB) return currentA-currentB
    return rankHash(seed,a.duty_code)-rankHash(seed,b.duty_code)
  })
  return {ok:true,duties:ordered.slice(0,6)}
}
