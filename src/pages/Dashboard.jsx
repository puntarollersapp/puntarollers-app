import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import AppLayout from '../layouts/AppLayout'

const TYPE = {
  Evento: { icon: '🎯', color: '#818cf8' },
  Insignia: { icon: '🏅', color: '#C9A84C' },
  Nota: { icon: '📝', color: '#4ecb8b' },
}

const quickAccess = [
  {
    icon: 'card',
    label: 'Mi PRCard',
    desc: 'Beneficios y acceso',
    to: '/app/prcard',
  },
  {
    icon: 'note',
    label: 'Notas del profe',
    desc: 'Tu evolución',
    to: '/app/perfil#observaciones',
  },
  {
    icon: 'pin',
    label: 'PR Tracking',
    desc: 'Tus equipos',
    to: '/app/tracking',
  },
  {
    icon: 'play',
    label: 'Contenido',
    desc: 'Videos y recursos',
    to: '/app/contenido',
  },
  {
    icon: 'bag',
    label: 'Tienda PR',
    desc: 'Uniformes y más',
    to: '/app/tienda',
  },
]

function QIcon({ type }) {
  const paths = {
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
    note: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4M9 12h6M9 16h5" />
      </>
    ),
    pin: (
      <>
        <path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
        <circle cx="12" cy="10" r="2.4" />
      </>
    ),
    play: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m10 9 5 3-5 3Z" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l-1 13H6L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
  }

  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
    </svg>
  )
}

function greeting(nombre) {
  const hour = new Date().getHours()

  const time =
    hour < 12
      ? 'Buenos días'
      : hour < 19
        ? 'Buenas tardes'
        : 'Buenas noches'

  return `${time}, ${nombre?.split(' ')[0] || 'Alumno'}`
}

function loadSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('pr_user') || '{}')
  } catch {
    return {}
  }
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
  })
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
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()

  const [profile, setProfile] = useState({
    ...emptyUser,
    ...loadSavedUser(),
    ...user,
  })

  const [activity, setActivity] = useState([])
  const [allActivity, setAllActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const base = {
        ...emptyUser,
        ...loadSavedUser(),
        ...user,
      }

      if (!base.id) {
        setProfile(base)
        setLoading(false)
        return
      }

      setLoading(true)

      const [
        { data: profileData },
        { data: recentRows },
        { data: totalRows },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', base.id)
          .maybeSingle(),

        supabase
          .from('actividad_pr')
          .select('*')
          .eq('alumno_id', base.id)
          .order('fecha', { ascending: false })
          .limit(3),

        supabase
          .from('actividad_pr')
          .select('id, tipo')
          .eq('alumno_id', base.id),
      ])

      if (profileData) {
        const updatedProfile = {
          ...base,
          nombre: profileData.nombre || base.nombre,
          ciudad: profileData.ciudad || '',
          instagram: profileData.instagram || '',
          email: profileData.email || '',
          fechaNacimiento:
            profileData.fecha_nacimiento || '',
          sobreMi: profileData.sobre_mi || '',
          foto: profileData.foto || '',
          banner: profileData.banner || '',
          miembroDesde:
            profileData.miembro_desde || '2026',
          estado: profileData.estado || 'Activo',
          verificado: Boolean(profileData.verificado),
          prcardActiva: Boolean(
            profileData.prcard_activa
          ),
          trackingActivo: Boolean(
            profileData.tracking_activo
          ),
          gruposInfo: Array.isArray(
            profileData.grupos_info
          )
            ? profileData.grupos_info
            : [],
        }

        setProfile(updatedProfile)
        localStorage.setItem(
          'pr_user',
          JSON.stringify(updatedProfile)
        )
        updateUser?.(updatedProfile)
      }

      setActivity(recentRows || [])
      setAllActivity(totalRows || [])
      setLoading(false)
    }

    loadDashboard()
  }, [user?.id])

  const counts = allActivity.reduce(
    (accumulator, item) => {
      if (item.tipo === 'Evento') {
        accumulator.eventos += 1
      }

      if (item.tipo === 'Insignia') {
        accumulator.insignias += 1
      }

      if (item.tipo === 'Nota') {
        accumulator.notas += 1
      }

      return accumulator
    },
    {
      eventos: 0,
      insignias: 0,
      notas: 0,
    }
  )

  return (
    <AppLayout>
      <div className="pr-page space-y-7 animate-page-enter">
        <section>
          <p className="section-label">
            Mi comunidad PR
          </p>

          <h1 className="font-display text-[34px] leading-none text-white mt-2">
            {greeting(profile.nombre)}
          </h1>

          <p className="text-white/38 text-sm mt-2">
            Cada rodada suma una parte de tu historia.
          </p>
        </section>

        <section className="pr-panel overflow-hidden relative">
          <div className="h-[150px] relative overflow-hidden bg-gradient-to-br from-[#221b0e] via-[#101018] to-[#08080d]">
            {profile.banner ? (
              <img
                src={profile.banner}
                alt="Banner del perfil"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center px-8">
                <div>
                  <div className="text-3xl">🛼</div>

                  <p className="text-pr-gold font-semibold text-sm mt-2">
                    Hacé tuyo este espacio
                  </p>

                  <p className="text-white/30 text-xs mt-1">
                    Subí un banner desde tu perfil.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d13] via-transparent to-black/10" />

            <span className="absolute top-4 right-4 pr-chip">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

              {profile.estado || 'Activo'}
            </span>
          </div>

          <div className="px-5 pb-5 relative">
            <div className="absolute -top-12 left-5 w-24 h-24 rounded-[28px] overflow-hidden border-[4px] border-[#0d0d13] bg-[#181821] shadow-2xl grid place-items-center">
              {profile.foto ? (
                <img
                  src={profile.foto}
                  alt={profile.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">📷</span>
              )}
            </div>

            <div className="pt-14 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[28px] leading-none text-white">
                  {profile.nombre}

                  {profile.verificado && (
                    <span className="text-sky-400 text-lg ml-1">
                      ✓
                    </span>
                  )}
                </h2>

                <p className="text-white/38 text-xs mt-2">
                  {profile.ciudad || 'Sin ciudad'} ·
                  Miembro desde {profile.miembroDesde}
                </p>
              </div>

              <Link
                to="/app/perfil"
                className="text-pr-gold text-xs font-semibold shrink-0"
              >
                Ver perfil →
              </Link>
            </div>

            {profile.gruposInfo?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
                {profile.gruposInfo.map(
                  (group, index) => (
                    <span
                      key={`${group.titulo}-${index}`}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[10px] text-white/60 bg-white/[0.04] border border-white/[0.06]"
                    >
                      {group.titulo}
                    </span>
                  )
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5 mt-5">
              {[
                [
                  'Eventos',
                  counts.eventos,
                  '#818cf8',
                ],
                [
                  'Insignias',
                  counts.insignias,
                  '#C9A84C',
                ],
                ['Notas', counts.notas, '#4ecb8b'],
              ].map(([label, value, color]) => (
                <Link
                  to="/app/actividad"
                  key={label}
                  className="pr-card p-3 text-center"
                >
                  <p
                    className="font-display text-2xl font-bold"
                    style={{ color }}
                  >
                    {loading ? '—' : value}
                  </p>

                  <p className="section-label mt-1">
                    {label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="section-label">
                Accesos rápidos
              </p>

              <h2 className="font-display text-2xl text-white mt-1">
                Todo PR, más cerca
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickAccess.map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                className={`pr-card p-4 flex flex-col gap-4 min-h-[128px] ${
                  index === quickAccess.length - 1
                    ? 'col-span-2 min-h-0 flex-row items-center'
                    : ''
                }`}
              >
                <div className="pr-icon-box">
                  <QIcon type={item.icon} />
                </div>

                <div>
                  <p className="text-white text-sm font-semibold">
                    {item.label}
                  </p>

                  <p className="text-white/32 text-[11px] mt-1">
                    {item.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="section-label">
                Actividad reciente
              </p>

              <h2 className="font-display text-2xl text-white mt-1">
                Lo último en tu perfil
              </h2>
            </div>

            <Link
              to="/app/actividad"
              className="text-pr-gold text-xs"
            >
              Ver todo
            </Link>
          </div>

          {loading ? (
            <div className="pr-card p-5">
              <p className="text-white/45 text-sm">
                Cargando tu actividad…
              </p>
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => {
                const config =
                  TYPE[item.tipo] || TYPE.Evento

                return (
                  <Link
                    to="/app/actividad"
                    key={item.id}
                    className="pr-card p-4 flex gap-3 items-center"
                  >
                    <div
                      className="w-11 h-11 rounded-[14px] grid place-items-center text-xl shrink-0"
                      style={{
                        background: `${config.color}12`,
                        border: `1px solid ${config.color}22`,
                      }}
                    >
                      {config.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">
                        {item.titulo}
                      </p>

                      <p className="text-white/32 text-[11px] mt-1">
                        {item.tipo} ·{' '}
                        {formatDate(item.fecha)}
                      </p>
                    </div>

                    <span className="text-white/20">
                      ›
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="pr-card p-5">
              <p className="text-white font-semibold text-sm">
                Todavía no hay actividad
              </p>

              <p className="text-white/35 text-xs mt-1">
                Cuando el equipo PR cargue algo nuevo,
                aparecerá acá.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
      }
