import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import RollerFeedComments from '../components/RollerFeedComments'
import RollerFeedSeasonal from '../components/RollerFeedSeasonal'
import '../styles/rollerfeed-hero.css'
import { loadActiveMoments, timeLeft } from '../lib/moments'
import VerifiedBadge from '../components/VerifiedBadge'
import CommunityPhoto from '../components/community/CommunityPhoto'

const FEED_FILTERS = [
  { key: 'Todos', label: 'Todo' },
  { key: 'Entrenamiento', label: 'Entrenos' },
  { key: 'Evento', label: 'Eventos' },
  { key: 'Votaciones', label: 'Votaciones', target: 'rollerfeed-votaciones' },
  { key: 'Novedades', label: 'Novedades', target: 'rollerfeed-novedades' },
]

const REACTION_OPTIONS = [
  { key: 'aplauso', icon: '👏', label: 'Grande' },
  { key: 'fuego', icon: '🔥', label: 'Motivador' },
  { key: 'corazon', icon: '❤️', label: 'Me encanta' },
  { key: 'amor', icon: '😍', label: 'Increíble' },
]

const DEFAULT_ROLLER_EVENTS = []

function getReactionOption(key) {
  return (
    REACTION_OPTIONS.find((item) => item.key === key) ||
    REACTION_OPTIONS[0]
  )
}

