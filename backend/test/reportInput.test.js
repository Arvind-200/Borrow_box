import test from 'node:test'
import assert from 'node:assert/strict'
import { parseReportInput } from '../src/validators/reportInput.js'
import { MAX_REPORT_DESCRIPTION_LENGTH } from '../src/models/Report.js'

const TARGET_ID = '665f1c2a9d3b4e0012a34567'

function validInput(overrides = {}) {
  return {
    targetType: 'product',
    targetId: TARGET_ID,
    reason: 'fake_listing',
    description: 'The item in the photos is not the item described.',
    ...overrides,
  }
}

function assertBadRequest(fn, messagePattern) {
  assert.throws(fn, (error) => {
    assert.equal(error.status, 400)
    if (messagePattern) assert.match(error.message, messagePattern)
    return true
  })
}

test('parses a valid report and trims fields', () => {
  const result = parseReportInput(
    validInput({
      targetType: '  PRODUCT  ',
      targetId: `  ${TARGET_ID}  `,
      reason: '  FAKE_LISTING  ',
      description: '  Misleading photos  ',
    })
  )

  assert.deepEqual(result, {
    targetType: 'product',
    targetId: TARGET_ID,
    reason: 'fake_listing',
    description: 'Misleading photos',
  })
})

test('accepts every target type and reason', () => {
  for (const targetType of ['product', 'user', 'review']) {
    assert.equal(parseReportInput(validInput({ targetType })).targetType, targetType)
  }
  for (const reason of [
    'prohibited_item',
    'fake_listing',
    'scam_fraud',
    'wrong_information',
    'offensive_content',
    'duplicate_listing',
    'other',
  ]) {
    assert.equal(parseReportInput(validInput({ reason })).reason, reason)
  }
})

test('treats the description as optional', () => {
  assert.equal(parseReportInput(validInput({ description: undefined })).description, '')
  assert.equal(parseReportInput(validInput({ description: null })).description, '')
  assert.equal(parseReportInput(validInput({ description: '   ' })).description, '')
})

test('ignores client-supplied ownership, status, and resolution fields', () => {
  const result = parseReportInput(
    validInput({
      reporter: '665f1c2a9d3b4e0012a00001',
      targetModel: 'Review',
      status: 'Resolved',
      resolutionAction: 'remove_product',
      reviewedBy: '665f1c2a9d3b4e0012a00002',
      reviewedAt: '2026-11-10T00:00:00.000Z',
    })
  )

  assert.deepEqual(result, {
    targetType: 'product',
    targetId: TARGET_ID,
    reason: 'fake_listing',
    description: 'The item in the photos is not the item described.',
  })
})

test('rejects non-object payloads', () => {
  assertBadRequest(() => parseReportInput(undefined), /payload is required/i)
  assertBadRequest(() => parseReportInput(null), /payload is required/i)
  assertBadRequest(() => parseReportInput([]), /payload is required/i)
  assertBadRequest(() => parseReportInput('report'), /payload is required/i)
})

test('rejects invalid target types and ids', () => {
  assertBadRequest(
    () => parseReportInput(validInput({ targetType: 'listing' })),
    /target type/i
  )
  assertBadRequest(
    () => parseReportInput(validInput({ targetId: 'not-an-id' })),
    /target id/i
  )
  assertBadRequest(
    () => parseReportInput(validInput({ targetId: 123 })),
    /target id/i
  )
})

test('rejects invalid reasons and non-string descriptions', () => {
  assertBadRequest(
    () => parseReportInput(validInput({ reason: 'spam' })),
    /reason/i
  )
  assertBadRequest(
    () => parseReportInput(validInput({ description: 42 })),
    /description must be a string/i
  )
})

test('rejects descriptions over the limit and accepts the maximum', () => {
  assertBadRequest(
    () =>
      parseReportInput(
        validInput({ description: 'a'.repeat(MAX_REPORT_DESCRIPTION_LENGTH + 1) })
      ),
    /cannot exceed 1000 characters/i
  )
  assert.equal(
    parseReportInput(
      validInput({ description: 'a'.repeat(MAX_REPORT_DESCRIPTION_LENGTH) })
    ).description.length,
    MAX_REPORT_DESCRIPTION_LENGTH
  )
})
