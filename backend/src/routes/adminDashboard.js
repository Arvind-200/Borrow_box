import { Router } from 'express'
import { getDashboardHandler } from '../controllers/adminDashboardController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', getDashboardHandler)

export default router
