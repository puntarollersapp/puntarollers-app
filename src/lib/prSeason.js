export const CHRISTMAS_SEASON_START_ISO='2026-12-01T03:00:00.000Z'

export function isChristmasSeasonActive(now=new Date()){
  if(import.meta.env.VITE_PR_CHRISTMAS_FORCE_OFF==='true')return false
  if(import.meta.env.VITE_PR_CHRISTMAS_PREVIEW==='true')return true
  return now.getTime()>=new Date(CHRISTMAS_SEASON_START_ISO).getTime()
}

export const PR_SEASON_ASSETS={
  christmasLoading:'/pr-next/christmas-loading.png',
  profileBadge:'/pr-next/profile-badge.png',
  verifiedBadge:'/pr-next/verified-badge.png',
  awardsLogo:'/pr-next/pr-awards-2026.png',
  qrIdLogo:'/pr-next/qr-id.png',
}
