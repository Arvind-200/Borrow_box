import { ApiError } from '../utils/apiError.js'
import { MAX_REVIEW_MODERATION_REASON_LENGTH } from '../models/Review.js'

function readReason(value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Moderation reason must be a string')
  }

  const reason = value.trim()
  if (reason.length > MAX_REVIEW_MODERATION_REASON_LENGTH) {
    throw new ApiError(
      400,
      `Moderation reason cannot exceed ${MAX_REVIEW_MODERATION_REASON_LENGTH} characters`
    )
  }

  return reason
}

export function parseReviewModerationInput(body) {
  if (body === undefined || body === null) {
    return { reason: '' }
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A moderation payload is required')
  }

  // Only the reason is accepted. Status, moderator, and timestamps are derived
  // on the server from the requested action and the authenticated admin.
  return {
    reason: readReason(body.reason),
  }
}
