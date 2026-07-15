import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const Icon = ({ type }) => {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const paths = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10.5V20h5v-6h4v6h5v-9.5" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
      </>
    ),
    activity: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </>
    ),
    services: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    admin: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.56-1.03H5.3v-3h.14A1.7 1.7 0 0 0 7 9.94a1.7 1.7 0 0 0-.34-1.88L6.6 8l2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.7V4.6h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 8l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.96 11h.14v3h-.14A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
  }

  return <svg {...common}>{paths[type]}</svg>
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'profesor'

  const nav = [
    {
      path: '/app/dashboard',
      label: 'Inicio',
      icon: 'home',
    },
    {
      path: '/app/prcard',
      label: 'PRCard',
      icon: 'card',
    },
    {
      path: '/app/actividad',
      label: 'Actividad',
      icon: 'activity',
    },
    {
      path: '/app/servicios',
      label: 'Servicios',
      icon: 'services',
    },
    {
      path: '/app/perfil',
      label: 'Perfil',
      icon: 'profile',
    },
  ]

  if (isAdmin) {
    nav.push({
      path: '/admin',
      label: 'Admin',
      icon: 'admin',
    })
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[520px] bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/[0.06]"
      style={{
        paddingBottom:
          'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {nav.map((item) => {
          const active =
            pathname === item.path ||
            (item.path === '/admin' &&
              pathname.startsWith('/admin'))

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative min-w-[54px] flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl active:scale-95 ${
                active
                  ? 'text-pr-gold'
                  : 'text-white/28'
              }`}
            >
              {active && (
                <span className="absolute -top-2 w-7 h-[2px] rounded-full bg-pr-gold shadow-[0_0_12px_rgba(201,168,76,.8)]" />
              )}

              <Icon type={item.icon} />

              <span className="text-[9px] font-semibold">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
