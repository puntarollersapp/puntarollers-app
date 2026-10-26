// Temporary, private-area-only transition. Never apply this to public routes.
export const TRANSITION_ENABLED = true
export const TRANSITION_END = Date.parse('2026-11-01T15:00:00-03:00')
export function isTransitionStudent(user) {
  return TRANSITION_ENABLED && Date.now() < TRANSITION_END && Boolean(user?.id) &&
    user.role !== 'admin' && user.esTesoreria !== true
}
export function isTransitionPrivatePath(path) {
  return /^\/(app|admin)(\/|$)/.test(path) || path === '/tesoreria'
}
