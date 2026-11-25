import { useEffect, useState } from 'react'

// Seasonal navigation window in Uruguay local time. No change before December 1.
export const DECEMBER_NAV_START = Date.parse('2026-12-01T00:00:00-03:00')
export const DECEMBER_NAV_END = Date.parse('2027-01-01T00:00:00-03:00')
export function isDecemberNavigation(now=Date.now()) {
  return now >= DECEMBER_NAV_START && now < DECEMBER_NAV_END
}
export function isSantaAudience(user){return Boolean(user?.id&&['alumno','admin','profesor'].includes(user.role)&&!(user.role==='alumno'&&/^\d{4}-\d{2}-\d{2}$/.test(user.fechaNacimiento||'')&&user.fechaNacimiento>'2008-12-01'))}
export function useDecemberNavigation(adminPreview=false) {
  const [active,setActive]=useState(()=>isDecemberNavigation()||(adminPreview&&Date.now()<DECEMBER_NAV_START))
  useEffect(()=>{
    const refresh=()=>setActive(isDecemberNavigation()||(adminPreview&&Date.now()<DECEMBER_NAV_START))
    refresh();const timer=window.setInterval(refresh,15000)
    window.addEventListener('focus',refresh)
    document.addEventListener('visibilitychange',refresh)
    return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}
  },[adminPreview])
  return active
}
