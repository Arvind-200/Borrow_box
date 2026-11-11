import test from 'node:test'
import assert from 'node:assert/strict'
import { parseReviewModerationInput } from '../src/validators/reviewModerationInput.js'
import { MAX_REVIEW_MODERATION_REASON_LENGTH } from '../src/models/Review.js'

function assertBadRequest(fn, messagePattern) {
  assert.throws(fn, (error) => {
    assert.equal(error.status, 400)
    if (messagePattern) assert.match(error.message, messagePattern)
    return true
  })
}

test('treats a missing body as an empty reason', () => {
  assert.deepEqual(parseReviewModerationInput(undefined), { reason: '' })
  assert.deepEqual(parseReviewModerationInput(null), { reason: '' })
})

test('trims the reason', () => {
  assert.deepEqual(
    parseReviewModerationInput({ reason: '  Offensive language  ' }),
    { reason: 'Offensive language' }
  )
})

test('treats a missing or blank reason as empty', () => {
  assert.equal(parseReviewModerationInput({}).reason, '')
  assert.equal(parseReviewModerationInput({ reason: '   ' }).reason, '')
})

test('ignores client-supplied status, moderator, and timestamps', () => {
  const result = parseReviewModerationInput({
    reason: 'Spam',
    status: 'removed',
    moderatedBy: '665f1c2a9d3b4e0012a00004',
    moderatedAt: '2026-11-10T00:00:00.000Z',
  })

  assert.deepEqual(result, { reason: 'Spam' })
})

test('rejects non-string and overlong reasons', () => {
  assertBadRequest(
    () => parseReviewModerationInput({ reason: 42 }),
    /must be a string/i
  )
  assertBadRequest(
    () =>
      parseReviewModerationInput({
        reason: 'a'.repeat(MAX_REVIEW_MODERATION_REASON_LENGTH + 1),
      }),
    /cannot exceed 500 characters/i
  )
})

test('accepts the maximum reason length', () => {
  const reason = 'a'.repeat(MAX_REVIEW_MODERATION_REASON_LENGTH)
  assert.equal(parseReviewModerationInput({ reason }).reason, reason)
})

test('rejects non-object payloads', () => {
  assertBadRequest(
    () => parseReviewModerationInput([]),
    /moderation payload is required/i
  )
  assertBadRequest(
    () => parseReviewModerationInput('Spam'),
    /moderation payload is required/i
  )
})
