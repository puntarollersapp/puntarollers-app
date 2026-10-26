// Presentation-only transition: do not disable data pipelines, Strava or public services.
export const TRANSITION_ENABLED = true
export const TRANSITION_END = Date.parse('2026-11-01T15:00:00-03:00')
export function isTransitionStudent(user) {
  // Only full admins and the specifically designated treasury operator have
  // privileged access. Never infer a bypass from a student-facing UI setting.
  return TRANSITION_ENABLED && Date.now() < TRANSITION_END && Boolean(user?.id) &&
    user.role !== 'admin' && user.esTesoreria !== true
}
export function isTransitionPrivatePath(path) {
  return /^\/(app|admin)(\/|$)/.test(path) || path === '/tesoreria'
}
