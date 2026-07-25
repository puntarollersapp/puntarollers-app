import { useEffect, useMemo, useRef, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const FEED_FILTERS = [
  { key: 'Todos', label: 'Todo' },
  { key: 'Entrenamiento', label: 'Entrenos' },
  { key: 'Cumpleaños', label: 'Cumples' },
  { key: 'Insignia', label: 'Logros' },
  { key: 'Evento', label: 'Eventos' },
]

const EMPTY_STATES = {
  Todos: {
    icon: '🛼',
    title: 'La pista está tranquila',
    description:
      'Las próximas actividades públicas de la comunidad aparecerán acá.',
  },
  Entrenamiento: {
    icon: '⚡',
    title: 'Todavía no hay entrenamientos',
    description:
      'Las actividades públicas sincronizadas con Strava aparecerán acá.',
  },
  Cumpleaños: {
    icon: '🎂',
    title: 'No hay cumpleaños próximos',
    description:
      'Mostraremos automáticamente los cumpleaños de hoy y de los próximos 5 días.',
  },
  Insignia: {
    icon: '🏅',
    title: 'Todavía no hay logros publicados',
    description:
      'Las insignias otorgadas a la comunidad aparecerán acá.',
  },
  Evento: {
    icon: '📅',
    title: 'No hay eventos próximos',
    description:
      'Las salidas, clínicas, competencias y encuentros publicados aparecerán acá.',
  },
}

const PRIVATE_LEGACY_TERMS = [
  'nota',
  'devolucion',
  'devolución',
  'evaluacion',
  'evaluación',
  'observacion',
  'observación',
  'seguimiento',
  'ficha digital',
  'toma 1',
  'toma 2',
  'toma 3',
  'toma de tiempo',
  'calificacion',
  'calificación',
]

function loadSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('pr_user') || '{}')
  } catch {
    return {}
  }
}

function clean(value) {
  return String(value || '').trim()
}

function lower(value) {
  return clean(value).toLocaleLowerCase('es-UY')
}

function getProfileName(profile = {}) {
  const firstName = clean(
    profile.nombre ||
      profile.nombres ||
      profile.first_name ||
      profile.name
  )

  const lastName = clean(
    profile.apellido ||
      profile.apellidos ||
      profile.last_name
  )

  const fullName = clean(
    profile.nombre_completo ||
      profile.full_name ||
      profile.display_name
  )

  if (fullName) return fullName
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

function getProfilePhoto(profile = {}) {
  return (
    profile.foto ||
    profile.foto_url ||
    profile.avatar_url ||
    profile.photo_url ||
    profile.imagen ||
    ''
  )
}

function getProfileVerified(profile = {}) {
  return Boolean(
    profile.verificado ||
      profile.verified ||
      profile.es_verificado
  )
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
  })
}

function formatRelativeDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const difference = Date.now() - date.getTime()
  const minutes = Math.floor(difference / 60000)
  const hours = Math.floor(difference / 3600000)
  const days = Math.floor(difference / 86400000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours} h`
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`

  return formatDate(value)
}

