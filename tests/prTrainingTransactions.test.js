import test from 'node:test'
import assert from 'node:assert/strict'
import { planTrainingReview, planTrainingSubmission } from '../src/lib/prTrainingTransactions.js'

test('authorized review increments revision without overwriting existing comments', () => {
  const assignment = { status: 'CUMPLIDO_EN_REVISION', revision: 4 }
  assert.deepEqual(planTrainingReview({ assignment, event: 'REQUEST_CORRECTION', expectedRevision: 4, reviewerId: 'teacher-a', authorized: true }), {
    ok: true, expectedRevision: 4, nextRevision: 5,
    nextStatus: 'CORRECCION_SOLICITADA', reviewerId: 'teacher-a', event: 'REQUEST_CORRECTION',
  })
  assert.equal(planTrainingReview({ assignment: { ...assignment, revision: 5 }, event: 'APPROVE', expectedRevision: 4, reviewerId: 'teacher-b', authorized: true }).reason, 'STALE_REVISION')
})

test('unassigned reviewer cannot access or change submission state', () => {
  const assignment = { status: 'REENVIO_EN_REVISION', revision: 2 }
  assert.equal(planTrainingReview({ assignment, event: 'APPROVE', expectedRevision: 2, reviewerId: 'teacher-a', authorized: false }).reason, 'FORBIDDEN')
  assert.equal(planTrainingReview({ assignment, event: 'SUBMIT', expectedRevision: 2, reviewerId: 'teacher-a', authorized: true }).reason, 'INVALID_REVIEW_EVENT')
})

test('only owning student may submit and only from permitted state', () => {
  const assignment = { studentId: 'student-a', status: 'PENDIENTE', revision: 0 }
  assert.equal(planTrainingSubmission({ assignment, event: 'SUBMIT', expectedRevision: 0, studentId: 'student-b' }).reason, 'FORBIDDEN')
  assert.equal(planTrainingSubmission({ assignment, event: 'RESUBMIT', expectedRevision: 0, studentId: 'student-a' }).reason, 'INVALID_TRANSITION')
  assert.equal(planTrainingSubmission({ assignment, event: 'SUBMIT', expectedRevision: 0, studentId: 'student-a' }).nextStatus, 'CUMPLIDO_EN_REVISION')
  assert.equal(planTrainingSubmission({ assignment: { ...assignment, revision: 1 }, event: 'SUBMIT', expectedRevision: 0, studentId: 'student-a' }).reason, 'STALE_REVISION')
})
