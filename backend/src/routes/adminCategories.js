import { Router } from 'express'
import {
  createCategoryHandler,
  listCategoriesHandler,
  setCategoryActiveHandler,
  updateCategoryHandler,
} from '../controllers/adminCategoryController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listCategoriesHandler)
router.post('/', createCategoryHandler)
router.put('/:id', updateCategoryHandler)
router.patch('/:id/active', setCategoryActiveHandler)

export default router