function getInitials(name) {
  if (!name) return 'PR'

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(
    0,
    Math.round(Number(totalSeconds) || 0)
  )

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} h ${minutes ? `${minutes} min` : ''}`.trim()
  }

  return `${minutes} min`
}

function formatDistance(meters) {
  const km = Math.max(0, Number(meters) || 0) / 1000

  return `${km.toLocaleString('es-UY', {
    minimumFractionDigits: km < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  })} km`
}

function formatSpeed(metersPerSecond) {
  const value = Number(metersPerSecond) || 0
  if (!value) return '—'

  return `${(value * 3.6).toFixed(1)} km/h`
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

  if (type === 'cumpleanos' || type === 'cumpleaños') {
    return 'Cumpleaños'
  }

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
    `${item.tipo || ''} ${item.titulo || ''} ${
      item.categoria || ''
    } ${item.subtipo || ''}`
  )

  if (
    PRIVATE_LEGACY_TERMS.some((term) =>
      combined.includes(term)
    )
  ) {
    return false
  }

  const type = resolveLegacyType(item)

  return [
    'Publicación',
    'Entrenamiento',
    'Cumpleaños',
    'Insignia',
    'Evento',
  ].includes(type)
}

function findProfile(profilesByAnyId, id) {
  if (!id) return {}
  return profilesByAnyId.get(String(id)) || {}
}

function normalizeActivity(activity, profilesByAnyId) {
  const profile = findProfile(
    profilesByAnyId,
    activity.alumno_id
  )

  const name = getProfileName(profile)

  return {
    id: `training-${activity.id}`,
    rawId: activity.id,
    type: 'Entrenamiento',
    date:
      activity.fecha_inicio ||
      activity.created_at ||
      activity.creado_en ||
      new Date().toISOString(),
    title: activity.nombre || 'Entrenamiento sobre ruedas',
    description:
      activity.descripcion ||
      'Nueva actividad sincronizada con la comunidad Punta Rollers.',
    userId: activity.alumno_id,
    userName:
      name ||
      activity.alumno_nombre ||
      activity.nombre_alumno ||
      'Integrante PR',
    userPhoto:
      getProfilePhoto(profile) ||
      activity.alumno_foto ||
      activity.foto_alumno ||
      '',
    verified: getProfileVerified(profile),
    source: activity.fuente || 'strava',
    distanceMeters: Number(activity.distancia_metros) || 0,
    durationSeconds:
      Number(activity.tiempo_movimiento_segundos) ||
      Number(activity.duracion_segundos) ||
      0,
    averageSpeed:
      Number(activity.velocidad_media_ms) ||
      Number(activity.velocidad_promedio_ms) ||
      0,
    stravaUrl: activity.strava_url || '',
    featured: Boolean(
      activity.destacada || activity.featured
    ),
  }
}

function buildEventDate(item) {
  const rawDate =
    item.fecha_evento ||
    item.fecha ||
    item.inicio ||
    item.starts_at ||
    item.created_at ||
    item.creado_en ||
    ''

  if (!rawDate) return null

  const rawTime = clean(
    item.hora_evento ||
      item.hora ||
      item.hora_inicio ||
      item.start_time
  )

  const dateText = String(rawDate)
  const alreadyHasTime = /T\d{2}:\d{2}/.test(dateText)
  const candidate =
    rawTime && !alreadyHasTime
      ? `${dateText.slice(0, 10)}T${rawTime.slice(0, 5)}:00`
      : dateText

  const date = new Date(candidate)
  return Number.isNaN(date.getTime()) ? null : date
}

function isVisibleEvent(item) {
  if (resolveLegacyType(item) !== 'Evento') return true

  const eventDate = buildEventDate(item)
  if (!eventDate) return true

  const graceMinutes = Math.max(
    0,
    Number(item.minutos_visible_despues) || 5
  )

  return Date.now() <= eventDate.getTime() + graceMinutes * 60000
}

function normalizeLegacyItem(item, profilesByAnyId) {
  const recipientProfile = findProfile(
    profilesByAnyId,
    item.alumno_id
  )

  const recipientName = getProfileName(recipientProfile)
  const type = resolveLegacyType(item)
  const eventDate = type === 'Evento' ? buildEventDate(item) : null

  return {
    id: `legacy-${item.id}`,
    rawId: item.id,
    type,
    date:
      eventDate?.toISOString() ||
      item.fecha ||
      item.created_at ||
      item.creado_en ||
      new Date().toISOString(),
    title: item.titulo || 'Novedad Punta Rollers',
    description: item.descripcion || '',
    userId: item.alumno_id,
    userName:
      recipientName ||
      item.alumno_nombre ||
      item.nombre_alumno ||
      'Integrante PR',
    userPhoto:
      getProfilePhoto(recipientProfile) ||
      item.alumno_foto ||
      item.foto_alumno ||
      '',
    verified: getProfileVerified(recipientProfile),
    creatorName:
      item.creado_por_nombre ||
      item.otorgado_por_nombre ||
      'Equipo Punta Rollers',
    featured: Boolean(item.destacada),
    eventLocation:
      item.lugar || item.ubicacion || item.location || '',
    eventUrl:
      item.link || item.enlace || item.url || '',
  }
}



const DEFAULT_ROLLER_EVENTS = [
  {
    titulo: 'Morning on Street by PR',
    descripcion:
      'Rodada exclusiva de 19 km hacia La Barra, ida y vuelta. Nos concentramos a las 10:00 en la Parada 2 y, al finalizar, nos vamos a almorzar todos juntos.',
    inicio: '2026-07-26T13:00:00.000Z',
    fin: '2026-07-26T15:00:00.000Z',
    mes_referencia: '',
    lugar: 'Parada 2, La Brava',
    link: '',
    color: 'street',
    estado: 'Publicado',
    visible_feed: true,
    creado_por_nombre: 'Equipo Punta Rollers',
  },
  {
    titulo: 'Primera Clínica de Patinaje con Miguel Flores',
    descripcion:
      'Tres jornadas intensivas de 2 horas cada una junto a Miguel Flores, argentino, subcampeón mundial máster y especialista con más de 40 años de experiencia. Horarios y ubicación a confirmar.',
    inicio: '2026-09-04T03:00:00.000Z',
    fin: '2026-09-07T02:59:00.000Z',
    mes_referencia:
      'Viernes 4, sábado 5 y domingo 6 de septiembre · horario a confirmar',
    lugar: 'Ubicación a confirmar',
    link: '',
    color: 'violet',
    estado: 'Publicado',
    visible_feed: true,
    creado_por_nombre: 'Equipo Punta Rollers',
  },
  {
    titulo: 'Segunda Clínica de Patinaje con Miguel Flores',
    descripcion:
      'En octubre volvemos a entrenar junto a Miguel Flores en una nueva clínica intensiva de patinaje. Próximamente anunciaremos las fechas, los horarios y la ubicación.',
    inicio: null,
    fin: null,
    mes_referencia: 'Octubre 2026 · fechas a confirmar',
    lugar: 'Ubicación a confirmar',
    link: '',
    color: 'electric',
    estado: 'Próximamente',
    visible_feed: true,
    creado_por_nombre: 'Equipo Punta Rollers',
  },
]


function normalizeEventTitle(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('es-UY')
}

function getDefaultRollerEvents() {
  return DEFAULT_ROLLER_EVENTS.map((event, index) => ({
    id: `default-event-${index + 1}`,
    created_at: event.inicio || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _isFallback: true,
    ...event,
  }))
}

function mergeRollerEvents(databaseEvents = []) {
  const byTitle = new Map(
    (databaseEvents || []).map((event) => [
      normalizeEventTitle(event.titulo),
      event,
    ])
  )

  const merged = getDefaultRollerEvents().map((fallback) => {
    const databaseVersion = byTitle.get(
      normalizeEventTitle(fallback.titulo)
    )

    if (databaseVersion) {
      byTitle.delete(normalizeEventTitle(fallback.titulo))
      return databaseVersion
    }

    return fallback
  })

  return [...merged, ...byTitle.values()]
}

const ROLLER_EVENT_COLORS = {
  street: {
    card: 'from-[#2a0d0d] via-[#101014] to-[#27120b]',
    border: 'border-red-400/25',
    accent: 'text-red-200',
    glow: 'bg-red-500/15',
  },
  violet: {
    card: 'from-[#25103b] via-[#17101f] to-[#09090d]',
    border: 'border-fuchsia-300/25',
    accent: 'text-fuchsia-200',
    glow: 'bg-fuchsia-500/15',
  },
  electric: {
    card: 'from-[#0b2141] via-[#0d1724] to-[#08090d]',
    border: 'border-cyan-300/25',
    accent: 'text-cyan-200',
    glow: 'bg-cyan-500/15',
  },
  gold: {
    card: 'from-[#2b2008] via-[#15130d] to-[#08080b]',
    border: 'border-amber-300/25',
    accent: 'text-amber-200',
    glow: 'bg-amber-500/15',
  },
  green: {
    card: 'from-[#0b2c22] via-[#0d1814] to-[#08090b]',
    border: 'border-emerald-300/25',
    accent: 'text-emerald-200',
    glow: 'bg-emerald-500/15',
  },
}

function getRollerEventStatus(event) {
  if (event.estado === 'Cancelado') return 'Cancelado'
  if (!event.inicio) return 'Próximamente'

  const start = new Date(event.inicio).getTime()
  const end = event.fin ? new Date(event.fin).getTime() : start
  const now = Date.now()

  if (Number.isNaN(start)) return 'Próximamente'
  if (now < start) return 'Publicado'
  if (now <= end + 5 * 60000) return 'En curso'
  return 'Finalizado'
}

function isVisibleRollerEvent(event) {
  if (!event || event.visible_feed === false || event.estado === 'Cancelado') {
    return false
  }

  if (!event.inicio) return true

  const end = event.fin
    ? new Date(event.fin).getTime()
    : new Date(event.inicio).getTime()

  if (Number.isNaN(end)) return true
  return Date.now() <= end + 5 * 60000
}

function formatRollerEventRange(event) {
  if (event.mes_referencia) return event.mes_referencia
  if (!event.inicio) return 'Fecha a confirmar'

  const start = new Date(event.inicio)
  const end = event.fin ? new Date(event.fin) : null

  const startText = start.toLocaleString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (!end || Number.isNaN(end.getTime())) return startText

  const sameDay = start.toDateString() === end.toDateString()
  const endText = end.toLocaleString('es-UY', {
    weekday: sameDay ? undefined : 'long',
    day: sameDay ? undefined : 'numeric',
    month: sameDay ? undefined : 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${startText} · hasta ${endText}`
}

