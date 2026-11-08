import test from 'node:test'
import assert from 'node:assert/strict'
import { addPrGoToRanking, combineSkatingSources, publicSkatingActivity } from './prSkatingSources.js'

const strava = { id: '1', alumno_id: 'a', fuente: 'strava', fecha_inicio: '2026-11-07T18:00:00Z', duracion_segundos: 1200, distancia_metros: 2100 }
const prgo = { ...strava, id: '2', fuente: 'prgo', fecha_inicio: '2026-11-07T18:00:20Z', distancia_metros: 2040 }

test('a matching outing and retried import count once while other athletes and outings count separately', () => {
  const later = { ...prgo, id: '3', fecha_inicio: '2026-11-07T20:00:00Z' }
  const other = { ...prgo, alumno_id: 'b' }
  assert.deepEqual(combineSkatingSources([prgo, later, strava, other, later]), [later, strava, other])
})

test('private PR GO is excluded from community views without erasing public Strava', () => {
  assert.deepEqual(combineSkatingSources([strava, { ...prgo, es_privada: true }].filter(publicSkatingActivity)), [strava])
  assert.equal(publicSkatingActivity({ ...prgo, visible_feed: false }), false)
  assert.equal(publicSkatingActivity({ ...prgo, fuente: 'other' }), false)
})


test('ranking keeps existing Strava totals and adds only distinct PR GO inside the period', () => {
  const another = { ...prgo, id: '3', fecha_inicio: '2026-11-07T20:00:00Z', distancia_metros: 1000 }
  const outside = { ...prgo, id: '4', fecha_inicio: '2026-11-08T23:00:00Z' }
  const base = [{ alumno_id: 'a', km: 2.1, sessions: 1 }]
  assert.deepEqual(addPrGoToRanking(base, [strava], [prgo, another, outside], { start: '2026-11-07', end: '2026-11-07' }),
    [{ alumno_id: 'a', km: 3.1, sessions: 2 }])
})
