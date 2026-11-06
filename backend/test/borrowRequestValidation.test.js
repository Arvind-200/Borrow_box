import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseBorrowRequestInput,
  MAX_BORROW_REQUEST_MESSAGE_LENGTH,
} from '../src/validators/borrowRequestInput.js'
import {
  isValidDateOnly,
  parseDateOnly,
  assertDateRangeOrder,
} from '../src/utils/dateOnly.js'
import { parseBorrowRequestQuery } from '../src/validators/borrowRequestQuery.js'

const PRODUCT_ID = '665f1c2a9d3b4e0012a34567'

function validInput(overrides = {}) {
  return {
    product: PRODUCT_ID,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    message: 'Need this for a weekend repair project.',
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

test('parses a valid borrow request and trims text fields', () => {
  const result = parseBorrowRequestInput(
    validInput({
      product: `  ${PRODUCT_ID}  `,
      startDate: ' 2026-11-10 ',
      endDate: ' 2026-11-12 ',
      message: '  Please keep the charger included.  ',
    })
  )

  assert.deepEqual(result, {
    product: PRODUCT_ID,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    message: 'Please keep the charger included.',
  })
})

test('ignores client-supplied lifecycle and ownership fields', () => {
  const result = parseBorrowRequestInput(
    validInput({
      borrower: '665f1c2a9d3b4e0012a00001',
      owner: '665f1c2a9d3b4e0012a00002',
      status: 'Accepted',
      decidedAt: '2026-11-01T00:00:00.000Z',
      decidedBy: '665f1c2a9d3b4e0012a00003',
      cancelledAt: '2026-11-01T00:00:00.000Z',
      cancelledBy: '665f1c2a9d3b4e0012a00004',
    })
  )

  assert.deepEqual(result, {
    product: PRODUCT_ID,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    message: 'Need this for a weekend repair project.',
  })
})

test('rejects missing or invalid payloads', () => {
  assertBadRequest(() => parseBorrowRequestInput(null), /payload is required/)
  assertBadRequest(() => parseBorrowRequestInput([]), /payload is required/)
  assertBadRequest(() => parseBorrowRequestInput('payload'), /payload is required/)
})

test('rejects missing or invalid product ids', () => {
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ product: undefined })),
    /valid product/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ product: 'not-an-id' })),
    /valid product/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ product: 12345 })),
    /valid product/
  )
})

test('requires both dates', () => {
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ startDate: undefined })),
    /startDate is required/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ endDate: undefined })),
    /endDate is required/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ startDate: '   ' })),
    /startDate is required/
  )
})

test('rejects malformed and non-calendar date values', () => {
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ startDate: '2026-11-10T00:00:00.000Z' })),
    /valid date/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ startDate: '2026-2-3' })),
    /valid date/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ startDate: '2023-02-29' })),
    /valid date/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ endDate: '2026-04-31' })),
    /valid date/
  )
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ startDate: 20261110 })),
    /valid date/
  )
})

test('accepts leap day and same-day ranges', () => {
  const leapDay = parseBorrowRequestInput(
    validInput({ startDate: '2024-02-29', endDate: '2024-02-29' })
  )
  assert.equal(leapDay.startDate, '2024-02-29')
  assert.equal(leapDay.endDate, '2024-02-29')

  const sameDay = parseBorrowRequestInput(
    validInput({ startDate: '2026-11-10', endDate: '2026-11-10' })
  )
  assert.equal(sameDay.startDate, sameDay.endDate)
})

test('rejects an end date earlier than the start date', () => {
  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ endDate: '2026-11-09' })),
    /endDate cannot be earlier than startDate/
  )
})

test('treats message as optional', () => {
  const result = parseBorrowRequestInput(validInput({ message: undefined }))
  assert.equal(result.message, '')

  const nullMessage = parseBorrowRequestInput(validInput({ message: null }))
  assert.equal(nullMessage.message, '')

  const blankMessage = parseBorrowRequestInput(validInput({ message: '   ' }))
  assert.equal(blankMessage.message, '')
})

test('enforces the 500-character message limit after trimming', () => {
  const atLimit = parseBorrowRequestInput(
    validInput({ message: 'a'.repeat(MAX_BORROW_REQUEST_MESSAGE_LENGTH) })
  )
  assert.equal(atLimit.message.length, 500)

  assertBadRequest(
    () =>
      parseBorrowRequestInput(
        validInput({ message: 'a'.repeat(MAX_BORROW_REQUEST_MESSAGE_LENGTH + 1) })
      ),
    /cannot exceed 500 characters/
  )

  assertBadRequest(
    () => parseBorrowRequestInput(validInput({ message: 123 })),
    /Message must be a string/
  )
})

test('date-only helpers reject invalid values and ISO datetimes', () => {
  assert.equal(isValidDateOnly('2024-02-29'), true)
  assert.equal(isValidDateOnly('2023-02-29'), false)
  assert.equal(isValidDateOnly('2026-04-31'), false)
  assert.equal(isValidDateOnly('2026-11-10T00:00:00.000Z'), false)
  assert.equal(isValidDateOnly('2026-11-10'), true)
  assert.equal(isValidDateOnly(new Date('2026-11-10')), false)

  assert.equal(parseDateOnly(' 2026-11-10 ', 'startDate'), '2026-11-10')
  assertBadRequest(() => parseDateOnly('2026-13-01', 'startDate'), /valid date/)
  assert.doesNotThrow(() => assertDateRangeOrder('2026-11-10', '2026-11-10'))
  assertBadRequest(
    () => assertDateRangeOrder('2026-11-10', '2026-11-09'),
    /cannot be earlier/
  )
})

test('parses an optional product filter for my requests', () => {
  const result = parseBorrowRequestQuery({
    product: ` ${PRODUCT_ID} `,
    status: 'pending',
  })

  assert.deepEqual(result, {
    page: 1,
    limit: 20,
    status: 'Pending',
    product: PRODUCT_ID,
  })
})

test('rejects invalid product filters', () => {
  assertBadRequest(
    () => parseBorrowRequestQuery({ product: 'not-an-object-id' }),
    /valid product id/
  )
  assertBadRequest(
    () => parseBorrowRequestQuery({ product: [PRODUCT_ID] }),
    /single value/
  )
})
