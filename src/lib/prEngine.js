// src/lib/prEngine.js
// Motor central de PR Performance.
// Todos los cálculos son derivados de las tomas existentes:
// al cargar una toma nueva, perfiles, evolución, objetivos y rankings
// pueden recalcularse automáticamente sin guardar resultados duplicados.

export const STANDARD_DISTANCES = Object.freeze({
  TWO_K: 2,
  SIX_K: 6,
  TEN_K: 10,
  TWELVE_K: 12,
})

const DISTANCE_TOLERANCES = Object.freeze([
  { min: 1.5, max: 2.5, value: 2 },
  { min: 5, max: 7, value: 6 },
  { min: 9, max: 10.75, value: 10 },
  { min: 10.76, max: 13.5, value: 12 },
])

export function normalizeDistance(value) {
  const distance = Number(value)

  if (!Number.isFinite(distance) || distance <= 0) return 0

  const standard = DISTANCE_TOLERANCES.find(
    (range) => distance >= range.min && distance <= range.max
  )

  if (standard) return standard.value

  return Math.round(distance * 100) / 100
}

export function distanceKey(value) {
  const normalized = normalizeDistance(value)
  return normalized ? String(normalized) : ''
}

export function parseDuration(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0
  }

  const clean = String(value || '')
    .trim()
    .replace(/[,.]/g, ':')

  if (!clean) return 0

  if (/^\d+$/.test(clean)) {
    const seconds = Number(clean)
    return seconds > 0 ? seconds : 0
  }

  const parts = clean.split(':').map(Number)

  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return 0
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    if (seconds >= 60) return 0
    return minutes * 60 + seconds
  }

  const [hours, minutes, seconds] = parts
  if (minutes >= 60 || seconds >= 60) return 0

  return hours * 3600 + minutes * 60 + seconds
}

