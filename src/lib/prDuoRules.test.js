import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canTransitionDuo, validateDuoParticipants, duoProgressPercent, validateDuoActivityPair } from './prDuoRules.js'
test('DUO requires distinct participants',()=>{assert.equal(validateDuoParticipants('a','a').ok,false);assert.equal(validateDuoParticipants('a','b').ok,true)})
test('DUO workflow forbids direct approval',()=>{assert.equal(canTransitionDuo('invited','approved'),false);assert.equal(canTransitionDuo('invited','accepted'),true)})
test('percent respects assigned duty count',()=>{assert.equal(duoProgressPercent(5,10),50);assert.equal(duoProgressPercent(5,6),83)})
test('Strava matching requires manual review',()=>{const a={profileId:'a',stravaActivityId:'1',distanceMeters:8100,startedAt:'2026-11-03T20:00:00Z'};const b={...a,profileId:'b',stravaActivityId:'2',startedAt:'2026-11-03T20:10:00Z'};assert.equal(validateDuoActivityPair(a,b,{minimumMeters:8000}).requiresManualReview,true)})
