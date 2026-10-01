import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { isRollerweenActive } from '../lib/rollerween'

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

  return <header className="sticky top-0 z-50 border-b border-white/[0.055] bg-[#08080c]/92 backdrop-blur-2xl">
    <div className="relative flex h-[70px] items-center justify-between px-[18px]">
      {showBack ? <button type="button" onClick={onBack} aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] active:scale-95"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white/55" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button> : <Link to="/" className="relative grid h-10 w-10 place-items-center active:scale-95" aria-label="Ir a la página pública de Punta Rollers"><img src="/logo.png" alt="Punta Rollers" className="h-9 w-9 object-contain"/>{rollerween&&<span className="absolute -bottom-1 -right-2 rounded-full border border-[#BEFF37]/25 bg-[#0b0810] px-1.5 py-0.5 font-mono text-[5px] font-black tracking-[.12em] text-[#BEFF37]">RW26</span>}</Link>}

      <Link to="/app/actividad" aria-label="Abrir RollerFeed" className={`absolute left-1/2 top-1/2 flex h-[58px] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-[22px] border px-4 transition-all active:scale-95 ${rollerween ? feedActive ? 'border-[#BEFF37]/45 bg-gradient-to-br from-[#BEFF37] via-[#b75bff] to-[#5b1c91] text-black shadow-[0_0_0_5px_rgba(183,91,255,.08),0_10px_32px_rgba(126,42,193,.34)]' : 'border-violet-300/30 bg-gradient-to-br from-[#7a2cc2] via-[#9f43e8] to-[#4b176f] text-white shadow-[0_8px_28px_rgba(126,42,193,.28)]' : feedActive ? 'border-orange-200/70 bg-gradient-to-br from-[#ffd45e] via-[#ff9f43] to-[#ff641f] text-black shadow-[0_0_0_5px_rgba(255,134,40,.08),0_10px_32px_rgba(255,101,31,.35)]' : 'border-orange-300/30 bg-gradient-to-br from-[#ff8a2a] via-[#f36a22] to-[#d94b17] text-white shadow-[0_8px_28px_rgba(255,93,24,.22)]'}`}>
        <span className="relative"><RollerFeedIcon/><span className="absolute -right-2 -top-2 text-[9px]">{rollerween?'✦':'⚡'}</span></span>
        <span className="text-[11px] font-black tracking-[-.02em]">RollerFeed</span>
      </Link>

      <div className="flex items-center gap-2">
        <button type="button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] text-white/45 transition active:scale-95 active:bg-red-500/10 active:text-red-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></svg>
        </button>
        <Link to="/app/perfil" aria-label="Abrir perfil" className={`grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] border active:scale-95 ${rollerween?'border-violet-300/25 bg-violet-400/10':'border-pr-gold/20 bg-pr-gold/10'}`}>
          {user?.foto ? <img src={user.foto} alt={user.nombre || 'Perfil'} className="h-full w-full object-cover"/> : <span className={`font-display text-[13px] font-bold ${rollerween?'text-violet-200':'text-pr-gold'}`}>{initials}</span>}
        </Link>
      </div>
    </div>
    {rollerween&&<div className="border-t border-violet-300/[.06] bg-violet-500/[.035] px-4 py-1 text-center font-mono text-[6px] font-black uppercase tracking-[.22em] text-violet-200/38">ROLLERWEEN // SEASON 2026 · OCT 01—31</div>}
    {title && <div className="pointer-events-none border-t border-white/[0.035] px-4 py-1.5 text-center text-[9px] font-black uppercase tracking-[.18em] text-white/24">{title}</div>}
  </header>
}
