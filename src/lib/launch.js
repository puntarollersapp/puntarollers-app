export const PR_LAUNCH = {
  releaseId: 'pr-launch-20260810',
  opensAt: '2026-08-10T18:00:00-03:00',
  newUserSince: '2026-08-10T00:00:00-03:00',
  timezoneLabel: 'Uruguay',
  bypassRoles: ['admin'],
}

export function launchTimestamp() {
  return new Date(PR_LAUNCH.opensAt).getTime()
}
