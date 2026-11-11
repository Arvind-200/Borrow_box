import { ApiError } from '../utils/apiError.js'
import {
  REPORT_REASONS,
  REPORT_TARGET_TYPES,
  MAX_REPORT_DESCRIPTION_LENGTH,
} from '../models/Report.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

function readTargetType(value) {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'A valid report target type is required')
  }

  const targetType = value.trim().toLowerCase()
  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    throw new ApiError(
      400,
      `Target type must be one of: ${REPORT_TARGET_TYPES.join(', ')}`
    )
  }

  return targetType
}

function readTargetId(value) {
  if (typeof value !== 'string' || !OBJECT_ID_REGEX.test(value.trim())) {
    throw new ApiError(400, 'A valid report target id is required')
  }

  return value.trim()
}

function readReason(value) {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'A report reason is required')
  }

  const reason = value.trim().toLowerCase()
  if (!REPORT_REASONS.includes(reason)) {
    throw new ApiError(
      400,
      `Report reason must be one of: ${REPORT_REASONS.join(', ')}`
    )
  }

  return reason
}

function readDescription(value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Description must be a string')
  }

  const description = value.trim()
  if (description.length > MAX_REPORT_DESCRIPTION_LENGTH) {
    throw new ApiError(
      400,
      `Description cannot exceed ${MAX_REPORT_DESCRIPTION_LENGTH} characters`
    )
  }

  return description
}

export function parseReportInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A report payload is required')
  }

  // Only these fields are accepted. Reporter, targetModel, status, review, and
  // resolution metadata are always derived on the server.
  return {
    targetType: readTargetType(body.targetType),
    targetId: readTargetId(body.targetId),
    reason: readReason(body.reason),
    description: readDescription(body.description),
  }
}
