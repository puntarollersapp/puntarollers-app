export const ROLLERWEEN = {
  id: 'rollerween-2026',
  name: 'ROLLERWEEN',
  label: 'SEASON 2026',
  startsAt: '2026-10-01T00:00:00-03:00',
  endsAt: '2026-10-31T23:59:59-03:00',
  noticeVersion: '2026-10-01-v2-rsvp',
  timeTrial: {
    slug: 'rollerween-toma-4-2026-10-07',
    dateLabel: 'MIÉRCOLES 07 OCT',
    timeLabel: '19:30',
    title: 'Toma de tiempo #04',
    detail: 'Entrenamiento indispensable. Es la cuarta toma previa a Shifter y, por calendario, puede ser la penúltima medición antes de la carrera.',
    place: 'Pista de Ciclismo Punta del Este · frente al Centro de Convenciones',
    startsAt: '2026-10-07T19:30:00-03:00',
    bannerEndsAt: '2026-10-07T23:59:59-03:00',
  },
  roll: {
    slug: 'rollerween-rolleada-2026-10-09',
    dateLabel: 'VIERNES 09 OCT',
    timeLabel: '20:00',
    title: 'Rolleada · 19 km',
    detail: 'Última actividad larga previa a Shifter. El foco es llegar con buenas sensaciones y sin sumar riesgos innecesarios.',
    place: 'Parque La Loma',
    startsAt: '2026-10-09T20:00:00-03:00',
  },
  weeklyChallengeKm: 200,
  weeklyBombonsKm: 350,
}

export function isRollerweenActive(now = new Date()) {
  const stamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return Number.isFinite(stamp) &&
    stamp >= new Date(ROLLERWEEN.startsAt).getTime() &&
    stamp <= new Date(ROLLERWEEN.endsAt).getTime()
}

export function isTimeTrialBannerActive(now = new Date()) {
  const stamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return isRollerweenActive(now) && stamp <= new Date(ROLLERWEEN.timeTrial.bannerEndsAt).getTime()
}

export function rollerweenNoticeKey(profileId) {
  return `pr-rollerween-notice:${ROLLERWEEN.noticeVersion}:${profileId || 'guest'}`
}