function normalizeEventTitle(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('es-UY')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getDefaultRollerEvents() {
  return DEFAULT_ROLLER_EVENTS.map((event, index) => ({
    id: `default-event-${index + 1}`,
    created_at: event.inicio || new Date().toISOString(),
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
    const key = normalizeEventTitle(fallback.titulo)
    const databaseVersion = byTitle.get(key)

    if (databaseVersion) {
      byTitle.delete(key)
      return databaseVersion
    }

    return fallback
  })

  return [...merged, ...byTitle.values()]
}

const EMPTY_STATES = {
  Todos: {
    icon: '🛼',
    title: 'La pista está tranquila',
    description:
      'Las próximas actividades públicas de la comunidad aparecerán acá.',
  },
  Entrenamiento: {
    icon: '⚡',
    title: 'La próxima vuelta puede abrir el día',
    description:
      'Cuando la comunidad comparta una actividad de Strava, aparecerá acá.',
  },
  Cumpleaños: {
    icon: '🎂',
    title: 'Este mes la pista no sopla velitas',
    description:
      'Acá vas a ver todos los cumpleaños del mes, con tiempo para preparar el festejo.',
  },
  Insignia: {
    icon: '🏅',
    title: 'Todavía no hay logros publicados',
    description:
      'Los movimientos de la comunidad aparecerán acá.',
  },
  Evento: {
    icon: '📅',
    title: 'La próxima cita PR todavía se está armando',
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

  if (type === 'logro') return 'Logro'
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
    'Logro',
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
      item.creado_por_foto ||
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

function isVisibleRollerEvent(event) {
  if (
    !event ||
    event.visible_feed === false ||
    event.estado === 'Cancelado'
  ) {
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
    id: `roller-event-${event.id || normalizeEventTitle(event.titulo)}`,
    rawId: event.id,
    type: 'Evento',
    date: event.inicio || event.created_at || new Date().toISOString(),
    eventStart: event.inicio || null,
    title: event.titulo || 'Evento Punta Rollers',
    description:
      event.descripcion || event.mes_referencia || 'Muy pronto más información.',
    eventLocation: event.lugar || event.ubicacion || '',
    eventUrl: event.link || event.url || '',
    eventRange: formatRollerEventRange(event),
    userName: 'Punta Rollers',
    userPhoto: '',
    verified: true,
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

function buildBirthdayPosts(profiles) {
  const today = new Date()
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
    0,
    0
  )

  return (profiles || [])
    .map((profile) => {
      const birthday = getBirthdayParts(profile)
      if (!birthday) {
        return null
      }

      let birthdayDate = new Date(
        today.getFullYear(),
        birthday.month - 1,
        birthday.day,
        12,
        0,
        0
      )

      if (birthdayDate < todayDate) {
        birthdayDate = new Date(today.getFullYear() + 1, birthday.month - 1, birthday.day, 12, 0, 0)
      }

      if (
        birthdayDate.getMonth() !== birthday.month - 1 ||
        birthdayDate.getDate() !== birthday.day
      ) {
        return null
      }

      const daysUntil = Math.round(
        (birthdayDate.getTime() - todayDate.getTime()) /
          (24 * 60 * 60 * 1000)
      )

      const name =
        getProfileName(profile) || 'un integrante PR'

      const isToday = daysUntil === 0
      const isTomorrow = daysUntil === 1
      const birthdayLabel = birthdayDate.toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
      })

      const title = isToday
        ? `¡Hoy cumple años ${name}!`
        : isTomorrow
          ? `¡Mañana cumple años ${name}!`
          : `${name} cumple el ${birthdayLabel}`

      const description = isToday
        ? 'Toda la comunidad Punta Rollers le desea un día increíble. Celebremos juntos. 🎉'
        : 'Se acerca una fecha especial para nuestra comunidad. Hay tiempo para preparar el saludo. 🎈'

      return {
        id: `birthday-${profile.id}-${birthdayDate.getFullYear()}`,
        type: 'Cumpleaños',
        date: birthdayDate.toISOString(),
        birthdayDate: birthdayDate.toISOString(),
        daysUntil,
        title,
        description,
        userId: profile.id,
        userName: name,
        userPhoto: getProfilePhoto(profile),
        verified: getProfileVerified(profile),
        featured: isToday,
      }
    })
    .filter((item) => item && item.daysUntil >= 0 && item.daysUntil <= 60)
    .sort(
      (a, b) =>
        new Date(a.birthdayDate).getTime() -
        new Date(b.birthdayDate).getTime()
    )
}

export default function Activity() {
  const { user } = useAuth()
  const savedUser = loadSavedUser()

  const profileId = user?.id || savedUser?.id || ''

  const [activities, setActivities] = useState([])
  const [legacyItems, setLegacyItems] = useState([])
  const [socialPosts, setSocialPosts] = useState([])
  const [events, setEvents] = useState(() => getDefaultRollerEvents())
  const [profiles, setProfiles] = useState([])
  const [moments, setMoments] = useState([])
  const [reactions, setReactions] = useState([])
  const [reactionModalItem, setReactionModalItem] = useState(null)
  const [savingReactionKey, setSavingReactionKey] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [feedLimit, setFeedLimit] = useState(6)
  const [expandedHome, setExpandedHome] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  const [stravaConnected, setStravaConnected] = useState(null)
  const initialSyncDone = useRef(false)

  useEffect(() => {
    let active = true
    loadActiveMoments()
      .then((rows) => { if (active) setMoments(rows) })
      .catch((error) => { if (active) setMessage(error?.message || 'No pudimos cargar PR Moments.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!profileId) { setStravaConnected(null); return }
    let active = true
    supabase.from('pr_strava_connections').select('conectado')
      .eq('alumno_id', profileId).maybeSingle()
      .then(({data,error}) => {
        if (active) setStravaConnected(error ? null : Boolean(data?.conectado))
      })
    return () => { active = false }
  }, [profileId])

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
        // Supabase returns a non-2xx error for profiles without a connection.
        // This is an expected state, not a failed RollerFeed load.
        const response = error.context
        let details = null
        try { details = response?.json ? await response.json() : null } catch {}
        const reason = clean(details?.error || data?.error || error.message)
        if (response?.status === 409 && /no conectado|not connected/i.test(reason)) {
          return { notConnected: true, newActivities: 0 }
        }
        throw new Error(reason || 'No se pudo sincronizar Strava.')
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
      reactionsResponse,
      socialResponse,
    ] = await Promise.all([
      supabase.from('profiles_feed').select('*').limit(500),

      supabase
        .from('pr_inline_skate_public_activities')
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

      supabase.from('rollerfeed_events').select('*').limit(100),

      supabase
        .from('rollerfeed_reactions')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(2000),
      supabase.rpc('community_social_feed'),
    ])

    if(socialResponse.error)setMessage('No pudimos cargar las publicaciones: '+socialResponse.error.message)
    else setSocialPosts(Array.isArray(socialResponse.data)?socialResponse.data:[])

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

    const loadedEvents = eventsResponse.error
      ? getDefaultRollerEvents()
      : mergeRollerEvents(eventsResponse.data || [])

    setEvents(loadedEvents.filter(isVisibleRollerEvent))

    if (eventsResponse.error) {
      setMessage((current) =>
        current ||
        'Las clínicas se cargaron desde el respaldo seguro de la app.'
      )
    }

    if (reactionsResponse.error) {
      setReactions([])
      setMessage((current) =>
        current ||
        `Las reacciones no pudieron cargarse: ${reactionsResponse.error.message}`
      )
    } else {
      setReactions(reactionsResponse.data || [])
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
      // RollerFeed reads the activities already stored in production.
      // Strava synchronization is an explicit action (Actualizar), not a
      // blocking request every time someone opens this screen.
      await loadFeed({ silent: false, preserveMessage: false })
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

  const currentProfile = useMemo(
    () => profilesByAnyId.get(String(profileId)) || {},
    [profilesByAnyId, profileId]
  )

  const currentReactionProfileId = currentProfile?.id || profileId || ''

  const reactionsByFeedKey = useMemo(() => {
    const map = new Map()

    reactions.forEach((reaction) => {
      const key = String(reaction.feed_key || '')
      if (!key) return

      const current = map.get(key) || []
      current.push(reaction)
      map.set(key, current)
    })

    return map
  }, [reactions])

  function getItemReactions(item) {
    return reactionsByFeedKey.get(String(item?.id || '')) || []
  }

  async function selectReaction(item, reactionKey) {
    if (!item?.id || !currentReactionProfileId) {
      setMessage('No pudimos identificar tu perfil para guardar la reacción.')
      return
    }

    if (savingReactionKey) return

    const feedKey = String(item.id)
    const requestKey = `${feedKey}-${reactionKey}`
    const existing = reactions.find(
      (reaction) =>
        String(reaction.feed_key) === feedKey &&
        String(reaction.profile_id) === String(currentReactionProfileId)
    )

    setSavingReactionKey(requestKey)
    setMessage('')

    try {
      if (existing?.reaction === reactionKey) {
        const { error } = await supabase
          .from('rollerfeed_reactions')
          .delete()
          .eq('id', existing.id)

        if (error) throw error

        setReactions((current) =>
          current.filter((reaction) => reaction.id !== existing.id)
        )
        return
      }

      const payload = {
        feed_key: feedKey,
        profile_id: String(currentReactionProfileId),
        reaction: reactionKey,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('rollerfeed_reactions')
        .upsert(payload, { onConflict: 'feed_key,profile_id' })
        .select('*')
        .single()

      if (error) throw error

      setReactions((current) => [
        ...current.filter(
          (reaction) =>
            !(
              String(reaction.feed_key) === feedKey &&
              String(reaction.profile_id) ===
                String(currentReactionProfileId)
            )
        ),
        data,
      ])
    } catch (error) {
      setMessage(
        `No pudimos guardar tu reacción: ${
          error?.message || 'error desconocido'
        }`
      )
    } finally {
      setSavingReactionKey('')
    }
  }

  const feedItems = useMemo(() => {
    const trainingPosts = activities.map((activity) =>
      normalizeActivity(activity, profilesByAnyId)
    )

    const eventPosts = events.filter(event => !/cl[ií]nica|miguel flores|caramelo|top ranking|rollerween/i.test([event.titulo,event.descripcion].filter(Boolean).join(' '))).map(normalizeRollerEvent)
    return [
      ...eventPosts,
      ...trainingPosts,
    ].sort(
      (a, b) =>
        new Date(b.date || 0).getTime() -
        new Date(a.date || 0).getTime()
    )
  }, [
    activities,
    events,
    profilesByAnyId,
  ])

  const visibleItems = useMemo(() => {
    if (filter === 'Todos') {
      const available = feedItems.filter(
        (item) =>
          item.type !== 'Insignia' &&
          item.type !== 'Evento' &&
          (item.type !== 'Cumpleaños' || item.daysUntil >= 0)
      )
      // Preserve community posts, but prevent one prolific athlete from monopolizing the first page.
      const selected=[]
      const trainingCounts=new Map()
      const deferred=[]
      for(const item of available){
        if(item.type!=='Entrenamiento'){selected.push(item);continue}
        const id=String(item.userId||item.userName||'unknown')
        const count=trainingCounts.get(id)||0
        if(count<2){selected.push(item);trainingCounts.set(id,count+1)}
        else deferred.push(item)
      }
      return [...selected,...deferred]
    }

    const filteredItems = feedItems.filter(
      (item) => item.type === filter
    )

    if (filter === 'Cumpleaños') {
      return [...filteredItems].sort(
        (a, b) =>
          new Date(a.birthdayDate).getTime() -
          new Date(b.birthdayDate).getTime()
      )
    }

    if (filter === 'Evento') {
      return [...filteredItems].sort((a, b) => {
        if (a.eventStart && b.eventStart) {
          return new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime()
        }
        if (a.eventStart) return -1
        if (b.eventStart) return 1
        return String(a.title).localeCompare(String(b.title), 'es-UY')
      })
    }

    return filteredItems
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
      setStravaConnected(false)
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
        <section className="rf-hero relative overflow-hidden rounded-[30px] border border-[#FF0055]/25 bg-[#0D0303] px-5 py-6 text-center shadow-[0_22px_60px_rgba(0,0,0,.48)] sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,0,85,.08),transparent_65%),radial-gradient(ellipse_at_50%_100%,rgba(187,255,31,.035),transparent_55%)]" />
          <div aria-hidden="true" className="rf-shine" />
          {['a','b','c'].map(position => <span key={position} aria-hidden="true" className={`rf-envelope rf-envelope--${position}`}><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 9 7 9-7"/></svg></span>)}
          <div className="relative z-10">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#FF0055]/30 bg-[#FF0055]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#FF79A5]">
              <span className="rf-heart" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.1 3.4 12.7C-1 8.3 5.1 1.8 10 6.2L12 8l2-1.8c4.9-4.4 11 2.1 6.6 6.5Z"/></svg></span>
              El corazón de Punta Rollers
            </p>
            <h1 className="mt-4 font-display text-[42px] leading-none tracking-tight text-white sm:text-5xl">Roller<span className="text-[#FF0055]">Feed.</span></h1>
            <svg aria-hidden="true" viewBox="0 0 150 22" className="mx-auto mt-2 h-5 w-36 opacity-80"><path className="rf-pulse" d="M1 11h40l7-5 8 12 8-17 9 20 8-10h68"/></svg>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/65">Lo que pasa en Punta Rollers, pasa acá. Seguí en vivo lo que están patinando tus compañeros, compartí sus logros y enterate de todas las novedades de nuestra comunidad.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <HeroStat value={loading ? '—' : communityStats.activities} label="Actividades" />
              <HeroStat value={loading ? '—' : communityStats.kilometers.toLocaleString('es-UY', { maximumFractionDigits: 0 })} label="Km rodados" highlight />
              <HeroStat value={loading ? '—' : communityStats.skaters} label="Patinadores" />
            </div>
          </div>
        </section>

        <nav aria-label="Explorar RollerFeed" className="w-full min-w-0">
          <div className="grid w-full grid-cols-5 gap-1 py-1 sm:gap-2">
            {FEED_FILTERS.map((item) => {
              const active = !item.target && filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    if (item.target) {
                      document.getElementById(item.target)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
                      return
                    }
                    setFilter(item.key)
                    setFeedLimit(item.key === 'Entrenamiento' ? 10 : 6)
                    setExpandedHome(false)
                    document.getElementById('rollerfeed-actividades')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
                  }}
                  className={`min-w-0 rounded-xl border px-0.5 py-2.5 text-center text-[9px] font-bold leading-tight transition-colors sm:rounded-full sm:px-3 sm:text-[11px] ${active ? 'border-[#BBFF1F] bg-[#BBFF1F] text-[#0D0303]' : 'border-white/10 bg-white/[.04] text-white/65 hover:border-[#BBFF1F]/30 hover:text-white'}`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        <RollerFeedTopRanking profilesByAnyId={profilesByAnyId} profileId={profileId} />



        {loading && <RollerFeedLoading syncing={syncing} />}

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



        <div id="rollerfeed-novedades" className="scroll-mt-36"><RollerFeedSeasonal section="news" /></div>

        <section id="rollerfeed-actividades" className="scroll-mt-36">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <p className="section-label">
                Actividad reciente
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

          {stravaConnected === false && profileId && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-400/30 bg-orange-400/[.09] p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-orange-200">🛼 ¡Conectá tu Strava!</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/65">Sumá tus kilómetros al ranking, RollerFeed y a tu evolución. Solo necesitás vincular tu cuenta una vez.</p>
              </div>
              <a href="/app/perfil" className="shrink-0 rounded-xl bg-orange-400 px-4 py-2.5 text-xs font-black text-black">Conectar Strava →</a>
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100 text-xs leading-relaxed mb-3">
              {message}
            </div>
          )}

          {loading ? (
            <div className="space-y-4" aria-hidden="true">
              <LoadingFeedCard />
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="space-y-4">
              {visibleItems.slice(0,filter === 'Todos' && !expandedHome ? 6 : feedLimit).map((item) => (
                <div key={item.id}>
                  <FeedCard
                    item={item}
                    reactions={getItemReactions(item)}
                    profilesByAnyId={profilesByAnyId}
                    currentProfileId={currentReactionProfileId}
                    savingReactionKey={savingReactionKey}
                    onReact={selectReaction}
                    onOpenReactions={() => setReactionModalItem(item)}
                    commentSlot={item.type === 'Entrenamiento' ? <details className="mt-2 rounded-xl border border-white/[.07] bg-black/10 px-3 py-2"><summary className="cursor-pointer text-[11px] font-bold text-[#FF9ABA]">Comentarios · Ver conversación</summary><RollerFeedComments feedKey={item.id} currentProfileId={currentReactionProfileId} canModerate={['admin', 'profesor'].includes(user?.role)} /></details> : null}
                  />
                  {!['Moment','SocialPost','Entrenamiento'].includes(item.type) && <RollerFeedComments feedKey={item.id} currentProfileId={currentReactionProfileId} canModerate={['admin', 'profesor'].includes(user?.role)} />}
                </div>
              ))}
              {visibleItems.length > (filter === 'Todos' && !expandedHome ? 6 : feedLimit) && <button type="button" onClick={() => {setExpandedHome(true);setFeedLimit(n => n + (filter === 'Entrenamiento' ? 10 : 6))}} className="w-full rounded-2xl border border-white/15 bg-white/[.04] px-4 py-3.5 text-xs font-bold text-white/75 transition hover:border-[#FF0055]/40">Ver {Math.min(filter === 'Entrenamiento' ? 10 : 6,visibleItems.length-(filter === 'Todos' && !expandedHome ? 6 : feedLimit))} más · {visibleItems.length-(filter === 'Todos' && !expandedHome ? 6 : feedLimit)} restantes ↓</button>}
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

                <div id="rollerfeed-votaciones" className="scroll-mt-36"><RollerFeedSeasonal section="polls" /></div>


        {reactionModalItem && (
          <ReactionsModal
            item={reactionModalItem}
            reactions={getItemReactions(reactionModalItem)}
            profilesByAnyId={profilesByAnyId}
            onClose={() => setReactionModalItem(null)}
          />
        )}
      </div>
    </AppLayout>
  )
}

function RollerFeedTopRanking({ profilesByAnyId, profileId }) {
  const [period,setPeriod]=useState('month')
  const [rankingRows,setRankingRows]=useState({week:[],month:[]})
  const [rankingLoading,setRankingLoading]=useState(true)
  const [rankingError,setRankingError]=useState('')
  const navigate=useNavigate()
  useEffect(()=>{
    let active=true
    async function loadRanking(){
      setRankingLoading(true);setRankingError('')
      const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]))
      const today=`${parts.year}-${parts.month}-${parts.day}`
      const dayIndex=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday)
      const mondayOffset=dayIndex===0?-6:1-dayIndex
      const monday=new Date(today+'T12:00:00Z')
      monday.setUTCDate(monday.getUTCDate()+mondayOffset)
      const startWeek=monday.toISOString().slice(0,10)
      const startMonth=`${parts.year}-${parts.month}-01`
      const [week,month]=await Promise.all([
        supabase.rpc('pr_get_inline_ranking',{p_start_date:startWeek,p_end_date:today}),
        supabase.rpc('pr_get_inline_ranking',{p_start_date:startMonth,p_end_date:today})
      ])
      if(!active)return
      if(week.error||month.error)setRankingError('No pudimos actualizar la clasificación.')
      else setRankingRows({week:week.data||[],month:month.data||[]})
      setRankingLoading(false)
    }
    loadRanking()
    return ()=>{active=false}
  },[])
  const ranked=useMemo(()=>{
    const rows=[...(rankingRows[period]||[])].map(row=>{
      const id=String(row.alumno_id||'')
      return {id,meters:(Number(row.km)||0)*1000,profile:profilesByAnyId.get(id)||{},sessions:Number(row.sessions)||0}
    }).filter(row=>row.id&&row.meters>0).sort((a,b)=>b.meters-a.meters||b.sessions-a.sessions)
    const withRanks=rows.map((row,i)=>({...row,rank:i+1}))
    const mine=withRanks.find(row=>row.id===String(profileId)||String(row.profile.id||'')===String(profileId)||String(row.profile.auth_user_id||'')===String(profileId))
    const ownProfile=profilesByAnyId.get(String(profileId))||{}
    const ownRow=mine||(profileId?{id:String(ownProfile.id||profileId),meters:0,profile:ownProfile,rank:null}:null)
    return [ownRow,...withRanks.filter(row=>row!==mine)].filter(Boolean).slice(0,5)
  },[rankingRows,period,profilesByAnyId,profileId])
  const max=Math.max(1,...(rankingRows[period]||[]).map(row=>(Number(row.km)||0)*1000))
  const myRank=(rankingRows[period]||[]).findIndex(row=>String(row.alumno_id)===String(profileId)||String(profilesByAnyId.get(String(row.alumno_id))?.auth_user_id||'')===String(profileId))
  const myEntry=myRank>=0?rankingRows[period][myRank]:null
  return <section aria-label="Top Ranking RollerFeed" className="pr-rank-panel relative overflow-hidden rounded-[28px] border border-[#FF0055]/25 bg-gradient-to-br from-[#2a0712] via-[#170910] to-[#0c090e] p-4 sm:p-5">
    <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[#FF0055]/15 blur-3xl"/>
    <div className="relative flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#FF8CAD]">PR · Top Ranking</p><h2 className="mt-1 font-display text-[25px] leading-tight text-white">Así avanzamos juntos</h2></div><span aria-hidden="true" className="pr-rank-medal text-3xl">🏅</span></div>
    <div className="relative mt-4 flex w-fit max-w-full gap-1 rounded-xl border border-white/10 bg-black/30 p-1" role="group" aria-label="Período del ranking">{[['month','Este mes'],['week','Esta semana']].map(([value,label])=><button key={value} type="button" aria-pressed={period===value} onClick={()=>setPeriod(value)} className={'rounded-lg px-3 py-2 text-[11px] font-bold transition-colors '+(period===value?'bg-[#FF0055] text-white':'text-white/60 hover:text-white')}>{label}</button>)}</div>
    {rankingError&&<p role="alert" className="mt-3 text-xs text-red-200">{rankingError}</p>}
    {rankingLoading?<p role="status" className="mt-5 text-xs text-white/60">Cargando clasificación…</p>:rankingError?<p className="mt-5 text-xs text-white/60">La clasificación no está disponible por ahora.</p>:ranked.length?<div className="relative mx-auto mt-5 grid w-full max-w-[520px] grid-cols-5 items-end gap-1.5 sm:gap-3">{ranked.map((row)=>{
      const name=getProfileName(row.profile)||'Integrante PR'
      const photo=getProfilePhoto(row.profile)
      const percent=Math.max(9,Math.round(row.meters/max*100))
      const isMine=row.id===String(profileId)||String(row.profile.id||'')===String(profileId)||String(row.profile.auth_user_id||'')===String(profileId)
      return <div key={row.id} className="min-w-0 text-center"><div className="relative flex h-36 items-end rounded-[22px] bg-white/[.09] sm:h-44 sm:rounded-[32px]"><div className="pr-rank-fill relative w-full rounded-[22px] bg-gradient-to-t from-[#9d0037] via-[#ee1257] to-[#ff729b] sm:rounded-[32px]" style={{height:percent+'%'}}/><button type="button" onClick={()=>row.profile.id&&navigate('/app/comunidad/perfil/'+row.profile.id)} disabled={!row.profile.id} aria-label={'Ver perfil de '+name} style={{bottom:`clamp(8px, calc(${percent}% - 24px), calc(100% - 54px))`}} className="absolute left-1/2 z-10 flex h-10 w-10 shrink-0 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#220d18] p-0 shadow-[0_0_18px_rgba(255,0,85,.35)] transition-[bottom] duration-500 sm:h-12 sm:w-12 disabled:cursor-default">{photo?<img src={photo} alt={name} style={{width:'100%',height:'100%',aspectRatio:'1 / 1',borderRadius:'50%',objectFit:'cover',display:'block'}}/>:<span className="grid h-full w-full place-items-center rounded-full text-xs font-bold text-white">{getInitials(name)}</span>}</button></div><p className="mt-2 text-[10px] font-black text-white sm:text-[12px]">{(row.meters/1000).toLocaleString('es-UY',{maximumFractionDigits:1})} km</p><p className="mt-1 truncate text-[9px] text-white/65 sm:text-[10px]" title={name}>{isMine?'Vos':name.split(' ')[0]}</p>{row.rank<=3&&<span className="pr-rank-medal text-sm" aria-label={'Puesto '+row.rank}>{['🥇','🥈','🥉'][row.rank-1]}</span>}</div>
    })}</div>:<p className="mt-5 rounded-xl border border-white/10 p-4 text-xs text-white/60">Todavía no hay kilómetros registrados para este período.</p>}
    {profileId&&<p className="relative mt-4 rounded-xl border border-[#FF0055]/20 bg-[#FF0055]/10 px-3 py-2 text-xs font-semibold text-white/80">{myEntry?`Tu posición real: #${myRank+1} · ${(Number(myEntry.km)||0).toLocaleString('es-UY',{maximumFractionDigits:1})} km`:'Todavía no tenés kilómetros registrados en este período.'}</p>}
    <button type="button" onClick={()=>navigate('/ranking-semanal')} className="relative mt-5 w-full rounded-xl border border-[#FF729B]/30 bg-[#FF0055]/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-[#FF0055]/20">Ver clasificación completa →</button>
  </section>
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

function RollerFeedLoading({ syncing }) {
  return (
    <section
      className="rollerfeed-loading relative overflow-hidden rounded-[28px] border border-orange-300/20 bg-gradient-to-r from-[#211109] via-[#111015] to-[#15101d] p-5"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[22px] border border-orange-300/20 bg-black/25">
          <span className="rollerfeed-loading-skate text-3xl" aria-hidden="true">🛼</span>
          <span className="absolute bottom-2 left-2 right-2 h-px overflow-hidden bg-white/10">
            <span className="rollerfeed-loading-streak block h-full w-1/2 bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300/70">
            RollerFeed en movimiento
          </p>
          <h2 className="mt-1 font-display text-[24px] leading-none text-white">
            {syncing ? 'Sincronizando tu última vuelta…' : 'Armando la pista PR…'}
          </h2>
          <p className="mt-2 text-[11px] leading-5 text-white/38">
            Estamos reuniendo actividades, kilómetros y novedades de la comunidad.
          </p>
        </div>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
        <span className="rollerfeed-loading-progress block h-full w-2/5 rounded-full bg-gradient-to-r from-orange-500 via-amber-200 to-orange-400" />
      </div>
    </section>
  )
}

function FeedCard({
  item,
  commentSlot,
  reactions,
  profilesByAnyId,
  currentProfileId,
  savingReactionKey,
  onReact,
  onOpenReactions,
}) {
  const reactionProps = {
    reactions,
    profilesByAnyId,
    currentProfileId,
    savingReactionKey,
    onReact,
    onOpenReactions,
  }

  if (item.type === 'BirthdayGroup') {
    return <BirthdayGridCard item={item} reactions={reactions} currentProfileId={currentProfileId} savingReactionKey={savingReactionKey} onReact={onReact} />
  }

  if (item.type === 'Cumpleaños') {
    return <BirthdayCard item={item} {...reactionProps} />
  }

  if (item.type === 'Entrenamiento') {
    return <TrainingCard item={item} commentSlot={commentSlot} {...reactionProps} />
  }

  if (item.type === 'SocialPost') return <SocialPostCard item={item} />

  if (item.type === 'Moment') {
    return <MomentCard item={item} />
  }

  return <CommunityCard item={item} {...reactionProps} />
}

function SocialPostCard({ item }) {
  const navigate=useNavigate()
  const name=[item.author?.nombre,item.author?.apellido].filter(Boolean).join(' ')||'Integrante PR'
  return <article className="overflow-hidden rounded-[29px] border border-white/10 bg-white/[.035] p-4">
    <button type="button" onClick={()=>navigate(`/app/comunidad/perfil/${item.author_id}`)} className="flex items-center gap-3 text-left">
      <ProfileAvatar photo={item.author?.foto} name={name}/><div><p className="text-sm font-black text-white">{name}</p><p className="mt-1 text-[10px] text-white/35">{new Date(item.created_at).toLocaleString('es-UY')}</p></div>
    </button>
    {item.body&&<p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">{item.body}</p>}
    {item.media?.length>0&&<div className="mt-3 grid grid-cols-2 gap-1">{item.media.map(photo=><a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl"><CommunityPhoto src={photo.url}/></a>)}</div>}
    <button type="button" onClick={()=>navigate('/app/comunidad')} className="mt-4 w-full rounded-xl border border-violet-300/20 py-3 text-xs font-bold text-violet-200">{item.comments?.length||0} comentarios · {item.reactions?.length||0} reacciones · Abrir publicación →</button>
  </article>
}

function MomentCard({ item }) {
  const navigate = useNavigate()
  const openMoment = () => navigate(`/app/moments?moment=${item.momentId}`)

  return (
    <article className="overflow-hidden rounded-[28px] border border-violet-300/20 bg-gradient-to-br from-violet-500/[.14] via-[#121018] to-[#09090d]">
      <button type="button" onClick={openMoment} className="w-full text-left">
        <div className="flex items-center gap-3 p-4">
          <ProfileAvatar photo={item.userPhoto} name={item.userName} verified={item.verified} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{item.userName}</p><p className="mt-1 text-[10px] text-white/35">PR Moment · queda {timeLeft(item.expires_at)}</p></div>
          <span className="rounded-full bg-violet-400/10 px-3 py-2 text-[10px] font-bold text-violet-200">Ver</span>
        </div>
        {item.media_type === 'photo' && <img src={item.signed_media_url} alt={item.caption || 'PR Moment'} className="max-h-[460px] w-full bg-black object-contain" />}
        {item.media_type === 'video' && <video src={item.signed_media_url} playsInline preload="metadata" className="max-h-[460px] w-full bg-black object-contain" />}
        {item.media_type === 'text' && <p className="whitespace-pre-wrap break-words px-5 py-8 text-center font-display text-3xl leading-tight text-white">{item.caption}</p>}
        {item.media_type !== 'text' && item.caption && <p className="whitespace-pre-wrap break-words p-4 text-sm text-white/70">{item.caption}</p>}
      </button>
      <button type="button" onClick={openMoment} className="flex w-full items-center justify-between border-t border-white/[.07] px-4 py-3 text-left text-xs text-white/45"><span>Reaccionar o comentar</span><span className="text-violet-200">Abrir Moment →</span></button>
    </article>
  )
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

      {verified && <VerifiedBadge size={22} className="absolute -top-1.5 -right-1.5 z-20" />}
    </div>
  )
}

function TrainingCard({
  item, commentSlot, reactions, profilesByAnyId, currentProfileId,
  savingReactionKey, onReact, onOpenReactions,
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#FF0055]/20 bg-[#120e13] shadow-[0_6px_20px_rgba(0,0,0,.15)]">
      <div className="h-[2px] bg-gradient-to-r from-[#FF0055] via-[#FF5285] to-transparent" />
      <div className="px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProfileAvatar photo={item.userPhoto} name={item.userName} verified={item.verified} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-extrabold text-white">{item.userName}</p>
            <p className="mt-0.5 text-[10px] text-white/45">{formatRelativeDate(item.date)} · {item.source === 'strava' ? 'Strava' : 'Punta Rollers'}</p>
          </div>
          <span className="shrink-0 rounded-full border border-[#FF0055]/25 bg-[#FF0055]/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#FF80A9]">🛼 Entreno</span>
        </div>
        <h3 className="mt-2 truncate text-[13px] font-extrabold text-white" title={item.title}>{item.title}</h3>
        <div className="mt-2 flex min-w-0 items-center gap-1.5 rounded-xl border border-white/[.07] bg-white/[.025] px-2 py-2">
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[8px] font-bold uppercase tracking-wide text-white/40">Distancia</p>
            <p className="mt-0.5 truncate text-[13px] font-black text-[#FF6B9B]">{formatDistance(item.distanceMeters)}</p>
          </div>
          <span className="h-6 w-px bg-white/10" />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[8px] font-bold uppercase tracking-wide text-white/40">Tiempo</p>
            <p className="mt-0.5 truncate text-[12px] font-extrabold text-white">{formatDuration(item.durationSeconds)}</p>
          </div>
          <span className="h-6 w-px bg-white/10" />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[8px] font-bold uppercase tracking-wide text-white/40">Velocidad</p>
            <p className="mt-0.5 truncate text-[12px] font-extrabold text-white">{formatSpeed(item.averageSpeed)}</p>
          </div>
        </div>
        <ReactionPanel
          item={item} reactions={reactions} profilesByAnyId={profilesByAnyId}
          currentProfileId={currentProfileId} savingReactionKey={savingReactionKey}
          onReact={onReact} onOpenReactions={onOpenReactions}
          action={item.stravaUrl ? <a href={item.stravaUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#FF80A9]">Strava ↗</a> : null}
        />
        {commentSlot}
      </div>
    </article>
  )
}

function BirthdayCard({
  item,
  reactions,
  profilesByAnyId,
  currentProfileId,
  savingReactionKey,
  onReact,
  onOpenReactions,
}) {
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-fuchsia-300/25 bg-gradient-to-br from-fuchsia-500/[0.18] via-[#17101c] to-[#0b090d] p-4">
      <div className="flex items-start justify-between gap-4">
        <ProfileAvatar
          photo={item.userPhoto}
          name={item.userName}
          verified={item.verified}
        />

        <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-fuchsia-300/25 bg-fuchsia-400/15 text-xl">
          🎂
        </div>
      </div>

      <p className="section-label mt-4 text-fuchsia-200">
        {item.daysUntil === 0
          ? 'Celebración PR'
          : item.daysUntil < 0
            ? 'Cumpleaños de este mes'
            : 'Próximo cumpleaños'}
      </p>

      <h3 className="mt-2 font-display text-[25px] leading-tight text-white">
        {item.title}
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-fuchsia-100/55">
        {item.description}
      </p>

      <ReactionPanel
        item={item}
        reactions={reactions}
        profilesByAnyId={profilesByAnyId}
        currentProfileId={currentProfileId}
        savingReactionKey={savingReactionKey}
        onReact={onReact}
        onOpenReactions={onOpenReactions}
      />
    </article>
  )
}

function BirthdayGridCard({ item, reactions, currentProfileId, savingReactionKey, onReact }) {
  const rows = Array.isArray(item.items) ? item.items : []
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/[.13] via-[#151019] to-[#0b090d] p-4">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[8px] font-black uppercase tracking-[.18em] text-fuchsia-200/70">AGENDA PR</p><h3 className="mt-1 font-display text-[24px] text-white">Próximos cumpleaños</h3></div>
        <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-fuchsia-300/20 bg-fuchsia-400/10 text-xl">🎂</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {rows.map((birthday) => {
          const birthdayReactions = (reactions || []).filter((reaction) => String(reaction.feed_key) === String(birthday.id))
          const myReaction = birthdayReactions.find((reaction) => String(reaction.profile_id) === String(currentProfileId))
          const heartCount = birthdayReactions.filter((reaction) => reaction.reaction === 'corazon').length
          const dateLabel = new Date(birthday.birthdayDate).toLocaleDateString('es-UY',{day:'numeric',month:'short'})
          return <article key={birthday.id} className="relative min-h-[170px] overflow-hidden rounded-[22px] border border-white/[.07] bg-black/20 p-3">
            <div className="flex items-start justify-between gap-2"><ProfileAvatar photo={birthday.userPhoto} name={birthday.userName} verified={birthday.verified}/><span className="text-base">🎂</span></div>
            <p className="mt-3 truncate text-sm font-black text-white">{birthday.userName}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[.08em] text-fuchsia-200/70">{birthday.daysUntil===0?'HOY':dateLabel}</p>
            <button type="button" disabled={Boolean(savingReactionKey)} onClick={()=>onReact(birthday,'corazon')} className={'absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black '+(myReaction?.reaction==='corazon'?'border-pink-300/30 bg-pink-400/15 text-pink-200':'border-white/[.08] bg-white/[.035] text-white/45')}><span>❤️</span>{heartCount>0&&<span>{heartCount}</span>}</button>
          </article>
        })}
      </div>
    </section>
  )
}

function CommunityCard({
  item,
  reactions,
  profilesByAnyId,
  currentProfileId,
  savingReactionKey,
  onReact,
  onOpenReactions,
}) {
  const isAchievement = item.type === 'Logro'
  const isBadge = item.type === 'Insignia'
  const isEvent = item.type === 'Evento'

  const icon = isAchievement ? '✓' : isBadge
    ? '🏅'
    : isEvent
      ? '📅'
      : '📣'

  return (
    <article className={`relative overflow-hidden rounded-[29px] border p-5 ${isAchievement?'border-amber-200/45 bg-[radial-gradient(circle_at_95%_0%,rgba(251,191,36,.2),transparent_50%),linear-gradient(135deg,#173b2b,#151912)] shadow-[0_12px_35px_rgba(16,185,129,.12)]':'border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-white/[0.018]'}`}>
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
          {isAchievement?'LOGRO DESBLOQUEADO · ROAD TO SHIFTER':item.type}
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

      {isEvent && item.eventRange && (
        <p className="mt-3 text-[11px] font-semibold text-orange-200/75">
          🗓️ {item.eventRange}
        </p>
      )}

      {item.creatorName && (
        <p className="text-white/28 text-[9px] text-right mt-4 pt-4 border-t border-white/[0.06]">
          {isBadge ? 'Otorgada por' : 'Publicado por'}{' '}
          {item.creatorName}
        </p>
      )}

      <ReactionPanel
        item={item}
        reactions={reactions}
        profilesByAnyId={profilesByAnyId}
        currentProfileId={currentProfileId}
        savingReactionKey={savingReactionKey}
        onReact={onReact}
        onOpenReactions={onOpenReactions}
      />
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

function ReactionPanel({
  item,
  reactions = [],
  profilesByAnyId,
  currentProfileId,
  savingReactionKey,
  onReact,
  onOpenReactions,
  action = null,
}) {
  const myReaction = reactions.find(
    (reaction) =>
      String(reaction.profile_id) === String(currentProfileId)
  )

  const counts = REACTION_OPTIONS.reduce((result, option) => {
    result[option.key] = reactions.filter(
      (reaction) => reaction.reaction === option.key
    ).length
    return result
  }, {})

  const reactorProfiles = reactions
    .map((reaction) =>
      findProfile(profilesByAnyId, reaction.profile_id)
    )
    .filter(
      (profile) => profile && Object.keys(profile).length > 0
    )

  const names = reactorProfiles.map(getProfileName).filter(Boolean)
  const summary =
    names.length === 0
      ? ''
      : names.length === 1
        ? names[0]
        : names.length === 2
          ? `${names[0]} y ${names[1]}`
          : `${names[0]}, ${names[1]} y ${names.length - 2} más`

  return (
    <div className="mt-4 border-t border-white/[0.07] pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {REACTION_OPTIONS.map((option) => {
            const selected = myReaction?.reaction === option.key
            const saving =
              savingReactionKey === `${item.id}-${option.key}`

            return (
              <button
                key={option.key}
                type="button"
                disabled={Boolean(savingReactionKey)}
                onClick={() => onReact(item, option.key)}
                aria-label={option.label}
                title={option.label}
                className={`min-w-[42px] rounded-full border px-2 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-60 ${
                  selected
                    ? 'border-orange-300/45 bg-orange-400/20 text-white'
                    : 'border-white/[0.08] bg-white/[0.035] text-white/58'
                }`}
              >
                {saving ? '…' : option.icon}{' '}
                {counts[option.key] || ''}
              </button>
            )
          })}
        </div>

        {action}
      </div>

      {reactions.length > 0 && (
        <button
          type="button"
          onClick={onOpenReactions}
          className="mt-3 flex w-full items-center gap-2 text-left"
        >
          <span className="flex -space-x-2">
            {reactorProfiles.slice(0, 3).map((profile, index) => {
              const name = getProfileName(profile)
              const photo = getProfilePhoto(profile)

              return (
                <span
                  key={`${profile.id || index}-${index}`}
                  className="grid h-7 w-7 place-items-center overflow-hidden rounded-full border-2 border-[#101014] bg-pr-gold/15"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[8px] font-black text-pr-gold">
                      {getInitials(name)}
                    </span>
                  )}
                </span>
              )
            })}
          </span>

          <span className="min-w-0 flex-1 truncate text-[10px] text-white/42">
            {summary || `${reactions.length} reacciones`}
          </span>
          <span className="text-xs text-white/20">›</span>
        </button>
      )}
    </div>
  )
}

function ReactionsModal({
  item,
  reactions = [],
  profilesByAnyId,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 px-3 pb-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/[0.10] bg-[#111117] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <p className="section-label text-orange-200">Reacciones</p>
            <h3 className="mt-1 max-w-[260px] truncate font-display text-xl text-white">
              {item?.title || 'Publicación'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reacciones"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/55"
          >
            ×
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {reactions.length > 0 ? (
            reactions.map((reaction) => {
              const profile = findProfile(
                profilesByAnyId,
                reaction.profile_id
              )
              const name = getProfileName(profile) || 'Integrante PR'
              const option = getReactionOption(reaction.reaction)

              return (
                <div
                  key={reaction.id}
                  className="flex items-center gap-3 rounded-[20px] px-2 py-3"
                >
                  <ProfileAvatar
                    photo={getProfilePhoto(profile)}
                    name={name}
                    verified={getProfileVerified(profile)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {name}
                    </p>
                    <p className="mt-1 text-[10px] text-white/30">
                      {option.label}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-xl">
                    {option.icon}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-white/40">
                Todavía no hay reacciones.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
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
