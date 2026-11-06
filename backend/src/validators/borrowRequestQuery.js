import { ApiError } from '../utils/apiError.js'
import { BORROW_REQUEST_STATUSES } from '../models/BorrowRequest.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

const STATUS_BY_LOWER_CASE = new Map(
  BORROW_REQUEST_STATUSES.map((status) => [status.toLowerCase(), status])
)

function readSingleString(value, name) {
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be a single value`)
  }
  return value.trim()
}

function parsePositiveInteger(value, name, defaultValue, max) {
  const raw = readSingleString(value, name)
  if (raw === undefined || raw === '') return defaultValue

  if (!/^\d+$/.test(raw)) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }
  if (max !== undefined && parsed > max) {
    throw new ApiError(400, `${name} cannot exceed ${max}`)
  }

  return parsed
}

function parseStatus(value) {
  const raw = readSingleString(value, 'status')
  if (!raw) return undefined

  const status = STATUS_BY_LOWER_CASE.get(raw.toLowerCase())
  if (!status) {
    throw new ApiError(
      400,
      `status must be one of: ${BORROW_REQUEST_STATUSES.join(', ')}`
    )
  }

  return status
}

export function parseBorrowRequestQuery(query = {}) {
  return {
    page: parsePositiveInteger(query.page, 'page', 1),
    limit: parsePositiveInteger(
      query.limit,
      'limit',
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    ),
    status: parseStatus(query.status),
  }
}
