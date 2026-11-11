import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseReviewInput,
} from '../src/validators/reviewInput.js'
import { MAX_REVIEW_COMMENT_LENGTH } from '../src/models/Review.js'

const BORROW_REQUEST_ID = '665f1c2a9d3b4e0012a34567'

function validInput(overrides = {}) {
  return {
    borrowRequest: BORROW_REQUEST_ID,
    rating: 5,
    comment: 'The drill worked perfectly.',
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

test('parses a valid review and trims the borrow request and comment', () => {
  const result = parseReviewInput(
    validInput({
      borrowRequest: `  ${BORROW_REQUEST_ID}  `,
      comment: '  Great condition and easy handover.  ',
    })
  )

  assert.deepEqual(result, {
    borrowRequest: BORROW_REQUEST_ID,
    rating: 5,
    comment: 'Great condition and easy handover.',
  })
})

test('treats the comment as optional', () => {
  assert.equal(parseReviewInput(validInput({ comment: undefined })).comment, '')
  assert.equal(parseReviewInput(validInput({ comment: null })).comment, '')
  assert.equal(parseReviewInput(validInput({ comment: '   ' })).comment, '')
})

test('ignores client-supplied ownership, status, and moderation fields', () => {
  const result = parseReviewInput(
    validInput({
      product: '665f1c2a9d3b4e0012a00001',
      reviewer: '665f1c2a9d3b4e0012a00002',
      reviewee: '665f1c2a9d3b4e0012a00003',
      reviewerRole: 'owner',
      status: 'hidden',
      moderatedBy: '665f1c2a9d3b4e0012a00004',
      moderatedAt: '2026-11-10T00:00:00.000Z',
    })
  )

  assert.deepEqual(result, {
    borrowRequest: BORROW_REQUEST_ID,
    rating: 5,
    comment: 'The drill worked perfectly.',
  })
})

test('rejects missing or invalid payloads', () => {
  assertBadRequest(() => parseReviewInput(undefined), /payload is required/i)
  assertBadRequest(() => parseReviewInput(null), /payload is required/i)
  assertBadRequest(() => parseReviewInput([]), /payload is required/i)
  assertBadRequest(() => parseReviewInput('review'), /payload is required/i)
})

test('rejects missing or invalid borrow request ids', () => {
  assertBadRequest(
    () => parseReviewInput(validInput({ borrowRequest: undefined })),
    /valid borrow request/i
  )
  assertBadRequest(
    () => parseReviewInput(validInput({ borrowRequest: 'not-an-id' })),
    /valid borrow request/i
  )
  assertBadRequest(
    () => parseReviewInput(validInput({ borrowRequest: 123 })),
    /valid borrow request/i
  )
})

test('requires a whole-number rating between 1 and 5', () => {
  assertBadRequest(
    () => parseReviewInput(validInput({ rating: undefined })),
    /rating is required/i
  )
  assertBadRequest(
    () => parseReviewInput(validInput({ rating: 0 })),
    /whole number between 1 and 5/i
  )
  assertBadRequest(
    () => parseReviewInput(validInput({ rating: 6 })),
    /whole number between 1 and 5/i
  )
  assertBadRequest(
    () => parseReviewInput(validInput({ rating: 4.5 })),
    /whole number between 1 and 5/i
  )
  assertBadRequest(
    () => parseReviewInput(validInput({ rating: '5' })),
    /whole number between 1 and 5/i
  )
})

test('rejects non-string comments over the limit', () => {
  assertBadRequest(
    () => parseReviewInput(validInput({ comment: 42 })),
    /comment must be a string/i
  )
  assertBadRequest(
    () =>
      parseReviewInput(
        validInput({ comment: 'a'.repeat(MAX_REVIEW_COMMENT_LENGTH + 1) })
      ),
    /cannot exceed 1000 characters/i
  )
})

test('accepts exactly 1 and 5 and the maximum comment length', () => {
  assert.equal(parseReviewInput(validInput({ rating: 1 })).rating, 1)
  assert.equal(parseReviewInput(validInput({ rating: 5 })).rating, 5)

  const longComment = 'a'.repeat(MAX_REVIEW_COMMENT_LENGTH)
  assert.equal(
    parseReviewInput(validInput({ comment: longComment })).comment,
    longComment
  )
})
