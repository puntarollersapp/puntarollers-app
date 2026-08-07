import { useLocation } from 'react-router-dom'

export default function PublicLayout({ children }) {
  const location = useLocation()

  const goTo = (target) => (event) => {
    event.preventDefault()

    if (location.pathname !== '/') {
      window.location.href = `/${target}`
      return
    }

    const id = target.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#090a0d] text-white pb-[82px]">
      <div key={location.pathname} className="animate-page-enter">
        {children}
      </div>

      <nav
        className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-[#08090c]/95 backdrop-blur-xl"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-4 px-2 pt-2">
          <NavItem
            href="/"
            label="Inicio"
            icon="home"
            active={location.pathname === '/'}
          />
          <NavItem
            href="/#inscripciones"
            label="Clases"
            icon="calendar"
            onClick={goTo('#inscripciones')}
          />
          <NavItem
            href="/#explorar"
            label="Explorar"
            icon="compass"
            onClick={goTo('#explorar')}
          />
          <NavItem
            href="/login"
            label="Perfil"
            icon="profile"
            active={location.pathname === '/login'}
          />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ href, label, icon, active, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 text-[9px] font-bold transition ${
        active ? 'text-orange-300' : 'text-white/32'
      }`}
    >
      {active && (
        <span className="absolute -top-2 h-[2px] w-7 bg-orange-400" />
      )}
      <PublicIcon name={icon} className="h-5 w-5" />
      <span>{label}</span>
    </a>
  )
}

function PublicIcon({ name, className = 'h-5 w-5' }) {
  const paths = {
    home: (
      <>
        <path d="M3.5 11.5 12 4l8.5 7.5" />
        <path d="M5.5 10.5V20h5v-5.5h3V20h5v-9.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.home}
    </svg>
  )
}
