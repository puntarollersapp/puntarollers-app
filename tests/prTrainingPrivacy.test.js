import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedTrainingUpload, mayManageTrainingCycle, mayReviewTrainingSubmission, mayViewTrainingEvidence, publicTrainingCompletionEvent } from '../src/lib/prTrainingPrivacy.js'

test('private evidence is available only to its owner or an authorized teacher', () => {
  const base = { viewerId: 'user-a', ownerId: 'user-b' }
  assert.equal(mayViewTrainingEvidence({ ...base, viewerRole: 'alumno' }), false)
  assert.equal(mayViewTrainingEvidence({ ...base, viewerRole: 'profesor', isAuthorizedTeacher: false }), false)
  assert.equal(mayViewTrainingEvidence({ ...base, viewerRole: 'profesor', isAuthorizedTeacher: true }), true)
  assert.equal(mayViewTrainingEvidence({ viewerId: 'user-b', ownerId: 'user-b' }), true)
  assert.equal(mayViewTrainingEvidence({ viewerId: 'user-b', ownerId: 'user-b', suspended: true }), false)
})

test('publishing cycles is admin-only and reviewing requires staff authorization', () => {
  assert.equal(mayManageTrainingCycle({ viewerRole: 'profesor' }), false)
  assert.equal(mayManageTrainingCycle({ viewerRole: 'admin' }), true)
  assert.equal(mayReviewTrainingSubmission({ viewerRole: 'profesor', isAuthorizedTeacher: false }), false)
  assert.equal(mayReviewTrainingSubmission({ viewerRole: 'profesor', isAuthorizedTeacher: true }), true)
})

test('feed events never include private evidence or pathway and require consent', () => {
  const base = { submissionId: 'sub-1', studentDisplayName: 'Alumna', taskPublicTitle: 'Frenado', studentFeedConsent: true }
  assert.equal(publicTrainingCompletionEvent({ ...base, isMinor: true, guardianConsent: false }), null)
  const event = publicTrainingCompletionEvent({ ...base, isMinor: true, guardianConsent: true, evidenceUrl: 'private', path: 'BASE', teacherFeedback: 'private' })
  assert.deepEqual(Object.keys(event).sort(), ['eventType', 'idempotencyKey', 'studentDisplayName', 'taskPublicTitle'])
  assert.equal(event.idempotencyKey, 'training-completed:sub-1')
})

test('uploads reject missing types, oversized and empty files', () => {
  const base = { mimeType: 'video/mp4', bytes: 1024, allowedMimeTypes: ['video/mp4'], maxBytes: 2048 }
  assert.equal(isAllowedTrainingUpload(base), true)
  assert.equal(isAllowedTrainingUpload({ ...base, bytes: 3000 }), false)
  assert.equal(isAllowedTrainingUpload({ ...base, bytes: 0 }), false)
  assert.equal(isAllowedTrainingUpload({ ...base, mimeType: 'application/octet-stream' }), false)
})
