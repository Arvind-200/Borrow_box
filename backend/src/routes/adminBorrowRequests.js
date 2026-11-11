import { Router } from 'express'
import { listBorrowRequestsHandler } from '../controllers/adminBorrowRequestController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listBorrowRequestsHandler)

export default router
