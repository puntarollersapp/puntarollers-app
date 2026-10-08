// PR Training 2.0 privacy and authorization contract.
// This is a pure policy specification. Real enforcement MUST also live in
// Supabase RLS, storage policies and trusted server endpoints.
const STAFF_ROLES = new Set(['admin', 'profesor'])
const REVIEW_ROLES = new Set(['admin', 'profesor'])

export function mayViewTrainingEvidence({ viewerId, ownerId, viewerRole, isAuthorizedTeacher = false, suspended = false }) {
  if (suspended || !viewerId || !ownerId) return false
  if (viewerId === ownerId) return true
  return REVIEW_ROLES.has(viewerRole) && isAuthorizedTeacher === true
}

export function mayManageTrainingCycle({ viewerRole, suspended = false }) {
  return !suspended && viewerRole === 'admin'
}

export function mayReviewTrainingSubmission({ viewerRole, isAuthorizedTeacher = false, suspended = false }) {
  return !suspended && STAFF_ROLES.has(viewerRole) && isAuthorizedTeacher === true
}

// Never return media, student path, teacher feedback or review status to RollerFeed.
export function publicTrainingCompletionEvent({ assignmentId, studentDisplayName, taskPublicTitle, studentFeedConsent, isMinor, guardianConsent }) {
  if (!assignmentId || !studentFeedConsent || (isMinor && !guardianConsent)) return null
  const name = String(studentDisplayName || '').trim()
  const title = String(taskPublicTitle || '').trim()
  if (!name || !title) return null
  return {
    eventType: 'TRAINING_COMPLETED',
    idempotencyKey: 'training-completed:' + String(assignmentId),
    studentDisplayName: name,
    taskPublicTitle: title,
  }
}

export function isAllowedTrainingUpload({ mimeType, bytes, allowedMimeTypes, maxBytes }) {
  return typeof mimeType === 'string' &&
    Number.isSafeInteger(bytes) && bytes > 0 &&
    Array.isArray(allowedMimeTypes) && allowedMimeTypes.includes(mimeType) &&
    Number.isSafeInteger(maxBytes) && maxBytes > 0 && bytes <= maxBytes
}
