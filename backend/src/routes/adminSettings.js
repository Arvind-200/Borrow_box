import { Router } from 'express'
import {
  getSettingsHandler,
  updateSettingsHandler,
} from '../controllers/adminSettingController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', getSettingsHandler)
router.put('/', updateSettingsHandler)

export default router
