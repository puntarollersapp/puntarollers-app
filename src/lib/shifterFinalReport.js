// Informe de cierre Shifter 2026. Funciones puras: no escriben ni alteran registros.
import { getValidTakes, groupTakesByDistance, formatDuration } from './prEngine'

export const SHIFTER_FINAL_LABEL = 'SHIFTER 2026 | TOMA FINAL'
export const SHIFTER_FINAL_DATE = '2026-10-14'

export function buildShifterFinalReport(takes = [], { finalDate = SHIFTER_FINAL_DATE } = {}) {
  const grouped = groupTakesByDistance(getValidTakes(takes))
  return [6, 12].map((distance) => {
    const all = grouped[String(distance)] || []
    const dated = all.filter((take) => String(take.fecha || '').slice(0, 10) <= finalDate)
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
    let message = 'Esta marca es parte de tu preparación. Disfrutá la Shifter y todo lo aprendido.'
    if (previous) {
      const change = previous.tiempo_segundos - last.tiempo_segundos
      if (change > 0) {
        title = 'Cerraste con una mejora'
        message = 'Tu última toma fue más rápida que la anterior. Disfrutá este avance y llegá descansado a la Shifter.'
      } else if (change === 0 || Math.abs(change / previous.tiempo_segundos) < 0.015) {
        title = 'Sostuviste tu ritmo'
        message = 'Mantener un rendimiento parecido también demuestra constancia. Ahora toca recuperar y disfrutar la carrera.'
      } else {
        title = difference > 0 ? 'Tu proceso muestra progreso' : 'Una toma no define tu preparación'
        message = difference > 0
          ? 'Aunque hoy el tiempo fue mayor, terminaste mejor que al comenzar. Valorá el recorrido y disfrutá la Shifter.'
          : 'Los tiempos varían de una jornada a otra. Todo lo entrenado cuenta; preparate para disfrutar la Shifter.'
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
      // No marcar cierre si la última toma no corresponde al día final.
      finalRecorded: Boolean(last && String(last.fecha || '').slice(0, 10) === finalDate),
    }
  })
}
