export const TRAINING_PATHS = ['BASE', 'CONTINUIDAD']
export const TRAINING_EVIDENCE = ['CONFIRMACION', 'FOTO', 'VIDEO', 'STRAVA']
export const TRAINING_STATUSES = ['PENDIENTE', 'BORRADOR', 'CUMPLIDO_EN_REVISION', 'CORRECCION_SOLICITADA', 'REENVIO_EN_REVISION', 'APROBADO']
export function newTrainingDraft() {
  return { version: 2, title: '', objective: '', cycle: '', variants: TRAINING_PATHS.map(path => ({ path, equipment: 'AMBOS', steps: [] })) }
}
export function countsAsSubmitted(status) {
  return ['CUMPLIDO_EN_REVISION', 'CORRECCION_SOLICITADA', 'REENVIO_EN_REVISION', 'APROBADO'].includes(status)
}
export function participationPercent(required, submitted) {
  if (!Number.isInteger(required) || !Number.isInteger(submitted) || required <= 0 || submitted < 0 || submitted > required) return null
  return Math.round(submitted * 100 / required)
}
