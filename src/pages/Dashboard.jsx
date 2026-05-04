import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { mockUser, actividad } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

const quickAccess = [
  { icon: '💳', label: 'Mi PRCard',   to: '/app/prcard',    accent: '#C9A84C' },
  { icon: '📊', label: 'Actividad',   to: '/app/actividad', accent: '#4ecb8b' },
  { icon: '👤', label: 'Perfil',      to: '/app/perfil',    accent: '#818cf8' },
  { icon: '📡', label: 'NFC',         to: '/app/prcard#nfc',accent: '#C9A84C' },
  { icon: '🎬', label: 'Contenido',   to: '/app/contenido', accent: '#f97316' },
  { icon: '🛒', label: 'Tienda',      to: '/app/tienda',    accent: '#4ecb8b' },
]

const ACTIVITY_CFG = {
  Clase:    { icon: '🛼', color: '#4ecb8b', bg: 'rgba(26,107,74,0.14)', border: 'rgba(26,107,74,0.2)' },
  Evento:   { icon: '🎯', color: '#818cf8', bg: 'rgba(59,74,176,0.14)', border: 'rgba(59,74,176,0.2)' },
  Insignia: { icon: '🏅', color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.2)' },
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
  const u = user || mockUser
  const phrase = PHRASES[new Date().getDay() % PHRASES.length]

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-8 space-y-7">

        <div className="animate-fade-up">
          <h1 className="font-display text-2xl font-semibold text-white">{greeting(u.nombre)}</h1>
          <p className="text-sm font-body mt-1 italic" style={{ color: 'rgba(216,216,232,0.32)' }}>"{phrase}"</p>
        </div>

        <div
          className="animate-fade-up stagger-1 rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(155deg, rgba(18,13,2,0.97) 0%, rgba(10,10,20,0.98) 100%)',
            border: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-30"
               style={{ background: 'radial-gradient(ellipse at top right, rgba(201,168,76,0.2) 0%, transparent 70%)' }} />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="section-label mb-2">Estado del miembro</p>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold ${
                  u.estado === 'Destacado' || u.estado === 'Destacada' ? 'badge-destacado' :
                  u.estado === 'Frecuente' ? 'badge-frecuente' : 'badge-activo'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {u.estado}
              </span>
            </div>
            <img src="/logo.png" alt="PR" className="w-11 h-11 object-contain opacity-50" />
          </div>

          <div className="divider-subtle my-4" />

          <div className="grid grid-cols-3 gap-3 text-center relative z-10">
            {[
              { label: 'Clases',  value: u.clases_asistidas || 84, color: '#4ecb8b' },
              { label: 'Eventos', value: u.eventos || 12,           color: '#818cf8' },
              { label: 'Exp. PR', value: u.experiencias_desbloqueadas || 7, color: '#C9A84C' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="section-label mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-up stagger-2">
          <p className="section-label mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-3 gap-2.5">
            {quickAccess.map((item, i) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${item.accent}12` }}
                >
                  {item.icon}
                </div>
                <span className="text-[11px] font-body font-medium text-center leading-tight" style={{ color: 'rgba(216,216,232,0.5)' }}>
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
            {actividad.slice(0, 3).map(a => {
              const cfg = ACTIVITY_CFG[a.tipo] || ACTIVITY_CFG.Clase
              return (
                <div
                  key={a.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
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
                  {a.origen === 'NFC' && (
                    <span className="text-[10px] font-body px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.65)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      NFC
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
