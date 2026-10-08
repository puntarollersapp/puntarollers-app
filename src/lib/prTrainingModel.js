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

export function validateTrainingDraft(draft) {
  const errors = []
  if (!draft || draft.version !== 2) return ['Versión de borrador incompatible']
  if (String(draft.title || '').trim().length < 5) errors.push('El título necesita al menos 5 caracteres')
  if (String(draft.objective || '').trim().length < 10) errors.push('El objetivo necesita al menos 10 caracteres')
  if (draft.cycle && !/^\d{4}-(0[1-9]|1[0-2])$/.test(draft.cycle)) errors.push('El ciclo debe tener formato AAAA-MM')
  if (!Array.isArray(draft.variants) || draft.variants.length !== 2 || new Set(draft.variants.map(v => v?.path)).size !== 2 || TRAINING_PATHS.some(path => !draft.variants.some(v => v?.path === path))) {
    errors.push('Deben existir los dos recorridos internos')
    return errors
  }
  for (const variant of draft.variants) {
    if (!variant || !['CON_TACO', 'SIN_TACO', 'AMBOS'].includes(variant.equipment)) errors.push('Condición de equipo inválida')
    if (!variant || !Array.isArray(variant.steps) || variant.steps.length === 0) {
      errors.push('Faltan pasos para el recorrido ' + (variant?.path || 'desconocido'))
      continue
    }
    for (const step of variant.steps) {
      if (!step || typeof step !== 'object') { errors.push('Paso vacío o inválido'); continue }
      if (!['PRACTICA', 'EVIDENCIA'].includes(step.kind)) errors.push('Tipo de paso inválido')
      if (String(step.instructions || '').trim().length < 10) errors.push('Un paso necesita instrucciones')
      if (step.kind === 'EVIDENCIA' && !TRAINING_EVIDENCE.includes(step.evidence)) errors.push('Tipo de evidencia inválido')
    }
  }
  return errors
}

export function addTrainingStep(draft, path, kind = 'PRACTICA') {
  if (!TRAINING_PATHS.includes(path) || !['PRACTICA', 'EVIDENCIA'].includes(kind)) throw new Error('Paso inválido')
  return {
    ...draft,
    variants: draft.variants.map(variant => variant.path === path
      ? { ...variant, steps: [...variant.steps, { kind, instructions: '', evidence: kind === 'EVIDENCIA' ? 'VIDEO' : null }] }
      : variant),
  }
}
