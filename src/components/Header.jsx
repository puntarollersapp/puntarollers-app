import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Header({
  title,
  showBack = false,
  onBack,
}) {
  const { user } = useAuth()

  const initials =
    user?.nombre
      ?.split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .slice(0, 2) || 'PR'

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-white/[0.055]">
      <div className="h-[62px] px-[18px] flex items-center justify-between relative">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="w-10 h-10 rounded-[14px] grid place-items-center bg-white/[0.035] border border-white/[0.075] active:scale-95"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-white/55"
              strokeWidth="1.9"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        ) : (
          <Link
            to="/"
            className="w-10 h-10 grid place-items-center active:scale-95"
            aria-label="Ir a la página pública de Punta Rollers"
          >
            <img
              src="/logo.png"
              alt="Punta Rollers"
              className="w-9 h-9 object-contain"
            />
          </Link>
        )}

        {title && (
          <span className="font-display text-[20px] font-bold tracking-wide absolute left-1/2 -translate-x-1/2 text-white/90 whitespace-nowrap">
            {title}
          </span>
        )}

        <Link
          to="/app/perfil"
          aria-label="Abrir perfil"
          className="w-10 h-10 rounded-[14px] overflow-hidden grid place-items-center bg-pr-gold/10 border border-pr-gold/20 active:scale-95"
        >
          {user?.foto ? (
            <img
              src={user.foto}
              alt={user.nombre || 'Perfil'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display text-[13px] font-bold text-pr-gold">
              {initials}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
