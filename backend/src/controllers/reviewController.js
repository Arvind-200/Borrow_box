import { parseReviewInput } from '../validators/reviewInput.js'
import { parseReviewQuery } from '../validators/reviewQuery.js'
import {
  createReview as createReviewService,
  listProductReviews as listProductReviewsService,
  listMyReviews as listMyReviewsService,
} from '../services/reviewService.js'

export async function createReview(req, res, next) {
  try {
    const input = parseReviewInput(req.body)
    const result = await createReviewService(req.user._id, input)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function listProductReviews(req, res, next) {
  try {
    const query = parseReviewQuery(req.query)
    const result = await listProductReviewsService(req.params.id, query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function listMyReviews(req, res, next) {
  try {
    const query = parseReviewQuery(req.query)
    const result = await listMyReviewsService(req.user._id, query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
