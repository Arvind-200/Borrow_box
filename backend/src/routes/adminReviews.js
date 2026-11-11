import { Router } from 'express'
import {
  hideReview,
  listReviews,
  removeReview,
  restoreReview,
} from '../controllers/adminReviewController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listReviews)
router.patch('/:id/hide', hideReview)
router.patch('/:id/remove', removeReview)
router.patch('/:id/restore', restoreReview)

export default router
