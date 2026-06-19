import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { actividad } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

const quickAccess = [
  { icon: '💳', label: 'Mi PRCard', to: '/app/prcard', accent: '#C9A84C' },
  { icon: '📝', label: 'Notas del profe', to: '/app/perfil#observaciones', accent: '#818cf8' },
  { icon: '✏️', label: 'Editar perfil', to: '/app/perfil#editar', accent: '#C9A84C' },
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

const PHRASES = [
  'Hoy también es un buen día para rodar.',
  'Tu historia sobre ruedas continúa acá.',
  'Cada clase suma. Cada rodada queda.',
]

function greeting(nombre) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return `${time}, ${nombre?.split(' ')[0] || 'Alumno'}.`
}

function loadSavedUser() {
  try {
    const saved = localStorage.getItem('pr_user')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

const emptyUser = {
  nombre: 'Alumno',
  ciudad: '',
  instagram: '',
  miembroDesde: '2026',
  estado: 'Activo',
  verificado: false,
  foto: '',
  banner: '',
  gruposInfo: [],
  estadisticas: { eventos: 0, insignias: 0, notas: 0 },
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const savedUser = loadSavedUser()

  const [u, setU] = useState({ ...emptyUser, ...savedUser, ...user })
  const phrase = PHRASES[new Date().getDay() % PHRASES.length]

  useEffect(() => {
    async function loadProfile() {
      const base = { ...emptyUser, ...loadSavedUser(), ...user }
      const profileId = base.id

      if (!profileId) {
        setU(base)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle()

      if (!error && data) {
        const updated = {
          ...base,
          nombre: data.nombre || base.nombre,
          ciudad: data.ciudad || base.ciudad,
          instagram: data.instagram || base.instagram,
          email: data.email || base.email,
          fechaNacimiento: data.fecha_nacimiento || base.fechaNacimiento,
          sobreMi: data.sobre_mi || base.sobreMi,
          foto: data.foto || '',
          banner: data.banner || '',
          miembroDesde: data.miembro_desde || '2026',
          estado: data.estado || 'Activo',
          verificado: Boolean(data.verificado),
          prcardActiva: Boolean(data.prcard_activa),
          trackingActivo: Boolean(data.tracking_activo),
          gruposInfo: Array.isArray(data.grupos_info) ? data.grupos_info : [],
          estadisticas: data.estadisticas || { eventos: 0, insignias: 0, notas: 0 },
        }

        setU(updated)
        localStorage.setItem('pr_user', JSON.stringify(updated))
        updateUser?.(updated)
      } else {
        setU(base)
      }
    }

    loadProfile()
  }, [user?.id])

  const stats = [
    { label: 'Eventos', value: u.estadisticas?.eventos || 0, color: '#818cf8' },
    { label: 'Insignias', value: u.estadisticas?.insignias || 0, color: '#C9A84C' },
    { label: 'Notas', value: u.estadisticas?.notas || 0, color: '#4ecb8b' },
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
          <div className="h-32 relative bg-gradient-to-br from-[#19140b] via-[#090910] to-black overflow-hidden">
            {u.banner ? (
              <img src={u.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="text-3xl mb-1">🛼</div>
                <p className="text-pr-gold text-sm font-semibold">Personalizá tu banner</p>
                <p className="text-white/35 text-xs mt-1">Subí tu imagen desde Perfil.</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-[#0a0a14]/90" />
          </div>

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
                <div className="text-center px-2">
                  <div className="text-2xl mb-1">📸</div>
                  <p className="text-[9px] text-pr-gold leading-tight">Poné tu foto</p>
                </div>
              )}
            </div>

            <div className="pt-14 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white leading-tight">
                  {u.nombre} {u.verificado && <span className="text-sky-400">✓</span>}
                </h2>

                <p className="text-xs mt-1" style={{ color: 'rgba(216,216,232,0.45)' }}>
                  {u.ciudad || 'Sin ciudad'} · Miembro desde {u.miembroDesde || '2026'}
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

            {u.gruposInfo?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {u.gruposInfo.map((grupo, index) => (
                  <span
                    key={`${grupo.titulo}-${index}`}
                    className="text-[11px] px-3 py-1 rounded-full"
                    style={{
                      color: 'rgba(216,216,232,0.72)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {grupo.titulo}
                  </span>
                ))}
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link to="/app/perfil" className="block text-center rounded-2xl py-3 text-sm font-semibold" style={{ color: '#0b0b12', background: '#C9A84C' }}>
                Ver perfil
              </Link>

              <Link
                to="/app/perfil#editar"
                className="block text-center rounded-2xl py-3 text-sm font-semibold"
                style={{
                  color: 'rgba(216,216,232,0.85)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Editar perfil
              </Link>
            </div>
          </div>
        </section>

        <div className="animate-fade-up stagger-2">
          <p className="section-label mb-3">Accesos rápidos</p>

          <div className="grid grid-cols-2 gap-2.5">
            {quickAccess.map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                className={`rounded-xl p-4 flex items-center gap-3 transition-all active:scale-95 ${
                  index === quickAccess.length - 1 ? 'col-span-2' : ''
                }`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${item.accent}12` }}>
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
                <div key={a.id} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
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