function normalizeRollerEvent(event) {
  return {
    id: `roller-event-${event.id}`,
    rawId: event.id,
    type: 'Evento',
    date: event.inicio || event.created_at || new Date().toISOString(),
    title: event.titulo || 'Evento Punta Rollers',
    description: event.descripcion || '',
    eventLocation: event.lugar || '',
    eventUrl: event.link || '',
    eventColor: event.color || 'street',
    eventStatus: getRollerEventStatus(event),
    eventRange: formatRollerEventRange(event),
    creatorName: event.creado_por_nombre || 'Equipo Punta Rollers',
    featured: true,
  }
}


function getBirthdayParts(profile = {}) {
  const directMonth = Number(profile.cumple_mes)
  const directDay = Number(profile.cumple_dia)

  if (directMonth && directDay) {
    return { month: directMonth, day: directDay }
  }

  const value =
    profile.fecha_nacimiento ||
    profile.fechaNacimiento ||
    profile.birth_date ||
    profile.birthday ||
    ''

  if (!value) return null

  const match = String(value).match(/^(?:\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return {
      month: Number(match[1]),
      day: Number(match[2]),
    }
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
}

function getUpcomingBirthday(month, day, today) {
  const currentYear = today.getFullYear()
  let birthdayDate = new Date(currentYear, month - 1, day, 12, 0, 0)

  if (
    birthdayDate.getMonth() !== month - 1 ||
    birthdayDate.getDate() !== day
  ) {
    return null
  }

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
    0,
    0
  )

  if (birthdayDate < todayDate) {
    birthdayDate = new Date(currentYear + 1, month - 1, day, 12, 0, 0)
  }

  const daysUntil = Math.round(
    (birthdayDate.getTime() - todayDate.getTime()) /
      (24 * 60 * 60 * 1000)
  )

  return {
    date: birthdayDate,
    daysUntil,
  }
}

function buildBirthdayPosts(profiles) {
  const today = new Date()

  return (profiles || [])
    .map((profile) => {
      const birthday = getBirthdayParts(profile)
      if (!birthday) return null

      const upcoming = getUpcomingBirthday(
        birthday.month,
        birthday.day,
        today
      )

      if (!upcoming || upcoming.daysUntil > 5) {
        return null
      }

      const name =
        getProfileName(profile) || 'un integrante PR'

      const isToday = upcoming.daysUntil === 0
      const isTomorrow = upcoming.daysUntil === 1

      const title = isToday
        ? `¡Hoy cumple años ${name}!`
        : isTomorrow
          ? `¡Mañana cumple años ${name}!`
          : `En ${upcoming.daysUntil} días cumple años ${name}`

      const description = isToday
        ? 'Toda la comunidad Punta Rollers le desea un día increíble. Celebremos juntos. 🎉'
        : 'Se acerca una fecha especial para nuestra comunidad. 🎈'

      return {
        id: `birthday-${profile.id}-${upcoming.date.getFullYear()}`,
        type: 'Cumpleaños',
        date: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          8,
          Math.min(upcoming.daysUntil, 5),
          0
        ).toISOString(),
        birthdayDate: upcoming.date.toISOString(),
        daysUntil: upcoming.daysUntil,
        title,
        description,
        userId: profile.id,
        userName: name,
        userPhoto: getProfilePhoto(profile),
        verified: getProfileVerified(profile),
        featured: isToday,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

export default function Activity() {
  const { user } = useAuth()
  const savedUser = loadSavedUser()

  const profileId = user?.id || savedUser?.id || ''

  const [activities, setActivities] = useState([])
  const [legacyItems, setLegacyItems] = useState([])
  const [events, setEvents] = useState(() => getDefaultRollerEvents())
  const [profiles, setProfiles] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  const initialSyncDone = useRef(false)

  async function syncStrava() {
    if (!profileId) {
      return {
        skipped: true,
        newActivities: 0,
      }
    }

    try {
      setSyncing(true)

      const { data, error } =
        await supabase.functions.invoke('strava-auth', {
          body: {
            action: 'sync',
            profile_id: profileId,
          },
        })

      const responseCode = clean(
        data?.code || data?.error_code || data?.status
      ).toUpperCase()

      if (
        responseCode === 'STRAVA_NOT_CONNECTED' ||
        responseCode === 'NOT_CONNECTED' ||
        data?.connected === false
      ) {
        return {
          notConnected: true,
          newActivities: 0,
        }
      }

      if (error) {
        throw new Error(
          data?.error ||
            error.message ||
            'No se pudo sincronizar Strava.'
        )
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      return {
        success: Boolean(data?.success),
        newActivities:
          Number(data?.new_activities) || 0,
      }
    } catch (error) {
      return {
        error: true,
        errorMessage:
          error?.message ||
          'No se pudo sincronizar Strava.',
        newActivities: 0,
      }
    } finally {
      setSyncing(false)
    }
  }

  async function loadFeed({
    silent = false,
    preserveMessage = false,
  } = {}) {
    if (!silent) setLoading(true)
    if (!preserveMessage) setMessage('')

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
        .limit(100),

      supabase
        .from('actividad_pr')
        .select('*')
        .or('eliminado.is.null,eliminado.eq.false')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('rollerfeed_events')
        .select('*'),
    ])

    if (profilesResponse.error) {
      setMessage(
        `No pudimos cargar todos los perfiles: ${profilesResponse.error.message}`
      )
    }

    if (activitiesResponse.error) {
      setActivities([])
      setMessage(
        `No pudimos cargar los entrenamientos: ${activitiesResponse.error.message}`
      )
    } else {
      setActivities(
        (activitiesResponse.data || []).filter(
          isPublicTraining
        )
      )
    }

    if (legacyResponse.error) {
      setLegacyItems([])
      setMessage((current) =>
        current ||
        `No pudimos cargar todas las novedades: ${legacyResponse.error.message}`
      )
    } else {
      setLegacyItems(
        (legacyResponse.data || []).filter(
          (item) =>
            isPublicLegacyItem(item) &&
            isVisibleEvent(item)
        )
      )
    }

    if (eventsResponse.error) {
      setEvents(
        getDefaultRollerEvents()
          .filter(
            (event) =>
              event.estado !== 'Cancelado' &&
              event.visible_feed !== false
          )
          .filter(isVisibleRollerEvent)
      )
      setMessage((current) =>
        current ||
        `Los eventos oficiales se cargaron desde el respaldo de la app. Supabase respondió: ${eventsResponse.error.message}`
      )
    } else {
      const loadedEvents = mergeRollerEvents(eventsResponse.data || [])

      setEvents(
        loadedEvents
          .filter(
            (event) =>
              event.estado !== 'Cancelado' &&
              event.visible_feed !== false
          )
          .filter(isVisibleRollerEvent)
      )
    }

    setProfiles(profilesResponse.data || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    if (initialSyncDone.current) return

    initialSyncDone.current = true
    let active = true

    async function initializeFeed() {
      setLoading(true)

      const syncResult = await syncStrava()

      if (!active) return

      await loadFeed({
        silent: true,
        preserveMessage: true,
      })

      if (!active) return

      if (syncResult.newActivities > 0) {
        setMessage(
          syncResult.newActivities === 1
            ? '⚡ Se agregó 1 actividad nueva de Strava al RollerFeed.'
            : `⚡ Se agregaron ${syncResult.newActivities} actividades nuevas de Strava al RollerFeed.`
        )
      } else if (syncResult.error) {
        setMessage(
          `El RollerFeed se cargó, pero Strava no pudo actualizarse: ${syncResult.errorMessage}`
        )
      }
    }

    initializeFeed()

    return () => {
      active = false
    }
  }, [profileId])

  const profilesByAnyId = useMemo(() => {
    const map = new Map()

    profiles.forEach((profile) => {
      if (profile.id) {
        map.set(String(profile.id), profile)
      }

      if (profile.auth_user_id) {
        map.set(String(profile.auth_user_id), profile)
      }
    })

    return map
  }, [profiles])

  const feedItems = useMemo(() => {
    const trainingPosts = activities.map((activity) =>
      normalizeActivity(activity, profilesByAnyId)
    )

    const communityPosts = legacyItems.map((item) =>
      normalizeLegacyItem(item, profilesByAnyId)
    )

    const birthdays = buildBirthdayPosts(profiles)
    const eventPosts = events.map(normalizeRollerEvent)

    return [
      ...birthdays,
      ...eventPosts,
      ...trainingPosts,
      ...communityPosts,
    ].sort(
      (a, b) =>
        new Date(b.date || 0).getTime() -
        new Date(a.date || 0).getTime()
    )
  }, [
    activities,
    legacyItems,
    events,
    profiles,
    profilesByAnyId,
  ])

  const visibleItems = useMemo(() => {
    if (filter === 'Todos') {
      return feedItems.filter(
        (item) => item.type !== 'Insignia'
      )
    }

    return feedItems.filter(
      (item) => item.type === filter
    )
  }, [feedItems, filter])

  const communityStats = useMemo(() => {
    const totalMeters = activities.reduce(
      (sum, item) =>
        sum + (Number(item.distancia_metros) || 0),
      0
    )

    const uniqueSkaters = new Set(
      activities
        .map((item) => item.alumno_id)
        .filter(Boolean)
    ).size

    return {
      activities: activities.length,
      kilometers: totalMeters / 1000,
      skaters: uniqueSkaters,
    }
  }, [activities])

  const myLatest = useMemo(() => {
    const currentProfile = profilesByAnyId.get(
      String(profileId)
    )

    const validIds = new Set(
      [
        profileId,
        currentProfile?.id,
        currentProfile?.auth_user_id,
      ]
        .filter(Boolean)
        .map(String)
    )

    return (
      activities.find((activity) =>
        validIds.has(String(activity.alumno_id))
      ) || null
    )
  }, [activities, profileId, profilesByAnyId])

  async function refreshFeed() {
    if (refreshing || syncing) return

    setRefreshing(true)
    setMessage('Actualizando RollerFeed…')

    const syncResult = await syncStrava()

    await loadFeed({
      silent: true,
      preserveMessage: true,
    })

    if (syncResult.newActivities > 0) {
      setMessage(
        syncResult.newActivities === 1
          ? '⚡ Se agregó 1 actividad nueva de Strava al RollerFeed.'
          : `⚡ Se agregaron ${syncResult.newActivities} actividades nuevas de Strava al RollerFeed.`
      )
      return
    }

    if (syncResult.error) {
      setMessage(
        `El feed se actualizó, pero Strava respondió con un error: ${syncResult.errorMessage}`
      )
      return
    }

    if (syncResult.notConnected) {
      const currentProfile = profilesByAnyId.get(
        String(profileId)
      )

      const validIds = new Set(
        [
          profileId,
          currentProfile?.id,
          currentProfile?.auth_user_id,
        ]
          .filter(Boolean)
          .map(String)
      )

      const alreadyHasStravaActivity = activities.some(
        (activity) =>
          lower(activity.fuente) === 'strava' &&
          validIds.has(String(activity.alumno_id))
      )

      setMessage(
        alreadyHasStravaActivity
          ? 'El RollerFeed se actualizó, pero Strava no pudo sincronizar esta vez. Tu vinculación existe; volvé a intentar en unos segundos.'
          : '✓ RollerFeed actualizado. Este perfil todavía no tiene Strava conectado.'
      )
      return
    }

    setMessage(
      '✓ RollerFeed y Strava están al día. No encontramos actividades nuevas.'
    )
  }

  const emptyState =
    EMPTY_STATES[filter] || EMPTY_STATES.Todos

  return (
    <AppLayout title="RollerFeed ⚡️">
      <div className="pr-page space-y-5 animate-page-enter">
        <section className="relative overflow-hidden rounded-[34px] border border-orange-300/20 bg-gradient-to-br from-[#ff5a1f]/25 via-[#16100f] to-[#08080c] p-5 shadow-[0_28px_90px_rgba(249,115,22,0.14)]">
          <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-orange-200 text-[9px] font-bold uppercase tracking-[0.17em]">
                    La comunidad está rodando
                  </span>
                </div>

                <h1 className="font-display text-[38px] leading-none text-white mt-4">
                  RollerFeed ⚡️
                </h1>

                <p className="text-white/48 text-sm mt-3 leading-relaxed max-w-[290px]">
                  Entrenamientos, logros, eventos y momentos que nos hacen sentir parte de Punta Rollers.
                </p>
              </div>

              <div className="w-16 h-16 rounded-[23px] border border-orange-300/25 bg-orange-400/10 grid place-items-center text-3xl shrink-0">
                🛼
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-5">
              <HeroStat
                value={communityStats.activities}
                label="Actividades"
              />
              <HeroStat
                value={communityStats.kilometers.toLocaleString(
                  'es-UY',
                  { maximumFractionDigits: 0 }
                )}
                label="Km rodados"
                highlight
              />
              <HeroStat
                value={communityStats.skaters}
                label="Patinadores"
              />
            </div>
          </div>
        </section>

        {myLatest && (
          <section className="rounded-[26px] border border-pr-gold/20 bg-gradient-to-r from-pr-gold/10 via-white/[0.025] to-orange-400/[0.06] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="section-label text-pr-gold">
                  Tu última actividad
                </p>
                <p className="text-white text-sm font-semibold mt-2 truncate">
                  {myLatest.nombre || 'Entrenamiento'}
                </p>
                <p className="text-white/35 text-[10px] mt-1">
                  {formatDistance(
                    myLatest.distancia_metros
                  )}{' '}
                  ·{' '}
                  {formatDuration(
                    myLatest.tiempo_movimiento_segundos
                  )}
                </p>
              </div>

              {myLatest.strava_url ? (
                <a
                  href={myLatest.strava_url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-2xl border border-pr-gold/20 bg-pr-gold/10 px-3 py-2.5 text-pr-gold text-[10px] font-bold"
                >
                  Ver actividad →
                </a>
              ) : (
                <span className="shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-white/30 text-[10px] font-bold">
                  Actividad guardada
                </span>
              )}
            </div>
          </section>
        )}

        <section className="overflow-x-auto -mx-[18px] px-[18px]">
          <div className="flex gap-2 min-w-max">
            {FEED_FILTERS.map((item) => {
              const active = filter === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold border transition ${
                    active
                      ? 'bg-gradient-to-r from-pr-gold to-orange-300 text-black border-pr-gold'
                      : 'bg-white/[0.03] text-white/45 border-white/[0.07]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <p className="section-label">
                Comunidad PR
              </p>

              <h2 className="font-display text-[27px] text-white mt-1">
                {filter === 'Todos'
                  ? 'Lo último sobre ruedas'
                  : filter === 'Cumpleaños'
                    ? 'Cumpleaños'
                    : FEED_FILTERS.find(
                        (item) => item.key === filter
                      )?.label}
              </h2>
            </div>

            <button
              type="button"
              disabled={refreshing || syncing}
              onClick={refreshFeed}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-white/45 text-[10px] font-bold disabled:opacity-50"
            >
              {refreshing || syncing
                ? 'Actualizando…'
                : '↻ Actualizar'}
            </button>
          </div>

          {message && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100 text-xs leading-relaxed mb-3">
              {message}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <LoadingFeedCard />
              <LoadingFeedCard />
              <LoadingFeedCard />
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="space-y-4">
              {visibleItems.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[30px] border border-white/[0.07] bg-white/[0.025] p-7 text-center">
              <div className="w-16 h-16 rounded-[22px] grid place-items-center mx-auto bg-orange-400/10 border border-orange-300/20 text-3xl">
                {emptyState.icon}
              </div>

              <h3 className="font-display text-2xl text-white mt-4">
                {emptyState.title}
              </h3>

              <p className="text-white/35 text-sm mt-2 leading-relaxed">
                {emptyState.description}
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}

function HeroStat({
  value,
  label,
  highlight = false,
}) {
  return (
    <div className="rounded-[21px] border border-white/[0.08] bg-black/25 p-3 text-center">
      <p
        className={`font-display text-[25px] leading-none ${
          highlight ? 'text-orange-300' : 'text-white'
        }`}
      >
        {value}
      </p>

      <p className="text-white/30 text-[8px] uppercase tracking-[0.13em] mt-2">
        {label}
      </p>
    </div>
  )
}

function FeedCard({ item }) {
  if (item.type === 'Cumpleaños') {
    return <BirthdayCard item={item} />
  }

  if (item.type === 'Entrenamiento') {
    return <TrainingCard item={item} />
  }

  if (item.type === 'Evento' && item.eventColor) {
    return <EventCard item={item} />
  }

  return <CommunityCard item={item} />
}

function ProfileAvatar({
  photo,
  name,
  verified = false,
  size = 'normal',
}) {
  const classes =
    size === 'large'
      ? 'w-14 h-14 rounded-[19px]'
      : 'w-11 h-11 rounded-[16px]'

  return (
    <div className="relative shrink-0">
      <div
        className={`${classes} overflow-hidden border border-white/[0.10] bg-pr-gold/10 grid place-items-center`}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-pr-gold font-bold">
            {getInitials(name)}
          </span>
        )}
      </div>

      {verified && (
        <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-sky-500 border-[2px] border-[#111117] grid place-items-center text-white text-[9px] font-bold">
          ✓
        </span>
      )}
    </div>
  )
}

function TrainingCard({ item }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[30px] border bg-gradient-to-br from-[#171217] via-[#101014] to-[#09090d] ${
        item.featured
          ? 'border-pr-gold/30 shadow-[0_22px_65px_rgba(212,175,55,0.09)]'
          : 'border-white/[0.08]'
      }`}
    >
      <div className="relative p-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            photo={item.userPhoto}
            name={item.userName}
            verified={item.verified}
          />

          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-bold truncate">
              {item.userName}
            </p>

            <p className="text-white/30 text-[10px] mt-1">
              {formatRelativeDate(item.date)} ·{' '}
              {item.source === 'strava'
                ? 'Strava'
                : 'Punta Rollers'}
            </p>
          </div>

          <span className="w-10 h-10 rounded-2xl border border-orange-300/15 bg-orange-400/10 grid place-items-center text-lg">
            🛼
          </span>
        </div>

        <div className="mt-4">
          <p className="section-label text-orange-200">
            Entrenamiento
          </p>

          <h3 className="font-display text-[26px] leading-tight text-white mt-2">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-white/43 text-sm leading-relaxed mt-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Metric
            label="Distancia"
            value={formatDistance(item.distanceMeters)}
            highlight
          />
          <Metric
            label="Tiempo"
            value={formatDuration(item.durationSeconds)}
          />
          <Metric
            label="Velocidad"
            value={formatSpeed(item.averageSpeed)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Reaction icon="👏" value={0} />
            <Reaction icon="🔥" value={0} />
            <Reaction icon="❤️" value={0} />
          </div>

          {item.stravaUrl && (
            <a
              href={item.stravaUrl}
              target="_blank"
              rel="noreferrer"
              className="text-orange-200 text-[10px] font-bold"
            >
              Ver en Strava →
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function BirthdayCard({ item }) {
  return (
    <article className="relative overflow-hidden rounded-[32px] border border-fuchsia-300/25 bg-gradient-to-br from-fuchsia-500/[0.18] via-[#17101c] to-[#0b090d] p-5">
      <div className="flex items-start justify-between gap-4">
        <ProfileAvatar
          photo={item.userPhoto}
          name={item.userName}
          verified={item.verified}
          size="large"
        />

        <div className="w-14 h-14 rounded-[20px] border border-fuchsia-300/25 bg-fuchsia-400/15 grid place-items-center text-2xl">
          🎂
        </div>
      </div>

      <p className="section-label text-fuchsia-200 mt-5">
        {item.daysUntil === 0
          ? 'Celebración PR'
          : 'Próximo cumpleaños'}
      </p>

      <h3 className="font-display text-[29px] leading-tight text-white mt-2">
        {item.title}
      </h3>

      <p className="text-fuchsia-100/55 text-sm leading-relaxed mt-3">
        {item.description}
      </p>
    </article>
  )
}


function EventCard({ item }) {
  const color =
    ROLLER_EVENT_COLORS[item.eventColor] || ROLLER_EVENT_COLORS.street

  return (
    <article
      className={`relative overflow-hidden rounded-[32px] border ${color.border} bg-gradient-to-br ${color.card} p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]`}
    >
      <div className={`absolute -right-14 -top-16 w-48 h-48 rounded-full ${color.glow} blur-3xl`} />
      <div className="absolute left-0 top-0 h-full w-[3px] bg-white/20" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${color.accent}`}>
            Evento Punta Rollers
          </p>

          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/70 text-[9px] font-bold">
            {item.eventStatus}
          </span>
        </div>

        <h3 className="font-display text-[30px] leading-[0.98] text-white mt-4">
          {item.title}
        </h3>

        <p className="text-white/58 text-xs leading-relaxed mt-4">
          🗓️ {item.eventRange}
        </p>

        {item.eventLocation && (
          <p className="text-white/58 text-xs mt-2">
            📍 {item.eventLocation}
          </p>
        )}

        {item.description && (
          <p className="text-white/48 text-sm leading-relaxed mt-4">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-white/[0.09]">
          <p className="text-white/28 text-[9px]">
            Publicado por {item.creatorName}
          </p>

          {item.eventUrl && (
            <a
              href={item.eventUrl}
              target="_blank"
              rel="noreferrer"
              className={`text-[10px] font-bold ${color.accent}`}
            >
              Más información →
            </a>
          )}
        </div>
      </div>
    </article>
  )
}


function CommunityCard({ item }) {
  const isBadge = item.type === 'Insignia'
  const isEvent = item.type === 'Evento'

  const icon = isBadge
    ? '🏅'
    : isEvent
      ? '📅'
      : '📣'

  return (
    <article className="rounded-[29px] border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-white/[0.018] p-4">
      <div className="flex items-center gap-3">
        <ProfileAvatar
          photo={item.userPhoto}
          name={item.userName}
          verified={item.verified}
        />

        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-bold truncate">
            {item.userName}
          </p>

          <p className="text-white/28 text-[10px] mt-1">
            {formatRelativeDate(item.date)}
          </p>
        </div>

        <div className="w-11 h-11 rounded-[17px] border border-white/[0.08] bg-white/[0.04] grid place-items-center text-xl">
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <p className="section-label text-pr-gold">
          {item.type}
        </p>

        <h3 className="font-display text-[24px] leading-tight text-white mt-2">
          {item.title}
        </h3>

        {item.description && (
          <p className="text-white/43 text-sm leading-relaxed mt-3">
            {item.description}
          </p>
        )}
      </div>

      {isEvent && (item.eventLocation || item.eventUrl) && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
          {item.eventLocation && (
            <p className="text-white/45 text-xs">
              📍 {item.eventLocation}
            </p>
          )}

          {item.eventUrl && (
            <a
              href={item.eventUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-pr-gold text-xs font-bold"
            >
              Ver información →
            </a>
          )}
        </div>
      )}

      {item.creatorName && (
        <p className="text-white/28 text-[9px] text-right mt-4 pt-4 border-t border-white/[0.06]">
          {isBadge ? 'Otorgada por' : 'Publicado por'}{' '}
          {item.creatorName}
        </p>
      )}
    </article>
  )
}

function Metric({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-black/25 p-3 text-center min-w-0">
      <p className="text-white/25 text-[8px] uppercase tracking-wider">
        {label}
      </p>

      <p
        className={`text-[12px] font-bold mt-1 truncate ${
          highlight ? 'text-orange-300' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Reaction({ icon, value }) {
  return (
    <button
      type="button"
      className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-white/55 text-[10px] font-semibold"
    >
      {icon} {value}
    </button>
  )
}

function LoadingFeedCard() {
  return (
    <div className="rounded-[30px] border border-white/[0.07] bg-white/[0.025] p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-[16px] bg-white/[0.05]" />

        <div className="flex-1">
          <div className="w-32 h-4 rounded-full bg-white/[0.05]" />
          <div className="w-20 h-3 rounded-full bg-white/[0.04] mt-2" />
        </div>
      </div>

      <div className="w-3/4 h-7 rounded-lg bg-white/[0.05] mt-5" />
      <div className="w-full h-4 rounded-lg bg-white/[0.04] mt-4" />

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="h-16 rounded-[18px] bg-white/[0.04]" />
        <div className="h-16 rounded-[18px] bg-white/[0.04]" />
        <div className="h-16 rounded-[18px] bg-white/[0.04]" />
      </div>
    </div>
  )
                                         }
