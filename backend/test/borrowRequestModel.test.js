import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import {
  BorrowRequest,
  BORROW_REQUEST_STATUSES,
  BORROW_REQUEST_DECISION_SOURCES,
} from '../src/models/BorrowRequest.js'

const PRODUCT_ID = new mongoose.Types.ObjectId()
const OWNER_ID = new mongoose.Types.ObjectId()
const BORROWER_ID = new mongoose.Types.ObjectId()

function validDocument(overrides = {}) {
  return new BorrowRequest({
    product: PRODUCT_ID,
    owner: OWNER_ID,
    borrower: BORROWER_ID,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    message: 'Need this for a weekend repair project.',
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

test('validates a complete borrow request document', async () => {
  const document = validDocument()
  await document.validate()

  assert.equal(document.status, 'Pending')
  assert.equal(document.message, 'Need this for a weekend repair project.')
  assert.equal(document.decisionSource, null)
  assert.equal(document.decidedAt, null)
  assert.equal(document.cancelledAt, null)
})

test('exports the approved statuses and decision sources', () => {
  assert.deepEqual(BORROW_REQUEST_STATUSES, [
    'Pending',
    'Accepted',
    'Rejected',
    'Cancelled',
  ])
  assert.deepEqual(BORROW_REQUEST_DECISION_SOURCES, ['owner', 'system'])
})

test('rejects statuses outside the approved lifecycle', async () => {
  await assertValidationError(validDocument({ status: 'pending' }), 'status')
  await assertValidationError(validDocument({ status: 'Active' }), 'status')
})

test('rejects invalid decision sources', async () => {
  await assertValidationError(
    validDocument({ decisionSource: 'automatic' }),
    'decisionSource'
  )
  await assert.doesNotReject(() =>
    validDocument({ decisionSource: 'system' }).validate()
  )
})

test('rejects messages longer than 500 characters', async () => {
  await assertValidationError(
    validDocument({ message: 'a'.repeat(501) }),
    'message'
  )
  await assert.doesNotReject(() =>
    validDocument({ message: 'a'.repeat(500) }).validate()
  )
})

test('rejects invalid and impossible dates', async () => {
  await assertValidationError(
    validDocument({ startDate: '2026-02-30' }),
    'startDate'
  )
  await assertValidationError(
    validDocument({ endDate: '2026-11-10T00:00:00.000Z' }),
    'endDate'
  )
})

test('rejects an end date earlier than the start date', async () => {
  await assertValidationError(
    validDocument({ startDate: '2026-11-12', endDate: '2026-11-10' }),
    'endDate'
  )
  await assert.doesNotReject(() =>
    validDocument({ startDate: '2026-11-10', endDate: '2026-11-10' }).validate()
  )
})

test('rejects a borrower who is also the owner', async () => {
  await assertValidationError(
    validDocument({ borrower: OWNER_ID }),
    'borrower'
  )
})

test('requires product, owner, and borrower', async () => {
  await assertValidationError(validDocument({ product: undefined }), 'product')
  await assertValidationError(validDocument({ owner: undefined }), 'owner')
  await assertValidationError(validDocument({ borrower: undefined }), 'borrower')
})

test('declares the accepted and pending partial unique indexes', () => {
  const indexes = BorrowRequest.schema.indexes()

  const accepted = indexes.find(
    ([, options]) => options.name === 'one_accepted_request_per_product'
  )
  assert.ok(accepted, 'Expected the accepted-request index')
  assert.deepEqual(accepted[0], { product: 1 })
  assert.equal(accepted[1].unique, true)
  assert.deepEqual(accepted[1].partialFilterExpression, { status: 'Accepted' })

  const pending = indexes.find(
    ([, options]) =>
      options.name === 'one_pending_request_per_product_borrower'
  )
  assert.ok(pending, 'Expected the duplicate-pending index')
  assert.deepEqual(pending[0], { product: 1, borrower: 1 })
  assert.equal(pending[1].unique, true)
  assert.deepEqual(pending[1].partialFilterExpression, { status: 'Pending' })
})
