import { Router } from 'express'
import {
  createBorrowRequest,
  listMyBorrowRequests,
  listIncomingBorrowRequests,
  acceptBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
  completeBorrowRequest,
} from '../controllers/borrowRequestController.js'
import { requireAuth } from '../middleware/auth.js'
import { borrowRequestCreateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/', requireAuth, borrowRequestCreateLimiter, createBorrowRequest)
router.get('/my', requireAuth, listMyBorrowRequests)
router.get('/incoming', requireAuth, listIncomingBorrowRequests)
router.patch('/:id/accept', requireAuth, acceptBorrowRequest)
router.patch('/:id/reject', requireAuth, rejectBorrowRequest)
router.patch('/:id/cancel', requireAuth, cancelBorrowRequest)
router.patch('/:id/complete', requireAuth, completeBorrowRequest)

export default router
