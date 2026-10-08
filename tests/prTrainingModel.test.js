import test from 'node:test'
import assert from 'node:assert/strict'
import { addTrainingStep, countsAsSubmitted, newTrainingDraft, participationPercent, validateTrainingDraft } from '../src/lib/prTrainingModel.js'

test('a fresh draft requires title, objective and both pathway steps', () => {
  const draft = newTrainingDraft()
  assert.equal(draft.variants.length, 2)
  assert.ok(validateTrainingDraft(draft).length > 0)
})

test('valid draft supports distinct practice and evidence steps', () => {
  let draft = newTrainingDraft()
  draft.title = 'Frenado progresivo'
  draft.objective = 'Practicar el frenado con seguridad'
  draft.cycle = '2026-11'
  for (const path of ['BASE', 'CONTINUIDAD']) {
    draft = addTrainingStep(draft, path, 'PRACTICA')
    draft = addTrainingStep(draft, path, 'EVIDENCIA')
  }
  for (const variant of draft.variants) {
    variant.steps[0].instructions = 'Practicar la técnica durante diez minutos'
    variant.steps[1].instructions = 'Enviar un video corto mostrando el ejercicio'
  }
  assert.deepEqual(validateTrainingDraft(draft), [])
})

test('a draft rejects duplicate pathways and invalid evidence', () => {
  const draft = newTrainingDraft()
  draft.variants[1].path = 'BASE'
  assert.ok(validateTrainingDraft(draft).some(error => error.includes('recorridos')))
})

test('participation counts valid submissions, not technical approvals', () => {
  assert.equal(participationPercent(8, 3), 38)
  assert.equal(participationPercent(8, 8), 100)
  assert.equal(participationPercent(0, 0), null)
  assert.equal(participationPercent(8, 9), null)
  assert.equal(countsAsSubmitted('CORRECCION_SOLICITADA'), true)
  assert.equal(countsAsSubmitted('REENVIO_EN_REVISION'), true)
  assert.equal(countsAsSubmitted('BORRADOR'), false)
})
