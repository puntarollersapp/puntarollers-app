import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'profesor'

  const NAV = [
    {
      path: '/app/dashboard',
      label: 'Inicio',
      icon: '🏠',
    },
    {
      path: '/app/prcard',
      label: 'PRCard',
      icon: '💳',
    },
    {
      path: '/app/actividad',
      label: 'Actividad',
      icon: '📊',
    },
    {
      path: '/app/servicios',
      label: 'Servicios',
      icon: '⚙️',
    },
    {
      path: '/app/perfil',
      label: 'Perfil',
      icon: '👤',
    },
  ]

  if (isAdmin) {
    NAV.push({
      path: '/admin',
      label: 'Admin',
      icon: '🛠️',
    })
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-dark"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom:
          'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV.map(({ path, label, icon }) => {
          const active = pathname === path

          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{
                opacity: active ? 1 : 0.4,
              }}
            >
              <div
                className="text-lg"
                style={{
                  color: active ? '#C9A84C' : 'inherit',
                }}
              >
                {icon}
              </div>

              <span
                className="text-[10px] font-body font-medium"
                style={{
                  color: active ? '#C9A84C' : 'inherit',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
