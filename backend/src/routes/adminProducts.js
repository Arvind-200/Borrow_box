import { Router } from 'express'
import {
  getProductHandler,
  hideProduct,
  listProductsHandler,
  removeProduct,
  restoreProduct,
} from '../controllers/adminProductController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listProductsHandler)
router.get('/:id', getProductHandler)
router.patch('/:id/hide', hideProduct)
router.patch('/:id/remove', removeProduct)
router.patch('/:id/restore', restoreProduct)

export default router
