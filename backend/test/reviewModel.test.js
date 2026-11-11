import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import {
  Review,
  REVIEW_STATUSES,
  REVIEW_REVIEWER_ROLES,
  MAX_REVIEW_COMMENT_LENGTH,
} from '../src/models/Review.js'

const BORROW_REQUEST_ID = new mongoose.Types.ObjectId()
const PRODUCT_ID = new mongoose.Types.ObjectId()
const REVIEWER_ID = new mongoose.Types.ObjectId()
const REVIEWEE_ID = new mongoose.Types.ObjectId()

function validDocument(overrides = {}) {
  return new Review({
    borrowRequest: BORROW_REQUEST_ID,
    product: PRODUCT_ID,
    reviewer: REVIEWER_ID,
    reviewee: REVIEWEE_ID,
    rating: 5,
    comment: 'The drill worked perfectly and was returned on time.',
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

test('validates a complete review document with defaults', async () => {
  const document = validDocument()
  await document.validate()

  assert.equal(document.status, 'visible')
  assert.equal(document.reviewerRole, 'borrower')
  assert.equal(
    document.comment,
    'The drill worked perfectly and was returned on time.'
  )
  assert.equal(document.moderatedBy, null)
  assert.equal(document.moderatedAt, null)
  assert.equal(document.moderationReason, '')
})

test('exports the approved statuses and reviewer roles', () => {
  assert.deepEqual(REVIEW_STATUSES, ['visible', 'hidden', 'removed'])
  assert.deepEqual(REVIEW_REVIEWER_ROLES, ['borrower'])
})

test('requires borrowRequest, product, reviewer, reviewee, and rating', async () => {
  await assertValidationError(
    validDocument({ borrowRequest: undefined }),
    'borrowRequest'
  )
  await assertValidationError(validDocument({ product: undefined }), 'product')
  await assertValidationError(validDocument({ reviewer: undefined }), 'reviewer')
  await assertValidationError(validDocument({ reviewee: undefined }), 'reviewee')
  await assertValidationError(validDocument({ rating: undefined }), 'rating')
})

test('rejects ratings outside the 1 to 5 range', async () => {
  await assertValidationError(validDocument({ rating: 0 }), 'rating')
  await assertValidationError(validDocument({ rating: 6 }), 'rating')
  await assertValidationError(validDocument({ rating: -1 }), 'rating')
})

test('rejects non-integer ratings', async () => {
  await assertValidationError(validDocument({ rating: 4.5 }), 'rating')
})

test('accepts every whole-number rating from 1 to 5', async () => {
  for (let rating = 1; rating <= 5; rating += 1) {
    await assert.doesNotReject(() => validDocument({ rating }).validate())
  }
})

test('trims the comment and rejects comments over the limit', async () => {
  const document = validDocument({ comment: '  Great condition  ' })
  await document.validate()
  assert.equal(document.comment, 'Great condition')

  await assertValidationError(
    validDocument({ comment: 'a'.repeat(MAX_REVIEW_COMMENT_LENGTH + 1) }),
    'comment'
  )
  await assert.doesNotReject(() =>
    validDocument({ comment: 'a'.repeat(MAX_REVIEW_COMMENT_LENGTH) }).validate()
  )
})

test('rejects statuses and reviewer roles outside the approved values', async () => {
  await assertValidationError(validDocument({ status: 'approved' }), 'status')
  await assertValidationError(
    validDocument({ reviewerRole: 'owner' }),
    'reviewerRole'
  )
})

test('declares the one-review-per-borrow unique index and list indexes', () => {
  const indexes = Review.schema.indexes()

  const uniqueReview = indexes.find(
    ([, options]) =>
      options.name === 'one_review_per_borrow_request_reviewer'
  )
  assert.ok(uniqueReview, 'Expected the duplicate-review index')
  assert.deepEqual(uniqueReview[0], { borrowRequest: 1, reviewer: 1 })
  assert.equal(uniqueReview[1].unique, true)

  assert.ok(
    indexes.some(
      ([keys]) =>
        keys.product === 1 && keys.status === 1 && keys.createdAt === -1
    ),
    'Expected the product review list index'
  )
  assert.ok(
    indexes.some(
      ([keys]) =>
        keys.reviewee === 1 && keys.status === 1 && keys.createdAt === -1
    ),
    'Expected the reviewee review list index'
  )
  assert.ok(
    indexes.some(
      ([keys]) => keys.reviewer === 1 && keys.createdAt === -1
    ),
    'Expected the reviewer review list index'
  )
})
