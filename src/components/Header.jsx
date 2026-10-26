import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { isRollerweenActive } from '../lib/rollerween'

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
  const feedActive = pathname === '/app/actividad'
  const rollerween = isRollerweenActive()
  const initials = user?.nombre?.split(' ').filter(Boolean).map((name) => name[0]).join('').slice(0, 2) || 'PR'

  async function handleLogout() {
    if (!window.confirm('¿Querés cerrar sesión?')) return
    await logout?.()
    navigate('/', { replace: true })
  }

  return <header className="sticky top-0 z-50 border-b border-white/[0.055] bg-[#08080c]/92 pt-[env(safe-area-inset-top,0px)] backdrop-blur-2xl">
    <div className="relative flex h-[70px] items-center justify-between px-[18px]">
      {showBack ? <button type="button" onClick={onBack} aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] active:scale-95"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white/55" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button> : <Link to="/" className="relative grid h-10 w-10 place-items-center active:scale-95" aria-label="Ir a la página pública de Punta Rollers"><img src="/logo.png" alt="Punta Rollers" className="h-9 w-9 object-contain"/>{rollerween&&<span className="absolute -bottom-1 -right-2 rounded-full border border-pr-lime/25 bg-pr-surface px-1.5 py-0.5 font-mono text-[5px] font-black tracking-[.12em] text-pr-lime">RW26</span>}</Link>}

      <Link to="/app/deberes" aria-label="Abrir Tareas" className="pr-tasks-tab absolute left-1/2 top-1/2 flex h-[44px] min-w-[124px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-[17px] border border-pr-lime/40 bg-pr-lime px-3.5 text-pr-black shadow-[0_0_0_3px_rgba(187,255,31,.055),0_8px_28px_rgba(255,0,85,.18)] transition-all active:scale-95"><span className="pr-tasks-hero-icon relative"><TasksIcon/><span className="pr-tasks-spark absolute -right-2 -top-2 text-[9px]">✦</span></span><span className="font-display text-[17px] font-extrabold tracking-[-.035em]">Tareas</span></Link>

      <div className="flex items-center gap-2">
        <button type="button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] text-white/45 transition active:scale-95 active:bg-red-500/10 active:text-red-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></svg>
        </button>
        <Link to="/app/perfil" aria-label="Abrir perfil" className={`grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] border active:scale-95 ${rollerween?'border-violet-300/25 bg-violet-400/10':'border-pr-lime/25 bg-pr-lime/10'}`}>
          {user?.foto ? <img src={user.foto} alt={user.nombre || 'Perfil'} className="h-full w-full object-cover"/> : <span className={`font-display text-[13px] font-bold ${rollerween?'text-violet-200':'text-pr-lime'}`}>{initials}</span>}
        </Link>
      </div>
    </div>
    {rollerween&&<div className="border-t border-violet-300/[.06] bg-violet-500/[.035] px-4 py-1 text-center font-mono text-[6px] font-black uppercase tracking-[.22em] text-violet-200/38">ROLLER SEASON NAVIDEÑA // DESDE 01 NOVIEMBRE</div>}
    {title && <div className="pointer-events-none border-t border-white/[0.035] px-4 py-1.5 text-center text-[9px] font-black uppercase tracking-[.18em] text-white/24">{title}</div>}
  </header>
}
