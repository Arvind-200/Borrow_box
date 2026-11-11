import test from 'node:test'
import assert from 'node:assert/strict'
import { parseReportQuery } from '../src/validators/reportQuery.js'

function assertBadRequest(fn, messagePattern) {
  assert.throws(fn, (error) => {
    assert.equal(error.status, 400)
    if (messagePattern) assert.match(error.message, messagePattern)
    return true
  })
}

test('applies default pagination and leaves filters open', () => {
  assert.deepEqual(parseReportQuery({}), {
    page: 1,
    limit: 20,
    status: undefined,
    targetType: undefined,
    reason: undefined,
  })
  assert.deepEqual(parseReportQuery(), {
    page: 1,
    limit: 20,
    status: undefined,
    targetType: undefined,
    reason: undefined,
  })
})

test('parses filters and normalizes case', () => {
  assert.deepEqual(
    parseReportQuery({
      page: '2',
      limit: '5',
      status: 'RESOLVED',
      targetType: 'PRODUCT',
      reason: 'FAKE_LISTING',
    }),
    {
      page: 2,
      limit: 5,
      status: 'Resolved',
      targetType: 'product',
      reason: 'fake_listing',
    }
  )
})

test('accepts every supported status, target type, and reason', () => {
  for (const status of ['open', 'resolved', 'dismissed']) {
    assert.equal(parseReportQuery({ status }).status, status[0].toUpperCase() + status.slice(1))
  }
  for (const targetType of ['product', 'user', 'review']) {
    assert.equal(parseReportQuery({ targetType }).targetType, targetType)
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
    assert.equal(parseReportQuery({ reason }).reason, reason)
  }
})

test('rejects invalid filters', () => {
  assertBadRequest(() => parseReportQuery({ status: 'pending' }), /status must be one of/i)
  assertBadRequest(
    () => parseReportQuery({ targetType: 'listing' }),
    /target type must be one of/i
  )
  assertBadRequest(() => parseReportQuery({ reason: 'spam' }), /reason must be one of/i)
})

test('rejects invalid or repeated pagination values', () => {
  assertBadRequest(() => parseReportQuery({ page: '0' }), /positive integer/i)
  assertBadRequest(() => parseReportQuery({ page: 'abc' }), /positive integer/i)
  assertBadRequest(() => parseReportQuery({ limit: '0' }), /positive integer/i)
  assertBadRequest(() => parseReportQuery({ limit: '51' }), /cannot exceed 50/i)
  assertBadRequest(
    () => parseReportQuery({ status: ['Open', 'Resolved'] }),
    /single value/i
  )
})

test('accepts the maximum page size', () => {
  assert.equal(parseReportQuery({ limit: '50' }).limit, 50)
})
