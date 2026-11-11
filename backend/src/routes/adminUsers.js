import { Router } from 'express'
import {
  blockUserHandler,
  getUserHandler,
  listUsersHandler,
  unblockUserHandler,
  warnUserHandler,
} from '../controllers/adminUserController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listUsersHandler)
router.get('/:id', getUserHandler)
router.patch('/:id/warn', warnUserHandler)
router.patch('/:id/block', blockUserHandler)
router.patch('/:id/unblock', unblockUserHandler)

export default router
