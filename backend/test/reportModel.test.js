import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import {
  Report,
  REPORT_TARGET_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES,
  MAX_REPORT_DESCRIPTION_LENGTH,
} from '../src/models/Report.js'

const TARGET_ID = new mongoose.Types.ObjectId()
const REPORTER_ID = new mongoose.Types.ObjectId()

function validDocument(overrides = {}) {
  return new Report({
    reporter: REPORTER_ID,
    targetType: 'product',
    targetModel: 'Product',
    targetId: TARGET_ID,
    reason: 'fake_listing',
    description: 'The photos do not match the item described.',
    ...overrides,
  })
}

function assertValidationError(document, field) {
  return assert.rejects(
    () => document.validate(),
    (error) => {
      assert.equal(error.name, 'ValidationError')
      if (field) assert.ok(error.errors[field], `Expected an error on ${field}`)
      return true
    }
  )
}

test('validates a report with defaults', async () => {
  const document = validDocument()
  await document.validate()

  assert.equal(document.status, 'Open')
  assert.equal(document.resolutionAction, 'none')
  assert.equal(document.description, 'The photos do not match the item described.')
  assert.equal(document.resolutionNote, '')
  assert.equal(document.reviewedBy, null)
  assert.equal(document.reviewedAt, null)
})

test('exports the approved report constants', () => {
  assert.deepEqual(REPORT_TARGET_TYPES, ['product', 'user', 'review'])
  assert.deepEqual(REPORT_REASONS, [
    'prohibited_item',
    'fake_listing',
    'scam_fraud',
    'wrong_information',
    'offensive_content',
    'duplicate_listing',
    'other',
  ])
  assert.deepEqual(REPORT_STATUSES, ['Open', 'Resolved', 'Dismissed'])
})

test('requires reporter, target, and reason', async () => {
  await assertValidationError(validDocument({ reporter: undefined }), 'reporter')
  await assertValidationError(validDocument({ targetType: undefined }), 'targetType')
  await assertValidationError(validDocument({ targetModel: undefined }), 'targetModel')
  await assertValidationError(validDocument({ targetId: undefined }), 'targetId')
  await assertValidationError(validDocument({ reason: undefined }), 'reason')
})

test('rejects unsupported target types, models, reasons, and statuses', async () => {
  await assertValidationError(validDocument({ targetType: 'listing' }), 'targetType')
  await assertValidationError(validDocument({ targetModel: 'Listing' }), 'targetModel')
  await assertValidationError(validDocument({ reason: 'spam' }), 'reason')
  await assertValidationError(validDocument({ status: 'open' }), 'status')
  await assertValidationError(
    validDocument({ resolutionAction: 'delete_everything' }),
    'resolutionAction'
  )
})

test('trims and limits the description and resolution note', async () => {
  const document = validDocument({ description: '  Looks suspicious  ' })
  await document.validate()
  assert.equal(document.description, 'Looks suspicious')

  await assertValidationError(
    validDocument({ description: 'a'.repeat(MAX_REPORT_DESCRIPTION_LENGTH + 1) }),
    'description'
  )
  await assertValidationError(
    validDocument({ resolutionNote: 'a'.repeat(1001) }),
    'resolutionNote'
  )
  await assert.doesNotReject(() =>
    validDocument({ description: 'a'.repeat(MAX_REPORT_DESCRIPTION_LENGTH) }).validate()
  )
})

test('declares a partial unique open-report index and list indexes', () => {
  const indexes = Report.schema.indexes()

  const openReportIndex = indexes.find(
    ([, options]) => options.name === 'one_open_report_per_reporter_target'
  )
  assert.ok(openReportIndex, 'Expected the duplicate-report index')
  assert.equal(openReportIndex[1].unique, true)
  assert.deepEqual(openReportIndex[1].partialFilterExpression, { status: 'Open' })

  assert.ok(
    indexes.some(([keys]) => keys.status === 1 && keys.createdAt === -1),
    'Expected the status list index'
  )
  assert.ok(
    indexes.some(([keys]) => keys.targetType === 1 && keys.targetId === 1),
    'Expected the target lookup index'
  )
  assert.ok(
    indexes.some(([keys]) => keys.reporter === 1 && keys.createdAt === -1),
    'Expected the reporter list index'
  )
})
