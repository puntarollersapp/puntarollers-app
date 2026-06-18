import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Header({ title, showBack = false, onBack }) {
  const { user } = useAuth()

  return (
    <header
      className="sticky top-0 z-50 glass-dark"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center justify-between px-4" style={{ height: '52px' }}>

        {showBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(216,216,232,0.5)" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <Link to="/app/dashboard">
            <img src="/logo.png" alt="PR" className="w-8 h-8 object-contain opacity-90" />
          </Link>
        )}

        {title && (
          <span className="font-display text-base font-semibold absolute left-1/2 -translate-x-1/2" style={{ color: 'rgba(216,216,232,0.85)' }}>
            {title}
          </span>
        )}

        <Link to="/app/perfil" className="relative">
          <div
            className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <span className="font-display text-xs font-bold" style={{ color: '#C9A84C' }}>
              {user?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'PR'}
            </span>
          </div>
        </Link>

      </div>
    </header>
  )
}
