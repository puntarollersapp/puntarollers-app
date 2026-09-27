import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function NavIcon({ type }) {
  const common = { width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'home') return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h5v-6h4v6h5v-9.5"/></svg>
  if (type === 'profile') return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>
  if (type === 'performance') return <svg {...common}><path d="M4 18V8"/><path d="M9 18v-5"/><path d="M14 18V5"/><path d="M19 18v-8"/><path d="m4 8 5 5 5-8 5 5"/></svg>
  if (type === 'training') return <svg {...common}><path d="M5 19V9"/><path d="M19 19V5"/><path d="M5 15h4l2-5 3 7 2-4h3"/></svg>
  if (type === 'community') return <svg {...common}><circle cx="9" cy="8" r="3.1"/><circle cx="17.2" cy="9.2" r="2.35"/><path d="M2.8 20c.7-4.1 3-6.2 6.2-6.2s5.5 2.1 6.2 6.2"/><path d="M14.4 14.8c3.7-.8 6.1 1 6.8 4.7"/></svg>
  if (type === 'mypr') return <svg {...common}><path d="M12 3.5 14.4 8l5 .7-3.6 3.5.9 5-4.7-2.4-4.7 2.4.9-5-3.6-3.5 5-.7L12 3.5Z"/><circle cx="12" cy="12" r="9" opacity=".28"/></svg>
  return <svg {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/></svg>
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [requestCount, setRequestCount] = useState(0)
  const isStaff = user?.role === 'admin' || user?.role === 'profesor'

  useEffect(() => {
    let alive = true
    async function refreshRequests() {
      if (!user?.id) return
      const { data } = await supabase.rpc('community_get_dashboard')
      if (alive) setRequestCount(Array.isArray(data?.incoming_requests) ? data.incoming_requests.length : 0)
    }
    refreshRequests()
    const timer = window.setInterval(refreshRequests, 60000)
    window.addEventListener('focus', refreshRequests)
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener('focus', refreshRequests) }
  }, [user?.id])

  const nav = [
    { path: '/app/dashboard', label: 'Inicio', icon: 'home' },
    { path: '/app/perfil', label: 'Perfil', icon: 'profile' },
    { path: '/app/entrenamiento', label: 'Rendimiento', icon: 'performance' },
    { path: '/app/deberes', label: 'Deberes', icon: 'training', featured: true },
    { path: '/app/comunidad', label: 'Comunidad', icon: 'community', badge: requestCount },
    { path: '/app/mi-pr', label: 'Mi PR', icon: 'mypr' },
  ]
  if (isStaff) nav.push({ path: '/admin', label: 'Admin', icon: 'admin' })

  return <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 border-t border-white/[0.07] bg-[#08080c]/96 shadow-[0_-14px_40px_rgba(0,0,0,.38)] backdrop-blur-2xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
    <div className="flex items-end justify-around px-1 pb-1 pt-2">
      {nav.map((item) => {
        const active = pathname === item.path || (item.path === '/admin' && pathname.startsWith('/admin'))
        if (item.featured) return <Link key={item.path} to={item.path} className="relative flex w-[64px] min-w-0 flex-col items-center justify-end active:scale-95">
          <span className={`absolute -top-[29px] grid h-[58px] w-[58px] place-items-center rounded-[21px] border transition-all ${active ? 'border-violet-200/70 bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700 text-white shadow-[0_0_0_5px_rgba(139,92,246,.10),0_10px_34px_rgba(124,58,237,.42)]' : 'border-violet-300/30 bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-800 text-white shadow-[0_0_0_5px_rgba(139,92,246,.06),0_10px_30px_rgba(109,40,217,.25)]'}`}><NavIcon type="training"/></span>
          <span className={`mt-[34px] truncate text-[7.5px] font-extrabold ${active ? 'text-violet-300' : 'text-white/55'}`}>Deberes</span>
          {active && <span className="mt-1 h-[2px] w-5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,.95)]"/>}
        </Link>
        return <Link key={item.path} to={item.path} className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-all active:scale-95 ${active ? 'text-pr-gold' : 'text-white/35'}`}>
          {active && <span className="absolute -top-2 h-[2px] w-7 rounded-full bg-current opacity-90 shadow-[0_0_10px_currentColor]"/>}
          <NavIcon type={item.icon}/>
          {item.badge > 0 && <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full border border-[#08080c] bg-cyan-400 px-1 text-[7px] font-black text-black">{item.badge > 9 ? '9+' : item.badge}</span>}
          <span className="max-w-[58px] truncate text-[7px] font-semibold tracking-[-.03em]">{item.label}</span>
        </Link>
      })}
    </div>
  </nav>
}
