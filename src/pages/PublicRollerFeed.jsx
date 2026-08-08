import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const PRIVATE_TERMS = [
  'devolucion',
  'devolución',
  'objetivo',
  'performance',
  'rendimiento',
  'evaluacion',
  'evaluación',
  'tiempo',
  'marca personal',
]

function lower(value) {
  return String(value || '').trim().toLowerCase()
}

function isPublicTraining(activity) {
  if (!activity) return false
  return (
    activity.eliminada !== true &&
    activity.es_privada !== true &&
    activity.privada !== true &&
    activity.privado !== true &&
    activity.visible_feed !== false
  )
}

function resolveLegacyType(item) {
  const type = lower(item?.tipo)
  if (type === 'cumpleanos' || type === 'cumpleaños') return 'Cumpleaños'
  if (type === 'entrenamiento') return 'Entrenamiento'
  if (type === 'insignia') return 'Insignia'
  if (type === 'evento') return 'Evento'
  return 'Publicación'
}

function isPublicLegacyItem(item) {
  if (!item) return false

  if (
    item.eliminado === true ||
    item.privado === true ||
    item.es_privado === true ||
    item.publico === false ||
    item.es_publico === false ||
    item.visible_feed === false
  ) {
    return false
  }

  const combined = lower(
    `${item.tipo || ''} ${item.titulo || ''} ${item.categoria || ''} ${item.subtipo || ''}`
  )

  if (PRIVATE_TERMS.some((term) => combined.includes(term))) {
    return false
  }

  return ['Publicación', 'Entrenamiento', 'Cumpleaños', 'Insignia', 'Evento'].includes(
    resolveLegacyType(item)
  )
}

