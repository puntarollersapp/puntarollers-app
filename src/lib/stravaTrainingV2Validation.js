// PR Training 2.0 — pure Strava activity validator.
// This module intentionally does not approve video or ambiguous training tasks.
export function stravaDutyCode(assignmentDutyId) {
  return 'PRT-' + String(assignmentDutyId || '').replace(/-/g, '').slice(0, 12).toUpperCase()
}
export function validateStravaDuty({ assignmentDutyId, dutyCode, activity, series = [] }) {
  const sport = String(activity?.deporte_strava || activity?.sport_type || activity?.type || 'InlineSkate')\n  if (sport !== 'InlineSkate') return { valid: false, reason: 'not_inline_skating' }\n  const code = stravaDutyCode(assignmentDutyId)
  const name = String(activity?.nombre || activity?.name || '').toUpperCase()
  const exact = new RegExp('(?:^|[^A-Z0-9])' + code + '(?=$|[^A-Z0-9])').test(name)
  if (!exact) return { valid: false, reason: 'code_mismatch' }
  const meters = Number(activity?.distancia_metros ?? activity?.distance ?? 0)
  const seconds = Number(activity?.tiempo_movimiento_segundos ?? activity?.moving_time ?? 0)
  if (dutyCode === 'B3-04' || dutyCode === 'B3-17') return { valid: seconds >= 900, reason: seconds >= 900 ? 'ok' : 'duration_short' }
  if (dutyCode === 'B3-10' || dutyCode === 'B3-11' || dutyCode === 'B3-12') {
    const threshold = { 'B3-10': 3000, 'B3-11': 6000, 'B3-12': 10000 }[dutyCode]
    return { valid: meters >= threshold, reason: meters >= threshold ? 'ok' : 'distance_short' }
  }
  if (dutyCode === 'B3-13') {
    const bySeries = new Map()
    for (const a of series) {
      if (String(a?.deporte_strava || a?.sport_type || a?.type || 'InlineSkate') !== 'InlineSkate') continue\n      const n = String(a?.nombre || a?.name || '').toUpperCase()
      const match = n.match(new RegExp('(?:^|[^A-Z0-9])' + code + '\\s+S([1-4])(?=$|[^A-Z0-9])'))
      const distance = Number(a?.distancia_metros ?? a?.distance ?? 0)
      const id = String(a?.strava_activity_id ?? a?.id ?? '')
      if (match && distance >= 500 && id) bySeries.set(Number(match[1]), id)
    }
    return { valid: bySeries.size === 4 && new Set(bySeries.values()).size === 4, reason: bySeries.size === 4 ? 'ok' : 'series_incomplete', completedSeries: bySeries.size }
  }
  return { valid: false, reason: 'manual_review_required' }
}
