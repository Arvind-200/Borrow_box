import { ApiError } from '../utils/apiError.js'
import {
  parseDateOnly,
  assertDateRangeOrder,
} from '../utils/dateOnly.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i
export const MAX_BORROW_REQUEST_MESSAGE_LENGTH = 500

function readProductId(value) {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'A valid product is required')
  }

  const product = value.trim()
  if (!OBJECT_ID_REGEX.test(product)) {
    throw new ApiError(400, 'A valid product is required')
  }

  return product
}

function readDate(value, name) {
  if (value === undefined || value === null) {
    throw new ApiError(400, `${name} is required`)
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be a valid date in YYYY-MM-DD format`)
  }

  const date = value.trim()
  if (date.length === 0) {
    throw new ApiError(400, `${name} is required`)
  }

  return parseDateOnly(date, name)
}

function readMessage(value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Message must be a string')
  }

  const message = value.trim()
  if (message.length > MAX_BORROW_REQUEST_MESSAGE_LENGTH) {
    throw new ApiError(
      400,
      `Message cannot exceed ${MAX_BORROW_REQUEST_MESSAGE_LENGTH} characters`
    )
  }

  return message
}

export function parseBorrowRequestInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A borrow request payload is required')
  }

  const startDate = readDate(body.startDate, 'startDate')
  const endDate = readDate(body.endDate, 'endDate')
  assertDateRangeOrder(startDate, endDate)

  // Only these fields are accepted. Borrower, owner, status, decision, and
  // cancellation metadata are always derived by the server.
  return {
    product: readProductId(body.product),
    startDate,
    endDate,
    message: readMessage(body.message),
  }
}
