import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import {
  supabase,
  uploadPublicImage,
} from '../lib/supabase'
import { mockUser } from '../data/mockData'
import TreasuryPanel from '../components/treasury/TreasuryPanel'

const DAY_MS = 24 * 60 * 60 * 1000

const PAYMENT_EXEMPT_DOCUMENTS = new Set([
  '50373134',
])

const BADGE_IMAGES = {
  'primer evento pr': '/insignias-pr/primer-evento-pr.png',
  'rodador frecuente': '/insignias-pr/rodador-frecuente.png',
  'espiritu pr': '/insignias-pr/espiritu-pr.png',
  'primeros 6k': '/insignias-pr/primeros-6k.png',
  'primeros 10k': '/insignias-pr/primeros-10k.png',
  'ya frena en t': '/insignias-pr/frena-en-t.png',
  'frena en t': '/insignias-pr/frena-en-t.png',
  'ya frena con taco': '/insignias-pr/frena-con-taco.png',
  'frena con taco': '/insignias-pr/frena-con-taco.png',
  'buen companero': '/insignias-pr/buen-companero.png',
  'actitud positiva': '/insignias-pr/actitud-positiva.png',
  'entrenador potencial': '/insignias-pr/entrenador-potencial.png',
}

function normalizeBadgeTitle(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getBadgeImage(title) {
  return BADGE_IMAGES[normalizeBadgeTitle(title)] || ''
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

function parsePaymentDate(value) {
  if (!value) return null

  const date = new Date(
    `${String(value).slice(0, 10)}T23:59:59`
  )

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}


function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
  }

  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function formatDistance(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${Number.isInteger(number) ? number : number.toFixed(1)}K`
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function normalizePerformanceDistance(value) {
  const distance = Number(value)

  if (!Number.isFinite(distance) || distance <= 0) {
    return 0
  }

  if (distance >= 5 && distance <= 7) {
    return 6
  }

  if (distance >= 10.5 && distance <= 13.5) {
    return 12
  }

  return Number(distance.toFixed(1))
}

function normalizeDocument(value) {
  return String(value || '').replace(/\D/g, '')
}

function groupPerformanceTakes(items) {
  const groups = new Map()

  items.forEach((item) => {
    const number = Number(item.numero_toma) || 0
    if (!groups.has(number)) {
      groups.set(number, {
        numero: number,
        fecha: item.fecha,
        devolucion: item.devolucion || '',
        registros: [],
      })
    }

    const group = groups.get(number)
    group.registros.push(item)
    if (!group.devolucion && item.devolucion) group.devolucion = item.devolucion
    if (!group.fecha && item.fecha) group.fecha = item.fecha
  })

  return [...groups.values()].sort((a, b) => b.numero - a.numero)
}

function buildPerformanceSummary(performance, takes) {
  const active = [...takes]
    .filter((item) => !item.eliminado)
    .sort((a, b) => {
      const takeDiff = Number(a.numero_toma || 0) - Number(b.numero_toma || 0)
      if (takeDiff !== 0) return takeDiff
      return new Date(a.fecha || 0) - new Date(b.fecha || 0)
    })

  const grouped = groupPerformanceTakes(active)
  const byDistance = new Map()

  active.forEach((item) => {
    const key = normalizePerformanceDistance(item.distancia_km)
    if (!key) return
    if (!byDistance.has(key)) byDistance.set(key, [])
    byDistance.get(key).push(item)
  })

  const bestFor = (distance) => {
    const records =
      byDistance.get(normalizePerformanceDistance(distance)) || []
    if (!records.length) return null
    return records.reduce((best, current) =>
      Number(current.tiempo_segundos) < Number(best.tiempo_segundos)
        ? current
        : best
    )
  }

  let highlighted = normalizePerformanceDistance(
    performance?.distancia_destacada
  )
  if (!highlighted || !byDistance.has(highlighted)) {
    highlighted = [...byDistance.entries()]
      .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 0
  }

  const highlightedRecords = byDistance.get(highlighted) || []
  const firstHighlighted = highlightedRecords[0] || null
  const latestHighlighted = highlightedRecords.at(-1) || null
  const previousHighlighted = highlightedRecords.at(-2) || null

  const totalDifference =
    firstHighlighted && latestHighlighted
      ? Number(firstHighlighted.tiempo_segundos) - Number(latestHighlighted.tiempo_segundos)
      : 0

  const improvementPercent =
    firstHighlighted && totalDifference > 0
      ? (totalDifference / Number(firstHighlighted.tiempo_segundos)) * 100
      : 0

  const latestDifference =
    previousHighlighted && latestHighlighted
      ? Number(previousHighlighted.tiempo_segundos) - Number(latestHighlighted.tiempo_segundos)
      : 0

  const best6 = bestFor(6)
  const best12 = bestFor(12)
  const maxSpeed = active.reduce(
    (max, item) => Math.max(max, Number(item.velocidad_kmh) || 0),
    0
  )

  const axes = {
    velocidad: clampScore((maxSpeed / 30) * 100),
    evolucion: clampScore(improvementPercent * 8),
    constancia: clampScore((grouped.length / 6) * 100),
    tecnica: clampScore((Number(performance?.tecnica) || 0) * 20),
    resistencia: clampScore((Number(performance?.resistencia) || 0) * 20),
  }

  const index = Math.round(
    Object.values(axes).reduce((sum, value) => sum + value, 0) / 5
  )

  return {
    grouped,
    highlighted,
    best6,
    best12,
    firstHighlighted,
    latestHighlighted,
    totalDifference,
    improvementPercent,
    latestDifference,
    axes,
    index,
  }
}

function formatPaymentDate(value) {
  const date = parsePaymentDate(value)

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

  const expiration =
    parsePaymentDate(expirationValue)

  if (!expiration) {
    return {
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

  const remainingDays = Math.ceil(
    (expiration.getTime() - Date.now()) /
      DAY_MS
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
      title: 'Mensualidad vencida',
      description: `Venció el ${formatPaymentDate(
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
      title: 'Tu mensualidad vence hoy',
      description: `Vigente hasta el ${formatPaymentDate(
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
      title: 'Tu mensualidad vence pronto',
      description: `Vigente hasta el ${formatPaymentDate(
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
    title: 'Mensualidad vigente',
    description: `Vigente hasta el ${formatPaymentDate(
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

export default function Profile() {
  const location = useLocation()
  const { user, logout, updateUser } = useAuth()

  const base = {
    ...mockUser,
    ...loadSavedUser(),
    ...user,
  }

  const profileId = base.id || 'alumno-001'

  const [open, setOpen] = useState('servicios')
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingMedia, setSavingMedia] = useState('')
  const [loading, setLoading] = useState(true)
  const [fotoFile, setFotoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [savedMedia, setSavedMedia] = useState({
    foto: base.foto || '',
    banner: base.banner || '',
  })
  const [contactos, setContactos] = useState([])
  const [activity, setActivity] = useState([])
  const [performance, setPerformance] = useState(null)
  const [performanceTakes, setPerformanceTakes] = useState([])
  const [coachGoals, setCoachGoals] = useState([])
  const [privateLessons, setPrivateLessons] = useState({
    cuponera: null,
    historial: [],
  })
  const [stravaConnecting, setStravaConnecting] = useState(false)
  const [stravaConnected, setStravaConnected] = useState(false)
  const [activitySummary, setActivitySummary] = useState(null)
  const [stravaActivities, setStravaActivities] = useState([])
  const [lifetimeActivityStats, setLifetimeActivityStats] = useState({
    sessions: 0,
    kilometers: 0,
    activeSeconds: 0,
  })
  const profileTopRef = useRef(null)
  const editSectionRef = useRef(null)

  const [form, setForm] = useState({
    nombre: base.nombre || '',
    ciudad: base.ciudad || '',
    instagram: base.instagram || '',
    email: base.email || '',
    fechaNacimiento: base.fechaNacimiento || '',
    sobreMi: base.sobreMi || '',
    pin: base.pin || '',
    foto: base.foto || '',
    banner: base.banner || '',
    miembroDesde: base.miembroDesde || '2026',
    verificado: false,
    prcardActiva: false,
    trackingActivo: false,
    gruposInfo: [],
    ultimoPago: base.ultimoPago || '',
    mensualidadHasta:
      base.mensualidadHasta || '',
    accesoHabilitado:
      typeof base.accesoHabilitado === 'boolean'
        ? base.accesoHabilitado
        : true,
    esTesoreria: Boolean(
      base.esTesoreria ||
        base.es_tesoreria
    ),
  })

  useEffect(() => {
    if (location.hash === '#observaciones') {
      setOpen('observaciones')

      setTimeout(() => {
        document
          .getElementById('observaciones')
          ?.scrollIntoView({
            behavior: 'smooth',
          })
      }, 250)
    }

    if (location.hash === '#editar') {
      setEditing(true)

      setTimeout(() => {
        document
          .getElementById('editar-perfil')
          ?.scrollIntoView({
            behavior: 'smooth',
          })
      }, 250)
    }

    if (location.hash === '#mensualidad') {
      setTimeout(() => {
        document
          .getElementById('mensualidad')
          ?.scrollIntoView({
            behavior: 'smooth',
          })
      }, 250)
    }
  }, [location.hash])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)

      const [
        profileResponse,
        contactsResponse,
        activityResponse,
        performanceResponse,
        performanceTakesResponse,
        coachGoalsResponse,
        privateLessonsResponse,
        activitySummaryResponse,
        stravaActivitiesResponse,
        lifetimeActivitiesResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle(),

        supabase
          .from('contactos_pr')
          .select('*')
          .eq('activo', true)
          .order('orden', {
            ascending: true,
          }),

        supabase
          .from('actividad_pr')
          .select('*')
          .eq('alumno_id', profileId)
          .or('eliminado.is.null,eliminado.eq.false')
          .order('fecha', {
            ascending: false,
          }),

        supabase
          .from('pr_performance')
          .select('*')
          .eq('alumno_id', profileId)
          .maybeSingle(),

        supabase
          .from('pr_performance_tomas_calculadas')
          .select('*')
          .eq('alumno_id', profileId)
          .order('numero_toma', { ascending: false })
          .order('distancia_km', { ascending: true }),

        supabase
          .from('pr_performance_objetivos')
          .select('*')
          .eq('alumno_id', profileId)
          .eq('eliminado', false)
          .order('creado_en', { ascending: false }),

        supabase.rpc('obtener_mis_particulares'),

        supabase
          .from('pr_activity_summary')
          .select('*')
          .eq('alumno_id', profileId)
          .maybeSingle(),

        supabase
          .from('pr_activities')
          .select('*')
          .eq('alumno_id', profileId)
          .eq('fuente', 'strava')
          .eq('eliminada', false)
          .order('fecha_inicio', { ascending: false })
          .limit(6),

        supabase
          .from('pr_activities')
          .select('distancia_metros, tiempo_movimiento_segundos')
          .eq('alumno_id', profileId)
          .eq('fuente', 'strava')
          .eq('eliminada', false)
          .limit(1000),
      ])

      if (profileResponse.error) {
        setMessage(
          `Error cargando perfil: ${profileResponse.error.message}`
        )
      }

      if (profileResponse.data) {
        const data = profileResponse.data

        const loadedProfile = {
          nombre: data.nombre || base.nombre || '',
          ciudad: data.ciudad || '',
          instagram: data.instagram || '',
          email: data.email || '',
          fechaNacimiento:
            data.fecha_nacimiento || '',
          sobreMi: data.sobre_mi || '',
          pin: data.pin || '',
          foto: data.foto || '',
          banner: data.banner || '',
          miembroDesde:
            data.miembro_desde || '2026',
          verificado: Boolean(data.verificado),
          prcardActiva: Boolean(
            data.prcard_activa
          ),
          trackingActivo: Boolean(
            data.tracking_activo
          ),
          gruposInfo: Array.isArray(
            data.grupos_info
          )
            ? data.grupos_info
            : [],
          ultimoPago:
            data.ultimo_pago || '',
          mensualidadHasta:
            data.mensualidad_hasta || '',
          accesoHabilitado:
            typeof data.acceso_habilitado ===
            'boolean'
              ? data.acceso_habilitado
              : true,
          esTesoreria: Boolean(
            data.es_tesoreria
          ),
        }

        setForm(loadedProfile)
        setSavedMedia({
          foto: loadedProfile.foto,
          banner: loadedProfile.banner,
        })

        const nextUser = {
          ...base,
          ...loadedProfile,
        }

        localStorage.setItem(
          'pr_user',
          JSON.stringify(nextUser)
        )

        updateUser?.(nextUser)
      }

      if (!contactsResponse.error) {
        setContactos(contactsResponse.data || [])
      }

      if (!activityResponse.error) {
        setActivity(activityResponse.data || [])
      }

      if (!performanceResponse.error) {
        setPerformance(performanceResponse.data || null)
      }

      if (!performanceTakesResponse.error) {
        setPerformanceTakes(performanceTakesResponse.data || [])
      }

      if (coachGoalsResponse.error) {
        setMessage(
          `No se pudieron cargar los objetivos: ${coachGoalsResponse.error.message}`
        )
        setCoachGoals([])
      } else {
        setCoachGoals(coachGoalsResponse.data || [])
      }

      if (!privateLessonsResponse.error) {
        const particulars = privateLessonsResponse.data || {}
        setPrivateLessons({
          cuponera: particulars.cuponera || null,
          historial: Array.isArray(particulars.historial)
            ? particulars.historial
            : [],
        })
      }

      if (!activitySummaryResponse.error) {
        setActivitySummary(activitySummaryResponse.data || null)
      }

      if (!stravaActivitiesResponse.error) {
        const imported = stravaActivitiesResponse.data || []
        setStravaActivities(imported)
        setStravaConnected(
          imported.length > 0 ||
            new URLSearchParams(location.search).get('strava') === 'connected'
        )
      }

      if (!lifetimeActivitiesResponse.error) {
        const allActivities = lifetimeActivitiesResponse.data || []
        const totals = allActivities.reduce(
          (accumulator, item) => ({
            sessions: accumulator.sessions + 1,
            kilometers:
              accumulator.kilometers +
              (Number(item.distancia_metros) || 0) / 1000,
            activeSeconds:
              accumulator.activeSeconds +
              (Number(item.tiempo_movimiento_segundos) || 0),
          }),
          { sessions: 0, kilometers: 0, activeSeconds: 0 }
        )

        setLifetimeActivityStats(totals)
      }

      setLoading(false)
    }

    loadAll()
  }, [profileId, location.search])

  const profile = {
    ...base,
    ...form,
  }

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

  const notes = useMemo(
    () =>
      activity.filter(
        (item) => item.tipo === 'Nota'
      ),
    [activity]
  )

  const unreadNotes = useMemo(
    () => notes.filter((item) => item.leida !== true),
    [notes]
  )

  const performanceSummary = useMemo(
    () => buildPerformanceSummary(performance, performanceTakes),
    [performance, performanceTakes]
  )

  const hasPerformance =
    Boolean(performance) || performanceTakes.length > 0

  const hasPrivateLessons =
    Boolean(privateLessons.cuponera) || privateLessons.historial.length > 0

  const paymentStatus =
    getPaymentStatus(
      profile.mensualidadHasta,
      profile.accesoHabilitado
    )

  const hidePaymentSection =
    PAYMENT_EXEMPT_DOCUMENTS.has(
      normalizeDocument(profile.documento)
    )

  const headerStats = useMemo(() => {
    const weeklySessions = Number(activitySummary?.actividades_semana) || 0
    const kilometers = Number(lifetimeActivityStats.kilometers) || 0

    return {
      sessions: Number(lifetimeActivityStats.sessions) || 0,
      kilometers,
      badges: badges.length,
      weeklySessions,
    }
  }, [activitySummary, lifetimeActivityStats, badges.length])

  const profileRingClass = hidePaymentSection
    ? 'from-sky-400 via-pr-gold to-sky-300'
    : paymentStatus.badge === 'Vencida'
      ? 'from-red-500 via-red-300 to-red-600'
      : paymentStatus.badge === 'Por vencer' || paymentStatus.badge === 'Vence hoy'
        ? 'from-amber-400 via-pr-gold to-orange-400'
        : paymentStatus.badge === 'Vigente'
          ? 'from-emerald-400 via-pr-gold to-emerald-300'
          : 'from-pr-gold via-white/60 to-pr-gold'

  async function connectStrava() {
    try {
      setStravaConnecting(true)
      setMessage('Preparando la conexión segura con Strava…')

      const { data, error } = await supabase.functions.invoke(
        'strava-auth',
        {
          body: {
            action: 'authorize',
            profile_id: profileId,
            pin: form.pin,
          },
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.authorization_url) {
        throw new Error(
          data?.error ||
            'No pudimos generar el enlace de autorización.'
        )
      }

      window.location.assign(data.authorization_url)
    } catch (error) {
      setMessage(
        `No se pudo iniciar la vinculación: ${error.message}`
      )
      setStravaConnecting(false)
    }
  }

  async function markNotesAsRead() {
    const unreadIds = unreadNotes
      .map((item) => String(item.id || ''))
      .filter(Boolean)

    if (!unreadIds.length) return

    const { error } = await supabase.rpc(
      'marcar_mis_devoluciones_leidas',
      { p_actividad_ids: unreadIds }
    )

    if (error) {
      setMessage(
        `No pudimos marcar las devoluciones como leídas: ${error.message}`
      )
      return
    }

    const now = new Date().toISOString()
    const unreadSet = new Set(unreadIds)

    setActivity((current) =>
      current.map((item) =>
        unreadSet.has(String(item.id))
          ? { ...item, leida: true, leida_en: item.leida_en || now }
          : item
      )
    )
  }

  function toggleNotes() {
    const willOpen = open !== 'observaciones'
    setOpen(willOpen ? 'observaciones' : '')

    if (willOpen) markNotesAsRead()
  }

  function previewImage(file, field) {
    if (!file) return

    const preview = URL.createObjectURL(file)

    if (field === 'foto') {
      setFotoFile(file)
    } else {
      setBannerFile(file)
    }

    setForm((previous) => ({
      ...previous,
      [field]: preview,
    }))

    setMessage(
      field === 'foto'
        ? 'La foto está lista. Tocá Guardar foto.'
        : 'El banner está listo. Tocá Guardar banner.'
    )
  }

  function cancelMedia(field) {
    if (field === 'foto') {
      setFotoFile(null)
    } else {
      setBannerFile(null)
    }

    setForm((previous) => ({
      ...previous,
      [field]: savedMedia[field] || '',
    }))
  }

  async function saveMedia(field) {
    const file = field === 'foto' ? fotoFile : bannerFile

    if (!file) return

    try {
      setSavingMedia(field)
      setMessage(
        field === 'foto'
          ? 'Guardando foto…'
          : 'Guardando banner…'
      )

      const bucket =
        field === 'foto' ? 'avatars' : 'banners'

      const result = await uploadPublicImage(
        bucket,
        file,
        profileId
      )

      if (result.error) {
        throw new Error(result.error)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          [field]: result.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)

      if (error) {
        throw new Error(error.message)
      }

      const nextUser = {
        ...base,
        ...form,
        [field]: result.url,
      }

      localStorage.setItem(
        'pr_user',
        JSON.stringify(nextUser)
      )

      updateUser?.({ [field]: result.url })

      setForm((previous) => ({
        ...previous,
        [field]: result.url,
      }))

      setSavedMedia((previous) => ({
        ...previous,
        [field]: result.url,
      }))

      if (field === 'foto') {
        setFotoFile(null)
      } else {
        setBannerFile(null)
      }

      setMessage(
        field === 'foto'
          ? 'Foto actualizada correctamente.'
          : 'Banner actualizado correctamente.'
      )
    } catch (error) {
      setMessage(`No se pudo guardar: ${error.message}`)
    } finally {
      setSavingMedia('')
    }
  }

  function toggleProfileEditor() {
    if (editing) {
      setEditing(false)

      window.setTimeout(() => {
        profileTopRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 80)

      return
    }

    setEditing(true)

    window.setTimeout(() => {
      editSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 120)
  }

  async function saveProfile() {
    try {
      setSaving(true)
      setMessage('Guardando cambios…')

      let foto = form.foto
      let banner = form.banner

      if (fotoFile) {
        const result = await uploadPublicImage(
          'avatars',
          fotoFile,
          profileId
        )

        if (result.error) {
          throw new Error(result.error)
        }

        foto = result.url
      }

      if (bannerFile) {
        const result = await uploadPublicImage(
          'banners',
          bannerFile,
          profileId
        )

        if (result.error) {
          throw new Error(result.error)
        }

        banner = result.url
      }

      const payload = {
        nombre: form.nombre,
        ciudad: form.ciudad,
        instagram: form.instagram,
        email: form.email,
        fecha_nacimiento: form.fechaNacimiento,
        sobre_mi: form.sobreMi,
        pin: form.pin,
        foto,
        banner,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profileId)

      if (error) {
        throw new Error(error.message)
      }

      const nextUser = {
        ...base,
        ...form,
        foto,
        banner,
      }

      localStorage.setItem(
        'pr_user',
        JSON.stringify(nextUser)
      )

      updateUser?.(nextUser)

      setForm((previous) => ({
        ...previous,
        foto,
        banner,
      }))

      setSavedMedia({ foto, banner })

      setFotoFile(null)
      setBannerFile(null)
      setEditing(false)
      setMessage('Cambios guardados correctamente.')

      window.setTimeout(() => {
        profileTopRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 120)
    } catch (error) {
      setMessage(
        `No se pudo guardar: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Mi perfil">
      <div className="pr-page space-y-5 animate-page-enter">
        {loading && (
          <div className="pr-card p-4 text-white/40 text-sm">
            Cargando tu perfil…
          </div>
        )}

        <section
          ref={profileTopRef}
          className="pr-panel overflow-hidden scroll-mt-4"
        >
          <div className="h-[150px] relative bg-gradient-to-br from-[#211a0d] via-[#111119] to-[#08080d] overflow-hidden">
            {profile.banner ? (
              <img
                src={profile.banner}
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover opacity-75"
              />
            ) : (
              <div className="absolute inset-0 flex items-start justify-center text-center px-8 pt-5">
                <div>
                  <div className="text-4xl">🛼</div>

                  <p className="text-pr-gold text-sm font-semibold mt-2">
                    Tu historia sobre ruedas
                  </p>

                  <p className="text-white/30 text-xs mt-1">
                    Elegí una imagen que te represente.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d13] via-black/5 to-black/15" />

            <label className="absolute top-4 right-4 px-3 py-2 rounded-full bg-black/55 border border-white/10 text-white/65 text-[10px] font-semibold cursor-pointer">
              Cambiar banner

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  previewImage(
                    event.target.files?.[0],
                    'banner'
                  )
                }
              />
            </label>

            {bannerFile && (
              <div className="absolute left-4 right-4 bottom-4 flex gap-2">
                <button
                  type="button"
                  disabled={savingMedia === 'banner'}
                  onClick={() => saveMedia('banner')}
                  className="flex-1 rounded-2xl bg-pr-gold text-black py-3 text-xs font-bold disabled:opacity-50"
                >
                  {savingMedia === 'banner'
                    ? 'Guardando…'
                    : 'Guardar banner'}
                </button>

                <button
                  type="button"
                  disabled={savingMedia === 'banner'}
                  onClick={() => cancelMedia('banner')}
                  className="px-4 rounded-2xl bg-black/60 border border-white/10 text-white/70 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="px-5 pb-5 relative">
            <label className={`absolute -top-16 left-5 w-32 h-32 rounded-[36px] p-[3px] bg-gradient-to-br ${profileRingClass} shadow-[0_18px_50px_rgba(0,0,0,0.55)] cursor-pointer`}>
              <span className="w-full h-full rounded-[33px] border-[4px] border-[#0d0d13] bg-[#171720] overflow-hidden grid place-items-center">
              {profile.foto ? (
                <img
                  src={profile.foto}
                  alt={profile.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-3xl">📷</div>

                  <p className="text-pr-gold text-[9px] mt-1">
                    Subir foto
                  </p>
                </div>
              )}
              </span>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  previewImage(
                    event.target.files?.[0],
                    'foto'
                  )
                }
              />
            </label>

            <div className="pt-20 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-[34px] leading-none text-white">
                  {profile.nombre}

                  {profile.verificado && (
                    <span className="text-sky-400 text-xl ml-1">
                      ✓
                    </span>
                  )}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {profile.ciudad && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-white/48 text-[10px] font-semibold">
                      📍 {profile.ciudad}
                    </span>
                  )}

                  {profile.instagram && (
                    <span className="rounded-full border border-pr-gold/15 bg-pr-gold/[0.07] px-3 py-1.5 text-pr-gold/80 text-[10px] font-semibold">
                      {profile.instagram}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={toggleProfileEditor}
                className="shrink-0 px-4 py-2.5 rounded-[16px] border border-pr-gold/30 bg-pr-gold/10 text-pr-gold text-xs font-bold shadow-[0_10px_28px_rgba(212,175,55,0.08)] active:scale-[0.98] transition-transform"
              >
                {editing ? '✕ Cerrar' : '✏️ Editar'}
              </button>
            </div>

            {fotoFile && (
              <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-3 mt-4">
                <p className="text-pr-gold text-xs font-semibold">
                  Nueva foto lista
                </p>

                <p className="text-white/40 text-[11px] mt-1">
                  Guardala ahora sin abrir Editar perfil.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    disabled={savingMedia === 'foto'}
                    onClick={() => saveMedia('foto')}
                    className="rounded-xl bg-pr-gold text-black py-3 text-xs font-bold disabled:opacity-50"
                  >
                    {savingMedia === 'foto'
                      ? 'Guardando…'
                      : 'Guardar foto'}
                  </button>

                  <button
                    type="button"
                    disabled={savingMedia === 'foto'}
                    onClick={() => cancelMedia('foto')}
                    className="rounded-xl bg-white/5 border border-white/10 text-white/65 py-3 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <p className="text-white/50 text-sm leading-relaxed mt-5">
              {profile.sobreMi ||
                'Mi espacio personal dentro de Punta Rollers.'}
            </p>

            <ProfileActivitySignature stats={headerStats} />

            <Link
              to="/app/evolucion"
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-[22px] border border-orange-300/20 bg-gradient-to-r from-orange-500/[0.13] via-orange-400/[0.07] to-white/[0.025] px-4 py-3.5 shadow-[0_12px_34px_rgba(249,115,22,.08)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-300/20 bg-orange-400/10 text-xl">
                  📈
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">Mi evolución</p>
                  <p className="mt-0.5 truncate text-[10px] text-white/35">Performance · objetivos · Shifter Marathon</p>
                </div>
              </div>
              <span className="shrink-0 text-orange-300">→</span>
            </Link>

            {!hidePaymentSection && (
              <PaymentStatusStrip
                status={paymentStatus}
                ultimoPago={profile.ultimoPago}
              />
            )}
          </div>
        </section>


        <StravaActivityProfile
          connected={stravaConnected}
          connecting={stravaConnecting}
          summary={activitySummary}
          activities={stravaActivities}
          onConnect={connectStrava}
        />

        <EvolutionNotesSection
          notes={notes}
          unreadCount={unreadNotes.length}
          open={open === 'observaciones'}
          onClick={toggleNotes}
        />

        {coachGoals.length > 0 && (
          <CoachGoalsProfile
            goals={coachGoals}
            takes={performanceTakes}
          />
        )}

        {hasPerformance && (
          <PerformanceProfile
            performance={performance}
            summary={performanceSummary}
          />
        )}

        {hasPrivateLessons && (
          <PrivateLessonsProfile
            cuponera={privateLessons.cuponera}
            history={privateLessons.historial}
          />
        )}

        {message && (
          <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-3 text-pr-gold text-sm">
            {message}
          </div>
        )}

        {editing && (
          <section
            ref={editSectionRef}
            id="editar-perfil"
            className="pr-panel p-5 space-y-4 scroll-mt-4"
          >
            <div>
              <p className="section-label">
                Personalización
              </p>

              <h2 className="font-display text-2xl text-white mt-1">
                Editá tu información
              </h2>

              {!form.fechaNacimiento && (
                <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/[0.08] p-3 mt-4">
                  <p className="text-fuchsia-100 text-xs font-bold">
                    🎂 Completá tu cumpleaños
                  </p>
                  <p className="text-white/40 text-[11px] mt-1 leading-relaxed">
                    Así RollerFeed ⚡️ podrá celebrar tu día automáticamente con toda la comunidad.
                  </p>
                </div>
              )}
            </div>

            <EditInput
              label="Nombre"
              value={form.nombre}
              onChange={(value) =>
                setForm({
                  ...form,
                  nombre: value,
                })
              }
            />

            <EditInput
              label="Instagram"
              value={form.instagram}
              onChange={(value) =>
                setForm({
                  ...form,
                  instagram: value,
                })
              }
            />

            <EditInput
              label="Ciudad"
              value={form.ciudad}
              onChange={(value) =>
                setForm({
                  ...form,
                  ciudad: value,
                })
              }
            />

            <EditInput
              label="Email"
              value={form.email}
              onChange={(value) =>
                setForm({
                  ...form,
                  email: value,
                })
              }
            />

            <EditInput
              label="Cumpleaños"
              type="date"
              value={form.fechaNacimiento}
              onChange={(value) =>
                setForm({
                  ...form,
                  fechaNacimiento: value,
                })
              }
            />

            <EditInput
              label="PIN de ingreso"
              value={form.pin}
              onChange={(value) =>
                setForm({
                  ...form,
                  pin: value,
                })
              }
            />

            <label className="block">
              <span className="section-label">
                Sobre mí
              </span>

              <textarea
                rows="4"
                value={form.sobreMi}
                onChange={(event) =>
                  setForm({
                    ...form,
                    sobreMi: event.target.value,
                  })
                }
                className="input-pr mt-2 resize-none"
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="btn-gold w-full disabled:opacity-50"
            >
              {saving
                ? 'Guardando…'
                : 'Guardar cambios'}
            </button>
          </section>
        )}

        <section className="pr-panel p-5">
          <div>
            <p className="section-label">
              Comunidad
            </p>

            <h2 className="font-display text-2xl text-white mt-1">
              Tus grupos
            </h2>
          </div>

          {profile.gruposInfo?.length ? (
            <div className="space-y-2 mt-4">
              {profile.gruposInfo.map(
                (group, index) => (
                  <a
                    key={`${group.titulo}-${index}`}
                    href={group.link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="pr-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {group.titulo}
                      </p>

                      <p className="text-white/32 text-[11px] mt-1">
                        Grupo asignado por Punta Rollers
                      </p>
                    </div>

                    <span className="text-pr-gold text-xs">
                      Abrir →
                    </span>
                  </a>
                )
              )}
            </div>
          ) : (
            <Empty
              title="Todavía no tenés grupos asignados"
              text="Cuando el equipo PR te agregue a un grupo, aparecerá acá."
            />
          )}
        </section>

        <Accordion
          title="Mis servicios PR"
          subtitle="Accesos activos"
          open={open === 'servicios'}
          onClick={() =>
            setOpen(
              open === 'servicios' ? '' : 'servicios'
            )
          }
        >
          <Service
            title="PR Card"
            active={profile.prcardActiva}
            href="https://puntarollerscard.com/"
            action="Abrir plataforma"
          />

          <Service
            title="PR Tracking"
            active={profile.trackingActivo}
            href="/app/tracking"
            action="Ver información"
          />
        </Accordion>

        <ProfileBadges badges={badges} />

        <Accordion
          title={`Eventos (${events.length})`}
          subtitle="Tu participación"
          open={open === 'participaciones'}
          onClick={() =>
            setOpen(
              open === 'participaciones'
                ? ''
                : 'participaciones'
            )
          }
        >
          <ActivityList
            items={events}
            empty="Todavía no hay participaciones"
            icon="🎯"
          />
        </Accordion>

        {form.esTesoreria && (
          <Accordion
            title="Tesorería"
            subtitle="Registrar y consultar pagos"
            open={open === 'tesoreria'}
            onClick={() =>
              setOpen(
                open === 'tesoreria'
                  ? ''
                  : 'tesoreria'
              )
            }
          >
            <TreasuryPanel
              currentUser={{
                ...base,
                ...form,
              }}
              setMessage={setMessage}
            />
          </Accordion>
        )}

        <Accordion
          title="Contactos PR"
          subtitle="Estamos para ayudarte"
          open={open === 'contactos'}
          onClick={() =>
            setOpen(
              open === 'contactos' ? '' : 'contactos'
            )
          }
        >
          {contactos.length ? (
            <div className="space-y-2">
              {contactos.map((contact) => (
                <a
                  key={contact.id}
                  href={contact.link || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="pr-card p-4 flex justify-between"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {contact.nombre}
                    </p>

                    {contact.detalle && (
                      <p className="text-white/35 text-xs mt-1">
                        {contact.detalle}
                      </p>
                    )}
                  </div>

                  <span className="text-pr-gold text-xs">
                    Abrir →
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <Empty
              title="Sin contactos cargados"
              text="Los contactos del equipo aparecerán acá."
            />
          )}
        </Accordion>

        <button
          type="button"
          onClick={logout}
          className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 py-4 text-red-200 text-sm font-semibold"
        >
          Cerrar sesión
        </button>
      </div>
    </AppLayout>
  )
}



function formatActivityHours(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} h ${minutes ? `${minutes} min` : ''}`.trim()
  }

  return `${minutes} min`
}

function formatActivityKm(meters) {
  const km = Math.max(0, Number(meters) || 0) / 1000
  return `${km.toLocaleString('es-UY', {
    minimumFractionDigits: km < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  })} km`
}

function formatActivitySpeed(value) {
  const metersPerSecond = Number(value) || 0
  if (!metersPerSecond) return '—'
  return `${(metersPerSecond * 3.6).toFixed(1)} km/h`
}

function buildWeeklyActivityMessage(summary) {
  const activities = Number(summary?.actividades_semana) || 0
  const km = Number(summary?.km_semana) || 0

  if (!activities) {
    return 'Tu próxima actividad sincronizada aparecerá acá automáticamente.'
  }

  return `Completaste ${activities} entrenamiento${
    activities === 1 ? '' : 's'
  } esta semana y acumulaste ${km.toLocaleString('es-UY', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km.`
}

function StravaActivityProfile({
  connected,
  connecting,
  summary,
  activities,
  onConnect,
}) {
  const latest = activities?.[0] || null
  const weeklyActivities = Number(summary?.actividades_semana) || 0
  const weeklyKm = Number(summary?.km_semana) || 0
  const weeklySeconds = Number(summary?.segundos_semana) || 0
  const monthlyKm = Number(summary?.km_mes) || 0

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-orange-300/25 bg-gradient-to-br from-[#ff5a1f]/20 via-[#15100f] to-[#07070b] shadow-[0_28px_90px_rgba(249,115,22,0.13)]">
      <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-20 w-60 h-60 rounded-full bg-pr-gold/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 border-b border-orange-300/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.9)]" />
              <span className="text-orange-200 text-[9px] font-bold uppercase tracking-[0.16em]">
                Strava + Punta Rollers
              </span>
            </div>

            <h2 className="font-display text-[31px] leading-none text-white mt-4">
              Mi actividad
            </h2>

            <p className="text-white/42 text-xs mt-3 leading-relaxed max-w-[270px]">
              Tus entrenamientos, kilómetros y constancia se actualizan automáticamente.
            </p>
          </div>

          <div className="w-14 h-14 rounded-[20px] border border-orange-300/25 bg-gradient-to-br from-orange-400/20 to-pr-gold/10 grid place-items-center text-2xl shrink-0 shadow-[0_0_26px_rgba(249,115,22,0.12)]">
            ⚡
          </div>
        </div>
      </div>

      <div className="relative p-5 space-y-4">
        {!connected ? (
          <div className="rounded-[26px] border border-orange-300/20 bg-black/30 p-5">
            <p className="text-white font-semibold text-lg">
              Sincronizá tu entrenamiento
            </p>

            <p className="text-white/42 text-sm mt-2 leading-relaxed">
              Vinculá Strava una sola vez. Después, tus nuevas actividades aparecerán automáticamente en tu perfil y en RollerFeed ⚡️.
            </p>

            <button
              type="button"
              disabled={connecting}
              onClick={onConnect}
              className="w-full rounded-2xl bg-[#fc4c02] border border-orange-300/20 py-4 px-4 text-white text-sm font-bold mt-5 shadow-[0_14px_36px_rgba(252,76,2,0.22)] disabled:opacity-50"
            >
              {connecting
                ? 'Conectando con Strava…'
                : '🟠 Vincular mi cuenta de Strava'}
            </button>

            <p className="text-white/25 text-[10px] text-center mt-3">
              La autorización se realiza directamente en Strava.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-400/[0.07] p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-emerald-200 text-sm font-bold">
                  ✓ Strava conectado
                </p>
                <p className="text-white/35 text-[10px] mt-1">
                  Tus actividades importadas alimentan tus estadísticas.
                </p>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-200 text-[9px] font-bold uppercase tracking-wider">
                Activo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <ActivitySummaryStat
                label="Esta semana"
                value={weeklyActivities}
                detail="entrenamientos"
              />
              <ActivitySummaryStat
                label="Kilómetros"
                value={weeklyKm.toLocaleString('es-UY', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                detail="km esta semana"
                highlight
              />
              <ActivitySummaryStat
                label="Tiempo activo"
                value={formatActivityHours(weeklySeconds)}
                detail="esta semana"
              />
              <ActivitySummaryStat
                label="Este mes"
                value={monthlyKm.toLocaleString('es-UY', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                detail="km acumulados"
              />
            </div>

            <div className="rounded-[25px] border border-orange-300/15 bg-gradient-to-br from-orange-400/[0.09] to-white/[0.02] p-4">
              <p className="text-orange-200 text-[9px] font-bold uppercase tracking-[0.16em]">
                Tu resumen automático
              </p>
              <p className="text-white text-sm font-semibold mt-2 leading-relaxed">
                {buildWeeklyActivityMessage(summary)}
              </p>
              {weeklyActivities > 0 && (
                <p className="text-white/35 text-xs mt-2">
                  Seguimos construyendo constancia sobre ruedas. 🛼
                </p>
              )}
            </div>

            {latest && (
              <div className="rounded-[26px] border border-white/[0.08] bg-black/35 overflow-hidden">
                <div className="p-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
                  <div>
                    <p className="section-label text-orange-200">
                      Última actividad
                    </p>
                    <p className="text-white font-semibold mt-2">
                      {latest.nombre || 'Entrenamiento'}
                    </p>
                    <p className="text-white/30 text-[10px] mt-1">
                      {formatDate(latest.fecha_inicio)}
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-2xl border border-orange-300/15 bg-orange-400/10 grid place-items-center">
                    🛼
                  </span>
                </div>

                <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
                  <LatestActivityStat
                    label="Distancia"
                    value={formatActivityKm(latest.distancia_metros)}
                  />
                  <LatestActivityStat
                    label="Tiempo"
                    value={formatActivityHours(
                      latest.tiempo_movimiento_segundos
                    )}
                  />
                  <LatestActivityStat
                    label="Velocidad"
                    value={formatActivitySpeed(
                      latest.velocidad_media_ms
                    )}
                  />
                </div>

                {latest.strava_url && (
                  <a
                    href={latest.strava_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block border-t border-white/[0.06] px-4 py-3 text-orange-200 text-xs font-bold text-center"
                  >
                    Ver actividad en Strava →
                  </a>
                )}
              </div>
            )}

            <Link
              to="/app/actividad"
              className="w-full rounded-2xl border border-pr-gold/25 bg-gradient-to-r from-pr-gold/15 via-orange-400/10 to-pr-gold/10 py-4 px-4 text-pr-gold text-sm font-bold flex items-center justify-center gap-2 shadow-[0_14px_40px_rgba(212,175,55,0.08)]"
            >
              ⚡ Abrir RollerFeed
            </Link>
          </>
        )}
      </div>
    </section>
  )
}

function ActivitySummaryStat({
  label,
  value,
  detail,
  highlight = false,
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-4 min-h-[112px]">
      <p className="text-white/30 text-[9px] uppercase tracking-[0.14em]">
        {label}
      </p>
      <p
        className={`font-display text-[28px] leading-none mt-3 ${
          highlight ? 'text-orange-300' : 'text-white'
        }`}
      >
        {value}
      </p>
      <p className="text-white/28 text-[10px] mt-2">
        {detail}
      </p>
    </div>
  )
}

function LatestActivityStat({ label, value }) {
  return (
    <div className="p-3 text-center min-w-0">
      <p className="text-white/25 text-[8px] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-white text-[11px] font-bold mt-1 truncate">
        {value}
      </p>
    </div>
  )
}


function EvolutionNotesSection({ notes, unreadCount, open, onClick }) {
  const hasUnread = unreadCount > 0

  return (
    <section
      id="observaciones"
      className={`rounded-[30px] overflow-hidden border bg-gradient-to-br from-violet-500/[0.16] via-[#100d18] to-black ${
        hasUnread
          ? 'border-violet-300/40 shadow-[0_0_30px_rgba(139,92,246,0.10)]'
          : 'border-violet-400/25'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="section-label text-violet-300">Tu evolución</p>
            <h2 className="font-display text-[25px] leading-tight text-white mt-2">
              📣 Leé las devoluciones de tus profesores
            </h2>
            <p className="text-violet-100/50 text-xs mt-2 leading-relaxed">
              Cada evaluación incluye consejos personalizados para ayudarte a mejorar tu técnica.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-2xl border grid place-items-center text-xl ${
                hasUnread
                  ? 'border-violet-300/35 bg-violet-400/20 animate-pulse'
                  : 'border-violet-400/25 bg-violet-400/10'
              }`}
            >
              📣
            </div>
            <span
              className={`min-w-8 h-8 px-2 rounded-full border text-xs font-bold grid place-items-center ${
                hasUnread
                  ? 'border-violet-300/35 bg-violet-400/20 text-violet-100'
                  : 'border-violet-400/20 bg-violet-400/10 text-violet-200'
              }`}
            >
              {hasUnread ? unreadCount : notes.length}
            </span>
          </div>
        </div>

        <div
          className={`mt-4 rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${
            hasUnread
              ? 'border-violet-300/30 bg-violet-400/15'
              : 'border-violet-400/15 bg-violet-400/[0.07]'
          }`}
        >
          <div>
            <p
              className={`text-sm font-bold ${
                hasUnread ? 'text-violet-100' : 'text-violet-200'
              }`}
            >
              {hasUnread
                ? `Tenés ${unreadCount} devolución${
                    unreadCount === 1 ? '' : 'es'
                  } nueva${unreadCount === 1 ? '' : 's'}`
                : notes.length
                  ? 'Estás al día con tus devoluciones'
                  : 'Todavía no tenés devoluciones'}
            </p>
            <p className="text-white/42 text-[11px] mt-1">
              {notes.length
                ? open
                  ? 'Tocá para cerrar'
                  : '👇 Tocá aquí para leerlas'
                : 'Cuando tus profesores carguen una, aparecerá acá.'}
            </p>
          </div>
          <span className="w-9 h-9 rounded-full border border-violet-300/25 bg-violet-400/15 text-violet-100 grid place-items-center font-bold shrink-0">
            {open ? '−' : '↓'}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          <ActivityList
            items={notes}
            empty="Todavía no hay devoluciones de profesores"
            icon="📝"
          />
        </div>
      )}
    </section>
  )
}


function CoachGoalsProfile({ goals, takes }) {
  const [historyOpen, setHistoryOpen] = useState(false)

  const visibleTakes = (takes || []).filter((item) => item?.eliminado !== true)
  const activeGoals = (goals || []).filter(
    (goal) => goal.estado === 'Activo' || goal.estado === 'Pausado'
  )
  const completedGoals = (goals || []).filter(
    (goal) => goal.estado === 'Completado'
  )

  function getGoalProgress(goal) {
    const distance = Number(goal.distancia_km)
    const target = Number(goal.tiempo_objetivo_segundos)
    const comparable = visibleTakes.filter(
      (take) =>
        normalizePerformanceDistance(take.distancia_km) ===
        normalizePerformanceDistance(distance)
    )
    const best = comparable.length
      ? comparable.reduce((currentBest, take) =>
          Number(take.tiempo_segundos) < Number(currentBest.tiempo_segundos)
            ? take
            : currentBest
        )
      : null
    const bestSeconds = Number(best?.tiempo_segundos) || 0
    const achieved = Boolean(bestSeconds && bestSeconds <= target)
    const progress = bestSeconds
      ? Math.max(8, Math.min(100, Math.round((target / bestSeconds) * 100)))
      : 0
    const remaining = bestSeconds ? bestSeconds - target : 0

    return { best, bestSeconds, achieved, progress, remaining }
  }

  return (
    <section className="rounded-[30px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.12] via-[#0b1210] to-black overflow-hidden">
      <div className="p-5 border-b border-emerald-400/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label text-emerald-300">Objetivos del entrenador</p>
            <h2 className="font-display text-[28px] leading-none text-white mt-2">
              Tu próxima meta
            </h2>
            <p className="text-white/38 text-xs mt-3 leading-relaxed">
              Metas personalizadas definidas por tus profesores según tu evolución.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 grid place-items-center text-xl shrink-0">
            🎯
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {activeGoals.length > 0 ? (
          activeGoals.map((goal) => {
            const progress = getGoalProgress(goal)
            const isPaused = goal.estado === 'Pausado'
            const visuallyCompleted = progress.achieved

            return (
              <div
                key={goal.id}
                className={`rounded-[26px] border p-4 ${
                  visuallyCompleted
                    ? 'border-emerald-300/30 bg-emerald-400/[0.10]'
                    : 'border-white/[0.07] bg-white/[0.025]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-lg leading-tight">
                      {goal.titulo}
                    </p>
                    <p className="text-white/35 text-xs mt-2">
                      {formatDistance(goal.distancia_km)} · Meta {formatDuration(goal.tiempo_objetivo_segundos)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                      visuallyCompleted
                        ? 'border-emerald-300/25 bg-emerald-400/15 text-emerald-200'
                        : isPaused
                          ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
                          : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                    }`}
                  >
                    {visuallyCompleted ? 'Meta alcanzada' : isPaused ? 'Pausado' : 'En curso'}
                  </span>
                </div>

                {goal.indicacion && (
                  <div className="rounded-2xl border border-emerald-400/10 bg-black/25 p-3 mt-4">
                    <p className="text-white/25 text-[9px] uppercase tracking-[0.14em]">
                      Indicación del entrenador
                    </p>
                    <p className="text-white/60 text-sm mt-2 leading-relaxed">
                      {goal.indicacion}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-white/38">Progreso automático</span>
                    <span className="text-emerald-300 font-bold">{progress.progress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.07] overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                    <p className="text-white/25 text-[9px] uppercase tracking-wider">Mejor marca</p>
                    <p className="text-white font-semibold mt-1">
                      {progress.bestSeconds ? formatDuration(progress.bestSeconds) : 'Sin registro'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-3">
                    <p className="text-white/25 text-[9px] uppercase tracking-wider">Situación</p>
                    <p className={`font-semibold mt-1 ${visuallyCompleted ? 'text-emerald-300' : 'text-white'}`}>
                      {visuallyCompleted
                        ? `Superada por ${formatDuration(Math.abs(progress.remaining))}`
                        : progress.bestSeconds
                          ? `Faltan ${formatDuration(progress.remaining)}`
                          : 'Esperando una toma'}
                    </p>
                  </div>
                </div>

                {goal.fecha_limite && (
                  <p className="text-white/28 text-[10px] mt-3">
                    Fecha objetivo: {formatDate(`${goal.fecha_limite}T12:00:00`)}
                  </p>
                )}
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
            <p className="text-white/45 text-sm">No tenés objetivos activos en este momento.</p>
          </div>
        )}

        {completedGoals.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setHistoryOpen((value) => !value)}
              className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.10] py-4 text-emerald-200 text-sm font-bold"
            >
              {historyOpen
                ? 'Ocultar metas completadas'
                : `Ver metas completadas (${completedGoals.length})`}
            </button>

            {historyOpen && (
              <div className="space-y-2 animate-fade-in">
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{goal.titulo}</p>
                        <p className="text-white/32 text-[10px] mt-1">
                          {formatDistance(goal.distancia_km)} · {formatDuration(goal.tiempo_objetivo_segundos)}
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-200 text-[9px] font-bold">
                        ✓ COMPLETADA
                      </span>
                    </div>
                    {goal.completado_en && (
                      <p className="text-white/25 text-[10px] mt-3">
                        Completada el {formatDate(goal.completado_en)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}


function formatLessonDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getLessonTypeLabel(item) {
  if (item?.tipo === 'clase_dada') return 'Clase realizada'
  if (item?.tipo === 'carga') return 'Clases cargadas'
  if (item?.tipo === 'devolucion') return 'Clase devuelta'
  if (item?.tipo === 'correccion') return 'Corrección'
  return item?.tipo ? String(item.tipo).replaceAll('_', ' ') : 'Movimiento'
}

function PrivateLessonsProfile({ cuponera, history }) {
  const [historyOpen, setHistoryOpen] = useState(false)

  const loaded = Number(
    cuponera?.clases_cargadas ??
      cuponera?.clases_compradas ??
      cuponera?.total_clases ??
      0
  )
  const used = Number(
    cuponera?.clases_usadas ??
      cuponera?.clases_utilizadas ??
      0
  )
  const available = Number(
    cuponera?.clases_disponibles ??
      Math.max(0, loaded - used)
  )

  const visibleHistory = (history || []).filter(
    (item) => item?.anulado !== true
  )
  const completedClasses = visibleHistory.filter(
    (item) => item?.tipo === 'clase_dada'
  )
  const latestClass = completedClasses[0] || null

  return (
    <section className="rounded-[30px] border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.12] via-[#0b1018] to-black overflow-hidden">
      <div className="p-5 border-b border-sky-400/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label text-sky-300">Clases particulares</p>
            <h2 className="font-display text-[28px] leading-none text-white mt-2">
              Mi cuponera
            </h2>
            <p className="text-white/38 text-xs mt-3 leading-relaxed">
              Consultá tus clases cargadas, utilizadas y disponibles.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl border border-sky-400/20 bg-sky-400/10 grid place-items-center text-xl shrink-0">
            🛼
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2.5">
          <PrivateLessonStat value={loaded} label="Cargadas" />
          <PrivateLessonStat value={used} label="Usadas" />
          <PrivateLessonStat value={available} label="Disponibles" highlight />
        </div>

        <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Estado actual</p>
              <p className="text-white font-semibold mt-2">
                {available > 0
                  ? `${available} clase${available === 1 ? '' : 's'} disponible${available === 1 ? '' : 's'}`
                  : 'Sin clases disponibles'}
              </p>
            </div>

            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
              available > 0
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-white/10 bg-white/[0.04] text-white/40'
            }`}>
              {available > 0 ? 'Activa' : 'Sin saldo'}
            </span>
          </div>
        </div>

        {latestClass && (
          <div className="rounded-[24px] border border-white/[0.07] bg-black/30 p-4">
            <p className="section-label">Última clase</p>
            <p className="text-white font-semibold mt-2">
              {formatLessonDate(latestClass.fecha_clase || latestClass.created_at)}
            </p>
            {latestClass.observacion && (
              <p className="text-white/52 text-sm mt-3 leading-relaxed">
                {latestClass.observacion}
              </p>
            )}
          </div>
        )}

        {visibleHistory.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setHistoryOpen((value) => !value)}
              className="w-full rounded-2xl border border-sky-400/20 bg-sky-400/[0.10] py-4 text-sky-200 text-sm font-bold"
            >
              {historyOpen
                ? 'Ocultar historial'
                : `Ver historial (${visibleHistory.length})`}
            </button>

            {historyOpen && (
              <div className="space-y-2 animate-fade-in">
                {visibleHistory.map((item, index) => (
                  <div
                    key={item.id || `${item.tipo}-${index}`}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold text-sm capitalize">
                          {getLessonTypeLabel(item)}
                        </p>
                        <p className="text-white/28 text-[10px] mt-1">
                          {formatLessonDate(
                            item.fecha_clase || item.created_at
                          )}
                        </p>
                      </div>

                      {item.cantidad && (
                        <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.10] px-2.5 py-1 text-sky-200 text-[9px] font-bold">
                          {Number(item.cantidad) > 0 ? '+' : ''}
                          {item.cantidad}
                        </span>
                      )}
                    </div>

                    {item.observacion && (
                      <p className="text-white/50 text-sm mt-3 leading-relaxed">
                        {item.observacion}
                      </p>
                    )}

                    {item.motivo && (
                      <p className="text-white/35 text-xs mt-2 leading-relaxed">
                        Motivo: {item.motivo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function PrivateLessonStat({ value, label, highlight = false }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-center">
      <p className={`font-display text-3xl ${highlight ? 'text-sky-300' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-white/30 text-[9px] uppercase tracking-[0.13em] mt-1">
        {label}
      </p>
    </div>
  )
}

function PerformanceProfile({ performance, summary }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const latestTake = summary.grouped[0]
  const profileLabel = performance?.perfil_rodaje || 'En evolución'

  return (
    <section className="rounded-[30px] border border-pr-gold/25 bg-gradient-to-br from-[#17130a] via-[#0b0b10] to-black overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
      <div className="p-5 border-b border-pr-gold/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label text-pr-gold">PR Performance</p>
            <h2 className="font-display text-[29px] leading-none text-white mt-2">
              Tu evolución sobre ruedas
            </h2>
            <p className="text-white/38 text-xs mt-3 leading-relaxed">
              Tus registros, progreso y evaluación técnica reunidos en un solo lugar.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-xl shrink-0">
            ⚡
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-[26px] border border-pr-gold/20 bg-black/35 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Índice PR</p>
              <p className="font-display text-5xl text-pr-gold mt-2">
                {summary.index}
                <span className="text-white/25 text-base">/100</span>
              </p>
            </div>
            <span className="rounded-full border border-pr-gold/20 bg-pr-gold/10 px-3 py-1.5 text-pr-gold text-[9px] font-bold uppercase tracking-wider">
              {profileLabel}
            </span>
          </div>

          <p className="text-white/38 text-xs leading-relaxed mt-3">
            El Índice PR representa tu evolución personal sobre ruedas a partir de tus registros, progreso y evaluación técnica.
          </p>

          <PerformanceRadar axes={summary.axes} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PerformanceStat
            label="Distancia destacada"
            value={summary.highlighted ? formatDistance(summary.highlighted) : '—'}
            detail="Tu mejor registro actual está en esta distancia."
          />
          <PerformanceStat
            label="Cantidad de tomas"
            value={summary.grouped.length}
            detail={summary.grouped.length === 1 ? 'instancia registrada' : 'instancias registradas'}
          />
          <PerformanceStat
            label="Mejor marca 6K"
            value={summary.best6 ? formatDuration(summary.best6.tiempo_segundos) : '—'}
            detail={summary.best6 ? `${Number(summary.best6.velocidad_kmh).toFixed(1)} km/h` : 'Sin registro'}
          />
          <PerformanceStat
            label="Mejor marca 12K"
            value={summary.best12 ? formatDuration(summary.best12.tiempo_segundos) : '—'}
            detail={summary.best12 ? `${Number(summary.best12.velocidad_kmh).toFixed(1)} km/h` : 'Sin registro'}
          />
        </div>

        <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="section-label">Evolución total</p>
          <div className="flex items-end justify-between gap-4 mt-2">
            <p className="font-display text-3xl text-white">
              {summary.totalDifference > 0
                ? `−${formatDuration(summary.totalDifference)}`
                : summary.totalDifference < 0
                  ? `+${formatDuration(Math.abs(summary.totalDifference))}`
                  : 'Sin comparación'}
            </p>
            {summary.improvementPercent > 0 && (
              <span className="text-emerald-300 text-xs font-bold">
                +{summary.improvementPercent.toFixed(1)}% mejora
              </span>
            )}
          </div>
          <p className="text-white/35 text-xs mt-2">
            Comparación entre tu primera y tu última marca en {summary.highlighted ? formatDistance(summary.highlighted) : 'la distancia destacada'}.
          </p>
        </div>

        <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="section-label">Último progreso</p>
          <p className="text-white font-semibold mt-2">
            {summary.latestDifference > 0
              ? `Mejoraste ${formatDuration(summary.latestDifference)}`
              : summary.latestDifference < 0
                ? `Tu último registro fue ${formatDuration(Math.abs(summary.latestDifference))} más lento`
                : 'Todavía necesitamos otra toma comparable'}
          </p>
          {latestTake?.devolucion && (
            <p className="text-white/52 text-sm mt-3 leading-relaxed">
              “{latestTake.devolucion}”
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setHistoryOpen((value) => !value)}
          className="w-full rounded-2xl border border-sky-400/20 bg-sky-400/[0.10] py-4 text-sky-200 text-sm font-bold"
        >
          {historyOpen ? 'Ocultar historial' : `Ver historial (${summary.grouped.length})`}
        </button>

        {historyOpen && (
          <div className="space-y-3 animate-fade-in">
            {summary.grouped.map((take) => (
              <div
                key={take.numero}
                className="rounded-[24px] border border-white/[0.07] bg-black/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-bold">Toma {take.numero}</p>
                    <p className="text-white/30 text-[10px] mt-1">
                      {formatDate(take.fecha)}
                    </p>
                  </div>
                  <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.10] px-2.5 py-1 text-sky-200 text-[9px] font-bold">
                    {take.registros.length} {take.registros.length === 1 ? 'DISTANCIA' : 'DISTANCIAS'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-3">
                  {take.registros.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-pr-gold font-bold text-sm">
                          {formatDistance(record.distancia_km)}
                        </p>
                        <p className="text-white/30 text-[10px] mt-1">
                          Ritmo {formatDuration(record.ritmo_segundos_km)}/km
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          {formatDuration(record.tiempo_segundos)}
                        </p>
                        <p className="text-white/30 text-[10px] mt-1">
                          {Number(record.velocidad_kmh).toFixed(1)} km/h
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {take.devolucion && (
                  <p className="text-white/50 text-sm mt-3 leading-relaxed">
                    {take.devolucion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function PerformanceStat({ label, value, detail }) {
  return (
    <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-4 min-h-[128px]">
      <p className="section-label">{label}</p>
      <p className="font-display text-[27px] leading-none text-white mt-3">
        {value}
      </p>
      <p className="text-white/30 text-[10px] mt-3 leading-relaxed">
        {detail}
      </p>
    </div>
  )
}

function PerformanceRadar({ axes }) {
  const labels = [
    ['Velocidad', axes.velocidad],
    ['Evolución', axes.evolucion],
    ['Constancia', axes.constancia],
    ['Técnica', axes.tecnica],
    ['Resistencia', axes.resistencia],
  ]
  const center = 100
  const radius = 70
  const angleFor = (index) => -Math.PI / 2 + (index * Math.PI * 2) / 5
  const point = (index, scale = 1) => {
    const angle = angleFor(index)
    return [
      center + Math.cos(angle) * radius * scale,
      center + Math.sin(angle) * radius * scale,
    ]
  }
  const polygon = labels
    .map(([, value], index) => point(index, value / 100).join(','))
    .join(' ')

  return (
    <div className="mt-4">
      <svg viewBox="0 0 200 200" className="w-full max-w-[270px] mx-auto" aria-label="Gráfica del Índice PR">
        {[1, 0.75, 0.5, 0.25].map((scale) => (
          <polygon
            key={scale}
            points={labels.map((_, index) => point(index, scale).join(',')).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
        ))}
        {labels.map((_, index) => {
          const [x, y] = point(index, 1)
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          )
        })}
        <polygon
          points={polygon}
          fill="rgba(212,175,55,0.22)"
          stroke="rgb(212,175,55)"
          strokeWidth="2"
        />
        {labels.map(([, value], index) => {
          const [x, y] = point(index, value / 100)
          return <circle key={index} cx={x} cy={y} r="3" fill="rgb(212,175,55)" />
        })}
      </svg>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {labels.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-white/40">{label}</span>
            <span className="text-pr-gold font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


function ProfileBadges({ badges = [] }) {
  const featured = badges.slice(0, 3)

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-pr-gold/25 bg-gradient-to-br from-[#211708] via-[#111016] to-[#07070b] shadow-[0_28px_90px_rgba(212,175,55,0.10)]">
      <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-pr-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-orange-400/[0.08] blur-3xl pointer-events-none" />

      <div className="relative p-5 border-b border-pr-gold/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label text-pr-gold">
              Colección personal
            </p>

            <h2 className="font-display text-[30px] leading-none text-white mt-2">
              Mis insignias
            </h2>

            <p className="text-white/40 text-xs mt-3 leading-relaxed max-w-[270px]">
              Reconocimientos que cuentan tu evolución, constancia y espíritu dentro de Punta Rollers.
            </p>
          </div>

          <div className="w-14 h-14 rounded-[20px] border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-2xl shrink-0">
            🏅
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <div className="rounded-[22px] border border-white/[0.07] bg-black/25 p-4">
            <p className="font-display text-[30px] leading-none text-pr-gold">
              {badges.length}
            </p>

            <p className="text-white/30 text-[9px] uppercase tracking-[0.14em] mt-2">
              Conseguidas
            </p>
          </div>

          <div className="rounded-[22px] border border-white/[0.07] bg-black/25 p-4">
            <p className="font-display text-[30px] leading-none text-white">
              {badges.length ? 'Activa' : 'Inicial'}
            </p>

            <p className="text-white/30 text-[9px] uppercase tracking-[0.14em] mt-2">
              Colección
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-5">
        {!badges.length ? (
          <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-6 text-center">
            <div className="w-16 h-16 rounded-[22px] border border-pr-gold/20 bg-pr-gold/10 grid place-items-center text-3xl mx-auto">
              🏅
            </div>

            <h3 className="font-display text-2xl text-white mt-4">
              Tu colección comienza acá
            </h3>

            <p className="text-white/35 text-sm mt-2 leading-relaxed">
              Cuando el equipo PR te otorgue una insignia, aparecerá en esta sección.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {featured.map((badge) => {
                const image = getBadgeImage(badge.titulo)

                return (
                  <article
                    key={`featured-${badge.id}`}
                    className="rounded-[24px] border border-pr-gold/15 bg-gradient-to-b from-pr-gold/[0.10] to-white/[0.025] p-3 text-center min-w-0"
                  >
                    <div className="aspect-square rounded-[20px] overflow-hidden border border-pr-gold/15 bg-black/30 grid place-items-center">
                      {image ? (
                        <img
                          src={image}
                          alt={badge.titulo}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl">🏅</span>
                      )}
                    </div>

                    <p className="text-white text-[11px] font-bold leading-tight mt-3">
                      {badge.titulo}
                    </p>
                  </article>
                )
              })}
            </div>

            <div className="space-y-3 mt-5">
              {badges.map((badge) => {
                const image = getBadgeImage(badge.titulo)

                return (
                  <article
                    key={badge.id}
                    className="rounded-[25px] border border-white/[0.07] bg-white/[0.025] p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 shrink-0 rounded-[22px] overflow-hidden border border-pr-gold/15 bg-black/30 grid place-items-center">
                        {image ? (
                          <img
                            src={image}
                            alt={badge.titulo}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-3xl">🏅</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-bold text-sm leading-tight">
                              {badge.titulo}
                            </p>

                            <p className="text-pr-gold text-[9px] font-bold uppercase tracking-[0.14em] mt-1">
                              Insignia PR
                            </p>
                          </div>

                          <span className="rounded-full border border-pr-gold/15 bg-pr-gold/10 px-2 py-1 text-pr-gold text-[8px] font-bold uppercase">
                            Obtenida
                          </span>
                        </div>

                        {badge.descripcion && (
                          <p className="text-white/45 text-xs mt-3 leading-relaxed">
                            {badge.descripcion}
                          </p>
                        )}

                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <p className="text-white/25 text-[10px]">
                            {formatDate(badge.fecha)}
                            {badge.creado_por_nombre
                              ? ` · Otorgada por ${badge.creado_por_nombre}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}


function PaymentStatusStrip({
  status,
  ultimoPago,
}) {
  const [open, setOpen] = useState(false)

  return (
    <section
      id="mensualidad"
      className={`rounded-[20px] border mt-3 overflow-hidden ${status.containerClass}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-[14px] grid place-items-center shrink-0 bg-black/25 border border-white/[0.06] text-base">
          {status.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-white/28 text-[8px] font-bold uppercase tracking-[0.16em]">
            Mensualidad PR
          </p>

          <p className="text-white text-sm font-bold mt-1 truncate">
            {status.title}
          </p>

          <p className="text-white/38 text-[10px] mt-0.5 truncate">
            {status.description}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${status.badgeClass}`}
          >
            {status.badge}
          </span>

          <span className="text-white/30 text-xs">
            {open ? '−' : '↓'}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="border-t border-white/[0.06] pt-3">
            <p className="text-white/45 text-xs leading-relaxed">
              {status.detail}
            </p>

            {ultimoPago && (
              <div className="rounded-2xl bg-black/20 border border-white/[0.05] px-3 py-2.5 mt-3">
                <p className="text-white/25 text-[9px] uppercase tracking-[0.14em]">
                  Último pago registrado
                </p>

                <p className="text-white/70 text-xs mt-1">
                  {formatPaymentDate(ultimoPago)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function ProfileActivitySignature({ stats }) {
  const hasActivity = stats.sessions > 0 || stats.kilometers > 0

  if (!hasActivity && stats.badges === 0) {
    return (
      <div className="rounded-[22px] border border-pr-gold/15 bg-gradient-to-r from-pr-gold/[0.08] to-white/[0.025] px-4 py-3.5 mt-5">
        <p className="text-pr-gold text-sm font-bold">
          🛼 Primeros pasos en Punta Rollers
        </p>
        <p className="text-white/35 text-[10px] mt-1">
          Tus entrenamientos y logros aparecerán automáticamente acá.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-black/20 p-3 mt-5">
      <div className="grid grid-cols-3 divide-x divide-white/[0.07]">
        <ProfileSignatureStat
          icon="🛼"
          value={stats.sessions}
          label="Entrenamientos"
        />
        <ProfileSignatureStat
          icon="📏"
          value={stats.kilometers.toLocaleString('es-UY', {
            minimumFractionDigits: stats.kilometers > 0 && stats.kilometers < 10 ? 1 : 0,
            maximumFractionDigits: 1,
          })}
          label="Km recorridos"
        />
        <ProfileSignatureStat
          icon="🏅"
          value={stats.badges}
          label="Insignias"
        />
      </div>

      {stats.weeklySessions > 0 && (
        <div className="border-t border-white/[0.06] mt-3 pt-3 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <p className="text-white/45 text-[10px] font-semibold">
            Activo esta semana · {stats.weeklySessions} sesión{stats.weeklySessions === 1 ? '' : 'es'} registrada{stats.weeklySessions === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  )
}

function ProfileSignatureStat({ icon, value, label }) {
  return (
    <div className="px-2 py-2 text-center min-w-0">
      <p className="text-sm">{icon}</p>
      <p className="font-display text-[24px] leading-none text-white mt-2 truncate">
        {value}
      </p>
      <p className="text-white/28 text-[8px] uppercase tracking-[0.10em] mt-1.5 truncate">
        {label}
      </p>
    </div>
  )
}

function MiniStat({ value, label }) {
  return (
    <div className="pr-card p-3 text-center">
      <p className="font-display text-[26px] text-pr-gold font-bold">
        {value}
      </p>

      <p className="section-label mt-1">
        {label}
      </p>
    </div>
  )
}

function Empty({ title, text }) {
  return (
    <div className="pr-card p-4 mt-4">
      <p className="text-white font-semibold text-sm">
        {title}
      </p>

      <p className="text-white/38 text-sm mt-1">
        {text}
      </p>
    </div>
  )
}

function Accordion({
  title,
  subtitle,
  open,
  onClick,
  children,
}) {
  return (
    <section className="pr-panel overflow-hidden">
      <button
        type="button"
        onClick={onClick}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div>
          <p className="font-display text-[22px] text-white font-bold">
            {title}
          </p>

          {subtitle && (
            <p className="text-white/30 text-[11px] mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <span className="w-8 h-8 rounded-full grid place-items-center bg-pr-gold/10 text-pr-gold text-xs">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  )
}

function Service({
  title,
  active,
  action,
  href,
}) {
  return (
    <div className="pr-card p-4 flex items-center justify-between mb-2">
      <div>
        <p className="text-white font-semibold text-sm">
          {title}
        </p>

        <p
          className={`text-xs mt-1 ${
            active
              ? 'text-emerald-400'
              : 'text-red-300'
          }`}
        >
          {active ? 'Activo' : 'Inactivo'}
        </p>
      </div>

      {active ? (
        <Link
          to={href}
          className="text-pr-gold text-xs"
        >
          {action} →
        </Link>
      ) : (
        <span className="text-white/20 text-xs">
          No disponible
        </span>
      )}
    </div>
  )
}

function ActivityList({
  items,
  empty,
  icon,
  badgeMode = false,
}) {
  if (!items.length) {
    return (
      <Empty
        title={empty}
        text="Cuando el equipo PR cargue información, aparecerá acá."
      />
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const badgeImage = badgeMode
          ? getBadgeImage(item.titulo)
          : ''

        return (
          <div
            key={item.id}
            className={`pr-card ${
              badgeMode
                ? 'p-3'
                : 'p-4 flex gap-3'
            }`}
          >
            {badgeMode ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-black/30 border border-pr-gold/15 grid place-items-center">
                  {badgeImage ? (
                    <img
                      src={badgeImage}
                      alt={item.titulo}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl">
                      🏅
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm">
                    {item.titulo}
                  </p>

                  {item.descripcion && (
                    <p className="text-white/42 text-xs mt-1 leading-relaxed">
                      {item.descripcion}
                    </p>
                  )}

                  <p className="text-white/25 text-[10px] mt-2">
                    {formatDate(item.fecha)}

                    {item.creado_por_nombre
                      ? ` · ${item.creado_por_nombre}`
                      : ''}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-xl">
                  {icon}
                </div>

                <div>
                  <p className="text-white font-semibold text-sm">
                    {item.titulo}
                  </p>

                  {item.descripcion && (
                    <p className="text-white/42 text-xs mt-1 leading-relaxed">
                      {item.descripcion}
                    </p>
                  )}

                  <p className="text-white/25 text-[10px] mt-2">
                    {formatDate(item.fecha)}

                    {item.creado_por_nombre
                      ? ` · ${item.creado_por_nombre}`
                      : ''}
                  </p>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EditInput({
  label,
  value,
  onChange,
  type = 'text',
}) {
  return (
    <label className="block">
      <span className="section-label">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="input-pr mt-2"
      />
    </label>
  )
            } 
