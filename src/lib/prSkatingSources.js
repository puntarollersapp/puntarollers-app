export function skatingSource(row) {
  if (!row) return null
  const source = String(row.fuente || 'strava').trim().toLowerCase()
  return source === 'strava' || source === 'prgo' ? source : null
}

export function publicSkatingActivity(row) {
  return Boolean(skatingSource(row) && row.eliminada !== true && row.es_privada !== true &&
    row.privada !== true && row.privado !== true && row.visible_feed !== false)
}

function duration(row) {
  return Number(row.tiempo_total_segundos || row.duracion_segundos || row.tiempo_transcurrido_segundos || row.tiempo_movimiento_segundos) || 0
}

function sameOuting(prgo, strava) {
  const started = Date.parse(prgo.fecha_inicio)
  const otherStart = Date.parse(strava.fecha_inicio)
  const span = duration(prgo)
  const otherSpan = duration(strava)
  const meters = Number(prgo.distancia_metros)
  const otherMeters = Number(strava.distancia_metros)
  if (!(span > 0 && otherSpan > 0 && meters > 0 && otherMeters > 0)) return false
  const overlap = Math.min(started + span * 1000, otherStart + otherSpan * 1000) - Math.max(started, otherStart)
  return overlap >= Math.max(span, otherSpan) * 800 &&
    Math.abs(meters - otherMeters) <= Math.max(100, Math.max(meters, otherMeters) * .15)
}

// Keep the existing Strava credit if the same member records the same ride twice.
// Private rows must be filtered by the caller before building public results.
export function combineSkatingSources(rows) {
  const byMember = new Map()
  const seen = new Set()
  const unique = rows.filter(row => {
    const source = skatingSource(row)
    if (!source) return false
    if (row.id == null) return true
    const key = JSON.stringify([String(row.alumno_id ?? ''), source, String(row.id)])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  for (const row of unique) {
    if (skatingSource(row) !== 'strava' || row.alumno_id == null) continue
    const id = String(row.alumno_id)
    const activities = byMember.get(id) || []
    activities.push(row)
    byMember.set(id, activities)
  }
  return unique.filter(row => skatingSource(row) !== 'prgo' ||
    !byMember.get(String(row.alumno_id))?.some(strava => sameOuting(row, strava)))
}

const pilotApi = 'https://api-v2.appdeploy.ai/app/pr-go-comunidad-piloto-jt1051/api/'

export async function readPrGoActivities(token, fetcher = fetch) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const response = await fetcher(pilotApi + (token ? 'my-activities' : 'public-activities'), {
      credentials: 'omit', redirect: 'error', signal: controller.signal,
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { token } : {}),
    })
    if (!response.ok || response.redirected) return []
    const data = await response.json()
    return data.schema === 1 && Array.isArray(data.activities)
      ? data.activities.filter(row => row?.fuente === 'prgo' && row.alumno_id && Number(row.distancia_metros) > 0)
      : []
  } catch { return [] }
  finally { clearTimeout(timeout) }
}

export function addPrGoToRanking(base, strava, prgo, range) {
  const inRange = row => {
    const date = Date.parse(row.fecha_inicio)
    return date >= Date.parse(range.start + 'T00:00:00-03:00') &&
      date <= Date.parse(range.end + 'T23:59:59.999-03:00')
  }
  const combined = combineSkatingSources([...strava, ...prgo])
  const result = new Map(base.map(row => [String(row.alumno_id), { ...row }]))
  for (const row of combined.filter(row => skatingSource(row) === 'prgo' && inRange(row))) {
    const id = String(row.alumno_id)
    const entry = result.get(id) || { alumno_id: id, km: 0, sessions: 0 }
    entry.km = Number(entry.km) + Number(row.distancia_metros) / 1000
    entry.sessions = Number(entry.sessions) + 1
    result.set(id, entry)
  }
  return [...result.values()]
}
