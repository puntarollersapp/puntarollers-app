import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

function TasksIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5 8.5 18.5 19 8a2.1 2.1 0 0 0-3-3L5.5 15.5 4 19.5Z"/><path d="m13.8 7.2 3 3"/><path d="M4 21h16"/></svg>
}

function RollerFeedIcon() {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 14.8h9.7a4 4 0 0 0 4-4V8.5"/><path d="m7 12 3.3-3.3 2.5 2.5 4.6-4.6"/><path d="M4.5 14.8h-1.5"/><circle cx="7" cy="18.5" r="1.55"/><circle cx="13.5" cy="18.5" r="1.55"/></svg>
}

export default function Header({ title, showBack = false, onBack }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [family, setFamily] = useState(null)
  useEffect(() => { if (!user?.id) { setFamily(null); return } let live=true; supabase.functions.invoke('pr-kids-family-access',{body:{action:'family-home'}}).then(({data,error})=>{if(live)setFamily(!error&&data?.ok&&Array.isArray(data.children)&&data.children.length?data:null)}).catch(()=>{if(live)setFamily(null)}); return ()=>{live=false} }, [user?.id])
  const initials = user?.nombre?.split(' ').filter(Boolean).map((name) => name[0]).join('').slice(0, 2) || 'PR'

  async function handleLogout() {
    if (!window.confirm('¿Querés cerrar sesión?')) return
    await logout?.()
    navigate('/', { replace: true })
  }

  return <header className="sticky top-0 z-50 border-b border-white/[0.055] bg-[#08080c]/92 backdrop-blur-2xl" style={{paddingTop:"max(14px, env(safe-area-inset-top, 0px))"}}>
    {family && <Link to="/kids" aria-label="Abrir acceso familiar PR Kids" className="group mx-3 mt-2 flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] border border-[#b8f4e1]/25 bg-[linear-gradient(100deg,rgba(72,166,154,.18),rgba(123,115,202,.12))] px-3 text-[#d3f9ee] shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition hover:border-[#b8f4e1]/50 hover:bg-teal-400/15 active:scale-[.99]"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 20v-2a5 5 0 0 1 10 0v2M13 20v-2a5 5 0 0 1 8-3.8V20"/></svg><span className="text-[10px] font-extrabold uppercase tracking-[.14em]">Mis hijos</span><span className="text-[10px] text-[#d3f9ee]/65">· PR Kids</span><span className="inline-block animate-pulse text-[15px] font-bold text-[#d3f9ee] transition-transform duration-300 group-hover:translate-x-1">→</span></Link>}
    <div className="relative flex h-[70px] items-center justify-between px-[18px]">
      {showBack ? <button type="button" onClick={onBack} aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] active:scale-95"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white/55" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button> : <Link to="/" className="relative grid h-11 w-11 place-items-center active:scale-95" aria-label="Ir a la página pública de Punta Rollers"><img src="/logo.png" alt="Punta Rollers" className="h-7 w-7 object-contain"/></Link>}

      <Link to="/app/dashboard" aria-label="Ir al inicio" title="Inicio" aria-current={pathname==='/app/dashboard'?'page':undefined} className={`absolute left-[58px] top-1/2 grid h-[43px] w-[43px] -translate-y-1/2 place-items-center rounded-[14px] border shadow-[0_4px_15px_rgba(0,0,0,.2)] transition active:scale-95 max-[359px]:left-[51px] ${pathname==='/app/dashboard'?'border-[#FF0055]/60 bg-[#FF0055]/20 text-white':'border-white/15 bg-white/[.07] text-white'}`}>
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h5v-6h4v6h5v-9.5"/></svg>
      </Link>

      <Link to="/app/tareas" aria-label="Abrir Tareas" style={{backgroundColor:"#BEFF37",color:"#08080c",borderColor:"#BEFF37"}} className="pr-tasks-tab absolute left-1/2 top-1/2 flex h-[44px] min-w-[124px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-[17px] border border-[#BEFF37] bg-[#BEFF37] px-3.5 text-[#08080c] shadow-[0_0_0_3px_rgba(187,255,31,.055),0_8px_28px_rgba(255,0,85,.18)] transition-all active:scale-95"><span className="pr-tasks-hero-icon relative"><TasksIcon/><span className="pr-tasks-spark absolute -right-2 -top-2 text-[9px]">✦</span></span><span className="font-display text-[17px] font-extrabold tracking-[-.035em]">Tareas</span></Link>

      <div className="flex items-center gap-2">
        <button type="button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] text-white/45 transition active:scale-95 active:bg-red-500/10 active:text-red-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></svg>
        </button>
        <Link to="/app/perfil" aria-label="Abrir perfil" className={`grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] border active:scale-95 border-pr-lime/25 bg-pr-lime/10`}>
          {user?.foto ? <img src={user.foto} alt={user.nombre || 'Perfil'} className="h-full w-full object-cover"/> : <span className={`font-display text-[13px] font-bold text-pr-lime`}>{initials}</span>}
        </Link>
      </div>
    </div>
    {title && <div className="pointer-events-none border-t border-white/[0.035] px-4 py-1.5 text-center text-[9px] font-black uppercase tracking-[.18em] text-white/24">{title}</div>}
  </header>
}
