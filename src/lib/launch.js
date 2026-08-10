export const PR_LAUNCH = {
  releaseId: 'pr-launch-20260810-final-onboarding-v2',
  opensAt: '2026-08-10T18:00:00-03:00',
  newUserSince: '2026-08-10T00:00:00-03:00',
  timezoneLabel: 'Uruguay',
  bypassRoles: ['admin'],
  bypassDocuments: ['99000001'],
}

export function launchTimestamp() {
  return new Date(PR_LAUNCH.opensAt).getTime()
}

function normalizedDocument(value) {
  return String(value || '').replace(/\D/g, '')
}

export function hasLaunchBypass(user) {
  if (PR_LAUNCH.bypassRoles.includes(user?.role)) return true

  const document = normalizedDocument(
    user?.documento || user?.document || user?.cedula
  )

  return Boolean(document) && PR_LAUNCH.bypassDocuments.includes(document)
}
