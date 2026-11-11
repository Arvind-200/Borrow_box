import { Router } from 'express'
import {
  dismissReport,
  getReport,
  listReports,
  resolveReport,
} from '../controllers/adminReportController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listReports)
router.get('/:id', getReport)
router.patch('/:id/resolve', resolveReport)
router.patch('/:id/dismiss', dismissReport)

export default router
