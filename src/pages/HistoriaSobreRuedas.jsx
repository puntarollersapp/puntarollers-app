import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const GOLD = '#D8B85A'

function loadSavedUser() {
  try {
    const saved = localStorage.getItem('pr_user')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat('es-UY', {
    maximumFractionDigits: digits,
  }).format(Number(value) || 0)
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }

  return `${minutes} min`
}

function timeAgo(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diff = Date.now() - date.getTime()
  const hours = Math.max(0, Math.floor(diff / 3600000))

  if (hours < 1) return 'Hace menos de una hora'
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)

  if (days === 1) return 'Hace 1 día'
  if (days < 30) return `Hace ${days} días`

  const months = Math.floor(days / 30)

  if (months === 1) return 'Hace 1 mes'
  return `Hace ${months} meses`
}

function buildRadar({
  sessions,
  kilometers,
  badges,
  events,
  weeklySessions,
  averageSpeed,
}) {
  const consistency = clamp(weeklySessions * 18)
  const distance = clamp(
    Math.log10(Math.max(1, kilometers + 1)) * 36
  )
  const activity = clamp(
    Math.log10(Math.max(1, sessions + 1)) * 42
  )
  const achievements = clamp(
    badges * 9 + events * 6
  )
  const performance = averageSpeed
    ? clamp((averageSpeed / 25) * 100)
    : clamp((sessions + weeklySessions * 4) * 2.2)

  return [
    {
      label: 'CONSTANCIA',
      value: consistency,
    },
    {
      label: 'DISTANCIA',
      value: distance,
    },
    {
      label: 'ACTIVIDAD',
      value: activity,
    },
    {
      label: 'LOGROS',
      value: achievements,
    },
    {
      label: 'RENDIMIENTO',
      value: performance,
    },
  ]
}

function buildAutomaticStory({
  sessions,
  kilometers,
  badges,
  weeklySessions,
}) {
  if (weeklySessions >= 4) {
    return 'Una semana intensa, construida entrenamiento a entrenamiento.'
  }

  if (kilometers >= 1000) {
    return 'Más de mil kilómetros escritos sobre ruedas.'
  }

  if (kilometers >= 500) {
    return 'Una historia que ya superó los quinientos kilómetros.'
  }

  if (sessions >= 100) {
    return 'Más de cien capítulos construyendo constancia.'
  }

  if (badges >= 10) {
    return 'Una colección de logros que cuenta su evolución.'
  }

  if (sessions > 0) {
    return 'Cada sesión suma una página nueva a su recorrido.'
  }

  return 'Toda historia sobre ruedas comienza con el primer impulso.'
}

