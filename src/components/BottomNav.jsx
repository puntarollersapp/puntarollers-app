import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function NavIcon({ type, active = false }) {
  const stroke = active ? 'currentColor' : 'currentColor'
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  if (type === 'home') return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h5v-6h4v6h5v-9.5"/></svg>
  if (type === 'profile') return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>

  // Comunidad = personas. No ruedas, no métricas.
  if (type === 'community') return <svg {...common}>
    <circle cx="9" cy="8" r="3.1"/><circle cx="17.2" cy="9.2" r="2.35"/>
    <path d="M2.8 20c.7-4.1 3-6.2 6.2-6.2s5.5 2.1 6.2 6.2"/>
    <path d="M14.4 14.8c3.7-.8 6.1 1 6.8 4.7"/>
  </svg>

  // Actividad = rendimiento personal. Gráfica + ruta.
  if (type === 'activity') return <svg {...common}>
    <path d="M4 18V8"/><path d="M9 18v-5"/><path d="M14 18V5"/><path d="M19 18v-8"/>
    <path d="m4 8 5 5 5-8 5 5"/>
  </svg>

  // RollerFeed = patín + movimiento.
  if (type === 'rollerfeed') return <svg {...common}>
    <path d="M4.5 14.8h9.7a4 4 0 0 0 4-4V8.5"/>
    <path d="m7 12 3.3-3.3 2.5 2.5 4.6-4.6"/>
    <path d="M4.5 14.8h-1.5"/>
    <circle cx="7" cy="18.5" r="1.55"/><circle cx="13.5" cy="18.5" r="1.55"/>
  </svg>

  if (type === 'music') return <svg {...common}><path d="M9 18V6l10-2v12"/><path d="M9 10l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>

  // Insignias: medalla sólida y visible incluso inactiva.
  if (type === 'badges') return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.4 2.5h7.2l1.6 5-5.2 3.2-5.2-3.2 1.6-5Z" fill="currentColor" opacity={active ? 0.95 : 0.42}/>
      <circle cx="12" cy="13.2" r="5.1" fill="none" stroke="currentColor" strokeWidth="1.9"/>
      <path d="m12 9.7 1.05 2.12 2.34.34-1.7 1.65.4 2.33L12 15.05l-2.09 1.1.4-2.33-1.7-1.65 2.34-.34L12 9.7Z" fill="currentColor"/>
      <path d="m9.15 17.2-.85 4.3L12 19.4l3.7 2.1-.85-4.3" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )

  return <svg {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M4 12h2M18 12h2M12 4v2M12 18v2"/></svg>
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    let alive = true

    async function refreshRequests() {
      if (!user?.id) return
      const { data } = await supabase.rpc('community_get_dashboard')
      if (!alive) return
      setRequestCount(Array.isArray(data?.incoming_requests) ? data.incoming_requests.length : 0)
    }

    refreshRequests()
    const timer = window.setInterval(refreshRequests, 60000)
    window.addEventListener('focus', refreshRequests)
    return () => {
      alive = false
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshRequests)
    }
  }, [user?.id])

  const isStaff = user?.role === 'admin' || user?.role === 'profesor'

  const nav = [
    { path: '/app/dashboard', label: 'Inicio', icon: 'home' },
    { path: '/app/perfil', label: 'Perfil', icon: 'profile' },
    { path: '/app/comunidad', label: 'Comunidad', icon: 'community', tone: 'cyan', badge: requestCount },
    { path: '/app/entrenamiento', label: 'Actividad', icon: 'activity', tone: 'red' },
    { path: '/app/actividad', label: 'RollerFeed', icon: 'rollerfeed', featured: true },
    { path: '/app/musica', label: 'PR Music', icon: 'music', tone: 'violet' },
    { path: '/app/insignias', label: 'Insignias', icon: 'badges', tone: 'gold' },
  ]

  if (isStaff) nav.push({ path: '/admin', label: 'Admin', icon: 'admin' })

  function toneClass(item, active) {
    if (item.tone === 'cyan') return active ? 'text-cyan-300' : 'text-cyan-200/45'
    if (item.tone === 'red') return active ? 'text-red-400' : 'text-red-300/46'
    if (item.tone === 'violet') return active ? 'text-violet-300' : 'text-violet-200/43'
    if (item.tone === 'gold') return active ? 'text-pr-gold' : 'text-pr-gold/52'
    return active ? 'text-pr-gold' : 'text-white/30'
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 border-t border-white/[0.07] bg-[#08080c]/96 shadow-[0_-14px_40px_rgba(0,0,0,.38)] backdrop-blur-2xl"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className={`grid items-end px-1 pb-1 pt-2 ${isStaff ? 'grid-cols-8' : 'grid-cols-7'}`}>
        {nav.map((item) => {
          const active = pathname === item.path || (item.path === '/admin' && pathname.startsWith('/admin'))

          if (item.featured) {
            return (
              <Link key={item.path} to={item.path} className="relative flex min-w-0 flex-col items-center justify-end active:scale-95">
                <span className={`absolute -top-[29px] grid h-[62px] w-[62px] place-items-center rounded-[22px] border ${
                  active
                    ? 'border-orange-200/70 bg-gradient-to-br from-[#ffd45e] via-[#ff9f43] to-[#ff641f] text-black shadow-[0_0_0_5px_rgba(255,134,40,.09),0_10px_34px_rgba(255,101,31,.42)]'
                    : 'border-orange-300/30 bg-gradient-to-br from-[#ff8a2a] via-[#f36a22] to-[#d94b17] text-white shadow-[0_0_0_5px_rgba(255,110,30,.06),0_10px_30px_rgba(255,93,24,.25)]'
                }`}>
                  <NavIcon type="rollerfeed" active={active}/>
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-orange-300/30 bg-[#101016] text-[10px]">⚡</span>
                </span>
                <span className={`mt-[35px] truncate text-[7.5px] font-extrabold ${active ? 'text-orange-300' : 'text-white/52'}`}>RollerFeed</span>
                {active && <span className="mt-1 h-[2px] w-5 rounded-full bg-orange-300 shadow-[0_0_10px_rgba(251,146,60,.95)]"/>}
              </Link>
            )
          }

          return (
            <Link key={item.path} to={item.path}
              className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 transition-all active:scale-95 ${toneClass(item, active)}`}>
              {active && <span className="absolute -top-2 h-[2px] w-7 rounded-full bg-current opacity-90 shadow-[0_0_10px_currentColor]"/>}
              <span className={active ? 'drop-shadow-[0_0_7px_currentColor]' : ''}><NavIcon type={item.icon} active={active}/></span>

              {item.badge > 0 && (
                <span className="absolute right-[8%] top-0 grid h-4 min-w-4 place-items-center rounded-full border border-[#08080c] bg-cyan-400 px-1 text-[7px] font-black text-black">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}

              <span className="max-w-full truncate text-[6.5px] font-semibold tracking-[-.03em] sm:text-[8px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
