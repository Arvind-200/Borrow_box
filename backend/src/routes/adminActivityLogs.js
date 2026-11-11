import { Router } from 'express'
import { listActivityHandler } from '../controllers/adminActivityController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listActivityHandler)

export default router
