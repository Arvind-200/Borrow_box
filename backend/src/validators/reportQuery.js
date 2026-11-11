import { ApiError } from '../utils/apiError.js'
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
} from '../models/Report.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

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
  if (raw === undefined || raw === '') return undefined

  const match = REPORT_STATUSES.find(
    (status) => status.toLowerCase() === raw.toLowerCase()
  )
  if (!match) {
    throw new ApiError(
      400,
      `Status must be one of: ${REPORT_STATUSES.join(', ')}`
    )
  }

  return match
}

function parseTargetType(value) {
  const raw = readSingleString(value, 'targetType')
  if (raw === undefined || raw === '') return undefined

  const targetType = raw.toLowerCase()
  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    throw new ApiError(
      400,
      `Target type must be one of: ${REPORT_TARGET_TYPES.join(', ')}`
    )
  }

  return targetType
}

function parseReason(value) {
  const raw = readSingleString(value, 'reason')
  if (raw === undefined || raw === '') return undefined

  const reason = raw.toLowerCase()
  if (!REPORT_REASONS.includes(reason)) {
    throw new ApiError(
      400,
      `Reason must be one of: ${REPORT_REASONS.join(', ')}`
    )
  }

  return reason
}

export function parseReportQuery(query = {}) {
  return {
    page: parsePositiveInteger(query.page, 'page', 1),
    limit: parsePositiveInteger(
      query.limit,
      'limit',
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    ),
    status: parseStatus(query.status),
    targetType: parseTargetType(query.targetType),
    reason: parseReason(query.reason),
  }
}
