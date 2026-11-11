import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAdminReviewQuery } from '../src/validators/adminReviewQuery.js'

function assertBadRequest(fn, messagePattern) {
  assert.throws(fn, (error) => {
    assert.equal(error.status, 400)
    if (messagePattern) assert.match(error.message, messagePattern)
    return true
  })
}

test('applies default pagination and leaves status open', () => {
  assert.deepEqual(parseAdminReviewQuery({}), {
    page: 1,
    limit: 20,
    status: undefined,
  })
  assert.deepEqual(parseAdminReviewQuery(), {
    page: 1,
    limit: 20,
    status: undefined,
  })
})

test('parses page, limit, and a case-insensitive status', () => {
  assert.deepEqual(parseAdminReviewQuery({ page: '2', limit: '5', status: 'HIDDEN' }), {
    page: 2,
    limit: 5,
    status: 'hidden',
  })
})

test('accepts every review status', () => {
  for (const status of ['visible', 'hidden', 'removed']) {
    assert.equal(parseAdminReviewQuery({ status }).status, status)
  }
})

test('rejects invalid statuses', () => {
  assertBadRequest(
    () => parseAdminReviewQuery({ status: 'approved' }),
    /status must be one of/i
  )
})

test('rejects invalid or repeated pagination values', () => {
  assertBadRequest(() => parseAdminReviewQuery({ page: '0' }), /positive integer/i)
  assertBadRequest(() => parseAdminReviewQuery({ page: 'abc' }), /positive integer/i)
  assertBadRequest(() => parseAdminReviewQuery({ page: '1.5' }), /positive integer/i)
  assertBadRequest(() => parseAdminReviewQuery({ limit: '0' }), /positive integer/i)
  assertBadRequest(() => parseAdminReviewQuery({ limit: '51' }), /cannot exceed 50/i)
  assertBadRequest(
    () => parseAdminReviewQuery({ status: ['visible', 'hidden'] }),
    /single value/i
  )
})

test('accepts the maximum page size', () => {
  assert.equal(parseAdminReviewQuery({ limit: '50' }).limit, 50)
})
