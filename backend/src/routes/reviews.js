import { Router } from 'express'
import {
  createReview,
  listMyReviews,
} from '../controllers/reviewController.js'
import { requireAuth } from '../middleware/auth.js'
import { reviewCreateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/', requireAuth, reviewCreateLimiter, createReview)
router.get('/mine', requireAuth, listMyReviews)

export default router