export function formatDuration(value) {
  const totalSeconds = Math.max(0, Math.round(Number(value) || 0))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`
}

export function formatDistance(value) {
  const distance = normalizeDistance(value)

  if (!distance) return 'Sin distancia'

  return `${Number.isInteger(distance) ? distance : distance.toFixed(2)}K`
}

export function calculatePaceSeconds(distanceKm, timeSeconds) {
  const distance = Number(distanceKm)
  const seconds = Number(timeSeconds)

  if (!Number.isFinite(distance) || distance <= 0) return 0
  if (!Number.isFinite(seconds) || seconds <= 0) return 0

  return seconds / distance
}

export function calculateSpeedKmh(distanceKm, timeSeconds) {
  const distance = Number(distanceKm)
  const seconds = Number(timeSeconds)

  if (!Number.isFinite(distance) || distance <= 0) return 0
  if (!Number.isFinite(seconds) || seconds <= 0) return 0

  return distance / (seconds / 3600)
}

export function normalizeTake(take) {
  const rawDistance = Number(take?.distancia_km)
  const timeSeconds = Number(take?.tiempo_segundos)
  const distance = normalizeDistance(rawDistance)

  if (!distance || !Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    return null
  }

  return {
    ...take,
    distancia_original_km: rawDistance,
    distancia_normalizada_km: distance,
    distancia_clave: String(distance),
    tiempo_segundos: timeSeconds,
    ritmo_segundos_km:
      Number(take?.ritmo_segundos_km) ||
      calculatePaceSeconds(rawDistance || distance, timeSeconds),
    velocidad_kmh:
      Number(take?.velocidad_kmh) ||
      calculateSpeedKmh(rawDistance || distance, timeSeconds),
    numero_toma: Number(take?.numero_toma) || 0,
    fecha: take?.fecha || '',
  }
}

export function getValidTakes(takes = []) {
  return takes
    .filter((take) => take && take.eliminado !== true)
    .map(normalizeTake)
    .filter(Boolean)
}

function compareTakesChronologically(a, b) {
  const dateA = new Date(a.fecha || 0).getTime()
  const dateB = new Date(b.fecha || 0).getTime()

  if (dateA !== dateB) return dateA - dateB
  return Number(a.numero_toma || 0) - Number(b.numero_toma || 0)
}

export function groupTakesByDistance(takes = []) {
  const groups = {}

  getValidTakes(takes).forEach((take) => {
    const key = take.distancia_clave

    if (!groups[key]) groups[key] = []
    groups[key].push(take)
  })

  Object.values(groups).forEach((group) => {
    group.sort(compareTakesChronologically)
  })

  return groups
}

export function buildDistanceSummary(takes = [], distanceValue) {
  const key = distanceKey(distanceValue)
  const group = groupTakesByDistance(takes)[key] || []

  if (!group.length) {
    return {
      distance: normalizeDistance(distanceValue),
      count: 0,
      first: null,
      previous: null,
      latest: null,
      best: null,
      averageSeconds: 0,
      latestChangeSeconds: 0,
      latestChangePercent: 0,
      totalImprovementSeconds: 0,
      totalImprovementPercent: 0,
      hasComparison: false,
      personalRecord: false,
    }
  }

  const first = group[0]
  const latest = group[group.length - 1]
  const previous = group.length >= 2 ? group[group.length - 2] : null
  const best = [...group].sort(
    (a, b) => a.tiempo_segundos - b.tiempo_segundos
  )[0]

  const averageSeconds =
    group.reduce((sum, take) => sum + take.tiempo_segundos, 0) / group.length

  const latestChangeSeconds = previous
    ? previous.tiempo_segundos - latest.tiempo_segundos
    : 0

  const latestChangePercent =
    previous?.tiempo_segundos > 0
      ? (latestChangeSeconds / previous.tiempo_segundos) * 100
      : 0

  const totalImprovementSeconds =
    first.tiempo_segundos - best.tiempo_segundos

  const totalImprovementPercent =
    first.tiempo_segundos > 0
      ? (totalImprovementSeconds / first.tiempo_segundos) * 100
      : 0

  return {
    distance: Number(key),
    count: group.length,
    first,
    previous,
    latest,
    best,
    averageSeconds,
    latestChangeSeconds,
    latestChangePercent,
    totalImprovementSeconds,
    totalImprovementPercent,
    hasComparison: group.length >= 2,
    personalRecord:
      Boolean(previous) &&
      latest.tiempo_segundos <= best.tiempo_segundos &&
      latest.id === best.id,
  }
}

export function buildStudentPerformance(takes = []) {
  const validTakes = getValidTakes(takes)
  const grouped = groupTakesByDistance(validTakes)

  const distances = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)

  const summaries = distances.map((distance) =>
    buildDistanceSummary(validTakes, distance)
  )

  const bestSummary =
    [...summaries]
      .filter((summary) => summary.best)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return b.distance - a.distance
      })[0] || null

  const latestTake =
    [...validTakes].sort(compareTakesChronologically).at(-1) || null

  const improvements = summaries.filter(
    (summary) => summary.hasComparison && summary.latestChangeSeconds > 0
  )

  const stable = summaries.filter(
    (summary) =>
      summary.hasComparison &&
      Math.abs(summary.latestChangePercent) < 1.5
  )

  return {
    totalRecords: validTakes.length,
    totalTakeInstances: new Set(
      validTakes.map((take) => String(take.numero_toma))
    ).size,
    distances,
    summaries,
    bestSummary,
    latestTake,
    comparisonCount: summaries.filter((summary) => summary.hasComparison)
      .length,
    improvedDistanceCount: improvements.length,
    stableDistanceCount: stable.length,
    hasAnyComparison: summaries.some((summary) => summary.hasComparison),
  }
}

export function getMotivationalMessage(summary) {
  if (!summary || !summary.count) {
    return {
      tone: 'neutral',
      title: 'Tu recorrido empieza acá',
      text: 'La próxima toma nos permitirá comenzar a construir tu evolución personal.',
    }
  }

  if (!summary.hasComparison) {
    return {
      tone: 'neutral',
      title: 'Primera referencia registrada',
      text: 'Esta marca es tu punto de partida. La próxima toma permitirá visualizar tu progreso.',
    }
  }

  if (summary.latestChangePercent >= 5) {
    return {
      tone: 'celebration',
      title: '¡Gran avance personal!',
      text: `Mejoraste ${formatDuration(
        Math.abs(summary.latestChangeSeconds)
      )} respecto a tu toma anterior.`,
    }
  }

  if (summary.latestChangeSeconds > 0) {
    return {
      tone: 'positive',
      title: 'Seguís avanzando',
      text: `Lograste mejorar ${formatDuration(
        summary.latestChangeSeconds
      )}. Cada pequeño avance suma.`,
    }
  }

  if (Math.abs(summary.latestChangePercent) < 1.5) {
    return {
      tone: 'stable',
      title: 'Rendimiento estable',
      text: 'Sostener tu nivel también es parte del progreso. Esta toma suma experiencia y constancia.',
    }
  }

  return {
    tone: 'supportive',
    title: 'Una toma más para aprender',
    text: 'No todas las jornadas se sienten iguales. Este registro nos ayuda a ajustar el entrenamiento sin borrar todo lo que ya avanzaste.',
  }
}

export function calculateObjectiveProgress(objective, takes = []) {
  const distance = normalizeDistance(objective?.distancia_km)
  const targetSeconds = Number(objective?.tiempo_objetivo_segundos)
  const summary = buildDistanceSummary(takes, distance)

  if (!distance || !targetSeconds || !summary.best) {
    return {
      distance,
      targetSeconds,
      currentSeconds: 0,
      remainingSeconds: 0,
      progressPercent: 0,
      completed: false,
      summary,
    }
  }

  const currentSeconds = summary.best.tiempo_segundos
  const baselineSeconds = summary.first?.tiempo_segundos || currentSeconds

  const completed = currentSeconds <= targetSeconds
  const totalGap = Math.max(1, baselineSeconds - targetSeconds)
  const coveredGap = Math.max(0, baselineSeconds - currentSeconds)

  return {
    distance,
    targetSeconds,
    currentSeconds,
    remainingSeconds: Math.max(0, currentSeconds - targetSeconds),
    progressPercent: completed
      ? 100
      : Math.max(0, Math.min(99, (coveredGap / totalGap) * 100)),
    completed,
    summary,
  }
}

export function buildRankingEntries({
  profiles = [],
  takes = [],
  distance,
  groupName = '',
  includeInactive = false,
} = {}) {
  const normalizedDistance = normalizeDistance(distance)

  const profileMap = new Map(
    profiles
      .filter((profile) => profile?.id)
      .map((profile) => [String(profile.id), profile])
  )

  const takesByStudent = getValidTakes(takes).reduce((groups, take) => {
    const studentId = String(take.alumno_id || '')
    if (!studentId) return groups

    if (!groups[studentId]) groups[studentId] = []
    groups[studentId].push(take)
    return groups
  }, {})

  const entries = Object.entries(takesByStudent)
    .map(([studentId, studentTakes]) => {
      const profile = profileMap.get(studentId)
      if (!profile) return null

      if (
        !includeInactive &&
        String(profile.estado || 'Activo').toLowerCase() !== 'activo'
      ) {
        return null
      }

      if (groupName) {
        const groups = Array.isArray(profile.grupos_info)
          ? profile.grupos_info
          : Array.isArray(profile.gruposInfo)
          ? profile.gruposInfo
          : []

        const belongs = groups.some((group) =>
          String(group?.titulo || '')
            .toLowerCase()
            .includes(String(groupName).toLowerCase())
        )

        if (!belongs) return null
      }

      const summary = buildDistanceSummary(studentTakes, normalizedDistance)
      if (!summary.best) return null

      return {
        studentId,
        profile,
        distance: normalizedDistance,
        bestSeconds: summary.best.tiempo_segundos,
        bestTake: summary.best,
        takeCount: summary.count,
        improvementPercent: summary.totalImprovementPercent,
        latestChangeSeconds: summary.latestChangeSeconds,
        displayName:
          profile.nombre_ranking ||
          profile.apodo ||
          `${profile.nombre || ''} ${profile.apellido || ''}`.trim(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.bestSeconds !== b.bestSeconds) {
        return a.bestSeconds - b.bestSeconds
      }

      return b.takeCount - a.takeCount
    })

  return entries.map((entry, index) => ({
    ...entry,
    position: index + 1,
    totalParticipants: entries.length,
    positionLabel: `${index + 1} de ${entries.length}`,
  }))
}

export function buildProgressRanking({
  profiles = [],
  takes = [],
  distance,
  groupName = '',
} = {}) {
  return buildRankingEntries({
    profiles,
    takes,
    distance,
    groupName,
  })
    .filter((entry) => entry.takeCount >= 2)
    .sort((a, b) => b.improvementPercent - a.improvementPercent)
    .map((entry, index, entries) => ({
      ...entry,
      position: index + 1,
      totalParticipants: entries.length,
      positionLabel: `${index + 1} de ${entries.length}`,
    }))
}

export function getPersonalRankingMessage(entry) {
  if (!entry) {
    return {
      title: 'Todavía no aparecés en este ranking',
      text: 'Cuando tengas una toma válida en esta distancia, tu posición se calculará automáticamente.',
    }
  }

  const { position, totalParticipants } = entry

  if (position === 1) {
    return {
      title: 'Tu marca se destaca',
      text: 'Hoy ocupás la primera posición, pero tu principal referencia sigue siendo tu propio progreso.',
    }
  }

  const percentile = totalParticipants
    ? position / totalParticipants
    : 1

  if (percentile <= 0.35) {
    return {
      title: 'Estás en un gran momento',
      text: `Tu posición actual es ${entry.positionLabel}. Seguí enfocándote en tu propia evolución.`,
    }
  }

  return {
    title: 'Tu posición actual',
    text: `${entry.positionLabel}. Este dato es una referencia deportiva, no una medida de tu esfuerzo ni de tu valor dentro del equipo.`,
  }
}

export function detectAutomaticAchievements(takes = []) {
  const performance = buildStudentPerformance(takes)
  const achievements = []

  if (performance.summaries.some((summary) => summary.distance === 6)) {
    achievements.push({
      key: 'primeros-6k',
      title: 'Primeros 6K',
      reason: 'Completó una toma válida en la distancia de 6K.',
    })
  }

  if (performance.summaries.some((summary) => summary.distance === 10)) {
    achievements.push({
      key: 'primeros-10k',
      title: 'Primeros 10K',
      reason: 'Completó una toma válida en la distancia de 10K.',
    })
  }

  performance.summaries.forEach((summary) => {
    if (summary.personalRecord) {
      achievements.push({
        key: `nuevo-pr-${summary.distance}k`,
        title: `Nueva mejor marca en ${formatDistance(summary.distance)}`,
        reason: `Mejoró su registro personal hasta ${formatDuration(
          summary.best.tiempo_segundos
        )}.`,
      })
    }

    if (summary.count >= 5) {
      achievements.push({
        key: `constancia-${summary.distance}k`,
        title: `Constancia en ${formatDistance(summary.distance)}`,
        reason: `Acumuló ${summary.count} tomas válidas en esta distancia.`,
      })
    }
  })

  return achievements
}

export function buildAutomaticPerformanceData({
  profiles = [],
  takes = [],
  objectives = [],
  distances = [6, 12],
} = {}) {
  const takesByStudent = getValidTakes(takes).reduce((groups, take) => {
    const studentId = String(take.alumno_id || '')
    if (!studentId) return groups

    if (!groups[studentId]) groups[studentId] = []
    groups[studentId].push(take)
    return groups
  }, {})

  const objectivesByStudent = objectives.reduce((groups, objective) => {
    const studentId = String(objective?.alumno_id || '')
    if (!studentId || objective?.eliminado === true) return groups

    if (!groups[studentId]) groups[studentId] = []
    groups[studentId].push(objective)
    return groups
  }, {})

  const students = profiles.map((profile) => {
    const studentTakes = takesByStudent[String(profile.id)] || []
    const studentObjectives =
      objectivesByStudent[String(profile.id)] || []

    return {
      profile,
      performance: buildStudentPerformance(studentTakes),
      objectives: studentObjectives.map((objective) => ({
        ...objective,
        automaticProgress: calculateObjectiveProgress(
          objective,
          studentTakes
        ),
      })),
      suggestedAchievements: detectAutomaticAchievements(studentTakes),
    }
  })

  const rankings = Object.fromEntries(
    distances.map((distance) => [
      String(normalizeDistance(distance)),
      buildRankingEntries({
        profiles,
        takes,
        distance,
      }),
    ])
  )

  const progressRankings = Object.fromEntries(
    distances.map((distance) => [
      String(normalizeDistance(distance)),
      buildProgressRanking({
        profiles,
        takes,
        distance,
      }),
    ])
  )

  return {
    generatedAt: new Date().toISOString(),
    students,
    rankings,
    progressRankings,
  }
      }
