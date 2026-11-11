import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseModerationReason,
  parseReportDismissInput,
  parseReportResolutionInput,
} from '../src/validators/moderationActionInput.js'

function assertBadRequest(fn, messagePattern) {
  assert.throws(fn, (error) => {
    assert.equal(error.status, 400)
    if (messagePattern) assert.match(error.message, messagePattern)
    return true
  })
}

test('parses a required moderation reason and trims it', () => {
  assert.deepEqual(parseModerationReason({ reason: '  Fake listing  ' }), {
    reason: 'Fake listing',
  })
})

test('rejects a missing required reason', () => {
  assertBadRequest(() => parseModerationReason({}), /reason is required/i)
  assertBadRequest(() => parseModerationReason(undefined), /reason is required/i)
  assertBadRequest(
    () => parseModerationReason({ reason: '   ' }),
    /reason is required/i
  )
})

test('allows an optional reason', () => {
  assert.deepEqual(parseModerationReason({}, { required: false }), { reason: '' })
  assert.deepEqual(
    parseModerationReason(undefined, { required: false }),
    { reason: '' }
  )
})

test('rejects non-object moderation payloads and overlong reasons', () => {
  assertBadRequest(
    () => parseModerationReason([]),
    /moderation payload is required/i
  )
  assertBadRequest(
    () => parseModerationReason({ reason: 42 }),
    /must be a string/i
  )
  assertBadRequest(
    () => parseModerationReason({ reason: 'a'.repeat(501) }),
    /cannot exceed 500 characters/i
  )
})

test('parses a report resolution action and note', () => {
  assert.deepEqual(
    parseReportResolutionInput({ action: '  HIDE_PRODUCT  ', note: '  Confirmed  ' }),
    { action: 'hide_product', note: 'Confirmed' }
  )
  assert.deepEqual(parseReportResolutionInput({ action: 'none' }), {
    action: 'none',
    note: '',
  })
})

test('rejects missing or invalid resolution actions', () => {
  assertBadRequest(
    () => parseReportResolutionInput({}),
    /resolution action is required/i
  )
  assertBadRequest(
    () => parseReportResolutionInput({ action: 'delete_everything' }),
    /must be one of/i
  )
})

test('rejects non-object or overlong resolution notes', () => {
  assertBadRequest(
    () => parseReportResolutionInput(undefined),
    /resolution payload is required/i
  )
  assertBadRequest(
    () => parseReportResolutionInput({ action: 'none', note: 42 }),
    /note must be a string/i
  )
  assertBadRequest(
    () => parseReportResolutionInput({ action: 'none', note: 'a'.repeat(1001) }),
    /cannot exceed 1000 characters/i
  )
})

test('parses an optional dismissal note', () => {
  assert.deepEqual(parseReportDismissInput(undefined), { note: '' })
  assert.deepEqual(parseReportDismissInput({}), { note: '' })
  assert.deepEqual(parseReportDismissInput({ note: '  Duplicate report  ' }), {
    note: 'Duplicate report',
  })
  assertBadRequest(
    () => parseReportDismissInput('dismiss'),
    /must be an object/i
  )
})

test('accepts the maximum resolution note length', () => {
  const note = 'a'.repeat(1000)
  assert.equal(
    parseReportResolutionInput({ action: 'none', note }).note,
    note
  )
})
