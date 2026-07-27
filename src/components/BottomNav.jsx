import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const Icon = ({ type }) => {
  const common = {
    width: 21,
    height: 21,
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
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    training: (
      <>
        <path d="M6.2 4.8h5.4l1.2 5.2 4.1 2.2c1.1.6 1.8 1.8 1.8 3.1v.4H5.2l-.8-2.6 2.3-1.7-.5-6.6Z" />
        <path d="M7 8.2h5.2" />
        <path d="M8.4 11.2h5.1" />
        <path d="M5.2 15.7h13.5" />
        <circle cx="6.7" cy="19.2" r="1.35" />
        <circle cx="10.6" cy="19.2" r="1.35" />
        <circle cx="14.5" cy="19.2" r="1.35" />
        <circle cx="18.4" cy="19.2" r="1.35" />
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
    badges: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path d="m8.5 13-1 8 4.5-2.5 4.5 2.5-1-8" />
        <path d="m10.2 9 1.2 1.2 2.5-2.7" />
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

  const isAdmin = user?.role === 'admin' || user?.role === 'profesor'

  const nav = [
    { path: '/app/dashboard', label: 'Inicio', icon: 'home' },
    { path: '/app/perfil', label: 'Perfil', icon: 'profile' },
    { path: '/app/entrenamiento', label: 'Actividad', icon: 'training', training: true },
    {
      path: '/app/actividad',
      label: 'RollerFeed',
      icon: 'rollerfeed',
      featured: true,
    },
    { path: '/app/musica', label: 'PR Music', icon: 'music', music: true },
    { path: '/app/insignias', label: 'Insignias', icon: 'badges' },
  ]

  if (isAdmin) {
    nav.push({ path: '/admin', label: 'Admin', icon: 'admin' })
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 border-t border-white/[0.07] bg-[#09090e]/95 shadow-[0_-14px_40px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div
        className={`grid items-end px-1 pt-2 pb-1 ${
          isAdmin ? 'grid-cols-7' : 'grid-cols-6'
        }`}
      >
        {nav.map((item) => {
          const active =
            pathname === item.path ||
            (item.path === '/admin' && pathname.startsWith('/admin'))

          if (item.featured) {
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label="Abrir RollerFeed"
                className="relative flex min-w-0 flex-col items-center justify-end transition-transform active:scale-95"
              >
                <span
                  className={`absolute -top-[29px] grid h-[62px] w-[62px] place-items-center rounded-[22px] border transition-all duration-300 ${
                    active
                      ? 'border-orange-200/70 bg-gradient-to-br from-[#ffd45e] via-[#ff9f43] to-[#ff641f] text-black shadow-[0_0_0_5px_rgba(255,134,40,0.09),0_10px_34px_rgba(255,101,31,0.42)]'
                      : 'border-orange-300/30 bg-gradient-to-br from-[#ff8a2a] via-[#f36a22] to-[#d94b17] text-white shadow-[0_0_0_5px_rgba(255,110,30,0.06),0_10px_30px_rgba(255,93,24,0.25)]'
                  }`}
                >
                  <Icon type={item.icon} />
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-orange-300/30 bg-[#101016] text-[10px]">
                    ⚡
                  </span>
                </span>

                <span
                  className={`mt-[35px] max-w-full truncate text-[8px] font-extrabold tracking-[-0.02em] transition-colors ${
                    active ? 'text-orange-300' : 'text-white/55'
                  }`}
                >
                  {item.label}
                </span>

                {active && (
                  <span className="mt-1 h-[2px] w-5 rounded-full bg-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.95)]" />
                )}
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.music ? 'Abrir PR Music' : undefined}
              className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 transition-all active:scale-95 ${
                active
                  ? item.training
                    ? 'text-red-400'
                    : item.music
                      ? 'text-violet-300'
                      : 'text-pr-gold'
                  : item.training
                    ? 'text-red-400/65'
                    : item.music
                      ? 'text-violet-200/55'
                      : 'text-white/28'
              }`}
            >
              {active && (
                <span
                  className={`absolute -top-2 h-[2px] w-7 rounded-full ${
                    item.training
                      ? 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.95)]'
                      : item.music
                        ? 'bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,.9)]'
                        : 'bg-pr-gold shadow-[0_0_12px_rgba(201,168,76,.8)]'
                  }`}
                />
              )}

              <span
                className={
                  item.training && active
                    ? 'drop-shadow-[0_0_9px_rgba(248,113,113,.9)]'
                    : item.music && active
                      ? 'drop-shadow-[0_0_8px_rgba(196,181,253,.8)]'
                      : ''
                }
              >
                <Icon type={item.icon} />
              </span>

              <span className="max-w-full truncate text-[7.5px] font-semibold tracking-[-0.02em] sm:text-[8.5px]">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
