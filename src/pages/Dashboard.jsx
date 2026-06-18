import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { mockUser, actividad } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

const STORAGE_KEY = 'pr_profile_custom'

function loadSavedProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

const quickAccess = [
  { icon: '💳', label: 'Mi PRCard', to: '/app/prcard', accent: '#C9A84C' },
  { icon: '📊', label: 'Actividad', to: '/app/actividad', accent: '#4ecb8b' },
  { icon: '📍', label: 'Tracking', to: '/app/tracking', accent: '#C9A84C' },
  { icon: '🎬', label: 'Contenido', to: '/app/contenido', accent: '#f97316' },
  { icon: '🛒', label: 'Tienda', to: '/app/tienda', accent: '#4ecb8b' },
]

const ACTIVITY_CFG = {
  Clase: { icon: '🛼', bg: 'rgba(26,107,74,0.14)', border: 'rgba(26,107,74,0.2)' },
  Evento: { icon: '🎯', bg: 'rgba(59,74,176,0.14)', border: 'rgba(59,74,176,0.2)' },
  Insignia: { icon: '🏅', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.2)' },
}

function greeting(nombre) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return `${time}, ${nombre?.split(' ')[0]}.`
}

const PHRASES = [
  'Hoy también es un buen día para rodar.',
  'Tu historia sobre ruedas continúa acá.',
  'Cada clase suma. Cada rodada queda.',
]

export default function Dashboard() {
  const { user } = useAuth()
  const savedProfile = loadSavedProfile()
  const u = { ...mockUser, ...user, ...savedProfile }
  const phrase = PHRASES[new Date().getDay() % PHRASES.length]

  const stats = [
    { label: 'Clases', value: u.estadisticas?.clases || 84, color: '#4ecb8b' },
    { label: 'Eventos', value: u.estadisticas?.eventos || 12, color: '#818cf8' },
    { label: 'Exp. PR', value: u.estadisticas?.exp || 7, color: '#C9A84C' },
  ]

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-8 space-y-7">
        <div className="animate-fade-up">
          <h1 className="font-display text-2xl font-semibold text-white">
            {greeting(u.nombre)}
          </h1>
          <p className="text-sm font-body mt-1 italic" style={{ color: 'rgba(216,216,232,0.32)' }}>
            "{phrase}"
          </p>
        </div>

        <section
          className="animate-fade-up stagger-1 rounded-3xl overflow-hidden relative"
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}
        >
          <div
            className="h-32 relative"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(10,10,20,0.8)), url(${u.banner || '/banner-prcard.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <div className="px-5 pb-5 relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 absolute -top-12 flex items-center justify-center"
              style={{
                borderColor: '#0b0b12',
                background: 'linear-gradient(145deg, rgba(201,168,76,0.35), rgba(255,255,255,0.08))',
              }}
            >
              {u.foto ? (
                <img src={u.foto} alt={u.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {u.nombre?.charAt(0)}
                </span>
              )}
            </div>

            <div className="pt-14 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white leading-tight">
                  {u.nombre} {u.verificado && <span className="text-sky-400">✓</span>}
                </h2>

                <p className="text-xs mt-1" style={{ color: 'rgba(216,216,232,0.45)' }}>
                  {u.ciudad || 'Punta del Este'} · Miembro desde {u.miembroDesde || '2026'}
                </p>

                {u.instagram && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(201,168,76,0.7)' }}>
                    {u.instagram}
                  </p>
                )}
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold badge-activo">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {u.estado || 'Activo'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {(u.grupos || []).map((grupo) => (
                <span
                  key={grupo}
                  className="text-[11px] px-3 py-1 rounded-full"
                  style={{
                    color: 'rgba(216,216,232,0.72)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {grupo}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mt-5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl py-3"
                  style={{
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="font-display text-2xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="section-label mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <Link
              to="/app/perfil"
              className="mt-4 block text-center rounded-2xl py-3 text-sm font-semibold"
              style={{
                color: '#0b0b12',
                background: '#C9A84C',
              }}
            >
              Ver perfil completo
            </Link>
          </div>
        </section>

        <div className="animate-fade-up stagger-2">
          <p className="section-label mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-2.5">
            {quickAccess.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-xl p-4 flex items-center gap-3 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${item.accent}12` }}
                >
                  {item.icon}
                </div>
                <span className="text-sm font-body font-medium leading-tight" style={{ color: 'rgba(216,216,232,0.75)' }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Actividad reciente</p>
            <Link to="/app/actividad" className="text-xs font-body" style={{ color: 'rgba(201,168,76,0.6)' }}>
              Ver todo
            </Link>
          </div>

          <div className="space-y-2">
            {actividad.slice(0, 3).map((a) => {
              const cfg = ACTIVITY_CFG[a.tipo] || ACTIVITY_CFG.Clase

              return (
                <div
                  key={a.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold truncate" style={{ color: 'rgba(216,216,232,0.82)' }}>
                      {a.nombre}
                    </p>
                    <p className="text-xs font-body mt-0.5" style={{ color: 'rgba(216,216,232,0.28)' }}>
                      {a.fecha}{a.hora !== '—' ? ` · ${a.hora}hs` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
