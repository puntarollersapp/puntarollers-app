// Pure concurrency guards for PR Training 2.0.
// The database must enforce these checks atomically in a transaction.
import { nextTrainingStatus } from './prTrainingModel.js'

export function planTrainingReview({ assignment, event, expectedRevision, reviewerId, authorized }) {
  if (!assignment || !Number.isSafeInteger(assignment.revision) || assignment.revision < 0) {
    return { ok: false, reason: 'INVALID_ASSIGNMENT' }
  }
  if (!authorized || !reviewerId) return { ok: false, reason: 'FORBIDDEN' }
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== assignment.revision) {
    return { ok: false, reason: 'STALE_REVISION' }
  }
  if (!['APPROVE', 'REQUEST_CORRECTION'].includes(event)) {
    return { ok: false, reason: 'INVALID_REVIEW_EVENT' }
  }
  const nextStatus = nextTrainingStatus(assignment.status, event)
  if (!nextStatus) return { ok: false, reason: 'INVALID_TRANSITION' }
  return {
    ok: true,
    expectedRevision,
    nextRevision: expectedRevision + 1,
    nextStatus,
    reviewerId,
    event,
  }
}

export function planTrainingSubmission({ assignment, event, expectedRevision, studentId }) {
  if (!assignment || !studentId || assignment.studentId !== studentId) {
    return { ok: false, reason: 'FORBIDDEN' }
  }
  if (!Number.isSafeInteger(assignment.revision) || assignment.revision < 0 ||
      !Number.isSafeInteger(expectedRevision) || assignment.revision !== expectedRevision) {
    return { ok: false, reason: 'STALE_REVISION' }
  }
  if (!['SUBMIT', 'RESUBMIT'].includes(event)) return { ok: false, reason: 'INVALID_SUBMISSION_EVENT' }
  const nextStatus = nextTrainingStatus(assignment.status, event)
  if (!nextStatus) return { ok: false, reason: 'INVALID_TRANSITION' }
  return {
    ok: true,
    expectedRevision,
    nextRevision: expectedRevision + 1,
    nextStatus,
    studentId,
    event,
  }
}