function RadarPR({ items }) {
  const size = 340
  const center = size / 2
  const radius = 112
  const levels = 4
  const angleStep = (Math.PI * 2) / items.length
  const startAngle = -Math.PI / 2

  function pointAt(index, multiplier = 1) {
    const angle = startAngle + angleStep * index

    return {
      x: center + Math.cos(angle) * radius * multiplier,
      y: center + Math.sin(angle) * radius * multiplier,
    }
  }

  function polygonPoints(multiplier = 1) {
    return items
      .map((_, index) => {
        const point = pointAt(index, multiplier)
        return `${point.x},${point.y}`
      })
      .join(' ')
  }

  const valuePoints = items
    .map((item, index) => {
      const point = pointAt(
        index,
        Math.max(0.08, item.value / 100)
      )

      return `${point.x},${point.y}`
    })
    .join(' ')

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full overflow-visible"
        aria-label="Huella sobre ruedas"
      >
        <defs>
          <radialGradient id="radarGlow">
            <stop
              offset="0%"
              stopColor={GOLD}
              stopOpacity="0.42"
            />
            <stop
              offset="100%"
              stopColor={GOLD}
              stopOpacity="0"
            />
          </radialGradient>

          <linearGradient
            id="radarFill"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#FFE28A"
              stopOpacity="0.78"
            />
            <stop
              offset="100%"
              stopColor="#D8B85A"
              stopOpacity="0.18"
            />
          </linearGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius * 1.05}
          fill="url(#radarGlow)"
          opacity="0.45"
        />

        {Array.from(
          { length: levels },
          (_, index) => {
            const multiplier =
              (index + 1) / levels

            return (
              <polygon
                key={multiplier}
                points={polygonPoints(multiplier)}
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1"
              />
            )
          }
        )}

        {items.map((_, index) => {
          const edge = pointAt(index, 1)

          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1"
            />
          )
        })}

        <polygon
          points={valuePoints}
          fill={GOLD}
          opacity="0.18"
          filter="url(#softGlow)"
        />

        <polygon
          points={valuePoints}
          fill="url(#radarFill)"
          stroke="#F2D679"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {items.map((item, index) => {
          const point = pointAt(
            index,
            Math.max(0.08, item.value / 100)
          )

          return (
            <g key={item.label}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#F7E6A8"
                opacity="0.22"
              />

              <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="#FFF4C6"
              />
            </g>
          )
        })}

        {items.map((item, index) => {
          const point = pointAt(index, 1.28)
          const textAnchor =
            point.x < center - 12
              ? 'end'
              : point.x > center + 12
                ? 'start'
                : 'middle'

          return (
            <g key={`${item.label}-label`}>
              <text
                x={point.x}
                y={point.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.54)"
                fontSize="9"
                fontWeight="700"
                letterSpacing="1.2"
              >
                {item.label}
              </text>

              <text
                x={point.x}
                y={point.y + 14}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="#E9CD74"
                fontSize="11"
                fontWeight="800"
              >
                {Math.round(item.value)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function RouteLine() {
  return (
    <div className="absolute left-[27px] top-0 bottom-0 w-px">
      <div className="absolute inset-0 bg-gradient-to-b from-pr-gold/0 via-pr-gold/55 to-pr-gold/0" />
      <div className="absolute inset-y-0 left-[-2px] w-[5px] bg-pr-gold/10 blur-sm" />
    </div>
  )
}

function RoutePoint({
  eyebrow,
  title,
  children,
  featured = false,
}) {
  return (
    <section className="relative pl-14">
      <div
        className={`absolute left-[19px] top-2 rounded-full border ${
          featured
            ? 'w-[18px] h-[18px] border-pr-gold bg-pr-gold shadow-[0_0_20px_rgba(216,184,90,0.65)]'
            : 'w-[16px] h-[16px] border-pr-gold/60 bg-[#111116]'
        }`}
      />

      <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-pr-gold/70">
        {eyebrow}
      </p>

      <h2
        className={`font-display text-white mt-1 ${
          featured ? 'text-3xl' : 'text-xl'
        }`}
      >
        {title}
      </h2>

      {children}
    </section>
  )
}

export default function HistoriaSobreRuedas() {
  const { user } = useAuth()
  const base = {
    ...loadSavedUser(),
    ...user,
  }

  const [profile, setProfile] = useState(base)
  const [activity, setActivity] = useState([])
  const [activities, setActivities] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shareMessage, setShareMessage] = useState('')

  const profileId = base.id

  useEffect(() => {
    async function loadStory() {
      if (!profileId) {
        setLoading(false)
        return
      }

      setLoading(true)

      const [
        profileResponse,
        activityResponse,
        activitiesResponse,
        summaryResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id,nombre,foto,banner,instagram,verificado'
          )
          .eq('id', profileId)
          .maybeSingle(),

        supabase
          .from('actividad_pr')
          .select('*')
          .eq('alumno_id', profileId)
          .or('eliminado.is.null,eliminado.eq.false')
          .order('fecha', {
            ascending: false,
          }),

        supabase
          .from('pr_activities')
          .select(
            'id,nombre_actividad,distancia_metros,tiempo_movimiento_segundos,velocidad_promedio,fecha_inicio'
          )
          .eq('alumno_id', profileId)
          .eq('fuente', 'strava')
          .eq('eliminada', false)
          .order('fecha_inicio', {
            ascending: false,
          })
          .limit(1000),

        supabase
          .from('pr_activity_summary')
          .select('*')
          .eq('alumno_id', profileId)
          .maybeSingle(),
      ])

      if (profileResponse.data) {
        setProfile({
          ...base,
          ...profileResponse.data,
        })
      }

      if (!activityResponse.error) {
        setActivity(activityResponse.data || [])
      }

      if (!activitiesResponse.error) {
        setActivities(
          activitiesResponse.data || []
        )
      }

      if (!summaryResponse.error) {
        setSummary(summaryResponse.data || null)
      }

      setLoading(false)
    }

    loadStory()
  }, [profileId])

  const badges = useMemo(
    () =>
      activity.filter(
        (item) => item.tipo === 'Insignia'
      ),
    [activity]
  )

  const events = useMemo(
    () =>
      activity.filter(
        (item) => item.tipo === 'Evento'
      ),
    [activity]
  )

  const totals = useMemo(
    () =>
      activities.reduce(
        (accumulator, item) => {
          accumulator.sessions += 1
          accumulator.kilometers +=
            (Number(item.distancia_metros) || 0) /
            1000
          accumulator.activeSeconds +=
            Number(
              item.tiempo_movimiento_segundos
            ) || 0

          const speed =
            Number(item.velocidad_promedio) || 0

          if (speed > 0) {
            accumulator.speedTotal += speed
            accumulator.speedSamples += 1
          }

          return accumulator
        },
        {
          sessions: 0,
          kilometers: 0,
          activeSeconds: 0,
          speedTotal: 0,
          speedSamples: 0,
        }
      ),
    [activities]
  )

  const averageSpeed =
    totals.speedSamples > 0
      ? totals.speedTotal / totals.speedSamples
      : 0

  const weeklySessions =
    Number(summary?.actividades_semana) || 0

  const radar = useMemo(
    () =>
      buildRadar({
        sessions: totals.sessions,
        kilometers: totals.kilometers,
        badges: badges.length,
        events: events.length,
        weeklySessions,
        averageSpeed,
      }),
    [
      totals.sessions,
      totals.kilometers,
      badges.length,
      events.length,
      weeklySessions,
      averageSpeed,
    ]
  )

  const automaticStory = useMemo(
    () =>
      buildAutomaticStory({
        sessions: totals.sessions,
        kilometers: totals.kilometers,
        badges: badges.length,
        weeklySessions,
      }),
    [
      totals.sessions,
      totals.kilometers,
      badges.length,
      weeklySessions,
    ]
  )

  const featuredMetric = useMemo(() => {
    const options = [
      {
        value: totals.kilometers,
        display: formatNumber(
          totals.kilometers,
          totals.kilometers < 100 ? 1 : 0
        ),
        unit: 'kilómetros recorridos',
        weight: totals.kilometers / 10,
      },
      {
        value: totals.sessions,
        display: formatNumber(totals.sessions),
        unit: 'capítulos escritos',
        weight: totals.sessions * 1.8,
      },
      {
        value: badges.length,
        display: formatNumber(badges.length),
        unit: 'logros obtenidos',
        weight: badges.length * 8,
      },
    ]

    const selected = options
      .filter((item) => item.value > 0)
      .sort((a, b) => b.weight - a.weight)[0]

    return (
      selected || {
        display: '01',
        unit: 'primer capítulo',
      }
    )
  }, [
    totals.kilometers,
    totals.sessions,
    badges.length,
  ])

  const latestActivity = activities[0] || null
  const featuredBadges = badges.slice(0, 3)

  async function shareStory() {
    const data = {
      title: 'Mi Historia sobre Ruedas',
      text: `${profile.nombre || 'Un patinador'} comparte su Historia sobre Ruedas en Punta Rollers.`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }

      await navigator.clipboard.writeText(
        window.location.href
      )

      setShareMessage(
        'Enlace copiado para compartir.'
      )
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareMessage(
          'No pudimos compartirla en este momento.'
        )
      }
    }
  }

  return (
    <AppLayout
      title="Historia sobre Ruedas"
      showBack
    >
      <div className="px-4 py-4 pb-10">
        {loading ? (
          <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5 text-white/45 text-sm">
            Construyendo tu historia…
          </div>
        ) : (
          <>
            <main
              id="historia-sobre-ruedas"
              className="relative overflow-hidden rounded-[34px] border border-pr-gold/20 bg-[#09090d] shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
            >
              <div
                className="relative h-[330px] overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.05), #09090d 92%), radial-gradient(circle at 75% 15%, rgba(216,184,90,0.16), transparent 42%)',
                }}
              >
                {profile.banner ? (
                  <img
                    src={profile.banner}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-75"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-pr-gold/15 via-white/[0.02] to-black" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-[#09090d]/35 to-black/15" />

                <img
                  src="/logo.png"
                  alt="Punta Rollers"
                  className="absolute left-5 top-5 w-14 h-14 object-contain drop-shadow-[0_0_18px_rgba(216,184,90,0.55)]"
                />

                <p className="absolute right-5 top-7 text-[8px] uppercase tracking-[0.22em] text-white/48 font-bold">
                  Mi Historia sobre Ruedas
                </p>

                <div className="absolute left-5 right-5 bottom-4 flex items-end gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-[29px] bg-gradient-to-br from-pr-gold via-white/55 to-pr-gold opacity-90" />

                    <div className="relative w-[102px] h-[128px] rounded-[26px] overflow-hidden border-[5px] border-[#09090d] bg-white/[0.05]">
                      {profile.foto ? (
                        <img
                          src={profile.foto}
                          alt={profile.nombre || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-4xl">
                          🛼
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-[30px] leading-[0.95] text-white truncate">
                        {profile.nombre ||
                          'Alumno Punta Rollers'}
                      </h1>

                      {profile.verificado && (
                        <span className="text-pr-gold text-base">
                          ✓
                        </span>
                      )}
                    </div>

                    <p className="text-white/45 text-xs mt-2">
                      Patinador de Punta Rollers
                    </p>

                    {profile.instagram && (
                      <p className="text-pr-gold/70 text-[10px] mt-1">
                        @
                        {String(profile.instagram).replace(
                          /^@/,
                          ''
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative px-5 pb-8 pt-4">
                <RouteLine />

                <div className="space-y-11">
                  <RoutePoint
                    eyebrow="Capítulo protagonista"
                    title={featuredMetric.display}
                    featured
                  >
                    <p className="text-white/52 text-sm mt-1">
                      {featuredMetric.unit}
                    </p>

                    <p className="font-display text-[22px] leading-tight text-white/85 mt-4 max-w-[270px]">
                      {automaticStory}
                    </p>
                  </RoutePoint>

                  <RoutePoint
                    eyebrow="El recorrido en números"
                    title="Lo que ya dejó huella"
                  >
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div>
                        <p className="font-display text-2xl text-white">
                          {formatNumber(
                            totals.sessions
                          )}
                        </p>

                        <p className="text-white/34 text-[9px] uppercase tracking-[0.12em] mt-1">
                          Sesiones
                        </p>
                      </div>

                      <div>
                        <p className="font-display text-2xl text-white">
                          {formatNumber(
                            totals.kilometers,
                            totals.kilometers < 100
                              ? 1
                              : 0
                          )}
                        </p>

                        <p className="text-white/34 text-[9px] uppercase tracking-[0.12em] mt-1">
                          Kilómetros
                        </p>
                      </div>

                      <div>
                        <p className="font-display text-2xl text-white">
                          {formatNumber(
                            badges.length
                          )}
                        </p>

                        <p className="text-white/34 text-[9px] uppercase tracking-[0.12em] mt-1">
                          Logros
                        </p>
                      </div>
                    </div>
                  </RoutePoint>

                  <RoutePoint
                    eyebrow="Lectura automática"
                    title="Tu huella sobre ruedas"
                  >
                    <p className="text-white/42 text-xs mt-2 max-w-[280px] leading-relaxed">
                      Una lectura visual de tu
                      constancia, distancia, actividad,
                      logros y rendimiento.
                    </p>

                    <RadarPR items={radar} />

                    <p className="text-white/28 text-[9px] text-center -mt-4">
                      Calculada únicamente con los datos
                      registrados en la plataforma.
                    </p>
                  </RoutePoint>

                  <RoutePoint
                    eyebrow="Logros destacados"
                    title={
                      featuredBadges.length
                        ? 'Marcas que cuentan tu evolución'
                        : 'Los próximos capítulos esperan'
                    }
                  >
                    {featuredBadges.length ? (
                      <div className="flex gap-4 mt-5">
                        {featuredBadges.map(
                          (badge, index) => (
                            <div
                              key={
                                badge.id ||
                                `${badge.titulo}-${index}`
                              }
                              className="w-[72px]"
                            >
                              <div className="relative w-[64px] h-[64px] mx-auto">
                                <div className="absolute inset-0 rounded-full bg-pr-gold/15 blur-lg" />

                                <div className="relative w-full h-full rounded-full border border-pr-gold/35 bg-gradient-to-br from-pr-gold/18 to-white/[0.03] grid place-items-center overflow-hidden">
                                  {badge.imagen ||
                                  badge.icono ? (
                                    <img
                                      src={
                                        badge.imagen ||
                                        badge.icono
                                      }
                                      alt=""
                                      className="w-[54px] h-[54px] object-contain"
                                    />
                                  ) : (
                                    <span className="text-2xl">
                                      🏅
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-white/60 text-[9px] leading-tight text-center mt-2 line-clamp-2">
                                {badge.titulo ||
                                  badge.nombre ||
                                  'Insignia PR'}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-white/38 text-sm mt-3">
                        El primer logro todavía está por
                        escribirse.
                      </p>
                    )}

                    {badges.length > 3 && (
                      <p className="text-pr-gold/60 text-[10px] mt-4">
                        +{badges.length - 3} logros en su
                        colección
                      </p>
                    )}
                  </RoutePoint>

                  <RoutePoint
                    eyebrow="Último capítulo"
                    title={
                      latestActivity
                        ? latestActivity.nombre_actividad ||
                          'Última sesión'
                        : 'El recorrido continúa'
                    }
                  >
                    {latestActivity ? (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          <div>
                            <p className="font-display text-2xl text-white">
                              {formatNumber(
                                (Number(
                                  latestActivity.distancia_metros
                                ) || 0) / 1000,
                                1
                              )}
                            </p>

                            <p className="text-white/30 text-[9px] uppercase tracking-[0.12em]">
                              Kilómetros
                            </p>
                          </div>

                          <div>
                            <p className="font-display text-2xl text-white">
                              {formatDuration(
                                latestActivity.tiempo_movimiento_segundos
                              )}
                            </p>

                            <p className="text-white/30 text-[9px] uppercase tracking-[0.12em]">
                              En movimiento
                            </p>
                          </div>
                        </div>

                        <p className="text-pr-gold/62 text-[10px] mt-3">
                          {timeAgo(
                            latestActivity.fecha_inicio
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-white/38 text-sm mt-3">
                        La próxima sesión será una nueva
                        página.
                      </p>
                    )}
                  </RoutePoint>

                  <RoutePoint
                    eyebrow="Continuá el recorrido"
                    title="Tu historia sigue en la próxima rueda."
                  >
                    <p className="text-white/42 text-xs mt-3 leading-relaxed max-w-[280px]">
                      Cada entrenamiento deja una huella.
                      Cada kilómetro cuenta una historia.
                    </p>

                    <div className="flex items-center gap-4 mt-5">
                      <img
                        src="/logo.png"
                        alt="Punta Rollers"
                        className="w-16 h-16 object-contain"
                      />

                      <div>
                        <p className="font-display text-lg text-pr-gold">
                          PUNTA ROLLERS
                        </p>

                        <p className="text-white/35 text-[9px] mt-1 uppercase tracking-[0.12em]">
                          No es solo patinar, es pertenecer
                        </p>
                      </div>
                    </div>
                  </RoutePoint>
                </div>
              </div>
            </main>

            <section className="grid grid-cols-1 gap-3 mt-4">
              <button
                type="button"
                onClick={shareStory}
                className="w-full rounded-[22px] bg-pr-gold text-black py-4 font-bold text-sm active:scale-[0.985] transition-transform"
              >
                Compartir mi historia sobre ruedas
              </button>

              <button
                type="button"
                disabled
                className="w-full rounded-[22px] border border-white/[0.09] bg-white/[0.035] text-white/35 py-4 font-bold text-sm"
              >
                Descargar plantilla · Próximo paso
              </button>
            </section>

            {shareMessage && (
              <div className="mt-3 rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-3 text-pr-gold text-xs text-center">
                {shareMessage}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
