import { parseAdminReviewQuery } from '../validators/adminReviewQuery.js'
import { parseReviewModerationInput } from '../validators/reviewModerationInput.js'
import {
  listReviewsForAdmin,
  moderateReview,
} from '../services/reviewService.js'

export async function listReviews(req, res, next) {
  try {
    const query = parseAdminReviewQuery(req.query)
    const result = await listReviewsForAdmin(query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

function makeModerationHandler(action) {
  return async function moderationHandler(req, res, next) {
    try {
      const input = parseReviewModerationInput(req.body)
      const result = await moderateReview(
        req.params.id,
        req.user._id,
        action,
        input
      )
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export const hideReview = makeModerationHandler('hide')
export const removeReview = makeModerationHandler('remove')
export const restoreReview = makeModerationHandler('restore')
