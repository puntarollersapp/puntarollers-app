export const PR_NEXT_LAUNCH_ISO='2026-11-01T18:00:00.000Z'

const PROD_HOSTS=new Set([
  'puntarollers.com',
  'www.puntarollers.com',
  'puntarollers-app.vercel.app',
])

export function isPRNextPreview(){
  if(import.meta.env.VITE_PR_NEXT_FORCE_OFF==='true')return false
  if(typeof window==='undefined')return false
  if(PROD_HOSTS.has(window.location.hostname))return false
  return import.meta.env.VITE_PR_NEXT_PREVIEW==='true'
}

export function isPRNextActive(){
  if(import.meta.env.VITE_PR_NEXT_FORCE_OFF==='true')return false
  if(isPRNextPreview())return true
  return false // Production remains off until explicit launch authorization
}

export function getPRNextState(){
  const preview=isPRNextPreview()
  const active=isPRNextActive()
  return {active,preview,launchAt:PR_NEXT_LAUNCH_ISO}
}
