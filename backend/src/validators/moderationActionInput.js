import { ApiError } from '../utils/apiError.js'
import {
  REPORT_RESOLUTION_ACTIONS,
  MAX_REPORT_NOTE_LENGTH,
} from '../models/Report.js'
import { MAX_ADMIN_ACTIVITY_REASON_LENGTH } from '../models/AdminActivityLog.js'

function readReason(value, { required }) {
  if (value === undefined || value === null) {
    if (required) {
      throw new ApiError(400, 'A moderation reason is required')
    }
    return ''
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Moderation reason must be a string')
  }

  const reason = value.trim()
  if (reason.length > MAX_ADMIN_ACTIVITY_REASON_LENGTH) {
    throw new ApiError(
      400,
      `Moderation reason cannot exceed ${MAX_ADMIN_ACTIVITY_REASON_LENGTH} characters`
    )
  }
  if (required && !reason) {
    throw new ApiError(400, 'A moderation reason is required')
  }

  return reason
}

export function parseModerationReason(body, { required = true } = {}) {
  if (body === undefined || body === null) {
    return { reason: readReason(undefined, { required }) }
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A moderation payload is required')
  }

  return { reason: readReason(body.reason, { required }) }
}

function readNote(value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Note must be a string')
  }

  const note = value.trim()
  if (note.length > MAX_REPORT_NOTE_LENGTH) {
    throw new ApiError(
      400,
      `Note cannot exceed ${MAX_REPORT_NOTE_LENGTH} characters`
    )
  }

  return note
}

export function parseReportResolutionInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A resolution payload is required')
  }

  if (typeof body.action !== 'string' || !body.action.trim()) {
    throw new ApiError(400, 'A resolution action is required')
  }

  const action = body.action.trim().toLowerCase()
  if (!REPORT_RESOLUTION_ACTIONS.includes(action)) {
    throw new ApiError(
      400,
      `Resolution action must be one of: ${REPORT_RESOLUTION_ACTIONS.join(', ')}`
    )
  }

  return { action, note: readNote(body.note) }
}

export function parseReportDismissInput(body) {
  if (body === undefined || body === null) {
    return { note: '' }
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A dismissal payload must be an object')
  }

  return { note: readNote(body.note) }
}
