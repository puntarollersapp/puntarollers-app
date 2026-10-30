// Presentation-only transition. Public pages, databases and integrations stay unchanged.
// Manual launch switch: keep false until Claudio explicitly authorizes the public release.
export const PR_PUBLIC_LAUNCH_ENABLED = false
export const TRANSITION_ENABLED = true
export const TRANSITION_END = Date.parse('2026-11-01T15:00:00-03:00')
const NEW_ACCOUNT_CUTOFF = Date.parse('2026-10-27T00:00:00-03:00')
const STAFF_PROFILE_IDS = new Set(['admin-claudio', 'alumno-48812609'])

function isNewAccountDuringTesting(user) {
  // Only trustworthy persisted creation timestamps qualify. Missing/invalid dates
  // remain on the existing student flow instead of silently bypassing the gate.
  const created = Date.parse(user?.createdAt || '')
  return Number.isFinite(created) && created >= NEW_ACCOUNT_CUTOFF && created < TRANSITION_END
}

export function isTransitionStudent(user) {
  return TRANSITION_ENABLED && !PR_PUBLIC_LAUNCH_ENABLED && Boolean(user?.id) && user?.role !== 'familiar' &&
    !STAFF_PROFILE_IDS.has(String(user.id)) 
}
export function isTransitionPrivatePath(path) {
  return path.startsWith('/app/') || path.startsWith('/admin/') || path === '/tesoreria'
}
export function transitionDestination(user, requested) {
  return user?.role === 'familiar' ? '/kids' : isTransitionStudent(user) ? '/app/shifter' : requested
}
