import { describe, expect, it } from 'vitest'
import { stravaDutyCode, validateStravaDuty } from './stravaTrainingV2Validation'
const id='12345678-ABCD-4321-ABCD-123456789012'
const code=stravaDutyCode(id)
const check=(dutyCode, activity, series)=>validateStravaDuty({assignmentDutyId:id,dutyCode,activity,series})
describe('PR Training V2 Strava validation',()=>{
 it('uses the same twelve-character duty token as the student UI',()=>expect(code).toBe('PRT-12345678ABCD'))
 it('rejects an unrelated activity',()=>expect(check('B3-10',{nombre:'Morning skate',distancia_metros:9000}).valid).toBe(false))
 it('requires the distance threshold',()=>{expect(check('B3-10',{nombre:code,distancia_metros:2999}).valid).toBe(false);expect(check('B3-10',{nombre:code,distancia_metros:3000}).valid).toBe(true)})
 it('requires fifteen moving minutes',()=>{expect(check('B3-04',{nombre:code,tiempo_movimiento_segundos:899}).valid).toBe(false);expect(check('B3-04',{nombre:code,tiempo_movimiento_segundos:900}).valid).toBe(true)})
 it('approves Entrenamos juntos after fifteen skating minutes',()=>{expect(check('B3-05',{nombre:code,tiempo_movimiento_segundos:900,deporte_strava:'InlineSkate'}).valid).toBe(true);expect(check('B3-05',{nombre:code,tiempo_movimiento_segundos:900,deporte_strava:'Ride'}).valid).toBe(false)})\n it('does not autoapprove unverified technique tasks',()=>expect(check('B3-09',{nombre:code,tiempo_movimiento_segundos:1800}).valid).toBe(false))
 it('requires four different series of at least 500m',()=>{const series=[1,2,3,4].map(i=>({id:String(i),nombre:code+' S'+i,distancia_metros:500}));expect(check('B3-13',{nombre:code},series).valid).toBe(true);expect(check('B3-13',{nombre:code},series.slice(0,3)).valid).toBe(false)})
})
