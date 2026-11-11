import { ApiError } from '../utils/apiError.js'
import { MAX_REVIEW_COMMENT_LENGTH } from '../models/Review.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

function readBorrowRequestId(value) {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'A valid borrow request is required')
  }

  const borrowRequest = value.trim()
  if (!OBJECT_ID_REGEX.test(borrowRequest)) {
    throw new ApiError(400, 'A valid borrow request is required')
  }

  return borrowRequest
}

function readRating(value) {
  if (value === undefined || value === null || value === '') {
    throw new ApiError(400, 'Rating is required')
  }

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 5
  ) {
    throw new ApiError(400, 'Rating must be a whole number between 1 and 5')
  }

  return value
}

function readComment(value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Comment must be a string')
  }

  const comment = value.trim()
  if (comment.length > MAX_REVIEW_COMMENT_LENGTH) {
    throw new ApiError(
      400,
      `Comment cannot exceed ${MAX_REVIEW_COMMENT_LENGTH} characters`
    )
  }

  return comment
}

export function parseReviewInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A review payload is required')
  }

  // Only these fields are accepted. Product, reviewer, reviewee, reviewer role,
  // status, and moderation metadata are always derived on the server.
  return {
    borrowRequest: readBorrowRequestId(body.borrowRequest),
    rating: readRating(body.rating),
    comment: readComment(body.comment),
  }
}
