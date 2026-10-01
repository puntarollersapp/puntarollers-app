export const ROLLERWEEN = {
  id: 'rollerween-2026',
  name: 'ROLLERWEEN',
  label: 'SEASON 2026',
  startsAt: '2026-10-01T00:00:00-03:00',
  endsAt: '2026-10-31T23:59:59-03:00',
  noticeVersion: '2026-10-01-v2-rsvp',
  challenge: {
    firstStart: '2026-10-01',
    firstEnd: '2026-10-07',
  },
  clinic: {
    title: 'Clínica Internacional · Miguel Flores',
    dateLabel: '28 · 29 · 30 OCTUBRE',
    detail: 'Tres jornadas de entrenamiento con Miguel Flores, Subcampeón Mundial Máster. Cupos limitados.',
    href: '/clinica-miguel-octubre',
  },
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
  return Number.isFinite(stamp) && stamp >= new Date(ROLLERWEEN.startsAt).getTime() && stamp <= new Date(ROLLERWEEN.endsAt).getTime()
}

export function isTimeTrialBannerActive(now = new Date()) {
  const stamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return isRollerweenActive(now) && stamp <= new Date(ROLLERWEEN.timeTrial.bannerEndsAt).getTime()
}

export function rollerweenChallengeRange(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]))
  const today=`${parts.year}-${parts.month}-${parts.day}`
  if(today<=ROLLERWEEN.challenge.firstEnd)return{start:ROLLERWEEN.challenge.firstStart,end:ROLLERWEEN.challenge.firstEnd,label:'01 OCT → 07 OCT'}
  const anchor=new Date(`${ROLLERWEEN.challenge.firstStart}T12:00:00Z`),current=new Date(`${today}T12:00:00Z`),days=Math.floor((current-anchor)/86400000),cycle=Math.max(1,Math.floor(days/7)),start=new Date(anchor);start.setUTCDate(anchor.getUTCDate()+cycle*7);const end=new Date(start);end.setUTCDate(start.getUTCDate()+6);const iso=d=>d.toISOString().slice(0,10);return{start:iso(start),end:iso(end),label:`${String(start.getUTCDate()).padStart(2,'0')} OCT → ${String(end.getUTCDate()).padStart(2,'0')} OCT`}
}

export function rollerweenNoticeKey(profileId) { return `pr-rollerween-notice:${ROLLERWEEN.noticeVersion}:${profileId || 'guest'}` }
