// Presentation-only transition. Public pages, databases and integrations stay unchanged.
export const TRANSITION_ENABLED = true
export const TRANSITION_END = Date.parse('2026-11-01T15:00:00-03:00')
const STAFF_PROFILE_IDS = new Set(['admin-claudio', 'alumno-48812609'])
export function isTransitionStudent(user) {
  return TRANSITION_ENABLED && Date.now() < TRANSITION_END && Boolean(user?.id) &&
    !STAFF_PROFILE_IDS.has(String(user.id))
}
export function isTransitionPrivatePath(path) {
  return /^\/(app|admin)(\/|$)/.test(path) || path === '/tesoreria'
}
export function transitionDestination(user, requested) {
  return isTransitionStudent(user) ? '/app/shifter' : requested
}
