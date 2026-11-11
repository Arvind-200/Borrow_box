import { Router } from 'express'
import { createReport } from '../controllers/reportController.js'
import { requireAuth } from '../middleware/auth.js'
import { reportCreateLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/', requireAuth, reportCreateLimiter, createReport)

export default router
