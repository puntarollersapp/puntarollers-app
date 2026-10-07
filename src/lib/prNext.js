export const PR_NEXT_LAUNCH_ISO='2026-11-01T18:00:00.000Z'

const PROD_HOSTS=new Set([
  'puntarollers.com',
  'www.puntarollers.com',
  'puntarollers-app.vercel.app',
])

export function isPRNextPreview(){
  if(import.meta.env.VITE_PR_NEXT_FORCE_OFF==='true')return false
  if(import.meta.env.VITE_PR_NEXT_PREVIEW==='true')return true
  if(typeof window==='undefined')return false
  return !PROD_HOSTS.has(window.location.hostname)
}

export function isPRNextActive(now=new Date()){
  if(import.meta.env.VITE_PR_NEXT_FORCE_OFF==='true')return false
  if(isPRNextPreview())return true
  return now.getTime()>=new Date(PR_NEXT_LAUNCH_ISO).getTime()
}

export function getPRNextState(now=new Date()){
  const preview=isPRNextPreview()
  const active=isPRNextActive(now)
  return {active,preview,launchAt:PR_NEXT_LAUNCH_ISO}
}
