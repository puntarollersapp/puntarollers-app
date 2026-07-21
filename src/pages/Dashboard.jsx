import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import AppLayout from '../layouts/AppLayout'

const TYPE = {
  Evento: {
    icon: '🎯',
    color: '#818cf8',
  },
  Insignia: {
    icon: '🏅',
    color: '#C9A84C',
  },
  Nota: {
    icon: '📝',
    color: '#4ecb8b',
  },
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

const DAY_MS = 24 * 60 * 60 * 1000

function QIcon({ type }) {
  const paths = {
    card: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="3"
        />

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
        <circle
          cx="12"
          cy="10"
          r="2.4"
        />
      </>
    ),

    play: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="3"
        />

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

  return `${time}, ${
    nombre?.split(' ')[0] || 'Alumno'
  }`
}

function loadSavedUser() {
  try {
    return JSON.parse(
      localStorage.getItem('pr_user') || '{}'
    )
  } catch {
    return {}
  }
}

function parseDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(
    `${String(value).slice(0, 10)}T23:59:59`
  )

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
  })
}

function formatFullDate(value) {
  const date = parseDate(value)

  if (!date) {
    return 'Sin fecha registrada'
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getPaymentStatus(
  expirationValue,
  accessEnabled
) {
  if (!expirationValue) {
    return {
      key: 'sin_pago',
      title: 'Sin pago registrado',
      description:
        'Todavía no hay una vigencia cargada para tu mensualidad.',
      detail:
        'Consultá con Tesorería si considerás que esto es un error.',
      icon: '💳',
      containerClass:
        'border-white/[0.08] bg-white/[0.025]',
      badgeClass:
        'border-white/10 bg-white/[0.05] text-white/50',
      badge: 'Sin registrar',
    }
  }

  const expiration = parseDate(
    expirationValue
  )

  if (!expiration) {
    return {
      key: 'sin_pago',
      title: 'Información no disponible',
      description:
        'No pudimos interpretar la fecha de tu mensualidad.',
      detail:
        'Comunicate con Tesorería para revisarla.',
      icon: '💳',
      containerClass:
        'border-white/[0.08] bg-white/[0.025]',
      badgeClass:
        'border-white/10 bg-white/[0.05] text-white/50',
      badge: 'Revisar',
    }
  }

  const difference =
    expiration.getTime() - Date.now()

  const remainingDays = Math.ceil(
    difference / DAY_MS
  )

  if (
    remainingDays < 0 ||
    accessEnabled === false
  ) {
    const expiredDays = Math.max(
      1,
      Math.abs(remainingDays)
    )

    return {
      key: 'vencido',
      title: 'Mensualidad vencida',
      description: `Venció el ${formatFullDate(
        expirationValue
      )}.`,
      detail: `Vencida hace ${expiredDays} día${
        expiredDays === 1 ? '' : 's'
      }.`,
      icon: '⚠️',
      containerClass:
        'border-red-400/20 bg-gradient-to-br from-red-500/10 to-white/[0.02]',
      badgeClass:
        'border-red-400/20 bg-red-400/10 text-red-200',
      badge: 'Vencida',
    }
  }

  if (remainingDays === 0) {
    return {
      key: 'por_vencer',
      title: 'Tu mensualidad vence hoy',
      description: `Vigente hasta el ${formatFullDate(
        expirationValue
      )}.`,
      detail:
        'Regularizala para mantener todos tus accesos.',
      icon: '⏳',
      containerClass:
        'border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/[0.02]',
      badgeClass:
        'border-amber-400/20 bg-amber-400/10 text-amber-200',
      badge: 'Vence hoy',
    }
  }

  if (remainingDays <= 7) {
    return {
      key: 'por_vencer',
      title: 'Tu mensualidad vence pronto',
      description: `Vigente hasta el ${formatFullDate(
        expirationValue
      )}.`,
      detail: `Te quedan ${remainingDays} día${
        remainingDays === 1 ? '' : 's'
      }.`,
      icon: '⏳',
      containerClass:
        'border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/[0.02]',
      badgeClass:
        'border-amber-400/20 bg-amber-400/10 text-amber-200',
      badge: `${remainingDays} día${
        remainingDays === 1 ? '' : 's'
      }`,
    }
  }

  return {
    key: 'vigente',
    title: 'Mensualidad vigente',
    description: `Vigente hasta el ${formatFullDate(
      expirationValue
    )}.`,
    detail: `Te quedan ${remainingDays} días.`,
    icon: '✓',
    containerClass:
      'border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.08] to-white/[0.02]',
    badgeClass:
      'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    badge: `${remainingDays} días`,
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
  ultimoPago: '',
  mensualidadHasta: '',
  accesoHabilitado: true,
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()

  const [profile, setProfile] = useState({
    ...emptyUser,
    ...loadSavedUser(),
    ...user,
  })

  const [activity, setActivity] =
    useState([])

  const [allActivity, setAllActivity] =
    useState([])

  const [loading, setLoading] =
    useState(true)

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
          .or('eliminado.is.null,eliminado.eq.false')
          .order('fecha', {
            ascending: false,
          })
          .limit(3),

        supabase
          .from('actividad_pr')
          .select('id, tipo')
          .eq('alumno_id', base.id)
          .or('eliminado.is.null,eliminado.eq.false'),
      ])

      if (profileData) {
        const updatedProfile = {
          ...base,
          nombre:
            profileData.nombre ||
            base.nombre,
          apellido:
            profileData.apellido ||
            base.apellido ||
            '',
          ciudad:
            profileData.ciudad || '',
          instagram:
            profileData.instagram || '',
          email:
            profileData.email || '',
          fechaNacimiento:
            profileData.fecha_nacimiento ||
            '',
          sobreMi:
            profileData.sobre_mi || '',
          foto:
            profileData.foto || '',
          banner:
            profileData.banner || '',
          miembroDesde:
            profileData.miembro_desde ||
            '2026',
          estado:
            profileData.estado ||
            'Activo',
          verificado: Boolean(
            profileData.verificado
          ),
          prcardActiva: Boolean(
            profileData.prcard_activa
          ),
          trackingActivo: Boolean(
            profileData.tracking_activo
          ),
          ultimoPago:
            profileData.ultimo_pago || '',
          mensualidadHasta:
            profileData.mensualidad_hasta ||
            '',
          accesoHabilitado:
            typeof profileData.acceso_habilitado ===
            'boolean'
              ? profileData.acceso_habilitado
              : true,
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

  const paymentStatus =
    getPaymentStatus(
      profile.mensualidadHasta,
      profile.accesoHabilitado
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
            Cada rodada suma una parte de
            tu historia.
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
              <div className="absolute inset-0 flex items-start justify-center text-center px-8 pt-5">
                <div>
                  <div className="text-3xl">
                    🛼
                  </div>

                  <p className="text-pr-gold font-semibold text-sm mt-2">
                    Hacé tuyo este espacio
                  </p>

                  <p className="text-white/30 text-xs mt-1">
                    Subí un banner desde
                    tu perfil.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d13] via-transparent to-black/10" />

            <span className="absolute top-4 right-4 pr-chip">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  paymentStatus.key ===
                  'vencido'
                    ? 'bg-red-400'
                    : 'bg-emerald-400'
                }`}
              />

              {paymentStatus.key ===
              'vencido'
                ? 'Vencido'
                : profile.estado ||
                  'Activo'}
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
                <span className="text-3xl">
                  📷
                </span>
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
                  {profile.ciudad ||
                    'Sin ciudad'}{' '}
                  · Miembro desde{' '}
                  {profile.miembroDesde}
                </p>
              </div>

              <Link
                to="/app/perfil"
                className="text-pr-gold text-xs font-semibold shrink-0"
              >
                Ver perfil →
              </Link>
            </div>

            {profile.gruposInfo?.length >
              0 && (
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
                [
                  'Notas',
                  counts.notas,
                  '#4ecb8b',
                ],
              ].map(
                ([label, value, color]) => (
                  <Link
                    to="/app/actividad"
                    key={label}
                    className="pr-card p-3 text-center"
                  >
                    <p
                      className="font-display text-2xl font-bold"
                      style={{ color }}
                    >
                      {loading
                        ? '—'
                        : value}
                    </p>

                    <p className="section-label mt-1">
                      {label}
                    </p>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>

        <section
          className={`rounded-[26px] border p-5 ${paymentStatus.containerClass}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 bg-black/25 border border-white/[0.06] text-xl">
              {paymentStatus.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-label">
                    Mensualidad PR
                  </p>

                  <h2 className="font-display text-xl text-white mt-1">
                    {paymentStatus.title}
                  </h2>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${paymentStatus.badgeClass}`}
                >
                  {paymentStatus.badge}
                </span>
              </div>

              <p className="text-white/55 text-sm mt-3 leading-relaxed">
                {paymentStatus.description}
              </p>

              <p className="text-white/30 text-xs mt-1">
                {paymentStatus.detail}
              </p>

              {profile.ultimoPago && (
                <p className="text-white/25 text-[10px] mt-3">
                  Último pago registrado:{' '}
                  {formatFullDate(
                    profile.ultimoPago
                  )}
                </p>
              )}
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
            {quickAccess.map(
              (item, index) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`pr-card p-4 flex flex-col gap-4 min-h-[128px] ${
                    index ===
                    quickAccess.length - 1
                      ? 'col-span-2 min-h-0 flex-row items-center'
                      : ''
                  }`}
                >
                  <div className="pr-icon-box">
                    <QIcon
                      type={item.icon}
                    />
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
              )
            )}
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
                  TYPE[item.tipo] ||
                  TYPE.Evento

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
                        {formatDate(
                          item.fecha
                        )}
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
                Cuando el equipo PR
                cargue algo nuevo,
                aparecerá acá.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