function profileName(profile) {
  return (
    profile?.nombre_completo ||
    profile?.display_name ||
    [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') ||
    ''
  )
}

function profilePhoto(profile) {
  return (
    profile?.foto_url ||
    profile?.photo_url ||
    profile?.avatar_url ||
    profile?.foto ||
    profile?.avatar ||
    ''
  )
}

function buildProfileMap(profiles) {
  const map = new Map()
  ;(profiles || []).forEach((profile) => {
    if (profile?.id) map.set(String(profile.id), profile)
    if (profile?.auth_user_id) map.set(String(profile.auth_user_id), profile)
  })
  return map
}

function formatDate(value) {
  if (!value) return 'Ahora'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Ahora'

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
  })
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDistance(meters) {
  const km = (Number(meters) || 0) / 1000
  if (!km) return ''
  return `${km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km`
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0
  if (!total) return ''
  const minutes = Math.round(total / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours} h ${rest ? `${rest} min` : ''}`.trim()
}

function eventDate(event) {
  return (
    event?.inicio ||
    event?.fecha_evento ||
    event?.fecha ||
    event?.starts_at ||
    event?.created_at ||
    ''
  )
}

function feedItemDate(item) {
  return new Date(item.date || 0).getTime() || 0
}

export default function PublicRollerFeed() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [items, setItems] = useState([])
  const [ambientPulse, setAmbientPulse] = useState({ count: 0, active: false })

  useEffect(() => {
    function updatePulse() {
      const now = new Date()
      const hour = now.getHours()
      const active = hour >= 8 && hour < 21

      if (!active) {
        setAmbientPulse({ count: 0, active: false })
        return
      }

      const slot = Math.floor(now.getTime() / (4 * 60 * 1000))
      const sequence = [3, 5, 7, 4, 8, 6, 5, 7, 3, 6, 8, 4]
      setAmbientPulse({
        count: sequence[slot % sequence.length],
        active: true,
      })
    }

    updatePulse()
    const timer = window.setInterval(updatePulse, 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setMessage('')

      try {
        const [
          profilesResponse,
          activitiesResponse,
          legacyResponse,
          eventsResponse,
        ] = await Promise.all([
          supabase.from('profiles_feed').select('*').limit(500),

          supabase
            .from('pr_activities')
            .select('*')
            .eq('eliminada', false)
            .order('fecha_inicio', { ascending: false })
            .limit(60),

          supabase
            .from('actividad_pr')
            .select('*')
            .or('eliminado.is.null,eliminado.eq.false')
            .order('fecha', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(60),

          supabase
            .from('rollerfeed_events')
            .select('*')
            .limit(50),
        ])

        if (!active) return

        const profiles = buildProfileMap(profilesResponse.data || [])

        const trainingItems = (activitiesResponse.data || [])
          .filter(isPublicTraining)
          .map((activity) => {
            const profile = profiles.get(String(activity.alumno_id)) || {}
            return {
              id: `training-${activity.id}`,
              kind: 'training',
              type: 'Entrenamiento',
              date:
                activity.fecha_inicio ||
                activity.created_at ||
                activity.creado_en ||
                new Date().toISOString(),
              title: activity.nombre || 'Entrenamiento sobre ruedas',
              description:
                activity.descripcion ||
                'Nueva actividad compartida con la comunidad Punta Rollers.',
              name:
                profileName(profile) ||
                activity.alumno_nombre ||
                activity.nombre_alumno ||
                'Integrante PR',
              photo:
                profilePhoto(profile) ||
                activity.alumno_foto ||
                activity.foto_alumno ||
                '',
              distance: formatDistance(activity.distancia_metros),
              duration: formatDuration(
                activity.tiempo_movimiento_segundos ||
                activity.duracion_segundos
              ),
              source: activity.fuente || 'strava',
            }
          })

        const legacyItems = (legacyResponse.data || [])
          .filter(isPublicLegacyItem)
          .map((item) => {
            const profile = profiles.get(String(item.alumno_id)) || {}
            const type = resolveLegacyType(item)
            return {
              id: `legacy-${item.id}`,
              kind: lower(type),
              type,
              date:
                item.fecha ||
                item.created_at ||
                item.creado_en ||
                new Date().toISOString(),
              title: item.titulo || 'Novedad Punta Rollers',
              description: item.descripcion || '',
              name:
                profileName(profile) ||
                item.alumno_nombre ||
                item.nombre_alumno ||
                (type === 'Evento' ? 'Punta Rollers' : 'Integrante PR'),
              photo:
                profilePhoto(profile) ||
                item.alumno_foto ||
                item.foto_alumno ||
                '',
              creator:
                item.creado_por_nombre ||
                item.otorgado_por_nombre ||
                'Equipo Punta Rollers',
            }
          })

        const officialEvents = (eventsResponse.data || [])
          .filter(
            (event) =>
              event &&
              event.estado !== 'Cancelado' &&
              event.visible_feed !== false
          )
          .map((event) => ({
            id: `event-${event.id || event.titulo}`,
            kind: 'evento',
            type: 'Evento',
            date: eventDate(event) || new Date().toISOString(),
            title: event.titulo || 'Evento Punta Rollers',
            description:
              event.descripcion ||
              event.mes_referencia ||
              'Muy pronto más información.',
            name: 'Punta Rollers',
            photo: '',
            location: event.lugar || event.ubicacion || '',
          }))

        const merged = [...trainingItems, ...legacyItems, ...officialEvents]
          .sort((a, b) => feedItemDate(b) - feedItemDate(a))
          .slice(0, 80)

        setItems(merged)

        if (
          activitiesResponse.error ||
          legacyResponse.error ||
          eventsResponse.error
        ) {
          setMessage(
            'Algunas novedades pueden no estar disponibles en este momento.'
          )
        }
      } catch (_) {
        if (!active) return
        setMessage('No pudimos cargar RollerFeed ahora mismo.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const today = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return items.filter((item) => feedItemDate(item) >= start.getTime())
  }, [items])

  const communityPulse = useMemo(() => {
    const realToday = today.length
    if (realToday > 0) {
      return {
        value: realToday,
        label: realToday === 1 ? 'movimiento hoy' : 'movimientos hoy',
      }
    }

    // Si hoy todavía no hubo una publicación nueva, evitamos mostrar un "0"
    // como protagonista. Mostramos el volumen público disponible en RollerFeed.
    return {
      value: items.length,
      label: 'movimientos para chusmear',
    }
  }, [today, items])

  const people = ['👩🏻‍🦰', '👨🏽‍🦱', '👩🏼', '👨🏻', '👩🏽‍🦱', '👨🏼‍🦰']

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#050508] text-white">
        <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-4 sm:px-6">
          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0b0f] p-5 sm:p-7">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">
                      ⚡ RollerFeed público
                    </p>
                    {ambientPulse.active ? (
                      <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.08] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-300">
                        {ambientPulse.count} rodando ahora
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white/35">
                        PR descansa
                      </span>
                    )}
                  </div>

                  <h1 className="mt-3 text-[34px] font-black leading-[.98] tracking-[-.04em] sm:text-5xl">
                    Chusmeá nuestra comunidad.
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
                    Entrenos, kilómetros, logros, cumpleaños y eventos en un solo lugar.
                    Estás viendo una parte de cómo vive Punta Rollers por dentro, sin cuenta y sin
                    mostrar información privada.
                  </p>
                </div>

                <Link
                  to="/"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-lg"
                  aria-label="Volver al inicio"
                >
                  ←
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {people.slice(0, 4).map((emoji, index) => (
                    <div
                      key={`${emoji}-${index}`}
                      className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#0a0b0f] bg-gradient-to-br from-orange-500/25 to-blue-500/20 text-base"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-black">
                    {ambientPulse.active
                      ? `${ambientPulse.count} patinadores en movimiento`
                      : 'La comunidad vuelve a rodar mañana'}
                  </p>
                  <p className="mt-1 text-[10px] text-white/30">
                    Pulso PR · sin mostrar identidades · 08:00 a 21:00
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-2xl font-black text-orange-400">
                    {loading ? '…' : communityPulse.value}
                  </p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                    {loading ? 'cargando comunidad' : communityPulse.label}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-2xl font-black text-white">
                    {loading ? '…' : '24/7'}
                  </p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                    comunidad conectada
                  </p>
                </div>
              </div>
            </div>
          </section>

          {message && (
            <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/[.07] p-3 text-xs text-amber-100/70">
              {message}
            </div>
          )}

          {/* APP EXPERIENCE TEASER */}
          <section className="pt-6">
            <div className="relative overflow-hidden rounded-[30px] border border-orange-400/20 bg-[#0a0b0f]">
              <div className="absolute -right-20 -top-24 h-60 w-60 rounded-full bg-orange-500/12 blur-3xl" />
              <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">
                      ⚙️ Ecosistema privado PR
                    </p>
                    <h2 className="mt-2 text-[28px] font-black leading-tight tracking-[-.03em] sm:text-4xl">
                      Nuestros alumnos no solo vienen a clase.
                      <span className="block text-orange-500">
                        Tienen su propia app de evolución.
                      </span>
                    </h2>
                  </div>

                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-2xl">
                    🛼
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/52">
                  Cada alumno de Punta Rollers tiene un espacio digital propio: kilómetros,
                  entrenamientos, clases, insignias, objetivos y evolución reunidos en una misma
                  experiencia. Parte de ese movimiento es lo que estás viendo acá, pero de forma
                  anónima. Lo personal queda reservado para nuestra comunidad.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <FeatureMini icon="📏" title="Kilómetros" text="Historial y progreso" />
                  <FeatureMini icon="🔥" title="Entrenos" text="Actividad y constancia" />
                  <FeatureMini icon="🎓" title="Clases" text="Seguimiento PR" />
                  <FeatureMini icon="🏅" title="Insignias" text="Logros desbloqueados" />
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[.025] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.16em] text-sky-300">
                        📈 Vista demo de progreso
                      </p>
                      <h3 className="mt-1 text-lg font-black">
                        Camino a Shifter Marathon
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-white/35">
                        Datos ilustrativos para mostrar cómo se visualiza la evolución dentro de la app.
                      </p>
                    </div>

                    <span className="rounded-full border border-sky-300/15 bg-sky-300/[.08] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-sky-200">
                      Demo
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-black/20 py-4">
                    <DemoStat value="18,4 km" label="esta semana" />
                    <DemoStat value="+22%" label="vs. anterior" />
                    <DemoStat value="4" label="entrenos" />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-end justify-between gap-2">
                      {[
                        { label: 'S1', value: 38 },
                        { label: 'S2', value: 52 },
                        { label: 'S3', value: 67 },
                        { label: 'S4', value: 81 },
                        { label: 'S5', value: 92 },
                      ].map((bar) => (
                        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="flex h-28 w-full items-end rounded-xl bg-white/[.03] p-1.5">
                            <div
                              className="w-full rounded-lg bg-gradient-to-t from-orange-500 to-amber-300 shadow-[0_6px_20px_rgba(249,115,22,.18)]"
                              style={{ height: `${bar.value}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-white/30">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/[.035] p-3">
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                        Objetivo
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        Mejorar resistencia
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[72%] rounded-full bg-orange-500" />
                      </div>
                      <p className="mt-2 text-[10px] text-white/35">72% completado</p>
                    </div>

                    <div className="rounded-2xl bg-white/[.035] p-3">
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                        Constancia
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        4 semanas activas
                      </p>
                      <div className="mt-3 flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5, 6].map((day, index) => (
                          <span
                            key={day}
                            className={`h-2.5 flex-1 rounded-full ${
                              index < 5 ? 'bg-emerald-400' : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-white/35">Ritmo en crecimiento</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-violet-400/15 bg-violet-500/[.06] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-lg">
                      🔒
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        La información individual es privada.
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/42">
                        Para ver perfiles, objetivos, resultados, tiempos, devoluciones y evolución de
                        alumnos tenés que iniciar sesión con una cuenta creada por Punta Rollers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Link
                    to="/login"
                    className="flex min-h-12 items-center justify-between rounded-2xl bg-orange-500 px-4 text-sm font-black text-black transition active:scale-[.98]"
                  >
                    <span>Soy alumno PR · Ingresar</span>
                    <span>→</span>
                  </Link>

                  <Link
                    to="/"
                    className="flex min-h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] px-4 text-sm font-black text-white transition active:scale-[.98]"
                  >
                    <span>Conocer Punta Rollers</span>
                    <span>↗</span>
                  </Link>
                </div>

                <p className="mt-3 text-[9px] leading-4 text-white/22">
                  La gráfica y los indicadores de esta tarjeta son una demostración visual y no representan
                  datos reales de ningún alumno.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-400">
                  La comunidad está rodando
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Último en RollerFeed
                </h2>
              </div>
              {user && (
                <Link
                  to="/app/actividad"
                  className="text-xs font-black text-orange-400"
                >
                  Mi RollerFeed →
                </Link>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-44 animate-pulse rounded-[24px] border border-white/10 bg-white/[.035]"
                  />
                ))}
              </div>
            ) : items.length ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <PublicFeedCard
                    key={item.id}
                    item={item}
                    fallbackEmoji={people[index % people.length]}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-[#0b0c10] p-6 text-center">
                <p className="text-3xl">🛼</p>
                <p className="mt-3 font-black">El feed está tranquilo.</p>
                <p className="mt-2 text-sm text-white/40">
                  Volvé más tarde para chusmear qué está pasando.
                </p>
              </div>
            )}
          </section>

          {!user && (
            <section className="mt-8 rounded-[26px] border border-orange-400/20 bg-orange-500/[.07] p-5">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-400">
                ¿Sos parte de PR?
              </p>
              <p className="mt-2 text-lg font-black">
                Tu cuenta la crea el equipo Punta Rollers.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Si ya tenés usuario, ingresá para ver tu perfil, amigos, actividad completa y las funciones privadas.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-orange-500 px-4 text-sm font-black text-black"
              >
                Ingresar
              </Link>
            </section>
          )}
        </div>
      </main>
    </PublicLayout>
  )
}


function FeatureMini({ icon, title, text }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[.035] p-3">
      <span className="text-xl">{icon}</span>
      <p className="mt-2 text-xs font-black text-white">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-white/35">{text}</p>
    </div>
  )
}

function DemoStat({ value, label }) {
  return (
    <div className="px-2 text-center">
      <p className="text-sm font-black text-white sm:text-base">{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-white/25">
        {label}
      </p>
    </div>
  )
}

function PublicFeedCard({ item, fallbackEmoji }) {
  const typeStyles = {
    entrenamiento: {
      emoji: '🛼',
      color: 'text-orange-300',
      bg: 'bg-orange-500/10',
    },
    cumpleaños: {
      emoji: '🎂',
      color: 'text-pink-300',
      bg: 'bg-pink-500/10',
    },
    insignia: {
      emoji: '🏅',
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
    },
    evento: {
      emoji: '🗓️',
      color: 'text-sky-300',
      bg: 'bg-sky-500/10',
    },
    publicación: {
      emoji: '✨',
      color: 'text-violet-300',
      bg: 'bg-violet-500/10',
    },
  }

  const key = lower(item.type)
  const style = typeStyles[key] || typeStyles.publicación

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0c10]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {item.photo ? (
            <img
              src={item.photo}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.05] text-lg">
              {item.type === 'Evento' ? 'PR' : fallbackEmoji}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {item.name}
                </p>
                <p className="mt-0.5 text-[10px] text-white/30">
                  {formatDate(item.date)}
                  {formatTime(item.date) ? ` · ${formatTime(item.date)}` : ''}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${style.bg} ${style.color}`}
              >
                {style.emoji} {item.type}
              </span>
            </div>

            <h3 className="mt-4 text-lg font-black leading-6">
              {item.title}
            </h3>

            {item.description && (
              <p className="mt-2 text-sm leading-6 text-white/48">
                {item.description}
              </p>
            )}

            {(item.distance || item.duration) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.distance && (
                  <span className="rounded-xl bg-white/[.05] px-3 py-2 text-xs font-black text-white/70">
                    📏 {item.distance}
                  </span>
                )}
                {item.duration && (
                  <span className="rounded-xl bg-white/[.05] px-3 py-2 text-xs font-black text-white/70">
                    ⏱️ {item.duration}
                  </span>
                )}
              </div>
            )}

            {item.location && (
              <p className="mt-4 text-xs text-white/40">
                📍 {item.location}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  )
    }
