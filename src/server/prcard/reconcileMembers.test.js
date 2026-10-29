import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcilePRCardMembers } from './reconcileMembers.js'

test('document match remains pending and never auto verifies', () => {
  const [result] = reconcilePRCardMembers(
    [{ id: 'legacy-1', document: '1.234.567-8' }],
    [{ id: 'pr-1', documento: '12345678' }],
  )
  assert.equal(result.status, 'pending')
  assert.equal(result.suggestedProfileId, 'pr-1')
  assert.equal(result.reason, 'document_match_requires_manual_verification')
})

test('conflicting email and document signals require review', () => {
  const [result] = reconcilePRCardMembers(
    [{ id: 'legacy-1', document: '12345678', email: 'a@example.com' }],
    [
      { id: 'pr-1', documento: '12345678' },
      { id: 'pr-2', documento: '87654321', email: 'a@example.com' },
    ],
  )
  assert.equal(result.suggestedProfileId, null)
  assert.equal(result.reason, 'conflicting_signals')
})

test('duplicate legacy claims never produce automatic links', () => {
  const results = reconcilePRCardMembers(
    [{ id: 'one', document: '12345678' }, { id: 'two', document: '12345678' }],
    [{ id: 'pr-1', documento: '12345678' }],
  )
  assert.ok(results.every((result) => result.suggestedProfileId === null))
  assert.ok(results.every((result) => result.status === 'pending'))
})

test('no match stays pending without exposing PIN', () => {
  const [result] = reconcilePRCardMembers(
    [{ id: 'one', document: '00000000', pin: 'secret' }],
    [{ id: 'pr-1', documento: '12345678', pin: 'different' }],
  )
  assert.equal(result.reason, 'no_document_match')
  assert.equal(JSON.stringify(result).includes('secret'), false)
})
