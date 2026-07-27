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
    rollerfeed: (
      <>
        <path d="M5.5 15.5h9.2a3.8 3.8 0 0 0 3.8-3.8V9.4" />
        <path d="M7 12.5 10.5 9l2.5 2.5L17.5 7" />
        <circle cx="7" cy="18.5" r="1.5" />
        <circle cx="13" cy="18.5" r="1.5" />
        <path d="M4 15.5h2.2" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V6l10-2v12" />
        <path d="M9 10l10-2" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
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
      label: 'RollerFeed',
      icon: 'rollerfeed',
      featured: true,
    },
    {
      path: '/app/musica',
      label: 'PR Music',
      icon: 'music',
      music: true,
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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[520px] border-t border-white/[0.07] bg-[#09090e]/95 backdrop-blur-2xl shadow-[0_-14px_40px_rgba(0,0,0,0.32)]"
      style={{
        paddingBottom:
          'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div
        className={`grid items-end px-2 pt-2 pb-1 ${
          isAdmin
            ? 'grid-cols-6'
            : 'grid-cols-5'
        }`}
      >
        {nav.map((item) => {
          const active =
            pathname === item.path ||
            (item.path === '/admin' &&
              pathname.startsWith('/admin'))

          if (item.featured) {
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label="Abrir RollerFeed"
                className="relative flex flex-col items-center justify-end min-w-0 active:scale-95 transition-transform"
              >
                <span
                  className={`absolute -top-[29px] w-[62px] h-[62px] rounded-[22px] border grid place-items-center transition-all duration-300 ${
                    active
                      ? 'text-black border-orange-200/70 bg-gradient-to-br from-[#ffd45e] via-[#ff9f43] to-[#ff641f] shadow-[0_0_0_5px_rgba(255,134,40,0.09),0_10px_34px_rgba(255,101,31,0.42)]'
                      : 'text-white border-orange-300/30 bg-gradient-to-br from-[#ff8a2a] via-[#f36a22] to-[#d94b17] shadow-[0_0_0_5px_rgba(255,110,30,0.06),0_10px_30px_rgba(255,93,24,0.25)]'
                  }`}
                >
                  <Icon type={item.icon} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#101016] border border-orange-300/30 grid place-items-center text-[10px]">
                    ⚡
                  </span>
                </span>

                <span
                  className={`mt-[35px] text-[9px] font-extrabold tracking-[-0.01em] transition-colors ${
                    active
                      ? 'text-orange-300'
                      : 'text-white/55'
                  }`}
                >
                  {item.label}
                </span>

                {active && (
                  <span className="mt-1 w-5 h-[2px] rounded-full bg-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.95)]" />
                )}
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.music ? 'Abrir PR Music' : undefined}
              className={`relative min-w-0 flex flex-col items-center gap-1 px-1 py-1.5 rounded-xl active:scale-95 transition-all ${
                active
                  ? item.music
                    ? 'text-violet-300'
                    : 'text-pr-gold'
                  : item.music
                    ? 'text-violet-200/55'
                    : 'text-white/28'
              }`}
            >
              {active && (
                <span
                  className={`absolute -top-2 w-7 h-[2px] rounded-full ${
                    item.music
                      ? 'bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,.9)]'
                      : 'bg-pr-gold shadow-[0_0_12px_rgba(201,168,76,.8)]'
                  }`}
                />
              )}

              <span className={item.music && active ? 'drop-shadow-[0_0_8px_rgba(196,181,253,.8)]' : ''}>
                <Icon type={item.icon} />
              </span>

              <span className="text-[9px] font-semibold truncate max-w-full">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
