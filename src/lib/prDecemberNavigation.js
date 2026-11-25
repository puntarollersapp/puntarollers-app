import { useEffect, useState } from 'react'

// Seasonal navigation window in Uruguay local time. No change before December 1.
export const DECEMBER_NAV_START = Date.parse('2026-12-01T00:00:00-03:00')
export const DECEMBER_NAV_END = Date.parse('2027-01-01T00:00:00-03:00')
export function isDecemberNavigation(now=Date.now()) {
  return now >= DECEMBER_NAV_START && now < DECEMBER_NAV_END
}
export function useDecemberNavigation() {
  const [active,setActive]=useState(()=>isDecemberNavigation())
  useEffect(()=>{
    const refresh=()=>setActive(isDecemberNavigation())
    const timer=window.setInterval(refresh,15000)
    window.addEventListener('focus',refresh)
    document.addEventListener('visibilitychange',refresh)
    return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}
  },[])
  return active
}
