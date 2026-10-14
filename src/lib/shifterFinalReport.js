// Informe de cierre Shifter 2026. Funciones puras: no escriben ni alteran registros.
import { getValidTakes, groupTakesByDistance, formatDuration } from './prEngine'

export const SHIFTER_FINAL_LABEL = 'SHIFTER 2026 | TOMA FINAL'
export const SHIFTER_FINAL_DATE = null

export function buildShifterFinalReport(takes = [], { finalDate = SHIFTER_FINAL_DATE } = {}) {
  const grouped = groupTakesByDistance(getValidTakes(takes))
  return [6, 12].map((distance) => {
    const all = grouped[String(distance)] || []
    const dated = finalDate ? all.filter((take) => String(take.fecha || '').slice(0, 10) <= finalDate) : all
    const rows = dated.map((take) => ({
      id: take.id,
      date: take.fecha,
      takeNumber: take.numero_toma,
      seconds: take.tiempo_segundos,
      formattedTime: formatDuration(take.tiempo_segundos),
    }))
    const first = dated[0] || null
    const last = dated.at(-1) || null
    const best = dated.length ? dated.reduce((a, b) => a.tiempo_segundos <= b.tiempo_segundos ? a : b) : null
    const previous = dated.at(-2) || null
    const difference = first && last ? first.tiempo_segundos - last.tiempo_segundos : null
    const percent = first && last ? (difference / first.tiempo_segundos) * 100 : null
    let title = 'Tu primera referencia'
    let message = 'Esta marca es una referencia para seguir entrenando. Cada toma suma información para llegar mejor preparado.'
    if (previous) {
      const change = previous.tiempo_segundos - last.tiempo_segundos
      if (change > 0) {
        title = 'Tu última toma mejoró'
        message = 'Tu última toma fue más rápida que la anterior. Es un avance concreto y todavía queda preparación por delante.'
      } else if (change === 0 || Math.abs(change / previous.tiempo_segundos) < 0.015) {
        title = 'Sostuviste tu ritmo'
        message = 'Mantener un rendimiento parecido también demuestra constancia. Seguimos trabajando en cada detalle.'
      } else {
        title = difference > 0 ? 'Tu proceso muestra progreso' : 'Una toma no define tu preparación'
        message = difference > 0
          ? 'Aunque la última toma fue más lenta que la anterior, seguís por delante de tu primera marca. Valorá el recorrido.'
          : 'Los tiempos varían de una jornada a otra. Todo lo entrenado cuenta y todavía quedan oportunidades para mejorar.'
      }
    }
    return {
      distanceKm: distance, rows, count: rows.length,
      firstSeconds: first?.tiempo_segundos ?? null,
      finalSeconds: last?.tiempo_segundos ?? null,
      bestSeconds: best?.tiempo_segundos ?? null,
      differenceSeconds: difference, changePercent: percent,
      hasComparison: rows.length >= 2,
      title, message,
      // La fecha por sí sola no identifica una toma final: puede reprogramarse.
      finalRecorded: Boolean(last && /SHIFTER.*TOMA FINAL|TOMA FINAL.*SHIFTER/i.test([last.nombre,last.titulo,last.descripcion,last.etiqueta,last.observaciones].filter(Boolean).join(' '))),
    }
  })
}
