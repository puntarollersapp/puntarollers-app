/**
 * PR Card reconciliation — server-side only.
 * Inputs are private records fetched in a trusted backend. Never ship raw input to browser.
 * This module does not write to a database or modify any PIN.
 */
const digits = (value) => String(value ?? '').replace(/\D/g, '')
const email = (value) => String(value ?? '').trim().toLowerCase()
const phone = (value) => {
  const normalized = digits(value)
  return normalized.length >= 8 ? normalized.slice(-8) : ''
}

export function reconcilePRCardMembers(members, profiles) {
  const profilesByDocument = new Map()
  const profilesByPhone = new Map()
  const profilesByEmail = new Map()
  const add = (map, key, profile) => {
    if (!key) return
    map.set(key, [...(map.get(key) || []), profile])
  }
  for (const profile of profiles) {
    add(profilesByDocument, digits(profile.documento), profile)
    add(profilesByPhone, phone(profile.telefono || profile.phone), profile)
    add(profilesByEmail, email(profile.email), profile)
  }

  const results = []
  const claimedProfiles = new Map()
  for (const member of members) {
    const documentKey = digits(member.document)
    const phoneKey = phone(member.phone)
    const emailKey = email(member.email)
    const documentMatches = documentKey ? (profilesByDocument.get(documentKey) || []) : []
    const phoneMatches = phoneKey ? (profilesByPhone.get(phoneKey) || []) : []
    const emailMatches = emailKey ? (profilesByEmail.get(emailKey) || []) : []
    const candidates = new Map()
    for (const [source, matches] of [
      ['document', documentMatches],
      ['phone', phoneMatches],
      ['email', emailMatches],
    ]) {
      for (const profile of matches) {
        const item = candidates.get(profile.id) || { profileId: profile.id, signals: [] }
        item.signals.push(source)
        candidates.set(profile.id, item)
      }
    }
    const entries = [...candidates.values()]
    const docCandidate = documentMatches.length === 1 ? documentMatches[0] : null
    const otherSignalsConflict = docCandidate && entries.some((entry) => entry.profileId !== docCandidate.id)
    const suggested = docCandidate && !otherSignalsConflict ? docCandidate.id : null
    const reason = !documentKey ? 'missing_document'
      : documentMatches.length > 1 ? 'duplicate_document'
      : documentMatches.length === 0 ? 'no_document_match'
      : otherSignalsConflict ? 'conflicting_signals'
      : 'document_match_requires_manual_verification'
    const result = {
      legacyMemberId: String(member.id),
      suggestedProfileId: suggested,
      status: 'pending',
      reason,
      signals: suggested ? (candidates.get(suggested)?.signals || []) : [],
      candidateCount: entries.length,
    }
    if (suggested) {
      const previous = claimedProfiles.get(suggested)
      if (previous) {
        previous.suggestedProfileId = null
        previous.reason = 'duplicate_membership_claim'
        result.suggestedProfileId = null
        result.reason = 'duplicate_membership_claim'
      } else claimedProfiles.set(suggested, result)
    }
    results.push(result)
  }
  return results
}
