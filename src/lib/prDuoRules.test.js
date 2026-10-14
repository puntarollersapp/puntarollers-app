import { describe,it,expect } from 'vitest'
import { canTransitionDuo,validateDuoParticipants,duoProgressPercent,validateDuoActivityPair } from './prDuoRules'
describe('PR DUO collaboration rules',()=>{
 it('requires distinct profiles',()=>{expect(validateDuoParticipants('a','a').ok).toBe(false);expect(validateDuoParticipants('a','b').ok).toBe(true)})
 it('only allows permitted workflow transitions',()=>{expect(canTransitionDuo('invited','accepted')).toBe(true);expect(canTransitionDuo('invited','approved')).toBe(false);expect(canTransitionDuo('approved','submitted')).toBe(false)})
 it('uses each level own duty count',()=>{expect(duoProgressPercent(5,10)).toBe(50);expect(duoProgressPercent(5,6)).toBe(83);expect(duoProgressPercent(0,0)).toBe(null)})
 it('requires two compatible Strava activities but still demands review',()=>{const a={profileId:'a',stravaActivityId:'1',distanceMeters:8100,startedAt:'2026-11-03T20:00:00Z'};const b={...a,profileId:'b',stravaActivityId:'2',startedAt:'2026-11-03T20:10:00Z'};expect(validateDuoActivityPair(a,b,{minimumMeters:8000}).requiresManualReview).toBe(true);expect(validateDuoActivityPair(a,{...b,startedAt:'2026-11-04T20:00:00Z'},{minimumMeters:8000}).ok).toBe(false)})
})
